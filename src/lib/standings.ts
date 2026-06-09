import type { Group } from '../data/schedule'
import type { ScoreInfo } from './scores'

// Live group standings, computed from whatever scores exist so far. Started
// matches (state 'in' or 'post') count toward the table, so it updates in real
// time as goals go in. Before any kickoff every row is 0 and teams stay in
// seeded order — i.e. identical to the static listing.

export type Standing = {
  team: string
  p: number // played
  w: number
  d: number
  l: number
  gf: number // goals for
  ga: number // goals against
  gd: number // goal difference
  pts: number
}

/** Standings for one group, sorted best-first. Tiebreak: points → GD → GF →
 *  seeded order. (Head-to-head / fair-play are not applied — a deliberate
 *  simplification for a personal tracker.) */
export function computeStandings(group: Group, scores: Record<string, ScoreInfo>): Standing[] {
  const rows = new Map<string, Standing>()
  const seed = new Map<string, number>()
  group.teams.forEach((t, i) => {
    rows.set(t, { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 })
    seed.set(t, i)
  })

  for (const m of group.matches) {
    const sc = scores[m.id]
    if (!sc || sc.state === 'pre') continue
    const sides = m.t.split(' vs ').map((s) => s.trim())
    if (sides.length !== 2) continue
    const home = rows.get(sides[0])
    const away = rows.get(sides[1])
    if (!home || !away) continue

    home.p++
    away.p++
    home.gf += sc.home
    home.ga += sc.away
    away.gf += sc.away
    away.ga += sc.home
    if (sc.home > sc.away) {
      home.w++
      home.pts += 3
      away.l++
    } else if (sc.home < sc.away) {
      away.w++
      away.pts += 3
      home.l++
    } else {
      home.d++
      away.d++
      home.pts++
      away.pts++
    }
  }

  const out = [...rows.values()]
  out.forEach((r) => (r.gd = r.gf - r.ga))
  out.sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      (seed.get(a.team) ?? 0) - (seed.get(b.team) ?? 0),
  )
  return out
}

/** "+2" / "0" / "-1" for display. */
export const fmtGD = (gd: number): string => (gd > 0 ? `+${gd}` : String(gd))
