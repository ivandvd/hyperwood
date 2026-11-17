/**
 * The app's short films: for each, how long it runs, where its camera is at which moment, and what it does
 * to its set (sets.tsx) meanwhile. Reel.tsx plays them.
 *
 * They are made the same way. The picture begins out of focus and comes sharp on the first thing; the camera
 * moves in on it while something changes there; then it swings over to what came of it, soft while it
 * swings; it rests there, and goes soft again for the loop. Distances are in the set's own pixels (a set is
 * 900 by 680), times in seconds.
 */
import { closed } from '../../app/scene'
import { money } from '../../app/markets'
import type { Film, Key, Parts } from './Reel'

const clamp = (v: number) => Math.max(0, Math.min(1, v))
/** 0 before `a`, 1 after `b`, even between. */
const run = (a: number, b: number, t: number) => clamp((t - a) / (b - a))
/** Quick at first, then settling: how a figure counts up to its value. */
const settle = (t: number) => 1 - Math.pow(1 - t, 3)
const smooth = (t: number) => t * t * (3 - 2 * t)

/** The pointer's way: [when, x, y] in the set, eased from stop to stop. */
function pointer(parts: Parts, way: [number, number, number][], t: number) {
  let at = way[0]
  let to = way[0]
  for (let i = 1; i < way.length; i++) {
    if (t < way[i][0]) {
      at = way[i - 1]
      to = way[i]
      break
    }
    at = to = way[i]
  }
  const share = to === at ? 0 : smooth(run(at[0], to[0], t))
  parts.style('cursor', '--x', `${(at[1] + (to[1] - at[1]) * share).toFixed(1)}px`)
  parts.style('cursor', '--y', `${(at[2] + (to[2] - at[2]) * share).toFixed(1)}px`)
}

/** The same camera for a while: a key that repeats the last one's place at a later moment. */
const still = (t: number, key: Key): Key => ({ ...key, t })

/* ------------------------------------------------------------ the order: set, signed, sealed */
const orderIn: Key = { t: 2.25, x: 640, y: 300, s: 1, rx: 9.2, ry: -19.2, rz: 2.6, fx: 52, fy: 50, lit: 0.6 }
const orderOut: Key = { t: 2.86, x: 506, y: 548, s: 0.8, rx: 12.6, ry: 19.2, rz: -4.2, fx: 50, fy: 52, lit: 0.2 }
export const orderFilm: Film = {
  length: 4.7,
  frame: [440, 396],
  still: 4,
  camera: [
    { t: 0, x: 580, y: 236, s: 0.78, rx: 15, ry: -32, rz: 4.3, fx: 56, fy: 46, soft: 11, lit: 0 },
    { t: 0.55, soft: 0 },
    orderIn,
    still(2.5, orderIn),
    { t: 2.5, soft: 0 },
    { t: 2.66, soft: 13 },
    orderOut,
    { t: 2.9, soft: 0 },
    { t: 4.4, x: 528, y: 544, s: 0.87, rx: 10.4, ry: 12.8, rz: -3.1, soft: 0 },
    { t: 4.7, soft: 11 },
  ],
  play(t, parts) {
    // the size is set: it counts to ten units, the knob going with it
    const size = 10 * settle(run(0.5, 1.75, t))
    parts.text('size', size.toFixed(2))
    parts.style('slider', '--at', `${(size * 5).toFixed(1)}%`)
    // short for a moment, then long: either way
    const short = t >= 1.84 && t < 2.1
    parts.flag('long', 'on', !short)
    parts.flag('short', 'on', short)
    parts.flag('sign', 'down', t >= 2.32 && t < 2.52)
    parts.flag('toast', 'on', t >= 2.58 && t < 4.62)
    parts.flag('accepted', 'on', t >= 3.15)
    parts.flag('matched', 'on', t >= 3.5)
    parts.flag('proven', 'on', t >= 3.85)
    pointer(
      parts,
      [
        [0, 470, 330],
        [0.5, 470, 300],
        [1.75, 640, 300],
        [1.84, 726, 362],
        [2.1, 552, 362],
        [2.32, 640, 430],
        [4.7, 640, 430],
      ],
      t,
    )
    const down = (t >= 1.84 && t < 1.94) || (t >= 2.1 && t < 2.2) || (t >= 2.32 && t < 2.52)
    parts.style('cursor', '--press', down ? '0.84' : '1')
  },
}

/* ------------------------------------------------------------ the positions, sealed; what the network has */
const hex = '0123456789abcdef'
/** A string of hexadecimal figures that changes with `n` (the same for the same `n`). */
const noise = (n: number, length: number) => {
  let out = ''
  let seed = (n * 2654435761) >>> 0
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822519) + i) >>> 0
    out += hex[seed & 15]
  }
  return out
}
const sealedIn: Key = { t: 2, x: 520, y: 206, s: 0.94, rx: 10.4, ry: 17.9, rz: -2.5, fx: 48, fy: 48, lit: 0.5 }
const sealedOut: Key = { t: 2.62, x: 616, y: 516, s: 0.94, rx: 12.6, ry: -21.8, rz: 4.3, fx: 50, fy: 50, lit: 0.2 }
export const sealedFilm: Film = {
  length: 4.5,
  frame: [440, 396],
  still: 1.95,
  camera: [
    { t: 0, x: 222, y: 194, s: 0.82, rx: 13.8, ry: 28.2, rz: -4.2, fx: 46, fy: 48, soft: 11, lit: 0 },
    { t: 0.5, soft: 0 },
    sealedIn,
    still(2.24, sealedIn),
    { t: 2.24, soft: 0 },
    { t: 2.4, soft: 13 },
    sealedOut,
    { t: 2.66, soft: 0 },
    { t: 4.2, x: 626, y: 514, s: 1.02, rx: 10.4, ry: -14.1, rz: 3.1, soft: 0 },
    { t: 4.5, soft: 11 },
  ],
  play(t, parts) {
    // the values turn to bars, column after column, as the camera passes along the rows
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 5; c++) parts.flag(`cell-${r * 5 + c}`, 'sealed', t >= 0.6 + c * 0.25 + r * 0.07 && t < 4.42)
    // what the network gets: two commitments settling, and a proof
    const mixing = t >= 2.5 && t < 3.15
    const step = Math.floor(t * 22)
    parts.text('commitment', mixing ? `0x${noise(step, 4)}…${noise(step + 7, 4)}` : '0x7c1e…a94f')
    parts.text('root', mixing && t < 3.02 ? `0x${noise(step + 3, 4)}…${noise(step + 11, 4)}` : '0x8f2c…41ab')
    parts.flag('proof', 'on', t >= 3.4 && t < 4.42)
  },
}

/* ------------------------------------------------------------ the payout: what it made, where it goes */
const margin = closed.equity - closed.pnl
const units = closed.equity / closed.mark
const payoutIn: Key = { t: 1.9, x: 486, y: 214, s: 0.94, rx: 9.2, ry: -19.2, rz: 2, fx: 54, fy: 52, lit: 0.55 }
const payoutOut: Key = { t: 2.52, x: 486, y: 462, s: 0.66, rx: 13.8, ry: 20.5, rz: -4.2, fx: 50, fy: 52, lit: 0.15 }
export const payoutFilm: Film = {
  length: 4.7,
  frame: [440, 396],
  still: 3.8,
  camera: [
    { t: 0, x: 440, y: 190, s: 0.74, rx: 13.8, ry: -28.2, rz: 3.4, fx: 56, fy: 50, soft: 11, lit: 0 },
    { t: 0.5, soft: 0 },
    payoutIn,
    still(2.14, payoutIn),
    { t: 2.14, soft: 0 },
    { t: 2.3, soft: 13 },
    payoutOut,
    { t: 2.56, soft: 0 },
    { t: 4.4, x: 516, y: 466, s: 0.7, rx: 10.4, ry: 12.8, rz: -3.1, soft: 0 },
    { t: 4.7, soft: 11 },
  ],
  play(t, parts) {
    const made = settle(run(0.55, 1.65, t))
    parts.text('pnl', `+$${money(closed.pnl * made)}`)
    parts.text('equity', `$${money(margin + closed.pnl * made)}`)
    parts.flag('pnl', 'hot', made > 0 && made < 1)
    parts.flag('equity', 'hot', made > 0 && made < 1)
    // kept as collateral at first; then the other is chosen, and its units count up
    const converted = t >= 3.02
    parts.flag('keep', 'on', !converted)
    parts.flag('convert', 'on', converted)
    parts.text('units', (units * settle(run(3.02, 3.6, t))).toFixed(2))
    parts.flag('confirm', 'down', t >= 4 && t < 4.2)
    pointer(
      parts,
      [
        [0, 330, 520],
        [2.5, 352, 448],
        [3, 676, 448],
        [3.5, 676, 448],
        [3.98, 512, 520],
        [4.7, 512, 520],
      ],
      t,
    )
    parts.style('cursor', '--press', (t >= 3 && t < 3.1) || (t >= 4 && t < 4.2) ? '0.84' : '1')
  },
}

/* ------------------------------------------------------------ the phones: opening a trade, closing it */
const phoneIn: Key = { t: 2.8, x: 292, y: 430, s: 1, rx: 11, ry: -16, rz: 3, fx: 46, fy: 52, lit: 0.5 }
const phoneOut: Key = { t: 3.45, x: 700, y: 330, s: 0.92, rx: 13, ry: 18, rz: -3.5, fx: 54, fy: 50, lit: 0.2 }
export const phonesFilm: Film = {
  length: 6.2,
  frame: [900, 506],
  still: 2.2,
  camera: [
    { t: 0, x: 250, y: 290, s: 0.84, rx: 16, ry: -24, rz: 4, fx: 44, fy: 50, soft: 10, lit: 0 },
    { t: 0.6, soft: 0 },
    phoneIn,
    still(3.02, phoneIn),
    { t: 3.02, soft: 0 },
    { t: 3.2, soft: 13 },
    phoneOut,
    { t: 3.5, soft: 0 },
    { t: 5.9, x: 672, y: 452, s: 1.02, rx: 10, ry: 12, rz: -2.5, soft: 0 },
    { t: 6.2, soft: 10 },
  ],
  play() {},
}
