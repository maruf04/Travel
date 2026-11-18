import { useEffect, useState } from 'react'
import { ABOUT } from './about'
import { getContributors, defaultIcon, safeHref } from './contributors'

// Bar at the bottom of the page: about you (edit src/about.js), the people who add videos, and credits.
export default function Footer() {
  const a = ABOUT
  const [contributors, setContributors] = useState([])
  useEffect(() => {
    getContributors().then(setContributors)
  }, [])

  const links = [
    a.email && { icon: '✉️', label: a.email, href: `mailto:${a.email}` },
    a.phone && { icon: '📞', label: a.phone, href: `tel:${a.phone.replace(/\s+/g, '')}` },
    a.github && { icon: '💻', label: 'GitHub', href: a.github },
    a.linkedin && { icon: '💼', label: 'LinkedIn', href: a.linkedin },
    a.facebook && { icon: '👍', label: 'Facebook', href: a.facebook },
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
          {links.length > 0 && (
            <p className="footer-inline">
              {links.map((l) => (
                <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" title={l.label}>
                  <span aria-hidden="true">{l.icon}</span> {l.label}
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
