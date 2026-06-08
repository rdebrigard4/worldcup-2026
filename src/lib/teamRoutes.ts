import { GROUPS, type Match } from '../data/schedule'
import { GROUP_PATHS } from '../data/groupPaths'
import { byKickoff, r32MatchById } from './matches'

// Where a team travels: its group-stage matches in order, plus the two R32
// venues its group could feed into (winner + runner-up paths).

/** A team's group-stage matches, chronological. */
export function groupMatchesForTeam(team: string): Match[] {
  const out: Match[] = []
  GROUPS.forEach((g) => {
    if (!g.teams.includes(team)) return
    g.matches.forEach((m) => {
      if (m.t.includes(team)) out.push(m)
    })
  })
  return out.sort(byKickoff)
}

/** The R32 matches a team could reach (its group's winner + runner-up slots). */
export function koPotentialsForTeam(team: string): Match[] {
  const g = GROUPS.find((grp) => grp.teams.includes(team))
  if (!g) return []
  const path = GROUP_PATHS[g.g]
  if (!path) return []
  const out: Match[] = []
  const w = r32MatchById(path.wMatch)
  if (w) out.push(w)
  const ru = r32MatchById(path.ruMatch)
  if (ru) out.push(ru)
  return out
}

/** All teams in the tournament, sorted alphabetically. */
export function tournamentTeams(): string[] {
  const set = new Set<string>()
  GROUPS.forEach((g) => g.teams.forEach((t) => set.add(t)))
  return [...set].sort()
}
