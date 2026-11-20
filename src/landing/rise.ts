/**
 * Words and pictures that rise into place as the scroll brings them in: every part of the page after the stage's
 * headline (the phones, why no one can trade ahead, the questions, the last screen, the foot).
 * Anything marked `data-rise` within a part's root is let in when it comes a tenth of the screen above the screen's
 * foot (`data-in`): it rises a little and comes up out of the dark with the page's one curve (global.css). Several
 * that come in together follow one another (`--i`, in the order they stand in the page). One that goes back below
 * the screen's foot (the reader scrolling up) goes out again, so it comes in again the next time; one scrolled past
 * upwards stays. The movement is the browser's own (a transition on the compositor): a scrubbed rise of this many
 * parts cost a slow phone frames.
 *
 * Until the helper runs, nothing is hidden (`html[data-reveal]` marks that it runs).
 */
import { useCallback } from 'react'

/** Let the parts within `root` that are marked `data-rise` in as they come onto the screen. */
export function rise(root: HTMLElement): () => void {
  document.documentElement.setAttribute('data-reveal', '')
  const parts = Array.from(root.querySelectorAll<HTMLElement>('[data-rise]'))
  if (!parts.length) return () => {}
  const watch = new IntersectionObserver(
    (entries) => {
      const coming = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target as HTMLElement)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      coming.forEach((el, i) => {
        el.style.setProperty('--i', String(i))
        el.setAttribute('data-in', '')
      })
      // (one that has gone back below the screen's foot goes out, to come in again)
      for (const e of entries) if (!e.isIntersecting && e.boundingClientRect.top > 0) (e.target as HTMLElement).removeAttribute('data-in')
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  parts.forEach((p) => watch.observe(p))
  return () => watch.disconnect()
}

/** A ref for a part's root: its `data-rise` parts are let in as they come onto the screen (and no longer watched
 *  when the part goes: React 19 calls the cleanup the ref returns). */
export function useRise<T extends HTMLElement>() {
  return useCallback((root: T | null) => (root ? rise(root) : undefined), [])
}
