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
