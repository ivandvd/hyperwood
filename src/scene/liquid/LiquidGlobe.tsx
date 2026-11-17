/**
 * The liquid globe.
 *  - At rest it is one drop: a perfect sphere with a slow swell, rising under the cursor.
 *  - Once the scroll begins it hands over to 77 soft pieces in independent rings, fused into one body.
 *    Their poses come from the pure choreography (scroll-driven, reversible), exactly as in the layout
 *    maths; every frame their centres, orientations and half-sizes go into a small float texture and
 *    each piece's sphere of influence is binned into screen tiles.
 *  - The liquid shader ray-marches the surface per pixel (liquidMaterial.ts).
 */
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { config } from '../../config'
import { store } from '../../state/store'
import { buildLayout } from '../../choreography/layout'
import {
  computePose, exitProgress, globalQuat, holdProgress, ringSpinSpeed, sphereCenter, type FrameInput,
} from '../../choreography/choreography'
import { WORLD_SCALE, keptFinalOffset, keptFinalRadius, phraseWorldCenter } from '../../choreography/framing'
import { mark, stepMark } from '../../state/mark'
import { Mark } from './Mark'
import { type Q4, type V3, q4, smoothstep, v3 } from '../../utils/math'
import { BITS, REACH, TILE, createBinMaterial, createLiquidMaterial } from './liquidMaterial'
import { meanOuterRadius } from './liquidField'
import { Core } from './Core'
import { alsoDrawn } from '../warm'

const _size = new THREE.Vector2()
const _clear = new THREE.Color()

export function LiquidGlobe({ onCore }: { onCore?: (mesh: THREE.Mesh | null) => void }) {
  const gl = useThree((s) => s.gl)
  const layout = useMemo(() => buildLayout(), [])
  const N = layout.keys.length
  const { material, uniforms, cards } = useMemo(() => createLiquidMaterial(), [])
  const bin = useMemo(() => createBinMaterial(), [])
  // the drop is exactly as large as the fused pieces it turns into
  const dropRadius = useMemo(() => meanOuterRadius(layout), [layout])

  const gpu = useMemo(() => {
    // rows: [centre.xyz, radius of influence (0 = gone)] [quaternion] [half.xyz, alive]
    const data = new Float32Array(N * 3 * 4)
    const texture = new THREE.DataTexture(data, N, 3, THREE.RGBAFormat, THREE.FloatType)
    texture.minFilter = texture.magFilter = THREE.NearestFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true

    // one full-screen triangle draws the whole liquid
    const screen = new THREE.BufferGeometry()
    screen.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
    screen.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7)

    // bins: one screen quad per piece, covering its sphere of influence
    const quads = new THREE.InstancedBufferGeometry()
    quads.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3))
    quads.setIndex([0, 1, 2, 0, 2, 3])
    quads.instanceCount = N
    const support = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4)
    support.setUsage(THREE.DynamicDrawUsage)
    // piece i is bit (i mod BITS) of channel floor(i / BITS): an exact power of two in a float
    const bits = new Float32Array(N * 2)
    for (let i = 0; i < N; i++) {
      bits[i * 2] = Math.floor(i / BITS)
      bits[i * 2 + 1] = Math.pow(2, i % BITS)
    }
    quads.setAttribute('aSupport', support)
    quads.setAttribute('aBit', new THREE.InstancedBufferAttribute(bits, 2))
    quads.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7)
    const binMesh = new THREE.Mesh(quads, bin.material)
    binMesh.frustumCulled = false
    const binScene = new THREE.Scene()
    binScene.add(binMesh)
    const target = new THREE.WebGLRenderTarget(4, 4, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
    })
    return { data, texture, screen, quads, support, binScene, target }
  }, [N, bin])

  // the tiles are drawn in a scene of their own, with the main camera: compiled ahead with the others (scene/warm.ts)
  useEffect(() => alsoDrawn(gpu.binScene), [gpu])

  useEffect(() => {
    // dev-only handle for inspecting the bins from the console
    if (import.meta.env.DEV) (window as unknown as { __hwBins: unknown }).__hwBins = { target: gpu.target, support: gpu.support.array, n: N }
    uniforms.uData.value = gpu.texture
    uniforms.uBins.value = gpu.target.texture
    uniforms.uCount.value = N
    uniforms.uShellR.value = dropRadius * WORLD_SCALE
    uniforms.uInnerR.value = dropRadius * WORLD_SCALE * config.studio.innerSize
    // adding exact bits needs blending on a float target; without it every pixel tests every piece
    const bins = N <= BITS * 4 && gl.extensions.has('EXT_float_blend')
    uniforms.uUseBins.value = bins ? 1 : 0
    if (!bins && material.defines.USE_BINS !== undefined) {
      delete material.defines.USE_BINS
      material.needsUpdate = true
    }
  }, [uniforms, material, gpu, gl, N, dropRadius])

  useEffect(
    () => () => {
      gpu.screen.dispose()
      gpu.quads.dispose()
      gpu.texture.dispose()
      gpu.target.dispose()
      material.dispose()
      bin.material.dispose()
    },
    [gpu, material, bin],
  )

  const sim = useMemo(
    () => ({
      ringAngle: new Float64Array(layout.rings.length),
      push: new Float32Array(N),
      // the kept droplet's response to the cursor light: smoothed rotation vector (x, y) + lift
      lean: new Float32Array(3),
      idleYaw: 0,
      frame: { p: 0, time: 0, idleYaw: 0, bob: 0, tiltX: 0, tiltZ: 0, ringAngle: [], push: [] } as FrameInput,
      pos: v3() as V3,
      quat: q4() as Q4,
      gq: q4() as Q4,
      tq: new THREE.Quaternion(),
      tq2: new THREE.Quaternion(),
      center: v3() as V3,
      ray: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      hit: new THREE.Vector3(),
      hitDir: new THREE.Vector3(0, 0, 1),
      hadHit: false,
      hitRaw: new THREE.Vector3(),
      bounds: new THREE.Sphere(),
      axis: new THREE.Vector3(),
      // the rise under the cursor: a spring, and the wider trough that follows it a moment later
      rise: 0,
      riseVel: 0,
      trough: 0,
      // the last droplet in the world (centre, radius): the flat mark is drawn over it
      keptPos: new THREE.Vector3(),
      keptRadius: 0,
    }),
    [layout, N],
  )

  useFrame(({ camera, scene }, rawDt) => {
    const dt = store.fixedStep > 0 ? store.fixedStep : Math.min(rawDt, 1 / 20)
    const S = config.sphere
    const M = config.mouse
    const Q = config.liquid
    const w = store.w
    const t = store.time
    const f = sim.frame
    const U = uniforms
    const MK = config.mark
    const aspect = (camera as THREE.PerspectiveCamera).aspect
    // the ending runs on the clock: the drop fills with neon and becomes the mark
    stepMark(dt, store.progress)
    U.uFill.value = mark.covers ? 0 : mark.fill

    // ---- time-integrated state (never affects shape, so the scroll stays reversible) ----
    sim.idleYaw += dt * S.idleRotationSpeed * (1 + 0.6 * w.decoding)
    for (let r = 0; r < layout.rings.length; r++) sim.ringAngle[r] += dt * ringSpinSpeed(layout, r, w)

    f.p = store.progress
    f.time = t
    f.idleYaw = sim.idleYaw
    f.bob = S.bobAmplitude * Math.sin(t * S.bobSpeed * 2)
    f.tiltX = 0.035 * Math.sin(t * 0.21)
    f.tiltZ = 0.028 * Math.sin(t * 0.17 + 1.3)
    f.ringAngle = sim.ringAngle
    f.push = sim.push

    // the drop tears open into the pieces as the rings part
    const shell = 1 - smoothstep(Q.handover[0], Q.handover[1], w.decoding)
    U.uShell.value = shell

    // ---- the resting drop: where it is, how it is turned, how it swells ----
    sphereCenter(sim.center, f)
    ;(U.uGlobe.value as THREE.Vector3).set(sim.center[0], sim.center[1], sim.center[2]).multiplyScalar(WORLD_SCALE)
    globalQuat(sim.gq, f)
    ;(U.uGlobeQ.value as THREE.Vector4).set(sim.gq[0], sim.gq[1], sim.gq[2], sim.gq[3])
    const swell = U.uSlosh.value as THREE.Vector3
    // the swell grows a little as the scroll begins: the drop tenses before it opens
    swell.x = Q.slosh.amplitude * WORLD_SCALE * (1 + 0.5 * w.activation) * (1 - w.decoding)
    swell.z = t * Q.slosh.speed * Math.PI * 2

    // ---- mouse: exact ray / sphere hit; the liquid rises under the cursor on a spring ----
    let hasHit = false
    if (w.mouse > 0.001 && store.pointer.active) {
      sim.ndc.set(store.pointer.x, store.pointer.y)
      sim.ray.setFromCamera(sim.ndc, camera)
      sim.bounds.center.copy(U.uGlobe.value as THREE.Vector3)
      sim.bounds.radius = dropRadius * WORLD_SCALE
      if (sim.ray.ray.intersectSphere(sim.bounds, sim.hit)) {
        sim.hitRaw.copy(sim.hit).sub(sim.bounds.center).normalize()
        // the rise glides after the cursor: hand jitter never steers it
        if (!sim.hadHit && sim.rise < 0.02) sim.hitDir.copy(sim.hitRaw)
        else sim.hitDir.lerp(sim.hitRaw, 1 - Math.exp(-dt / M.hitSmoothing)).normalize()
        hasHit = true
      }
    }
    sim.hadHit = hasHit
    store.pointerOverKey = hasHit
    const want = hasHit ? M.strength * w.mouse : 0
    // slightly underdamped going up (a gentle overshoot and settle), slower and softer letting go
    const stiff = want >= sim.rise ? M.stiffness : M.stiffness / M.releaseSlowdown
    const damp = M.damping * Math.sqrt(stiff / M.stiffness)
    sim.riseVel += (stiff * (want - sim.rise) - damp * sim.riseVel) * dt
    sim.rise += sim.riseVel * dt
    sim.trough += (sim.rise - sim.trough) * (1 - Math.exp(-dt / M.neighbourDelay))
    ;(U.uBump.value as THREE.Vector4).set(sim.hitDir.x, sim.hitDir.y, sim.hitDir.z, sim.rise * WORLD_SCALE)
    ;(U.uBump2.value as THREE.Vector2).set(M.radius * M.radius, sim.trough * M.trough * WORLD_SCALE)
    // the light that rides with the cursor, just off the risen surface
    const lift = (dropRadius + sim.rise + M.lightHeight) * WORLD_SCALE
    const g = U.uGlobe.value as THREE.Vector3
    ;(U.uHover.value as THREE.Vector4).set(
      g.x + sim.hitDir.x * lift,
      g.y + sim.hitDir.y * lift,
      g.z + sim.hitDir.z * lift,
      M.light * Math.min(1.25, Math.max(0, sim.rise / M.strength)) * shell,
    )

    // ---- the pieces: poses and shapes → the float texture (only once the drop begins to give way) ----
    if (shell < 1) {
      const data = gpu.data
      const support = gpu.support.array as Float32Array
      const cut = 1 - Q.bandCut * smoothstep(0, Q.bandCutBy, w.decoding)
      for (let id = 0; id < N; id++) {
        const key = layout.keys[id]
        computePose(layout, id, f, w, sim.pos, sim.quat)
        let wx = sim.pos[0] * WORLD_SCALE
        let wy = sim.pos[1] * WORLD_SCALE
        let wz = sim.pos[2] * WORLD_SCALE
        sim.tq.set(sim.quat[0], sim.quat[1], sim.quat[2], sim.quat[3])

        const kept = key.letter >= 0
        const exit = kept ? 0 : exitProgress(layout, key.ring, f.p)
        // a ring that has fully left the frame is dropped: nothing lingers in the final void
        // (the last droplet is dropped too once the flat drop covers it: the mark takes over from there)
        const alive = kept ? !mark.covers : exit < 0.999

        // shape: a band segment at rest, a free droplet once the piece is on its own
        let hx = key.half[0]
        let hy = key.half[1]
        let hz = key.half[2] * cut
        const free = kept ? holdProgress(layout.letters[key.letter], f.p) : smoothstep(0.03, 0.4, exit)
        if (free > 0) {
          const to = kept ? Q.kept : Q.droplet
          const size = kept ? 1 : key.vary
          const e = free * free * (3 - 2 * free)
          hx += (to[0] * size - hx) * e
          hy += (to[1] * size - hy) * e
          hz += (to[2] * size - hz) * e
          // surface tension never quite settles: the droplet keeps a slow wobble
          const wob = Q.wobble.amplitude * e * Math.sin(t * Q.wobble.speed + key.phase)
          hx *= 1 + wob
          hy *= 1 - wob * 0.5
          hz *= 1 - wob * 0.5
        }

        // the last droplet settles into the drop the mark starts from: still, round, in its place
        // (the slot is the centre of the finished mark; a drawn mark starts from its first lobe, to the left)
        const settle = kept ? smoothstep(MK.settle[0], MK.settle[1], f.p) : 0
        if (settle > 0) {
          const slot = layout.letters[key.letter].slot
          const r = keptFinalRadius(aspect) / WORLD_SCALE
          const off = keptFinalOffset(aspect)
          wx += (slot[0] * WORLD_SCALE + off[0] - wx) * settle
          wy += (slot[1] * WORLD_SCALE + off[1] - wy) * settle
          wz += (slot[2] * WORLD_SCALE - wz) * settle
          hx += (r - hx) * settle
          hy += (r - hy) * settle
          hz += (r - hz) * settle
        }

        if (kept) {
          // the kept droplet leans towards the cursor light and lifts a little
          const CL = config.cursorLight
          const dxw = store.cursor.x - wx
          const dyw = store.cursor.y - wy
          const d = Math.hypot(dxw, dyw)
          const R = CL.keyRadius * WORLD_SCALE
          const infl = store.cursor.presence * Math.exp(-(d * d) / (R * R)) * (1 - settle)
          const near = Math.min(1, d / (R * 0.25))
          const ang = ((CL.keyTiltDeg * Math.PI) / 180) * infl * near
          const kf = 1 - Math.exp(-dt * 5)
          sim.lean[0] += ((d > 1e-4 ? (-dyw / d) * ang : 0) - sim.lean[0]) * kf
          sim.lean[1] += ((d > 1e-4 ? (dxw / d) * ang : 0) - sim.lean[1]) * kf
          sim.lean[2] += (CL.keyLift * WORLD_SCALE * infl - sim.lean[2]) * kf
          const la = Math.hypot(sim.lean[0], sim.lean[1])
          if (la > 1e-5) {
            sim.axis.set(sim.lean[0] / la, sim.lean[1] / la, 0)
            sim.tq2.setFromAxisAngle(sim.axis, la)
            sim.tq.premultiply(sim.tq2)
          }
          wz += sim.lean[2]
          sim.keptPos.set(wx, wy, wz)
          sim.keptRadius = hx * WORLD_SCALE
          mark.pos.copy(sim.keptPos)
          mark.radius = sim.keptRadius
        }

        // everything the piece can shape lies inside this sphere (its longest half-size plus its reach)
        const reach = Math.max(hx, hy, hz) * WORLD_SCALE + REACH + 0.5

        const a = id * 4
        const b = (N + id) * 4
        const c = (2 * N + id) * 4
        data[a] = wx
        data[a + 1] = wy
        data[a + 2] = wz
        data[a + 3] = alive ? reach : 0
        data[b] = sim.tq.x
        data[b + 1] = sim.tq.y
        data[b + 2] = sim.tq.z
        data[b + 3] = sim.tq.w
        data[c] = hx * WORLD_SCALE
        data[c + 1] = hy * WORLD_SCALE
        data[c + 2] = hz * WORLD_SCALE
        data[c + 3] = alive ? 1 : 0

        support[a] = wx
        support[a + 1] = wy
        support[a + 2] = wz
        support[a + 3] = alive ? reach : 0
      }
      gpu.texture.needsUpdate = true
      gpu.support.needsUpdate = true

      // ---- bins: which pieces can touch each screen tile ----
      if (U.uUseBins.value > 0.5) {
        gl.getDrawingBufferSize(_size)
        const bw = Math.max(1, Math.ceil(_size.x / TILE))
        const bh = Math.max(1, Math.ceil(_size.y / TILE))
        if (gpu.target.width !== bw || gpu.target.height !== bh) gpu.target.setSize(bw, bh)
        // one and a half tiles of padding: a tile is kept if any part of it can see the piece
        bin.uniforms.uPad.value.set((3 * TILE) / _size.x, (3 * TILE) / _size.y)
        bin.uniforms.uNear.value = (camera as THREE.PerspectiveCamera).near
        const prevTarget = gl.getRenderTarget()
        const prevAuto = gl.autoClear
        gl.getClearColor(_clear)
        const prevAlpha = gl.getClearAlpha()
        gl.autoClear = false
        gl.setRenderTarget(gpu.target)
        gl.setClearColor(0x000000, 0)
        gl.clear(true, false, false)
        gl.render(gpu.binScene, camera)
        gl.setRenderTarget(prevTarget)
        gl.setClearColor(_clear, prevAlpha)
        gl.autoClear = prevAuto
      }
    }

    // ---- light and air the liquid mirrors ----
    const e = w.environment
    U.uFade.value = e
    U.uGlowStrength.value = config.atmosphere.glowStrength * (1 + 0.6 * w.glow) * (1 - e)
    const cardCol = U.uCardCol.value as THREE.Color[]
    for (let i = 0; i < cards.length; i++) cardCol[i].copy(cards[i].color).multiplyScalar(cards[i].final ? e : 1 - 0.35 * e)
    U.uAurora.value = w.final * config.aurora.strength
    const fog = scene.fog as THREE.FogExp2 | null
    if (fog) {
      ;(U.fogColor.value as THREE.Color).copy(fog.color)
      U.fogDensity.value = fog.density
      ;(U.uHorizon.value as THREE.Color).copy(fog.color)
    }
    const C = config.lighting.core
    U.uCoreIntensity.value = C.intensity * w.glow * w.glow
    // before the globe opens, the core shows through the glass
    U.uInner.value = config.studio.innerGlow * w.glow * (1 - smoothstep(Q.handover[0], Q.handover[1], w.decoding))
    ;(U.uCorePos.value as THREE.Vector3).copy(U.uGlobe.value as THREE.Vector3)
    const pc = phraseWorldCenter()
    ;(U.uCursor.value as THREE.Vector4).set(
      store.cursor.x,
      store.cursor.y,
      pc[2] + config.cursorLight.depthOffset * WORLD_SCALE,
      store.cursor.presence,
    )
  })

  return (
    <group>
      <mesh
        geometry={gpu.screen}
        material={material}
        frustumCulled={false}
        onBeforeRender={(_r, _s, camera) => {
          // the exact camera of this render: rays are cast with it and true depth is written with it
          ;(uniforms.uViewProj.value as THREE.Matrix4).multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
          ;(uniforms.uInvViewProj.value as THREE.Matrix4).multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse)
        }}
      />
      <Core onReady={onCore} />
      <Mark />
    </group>
  )
}
