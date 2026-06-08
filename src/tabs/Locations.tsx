import { Fragment, useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GROUPS } from '../data/schedule'
import { VENUES, teamPrimaryColor, stadiumKey } from '../data/venues'
import { groupMatchesForTeam, koPotentialsForTeam, tournamentTeams } from '../lib/teamRoutes'
import './Locations.css'

const PICKED_KEY = 'wc2026_locPicked'

type Badge = { team: string; index: number; color: string }
type VenueState = {
  name: string
  lat: number
  lng: number
  city: string
  teams: string[] // group matches here
  potentials: string[] // KO might be here
  badges: Badge[]
}
type Route = { color: string; groupPoints: LatLngExpression[]; koLines: [LatLngExpression, LatLngExpression][] }

function loadPicked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PICKED_KEY) || '[]')
  } catch {
    return []
  }
}

export default function Locations() {
  const [picked, setPicked] = useState<string[]>(loadPicked)

  useEffect(() => {
    localStorage.setItem(PICKED_KEY, JSON.stringify(picked))
  }, [picked])

  const togglePick = (team: string) =>
    setPicked((prev) => (prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]))

  const teams = useMemo(() => tournamentTeams(), [])

  // Build per-venue state and per-team routes from the current selection.
  const { venues, routes } = useMemo(() => {
    const vTeams: Record<string, Set<string>> = {}
    const vPotentials: Record<string, Set<string>> = {}
    const vBadges: Record<string, Badge[]> = {}
    const routes: Route[] = []

    picked.forEach((team) => {
      const color = teamPrimaryColor(team)
      const gMatches = groupMatchesForTeam(team)

      gMatches.forEach((m, i) => {
        const v = stadiumKey(m.v)
        if (!VENUES[v]) return
        ;(vTeams[v] ??= new Set()).add(team)
        ;(vBadges[v] ??= []).push({ team, index: i + 1, color })
      })
      koPotentialsForTeam(team).forEach((m) => {
        const v = stadiumKey(m.v)
        if (!VENUES[v]) return
        ;(vPotentials[v] ??= new Set()).add(team)
      })

      // Route geometry
      const groupPoints = gMatches
        .map((m) => VENUES[stadiumKey(m.v)])
        .filter(Boolean)
        .map((info) => [info.lat, info.lng] as LatLngExpression)
      const koLines: [LatLngExpression, LatLngExpression][] = []
      if (groupPoints.length) {
        const last = groupPoints[groupPoints.length - 1]
        koPotentialsForTeam(team).forEach((m) => {
          const info = VENUES[stadiumKey(m.v)]
          if (info) koLines.push([last, [info.lat, info.lng]])
        })
      }
      routes.push({ color, groupPoints, koLines })
    })

    const venues: VenueState[] = Object.entries(VENUES).map(([name, info]) => ({
      name,
      lat: info.lat,
      lng: info.lng,
      city: info.city,
      teams: [...(vTeams[name] ?? [])],
      potentials: [...(vPotentials[name] ?? [])],
      badges: vBadges[name] ?? [],
    }))

    return { venues, routes }
  }, [picked])

  return (
    <div className="locations">
      <div className="loc-picker">
        {teams.map((team) => {
          const on = picked.includes(team)
          const c = teamPrimaryColor(team)
          return (
            <button
              key={team}
              className={`loc-chip${on ? ' loc-chip--on' : ''}`}
              style={on ? { borderColor: c, background: `${c}22` } : undefined}
              onClick={() => togglePick(team)}
            >
              <span className="loc-swatch" style={{ background: c }} />
              {team}
            </button>
          )
        })}
      </div>

      <div className="loc-map-wrap">
        <MapContainer
          center={[37, -96]}
          zoom={3.6}
          zoomSnap={0.5}
          scrollWheelZoom={false}
          className="loc-map"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="© OpenStreetMap, © CARTO"
            maxZoom={8}
          />

          {venues.map((v) => {
            const playing = v.teams.length > 0
            const potential = !playing && v.potentials.length > 0
            const fill = playing
              ? teamPrimaryColor(v.teams[0])
              : potential
                ? teamPrimaryColor(v.potentials[0])
                : '#666'
            const radius = playing ? 10 : potential ? 8 : 6
            const weight = playing ? 2.5 : potential ? 2 : 1.5
            const fillOpacity = playing ? 1 : potential ? 0.7 : 0.85
            return (
              <CircleMarker
                key={v.name}
                center={[v.lat, v.lng]}
                radius={radius}
                pathOptions={{ color: '#fff', fillColor: fill, weight, fillOpacity }}
              >
                <Popup>
                  <strong>{v.name}</strong>
                  <br />
                  {v.city}
                  {v.teams.length > 0 && (
                    <>
                      <br />
                      <span className="loc-pop-playing">Playing: {v.teams.join(', ')}</span>
                    </>
                  )}
                  {v.potentials.length > 0 && (
                    <>
                      <br />
                      <span className="loc-pop-ko">Possible KO: {v.potentials.join(', ')}</span>
                    </>
                  )}
                </Popup>
                {v.badges.length > 0 && (
                  <Tooltip permanent direction="top" offset={[0, -radius - 2]} className="badge-stack">
                    <span className="city-badges">
                      {v.badges.map((b, i) => (
                        <span
                          key={i}
                          className="city-badge"
                          style={{ background: b.color }}
                          title={`${b.team} – Match ${b.index}`}
                        >
                          {b.index}
                        </span>
                      ))}
                    </span>
                  </Tooltip>
                )}
              </CircleMarker>
            )
          })}

          {routes.map((r, i) => (
            <Fragment key={i}>
              {r.groupPoints.length >= 2 && (
                <Polyline positions={r.groupPoints} pathOptions={{ color: r.color, weight: 3, opacity: 0.85 }} />
              )}
              {r.koLines.map((line, j) => (
                <Polyline
                  key={j}
                  positions={line}
                  pathOptions={{ color: r.color, weight: 2, opacity: 0.55, dashArray: '6,8' }}
                />
              ))}
            </Fragment>
          ))}
        </MapContainer>
      </div>

      <div className="loc-legend">
        <div className="loc-key">
          <span className="key-item">
            <span className="key-line" /> Group-stage route
          </span>
          <span className="key-item">
            <span className="key-line key-line--dashed" /> Possible knockout venues
          </span>
          <span className="key-item">
            <span className="city-badge city-badge--key">1</span> Match order at each venue
          </span>
        </div>
        {picked.length === 0 ? (
          <p className="loc-hint">Tap a team above to map its route through the tournament.</p>
        ) : (
          <div className="loc-picks">
            {picked.map((t) => {
              const g = GROUPS.find((grp) => grp.teams.includes(t))
              return (
                <span key={t} className="loc-pick">
                  <span className="loc-pick-dot" style={{ background: teamPrimaryColor(t) }} />
                  {t}
                  {g ? ` · Group ${g.g}` : ''}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
