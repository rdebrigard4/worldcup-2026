import type { ReactNode } from 'react'
import type { Match } from '../data/schedule'
import { fmtKickoffDate } from '../lib/format'
import { matchMeta } from '../lib/matches'
import MatchTeams from './MatchTeams'

// The shared inner layout of a match row — local date, the teams (with an
// optional badge slot for a fav pill / group tag), and the venue·city·time meta.
// Used by Schedule and Favorites, which wrap it in their own card element.
export default function MatchSummary({ m, badge }: { m: Match; badge?: ReactNode }) {
  return (
    <>
      <span className="m-date">{fmtKickoffDate(m.k) || m.date}</span>
      <span className="m-body">
        <span className="m-teams">
          <MatchTeams t={m.t} />
          {badge}
        </span>
        <span className="m-meta">{matchMeta(m)}</span>
      </span>
    </>
  )
}
