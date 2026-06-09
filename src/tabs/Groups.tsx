import { GROUPS } from '../data/schedule'
import { opponentFor, venueCityFor } from '../data/groupPaths'
import { teamFlag } from '../data/flags'
import { useFavTeams } from '../lib/storage'
import { useScores } from '../lib/scores'
import { computeStandings, fmtGD } from '../lib/standings'
import './Groups.css'

export default function Groups() {
  const { isFav } = useFavTeams()
  const scores = useScores()

  return (
    <div className="groups">
      {GROUPS.map((g) => {
        const hasFav = g.teams.some(isFav)
        const standings = computeStandings(g, scores)
        const played = standings.some((s) => s.p > 0)
        return (
          <div key={g.g} className={`grp-card${hasFav ? ' grp-card--fav' : ''}`}>
            <div className="grp-head">
              <span className={`grp-label${g.hot ? ' grp-label--hot' : ''}`}>
                Group {g.g}
                {g.hot ? ' 🔥' : ''}
              </span>
              <span className="grp-dates">{g.dates}</span>
            </div>

            <div className="grp-table" role="table" aria-label={`Group ${g.g} standings`}>
              <div className="grp-row grp-row--head" role="row">
                <span className="grp-pos" />
                <span className="grp-team-cell">Team</span>
                <span className="grp-stat" title="Played">P</span>
                <span className="grp-stat" title="Goal difference">GD</span>
                <span className="grp-stat grp-pts" title="Points">Pts</span>
              </div>
              {standings.map((s, i) => (
                <div
                  key={s.team}
                  className={`grp-row${played && i < 2 ? ` grp-row--q grp-row--${i === 0 ? 'w' : 'ru'}` : ''}`}
                  role="row"
                >
                  <span className="grp-pos">{i + 1}</span>
                  <span className={`grp-team${isFav(s.team) ? ' grp-team--fav' : ''}`}>
                    {isFav(s.team) && <span className="grp-star">⭐</span>}
                    <span className="mt-flag">{teamFlag(s.team)}</span>
                    <span className="grp-team-name">{s.team}</span>
                  </span>
                  <span className="grp-stat">{s.p}</span>
                  <span className="grp-stat">{fmtGD(s.gd)}</span>
                  <span className="grp-stat grp-pts">{s.pts}</span>
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
