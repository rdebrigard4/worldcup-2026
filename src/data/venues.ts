// Host stadiums (coordinates + city) and national-team color palettes,
// ported from the original tracker. Used by the Locations map.

export type Venue = { lat: number; lng: number; city: string }

export const VENUES: Record<string, Venue> = {
  'Estadio Azteca': { lat: 19.3029, lng: -99.1505, city: 'Mexico City' },
  'Estadio Akron': { lat: 20.6817, lng: -103.463, city: 'Guadalajara' },
  'Estadio BBVA': { lat: 25.6692, lng: -100.2444, city: 'Monterrey' },
  'BMO Field': { lat: 43.6332, lng: -79.4185, city: 'Toronto' },
  'BC Place': { lat: 49.2767, lng: -123.1119, city: 'Vancouver' },
  'SoFi Stadium': { lat: 33.9534, lng: -118.3387, city: 'Los Angeles' },
  "Levi's Stadium": { lat: 37.403, lng: -121.9698, city: 'San Francisco' },
  'Lumen Field': { lat: 47.5952, lng: -122.3316, city: 'Seattle' },
  'AT&T Stadium': { lat: 32.7473, lng: -97.0945, city: 'Dallas' },
  'NRG Stadium': { lat: 29.6847, lng: -95.4107, city: 'Houston' },
  'Arrowhead Stadium': { lat: 39.0489, lng: -94.4839, city: 'Kansas City' },
  'Mercedes-Benz Stadium': { lat: 33.7553, lng: -84.4006, city: 'Atlanta' },
  'MetLife Stadium': { lat: 40.8128, lng: -74.0742, city: 'East Rutherford, NJ' },
  'Hard Rock Stadium': { lat: 25.958, lng: -80.2389, city: 'Miami' },
  'Gillette Stadium': { lat: 42.0909, lng: -71.2643, city: 'Boston' },
  'Lincoln Financial Field': { lat: 39.9008, lng: -75.1675, city: 'Philadelphia' },
}

const TEAM_COLORS: Record<string, string[]> = {
  Algeria: ['#006633', '#FFFFFF', '#D2122E'],
  Argentina: ['#75AADB', '#FFFFFF'],
  Australia: ['#FFCD00', '#00843D'],
  Austria: ['#ED2939', '#FFFFFF'],
  Belgium: ['#000000', '#FAE042', '#ED2939'],
  'Bosnia-Herzegovina': ['#002F6C', '#FECB00'],
  Brazil: ['#FEDF00', '#009C3B', '#002776'],
  'Cabo Verde': ['#003893', '#FFFFFF', '#CF2027'],
  Canada: ['#FF0000', '#FFFFFF'],
  Colombia: ['#FCD116', '#003893', '#CE1126'],
  Croatia: ['#E60026', '#FFFFFF', '#1F3686'],
  "Côte d'Ivoire": ['#FF8200', '#FFFFFF', '#009E60'],
  Curaçao: ['#002B7F', '#F9E813', '#FFFFFF'],
  Czechia: ['#D7141A', '#FFFFFF', '#11457E'],
  'DR Congo': ['#007FFF', '#FCD116', '#CE1126'],
  Ecuador: ['#FFD100', '#034EA2', '#ED1C24'],
  Egypt: ['#CE1126', '#FFFFFF', '#000000'],
  England: ['#C8102E', '#FFFFFF'],
  France: ['#002395', '#FFFFFF', '#ED2939'],
  Germany: ['#000000', '#DD0000', '#FFCE00'],
  Ghana: ['#CE1126', '#FCD116', '#006B3F'],
  Haiti: ['#00209F', '#D21034'],
  Iran: ['#239F40', '#FFFFFF', '#DA0000'],
  Iraq: ['#CE1126', '#FFFFFF', '#000000'],
  Japan: ['#BC002D', '#FFFFFF'],
  Jordan: ['#000000', '#FFFFFF', '#007A3D', '#CE1126'],
  'Korea Republic': ['#C8102E', '#003478'],
  Mexico: ['#006847', '#FFFFFF', '#CE1126'],
  Morocco: ['#C1272D', '#006233'],
  Netherlands: ['#FF6600', '#FFFFFF', '#21468B'],
  'New Zealand': ['#012169', '#FFFFFF', '#CC142B'],
  Norway: ['#BA0C2F', '#FFFFFF', '#00205B'],
  Panama: ['#D21034', '#FFFFFF', '#005AA7'],
  Paraguay: ['#D52B1E', '#FFFFFF', '#0038A8'],
  Portugal: ['#046A38', '#DA291C'],
  Qatar: ['#8A1538', '#FFFFFF'],
  'Saudi Arabia': ['#006C35', '#FFFFFF'],
  Scotland: ['#0065BF', '#FFFFFF'],
  Senegal: ['#00853F', '#FCD116', '#E31B23'],
  'South Africa': ['#007749', '#FFCB05', '#DE3831'],
  Spain: ['#C60B1E', '#FFC400'],
  Sweden: ['#006AA7', '#FECC00'],
  Switzerland: ['#DA291C', '#FFFFFF'],
  Türkiye: ['#E30A17', '#FFFFFF'],
  Tunisia: ['#E70013', '#FFFFFF'],
  Uruguay: ['#5BBEEC', '#FFFFFF'],
  USA: ['#BF0A30', '#FFFFFF', '#002868'],
  Uzbekistan: ['#1EB53A', '#FFFFFF', '#0099B5'],
}

// First palette color that isn't too light/dark — readable as a solid accent.
function pickPrimary(colors: string[]): string {
  for (const hex of colors) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    if (lum > 0.12 && lum < 0.88) return hex
  }
  return colors[0]
}

export function teamPrimaryColor(team: string): string {
  const colors = TEAM_COLORS[team]
  return colors ? pickPrimary(colors) : '#4ade80'
}

/** A team's full flag palette (or a green fallback for unknown teams). */
export function teamColors(team: string): string[] {
  return TEAM_COLORS[team] ?? ['#4ade80']
}

/** Vertical flag-stripe gradient from a palette — used for team headers. */
export function stripesGradient(colors: string[]): string {
  if (!colors.length) return ''
  if (colors.length === 1) return colors[0]
  const step = 100 / colors.length
  const stops = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`)
  return `linear-gradient(180deg, ${stops.join(', ')})`
}

/** "Stadium · City" or "Stadium" → "Stadium". */
export function stadiumKey(v: string): string {
  return (v || '').split(' · ')[0]
}
