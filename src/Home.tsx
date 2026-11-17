/**
 * The landing page: the journey (the pinned opening: one shader and the words over it), then the sections
 * that follow it, built one at a time: so far the app. (The protocol section and the footer that stood here
 * until 2026-11-17 are in the repository's history.) The long read is the Architecture page.
 */
import { useEffect } from 'react'
import { Journey } from './journey/Journey'
import { startGlide } from './journey/glide'
import { Product } from './landing/Product'

export function Home() {
  useEffect(() => startGlide(), [])
  return (
    <>
      <Journey />
      <Product />
    </>
  )
}
