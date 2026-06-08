import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { DEFAULT_FAV_TEAMS } from '../data/schedule'

// Module-level stores shared across every tab. Because the state lives outside
// React (in these singletons) and components subscribe via useSyncExternalStore,
// starring a match in one tab instantly updates the star/count in all others.
// Swap the read/write internals for Firestore later without touching the hooks.

const SAVED_KEY = 'wc2026_saved'
const FAVS_KEY = 'wc2026_favTeams'
const NOTES_KEY = 'wc2026_notes'
const SETTINGS_KEY = 'wc2026_settings'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function createStore<T>(key: string, initial: T) {
  let state = read(key, initial)
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(next: T) {
      state = next
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch {
        /* ignore quota/availability errors */
      }
      listeners.forEach((l) => l())
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

const savedStore = createStore<Record<string, true>>(SAVED_KEY, {})
const favStore = createStore<string[]>(FAVS_KEY, DEFAULT_FAV_TEAMS)
const notesStore = createStore<Record<string, string>>(NOTES_KEY, {})

// ── Appearance settings (theme, accent team, font size) ──

export type ThemeMode = 'dark' | 'light'

export type AppSettings = {
  /** Light or dark palette. */
  theme: ThemeMode
  /** Team whose flag color drives the accent, or null for the default green. */
  themeTeam: string | null
  /** Root font-size multiplier (1 = base). Clamped on the way in. */
  fontScale: number
}

export const FONT_SCALE_MIN = 0.85
export const FONT_SCALE_MAX = 1.4
const FONT_SCALE_STEP = 0.1

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  themeTeam: null,
  fontScale: 1,
}

const clampScale = (n: number) =>
  Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round(n * 100) / 100))

// Merge with defaults so adding a field later doesn't break older saved blobs.
const settingsStore = createStore<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)
settingsStore.set({ ...DEFAULT_SETTINGS, ...settingsStore.get() })

/** App appearance settings — shared everywhere, persisted to localStorage. */
export function useSettings() {
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.get)
  const update = useCallback((patch: Partial<AppSettings>) => {
    settingsStore.set({ ...settingsStore.get(), ...patch })
  }, [])
  const toggleTheme = useCallback(() => {
    const cur = settingsStore.get()
    settingsStore.set({ ...cur, theme: cur.theme === 'dark' ? 'light' : 'dark' })
  }, [])
  const setThemeTeam = useCallback((team: string | null) => update({ themeTeam: team }), [update])
  const bumpFont = useCallback((dir: 1 | -1) => {
    const cur = settingsStore.get()
    update({ fontScale: clampScale(cur.fontScale + dir * FONT_SCALE_STEP) })
  }, [update])
  return useMemo(
    () => ({ settings, update, toggleTheme, setThemeTeam, bumpFont }),
    [settings, update, toggleTheme, setThemeTeam, bumpFont],
  )
}

/** Saved (starred) match ids — shared by Schedule, Bracket, and Favorites. */
export function useSavedMatches() {
  const ids = useSyncExternalStore(savedStore.subscribe, savedStore.get)
  const toggle = (id: string) => {
    const next = { ...savedStore.get() }
    if (next[id]) delete next[id]
    else next[id] = true
    savedStore.set(next)
  }
  const isSaved = (id: string) => !!ids[id]
  const count = Object.keys(ids).length
  return { ids, toggle, isSaved, count }
}

/** Favorited national teams — shared by Schedule, Groups, and My Teams. */
export function useFavTeams() {
  const teams = useSyncExternalStore(favStore.subscribe, favStore.get)
  // Memoize the helpers so their identities stay stable until `teams` changes —
  // otherwise consumers' useMemo/useEffect deps that reference them recompute
  // on every render.
  const favIn = useCallback((matchTeams: string) => teams.find((f) => matchTeams.includes(f)), [teams])
  const isFav = useCallback((team: string) => teams.includes(team), [teams])
  const toggleTeam = useCallback((team: string) => {
    const cur = favStore.get()
    favStore.set(cur.includes(team) ? cur.filter((t) => t !== team) : [...cur, team])
  }, [])
  return useMemo(() => ({ teams, favIn, isFav, toggleTeam }), [teams, favIn, isFav, toggleTeam])
}

/** Per-match notes (keyed by match id) — used by the Favorites tab. */
export function useMatchNotes() {
  const notes = useSyncExternalStore(notesStore.subscribe, notesStore.get)
  const noteFor = (id: string) => notes[id] ?? ''
  const setNote = (id: string, text: string) => {
    const next = { ...notesStore.get() }
    if (text.trim()) next[id] = text
    else delete next[id]
    notesStore.set(next)
  }
  return { notes, noteFor, setNote }
}
