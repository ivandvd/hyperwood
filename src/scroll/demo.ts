/**
 * `?demo=1`: a scripted take for previews and videos. The scroll is not used: the same timeline is driven
 * from the scene clock (store.time), so every frame is a pure function of time and a capture on a virtual
 * clock is frame-exact. τ = 0 when the hero titles start (the preloader's circle is opening).
 */
import { config } from '../config'

export const demo = {
  on: typeof location !== 'undefined' && new URLSearchParams(location.search).get('demo') === '1',
  /** store.time at τ = 0 (−1 until the titles start). */
  start: -1,
  /** Seconds into the take (read by capture scripts as window.__hyperwoodDemo.t). */
  t: 0,
  tl: null as gsap.core.Timeline | null,
}

/** Scroll progress at τ seconds: holds and eased moves between the config.demo.keys stops. */
export function demoProgress(t: number) {
  const K = config.demo.keys
  if (t <= K[0][0]) return K[0][1]
  slope ??= slopes(K)
  for (let i = 0; i < K.length - 1; i++) {
    const [t0, p0] = K[i]
    const [t1, p1] = K[i + 1]
    if (t <= t1) {
      const h = t1 - t0
      const u = (t - t0) / h
      const u2 = u * u
      const u3 = u2 * u
      return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * slope[i] + (3 * u2 - 2 * u3) * p1 + (u3 - u2) * h * slope[i + 1]
    }
  }
  return K[K.length - 1][1]
}

/** Slopes at the stops of a monotone cubic through them (Fritsch-Carlson): the take keeps moving between
 *  two moving stops, eases into every hold and never overshoots one. */
function slopes(K: readonly (readonly [number, number])[]): number[] {
  const n = K.length
  const d: number[] = []
  for (let i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]))
  const m: number[] = [d[0]]
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2)
  m.push(d[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      m[i] = k * a * d[i]
      m[i + 1] = k * b * d[i]
    }
  }
  return m
}
let slope: number[] | null = null
