/**
 * What the landing page has to know about the bulb of each finished film, read off the films themselves:
 *
 *   where the bulb hangs    as shares of the film's width and height: `bulb` in src/film/reel.ts
 *   how its light falls     how much Neon there is at a distance from the bulb's middle, beside what the page
 *                           draws for the same distance (`room.light` in src/config.ts)
 *
 * The journey's own light takes the bulb's place and its fall when it hands over to a film, so both have to
 * agree with the films. Run it after a film has been finished again or a new one has been added:
 *
 *   npx tsx scripts/film/light.ts
 *
 * Needs ffmpeg. In a finished film a pixel is Ink, plus a neutral share, plus (Neon less Ink) times n: so n,
 * the Neon there, is its green less its blue (scripts/film/tint.cjs).
 */
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { config } from '../../src/config'

const FILMS = ['booth', 'board', 'seal']
const DIR = resolve(import.meta.dirname, '../../src/assets/film')
/** the finished films' size */
const W = 960
const H = 720
/** the fall is read in rings this far apart, out to this far (px) */
const STEP = 6
const REACH = 126

const pct = (list: number[], p: number) => {
  const sorted = Float64Array.from(list).sort()
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}

/** What the page draws: the same sum the shader has (src/journey/shader.ts, "the lamp"). */
const { full, sigma, tail, knee } = config.journey.room.light
const drawn = (r: number) => {
  const x = full * Math.exp((-r * r) / (2 * sigma * sigma)) + tail[0] * Math.exp(-r / tail[1])
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (1 - x)) / knee))
  return 1 + (x - 1) * h - knee * h * (1 - h)
}

const rings = Math.floor(REACH / STEP) + 1
const seen: number[][] = Array.from({ length: rings }, () => [])

for (const name of FILMS) {
  // every sixth frame of the film, as plain RGB
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', resolve(DIR, `${name}.mp4`), '-vf', "select='not(mod(n,6))'", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 })
  const frames = raw.length / (W * H * 3)
  const neon = (frame: number, x: number, y: number) => {
    const i = (frame * W * H + y * W + x) * 3
    return (raw[i + 1] - raw[i + 2]) / 255
  }
  // the bulb's middle: the middle of what is all but full Neon, frame by frame (something may pass before
  // the bulb for a few frames: the median over the take is where it hangs)
  const xs: number[] = []
  const ys: number[] = []
  for (let f = 0; f < frames; f++) {
    let sx = 0
    let sy = 0
    let count = 0
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (neon(f, x, y) > 0.9) {
          sx += x
          sy += y
          count++
        }
    if (count > 20) {
      xs.push(sx / count)
      ys.push(sy / count)
    }
  }
  const cx = pct(xs, 0.5)
  const cy = pct(ys, 0.5)
  const drift = pct(
    xs.map((x, i) => Math.hypot(x - cx, ys[i] - cy)),
    0.9,
  )
  console.log(`${name}: bulb: [${(cx / W).toFixed(4)}, ${(cy / H).toFixed(4)}]   (it strays ${drift.toFixed(1)} px in nine frames of ten)`)
  for (let f = 0; f < frames; f += 2)
    for (let y = Math.max(0, Math.floor(cy - REACH)); y < Math.min(H, cy + REACH); y++)
      for (let x = Math.max(0, Math.floor(cx - REACH)); x < Math.min(W, cx + REACH); x++) {
        const ring = Math.round(Math.hypot(x - cx, y - cy) / STEP)
        if (ring < rings) seen[ring].push(Math.max(0, neon(f, x, y)))
      }
}

// Things darker than the wall stand in the light here and there, so the films' fall is read twice: the middle
// of what is seen at a distance, and the nine-tenths mark (the light where nothing dark stands in it). What
// the page draws should run between the two.
console.log('\nhow much Neon at a distance from the bulb (distance in film widths):')
console.log('  distance   films, middle   films, upper   the page draws')
seen.forEach((ring, k) => {
  const r = (k * STEP) / W
  console.log(`  ${r.toFixed(4)}     ${pct(ring, 0.5).toFixed(2)}            ${pct(ring, 0.9).toFixed(2)}           ${drawn(r).toFixed(2)}`)
})
