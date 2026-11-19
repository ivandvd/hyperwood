/**
 * Two things the shader needs to know about the Hyperwood mark to draw it as a body (shader.ts, markTex):
 *
 *   fullness  how high the body stands over each point of the mark, squared. It is the shape a film takes when
 *             it is held along the outline and blown up from inside: zero on the outline, smooth everywhere
 *             within, and its root is a round cross-section, as thick as the stroke is wide there. So the
 *             necks are thin tubes and the lobes full drops, with no crease anywhere;
 *   distance  how far each point is from the master outline (negative inside). This is what keeps the body's
 *             silhouette the exact mark, and what the glow around it is measured by.
 *
 * Both are worked out once from the master path: the distance at twice the size it is kept at (it is the
 * outline), the film at the kept size (it is smooth). The field covers the mark's box and a margin: 2.4 by 1.2
 * in units where the mark is 2 wide.
 */
import { MARK_D } from '../brand/mark'
import { PATH } from './stroke'

export interface MarkField {
  width: number
  height: number
  /** Two floats a pixel, rows from the bottom up: fullness as the height squared times 16, and distance as
   *  (d + 0.08) / 0.42 (heights and distances in units where the mark is 2 wide). (Asked for with its `flow`,
   *  the first of the two is how far along the mark a point lies instead: see `MarkFlow`.) */
  data: Float32Array
  flow?: MarkFlow
}

/** The mark as one stroke, from its tail (the round at its left end) to its head (the curl at its right end): what
 *  a light that runs along it needs to know.
 *  `path`: the stroke's middle line, at `PATH` points evenly along its length (measured inside the mark, the way a
 *  liquid would run through it), each with a radius a little over half the stroke's breadth there (x, y, radius,
 *  one after another). Rounds of those radii about a stretch of that line cover that stretch of the stroke, and
 *  the first and the last of them are its round ends: so a light that has got so far along the stroke has a round
 *  front, as broad as the stroke is there.
 *  `tail`: the middle of the round at the tail, and the radius of a round about it that covers the tail to its
 *  end. `head`: the middle of the round at the head and its radius.
 *  All in units where the mark is 2 wide and its middle is 0, 0, with y upward. */
export interface MarkFlow {
  tail: [number, number, number]
  head: [number, number, number]
  path: number[]
}
/** How much larger than half the stroke's breadth a round of the path is: by a share of it, and a little more
 *  (in the units above). */
const ROUND = { over: 1.12, more: 0.012 }
/** The two rounds as this file measures them on the mark as supplied: what the page goes by until it has measured
 *  the stroke itself (that is done some moments after the page has opened; until then there is no path). */
export const MARK_FLOW: MarkFlow = { tail: [-0.7734, -0.1234, 0.2359], head: [0.8109, 0.1172, 0.1371], path: [] }

const ART = { width: 428, height: 191 }
const INF = 1e20

/** Squared distance to the nearest zero of `f` along one line (Felzenszwalb and Huttenlocher). */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  for (let q = 1; q < n; q++) {
    let s = 0
    for (;;) {
      const p = v[k]
      s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p)
      if (s > z[k]) break
      k--
    }
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }
  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++
    const p = v[k]
    d[q] = (q - p) * (q - p) + f[p]
  }
}

/** Distance in pixels from every pixel to the nearest pixel where `seed` is set. */
function distances(seed: Uint8Array, w: number, h: number): Float32Array {
  const n = Math.max(w, h)
  const f = new Float64Array(n)
  const d = new Float64Array(n)
  const v = new Int32Array(n)
  const z = new Float64Array(n + 1)
  const grid = new Float64Array(w * h)
  for (let i = 0; i < w * h; i++) grid[i] = seed[i] ? 0 : INF
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x]
    edt1d(f, h, d, v, z)
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y]
  }
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x]
    edt1d(f, w, d, v, z)
    for (let x = 0; x < w; x++) out[y * w + x] = Math.sqrt(d[x])
  }
  return out
}

/** A light blur, three by three: it takes the pixel steps out of a field. */
function soften(src: Float32Array, w: number, h: number) {
  const tmp = new Float32Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) tmp[y * w + x] = (src[y * w + Math.max(0, x - 1)] + src[y * w + x] + src[y * w + Math.min(w - 1, x + 1)]) / 3
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) src[y * w + x] = (tmp[Math.max(0, y - 1) * w + x] + tmp[y * w + x] + tmp[Math.min(h - 1, y + 1) * w + x]) / 3
}

/**
 * The film blown up over the shape: the field that is zero outside `inside` and curved by the same amount
 * everywhere within (each cell is the mean of its four neighbours, plus a half). Across a stroke of half-width
 * r it comes to r squared less the square of the distance from the stroke's middle: a circle's height, squared.
 * Solved by relaxation, from a quarter of the size up, so a few dozen sweeps settle each size.
 */
function inflate(inside: Uint8Array, w: number, h: number): Float32Array {
  const levels: { mask: Uint8Array; w: number; h: number }[] = [{ mask: inside, w, h }]
  for (let n = 0; n < 2; n++) {
    const from = levels[0]
    const cw = from.w >> 1
    const ch = from.h >> 1
    const mask = new Uint8Array(cw * ch)
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const i = y * 2 * from.w + x * 2
        mask[y * cw + x] = from.mask[i] + from.mask[i + 1] + from.mask[i + from.w] + from.mask[i + from.w + 1] >= 2 ? 1 : 0
      }
    levels.unshift({ mask, w: cw, h: ch })
  }
  let u = new Float32Array(levels[0].w * levels[0].h)
  levels.forEach((level, n) => {
    if (n > 0) {
      // the coarser answer, spread over this size (heights go by the square of the size)
      const coarse = levels[n - 1]
      const fine = new Float32Array(level.w * level.h)
      for (let y = 0; y < level.h; y++)
        for (let x = 0; x < level.w; x++) {
          const fx = Math.min(coarse.w - 1, Math.max(0, (x - 0.5) / 2))
          const fy = Math.min(coarse.h - 1, Math.max(0, (y - 0.5) / 2))
          const x0 = Math.floor(fx)
          const y0 = Math.floor(fy)
          const x1 = Math.min(coarse.w - 1, x0 + 1)
          const y1 = Math.min(coarse.h - 1, y0 + 1)
          const tx = fx - x0
          const ty = fy - y0
          const top = u[y0 * coarse.w + x0] * (1 - tx) + u[y0 * coarse.w + x1] * tx
          const low = u[y1 * coarse.w + x0] * (1 - tx) + u[y1 * coarse.w + x1] * tx
          fine[y * level.w + x] = 4 * (top * (1 - ty) + low * ty)
        }
      u = fine
    }
    const { mask, w: lw, h: lh } = level
    const cells: number[] = []
    for (let y = 1; y < lh - 1; y++) for (let x = 1; x < lw - 1; x++) if (mask[y * lw + x]) cells.push(y * lw + x)
    for (let i = 0; i < lw * lh; i++) if (!mask[i]) u[i] = 0
    // (the smallest size is solved outright; the larger ones only have their detail to settle)
    const sweeps = n === 0 ? 110 : n === 1 ? 46 : 26
    const over = n === 0 ? 1.9 : 1.7
    for (let sweep = 0; sweep < sweeps; sweep++)
      for (let c = 0; c < cells.length; c++) {
        const i = cells[c]
        u[i] += over * (0.25 * (u[i - 1] + u[i + 1] + u[i - lw] + u[i + lw] + 2) - u[i])
      }
  })
  return u
}

/**
 * The mark as one stroke. First, how far along it each point inside it lies: the shortest way to it from the
 * tail's very end (the mark's leftmost point) that stays inside the mark, in pixels (Dijkstra's walk over a
 * point's sixteen nearest neighbours, so the measure is all but round). Then the stroke's middle line: at each
 * step of that measure, the deepest point that lies so far along. Returns that line (x, y and depth, in pixels),
 * and the rounds at the stroke's two ends.
 */
function strokeOf(within: Uint8Array, dist: Float32Array, w: number, h: number) {
  // the tail's round: the deepest point of the mark's left end. And the tail's end: the mark's leftmost point
  let tail = -1
  let deep = 0
  let seed = -1
  for (let x = 0; x < Math.floor(w * 0.3); x++)
    for (let y = 0; y < h; y++) {
      const i = y * w + x
      if (!within[i]) continue
      if (-dist[i] > deep) {
        deep = -dist[i]
        tail = i
      }
    }
  if (tail < 0) return null
  // (the leftmost column of the mark, and the middle of what of the mark lies in it)
  for (let x = 0; x < w && seed < 0; x++) {
    let first = -1
    let last = -1
    for (let y = 0; y < h; y++)
      if (within[y * w + x]) {
        if (first < 0) first = y
        last = y
      }
    if (first >= 0) seed = Math.round((first + last) / 2) * w + x
  }
  if (seed < 0 || !within[seed]) return null
  const far = new Float32Array(w * h).fill(Infinity)
  // (a heap of points by their measure: a point is put in at most once for each step that reaches it)
  let inside = 0
  for (let i = 0; i < w * h; i++) inside += within[i]
  const heapAt = new Int32Array(inside * 17 + 16)
  const heapFar = new Float32Array(inside * 17 + 16)
  let size = 0
  const push = (at: number, d: number) => {
    let i = size++
    while (i > 0) {
      const up = (i - 1) >> 1
      if (heapFar[up] <= d) break
      heapAt[i] = heapAt[up]
      heapFar[i] = heapFar[up]
      i = up
    }
    heapAt[i] = at
    heapFar[i] = d
  }
  const pop = () => {
    const top = heapAt[0]
    const at = heapAt[--size]
    const d = heapFar[size]
    let i = 0
    for (;;) {
      let low = i * 2 + 1
      if (low >= size) break
      if (low + 1 < size && heapFar[low + 1] < heapFar[low]) low++
      if (heapFar[low] >= d) break
      heapAt[i] = heapAt[low]
      heapFar[i] = heapFar[low]
      i = low
    }
    heapAt[i] = at
    heapFar[i] = d
    return top
  }
  // the steps: to the eight neighbours, and the eight a knight's move away (only over points inside)
  const steps: [number, number, number][] = []
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      const longer = Math.max(Math.abs(dx), Math.abs(dy))
      const shorter = Math.min(Math.abs(dx), Math.abs(dy))
      if (longer === 1 || (longer === 2 && shorter === 1)) steps.push([dx, dy, Math.hypot(dx, dy)])
    }
  far[seed] = 0
  push(seed, 0)
  let most = 0
  let end = seed
  while (size > 0) {
    const d = heapFar[0]
    const at = pop()
    if (d > far[at]) continue
    if (d > most) {
      most = d
      end = at
    }
    const x = at % w
    const y = (at - x) / w
    for (const [dx, dy, cost] of steps) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const to = ny * w + nx
      if (!within[to]) continue
      // (a knight's move passes two points, one step along its longer side from either end: both have to be
      // inside too)
      if (cost > 2) {
        const sx = Math.abs(dx) === 2 ? Math.sign(dx) : 0
        const sy = Math.abs(dy) === 2 ? Math.sign(dy) : 0
        if (!within[(y + sy) * w + x + sx] || !within[(ny - sy) * w + nx - sx]) continue
      }
      // (as the measure is kept, in single precision: compared at full precision, a sum that was rounded up when
      // it was kept counts as shorter than itself, and the walk never ends)
      const nd = Math.fround(d + cost)
      if (nd < far[to]) {
        far[to] = nd
        push(to, nd)
      }
    }
  }
  // the head: the deepest point of the stroke's last stretch
  let head = end
  let headDeep = 0
  for (let i = 0; i < w * h; i++)
    if (within[i] && far[i] > most * 0.86 && -dist[i] > headDeep) {
      headDeep = -dist[i]
      head = i
    }
  // The stroke's middle line: of the points that lie as far along as one another, the deepest (the middle of the
  // stroke's breadth there, and that deep is half the breadth). Taken at PATH steps of the measure, then evened out
  // a little, so a round that follows it glides.
  const path = new Float32Array(PATH * 3).fill(-1)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!within[i] || far[i] === Infinity) continue
      const k = Math.min(PATH - 1, Math.round((far[i] / most) * (PATH - 1)))
      if (-dist[i] > path[k * 3 + 2]) {
        path[k * 3] = x
        path[k * 3 + 1] = y
        path[k * 3 + 2] = -dist[i]
      }
    }
  // (a step of the measure with no point in it takes the step before: there is none in the mark as supplied)
  for (let k = 1; k < PATH; k++) if (path[k * 3 + 2] < 0) path.copyWithin(k * 3, (k - 1) * 3, k * 3)
  // (the very ends lie on the outline: there the stroke has no breadth, and the point is the end itself)
  path.set([seed % w, Math.floor(seed / w), 0], 0)
  path.set([end % w, Math.floor(end / w), 0], (PATH - 1) * 3)
  for (let pass = 0; pass < 3; pass++) {
    const was = path.slice()
    for (let k = 1; k < PATH - 1; k++)
      for (let c = 0; c < 3; c++) path[k * 3 + c] = 0.25 * was[(k - 1) * 3 + c] + 0.5 * was[k * 3 + c] + 0.25 * was[(k + 1) * 3 + c]
  }
  // (the round about the tail's middle that covers the tail to its end)
  const cover = Math.hypot((tail % w) - (seed % w), Math.floor(tail / w) - Math.floor(seed / w)) + 1.5
  return { tail, cover: Math.max(cover, deep), head, headDeep, path }
}

export function buildMarkField(withFlow = false): MarkField | null {
  const W = 768
  const H = 384
  const big = 2
  const bw = W * big
  const bh = H * big
  const canvas = document.createElement('canvas')
  canvas.width = bw
  canvas.height = bh
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx || !MARK_D) return null
  // the mark's box takes 2 of the field's 2.4 units across, in the middle
  const scale = (bw * (2 / 2.4)) / ART.width
  ctx.setTransform(scale, 0, 0, scale, (bw - ART.width * scale) / 2, (bh - ART.height * scale) / 2)
  ctx.fillStyle = '#fff'
  ctx.fill(new Path2D(MARK_D), 'evenodd')
  const alpha = ctx.getImageData(0, 0, bw, bh).data

  const inside = new Uint8Array(bw * bh)
  const outside = new Uint8Array(bw * bh)
  for (let i = 0; i < bw * bh; i++) {
    const a = alpha[i * 4 + 3]
    inside[i] = a >= 128 ? 1 : 0
    outside[i] = a >= 128 ? 0 : 1
  }
  const toInside = distances(inside, bw, bh)
  const toOutside = distances(outside, bw, bh)

  // kept at half the size, rows from the bottom up (texture order)
  const dist = new Float32Array(W * H)
  const within = new Uint8Array(W * H)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let d = 0
      let n = 0
      for (let j = 0; j < big; j++)
        for (let i = 0; i < big; i++) {
          const k = (y * big + j) * bw + x * big + i
          n += inside[k]
          // the outline runs between pixels: half a pixel off either count
          d += inside[k] ? -(toOutside[k] - 0.5) : toInside[k] - 0.5
        }
      const o = (H - 1 - y) * W + x
      // (counted in pixels of the large size: here in pixels of the kept one)
      dist[o] = d / (big * big) / big
      within[o] = n * 2 >= big * big ? 1 : 0
    }
  // (a light blur takes the pixel steps out of the outline)
  soften(dist, W, H)
  soften(dist, W, H)
  const full = inflate(within, W, H)

  const data = new Float32Array(W * H * 2)
  // pixels to field units (the field is 2.4 wide), then to the shader's packing
  const perPixel = 2.4 / W
  for (let i = 0; i < W * H; i++) {
    data[i * 2] = Math.min(1, Math.max(0, full[i] * perPixel * perPixel * 16))
    data[i * 2 + 1] = Math.min(1, Math.max(0, (dist[i] * perPixel + 0.08) / 0.42))
  }
  if (!withFlow) return { width: W, height: H, data }

  // The mark as one stroke: its middle line and its two rounds.
  const run = strokeOf(within, dist, W, H)
  if (!run) return { width: W, height: H, data }
  // a point of the field in units: the field is 2.4 by 1.2, its rows from the bottom up
  const at = (i: number, deep: number): [number, number, number] => [
    (((i % W) + 0.5) / W) * 2.4 - 1.2,
    ((Math.floor(i / W) + 0.5) / H) * 1.2 - 0.6,
    deep * perPixel,
  ]
  // (each round a little larger than the stroke is broad there, so that the rounds leave no gap along its edges:
  // the mark's own outline cuts them back to the stroke)
  const path: number[] = []
  for (let k = 0; k < PATH; k++)
    path.push(
      ((run.path[k * 3] + 0.5) / W) * 2.4 - 1.2,
      ((run.path[k * 3 + 1] + 0.5) / H) * 1.2 - 0.6,
      run.path[k * 3 + 2] * perPixel * ROUND.over + (run.path[k * 3 + 2] > 0 ? ROUND.more : 0),
    )
  return { width: W, height: H, data, flow: { tail: at(run.tail, run.cover), head: at(run.head, run.headDeep), path } }
}
