import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './admin.css'
import './site.css'
import App from './App.jsx'
import Admin from './Admin.jsx'
import ResetPassword from './ResetPassword.jsx'
import { parseRoute } from './authHelpers'

// Pages:  #/edit (sign in + edit)   #/edit?video=ID (edit one video)   #/reset (choose a new password)
function Root() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const { path, params } = parseRoute(hash)
  if (path === '/reset') return <ResetPassword />
  if (path === '/edit' || path === '/admin') return <Admin focusVideo={params.get('video')} />
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
