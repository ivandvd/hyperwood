/**
 * The landing page: the journey (the pinned opening: one shader and the words over it), then what follows it
 * on the same Ink: the app as one scroll sequence, and the sections after it. (The protocol section and the
 * footer that stood here until 2026-11-17 are in the repository's history.) The long read is the Architecture
 * page.
 */
import { useEffect } from 'react'
import { Journey } from './journey/Journey'
import { startGlide } from './journey/glide'
import { Sequence } from './landing/Sequence'
import { Markets } from './landing/Markets'
import { Mobile } from './landing/Mobile'
import { Network } from './landing/Network'
import { Footer } from './landing/Footer'

export function Home() {
  useEffect(() => startGlide(), [])
  return (
    <>
      <Journey />
      <Sequence />
      <Markets />
      <Mobile />
      <Network />
      <Footer />
    </>
  )
}
