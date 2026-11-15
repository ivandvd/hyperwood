/**
 * The liquid's field on the CPU: the same maths the shader marches (liquidMaterial.ts), in
 * sphere-local units. Used once at start-up to measure how large the fused pieces come out, so the
 * resting drop and the pieces it hands over to are exactly the same size, and by the shape script.
 */
import { config } from '../../config'
import type { Layout } from '../../choreography/layout'
import { type V3, v3, vrotate } from '../../utils/math'

/** A piece shapes the union fully up to FADE_FROM beyond its own surface, and not at all past REACH. */
export const FADE_FROM_LOCAL = 2.7 / config.liquid.sharpness
export const REACH_LOCAL = 4.2 / config.liquid.sharpness

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export interface FieldPiece {
  c: V3
  /** Inverse orientation (x y z w). */
  qi: [number, number, number, number]
  r: V3
}

/** The pieces at rest: every piece on the sphere, in its resting shape. */
export function restPieces(layout: Layout, decoding = 0): FieldPiece[] {
  const R = config.sphere.radius
  const by = config.liquid.bandCutBy
  const s = Math.min(1, Math.max(0, decoding / by))
  const cut = 1 - config.liquid.bandCut * s * s * (3 - 2 * s)
  return layout.keys.map((k) => ({
    c: [k.dir[0] * R, k.dir[1] * R, k.dir[2] * R],
    qi: [-k.quat[0], -k.quat[1], -k.quat[2], k.quat[3]],
    r: [k.half[0], k.half[1], k.half[2] * cut],
  }))
}

const _t = v3()
export function fieldAt(pieces: FieldPiece[], p: Readonly<V3>): number {
  const K = config.liquid.sharpness
  let acc = 0
  for (const pc of pieces) {
    vrotate(_t, [p[0] - pc.c[0], p[1] - pc.c[1], p[2] - pc.c[2]], pc.qi)
    const k0 = Math.hypot(_t[0] / pc.r[0], _t[1] / pc.r[1], _t[2] / pc.r[2])
    const k1 = Math.hypot(_t[0] / (pc.r[0] * pc.r[0]), _t[1] / (pc.r[1] * pc.r[1]), _t[2] / (pc.r[2] * pc.r[2]))
    const sd = (k0 * (k0 - 1)) / Math.max(k1, 1e-6)
    if (sd >= REACH_LOCAL) continue
    acc += Math.exp(-K * sd) * (1 - smooth(FADE_FROM_LOCAL, REACH_LOCAL, sd))
  }
  return acc > 1e-7 ? -Math.log(acc) / K : 99
}

/** Outer surface radius of the fused pieces along a direction (bisection from outside). */
export function outerRadius(pieces: FieldPiece[], dir: Readonly<V3>): number {
  let hi: number = config.sphere.radius + 9
  let lo: number = config.sphere.radius
  for (let i = 0; i < 36; i++) {
    const m = (hi + lo) / 2
    if (fieldAt(pieces, [dir[0] * m, dir[1] * m, dir[2] * m]) > 0) hi = m
    else lo = m
  }
  return (hi + lo) / 2
}

/** Mean outer radius of the fused pieces at rest, over an even spread of directions. */
export function meanOuterRadius(layout: Layout, samples = 240): number {
  const pieces = restPieces(layout)
  let sum = 0
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < samples; i++) {
    const y = 1 - (2 * (i + 0.5)) / samples
    const r = Math.sqrt(1 - y * y)
    sum += outerRadius(pieces, [Math.cos(i * golden) * r, y, Math.sin(i * golden) * r])
  }
  return sum / samples
}
