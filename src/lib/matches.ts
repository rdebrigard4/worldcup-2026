import { GROUPS, KNOCKOUT, type Match } from '../data/schedule'

// Shared match lookups used by Favorites (resolve saved ids → match details),
// the group-path helpers, and the Locations tab.

export type LocatedMatch = { m: Match; phase: string; grp?: string }

/** Sort comparator by kickoff time, earliest first. */
export const byKickoff = (a: Match, b: Match): number => +new Date(a.k) - +new Date(b.k)

/** "Venue · City" meta line for a match, omitting any blank parts.
 *  (Kickoff time is rendered separately, in the row's left rail.) */
export function matchMeta(m: Match): string {
  return [m.v, m.c].filter(Boolean).join(' · ')
}

/** Every match across group + knockout stages, tagged with its phase. */
export function allMatches(): LocatedMatch[] {
  const out: LocatedMatch[] = []
  GROUPS.forEach((g) => g.matches.forEach((m) => out.push({ m, phase: 'group', grp: g.g })))
  KNOCKOUT.forEach((k) => k.matches.forEach((m) => out.push({ m, phase: k.phase })))
  return out
}

/** Find a match (and its phase) by id, searching every stage. */
export function findMatchById(id: string): LocatedMatch | null {
  for (const g of GROUPS) {
    const m = g.matches.find((x) => x.id === id)
    if (m) return { m, phase: 'group', grp: g.g }
  }
  for (const k of KNOCKOUT) {
    const m = k.matches.find((x) => x.id === id)
    if (m) return { m, phase: k.phase }
  }
  return null
}

/** A specific Round-of-32 match by id. */
export function r32MatchById(id: string): Match | undefined {
  return KNOCKOUT.find((k) => k.phase === 'r32')?.matches.find((m) => m.id === id)
}
