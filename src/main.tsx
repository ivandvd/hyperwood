import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource/ibm-plex-mono/400.css'
import './styles/tokens.css'
import './styles/global.css'
import { startOpening } from './ui/opening'
import { journeyOpening } from './journey/timeline'
import { Home } from './Home'
import { SiteExtras } from './site/SiteExtras'

// the opening is already on screen (index.html): from here it follows how far the journey behind it has got.
// Its mark comes full in one run from wherever it stands when the journey is whole.
startOpening(journeyOpening(), { finish: 'run' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
    <SiteExtras />
  </StrictMode>,
)
