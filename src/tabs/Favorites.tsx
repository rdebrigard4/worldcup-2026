import { useMemo } from 'react'
import { PHASE_LABELS } from '../data/schedule'
import { byKickoff, findMatchById, type LocatedMatch } from '../lib/matches'
import { useMatchNotes, useSavedMatches } from '../lib/storage'
import MatchSummary from '../components/MatchSummary'
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
      rows: byPhase[phase].sort((a, b) => byKickoff(a.m, b.m)),
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
            return (
              <div key={m.id} className="fav-card">
                <div className="fav-card-head">
                  <MatchSummary
                    m={m}
                    badge={grp ? <span className="fav-grp-tag">Group {grp}</span> : undefined}
                  />
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
