/**
 * The mark the last drop becomes, drawn inside the scene so it shares the film: the same neon the drop
 * gathered, the same grade, grain and haze. It is the brand kit's morph (brand/mark.ts) rasterised to a
 * small canvas, on a camera-facing plane exactly over the droplet, with a faint pool of its own light.
 *
 * It is liquid, not a sticker: a second, blurred copy of the shape is its height (thick lobes stand
 * proud, the necks lie low), and from that height it is lit like the drop it came from: a soft key from
 * the upper left, a deeper rim, a glint, and the cursor light sliding over it. The silhouette stays the
 * master's; only the light on it moves.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { config } from '../../config'
import { mark } from '../../state/mark'
import { markPath } from '../../brand/mark'
import { store } from '../../state/store'

/** Clear space kept around the artwork on its canvas (artwork units). */
const PAD = 10
const TEX_W = 640
/** The height map is smooth by construction, so half the resolution is plenty. */
const HEIGHT_W = 320

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`

const markFrag = /* glsl */ `
uniform sampler2D uMap;
uniform sampler2D uHeight;
uniform vec2 uTexel;
uniform vec3 uColor;
uniform float uLife;
uniform float uTime;
uniform float uDepth;
uniform vec2 uSize;
uniform float uRelief;
uniform float uProfile;
uniform vec3 uKey;
uniform float uShade;
uniform float uRim;
uniform float uSpec;
uniform float uShine;
uniform vec3 uCursor;
uniform float uCursorGain;
uniform float uRipple;
varying vec2 vUv;

// height of the liquid over the plane, 0 at the silhouette: the blurred shape reads 0.5 on the edge
float heightAt( vec2 uv ) {
  float h = clamp( ( texture2D( uHeight, uv ).r - 0.5 ) * 2.0, 0.0, 1.0 );
  return pow( h, uProfile );
}

void main() {
  float a = texture2D( uMap, vUv ).a;
  if ( a < 0.003 ) discard;
  // the light inside is never quite still: a slow current along the mark, a breath more toward the aurora
  float flow = 0.5 * sin( vUv.x * 5.2 - uTime * 0.55 ) + 0.5 * sin( vUv.x * 2.1 + vUv.y * 3.0 + uTime * 0.31 );
  vec3 col = uColor * ( 1.0 + uLife * ( 0.05 * flow + 0.06 * ( vUv.y - 0.5 ) ) );

  if ( uDepth > 0.001 ) {
    // the surface normal from the height, in the plane's own frame (x right, y up, z to the camera)
    vec2 e = uTexel * 1.5;
    vec2 d = vec2(
      heightAt( vUv + vec2( e.x, 0.0 ) ) - heightAt( vUv - vec2( e.x, 0.0 ) ),
      heightAt( vUv + vec2( 0.0, e.y ) ) - heightAt( vUv - vec2( 0.0, e.y ) ) );
    vec2 slope = d * uRelief / ( 2.0 * e * uSize );
    // a liquid surface is never perfectly still
    slope += uRipple * vec2( sin( vUv.x * 11.0 + vUv.y * 4.0 + uTime * 0.7 ), cos( vUv.y * 9.0 - vUv.x * 3.0 - uTime * 0.55 ) );
    vec3 n = normalize( vec3( -slope * uDepth, 1.0 ) );
    vec3 v = vec3( 0.0, 0.0, 1.0 );
    vec3 l = normalize( uKey );

    // it is light itself, so it never goes dark: the key only models it
    float wrap = dot( n, l ) * 0.5 + 0.5;
    float lit = mix( 1.0, 1.0 - uShade + 2.0 * uShade * wrap, uDepth );
    // deeper where the liquid curves away at its rim
    float rim = pow( 1.0 - n.z, 2.5 );
    col *= lit * ( 1.0 - uRim * rim * uDepth );
    // faces turned up catch the aurora
    col += uColor * 0.08 * smoothstep( 0.0, 0.7, n.y ) * uDepth;

    float glint = pow( max( dot( n, normalize( l + v ) ), 0.0 ), uShine ) * uSpec;
    // the cursor light: a soft highlight that slides over the surface
    vec3 lc = vec3( uCursor.xy - ( vUv - 0.5 ) * uSize, 0.3 * uSize.x );
    float dc = length( lc );
    glint += pow( max( dot( n, normalize( lc / dc + v ) ), 0.0 ), uShine * 0.5 ) * uCursor.z * uCursorGain / ( 1.0 + 6.0 * dc * dc / ( uSize.x * uSize.x ) );
    col += vec3( 1.0, 1.0, 0.84 ) * glint * uDepth;
  }
  gl_FragColor = vec4( col, a );
}`

const haloFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
varying vec2 vUv;
void main() {
  float r = length( ( vUv - 0.5 ) * 2.0 );
  float g = exp( -r * r * 3.4 ) * ( 1.0 - smoothstep( 0.7, 1.0, r ) );
  gl_FragColor = vec4( uColor * g * uStrength, 1.0 );
}`

const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _to = new THREE.Vector3()

/** One box-blur pass along rows (stride 1) or columns (stride w), `r` pixels each way, edges clamped. */
function boxBlur(src: Float32Array, dst: Float32Array, w: number, h: number, r: number, vertical: boolean) {
  const lines = vertical ? w : h
  const len = vertical ? h : w
  const step = vertical ? w : 1
  const norm = 1 / (2 * r + 1)
  for (let line = 0; line < lines; line++) {
    const base = vertical ? line : line * w
    let sum = 0
    for (let k = -r; k <= r; k++) sum += src[base + Math.min(len - 1, Math.max(0, k)) * step]
    for (let i = 0; i < len; i++) {
      dst[base + i * step] = sum * norm
      sum += src[base + Math.min(len - 1, i + r + 1) * step] - src[base + Math.max(0, i - r) * step]
    }
  }
}

export function Mark() {
  const M = config.mark
  const A = M.art
  const D = M.depth
  const group = useRef<THREE.Group>(null)
  const plane = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)

  const gpu = useMemo(() => {
    const aspect = (A.height + 2 * PAD) / (A.width + 2 * PAD)
    const canvas = document.createElement('canvas')
    canvas.width = TEX_W
    canvas.height = Math.round(TEX_W * aspect)
    const texture = new THREE.CanvasTexture(canvas)
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter

    // the height: the same shape, small and blurred
    const hw = HEIGHT_W
    const hh = Math.round(HEIGHT_W * aspect)
    const small = document.createElement('canvas')
    small.width = hw
    small.height = hh
    const heightData = new Uint8Array(hw * hh)
    const height = new THREE.DataTexture(heightData, hw, hh, THREE.RedFormat, THREE.UnsignedByteType)
    height.minFilter = height.magFilter = THREE.LinearFilter
    height.wrapS = height.wrapT = THREE.ClampToEdgeWrapping
    height.needsUpdate = true

    const color = new THREE.Color(M.color).multiplyScalar(M.gain)
    const base = { vertexShader: vert, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }
    const markMat = new THREE.ShaderMaterial({
      ...base,
      fragmentShader: markFrag,
      uniforms: {
        uMap: { value: texture },
        uHeight: { value: height },
        uTexel: { value: new THREE.Vector2(1 / hw, 1 / hh) },
        uColor: { value: color },
        uLife: { value: 0 },
        uTime: { value: 0 },
        uDepth: { value: 0 },
        uSize: { value: new THREE.Vector2(1, 1) },
        uRelief: { value: 1 },
        uProfile: { value: D.profile as number },
        uKey: { value: new THREE.Vector3(...D.key) },
        uShade: { value: D.shade as number },
        uRim: { value: D.rim as number },
        uSpec: { value: D.glint as number },
        uShine: { value: D.shine as number },
        uCursor: { value: new THREE.Vector3() },
        uCursorGain: { value: D.cursor as number },
        uRipple: { value: D.ripple as number },
      },
    })
    const haloMat = new THREE.ShaderMaterial({
      ...base,
      fragmentShader: haloFrag,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: color.clone() }, uStrength: { value: 0 } },
    })
    return {
      canvas,
      ctx: canvas.getContext('2d'),
      texture,
      small,
      sctx: small.getContext('2d', { willReadFrequently: true }),
      height,
      heightData,
      a: new Float32Array(hw * hh),
      b: new Float32Array(hw * hh),
      markMat,
      haloMat,
      drawn: -1,
    }
  }, [A, D, M.color, M.gain])

  useEffect(
    () => () => {
      gpu.texture.dispose()
      gpu.height.dispose()
      gpu.markMat.dispose()
      gpu.haloMat.dispose()
    },
    [gpu],
  )

  useFrame(({ camera, size }) => {
    const g = group.current
    const p = plane.current
    const h = halo.current
    if (!g || !p || !h) return
    const show = mark.fill > 0.002 && mark.radius > 0
    g.visible = show
    if (!show) return

    // world units per artwork unit at full size: the kit's drop at its starting scale is the droplet
    const k = mark.radius / (A.dropRadius * A.dropScale)
    const scale = (A.dropScale + (1 - A.dropScale) * mark.e) * k
    // the host grows about its own centre, as in the kit, from where the drop's start puts it (artwork y runs down)
    const ox = -A.dropScale * k * (A.drop[0] - A.width / 2)
    const oy = A.dropScale * k * (A.drop[1] - A.height / 2)
    // ambient drift once at rest: a few pixels up and back, eased, as the kit allows on hero surfaces
    const cam = camera as THREE.PerspectiveCamera
    const perPx = (2 * camera.position.distanceTo(mark.pos) * Math.tan((cam.fov * Math.PI) / 360)) / size.height
    const settled = Math.min(1, mark.rest / 1.5)
    const drift = M.drift * perPx * settled * (0.5 - 0.5 * Math.cos((Math.PI * mark.rest) / M.driftSeconds))

    _right.setFromMatrixColumn(camera.matrixWorld, 0)
    _up.setFromMatrixColumn(camera.matrixWorld, 1)
    g.position.copy(mark.pos).addScaledVector(_right, ox).addScaledVector(_up, oy + drift)
    g.quaternion.copy(camera.quaternion)

    // the mark itself, once it has taken over from the liquid drop
    p.visible = mark.covers
    const pw = (A.width + 2 * PAD) * scale
    const ph = (A.height + 2 * PAD) * scale
    p.scale.set(pw, ph, 1)
    if (mark.covers && mark.e !== gpu.drawn && gpu.ctx && gpu.sctx) {
      const shape = new Path2D(markPath(mark.e))
      const c = gpu.ctx
      const s = gpu.canvas.width / (A.width + 2 * PAD)
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.clearRect(0, 0, gpu.canvas.width, gpu.canvas.height)
      c.setTransform(s, 0, 0, s, PAD * s, PAD * s)
      c.fillStyle = '#fff'
      c.fill(shape)
      gpu.texture.needsUpdate = true

      // its height: the same shape at half size, blurred (three box passes each way are close to a Gaussian)
      const hw = gpu.small.width
      const hh = gpu.small.height
      const hs = hw / (A.width + 2 * PAD)
      const sc = gpu.sctx
      sc.setTransform(1, 0, 0, 1, 0, 0)
      sc.clearRect(0, 0, hw, hh)
      sc.setTransform(hs, 0, 0, hs, PAD * hs, PAD * hs)
      sc.fillStyle = '#fff'
      sc.fill(shape)
      const px = sc.getImageData(0, 0, hw, hh).data
      const a = gpu.a
      const b = gpu.b
      for (let i = 0; i < a.length; i++) a[i] = px[i * 4 + 3]
      const r = Math.max(1, Math.round((D.blur * hs) / 2))
      for (let pass = 0; pass < 3; pass++) {
        boxBlur(a, b, hw, hh, r, false)
        boxBlur(b, a, hw, hh, r, true)
      }
      // the canvas has its first row at the top, a data texture at the bottom
      const out = gpu.heightData
      for (let y = 0; y < hh; y++) {
        const from = y * hw
        const to = (hh - 1 - y) * hw
        for (let x = 0; x < hw; x++) out[to + x] = a[from + x]
      }
      gpu.height.needsUpdate = true
      gpu.drawn = mark.e
    }
    const U = gpu.markMat.uniforms
    U.uLife.value = M.life * mark.e
    U.uTime.value = store.time
    // flat while it is still the drop it took over from, then it gains its volume as it forms
    const d = Math.min(1, mark.e / D.by)
    U.uDepth.value = d * d * (3 - 2 * d)
    ;(U.uSize.value as THREE.Vector2).set(pw, ph)
    U.uRelief.value = D.relief * A.width * scale
    // the cursor light in the plane's own frame
    _to.set(store.cursor.x, store.cursor.y, store.cursor.z).sub(g.position)
    ;(U.uCursor.value as THREE.Vector3).set(_to.dot(_right), _to.dot(_up), store.cursor.presence)

    // its pool of light: around the drop while it gathers, spreading under the mark as it forms
    const e = mark.e
    h.position.set(-ox * (1 - e), -oy * (1 - e), 0)
    const dropSize = 2 * mark.radius * M.haloDrop
    h.scale.set(dropSize + (A.width * scale * M.haloMark[0] - dropSize) * e, dropSize + (A.height * scale * M.haloMark[1] - dropSize) * e, 1)
    gpu.haloMat.uniforms.uStrength.value = M.halo * mark.fill * (0.88 + 0.12 * Math.sin(store.time * 0.8))
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={halo} material={gpu.haloMat} renderOrder={20} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={plane} material={gpu.markMat} renderOrder={21} frustumCulled={false} visible={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  )
}
