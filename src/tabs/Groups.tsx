import { GROUPS } from '../data/schedule'
import { opponentFor, venueCityFor } from '../data/groupPaths'
import { teamFlag } from '../data/flags'
import { useFavTeams } from '../lib/storage'
import './Groups.css'

export default function Groups() {
  const { isFav } = useFavTeams()

  return (
    <div className="groups">
      {GROUPS.map((g) => {
        const hasFav = g.teams.some(isFav)
        return (
          <div key={g.g} className={`grp-card${hasFav ? ' grp-card--fav' : ''}`}>
            <div className="grp-head">
              <span className={`grp-label${g.hot ? ' grp-label--hot' : ''}`}>
                Group {g.g}
                {g.hot ? ' 🔥' : ''}
              </span>
              <span className="grp-dates">{g.dates}</span>
            </div>

            <div className="grp-teams">
              {g.teams.map((team) => (
                <div key={team} className="grp-team-row">
                  <span className={`grp-team${isFav(team) ? ' grp-team--fav' : ''}`}>
                    {isFav(team) && <span className="grp-star">⭐</span>}
                    <span className="mt-flag">{teamFlag(team)}</span>
                    {team}
                  </span>
                </div>
              ))}
            </div>

            <div className="grp-path">
              <div className="grp-path-label">Knockout path</div>
              <div className="grp-path-row">
                <span className="grp-dot grp-dot--w" />
                <span className="grp-path-slot grp-path-slot--w">Winner</span>
                <span className="grp-arrow">→</span>
                <span className="grp-path-dest">
                  vs <strong>{opponentFor(g.g, 'w')}</strong> · {venueCityFor(g.g, 'w')}
                </span>
              </div>
              <div className="grp-path-row">
                <span className="grp-dot grp-dot--ru" />
                <span className="grp-path-slot grp-path-slot--ru">Runner-up</span>
                <span className="grp-arrow">→</span>
                <span className="grp-path-dest">
                  vs <strong>{opponentFor(g.g, 'ru')}</strong> · {venueCityFor(g.g, 'ru')}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
