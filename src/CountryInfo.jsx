import { useEffect, useState } from 'react'
import { flagUrl, EARTH_NAME } from './countries'

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
export default function CountryInfo({ country, visible }) {
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
