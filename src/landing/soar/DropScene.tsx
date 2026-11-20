/**
 * The arc of light over the app's stage (AppStage's sky="drop"), after the reference's own over its dark part
 * (trysoar.com). Theirs is a scene of a few effects (read off its page: a round shape that follows the pointer up
 * and down, its colours split at its edge, a zoom blur, a vignette, wisps that drift, and specks out of focus that
 * follow the pointer); this is our own drawing of the same idea, in one program: a great drop of light, its round end
 * down, hangs into the Ink round the headline, its lowest part behind the monitor. In the page's colours only:
 * everything in it is Hyper Neon laid over the Ink in some measure (the canvas is clear, so the page's own Ink is its
 * ground and it has no edge of its own); no grain (a dither of a 255th only, unseen).
 *
 * It is a body of light and not a line: lit from just inside its edge, a broad soft band that falls away inward,
 * with the edge itself a fine line and a little light spilt outside it. And it is alive: light streams slowly round
 * the band, which thins and thickens as it goes; smoke of it curls up inside the drop; a brighter light goes round
 * the rim on two slow swings that never repeat each other, leaning towards the pointer; the drop follows the pointer
 * up and down and a little across; and specks of dust hang in the air about it, out of focus, drifting, the nearer
 * ones moving more against the pointer.
 *
 * It opens with the scroll. As the stage comes up the screen (`come`: 0 with its top at the screen's foot, 1 with its
 * top at the screen's top), the drop's light comes up out of the dark and it opens out a little to its whole size,
 * eased at both ends.
 *
 * `plain` (&arc=plain) draws it as it was before: one line of Neon with a faint light inside, no wisps and no dust.
 *
 * One canvas, one program, one full-screen triangle; drawn on each frame while it is on the screen; under reduced
 * motion one picture. The context and the first picture are made at a still moment, before the page reaches it
 * (making them as it came onto the screen would hold a frame back).
 */
import { useEffect, useRef } from 'react'
import { whenStill } from '../still'

/** When the drop opens: from and to, in how far the stage has come up the screen; and how much smaller it begins. */
const OPEN = { from: 0.08, to: 0.72, from_size: 0.84 }

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

/** The picture, in units of the drawing's width (x across, y down from its top). It writes Neon over a clear
 *  ground, premultiplied: on the page's Ink that is a straight mix of the two. */
const FRAGMENT = `
precision highp float;
uniform vec2 uSize;   // the canvas, in its own pixels
uniform float uTime;  // seconds
uniform float uLift;  // the pointer, up (-1) to down (1), eased
uniform float uSpan;  // the width the drawing is measured in (the canvas's, or more on an upright screen)
uniform float uCome;  // how far the stage has come up the screen, in screens
uniform float uPoint; // the pointer, left (-1) to right (1), eased

const vec3 NEON = vec3(0.8, 1.0, 0.0);

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

void main() {
  vec2 q = vec2(0.5 + (gl_FragCoord.x - 0.5 * uSize.x) / uSpan, (uSize.y - gl_FragCoord.y) / uSpan);
  float t = uTime;
  // the drop opens as the stage rises: its light comes up and it opens out a little, eased at both ends
  float k = clamp((uCome - ${OPEN.from.toFixed(3)}) / ${(OPEN.to - OPEN.from).toFixed(3)}, 0.0, 1.0);
  float grow = 0.5 - 0.5 * cos(3.14159265 * k);
  float shown = grow;
  // (whole, the round end's middle is at the canvas's top: it hangs 0.3 of the width down, round the headline,
  // which stands inside it, and its lowest part goes behind the monitor, as the reference's does)
  radius = (0.3 + 0.0025 * sin(t * 0.13 + 0.4)) * mix(${OPEN.from_size.toFixed(3)}, 1.0, grow);
  // A light that goes slowly round the rim, as the light on the edge of a glass goes round when the glass is turned a
  // little: where it is, as the angle round the drop's middle (0 at the arc's right end, a half pi at its foot, pi at
  // its left end), on two slow swings that never repeat each other, leaning towards the pointer.
  float at = 1.5708 + 0.62 * sin(t * 0.23) + 0.2 * sin(t * 0.087 + 2.1) - 0.38 * uPoint;

#if PLAIN
  // ---- as it was: one line of Neon, a faint light held inside
  centre = vec2(0.5 + 0.004 * sin(t * 0.21), 0.005 * sin(t * 0.17 + 1.3) + 0.01 * uLift);
  vec2 rel = q - centre;
  float along = atan(rel.y, rel.x);
  float swell = (fbm(vec2(along * 2.6, t * 0.06)) - 0.5) * 0.009;
  float d = drop(q, 1.0) + swell;
  float inside = 1.0 - smoothstep(-0.003, 0.003, d);
  float down = clamp(rel.y / max(radius, 0.001), 0.0, 1.0);
  float glint = exp(-pow((along - at) / 0.42, 2.0));
  float flow = fbm(rel * 3.2 + vec2(t * 0.035, -t * 0.05));
  float a = inside * 0.11 * smoothstep(0.04, 0.4, down) * (1.0 - 0.8 * smoothstep(0.45, 1.0, down)) * (0.7 + 0.6 * flow) * shown;
  a += inside * 0.05 * glint * exp(d / 0.05) * shown;
  float side = abs(q.x - centre.x) / max(radius, 0.001);
  float lower = smoothstep(0.15, 0.75, down) * (0.55 + 0.45 * smoothstep(0.15, 0.6, side));
  float turn = (d + 0.012) / 0.004;
  float fine = d / 0.0023;
  float edge = 0.9 * exp(-fine * fine) + 0.12 * exp(-abs(d) / 0.011) + 0.2 * exp(-max(-d, 0.0) / 0.045) * step(d, 0.0) + 0.08 * exp(-turn * turn);
  a += edge * (0.22 + 0.78 * lower) * (1.0 + 0.55 * glint) * shown;
#else
  // ---- a body of light, alive. Its middle sways, and follows the pointer: up and down with it, a little across.
  centre = vec2(0.5 + 0.004 * sin(t * 0.21) + 0.006 * uPoint, 0.005 * sin(t * 0.17 + 1.3) + 0.016 * uLift);
  vec2 rel = q - centre;
  float along = atan(rel.y, rel.x);
  float swell = (fbm(vec2(along * 2.6, t * 0.06)) - 0.5) * 0.009;
  float d = drop(q, 1.0) + swell;
  float inside = 1.0 - smoothstep(-0.002, 0.002, d);
  float depth = max(-d, 0.0);
  float down = clamp(rel.y / max(radius, 0.001), 0.0, 1.0);
  float glint = exp(-pow((along - at) / 0.42, 2.0));

  // The wisps: light streaming slowly round the rim, thinning and thickening as it goes; and smoke of it curling up
  // inside the drop, drawn along by the stream.
  float stream = fbm(vec2(along * 3.2 - t * 0.16, depth * 22.0 + t * 0.05));
  float smoke = fbm(rel * 4.2 + vec2(0.9 * stream + t * 0.03, -t * 0.055));

  // The limb. The drop is lit from just inside its edge: a broad soft band that falls away inward, broader and
  // brighter where the stream is thick; the edge itself a fine line; a little light spilt outside. Nothing of it at
  // the canvas's top, where the arc's ends rise out of the picture, and a little less at its foot, where the
  // headline stands, than low on either side.
  float lower = smoothstep(0.02, 0.5, down);
  float sides = 0.62 + 0.38 * smoothstep(0.1, 0.7, abs(rel.x) / max(radius, 0.001));
  float band = inside * exp(-depth / (0.014 + 0.03 * stream));
  float fine = d / 0.0018;
  float line = exp(-fine * fine);
  float spill = (1.0 - inside) * exp(-max(d, 0.0) / 0.008);
  float a = (0.44 * band * (0.4 + 1.2 * stream) + 0.5 * line * (0.55 + 0.9 * stream) + 0.2 * spill) * lower * sides * (1.0 + 0.5 * glint) * shown;

  // inside it, the smoke of the light: most near the rim, thinning towards the drop's middle, none at the canvas's
  // top; and where the light on the rim is, a little more of it let in
  a += inside * (0.025 + 0.1 * smoke * smoke * 2.0) * smoothstep(0.02, 0.35, down) * (0.3 + 0.7 * exp(-depth / 0.13)) * shown;
  a += inside * 0.05 * glint * exp(d / 0.05) * shown;
#endif

  // soft rays out from the rim, as if it were drawn out towards a point below the drop (a zoom blur)
  vec2 from = vec2(0.5, centre.y + radius + 0.16);
  float rays = 0.0;
  for (int k = 1; k <= 6; k++) {
    float s = 1.0 - float(k) * 0.022;
    rays += exp(-abs(drop(from + (q - from) * s, 1.0)) / 0.006) / float(k + 1);
  }
  a += rays * 0.1 * (0.4 + lower) * (1.0 + 0.35 * glint) * shown;

#if !PLAIN
  // Dust in the air about the drop: specks out of focus, each a soft round, drifting slowly and coming and going a
  // little. The nearer a speck (the larger and softer it is), the more it moves against the pointer.
  float dust = 0.0;
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    float near = hash(vec2(fi, 5.5));
    vec2 home = vec2(0.04 + 0.92 * hash(vec2(fi, 1.7)), 0.02 + 0.5 * hash(vec2(fi, 9.3)));
    vec2 where = home
      + 0.014 * vec2(sin(t * (0.05 + 0.03 * hash(vec2(fi, 4.1))) + fi), cos(t * (0.04 + 0.03 * hash(vec2(fi, 6.6))) + fi * 1.7))
      - vec2(uPoint, uLift) * (0.003 + 0.012 * near);
    float size = 0.0014 + 0.005 * near;
    float far = length(q - where) / size;
    dust += (0.22 - 0.15 * near) * (0.7 + 0.3 * sin(t * 0.3 + fi * 2.3)) * exp(-far * far);
  }
  a += dust * shown;
#endif

  // (a step of a 255th, unseen, so the faint light has no bands)
  a = clamp(a + (hash(gl_FragCoord.xy) - 0.5) / 255.0, 0.0, 1.0);
  gl_FragColor = vec4(NEON * a, a);
}
`

/** `plain` (&arc=plain): as it was before, one line of Neon with a faint light inside. */
export function DropScene({ className, plain = false }: { className?: string; plain?: boolean }) {
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
    let comeAt: WebGLUniformLocation | null = null
    let pointAt: WebGLUniformLocation | null = null
    let made = false
    let shown = false
    let raf = 0
    let liftNow = 0
    let liftWant = 0
    let pointNow = 0
    let pointWant = 0
    // how far the stage has come up the screen, read when the page has been scrolled (then reading costs nothing)
    let come = 1
    const read = () => {
      come = (innerHeight - el.getBoundingClientRect().top) / Math.max(1, innerHeight)
    }
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
      // (the pointer is followed slowly, with some weight, as the reference's scene follows it)
      liftNow += (liftWant - liftNow) * 0.04
      pointNow += (pointWant - pointNow) * 0.03
      gl.uniform1f(time, still ? 12 : (now - began) / 1000)
      gl.uniform1f(lift, liftNow)
      gl.uniform1f(comeAt, still ? 1 : come)
      gl.uniform1f(pointAt, still ? 0 : pointNow)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const make = () => {
      if (made) return
      made = true
      gl = el.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' })
      if (!gl) return
      const shader = (type: number, source: string) => {
        const one = gl!.createShader(type)!
        gl!.shaderSource(one, source)
        gl!.compileShader(one)
        return one
      }
      const program = gl.createProgram()!
      const fragment = shader(gl.FRAGMENT_SHADER, `#define PLAIN ${plain ? 1 : 0}${FRAGMENT}`)
      gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX))
      gl.attachShader(program, fragment)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('The arc could not be drawn.', gl.getShaderInfoLog(fragment) || gl.getProgramInfoLog(program))
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
      comeAt = gl.getUniformLocation(program, 'uCome')
      pointAt = gl.getUniformLocation(program, 'uPoint')
      fit()
      read()
      draw(performance.now())
    }
    const loop = (now: number) => {
      raf = 0
      if (!shown || still) return
      // (on every frame: it grows with the scroll, which moves on every frame)
      draw(now)
      raf = requestAnimationFrame(loop)
    }
    const watch = new IntersectionObserver(([entry]) => {
      shown = entry.isIntersecting
      if (shown) {
        make()
        read()
        if (!raf && !still) raf = requestAnimationFrame(loop)
      }
    }, { rootMargin: '10% 0px' })
    watch.observe(el)
    const scrolled = () => {
      if (shown) read()
    }
    addEventListener('scroll', scrolled, { passive: true })
    const pointer = (event: PointerEvent) => {
      liftWant = Math.max(-1, Math.min(1, (event.clientY / innerHeight) * 2 - 1))
      pointWant = Math.max(-1, Math.min(1, (event.clientX / innerWidth) * 2 - 1))
    }
    addEventListener('pointermove', pointer, { passive: true })
    const resized = () => {
      if (!gl) return
      fit()
      read()
      draw(performance.now())
    }
    addEventListener('resize', resized)
    const stop = whenStill(make)
    return () => {
      watch.disconnect()
      removeEventListener('scroll', scrolled)
      removeEventListener('pointermove', pointer)
      removeEventListener('resize', resized)
      if (raf) cancelAnimationFrame(raf)
      stop()
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [plain])
  return <canvas ref={canvas} className={className} aria-hidden="true" />
}
