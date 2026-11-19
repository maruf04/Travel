import { useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopover } from './usePopover'

const SIZE = { w: 280, h: 300 }

const PALETTE = [
  '#ff7a50', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#a16207', '#15803d', '#1d4ed8', '#be123c', '#64748b', '#78716c',
]

const HEX = /^#?([0-9a-f]{6})$/i

// A button that shows the chosen colour; clicking it opens a palette (plus a box for any #hex colour).
//   <ColorPicker value={color} onChange={setColor} />
// Same behaviour as the emoji picker: on top of the page, never cut off, closes when you click elsewhere.
export default function ColorPicker({ value, onChange }) {
  const { open, setOpen, pos, btnRef, panelRef } = usePopover(SIZE)
  const [hex, setHex] = useState(value)

  function pick(c) {
    onChange(c)
    setOpen(false)
  }

  function onHex(text) {
    setHex(text)
    const m = HEX.exec(text.trim())
    if (m) onChange('#' + m[1].toLowerCase()) // applies as soon as it is a complete colour
  }

  const valid = HEX.test(hex.trim())

  return (
    <div className="emoji">
      <button
        ref={btnRef}
        type="button"
        className="emoji-btn"
        onClick={() => {
          setHex(value)
          setOpen(!open)
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Choose a colour"
        title="Choose a colour"
      >
        <span className="color-dot" style={{ background: value }} />
        <small>▾</small>
      </button>

      {open && pos &&
        createPortal(
          <div ref={panelRef} className="emoji-panel color-panel" role="dialog" aria-label="Choose a colour" style={pos}>
            <p className="emoji-title">Pick a colour</p>
            <div className="color-grid">
              {PALETTE.map((c) => (
                <button key={c} type="button" className={c === value.toLowerCase() ? 'color-swatch on' : 'color-swatch'} style={{ background: c }} aria-label={c} title={c} onClick={() => pick(c)} />
              ))}
            </div>
            <label className="color-hex">
              <span className="color-dot" style={{ background: valid ? '#' + HEX.exec(hex.trim())[1] : value }} />
              <input
                value={hex}
                onChange={(e) => onHex(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), valid && setOpen(false))}
                placeholder="#4ba3f0"
                maxLength={7}
                spellCheck={false}
                aria-label="Colour code"
                aria-invalid={!valid}
              />
            </label>
            <p className="color-hint">{valid ? 'Looks good. Click outside to finish.' : 'Type a 6-digit colour code like #4ba3f0.'}</p>
          </div>,
          document.body
        )}
    </div>
  )
}
