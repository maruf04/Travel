import { supabase } from './supabase'

export { defaultIcon, safeHref, normalizeContact } from './contactLinks'

// People who have added at least one video and filled in their profile,
// most videos first: [{ user_id, display_name, icon, contact_url, videos }]
export async function getContributors() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase.from('public_contributors').select('*')
    if (error) throw error
    return data
  } catch (e) {
    console.warn('Could not load contributors:', e.message)
    return []
  }
}
