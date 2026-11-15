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
      frameloop={capture.on ? 'never' : 'always'}
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
        // ?capture=1: a script steps the frames, nothing follows the real clock
        if (capture.on) startCapture((time) => state.advance(time))
        // reading shader logs back blocks the page while it starts; only worth it while developing
        gl.debug.checkShaderErrors = import.meta.env.DEV
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMappingExposure = config.lighting.exposure
        gl.setClearColor(new THREE.Color(config.atmosphere.voidColor), 1)
      }}
    >
      {/* No runtime quality switching: changing the pixel ratio mid-session re-creates the drawing buffer and
          the post targets, which shows up as a black frame (it used to fire right as the preloader left). */}
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
