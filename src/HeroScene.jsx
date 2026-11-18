// Banner artwork: a soft sky with the sun, drifting clouds and a few birds.
// Pure SVG (no images to download). Colours come from CSS variables in site.css,
// so it has a daylight palette (light theme) and a dusk palette with a moon (dark theme).

// [x, y, size] of each bird
const BIRDS = [
  [600, 70, 1.1], [642, 54, 0.9], [680, 76, 0.8], [900, 150, 1], [1110, 108, 0.9],
]

export default function HeroScene() {
  return (
    <svg className="hero-scene" viewBox="0 0 1200 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--hs-sky-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--hs-sky-bottom)' }} />
        </linearGradient>
        <radialGradient id="hs-glow">
          <stop offset="0" style={{ stopColor: 'var(--hs-sun)', stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: 'var(--hs-sun)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      <rect width="1200" height="240" fill="url(#hs-sky)" />

      {/* sun (moon in the dark theme) */}
      <circle cx="800" cy="84" r="90" fill="url(#hs-glow)" />
      <circle cx="800" cy="84" r="29" style={{ fill: 'var(--hs-sun)' }} />

      {/* clouds */}
      <g className="hs-cloud hs-c1" style={{ fill: 'var(--hs-cloud)' }}>
        <ellipse cx="470" cy="150" rx="46" ry="11" /><ellipse cx="500" cy="142" rx="30" ry="11" /><ellipse cx="444" cy="144" rx="24" ry="9" />
      </g>
      <g className="hs-cloud hs-c2" style={{ fill: 'var(--hs-cloud)' }}>
        <ellipse cx="980" cy="170" rx="40" ry="9" /><ellipse cx="1006" cy="163" rx="26" ry="9" />
      </g>
      <g className="hs-cloud hs-c3" style={{ fill: 'var(--hs-cloud)' }}>
        <ellipse cx="260" cy="190" rx="36" ry="8" /><ellipse cx="282" cy="184" rx="22" ry="8" />
      </g>

      {/* birds */}
      <g className="hs-birds" fill="none" style={{ stroke: 'var(--hs-bird)' }} strokeWidth="1.8" strokeLinecap="round">
        {BIRDS.map(([x, y, s], i) => (
          <path key={i} d={`M${x} ${y} q${6 * s} ${-7 * s} ${12 * s} 0 q${6 * s} ${-7 * s} ${12 * s} 0`} />
        ))}
      </g>
    </svg>
  )
}
