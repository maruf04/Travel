// Countries are stored as ISO codes ("TR", "BD") in the data files.
// Names come from the browser; a few are shortened or kept the way the site has always shown them.
const NAME_OVERRIDES = {
  TR: 'Türkiye', AE: 'UAE', US: 'USA', MK: 'North Macedonia', GB: 'United Kingdom',
  BA: 'Bosnia and Herzegovina',
}
const display = new Intl.DisplayNames(['en'], { type: 'region' })
const nameToCode = new Map()

// Special "country" for videos about the whole world (e.g. a history of inventions):
// they shade the entire map and are listed under "Earth".
export const EARTH = 'EARTH'
export const EARTH_NAME = 'Earth'

export function countryName(code) {
  const upper = code.toUpperCase()
  if (upper === EARTH) return EARTH_NAME
  let name
  try {
    name = NAME_OVERRIDES[upper] || display.of(upper)
  } catch {
    name = upper
  }
  nameToCode.set(name, upper)
  return name
}

// Common mistakes in saved data: "UK" is not an ISO code (the United Kingdom is "GB").
const CODE_ALIASES = { UK: 'GB' }

// Finds the ISO code for a country name such as "Germany", even if no video uses that country yet.
let allNames = null
function codeFromName(name) {
  if (!allNames) {
    allNames = new Map()
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b)
        const n = countryName(code)
        if (n && n !== code && !/unknown/i.test(n)) allNames.set(n.toLowerCase(), code)
      }
    }
  }
  return allNames.get(name.toLowerCase())
}

// Accepts an ISO code ("DE") or a country name ("Germany"), in any capitals. Earth has no flag (null).
export function flagUrl(country) {
  if (!country) return null
  const text = String(country).trim()
  if (!text || text.toUpperCase() === EARTH || text === EARTH_NAME) return null
  let code = /^[A-Z]{2}$/i.test(text) ? text.toUpperCase() : nameToCode.get(text) || codeFromName(text)
  if (!code) return null
  code = CODE_ALIASES[code] || code
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`
}
