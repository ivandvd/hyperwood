/**
 * Structured layout of the liquid globe: horizontal rings of soft pieces that fuse into one body.
 *
 * Conventions (sphere-local space, origin = globe centre; world = local × sphere.worldScale):
 *  - A piece's origin is its centre; local +Y points outward, local +X runs along its ring,
 *    local +Z runs "south" along the meridian.
 *  - lon = 0 faces +Z (the camera).
 */
import { config } from '../config'
import { type Q4, type V3, mulberry32, qfromBasis, qaxisAngle, qmul, q4, v3, vcross, vnorm, vset } from '../utils/math'

export interface RingDef {
  index: number
  lat: number
  count: number
  /** Spin direction (+1/-1) and individual speed multiplier. */
  dir: number
  spinMult: number
  /** Decoding: drift offset (sphere-local) and tilt axis/angle. */
  drift: V3
  tiltAxis: V3
  tilt: number
  /** Disassembly: vertical climb per unit of radial growth (signed), and start delay. */
  exitSlope: number
  exitDelay: number
  /** Half-size of this ring's pieces along the ring (sphere-local). */
  halfAlong: number
}

export interface KeyDef {
  id: number
  ring: number
  index: number
  /** Rest direction (unit, sphere-local, before ring spin) and rest orientation. */
  dir: V3
  quat: Q4
  /** Index among the kept pieces (0..n-1) or -1 for pieces that leave. */
  letter: number
  seed: number
  phase: number
  /** 0 = stays, >0 = buds off during decoding (distance multiplier). */
  detach: number
  tumbleAxis: V3
  tumble: number
  /** Extra radial drift while leaving (0..1). */
  scatter: number
  /** Resting half-sizes (along ring, radial, along meridian), sphere-local. */
  half: V3
  /** Size of this piece once it is a free droplet, relative to the others (no two droplets alike). */
  vary: number
}

export interface LetterDef {
  key: number
  anchor: V3
  anchorQuat: Q4
  slot: V3
  slotQuat: Q4
  /** Placement start (progress). */
  start: number
  /** 0..1 order in which the piece sinks into the centre. */
  holdOrder: number
  /** Depth lane used while flying into place. */
  lane: number
  lift: V3
  swayAxis: V3
  floatPhase: V3
  /** Per-axis wobble amplitude (radians). */
  wobble: V3
}

export interface Layout {
  rings: RingDef[]
  keys: KeyDef[]
  letters: LetterDef[]
  /** Ids of the pieces that leave and of the pieces that stay. */
  sphereKeys: number[]
  phraseKeys: number[]
  /** Outer radius of the liquid shell (sphere-local), used for the cursor hit test. */
  outerRadius: number
}

/** Rest orientation of a piece whose top points along n (south = local +Z). */
export function restQuat(out: Q4, lat: number, lon: number, poleTwist = 0): Q4 {
  const Y = v3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
  let Z: V3
  if (Math.abs(Math.cos(lat)) < 1e-6) {
    Z = v3(Math.sin(poleTwist), 0, Math.cos(poleTwist))
    if (Y[1] < 0) Z = v3(Math.sin(poleTwist), 0, -Math.cos(poleTwist))
  } else {
    // north tangent: d/dlat of Y; south = -north
    Z = v3(Math.sin(lat) * Math.sin(lon), -Math.cos(lat), Math.sin(lat) * Math.cos(lon))
  }
  const X = vnorm(v3(), vcross(v3(), Y, Z))
  return qfromBasis(out, X, Y, Z)
}

/** Hover anchor inside the hollow globe = the final slot, compressed. */
const ANCHOR_COMPRESSION: [number, number] = [0.66, 0.86]
const ANCHOR_DEPTH = 1.85

const wob = (rnd: () => number) => {
  const [a, b] = config.choreography.floatRotationDeg
  return ((a + (b - a) * rnd()) * Math.PI) / 180
}

export function buildLayout(): Layout {
  const S = config.sphere
  const C = config.choreography
  const Q = config.liquid
  const rnd = mulberry32(S.seed * 9973 + 17)
  const R = S.radius
  const n = S.rings
  const keyHalf = S.keyScale
  const mid = (n - 1) / 2

  // rings above the camera's eye height climb, rings below sink (camera height in sphere-local units)
  const camY = config.camera.hero.position[1] / S.worldScale

  /* ---------------- rings ---------------- */
  const rings: RingDef[] = []
  for (let i = 0; i < n; i++) {
    const lat = -Math.PI / 2 + (i * Math.PI) / (n - 1)
    let count = 1
    if (i !== 0 && i !== n - 1) {
      // circumference measured at the piece's pole-side edge, where neighbours are closest
      const inner = Math.abs(lat) + Math.atan(keyHalf / R)
      count = Math.max(3, Math.floor((2 * Math.PI * R * Math.cos(inner)) / S.pitch))
    }
    const restY = R * Math.sin(lat) + (i - mid) * C.ringSpread
    const up = restY > camY
    const slope = (up ? 1 : -1) * (C.exitSlopeBase + C.exitSlopeGain * Math.abs(Math.sin(lat)))
    const tiltAxis = vnorm(v3(), v3(rnd() - 0.5, 0, rnd() - 0.5))
    // pieces overlap their neighbours along the ring, so each ring reads as one continuous band
    const spacing = (2 * Math.PI * R * Math.cos(lat)) / count
    rings.push({
      index: i,
      lat,
      count,
      dir: i % 2 === 0 ? 1 : -1,
      spinMult: 0.7 + rnd() * 0.6,
      drift: v3((rnd() - 0.5) * 2, 0, (rnd() - 0.5) * 2),
      tiltAxis,
      tilt: rnd() * 0.6 + 0.4,
      exitSlope: slope,
      // outer rings leave first, the ones around the equator last, so the stacking order is preserved
      exitDelay: (mid - Math.abs(i - mid)) * C.exitStagger,
      halfAlong: count === 1 ? Q.pole : Math.min(Q.maxAlong, 0.5 * spacing * Q.overlap),
    })
  }

  /* ---------------- which pieces stay (picked from the rings around the equator) ---------------- */
  const keep = config.phrase.slots.length
  const m = Math.round(mid)
  const pickRings = [m - 1, m + 1, m, m - 1, m + 1, m, m - 2, m + 2, m, m - 1]
  const picks = new Map<string, number>()
  const perRing = new Map<number, number[]>()
  for (let li = 0; li < keep; li++) {
    const ri = pickRings[li % pickRings.length]
    perRing.set(ri, [...(perRing.get(ri) ?? []), li])
  }
  perRing.forEach((lis, ri) => {
    const r = rings[ri]
    const offset = (ri * 0.29) % 1
    lis.forEach((li, q) => {
      let j = Math.floor(((q + offset) / lis.length) * r.count) % r.count
      while (picks.has(`${r.index}:${j}`)) j = (j + 1) % r.count
      picks.set(`${r.index}:${j}`, li)
    })
  })

  /* ---------------- pieces ---------------- */
  const keys: KeyDef[] = []
  for (const r of rings) {
    const phase = r.index % 2 === 0 ? 0 : Math.PI / r.count // brick pattern
    for (let j = 0; j < r.count; j++) {
      const lon = phase + (j * 2 * Math.PI) / r.count
      const isPole = r.count === 1
      const quat = restQuat(q4(), r.lat, lon, isPole ? Math.PI / 4 : 0)
      const dir = v3(Math.cos(r.lat) * Math.sin(lon), Math.sin(r.lat), Math.cos(r.lat) * Math.cos(lon))
      if (isPole) vset(dir, 0, Math.sign(r.lat), 0)
      const letter = picks.get(`${r.index}:${j}`) ?? -1
      const detach = letter < 0 && rnd() < C.detachShare ? 0.45 + rnd() * 0.55 : 0
      // at rest every piece of a ring is identical, so the fused surface is perfectly even;
      // the variety only shows once the pieces are free droplets
      const vary = 0.86 + rnd() * 0.3
      keys.push({
        id: keys.length,
        ring: r.index,
        index: j,
        dir,
        quat,
        letter,
        seed: rnd(),
        phase: rnd() * Math.PI * 2,
        detach,
        tumbleAxis: vnorm(v3(), v3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5)),
        tumble: (0.35 + rnd() * 0.65) * C.exitTumble,
        scatter: rnd(),
        half: v3(r.halfAlong, isPole ? Q.poleThickness : Q.thickness, isPole ? Q.pole : Q.meridian),
        vary,
      })
    }
  }

  /* ---------------- final placement of the kept pieces ---------------- */
  const P = config.phrase
  const slotQuat = qfromBasis(q4(), [1, 0, 0], [0, 0, 1], [0, -1, 0]) // top → camera
  const letters: LetterDef[] = []
  const letterKeys = keys.filter((k) => k.letter >= 0).sort((a, b) => a.letter - b.letter)
  letterKeys.forEach((k, li) => {
    const [lx, ly] = P.slots[li % P.slots.length]
    const parity = li % 2 ? -1 : 1
    const anchor = v3(lx * P.unit * ANCHOR_COMPRESSION[0], ly * P.unit * ANCHOR_COMPRESSION[1], parity * ANCHOR_DEPTH)
    // anchors face the camera with only a slight, individual tilt
    const tilt = qaxisAngle(q4(), vnorm(v3(), v3(rnd() - 0.5, rnd() - 0.5, 0)), 0.03 + rnd() * 0.05)
    const anchorQuat = qmul(q4(), tilt, slotQuat)
    const slot = v3(
      P.center[0] + lx * P.unit,
      P.center[1] + ly * P.unit,
      P.center[2] + parity * P.depthJitter * (0.5 + 0.5 * rnd()),
    )
    const centerOut = Math.min(1, Math.hypot(lx / 3.4, ly / 0.8) / 1.41)
    const order = 0.85 * (1 - centerOut) + 0.15 * rnd()
    letters.push({
      key: k.id,
      anchor,
      anchorQuat,
      slot,
      slotQuat: [slotQuat[0], slotQuat[1], slotQuat[2], slotQuat[3]],
      start: C.reconstructStart + order * C.reconstructStagger,
      holdOrder: keep > 1 ? li / (keep - 1) : 0.35,
      lift: v3(Math.sign(lx || 1) * (0.6 + rnd() * 1.2), Math.sign(ly || 1) * (0.6 + rnd() * 1.2), 0),
      lane: parity,
      swayAxis: vnorm(v3(), v3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5)),
      floatPhase: v3(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28),
      wobble: v3(wob(rnd), wob(rnd), wob(rnd)),
    })
  })

  return {
    rings,
    keys,
    letters,
    sphereKeys: keys.filter((k) => k.letter < 0).map((k) => k.id),
    phraseKeys: letterKeys.map((k) => k.id),
    outerRadius: R + Q.thickness,
  }
}
