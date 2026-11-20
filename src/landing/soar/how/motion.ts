/**
 * The numbers of How it works (HowMorph.tsx): one glass shape that becomes each stage of a trade in turn, as the
 * reference widget does (uberdesigner.ai's energy morph, studied frame by frame): its morph, its fades, its
 * travelling number, its liquid, bars and ring, with the reference's own timings. Everything is a pure function of
 * a time, so any moment can be drawn on its own.
 *
 * Every length is a pixel of a 1080 stage, which the page scales to fit its box.
 */

export const STAGE = 1080

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k
/** 0 → 1 as t goes from a to b, clamped */
export const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
export const easeInOutQuart = (k: number) => (k < 0.5 ? 8 * k ** 4 : 1 - (-2 * k + 2) ** 4 / 2)
export const easeOutCubic = (k: number) => 1 - (1 - k) ** 3
export const smoothstep = (t: number, a: number, b: number) => {
  const k = prog(t, a, b)
  return k * k * (3 - 2 * k)
}

/* ------------------------------------------------------------------ the shape */
/** width, height, the two upper corners' radius and the two lower ones' */
export type Geo = { w: number; h: number; rt: number; rb: number }
/** The stages, in order: a circle (the order, sealed), a wide capsule (the public inbox), a pill (the engine), a
 *  rounded square (the proof's gauge), a tall capsule (the layers it settles through). (All corners alike: an arch,
 *  its corners unlike above and below, was a kind of drawing the GPU made the first time it was shown, a frame held
 *  back on a phone.) */
export const SHAPES: Geo[] = [
  { w: 300, h: 300, rt: 150, rb: 150 },
  { w: 780, h: 400, rt: 56, rb: 56 },
  { w: 640, h: 330, rt: 165, rb: 165 },
  { w: 460, h: 460, rt: 150, rb: 150 },
  { w: 340, h: 560, rt: 150, rb: 150 },
]
export const mixGeo = (a: Geo, b: Geo, k: number): Geo => ({ w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), rt: lerp(a.rt, b.rt, k), rb: lerp(a.rb, b.rb, k) })

/** A morph takes 1.1 s, quartic in and out (the reference's). Within it, from its start: the old stage's content goes
 *  over the first 0.45 s, the new one's comes over the last half second; the number goes over 0.21–0.53 s and the
 *  new one comes over 0.57–0.89 s (around the middle), blurred by up to 6 px while it is faint. */
export const MORPH = 1.1
export const morphAt = (s: number) => easeInOutQuart(prog(s, 0, MORPH))
export const contentOut = (s: number) => 1 - easeOutCubic(prog(s, 0, 0.45))
export const contentIn = (s: number) => easeOutCubic(prog(s, MORPH - 0.5, MORPH))
export const numberOut = (s: number) => 1 - smoothstep(s, MORPH / 2 - 0.34, MORPH / 2 - 0.02)
export const numberIn = (s: number) => smoothstep(s, MORPH / 2 + 0.02, MORPH / 2 + 0.34)
export const BLUR_OUT = 6

/* ------------------------------------------------------------------ the travelling number and the captions */
/** Where the number's top-left sits in each stage, from the shape's middle: x ("centre": the scaled number is centred
 *  across), y, and its scale. */
export const NUMBER_AT: { x: number | 'centre'; y: number; scale: number }[] = [
  { x: 'centre', y: -66, scale: 1 },
  { x: -346, y: -168, scale: 0.62 },
  { x: 'centre', y: -132, scale: 0.72 },
  { x: 'centre', y: -64, scale: 1 },
  { x: 'centre', y: -236, scale: 0.56 },
]
/** Each caption's place, from the shape's middle: centred on x, or (the inbox's) its left edge at x. */
export const CAPTION_AT: { x: number; y: number; left?: boolean }[] = [
  { x: 0, y: 52 },
  { x: -344, y: -84, left: true },
  { x: 0, y: -28 },
  { x: 0, y: 56 },
  { x: 0, y: -160 },
]
/** how far a caption rises as it comes */
export const CAPTION_RISE = 8

/* ------------------------------------------------------------------ the sealed order: liquid in the circle */
/** The level rises from half the circle to 80 hundredths, over 0.35–2 s of the stage's own time, so the liquid
 *  passes over the number: under it the number is Ink. */
export const SEAL = { from: 0.5, to: 0.8, start: 0.35, end: 2.0 }
export const sealLevel = (s: number) => lerp(SEAL.from, SEAL.to, easeInOutQuart(prog(s, SEAL.start, SEAL.end)))
export const LIQUID = {
  size: 300,
  step: 6,
  amp: 7,
  breathe: 1.3,
  speed: 2.2,
  front: { offset: 0, ampScale: 1, cycles: 1.2 },
  back: { offset: -6, ampScale: 1.2, cycles: 0.9 },
}
/** the waves' surface and swell; `t` the page's own clock, so the waves never jump */
export const liquidWave = (s: number, t: number) => ({
  y0: LIQUID.size * (1 - sealLevel(s)),
  amp: LIQUID.amp * (0.6 + 0.4 * Math.sin(t * LIQUID.breathe)),
  phase: t * LIQUID.speed,
})
const TAU = Math.PI * 2
/** y of a wave at x; the offset moves the wave up (negative) and shifts its phase by as many radians */
export const waveY = (x: number, y0: number, offset: number, amp: number, cycles: number, phase: number) =>
  y0 + offset + Math.sin((x / LIQUID.size) * TAU * cycles + phase + offset) * amp

/* ------------------------------------------------------------------ the inbox: blocks, every 250 ms */
/** how full each of the last seven blocks was (a full bar is BLOCK_MAX); the last holds this request */
export const BLOCKS = [26, 34, 22, 38, 30, 18, 41]
export const BLOCK_MAX = 44
export const OURS = BLOCKS.length - 1
export const BARS = { start: 0.7, rise: 0.9, stagger: 0.09, chipIn: [1.75, 2.2] } as const
export const barGrow = (i: number, s: number) => {
  const a = BARS.start + i * BARS.stagger
  return easeInOutQuart(prog(s, a, a + BARS.rise))
}
export const chipIn = (s: number) => easeOutCubic(prog(s, ...BARS.chipIn))
/** the row of blocks, from the shape's middle (its left edge and top), and how far the request's chip floats above
 *  the last block (its right edge on the row's) */
export const ROW = { w: 692, h: 190, gap: 18, x: -346, y: -46, chipAbove: 54 }

/* ------------------------------------------------------------------ the engine: two sealed orders become one */
/** Two drops, `apart` between their middles, come together over 0.9–2.0 s of the stage's time and are one; each grows
 *  as they meet, so the one has what the two had. Then it settles, a few small swings. */
export const DROPS = { y: 58, apart: 360, r: 47, meet: [0.9, 2.0] } as const
export const dropsAt = (s: number) => {
  const m = easeInOutQuart(prog(s, ...DROPS.meet))
  const r = DROPS.r * (1 + (Math.SQRT2 - 1) * smoothstep(m, 0.5, 1))
  const after = Math.max(0, s - DROPS.meet[1])
  const swing = m >= 1 ? 0.05 * Math.exp(-3.2 * after) * Math.sin(after * 15) : 0
  return { d: DROPS.apart * (1 - m), r, swing, bob: m < 1 ? 2.5 * Math.sin(s * 2.4) * (1 - m) : 0 }
}

/* ------------------------------------------------------------------ the proof: a ring of 44 that fills */
export const RING = { segments: 44, fillIn: [0.8, 1.9] } as const
export const ringLit = (s: number) => easeInOutQuart(prog(s, ...RING.fillIn)) * RING.segments
export const RING_GEO = { size: 420, r: 168, thick: 14, start: -221, sweep: 262, fill: 0.72 }

/* ------------------------------------------------------------------ the glows follow the content */
export const innerGlow = (v: number[], level: number) => 0.55 + 0.45 * Math.max(v[0] * level, v[1], v[2] * 0.9, v[3] * 0.9, v[4] * 0.85)
export const haloOpacity = (v: number[]) => 0.35 + 0.35 * Math.max(v[0], v[1] * 0.8, v[2] * 0.9, v[3], v[4] * 0.85)
