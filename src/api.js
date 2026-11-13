import { countryName } from './countries'

// All data lives in public/data/ as static JSON, so GitHub Pages can serve it:
//   categories.json        topics (travel, history, ...) with colour and icon
//   channels.json          YouTube channels
//   videos/<category>.json videos whose main topic is that category
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

export async function getVideos(categoryIds) {
  const lists = await Promise.all(categoryIds.map((id) => get(`videos/${id}.json`)))
  const seen = new Set()
  return lists.flat().filter((v) => !seen.has(v.id) && seen.add(v.id))
}

// The map and sidebar work with flat "stops": one per video, pinned at its place.
// Videos without a place are skipped for now (they will be shown by country shading later).
export function toStops(videos) {
  return videos
    .filter((v) => v.place && v.place.lat != null)
    .map((v) => ({
      id: v.id,
      place: v.place.name,
      country: countryName(v.countries[0]),
      lat: v.place.lat,
      lng: v.place.lng,
      title: v.title,
      url: 'https://www.youtube.com/watch?v=' + v.id,
      categories: v.categories,
    }))
}
