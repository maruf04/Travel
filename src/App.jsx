import { useEffect, useMemo, useState } from 'react'
import MapView from './MapView'
import CountryVideos from './CountryVideos'
import { useMapSelection } from './useMapSelection'
import { useTheme } from './useTheme'
import { getCategories, getChannels, getVideos, toStops } from './api'
import { countryName } from './countries'

const MAP_HEIGHT = 'max(520px, 72vh)'

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [channels, setChannels] = useState([])
  const [videos, setVideos] = useState([])
  const [country, setCountry] = useState('')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const sel = useMapSelection() // selected map country, playing video, city to fly to

  useEffect(() => {
    getChannels().then(setChannels).catch((e) => setError(e.message))
    getCategories()
      .then((cats) => getVideos(cats.map((c) => c.id)))
      .then(setVideos)
      .catch((e) => setError(e.message))
  }, [])

  const countries = useMemo(
    () => [...new Set(channels.map((c) => countryName(c.country)))].sort(),
    [channels]
  )
  const visible = channels.filter((c) => countryName(c.country) === country)

  // useMemo keeps the same array between renders, so the map only resets on a real change
  const stops = useMemo(
    () => (selected ? toStops(videos.filter((v) => v.channel === selected.id)) : []),
    [videos, selected]
  )

  function chooseCountry(c) {
    setCountry(c)
    setSelected(null)
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>🌍 Vlogger World Tracker</h1>
          <p>Pick a country, choose a channel, then click a country on the map to see and watch its videos.</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark theme" title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <section className="panel">
        <label>
          Channel’s country
          <select value={country} onChange={(e) => chooseCountry(e.target.value)}>
            <option value="">Choose country…</option>
            {countries.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="chips">
          {visible.map((c) => (
            <button key={c.id} className={selected?.id === c.id ? 'chip on' : 'chip'} onClick={() => setSelected(c)}>
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      <div className="map-layout">
        <div className="map-main">
          <MapView stops={stops} theme={theme} mapHeight={MAP_HEIGHT} {...sel.mapProps} />
        </div>

        {/* sidebar beside the map: stays visible while a video plays */}
        <aside className="map-side panel" style={{ maxHeight: MAP_HEIGHT }}>
          {!selected ? (
            <p>Select a channel to see the places visited.</p>
          ) : (
            <>
              <h2>{selected.name} · {stops.length} places</h2>
              {sel.selectedCountry ? (
                <CountryVideos
                  stops={stops}
                  country={sel.selectedCountry}
                  playing={sel.playing}
                  onPlay={sel.setPlaying}
                  onLocate={sel.setFocusCity}
                />
              ) : (
                <p>Click a country on the map to see its videos.</p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
