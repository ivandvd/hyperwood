/**
 * The mark the last drop becomes, drawn inside the scene so it shares the film: the same neon the drop
 * gathered, the same grade, grain and haze. It sits on a camera-facing plane exactly over the droplet, with a
 * faint pool of its own light.
 *
 * Two ways for the drop to become the mark (brand/reveal):
 *  - draw: the drop is the mark's first lobe. The liquid pours out of it and runs along the mark, up the first
 *    wave, down, over the second and into the head, so the drop draws the mark. The silhouette is the master
 *    from the first frame; a travel-time field (brand/flow) decides how much of it is there yet.
 *  - morph: the brand kit's morph (brand/mark), where the whole outline changes at once.
 *
 * It is liquid, not a sticker: a second, blurred copy of the shape is its height (thick lobes stand
 * proud, the necks lie low), and from that height it is lit like the drop it came from: a soft key from
 * the upper left, a deeper rim, a glint, and the cursor light sliding over it. While it is being drawn the
 * height falls to nothing at the front, on a round nose, so the front is lit like the tip of a stream.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { config } from '../../config'
import { mark } from '../../state/mark'
import { markPath } from '../../brand/mark'
import { markReveal, markStart } from '../../brand/reveal'
import { buildFlow } from '../../brand/flow'
import { store } from '../../state/store'

/** Clear space kept around the artwork on its canvas (artwork units). */
const PAD = 10
const TEX_W = 640
/** The height map and the flow field are smooth by construction, so half the resolution is plenty. */
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
uniform sampler2D uFlow;
uniform float uDraw;
uniform float uFront;
uniform float uNose;
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
  float h = pow( clamp( ( texture2D( uHeight, uv ).r - 0.5 ) * 2.0, 0.0, 1.0 ), uProfile );
  // while the mark is being drawn the liquid stands at full height behind the front and falls to nothing
  // at the front itself, on a round nose
  if ( uDraw > 0.5 ) {
    float x = clamp( ( uFront - texture2D( uFlow, uv ).r ) / uNose, 0.0, 1.0 );
    h *= sqrt( x * ( 2.0 - x ) );
  }
  return h;
}

void main() {
  float a = texture2D( uMap, vUv ).a;
  if ( uDraw > 0.5 ) {
    // only what the liquid has reached is there yet
    float g = texture2D( uFlow, vUv ).r;
    float w = max( fwidth( g ) * 0.75, 1e-5 );
    a *= 1.0 - smoothstep( uFront - w, uFront + w, g );
  }
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
  const draws = markReveal === 'draw'
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

    const ctx = canvas.getContext('2d')
    const sctx = small.getContext('2d', { willReadFrequently: true })
    const raw = new Float32Array(hw * hh)
    const a = new Float32Array(hw * hh)
    const b = new Float32Array(hw * hh)

    /** Rasterises the path at morph position `e`: the crisp shape, and its blurred copy as the height. */
    const paint = (e: number) => {
      if (!ctx || !sctx) return
      const shape = new Path2D(markPath(e))
      const s = canvas.width / (A.width + 2 * PAD)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(s, 0, 0, s, PAD * s, PAD * s)
      ctx.fillStyle = '#fff'
      ctx.fill(shape)
      texture.needsUpdate = true

      // its height: the same shape at half size, blurred (three box passes each way are close to a Gaussian)
      const hs = hw / (A.width + 2 * PAD)
      sctx.setTransform(1, 0, 0, 1, 0, 0)
      sctx.clearRect(0, 0, hw, hh)
      sctx.setTransform(hs, 0, 0, hs, PAD * hs, PAD * hs)
      sctx.fillStyle = '#fff'
      sctx.fill(shape)
      const px = sctx.getImageData(0, 0, hw, hh).data
      for (let i = 0; i < a.length; i++) raw[i] = a[i] = px[i * 4 + 3]
      const r = Math.max(1, Math.round((D.blur * hs) / 2))
      for (let pass = 0; pass < 3; pass++) {
        boxBlur(a, b, hw, hh, r, false)
        boxBlur(b, a, hw, hh, r, true)
      }
      // the canvas has its first row at the top, a data texture at the bottom
      for (let y = 0; y < hh; y++) {
        const from = y * hw
        const to = (hh - 1 - y) * hw
        for (let x = 0; x < hw; x++) heightData[to + x] = a[from + x]
      }
      height.needsUpdate = true
    }

    // drawn: the shape is the master from the start, and a field says when the liquid reaches each point
    // of it (the field is built once, here)
    let flow: THREE.DataTexture
    let nose = 1
    if (draws) {
      paint(1)
      const hs = hw / (A.width + 2 * PAD)
      const field = buildFlow({ alpha: raw, width: hw, height: hh, pxPerUnit: hs, pad: PAD, start: M.start, wall: M.wall, reach: M.reach })
      const half = new Uint16Array(hw * hh)
      for (let y = 0; y < hh; y++) {
        const from = y * hw
        const to = (hh - 1 - y) * hw
        for (let x = 0; x < hw; x++) half[to + x] = THREE.DataUtils.toHalfFloat(field.field[from + x])
      }
      flow = new THREE.DataTexture(half, hw, hh, THREE.RedFormat, THREE.HalfFloatType)
      flow.minFilter = flow.magFilter = THREE.LinearFilter
      nose = M.nose / field.length
    } else {
      flow = new THREE.DataTexture(new Uint16Array([0]), 1, 1, THREE.RedFormat, THREE.HalfFloatType)
    }
    flow.wrapS = flow.wrapT = THREE.ClampToEdgeWrapping
    flow.needsUpdate = true

    const color = new THREE.Color(M.color).multiplyScalar(M.gain)
    const base = { vertexShader: vert, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }
    const markMat = new THREE.ShaderMaterial({
      ...base,
      fragmentShader: markFrag,
      uniforms: {
        uMap: { value: texture },
        uHeight: { value: height },
        uFlow: { value: flow },
        uDraw: { value: draws ? 1 : 0 },
        uFront: { value: 0 },
        uNose: { value: nose },
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
    return { texture, height, flow, nose, paint, markMat, haloMat, drawn: draws ? 1 : -1 }
  }, [A, D, M.color, M.gain, M.nose, M.reach, M.start, M.wall, draws])

  useEffect(
    () => () => {
      gpu.texture.dispose()
      gpu.height.dispose()
      gpu.flow.dispose()
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

    // world units per artwork unit at full size: the droplet is the drop the mark starts from
    const from = markStart()
    const k = mark.radius / from.radius
    // drawn: the mark stands at full size from the start. Morphed: the kit host grows about its own centre.
    const startScale = draws ? 1 : A.dropScale
    const scale = (startScale + (1 - startScale) * mark.e) * k
    // where the centre of the artwork is, seen from the drop (artwork y runs down)
    const centre = draws ? from.centre : A.drop
    const ox = -startScale * k * (centre[0] - A.width / 2)
    const oy = startScale * k * (centre[1] - A.height / 2)
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
    // the morph redraws its outline as it changes; the drawn mark was painted once
    if (!draws && mark.covers && mark.e !== gpu.drawn) {
      gpu.paint(mark.e)
      gpu.drawn = mark.e
    }
    const U = gpu.markMat.uniforms
    U.uLife.value = M.life * mark.e
    U.uTime.value = store.time
    // the front runs a little past the last point, so the whole mark ends at its full height
    U.uFront.value = mark.e * (1 + gpu.nose + 0.02)
    // flat while it is still the drop it took over from, then it gains its volume as it forms
    const d = Math.min(1, mark.e / (draws ? D.byDraw : D.by))
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
