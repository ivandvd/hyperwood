/**
 * The whole scroll transformation as a pure function:
 *   pose(piece) = f(progress, ring angles, time, mouse push)
 *
 * Everything that must be reversible depends on scroll progress only. The only time-integrated
 * quantity is each ring's spin angle, which never affects the *shape* (a ring is rotationally
 * symmetric), so scrolling back always restores the same globe.
 */
import { config } from '../config'
import type { KeyDef, Layout, LetterDef } from './layout'
import {
  type Q4, type V3,
  clamp, ease, q4, qaxisAngle, qcopy, qmul, qslerp, remap, smootherstep, smoothstep,
  v3, vadd, vaddScaled, vbezier, vcopy, vrotate, vscale, vset, vsub,
} from '../utils/math'

export interface Weights {
  activation: number
  decoding: number
  detach: number
  disassembly: number
  glow: number
  environment: number
  reconstruction: number
  final: number
  mouse: number
}

export function phaseWeights(p: number): Weights {
  const ph = config.phases
  const a = smoothstep(ph.activation[0], ph.activation[1], p)
  const d = smootherstep(ph.decoding[0], ph.decoding[1], p)
  const glowUp = 0.55 * smoothstep(ph.activation[0] + 0.01, ph.activation[1], p) + 0.45 * smoothstep(ph.decoding[0], ph.decoding[1] - 0.04, p)
  const glowDown = 1 - smoothstep(ph.disassembly[0] + 0.04, ph.disassembly[1] + 0.03, p)
  return {
    activation: a,
    decoding: d,
    detach: smoothstep(ph.decoding[0] + 0.09, ph.decoding[1] + 0.01, p),
    disassembly: remap(p, ph.disassembly[0], ph.disassembly[1]),
    glow: glowUp * glowDown,
    environment: smoothstep(ph.disassembly[0] + 0.05, ph.reconstruction[0] + 0.14, p),
    reconstruction: remap(p, ph.reconstruction[0], ph.reconstruction[1]),
    final: smoothstep(ph.reconstruction[1] - 0.04, ph.final[1] - 0.02, p),
    mouse: 1 - smoothstep(config.mouse.fadeOut[0], config.mouse.fadeOut[1], p),
  }
}

/** Ring spin speed (rad/s) on top of the global idle rotation. */
export function ringSpinSpeed(layout: Layout, ring: number, w: Weights): number {
  const C = config.choreography
  const r = layout.rings[ring]
  const base = C.activationSpin * w.activation + (C.decodingSpin - C.activationSpin) * w.decoding
  const fall = (C.decodingSpin - C.disassemblySpin) * smoothstep(0, 0.6, w.disassembly)
  return r.dir * r.spinMult * Math.max(0, base - fall)
}

export function exitProgress(layout: Layout, ring: number, p: number): number {
  const r = layout.rings[ring]
  const start = config.phases.disassembly[0] + r.exitDelay
  return remap(p, start, start + config.choreography.exitDuration)
}

/** How far a kept piece has sunk from its ring into the hollow centre (0..1). */
export function holdProgress(L: LetterDef, p: number): number {
  const C = config.choreography
  const span = C.holdWindow[1] - C.holdWindow[0]
  const h0 = C.holdWindow[0] + L.holdOrder * span * 0.75
  return smootherstep(h0, h0 + span * 0.25, p)
}

export interface FrameInput {
  p: number
  time: number
  /** Global idle yaw and bob of the whole globe. */
  idleYaw: number
  bob: number
  tiltX: number
  tiltZ: number
  /** Accumulated spin per ring. */
  ringAngle: ArrayLike<number>
  /** Mouse push per piece (units along the piece normal). */
  push: ArrayLike<number>
}

/* scratch */
const _yaw = q4()
const _tilt = q4()
const _g = q4()
const _tmpQ = q4()
const _tmpQ2 = q4()
const _lp = v3()
const _center = v3()
const _p0 = v3()
const _q0 = q4()
const _anchor = v3()
const _slot = v3()
const _slotQ = q4()
const _anchorQ = q4()
const _c1 = v3()
const _c2 = v3()
const AXIS_Y: V3 = [0, 1, 0]
const AXIS_X: V3 = [1, 0, 0]
const AXIS_Z: V3 = [0, 0, 1]

/** Global globe transform (idle yaw + subtle wobble). */
export function globalQuat(out: Q4, f: FrameInput) {
  qaxisAngle(_yaw, AXIS_Y, f.idleYaw)
  qaxisAngle(_tilt, AXIS_X, f.tiltX)
  qmul(out, _yaw, _tilt)
  qaxisAngle(_tilt, AXIS_Z, f.tiltZ)
  return qmul(out, out, _tilt)
}

/** Globe centre in sphere-local units (world centre / worldScale), including the idle bob. */
export function sphereCenter(out: V3, f: FrameInput) {
  const c = config.sphere.center
  const k = 1 / config.sphere.worldScale
  return vset(out, c[0] * k, c[1] * k + f.bob, c[2] * k)
}

/**
 * Slow swell of the resting liquid: three travelling waves over the rest direction.
 * A pure function of time, and it fades out as the rings come apart.
 */
function slosh(k: KeyDef, time: number): number {
  // the same three waves as the resting drop in the shader (liquidMaterial.ts, dropRadius)
  const S = config.liquid.slosh
  const a = (k.dir[0] * 1.7 + k.dir[1] * 1.1 + k.dir[2] * 0.8) * S.frequency
  const b = (k.dir[0] * -0.9 + k.dir[1] * 1.6 + k.dir[2] * 1.3) * S.frequency
  const c = (k.dir[0] * 0.4 + k.dir[1] * -1.2 + k.dir[2] * 1.5) * S.frequency
  const t = time * S.speed * Math.PI * 2
  return S.amplitude * (0.5 * Math.sin(2 * a + t) + 0.3 * Math.sin(2.7 * b - 0.71 * t + 1.7) + 0.2 * Math.sin(3.4 * c + 1.3 * t + 4.1))
}

/**
 * Pose of a piece while it belongs to the globe / its ring (phases 1–3).
 * Writes world position (piece centre) and orientation.
 */
export function ringPose(layout: Layout, k: KeyDef, f: FrameInput, w: Weights, outPos: V3, outQ: Q4) {
  const S = config.sphere
  const C = config.choreography
  const r = layout.rings[k.ring]
  const R = S.radius

  // radial distance: base radius + liquid motion + mouse + controlled detachment
  const calm = 1 - w.disassembly
  const micro = S.microAmplitude * Math.sin(f.time * 0.9 + k.phase) * calm
  const rho = R + micro + slosh(k, f.time) * (1 - w.decoding) + (f.push[k.id] || 0) + k.detach * C.detachDistance * w.detach

  // ring spin
  qaxisAngle(_tmpQ, AXIS_Y, f.ringAngle[k.ring])
  vscale(_lp, k.dir, rho)
  vrotate(_lp, _lp, _tmpQ)
  qmul(outQ, _tmpQ, k.quat)

  // relative to ring centre so the ring can tilt/expand about itself
  const cy = R * Math.sin(r.lat)
  _lp[1] -= cy

  // decoding: ring tilt
  // small polar rings barely move off-axis; wide rings carry the mechanical drift
  const cl = Math.cos(r.lat)
  const offAxis = cl * cl
  qaxisAngle(_tmpQ, r.tiltAxis, r.tilt * C.ringTilt * w.decoding * offAxis)
  vrotate(_lp, _lp, _tmpQ)
  qmul(outQ, _tmpQ, outQ)

  // disassembly: the ring keeps its circle and spin, grows in radius and climbs/sinks along a cone
  const s = exitProgress(layout, k.ring, f.p)
  if (s > 0) {
    const dr = C.exitGrowth * ease.exit(s) * (1 + 0.04 * k.scatter)
    const hl = Math.hypot(_lp[0], _lp[2])
    if (hl > 1e-4) {
      _lp[0] += (_lp[0] / hl) * dr
      _lp[2] += (_lp[2] / hl) * dr
    }
    _lp[1] += r.exitSlope * C.exitGrowth * ease.exit(s)
    // a gentle tumble once the gaps have opened up
    qaxisAngle(_tmpQ, k.tumbleAxis, k.tumble * ease.inCubic(s))
    qmul(outQ, outQ, _tmpQ)
  }

  // back to sphere space: ring centre + decoding spread + drift
  const mid = (layout.rings.length - 1) / 2
  _lp[1] += cy + (k.ring - mid) * C.ringSpread * w.decoding
  vaddScaled(_lp, _lp, r.drift, C.ringDrift * w.decoding * offAxis)

  // global transform
  globalQuat(_g, f)
  vrotate(_lp, _lp, _g)
  qmul(outQ, _g, outQ)
  sphereCenter(_center, f)
  vadd(outPos, _center, _lp)
}

/** Final slot pose including the weightless float. */
function slotPose(L: LetterDef, f: FrameInput, w: Weights, outPos: V3, outQ: Q4, slot: Readonly<V3> = L.slot) {
  const C = config.choreography
  const fl = w.final
  const t = f.time
  vset(
    outPos,
    slot[0],
    slot[1] + Math.sin(t * 0.55 + L.floatPhase[0]) * C.floatAmplitude * fl,
    slot[2] + Math.sin(t * 0.41 + L.floatPhase[1]) * C.floatDepth * fl,
  )
  // slow, independent wobble on all three axes (two detuned sines per axis, so it never looks looped)
  const wob = (i: number, f1: number, f2: number) =>
    (Math.sin(t * f1 + L.floatPhase[i]) * 0.7 + Math.sin(t * f2 + L.floatPhase[(i + 1) % 3] * 1.7) * 0.3) * L.wobble[i] * fl
  qaxisAngle(_tmpQ2, AXIS_X, wob(0, 0.47, 0.83))
  qmul(outQ, _tmpQ2, L.slotQuat)
  qaxisAngle(_tmpQ2, AXIS_Y, wob(1, 0.36, 0.71))
  qmul(outQ, _tmpQ2, outQ)
  qaxisAngle(_tmpQ2, AXIS_Z, wob(2, 0.29, 0.61))
  qmul(outQ, _tmpQ2, outQ)
}

export function computePose(layout: Layout, keyId: number, f: FrameInput, w: Weights, outPos: V3, outQ: Q4) {
  const k = layout.keys[keyId]
  ringPose(layout, k, f, w, outPos, outQ)
  if (k.letter < 0) return

  const C = config.choreography
  const L = layout.letters[k.letter]
  // a kept piece sinks from its ring into the hollow centre (a straight path through the empty
  // interior, so it never crosses the shell or the leaving rings)
  const hold = holdProgress(L, f.p)
  if (hold <= 0) return

  const t = f.time
  vset(
    _anchor,
    L.anchor[0] + Math.sin(t * 0.31 + L.floatPhase[0]) * 0.25,
    L.anchor[1] + Math.sin(t * 0.43 + L.floatPhase[1]) * 0.22 + f.bob,
    L.anchor[2] + Math.sin(t * 0.27 + L.floatPhase[2]) * 0.3,
  )
  qaxisAngle(_tmpQ2, L.swayAxis, Math.sin(t * 0.5 + L.floatPhase[1]) * 0.05)
  qmul(_anchorQ, _tmpQ2, L.anchorQuat)

  vcopy(_p0, outPos)
  qcopy(_q0, outQ)
  // enter the hollow radially, then settle onto the anchor along the depth axis, from the side
  // the piece came from
  sphereCenter(_center, f)
  vsub(_c1, _p0, _center)
  vscale(_c1, _c1, 0.5)
  vadd(_c1, _c1, _center)
  const side = _p0[2] - _center[2] >= 0 ? 1 : -1
  vset(_c2, _anchor[0], _anchor[1], _anchor[2] + side * 7.5)
  vbezier(outPos, _p0, _c1, _c2, _anchor, ease.inOutCubic(hold))
  qslerp(outQ, _q0, _anchorQ, ease.inOutCubic(hold))

  const rec = remap(f.p, L.start, L.start + C.reconstructDuration)
  if (rec <= 0) return

  // a soft forward arc into the final slot, with depth/orientation offsets en route
  slotPose(L, f, w, _slot, _slotQ)
  const e = ease.inOutCubic(rec)
  const lane = L.lane * 4.2
  vset(_c1, _anchor[0] + L.lift[0], _anchor[1] + L.lift[1], _anchor[2] + 6 + lane)
  vset(_c2, _slot[0] - L.lift[0] * 0.5, _slot[1] + L.lift[1] * 0.2, _slot[2] + 5 + lane)
  vbezier(outPos, _anchor, _c1, _c2, _slot, e)
  qslerp(_tmpQ, _anchorQ, _slotQ, ease.outCubic(clamp(rec * 1.08)))
  qaxisAngle(_tmpQ2, L.swayAxis, Math.sin(Math.PI * rec) * (1 - rec) * 0.32)
  qmul(outQ, _tmpQ2, _tmpQ)
}
