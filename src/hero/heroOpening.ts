/**
 * What the opening waits for on the earlier landing page (classic.html): the globe hero.
 *
 * The hero may be shown when both mountains are in the picture, a short check has held the story's heaviest
 * moment behind the cover and, on a slow machine, stepped the drawing down a size so scrolling stays smooth,
 * and frames are even (config.opening).
 */
import { config } from '../config'
import { store } from '../state/store'
import { capture } from '../scroll/capture'
import { demo } from '../scroll/demo'
import { setTitlesReady } from '../ui/titles'
import { milestone } from '../utils/milestone'
import type { OpeningSource } from '../ui/opening'

export function heroOpening(): OpeningSource {
  const O = config.opening
  let lastNow = performance.now()
  let lastTime = store.time
  let stable = 0
  let sceneSince = 0
  // the performance check: skipped for scripted takes, which run on their own clock
  const bench = { phase: capture.on || demo.on ? 'done' : 'rest', frames: 0, rest: [] as number[], heavy: [] as number[], rounds: 0 }
  const median = (v: number[]) => [...v].sort((x, y) => x - y)[v.length >> 1]

  return {
    poll(now) {
      const dt = now - lastNow
      lastNow = now
      const drawing = store.time > lastTime
      if (drawing && !sceneSince) {
        sceneSince = now
        milestone('first-frame')
      }
      // only frames the scene actually drew count, and only once the valley is in it
      if (drawing) stable = dt < 34 ? stable + 1 : 0
      if (!store.terrainReady) stable = 0

      // hold the heaviest moment of the story behind the cover: is this machine fast enough at this size?
      if (bench.phase !== 'done' && store.terrainReady && sceneSince && now - sceneSince > O.benchAfter * 1000 && drawing) {
        if (bench.phase === 'rest') {
          if (dt < 60) bench.rest.push(dt)
          if (bench.rest.length >= O.benchRest) {
            milestone('check-heavy')
            store.bench = O.benchAt
            bench.phase = 'heavy'
            bench.frames = 0
          }
        } else if (++bench.frames > O.benchSkip) {
          // (the first frames there also upload what that moment needs: not counted)
          bench.heavy.push(dt)
          if (bench.heavy.length >= O.benchSamples) {
            const Q = config.performance
            const slow = median(bench.heavy) > median(bench.rest) * O.benchSlow
            if (slow && store.setDpr && store.dpr > Q.minDpr + 0.01 && bench.rounds < O.benchRounds) {
              store.dpr = Math.max(Q.minDpr, store.dpr * O.benchStep)
              store.setDpr(store.dpr)
              bench.rounds++
              bench.frames = 0
              bench.heavy = []
            } else {
              milestone('check-done')
              store.bench = -1
              bench.phase = 'done'
            }
            stable = 0
          }
        }
      }
      lastTime = store.time

      const waited = sceneSince ? (now - sceneSince) / 1000 : 0
      return {
        scene: !!(store.setFrameloop || capture.on || sceneSince),
        whole: bench.phase === 'done' && store.terrainReady && !!sceneSince,
        settled: waited > 0.25 && (stable >= O.stableFrames || waited > O.stableTimeout),
      }
    },
    opened(reduced) {
      // the hero's own words may show from here on, and its title starts as the wave passes it
      document.querySelector('[data-loading]')?.removeAttribute('data-loading')
      window.setTimeout(setTitlesReady, reduced ? 0 : 560)
    },
  }
}
