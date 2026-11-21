// Entry point: loads the styles and shows the right page for the address.
//   #/           the map (App.jsx)
//   #/edit       sign in, then the edit page (Admin.jsx); #/edit?video=ID opens one video
//   #/reset      choose a new password (from the email link; ResetPassword in auth.jsx)
//
// Where things are:
//   App.jsx          the public map page: topic tabs, channels, timeline, map, sidebar
//   Admin.jsx        the edit page (videos, topics, channels, members, profile, account)
//   MapView.jsx      the map itself (markers, country shading, video player)
//   Timeline.jsx     the bending year timeline (History tab)
//   CountryPanel.jsx sidebar list and Wikipedia info for a selected country
//   layout.jsx       banner (header) and footer
//   auth.jsx         sign-in, reset-password and account screens
//   pickers.jsx      colour and emoji pop-ups (edit page)
//   data.js          loading data from the database, countries, small helpers
//   hooks.js         shared React hooks (sign-in state, theme, map selection, pop-ups)
//   content.js       your details for the footer, contributor links
//   styles.css       all styles

import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import App from './App.jsx'
import Admin from './Admin.jsx'
import { ResetPassword } from './auth'
import { parseRoute } from './data'

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
