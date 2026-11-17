import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { restingScroll } from '../deck/track'

gsap.registerPlugin(ScrollToPlugin)

/** Glides to a part of the page by its id. A frame of the deck is shown at rest, with its picture played.
 *  Returns false when there is no such part (the caller then lets the link do what links do). */
export function glideTo(id: string, seconds = 1.2) {
  const el = document.getElementById(id)
  if (!el) return false
  gsap.to(window, { scrollTo: { y: restingScroll(el), autoKill: true }, duration: seconds, ease: 'power2.inOut' })
  return true
}
