/**
 * The landing page: the journey (the pinned opening: one shader and the words over it), then what follows it
 * on the same Ink as one continuous film (landing/After.tsx), and the footer. The long read is the
 * Architecture page.
 *
 * The journey's hero is a room with the films in it. An address that ends in ?hero=mark shows the hero as it
 * was before them: the mark as a body of black liquid.
 */
import { useEffect } from 'react'
import { Journey } from './journey/Journey'
import { startGlide } from './journey/glide'
import { After } from './landing/After'
import { flowSoar } from './landing/flags'
import { Footer } from './landing/Footer'
import { MegaFooter } from './landing/soar/MegaFooter'

const films = new URLSearchParams(window.location.search).get('hero') !== 'mark'

export function Home() {
  useEffect(() => startGlide(), [])
  return (
    <>
      <Journey films={films} />
      <After />
      {flowSoar ? <MegaFooter /> : <Footer />}
    </>
  )
}
