/**
 * The app's screens by themselves (studio.html): for looking at them, and for taking the pictures the landing page
 * shows (scripts/product). Not linked from the site.
 *
 *   studio.html?screen=trade            the Trade screen
 *   studio.html?screen=close            the same with the sheet that closes a position
 *   &fit                                scaled to the window (otherwise at its own size, 1280 by 820)
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles/tokens.css'
import './styles/global.css'
import { Studio } from './product/Studio'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Studio />
  </StrictMode>,
)
