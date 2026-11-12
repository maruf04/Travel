import { MOCK_VLOGGERS, MOCK_STOPS } from './data'

// Set VITE_API_URL=http://localhost:4000 in a .env file to use the real backend.
const BASE = import.meta.env.VITE_API_URL

async function get(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error('Request failed: ' + res.status)
  return res.json()
}

export async function getVloggers() {
  return BASE ? get('/api/vloggers') : MOCK_VLOGGERS
}

export async function getStops(vloggerId) {
  return BASE ? get(`/api/vloggers/${vloggerId}/stops`) : MOCK_STOPS[vloggerId] || []
}
