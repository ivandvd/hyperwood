/**
 * Canvas + renderer setup.
 *  - sRGB output, ACES filmic applied in the post chain (renderer itself is `flat`: NoToneMapping);
 *  - soft PCF shadows (keys only), DPR capped once at start (never switched at runtime).
 */
import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { config } from '../config'
import { store } from '../state/store'
import { patchFogChunks } from './environment/fogChunks'
import { capture, startCapture } from '../scroll/capture'
import { Scene } from './Scene'
import { warmUp } from './warm'
import styles from '../App.module.css'

patchFogChunks()

export function Experience() {
  const [dpr] = useState<number>(() => {
    const Q = config.performance
    // large or dense screens: keep the drawing buffer inside a pixel budget, so the frame time stays in hand
    const budget = Math.sqrt(Q.maxPixels / Math.max(1, window.innerWidth * window.innerHeight))
    return Math.max(Q.minDpr, Math.min(window.devicePixelRatio || 1, Q.dpr[1], budget))
  })

  return (
    <Canvas
      className={styles.webgl}
      dpr={dpr}
      frameloop="never"
      flat
      shadows="soft"
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false, depth: true }}
      camera={{
        fov: config.camera.fov,
        near: config.camera.near,
        far: config.camera.far,
        position: config.camera.hero.position as unknown as [number, number, number],
      }}
      onCreated={(state) => {
        const { gl } = state
        store.dpr = dpr
        store.setDpr = (value) => state.setDpr(value)
        // dev-only handle for debugging from the console: window.__hyperwood.scene / .camera / .gl
        if (import.meta.env.DEV) (window as unknown as { __hyperwood: unknown }).__hyperwood = { ...state, get: state.get, store }
        // reading shader logs back makes the page wait for every program; asked for with ?debug while developing
        gl.debug.checkShaderErrors = import.meta.env.DEV && new URLSearchParams(location.search).has('debug')
        if (capture.on) {
          // ?capture=1: a script steps the frames, nothing follows the real clock
          startCapture((time) => state.advance(time))
        } else {
          // The programs of the scene and of the post chain are compiled by the graphics driver beside the
          // page, not in front of it (scene/warm.ts): the first frame is drawn once they are there, so the
          // opening above never stands still for them.
          // Whoever asks for the loop meanwhile (on screen, covered) is answered when it starts.
          let wanted: 'always' | 'never' = 'always'
          let started = false
          const start = () => {
            if (started) return
            started = true
            state.setFrameloop(wanted)
          }
          store.setFrameloop = (mode) => {
            wanted = mode
            if (started) state.setFrameloop(mode)
          }
          warmUp(gl, state.scene, state.camera).then(start, start)
          // (never left waiting: if the driver does not answer, draw anyway)
          window.setTimeout(start, 2500)
        }
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMappingExposure = config.lighting.exposure
        gl.setClearColor(new THREE.Color(config.atmosphere.voidColor), 1)
      }}
    >
      {/* No runtime quality switching: changing the pixel ratio mid-session re-creates the drawing buffer and
          the post targets, which shows up as a black frame (it used to fire right as the hero was uncovered). */}
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
