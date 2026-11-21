// Sign-in screens (the rules and helpers they use are in data.js, useAuth is in hooks.js).
//   1. AuthPage        sign in, create an account, forgot password
//   2. ResetPassword   choose a new password (opened from the email link, #/reset)
//   3. AccountPanel    "Account" tab: change username, email and password

import { useState, useEffect } from 'react'
import { supabase, MIN_PASSWORD, USERNAME_RULE, friendlyAuthError, normalizeUsername, validUsername } from './data'
import { useAuth } from './hooks'

// ────────────────────────────────────────────────────────────────────────────
// 1. AuthPage   (was src/AuthPage.jsx)
// ────────────────────────────────────────────────────────────────────────────

// Where email links (confirm account, reset password) send people back to: the site's own address.
const siteUrl = () => window.location.origin + import.meta.env.BASE_URL

// Sign in (with a username or an email), create an account (username + email + password),
// and "forgot password". Every mode starts with an empty form.
export function AuthPage() {
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

// ────────────────────────────────────────────────────────────────────────────
// 2. ResetPassword   (was src/ResetPassword.jsx)
// ────────────────────────────────────────────────────────────────────────────

// The page people land on from the "reset password" email: choose a new password.
export function ResetPassword() {
  const { enabled, session } = useAuth()
  const [waited, setWaited] = useState(false) // the link needs a moment to be checked
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500)
    return () => clearTimeout(t)
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`)
    if (password !== again) return setError('The two passwords are not the same.')
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) return setError(err.message)
    setPassword('')
    setAgain('')
    setDone(true)
  }

  let body
  if (!enabled) {
    body = <p className="auth-error">Supabase isn't configured.</p>
  } else if (done) {
    body = (
      <>
        <p className="auth-notice">Your password has been changed. You are signed in.</p>
        <a className="auth-submit auth-linkbtn" href="#/edit">Go to the edit page</a>
        <a className="auth-back" href="#/">← Back to the map</a>
      </>
    )
  } else if (!session) {
    body = waited ? (
      <>
        <p className="auth-error">This reset link is invalid or has expired. Reset links work once, and only in the browser where you asked for them.</p>
        <a className="auth-submit auth-linkbtn" href="#/edit">Request a new link</a>
      </>
    ) : (
      <p className="auth-sub">Checking your reset link…</p>
    )
  } else {
    body = (
      <form onSubmit={submit}>
        <label>
          New password
          <div className="auth-pw">
            <input type={show ? 'text' : 'password'} placeholder={`At least ${MIN_PASSWORD} characters`} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={MIN_PASSWORD} autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
          </div>
        </label>
        <label>
          Repeat the new password
          <input type={show ? 'text' : 'password'} value={again} onChange={(e) => setAgain(e.target.value)} required minLength={MIN_PASSWORD} autoComplete="new-password" />
        </label>
        <button className="auth-submit" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </form>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo" aria-hidden="true">🔑</div>
        <h1>Choose a new password</h1>
        {body}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 3. AccountPanel   (was src/AccountPanel.jsx)
// ────────────────────────────────────────────────────────────────────────────

// "Account" tab: change your username, email and password.
export function AccountPanel({ user }) {
  const [username, setUsername] = useState('')
  const [savedName, setSavedName] = useState('')
  const [email, setEmail] = useState('')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState({ where: '', text: '', bad: false })

  useEffect(() => {
    supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSavedName(data?.username || '')
        setUsername(data?.username || '')
      })
  }, [user.id])

  const say = (where, text, bad = false) => setMsg({ where, text, bad })

  async function saveUsername(e) {
    e.preventDefault()
    const name = normalizeUsername(username)
    if (!validUsername(name)) return say('username', `Username must be ${USERNAME_RULE}.`, true)
    if (name === savedName) return say('username', 'That is already your username.', true)
    setBusy('username')
    const { error } = await supabase.rpc('set_my_username', { p_username: name })
    setBusy('')
    if (error) return say('username', error.message, true)
    setSavedName(name)
    setUsername(name)
    say('username', 'Username changed.')
  }

  async function saveEmail(e) {
    e.preventDefault()
    const addr = email.trim()
    if (!addr || addr.toLowerCase() === (user.email || '').toLowerCase()) return say('email', 'Enter a different email address.', true)
    setBusy('email')
    const { error } = await supabase.auth.updateUser({ email: addr }, { emailRedirectTo: siteUrl() })
    setBusy('')
    if (error) return say('email', friendlyAuthError(error.message), true)
    setEmail('')
    say('email', 'We sent a confirmation link. Your email changes after you open it (check the new address, and maybe the old one too).')
  }

  async function savePassword(e) {
    e.preventDefault()
    if (next.length < MIN_PASSWORD) return say('password', `The new password must be at least ${MIN_PASSWORD} characters.`, true)
    if (next !== again) return say('password', 'The two new passwords are not the same.', true)
    setBusy('password')
    // check the current password first, so only the real owner can change it
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current })
    if (signInErr) {
      setBusy('')
      return say('password', 'Your current password is wrong.', true)
    }
    const { error } = await supabase.auth.updateUser({ password: next })
    setBusy('')
    if (error) return say('password', error.message, true)
    setCurrent('')
    setNext('')
    setAgain('')
    say('password', 'Password changed.')
  }

  const note = (where) => msg.where === where && msg.text && <p className={msg.bad ? 'auth-error' : 'a-msg'}>{msg.text}</p>

  return (
    <div className="a-account">
      <form className="panel a-editor" onSubmit={saveUsername}>
        <h2>Username</h2>
        <p className="muted">You can sign in with your username or your email. {savedName ? <>Your username is <strong>{savedName}</strong>.</> : 'You have not chosen a username yet.'}</p>
        <div className="a-field">
          <input placeholder="e.g. rafi_99" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} autoCapitalize="none" spellCheck={false} />
          <small>{USERNAME_RULE}. Must be unique.</small>
        </div>
        {note('username')}
        <div className="a-inline"><button className="a-btn primary" disabled={busy === 'username'}>{busy === 'username' ? 'Saving…' : 'Save username'}</button></div>
      </form>

      <form className="panel a-editor" onSubmit={saveEmail}>
        <h2>Email</h2>
        <p className="muted">Current email: <strong>{user.email}</strong>. It is only used to reset your password and is never shown on the site.</p>
        <div className="a-field">
          <input type="email" placeholder="New email address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        {note('email')}
        <div className="a-inline"><button className="a-btn primary" disabled={busy === 'email'}>{busy === 'email' ? 'Sending…' : 'Change email'}</button></div>
      </form>

      <form className="panel a-editor" onSubmit={savePassword}>
        <h2>Password</h2>
        <div className="a-field">
          <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          <input type="password" placeholder={`New password (at least ${MIN_PASSWORD} characters)`} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={MIN_PASSWORD} />
          <input type="password" placeholder="Repeat the new password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required minLength={MIN_PASSWORD} />
        </div>
        {note('password')}
        <div className="a-inline"><button className="a-btn primary" disabled={busy === 'password'}>{busy === 'password' ? 'Saving…' : 'Change password'}</button></div>
      </form>
    </div>
  )
}
