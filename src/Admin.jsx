import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { getCategories, getChannels, getVideos } from './api'
import { countryName, flagUrl, EARTH, EARTH_NAME } from './countries'

// Every country the browser knows, plus "Earth" for videos about the whole world.
const ALL_COUNTRIES = (() => {
  const list = []
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b)
      const name = countryName(code)
      if (name && name !== code && !/unknown/i.test(name)) list.push({ code, name })
    }
  }
  list.push({ code: EARTH, name: EARTH_NAME })
  return list.sort((x, y) => x.name.localeCompare(y.name))
})()

// "tr", "Türkiye" or "earth" -> "TR" / "EARTH" (null if not found)
function findCode(text) {
  const t = text.trim().toLowerCase()
  if (!t) return null
  const hit = ALL_COUNTRIES.find((c) => c.code.toLowerCase() === t || c.name.toLowerCase() === t)
  if (hit) return hit.code
  const starts = ALL_COUNTRIES.filter((c) => c.name.toLowerCase().startsWith(t))
  return starts.length === 1 ? starts[0].code : null
}

function CountryChip({ code, onRemove }) {
  const flag = flagUrl(code)
  return (
    <span className="a-chip">
      {flag && <img src={flag} alt="" width="18" height="12" />}
      {countryName(code)}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${countryName(code)}`}>×</button>
      )}
    </span>
  )
}

/* ---------- login / sign up ---------- */

function Login() {
  const [mode, setMode] = useState('in') // 'in' = sign in, 'up' = create account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    if (mode === 'in') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) setError(err.message)
      else setNotice('Account created. If you got a confirmation email, open it first. Then sign in; an admin must approve your account before you can edit.')
    }
    setBusy(false)
  }

  return (
    <form className="panel a-login" onSubmit={submit}>
      <h2>{mode === 'in' ? 'Sign in to edit' : 'Create an account'}</h2>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
      <input
        type="password"
        placeholder={mode === 'in' ? 'Password' : 'Password (at least 8 characters)'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={mode === 'up' ? 8 : undefined}
        autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
      />
      <button className="a-btn primary" disabled={busy}>
        {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
      </button>
      {error && <p className="error">{error}</p>}
      {notice && <p className="a-msg">{notice}</p>}
      <button
        type="button"
        className="a-link"
        onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); setNotice('') }}
      >
        {mode === 'in' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
      </button>
    </form>
  )
}

/* ---------- editor for one video ---------- */

function Editor({ video, user, onClose, onSaved }) {
  const [codes, setCodes] = useState(video.countries)
  const [adding, setAdding] = useState('')
  const [placeName, setPlaceName] = useState(video.place?.name || '')
  const [lat, setLat] = useState(video.place?.lat ?? '')
  const [lng, setLng] = useState(video.place?.lng ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  function addCountry() {
    const code = findCode(adding)
    if (!code) return setMsg(`"${adding}" isn't a country I recognise. Pick one from the suggestions.`)
    setMsg('')
    if (!codes.includes(code)) setCodes([...codes, code])
    setAdding('')
  }

  // Looks the place up on OpenStreetMap and fills in latitude/longitude.
  async function lookup() {
    const q = placeName || codes.map(countryName).join(', ')
    if (!q) return setMsg('Type a place name first.')
    setMsg('Looking up…')
    try {
      const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q))
      const hit = (await res.json())[0]
      if (!hit) return setMsg('Nothing found for that place.')
      setLat(+(+hit.lat).toFixed(4))
      setLng(+(+hit.lon).toFixed(4))
      if (!placeName) setPlaceName(q)
      setMsg('Found it. Check the numbers, then save.')
    } catch {
      setMsg('Lookup failed. You can type latitude and longitude yourself.')
    }
  }

  async function save() {
    const hasLat = lat !== '' && lat !== null
    const hasLng = lng !== '' && lng !== null
    if (hasLat !== hasLng) return setMsg('Fill in both latitude and longitude, or neither.')
    if (hasLat && (Number.isNaN(+lat) || Number.isNaN(+lng) || Math.abs(+lat) > 90 || Math.abs(+lng) > 180)) {
      return setMsg('Latitude must be between -90 and 90, longitude between -180 and 180.')
    }
    setBusy(true)
    const { error } = await supabase.from('video_overrides').upsert({
      video_id: video.id,
      countries: codes,
      place_name: placeName || null,
      lat: hasLat ? +lat : null,
      lng: hasLng ? +lng : null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    setBusy(false)
    if (error) return setMsg('Could not save: ' + error.message)
    onSaved()
    onClose()
  }

  async function reset() {
    if (!window.confirm('Remove your correction and go back to the original data for this video?')) return
    setBusy(true)
    const { error } = await supabase.from('video_overrides').delete().eq('video_id', video.id)
    setBusy(false)
    if (error) return setMsg('Could not reset: ' + error.message)
    onSaved()
    onClose()
  }

  return (
    <div className="a-editor">
      <div className="a-field">
        <span>Countries</span>
        <div className="a-chips">
          {codes.length === 0 && <small>None yet</small>}
          {codes.map((c) => (
            <CountryChip key={c} code={c} onRemove={() => setCodes(codes.filter((x) => x !== c))} />
          ))}
        </div>
        <div className="a-inline">
          <input
            list="country-list"
            placeholder="Type a country (or Earth) and press Add"
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCountry())}
          />
          <button type="button" className="a-btn" onClick={addCountry}>Add</button>
        </div>
        <small>The first country is used for the map pin and flag.</small>
      </div>

      <div className="a-field">
        <span>Place on the map (optional)</span>
        <input placeholder="e.g. Topkapı, Istanbul, Türkiye" value={placeName} onChange={(e) => setPlaceName(e.target.value)} />
        <div className="a-inline">
          <input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
          <input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" />
          <button type="button" className="a-btn" onClick={lookup}>Look up</button>
        </div>
        <small>Leave latitude and longitude empty for no pin; the video still appears under its countries.</small>
      </div>

      {msg && <p className="a-msg">{msg}</p>}
      <div className="a-inline">
        <button className="a-btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button className="a-btn" onClick={onClose} disabled={busy}>Cancel</button>
        {video.edited && <button className="a-btn danger" onClick={reset} disabled={busy}>Reset to original</button>}
      </div>
    </div>
  )
}

/* ---------- list of videos ---------- */

function Panel({ user }) {
  const [videos, setVideos] = useState([])
  const [channels, setChannels] = useState({})
  const [error, setError] = useState('')
  const [mode, setMode] = useState('nocountry')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [limit, setLimit] = useState(40)

  const load = useCallback(async () => {
    try {
      const [cats, chans] = await Promise.all([getCategories(), getChannels()])
      setChannels(Object.fromEntries(chans.map((c) => [c.id, c.name])))
      setVideos(await getVideos(cats.map((c) => c.id)))
    } catch (e) {
      setError(e.message)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const shown = useMemo(
    () =>
      videos.filter((v) => {
        if (mode === 'nocountry' && !(v.countries.length === 0 || v.countries.includes(EARTH))) return false
        if (mode === 'edited' && !v.edited) return false
        return !q || v.title.toLowerCase().includes(q.toLowerCase())
      }),
    [videos, mode, q]
  )

  const modes = [
    ['nocountry', 'No country / Earth'],
    ['edited', 'Edited by me'],
    ['all', 'All videos'],
  ]

  return (
    <section className="panel">
      <h2>Videos ({shown.length})</h2>
      <div className="chips">
        {modes.map(([id, label]) => (
          <button key={id} className={mode === id ? 'chip on' : 'chip'} onClick={() => { setMode(id); setLimit(40) }}>
            {label}
          </button>
        ))}
      </div>
      <input className="a-search" placeholder="Search titles…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(40) }} />
      {error && <p className="error">{error}</p>}

      <div className="a-list">
        {shown.slice(0, limit).map((v) => (
          <div key={v.id} className="a-row">
            <div className="a-head">
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" width="96" height="54" loading="lazy" />
              <div className="a-info">
                <strong>{v.title}</strong>
                <small>{channels[v.channel] || v.channel}{v.edited ? ' · edited' : ''}</small>
                <div className="a-chips">
                  {v.countries.length === 0 ? <small>No country</small> : v.countries.map((c) => <CountryChip key={c} code={c} />)}
                </div>
              </div>
              <button className="a-btn" onClick={() => setOpenId(openId === v.id ? null : v.id)}>
                {openId === v.id ? 'Close' : 'Edit'}
              </button>
            </div>
            {openId === v.id && (
              <Editor key={v.id} video={v} user={user} onClose={() => setOpenId(null)} onSaved={load} />
            )}
          </div>
        ))}
        {shown.length === 0 && <p>No videos match.</p>}
      </div>
      {shown.length > limit && (
        <button className="a-btn" onClick={() => setLimit(limit + 40)}>Show more</button>
      )}
      <datalist id="country-list">
        {ALL_COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
      </datalist>
    </section>
  )
}

/* ---------- members (admin only) ---------- */

const ROLE_LABELS = { pending: 'Pending (no access)', member: 'Member (can edit)', admin: 'Admin' }

function Members({ meId }) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('profiles').select('user_id, email, role')
    if (err) return setError(err.message)
    const order = { pending: 0, member: 1, admin: 2 } // people waiting for approval first
    setRows([...data].sort((x, y) => order[x.role] - order[y.role] || (x.email || '').localeCompare(y.email || '')))
  }, [])
  useEffect(() => {
    load()
  }, [load])

  async function setRole(userId, role) {
    setError('')
    const { error: err } = await supabase.from('profiles').update({ role }).eq('user_id', userId)
    if (err) setError(err.message)
    else load()
  }

  const waiting = rows.filter((r) => r.role === 'pending').length

  return (
    <section className="panel">
      <h2>Members{waiting ? ` · ${waiting} waiting for approval` : ''}</h2>
      {error && <p className="error">{error}</p>}
      <div className="a-list">
        {rows.map((r) => (
          <div key={r.user_id} className="a-row a-member">
            <span>{r.email || r.user_id}{r.user_id === meId ? ' (you)' : ''}</span>
            <select value={r.role} disabled={r.user_id === meId} onChange={(e) => setRole(r.user_id, e.target.value)}>
              {Object.entries(ROLE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        ))}
        {rows.length === 0 && !error && <p>No accounts yet.</p>}
      </div>
    </section>
  )
}

/* ---------- page ---------- */

// Same page for everyone: sign in, then members and admins can edit videos;
// admins also see the Members list where they approve new accounts.
export default function Admin() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [role, setRole] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setRole(null)
      return
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setRole(data?.role || 'none'))
  }, [session])

  const canEdit = role === 'admin' || role === 'member'
  let body
  if (!supabase) {
    body = <p className="error">Supabase isn't configured: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing.</p>
  } else if (session === undefined) {
    body = <p>Loading…</p>
  } else if (!session) {
    body = <Login />
  } else if (role === null) {
    body = <p>Checking your access…</p>
  } else if (role === 'pending') {
    body = <p className="panel">Your account is waiting for an admin to approve it. Come back after you've been approved.</p>
  } else if (!canEdit) {
    body = <p className="error">This account has no access yet. Ask an admin to add you.</p>
  } else {
    body = (
      <>
        <Panel user={session.user} />
        {role === 'admin' && <Members meId={session.user.id} />}
      </>
    )
  }

  return (
    <div className="app admin">
      <header className="top">
        <div>
          <h1>Edit videos</h1>
          <p>
            <a href="#/" style={{ color: 'var(--accent)' }}>← Back to the map</a>
            {session && canEdit && <small> · {session.user.email} ({role})</small>}
          </p>
        </div>
        {session && <button className="a-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>}
      </header>
      {body}
    </div>
  )
}
