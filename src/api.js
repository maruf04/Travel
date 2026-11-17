import { countryName, EARTH } from './countries'
import { getOverrides, applyOverride, getDbVideos, getDbChannels } from './overrides'
import { countryCenter } from './geo'

// All data lives in public/data/ as static JSON, so GitHub Pages can serve it:
//   categories.json        topics (travel, history, ...) with colour and icon
//   channels.json          YouTube channels
//   videos/<category>.json videos whose main topic is that category
//   world.json             country borders (Natural Earth, public domain) for shading
// A video's `categories` may list several topics; it is stored in the file of the first one.
const BASE = import.meta.env.BASE_URL + 'data/'

const cache = new Map()
function get(path) {
  if (!cache.has(path)) {
    const p = fetch(BASE + path).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`)
      return res.json()
    })
    p.catch(() => cache.delete(path)) // allow a retry after a failed request
    cache.set(path, p)
  }
  return cache.get(path)
}

export const getCategories = () => get('categories.json')
// channels.json plus any channels added on the edit page
export async function getChannels() {
  const [json, extra] = await Promise.all([get('channels.json'), getDbChannels()])
  const ids = new Set(json.map((c) => c.id))
  return [...json, ...extra.filter((c) => !ids.has(c.id))]
}
export const getWorld = () => get('world.json')

// Loads the JSON category files, adds the videos added on the edit page, applies saved
// corrections, and adds a few derived fields used by the UI.
export async function getVideos(categoryIds) {
  const [lists, overrides, dbVideos, world] = await Promise.all([
    Promise.all(categoryIds.map((id) => get(`videos/${id}.json`))),
    getOverrides(),
    getDbVideos(),
    getWorld().catch(() => null),
  ])
  const added = dbVideos.filter((v) => v.categories.some((c) => categoryIds.includes(c)))
  const seen = new Set()
  return [...lists.flat(), ...added]
    .filter((v) => !seen.has(v.id) && seen.add(v.id))
    .map((v) => applyOverride(v, overrides.get(v.id)))
    .map((v) => {
      const countries = v.countries || []
      let place = v.place
      // corrected/added videos without an exact place get a pin at the centre of their first country
      if (!place && (v.edited || v.added) && countries[0] && countries[0] !== EARTH) {
        const c = countryCenter(world, countries[0])
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

// A channel's logo: "logo" in channels.json is a file under public/ (e.g. "logos/veritasium.png")
// or a full https:// URL. Returns null when the channel has none.
export function channelLogo(channel) {
  if (!channel?.logo) return null
  return /^https?:\/\//.test(channel.logo) ? channel.logo : import.meta.env.BASE_URL + channel.logo
}

// 1971 -> "1971", -500 -> "500 BC"; an era { from, to } -> "1914–1918" (or one year if equal).
export const formatYear = (y) => (y < 0 ? `${-y} BC` : `${y}`)
export const formatEra = (era) =>
  era.from === era.to ? formatYear(era.from) : `${formatYear(era.from)}–${formatYear(era.to)}`
