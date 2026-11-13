// Groups flat stops into countries -> cities -> videos.
// If a stop has no `country`, it is taken from the end of `place` ("Tirana, Albania" -> "Albania").
// Countries with fewer than `minVideos` videos get cluster:false, so the map
// shows their cities directly instead of a country marker.
// `color` on a city/country is the topic colour when all its videos share one, otherwise null.
export function groupByCountry(stops, minVideos = 4) {
  const countries = new Map()
  for (const s of stops) {
    const name = s.country || s.place.split(', ').pop()
    if (!countries.has(name)) countries.set(name, { country: name, cities: new Map(), videos: 0 })
    const c = countries.get(name)
    c.videos += 1
    if (!c.cities.has(s.place)) c.cities.set(s.place, { place: s.place, lat: s.lat, lng: s.lng, videos: [] })
    c.cities.get(s.place).videos.push({ id: s.id, title: s.title, url: s.url, color: s.color })
  }
  const shared = (videos) => (videos.every((v) => v.color === videos[0].color) ? videos[0].color : null)
  return [...countries.values()].map((c) => {
    const cities = [...c.cities.values()].map((city) => ({ ...city, color: shared(city.videos) }))
    return {
      country: c.country,
      videos: c.videos,
      cities,
      color: shared(cities.flatMap((x) => x.videos)),
      lat: cities.reduce((a, x) => a + x.lat, 0) / cities.length,
      lng: cities.reduce((a, x) => a + x.lng, 0) / cities.length,
      cluster: c.videos >= minVideos,
    }
  })
}
