import { createClient } from '@supabase/supabase-js'

// The URL and the publishable key are meant to be public (they end up in the built site).
// What protects your data is the database rules (Row Level Security), not hiding these.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// "pkce" makes email links (password reset, email confirmation) come back as ?code=... instead of
// putting login details after the "#", which this site already uses for its pages (#/edit, #/reset).
// null when the variables are missing, so the public site still works from the JSON files.
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null

// When someone opens the "reset password" link from their email, show the "choose a new password" page.
// This is registered right here, before the page loads, so the event is never missed.
if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') window.location.hash = '#/reset'
  })
}
