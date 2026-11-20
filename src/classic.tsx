// The earlier landing page (classic.html): the globe hero and the four frames, kept as they were.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource/ibm-plex-mono/400.css'
import './styles/tokens.css'
import './styles/global.css'
// the valley's heights take most of a second to work out: the worker starts with the page, not with the hero's
// code (which is large and arrives later), so the two overlap
import './scene/environment/terrainData'
import { initDeck } from './deck/track'
import { startOpening } from './ui/opening'
import { heroOpening } from './hero/heroOpening'
import App from './App'
import { SiteExtras } from './site/SiteExtras'

// stack or flow: decided from the screen before anything is laid out (deck/track.ts)
initDeck()
// the opening is already on screen (classic.html): from here it follows how far the hero has got
startOpening(heroOpening())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SiteExtras />
  </StrictMode>,
)
