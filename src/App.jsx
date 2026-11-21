// The public map page: banner, topic tabs, channel filter, country bar and timeline
// (History tab), the map with its sidebar, country info and footer.
// It loads all data once (data.js), then filters it by topic, channel, country and year.

import { useEffect, useMemo, useState } from 'react'
import MapView from './MapView'
import { CountryVideos, CountryInfo } from './CountryPanel'
import Timeline from './Timeline'
import { useMapSelection, useTheme } from './hooks'
import { getCategories, getChannels, getVideos, getWorld, toStops, channelLogo, flagUrl, EARTH_NAME } from './data'
import { SiteHeader, Footer } from './layout'

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
  // The chosen year range, remembered with the topic/channel/country it was chosen for,
  // so picking another country starts from that country's own full timeline.
  const [eraChoice, setEraChoice] = useState({ scope: '', range: null })
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
    getWorld().then(setWorld).catch(() => { }) // shading is optional; markers still work without it
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
  // With a country selected, it covers only that country's years and filters only its videos.
  const eraCountry = sel.selectedCountry
  const eraScope = `${topic}|${channelId}|${eraCountry || ''}`
  // The distinct years/periods of the visible videos, one timeline bar each: [{ from, to, count }]
  const eras = useMemo(() => {
    if (topic === ALL) return []
    const byKey = new Map()
    for (const v of inChannel) {
      if (!v.era || (eraCountry && !v.countryNames.includes(eraCountry))) continue
      const key = `${v.era.from}:${v.era.to}`
      if (!byKey.has(key)) byKey.set(key, { from: v.era.from, to: v.era.to, count: 0 })
      byKey.get(key).count++
    }
    return [...byKey.values()]
  }, [inChannel, topic, eraCountry])
  // the clicked bar ([from, to]) or null for all years
  const era = eraChoice.scope === eraScope ? eraChoice.range : null
  const setEra = (range) => setEraChoice({ scope: eraScope, range })

  // A clicked bar shows exactly the videos on that bar (with a country picked, only its videos are filtered).
  const filtered = useMemo(
    () =>
      era
        ? inChannel.filter(
          (v) => (eraCountry && !v.countryNames.includes(eraCountry)) || (v.era && v.era.from === era[0] && v.era.to === era[1])
        )
        : inChannel,
    [inChannel, era, eraCountry]
  )
  // History tab: a bar under the channel bar lists the countries this channel has videos about.
  // Clicking one selects it and shows that country's timeline.
  const isHistory = topic === 'history'
  const historyCountries = useMemo(() => {
    if (!isHistory) return []
    const counts = new Map()
    for (const v of inChannel) for (const n of v.countryNames) counts.set(n, (counts.get(n) || 0) + 1)
    return [...counts].sort((a, b) => (b[0] === EARTH_NAME) - (a[0] === EARTH_NAME) || b[1] - a[1])
  }, [isHistory, inChannel])

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
    // keep the channel if it has videos in the new topic
    if (id !== ALL && !videos.some((v) => v.channel === channelId && v.categories.includes(id))) setChannelId(ALL)
  }
  function chooseChannel(id) {
    setChannelId(id)
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
      <SiteHeader theme={theme} toggleTheme={toggleTheme} />

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
                {/* the channel's logo if it has one, otherwise its country's flag */}
                {channelLogo(c) ? (
                  <img className="channel-logo" src={channelLogo(c)} alt="" width="20" height="20" />
                ) : (
                  flagUrl(c.country) && <img src={flagUrl(c.country)} alt="" width="18" height="12" />
                )}
                {c.name}
              </button>
            ))}
          </div>
          <button className="chip surprise" onClick={surprise} disabled={!filtered.length}>🎲 Surprise me</button>
        </section>
      )}

      {isHistory && historyCountries.length > 0 && (
        <section className="panel country-bar">
          <div className="country-bar-label">🗺️ Countries {channelId === ALL ? 'covered' : `${channelName} covered`}</div>
          <div className="chips" aria-label="Countries">
            {historyCountries.map(([name, n]) => (
              <button
                key={name}
                className={eraCountry === name ? 'chip on' : 'chip'}
                // click again to go back to all countries
                onClick={() => sel.mapProps.onSelectCountry(eraCountry === name ? null : name)}
              >
                {name === EARTH_NAME ? (
                  <span className="earth-icon" aria-hidden="true">🌍</span>
                ) : (
                  flagUrl(name) && <img src={flagUrl(name)} alt="" width="18" height="12" />
                )}
                {name === EARTH_NAME ? 'Earth' : name}
                <span className="count">{n}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* History: the timeline is for the country picked in the bar above; other topics show it for all */}
      {eras.length > 0 && (!isHistory || eraCountry) && (
        <section className="panel">
          <Timeline
            key={eraScope}
            eras={eras}
            selected={era}
            onSelect={setEra}
            label={eraCountry === EARTH_NAME ? 'Earth (whole world)' : eraCountry}
            color={topicColor}
          />
        </section>
      )}
      {isHistory && eraCountry && eras.length === 0 && (
        <section className="panel">
          <p className="muted timeline-note">
            🕰️ These videos have no years yet. Add <code>"era"</code> to them in history.json to build a timeline.
          </p>
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
                channels={channels}
              />
            </>
          ) : inTopic.length === 0 && videos.length > 0 ? (
            <div className="empty-note">
              <h2>No {topicName.toLowerCase()} videos yet</h2>
              <p className="muted">
                Videos can be added on the <a href="#/edit">edit page</a> (log in, then “Add video”).
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
      <CountryInfo country={sel.selectedCountry} visible={Boolean(sel.playing)} />
      <Footer />
    </div>
  )
}
