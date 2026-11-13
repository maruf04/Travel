import { countryName } from './countries'

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
export const getChannels = () => get('channels.json')
export const getWorld = () => get('world.json')

// Loads every category file and adds a few derived fields used by the UI.
export async function getVideos(categoryIds) {
  const lists = await Promise.all(categoryIds.map((id) => get(`videos/${id}.json`)))
  const seen = new Set()
  return lists
    .flat()
    .filter((v) => !seen.has(v.id) && seen.add(v.id))
    .map((v) => ({
      ...v,
      countries: v.countries || [],
      countryNames: (v.countries || []).map(countryName),
      url: 'https://www.youtube.com/watch?v=' + v.id,
    }))
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
