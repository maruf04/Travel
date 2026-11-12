import { useState } from 'react'

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
