/**
 * The landing page: the journey (the pinned opening: one shader and the words over it), then what follows it
 * on the same Ink as one continuous film (landing/After.tsx), and the footer. The long read is the
 * Architecture page.
 */
import { useEffect } from 'react'
import { Journey } from './journey/Journey'
import { startGlide } from './journey/glide'
import { After } from './landing/After'
import { Footer } from './landing/Footer'

export function Home() {
  useEffect(() => startGlide(), [])
  return (
    <>
      <Journey />
      <After />
      <Footer />
    </>
  )
}
