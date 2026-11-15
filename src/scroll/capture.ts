/**
 * `?capture=1` (used together with `?demo=1`): nothing runs on the real clock. The render loop is
 * off, GSAP's ticker is detached, and a script steps one exact frame at a time through
 * `window.__hyperwoodCapture.step()`, so a recording is frame-perfect however slow the capture is.
 */
import gsap from 'gsap'
import { store } from '../state/store'

export const capture = {
  on: typeof location !== 'undefined' && new URLSearchParams(location.search).get('capture') === '1',
  /** Seconds per stepped frame. */
  frame: 1 / 60,
  /** Virtual time so far (s). */
  time: 0,
}

/** Hands the clocks to the capture script. `advance` renders one frame at the given time (s). */
export function startCapture(advance: (time: number) => void) {
  store.fixedStep = capture.frame
  gsap.ticker.remove(gsap.updateRoot)
  const api = {
    get time() {
      return capture.time
    },
    step(frames = 1) {
      for (let i = 0; i < frames; i++) {
        capture.time += capture.frame
        gsap.updateRoot(capture.time)
        advance(capture.time)
      }
      return capture.time
    },
  }
  ;(window as unknown as { __hyperwoodCapture: typeof api }).__hyperwoodCapture = api
}
