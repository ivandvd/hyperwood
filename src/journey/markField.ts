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

export interface MarkField {
  width: number
  height: number
  /** Two floats a pixel, rows from the bottom up: fullness as the height squared times 16, and distance as
   *  (d + 0.08) / 0.42 (heights and distances in units where the mark is 2 wide). */
  data: Float32Array
}

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

export function buildMarkField(): MarkField | null {
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
  return { width: W, height: H, data }
}
