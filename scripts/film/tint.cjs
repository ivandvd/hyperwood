// The colour stage of a film clip's finish.
// The black-and-white picture is laid on the page's Ink (its black is #0a0a0a), and the light of the bulb,
// and only that light, is turned to Hyper Neon: the bulb's glass comes out as #ccff00.
//
// A pixel near the bulb is read as two lights added together: the bulb's glow (as bright as the glow is at
// that distance, never more than the pixel itself) and whatever else the scene shows there. The glow takes
// the straight Ink to Neon mix; the rest stays neutral. So a collar or a face near the bulb keeps its own
// white under a veil of Neon, and the dark beside the bulb glows Neon. (Tinting everything inside a round
// patch, tried first, made a flat green blob and green faces.)
//
// How the glow falls off is measured on the clip itself: ring by ring about the bulb, a low percentile of
// brightness (what the darkest things at that distance still show is the glow), less the room's own level.
//
// usage: node scripts/film/tint.cjs <stage 1 frames, raw 8-bit grey> <bulb.json> <out.mp4> <still.jpg>
// In the environment: CRF sets the weight of the file (23 gives about 200 kB a second at 960 by 720);
// GLOW_PCT is the percentile read as glow (0.3; lower it when something pale stands near the bulb and comes
// out tinted); GLOW_GAIN scales the halo; LOOP makes the film go round (below).
//
// LOOP, a number of frames: the take's last LOOP frames dissolve into its first, so the film comes out that
// many frames shorter and its end runs on into its beginning. The page plays a film round and round for as
// long as it is on screen: without this the picture jumps every time it starts again. (The camera is locked,
// so only what moves dissolves. 18 frames, three quarters of a second, is what the films have.)
const fs = require('node:fs')
const { spawn, execFileSync } = require('node:child_process')

const [, , grayPath, bulbPath, outPath, stillPath] = process.argv
const { cx, cy, W, H } = JSON.parse(fs.readFileSync(bulbPath, 'utf8'))
const size = W * H
const frames = fs.statSync(grayPath).size / size
const PCT = Number(process.env.GLOW_PCT || 0.3)
const GAIN = Number(process.env.GLOW_GAIN || 1)

const fd = fs.openSync(grayPath, 'r')
const gray = Buffer.alloc(size)
const some = [0.04, 0.27, 0.5, 0.73, 0.96].map((t) => Math.min(frames - 1, Math.round(t * (frames - 1))))

// ---- the glow's fall-off, ring by ring (rings in px of a clip 1112 wide, scaled to this one)
const scale = W / 1112
const edge = [0, 6, 12, 18, 24, 30, 36, 44, 52, 60, 70, 80, 95, 110, 130, 150, 180].map((r) => r * scale)
const rings = edge.slice(0, -1).map(() => [])
const far = edge[edge.length - 1]
for (const f of some) {
  fs.readSync(fd, gray, 0, size, f * size)
  for (let y = Math.max(0, Math.floor(cy - far)); y < Math.min(H, Math.ceil(cy + far)); y++)
    for (let x = Math.max(0, Math.floor(cx - far)); x < Math.min(W, Math.ceil(cx + far)); x++) {
      const r = Math.hypot(x - cx, y - cy)
      if (r >= far) continue
      let k = rings.length - 1
      while (r < edge[k]) k--
      rings[k].push(gray[y * W + x])
    }
}
const level = rings.map((v) => v.sort((a, b) => a - b)[Math.floor(v.length * PCT)])
const room = Math.min(...level.slice(-3))
const R = edge.slice(0, -1).map((r, k) => (k === 0 ? 0 : (r + edge[k + 1]) / 2))
const G = []
level.forEach((v, k) => {
  const g = (Math.max(0, v - room) * 255) / (level[0] - room)
  G.push(k === 0 ? 255 : Math.min(G[k - 1], k < 3 ? g : g * GAIN))
})
R.push(far)
G.push(0)
// a dark hat or a head at one distance from the bulb leaves a dip in the reading there, and a dip shows as a
// hard rim round the glow: no ring is left darker than the fall between its neighbours
for (let pass = 0; pass < 3; pass++)
  for (let k = 1; k < G.length - 1; k++) G[k] = Math.max(G[k], Math.sqrt(G[k - 1] * G[k + 1]))
// The glow is never wider than the booth film's, the first one made and the measure for the rest. Where a
// bulb hangs before a pale wall, the wall's own grey reads as glow and the Neon would spread over it as a
// haze; and the light should be the same size in every film.
const WIDEST = [[0, 255], [9, 252], [15, 244], [21, 221], [27, 197], [33, 179], [40, 151], [48, 117], [56, 93], [65, 65], [75, 33], [87, 19], [102, 9], [120, 5], [140, 2], [160, 0]]
const widestAt = (r) => {
  const q = r / scale
  if (q >= 160) return 0
  let k = 0
  while (q > WIDEST[k + 1][0]) k++
  return WIDEST[k][1] + ((WIDEST[k + 1][1] - WIDEST[k][1]) * (q - WIDEST[k][0])) / (WIDEST[k + 1][0] - WIDEST[k][0])
}
for (let k = 0; k < G.length; k++) G[k] = Math.min(G[k], widestAt(R[k]))
console.log('glow, px from the bulb: strength  ', R.map((r, k) => `${Math.round(r)}: ${Math.round(G[k])}`).join('  '))
const glowAt = (r) => {
  if (r >= far) return 0
  let k = 0
  while (r > R[k + 1]) k++
  return G[k] + ((G[k + 1] - G[k]) * (r - R[k])) / (R[k + 1] - R[k])
}
const glow = new Uint8Array(size)
for (let y = Math.max(0, Math.floor(cy - far)); y < Math.min(H, Math.ceil(cy + far)); y++)
  for (let x = Math.max(0, Math.floor(cx - far)); x < Math.min(W, Math.ceil(cx + far)); x++)
    glow[y * W + x] = Math.round(glowAt(Math.hypot(x - cx, y - cy)))

// ---- how bright the bulb's own glass is in this take (the black-and-white stage may have dimmed it): its
// light is scaled so that the glass comes out as full Neon, whatever the take
const core = []
const reach = Math.round(8 * scale)
for (const f of some) {
  fs.readSync(fd, gray, 0, size, f * size)
  for (let y = Math.round(cy) - reach; y <= Math.round(cy) + reach; y++)
    for (let x = Math.round(cx) - reach; x <= Math.round(cx) + reach; x++) if (Math.hypot(x - cx, y - cy) <= reach) core.push(gray[y * W + x])
}
core.sort((a, b) => a - b)
const glass = core[Math.floor(core.length * 0.5)]
const full = Math.min(1.3, (255 / glass) * 1.02)
console.log(`the bulb's glass reads ${glass} of 255 in this take: its light is scaled by ${full.toFixed(3)}`)

// Ink #0a0a0a and Hyper Neon #ccff00
const INK = [10, 10, 10]
const NEON = [204, 255, 0]
const lift = new Uint8Array(256)
for (let v = 0; v < 256; v++) lift[v] = Math.round(10 + (v * 245) / 255)

const enc = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', '24', '-i', '-',
  '-vf', 'scale=960:720:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '23', '-pix_fmt', 'yuv420p',
  '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-movflags', '+faststart', '-an', outPath], { stdio: ['pipe', 'inherit', 'inherit'] })

// ---- what the film itself has suffered: thin scratches running down it for a moment or a few seconds, and
// specks of dust that last one frame. They lie on the film, over the picture and its colour, and are the
// same every time the script runs (the numbers come from a seeded generator).
let seed = 20261118
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const WEAR = Number(process.env.WEAR ?? 1)
const scratches = []
const wear = (rgb) => {
  if (WEAR <= 0) return
  if (scratches.length < 3 && rand() < 0.05) {
    const long = rand() < 0.3
    scratches.push({ x: W * (0.04 + 0.92 * rand()), life: long ? 50 + Math.floor(90 * rand()) : 4 + Math.floor(22 * rand()), a: (long ? 0.07 + 0.07 * rand() : 0.1 + 0.16 * rand()) * WEAR, y0: rand() < 0.5 ? 0 : Math.floor(H * 0.35 * rand()), y1: rand() < 0.5 ? H : Math.floor(H * (0.65 + 0.35 * rand())), f: 0.004 + 0.02 * rand(), ph: 6.28 * rand() })
  }
  for (let k = scratches.length - 1; k >= 0; k--) {
    const s = scratches[k]
    s.x += (rand() - 0.5) * 0.7
    const xi = Math.floor(s.x)
    const fx = s.x - xi
    if (xi >= 0 && xi < W - 1)
      for (let y = s.y0; y < s.y1; y++) {
        const a = s.a * (0.55 + 0.45 * Math.sin(y * s.f + s.ph))
        if (a <= 0) continue
        for (const [dx, w] of [[0, 1 - fx], [1, fx]]) {
          const o = (y * W + xi + dx) * 3
          for (let c = 0; c < 3; c++) rgb[o + c] += (235 - rgb[o + c]) * a * w
        }
      }
    if (--s.life <= 0) scratches.splice(k, 1)
  }
  const specks = Math.floor(rand() * 3 * WEAR)
  for (let k = 0; k < specks; k++) {
    const cx0 = Math.floor(W * rand()), cy0 = Math.floor(H * rand()), r = 0.8 + 1.8 * rand(), to = rand() < 0.6 ? 0 : 225, a = 0.35 + 0.35 * rand()
    for (let y = Math.max(0, Math.floor(cy0 - r)); y <= Math.min(H - 1, cy0 + r); y++)
      for (let x = Math.max(0, Math.floor(cx0 - r)); x <= Math.min(W - 1, cx0 + r); x++) {
        if (Math.hypot(x - cx0, y - cy0) > r) continue
        const o = (y * W + x) * 3
        for (let c = 0; c < 3; c++) rgb[o + c] += ((to === 0 ? INK[c] : to) - rgb[o + c]) * a
      }
  }
}

const LOOP = Math.max(0, Math.min(Math.floor(frames / 3), Math.round(Number(process.env.LOOP || 0))))
const leaving = LOOP ? Buffer.alloc(size) : null
const kept = frames - LOOP

;(async () => {
  for (let f = 0; f < kept; f++) {
    fs.readSync(fd, gray, 0, size, f * size)
    if (f < LOOP) {
      // (the end of the take goes out as its beginning comes in)
      fs.readSync(fd, leaving, 0, size, (kept + f) * size)
      const come = (f + 0.5) / LOOP
      for (let i = 0; i < size; i++) gray[i] = Math.round(leaving[i] + (gray[i] - leaving[i]) * come)
    }
    const rgb = Buffer.allocUnsafe(size * 3)
    for (let i = 0, o = 0; i < size; i++, o += 3) {
      const v = gray[i]
      const g = glow[i]
      if (g === 0) {
        const l = lift[v]
        rgb[o] = l; rgb[o + 1] = l; rgb[o + 2] = l
      } else {
        const part = v < g ? v : g // the bulb's share of this pixel's light
        const n = Math.min(1, (part * full) / 255)
        const base = (245 * (v - part)) / 255
        rgb[o] = Math.min(255, Math.round(INK[0] + base + (NEON[0] - INK[0]) * n))
        rgb[o + 1] = Math.min(255, Math.round(INK[1] + base + (NEON[1] - INK[1]) * n))
        rgb[o + 2] = Math.max(0, Math.min(255, Math.round(INK[2] + base + (NEON[2] - INK[2]) * n)))
      }
    }
    wear(rgb)
    if (!enc.stdin.write(rgb)) await new Promise((go) => enc.stdin.once('drain', go))
  }
  enc.stdin.end()
  await new Promise((done) => enc.on('close', done))
  // the still shown before the film has loaded: its first frame
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', outPath, '-frames:v', '1', '-q:v', '3', stillPath])
  console.log(`${outPath}: ${fs.statSync(outPath).size} bytes, ${kept} frames${LOOP ? ` (it goes round: ${LOOP} frames dissolve)` : ''}; ${stillPath}: ${fs.statSync(stillPath).size} bytes`)
})()
