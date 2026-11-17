/**
 * The landing page: the journey (the pinned opening, one shader and the words over it), the protocol section
 * that scrolls up over it, and the footer that waits underneath. The long read is the Architecture page.
 */
import { useEffect } from 'react'
import { Journey } from './journey/Journey'
import { startGlide } from './journey/glide'
import { Protocol } from './landing/Protocol'
import { Foot } from './landing/Foot'

export function Home() {
  useEffect(() => startGlide(), [])
  return (
    <>
      <a className="skip" href="#protocol">
        Skip introduction
      </a>
      <Journey />
      <Protocol />
      <Foot />
    </>
  )
}
