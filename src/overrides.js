import { supabase } from './supabase'

// Everything here reads the Supabase database. None of it ever throws: if the database
// can't be reached the site simply shows the JSON files in public/data.

// Corrections made on the edit page: video id -> { countries, place_name, lat, lng }.
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

// Videos added on the edit page, in the same shape as the videos in the JSON files.
export async function getDbVideos() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase.from('videos').select('*').limit(5000)
    if (error) throw error
    return data.map((r) => ({
      id: r.id,
      channel: r.channel,
      title: r.title,
      categories: r.categories || [],
      countries: r.countries || [],
      ...(r.lat != null && r.lng != null ? { place: { name: r.place_name || '', lat: r.lat, lng: r.lng } } : {}),
      ...(r.era_from != null ? { era: { from: r.era_from, to: r.era_to ?? r.era_from } } : {}),
      added: true,
    }))
  } catch (e) {
    console.warn('Could not load added videos:', e.message)
    return []
  }
}

// Channels added on the edit page (for videos from a YouTuber that isn't in channels.json).
export async function getDbChannels() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase.from('channels_extra').select('*')
    if (error) throw error
    return data.map((c) => ({ id: c.id, name: c.name, country: c.country || undefined, url: c.url || undefined }))
  } catch (e) {
    console.warn('Could not load added channels:', e.message)
    return []
  }
}

// Topics (categories) added on the edit page, in tab order.
export async function getDbCategories() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort')
    if (error) throw error
    return data.map((c) => ({ id: c.id, name: c.name, icon: c.icon || '📌', color: c.color || '#4ba3f0', added: true }))
  } catch (e) {
    console.warn('Could not load added topics:', e.message)
    return []
  }
}
