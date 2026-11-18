import { useEffect, useMemo, useState } from 'react'
import { EMOJI_GROUPS } from './emojis'

// A button that shows the chosen emoji; clicking it opens a searchable list of emojis.
//   <EmojiPicker value={icon} onChange={setIcon} />
export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [group, setGroup] = useState(EMOJI_GROUPS[0].id)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const query = q.trim().toLowerCase()
  const current = EMOJI_GROUPS.find((g) => g.id === group) || EMOJI_GROUPS[0]
  const items = useMemo(
    () => (query ? EMOJI_GROUPS.flatMap((g) => g.items).filter(([e, words]) => words.includes(query) || e === q.trim()) : current.items),
    [query, q, current]
  )

  function pick(e) {
    onChange(e)
    setOpen(false)
    setQ('')
  }

  return (
    <div className="emoji">
      <button type="button" className="emoji-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Choose an emoji" title="Choose an emoji">
        <span>{value || '📌'}</span>
        <small>▾</small>
      </button>

      {open && (
        <div className="emoji-panel">
          <input
            placeholder="Search (e.g. food, mountain) or paste your own"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            autoFocus
          />
          {!query && (
            <div className="emoji-tabs" role="tablist">
              {EMOJI_GROUPS.map((g) => (
                <button key={g.id} type="button" role="tab" aria-selected={g.id === group} title={g.title} className={g.id === group ? 'on' : ''} onClick={() => setGroup(g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
          )}
          <p className="emoji-title">{query ? `Results for “${q.trim()}”` : current.title}</p>
          <div className="emoji-grid">
            {items.map(([e, words]) => (
              <button key={e} type="button" className={e === value ? 'emoji-cell on' : 'emoji-cell'} title={words.split(' ')[0]} aria-label={words.split(' ')[0]} onClick={() => pick(e)}>
                {e}
              </button>
            ))}
          </div>
          {query && items.length === 0 && q.trim().length <= 8 && (
            <button type="button" className="a-btn" onClick={() => pick(q.trim())}>Use “{q.trim()}” as the icon</button>
          )}
        </div>
      )}
    </div>
  )
}
