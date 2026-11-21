import { useState } from 'react'
import { supabase } from './supabase'
import { MIN_PASSWORD, USERNAME_RULE, friendlyAuthError, normalizeUsername, validUsername } from './authHelpers'

// Where email links (confirm account, reset password) send people back to: the site's own address.
const siteUrl = () => window.location.origin + import.meta.env.BASE_URL

// Sign in (with a username or an email), create an account (username + email + password),
// and "forgot password". Every mode starts with an empty form.
export default function AuthPage() {
  const [mode, setMode] = useState('in') // 'in' | 'up' | 'forgot'
  const [identifier, setIdentifier] = useState('') // sign in: username or email
  const [username, setUsername] = useState('') // sign up
  const [email, setEmail] = useState('') // sign up, forgot password
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function switchMode(next) {
    setMode(next)
    setIdentifier('')
    setUsername('')
    setEmail('')
    setPassword('')
    setShow(false)
    setError('')
    setNotice('')
  }

  async function signIn() {
    let loginEmail = identifier.trim()
    if (!loginEmail.includes('@')) {
      // a username: look up the email it belongs to
      const { data, error: err } = await supabase.rpc('login_email', { p_username: normalizeUsername(loginEmail) })
      if (err) return setError('Could not sign in: ' + err.message)
      loginEmail = data
    }
    if (!loginEmail) return setError('Wrong username/email or password.') // same message either way
    const { error: err } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
    if (err) setError(friendlyAuthError(err.message))
  }

  async function signUp() {
    const name = normalizeUsername(username)
    if (!validUsername(name)) return setError(`Username must be ${USERNAME_RULE}.`)
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`)
    const { data: free, error: checkErr } = await supabase.rpc('username_available', { p_username: name })
    if (checkErr) return setError('Could not check the username: ' + checkErr.message)
    if (!free) return setError('That username is already taken. Please choose another.')
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: name }, emailRedirectTo: siteUrl() },
    })
    if (err) return setError(friendlyAuthError(err.message))
    setPassword('')
    setNotice('Account created! If you received a confirmation email, open it first. Then sign in. An admin will approve your account before you can edit.')
  }

  async function sendReset() {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: siteUrl() })
    if (err) return setError(friendlyAuthError(err.message))
    // the same message whether or not the email has an account, so nobody can use this to check
    setNotice('If an account uses that email, we have sent a link to choose a new password. Open the link on this same device and browser.')
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'in') await signIn()
      else if (mode === 'up') await signUp()
      else await sendReset()
    } finally {
      setBusy(false)
    }
  }

  const titles = {
    in: ['Welcome back', 'Sign in to add videos and fix countries on the Vlogger World Tracker.'],
    up: ['Join the team', 'Create an account to help keep the map accurate.'],
    forgot: ['Reset your password', 'Enter the email you signed up with and we will send you a reset link.'],
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <a className="auth-back" href="#/">← Back to the map</a>
        <div className="auth-logo" aria-hidden="true">🌍</div>
        <h1>{titles[mode][0]}</h1>
        <p className="auth-sub">{titles[mode][1]}</p>

        {mode !== 'forgot' && (
          <div className="auth-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => switchMode('in')}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => switchMode('up')}>Create account</button>
          </div>
        )}

        <form key={mode} onSubmit={submit}>
          {mode === 'in' && (
            <label>
              Username or email
              <input placeholder="your_username or you@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" autoCapitalize="none" spellCheck={false} />
            </label>
          )}
          {mode === 'up' && (
            <>
              <label>
                Username
                <input placeholder="e.g. rafi_99" value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={20} autoComplete="username" autoCapitalize="none" spellCheck={false} />
                <small className="auth-hint">{USERNAME_RULE}. Must be unique.</small>
              </label>
              <label>
                Email
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                <small className="auth-hint">Only used to reset your password. It is never shown on the site.</small>
              </label>
            </>
          )}
          {mode === 'forgot' && (
            <label>
              Email
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
          )}
          {mode !== 'forgot' && (
            <label>
              Password
              <div className="auth-pw">
                <input
                  type={show ? 'text' : 'password'}
                  placeholder={mode === 'up' ? `At least ${MIN_PASSWORD} characters` : 'Your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'up' ? MIN_PASSWORD : undefined}
                  autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                />
                <button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
              </div>
            </label>
          )}
          {mode === 'in' && (
            <button type="button" className="auth-link" onClick={() => switchMode('forgot')}>Forgot password?</button>
          )}
          <button className="auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}
        {mode === 'forgot' && (
          <button type="button" className="auth-link" onClick={() => switchMode('in')}>← Back to sign in</button>
        )}
        {mode !== 'forgot' && <p className="auth-foot">New accounts must be approved by an admin before they can edit anything.</p>}
      </div>
    </div>
  )
}
