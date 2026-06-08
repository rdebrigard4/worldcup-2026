// Wikipedia-backed team data, ported from the original tracker. Two endpoints:
// the REST summary API (description + extract + thumbnail) and the parse API
// (section-0 infobox wikitext, scraped for "Quick Facts"). Both are cached in
// localStorage for 7 days so revisiting a team is instant and offline-friendly.

const WIKI_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Teams whose Wikipedia article title isn't simply "<team> national football team".
const WIKI_TITLE: Record<string, string> = {
  USA: "United States men's national soccer team",
  'Korea Republic': 'South Korea national football team',
  Türkiye: 'Turkey national football team',
  'Cabo Verde': 'Cape Verde national football team',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina national football team',
  "Côte d'Ivoire": 'Ivory Coast national football team',
  'DR Congo': 'DR Congo national football team',
  Czechia: 'Czech Republic national football team',
  'New Zealand': 'New Zealand national football team',
}

function wikiTitleFor(team: string): string {
  return WIKI_TITLE[team] || `${team} national football team`
}

export type TeamFacts = {
  coach?: string
  captain?: string
  fifaCode?: string
  fifaRank?: string
  association?: string
  confederation?: string
  firstGame?: string
  largestWin?: string
  largestLoss?: string
  wcApps?: string
  wcFirst?: string
  wcBest?: string
  nicknames?: string
}

export type WikiSummary = {
  title: string
  description?: string
  extract?: string
  thumbnail?: string
  pageUrl: string
  error?: string
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts < WIKI_TTL_MS) return data as T
  } catch {
    /* ignore */
  }
  return null
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    /* ignore quota/availability errors */
  }
}

// Strip wiki markup (templates, refs, links, bold/italic, <br>) down to plain text.
function cleanWikitext(str: string): string {
  if (!str) return ''
  return str
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/<ref[^/>]*\/>/g, '')
    .replace(/\{\{flag\|([^|}]+)[^}]*\}\}/gi, '$1')
    .replace(/\{\{(?:flagicon|flagdeco|flagu)[^}]*\}\}/gi, '')
    .replace(/\{\{nowrap\|([^}]+)\}\}/gi, '$1')
    .replace(/\{\{(?:nbsp|spaces)[^}]*\}\}/gi, ' ')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '') // run twice for nested templates
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<[^>]+>/g, '')
    .replace(/'''([^']*?)'''/g, '$1')
    .replace(/''([^']*?)''/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
}

function getInfoboxField(wikitext: string, name: string): string {
  const pattern = name.replace(/ /g, '[ _]')
  const re = new RegExp(`\\|\\s*${pattern}\\s*=\\s*([\\s\\S]*?)(?=\\n\\s*\\||\\n\\}\\})`, 'i')
  const m = wikitext.match(re)
  return m ? cleanWikitext(m[1]) : ''
}

function pickFirst(...vals: string[]): string {
  return vals.find((v) => v && v.length) || ''
}

function parseTeamFacts(wikitext: string): TeamFacts {
  if (!wikitext) return {}
  return {
    coach: pickFirst(getInfoboxField(wikitext, 'Head Coach'), getInfoboxField(wikitext, 'Coach'), getInfoboxField(wikitext, 'Manager')),
    captain: getInfoboxField(wikitext, 'Captain'),
    fifaCode: pickFirst(getInfoboxField(wikitext, 'FIFA Trigramme'), getInfoboxField(wikitext, 'FIFA Code')),
    fifaRank: getInfoboxField(wikitext, 'FIFA Rank'),
    association: getInfoboxField(wikitext, 'Association'),
    confederation: pickFirst(getInfoboxField(wikitext, 'Confederation'), getInfoboxField(wikitext, 'Sub-confederation')),
    firstGame: pickFirst(getInfoboxField(wikitext, 'First game'), getInfoboxField(wikitext, 'First international')),
    largestWin: pickFirst(getInfoboxField(wikitext, 'Largest win'), getInfoboxField(wikitext, 'Biggest win')),
    largestLoss: pickFirst(getInfoboxField(wikitext, 'Largest loss'), getInfoboxField(wikitext, 'Biggest defeat'), getInfoboxField(wikitext, 'Biggest loss')),
    wcApps: pickFirst(getInfoboxField(wikitext, 'World Cup apps'), getInfoboxField(wikitext, 'World cup apps')),
    wcFirst: pickFirst(getInfoboxField(wikitext, 'World Cup first'), getInfoboxField(wikitext, 'World cup first')),
    wcBest: pickFirst(getInfoboxField(wikitext, 'World Cup best'), getInfoboxField(wikitext, 'World cup best')),
    nicknames: pickFirst(getInfoboxField(wikitext, 'Nickname'), getInfoboxField(wikitext, 'Nickname(s)')),
  }
}

export async function fetchTeamFacts(team: string): Promise<TeamFacts> {
  const cacheKey = `wc2026_wikifacts_${team}`
  const cached = readCache<TeamFacts>(cacheKey)
  if (cached) return cached

  const title = wikiTitleFor(team)
  const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&page=${encodeURIComponent(title)}&prop=wikitext&section=0`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Wikipedia ' + res.status)
    const json = await res.json()
    const wikitext: string = json?.parse?.wikitext?.['*'] || ''
    const facts = parseTeamFacts(wikitext)
    writeCache(cacheKey, facts)
    return facts
  } catch {
    return {}
  }
}

export async function fetchWikiSummary(team: string): Promise<WikiSummary> {
  const cacheKey = `wc2026_wiki_${team}`
  const cached = readCache<WikiSummary>(cacheKey)
  if (cached) return cached

  const title = wikiTitleFor(team)
  const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Wikipedia ' + res.status)
    const json = await res.json()
    const data: WikiSummary = {
      title: json.title || title,
      description: json.description || '',
      extract: json.extract || '',
      thumbnail: json.thumbnail?.source || '',
      pageUrl: json.content_urls?.desktop?.page || pageUrl,
    }
    writeCache(cacheKey, data)
    return data
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to load', title, pageUrl }
  }
}
