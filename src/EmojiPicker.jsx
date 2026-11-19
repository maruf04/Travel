import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { EMOJI_GROUPS } from './emojis'
import { usePopover } from './usePopover'

const SIZE = { w: 380, h: 360 }

// A button that shows the chosen emoji; clicking it opens a searchable list of emojis.
//   <EmojiPicker value={icon} onChange={setIcon} />
// The list is drawn on top of the page (so no card can cut it off), stays inside the page
// container and the screen, and closes when you click anywhere else, press Esc, or pick an emoji.
export default function EmojiPicker({ value, onChange }) {
  const { open, setOpen, pos, btnRef, panelRef } = usePopover(SIZE)
  const [group, setGroup] = useState(EMOJI_GROUPS[0].id)
  const [q, setQ] = useState('')

  const query = q.trim().toLowerCase()
  const current = EMOJI_GROUPS.find((g) => g.id === group) || EMOJI_GROUPS[0]
  // searching matches an emoji's own words, or the name of its group (so "food" finds the whole Food & drink group)
  const items = useMemo(() => {
    if (!query) return current.items
    return EMOJI_GROUPS.flatMap((g) =>
      g.items.filter(([e, words]) => words.includes(query) || g.title.toLowerCase().includes(query) || e === q.trim())
    )
  }, [query, q, current])

  function pick(e) {
    onChange(e)
    setOpen(false)
    setQ('')
  }

  // don't pop the on-screen keyboard open on phones
  const canAutoFocus = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches

  return (
    <div className="emoji">
      <button
        ref={btnRef}
        type="button"
        className="emoji-btn"
        onClick={() => {
          setOpen(!open)
          setQ('') // always start with an empty search
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Choose an emoji"
        title="Choose an emoji"
      >
        <span>{value || '📌'}</span>
        <small>▾</small>
      </button>

      {open && pos &&
        createPortal(
          <div ref={panelRef} className="emoji-panel" role="dialog" aria-label="Choose an emoji" style={pos}>
            <input
              placeholder="Search (e.g. food, mountain) or paste your own"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              autoFocus={canAutoFocus}
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
          </div>,
          document.body
        )}
    </div>
  )
}
