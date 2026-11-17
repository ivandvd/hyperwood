/**
 * The order in which the mark is drawn: the drop pours out along the mark.
 *
 * For every point inside the master this module answers one question: when does the liquid get there, if it
 * starts as the drop that sits in the first lobe and can only run inside the outline? The answer is a travel
 * time. 0 is the edge of the drop (points inside it are negative), 1 is the last point reached.
 *
 * The liquid runs fastest in the middle of the stream and slower along the walls, as a liquid does in a channel.
 * That is what rounds its front into the tip of a finger, and lets it swell into each lobe from the neck.
 *
 * Two steps, both on the small grid the height map uses:
 *  1. the distance from every inside point to the outline (how far from the walls it is);
 *  2. the travel time, solved outward from the drop with the fast marching method (an upwind solve of
 *     |grad T| = 1 / speed), so the fronts are smooth arcs and never cross a gap in the outline.
 */

export interface Flow {
  /** One value per pixel, rows from the top: 0 at the edge of the drop, 1 where the liquid arrives last. */
  field: Float32Array
  /** What 1 stands for: the travel time of the last point, in artwork units of distance at full speed. */
  length: number
}

interface Options {
  /** Coverage of the master on the grid (0..255), rows from the top, and the grid size. */
  alpha: ArrayLike<number>
  width: number
  height: number
  /** Grid pixels per artwork unit, and the clear space around the artwork (artwork units). */
  pxPerUnit: number
  pad: number
  /** The drop the drawing starts from (artwork units). */
  start: { centre: [number, number]; radius: number }
  /** Speed along the walls as a share of the speed mid-stream, and how far from a wall (artwork units) the
   *  liquid reaches full speed. */
  wall: number
  reach: number
}

/** A small binary heap of (value, pixel). Stale entries are skipped by whoever takes them out. */
function heap() {
  const hk: number[] = []
  const hi: number[] = []
  return {
    get size() {
      return hk.length
    },
    push(t: number, i: number) {
      let c = hk.length
      hk.push(t)
      hi.push(i)
      while (c > 0) {
        const p = (c - 1) >> 1
        if (hk[p] <= hk[c]) break
        ;[hk[p], hk[c]] = [hk[c], hk[p]]
        ;[hi[p], hi[c]] = [hi[c], hi[p]]
        c = p
      }
    },
    pop(): [number, number] {
      const t = hk[0]
      const i = hi[0]
      const lt = hk.pop() as number
      const li = hi.pop() as number
      if (hk.length) {
        hk[0] = lt
        hi[0] = li
        let p = 0
        for (;;) {
          const l = 2 * p + 1
          const r = l + 1
          let m = p
          if (l < hk.length && hk[l] < hk[m]) m = l
          if (r < hk.length && hk[r] < hk[m]) m = r
          if (m === p) break
          ;[hk[p], hk[m]] = [hk[m], hk[p]]
          ;[hi[p], hi[m]] = [hi[m], hi[p]]
          p = m
        }
      }
      return [t, i]
    },
  }
}

export function buildFlow({ alpha, width: w, height: h, pxPerUnit, pad, start, wall, reach }: Options): Flow {
  const n = w * h
  const unit = 1 / pxPerUnit
  const inside = new Uint8Array(n)
  for (let i = 0; i < n; i++) inside[i] = alpha[i] >= 128 ? 1 : 0

  // 1. how far every inside pixel is from the outline (pixels): the exact distance transform, as two sweeps
  //    of the one-dimensional lower envelope of parabolas (Felzenszwalb and Huttenlocher)
  const sq = new Float64Array(n)
  for (let i = 0; i < n; i++) sq[i] = inside[i] ? 1e20 : 0
  const m = Math.max(w, h)
  const fl = new Float64Array(m)
  const dl = new Float64Array(m)
  const vl = new Int32Array(m)
  const zl = new Float64Array(m + 1)
  const sweep = (len: number) => {
    let k = 0
    vl[0] = 0
    zl[0] = -Infinity
    zl[1] = Infinity
    for (let q = 1; q < len; q++) {
      let cut = (fl[q] + q * q - (fl[vl[k]] + vl[k] * vl[k])) / (2 * q - 2 * vl[k])
      while (cut <= zl[k]) {
        k--
        cut = (fl[q] + q * q - (fl[vl[k]] + vl[k] * vl[k])) / (2 * q - 2 * vl[k])
      }
      k++
      vl[k] = q
      zl[k] = cut
      zl[k + 1] = Infinity
    }
    k = 0
    for (let q = 0; q < len; q++) {
      while (zl[k + 1] < q) k++
      dl[q] = (q - vl[k]) * (q - vl[k]) + fl[vl[k]]
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) fl[y] = sq[y * w + x]
    sweep(h)
    for (let y = 0; y < h; y++) sq[y * w + x] = dl[y]
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) fl[x] = sq[y * w + x]
    sweep(w)
    for (let x = 0; x < w; x++) sq[y * w + x] = dl[x]
  }
  // the time it takes to cross one pixel: least mid-stream, most along the walls
  const slow = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    if (!inside[i]) continue
    const k = Math.min(1, Math.max(0, ((Math.sqrt(sq[i]) - 0.5) * unit) / reach))
    slow[i] = unit / (wall + (1 - wall) * k * k * (3 - 2 * k))
  }

  // 2. the travel time, by fast marching outward from the drop
  //    (double precision: the heap compares its keys with these values exactly)
  const T = new Float64Array(n).fill(Infinity)
  const done = new Uint8Array(n)
  const q = heap()
  const relax = (i: number) => {
    const x = i % w
    const y = (i - x) / w
    let a = Infinity
    let b = Infinity
    if (x > 0 && done[i - 1]) a = T[i - 1]
    if (x < w - 1 && done[i + 1]) a = Math.min(a, T[i + 1])
    if (y > 0 && done[i - w]) b = T[i - w]
    if (y < h - 1 && done[i + w]) b = Math.min(b, T[i + w])
    const lo = Math.min(a, b)
    if (lo === Infinity) return
    const up = Math.max(a, b)
    const s = slow[i]
    const t = up === Infinity || up - lo >= s ? lo + s : (a + b + Math.sqrt(2 * s * s - (a - b) * (a - b))) / 2
    if (t < T[i]) {
      T[i] = t
      q.push(t, i)
    }
  }
  const spread = (i: number) => {
    const x = i % w
    const y = (i - x) / w
    if (x > 0 && inside[i - 1] && !done[i - 1]) relax(i - 1)
    if (x < w - 1 && inside[i + 1] && !done[i + 1]) relax(i + 1)
    if (y > 0 && inside[i - w] && !done[i - w]) relax(i - w)
    if (y < h - 1 && inside[i + w] && !done[i + w]) relax(i + w)
  }
  // the drop itself is known exactly: the signed distance to its edge
  const [cx, cy] = start.centre
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!inside[i]) continue
      const d = Math.hypot((x + 0.5) * unit - pad - cx, (y + 0.5) * unit - pad - cy) - start.radius
      if (d <= 1.5 * unit) {
        T[i] = d
        done[i] = 1
      }
    }
  }
  for (let i = 0; i < n; i++) if (done[i]) spread(i)
  while (q.size) {
    const [t, i] = q.pop()
    if (done[i] || t > T[i]) continue
    done[i] = 1
    spread(i)
  }
  let length = 0
  for (let i = 0; i < n; i++) if (inside[i] && T[i] !== Infinity && T[i] > length) length = T[i]
  for (let i = 0; i < n; i++) if (inside[i] && T[i] === Infinity) T[i] = length

  // carry the values a few pixels past the outline, so sampling between pixels never mixes in "nothing"
  const known = new Uint8Array(n)
  for (let i = 0; i < n; i++) known[i] = inside[i]
  for (let pass = 0; pass < 8; pass++) {
    const add: number[] = []
    const val: number[] = []
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        if (known[i]) continue
        let sum = 0
        let cnt = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx
            const yy = y + dy
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
            const j = yy * w + xx
            if (known[j]) {
              sum += T[j]
              cnt++
            }
          }
        }
        if (cnt) {
          add.push(i)
          val.push(sum / cnt)
        }
      }
    }
    for (let k = 0; k < add.length; k++) {
      T[add[k]] = val[k]
      known[add[k]] = 1
    }
  }
  const field = new Float32Array(n)
  for (let i = 0; i < n; i++) field[i] = known[i] ? T[i] / length : 1
  return { field, length }
}
