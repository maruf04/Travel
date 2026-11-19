import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { computePlacement } from './emojiPlacement'

// Shared behaviour of the emoji and colour pop-ups:
//  - opens on top of the page (render the panel with createPortal into document.body)
//  - stays inside the page container and on the screen, and follows the button on scroll/resize
//  - closes on a click/tap anywhere else, and on Esc
// `size` must be a constant object: { w, h } (preferred width/height of the panel).
export function usePopover(size) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const panelRef = useRef(null)

  const place = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return
    const box = (btn.closest('.app') || document.body).getBoundingClientRect()
    setPos(computePlacement(btn.getBoundingClientRect(), box, document.documentElement.clientWidth, window.innerHeight, size))
  }, [size])

  // position before it is painted, and keep it in place while the page scrolls or resizes
  useLayoutEffect(() => {
    if (!open) return
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return { open, setOpen, pos, btnRef, panelRef }
}
