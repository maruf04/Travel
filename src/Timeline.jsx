import { useEffect, useRef, useState } from 'react'

const formatYear = (y) => (y < 0 ? `${-y} BC` : `${y}`)

// Two-handle year range for videos that have an `era`. "Play" slides the window
// forward through time so the map animates century by century.
export default function Timeline({ min, max, value, onChange, color }) {
  const [playing, setPlaying] = useState(false)
  const timer = useRef(null)
  const [from, to] = value
  const full = from <= min && to >= max

  useEffect(() => {
    if (!playing) return
    const width = Math.max(to - from, Math.ceil((max - min) / 8))
    const step = Math.max(1, Math.round((max - min) / 40))
    let start = full ? min : from
    timer.current = setInterval(() => {
      start += step
      if (start + width > max) {
        setPlaying(false)
        onChange([max - width, max])
        return
      }
      onChange([start, start + width])
    }, 350)
    if (full) onChange([min, min + width])
    return () => clearInterval(timer.current)
    // only (re)start when Play is pressed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const pct = (y) => ((y - min) / (max - min || 1)) * 100

  return (
    <div className="timeline" style={{ '--topic': color }}>
      <div className="timeline-head">
        <strong>🕰️ {full ? 'All time' : `${formatYear(from)} – ${formatYear(to)}`}</strong>
        <div className="timeline-buttons">
          <button className="chip small" onClick={() => setPlaying((p) => !p)}>{playing ? '⏸ Pause' : '▶ Play through time'}</button>
          {!full && <button className="chip small" onClick={() => { setPlaying(false); onChange([min, max]) }}>Reset</button>}
        </div>
      </div>
      <div className="range">
        <div className="range-fill" style={{ left: pct(from) + '%', width: pct(to) - pct(from) + '%' }} />
        <input
          type="range" min={min} max={max} value={from} aria-label="From year"
          onChange={(e) => { setPlaying(false); onChange([Math.min(+e.target.value, to), to]) }}
        />
        <input
          type="range" min={min} max={max} value={to} aria-label="To year"
          onChange={(e) => { setPlaying(false); onChange([from, Math.max(+e.target.value, from)]) }}
        />
      </div>
      <div className="timeline-ends"><span>{formatYear(min)}</span><span>{formatYear(max)}</span></div>
    </div>
  )
}
