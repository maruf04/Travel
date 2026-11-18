import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { getCategories, getChannels, getVideos } from './api'
import { useAuth } from './useAuth'
import EmojiPicker from './EmojiPicker'
import { defaultIcon, normalizeContact } from './contactLinks'
import HeroScene from './HeroScene'
import { countryName, flagUrl, EARTH, EARTH_NAME } from './countries'

/* ---------- helpers ---------- */

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

// youtube.com/watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID, or just the 11-character ID
function extractId(text) {
  const m = text.trim().match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/)
  if (m) return m[1]
  return /^[A-Za-z0-9_-]{11}$/.test(text.trim()) ? text.trim() : null
}

const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Finds the centre of a country on OpenStreetMap, so every saved video has a pin on the map
// (even small countries that are missing from the border data). Returns null if it fails.
async function geocodeCountry(code) {
  if (!code || code === EARTH) return null
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(countryName(code)))
    const hit = (await res.json())[0]
    return hit ? { lat: +(+hit.lat).toFixed(4), lng: +(+hit.lon).toFixed(4) } : null
  } catch {
    return null
  }
}

// Both empty -> no pin. Otherwise both must be valid numbers.
function parsePlace(lat, lng) {
  const hasLat = lat !== '' && lat != null
  const hasLng = lng !== '' && lng != null
  if (!hasLat && !hasLng) return { lat: null, lng: null }
  if (hasLat !== hasLng) return { error: 'Fill in both latitude and longitude, or neither.' }
  const la = +lat
  const lo = +lng
  if (Number.isNaN(la) || Number.isNaN(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
    return { error: 'Latitude must be between -90 and 90, longitude between -180 and 180.' }
  }
  return { lat: la, lng: lo }
}

function CountryChip({ code, onRemove }) {
  const flag = flagUrl(code)
  return (
    <span className="a-chip">
      {flag && <img src={flag} alt="" width="18" height="12" />}
      {countryName(code)}
      {onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${countryName(code)}`}>×</button>}
    </span>
  )
}

/* ---------- form pieces shared by "edit" and "add" ---------- */

function CountryPicker({ codes, setCodes, onMsg }) {
  const [adding, setAdding] = useState('')
  function add() {
    const code = findCode(adding)
    if (!code) return onMsg(`"${adding}" isn't a country I recognise. Pick one from the suggestions.`)
    onMsg('')
    if (!codes.includes(code)) setCodes([...codes, code])
    setAdding('')
  }
  return (
    <div className="a-field">
      <span>Countries</span>
      <div className="a-chips">
        {codes.length === 0 && <small>None yet</small>}
        {codes.map((c) => <CountryChip key={c} code={c} onRemove={() => setCodes(codes.filter((x) => x !== c))} />)}
      </div>
      <div className="a-inline">
        <input
          list="country-list"
          placeholder="Type a country (or Earth) and press Add"
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button type="button" className="a-btn" onClick={add}>Add</button>
      </div>
      <small>The first country is used for the map pin and flag.</small>
    </div>
  )
}

function PlaceFields({ codes, placeName, setPlaceName, lat, setLat, lng, setLng, onMsg }) {
  // Looks the place up on OpenStreetMap and fills in latitude/longitude.
  async function lookup() {
    const q = placeName || codes.filter((c) => c !== EARTH).map(countryName).join(', ')
    if (!q) return onMsg('Type a place name first.')
    onMsg('Looking up…')
    try {
      const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q))
      const hit = (await res.json())[0]
      if (!hit) return onMsg('Nothing found for that place.')
      setLat(+(+hit.lat).toFixed(4))
      setLng(+(+hit.lon).toFixed(4))
      if (!placeName) setPlaceName(q)
      onMsg('Found it. Check the numbers, then save.')
    } catch {
      onMsg('Lookup failed. You can type latitude and longitude yourself.')
    }
  }
  return (
    <div className="a-field">
      <span>Place on the map (optional)</span>
      <input placeholder="e.g. Topkapı, Istanbul, Türkiye" value={placeName} onChange={(e) => setPlaceName(e.target.value)} />
      <div className="a-inline">
        <input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
        <input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" />
        <button type="button" className="a-btn" onClick={lookup}>Look up</button>
      </div>
      <small>Leave latitude and longitude empty and the pin goes to the centre of the first country.</small>
    </div>
  )
}

/* ---------- sign in / create account ---------- */

function AuthPage() {
  const [mode, setMode] = useState('in') // 'in' = sign in, 'up' = create account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Switching between "Sign in" and "Create account" starts with an empty form.
  function switchMode(next) {
    setMode(next)
    setEmail('')
    setPassword('')
    setShow(false)
    setError('')
    setNotice('')
  }

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
      else {
        setPassword('')
        setNotice('Account created! If you received a confirmation email, open it first. Then sign in. An admin will approve your account before you can edit.')
      }
    }
    setBusy(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <a className="auth-back" href="#/">← Back to the map</a>
        <div className="auth-logo" aria-hidden="true">🌍</div>
        <h1>{mode === 'in' ? 'Welcome back' : 'Join the team'}</h1>
        <p className="auth-sub">
          {mode === 'in'
            ? 'Sign in to add videos and fix countries on the Vlogger World Tracker.'
            : 'Create an account to help keep the map accurate.'}
        </p>

        <div className="auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => switchMode('in')}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => switchMode('up')}>Create account</button>
        </div>

        <form key={mode} onSubmit={submit}>
          <label>
            Email
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label>
            Password
            <div className="auth-pw">
              <input
                type={show ? 'text' : 'password'}
                placeholder={mode === 'up' ? 'At least 8 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'up' ? 8 : undefined}
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              />
              <button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          <button className="auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}
        <p className="auth-foot">New accounts must be approved by an admin before they can edit anything.</p>
      </div>
    </div>
  )
}

/* ---------- edit one video ---------- */

function Editor({ video, user, isAdmin, onClose, onSaved }) {
  const [codes, setCodes] = useState(video.countries)
  const [placeName, setPlaceName] = useState(video.place?.name || '')
  const [lat, setLat] = useState(video.place?.lat ?? '')
  const [lng, setLng] = useState(video.place?.lng ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    const place = parsePlace(lat, lng)
    if (place.error) return setMsg(place.error)
    setBusy(true)
    if (place.lat === null) {
      const c = await geocodeCountry(codes[0]) // no place typed: pin the first country
      if (c) Object.assign(place, c)
    }
    const { error } = await supabase.from('video_overrides').upsert({
      video_id: video.id,
      countries: codes,
      place_name: placeName || null,
      lat: place.lat,
      lng: place.lng,
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

  async function remove() {
    if (!window.confirm('Delete this video from the site? This cannot be undone.')) return
    setBusy(true)
    await supabase.from('video_overrides').delete().eq('video_id', video.id)
    const { error } = await supabase.from('videos').delete().eq('id', video.id)
    setBusy(false)
    if (error) return setMsg('Could not delete: ' + error.message)
    onSaved()
    onClose()
  }

  return (
    <div className="a-editor">
      <CountryPicker codes={codes} setCodes={setCodes} onMsg={setMsg} />
      <PlaceFields codes={codes} placeName={placeName} setPlaceName={setPlaceName} lat={lat} setLat={setLat} lng={lng} setLng={setLng} onMsg={setMsg} />
      {msg && <p className="a-msg">{msg}</p>}
      <div className="a-inline">
        <button className="a-btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button className="a-btn" onClick={onClose} disabled={busy}>Cancel</button>
        {video.edited && <button className="a-btn" onClick={reset} disabled={busy}>Reset to original</button>}
        {isAdmin && video.added && <button className="a-btn danger" onClick={remove} disabled={busy}>Delete video</button>}
      </div>
    </div>
  )
}

/* ---------- list of videos ---------- */

function VideoList({ videos, channels, user, isAdmin, onChanged }) {
  const [mode, setMode] = useState('nocountry')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [limit, setLimit] = useState(40)

  const channelName = useMemo(() => Object.fromEntries(channels.map((c) => [c.id, c.name])), [channels])

  const shown = useMemo(
    () =>
      videos.filter((v) => {
        if (mode === 'nocountry' && !(v.countries.length === 0 || v.countries.includes(EARTH))) return false
        if (mode === 'edited' && !v.edited) return false
        if (mode === 'added' && !v.added) return false
        return !q || v.title.toLowerCase().includes(q.toLowerCase())
      }),
    [videos, mode, q]
  )

  const modes = [
    ['nocountry', 'No country / Earth'],
    ['edited', 'Edited'],
    ['added', 'Added here'],
    ['all', 'All videos'],
  ]

  return (
    <section className="panel">
      <h2>Videos ({shown.length})</h2>
      <div className="chips">
        {modes.map(([id, label]) => (
          <button key={id} className={mode === id ? 'chip on' : 'chip'} onClick={() => { setMode(id); setLimit(40) }}>{label}</button>
        ))}
      </div>
      <input className="a-search" placeholder="Search titles…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(40) }} />

      <div className="a-list">
        {shown.slice(0, limit).map((v) => (
          <div key={v.id} className="a-row">
            <div className="a-head">
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" width="96" height="54" loading="lazy" />
              <div className="a-info">
                <strong>{v.title}</strong>
                <small>{channelName[v.channel] || v.channel}{v.edited ? ' · edited' : ''}{v.added ? ' · added here' : ''}</small>
                <div className="a-chips">
                  {v.countries.length === 0 ? <small>No country</small> : v.countries.map((c) => <CountryChip key={c} code={c} />)}
                </div>
              </div>
              <button className="a-btn" onClick={() => setOpenId(openId === v.id ? null : v.id)}>{openId === v.id ? 'Close' : 'Edit'}</button>
            </div>
            {openId === v.id && <Editor key={v.id} video={v} user={user} isAdmin={isAdmin} onClose={() => setOpenId(null)} onSaved={onChanged} />}
          </div>
        ))}
        {shown.length === 0 && <p>No videos match.</p>}
      </div>
      {shown.length > limit && <button className="a-btn" onClick={() => setLimit(limit + 40)}>Show more</button>}
    </section>
  )
}

/* ---------- topics (categories) ---------- */

// Small form to create a topic. Used inside "Add a video" and on the Topics tab (admins only).
function NewTopic({ categories, onCreated }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📌')
  const [color, setColor] = useState('#4ba3f0')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function create() {
    if (!name.trim()) return setMsg('Give the topic a name.')
    const id = slug(name) || 'topic-' + Date.now().toString(36) // names in other scripts get a generated id
    if (categories.some((c) => c.id === id || c.name.toLowerCase() === name.trim().toLowerCase())) {
      return setMsg('A topic with this name already exists.')
    }
    setBusy(true)
    const { error } = await supabase
      .from('categories')
      .insert({ id, name: name.trim(), icon: icon.trim() || null, color, sort: categories.length })
    setBusy(false)
    if (error) return setMsg('Could not add the topic: ' + error.message)
    setName('')
    setMsg('')
    setOpen(false)
    onCreated(id)
  }

  if (!open) return <button type="button" className="a-btn" onClick={() => setOpen(true)}>＋ New topic</button>
  return (
    <div className="a-newtopic">
      <div className="a-inline">
        <input
          placeholder="Topic name, e.g. Food"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), create())}
        />
        <EmojiPicker value={icon} onChange={setIcon} />
        <input className="a-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Topic colour" title="Topic colour" />
      </div>
      {msg && <p className="a-msg">{msg}</p>}
      <div className="a-inline">
        <button type="button" className="a-btn primary" onClick={create} disabled={busy}>{busy ? 'Adding…' : 'Add topic'}</button>
        <button type="button" className="a-btn" onClick={() => { setOpen(false); setMsg('') }}>Cancel</button>
      </div>
    </div>
  )
}

function CategoriesPanel({ categories, onChanged }) {
  const [error, setError] = useState('')
  async function remove(c) {
    if (!window.confirm(`Delete the topic "${c.name}"? Its videos stay in the database but won't show until they get another topic.`)) return
    const { error: err } = await supabase.from('categories').delete().eq('id', c.id)
    if (err) setError(err.message)
    else onChanged()
  }
  return (
    <section className="panel">
      <h2>Topics ({categories.length})</h2>
      <div className="a-list">
        {categories.map((c) => (
          <div key={c.id} className="a-row a-member">
            <span><span style={{ color: c.color }}>●</span> {c.icon} {c.name}{c.added ? '' : ' · from the data files'}</span>
            {c.added && <button className="a-btn danger" onClick={() => remove(c)}>Delete</button>}
          </div>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <NewTopic categories={categories} onCreated={onChanged} />
    </section>
  )
}

/* ---------- channels added on the edit page ---------- */

function ChannelRow({ row, onSave, saved }) {
  const [text, setText] = useState(row.country ? countryName(row.country) : '')
  return (
    <div className="a-row a-member">
      <span>{row.name}</span>
      <span className="a-inline">
        <input list="country-list" placeholder="Home country" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="a-btn" onClick={() => onSave(row, text)}>{saved ? 'Saved ✓' : 'Save'}</button>
      </span>
    </div>
  )
}

function ChannelsPanel() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('channels_extra').select('id, name, country').order('name')
    if (err) setError(err.message)
    else setRows(data)
  }, [])
  useEffect(() => {
    load()
  }, [load])

  async function save(row, text) {
    let code = null
    if (text.trim()) {
      code = findCode(text)
      if (!code || code === EARTH) return setError(`"${text}" isn't a country I recognise. Pick one from the suggestions.`)
    }
    const { error: err } = await supabase.from('channels_extra').update({ country: code }).eq('id', row.id)
    if (err) return setError(err.message)
    setError('')
    setSaved(row.id)
    load()
  }

  return (
    <section className="panel">
      <h2>Channels added here ({rows.length})</h2>
      <p className="muted">Set each channel's home country. Channels from the original data files can't be changed on this page yet.</p>
      {error && <p className="error">{error}</p>}
      <div className="a-list">
        {rows.map((r) => <ChannelRow key={r.id + (r.country || '')} row={r} onSave={save} saved={saved === r.id} />)}
        {rows.length === 0 && !error && <p>No channels were added here yet.</p>}
      </div>
    </section>
  )
}

/* ---------- add a video ---------- */

function AddVideo({ categories, channels, existingIds, isAdmin, onAdded }) {
  const [link, setLink] = useState('')
  const [id, setId] = useState(null)
  const [title, setTitle] = useState('')
  const [channelSel, setChannelSel] = useState('')
  const [newChannel, setNewChannel] = useState('')
  const [newChannelCountry, setNewChannelCountry] = useState('')
  const [cats, setCats] = useState([])
  const [codes, setCodes] = useState([])
  const [placeName, setPlaceName] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [eraFrom, setEraFrom] = useState('')
  const [eraTo, setEraTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  // Asks YouTube for the video's title and channel (works for most public videos).
  async function fetchInfo(videoId) {
    setMsg('Fetching the title…')
    try {
      const url = 'https://www.youtube.com/watch?v=' + videoId
      const res = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url))
      if (!res.ok) throw new Error('oembed')
      const d = await res.json()
      setTitle(d.title || '')
      const match = channels.find((c) => c.name.toLowerCase() === (d.author_name || '').toLowerCase())
      if (match) {
        setChannelSel(match.id)
      } else {
        setChannelSel('__new')
        setNewChannel(d.author_name || '')
      }
      setMsg('Title and channel filled in. Check them, then fill in the rest.')
    } catch {
      setMsg("Couldn't fetch the title automatically. Type the title and pick the channel yourself.")
    }
  }

  function onLink(value) {
    setLink(value)
    const vid = extractId(value)
    setId(vid)
    if (vid && vid !== id) fetchInfo(vid)
  }

  const toggleCat = (c) => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])

  async function add(e) {
    e.preventDefault()
    setMsg('')
    if (!id) return setMsg("That doesn't look like a YouTube video link.")
    if (existingIds.has(id)) return setMsg('This video is already on the site.')
    if (!title.trim()) return setMsg('Please enter the video title.')
    const channelName = newChannel.trim()
    if (!channelSel || (channelSel === '__new' && !channelName)) return setMsg('Choose a channel, or type the name of a new one.')
    let channelCountry = null
    if (channelSel === '__new' && newChannelCountry.trim()) {
      channelCountry = findCode(newChannelCountry)
      if (!channelCountry || channelCountry === EARTH) return setMsg(`"${newChannelCountry}" isn't a country I recognise. Pick one from the suggestions.`)
    }
    if (cats.length === 0) return setMsg('Choose at least one topic.')
    const place = parsePlace(lat, lng)
    if (place.error) return setMsg(place.error)

    let from = null
    let to = null
    if (cats.includes('history') && eraFrom !== '') {
      from = parseInt(eraFrom, 10)
      to = eraTo === '' ? from : parseInt(eraTo, 10)
      if (Number.isNaN(from) || Number.isNaN(to) || to < from) return setMsg('Years: use whole numbers (negative for BC), and "to" must not be before "from".')
    }

    setBusy(true)
    if (place.lat === null) {
      const c = await geocodeCountry(codes[0]) // no place typed: pin the first country
      if (c) Object.assign(place, c)
    }
    let channelId = channelSel
    if (channelSel === '__new') {
      const base = slug(channelName) || 'channel'
      const taken = new Set(channels.map((c) => c.id))
      channelId = base
      for (let n = 2; taken.has(channelId); n++) channelId = `${base}-${n}`
      const { error } = await supabase.from('channels_extra').insert({ id: channelId, name: channelName, country: channelCountry })
      if (error) {
        setBusy(false)
        return setMsg('Could not save the channel: ' + error.message)
      }
    }
    const { error } = await supabase.from('videos').insert({
      id,
      channel: channelId,
      title: title.trim(),
      categories: cats,
      countries: codes,
      place_name: placeName || null,
      lat: place.lat,
      lng: place.lng,
      era_from: from,
      era_to: to,
    })
    setBusy(false)
    if (error) return setMsg('Could not add the video: ' + error.message)

    setMsg(`Added “${title.trim()}”. It now shows on the map.`)
    setLink(''); setId(null); setTitle(''); setChannelSel(''); setNewChannel(''); setNewChannelCountry(''); setCats([]); setCodes([])
    setPlaceName(''); setLat(''); setLng(''); setEraFrom(''); setEraTo('')
    onAdded()
  }

  return (
    <form className="panel a-editor" onSubmit={add}>
      <h2>Add a video</h2>

      <div className="a-field">
        <span>YouTube link</span>
        <input placeholder="Paste a youtube.com or youtu.be link" value={link} onChange={(e) => onLink(e.target.value)} />
        {id && (
          <div className="a-preview">
            <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" width="128" height="72" />
            {existingIds.has(id) && <small className="error">This video is already on the site.</small>}
          </div>
        )}
      </div>

      <div className="a-field">
        <span>Title</span>
        <input placeholder="Video title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="a-field">
        <span>Channel</span>
        <select value={channelSel} onChange={(e) => setChannelSel(e.target.value)}>
          <option value="">Choose a channel…</option>
          {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="__new">+ A new channel…</option>
        </select>
        {channelSel === '__new' && (
          <>
            <input placeholder="New channel name" value={newChannel} onChange={(e) => setNewChannel(e.target.value)} />
            <input list="country-list" placeholder="Channel's home country (optional)" value={newChannelCountry} onChange={(e) => setNewChannelCountry(e.target.value)} />
          </>
        )}
      </div>

      <div className="a-field">
        <span>Topics</span>
        <div className="chips">
          {categories.map((c) => (
            <button type="button" key={c.id} className={cats.includes(c.id) ? 'chip on' : 'chip'} onClick={() => toggleCat(c.id)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
        {isAdmin && (
          <NewTopic
            categories={categories}
            onCreated={async (id) => {
              await onAdded() // reload topics so the new one appears
              setCats((prev) => [...prev, id])
            }}
          />
        )}
      </div>

      <CountryPicker codes={codes} setCodes={setCodes} onMsg={setMsg} />
      <PlaceFields codes={codes} placeName={placeName} setPlaceName={setPlaceName} lat={lat} setLat={setLat} lng={lng} setLng={setLng} onMsg={setMsg} />

      {cats.includes('history') && (
        <div className="a-field">
          <span>Years covered (History, optional)</span>
          <div className="a-inline">
            <input placeholder="From, e.g. 1914 (negative for BC)" value={eraFrom} onChange={(e) => setEraFrom(e.target.value)} inputMode="numeric" />
            <input placeholder="To, e.g. 1918" value={eraTo} onChange={(e) => setEraTo(e.target.value)} inputMode="numeric" />
          </div>
        </div>
      )}

      {msg && <p className="a-msg">{msg}</p>}
      <div className="a-inline">
        <button className="a-btn primary" disabled={busy}>{busy ? 'Adding…' : 'Add video'}</button>
      </div>
    </form>
  )
}

/* ---------- account requests and members (admin) ---------- */

const ROLE_LABELS = {
  pending: 'Pending (no access)',
  member: 'Member (can edit)',
  admin: 'Admin',
  declined: 'Declined',
}

function useProfiles() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('profiles').select('user_id, email, role')
    if (err) return setError(err.message)
    setError('')
    const order = { pending: 0, member: 1, admin: 2, declined: 3 } // people waiting come first
    setRows([...data].sort((x, y) => (order[x.role] ?? 9) - (order[y.role] ?? 9) || (x.email || '').localeCompare(y.email || '')))
  }, [])
  useEffect(() => {
    load()
  }, [load])
  async function setRole(userId, role) {
    const { error: err } = await supabase.from('profiles').update({ role }).eq('user_id', userId)
    if (err) setError(err.message)
    else load()
  }
  return { rows, error, setRole }
}

// Shown at the top for admins: people who created an account and are waiting.
function Requests({ rows, setRole }) {
  const waiting = rows.filter((r) => r.role === 'pending')
  if (waiting.length === 0) return null
  return (
    <section className="panel a-requests">
      <h2>🔔 {waiting.length} account {waiting.length === 1 ? 'request' : 'requests'} waiting</h2>
      <div className="a-list">
        {waiting.map((r) => (
          <div key={r.user_id} className="a-row a-member">
            <span>{r.email || r.user_id}</span>
            <span className="a-inline">
              <button className="a-btn primary" onClick={() => setRole(r.user_id, 'member')}>Approve</button>
              <button className="a-btn" onClick={() => setRole(r.user_id, 'declined')}>Decline</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Members({ rows, error, setRole, meId }) {
  return (
    <section className="panel">
      <h2>Members ({rows.length})</h2>
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

/* ---------- my profile (how I appear in the footer) ---------- */

function ProfilePanel({ user }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(defaultIcon(user.id))
  const [contact, setContact] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase
      .from('contributor_profiles')
      .select('display_name, icon, contact_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.display_name || '')
          setIcon(data.icon || defaultIcon(user.id))
          setContact((data.contact_url || '').replace(/^mailto:/i, ''))
        }
        setLoaded(true)
      })
  }, [user.id])

  async function save(e) {
    e.preventDefault()
    setMsg('')
    if (!name.trim()) return setMsg('Please enter the name you want to show.')
    const link = normalizeContact(contact)
    if (link === undefined) return setMsg("That contact doesn't look right. Use an email, a phone number or a web link.")
    setBusy(true)
    const { error } = await supabase.from('contributor_profiles').upsert({
      user_id: user.id,
      display_name: name.trim(),
      icon: icon || null,
      contact_url: link,
      updated_at: new Date().toISOString(),
    })
    setBusy(false)
    setMsg(error ? 'Could not save: ' + error.message : 'Saved. You appear in the footer once you have added a video.')
  }

  return (
    <form className="panel a-editor" onSubmit={save}>
      <h2>My profile</h2>
      <p className="muted">People who add videos are listed under "Contributors" in the footer. Choose how you appear.</p>

      <div className="a-field">
        <span>Name to show</span>
        <input placeholder="e.g. Rafi" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} disabled={!loaded} />
      </div>

      <div className="a-field">
        <span>Icon</span>
        <div className="a-inline"><EmojiPicker value={icon} onChange={setIcon} /></div>
      </div>

      <div className="a-field">
        <span>Contact link (optional)</span>
        <input placeholder="Email, phone, or a web link such as facebook.com/yourname" value={contact} onChange={(e) => setContact(e.target.value)} disabled={!loaded} />
        <small>Your name and icon both link here. It is public, so only use something you are happy to share.</small>
      </div>

      <div className="a-field">
        <span>Preview</span>
        <span className="contrib"><span className="contrib-icon">{icon}</span><span className="contrib-name">{name.trim() || 'Your name'}</span></span>
      </div>

      {msg && <p className="a-msg">{msg}</p>}
      <div className="a-inline"><button className="a-btn primary" disabled={busy || !loaded}>{busy ? 'Saving…' : 'Save profile'}</button></div>
    </form>
  )
}

/* ---------- signed-in area ---------- */

function Workspace({ user, role }) {
  const isAdmin = role === 'admin'
  const [tab, setTab] = useState('videos')
  const [categories, setCategories] = useState([])
  const [channels, setChannels] = useState([])
  const [videos, setVideos] = useState([])
  const [error, setError] = useState('')
  const profiles = useProfiles()

  const load = useCallback(async () => {
    try {
      const [cats, chans] = await Promise.all([getCategories(), getChannels()])
      setCategories(cats)
      setChannels(chans)
      setVideos(await getVideos(cats.map((c) => c.id)))
    } catch (e) {
      setError(e.message)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const existingIds = useMemo(() => new Set(videos.map((v) => v.id)), [videos])
  const waiting = profiles.rows.filter((r) => r.role === 'pending').length

  const tabs = [
    ['videos', '✏️ Edit videos'],
    ['add', '➕ Add video'],
    ['channels', '📺 Channels'],
    ['profile', '👤 My profile'],
    ...(isAdmin ? [['topics', '🏷️ Topics'], ['members', `👥 Members${waiting ? ` (${waiting})` : ''}`]] : []),
  ]

  return (
    <>
      {isAdmin && <Requests rows={profiles.rows} setRole={profiles.setRole} />}
      <nav className="a-tabs" aria-label="Edit sections">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      {error && <p className="error">{error}</p>}
      {tab === 'videos' && <VideoList videos={videos} channels={channels} user={user} isAdmin={isAdmin} onChanged={load} />}
      {tab === 'add' && <AddVideo categories={categories} channels={channels} existingIds={existingIds} isAdmin={isAdmin} onAdded={load} />}
      {tab === 'channels' && <ChannelsPanel />}
      {tab === 'profile' && <ProfilePanel user={user} />}
      {tab === 'topics' && isAdmin && <CategoriesPanel categories={categories} onChanged={load} />}
      {tab === 'members' && isAdmin && <Members rows={profiles.rows} error={profiles.error} setRole={profiles.setRole} meId={user.id} />}
      <datalist id="country-list">
        {ALL_COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
      </datalist>
    </>
  )
}

/* ---------- page ---------- */

export default function Admin() {
  const { enabled, session, role, loading } = useAuth()
  const canEdit = role === 'admin' || role === 'member'

  if (!enabled) {
    return (
      <div className="app admin">
        <p className="error">Supabase isn't configured: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing.</p>
      </div>
    )
  }
  if (loading) return <div className="app admin"><p>Loading…</p></div>
  if (!session) return <AuthPage />

  let body
  if (role === 'pending') {
    body = <p className="panel">Your account is waiting for an admin to approve it. Come back after you've been approved.</p>
  } else if (role === 'declined') {
    body = <p className="panel">Your account request wasn't approved. Contact the site owner if you think this is a mistake.</p>
  } else if (!canEdit) {
    body = <p className="error">This account has no access yet. Ask an admin to add you.</p>
  } else {
    body = <Workspace user={session.user} role={role} />
  }

  return (
    <div className="app admin">
      <header className="hero hero-sm">
        <HeroScene />
        <div className="hero-inner">
          <div className="hero-text">
            <h1>Edit videos</h1>
            <p>
              <a href="#/">← Back to the map</a>
              <small> · {session.user.email}{canEdit ? ` (${role})` : ''}</small>
            </p>
          </div>
          <div className="hero-actions">
            <button className="hero-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
      </header>
      {body}
    </div>
  )
}
