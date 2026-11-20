/**
 * The light that hangs into the dark part of the page (&flow=soar), as the reference has it over its own dark part
 * (trysoar.com: a scene of a few effects, read off its page; this is our own drawing of the same idea, in the
 * page's colours). A great drop of light, its round end down, hangs from the light ground above into the Ink: its
 * edge a bright line, a little split at its rim as light is by glass, with soft rays out from it; inside it the
 * light from above, fading downwards; about it the dark, a beam from above, wisps that drift, specks of dust, and a
 * grain that moves. The drop sways a little, and follows the pointer up and down.
 *
 * One canvas, one program, one full-screen triangle; drawn at most 60 times a second, only while it is on the
 * screen; under reduced motion one picture. The context and the first picture are made at a still moment, before
 * the page reaches it (making them as it came onto the screen would hold a frame back). The canvas is laid over the
 * top of the stage and faded in from the light ground above by a mask (appStage.module.css).
 */
import { useEffect, useRef } from 'react'
import { whenStill } from '../still'

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

/** The picture, in units of the canvas's width (x across, y down from its top). */
const FRAGMENT = `
precision highp float;
uniform vec2 uSize;   // the canvas, in its own pixels
uniform float uTime;  // seconds
uniform float uLift;  // the pointer, up (-1) to down (1), eased
uniform float uSpan;  // the width the drawing is measured in (the canvas's, or more on an upright screen)

const vec3 INK = vec3(0.039, 0.039, 0.039);
const vec3 NEON = vec3(0.8, 1.0, 0.0);
const vec3 PAPER = vec3(0.957, 0.961, 0.941);

float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 q) {
  vec2 i = floor(q), f = fract(q);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 q) {
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 3; k++) { v += a * noise(q); q = q * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

// The drop: its round end, a circle a little wider than tall; its middle and radius sway slowly.
vec2 centre;
float radius;
float drop(vec2 q, float grow) {
  vec2 d = (q - centre) * vec2(0.97, 1.0);
  return length(d) - radius * grow;
}
// Its edge, as the edge of a liquid: a soft bright line, a softer light about it, a wide light on its inner side
// (the drop holds it), and a faint second line a little inside, where the surface turns.
float edge(float d) {
  float k = d / 0.0023;
  float inner = max(-d, 0.0);
  float turn = (d + 0.012) / 0.004;
  return 0.9 * exp(-k * k) + 0.2 * exp(-abs(d) / 0.011) + 0.24 * exp(-inner / 0.045) * step(d, 0.0) + 0.08 * exp(-turn * turn);
}

void main() {
  vec2 q = vec2(0.5 + (gl_FragCoord.x - 0.5 * uSize.x) / uSpan, (uSize.y - gl_FragCoord.y) / uSpan);
  float tall = uSize.y / uSpan;
  float t = uTime;
  // (the round end's middle is at the canvas's top, where the light ground ends: it hangs 0.3 of the width down, round
  // the headline, which stands inside it, and its lowest part goes behind the monitor, as the reference's does; where
  // it comes out of the light it is as wide as theirs)
  centre = vec2(0.5 + 0.004 * sin(t * 0.21), 0.0 + 0.005 * sin(t * 0.17 + 1.3) + 0.01 * uLift);
  radius = 0.3 + 0.0025 * sin(t * 0.13 + 0.4);
  float bottom = centre.y + radius;

  // the dark: a deep olive under the light ground, going down to the Ink (the reference's is a deep blue), with a
  // beam of the light above coming down the middle
  float x = q.x - 0.5;
  vec3 col = mix(vec3(0.105, 0.118, 0.07), INK, smoothstep(0.0, tall * 0.8, q.y));
  float bx = x / 0.22;
  float beam = exp(-bx * bx) * (1.0 - smoothstep(0.0, 0.5, q.y));
  col += mix(PAPER, NEON, 0.25) * beam * 0.11;

  // inside the drop: the light from above, fading down to its bottom
  // (its edge moves as a liquid's does: a slow swell along it)
  vec2 rel = q - centre;
  float along = atan(rel.y, rel.x);
  float swell = (fbm(vec2(along * 2.6, t * 0.06)) - 0.5) * 0.009;
  float d = drop(q, 1.0) + swell;
  float inside = 1.0 - smoothstep(-0.003, 0.003, d);
  float down = clamp(q.y / bottom, 0.0, 1.0);
  vec3 held = mix(mix(PAPER, NEON, 0.12), vec3(0.11, 0.12, 0.09), smoothstep(0.0, 0.85, down));
  col = mix(col, held, inside * (0.34 - 0.3 * smoothstep(0.05, 0.75, down)));

  // its edge, split as glass splits light (the outer side warm, the inner cool), brightest low on either side of
  // the round, as the reference's is, and faint where it rises into the light
  float down2 = (q.y - centre.y) / radius;
  float side = abs(q.x - centre.x) / radius;
  float lower = smoothstep(0.15, 0.75, down2) * (0.55 + 0.45 * smoothstep(0.15, 0.6, side));
  float e = 0.0055 * (0.3 + 0.7 * lower);
  vec3 rim = vec3(edge(drop(q, 1.0 + e) + swell), edge(d), edge(drop(q, 1.0 - e) + swell));
  vec3 tint = vec3(0.95, 1.0, 0.84);
  col += rim * tint * (0.22 + 0.85 * lower);

  // soft rays out from the edge, as if the edge were drawn out towards a point below the drop (a zoom blur)
  vec2 from = vec2(0.5, bottom + 0.16);
  float rays = 0.0;
  for (int k = 1; k <= 6; k++) {
    float s = 1.0 - float(k) * 0.022;
    rays += exp(-abs(drop(from + (q - from) * s, 1.0)) / 0.006) / float(k + 1);
  }
  col += mix(PAPER, NEON, 0.35) * rays * 0.16 * (0.4 + lower);

  // wisps that drift about the edge
  float w = fbm(q * vec2(5.0, 7.0) + vec2(t * 0.018, -t * 0.012));
  col += mix(PAPER, NEON, 0.3) * smoothstep(0.58, 0.9, w) * exp(-abs(d) / 0.05) * 0.07;

  // specks of dust, drifting
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 14.0 : 23.0;
    vec2 g = q * scale + vec2(t * 0.05 * float(layer + 1), -t * 0.03);
    vec2 cell = floor(g);
    float h = hash(cell + float(layer) * 17.0);
    if (h > 0.84) {
      vec2 at = cell + vec2(hash(cell + 3.1), hash(cell + 7.7));
      float r = (layer == 0 ? 0.11 : 0.07) * (0.6 + 0.4 * h);
      float speck = 1.0 - smoothstep(r * 0.25, r, length(g - at));
      float twinkle = 0.55 + 0.45 * sin(t * (0.6 + h) + h * 40.0);
      col += vec3(0.92, 0.95, 0.88) * speck * twinkle * (layer == 0 ? 0.35 : 0.22);
    }
  }

  // the sides darker, and a grain that moves
  col *= 1.0 - 0.32 * smoothstep(0.28, 0.62, abs(x));
  col += (hash(gl_FragCoord.xy + fract(t * 7.0) * 113.0) - 0.5) * 0.045;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

export function DropScene({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let gl: WebGLRenderingContext | null = null
    let size: WebGLUniformLocation | null = null
    let time: WebGLUniformLocation | null = null
    let lift: WebGLUniformLocation | null = null
    let span: WebGLUniformLocation | null = null
    let made = false
    let shown = false
    let raf = 0
    let last = 0
    let liftNow = 0
    let liftWant = 0
    const began = performance.now()

    const fit = () => {
      // (the scene is soft: drawn at three quarters of the screen's pixels, or half on a phone's)
      const scale = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 1024 ? 0.5 : 0.75)
      const w = Math.max(1, Math.round(el.clientWidth * scale))
      const h = Math.max(1, Math.round(el.clientHeight * scale))
      if (el.width !== w || el.height !== h) {
        el.width = w
        el.height = h
      }
      if (gl) {
        gl.viewport(0, 0, w, h)
        gl.uniform2f(size, w, h)
        // (on an upright or narrow screen the drop is drawn as for a screen 1.9 times as wide: the page's phone
        // layout widens the stage's top to match, appStage.module.css)
        gl.uniform1f(span, w * (innerWidth < 1024 || innerWidth <= innerHeight ? 1.9 : 1))
      }
    }
    const draw = (now: number) => {
      if (!gl) return
      liftNow += (liftWant - liftNow) * 0.04
      gl.uniform1f(time, still ? 12 : (now - began) / 1000)
      gl.uniform1f(lift, liftNow)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const make = () => {
      if (made) return
      made = true
      gl = el.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' })
      if (!gl) return
      const shader = (type: number, source: string) => {
        const one = gl!.createShader(type)!
        gl!.shaderSource(one, source)
        gl!.compileShader(one)
        return one
      }
      const program = gl.createProgram()!
      gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX))
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl = null
        return
      }
      gl.useProgram(program)
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const at = gl.getAttribLocation(program, 'p')
      gl.enableVertexAttribArray(at)
      gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
      size = gl.getUniformLocation(program, 'uSize')
      time = gl.getUniformLocation(program, 'uTime')
      lift = gl.getUniformLocation(program, 'uLift')
      span = gl.getUniformLocation(program, 'uSpan')
      fit()
      draw(performance.now())
    }
    const loop = (now: number) => {
      raf = 0
      if (!shown || still) return
      // (at most 60 pictures a second: the scene moves slowly)
      if (now - last >= 15.5) {
        last = now
        draw(now)
      }
      raf = requestAnimationFrame(loop)
    }
    const watch = new IntersectionObserver(([entry]) => {
      shown = entry.isIntersecting
      if (shown) {
        make()
        if (!raf && !still) raf = requestAnimationFrame(loop)
      }
    }, { rootMargin: '10% 0px' })
    watch.observe(el)
    const pointer = (event: PointerEvent) => {
      liftWant = Math.max(-1, Math.min(1, (event.clientY / innerHeight) * 2 - 1))
    }
    addEventListener('pointermove', pointer, { passive: true })
    const resized = () => {
      if (!gl) return
      fit()
      draw(performance.now())
    }
    addEventListener('resize', resized)
    const stop = whenStill(make)
    return () => {
      watch.disconnect()
      removeEventListener('pointermove', pointer)
      removeEventListener('resize', resized)
      if (raf) cancelAnimationFrame(raf)
      stop()
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])
  return <canvas ref={canvas} className={className} aria-hidden="true" />
}
