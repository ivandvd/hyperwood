import { Suspense, lazy, useState } from 'react'
import { SiteHeader } from './ui/SiteHeader'
import { Deck } from './deck/Deck'
import { Footer } from './deck/Footer'
import { useDeckMode } from './deck/track'
import { landing } from './content.landing'
import type { StageState } from './scroll/useScrollTimeline'
import styles from './App.module.css'

/** The hero: the liquid globe that bursts over the valley and ends on the mark. Its code is large (the 3D
 *  scene), so it loads beside the page, not before it: the opening is on screen meanwhile. */
const GlobeStage = lazy(() => import('./hero/GlobeStage'))

/** The landing page: the opening, the hero, the deck (four frames that take over from it), the footer. */
export default function App() {
  const mode = useDeckMode()
  /** The hero has handed over to the page: the header gains its bar and links, the scene sits in its frame. */
  const [state, setState] = useState<StageState>({ framed: false, covered: false })

  return (
    <>
      <SiteHeader backed={state.framed} nav={landing.nav} more={landing.docs} />
      <main>
        <Suspense fallback={<div className={styles.stage} />}>
          <GlobeStage mode={mode} onState={setState} />
        </Suspense>
        <Deck />
      </main>
      <Footer nav={landing.nav} more={landing.docs} />
    </>
  )
}
