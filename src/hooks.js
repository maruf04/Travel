// Hooks: small pieces of shared state and behaviour used by the components.
//   1. useAuth           who is signed in and what they may do
//   2. useTheme          light/dark theme, remembered in this browser
//   3. useMapSelection   selected country, playing video, city to fly to (map + sidebar)
//   4. Pop-up placement  where an emoji/colour pop-up should appear (pure maths)
//   5. usePopover        open/close/position behaviour of those pop-ups

import { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react'
import { supabase } from './data'

// ────────────────────────────────────────────────────────────────────────────
// 1. useAuth   (was src/useAuth.js)
// ────────────────────────────────────────────────────────────────────────────

// Who is signed in, what they may do, and (for admins) how many accounts are waiting for approval.
//   role: 'admin' | 'member' | 'pending' | 'declined' | 'none' | null (still loading)
export function useAuth() {
  const [session, setSession] = useState(supabase ? undefined : null) // undefined = still checking
  const [role, setRole] = useState(null)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) {
      setRole(null)
      return
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setRole(data?.role || 'none'))
  }, [userId])

  // admins: number of accounts waiting for approval (refreshed every minute)
  useEffect(() => {
    if (role !== 'admin') {
      setPending(0)
      return
    }
    const count = () =>
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('role', 'pending')
        .then(({ count: n }) => setPending(n || 0))
    count()
    const t = setInterval(count, 60000)
    return () => clearInterval(t)
  }, [role])

  return {
    enabled: Boolean(supabase),
    session,
    role,
    pending,
    loading: session === undefined || (Boolean(session) && role === null),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. useTheme   (was src/useTheme.js)
// ────────────────────────────────────────────────────────────────────────────

// Dark by default. The choice is remembered in this browser.
// index.html sets data-theme before React loads, so the page never flashes white.
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // storage blocked (private mode): the theme just won't be remembered
    }
  }, [theme])

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

// ────────────────────────────────────────────────────────────────────────────
// 3. useMapSelection   (was src/useMapSelection.js)
// ────────────────────────────────────────────────────────────────────────────

// Shared state between the map and the sidebar:
// which country is selected, which video is playing, and which city to fly to.
export function useMapSelection() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [playing, setPlaying] = useState(null)
  const [focusCity, setFocusCity] = useState(null)

  return {
    selectedCountry,
    playing,
    setPlaying,
    setFocusCity,
    // spread these onto <MapView />
    mapProps: {
      selectedCountry,
      onSelectCountry: setSelectedCountry,
      playing,
      onPlay: setPlaying,
      focusCity,
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Pop-up placement   (was src/emojiPlacement.js)
// ────────────────────────────────────────────────────────────────────────────

// Works out where a pop-up list (emoji or colour picker) should appear on screen.
// Pure maths, so it is easy to test.
//   button: the trigger button's rectangle (left, top, bottom) in the window
//   box:    the page's rectangular container (the .app column) in the window
//   vw/vh:  window width/height
//   size:   the pop-up's preferred { w, h }
// The pop-up opens below the button when there is room, otherwise above it, and is kept
// inside the container's width and the visible window. It may cover other fields: that is fine.
export const PANEL_W = 380
export const PANEL_H = 360
const GAP = 6
const MARGIN = 8

export function computePlacement(button, box, vw, vh, size = { w: PANEL_W, h: PANEL_H }) {
  const minX = Math.max(MARGIN, box.left + 4)
  const maxX = Math.min(vw - MARGIN, box.right - 4)
  const width = Math.max(Math.min(220, size.w), Math.min(size.w, maxX - minX))
  const left = Math.min(Math.max(button.left, minX), Math.max(minX, maxX - width))

  const below = vh - button.bottom - GAP - MARGIN
  const above = button.top - GAP - MARGIN
  const placeBelow = below >= size.h || below >= above
  const maxHeight = Math.max(Math.min(180, size.h), Math.min(size.h, placeBelow ? below : above))

  return placeBelow
    ? { left, width, maxHeight, top: button.bottom + GAP }
    : { left, width, maxHeight, bottom: vh - button.top + GAP }
}

// ────────────────────────────────────────────────────────────────────────────
// 5. usePopover   (was src/usePopover.js)
// ────────────────────────────────────────────────────────────────────────────

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
