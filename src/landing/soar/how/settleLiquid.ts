/**
 * The settlement as liquid settling (How it works' last stage, HowMorph.tsx), drawn on the GPU into a canvas that
 * covers the glass: a column of three liquids, as liquids of three weights stand in a glass: Hyperwood at the top, the
 * brightest; Robinhood Chain under it; Ethereum at the foot, the deepest. As the stage comes, the liquid rises into
 * the capsule, its surfaces rocking, and settles. Then the verified state forms as a drop under the number, falls in
 * and sinks through each layer: each surface it meets is pressed down round it and springs back, rippling, as it goes
 * through. At the foot it lands, slides to the lowest point and spreads: settled. Last, the receipt lifts out of the
 * top surface, which clings to it a moment and lets it go.
 *
 * One program, one triangle; the liquid of the front-running example (soar/liquid/FrontRun.tsx): where the drop joins
 * the surface, a height of sqrt(1 - 1/f) and a light from the upper left with its highlight. In each layer a slow
 * current. In Ink and Neon only. Made on its first drawing (the stage's rehearsal draws it at a still moment); drawn
 * by HowMorph's frame loop while the stage shows. Every motion is a pure function of the stage's own time (settleAt).
 */
import { easeOutCubic, prog } from './motion'

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;      // the canvas, in its pixels (it covers the glass's box)
uniform float uTime;    // the page's clock, for the surfaces and the currents
uniform float uScale;   // the glass's width in the canvas's pixels
uniform vec4 uLevels;   // the three surfaces (the top, the first boundary, the second) and the foot
uniform vec3 uTilt;     // each surface's tilt as the liquid settles (how much lower at the right than the left)
uniform vec4 uDrop;     // the drop: x, y, radius, and how much of it is still a drop of its own over the top
uniform vec2 uShape;    // its stretch across and down
uniform vec3 uDip;      // each surface pressed down round it (below zero: thrown up as it springs back)
uniform vec4 uRipple;   // where it went through (x), and the time since it went through each surface
uniform vec4 uLift;     // the receipt lifted out of the top: x, half its width, how high the surface clings, since it let go
uniform float uPool;    // how deep the pool the drop settles into at the foot is

const vec3 NEON = vec3(0.8, 1.0, 0.0);
const vec3 MID = vec3(0.58, 0.72, 0.012);
const vec3 LOW = vec3(0.33, 0.41, 0.02);
const vec3 LIGHT = vec3(-0.42, -0.58, 0.7);
const vec3 SHEEN = vec3(0.95, 1.0, 0.6);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// rings running out over a surface from x0, since something went through it there, dying away
float ripple(float x, float x0, float since) {
  if (since < 0.0) return 0.0;
  float d = abs(x - x0) / uScale;
  return sin(d * 40.0 - since * 12.0) * exp(-since * 2.4) * exp(-d * 4.5) * 0.02 * uScale * smoothstep(0.0, 0.06, since);
}
// how much a surface is pressed down round the drop, at x
float press(float x) {
  return exp(-pow((x - uDrop.x) / (1.35 * max(uDrop.z * uShape.x, 1.0)), 2.0));
}
// the liquid climbs the glass a little at its walls
float wall(float x) {
  return exp(-min(x, uScale - x) / (0.028 * uScale));
}
// the top surface at x
float surface(float x) {
  float w = uScale;
  float a = x / w;
  float lift = exp(-pow(abs(x - uLift.x) / max(uLift.y, 1.0), 4.0));
  return uLevels.x + (a - 0.5) * uTilt.x + sin(a * 9.0 + uTime * 1.9) * 0.006 * w + sin(a * 4.3 - uTime * 1.1) * 0.005 * w
    + ripple(x, uRipple.x, uRipple.y) + ripple(x, uLift.x, uLift.w) + press(x) * uDip.x - lift * uLift.z - wall(x) * 0.03 * w;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float w = uScale;
  float t = uTime;
  float x = p.x;
  float a0 = x / w;
  float top = surface(x);
  // (well over the surface and away from the drop: nothing)
  if (p.y < top - 0.16 * w && (uDrop.w <= 0.0 || length(p - uDrop.xy) > uDrop.z * 2.6 + 2.0)) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float b1 = uLevels.y + (a0 - 0.5) * uTilt.y + sin(a0 * 7.0 - t * 1.3) * 0.005 * w + ripple(x, uRipple.x, uRipple.z) + press(x) * uDip.y - wall(x) * 0.01 * w;
  float b2 = uLevels.z + (a0 - 0.5) * uTilt.z + sin(a0 * 6.0 + t * 1.0 + 1.3) * 0.005 * w + ripple(x, uRipple.x, uRipple.w) + press(x) * uDip.z - wall(x) * 0.01 * w;

  // the field: the column (deep below its top surface, which slopes as it waves) and the drop while it is a drop of
  // its own over it (they run together where it goes in)
  float s = 0.05 * w;
  float fc = min(exp((p.y - top) / s), 40.0);
  float slopeTop = surface(x + 1.0) - top;
  vec2 gc = vec2(-slopeTop, 1.0) * fc / s;
  vec2 v = (p - uDrop.xy) / uShape;
  float q = dot(v, v) + 1.0;
  float fd = uDrop.z * uDrop.z / q * uDrop.w;
  vec2 gd = -2.0 * fd / q * v / uShape;
  float f = fc + fd;
  vec2 g = gc + gd;
  float edge = length(g) * 0.8 + 0.0001;
  float alpha = smoothstep(1.0 - edge, 1.0 + edge, f);
  float fs = max(f, 1.0001);
  float h = sqrt(1.0 - 1.0 / fs);
  vec2 slope = g * (0.5 / max(h, 0.06)) / (fs * fs);
  vec3 n = normalize(vec3(-slope * 0.09 * w, 1.0));
  vec3 l = normalize(LIGHT);
  float lit = max(dot(n, l), 0.0);
  float hi = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);

  // the three layers, each a shade deeper further down in it
  float in2 = smoothstep(b1 - 1.0, b1 + 1.0, p.y);
  float in3 = smoothstep(b2 - 1.0, b2 + 1.0, p.y);
  float d1 = clamp((p.y - top) / max(b1 - top, 1.0), 0.0, 1.0);
  float d2 = clamp((p.y - b1) / max(b2 - b1, 1.0), 0.0, 1.0);
  float d3 = clamp((p.y - b2) / max(uLevels.w - b2, 1.0), 0.0, 1.0);
  vec3 layer = mix(mix(NEON * (1.0 - 0.16 * d1), MID * (1.0 - 0.2 * d2), in2), LOW * (1.0 - 0.3 * d3), in3);
  // a slow current in each, each its own way
  float which = in2 + in3;
  vec2 c = vec2(x, p.y * 2.2) / w;
  float drift = t * mix(mix(0.05, -0.04, in2), 0.03, in3);
  float dye = noise(c * vec2(5.0, 7.0) + vec2(drift * 7.0, which * 3.7));
  dye = 0.62 * dye + 0.38 * noise(c * vec2(13.0, 16.0) + vec2(-drift * 11.0, which * 5.1 + t * 0.04));
  layer *= 0.92 + 0.14 * dye;
  // under each boundary the upper liquid's shade; along it a fine light
  float line = max(1.0, w / 340.0);
  layer *= 1.0 - 0.16 * in2 * exp(-(p.y - b1) / (0.03 * w)) - 0.16 * in3 * exp(-(p.y - b2) / (0.03 * w));
  layer = mix(layer, NEON, clamp(0.42 * (exp(-abs(p.y - b1) / line) + exp(-abs(p.y - b2) / line)), 0.0, 1.0));
  // the glass round it: the liquid deeper at its sides; the glass's light a quarter of the way in from the left
  layer *= 0.84 + 0.16 * sqrt(sin(3.14159 * clamp(a0, 0.0, 1.0)));
  layer = mix(layer, NEON, 0.1 * exp(-pow((a0 - 0.2) / 0.045, 2.0)));

  // the drop under the surface, and the pool at the foot it runs into: Hyperwood's light carried down, its edge dark
  // where the light bends through it. The two as one liquid: where they meet, they run together (a smooth union)
  float R = uDrop.z;
  if (p.y > top + 0.5 && (R > 0.5 || uPool > 0.0)) {
    vec2 dv = (p - uDrop.xy) / uShape;
    float dDrop = R > 0.5 ? (length(dv) - R) * min(uShape.x, uShape.y) : 10000.0;
    float dPool = uPool > 0.0 ? uLevels.w - uPool + sin(a0 * 11.0 + t * 1.4) * 0.6 * line - p.y : 10000.0;
    float kk = 0.5 * max(R, 6.0 * line);
    float hh = clamp(0.5 + 0.5 * (dPool - dDrop) / kk, 0.0, 1.0);
    float dU = mix(dPool, dDrop, hh) - kk * hh * (1.0 - hh);
    float body = smoothstep(0.8, -0.8, dU);
    if (body > 0.0) {
      // (lit as a round drop where the drop is, as a level pool where the pool is)
      vec2 o = R > 0.5 ? dv / R * hh : vec2(0.0);
      vec3 dn = normalize(vec3(o, sqrt(max(0.05, 1.0 - dot(o, o)))));
      float dl = max(dot(dn, l), 0.0);
      vec3 drop = NEON * (0.72 + 0.36 * dl);
      drop += SHEEN * 0.55 * hh * pow(max(dot(reflect(-l, dn), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
      float rim = smoothstep(-2.4 * line, -0.4 * line, dU);
      drop = mix(drop, layer * 0.42, rim * 0.85);
      layer = mix(layer, drop, body);
    }
  }

  vec3 col = layer * (0.55 + 0.45 * mix(1.0, lit, smoothstep(0.0, 3.0, 1.0 / max(fs - 1.0, 0.001)))) * (0.8 + 0.2 * n.z) + hi * 0.6 * SHEEN;
  gl_FragColor = vec4(col * alpha, alpha);
}
`

const W = 340
const H = 560
const CORNER = 150

/** The column, in the glass's own pixels (the stage's: 340 by 560): its surfaces once settled and its foot; where the
 *  drop forms, its size, where it comes to rest (near the floor's lowest point), and how deep its pool is. */
export const COLUMN = { top: 238, b1: 328, b2: 418, foot: H, dropX: 232, dropY: 196, r: 17, restX: 182, pool: 20 }
/** The stage's own seconds: the liquid rising; the drop forming, falling to the top, sinking to the floor and running
 *  into its pool there; the receipt lifting out of the top surface. */
export const SETTLE_AT = {
  rise: [0.5, 1.3] as const,
  form: [1.25, 1.55] as const,
  fall: [1.55, 1.78] as const,
  sink: [1.78, 2.95] as const,
  land: [2.85, 3.5] as const,
  lift: [3.45, 4.05] as const,
}

/** the glass's floor under x (its corners are 150 round) */
const floorAt = (x: number) => {
  const dx = Math.max(CORNER - x, x - (W - CORNER), 0)
  return H - CORNER + Math.sqrt(Math.max(0, CORNER * CORNER - dx * dx))
}
const smooth = (k: number) => k * k * (3 - 2 * k)
const R = COLUMN.r
const LEVELS = [COLUMN.top, COLUMN.b1, COLUMN.b2]
/** where the drop's way down would end: under its resting place, so that it meets the floor still moving */
const SINK_TO = floorAt(COLUMN.restX) - 2 - R * 0.55
/** the drop's height while it falls and sinks: faster and faster to the top; in the liquid, slower and slower */
const fallY = (s: number) => {
  if (s < SETTLE_AT.fall[0]) return COLUMN.dropY
  if (s < SETTLE_AT.fall[1]) return COLUMN.dropY + (COLUMN.top - COLUMN.dropY) * prog(s, ...SETTLE_AT.fall) ** 2
  return COLUMN.top + (SINK_TO - COLUMN.top) * (1 - (1 - prog(s, ...SETTLE_AT.sink)) ** 1.5)
}
/** when the drop goes through each surface (its middle a third of its size under it), and how far down it had
 *  pressed it then */
const THROUGH = LEVELS.map((level) => {
  let s = SETTLE_AT.fall[0]
  while (s < SETTLE_AT.sink[1] && fallY(s) < level + 0.35 * R) s += 0.002
  return { at: s, pressed: Math.min(1.25 * R, Math.max(0, fallY(s) + R - level)) }
})
/** how high the surface clings to the receipt before it lets go */
const CLING = 10

export type Settle = ReturnType<typeof settleAt>

/** Where the stage's liquid is at its own time s (stage pixels); the receipt's size (stage pixels) for its lift. */
export function settleAt(s: number, receipt = { w: 150, h: 37 }) {
  // the liquid rising into the glass, its surfaces rocking as it settles
  const up = easeOutCubic(prog(s, ...SETTLE_AT.rise))
  const levels = LEVELS.map((level) => COLUMN.foot - (COLUMN.foot - level) * up)
  const since = s - SETTLE_AT.rise[0]
  const rock = since > 0 ? Math.exp(-since * 2.4) * Math.min(1, since / 0.25) : 0
  const tilt = [0.065, 0.045, 0.03].map((a, i) => a * W * Math.sin((since - i * 0.07) * 7.6) * rock)
  // the drop: forming, falling, sinking (drawn, near the floor, to its lowest point); then, on the floor, a little
  // squashed, running into the pool it makes there
  const grow = easeOutCubic(prog(s, ...SETTLE_AT.form))
  const melt = prog(s, ...SETTLE_AT.land)
  const streak = s > SETTLE_AT.fall[0] && s < SETTLE_AT.sink[0] + 0.2 ? Math.sin(Math.PI * prog(s, SETTLE_AT.fall[0], SETTLE_AT.sink[0] + 0.2)) * 0.08 : 0
  const squash = Math.sin(Math.PI * Math.min(1, melt * 2.2)) * 0.22
  const sx = (1 + squash) * (1 - streak * 0.7)
  const sy = (1 - squash) * (1 + streak)
  const x = COLUMN.dropX + (COLUMN.restX - COLUMN.dropX) * smooth(prog(s, SETTLE_AT.sink[1] - 0.55, SETTLE_AT.land[0] + 0.2))
  const r = R * grow * Math.sqrt(1 - smooth(prog(s, SETTLE_AT.land[0] + 0.1, SETTLE_AT.land[1])))
  const y = Math.min(fallY(s), floorAt(x) - 2 - r * sy)
  const pool = COLUMN.pool * easeOutCubic(prog(s, SETTLE_AT.land[0] + 0.05, SETTLE_AT.land[1]))
  // each surface pressed down round it as it comes, and springing back (past level, then settling) once it is through
  const dips = THROUGH.map(({ at, pressed }, i) => {
    if (s < at) return Math.min(1.25 * R, Math.max(0, y + R * sy - levels[i]))
    const e = s - at
    return pressed * Math.exp(-e * 9) * Math.cos(e * 21)
  })
  const ripples = THROUGH.map(({ at }) => (s >= at ? s - at : -1))
  const above = s < THROUGH[0].at ? 1 : Math.max(0, 1 - (s - THROUGH[0].at) / 0.08)
  // the receipt: from under the top surface to a little over it; the surface clings to it, then lets it go
  const k = easeOutCubic(prog(s, ...SETTLE_AT.lift))
  const travel = receipt.h + 18
  const chipY = COLUMN.top + 4 + receipt.h / 2 - travel * k
  const bottom = chipY + receipt.h / 2
  // (it lets go once its foot is CLING over the surface: worked back through the ease)
  const goneAt = SETTLE_AT.lift[0] + (1 - Math.cbrt(1 - (receipt.h + 4 + CLING) / travel)) * (SETTLE_AT.lift[1] - SETTLE_AT.lift[0])
  const after = s - goneAt
  const clings = after < 0 ? Math.max(0, COLUMN.top - bottom) : CLING * Math.exp(-after * 10) * Math.cos(after * 24)
  return {
    levels,
    tilt,
    drop: { x, y, r, sx, sy, above },
    pool,
    dips,
    ripples,
    lift: { x: W / 2, half: receipt.w * 0.42, h: clings, since: after >= 0 ? after : -1 },
    /** the receipt's middle, and how much it is there (it comes as it clears the surface) */
    chipY,
    words: easeOutCubic(prog(s, SETTLE_AT.lift[0] + 0.1, goneAt + 0.05)),
    /** the layers' names, as the liquid comes up to them */
    names: easeOutCubic(prog(s, SETTLE_AT.rise[1] - 0.3, SETTLE_AT.rise[1] + 0.1)),
  }
}

/** A canvas's liquid: made on its first drawing; `draw` takes the stage's state (settleAt) and the page's clock. */
export function settleLiquid(canvas: HTMLCanvasElement) {
  let gl: WebGLRenderingContext | null = null
  const u: Record<string, WebGLUniformLocation | null> = {}
  let failed = false
  const make = () => {
    if (gl || failed) return
    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
    if (!gl) {
      failed = true
      return
    }
    const shader = (type: number, source: string) => {
      const one = gl!.createShader(type)!
      gl!.shaderSource(one, source)
      gl!.compileShader(one)
      return one
    }
    const program = gl.createProgram()!
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT))
    gl.bindAttribLocation(program, 0, 'p')
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl = null
      failed = true
      return
    }
    gl.useProgram(program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    for (const name of ['uRes', 'uTime', 'uScale', 'uLevels', 'uTilt', 'uDrop', 'uShape', 'uDip', 'uRipple', 'uLift', 'uPool']) u[name] = gl.getUniformLocation(program, name)
  }
  return {
    make,
    /** the canvas's own pixels for the size it is shown at */
    size(w: number, h: number) {
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    },
    draw(st: Settle, t: number) {
      make()
      if (!gl) return
      const k = canvas.width / W
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(u.uRes, canvas.width, canvas.height)
      // (the clock kept small, so the surfaces' sines keep their precision on any GPU)
      gl.uniform1f(u.uTime, t % 600)
      gl.uniform1f(u.uScale, canvas.width)
      gl.uniform4f(u.uLevels, st.levels[0] * k, st.levels[1] * k, st.levels[2] * k, COLUMN.foot * k)
      gl.uniform3f(u.uTilt, st.tilt[0] * k, st.tilt[1] * k, st.tilt[2] * k)
      gl.uniform4f(u.uDrop, st.drop.x * k, st.drop.y * k, st.drop.r * k, st.drop.above)
      gl.uniform2f(u.uShape, st.drop.sx, st.drop.sy)
      gl.uniform3f(u.uDip, st.dips[0] * k, st.dips[1] * k, st.dips[2] * k)
      gl.uniform4f(u.uRipple, COLUMN.dropX * k, st.ripples[0], st.ripples[1], st.ripples[2])
      gl.uniform4f(u.uLift, st.lift.x * k, st.lift.half * k, st.lift.h * k, st.lift.since)
      gl.uniform1f(u.uPool, st.pool * k)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      gl = null
    },
  }
}
