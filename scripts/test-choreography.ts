/**
 * Node test for the pure choreography (run: npm run test:choreography).
 *  - the layout: 77 pieces in 9 rings, one of them kept;
 *  - the globe is restored after scrolling forward and back;
 *  - the kept piece lands in its slot and every other piece has left the final frame;
 *  - no leaving ring comes close to the hero camera.
 * (The pieces overlap on purpose: they are fused into one liquid body, so there is no collision test.)
 */
import { buildLayout } from '../src/choreography/layout'
import { computePose, exitProgress, phaseWeights, ringSpinSpeed, type FrameInput } from '../src/choreography/choreography'
import { config } from '../src/config'
import { finalCameraDistance, phraseWorldCenter } from '../src/choreography/framing'
import { type V3, v3, q4, vlen, vsub, vrotate } from '../src/utils/math'

const L = buildLayout()
const N = L.keys.length
console.log(`pieces ${N} (leaving ${L.sphereKeys.length}, kept ${L.phraseKeys.length})`)
console.log('per ring', L.rings.map((r) => r.count).join(' '))

const ringAngle = new Float64Array(L.rings.length)
const push = new Float32Array(N)
const pos = Array.from({ length: N }, () => v3())
const quat = Array.from({ length: N }, () => q4())
function frame(p: number, time: number): FrameInput {
  return { p, time, idleYaw: time * config.sphere.idleRotationSpeed, bob: 0, tiltX: 0, tiltZ: 0, ringAngle, push }
}
function poseAll(f: FrameInput) {
  const w = phaseWeights(f.p)
  for (let i = 0; i < N; i++) computePose(L, i, f, w, pos[i], quat[i])
}

// a 12-second scroll forward and back at 60 fps
const dt = 1 / 60
let t = 0
const steps = 720
for (let s = 0; s <= steps * 2; s++) {
  const p = s <= steps ? s / steps : 2 - s / steps
  const w = phaseWeights(p)
  for (let r = 0; r < L.rings.length; r++) ringAngle[r] += dt * ringSpinSpeed(L, r, w)
  t += dt
}

// restoration: at p = 0 every piece sits on the globe again, facing outward
poseAll(frame(0, t))
const tolerance = config.sphere.microAmplitude + config.liquid.slosh.amplitude
let maxR = 0
let maxN = 0
for (let i = 0; i < N; i++) {
  const r = vlen(pos[i])
  maxR = Math.max(maxR, Math.abs(r - config.sphere.radius))
  const up = vrotate(v3(), [0, 1, 0], quat[i])
  maxN = Math.max(maxN, 1 - (up[0] * pos[i][0] + up[1] * pos[i][1] + up[2] * pos[i][2]) / r)
}
console.log(`restore: max radial offset ${maxR.toFixed(3)} (liquid motion allows ${tolerance.toFixed(3)}), max normal error ${maxN.toExponential(2)}`)

// final: the kept piece is in its slot, everything else is gone
poseAll(frame(1, t))
let maxSlot = 0
for (const lt of L.letters) maxSlot = Math.max(maxSlot, vlen(vsub(v3(), pos[lt.key], lt.slot)))
console.log(`final: kept piece is ${maxSlot.toFixed(3)} from its slot (incl. float)`)
const stillHere = L.sphereKeys.filter((id) => exitProgress(L, L.keys[id].ring, 1) < 0.999).length
const WS = config.sphere.worldScale
const pc = phraseWorldCenter()
const cam = [pc[0], pc[1], pc[2] + finalCameraDistance(1.6)]
let visible = 0
for (const id of L.sphereKeys) {
  const d: V3 = [pos[id][0] * WS - cam[0], pos[id][1] * WS - cam[1], pos[id][2] * WS - cam[2]]
  const vHalf = (config.camera.final.fov * Math.PI) / 360
  const hHalf = Math.atan(Math.tan(vHalf) * 1.6)
  if (d[2] < 0 && Math.abs(Math.atan2(d[1], -d[2])) < vHalf + 0.03 && Math.abs(Math.atan2(d[0], -d[2])) < hHalf + 0.03) visible++
}
console.log(`final: pieces still in play ${stillHere}, pieces inside the final frustum ${visible}`)
console.log(`final camera distance @16:10 ${finalCameraDistance(1.6).toFixed(1)}`)

// sweep: does any leaving ring come close to the hero camera?
const camH = config.camera.hero.position
let minD = Infinity
for (let s = 0; s <= 400; s++) {
  poseAll(frame(0.4 + (0.4 * s) / 400, t))
  for (const id of L.sphereKeys) {
    minD = Math.min(minD, Math.hypot(pos[id][0] * WS - camH[0], pos[id][1] * WS - camH[1], pos[id][2] * WS - camH[2]))
  }
}
console.log(`closest leaving piece to the hero camera during the break-up: ${minD.toFixed(1)} world units`)
