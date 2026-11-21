import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { MIN_PASSWORD, USERNAME_RULE, friendlyAuthError, normalizeUsername, validUsername } from './authHelpers'

const siteUrl = () => window.location.origin + import.meta.env.BASE_URL

// "Account" tab: change your username, email and password.
export default function AccountPanel({ user }) {
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
