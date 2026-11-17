import { supabase } from './supabase'

// Corrections made in the admin page: video id -> { countries, place_name, lat, lng }.
// Never throws: if the database is unreachable the site simply shows the JSON data.
export async function getOverrides() {
  if (!supabase) return new Map()
  try {
    const { data, error } = await supabase.from('video_overrides').select('*')
    if (error) throw error
    return new Map(data.map((o) => [o.video_id, o]))
  } catch (e) {
    console.warn('Could not load corrections:', e.message)
    return new Map()
  }
}

// Returns the video with its correction applied. A corrected video gets exactly the
// countries and place saved in the admin page (no place saved = no map pin).
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
