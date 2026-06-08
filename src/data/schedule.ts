// World Cup 2026 fixtures, ported from the original tracker.
// `k` is kickoff in UTC (ISO 8601); `date` is the local stadium date label.
// Group matches carry venue (`v`) and city (`c`) separately; knockout matches
// fold the city into `v` ("Stadium · City") and have no `c`.

export type Match = {
  id: string
  date: string
  t: string // "Team A vs Team B"
  v: string // venue
  c?: string // city (group stage only)
  k: string // kickoff, UTC ISO
}

export type Group = {
  g: string
  dates: string
  teams: string[]
  fav?: boolean
  hot?: boolean // "Group of Death"
  matches: Match[]
}

export type KnockoutPhase = {
  phase: 'r32' | 'r16' | 'qf' | 'sf' | 'tp' | 'final'
  label: string
  matches: Match[]
}

export const GROUPS: Group[] = [
  { g: 'A', dates: 'Jun 11–24', teams: ['Mexico', 'South Africa', 'Korea Republic', 'Czechia'], matches: [
    { id: 'a1', date: 'Jun 11', t: 'Mexico vs South Africa', v: 'Estadio Azteca', c: 'Mexico City', k: '2026-06-11T19:00:00Z' },
    { id: 'a2', date: 'Jun 11', t: 'Korea Republic vs Czechia', v: 'Estadio Akron', c: 'Guadalajara', k: '2026-06-12T02:00:00Z' },
    { id: 'a3', date: 'Jun 18', t: 'Czechia vs South Africa', v: 'Mercedes-Benz Stadium', c: 'Atlanta', k: '2026-06-18T16:00:00Z' },
    { id: 'a4', date: 'Jun 18', t: 'Mexico vs Korea Republic', v: 'Estadio Akron', c: 'Guadalajara', k: '2026-06-19T01:00:00Z' },
    { id: 'a5', date: 'Jun 24', t: 'Czechia vs Mexico', v: 'Estadio Azteca', c: 'Mexico City', k: '2026-06-25T01:00:00Z' },
    { id: 'a6', date: 'Jun 24', t: 'South Africa vs Korea Republic', v: 'Estadio BBVA', c: 'Monterrey', k: '2026-06-25T01:00:00Z' },
  ] },
  { g: 'B', dates: 'Jun 12–24', teams: ['Canada', 'Bosnia-Herzegovina', 'Qatar', 'Switzerland'], matches: [
    { id: 'b1', date: 'Jun 12', t: 'Canada vs Bosnia-Herzegovina', v: 'BMO Field', c: 'Toronto', k: '2026-06-12T19:00:00Z' },
    { id: 'b2', date: 'Jun 13', t: 'Qatar vs Switzerland', v: "Levi's Stadium", c: 'San Francisco', k: '2026-06-13T19:00:00Z' },
    { id: 'b3', date: 'Jun 18', t: 'Switzerland vs Bosnia-Herzegovina', v: 'SoFi Stadium', c: 'Los Angeles', k: '2026-06-18T19:00:00Z' },
    { id: 'b4', date: 'Jun 18', t: 'Canada vs Qatar', v: 'BC Place', c: 'Vancouver', k: '2026-06-18T22:00:00Z' },
    { id: 'b5', date: 'Jun 24', t: 'Bosnia-Herzegovina vs Qatar', v: 'Lumen Field', c: 'Seattle', k: '2026-06-24T19:00:00Z' },
    { id: 'b6', date: 'Jun 24', t: 'Switzerland vs Canada', v: 'BC Place', c: 'Vancouver', k: '2026-06-24T19:00:00Z' },
  ] },
  { g: 'C', dates: 'Jun 13–24', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'], matches: [
    { id: 'c1', date: 'Jun 13', t: 'Brazil vs Morocco', v: 'MetLife Stadium', c: 'East Rutherford, NJ', k: '2026-06-13T22:00:00Z' },
    { id: 'c2', date: 'Jun 13', t: 'Haiti vs Scotland', v: 'Gillette Stadium', c: 'Boston', k: '2026-06-14T01:00:00Z' },
    { id: 'c3', date: 'Jun 19', t: 'Scotland vs Morocco', v: 'Gillette Stadium', c: 'Boston', k: '2026-06-19T22:00:00Z' },
    { id: 'c4', date: 'Jun 19', t: 'Brazil vs Haiti', v: 'Lincoln Financial Field', c: 'Philadelphia', k: '2026-06-20T00:30:00Z' },
    { id: 'c5', date: 'Jun 24', t: 'Scotland vs Brazil', v: 'Hard Rock Stadium', c: 'Miami', k: '2026-06-24T22:00:00Z' },
    { id: 'c6', date: 'Jun 24', t: 'Morocco vs Haiti', v: 'Mercedes-Benz Stadium', c: 'Atlanta', k: '2026-06-24T22:00:00Z' },
  ] },
  { g: 'D', dates: 'Jun 12–25', fav: true, teams: ['USA', 'Paraguay', 'Australia', 'Türkiye'], matches: [
    { id: 'd1', date: 'Jun 12', t: 'USA vs Paraguay', v: 'SoFi Stadium', c: 'Los Angeles', k: '2026-06-13T01:00:00Z' },
    { id: 'd2', date: 'Jun 13', t: 'Australia vs Türkiye', v: "Levi's Stadium", c: 'San Francisco', k: '2026-06-14T04:00:00Z' },
    { id: 'd3', date: 'Jun 19', t: 'Türkiye vs Paraguay', v: "Levi's Stadium", c: 'San Francisco', k: '2026-06-20T04:00:00Z' },
    { id: 'd4', date: 'Jun 19', t: 'USA vs Australia', v: 'Lumen Field', c: 'Seattle', k: '2026-06-19T19:00:00Z' },
    { id: 'd5', date: 'Jun 25', t: 'Paraguay vs Australia', v: "Levi's Stadium", c: 'San Francisco', k: '2026-06-26T02:00:00Z' },
    { id: 'd6', date: 'Jun 25', t: 'USA vs Türkiye', v: 'SoFi Stadium', c: 'Los Angeles', k: '2026-06-26T02:00:00Z' },
  ] },
  { g: 'E', dates: 'Jun 14–25', fav: true, teams: ['Germany', 'Curaçao', "Côte d'Ivoire", 'Ecuador'], matches: [
    { id: 'e1', date: 'Jun 14', t: 'Germany vs Curaçao', v: 'NRG Stadium', c: 'Houston', k: '2026-06-14T17:00:00Z' },
    { id: 'e2', date: 'Jun 14', t: "Côte d'Ivoire vs Ecuador", v: 'Lincoln Financial Field', c: 'Philadelphia', k: '2026-06-14T23:00:00Z' },
    { id: 'e3', date: 'Jun 20', t: "Germany vs Côte d'Ivoire", v: 'BMO Field', c: 'Toronto', k: '2026-06-20T20:00:00Z' },
    { id: 'e4', date: 'Jun 20', t: 'Ecuador vs Curaçao', v: 'Arrowhead Stadium', c: 'Kansas City', k: '2026-06-21T00:00:00Z' },
    { id: 'e5', date: 'Jun 25', t: "Curaçao vs Côte d'Ivoire", v: 'Lincoln Financial Field', c: 'Philadelphia', k: '2026-06-25T20:00:00Z' },
    { id: 'e6', date: 'Jun 25', t: 'Ecuador vs Germany', v: 'MetLife Stadium', c: 'East Rutherford, NJ', k: '2026-06-25T20:00:00Z' },
  ] },
  { g: 'F', dates: 'Jun 14–25', teams: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'], matches: [
    { id: 'f1', date: 'Jun 14', t: 'Netherlands vs Japan', v: 'AT&T Stadium', c: 'Dallas', k: '2026-06-14T20:00:00Z' },
    { id: 'f2', date: 'Jun 14', t: 'Sweden vs Tunisia', v: 'Estadio BBVA', c: 'Monterrey', k: '2026-06-15T02:00:00Z' },
    { id: 'f3', date: 'Jun 20', t: 'Netherlands vs Sweden', v: 'NRG Stadium', c: 'Houston', k: '2026-06-20T17:00:00Z' },
    { id: 'f4', date: 'Jun 20', t: 'Tunisia vs Japan', v: 'Estadio BBVA', c: 'Monterrey', k: '2026-06-21T04:00:00Z' },
    { id: 'f5', date: 'Jun 25', t: 'Japan vs Sweden', v: 'AT&T Stadium', c: 'Dallas', k: '2026-06-25T23:00:00Z' },
    { id: 'f6', date: 'Jun 25', t: 'Tunisia vs Netherlands', v: 'Arrowhead Stadium', c: 'Kansas City', k: '2026-06-25T23:00:00Z' },
  ] },
  { g: 'G', dates: 'Jun 15–26', teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'], matches: [
    { id: 'g1', date: 'Jun 15', t: 'Belgium vs Egypt', v: 'Lumen Field', c: 'Seattle', k: '2026-06-15T19:00:00Z' },
    { id: 'g2', date: 'Jun 15', t: 'Iran vs New Zealand', v: 'SoFi Stadium', c: 'Los Angeles', k: '2026-06-16T01:00:00Z' },
    { id: 'g3', date: 'Jun 21', t: 'Belgium vs Iran', v: 'SoFi Stadium', c: 'Los Angeles', k: '2026-06-21T19:00:00Z' },
    { id: 'g4', date: 'Jun 21', t: 'New Zealand vs Egypt', v: 'BC Place', c: 'Vancouver', k: '2026-06-22T01:00:00Z' },
    { id: 'g5', date: 'Jun 26', t: 'Egypt vs Iran', v: 'Lumen Field', c: 'Seattle', k: '2026-06-27T03:00:00Z' },
    { id: 'g6', date: 'Jun 26', t: 'New Zealand vs Belgium', v: 'BC Place', c: 'Vancouver', k: '2026-06-27T03:00:00Z' },
  ] },
  { g: 'H', dates: 'Jun 15–26', teams: ['Spain', 'Cabo Verde', 'Saudi Arabia', 'Uruguay'], matches: [
    { id: 'h1', date: 'Jun 15', t: 'Spain vs Cabo Verde', v: 'Mercedes-Benz Stadium', c: 'Atlanta', k: '2026-06-15T16:00:00Z' },
    { id: 'h2', date: 'Jun 15', t: 'Saudi Arabia vs Uruguay', v: 'Hard Rock Stadium', c: 'Miami', k: '2026-06-15T22:00:00Z' },
    { id: 'h3', date: 'Jun 21', t: 'Spain vs Saudi Arabia', v: 'Mercedes-Benz Stadium', c: 'Atlanta', k: '2026-06-21T16:00:00Z' },
    { id: 'h4', date: 'Jun 21', t: 'Uruguay vs Cabo Verde', v: 'Hard Rock Stadium', c: 'Miami', k: '2026-06-21T22:00:00Z' },
    { id: 'h5', date: 'Jun 26', t: 'Cabo Verde vs Saudi Arabia', v: 'NRG Stadium', c: 'Houston', k: '2026-06-27T00:00:00Z' },
    { id: 'h6', date: 'Jun 26', t: 'Uruguay vs Spain', v: 'Estadio Akron', c: 'Guadalajara', k: '2026-06-27T00:00:00Z' },
  ] },
  { g: 'I', dates: 'Jun 16–26', fav: true, hot: true, teams: ['France', 'Senegal', 'Norway', 'Iraq'], matches: [
    { id: 'i1', date: 'Jun 16', t: 'France vs Senegal', v: 'MetLife Stadium', c: 'East Rutherford, NJ', k: '2026-06-16T19:00:00Z' },
    { id: 'i2', date: 'Jun 16', t: 'Iraq vs Norway', v: 'Gillette Stadium', c: 'Boston', k: '2026-06-16T22:00:00Z' },
    { id: 'i3', date: 'Jun 22', t: 'France vs Iraq', v: 'Lincoln Financial Field', c: 'Philadelphia', k: '2026-06-22T21:00:00Z' },
    { id: 'i4', date: 'Jun 22', t: 'Norway vs Senegal', v: 'MetLife Stadium', c: 'East Rutherford, NJ', k: '2026-06-23T00:00:00Z' },
    { id: 'i5', date: 'Jun 26', t: 'Norway vs France', v: 'Gillette Stadium', c: 'Boston', k: '2026-06-26T19:00:00Z' },
    { id: 'i6', date: 'Jun 26', t: 'Senegal vs Iraq', v: 'BMO Field', c: 'Toronto', k: '2026-06-26T19:00:00Z' },
  ] },
  { g: 'J', dates: 'Jun 16–27', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'], matches: [
    { id: 'j1', date: 'Jun 16', t: 'Argentina vs Algeria', v: 'Arrowhead Stadium', c: 'Kansas City', k: '2026-06-17T01:00:00Z' },
    { id: 'j2', date: 'Jun 16', t: 'Austria vs Jordan', v: "Levi's Stadium", c: 'San Francisco', k: '2026-06-17T04:00:00Z' },
    { id: 'j3', date: 'Jun 22', t: 'Argentina vs Austria', v: 'AT&T Stadium', c: 'Dallas', k: '2026-06-22T17:00:00Z' },
    { id: 'j4', date: 'Jun 22', t: 'Jordan vs Algeria', v: "Levi's Stadium", c: 'San Francisco', k: '2026-06-23T03:00:00Z' },
    { id: 'j5', date: 'Jun 27', t: 'Algeria vs Austria', v: 'Arrowhead Stadium', c: 'Kansas City', k: '2026-06-28T02:00:00Z' },
    { id: 'j6', date: 'Jun 27', t: 'Jordan vs Argentina', v: 'AT&T Stadium', c: 'Dallas', k: '2026-06-28T02:00:00Z' },
  ] },
  { g: 'K', dates: 'Jun 17–27', fav: true, teams: ['Portugal', 'Uzbekistan', 'Colombia', 'DR Congo'], matches: [
    { id: 'k1', date: 'Jun 17', t: 'Portugal vs DR Congo', v: 'NRG Stadium', c: 'Houston', k: '2026-06-17T17:00:00Z' },
    { id: 'k2', date: 'Jun 17', t: 'Uzbekistan vs Colombia', v: 'Estadio Azteca', c: 'Mexico City', k: '2026-06-18T02:00:00Z' },
    { id: 'k3', date: 'Jun 23', t: 'Portugal vs Uzbekistan', v: 'NRG Stadium', c: 'Houston', k: '2026-06-23T17:00:00Z' },
    { id: 'k4', date: 'Jun 23', t: 'Colombia vs DR Congo', v: 'Estadio Akron', c: 'Guadalajara', k: '2026-06-24T02:00:00Z' },
    { id: 'k5', date: 'Jun 27', t: 'Colombia vs Portugal', v: 'Hard Rock Stadium', c: 'Miami', k: '2026-06-27T23:30:00Z' },
    { id: 'k6', date: 'Jun 27', t: 'DR Congo vs Uzbekistan', v: 'Mercedes-Benz Stadium', c: 'Atlanta', k: '2026-06-27T23:30:00Z' },
  ] },
  { g: 'L', dates: 'Jun 17–27', teams: ['England', 'Croatia', 'Ghana', 'Panama'], matches: [
    { id: 'l1', date: 'Jun 17', t: 'England vs Croatia', v: 'AT&T Stadium', c: 'Dallas', k: '2026-06-17T20:00:00Z' },
    { id: 'l2', date: 'Jun 17', t: 'Ghana vs Panama', v: 'BMO Field', c: 'Toronto', k: '2026-06-17T23:00:00Z' },
    { id: 'l3', date: 'Jun 23', t: 'England vs Ghana', v: 'Gillette Stadium', c: 'Boston', k: '2026-06-23T20:00:00Z' },
    { id: 'l4', date: 'Jun 23', t: 'Panama vs Croatia', v: 'BMO Field', c: 'Toronto', k: '2026-06-23T23:00:00Z' },
    { id: 'l5', date: 'Jun 27', t: 'Panama vs England', v: 'MetLife Stadium', c: 'East Rutherford, NJ', k: '2026-06-27T21:00:00Z' },
    { id: 'l6', date: 'Jun 27', t: 'Croatia vs Ghana', v: 'Lincoln Financial Field', c: 'Philadelphia', k: '2026-06-27T21:00:00Z' },
  ] },
]

export const KNOCKOUT: KnockoutPhase[] = [
  { phase: 'r32', label: 'Round of 32', matches: [
    { id: 'r32a', date: 'Jun 28', t: 'Runner-up A vs Runner-up B', v: 'SoFi Stadium · Los Angeles', k: '2026-06-28T19:00:00Z' },
    { id: 'r32b', date: 'Jun 29', t: 'Winner C vs Runner-up F', v: 'NRG Stadium · Houston', k: '2026-06-29T17:00:00Z' },
    { id: 'r32c', date: 'Jun 29', t: 'Winner E vs Best 3rd (A/B/C/D/F)', v: 'Gillette Stadium · Boston', k: '2026-06-29T20:30:00Z' },
    { id: 'r32d', date: 'Jun 29', t: 'Winner F vs Runner-up C', v: 'Estadio BBVA · Monterrey', k: '2026-06-30T01:00:00Z' },
    { id: 'r32e', date: 'Jun 30', t: 'Runner-up E vs Runner-up I', v: 'AT&T Stadium · Dallas', k: '2026-06-30T17:00:00Z' },
    { id: 'r32f', date: 'Jun 30', t: 'Winner I vs Best 3rd (C/D/F/G/H)', v: 'MetLife Stadium · East Rutherford, NJ', k: '2026-06-30T21:00:00Z' },
    { id: 'r32g', date: 'Jun 30', t: 'Winner A vs Best 3rd (C/E/F/H/I)', v: 'Estadio Azteca · Mexico City', k: '2026-07-01T01:00:00Z' },
    { id: 'r32h', date: 'Jul 1', t: 'Winner L vs Best 3rd (E/H/I/J/K)', v: 'Mercedes-Benz Stadium · Atlanta', k: '2026-07-01T16:00:00Z' },
    { id: 'r32i', date: 'Jul 1', t: 'Winner G vs Best 3rd (A/E/H/I/J)', v: 'Lumen Field · Seattle', k: '2026-07-01T20:00:00Z' },
    { id: 'r32j', date: 'Jul 1', t: 'Winner D vs Best 3rd (B/E/F/I/J)', v: "Levi's Stadium · San Francisco", k: '2026-07-02T00:00:00Z' },
    { id: 'r32k', date: 'Jul 2', t: 'Winner H vs Runner-up J', v: 'SoFi Stadium · Los Angeles', k: '2026-07-02T19:00:00Z' },
    { id: 'r32l', date: 'Jul 2', t: 'Runner-up K vs Runner-up L', v: 'BMO Field · Toronto', k: '2026-07-02T23:00:00Z' },
    { id: 'r32m', date: 'Jul 2', t: 'Winner B vs Best 3rd (E/F/G/I/J)', v: 'BC Place · Vancouver', k: '2026-07-03T03:00:00Z' },
    { id: 'r32n', date: 'Jul 3', t: 'Runner-up D vs Runner-up G', v: 'AT&T Stadium · Dallas', k: '2026-07-03T18:00:00Z' },
    { id: 'r32o', date: 'Jul 3', t: 'Winner J vs Runner-up H', v: 'Hard Rock Stadium · Miami', k: '2026-07-03T22:00:00Z' },
    { id: 'r32p', date: 'Jul 3', t: 'Winner K vs Best 3rd (D/E/I/J/L)', v: 'Arrowhead Stadium · Kansas City', k: '2026-07-04T01:30:00Z' },
  ] },
  { phase: 'r16', label: 'Round of 16', matches: [
    { id: 'r16a', date: 'Jul 4', t: 'R32 winner vs R32 winner', v: 'NRG Stadium · Houston', k: '2026-07-04T17:00:00Z' },
    { id: 'r16b', date: 'Jul 4', t: 'R32 winner vs R32 winner', v: 'Lincoln Financial Field · Philadelphia', k: '2026-07-04T21:00:00Z' },
    { id: 'r16c', date: 'Jul 5', t: 'R32 winner vs R32 winner', v: 'MetLife Stadium · East Rutherford, NJ', k: '2026-07-05T20:00:00Z' },
    { id: 'r16d', date: 'Jul 5', t: 'R32 winner vs R32 winner', v: 'Estadio Azteca · Mexico City', k: '2026-07-06T00:00:00Z' },
    { id: 'r16e', date: 'Jul 6', t: 'R32 winner vs R32 winner', v: 'AT&T Stadium · Dallas', k: '2026-07-06T19:00:00Z' },
    { id: 'r16f', date: 'Jul 6', t: 'R32 winner vs R32 winner', v: 'Lumen Field · Seattle', k: '2026-07-07T00:00:00Z' },
    { id: 'r16g', date: 'Jul 7', t: 'R32 winner vs R32 winner', v: 'Mercedes-Benz Stadium · Atlanta', k: '2026-07-07T16:00:00Z' },
    { id: 'r16h', date: 'Jul 7', t: 'R32 winner vs R32 winner', v: 'BC Place · Vancouver', k: '2026-07-07T20:00:00Z' },
  ] },
  { phase: 'qf', label: 'Quarterfinals', matches: [
    { id: 'qf1', date: 'Jul 9', t: 'Quarterfinal 1', v: 'Gillette Stadium · Boston', k: '2026-07-09T20:00:00Z' },
    { id: 'qf2', date: 'Jul 10', t: 'Quarterfinal 2', v: 'SoFi Stadium · Los Angeles', k: '2026-07-10T19:00:00Z' },
    { id: 'qf3', date: 'Jul 11', t: 'Quarterfinal 3', v: 'Hard Rock Stadium · Miami', k: '2026-07-11T21:00:00Z' },
    { id: 'qf4', date: 'Jul 11', t: 'Quarterfinal 4', v: 'Arrowhead Stadium · Kansas City', k: '2026-07-12T01:00:00Z' },
  ] },
  { phase: 'sf', label: 'Semifinals', matches: [
    { id: 'sf1', date: 'Jul 14', t: 'Semifinal 1', v: 'AT&T Stadium · Dallas', k: '2026-07-14T19:00:00Z' },
    { id: 'sf2', date: 'Jul 15', t: 'Semifinal 2', v: 'Mercedes-Benz Stadium · Atlanta', k: '2026-07-15T19:00:00Z' },
  ] },
  { phase: 'tp', label: 'Third Place', matches: [
    { id: 'tp1', date: 'Jul 18', t: 'Third-Place Match', v: 'Hard Rock Stadium · Miami', k: '2026-07-18T21:00:00Z' },
  ] },
  { phase: 'final', label: 'Final', matches: [
    { id: 'fin', date: 'Jul 19', t: 'World Cup Final', v: 'MetLife Stadium · East Rutherford, NJ', k: '2026-07-19T19:00:00Z' },
  ] },
]

export const PHASE_LABELS: Record<string, string> = {
  group: 'Group stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarterfinal',
  sf: 'Semifinal',
  tp: 'Third Place',
  final: 'Final',
}

// Default favorited teams (editable later from the My Teams tab).
export const DEFAULT_FAV_TEAMS = ['USA', 'Colombia', 'France', 'Germany']
