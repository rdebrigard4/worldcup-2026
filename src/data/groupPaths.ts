import { r32MatchById } from '../lib/matches'

// Where each group's winner (w) and runner-up (ru) land in the Round of 32.
type Path = { wMatch: string; ruMatch: string }

export const GROUP_PATHS: Record<string, Path> = {
  A: { wMatch: 'r32g', ruMatch: 'r32a' },
  B: { wMatch: 'r32m', ruMatch: 'r32a' },
  C: { wMatch: 'r32b', ruMatch: 'r32d' },
  D: { wMatch: 'r32j', ruMatch: 'r32n' },
  E: { wMatch: 'r32c', ruMatch: 'r32e' },
  F: { wMatch: 'r32d', ruMatch: 'r32b' },
  G: { wMatch: 'r32i', ruMatch: 'r32n' },
  H: { wMatch: 'r32k', ruMatch: 'r32o' },
  I: { wMatch: 'r32f', ruMatch: 'r32e' },
  J: { wMatch: 'r32o', ruMatch: 'r32k' },
  K: { wMatch: 'r32p', ruMatch: 'r32l' },
  L: { wMatch: 'r32h', ruMatch: 'r32l' },
}

/** The opponent a group's winner/runner-up meets in the R32 (e.g. "Runner-up B"). */
export function opponentFor(group: string, slot: 'w' | 'ru'): string {
  const path = GROUP_PATHS[group]
  if (!path) return ''
  const m = r32MatchById(slot === 'w' ? path.wMatch : path.ruMatch)
  if (!m) return ''
  const self = (slot === 'w' ? 'Winner ' : 'Runner-up ') + group
  const sides = m.t.split(' vs ')
  return sides.find((s) => s !== self) ?? sides[1] ?? sides[0]
}

/** The host city of that R32 match. */
export function venueCityFor(group: string, slot: 'w' | 'ru'): string {
  const path = GROUP_PATHS[group]
  if (!path) return ''
  const m = r32MatchById(slot === 'w' ? path.wMatch : path.ruMatch)
  if (!m) return ''
  const parts = m.v.split(' · ')
  return parts[1] ?? parts[0] ?? ''
}
