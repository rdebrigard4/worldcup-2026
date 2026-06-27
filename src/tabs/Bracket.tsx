import { useMemo, useState } from 'react'
import { KNOCKOUT, type Match } from '../data/schedule'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { useSavedMatches } from '../lib/storage'
import { useScores, type ScoreInfo } from '../lib/scores'
import { resolveGroupSlots, resolveMatchTeams, knockoutFeeders, type Feeder } from '../lib/knockout'
import { teamFlag } from '../data/flags'
import MatchTeams from '../components/MatchTeams'
import './Bracket.css'

type Half = 'left' | 'right' | 'final'

const HALF_TABS: { id: Half; label: string }[] = [
  { id: 'left', label: 'Pathway 1 → SF1' },
  { id: 'right', label: 'Pathway 2 → SF2' },
  { id: 'final', label: 'Semifinals & Final' },
]

type Round = { label: string; sub: string; ids: string[] }

function byIds(phase: string, ids: string[]): Match[] {
  const all = KNOCKOUT.find((k) => k.phase === phase)?.matches ?? []
  // Preserve the requested id order (bracket order), not the data order.
  return ids.map((id) => all.find((m) => m.id === id)).filter((m): m is Match => !!m)
}

// Correct bracket order, top-to-bottom, so vertical adjacency reflects the real
// feeding tree (official 2026 FIFA bracket).
const HALVES: Record<'left' | 'right', Round[]> = {
  left: [
    { label: 'Round of 32', sub: 'Jun 28 – Jul 3', ids: ['r32a', 'r32d', 'r32c', 'r32f', 'r32l', 'r32k', 'r32j', 'r32i'] },
    { label: 'Round of 16', sub: 'Jul 4 – 6', ids: ['r16a', 'r16b', 'r16e', 'r16f'] },
    { label: 'Quarterfinals', sub: 'Jul 9 – 10', ids: ['qf1', 'qf2'] },
    { label: 'Semifinal 1', sub: 'Jul 14', ids: ['sf1'] },
  ],
  right: [
    { label: 'Round of 32', sub: 'Jun 28 – Jul 4', ids: ['r32b', 'r32e', 'r32g', 'r32h', 'r32o', 'r32n', 'r32m', 'r32p'] },
    { label: 'Round of 16', sub: 'Jul 5 – 7', ids: ['r16c', 'r16d', 'r16g', 'r16h'] },
    { label: 'Quarterfinals', sub: 'Jul 11', ids: ['qf3', 'qf4'] },
    { label: 'Semifinal 2', sub: 'Jul 15', ids: ['sf2'] },
  ],
}

type Slots = Record<string, string>
type Scores = Record<string, ScoreInfo>

function FeederRow({ f }: { f: Feeder }) {
  if (f.kind === 'team') {
    const flag = teamFlag(f.team)
    return (
      <span className="brd-feed brd-feed--team">
        {flag && <span className="mt-flag">{flag}</span>}
        {f.team}
      </span>
    )
  }
  return <span className="brd-feed brd-feed--ref">{f.text}</span>
}

function BracketCard({
  m,
  slots,
  scores,
  isFinal,
  saved,
  onToggle,
}: {
  m: Match
  slots: Slots
  scores: Scores
  isFinal?: boolean
  saved: boolean
  onToggle: () => void
}) {
  const meta = [fmtKickoffDate(m.k) || m.date, fmtKickoffTime(m.k, false), m.v]
    .filter(Boolean)
    .join(' · ')
  const feeders = knockoutFeeders(m.id, slots, scores)
  return (
    <button
      className={`brd-card${saved ? ' brd-card--saved' : ''}${isFinal ? ' brd-card--final' : ''}`}
      onClick={onToggle}
      aria-pressed={saved}
    >
      <span className="brd-card-top">
        {feeders ? (
          <span className="brd-card-feeds">
            <FeederRow f={feeders[0]} />
            <span className="brd-feed-vs">vs</span>
            <FeederRow f={feeders[1]} />
          </span>
        ) : (
          <span className="brd-card-teams">
            <MatchTeams t={resolveMatchTeams(m, slots)} matchId={m.id} />
          </span>
        )}
        <span className="brd-card-star">{saved ? '★' : '☆'}</span>
      </span>
      <span className="brd-card-meta">{meta}</span>
    </button>
  )
}

export default function Bracket() {
  const [half, setHalf] = useState<Half>('left')
  const { isSaved, toggle } = useSavedMatches()
  const scores = useScores()

  // "Winner A"/"Runner-up B" → real teams for every decided group.
  const slots = useMemo(() => resolveGroupSlots(scores), [scores])

  const sf = useMemo(() => byIds('sf', ['sf1', 'sf2']), [])
  const final = useMemo(() => KNOCKOUT.find((k) => k.phase === 'final')?.matches ?? [], [])

  const card = (m: Match, isFinal?: boolean) => (
    <BracketCard
      key={m.id}
      m={m}
      slots={slots}
      scores={scores}
      isFinal={isFinal}
      saved={isSaved(m.id)}
      onToggle={() => toggle(m.id)}
    />
  )

  return (
    <div className="bracket">
      <p className="bracket-intro">
        Visual knockout bracket — tap any match to save it to Favorites. Each later round shows the
        two matches whose winners meet; teams fill in as groups finish and games are played.
      </p>

      <div className="bracket-tabs">
        {HALF_TABS.map((t) => (
          <button
            key={t.id}
            className={`bracket-tab${half === t.id ? ' bracket-tab--on' : ''}`}
            onClick={() => setHalf(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {half === 'final' ? (
        <div className="bracket-final-view">
          <div className="bracket-final-hdr">Semifinals → Final</div>
          <div className="bracket-final-sfs">
            {sf.map((m) => (
              <div key={m.id} className="bracket-final-sf">{card(m)}</div>
            ))}
          </div>
          <div className="bracket-final-arrow">↓ winners advance ↓</div>
          {final.map((m) => card(m, true))}
          <div className="bracket-final-note">
            🏆 World Cup Final · MetLife Stadium · East Rutherford, NJ · Jul 19
          </div>
        </div>
      ) : (
        <div className="bracket-outer">
          <div className="bracket-canvas">
            {HALVES[half].map((round) => (
              <div key={round.label} className="brd-round">
                <div className="brd-round-hdr">
                  {round.label}
                  <span>{round.sub}</span>
                </div>
                <div className="brd-slots">{byIds(roundPhase(round.label), round.ids).map((m) => card(m))}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Phase key for a round label, used to look matches up in KNOCKOUT. */
function roundPhase(label: string): string {
  if (label.startsWith('Round of 32')) return 'r32'
  if (label.startsWith('Round of 16')) return 'r16'
  if (label.startsWith('Quarter')) return 'qf'
  return 'sf'
}
