import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './useAuth'
import { MIN_PASSWORD } from './authHelpers'

// The page people land on from the "reset password" email: choose a new password.
export default function ResetPassword() {
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
