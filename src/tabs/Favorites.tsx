import { useMemo } from 'react'
import { PHASE_LABELS } from '../data/schedule'
import { findMatchById, type LocatedMatch } from '../lib/matches'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { useMatchNotes, useSavedMatches } from '../lib/storage'
import MatchTeams from '../components/MatchTeams'
import './Favorites.css'

// Order phases the way they unfold across the tournament.
const PHASE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'tp', 'final']

type Section = { phase: string; rows: LocatedMatch[] }

export default function Favorites() {
  const { ids, toggle } = useSavedMatches()
  const { noteFor, setNote } = useMatchNotes()

  // Resolve saved ids → match details, drop any stale ids, sort each phase by
  // kickoff, then order the phases chronologically.
  const sections = useMemo<Section[]>(() => {
    const byPhase: Record<string, LocatedMatch[]> = {}
    Object.keys(ids).forEach((id) => {
      const found = findMatchById(id)
      if (!found) return
      ;(byPhase[found.phase] ??= []).push(found)
    })
    return PHASE_ORDER.filter((p) => byPhase[p]?.length).map((phase) => ({
      phase,
      rows: byPhase[phase].sort((a, b) => +new Date(a.m.k) - +new Date(b.m.k)),
    }))
  }, [ids])

  const total = sections.reduce((n, s) => n + s.rows.length, 0)

  if (total === 0) {
    return (
      <div className="favorites">
        <div className="empty">
          <div className="empty-icon">★</div>
          No saved matches yet. Tap the star on any match in Schedule or Bracket
          to save it here.
        </div>
      </div>
    )
  }

  return (
    <div className="favorites">
      <p className="fav-hint">
        {total} saved {total === 1 ? 'match' : 'matches'} — add a note to remember
        why each one matters.
      </p>
      {sections.map((section) => (
        <div key={section.phase} className="fav-section">
          <div className="group-hdr">{PHASE_LABELS[section.phase]}</div>
          {section.rows.map(({ m, grp }) => {
            const localDate = fmtKickoffDate(m.k) || m.date
            const localTime = fmtKickoffTime(m.k)
            const meta = [m.v, m.c, localTime].filter(Boolean).join(' · ')
            return (
              <div key={m.id} className="fav-card">
                <div className="fav-card-head">
                  <span className="m-date">{localDate}</span>
                  <span className="m-body">
                    <span className="m-teams">
                      <MatchTeams t={m.t} />
                      {grp && <span className="fav-grp-tag">Group {grp}</span>}
                    </span>
                    <span className="m-meta">{meta}</span>
                  </span>
                  <button
                    className="fav-unstar"
                    onClick={() => toggle(m.id)}
                    aria-label={`Remove ${m.t} from favorites`}
                    title="Remove from favorites"
                  >
                    ★
                  </button>
                </div>
                <textarea
                  className="fav-note"
                  value={noteFor(m.id)}
                  onChange={(e) => setNote(m.id, e.target.value)}
                  placeholder="Add a note…"
                  rows={2}
                />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
