// Country panel: what the page shows for a selected country.
//   1. CountryVideos   sidebar list of that country's videos
//   2. CountryInfo     short Wikipedia description under the map while a video plays

import { useMemo, useEffect, useState } from 'react'
import { flagUrl, EARTH_NAME, channelLogo, formatEra } from './data'

// ────────────────────────────────────────────────────────────────────────────
// 1. CountryVideos   (was src/CountryVideos.jsx)
// ────────────────────────────────────────────────────────────────────────────

// Sidebar list: every video that mentions one country (pinned or not).
export function CountryVideos({ videos, country, playing, onPlay, onLocate, colorOf, channels = [] }) {
  // in time order when the videos have years (history), otherwise as stored
  const list = useMemo(() => {
    const own = videos.filter((v) => v.countryNames.includes(country))
    return own.some((v) => v.era)
      ? own.map((v, i) => [v, i]).sort(([a, i], [b, j]) => (a.era?.from ?? Infinity) - (b.era?.from ?? Infinity) || i - j).map(([v]) => v)
      : own
  }, [videos, country])
  const byId = useMemo(() => Object.fromEntries(channels.map((c) => [c.id, c])), [channels])
  if (!list.length) return <p className="muted">No videos for {country} with these filters.</p>

  return (
    <div>
      <div className="side-title">
        {country === EARTH_NAME ? (
          <span className="earth-icon" aria-hidden="true">🌍</span>
        ) : (
          flagUrl(country) && <img src={flagUrl(country)} alt="" width="24" height="16" />
        )}
        {country === EARTH_NAME ? 'Earth (whole world)' : country} · {list.length} {list.length === 1 ? 'video' : 'videos'}
      </div>

      <div className="video-list">
        {list.map((v) => {
          const on = playing?.id === v.id
          return (
            <div key={v.id} className={on ? 'video-row on' : 'video-row'} style={{ '--topic': colorOf(v) }}>
              <button
                className="thumb"
                onClick={() => onPlay(v)}
                title="Play"
                style={{ backgroundImage: `url(https://i.ytimg.com/vi/${v.id}/mqdefault.jpg)` }}
              >
                <span>{on ? '● Playing' : '▶'}</span>
              </button>
              <div style={{ minWidth: 0 }}>
                {v.era && <div className="video-era">🕰️ {formatEra(v.era)}</div>}
                <div className="video-title" onClick={() => onPlay(v)}>{v.title}</div>
                {byId[v.channel] && (
                  <div className="video-channel">
                    {channelLogo(byId[v.channel]) && (
                      <img className="channel-logo" src={channelLogo(byId[v.channel])} alt="" width="14" height="14" />
                    )}
                    {byId[v.channel].name}
                  </div>
                )}
                {v.place && (
                  <button className="link" onClick={() => onLocate({ lat: v.place.lat, lng: v.place.lng })}>
                    📍 {v.place.name}
                  </button>
                )}
                {v.countries.length > 1 && (
                  <div className="also">
                    {v.countries.map((c) => flagUrl(c) && <img key={c} src={flagUrl(c)} alt={c} title={c} width="16" height="11" />)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 2. CountryInfo   (was src/CountryInfo.jsx)
// ────────────────────────────────────────────────────────────────────────────

// Wikipedia page titles for the few names that differ from the names used on the site.
const WIKI_TITLE = {
  UAE: 'United Arab Emirates',
  USA: 'United States',
  Georgia: 'Georgia (country)',
}

const cache = new Map() // country -> summary (or null if none), so each is fetched once

async function fetchSummary(country) {
  if (cache.has(country)) return cache.get(country)
  const title = (WIKI_TITLE[country] || country).replace(/ /g, '_')
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
  const data = res.ok ? await res.json() : null
  const info = data && data.extract
    ? {
        title: data.title,
        description: data.description,
        extract: data.extract,
        image: data.thumbnail?.source,
        page: data.content_urls?.desktop?.page,
      }
    : null
  cache.set(country, info)
  return info
}

// A panel under the map with a short description of the country,
// shown only while one of that country's videos is playing.
export function CountryInfo({ country, visible }) {
  const [info, setInfo] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | done | failed
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!visible || !country || country === EARTH_NAME) return
    let cancelled = false
    setStatus('loading')
    setOpen(false)
    fetchSummary(country)
      .then((i) => {
        if (cancelled) return
        setInfo(i)
        setStatus(i ? 'done' : 'failed')
      })
      .catch(() => !cancelled && setStatus('failed'))
    return () => {
      cancelled = true
    }
  }, [country, visible])

  if (!visible || !country || country === EARTH_NAME) return null

  const flag = flagUrl(country)
  const long = info && info.extract.length > 420

  return (
    <section className="panel country-info" aria-live="polite">
      <div className="country-info-head">
        {flag && <img src={flag} alt="" width="32" height="22" />}
        <h2>About {country}</h2>
      </div>
      {status === 'loading' && <p className="muted">Loading description…</p>}
      {status === 'failed' && <p className="muted">No description is available for this country right now.</p>}
      {status === 'done' && info && (
        <div className="country-info-body">
          {info.image && <img className="country-info-img" src={info.image} alt="" loading="lazy" />}
          <div>
            {info.description && <p className="country-info-sub">{info.description}</p>}
            <p className={open || !long ? '' : 'clamp'}>{info.extract}</p>
            <p className="country-info-links">
              {long && (
                <button className="link" onClick={() => setOpen(!open)}>
                  {open ? 'Show less' : 'Read more'}
                </button>
              )}
              {info.page && (
                <a href={info.page} target="_blank" rel="noopener noreferrer">Source: Wikipedia ↗</a>
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
