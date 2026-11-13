#!/usr/bin/env node
// Adds YouTube videos or whole playlists to public/data/videos/<category>.json.
//
//   npm run add -- <playlist or video URL...> --category history [options]
//
// Options
//   --category <id>         travel | history | geopolitics | invention | culture (required)
//   --countries EG,IQ       used when a title names no country (ISO codes, comma separated)
//   --era 1200:1500         set the same era on every video (500BC:300BC for BC years)
//   --channel-country BD    country of the channel, if it is new
//   --ai                    let Claude read titles + descriptions and fill countries, era and place
//                           (needs ANTHROPIC_API_KEY or `ant auth login`)
//   --no-pin                don't put a map pin at the country's centre when no place is known
//   --dry-run               show what would be added without writing files
//
// Videos are fetched with the YouTube Data API when YT_API_KEY is set, otherwise with yt-dlp.
// Countries come from flag emojis and country names in the title. Already-added videos are
// skipped (or just get the new category added), so running a playlist again only adds new ones.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'public', 'data')
const readJson = (file) => JSON.parse(readFileSync(path.join(DATA, file), 'utf8'))
const writeJson = (file, data) => writeFileSync(path.join(DATA, file), JSON.stringify(data, null, 2) + '\n')

/* ---------- arguments ---------- */

// "--era 500BC:300BC" is the friendly form; a bare "-500:-300" would look like an option to Node,
// so also accept it written as "--era=-500:-300".
let parsed
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      category: { type: 'string' },
      countries: { type: 'string' },
      era: { type: 'string' },
      'channel-country': { type: 'string' },
      ai: { type: 'boolean', default: false },
      'no-pin': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })
} catch (e) {
  console.error(`Error: ${e.message}\n(For BC years write --era 500BC:300BC or --era=-500:-300.)`)
  process.exit(1)
}
const { values: opts, positionals: inputs } = parsed

function usage(msg) {
  if (msg) console.error('Error: ' + msg + '\n')
  console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport')[0].replace(/^#!.*\n/, '').replace(/^\/\/ ?/gm, ''))
  process.exit(msg ? 1 : 0)
}
if (opts.help) usage()
if (!inputs.length) usage('give at least one playlist or video URL')

const categories = readJson('categories.json')
if (!categories.some((c) => c.id === opts.category)) {
  usage(`--category must be one of: ${categories.map((c) => c.id).join(', ')}`)
}
const codeList = (s) => (s || '').split(/[\s,]+/).filter(Boolean).map((c) => c.toUpperCase())
const givenCountries = codeList(opts.countries)
for (const c of givenCountries) if (!/^[A-Z]{2}$/.test(c)) usage(`"${c}" is not a two-letter country code`)
let givenEra = null
if (opts.era) {
  // each side: 1453, -500 or 500BC / 500 BCE
  const year = (t) => {
    const m = t.trim().match(/^(-?\d+)\s*(BCE?|AD|CE)?$/i)
    if (!m) return NaN
    return /^BC/i.test(m[2] || '') ? -Math.abs(+m[1]) : +m[1]
  }
  const parts = opts.era.split(':')
  givenEra = { from: year(parts[0]), to: year(parts[1] ?? parts[0]) }
  if (parts.length > 2 || Number.isNaN(givenEra.from) || Number.isNaN(givenEra.to)) {
    usage('--era looks like 1200:1500, or 500BC:300BC for years before Christ')
  }
}

/* ---------- fetching from YouTube ---------- */

// Accepts a URL or a bare ID. A URL with list= is treated as a playlist unless it is a watch link
// to a single video inside a playlist and the path isn't /playlist.
function classify(input) {
  if (/^(PL|UU|OL|FL|RD)[\w-]{10,}$/.test(input)) return { type: 'playlist', id: input }
  if (/^[\w-]{11}$/.test(input)) return { type: 'video', id: input }
  let u
  try {
    u = new URL(input)
  } catch {
    usage(`"${input}" is not a YouTube URL or ID`)
  }
  const list = u.searchParams.get('list')
  const v = u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null)
    || u.pathname.match(/^\/(?:shorts|live)\/([\w-]{11})/)?.[1]
  if (list && (u.pathname === '/playlist' || !v)) return { type: 'playlist', id: list }
  if (v) return { type: 'video', id: v }
  usage(`can't find a video or playlist in "${input}"`)
}

const HIDDEN = new Set(['Private video', 'Deleted video', '[Private video]', '[Deleted video]'])
// yt-dlp marks members-only and private videos; most viewers couldn't watch them, so skip them.
const LOCKED = new Set(['subscriber_only', 'premium_only', 'needs_auth', 'private'])
const membersOnly = (title) => /\bmembers?[ -]only\b|\bmember exclusive\b/i.test(title)

async function youtubeApi(endpoint, params) {
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}?` +
    new URLSearchParams({ ...params, key: process.env.YT_API_KEY })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text()}`)
  return res.json()
}

async function fetchWithApi({ type, id }) {
  const out = []
  if (type === 'playlist') {
    let pageToken = ''
    do {
      const data = await youtubeApi('playlistItems', { part: 'snippet', maxResults: 50, playlistId: id, pageToken })
      for (const { snippet: s } of data.items) {
        out.push({
          id: s.resourceId.videoId, title: s.title, description: s.description,
          channelName: s.videoOwnerChannelTitle, channelId: s.videoOwnerChannelId,
        })
      }
      pageToken = data.nextPageToken || ''
    } while (pageToken)
  } else {
    const data = await youtubeApi('videos', { part: 'snippet', id })
    for (const it of data.items) {
      const s = it.snippet
      out.push({ id: it.id, title: s.title, description: s.description, channelName: s.channelTitle, channelId: s.channelId })
    }
  }
  return out
}

function fetchWithYtDlp({ type, id }) {
  const url = type === 'playlist' ? `https://www.youtube.com/playlist?list=${id}` : `https://www.youtube.com/watch?v=${id}`
  const args = type === 'playlist' ? ['--flat-playlist', '-J', url] : ['-J', '--skip-download', url]
  const r = spawnSync('yt-dlp', ['--no-warnings', ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  if (r.error?.code === 'ENOENT') throw new Error('Set YT_API_KEY or install yt-dlp (https://github.com/yt-dlp/yt-dlp)')
  if (r.status !== 0) throw new Error(`yt-dlp failed for ${url}:\n${r.stderr}`)
  const info = JSON.parse(r.stdout)
  const entries = type === 'playlist' ? info.entries || [] : [info]
  return entries.map((e) => ({
    id: e.id, title: e.title, description: e.description || '', locked: LOCKED.has(e.availability),
    channelName: e.channel || e.uploader || info.channel || info.uploader,
    channelId: e.channel_id || info.channel_id,
  }))
}

/* ---------- countries from titles ---------- */

const display = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })
// Not countries (EU, UN, ...) and retired codes (Burma, Soviet Union, Yugoslavia, ...): those names map to
// present-day countries through ALIASES instead.
const NOT_COUNTRIES = new Set(['EU', 'EZ', 'UN', 'QO', 'XA', 'XB', 'ZZ', 'AC', 'CP', 'DG', 'EA', 'IC', 'TA', 'XK',
  'BU', 'CS', 'DD', 'FX', 'NT', 'SU', 'TP', 'YD', 'YU', 'ZR', 'AN'])
const ALIASES = {
  US: ['USA', 'U.S.', 'U.S.A.', 'America', 'United States of America'],
  GB: ['UK', 'U.K.', 'Britain', 'Great Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland'],
  TR: ['Turkey', 'Türkiye', 'Turkiye'], AE: ['UAE', 'Dubai', 'Abu Dhabi'], IR: ['Persia'], NL: ['Holland'],
  MM: ['Burma', 'Myanmar'], CI: ['Ivory Coast'], CZ: ['Czech Republic'], VA: ['Vatican'], CD: ['DR Congo', 'DRC', 'Democratic Republic of the Congo'],
  CG: ['Republic of the Congo'], KR: ['Korea'], RU: ['Russia'], MK: ['Macedonia'], SZ: ['Swaziland'], TL: ['East Timor'],
}
// Phrases that contain a country name but are not about that country.
const BLANK_OUT = ['South America', 'North America', 'Latin America', 'Central America', 'New England']

const NAME_INDEX = (() => {
  const names = []
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b)
      if (NOT_COUNTRIES.has(code)) continue
      const name = display.of(code)
      if (!name || name.includes(' - ')) continue // "Congo - Kinshasa" style names are covered by aliases
      for (const n of name.replace(/&/g, 'and').split(/\s*[()]\s*/).filter(Boolean)) names.push([n, code])
    }
  }
  for (const [code, list] of Object.entries(ALIASES)) for (const n of list) names.push([n, code])
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // longest first, so "South Sudan" wins over "Sudan"
  return names
    .sort((x, y) => y[0].length - x[0].length)
    .map(([n, code]) => ({ code, re: new RegExp(`(?<![\\p{L}\\p{N}])${escape(n)}(?![\\p{L}\\p{N}])`, 'giu') }))
})()

function flagCodes(text) {
  const out = []
  const cps = [...text].map((c) => c.codePointAt(0))
  for (let i = 0; i < cps.length - 1; i++) {
    const [a, b] = [cps[i], cps[i + 1]]
    if (a >= 0x1f1e6 && a <= 0x1f1ff && b >= 0x1f1e6 && b <= 0x1f1ff) {
      out.push(String.fromCharCode(a - 0x1f1e6 + 65, b - 0x1f1e6 + 65))
      i++
    }
  }
  return out
}

function countriesInTitle(title) {
  const found = flagCodes(title).map((code) => ({ code, at: -1 }))
  let text = title
  for (const phrase of BLANK_OUT) {
    text = text.replace(new RegExp(phrase, 'gi'), (m) => ' '.repeat(m.length))
  }
  for (const { code, re } of NAME_INDEX) {
    text = text.replace(re, (m, at) => {
      found.push({ code, at })
      return ' '.repeat(m.length)
    })
  }
  return [...new Set(found.sort((a, b) => a.at - b.at).map((f) => f.code))]
}

/* ---------- map pins ---------- */

// Centre of a country's largest landmass, from the same borders file the site uses.
const centroids = (() => {
  const world = readJson('world.json')
  const out = {}
  const ringArea = (r) => r.reduce((s, [x1, y1], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x1 * y2 - x2 * y1 }, 0) / 2
  for (const f of world.features) {
    if (!f.properties.code) continue
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    const ring = polys.map((p) => p[0]).sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))[0]
    const A = ringArea(ring)
    let cx = 0, cy = 0
    ring.forEach(([x1, y1], i) => {
      const [x2, y2] = ring[(i + 1) % ring.length]
      const k = x1 * y2 - x2 * y1
      cx += (x1 + x2) * k
      cy += (y1 + y2) * k
    })
    out[f.properties.code] = { lat: +(cy / (6 * A)).toFixed(2), lng: +(cx / (6 * A)).toFixed(2) }
  }
  return out
})()

const geocodeCache = new Map()
async function countryPin(code) {
  if (centroids[code]) return centroids[code]
  if (geocodeCache.has(code)) return geocodeCache.get(code)
  // small countries (Maldives, Singapore, ...) aren't in the borders file: ask OpenStreetMap
  await new Promise((r) => setTimeout(r, 1100)) // Nominatim allows ~1 request per second
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=${code.toLowerCase()}&q=${encodeURIComponent(countryName(code))}`,
    { headers: { 'User-Agent': 'vlogger-world-tracker-import/1.0' } })
  const hit = res.ok ? (await res.json())[0] : null
  const pos = hit ? { lat: +(+hit.lat).toFixed(2), lng: +(+hit.lon).toFixed(2) } : null
  geocodeCache.set(code, pos)
  return pos
}

const NAME_OVERRIDES = { TR: 'Türkiye', AE: 'UAE', US: 'USA', GB: 'United Kingdom' }
const countryName = (code) => NAME_OVERRIDES[code] || display.of(code) || code

/* ---------- optional AI tagging ---------- */

async function tagWithClaude(videos, category) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod')
  const { z } = await import('zod')

  const Tags = z.object({
    videos: z.array(z.object({
      id: z.string(),
      countries: z.array(z.string()).describe('ISO 3166-1 alpha-2 codes of present-day countries the video is mainly about, most important first'),
      era: z.object({ from: z.number(), to: z.number() }).nullable()
        .describe('Historical period covered, in years (negative = BC). null if the video is about the present day'),
      place: z.object({ name: z.string(), lat: z.number(), lng: z.number() }).nullable()
        .describe('The single most specific place the video is about, as "Place, Country", if there is one; otherwise null'),
    })),
  })

  const client = new Anthropic()
  const results = new Map()
  const BATCH = 20
  for (let i = 0; i < videos.length; i += BATCH) {
    const batch = videos.slice(i, i + BATCH)
    process.stdout.write(`\rAsking Claude about videos ${i + 1}-${i + batch.length} of ${videos.length}…`)
    const listing = batch
      // descriptions are cut to their opening, which carries the topic; the rest is usually links and sponsors
      .map((v) => `<video id="${v.id}">\nTitle: ${v.title}\nDescription: ${(v.description || '').slice(0, 1500)}\n</video>`)
      .join('\n\n')
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'medium', format: betaZodOutputFormat(Tags) },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system:
        'You tag YouTube videos for a world map of educational and travel videos. For each video, say which ' +
        'present-day countries it is about (so the map can shade them), the historical period it covers, and ' +
        'the specific place it is about. Base this on the title and description. Map historical states to the ' +
        'present-day countries that cover most of their territory (Ottoman Empire -> TR, Mesopotamia -> IQ). ' +
        'Leave countries empty and era/place null when the video gives no basis for them. Return every video id you were given.',
      messages: [{ role: 'user', content: `These videos are in the "${category}" category.\n\n${listing}` }],
    })
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      console.warn(`\nClaude did not tag videos ${i + 1}-${i + batch.length} (${response.stop_reason}); they keep the title-based tags.`)
      continue
    }
    for (const t of response.parsed_output.videos) results.set(t.id, t)
  }
  process.stdout.write('\n')
  return results
}

/* ---------- main ---------- */

const fetched = []
for (const input of inputs) {
  const target = classify(input)
  console.log(`Fetching ${target.type} ${target.id}…`)
  const list = process.env.YT_API_KEY ? await fetchWithApi(target) : fetchWithYtDlp(target)
  const watchable = list.filter((v) => v.id && !v.locked && !HIDDEN.has(v.title) && !membersOnly(v.title))
  if (watchable.length < list.length) console.log(`  skipped ${list.length - watchable.length} private, deleted or members-only`)
  fetched.push(...watchable)
}

// every video already on the site, by id
const files = readdirSync(path.join(DATA, 'videos')).filter((f) => f.endsWith('.json'))
const lists = Object.fromEntries(files.map((f) => [f, readJson('videos/' + f)]))
const existing = new Map()
for (const list of Object.values(lists)) for (const v of list) existing.set(v.id, v)

const seen = new Set()
const fresh = []
let retagged = 0
for (const v of fetched) {
  if (seen.has(v.id)) continue
  seen.add(v.id)
  const old = existing.get(v.id)
  if (old) {
    if (!old.categories.includes(opts.category)) {
      old.categories.push(opts.category)
      retagged++
    }
  } else {
    fresh.push(v)
  }
}

let ai = new Map()
if (opts.ai && fresh.length) {
  try {
    ai = await tagWithClaude(fresh, opts.category)
  } catch (e) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    if (e instanceof Anthropic.AuthenticationError || /authentication method/i.test(e.message)) {
      console.error('\n--ai needs a Claude API key: set ANTHROPIC_API_KEY (https://platform.claude.com) or run `ant auth login`.')
    } else if (e instanceof Anthropic.APIError) {
      console.error(`\nClaude API error ${e.status}: ${e.message}`)
    } else {
      throw e
    }
    console.error('Nothing was written. Run again without --ai to use title-based tags only.')
    process.exit(1)
  }
}

const channels = readJson('channels.json')
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'unknown'
const newChannels = []
const added = []
for (const v of fresh) {
  const name = v.channelName || 'Unknown channel'
  let channel = channels.find((c) => c.youtubeId && c.youtubeId === v.channelId) || channels.find((c) => c.name === name)
  if (!channel) {
    channel = { id: slug(name), name, youtubeId: v.channelId, url: v.channelId ? `https://www.youtube.com/channel/${v.channelId}` : undefined }
    if (opts['channel-country']) channel.country = opts['channel-country'].toUpperCase()
    while (channels.some((c) => c.id === channel.id)) channel.id += '-2'
    channels.push(channel)
    newChannels.push(channel)
  }

  const tags = ai.get(v.id)
  const valid = (codes) => codes.map((c) => c.toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c) && display.of(c))
  const aiCountries = tags ? valid(tags.countries) : []
  const titleCountries = countriesInTitle(v.title)
  const countries = aiCountries.length ? aiCountries : titleCountries.length ? titleCountries : givenCountries

  const video = { id: v.id, channel: channel.id, title: v.title, categories: [opts.category], countries }
  if (tags?.place) video.place = { name: tags.place.name, lat: +tags.place.lat.toFixed(4), lng: +tags.place.lng.toFixed(4) }
  else if (countries.length && !opts['no-pin']) {
    const pos = await countryPin(countries[0])
    if (pos) video.place = { name: countryName(countries[0]), ...pos }
  }
  const era = givenEra || tags?.era
  if (era) video.era = { from: Math.round(Math.min(era.from, era.to)), to: Math.round(Math.max(era.from, era.to)) }
  if (!countries.length) video.needsReview = true
  added.push(video)
}

// report
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
for (const v of added) {
  const where = v.countries.length ? v.countries.join(',') : '??'
  const when = v.era ? ` ${v.era.from}–${v.era.to}` : ''
  console.log(`  + [${where}${when}] ${cut(v.title, 70)}${v.place ? `  📍 ${v.place.name}` : ''}`)
}
const review = added.filter((v) => v.needsReview).length
console.log(`\n${added.length} new, ${retagged} existing videos also tagged "${opts.category}", ` +
  `${fetched.length - added.length - retagged} already there.`)
if (review) console.log(`${review} have no country: search "needsReview" in videos/${opts.category}.json and fill in countries.`)
for (const c of newChannels) {
  console.log(`New channel: ${c.name}${c.country ? '' : '  (add --channel-country XX, or set "country" in channels.json)'}`)
}

if (opts['dry-run']) {
  console.log('\nDry run: nothing written.')
} else if (added.length || retagged || newChannels.length) {
  const target = `${opts.category}.json`
  lists[target] = [...(lists[target] || []), ...added]
  for (const [file, list] of Object.entries(lists)) writeJson('videos/' + file, list)
  writeJson('channels.json', channels)
  console.log(`\nSaved. Commit public/data and push to publish.`)
}
