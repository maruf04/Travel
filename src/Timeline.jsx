import { formatYear, formatEra } from './api'

// A timeline with one vertical bar per year (or a wider bar per period) that has videos.
// Taller bar = more videos. Click a bar to show only that year/period, click it again for all.
//   eras:     [{ from, to, count }]  the distinct years/periods of the videos
//   selected: [from, to] of the clicked bar, or null for all
//   label:    optional country name for the heading
export default function Timeline({ eras, selected, onSelect, color, label }) {
  const lo = Math.min(...eras.map((e) => e.from))
  const hi = Math.max(...eras.map((e) => e.to))
  // a little room on both sides, so bars at the ends (or a single year) aren't on the edge
  const pad = Math.max(1, Math.round((hi - lo) * 0.06))
  const min = lo - pad
  const max = hi + pad
  const pct = (y) => ((y - min) / (max - min)) * 100
  const most = Math.max(...eras.map((e) => e.count))
  const isOn = (e) => selected && selected[0] === e.from && selected[1] === e.to

  // Year labels under the bars. Where bars are too close for all labels to fit, the clicked bar
  // and the bars with the most videos get theirs; hover any bar to see its years.
  const mid = (e) => pct((e.from + e.to) / 2)
  const labels = [...eras]
    .sort((a, b) => isOn(b) - isOn(a) || b.count - a.count)
    .reduce((kept, e) => (kept.some((k) => Math.abs(mid(k) - mid(e)) < 9) ? kept : [...kept, e]), [])

  const chosen = eras.find(isOn)
  const total = eras.reduce((s, e) => s + e.count, 0)

  return (
    <div className="timeline" style={{ '--topic': color }}>
      <div className="timeline-head">
        <strong>
          🕰️ {label ? `${label} · ` : ''}
          {chosen
            ? `${formatEra(chosen)} · ${chosen.count} ${chosen.count === 1 ? 'video' : 'videos'}`
            : `${lo === hi ? formatYear(lo) : `${formatYear(lo)} – ${formatYear(hi)}`} · ${total} ${total === 1 ? 'video' : 'videos'}`}
        </strong>
        {chosen && (
          <button className="chip small" onClick={() => onSelect(null)}>Show all years</button>
        )}
      </div>

      <div className={selected ? 'bars has-selection' : 'bars'}>
        {eras.map((e) => {
          const left = pct(e.from)
          const width = Math.max(pct(e.to) - left, 0) // 0 for a single year: drawn as a thin bar
          return (
            <button
              key={`${e.from}:${e.to}`}
              className={(isOn(e) ? 'bar on' : 'bar') + (e.from === e.to ? '' : ' period')}
              style={{
                left: `${left}%`,
                width: width ? `${width}%` : undefined,
                height: `${30 + 70 * (e.count / most)}%`,
              }}
              title={`${formatEra(e)} · ${e.count} ${e.count === 1 ? 'video' : 'videos'}`}
              aria-pressed={isOn(e)}
              onClick={() => onSelect(isOn(e) ? null : [e.from, e.to])}
            >
              <span className="bar-count">{e.count}</span>
            </button>
          )
        })}
      </div>
      <div className="bar-labels">
        {labels.map((e) => (
          <span key={`${e.from}:${e.to}`} style={{ left: `${pct((e.from + e.to) / 2)}%` }} className={isOn(e) ? 'on' : ''}>
            {formatEra(e)}
          </span>
        ))}
      </div>
    </div>
  )
}
