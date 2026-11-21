// Data: everything the site loads, and small helpers for working with it.
//   1. Database connection   the Supabase client (null when the site runs without a database)
//   2. Countries             ISO codes <-> names, flags, and the special "Earth" country
//   3. Country centres       a pin position for a country (centre of its largest land piece)
//   4. Database reads        reading whole tables, and corrections made on the edit page
//   5. Loading data          topics, channels and videos from the database, country borders
//   6. Map grouping          videos -> countries -> cities, for the map markers
//   7. Sign-in helpers       username rules, page addresses, friendly error messages

import { createClient } from '@supabase/supabase-js'

// ────────────────────────────────────────────────────────────────────────────
// 1. Database connection   (was src/supabase.js)
// ────────────────────────────────────────────────────────────────────────────

// The URL and the publishable key are meant to be public (they end up in the built site).
// What protects your data is the database rules (Row Level Security), not hiding these.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// "pkce" makes email links (password reset, email confirmation) come back as ?code=... instead of
// putting login details after the "#", which this site already uses for its pages (#/edit, #/reset).
// null when the variables are missing; the pages then show an error saying the database isn't set up.
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null

// When someone opens the "reset password" link from their email, show the "choose a new password" page.
// This is registered right here, before the page loads, so the event is never missed.
if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') window.location.hash = '#/reset'
  })
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Countries   (was src/countries.js)
// ────────────────────────────────────────────────────────────────────────────

// Countries are stored as ISO codes ("TR", "BD") in the database.
// Names come from the browser; a few are shortened or kept the way the site has always shown them.
const NAME_OVERRIDES = {
  TR: 'Türkiye', AE: 'UAE', US: 'USA', MK: 'North Macedonia', GB: 'United Kingdom',
  BA: 'Bosnia and Herzegovina',
}
const display = new Intl.DisplayNames(['en'], { type: 'region' })
const nameToCode = new Map()

// Special "country" for videos about the whole world (e.g. a history of inventions):
// they shade the entire map and are listed under "Earth".
export const EARTH = 'EARTH'
export const EARTH_NAME = 'Earth'

export function countryName(code) {
  const upper = code.toUpperCase()
  if (upper === EARTH) return EARTH_NAME
  let name
  try {
    name = NAME_OVERRIDES[upper] || display.of(upper)
  } catch {
    name = upper
  }
  nameToCode.set(name, upper)
  return name
}

// Common mistakes in saved data: "UK" is not an ISO code (the United Kingdom is "GB").
const CODE_ALIASES = { UK: 'GB' }

// Finds the ISO code for a country name such as "Germany", even if no video uses that country yet.
let allNames = null
function codeFromName(name) {
  if (!allNames) {
    allNames = new Map()
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b)
        const n = countryName(code)
        if (n && n !== code && !/unknown/i.test(n)) allNames.set(n.toLowerCase(), code)
      }
    }
  }
  return allNames.get(name.toLowerCase())
}

// Accepts an ISO code ("DE") or a country name ("Germany"), in any capitals. Earth has no flag (null).
export function flagUrl(country) {
  if (!country) return null
  const text = String(country).trim()
  if (!text || text.toUpperCase() === EARTH || text === EARTH_NAME) return null
  let code = /^[A-Z]{2}$/i.test(text) ? text.toUpperCase() : nameToCode.get(text) || codeFromName(text)
  if (!code) return null
  code = CODE_ALIASES[code] || code
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Country centres   (was src/geo.js)
// ────────────────────────────────────────────────────────────────────────────

// Finds a sensible pin position for a country: the centre of its largest land piece.
// Used for corrected/added videos that have no exact place, so they still show a flag on the map.
let centers = null

export function polygonCenter(geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  let best = null
  let bestArea = 0
  for (const poly of polys) {
    const ring = poly[0]
    let a = 0
    let cx = 0
    let cy = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x1, y1] = ring[j]
      const [x2, y2] = ring[i]
      const f = x1 * y2 - x2 * y1
      a += f
      cx += (x1 + x2) * f
      cy += (y1 + y2) * f
    }
    const area = Math.abs(a) / 2
    if (a !== 0 && area > bestArea) {
      bestArea = area
      best = [+(cy / (3 * a)).toFixed(2), +(cx / (3 * a)).toFixed(2)] // [lat, lng]
    }
  }
  return best
}

// world = the FeatureCollection from world.json; code = "TR", "BD", ...
export function countryCenter(world, code) {
  if (!world) return null
  if (!centers) {
    centers = new Map()
    for (const f of world.features) centers.set(f.properties.code, polygonCenter(f.geometry))
  }
  return centers.get(code) || null
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Database reads   (was src/overrides.js)
// ────────────────────────────────────────────────────────────────────────────

// All topics, channels and videos live in the Supabase database (tables: categories,
// channels, channels_extra, videos, video_overrides). Only the country borders are a file.

// Reads every row of a table. Supabase returns at most 1000 rows per request,
// so bigger tables are read in pages of 1000.
async function readAll(table, order) {
  if (!supabase) throw new Error('The database is not set up: add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local')
  const rows = []
  for (let from = 0; ; from += 1000) {
    let query = supabase.from(table).select('*').range(from, from + 999)
    if (order) query = query.order(order)
    const { data, error } = await query
    if (error) throw new Error(`Could not load ${table}: ${error.message}`)
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

// Corrections made on the edit page: video id -> { countries, place_name, lat, lng }.
// Optional: if they can't be loaded, the videos are shown without them.
export async function getOverrides() {
  if (!supabase) return new Map()
  try {
    return new Map((await readAll('video_overrides')).map((o) => [o.video_id, o]))
  } catch (e) {
    console.warn('Could not load corrections:', e.message)
    return new Map()
  }
}

// Returns the video with its correction applied. A corrected video gets exactly the
// countries and place saved on the edit page (no place saved = pin at the country's centre).
export function applyOverride(video, override) {
  if (!override) return video
  // eslint-disable-next-line no-unused-vars
  const { place, needsReview, ...rest } = video
  const hasPlace = override.lat != null && override.lng != null
  return {
    ...rest,
    countries: override.countries || [],
    ...(hasPlace ? { place: { name: override.place_name || '', lat: override.lat, lng: override.lng } } : {}),
    edited: true,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Loading data   (was src/api.js)
// ────────────────────────────────────────────────────────────────────────────

// Topics in tab order. Admins can delete any of them on the edit page.
export async function getCategories() {
  return (await readAll('categories', 'sort')).map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon || '📌',
    color: c.color || '#4ba3f0',
    added: true,
  }))
}

// Channels: the "channels" table (with logos), plus the ones added on the edit page ("channels_extra").
// A channel can be in both: then what was saved on the edit page (name, country, link) wins,
// because the Channels tab of the edit page saves into channels_extra; the logo comes from "channels".
export async function getChannels() {
  const [main, extra] = await Promise.all([readAll('channels'), readAll('channels_extra')])
  const edited = new Map(extra.map((c) => [c.id, c]))
  const tidy = (c, e = {}) => ({
    id: c.id,
    name: e.name || c.name,
    country: e.country || c.country || undefined,
    url: e.url || c.url || undefined,
    logo: c.logo || undefined,
    logoCredit: c.logo_credit || undefined,
  })
  const ids = new Set(main.map((c) => c.id))
  return [...main.map((c) => tidy(c, edited.get(c.id))), ...extra.filter((c) => !ids.has(c.id)).map((c) => tidy(c))]
}

// Country borders (Natural Earth, public domain) for shading and country-centre pins.
// This is the one data file left in public/data; it's fetched once.
let world = null
export function getWorld() {
  if (!world) {
    world = fetch(import.meta.env.BASE_URL + 'data/world.json').then((res) => {
      if (!res.ok) throw new Error(`Could not load the country borders (${res.status})`)
      return res.json()
    })
    world.catch(() => (world = null)) // allow a retry after a failed request
  }
  return world
}

// Videos of the given topics, with saved corrections applied and a few fields the UI uses.
//   added: true for videos added on the edit page (they have "added_by"); false for the
//          original videos that were imported into the database
export async function getVideos(categoryIds) {
  const [rows, overrides, borders] = await Promise.all([
    readAll('videos'),
    getOverrides(),
    getWorld().catch(() => null), // only needed for country-centre pins
  ])
  return rows
    .filter((r) => (r.categories || []).some((c) => categoryIds.includes(c)))
    .map((r) => ({
      id: r.id,
      channel: r.channel,
      title: r.title,
      categories: r.categories || [],
      countries: r.countries || [],
      ...(r.lat != null && r.lng != null ? { place: { name: r.place_name || '', lat: r.lat, lng: r.lng } } : {}),
      ...(r.era_from != null ? { era: { from: r.era_from, to: r.era_to ?? r.era_from } } : {}),
      added: Boolean(r.added_by),
    }))
    .map((v) => applyOverride(v, overrides.get(v.id)))
    .map((v) => {
      const countries = v.countries || []
      let place = v.place
      // corrected/added videos without an exact place get a pin at the centre of their first country
      if (!place && (v.edited || v.added) && countries[0] && countries[0] !== EARTH) {
        const c = countryCenter(borders, countries[0])
        if (c) place = { name: countryName(countries[0]), lat: c[0], lng: c[1] }
      }
      return {
        ...v,
        ...(place ? { place } : {}),
        countries,
        countryNames: countries.map(countryName),
        url: 'https://www.youtube.com/watch?v=' + v.id,
      }
    })
}

// The map markers work with flat "stops": one per video that has a place.
// Videos without a place still count for country shading and the sidebar.
export function toStops(videos, colorOf) {
  return videos
    .filter((v) => v.place && v.place.lat != null)
    .map((v) => ({
      id: v.id,
      place: v.place.name,
      country: v.countryNames[0],
      lat: v.place.lat,
      lng: v.place.lng,
      title: v.title,
      url: v.url,
      color: colorOf(v),
    }))
}

// A channel's logo: "logo" in the channels table is a file under public/ (e.g. "logos/veritasium.png")
// or a full https:// URL. Returns null when the channel has none.
export function channelLogo(channel) {
  if (!channel?.logo) return null
  return /^https?:\/\//.test(channel.logo) ? channel.logo : import.meta.env.BASE_URL + channel.logo
}

// 1971 -> "1971", -500 -> "500 BC"; an era { from, to } -> "1914–1918" (or one year if equal).
export const formatYear = (y) => (y < 0 ? `${-y} BC` : `${y}`)
export const formatEra = (era) =>
  era.from === era.to ? formatYear(era.from) : `${formatYear(era.from)}–${formatYear(era.to)}`

// ────────────────────────────────────────────────────────────────────────────
// 6. Map grouping   (was src/groupByCountry.js)
// ────────────────────────────────────────────────────────────────────────────

// Groups flat stops into countries -> cities -> videos.
// If a stop has no `country`, it is taken from the end of `place` ("Tirana, Albania" -> "Albania").
// Countries with fewer than `minVideos` videos get cluster:false, so the map
// shows their cities directly instead of a country marker.
// `color` on a city/country is the topic colour when all its videos share one, otherwise null.
export function groupByCountry(stops, minVideos = 4) {
  const countries = new Map()
  for (const s of stops) {
    const name = s.country || s.place.split(', ').pop()
    if (!countries.has(name)) countries.set(name, { country: name, cities: new Map(), videos: 0 })
    const c = countries.get(name)
    c.videos += 1
    if (!c.cities.has(s.place)) c.cities.set(s.place, { place: s.place, lat: s.lat, lng: s.lng, videos: [] })
    c.cities.get(s.place).videos.push({ id: s.id, title: s.title, url: s.url, color: s.color })
  }
  const shared = (videos) => (videos.every((v) => v.color === videos[0].color) ? videos[0].color : null)
  return [...countries.values()].map((c) => {
    const cities = [...c.cities.values()].map((city) => ({ ...city, color: shared(city.videos) }))
    return {
      country: c.country,
      videos: c.videos,
      cities,
      color: shared(cities.flatMap((x) => x.videos)),
      lat: cities.reduce((a, x) => a + x.lat, 0) / cities.length,
      lng: cities.reduce((a, x) => a + x.lng, 0) / cities.length,
      cluster: c.videos >= minVideos,
    }
  })
}

// ────────────────────────────────────────────────────────────────────────────
// 7. Sign-in helpers   (was src/authHelpers.js)
// ────────────────────────────────────────────────────────────────────────────

// Small helpers for sign-in, usernames and page addresses (no database code, so they are easy to test).

export const MIN_PASSWORD = 6
export const USERNAME_RULE = '3 to 20 characters: lowercase letters, numbers and underscores'

// Usernames are stored in lowercase, so "Rafi_99" and "rafi_99" are the same username.
export const normalizeUsername = (text) => (text || '').trim().toLowerCase()
export const validUsername = (text) => /^[a-z0-9_]{3,20}$/.test(text)

// Splits an address such as "#/edit?video=abc123" into { path: "/edit", params }.
export function parseRoute(hash) {
  const raw = (hash || '').replace(/^#/, '')
  const [path, query = ''] = raw.split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

// "Wrong password" style messages from the server, in plain words.
export function friendlyAuthError(message = '') {
  if (/invalid login credentials/i.test(message)) return 'Wrong username/email or password.'
  if (/rate limit|too many|after \d+ seconds/i.test(message)) return 'Too many attempts. Please wait a little and try again.'
  if (/already registered|already been registered/i.test(message)) return 'An account with this email already exists. Try signing in instead.'
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first: open the link we sent you.'
  return message
}
