import { useEffect, useMemo, useState } from 'react'
import MapView from './MapView'
import CountryVideos from './CountryVideos'
import { useMapSelection } from './useMapSelection'
import { getVloggers, getStops } from './api'

const MAP_HEIGHT = 'max(520px, 72vh)'

export default function App() {
  const [vloggers, setVloggers] = useState([])
  const [country, setCountry] = useState('')
  const [selected, setSelected] = useState(null)
  const [stops, setStops] = useState([])
  const [error, setError] = useState('')
  const sel = useMapSelection() // selected map country, playing video, city to fly to

  useEffect(() => {
    getVloggers().then(setVloggers).catch((e) => setError(e.message))
  }, [])

  const countries = useMemo(
    () => [...new Set(vloggers.map((v) => v.country))].sort(),
    [vloggers]
  )
  const visible = vloggers.filter((v) => v.country === country)

  function chooseCountry(c) {
    setCountry(c)
    setSelected(null)
    setStops([])
  }

  function chooseVlogger(v) {
    setSelected(v)
    getStops(v.id).then(setStops).catch((e) => setError(e.message))
  }

  return (
    <div className="app">
      <header>
        <h1>🌍 Vlogger World Tracker</h1>
        <p>Pick a country, choose a vlogger, then click a country on the map to see and watch their vlogs.</p>
      </header>

      <section className="panel">
        <label>
          Vlogger’s country
          <select value={country} onChange={(e) => chooseCountry(e.target.value)}>
            <option value="">Choose country…</option>
            {countries.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="chips">
          {visible.map((v) => (
            <button key={v.id} className={selected?.id === v.id ? 'chip on' : 'chip'} onClick={() => chooseVlogger(v)}>
              {v.name}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      <div className="map-layout">
        <div className="map-main">
          <MapView stops={stops} mapHeight={MAP_HEIGHT} {...sel.mapProps} />
        </div>

        {/* sidebar beside the map: stays visible while a video plays */}
        <aside className="map-side panel" style={{ maxHeight: MAP_HEIGHT }}>
          {!selected ? (
            <p>Select a vlogger to see the places visited.</p>
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
