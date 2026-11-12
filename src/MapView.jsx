import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { groupByCountry } from './groupByCountry'
import { flagUrl } from './countryFlags'

/* ---------- helpers ---------- */

// Pulls the video ID out of a youtube.com/watch?v=... or youtu.be/... link.
function videoId(url) {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null)
  } catch {
    return null
  }
}

// Round flag marker. `count` adds a small number bubble (videos in that country/city).
const flagIcon = (country, size, count) => {
  const url = flagUrl(country)
  const bg = url ? `#e4572e url(${url}) center/cover` : '#e4572e'
  const bubble = count > 1
    ? `<span style="position:absolute;right:-6px;bottom:-6px;min-width:18px;height:18px;padding:0 4px;
        box-sizing:border-box;background:#222;color:#fff;border-radius:9px;font:600 11px/18px system-ui;
        text-align:center;border:1.5px solid #fff">${count}</span>`
    : ''
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:2px solid #fff;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.45)">${bubble}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/* ---------- map internals ---------- */

function FitToStops({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length) {
      map.fitBounds(stops.map((s) => [s.lat, s.lng]), { padding: [40, 40], maxZoom: 5 })
    } else {
      map.setView([20, 0], 2)
    }
  }, [stops, map])
  return null
}

// Flies to a city when the parent asks (e.g. from the sidebar list).
function FocusCity({ focusCity }) {
  const map = useMap()
  useEffect(() => {
    if (focusCity) map.flyTo([focusCity.lat, focusCity.lng], 8)
  }, [focusCity, map])
  return null
}

// Player that covers the map window. Everything stays inside the map's box,
// the close button is always visible, and closing leaves the map exactly as it was.
function VideoOverlay({ video, onClose }) {
  const map = useMap()
  const ref = useRef(null)

  // keep clicks, drags and scrolling on the overlay from reaching the map underneath
  useEffect(() => {
    if (!ref.current) return
    L.DomEvent.disableClickPropagation(ref.current)
    L.DomEvent.disableScrollPropagation(ref.current)
  }, [video])

  useEffect(() => {
    if (!video) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [video, onClose])

  if (!video) return null
  const id = videoId(video.url)

  return createPortal(
    <div
      ref={ref}
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.88)',
        display: 'flex', flexDirection: 'column', gap: 10, padding: 12, boxSizing: 'border-box',
      }}
    >
      {/* header: always at the top, never cut off */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}
      >
        <div style={{ flex: 1, minWidth: 0, font: '600 15px system-ui', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {video.title}
        </div>
        <a href={video.url} target="_blank" rel="noreferrer" style={{ color: '#fff', font: '13px system-ui', whiteSpace: 'nowrap' }}>
          Open on YouTube ↗
        </a>
        <button
          onClick={onClose}
          aria-label="Close video"
          title="Close (Esc)"
          style={{
            flex: 'none', width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', cursor: 'pointer',
            background: '#e4572e', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 3 L15 15 M15 3 L3 15" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* video: fills whatever height is left, so it always fits the map window */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {id ? (
          <div style={{ height: '100%', maxWidth: '100%', aspectRatio: '16 / 9', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
            <iframe
              key={id}
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            />
          </div>
        ) : (
          <div style={{ color: '#fff', font: '14px system-ui' }}>Couldn't load this video here.</div>
        )}
      </div>
    </div>,
    map.getContainer()
  )
}

function CityMarker({ city, country, onPlay, onSelect }) {
  const many = city.videos.length > 1
  return (
    <Marker
      position={[city.lat, city.lng]}
      icon={flagIcon(country, 26, city.videos.length)}
      // one video: play it right away; several: show a list popup
      eventHandlers={
        many
          ? { popupopen: () => onSelect(country) }
          : { click: () => { onSelect(country); onPlay(city.videos[0]) } }
      }
    >
      <Tooltip>
        {city.place} · {many ? `${city.videos.length} videos` : city.videos[0].title}
      </Tooltip>
      {many && (
        <Popup>
          <strong>{city.place}</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
            {city.videos.map((v) => (
              <li key={v.id}>
                <a
                  href={v.url}
                  onClick={(e) => {
                    e.preventDefault()
                    onPlay(v)
                  }}
                >
                  {v.title}
                </a>
              </li>
            ))}
          </ul>
        </Popup>
      )}
    </Marker>
  )
}

function Markers({ groups, selected, setSelected, onPlay }) {
  const map = useMap()

  const open = (g) => {
    setSelected(g.country)
    map.flyToBounds(L.latLngBounds(g.cities.map((c) => [c.lat, c.lng])), { padding: [60, 60], maxZoom: 7 })
  }
  const close = () => {
    setSelected(null)
    map.flyTo([20, 0], 2)
  }

  return (
    <>
      {groups.map((g) =>
        !g.cluster || g.country === selected ? (
          g.cities.map((c) => (
            <CityMarker key={g.country + c.place} city={c} country={g.country} onPlay={onPlay} onSelect={setSelected} />
          ))
        ) : (
          <Marker
            key={g.country}
            position={[g.lat, g.lng]}
            icon={flagIcon(g.country, 42, g.videos)}
            eventHandlers={{ click: () => open(g) }}
          >
            <Tooltip>{g.country} · {g.videos} videos</Tooltip>
          </Marker>
        )
      )}
      {selected &&
        createPortal(
          <button
            onClick={close}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, padding: '6px 12px', cursor: 'pointer' }}
          >
            ← All countries
          </button>,
          map.getContainer()
        )}
    </>
  )
}

/* ---------- main component ---------- */

// Controlled by the parent so the sidebar can show the selected country's videos.
// Use the useMapSelection() hook to create the props.
export default function MapView({
  stops,
  minVideos = 4,
  mapHeight = 'max(520px, 72vh)',
  selectedCountry,
  onSelectCountry,
  playing,
  onPlay,
  focusCity,
}) {
  const closeVideo = useCallback(() => onPlay(null), [onPlay])
  const groups = useMemo(() => groupByCountry(stops, minVideos), [stops, minVideos])

  // switching vlogger -> back to the world view, video closed
  useEffect(() => {
    onSelectCountry(null)
    onPlay(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops])

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      className="map"
      style={{ height: mapHeight, width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FocusCity focusCity={focusCity} />
      <FitToStops stops={stops} />
      <Markers groups={groups} selected={selectedCountry} setSelected={onSelectCountry} onPlay={onPlay} />
      <VideoOverlay video={playing} onClose={closeVideo} />
    </MapContainer>
  )
}
