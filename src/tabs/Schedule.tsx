import { useMemo, useState } from 'react'
import { GROUPS, KNOCKOUT, type Match } from '../data/schedule'
import { fmtKickoffDate } from '../lib/format'
import { byKickoff } from '../lib/matches'
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
      <div className="filters">
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
                    className={`match${saved ? ' match--saved' : ''}`}
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
