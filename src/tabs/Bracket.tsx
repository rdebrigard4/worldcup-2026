import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { KNOCKOUT, type Match } from '../data/schedule'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { useSavedMatches } from '../lib/storage'
import { useScores, useKnockoutTeams, type ScoreInfo } from '../lib/scores'
import { resolveGroupSlots, matchSides, isTeamSide, BRACKET_FEEDS, type Side } from '../lib/knockout'
import { teamFlag } from '../data/flags'
import './Bracket.css'

type Round = { label: string; short: string; sub: string; phase: string; ids: string[] }

// Each half's columns, top-to-bottom, in real feeding order (verified against
// ESPN's live linkage + official FIFA numbers). The full bracket renders the
// left half flowing right → Final → the right half flowing left (mirrored).
const LEFT: Round[] = [
  { label: 'Round of 32', short: 'R32', sub: 'Jun 28 – Jul 2', phase: 'r32', ids: ['r32a', 'r32c', 'r32b', 'r32e', 'r32k', 'r32l', 'r32i', 'r32j'] },
  { label: 'Round of 16', short: 'R16', sub: 'Jul 4 – 6', phase: 'r16', ids: ['r16a', 'r16b', 'r16e', 'r16f'] },
  { label: 'Quarterfinals', short: 'QF', sub: 'Jul 9 – 10', phase: 'qf', ids: ['qf1', 'qf2'] },
  { label: 'Semifinal 1', short: 'SF', sub: 'Jul 14', phase: 'sf', ids: ['sf1'] },
]
const RIGHT: Round[] = [
  { label: 'Round of 32', short: 'R32', sub: 'Jun 30 – Jul 4', phase: 'r32', ids: ['r32d', 'r32f', 'r32g', 'r32h', 'r32n', 'r32p', 'r32m', 'r32o'] },
  { label: 'Round of 16', short: 'R16', sub: 'Jul 5 – 7', phase: 'r16', ids: ['r16c', 'r16d', 'r16g', 'r16h'] },
  { label: 'Quarterfinals', short: 'QF', sub: 'Jul 11', phase: 'qf', ids: ['qf3', 'qf4'] },
  { label: 'Semifinal 2', short: 'SF', sub: 'Jul 15', phase: 'sf', ids: ['sf2'] },
]

function matchById(phase: string, id: string): Match | undefined {
  return KNOCKOUT.find((k) => k.phase === phase)?.matches.find((m) => m.id === id)
}

const sideLabel = (s: Side): string => (isTeamSide(s) ? s.team : s.label)

type Slots = Record<string, string>
type KoTeams = Record<string, [string, string]>

function TeamLine({ s, goals }: { s: Side; goals?: number }) {
  if (isTeamSide(s)) {
    const flag = teamFlag(s.team)
    return (
      <span className="brd-tl">
        {flag && <span className="mt-flag">{flag}</span>}
        <span className="brd-tl-name">{s.team}</span>
        {goals != null && <span className="brd-tl-goals">{goals}</span>}
      </span>
    )
  }
  return (
    <span className="brd-tl brd-tl--tbd">
      <span className="brd-tl-name">{s.label}</span>
    </span>
  )
}

function BracketCard({
  m,
  slots,
  koTeams,
  score,
  isFinal,
  saved,
  onToggle,
}: {
  m: Match
  slots: Slots
  koTeams: KoTeams
  score?: ScoreInfo
  isFinal?: boolean
  saved: boolean
  onToggle: () => void
}) {
  const meta = [fmtKickoffDate(m.k) || m.date, fmtKickoffTime(m.k, false)].filter(Boolean).join(' · ')
  const [s0, s1] = matchSides(m, slots, koTeams)
  const showScore = !!score && score.state !== 'pre'
  return (
    <button
      className={`brd-card${saved ? ' brd-card--saved' : ''}${isFinal ? ' brd-card--final' : ''}`}
      data-mid={m.id}
      onClick={onToggle}
      aria-pressed={saved}
    >
      <span className="brd-rows">
        <TeamLine s={s0} goals={showScore ? score!.home : undefined} />
        <TeamLine s={s1} goals={showScore ? score!.away : undefined} />
      </span>
      <span className="brd-card-meta">
        <span>{meta}</span>
        <span className="brd-card-star">{saved ? '★' : '☆'}</span>
      </span>
    </button>
  )
}

function MiniCard({
  m,
  slots,
  koTeams,
  isFinal,
  saved,
  onToggle,
}: {
  m: Match
  slots: Slots
  koTeams: KoTeams
  isFinal?: boolean
  saved: boolean
  onToggle: () => void
}) {
  const [s0, s1] = matchSides(m, slots, koTeams)
  const cell = (s: Side) =>
    isTeamSide(s) ? (
      <span className="brm-flag">{teamFlag(s.team) || '•'}</span>
    ) : (
      <span className="brm-tbd">·</span>
    )
  return (
    <button
      className={`brm-card${saved ? ' brm-card--saved' : ''}${isFinal ? ' brm-card--final' : ''}`}
      data-mid={m.id}
      onClick={onToggle}
      aria-pressed={saved}
      title={`${sideLabel(s0)} vs ${sideLabel(s1)}`}
    >
      {cell(s0)}
      {cell(s1)}
    </button>
  )
}

function Column({
  round,
  side,
  compact,
  render,
}: {
  round: Round
  side: 'left' | 'right'
  compact: boolean
  render: (m: Match) => ReactNode
}) {
  const matches = round.ids.map((id) => matchById(round.phase, id)).filter((m): m is Match => !!m)
  return (
    <div className={`brd-round brd-round--${side}`}>
      <div className="brd-round-hdr">
        {compact ? round.short : round.label}
        {!compact && <span>{round.sub}</span>}
      </div>
      <div className="brd-slots">{matches.map(render)}</div>
    </div>
  )
}

/** Orthogonal connector lines between each match and the two it feeds from,
 *  measured from the laid-out cards so it works in both halves + densities. */
function computePaths(canvas: HTMLElement): string[] {
  const out: string[] = []
  const cr = canvas.getBoundingClientRect()
  // Coords relative to the canvas's scrollable content (robust to offsetParent).
  const box = (id: string) => {
    const el = canvas.querySelector<HTMLElement>(`[data-mid="${id}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      left: r.left - cr.left + canvas.scrollLeft,
      top: r.top - cr.top + canvas.scrollTop,
      w: r.width,
      h: r.height,
    }
  }
  for (const [matchId, feeders] of Object.entries(BRACKET_FEEDS)) {
    if (matchId === 'tp1') continue
    const m = box(matchId)
    if (!m) continue
    const mcy = m.top + m.h / 2
    for (const fId of feeders) {
      const f = box(fId)
      if (!f) continue
      const fcy = f.top + f.h / 2
      const rightward = m.left > f.left
      const sx = rightward ? f.left + f.w : f.left
      const ex = rightward ? m.left : m.left + m.w
      const mx = (sx + ex) / 2
      out.push(`M${sx},${fcy} H${mx} V${mcy} H${ex}`)
    }
  }
  return out
}

export default function Bracket() {
  const { isSaved, toggle } = useSavedMatches()
  const scores = useScores()
  const koTeams = useKnockoutTeams()

  const [compact, setCompactState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wc2026_bracketCompact') === '1'
    } catch {
      return false
    }
  })
  const setCompact = (v: boolean) => {
    setCompactState(v)
    try {
      localStorage.setItem('wc2026_bracketCompact', v ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  const slots = useMemo(() => resolveGroupSlots(scores), [scores])
  const final = useMemo(() => matchById('final', 'fin'), [])

  // Measure + draw connector lines from the laid-out cards.
  const canvasRef = useRef<HTMLDivElement>(null)
  const [conn, setConn] = useState<{ w: number; h: number; paths: string[] }>({ w: 0, h: 0, paths: [] })
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const recompute = () =>
      setConn({ w: canvas.scrollWidth, h: canvas.scrollHeight, paths: computePaths(canvas) })
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [compact, koTeams, scores])

  const card = (m: Match, isFinal?: boolean) => {
    const base = { key: m.id, m, slots, koTeams, isFinal, saved: isSaved(m.id), onToggle: () => toggle(m.id) }
    return compact ? <MiniCard {...base} /> : <BracketCard {...base} score={scores[m.id]} />
  }

  return (
    <div className="bracket">
      <p className="bracket-intro">
        Full knockout bracket — both halves converge on the Final in the center.{' '}
        {compact ? 'Tap a match for its teams; switch to Detailed for dates.' : 'Swipe sideways to follow a path. Tap any match to save it to Favorites.'}
      </p>

      <div className="bracket-view-toggle" role="group" aria-label="Bracket density">
        <button className={`bvt-btn${compact ? '' : ' bvt-btn--on'}`} onClick={() => setCompact(false)} aria-pressed={!compact}>
          Detailed
        </button>
        <button className={`bvt-btn${compact ? ' bvt-btn--on' : ''}`} onClick={() => setCompact(true)} aria-pressed={compact}>
          Compact
        </button>
      </div>

      <div className={compact ? 'bracket-outer bracket-outer--compact' : 'bracket-outer'}>
        <div ref={canvasRef} className={`bracket-canvas bracket-canvas--full${compact ? ' bracket-canvas--compact' : ''}`}>
          <svg className="brd-connectors" width={conn.w} height={conn.h} aria-hidden="true">
            {conn.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>

          {LEFT.map((round) => (
            <Column key={`l-${round.label}`} round={round} side="left" compact={compact} render={(m) => card(m)} />
          ))}

          <div className="brd-round brd-round--final-col">
            <div className="brd-round-hdr">
              {compact ? 'F' : 'Final'}
              {!compact && <span>Jul 19</span>}
            </div>
            <div className="brd-slots brd-slots--center">
              {final && card(final, true)}
              {!compact && <div className="brd-final-cap">🏆 MetLife Stadium · East Rutherford, NJ</div>}
            </div>
          </div>

          {[...RIGHT].reverse().map((round) => (
            <Column key={`r-${round.label}`} round={round} side="right" compact={compact} render={(m) => card(m)} />
          ))}
        </div>
      </div>
    </div>
  )
}
