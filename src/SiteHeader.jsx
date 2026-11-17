import { useAuth } from './useAuth'
import HeroScene from './HeroScene'

// Banner at the top of the map page: title, tagline, login button and theme switch.
export default function SiteHeader({ theme, toggleTheme }) {
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
