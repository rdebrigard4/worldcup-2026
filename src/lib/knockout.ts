import { GROUPS, type Group, type Match } from '../data/schedule'
import { computeStandings } from './standings'
import { teamFlag } from '../data/flags'
import type { ScoreInfo } from './scores'

// Resolves the knockout bracket. Two sources, in priority order:
//   1. ESPN's live knockout team assignments (useKnockoutTeams) — authoritative,
//      and the ONLY source for third-placed teams (their R32 slots follow FIFA's
//      official combination table, which ESPN computes for us) and for downstream
//      winners as games are played.
//   2. Group standings (computeStandings) — a fast fallback for group
//      winners/runners-up before the ESPN assignment feed has loaded.
//
// Structure (BRACKET_FEEDS / MATCH_NO) is the official 2026 bracket, verified
// against BOTH ESPN's live R16/QF linkage and FIFA match numbers 73–104.
// NOTE: FIFA match numbers are NOT in kickoff order, and ESPN's
// "Round of 32 N Winner" labels use the FIFA number (N = match# − 72), not the
// kickoff order — getting this wrong scrambles the R16 pairings.

/** Each knockout match → the two earlier match ids whose winners contest it,
 *  in ESPN home/away order. */
export const BRACKET_FEEDS: Record<string, [string, string]> = {
  // Round of 16 (M## in ESPN/FIFA order = "Winner Mx vs Winner My")
  r16a: ['r32a', 'r32d'], // M90 = W73 vs W75
  r16b: ['r32c', 'r32f'], // M89 = W74 vs W77  (Germany game vs France game)
  r16c: ['r32b', 'r32e'], // M91 = W76 vs W78
  r16d: ['r32g', 'r32h'], // M92 = W79 vs W80
  r16e: ['r32l', 'r32k'], // M93 = W83 vs W84
  r16f: ['r32j', 'r32i'], // M94 = W81 vs W82
  r16g: ['r32o', 'r32n'], // M95 = W86 vs W88
  r16h: ['r32m', 'r32p'], // M96 = W85 vs W87
  // Quarterfinals
  qf1: ['r16b', 'r16a'], // M97 = W89 vs W90
  qf2: ['r16e', 'r16f'], // M98 = W93 vs W94
  qf3: ['r16c', 'r16d'], // M99 = W91 vs W92
  qf4: ['r16g', 'r16h'], // M100 = W95 vs W96
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

const isRealTeam = (s: string): boolean => !!teamFlag((s ?? '').trim())

/** A group is "decided" once all six of its matches are finished. */
function groupDecided(group: Group, scores: Record<string, ScoreInfo>): boolean {
  return group.matches.every((m) => scores[m.id]?.state === 'post')
}

/** Map of placeholder label → resolved team, for every decided group.
 *  Keys look like "Winner A" and "Runner-up A". Fallback before ESPN loads. */
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

/** ESPN's two team names for a match, aligned to the app's "A vs B" side order.
 *  Real teams only (placeholders → null). For R32 we align by identity using the
 *  known group winner/runner-up so a third-placed team lands on the right side
 *  even if ESPN flips home/away; later rounds align by position. */
function alignTeams(
  m: Match,
  koPair: [string, string] | undefined,
  slots: Record<string, string>,
): [string | null, string | null] {
  if (!koPair) return [null, null]
  const reals: (string | null)[] = koPair.map((n) => (isRealTeam(n) ? n.trim() : null))
  if (!m.id.startsWith('r32')) return [reals[0], reals[1]] // R16+ : position order

  const [l0, l1] = m.t.split(' vs ').map((s) => s.trim())
  const known0 = slots[l0] // group winner/runner-up if its group is decided
  const known1 = slots[l1]
  const out: [string | null, string | null] = [null, null]
  const list = reals.filter((t): t is string => !!t)
  // Place teams that match a known group slot.
  for (const t of list) {
    if (t === known0) out[0] = t
    else if (t === known1) out[1] = t
  }
  // Place the remaining team (a third-placed team) into the open non-group side.
  for (const t of list) {
    if (out.includes(t)) continue
    if (!out[0] && !known0) out[0] = t
    else if (!out[1] && !known1) out[1] = t
    else if (!out[0]) out[0] = t
    else if (!out[1]) out[1] = t
  }
  return out
}

/** One side of a bracket card: a real team, or a placeholder label. */
export type Side = { team: string } | { label: string }

export const isTeamSide = (s: Side): s is { team: string } => 'team' in s

/** The two sides of a knockout match for display, resolving ESPN assignments
 *  then group slots, and falling back to the structural placeholder ("Best 3rd
 *  (…)", "Winner L", or "Winner M89" for later rounds). */
export function matchSides(
  m: Match,
  slots: Record<string, string>,
  koTeams: Record<string, [string, string]>,
): [Side, Side] {
  const [a0, a1] = alignTeams(m, koTeams[m.id], slots)
  const labels = m.t.split(' vs ').map((s) => s.trim())
  const feeds = BRACKET_FEEDS[m.id]
  const sideFor = (i: 0 | 1, aligned: string | null): Side => {
    if (aligned) return { team: aligned }
    const lbl = labels[i] ?? ''
    const grp = slots[lbl]
    if (grp) return { team: grp }
    if (feeds) return { label: `Winner M${MATCH_NO[feeds[i]] ?? '?'}` }
    return { label: lbl }
  }
  return [sideFor(0, a0), sideFor(1, a1)]
}
