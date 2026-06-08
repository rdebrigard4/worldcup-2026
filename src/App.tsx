import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import './App.css'
import { useSettings, FONT_SCALE_MIN, FONT_SCALE_MAX } from './lib/storage'
import {
  TEAMS_WITH_COLORS,
  teamPrimaryColor,
  hexToRgb,
  onAccentColor,
} from './data/venues'

// Tabs are lazy-loaded so each is split into its own chunk. This keeps the heavy
// Leaflet map (Locations) out of the initial bundle — it only downloads when the
// user actually opens that tab.
const Schedule = lazy(() => import('./tabs/Schedule'))
const Groups = lazy(() => import('./tabs/Groups'))
const Bracket = lazy(() => import('./tabs/Bracket'))
const Locations = lazy(() => import('./tabs/Locations'))
const TeamInfo = lazy(() => import('./tabs/TeamInfo'))
const MyTeams = lazy(() => import('./tabs/MyTeams'))
const Favorites = lazy(() => import('./tabs/Favorites'))

type TabId =
  | 'schedule'
  | 'groups'
  | 'bracket'
  | 'locations'
  | 'teams'
  | 'myteams'
  | 'favorites'

type Tab = { id: TabId; label: string; Component: ComponentType }

const TABS: Tab[] = [
  { id: 'schedule', label: 'Schedule', Component: Schedule },
  { id: 'groups', label: 'Groups', Component: Groups },
  { id: 'bracket', label: 'Bracket', Component: Bracket },
  { id: 'locations', label: 'Locations', Component: Locations },
  { id: 'teams', label: 'Team Info', Component: TeamInfo },
  { id: 'myteams', label: 'My Teams', Component: MyTeams },
  { id: 'favorites', label: 'Favorites', Component: Favorites },
]

export default function App() {
  const [active, setActive] = useState<TabId>('schedule')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { settings, toggleTheme, setThemeTeam, bumpFont } = useSettings()
  const ActivePanel = TABS.find((t) => t.id === active)!.Component

  // Push the appearance settings onto <html>: data-theme drives the light/dark
  // palette, the root font-size scales every rem in the app, and (when a team
  // is chosen) the accent variables are overridden inline.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.style.fontSize = `${16 * settings.fontScale}px`
    if (settings.themeTeam) {
      const hex = teamPrimaryColor(settings.themeTeam)
      root.style.setProperty('--accent', hex)
      root.style.setProperty('--accent-rgb', hexToRgb(hex))
      root.style.setProperty('--on-accent', onAccentColor(hex))
    } else {
      root.style.removeProperty('--accent')
      root.style.removeProperty('--accent-rgb')
      root.style.removeProperty('--on-accent')
    }
  }, [settings.theme, settings.fontScale, settings.themeTeam])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">World Cup 2026</h1>
        <button
          className="settings-btn"
          aria-label="Appearance settings"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((o) => !o)}
        >
          ⚙️
        </button>
      </header>

      {settingsOpen && (
        <div className="settings-panel" role="region" aria-label="Appearance settings">
          <div className="setting-row">
            <span className="setting-label">Theme</span>
            <button className="chip" onClick={toggleTheme}>
              {settings.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">Text size</span>
            <div className="font-controls">
              <button
                className="chip"
                aria-label="Decrease text size"
                disabled={settings.fontScale <= FONT_SCALE_MIN}
                onClick={() => bumpFont(-1)}
              >
                A−
              </button>
              <span className="font-pct">{Math.round(settings.fontScale * 100)}%</span>
              <button
                className="chip"
                aria-label="Increase text size"
                disabled={settings.fontScale >= FONT_SCALE_MAX}
                onClick={() => bumpFont(1)}
              >
                A+
              </button>
            </div>
          </div>

          <div className="setting-row">
            <label className="setting-label" htmlFor="theme-team">
              Team color
            </label>
            <select
              id="theme-team"
              className="team-select"
              value={settings.themeTeam ?? ''}
              onChange={(e) => setThemeTeam(e.target.value || null)}
            >
              <option value="">Default (green)</option>
              {TEAMS_WITH_COLORS.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <nav className="tab-bar" aria-label="Sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`chip${tab.id === active ? ' chip--on' : ''}`}
            aria-current={tab.id === active ? 'page' : undefined}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="tab-panel">
        <Suspense fallback={<div className="empty">Loading…</div>}>
          <ActivePanel />
        </Suspense>
      </main>
    </div>
  )
}
