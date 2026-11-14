import { useLayoutEffect, useRef, useState } from 'react'
import { formatYear, formatEra } from './api'

// Each year/period gets its own colour, cycling through this list.
const COLORS = ['#14b8a6', '#f59e0b', '#ec4899', '#3b82f6', '#84cc16', '#a78bfa', '#f97316', '#06b6d4']

const ROW = 92 // distance between two lines (the height of a bend)
const R = ROW / 2 // bend radius
const TOP = 34 // room above the first line for its year labels
const SIDE = R + 4 // the bends sit in this margin on each side

const labelWidth = (e) => formatEra(e).length * 8.2 + 8 // roughly, at the label's font size

// Space between two consecutive years: grows with the time between them, but one long gap
// can't take more than 40% of a line. Never less than what the two labels need.
function gap(a, b, lineLength) {
  const need = (labelWidth(a) + labelWidth(b)) / 2 + 14
  const years = Math.max(0, b.from - a.from)
  return Math.max(need, Math.min(need + 24 * Math.log(1 + years), lineLength * 0.4))
}

// Walks along the line placing the years; when the next one doesn't fit, the line bends
// down and runs back the other way. Returns each year's { row, x }, the number of rows,
// and the SVG path of the line.
function layout(items, width) {
  const left = SIDE
  const right = width - SIDE
  const lineLength = right - left
  const pos = []
  let row = 0
  let dist = labelWidth(items[0]) / 2 + 6 // distance from the start of the current line
  items.forEach((e, i) => {
    if (i) {
      const g = gap(items[i - 1], e, lineLength)
      if (dist + g > lineLength - labelWidth(e) / 2 - 6) {
        row++
        dist = labelWidth(e) / 2 + 6
      } else {
        dist += g
      }
    }
    pos.push({ row, x: row % 2 ? right - dist : left + dist }) // odd lines run right to left
  })

  const rows = row + 1
  const y = (r) => TOP + r * ROW
  const lastX = pos[pos.length - 1].x
  // straight runs joined by half-circle bends, alternately on the right and left
  let d = `M ${left - 10} ${y(0)}`
  for (let r = 0; r < rows; r++) {
    const last = r === rows - 1
    const goingRight = r % 2 === 0
    const end = last
      ? goingRight ? Math.max(lastX + 40, right) : Math.min(lastX - 40, left)
      : goingRight ? right : left
    d += ` L ${end} ${y(r)}`
    if (!last) d += ` A ${R} ${R} 0 0 ${goingRight ? 1 : 0} ${end} ${y(r + 1)}`
  }
  return { pos, rows, y, path: d, height: y(rows - 1) + 26 }
}

// Timeline: one circle per year or period, in time order, year above each circle.
// The line bends to the next row whenever the next year doesn't fit, so it never needs
// a sideways scrollbar. Click a circle to show only that year's/period's videos, again for all.
//   eras:     [{ from, to, count }]  the distinct years/periods of the videos
//   selected: [from, to] of the clicked circle, or null for all
//   label:    optional country name for the heading
export default function Timeline({ eras, selected, onSelect, color, label }) {
  const wrap = useRef(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = wrap.current
    const measure = () => setWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const sorted = [...eras].sort((a, b) => a.from - b.from || a.to - b.to)
  const isOn = (e) => selected && selected[0] === e.from && selected[1] === e.to
  const chosen = sorted.find(isOn)
  const lo = sorted[0].from
  const hi = Math.max(...sorted.map((e) => e.to))
  const total = sorted.reduce((s, e) => s + e.count, 0)
  const videos = (n) => `${n} ${n === 1 ? 'video' : 'videos'}`
  const lay = width ? layout(sorted, width) : null
  const toggle = (e) => onSelect(isOn(e) ? null : [e.from, e.to])

  return (
    <div className="timeline" style={{ '--topic': color }}>
      <div className="timeline-head">
        <strong>
          🕰️ {label ? `${label} · ` : ''}
          {chosen
            ? `${formatEra(chosen)} · ${videos(chosen.count)}`
            : `${lo === hi ? formatYear(lo) : `${formatYear(lo)} – ${formatYear(hi)}`} · ${videos(total)}`}
        </strong>
        {chosen && (
          <button className="chip small" onClick={() => onSelect(null)}>Show all years</button>
        )}
      </div>

      <div ref={wrap} className={selected ? 'tl has-selection' : 'tl'}>
        {lay && (
          <svg viewBox={`0 0 ${width} ${lay.height}`} width={width} height={lay.height} role="group" aria-label="Timeline">
            <path className="tl-path" d={lay.path} />
            {sorted.map((e, i) => {
              const { row, x } = lay.pos[i]
              const cy = lay.y(row)
              return (
                <g
                  key={`${e.from}:${e.to}`}
                  className={isOn(e) ? 'tl-node on' : 'tl-node'}
                  style={{ '--c': COLORS[i % COLORS.length] }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={!!isOn(e)}
                  aria-label={`${formatEra(e)}, ${videos(e.count)}`}
                  onClick={() => toggle(e)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      toggle(e)
                    }
                  }}
                >
                  <title>{`${formatEra(e)} · ${videos(e.count)}`}</title>
                  <text className="tl-year" x={x} y={cy - 22}>{formatEra(e)}</text>
                  {/* grows from its own centre when hovered or clicked */}
                  <g className="tl-mark" style={{ transformOrigin: `${x}px ${cy}px` }}>
                    <circle className="tl-arc" cx={x} cy={cy} r={18} transform={`rotate(${(e.from * 67) % 360} ${x} ${cy})`} />
                    <circle className="tl-ring" cx={x} cy={cy} r={13} />
                    <circle className="tl-inner" cx={x} cy={cy} r={7.5} />
                    <circle className="tl-dot" cx={x} cy={cy} r={4} />
                  </g>
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </div>
  )
}
