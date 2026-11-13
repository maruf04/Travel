import { useMemo } from 'react'
import { flagUrl } from './countries'

// Sidebar list: every video that mentions one country (pinned or not).
export default function CountryVideos({ videos, country, playing, onPlay, onLocate, colorOf }) {
  const list = useMemo(() => videos.filter((v) => v.countryNames.includes(country)), [videos, country])
  if (!list.length) return <p className="muted">No videos for {country} with these filters.</p>

  return (
    <div>
      <div className="side-title">
        {flagUrl(country) && <img src={flagUrl(country)} alt="" width="24" height="16" />}
        {country} · {list.length} {list.length === 1 ? 'video' : 'videos'}
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
                <div className="video-title" onClick={() => onPlay(v)}>{v.title}</div>
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
