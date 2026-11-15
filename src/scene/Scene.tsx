import { Suspense, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { store } from '../state/store'
import { phaseWeights } from '../choreography/choreography'
import { config } from '../config'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { Sky } from './environment/Sky'
import { MountainTerrain } from './environment/MountainTerrain'
import { ForegroundMountains } from './environment/ForegroundMountains'
import { Atmosphere } from './environment/Atmosphere'
import { LiquidGlobe } from './liquid/LiquidGlobe'
import { PostFX } from './PostFX'
import { CursorLight } from './cursor/CursorLight'
import { SafeBoundary } from './SafeBoundary'
import { demo, demoProgress } from '../scroll/demo'

/** Runs first every frame: advances the clock and smooths scroll progress into phase weights. */
function Director() {
  useFrame((_, rawDt) => {
    // a capture run steps the clock by an exact frame, so every frame is a pure function of its number
    const dt = store.fixedStep > 0 ? store.fixedStep : Math.min(rawDt, 1 / 20)
    store.time += dt
    if (demo.tl) {
      demo.t = demo.start < 0 ? 0 : store.time - demo.start
      demo.tl.progress(demoProgress(demo.t))
    }
    // GSAP already scrubs; this extra critically-damped follow removes wheel micro-steps
    const k = 1 - Math.exp(-9 * dt)
    store.scroll += (store.target - store.scroll) * k
    if (Math.abs(store.target - store.scroll) < 1e-5) store.scroll = store.target
    // (before the reveal the preloader may hold the scene at its heaviest moment to check performance)
    store.progress = store.bench >= 0 ? store.bench : Math.min(1, store.scroll / config.phases.storyEnd)
    store.w = phaseWeights(store.progress)
  }, -100)
  return null
}

export function Scene() {
  const [sun, setSun] = useState<THREE.Mesh | null>(null)
  const onCore = useCallback((m: THREE.Mesh | null) => setSun(m), [])
  return (
    <>
      <Director />
      <CameraRig />
      <Lighting />
      <Sky />
      {/* the terrains arrive from a worker: the rest of the scene mounts and compiles meanwhile */}
      <Suspense fallback={null}>
        <MountainTerrain />
      </Suspense>
      <SafeBoundary name="ForegroundMountains">
        <Suspense fallback={null}>
          <ForegroundMountains />
        </Suspense>
      </SafeBoundary>
      <Atmosphere />
      <CursorLight />
      <LiquidGlobe onCore={onCore} />
      <PostFX sun={sun} />
    </>
  )
}
