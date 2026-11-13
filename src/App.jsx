import { useEffect, useMemo, useState } from 'react'
import MapView from './MapView'
import CountryVideos from './CountryVideos'
import Timeline from './Timeline'
import { useMapSelection } from './useMapSelection'
import { useTheme } from './useTheme'
import { getCategories, getChannels, getVideos, getWorld, inEra, toStops } from './api'
import { flagUrl, EARTH_NAME } from './countries'

const MAP_HEIGHT = 'max(520px, 72vh)'
const ALL = 'all'
const ALL_COLOR = '#ff7a50'

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [categories, setCategories] = useState([])
  const [channels, setChannels] = useState([])
  const [videos, setVideos] = useState([])
  const [world, setWorld] = useState(null)
  const [topic, setTopic] = useState(ALL)
  const [channelId, setChannelId] = useState(ALL)
  const [era, setEra] = useState(null) // null = whole timeline
  const [error, setError] = useState('')
  const sel = useMapSelection() // selected map country, playing video, city to fly to

  useEffect(() => {
    const fail = (e) => setError(e.message)
    getChannels().then(setChannels).catch(fail)
    getCategories()
      .then((cats) => {
        setCategories(cats)
        return getVideos(cats.map((c) => c.id))
      })
      .then(setVideos)
      .catch(fail)
    getWorld().then(setWorld).catch(() => {}) // shading is optional; markers still work without it
  }, [])

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const topicColor = topic === ALL ? ALL_COLOR : catById[topic]?.color || ALL_COLOR
  // Marker colour: the selected topic's colour, or each video's main topic on "All".
  const colorOf = useMemo(
    () => (v) => (topic === ALL ? catById[v.categories[0]]?.color || ALL_COLOR : topicColor),
    [topic, topicColor, catById]
  )

  const inTopic = useMemo(
    () => (topic === ALL ? videos : videos.filter((v) => v.categories.includes(topic))),
    [videos, topic]
  )
  const topicChannels = useMemo(() => {
    const ids = new Set(inTopic.map((v) => v.channel))
    return channels.filter((c) => ids.has(c.id))
  }, [inTopic, channels])
  const inChannel = useMemo(
    () => (channelId === ALL ? inTopic : inTopic.filter((v) => v.channel === channelId)),
    [inTopic, channelId]
  )

  // Timeline appears inside a single topic, when some of its visible videos have an era.
  // (Not on "All": narrowing it there would hide every undated travel video.)
  const eraBounds = useMemo(() => {
    const dated = inChannel.filter((v) => v.era)
    if (topic === ALL || !dated.length) return null
    return [Math.min(...dated.map((v) => v.era.from)), Math.max(...dated.map((v) => v.era.to))]
  }, [inChannel, topic])
  const eraActive = era && eraBounds && (era[0] > eraBounds[0] || era[1] < eraBounds[1])

  const filtered = useMemo(
    () => (eraActive ? inChannel.filter((v) => inEra(v, era)) : inChannel),
    [inChannel, era, eraActive]
  )
  const stops = useMemo(() => toStops(filtered, colorOf), [filtered, colorOf])
  const countryCounts = useMemo(() => {
    const counts = {}
    for (const v of filtered) for (const c of v.countries) counts[c] = (counts[c] || 0) + 1
    return counts
  }, [filtered])
  const topCountries = useMemo(() => {
    const counts = new Map()
    for (const v of filtered) for (const n of v.countryNames) counts.set(n, (counts.get(n) || 0) + 1)
    // Earth (videos about the whole world) first, then countries by number of videos
    return [...counts].sort((a, b) => (b[0] === EARTH_NAME) - (a[0] === EARTH_NAME) || b[1] - a[1])
  }, [filtered])

  const categoryCount = (id) => videos.filter((v) => v.categories.includes(id)).length

  function chooseTopic(id) {
    setTopic(id)
    setEra(null)
    // keep the channel if it has videos in the new topic
    if (id !== ALL && !videos.some((v) => v.channel === channelId && v.categories.includes(id))) setChannelId(ALL)
  }
  function chooseChannel(id) {
    setChannelId(id)
    setEra(null)
  }
  function surprise() {
    if (!filtered.length) return
    const v = filtered[Math.floor(Math.random() * filtered.length)]
    sel.mapProps.onSelectCountry(v.countryNames[0])
    if (v.place) sel.setFocusCity({ lat: v.place.lat, lng: v.place.lng })
    sel.setPlaying(v)
  }

  const channelName = channelId === ALL ? 'All channels' : channels.find((c) => c.id === channelId)?.name
  const topicName = topic === ALL ? 'All topics' : catById[topic]?.name

  return (
    <div className="app" style={{ '--topic': topicColor }}>
      <header className="top">
        <div>
          <h1>🌍 Vlogger World Tracker</h1>
          <p>Travel, history, geopolitics, inventions and culture from YouTube, on one map.</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark theme" title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <nav className="tabs" aria-label="Topics">
        <button className={topic === ALL ? 'tab on' : 'tab'} style={{ '--c': ALL_COLOR }} onClick={() => chooseTopic(ALL)}>
          🌍 All <span className="count">{videos.length}</span>
        </button>
        {categories.map((c) => {
          const n = categoryCount(c.id)
          return (
            <button
              key={c.id}
              className={(topic === c.id ? 'tab on' : 'tab') + (n ? '' : ' empty')}
              style={{ '--c': c.color }}
              onClick={() => chooseTopic(c.id)}
            >
              {c.icon} {c.name} <span className="count">{n}</span>
            </button>
          )
        })}
      </nav>

      {topicChannels.length > 0 && (
        <section className="panel filters">
          <div className="chips" aria-label="Channels">
            <button className={channelId === ALL ? 'chip on' : 'chip'} onClick={() => chooseChannel(ALL)}>
              All channels
            </button>
            {topicChannels.map((c) => (
              <button key={c.id} className={channelId === c.id ? 'chip on' : 'chip'} onClick={() => chooseChannel(c.id)}>
                {flagUrl(c.country) && <img src={flagUrl(c.country)} alt="" width="18" height="12" />}
                {c.name}
              </button>
            ))}
          </div>
          <button className="chip surprise" onClick={surprise} disabled={!filtered.length}>🎲 Surprise me</button>
        </section>
      )}

      {eraBounds && eraBounds[1] > eraBounds[0] && (
        <section className="panel">
          <Timeline
            key={topic + channelId}
            min={eraBounds[0]}
            max={eraBounds[1]}
            value={era || eraBounds}
            onChange={setEra}
            color={topicColor}
          />
        </section>
      )}

      {error && <p className="error">{error}</p>}
      <div className="map-layout">
        <div className="map-main">
          <MapView
            stops={stops}
            theme={theme}
            mapHeight={MAP_HEIGHT}
            fitKey={topic + '|' + channelId}
            world={world}
            countryCounts={countryCounts}
            shadeColor={topicColor}
            {...sel.mapProps}
          />
        </div>

        {/* sidebar beside the map: stays visible while a video plays */}
        <aside className="map-side panel" style={{ maxHeight: MAP_HEIGHT }}>
          {sel.selectedCountry ? (
            <>
              <button className="link back" onClick={() => sel.mapProps.onSelectCountry(null)}>← {topicName}</button>
              <CountryVideos
                videos={filtered}
                country={sel.selectedCountry}
                playing={sel.playing}
                onPlay={sel.setPlaying}
                onLocate={sel.setFocusCity}
                colorOf={colorOf}
              />
            </>
          ) : inTopic.length === 0 && videos.length > 0 ? (
            <div className="empty-note">
              <h2>No {topicName.toLowerCase()} videos yet</h2>
              <p className="muted">
                Add a playlist with <code>npm run add -- &lt;playlist url&gt; --category {topic}</code>, or from the
                “Add videos” action on GitHub. See the README.
              </p>
            </div>
          ) : (
            <>
              <h2>{topicName}</h2>
              <p className="muted">
                {channelName} · {filtered.length} videos · {topCountries.filter(([n]) => n !== EARTH_NAME).length} countries
              </p>
              <p className="muted">Click a country on the map, or pick one here:</p>
              <ul className="country-list">
                {topCountries.map(([name, n]) => (
                  <li key={name}>
                    <button onClick={() => sel.mapProps.onSelectCountry(name)}>
                      {name === EARTH_NAME ? (
                        <span className="earth-icon" aria-hidden="true">🌍</span>
                      ) : (
                        flagUrl(name) && <img src={flagUrl(name)} alt="" width="20" height="14" />
                      )}
                      <span>{name === EARTH_NAME ? 'Earth (whole world)' : name}</span>
                      <span className="count">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
