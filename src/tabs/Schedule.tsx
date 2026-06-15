import { useEffect, useMemo, useRef, useState } from 'react'
import { GROUPS, KNOCKOUT, type Match } from '../data/schedule'
import { fmtKickoffDate } from '../lib/format'
import { allMatches, byKickoff } from '../lib/matches'
import { useFavTeams, useSavedMatches } from '../lib/storage'
import MatchSummary from '../components/MatchSummary'
import './Schedule.css'

type PhaseFilter = 'all' | 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'

const PHASE_CHIPS: { id: PhaseFilter; label: string }[] = [
  { id: 'all', label: 'All phases' },
  { id: 'group', label: 'Group stage' },
  { id: 'r32', label: 'R32' },
  { id: 'r16', label: 'R16' },
  { id: 'qf', label: 'QF' },
  { id: 'sf', label: 'SF' },
  { id: 'final', label: 'Final' },
]

type Row = { m: Match; phase: string }
type Section = { header: string; rows: Row[] }

export default function Schedule() {
  const [activePhase, setActivePhase] = useState<PhaseFilter>('all')
  const [sortByDate, setSortByDate] = useState(true)
  const [favOnly, setFavOnly] = useState(false)
  const [query, setQuery] = useState('')

  const { isSaved, toggle } = useSavedMatches()
  const { favIn } = useFavTeams()

  // The nearest current-or-upcoming match: the first match (chronologically)
  // that is in progress or hasn't kicked off yet. A live game stays "current"
  // for LIVE_WINDOW_MS after kickoff so it isn't scrolled past while playing.
  const LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000
  const targetId = useMemo(() => {
    const now = Date.now()
    const upcoming = allMatches()
      .map((x) => x.m)
      .sort(byKickoff)
      .find((m) => +new Date(m.k) >= now - LIVE_WINDOW_MS)
    return upcoming?.id ?? null
  }, [LIVE_WINDOW_MS])

  // Auto-scroll to that match once, on first mount, so users land on the
  // action instead of the top of a list of already-completed games.
  const targetRef = useRef<HTMLButtonElement | null>(null)
  const didScroll = useRef(false)
  useEffect(() => {
    if (didScroll.current || !targetRef.current) return
    didScroll.current = true
    const el = targetRef.current

    // Land the target flush *below* its own date header, which pins just under
    // the chrome + filter bar. Offsetting by the full header height keeps the
    // PREVIOUS day's last game fully scrolled behind the pinned chrome.
    const place = () => {
      const cs = getComputedStyle(document.documentElement)
      const num = (v: string) => parseFloat(cs.getPropertyValue(v)) || 0
      const offset = num('--chrome-h') + num('--filters-h')
      const hdr = el.parentElement?.querySelector('.group-hdr')
      const hdrH = hdr ? hdr.getBoundingClientRect().height : 0
      const top = window.scrollY + el.getBoundingClientRect().top - offset - hdrH
      window.scrollTo({ top: Math.max(0, top) })
    }

    // The list + live scores lay out asynchronously after mount (most visibly
    // on narrow mobile, where rows grow as scorelines/badges appear). That
    // shifts the target after a one-shot scroll, leaving it short. So re-place
    // on every layout change for a short window — until the user scrolls.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      ro.disconnect()
      clearTimeout(stop)
      window.removeEventListener('touchmove', finish)
      window.removeEventListener('wheel', finish)
    }
    const raf = requestAnimationFrame(place)
    const ro = new ResizeObserver(() => place())
    ro.observe(document.body)
    const stop = setTimeout(finish, 1800)
    window.addEventListener('touchmove', finish, { passive: true })
    window.addEventListener('wheel', finish, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      finish()
    }
  }, [])

  // Publish the filter bar's live height as --filters-h so the sticky date
  // headers (and the auto-scroll offset) sit just below it. Re-measures when
  // the bar wraps to more rows on resize; cleared on unmount so other tabs
  // (e.g. Favorites, which reuse .group-hdr but have no filter bar) see 0.
  const filtersRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = filtersRef.current
    if (!el) return
    const root = document.documentElement
    const apply = () => root.style.setProperty('--filters-h', `${el.offsetHeight}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--filters-h')
    }
  }, [])

  const sections = useMemo<Section[]>(() => {
    const q = query.trim().toLowerCase()
    const groupMatch = (m: Match) => {
      if (favOnly && !favIn(m.t)) return false
      if (q && ![m.t, m.c, m.v].some((s) => s?.toLowerCase().includes(q))) return false
      return true
    }
    const koMatch = (m: Match) => !q || [m.t, m.v].some((s) => s?.toLowerCase().includes(q))

    if (sortByDate) {
      // Flatten everything that passes the filters, sort by kickoff, group by day.
      const all: Row[] = []
      if (activePhase === 'all' || activePhase === 'group') {
        GROUPS.forEach((g) => g.matches.forEach((m) => groupMatch(m) && all.push({ m, phase: 'group' })))
      }
      if (activePhase !== 'group') {
        KNOCKOUT.forEach((k) => {
          if (activePhase !== 'all' && activePhase !== k.phase) return
          k.matches.forEach((m) => koMatch(m) && all.push({ m, phase: k.phase }))
        })
      }
      all.sort((a, b) => byKickoff(a.m, b.m))

      const out: Section[] = []
      all.forEach((row) => {
        const header = fmtKickoffDate(row.m.k) || row.m.date
        const last = out[out.length - 1]
        if (last && last.header === header) last.rows.push(row)
        else out.push({ header, rows: [row] })
      })
      return out
    }

    // Grouped by group / phase.
    const out: Section[] = []
    if (activePhase === 'all' || activePhase === 'group') {
      GROUPS.forEach((g) => {
        const rows = g.matches.filter(groupMatch).map((m) => ({ m, phase: 'group' }))
        if (rows.length) {
          out.push({ header: `Group ${g.g} — ${g.teams.join(' · ')}${g.hot ? ' 🔥' : ''}`, rows })
        }
      })
    }
    if (activePhase !== 'group') {
      KNOCKOUT.forEach((k) => {
        if (activePhase !== 'all' && activePhase !== k.phase) return
        const rows = k.matches.filter(koMatch).map((m) => ({ m, phase: k.phase }))
        if (rows.length) out.push({ header: k.label, rows })
      })
    }
    return out
  }, [activePhase, sortByDate, favOnly, query, favIn])

  const isEmpty = sections.length === 0

  return (
    <div className="schedule">
      <div className="filters" ref={filtersRef}>
        <button
          className={`chip${sortByDate ? ' chip--on' : ''}`}
          onClick={() => setSortByDate((v) => !v)}
        >
          📅 By date
        </button>
        {PHASE_CHIPS.map((chip) => (
          <button
            key={chip.id}
            className={`chip${activePhase === chip.id ? ' chip--on' : ''}`}
            onClick={() => setActivePhase(chip.id)}
          >
            {chip.label}
          </button>
        ))}
        <button
          className={`chip${favOnly ? ' chip--on' : ''}`}
          onClick={() => setFavOnly((v) => !v)}
        >
          ⭐ My teams
        </button>
        <div className="search-wrap">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team, city, venue…"
          />
        </div>
      </div>

      {isEmpty ? (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          No matches found.
        </div>
      ) : (
        <div className="match-list">
          {sections.map((section) => (
            <div key={section.header}>
              <div className="group-hdr">{section.header}</div>
              {section.rows.map(({ m }) => {
                const saved = isSaved(m.id)
                const fav = favIn(m.t)
                return (
                  <button
                    key={m.id}
                    ref={m.id === targetId ? targetRef : undefined}
                    className={`match${saved ? ' match--saved' : ''}${m.id === targetId ? ' match--upcoming-anchor' : ''}`}
                    onClick={() => toggle(m.id)}
                    aria-pressed={saved}
                  >
                    <MatchSummary
                      m={m}
                      badge={fav ? <span className="fav-pill">{fav}</span> : undefined}
                    />
                    <span className="m-star">{saved ? '★' : '☆'}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
