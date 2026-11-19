/**
 * The master mark's outline as points, closely along its curves (MARK_D: the kit's symbol, its cubic curves), for a
 * page that moves the mark itself (the card beside the films, landing/MarkTile.tsx; the logo that swims,
 * journey/SwimLogo.tsx). In the mark's own units: its middle at 0, 0, y up, 2 wide. (The artwork is 428 by 191:
 * 214 of it to one.)
 */
import { MARK_D } from './mark'

const ART = { cx: 214, cy: 95.5, unit: 214 }

/** The mark is this many times as wide as tall. */
export const MARK_ASPECT = 428 / 191

/** `steps` points along each curve: x, y, x, y... */
export function markOutline(steps = 7) {
  const n = (MARK_D.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number)
  const points: number[] = []
  let x0 = n[0]
  let y0 = n[1]
  for (let i = 2; i + 5 < n.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6)
    for (let k = 0; k < steps; k++) {
      const t = k / steps
      const u = 1 - t
      const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
      const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
      points.push((x - ART.cx) / ART.unit, (ART.cy - y) / ART.unit)
    }
    x0 = x3
    y0 = y3
  }
  return new Float32Array(points)
}

/** Fills the outline `moved` (canvas pixels, x, y...) through the middles of its points, curving at each point:
 *  a smooth outline. */
export function fillOutline(ctx: CanvasRenderingContext2D, moved: Float32Array) {
  const count = moved.length / 2
  const mid = (i: number, k: number) => (moved[i * 2 + k] + moved[((i + 1) % count) * 2 + k]) / 2
  ctx.beginPath()
  ctx.moveTo(mid(count - 1, 0), mid(count - 1, 1))
  for (let i = 0; i < count; i++) ctx.quadraticCurveTo(moved[i * 2], moved[i * 2 + 1], mid(i, 0), mid(i, 1))
  ctx.closePath()
  ctx.fill()
}
