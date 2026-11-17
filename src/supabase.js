import { createClient } from '@supabase/supabase-js'

// The URL and the publishable key are meant to be public (they end up in the built site).
// What protects your data is the database rules (Row Level Security), not hiding these.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// null when the variables are missing, so the public site still works from the JSON files.
export const supabase = url && key ? createClient(url, key) : null
