// Turns a YouTube playlist into a draft stops file for the map.
//
//   A) With a YouTube Data API key (free):
//        YT_API_KEY=your_key node scripts/import-playlist.mjs PLAYLIST_ID stops.json
//   B) Without a key, from yt-dlp output (lines like  VIDEO_ID|Title):
//        yt-dlp --flat-playlist --print "%(id)s|%(title)s" "PLAYLIST_URL" > videos.txt
//        node scripts/import-playlist.mjs videos.txt stops.json
//
// The country comes from the flag emoji in the title (🇹🇷 -> Türkiye) and is geocoded with
// OpenStreetMap's Nominatim, so every pin starts at country level. Open stops.json and,
// for the ones you care about, change "place" to "City, Country" and fix lat/lng.
// Stops with "needsReview": true have no flag in the title, so nothing was guessed.
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Use the same country names as countryFlags.js so flags and grouping match.
const NAME_OVERRIDES = {
  TR: 'Türkiye', AE: 'UAE', US: 'USA', MK: 'North Macedonia', GB: 'United Kingdom',
}
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

// 🇹🇷 is two "regional indicator" characters; turn the first pair into 'TR'.
export function flagCode(title) {
  const cps = [...title].map((c) => c.codePointAt(0)).filter((c) => c >= 0x1f1e6 && c <= 0x1f1ff)
  if (cps.length < 2) return null
  return String.fromCharCode(cps[0] - 0x1f1e6 + 65, cps[1] - 0x1f1e6 + 65)
}

export function countryFromTitle(title) {
  const code = flagCode(title)
  if (!code) return null
  try {
    return NAME_OVERRIDES[code] || regionNames.of(code)
  } catch {
    return null
  }
}

async function videosFromApi(playlistId, key) {
  const out = []
  let pageToken = ''
  do {
    const url =
      'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50' +
      `&playlistId=${playlistId}&key=${key}` + (pageToken ? `&pageToken=${pageToken}` : '')
    const res = await fetch(url)
    if (!res.ok) throw new Error(`YouTube API error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    for (const it of data.items) {
      const title = it.snippet.title
      if (title === 'Private video' || title === 'Deleted video') continue
      out.push({ videoId: it.snippet.resourceId.videoId, title })
    }
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return out
}

function videosFromFile(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('|'))
    .map((l) => {
      const i = l.indexOf('|')
      return { videoId: l.slice(0, i).trim(), title: l.slice(i + 1).trim() }
    })
}

const cache = new Map()
async function geocode(name) {
  if (cache.has(name)) return cache.get(name)
  await new Promise((r) => setTimeout(r, 1100)) // Nominatim allows ~1 request per second
  const res = await fetch(
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(name),
    { headers: { 'User-Agent': 'vlogger-world-tracker-import/1.0' } }
  )
  const hit = (await res.json())[0]
  const pos = hit ? { lat: +(+hit.lat).toFixed(2), lng: +(+hit.lon).toFixed(2) } : null
  cache.set(name, pos)
  return pos
}

async function main() {
  const [input, outPath = 'stops.json'] = process.argv.slice(2)
  if (!input) {
    console.error('Usage: node import-playlist.mjs <PLAYLIST_ID | videos.txt> [out.json]')
    process.exit(1)
  }
  const videos = input.endsWith('.txt')
    ? videosFromFile(input)
    : await videosFromApi(input, process.env.YT_API_KEY || (console.error('Set YT_API_KEY'), process.exit(1)))

  const stops = []
  for (const [i, v] of videos.entries()) {
    const country = countryFromTitle(v.title)
    const pos = country ? await geocode(country) : null
    stops.push({
      id: i + 1,
      place: country || '',
      country: country || '',
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
      title: v.title,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      needsReview: !pos,
    })
    process.stdout.write(`\r${i + 1}/${videos.length}`)
  }
  writeFileSync(outPath, JSON.stringify(stops, null, 2))
  console.log(`\nWrote ${stops.length} stops to ${outPath} (${stops.filter((s) => s.needsReview).length} need review)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
