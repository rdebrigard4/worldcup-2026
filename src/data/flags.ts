// Flag emoji per qualified nation. Keys must match the exact team strings used
// in the fixtures (e.g. "Korea Republic", "Côte d'Ivoire", "DR Congo").
// Scotland & England use the subdivision tag-sequence flags.

export const TEAM_FLAGS: Record<string, string> = {
  Mexico: '🇲🇽',
  'South Africa': '🇿🇦',
  'Korea Republic': '🇰🇷',
  Czechia: '🇨🇿',
  Canada: '🇨🇦',
  'Bosnia-Herzegovina': '🇧🇦',
  Qatar: '🇶🇦',
  Switzerland: '🇨🇭',
  Brazil: '🇧🇷',
  Morocco: '🇲🇦',
  Haiti: '🇭🇹',
  Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  USA: '🇺🇸',
  Paraguay: '🇵🇾',
  Australia: '🇦🇺',
  Türkiye: '🇹🇷',
  Germany: '🇩🇪',
  Curaçao: '🇨🇼',
  "Côte d'Ivoire": '🇨🇮',
  Ecuador: '🇪🇨',
  Netherlands: '🇳🇱',
  Japan: '🇯🇵',
  Sweden: '🇸🇪',
  Tunisia: '🇹🇳',
  Belgium: '🇧🇪',
  Egypt: '🇪🇬',
  Iran: '🇮🇷',
  'New Zealand': '🇳🇿',
  Spain: '🇪🇸',
  'Cabo Verde': '🇨🇻',
  'Saudi Arabia': '🇸🇦',
  Uruguay: '🇺🇾',
  France: '🇫🇷',
  Senegal: '🇸🇳',
  Norway: '🇳🇴',
  Iraq: '🇮🇶',
  Argentina: '🇦🇷',
  Algeria: '🇩🇿',
  Austria: '🇦🇹',
  Jordan: '🇯🇴',
  Portugal: '🇵🇹',
  Uzbekistan: '🇺🇿',
  Colombia: '🇨🇴',
  'DR Congo': '🇨🇩',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Croatia: '🇭🇷',
  Ghana: '🇬🇭',
  Panama: '🇵🇦',
}

/** Flag for a known team, or '' for knockout placeholders ("Winner A", etc.). */
export function teamFlag(team: string): string {
  return TEAM_FLAGS[team.trim()] ?? ''
}
