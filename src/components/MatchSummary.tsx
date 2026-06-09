import type { ReactNode } from 'react'
import type { Match } from '../data/schedule'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { matchMeta } from '../lib/matches'
import MatchTeams from './MatchTeams'

// The shared inner layout of a match row — a left rail with the local date and
// a prominent kickoff time, then the teams (with an optional badge slot for a
// fav pill / group tag) and the venue·city meta.
// Used by Schedule and Favorites, which wrap it in their own card element.
export default function MatchSummary({ m, badge }: { m: Match; badge?: ReactNode }) {
  const time = fmtKickoffTime(m.k, false)
  return (
    <>
      <span className="m-when">
        <span className="m-date">{fmtKickoffDate(m.k) || m.date}</span>
        {time && <span className="m-time">{time}</span>}
      </span>
      <span className="m-body">
        <span className="m-teams">
          <MatchTeams t={m.t} matchId={m.id} />
          {badge}
        </span>
        <span className="m-meta">{matchMeta(m)}</span>
      </span>
    </>
  )
}
