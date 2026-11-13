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

// Accepts an ISO code or a name returned by countryName(). Earth has no flag (null).
export function flagUrl(country) {
  if (!country || country.toUpperCase() === EARTH || country === EARTH_NAME) return null
  const code = /^[A-Z]{2}$/i.test(country) ? country : nameToCode.get(country)
  return code ? `https://flagcdn.com/w80/${code.toLowerCase()}.png` : null
}
