// Where the bulb stands in a clip. The camera of these clips is locked off, so the bulb is in the same place
// in every frame: the colour stage (tint.cjs) needs that place.
// Writes <out dir>/bulb.json: its centre and the clip's size.
//
// usage: node scripts/film/bulb.cjs <raw clip> <out dir> <x> <y> <w> <h>
// x y w h: a window that surely holds the bulb and nothing as bright (no paper, no collar), as shares of the
// frame's width and height.
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const [, , src, out, fx, fy, fw, fh] = process.argv
const [W, H] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).toString().trim().split(',').map(Number)
const win = { x: Math.round(W * fx), y: Math.round(H * fy), w: Math.round(W * fw), h: Math.round(H * fh) }

const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', src, '-vf', `format=gray,crop=${win.w}:${win.h}:${win.x}:${win.y}`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 29 })
const area = win.w * win.h
const frames = raw.length / area
const xs = []
const ys = []
for (let f = 0; f < frames; f++) {
  const px = raw.subarray(f * area, (f + 1) * area)
  let max = 0
  for (let i = 0; i < area; i++) if (px[i] > max) max = px[i]
  let sx = 0, sy = 0, n = 0
  for (let y = 0; y < win.h; y++) for (let x = 0; x < win.w; x++) if (px[y * win.w + x] >= max - 12) { sx += x; sy += y; n++ }
  xs.push(win.x + sx / n)
  ys.push(win.y + sy / n)
}
const sorted = (v) => [...v].sort((a, b) => a - b)
const mid = (v) => sorted(v)[Math.floor(v.length / 2)]
const cx = mid(xs)
const cy = mid(ys)
// how far the brightest spot strays from its usual place, leaving out the odd frame where something as
// bright crosses the window
const off = sorted(xs.map((x, i) => Math.hypot(x - cx, ys[i] - cy)))
const drift = off[Math.floor(off.length * 0.9)]
console.log(`bulb at ${cx.toFixed(1)}, ${cy.toFixed(1)} of ${W} by ${H} (${(cx / W).toFixed(3)}, ${(cy / H).toFixed(3)}); in nine frames of ten it is within ${drift.toFixed(1)} px of that, over ${frames} frames`)
if (drift > 4) console.log('The bulb moves: this clip is not locked off, or the window holds something else as bright. A fixed place for its light will not do.')
fs.writeFileSync(path.join(out, 'bulb.json'), JSON.stringify({ cx, cy, W, H }))
