import { useMemo } from 'react'
import { groupByCountry } from './groupByCountry'
import { flagUrl } from './countries'

function videoId(url) {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null)
  } catch {
    return null
  }
}

// Sidebar list: every video from one country. Renders nothing if no country is selected.
export default function CountryVideos({ stops, country, playing, onPlay, onLocate }) {
  const group = useMemo(
    () => groupByCountry(stops, 1).find((g) => g.country === country),
    [stops, country]
  )
  if (!group) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontWeight: 600 }}>
        {flagUrl(group.country) && (
          <img src={flagUrl(group.country)} alt="" width="24" height="16" style={{ borderRadius: 2, objectFit: 'cover' }} />
        )}
        {group.country} · {group.videos} {group.videos === 1 ? 'video' : 'videos'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {group.cities.flatMap((city) =>
          city.videos.map((v) => {
            const id = videoId(v.url)
            return (
              <div
                key={v.id}
                style={{
                  display: 'flex', gap: 10, padding: 6, borderRadius: 8,
                  background: playing?.id === v.id ? 'rgba(228,87,46,.14)' : 'transparent',
                  outline: playing?.id === v.id ? '2px solid #e4572e' : 'none',
                }}
              >
                <div
                  onClick={() => onPlay(v)}
                  title="Play"
                  style={{
                    flex: 'none', width: 104, aspectRatio: '16 / 9', borderRadius: 6, cursor: 'pointer',
                    position: 'relative',
                    background: id ? `#222 url(https://i.ytimg.com/vi/${id}/mqdefault.jpg) center/cover` : '#222',
                  }}
                >
                  <span style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 20, textShadow: '0 1px 6px rgba(0,0,0,.7)',
                  }}>{playing?.id === v.id ? '● Playing' : '▶'}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    onClick={() => onPlay(v)}
                    style={{
                      cursor: 'pointer', fontSize: 13, lineHeight: 1.3, display: '-webkit-box',
                      WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}
                  >
                    {v.title}
                  </div>
                  <button
                    onClick={() => onLocate({ lat: city.lat, lng: city.lng })}
                    style={{ marginTop: 3, padding: 0, border: 0, background: 'none', color: '#e4572e', cursor: 'pointer', fontSize: 12 }}
                  >
                    📍 {city.place}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
