// Small helpers for contributor profiles (no database code here, so they are easy to test).

// A default icon for people who have not picked one, so contributors look different.
export const FALLBACK_ICONS = ['🧭', '🌍', '🎒', '📷', '🛰️', '🔭', '🗺️', '🎬', '🏔️', '🌊', '🦅', '🚀']

export function defaultIcon(seed = '') {
  let h = 0
  for (const ch of String(seed)) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return FALLBACK_ICONS[h % FALLBACK_ICONS.length]
}

// Only these kinds of link may be used as a contact link (never javascript: and the like).
const ALLOWED = /^(https?:\/\/|mailto:|tel:)/i

// For links read from the database before they are shown: returns the link or null.
export function safeHref(url) {
  return typeof url === 'string' && ALLOWED.test(url.trim()) ? url.trim() : null
}

// Turns what a person types into a link:
//   ''                         -> null        (no contact link; that is allowed)
//   'name@example.com'         -> 'mailto:name@example.com'
//   '+8801712345678'           -> 'tel:+8801712345678'
//   'facebook.com/someone'     -> 'https://facebook.com/someone'
//   'https://...'              -> unchanged
//   anything invalid           -> undefined
export function normalizeContact(text) {
  const t = (text || '').trim()
  if (!t) return null
  if (ALLOWED.test(t)) return safeUrl(t)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'mailto:' + t
  if (/^\+?[\d\s()-]{6,}$/.test(t)) return 'tel:' + t.replace(/[\s()-]/g, '')
  if (/^[^\s]+\.[^\s]+$/.test(t)) return safeUrl('https://' + t)
  return undefined
}

function safeUrl(u) {
  if (/^(mailto:|tel:)/i.test(u)) return u.length > 8 ? u : undefined
  try {
    const parsed = new URL(u)
    return parsed.hostname.includes('.') ? parsed.href : undefined
  } catch {
    return undefined
  }
}
