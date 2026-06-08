import { useMemo, useState } from 'react'
import { KNOCKOUT, type Match } from '../data/schedule'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { useSavedMatches } from '../lib/storage'
import MatchTeams from '../components/MatchTeams'
import './Bracket.css'

type Half = 'left' | 'right' | 'final'

const HALF_TABS: { id: Half; label: string }[] = [
  { id: 'left', label: 'Pathway 1 → SF1' },
  { id: 'right', label: 'Pathway 2 → SF2' },
  { id: 'final', label: 'Semifinals & Final' },
]

type Round = { label: string; sub: string; phase: string; matches: Match[] }

function byId(phase: string, ids: string[]): Match[] {
  const all = KNOCKOUT.find((k) => k.phase === phase)?.matches ?? []
  return all.filter((m) => ids.includes(m.id))
}

function BracketCard({
  m,
  isFinal,
  saved,
  onToggle,
}: {
  m: Match
  isFinal?: boolean
  saved: boolean
  onToggle: () => void
}) {
  const meta = [fmtKickoffDate(m.k) || m.date, fmtKickoffTime(m.k, false), m.v]
    .filter(Boolean)
    .join(' · ')
  return (
    <button
      className={`brd-card${saved ? ' brd-card--saved' : ''}${isFinal ? ' brd-card--final' : ''}`}
      onClick={onToggle}
      aria-pressed={saved}
    >
      <span className="brd-card-top">
        <span className="brd-card-teams"><MatchTeams t={m.t} /></span>
        <span className="brd-card-star">{saved ? '★' : '☆'}</span>
      </span>
      <span className="brd-card-meta">{meta}</span>
    </button>
  )
}

export default function Bracket() {
  const [half, setHalf] = useState<Half>('left')
  const { isSaved, toggle } = useSavedMatches()

  const r32 = useMemo(() => KNOCKOUT.find((k) => k.phase === 'r32')?.matches ?? [], [])

  const halves: Record<'left' | 'right', Round[]> = useMemo(
    () => ({
      left: [
        { label: 'Round of 32', sub: 'Jun 28 – Jul 3', phase: 'r32', matches: r32.slice(0, 8) },
        { label: 'Round of 16', sub: 'Jul 4 – 7', phase: 'r16', matches: byId('r16', ['r16a', 'r16b', 'r16c', 'r16d']) },
        { label: 'Quarterfinals', sub: 'Jul 9 – 11', phase: 'qf', matches: byId('qf', ['qf1', 'qf2']) },
        { label: 'Semifinal', sub: 'Jul 14', phase: 'sf', matches: byId('sf', ['sf1']) },
      ],
      right: [
        { label: 'Round of 32', sub: 'Jun 28 – Jul 3', phase: 'r32', matches: r32.slice(8, 16) },
        { label: 'Round of 16', sub: 'Jul 4 – 7', phase: 'r16', matches: byId('r16', ['r16e', 'r16f', 'r16g', 'r16h']) },
        { label: 'Quarterfinals', sub: 'Jul 9 – 11', phase: 'qf', matches: byId('qf', ['qf3', 'qf4']) },
        { label: 'Semifinal', sub: 'Jul 15', phase: 'sf', matches: byId('sf', ['sf2']) },
      ],
    }),
    [r32],
  )

  const sf = useMemo(() => KNOCKOUT.find((k) => k.phase === 'sf')?.matches ?? [], [])
  const final = useMemo(() => KNOCKOUT.find((k) => k.phase === 'final')?.matches ?? [], [])

  return (
    <div className="bracket">
      <p className="bracket-intro">
        Visual knockout bracket — tap any match to save it to Favorites. Split into two pathways
        plus the Final. Opponents are confirmed after the group stage.
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
              <div key={m.id} className="bracket-final-sf">
                <BracketCard m={m} saved={isSaved(m.id)} onToggle={() => toggle(m.id)} />
              </div>
            ))}
          </div>
          <div className="bracket-final-arrow">↓ winners advance ↓</div>
          {final.map((m) => (
            <BracketCard key={m.id} m={m} isFinal saved={isSaved(m.id)} onToggle={() => toggle(m.id)} />
          ))}
          <div className="bracket-final-note">
            🏆 World Cup Final · MetLife Stadium · East Rutherford, NJ · Jul 19
          </div>
        </div>
      ) : (
        <div className="bracket-outer">
          <div className="bracket-canvas">
            {halves[half].map((round) => (
              <div key={round.label} className="brd-round">
                <div className="brd-round-hdr">
                  {round.label}
                  <span>{round.sub}</span>
                </div>
                <div className="brd-slots">
                  {round.matches.map((m) => (
                    <BracketCard key={m.id} m={m} saved={isSaved(m.id)} onToggle={() => toggle(m.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
