import { useMemo } from 'react'
import { flagUrl, EARTH_NAME } from './countries'
import { channelLogo, formatEra } from './api'

// Sidebar list: every video that mentions one country (pinned or not).
export default function CountryVideos({ videos, country, playing, onPlay, onLocate, colorOf, channels = [] }) {
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
