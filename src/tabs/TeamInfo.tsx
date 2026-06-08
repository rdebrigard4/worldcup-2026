import { useEffect, useMemo, useState } from 'react'
import { GROUPS } from '../data/schedule'
import { teamColors, teamPrimaryColor, stripesGradient } from '../data/venues'
import { teamFlag } from '../data/flags'
import { tournamentTeams, groupMatchesForTeam } from '../lib/teamRoutes'
import { fmtKickoffDate, fmtKickoffTime } from '../lib/format'
import { useFavTeams } from '../lib/storage'
import { fetchWikiSummary, fetchTeamFacts, type TeamFacts, type WikiSummary } from '../lib/wiki'
import './TeamInfo.css'

const PICKED_KEY = 'wc2026_tiPicked'

function loadPicked(): string {
  return localStorage.getItem(PICKED_KEY) || ''
}

type Loadable<T> = { state: 'loading' | 'done'; data?: T }

export default function TeamInfo() {
  const [picked, setPicked] = useState<string>(loadPicked)
  // Fetched data is tagged with the team it belongs to; loading is then derived
  // (data is stale → still loading) rather than set synchronously in the effect.
  const [summaryFor, setSummaryFor] = useState<{ team: string; data: WikiSummary } | null>(null)
  const [factsFor, setFactsFor] = useState<{ team: string; data: TeamFacts } | null>(null)
  const { isFav, toggleTeam } = useFavTeams()

  const teams = useMemo(() => tournamentTeams(), [])

  const select = (team: string) => {
    const next = team === picked ? '' : team
    setPicked(next)
    localStorage.setItem(PICKED_KEY, next)
  }

  // Fetch Wikipedia summary + infobox facts whenever the picked team changes.
  // `cancelled` guards against a stale fetch resolving after a fast team switch.
  useEffect(() => {
    if (!picked) return
    let cancelled = false
    fetchWikiSummary(picked).then((data) => {
      if (!cancelled) setSummaryFor({ team: picked, data })
    })
    fetchTeamFacts(picked).then((data) => {
      if (!cancelled) setFactsFor({ team: picked, data })
    })
    return () => {
      cancelled = true
    }
  }, [picked])

  // Data is shown only when it matches the currently picked team; otherwise we're
  // still loading the new selection.
  const summary: Loadable<WikiSummary> =
    summaryFor && summaryFor.team === picked
      ? { state: 'done', data: summaryFor.data }
      : { state: 'loading' }
  const facts: Loadable<TeamFacts> =
    factsFor && factsFor.team === picked
      ? { state: 'done', data: factsFor.data }
      : { state: 'loading' }

  const group = picked ? GROUPS.find((g) => g.teams.includes(picked)) : undefined
  const matches = useMemo(() => (picked ? groupMatchesForTeam(picked) : []), [picked])

  return (
    <div className="teaminfo">
      <div className="ti-picker">
        {teams.map((team) => {
          const on = team === picked
          const c = teamPrimaryColor(team)
          return (
            <button
              key={team}
              className={`loc-chip${on ? ' loc-chip--on' : ''}`}
              style={on ? { borderColor: c, background: `${c}22` } : undefined}
              onClick={() => select(team)}
            >
              <span className="loc-swatch" style={{ background: c }} />
              {team}
            </button>
          )
        })}
      </div>

      {!picked ? (
        <p className="empty">Pick a team above to see their schedule and background.</p>
      ) : (
        <div className="ti-content">
          <header className="ti-header">
            <span className="ti-stripes" style={{ background: stripesGradient(teamColors(picked)) }} />
            <div className="ti-header-body">
              <div className="ti-team-name">
                <span className="ti-flag">{teamFlag(picked)}</span>
                {picked}
              </div>
              <div className="ti-meta">
                {group
                  ? `Group ${group.g} · ${group.teams.filter((t) => t !== picked).join(', ')}`
                  : 'Not in tournament'}
              </div>
            </div>
            <button
              className={`fav-pill${isFav(picked) ? ' fav-pill--on' : ''}`}
              onClick={() => toggleTeam(picked)}
              aria-pressed={isFav(picked)}
            >
              {isFav(picked) ? '★ Following' : '☆ Follow'}
            </button>
          </header>

          <section className="ti-section">
            <h3 className="ti-section-h">Quick Facts</h3>
            <QuickFacts facts={facts} />
          </section>

          {matches.length > 0 && (
            <section className="ti-section">
              <h3 className="ti-section-h">World Cup Matches</h3>
              <div className="ti-matches">
                {matches.map((m) => (
                  <div key={m.id} className="ti-match">
                    <div className="ti-match-date">{fmtKickoffDate(m.k) || m.date}</div>
                    <div className="ti-match-main">
                      <div className="ti-match-teams">{m.t}</div>
                      <div className="ti-match-venue">
                        {group ? `Group ${group.g} · ` : ''}
                        {m.v}
                        {m.c ? ` · ${m.c}` : ''}
                        {fmtKickoffTime(m.k) ? ` · ${fmtKickoffTime(m.k)}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="ti-section">
            <h3 className="ti-section-h">About</h3>
            <About summary={summary} />
          </section>
        </div>
      )}
    </div>
  )
}

const FACT_ROWS: [keyof TeamFacts, string][] = [
  ['coach', 'Head Coach'],
  ['captain', 'Captain'],
  ['fifaCode', 'FIFA Code'],
  ['fifaRank', 'FIFA Rank'],
  ['confederation', 'Confederation'],
  ['association', 'Association'],
  ['wcApps', 'World Cup Appearances'],
  ['wcFirst', 'First World Cup'],
  ['wcBest', 'Best World Cup'],
  ['nicknames', 'Nickname'],
  ['firstGame', 'First Match'],
  ['largestWin', 'Largest Win'],
  ['largestLoss', 'Largest Loss'],
]

function QuickFacts({ facts }: { facts: Loadable<TeamFacts> }) {
  if (facts.state === 'loading') return <div className="ti-loading">Loading…</div>
  const rows = FACT_ROWS.map(([key, label]) => [label, facts.data?.[key]] as const).filter(
    ([, v]) => v && v.length,
  )
  if (!rows.length) return <div className="ti-loading">No structured data available yet.</div>
  return (
    <div className="ti-facts">
      {rows.map(([label, val]) => (
        <div key={label} className="ti-fact">
          <span className="ti-fact-label">{label}</span>
          <span className="ti-fact-val">{val}</span>
        </div>
      ))}
    </div>
  )
}

function About({ summary }: { summary: Loadable<WikiSummary> }) {
  if (summary.state === 'loading') return <div className="ti-loading">Loading from Wikipedia…</div>
  const s = summary.data!
  if (s.error) {
    return (
      <div className="ti-wiki">
        <div className="ti-wiki-body">
          <div className="ti-wiki-desc">Couldn't load Wikipedia overview ({s.error}).</div>
          <a className="ti-wiki-link" href={s.pageUrl} target="_blank" rel="noopener noreferrer">
            Open Wikipedia page →
          </a>
        </div>
      </div>
    )
  }
  return (
    <div className="ti-wiki">
      {s.thumbnail && <img src={s.thumbnail} alt={s.title} />}
      <div className="ti-wiki-body">
        {s.description && <div className="ti-wiki-desc">{s.description}</div>}
        <p>{s.extract || 'No summary available.'}</p>
        <a className="ti-wiki-link" href={s.pageUrl} target="_blank" rel="noopener noreferrer">
          Read more on Wikipedia →
        </a>
      </div>
    </div>
  )
}
