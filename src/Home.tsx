/**
 * The landing page. For now it is the journey alone (the pinned opening: one shader and the words over it).
 * The sections that follow it are being planned afresh; the protocol section and the footer that stood here
 * until 2026-11-17 are in the repository's history. The long read is the Architecture page.
 */
import { useEffect } from 'react'
import { Journey } from './journey/Journey'
import { startGlide } from './journey/glide'

export function Home() {
  useEffect(() => startGlide(), [])
  return <Journey />
}
