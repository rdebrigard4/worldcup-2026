import { Fragment } from 'react'
import { teamFlag } from '../data/flags'
import { useScores, type ScoreInfo } from '../lib/scores'

// Renders a "Team A vs Team B" label with a flag prefixed to each known side.
// Knockout placeholders ("Winner C vs Runner-up F") simply render without flags.
//
// When `matchId` is given and that match has a live/finished score, the " vs "
// separator becomes the scoreline (e.g. "2 – 1") and a LIVE/FT badge is appended.
export default function MatchTeams({ t, matchId }: { t: string; matchId?: string }) {
  const scores = useScores()
  const sides = t.split(' vs ')
  const score = matchId ? scores[matchId] : undefined
  const showScore = !!score && sides.length === 2

  // For KO matches, scores are keyed by team name to avoid alignment issues when
  // ESPN's home/away order differs from the app's display order (matchSides).
  // Fall back to positional home/away for group stage matches.
  const goalsHome = score?.teamScores ? (score.teamScores[sides[0]] ?? 0) : (score?.home ?? 0)
  const goalsAway = score?.teamScores ? (score.teamScores[sides[1]] ?? 0) : (score?.away ?? 0)

  return (
    <>
      {sides.map((side, i) => {
        const flag = teamFlag(side)
        return (
          <Fragment key={i}>
            {i > 0 &&
              (showScore ? (
                <span className="mt-score">
                  {goalsHome}<span className="mt-dash">–</span>{goalsAway}
                </span>
              ) : (
                <span className="mt-vs"> vs </span>
              ))}
            {flag && <span className="mt-flag">{flag}</span>}
            {side}
          </Fragment>
        )
      })}
      {showScore && <ScoreBadge score={score!} />}
    </>
  )
}

function ScoreBadge({ score }: { score: ScoreInfo }) {
  if (score.state === 'in') {
    return (
      <span className="mt-live">
        <span className="mt-live-dot" aria-hidden />
        {score.clock || 'LIVE'}
      </span>
    )
  }
  // Finished.
  return <span className="mt-ft">{score.detail || 'FT'}</span>
}
