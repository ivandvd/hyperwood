/**
 * The inner light. There is no visible object: at rest the sphere is empty and dark inside.
 * On scroll, light simply appears:
 *  - a PointLight (physically based) lights the inner faces and walls of the keys, so the glow
 *    leaks through the gaps as real illumination;
 *  - an additive, soft volumetric glow (never opaque, never writes depth → no "ball" can be seen);
 *    it also serves as the god-ray source;
 *  - a camera-facing halo at the centre, occluded by the front keys and visible in the gaps and
 *    around the silhouette, like light scattering in haze.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { config } from '../../config'
import { store } from '../../state/store'
import { WORLD_SCALE } from '../../choreography/framing'
import { firstDrawnLit, switchedLight } from '../warm'

const vert = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4( position, 1.0 );
  vN = normalize( normalMatrix * normal );
  vV = normalize( -mv.xyz );
  gl_Position = projectionMatrix * mv;
}`

/** Volumetric-looking glow: bright where the view ray crosses most of the "volume", fading to 0 at the rim. */
const glowFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vN;
varying vec3 vV;
void main() {
  float facing = clamp( abs( dot( normalize( vN ), normalize( vV ) ) ), 0.0, 1.0 );
  float density = pow( facing, 2.2 );
  gl_FragColor = vec4( uColor * density * uIntensity, 1.0 );
}`

const haloFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
void main() {
  float r = length( vUv - 0.5 ) * 2.0;
  float core = exp( -r * r * 9.0 );
  float wide = exp( -r * 3.2 ) * ( 1.0 - smoothstep( 0.7, 1.0, r ) );
  gl_FragColor = vec4( uColor * ( core * 1.3 + wide * 0.55 ) * uIntensity, 1.0 );
}`

const additive = (fragmentShader: string, color: THREE.Color, side: THREE.Side = THREE.FrontSide) =>
  new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader,
    uniforms: { uColor: { value: color.clone() }, uIntensity: { value: 0 } },
    side,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })

export function Core({ onReady }: { onReady?: (mesh: THREE.Mesh | null) => void }) {
  const light = useRef<THREE.PointLight>(null)
  const glow = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  const C = config.lighting.core
  const R = config.sphere.radius * WORLD_SCALE

  const base = useMemo(() => new THREE.Color(C.color), [C.color])
  // The glow is drawn on its far half only. Its near half would stand in front of a droplet that sits just
  // before the core, so the light (and the god rays it feeds) would show through that droplet.
  const glowMat = useMemo(() => additive(glowFrag, base, THREE.BackSide), [base])
  const haloMat = useMemo(() => additive(haloFrag, base), [base])

  useEffect(() => {
    onReady?.(glow.current)
    return () => {
      onReady?.(null)
      glowMat.dispose()
      haloMat.dispose()
    }
  }, [onReady, glowMat, haloMat])

  // three makes a program per set of lights that are on: this one is switched, so it is declared (scene/warm.ts)
  useEffect(() => (light.current ? switchedLight(light.current) : undefined), [])
  // ...and its glow is first drawn while it is on: declared for the same reason
  const group = useRef<THREE.Group>(null)
  useEffect(() => (group.current ? firstDrawnLit(group.current) : undefined), [])

  useFrame(({ camera }) => {
    const k = store.w.glow
    const bob = config.sphere.bobAmplitude * Math.sin(store.time * config.sphere.bobSpeed * 2) * WORLD_SCALE
    const c = config.sphere.center
    const on = k > 0.002

    if (light.current) {
      light.current.intensity = C.intensity * k * k
      light.current.position.set(c[0], c[1] + bob, c[2])
      light.current.visible = on
    }
    if (glow.current) {
      glow.current.visible = on
      glow.current.position.set(c[0], c[1] + bob, c[2])
      // the light "breathes" in as it appears: grows from a point, never pops
      const s = Math.max(1e-3, 0.35 + 0.65 * k) * (1 + 0.025 * Math.sin(store.time * 2.1) * k)
      glow.current.scale.setScalar(s)
      glowMat.uniforms.uIntensity.value = 4.2 * k * k
    }
    if (halo.current) {
      halo.current.visible = on
      halo.current.position.set(c[0], c[1] + bob, c[2])
      halo.current.quaternion.copy(camera.quaternion)
      haloMat.uniforms.uIntensity.value = 0.72 * k
    }
  })

  return (
    <group ref={group}>
      {/* off until the frame code switches it on (it is dark at rest): programs are compiled for the lights that are on */}
      <pointLight ref={light} color={C.color} intensity={0} distance={C.distance * WORLD_SCALE} decay={C.decay} visible={false} />
      <mesh ref={glow} material={glowMat} visible={false} renderOrder={3}>
        <icosahedronGeometry args={[R * 0.5, 5]} />
      </mesh>
      <mesh ref={halo} material={haloMat} visible={false} renderOrder={2} frustumCulled={false}>
        <planeGeometry args={[R * 5.2, R * 5.2]} />
      </mesh>
    </group>
  )
}
