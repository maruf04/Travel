// Layout: the parts around the map page.
//   1. HeroScene    banner artwork (dotted world map with travel routes), also used on the edit page
//   2. SiteHeader   banner with the title, login button and theme switch
//   3. Footer       about you, contact links and contributors

import { useEffect, useState } from 'react'
import { useAuth } from './hooks'
import { ABOUT, getContributors, defaultIcon, safeHref } from './content'

// ────────────────────────────────────────────────────────────────────────────
// 1. HeroScene   (was src/HeroScene.jsx)
// ────────────────────────────────────────────────────────────────────────────

// Banner artwork: a dotted world map with glowing travel routes between places from the videos.
// The dots come from public/hero-dots.svg (made from the real country borders in world.json,
// drawn as a mask so CSS can colour it); the grid, routes and city points are drawn here on top,
// in the same coordinates. Colours come from CSS variables in styles.css (dark and light theme).

// Same projection as hero-dots.svg: longitude -180..180, latitude 75..-48, 4 px per degree.
const MAP_W = 1440
const MAP_H = 492
const xy = ([lon, lat]) => [(lon + 180) * 4, (75 - lat) * 4]

// [longitude, latitude] of places that appear in the videos
const CITIES = {
  dhaka: [90.41, 23.81], istanbul: [28.98, 41.01], almaty: [76.95, 43.24], moscow: [37.62, 55.75],
  yakutsk: [129.68, 62.03], nairobi: [36.82, -1.29], boston: [-71.06, 42.36], jakarta: [106.85, -6.21],
  doha: [51.53, 25.29], sarajevo: [18.41, 43.86],
}
const ROUTES = [
  ['dhaka', 'istanbul'], ['istanbul', 'boston'], ['dhaka', 'almaty'], ['almaty', 'moscow'],
  ['moscow', 'yakutsk'], ['dhaka', 'jakarta'], ['istanbul', 'doha'], ['doha', 'nairobi'], ['istanbul', 'sarajevo'],
]

// a gentle curve between two places, bowing upwards like a flight path
function arc(a, b) {
  const [x1, y1] = xy(CITIES[a])
  const [x2, y2] = xy(CITIES[b])
  const lift = Math.hypot(x2 - x1, y2 - y1) * 0.28
  return `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - lift} ${x2} ${y2}`
}

// faint lines every 30 degrees of longitude and latitude
const GRID = [
  ...[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => `M${(lon + 180) * 4} 0V${MAP_H}`),
  ...[60, 30, 0, -30].map((lat) => `M0 ${(75 - lat) * 4}H${MAP_W}`),
].join('')

export function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="hero-map">
        <div className="hero-dots" style={{ '--dots': `url(${import.meta.env.BASE_URL}hero-dots.svg)` }} />
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="none" focusable="false">
          <path className="hero-grid" d={GRID} />
          {ROUTES.map(([a, b], i) => (
            <g key={a + b}>
              <path className="hero-route" d={arc(a, b)} />
              {/* a short light that travels along the route */}
              <path className="hero-route-light" d={arc(a, b)} pathLength="100" style={{ animationDelay: `${-i * 1.7}s`, animationDuration: `${7 + (i % 4)}s` }} />
            </g>
          ))}
          {Object.entries(CITIES).map(([name, at]) => {
            const [x, y] = xy(at)
            return <circle key={name} className="hero-city" cx={x} cy={y} r="4.5" />
          })}
        </svg>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 2. SiteHeader   (was src/SiteHeader.jsx)
// ────────────────────────────────────────────────────────────────────────────

// Banner at the top of the map page: title, tagline, login button and theme switch.
export function SiteHeader({ theme, toggleTheme }) {
  const { enabled, session, role, pending, loading } = useAuth()
  const canEdit = role === 'admin' || role === 'member'

  let button = null
  if (enabled && !loading) {
    if (!session) {
      button = <a className="hero-btn primary" href="#/edit">🔑 Log in</a>
    } else if (role === 'admin' && pending > 0) {
      button = (
        <a className="hero-btn primary" href="#/edit" title="Accounts waiting for your approval">
          🔔 {pending} {pending === 1 ? 'request' : 'requests'}
        </a>
      )
    } else {
      button = <a className="hero-btn" href="#/edit">{canEdit ? '✏️ Edit' : '👤 My account'}</a>
    }
  }

  return (
    <header className="hero">
      <HeroScene />
      <div className="hero-inner">
        <div className="hero-text">
          <h1>🌍 Vlogger World Tracker</h1>
          <p>Travel, history, geopolitics, inventions and culture from YouTube, on one map.</p>
        </div>
        <div className="hero-actions">
          {button}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark theme" title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Footer   (was src/Footer.jsx)
// ────────────────────────────────────────────────────────────────────────────

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 15,
  height: 15,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { verticalAlign: '-2px', flexShrink: 0 },
  'aria-hidden': true,
}

const ICONS = {
  email: (
    <svg {...svgProps}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  phone: (
    <svg {...svgProps}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  github: (
    <svg {...svgProps}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  ),
  linkedin: (
    <svg {...svgProps}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  facebook: (
    <svg {...svgProps}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  instagram: (
    <svg {...svgProps}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  ),
  youtube: (
    <svg {...svgProps}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  ),
  website: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  ),
  location: (
    <svg {...svgProps}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
}

// Bar at the bottom of the page: about you (edit ABOUT in src/content.js), the people who add videos, and credits.
export function Footer() {
  const a = ABOUT
  const [contributors, setContributors] = useState([])
  useEffect(() => {
    getContributors().then(setContributors)
  }, [])

  const links = [
    a.email && { icon: ICONS.email, label: a.email, href: `mailto:${a.email}` },
    a.phone && { icon: ICONS.phone, label: a.phone, href: `tel:${a.phone.replace(/\s+/g, '')}` },
    a.github && { icon: ICONS.github, label: 'GitHub', href: a.github },
    a.linkedin && { icon: ICONS.linkedin, label: 'LinkedIn', href: a.linkedin },
    a.facebook && { icon: ICONS.facebook, label: 'Facebook', href: a.facebook },
    a.instagram && { icon: ICONS.instagram, label: 'Instagram', href: a.instagram },
    a.youtube && { icon: ICONS.youtube, label: 'YouTube', href: a.youtube },
    a.website && { icon: ICONS.website, label: 'Website', href: a.website },
  ].filter(Boolean)

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>About me</h3>
          <p className="footer-name">
            {a.name}
            {a.tagline && <span> · {a.tagline}</span>}
          </p>
          {a.bio && <p className="muted">{a.bio}</p>}
          {a.location && (
            <p className="muted">
              {ICONS.location} {a.location}
            </p>
          )}
          {links.length > 0 && (
            <p className="footer-inline">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  title={l.label}
                >
                  {l.icon} {l.label}
                </a>
              ))}
            </p>
          )}
        </div>

        <div>
          <h3>Contributors</h3>
          {contributors.length > 0 ? (
            <ul className="contrib-list">
              {contributors.map((c) => {
                const href = safeHref(c.contact_url)
                const inner = (
                  <>
                    <span className="contrib-icon" aria-hidden="true">{c.icon || defaultIcon(c.user_id)}</span>
                    <span className="contrib-name">{c.display_name}</span>
                    <span className="contrib-count">{c.videos} {Number(c.videos) === 1 ? 'video' : 'videos'}</span>
                  </>
                )
                return (
                  <li key={c.user_id}>
                    {href ? (
                      <a className="contrib" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" title={`Contact ${c.display_name}`}>
                        {inner}
                      </a>
                    ) : (
                      <span className="contrib">{inner}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">
              Nobody has added a video yet. <a href="#/edit" className="footer-link">Log in</a> to become the first contributor.
            </p>
          )}
        </div>

        <div>
          <h3>About the site</h3>
          <p className="muted">
            Videos belong to their YouTube channels. Map data © OpenStreetMap contributors; country borders from
            Natural Earth; country descriptions from Wikipedia.
          </p>
        </div>
      </div>
      <p className="footer-copy muted">© {new Date().getFullYear()} {a.name}</p>
    </footer>
  )
}
