import { Fragment } from 'react'
import { teamFlag } from '../data/flags'

// Renders a "Team A vs Team B" label with a flag prefixed to each known side.
// Knockout placeholders ("Winner C vs Runner-up F") simply render without flags.
export default function MatchTeams({ t }: { t: string }) {
  const sides = t.split(' vs ')
  return (
    <>
      {sides.map((side, i) => {
        const flag = teamFlag(side)
        return (
          <Fragment key={i}>
            {i > 0 && <span className="mt-vs"> vs </span>}
            {flag && <span className="mt-flag">{flag}</span>}
            {side}
          </Fragment>
        )
      })}
    </>
  )
}
