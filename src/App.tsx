import { lazy, Suspense, useState, type ComponentType } from 'react'
import './App.css'

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
  const ActivePanel = TABS.find((t) => t.id === active)!.Component

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">World Cup 2026</h1>
      </header>

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
