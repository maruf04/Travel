// Banner artwork: forest, mountains, desert dunes, a river and the ocean, all in one scene.
// It is pure SVG (no images to download). Colours come from CSS variables in site.css,
// so it has a day palette (light theme) and a dusk palette (dark theme).

// [x, baseline y, scale, kind, shade]  kind: pine | oak
const wavePath = (y) => `M560 ${y} ` + 'q25 -8 50 0 t50 0 '.repeat(15)

export default function HeroScene() {
  return (
    <svg className="hero-scene" viewBox="0 0 1200 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--hs-sky-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--hs-sky-bottom)' }} />
        </linearGradient>
        <linearGradient id="hs-ocean" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--hs-ocean-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--hs-ocean-deep)' }} />
        </linearGradient>
        <radialGradient id="hs-glow">
          <stop offset="0" style={{ stopColor: 'var(--hs-sun)', stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: 'var(--hs-sun)', stopOpacity: 0 }} />
        </radialGradient>
        <clipPath id="hs-ocean-clip"><rect x="700" y="152" width="500" height="88" /></clipPath>
        <g id="hs-pine">
          <polygon points="0,-6 15,34 -15,34" />
          <polygon points="0,14 19,58 -19,58" />
          <polygon points="0,34 23,82 -23,82" />
          <rect x="-3" y="82" width="6" height="12" />
        </g>
        <g id="hs-oak">
          <circle cx="0" cy="22" r="22" />
          <circle cx="-15" cy="38" r="16" />
          <circle cx="15" cy="38" r="16" />
          <rect x="-3.5" y="46" width="7" height="30" />
        </g>
      </defs>

      {/* sky, sun, clouds */}
      <rect width="1200" height="240" fill="url(#hs-sky)" />
      <circle cx="940" cy="66" r="78" fill="url(#hs-glow)" />
      <circle cx="940" cy="66" r="29" style={{ fill: 'var(--hs-sun)' }} />
      <g className="hs-cloud hs-c1" style={{ fill: 'var(--hs-cloud)' }}>
        <ellipse cx="210" cy="50" rx="46" ry="11" /><ellipse cx="240" cy="42" rx="30" ry="11" /><ellipse cx="184" cy="44" rx="24" ry="9" />
      </g>
      <g className="hs-cloud hs-c2" style={{ fill: 'var(--hs-cloud)' }}>
        <ellipse cx="690" cy="34" rx="40" ry="9" /><ellipse cx="716" cy="27" rx="26" ry="9" />
      </g>


      {/* birds */}
      <g fill="none" style={{ stroke: 'var(--hs-bird)' }} strokeWidth="1.8" strokeLinecap="round">
        <path d="M410 70 q6 -7 12 0 q6 -7 12 0" /><path d="M452 54 q5 -6 10 0 q5 -6 10 0" /><path d="M820 100 q5 -6 10 0 q5 -6 10 0" />
      </g>
    </svg>
  )
}
