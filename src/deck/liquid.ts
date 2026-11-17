/**
 * Neon liquid, drawn in a small WebGL canvas: the material of the mark at the end of the hero, for the
 * pictures of the deck. It is described as a few bodies, and the shader fuses them the way the hero fuses its
 * drops (a smooth union of distances), rounds the surface over at the edge and lights it like the mark: a soft
 * key from the upper left, a deeper rim, a glint. The colour is the kit's rule, a straight mix of Ink and
 * Hyper Neon, so a flat stretch of it is exactly #CCFF00.
 *
 * Two kinds of body:
 *  - a Blob is a stretch of liquid between two points (a drop when the points meet);
 *  - a Vessel is a rounded box filled up to a surface, which rises with `level` and carries a small wave.
 * `surfaceY` gives that surface to the page as well, so type standing on a vessel can change colour exactly on
 * the liquid's edge.
 *
 * All coordinates are CSS pixels inside the canvas, y down. Nothing here keeps a clock: the caller draws when
 * something changed.
 *
 * The program is compiled by the graphics driver beside the page: nothing here waits for it (waiting stops the
 * whole screen for a tenth of a second on a first visit). Until it is there `draw` does nothing, and the
 * caller is told when it is (`onState`).
 */

export interface Blob {
  ax: number
  ay: number
  bx: number
  by: number
  r: number
}

export interface Vessel {
  x: number
  y: number
  w: number
  h: number
  /** Corner radius of the box. */
  r: number
  /** 0 empty, 1 full. */
  level: number
  /** Height of the wave on the surface, px. */
  amp: number
}

const MAX_BLOBS = 8
const MAX_VESSELS = 2

/** The wave on a vessel's surface: two slow sines (the kit's current lines are made the same way). */
const wave = (x: number, t: number) => 0.62 * Math.sin(x * 0.047 + t * 1.9) + 0.38 * Math.sin(x * 0.113 - t * 1.4 + 1.3)
/** Where the still surface stands: below the box when empty, above it when full, whatever the wave does. */
const restY = (v: Vessel) => v.y + v.h + v.amp + 2 - v.level * (v.h + 2 * v.amp + 4)
/** The liquid's surface in a vessel at `x` (canvas pixels), at `time` seconds. */
export const surfaceY = (v: Vessel, x: number, time: number) => restY(v) + v.amp * wave(x - v.x, time)

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform vec4 uBlob[${MAX_BLOBS}];
uniform float uBlobR[${MAX_BLOBS}];
uniform int uBlobs;
uniform vec4 uVes[${MAX_VESSELS}];
uniform vec4 uVesP[${MAX_VESSELS}];
uniform int uVessels;
uniform float uReach;
uniform float uBevel;
uniform float uRelief;

float sdStretch( vec2 p, vec2 a, vec2 b, float r ) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp( dot( pa, ba ) / max( dot( ba, ba ), 1e-4 ), 0.0, 1.0 );
  return length( pa - ba * h ) - r;
}
float sdBox( vec2 p, vec2 c, vec2 hf, float r ) {
  vec2 q = abs( p - c ) - hf + r;
  return length( max( q, 0.0 ) ) + min( max( q.x, q.y ), 0.0 ) - r;
}
float wave( float x, float t ) {
  return 0.62 * sin( x * 0.047 + t * 1.9 ) + 0.38 * sin( x * 0.113 - t * 1.4 + 1.3 );
}
// two bodies reach for each other over uReach pixels
float fuse( float a, float b ) {
  float h = max( uReach - abs( a - b ), 0.0 ) / uReach;
  return min( a, b ) - h * h * uReach * 0.25;
}
float field( vec2 p ) {
  float d = 1e4;
  for ( int i = 0; i < ${MAX_BLOBS}; i++ ) {
    if ( i >= uBlobs ) break;
    d = fuse( d, sdStretch( p, uBlob[i].xy, uBlob[i].zw, uBlobR[i] ) );
  }
  for ( int i = 0; i < ${MAX_VESSELS}; i++ ) {
    if ( i >= uVessels ) break;
    vec4 v = uVes[i];
    vec4 q = uVesP[i];
    float box = sdBox( p, v.xy + 0.5 * v.zw, 0.5 * v.zw, q.x );
    float top = q.y + q.z * wave( p.x - v.x, uTime ) - p.y;
    d = fuse( d, max( box, top ) );
  }
  return d;
}
// height of the surface over the page, 0 at the edge, 1 once it has rounded over
float height( vec2 p ) {
  float t = clamp( -field( p ) / uBevel, 0.0, 1.0 );
  return sqrt( t * ( 2.0 - t ) );
}

const vec3 INK = vec3( 0.0392 );
const vec3 NEON = vec3( 0.8, 1.0, 0.0 );

void main() {
  vec2 p = vec2( gl_FragCoord.x, uRes.y - gl_FragCoord.y ) / uDpr;
  float d = field( p );
  float a = clamp( 0.5 - d * uDpr, 0.0, 1.0 );
  // its own light in the air around it: faint, and gone within a few dozen pixels
  float halo = exp( -max( d, 0.0 ) / 24.0 ) * 0.085;
  if ( a <= 0.0 && halo < 0.003 ) {
    gl_FragColor = vec4( 0.0 );
    return;
  }
  float g = 0.0;
  if ( a > 0.0 ) {
    vec2 slope = vec2(
      height( p + vec2( 1.0, 0.0 ) ) - height( p - vec2( 1.0, 0.0 ) ),
      height( p + vec2( 0.0, 1.0 ) ) - height( p - vec2( 0.0, 1.0 ) ) ) * uRelief * 0.5;
    // a liquid surface is never perfectly still
    slope += 0.03 * vec2( sin( p.x * 0.09 + p.y * 0.035 + uTime * 0.7 ), cos( p.y * 0.075 - p.x * 0.025 - uTime * 0.55 ) );
    // x right, y up, z to the viewer (the page's y runs down)
    vec3 n = normalize( vec3( -slope.x, slope.y, 1.0 ) );
    vec3 l = normalize( vec3( -0.5, 0.62, 0.6 ) );
    float wrap = dot( n, l ) * 0.5 + 0.5;
    float lit = 0.74 + 0.52 * wrap;
    float rim = pow( 1.0 - n.z, 2.5 );
    g = 0.9 * lit * ( 1.0 - 0.42 * rim ) + 0.08 * smoothstep( 0.0, 0.7, n.y );
    g += pow( max( dot( n, normalize( l + vec3( 0.0, 0.0, 1.0 ) ) ), 0.0 ), 46.0 ) * 0.65;
    g = clamp( g, 0.0, 1.0 );
  }
  vec3 body = mix( INK, NEON, g );
  float glow = halo * ( 1.0 - a );
  gl_FragColor = vec4( body * a + NEON * glow, a + glow );
}`

export interface Liquid {
  /** Fits the drawing buffer to the canvas box. Returns its size in CSS pixels. */
  resize(): { w: number; h: number }
  draw(blobs: Blob[], vessels: Vessel[], time: number): void
  dispose(): void
}

/** Null when WebGL is not there: the page then shows its plain state (see the frame that uses it).
 *  `onState` is called once, later: true when the liquid can be drawn, false if its program could not be made. */
export function createLiquid(canvas: HTMLCanvasElement, style: { reach: number; bevel: number; relief: number }, onState?: (ready: boolean) => void): Liquid | null {
  let gl: WebGLRenderingContext | null = null
  try {
    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
  } catch {
    gl = null
  }
  if (!gl) return null
  const g = gl

  // asked for, never waited for: whether it worked is read once the driver says it has finished
  const compile = (type: number, src: string) => {
    const sh = g.createShader(type)
    if (!sh) return null
    g.shaderSource(sh, src)
    g.compileShader(sh)
    return sh
  }
  const vs = compile(g.VERTEX_SHADER, VERT)
  const fs = compile(g.FRAGMENT_SHADER, FRAG)
  const prog = g.createProgram()
  if (!vs || !fs || !prog) return null
  g.attachShader(prog, vs)
  g.attachShader(prog, fs)
  g.linkProgram(prog)
  const buf = g.createBuffer()

  type Places = Record<'res' | 'dpr' | 'time' | 'blob' | 'blobR' | 'blobs' | 'ves' | 'vesP' | 'vessels' | 'reach' | 'bevel' | 'relief', WebGLUniformLocation | null>
  let u: Places | null = null
  let gone = false
  let timer = 0
  const finish = () => {
    if (gone || g.isContextLost()) return
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) {
      if (import.meta.env.DEV) console.warn('liquid shader', g.getShaderInfoLog(fs) || g.getProgramInfoLog(prog))
      onState?.(false)
      return
    }
    g.useProgram(prog)
    g.bindBuffer(g.ARRAY_BUFFER, buf)
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW)
    const at = g.getAttribLocation(prog, 'a')
    g.enableVertexAttribArray(at)
    g.vertexAttribPointer(at, 2, g.FLOAT, false, 0, 0)
    const U = (name: string) => g.getUniformLocation(prog, name)
    u = { res: U('uRes'), dpr: U('uDpr'), time: U('uTime'), blob: U('uBlob'), blobR: U('uBlobR'), blobs: U('uBlobs'), ves: U('uVes'), vesP: U('uVesP'), vessels: U('uVessels'), reach: U('uReach'), bevel: U('uBevel'), relief: U('uRelief') }
    g.uniform1f(u.reach, style.reach)
    g.uniform1f(u.bevel, style.bevel)
    g.uniform1f(u.relief, style.relief)
    g.disable(g.DEPTH_TEST)
    g.disable(g.BLEND)
    g.clearColor(0, 0, 0, 0)
    onState?.(true)
  }
  // where the driver can say "done" without being waited for, ask it now and then; elsewhere there is no
  // way around the wait, so it is taken once, at a quiet moment after this call has returned
  const parallel = g.getExtension('KHR_parallel_shader_compile')
  const ask = () => {
    if (gone) return
    if (!parallel || g.isContextLost() || g.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) finish()
    else timer = window.setTimeout(ask, 24)
  }
  timer = window.setTimeout(ask, 0)

  const blobData = new Float32Array(MAX_BLOBS * 4)
  const blobR = new Float32Array(MAX_BLOBS)
  const vesData = new Float32Array(MAX_VESSELS * 4)
  const vesP = new Float32Array(MAX_VESSELS * 4)
  let dpr = 1
  let cssW = 0
  let cssH = 0

  return {
    resize() {
      const box = canvas.getBoundingClientRect()
      // the canvas can sit in a card that is scaled while it moves: its layout size is what counts
      cssW = canvas.clientWidth || box.width
      cssH = canvas.clientHeight || box.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = Math.max(1, Math.round(cssW * dpr))
      const h = Math.max(1, Math.round(cssH * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      return { w: cssW, h: cssH }
    },
    draw(blobs, vessels, time) {
      if (!u || g.isContextLost()) return
      const nb = Math.min(MAX_BLOBS, blobs.length)
      for (let i = 0; i < nb; i++) {
        const b = blobs[i]
        blobData[i * 4] = b.ax
        blobData[i * 4 + 1] = b.ay
        blobData[i * 4 + 2] = b.bx
        blobData[i * 4 + 3] = b.by
        blobR[i] = b.r
      }
      const nv = Math.min(MAX_VESSELS, vessels.length)
      for (let i = 0; i < nv; i++) {
        const v = vessels[i]
        vesData[i * 4] = v.x
        vesData[i * 4 + 1] = v.y
        vesData[i * 4 + 2] = v.w
        vesData[i * 4 + 3] = v.h
        vesP[i * 4] = v.r
        vesP[i * 4 + 1] = restY(v)
        vesP[i * 4 + 2] = v.amp
        vesP[i * 4 + 3] = 0
      }
      g.viewport(0, 0, canvas.width, canvas.height)
      g.clear(g.COLOR_BUFFER_BIT)
      g.uniform2f(u.res, canvas.width, canvas.height)
      g.uniform1f(u.dpr, dpr)
      g.uniform1f(u.time, time)
      g.uniform4fv(u.blob, blobData)
      g.uniform1fv(u.blobR, blobR)
      g.uniform1i(u.blobs, nb)
      g.uniform4fv(u.ves, vesData)
      g.uniform4fv(u.vesP, vesP)
      g.uniform1i(u.vessels, nv)
      g.drawArrays(g.TRIANGLES, 0, 3)
    },
    dispose() {
      gone = true
      window.clearTimeout(timer)
      g.deleteBuffer(buf)
      g.deleteProgram(prog)
      g.deleteShader(vs)
      g.deleteShader(fs)
    },
  }
}
