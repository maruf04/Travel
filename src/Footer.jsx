import { ABOUT } from './about'

// Bar at the bottom of the page with details about you (edit src/about.js).
export default function Footer() {
  const a = ABOUT
  const links = [
    a.email && { icon: '✉️', label: a.email, href: `mailto:${a.email}` },
    a.phone && { icon: '📞', label: a.phone, href: `tel:${a.phone.replace(/\s+/g, '')}` },
    a.github && {
      icon: (
        <svg
          xmlns="http://w3.org"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ display: 'inline-block', verticalAlign: 'middle' }}
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
      label: 'GitHub',
      href: a.github,
    },
    a.linkedin && { icon: '💼', label: 'LinkedIn', href: a.linkedin },
    a.facebook && {
      icon: (
        <svg
          xmlns="http://w3.org"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ display: 'inline-block', verticalAlign: 'middle' }}
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
      label: 'Facebook',
      href: a.facebook,
    },
    a.instagram && { icon: '📷', label: 'Instagram', href: a.instagram },
    a.youtube && { icon: '▶️', label: 'YouTube', href: a.youtube },
    a.website && { icon: '🌐', label: 'Website', href: a.website },
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
          {a.location && <p className="muted">📍 {a.location}</p>}
        </div>
        {links.length > 0 && (
          <div>
            <h3>Contact</h3>
            <ul className="footer-links">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                    <span aria-hidden="true">{l.icon}</span> {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
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
