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
