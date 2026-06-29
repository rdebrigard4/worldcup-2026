import type { ReactNode } from 'react'
import type { Match } from '../data/schedule'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { matchMeta } from '../lib/matches'
import { useScores, useKnockoutTeams } from '../lib/scores'
import { resolveGroupSlots, matchSides, isTeamSide } from '../lib/knockout'
import MatchTeams from './MatchTeams'

// The shared inner layout of a match row — a left rail with the local date and
// a prominent kickoff time, then the teams (with an optional badge slot for a
// fav pill / group tag) and the venue·city meta.
// Used by Schedule and Favorites, which wrap it in their own card element.
export default function MatchSummary({ m, badge }: { m: Match; badge?: ReactNode }) {
  const time = fmtKickoffTime(m.k, false)
  const scores = useScores()
  const koTeams = useKnockoutTeams()

  const isKo = /^(r32|r16|qf|sf|fin|tp)/.test(m.id)
  let displayT = m.t
  if (isKo) {
    const slots = resolveGroupSlots(scores)
    const [side0, side1] = matchSides(m, slots, koTeams)
    const n0 = isTeamSide(side0) ? side0.team : side0.label
    const n1 = isTeamSide(side1) ? side1.team : side1.label
    displayT = `${n0} vs ${n1}`
  }

  return (
    <>
      <span className="m-when">
        <span className="m-date">{fmtKickoffDate(m.k) || m.date}</span>
        {time && <span className="m-time">{time}</span>}
      </span>
      <span className="m-body">
        <span className="m-teams">
          <MatchTeams t={displayT} matchId={m.id} />
          {badge}
        </span>
        <span className="m-meta">{matchMeta(m)}</span>
      </span>
    </>
  )
}
