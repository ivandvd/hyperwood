/**
 * The Hyperwood Morph symbol and the brand kit's own morph (kit 03.9, "A drop becomes the mark"):
 * the master's 98 cubic segments are interpolated from a circle built with the same segment count.
 * The path is read from the kit's symbol file, so what is drawn here is always the supplied master.
 */
import symbol from '../assets/brand/hyperwood-symbol-neon.svg?raw'
import { config } from '../config'

interface Cubic {
  start: [number, number]
  segs: number[][]
}

/** The master path exactly as supplied, in the units of the 427.3 x 191 artwork. */
export const MARK_D = /<path[^>]*\sd="([^"]+)"/.exec(symbol)?.[1] ?? ''

function parseCubic(d: string): Cubic {
  const n = (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number)
  const segs: number[][] = []
  for (let i = 2; i + 5 < n.length; i += 6) segs.push(n.slice(i, i + 6))
  return { start: [n[0], n[1]], segs }
}

/** A circle as `count` equal cubic arcs, starting at angle `a0`: the kit's "circle of the same construction". */
function circleCubic(cx: number, cy: number, r: number, count: number, a0: number): Cubic {
  const step = (2 * Math.PI) / count
  const k = (4 / 3) * Math.tan(step / 4) * r
  const segs: number[][] = []
  for (let i = 0; i < count; i++) {
    const a = a0 + i * step
    const b = a + step
    const p0 = [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    const p3 = [cx + r * Math.cos(b), cy + r * Math.sin(b)]
    segs.push([p0[0] - k * Math.sin(a), p0[1] + k * Math.cos(a), p3[0] + k * Math.sin(b), p3[1] - k * Math.cos(b), p3[0], p3[1]])
  }
  return { start: [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], segs }
}

const ART = config.mark.art
const TO = parseCubic(MARK_D)
const FROM = circleCubic(ART.drop[0], ART.drop[1], ART.dropRadius, TO.segs.length, Math.atan2(TO.start[1] - ART.drop[1], TO.start[0] - ART.drop[0]))

/** The path at morph position `e`: 0 is the drop, 1 is the master (returned verbatim, never rebuilt). */
export function markPath(e: number): string {
  if (e >= 1) return MARK_D
  const mix = (a: number, b: number) => (a + (b - a) * e).toFixed(2)
  let s = 'M' + mix(FROM.start[0], TO.start[0]) + ' ' + mix(FROM.start[1], TO.start[1])
  for (let i = 0; i < TO.segs.length; i++) {
    const f = FROM.segs[i]
    const g = TO.segs[i]
    s += 'C' + mix(f[0], g[0]) + ' ' + mix(f[1], g[1]) + ' ' + mix(f[2], g[2]) + ' ' + mix(f[3], g[3]) + ' ' + mix(f[4], g[4]) + ' ' + mix(f[5], g[5])
  }
  return s + 'Z'
}

/** The kit's curve, cubic-bezier(.22, 1, .36, 1): a fast start, a long soft settle, no overshoot. */
export function brandEase(p: number): number {
  if (p <= 0) return 0
  if (p >= 1) return 1
  const x1 = 0.22
  const x2 = 0.36
  // solve x(u) = p with Newton steps, then take y at that u (both y handles are 1)
  let u = p
  for (let i = 0; i < 8; i++) {
    const v = 1 - u
    const x = 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u - p
    const dx = 3 * v * v * x1 + 6 * v * u * (x2 - x1) + 3 * u * u * (1 - x2)
    if (Math.abs(dx) < 1e-6) break
    u = Math.min(1, Math.max(0, u - x / dx))
  }
  const v = 1 - u
  return 3 * v * v * u + 3 * v * u * u + u * u * u
}
