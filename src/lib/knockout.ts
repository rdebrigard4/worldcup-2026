import { GROUPS, type Group, type Match } from '../data/schedule'
import { computeStandings } from './standings'
import type { ScoreInfo } from './scores'

// Resolve the knockout bracket's placeholder slots ("Winner A", "Runner-up B")
// to real teams once a group is decided, using the same live standings the
// Groups tab shows. Lets the Bracket tab populate as the group stage finishes.
//
// NOTE: "Best 3rd (A/B/C/D/F)" slots are intentionally NOT resolved here. Which
// third-placed teams advance, and which R32 match each lands in, follows FIFA's
// official third-place combination table — left as placeholders rather than
// guessed.

/** A group is "decided" once all six of its matches are finished, so the winner
 *  and runner-up are final. We don't try to detect earlier mathematical
 *  clinching — "all played" is simple and always correct. */
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
 *  substituted in. Sides that aren't resolvable yet (other placeholders,
 *  "Best 3rd (…)", undecided groups) are left unchanged. */
export function resolveMatchTeams(m: Match, slots: Record<string, string>): string {
  const sides = m.t.split(' vs ')
  if (sides.length !== 2) return m.t
  return sides.map((s) => slots[s.trim()] ?? s).join(' vs ')
}
