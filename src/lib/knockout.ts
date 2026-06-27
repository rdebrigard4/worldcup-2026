import { GROUPS, type Group, type Match } from '../data/schedule'
import { computeStandings } from './standings'
import { findMatchById } from './matches'
import { teamFlag } from '../data/flags'
import type { ScoreInfo } from './scores'

// Resolves the knockout bracket: group-stage placeholders ("Winner A",
// "Runner-up B") to real teams, and the downstream tree (R16 → QF → SF → Final)
// to the actual feeding matches and their winners.
//
// Structure is the official 2026 FIFA bracket. The app's R32 ids map to the
// official match numbers by venue + slot:
//   r32a=M73 r32b=M76 r32c=M74 r32d=M75 r32e=M78 r32f=M77 r32g=M79 r32h=M80
//   r32i=M82 r32j=M81 r32k=M84 r32l=M83 r32m=M85 r32n=M88 r32o=M86 r32p=M87
//
// NOTE: "Best 3rd (A/B/C/D/F)" R32 slots are NOT resolved — which third-placed
// teams advance, and which match each lands in, needs FIFA's official
// third-place combination table. Left as placeholders rather than guessed.

/** Each knockout match → the two earlier match ids whose winners contest it. */
export const BRACKET_FEEDS: Record<string, [string, string]> = {
  // Round of 16 (winners of two Round-of-32 matches)
  r16a: ['r32a', 'r32d'], // M90
  r16b: ['r32c', 'r32f'], // M89
  r16c: ['r32b', 'r32e'], // M91
  r16d: ['r32g', 'r32h'], // M92
  r16e: ['r32l', 'r32k'], // M93
  r16f: ['r32j', 'r32i'], // M94
  r16g: ['r32o', 'r32n'], // M95
  r16h: ['r32m', 'r32p'], // M96
  // Quarterfinals
  qf1: ['r16a', 'r16b'], // M97
  qf2: ['r16e', 'r16f'], // M98
  qf3: ['r16c', 'r16d'], // M99
  qf4: ['r16g', 'r16h'], // M100
  // Semifinals
  sf1: ['qf1', 'qf2'], // M101
  sf2: ['qf3', 'qf4'], // M102
  // Final & third place
  fin: ['sf1', 'sf2'], // M104 (winners)
  tp1: ['sf1', 'sf2'], // M103 (losers)
}

/** Official FIFA match number, for compact "Winner M89" references. */
export const MATCH_NO: Record<string, number> = {
  r32a: 73, r32b: 76, r32c: 74, r32d: 75, r32e: 78, r32f: 77, r32g: 79, r32h: 80,
  r32i: 82, r32j: 81, r32k: 84, r32l: 83, r32m: 85, r32n: 88, r32o: 86, r32p: 87,
  r16a: 90, r16b: 89, r16c: 91, r16d: 92, r16e: 93, r16f: 94, r16g: 95, r16h: 96,
  qf1: 97, qf2: 98, qf3: 99, qf4: 100, sf1: 101, sf2: 102, tp1: 103, fin: 104,
}

const isRealTeam = (s: string): boolean => !!teamFlag(s.trim())

/** A group is "decided" once all six of its matches are finished. */
function groupDecided(group: Group, scores: Record<string, ScoreInfo>): boolean {
  return group.matches.every((m) => scores[m.id]?.state === 'post')
}

/** Map of placeholder label → resolved team, for every decided group.
 *  Keys look like "Winner A" and "Runner-up A". */
export function resolveGroupSlots(scores: Record<string, ScoreInfo>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const g of GROUPS) {
    if (!groupDecided(g, scores)) continue
    const table = computeStandings(g, scores)
    if (table.length < 2) continue
    out[`Winner ${g.g}`] = table[0].team
    out[`Runner-up ${g.g}`] = table[1].team
  }
  return out
}

/** A match's "A vs B" string with any decided group winners/runners-up
 *  substituted in. Sides that aren't resolvable yet are left unchanged. */
export function resolveMatchTeams(m: Match, slots: Record<string, string>): string {
  const sides = m.t.split(' vs ')
  if (sides.length !== 2) return m.t
  return sides.map((s) => slots[s.trim()] ?? s).join(' vs ')
}

/** The two real teams (or null) contesting a match id, resolving group slots
 *  for R32 and recursing through the tree for later rounds. */
function sidesOf(
  id: string,
  slots: Record<string, string>,
  scores: Record<string, ScoreInfo>,
): [string | null, string | null] {
  const feeds = BRACKET_FEEDS[id]
  if (feeds) {
    return [winnerOf(feeds[0], slots, scores), winnerOf(feeds[1], slots, scores)]
  }
  // R32 (or any direct matchup): resolve from group slots.
  const m = findMatchById(id)?.m
  if (!m) return [null, null]
  const parts = resolveMatchTeams(m, slots).split(' vs ')
  return [
    isRealTeam(parts[0] ?? '') ? parts[0].trim() : null,
    isRealTeam(parts[1] ?? '') ? parts[1].trim() : null,
  ]
}

/** The team that advanced from a match id, or null if not yet known. */
export function winnerOf(
  id: string,
  slots: Record<string, string>,
  scores: Record<string, ScoreInfo>,
): string | null {
  const sc = scores[id]
  if (!sc || sc.state !== 'post') return null
  const [a, b] = sidesOf(id, slots, scores)
  if (sc.winner === 'home') return a
  if (sc.winner === 'away') return b
  // Fall back to goals if the winner flag is absent (level → unknown).
  if (sc.home > sc.away) return a
  if (sc.away > sc.home) return b
  return null
}

/** How one side of a knockout card should display. `id` is the source match. */
export type Feeder =
  | { kind: 'team'; team: string; id: string } // winner decided → show the team
  | { kind: 'ref'; text: string; id: string } // not yet decided → "Winner M89"

function feederFor(
  id: string,
  slots: Record<string, string>,
  scores: Record<string, ScoreInfo>,
): Feeder {
  // Only show a real team once its feeding match is actually decided. Until
  // then the bracket's column layout conveys the path — we don't name teams
  // that haven't advanced yet.
  const win = winnerOf(id, slots, scores)
  if (win) return { kind: 'team', team: win, id }
  return { kind: 'ref', text: `Winner M${MATCH_NO[id] ?? '?'}`, id }
}

/** The two feeders contesting a knockout match (R16 and later), for display.
 *  Returns null for matches that have no feeders (R32 / group stage). */
export function knockoutFeeders(
  id: string,
  slots: Record<string, string>,
  scores: Record<string, ScoreInfo>,
): [Feeder, Feeder] | null {
  const feeds = BRACKET_FEEDS[id]
  if (!feeds) return null
  return [feederFor(feeds[0], slots, scores), feederFor(feeds[1], slots, scores)]
}
