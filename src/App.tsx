import { useState } from 'react'
import Schedule from './tabs/Schedule'
import Groups from './tabs/Groups'
import Bracket from './tabs/Bracket'
import Locations from './tabs/Locations'
import TeamInfo from './tabs/TeamInfo'
import MyTeams from './tabs/MyTeams'
import Favorites from './tabs/Favorites'
import './App.css'

type TabId =
  | 'schedule'
  | 'groups'
  | 'bracket'
  | 'locations'
  | 'teams'
  | 'myteams'
  | 'favorites'

type Tab = {
  id: TabId
  label: string
  blurb: string
}

const TABS: Tab[] = [
  { id: 'schedule', label: 'Schedule', blurb: 'Match fixtures, kickoff times, and live scores will live here.' },
  { id: 'groups', label: 'Groups', blurb: 'Group standings and tables for the group stage.' },
  { id: 'bracket', label: 'Bracket', blurb: 'The knockout-stage bracket from Round of 32 to the Final.' },
  { id: 'locations', label: 'Locations', blurb: 'Host cities, stadiums, and a map of venues.' },
  { id: 'teams', label: 'Team Info', blurb: 'Squads, rosters, and quick facts for each nation.' },
  { id: 'myteams', label: 'My Teams', blurb: 'The teams you follow, surfaced in one place.' },
  { id: 'favorites', label: 'Favorites', blurb: 'Your saved matches, players, and moments.' },
]

export default function App() {
  const [active, setActive] = useState<TabId>('schedule')

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
        {active === 'schedule' ? (
          <Schedule />
        ) : active === 'groups' ? (
          <Groups />
        ) : active === 'bracket' ? (
          <Bracket />
        ) : active === 'locations' ? (
          <Locations />
        ) : active === 'teams' ? (
          <TeamInfo />
        ) : active === 'myteams' ? (
          <MyTeams />
        ) : (
          <Favorites />
        )}
      </main>
    </div>
  )
}
