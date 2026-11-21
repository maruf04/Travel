import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Pane, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { groupByCountry } from './groupByCountry'
import { flagUrl, countryName, EARTH, EARTH_NAME } from './countries'
import { useAuth } from './useAuth'

// Esri "Canvas" basemaps: muted gray styles, no API key needed. A base layer plus a
// transparent labels layer on top. (CARTO's dark tiles now require an API key.)
const esri = (name) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${name}/MapServer/tile/{z}/{y}/{x}`
const TILES = {
  dark: { base: esri('World_Dark_Gray_Base'), labels: esri('World_Dark_Gray_Reference') },
  light: { base: esri('World_Light_Gray_Base'), labels: esri('World_Light_Gray_Reference') },
}
const ATTRIBUTION = 'Tiles &copy; <a href="https://www.esri.com">Esri</a> — Esri, HERE, Garmin, &copy; OpenStreetMap contributors'

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
// `color` is the topic colour, shown as the ring; white when videos from several topics are mixed.
const flagIcon = (country, size, count, color) => {
  const url = flagUrl(country)
  const ring = color || '#fff'
  const bg = url ? `${ring} url(${url}) center/cover` : ring
  const bubble = count > 1
    ? `<span style="position:absolute;right:-6px;bottom:-6px;min-width:18px;height:18px;padding:0 4px;
        box-sizing:border-box;background:#222;color:#fff;border-radius:9px;font:600 11px/18px system-ui;
        text-align:center;border:1.5px solid #fff">${count}</span>`
    : ''
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:${size > 30 ? 3 : 2.5}px solid ${ring};box-sizing:border-box;
      box-shadow:0 0 0 1px rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.45)">${bubble}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/* ---------- map internals ---------- */

// Re-fits the view only when `fitKey` changes (topic or channel), not while the
// timeline slider moves, so the map doesn't jump around under the user.
function FitToStops({ stops, fitKey }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length) {
      map.fitBounds(stops.map((x) => [x.lat, x.lng]), { padding: [40, 40], maxZoom: 5 })
    } else {
      map.setView([20, 0], 2)
    }
    // stops are deliberately left out: only a topic/channel change re-fits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map])
  return null
}

// Shades each country by how many videos mention it (more videos = stronger colour).
// Covers videos without a pin too, e.g. a geopolitics video about two countries.
function CountryShading({ world, counts, color, onSelect }) {
  const map = useMap()
  const select = useRef(onSelect)
  useEffect(() => {
    select.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!world) return
    // Earth videos are drawn by EarthShading, so they don't set the scale for countries
    const max = Math.max(1, ...Object.entries(counts).filter(([c]) => c !== EARTH).map(([, n]) => n))
    const strength = (n) => (n ? 0.14 + 0.46 * (Math.log(n + 1) / Math.log(max + 1)) : 0)
    const layer = L.geoJSON(world, {
      style: (f) => {
        const n = counts[f.properties.code] || 0
        return { color, weight: n ? 0.8 : 0, opacity: 0.55, fillColor: color, fillOpacity: strength(n), interactive: n > 0 }
      },
      onEachFeature: (f, l) => {
        const n = counts[f.properties.code]
        if (!n) return
        l.bindTooltip(`${countryName(f.properties.code)} · ${n} ${n === 1 ? 'video' : 'videos'}`, { sticky: true })
        l.on({
          mouseover: () => l.setStyle({ weight: 2, opacity: 1, fillOpacity: Math.min(0.85, strength(n) + 0.18) }),
          mouseout: () => layer.resetStyle(l),
          click: () => {
            select.current(countryName(f.properties.code))
            map.flyToBounds(l.getBounds(), { padding: [40, 40], maxZoom: 6 })
          },
        })
      },
    }).addTo(map)
    return () => layer.remove()
  }, [world, counts, color, map])
  return null
}

// Videos about the whole world ("countries": ["EARTH"]) tint the entire map. The tint sits in
// its own pane below the country shading, so clicking a shaded country still opens that
// country, and clicking anywhere else (ocean, unshaded land) opens the Earth list.
function EarthShading({ count, color, onSelect }) {
  const map = useMap()
  const select = useRef(onSelect)
  useEffect(() => {
    select.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!count) return
    if (!map.getPane('earth')) map.createPane('earth').style.zIndex = 350 // tiles 200 < earth < countries 400
    // three world-widths wide, so the tint also covers the repeated copies of the map
    const layer = L.rectangle([[-85, -540], [85, 540]], {
      pane: 'earth', stroke: false, fillColor: color, fillOpacity: 0.1,
    })
      .bindTooltip(`🌍 ${EARTH_NAME} · ${count} ${count === 1 ? 'video' : 'videos'} about the whole world`, { sticky: true })
      .on({
        mouseover: () => layer.setStyle({ fillOpacity: 0.16 }),
        mouseout: () => layer.setStyle({ fillOpacity: 0.1 }),
        click: () => select.current(EARTH_NAME),
      })
      .addTo(map)
    return () => layer.remove()
  }, [count, color, map])
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
  const { role } = useAuth()
  const canEdit = role === 'admin' || role === 'member' // only editors see the Edit button

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
        {canEdit && id && (
          <a
            href={`#/edit?video=${id}`}
            title="Edit this video's country, place and details"
            style={{
              flex: 'none', height: 40, padding: '0 14px', borderRadius: 999, border: '2px solid #fff', background: 'rgba(255,255,255,.14)',
              color: '#fff', font: '600 13px system-ui', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            ✏️ Edit
          </a>
        )}
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
      icon={flagIcon(country, 26, city.videos.length, city.color)}
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
            icon={flagIcon(g.country, 42, g.videos, g.color)}
            eventHandlers={{ click: () => open(g) }}
          >
            <Tooltip>{g.country} · {g.videos} videos</Tooltip>
          </Marker>
        )
      )}
      {selected &&
        createPortal(
          <button className="map-back" onClick={close}>
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
  minVideos = 2,
  mapHeight = 'max(520px, 72vh)',
  selectedCountry,
  onSelectCountry,
  playing,
  onPlay,
  focusCity,
  theme = 'dark',
  fitKey, // changes when topic or channel changes: map resets and re-fits
  world, // country borders for shading (optional)
  countryCounts = {}, // { ISO code: number of videos }
  shadeColor = '#ff7a50',
}) {
  const closeVideo = useCallback(() => onPlay(null), [onPlay])
  const groups = useMemo(() => groupByCountry(stops, minVideos), [stops, minVideos])

  // switching topic or channel -> back to the world view, video closed
  useEffect(() => {
    onSelectCountry(null)
    onPlay(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      className="map"
      style={{ height: mapHeight, width: '100%' }}
    >
      {/* key forces a fresh layer when the theme changes */}
      <TileLayer key={theme} attribution={ATTRIBUTION} url={(TILES[theme] || TILES.dark).base} maxNativeZoom={16} />
      {/* labels sit above the country shading so names stay readable */}
      <Pane name="labels" style={{ zIndex: 450, pointerEvents: 'none' }}>
        <TileLayer key={theme + '-labels'} url={(TILES[theme] || TILES.dark).labels} maxNativeZoom={16} />
      </Pane>
      <EarthShading count={countryCounts[EARTH] || 0} color={shadeColor} onSelect={onSelectCountry} />
      <CountryShading world={world} counts={countryCounts} color={shadeColor} onSelect={onSelectCountry} />
      <FocusCity focusCity={focusCity} />
      <FitToStops stops={stops} fitKey={fitKey} />
      <Markers groups={groups} selected={selectedCountry} setSelected={onSelectCountry} onPlay={onPlay} />
      <VideoOverlay video={playing} onClose={closeVideo} />
    </MapContainer>
  )
}
