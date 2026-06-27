import { useSyncExternalStore } from 'react'
import { allMatches } from './matches'
import { KNOCKOUT } from '../data/schedule'

// Live scores, pulled client-side from ESPN's public scoreboard JSON.
//
// Why ESPN: it's free, needs no key/account, covers WC 2026 (league slug
// `fifa.world`), updates in real time, and — unlike most football APIs — sends
// `Access-Control-Allow-Origin: *`, so the browser can call it directly. No
// backend, no Firebase, no secrets.
//
// Design notes:
//  - Scores are NEVER persisted. ESPN is the device-independent source of truth;
//    final scores are re-fetched fresh on every device. The store is in-memory only.
//  - Payload discipline: ESPN match objects are large (~9 KB each). We do ONE
//    range fetch on load (tournament-start … today), then poll only TODAY's slate
//    (~tens of KB) and merge — the practical equivalent of fetching deltas.
//  - Anything ESPN returns is treated as untrusted: scores are coerced to numbers,
//    state is clamped to a known enum, unknown fields ignored. (Nothing is ever
//    rendered as raw HTML — React escapes.)

const LEAGUE = 'fifa.world'
const BASE = `https://site.api.espn.com/apis/site/v2/sports/soccer/${LEAGUE}/scoreboard`

// Tournament window (ESPN buckets matches by US Eastern calendar day).
const TOURNAMENT_START = '20260611'
const TOURNAMENT_END = '20260719'
const POLL_MS = 45_000

export type MatchState = 'pre' | 'in' | 'post'

export type ScoreInfo = {
  /** Goals for the team listed FIRST in the app's "A vs B" string. */
  home: number
  /** Goals for the team listed SECOND. */
  away: number
  state: MatchState
  /** Live game clock, e.g. "67'" or "HT" (only meaningful while state==='in'). */
  clock?: string
  /** Short status label, e.g. "FT", "HT", "67'". */
  detail?: string
  /** Which side advanced (knockout), aligned to the app's "A vs B" order.
   *  Set from ESPN's per-competitor winner flag, so penalty-shootout results
   *  resolve correctly even when regulation goals are level. */
  winner?: 'home' | 'away'
}

// ESPN team displayName → the team string this app uses (flags.ts / schedule.ts).
// Reconciled against the full WC slate; every other name matches exactly.
const NAME_ALIASES: Record<string, string> = {
  'Cape Verde': 'Cabo Verde',
  'Congo DR': 'DR Congo',
  'Ivory Coast': "Côte d'Ivoire",
  'South Korea': 'Korea Republic',
  'United States': 'USA',
}

const toAppName = (espnName: string): string => {
  const n = (espnName ?? '').trim()
  return NAME_ALIASES[n] ?? n
}

const pairKey = (a: string, b: string): string => [a, b].map((s) => s.toLowerCase()).sort().join('|')

// ── App-match index: normalized team-pair → candidate matches ──
// Group-stage pairs are unique tournament-wide; the rare knockout rematch is
// disambiguated by kickoff proximity at lookup time.
type AppMatch = { id: string; home: string; away: string; kickoff: number }

let appIndex: Map<string, AppMatch[]> | null = null
function getAppIndex(): Map<string, AppMatch[]> {
  if (appIndex) return appIndex
  const idx = new Map<string, AppMatch[]>()
  for (const { m } of allMatches()) {
    const sides = m.t.split(' vs ')
    if (sides.length !== 2) continue
    const [home, away] = sides.map((s) => s.trim())
    const rec: AppMatch = { id: m.id, home, away, kickoff: +new Date(m.k) }
    const key = pairKey(home, away)
    const arr = idx.get(key)
    if (arr) arr.push(rec)
    else idx.set(key, [rec])
  }
  appIndex = idx
  return idx
}

/** Resolve an ESPN event's two (app-normalized) team names → an app match id. */
function resolveAppMatch(homeName: string, awayName: string, kickoff: number): AppMatch | null {
  const candidates = getAppIndex().get(pairKey(homeName, awayName))
  if (!candidates || candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]
  // Knockout rematch: pick the closest kickoff.
  return candidates.reduce((best, c) =>
    Math.abs(c.kickoff - kickoff) < Math.abs(best.kickoff - kickoff) ? c : best,
  )
}

const clampState = (s: unknown): MatchState =>
  s === 'in' || s === 'post' ? s : 'pre'

const num = (v: unknown): number => {
  const n = parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : 0
}

// ── In-memory store (no localStorage; mirrors the createStore shape in storage.ts) ──

let scores: Record<string, ScoreInfo> = {}
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Merge a freshly-parsed batch into the store, notifying subscribers if anything changed. */
function merge(batch: Record<string, ScoreInfo>) {
  let changed = false
  const next = { ...scores }
  for (const [id, info] of Object.entries(batch)) {
    const prev = next[id]
    if (
      !prev ||
      prev.home !== info.home ||
      prev.away !== info.away ||
      prev.state !== info.state ||
      prev.clock !== info.clock ||
      prev.detail !== info.detail ||
      prev.winner !== info.winner
    ) {
      next[id] = info
      changed = true
    }
  }
  if (changed) {
    scores = next
    emit()
  }
}

type EspnCompetitor = { homeAway?: string; score?: string; winner?: boolean; team?: { displayName?: string } }
type EspnEvent = {
  date?: string
  competitions?: {
    status?: { displayClock?: string; type?: { state?: string; shortDetail?: string; detail?: string } }
    competitors?: EspnCompetitor[]
  }[]
}

function parseEvents(events: EspnEvent[]): Record<string, ScoreInfo> {
  const out: Record<string, ScoreInfo> = {}
  for (const ev of events) {
    const comp = ev.competitions?.[0]
    const cs = comp?.competitors ?? []
    if (cs.length !== 2) continue
    const state = clampState(comp?.status?.type?.state)
    if (state === 'pre') continue // nothing to show until kickoff

    const espnHome = cs.find((c) => c.homeAway === 'home') ?? cs[0]
    const espnAway = cs.find((c) => c.homeAway === 'away') ?? cs[1]
    const homeName = toAppName(espnHome.team?.displayName ?? '')
    const awayName = toAppName(espnAway.team?.displayName ?? '')
    if (!homeName || !awayName) continue

    const kickoff = +new Date(ev.date ?? '')
    const match = resolveAppMatch(homeName, awayName, kickoff)
    if (!match) continue // unknown / unresolved knockout placeholder — skip silently

    // Align ESPN scores to the app's "A vs B" listing order.
    const homeIsAppHome = homeName === match.home
    const appHomeScore = num(homeIsAppHome ? espnHome.score : espnAway.score)
    const appAwayScore = num(homeIsAppHome ? espnAway.score : espnHome.score)

    const detail = comp?.status?.type?.shortDetail ?? comp?.status?.type?.detail

    // Which side won, aligned to the app's listing order (handles penalties via
    // ESPN's winner flag rather than inferring from goals).
    let winner: 'home' | 'away' | undefined
    if (state === 'post') {
      const espnHomeWon = espnHome.winner === true
      const espnAwayWon = espnAway.winner === true
      if (espnHomeWon) winner = homeIsAppHome ? 'home' : 'away'
      else if (espnAwayWon) winner = homeIsAppHome ? 'away' : 'home'
    }

    out[match.id] = {
      home: appHomeScore,
      away: appAwayScore,
      state,
      clock: state === 'in' ? comp?.status?.displayClock || detail : undefined,
      detail,
      winner,
    }
  }
  return out
}

async function fetchDates(range: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}?dates=${range}`)
    if (!res.ok) return
    const data = (await res.json()) as { events?: EspnEvent[] }
    merge(parseEvents(data.events ?? []))
  } catch {
    // Network error / ESPN down / endpoint changed → leave the store as-is.
    // The app degrades to "no scores"; the static schedule keeps working.
  }
}

// ── Date helpers (ESPN buckets by US Eastern day) ──
function etYmd(d = new Date()): string {
  // en-CA gives YYYY-MM-DD; strip dashes for ESPN's YYYYMMDD.
  const s = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  return s.replace(/-/g, '')
}

function clampToday(): string {
  const today = etYmd()
  if (today < TOURNAMENT_START) return TOURNAMENT_START
  if (today > TOURNAMENT_END) return TOURNAMENT_END
  return today
}

// ── Knockout team assignments (read straight from ESPN) ──
// ESPN fills knockout fixtures with real teams as groups finish and games are
// played — including the third-placed teams whose R32 slots follow FIFA's
// official combination table. We read those directly rather than computing them.
// Stored as the two app-normalized names in ESPN home/away order (which may be
// placeholders like "Third Place Group A/B/C/D/F" until locked in).

const KO_START = '20260628'
const KO_POLL_MS = 300_000 // assignments change slowly (per game), so poll gently

// kickoff(ms) → app knockout match id
let koIndex: Map<number, string> | null = null
function getKoIndex(): Map<number, string> {
  if (koIndex) return koIndex
  const idx = new Map<number, string>()
  for (const k of KNOCKOUT) for (const m of k.matches) idx.set(+new Date(m.k), m.id)
  koIndex = idx
  return idx
}

let koTeams: Record<string, [string, string]> = {}
const koListeners = new Set<() => void>()
const koEmit = () => koListeners.forEach((l) => l())

function parseKoTeams(events: EspnEvent[]): Record<string, [string, string]> {
  const out: Record<string, [string, string]> = {}
  for (const ev of events) {
    const appId = getKoIndex().get(+new Date(ev.date ?? ''))
    if (!appId) continue
    const cs = ev.competitions?.[0]?.competitors ?? []
    if (cs.length !== 2) continue
    const home = cs.find((c) => c.homeAway === 'home') ?? cs[0]
    const away = cs.find((c) => c.homeAway === 'away') ?? cs[1]
    out[appId] = [toAppName(home.team?.displayName ?? ''), toAppName(away.team?.displayName ?? '')]
  }
  return out
}

function mergeKo(batch: Record<string, [string, string]>) {
  let changed = false
  const next = { ...koTeams }
  for (const [id, pair] of Object.entries(batch)) {
    const prev = next[id]
    if (!prev || prev[0] !== pair[0] || prev[1] !== pair[1]) {
      next[id] = pair
      changed = true
    }
  }
  if (changed) {
    koTeams = next
    koEmit()
  }
}

async function fetchKoTeams(): Promise<void> {
  try {
    const res = await fetch(`${BASE}?dates=${KO_START}-${TOURNAMENT_END}`)
    if (!res.ok) return
    const data = (await res.json()) as { events?: EspnEvent[] }
    mergeKo(parseKoTeams(data.events ?? []))
  } catch {
    // Network error → keep current assignments; bracket falls back to placeholders.
  }
}

// ── Polling lifecycle (browser only) ──
let started = false
let timer: ReturnType<typeof setInterval> | null = null
let koTimer: ReturnType<typeof setInterval> | null = null

function poll() {
  if (typeof document !== 'undefined' && document.hidden) return
  void fetchDates(clampToday())
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  // One range fetch for finished + live matches up to today…
  void fetchDates(`${TOURNAMENT_START}-${clampToday()}`)
  // …then poll only today's slate and merge.
  timer = setInterval(poll, POLL_MS)
  // Knockout team assignments: fetch once now, then poll gently.
  void fetchKoTeams()
  koTimer = setInterval(() => {
    if (typeof document === 'undefined' || !document.hidden) void fetchKoTeams()
  }, KO_POLL_MS)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      poll() // refresh immediately when the tab returns
      void fetchKoTeams()
    }
  })
}

const subscribe = (l: () => void) => {
  start()
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const getSnapshot = () => scores
const EMPTY: Record<string, ScoreInfo> = {}
const getServerSnapshot = () => EMPTY

/** Live scores keyed by app match id. In-memory only; pulled from ESPN. */
export function useScores(): Record<string, ScoreInfo> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Score for a single match id (or undefined if not started / unknown). */
export function useScore(matchId: string): ScoreInfo | undefined {
  return useScores()[matchId]
}

const koSubscribe = (l: () => void) => {
  start()
  koListeners.add(l)
  return () => {
    koListeners.delete(l)
  }
}
const koGetSnapshot = () => koTeams
const KO_EMPTY: Record<string, [string, string]> = {}
const koGetServerSnapshot = () => KO_EMPTY

/** ESPN's current knockout team assignments, keyed by app match id, as the two
 *  app-normalized names in home/away order (may be placeholders until locked). */
export function useKnockoutTeams(): Record<string, [string, string]> {
  return useSyncExternalStore(koSubscribe, koGetSnapshot, koGetServerSnapshot)
}

// Exposed for unit-style verification.
export const __test = { parseEvents, resolveAppMatch, toAppName, parseKoTeams }

// Stop the timer on HMR teardown so dev reloads don't stack intervals.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (timer) clearInterval(timer)
    if (koTimer) clearInterval(koTimer)
    started = false
  })
}
