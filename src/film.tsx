import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles/tokens.css'
import './styles/global.css'
import { FilmHero } from './film/FilmHero'
import { SiteExtras } from './site/SiteExtras'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FilmHero />
    <SiteExtras />
  </StrictMode>,
)
