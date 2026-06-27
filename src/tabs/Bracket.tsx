import { useMemo } from 'react'
import { KNOCKOUT, type Match } from '../data/schedule'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { useSavedMatches } from '../lib/storage'
import { useScores, useKnockoutTeams } from '../lib/scores'
import { resolveGroupSlots, matchSides, isTeamSide, type Side } from '../lib/knockout'
import { teamFlag } from '../data/flags'
import MatchTeams from '../components/MatchTeams'
import './Bracket.css'

type Round = { label: string; sub: string; phase: string; ids: string[] }

// Each half's columns, top-to-bottom, in real feeding order (verified against
// ESPN's live linkage + official FIFA numbers). The full bracket renders the
// left half flowing right → Final → the right half flowing left (mirrored).
const LEFT: Round[] = [
  { label: 'Round of 32', sub: 'Jun 28 – Jul 2', phase: 'r32', ids: ['r32a', 'r32c', 'r32b', 'r32e', 'r32k', 'r32l', 'r32i', 'r32j'] },
  { label: 'Round of 16', sub: 'Jul 4 – 6', phase: 'r16', ids: ['r16a', 'r16b', 'r16e', 'r16f'] },
  { label: 'Quarterfinals', sub: 'Jul 9 – 10', phase: 'qf', ids: ['qf1', 'qf2'] },
  { label: 'Semifinal 1', sub: 'Jul 14', phase: 'sf', ids: ['sf1'] },
]
const RIGHT: Round[] = [
  { label: 'Round of 32', sub: 'Jun 30 – Jul 4', phase: 'r32', ids: ['r32d', 'r32f', 'r32g', 'r32h', 'r32n', 'r32p', 'r32m', 'r32o'] },
  { label: 'Round of 16', sub: 'Jul 5 – 7', phase: 'r16', ids: ['r16c', 'r16d', 'r16g', 'r16h'] },
  { label: 'Quarterfinals', sub: 'Jul 11', phase: 'qf', ids: ['qf3', 'qf4'] },
  { label: 'Semifinal 2', sub: 'Jul 15', phase: 'sf', ids: ['sf2'] },
]

function matchById(phase: string, id: string): Match | undefined {
  return KNOCKOUT.find((k) => k.phase === phase)?.matches.find((m) => m.id === id)
}

type Slots = Record<string, string>
type KoTeams = Record<string, [string, string]>

function SideRow({ s }: { s: Side }) {
  if (isTeamSide(s)) {
    const flag = teamFlag(s.team)
    return (
      <span className="brd-feed brd-feed--team">
        {flag && <span className="mt-flag">{flag}</span>}
        {s.team}
      </span>
    )
  }
  return <span className="brd-feed brd-feed--ref">{s.label}</span>
}

function BracketCard({
  m,
  slots,
  koTeams,
  isFinal,
  saved,
  onToggle,
}: {
  m: Match
  slots: Slots
  koTeams: KoTeams
  isFinal?: boolean
  saved: boolean
  onToggle: () => void
}) {
  const meta = [fmtKickoffDate(m.k) || m.date, fmtKickoffTime(m.k, false), m.v]
    .filter(Boolean)
    .join(' · ')
  const [s0, s1] = matchSides(m, slots, koTeams)
  const bothTeams = isTeamSide(s0) && isTeamSide(s1)
  return (
    <button
      className={`brd-card${saved ? ' brd-card--saved' : ''}${isFinal ? ' brd-card--final' : ''}`}
      onClick={onToggle}
      aria-pressed={saved}
    >
      <span className="brd-card-top">
        {bothTeams ? (
          <span className="brd-card-teams">
            <MatchTeams t={`${(s0 as { team: string }).team} vs ${(s1 as { team: string }).team}`} matchId={m.id} />
          </span>
        ) : (
          <span className="brd-card-feeds">
            <SideRow s={s0} />
            <span className="brd-feed-vs">vs</span>
            <SideRow s={s1} />
          </span>
        )}
        <span className="brd-card-star">{saved ? '★' : '☆'}</span>
      </span>
      <span className="brd-card-meta">{meta}</span>
    </button>
  )
}

function Column({
  round,
  side,
  render,
}: {
  round: Round
  side: 'left' | 'right'
  render: (m: Match) => React.ReactNode
}) {
  const matches = round.ids.map((id) => matchById(round.phase, id)).filter((m): m is Match => !!m)
  return (
    <div className={`brd-round brd-round--${side}`}>
      <div className="brd-round-hdr">
        {round.label}
        <span>{round.sub}</span>
      </div>
      <div className="brd-slots">{matches.map(render)}</div>
    </div>
  )
}

export default function Bracket() {
  const { isSaved, toggle } = useSavedMatches()
  const scores = useScores()
  const koTeams = useKnockoutTeams()

  // Group winner/runner-up fallback (used until ESPN assignments load).
  const slots = useMemo(() => resolveGroupSlots(scores), [scores])

  const final = useMemo(() => matchById('final', 'fin'), [])

  const card = (m: Match, isFinal?: boolean) => (
    <BracketCard
      key={m.id}
      m={m}
      slots={slots}
      koTeams={koTeams}
      isFinal={isFinal}
      saved={isSaved(m.id)}
      onToggle={() => toggle(m.id)}
    />
  )

  return (
    <div className="bracket">
      <p className="bracket-intro">
        Full knockout bracket — both halves converge on the Final in the center. Swipe sideways to
        follow a path. Tap any match to save it to Favorites; teams fill in as games are played.
      </p>

      <div className="bracket-outer">
        <div className="bracket-canvas bracket-canvas--full">
          {LEFT.map((round) => (
            <Column key={`l-${round.label}`} round={round} side="left" render={(m) => card(m)} />
          ))}

          <div className="brd-round brd-round--final-col">
            <div className="brd-round-hdr">
              Final
              <span>Jul 19</span>
            </div>
            <div className="brd-slots brd-slots--center">
              {final && card(final, true)}
              <div className="brd-final-cap">🏆 MetLife Stadium · East Rutherford, NJ</div>
            </div>
          </div>

          {[...RIGHT].reverse().map((round) => (
            <Column key={`r-${round.label}`} round={round} side="right" render={(m) => card(m)} />
          ))}
        </div>
      </div>
    </div>
  )
}
