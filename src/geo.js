// Finds a sensible pin position for a country: the centre of its largest land piece.
// Used for corrected/added videos that have no exact place, so they still show a flag on the map.
let centers = null

export function polygonCenter(geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  let best = null
  let bestArea = 0
  for (const poly of polys) {
    const ring = poly[0]
    let a = 0
    let cx = 0
    let cy = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x1, y1] = ring[j]
      const [x2, y2] = ring[i]
      const f = x1 * y2 - x2 * y1
      a += f
      cx += (x1 + x2) * f
      cy += (y1 + y2) * f
    }
    const area = Math.abs(a) / 2
    if (a !== 0 && area > bestArea) {
      bestArea = area
      best = [+(cy / (3 * a)).toFixed(2), +(cx / (3 * a)).toFixed(2)] // [lat, lng]
    }
  }
  return best
}

// world = the FeatureCollection from world.json; code = "TR", "BD", ...
export function countryCenter(world, code) {
  if (!world) return null
  if (!centers) {
    centers = new Map()
    for (const f of world.features) centers.set(f.properties.code, polygonCenter(f.geometry))
  }
  return centers.get(code) || null
}
