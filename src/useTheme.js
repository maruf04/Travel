import { useEffect, useState } from 'react'

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
