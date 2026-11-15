/**
 * Measures the fused pieces at rest (run: npx tsx scripts/liquid-shape.ts).
 * Evaluates the same field the shader marches and reports how round and how even the surface is:
 * outer radius by latitude, the ripple along each parallel, and the steepest slopes a reflection
 * would see. (The hero's resting drop is an exact sphere; this is the body it hands over to.)
 * What-ifs from the command line: K=1.8 OVERLAP=1.6 MERID=3.8 THICK=1.7 POLE=4 POLET=1.6 MAXA=4.6 ACT=1
 */
import { buildLayout } from '../src/choreography/layout'
import { config } from '../src/config'
import type { V3 } from '../src/utils/math'

declare const process: { env: Record<string, string | undefined> }

const Q = config.liquid as unknown as Record<string, number>
const env = (name: string, key: string) => {
  if (process.env[name] !== undefined) Q[key] = Number(process.env[name])
}
env('K', 'sharpness')
env('OVERLAP', 'overlap')
env('MERID', 'meridian')
env('THICK', 'thickness')
env('POLE', 'pole')
env('POLET', 'poleThickness')
env('MAXA', 'maxAlong')

// imported after the overrides, so the field constants see them
const { meanOuterRadius, outerRadius, restPieces } = await import('../src/scene/liquid/liquidField')

const L = buildLayout()
const act = Number(process.env.ACT ?? 0)
const pieces = restPieces(L, act)
const surface = (dir: V3) => outerRadius(pieces, dir)

console.log(`sharpness ${Q.sharpness}, overlap ${Q.overlap}, meridian ${Q.meridian}, thickness ${Q.thickness}, activation ${act}`)
const byLat: number[] = []
const rows: string[] = []
for (let latDeg = -90; latDeg <= 90; latDeg += 7.5) {
  const lat = (latDeg * Math.PI) / 180
  let min = Infinity
  let max = -Infinity
  let sum = 0
  for (let i = 0; i < 360; i++) {
    const lon = (i * Math.PI) / 180
    const r = surface([Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)])
    min = Math.min(min, r)
    max = Math.max(max, r)
    sum += r
  }
  byLat.push(sum / 360)
  rows.push(`${String(latDeg).padStart(5)}  ${(sum / 360).toFixed(3)}  ${(max - min).toFixed(3)}`)
}
if (process.env.TABLE) console.log('lat°   mean    ripple along the parallel\n' + rows.join('\n'))
const lo = Math.min(...byLat)
const hi = Math.max(...byLat)
console.log(`mean radius by latitude: ${lo.toFixed(3)} … ${hi.toFixed(3)} (out of round by ${(hi - lo).toFixed(3)}); mean over the sphere ${meanOuterRadius(L).toFixed(3)}`)

function maxSlope(sample: (u: number) => V3, n: number) {
  let worst = 0
  let prev = surface(sample(0))
  const du = (Math.PI * 2) / n
  for (let i = 1; i <= n; i++) {
    const r = surface(sample(i * du))
    worst = Math.max(worst, Math.abs(Math.atan((r - prev) / (((r + prev) / 2) * du))))
    prev = r
  }
  return (worst * 180) / Math.PI
}
const c30 = Math.cos(0.5236)
const s30 = Math.sin(0.5236)
console.log(
  `steepest slope: equator ${maxSlope((u) => [Math.sin(u), 0, Math.cos(u)], 1440).toFixed(2)}°, ` +
    `meridian ${maxSlope((u) => [0, Math.sin(u), Math.cos(u)], 1440).toFixed(2)}°, ` +
    `30° parallel ${maxSlope((u) => [c30 * Math.sin(u), s30, c30 * Math.cos(u)], 1440).toFixed(2)}°`,
)
