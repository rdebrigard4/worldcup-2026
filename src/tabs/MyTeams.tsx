import { useMemo } from 'react'
import { GROUPS, type Match } from '../data/schedule'
import { teamFlag } from '../data/flags'
import { teamColors, stripesGradient, teamPrimaryColor } from '../data/venues'
import { groupMatchesForTeam } from '../lib/teamRoutes'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { useFavTeams } from '../lib/storage'
import './MyTeams.css'

// The next match a team plays from now (kickoff in the future), falling back to
// their opening fixture before the tournament starts.
function nextMatchFor(team: string): Match | undefined {
  const matches = groupMatchesForTeam(team)
  const now = Date.now()
  return matches.find((m) => +new Date(m.k) >= now) ?? matches[0]
}

export default function MyTeams() {
  const { isFav, toggleTeam } = useFavTeams()

  // Followed teams in group order (A→L), each paired with its group.
  const followed = useMemo(
    () =>
      GROUPS.flatMap((g) =>
        g.teams.filter(isFav).map((team) => ({ team, group: g })),
      ),
    [isFav],
  )

  return (
    <div className="myteams">
      <section className="myt-section">
        <h3 className="myt-section-h">Following ({followed.length})</h3>
        {followed.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⭐</div>
            You're not following any teams yet. Tap a team below to follow it.
          </div>
        ) : (
          <div className="myt-cards">
            {followed.map(({ team, group }) => {
              const next = nextMatchFor(team)
              const opponents = group.teams.filter((t) => t !== team).join(', ')
              return (
                <div key={team} className="myt-card">
                  <span
                    className="myt-stripe"
                    style={{ background: stripesGradient(teamColors(team)) }}
                  />
                  <div className="myt-card-body">
                    <div className="myt-card-name">
                      <span className="myt-flag">{teamFlag(team)}</span>
                      {team}
                      <span className="myt-grp-tag">Group {group.g}</span>
                    </div>
                    <div className="myt-card-meta">vs {opponents}</div>
                    {next && (
                      <div className="myt-next">
                        <span className="myt-next-label">Next</span>
                        {fmtKickoffDate(next.k) || next.date} · {next.t}
                        {next.c ? ` · ${next.c}` : ''}
                        {fmtKickoffTime(next.k) ? ` · ${fmtKickoffTime(next.k)}` : ''}
                      </div>
                    )}
                  </div>
                  <button
                    className="myt-unfollow"
                    onClick={() => toggleTeam(team)}
                    aria-label={`Unfollow ${team}`}
                    title={`Unfollow ${team}`}
                  >
                    ★
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="myt-section">
        <h3 className="myt-section-h">All teams</h3>
        <p className="myt-hint">Tap to follow or unfollow — your picks sync across every tab.</p>
        <div className="myt-groups">
          {GROUPS.map((g) => (
            <div key={g.g} className="myt-group">
              <div className="myt-group-label">
                Group {g.g}
                {g.hot ? ' 🔥' : ''}
              </div>
              <div className="myt-group-chips">
                {g.teams.map((team) => {
                  const on = isFav(team)
                  const c = teamPrimaryColor(team)
                  return (
                    <button
                      key={team}
                      className={`myt-toggle${on ? ' myt-toggle--on' : ''}`}
                      style={on ? { borderColor: c, background: `${c}22` } : undefined}
                      onClick={() => toggleTeam(team)}
                      aria-pressed={on}
                    >
                      <span className="myt-check">{on ? '★' : '☆'}</span>
                      <span className="myt-flag">{teamFlag(team)}</span>
                      {team}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
