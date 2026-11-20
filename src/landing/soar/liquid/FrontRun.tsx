/**
 * The Investor Overview's sandwich example as a liquid engine (Ahead.tsx), drawn on the GPU: two lanes, a public venue
 * above and Hyperwood below, each a $40,000 market buy flowing as a drop of Neon liquid from the left into the book at
 * the right, a vessel whose level is the price.
 *
 * On the public venue the order is readable: a grey drop (a bot) comes up under it, touches it (runs into it, for a
 * moment: it reads it), races ahead and dives into the book first, and the level climbs from $184.00 to $185.60; the
 * order arrives and fills up there; then the bot pulls back out of the book with a drop of the order's light, the
 * level falls back, and that drop is the $1,400. On Hyperwood the order travels sealed, inside a bead of dark glass
 * with its light at the middle: the bot comes up to it but cannot run into it (they are not one liquid), and sinks
 * away; the order goes into the book, its seal opens there, and it fills at $184.00.
 *
 * The liquid is drawn by one fragment shader: each drop a field, the fields added (so drops that meet run together, as
 * liquid does), the book's liquid a field of its own that drops run into, lit as a glossy liquid from the field's
 * slope (a light from the upper left and its highlight), Neon where it is the order's, grey where it is the bot's, the
 * two mixed where they have met. The words over it (Ahead.tsx) are placed by this component every frame.
 *
 * One canvas, one program, one triangle; drawn at most 60 times a second while on the screen, from the start each
 * time it comes back onto it; the program and its first drawing are made at a still moment. Under reduced motion the
 * end of the story is shown, still.
 */
import { useEffect, useRef } from 'react'
import { whenStill } from '../../still'
import { LEVEL, STORY, fadeAt, storyAt, type Story } from './frontRunStory'

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;         // the canvas, in its pixels
uniform vec4 uLane[2];     // each lane: left, top, width, height (pixels, from the top)
uniform vec4 uBook[2];     // each lane's book: left, top, right, bottom
uniform vec4 uLevel[2];    // each lane's level (its height from the top), how much it is thrown up
uniform vec4 uDrop[8];     // the drops: x, y, radius, and lane * 10 + kind (0 the order's light, 1 a bot)
uniform vec4 uSeal;        // the Hyperwood order's glass: x, y, radius, how much it is there
uniform float uTime;
uniform float uScale;      // pixels per unit of the lane (its height): for the light's slope and the edges' width
uniform float uFade;

const vec3 NEON = vec3(0.8, 1.0, 0.0);
const vec3 DEEP = vec3(0.24, 0.31, 0.02);
const vec3 PALE = vec3(0.84, 0.85, 0.8);
const vec3 GREY = vec3(0.24, 0.25, 0.23);
const vec3 LIGHT = vec3(-0.42, -0.58, 0.7);

// a liquid lit from its field: where it is (its edge smoothed to a pixel), its colour by how much of it is whose, its
// height (sqrt(1 - 1/f): a drop alone is a half sphere, and drops that meet run into one smoothly) and so its slope,
// a soft light from the upper left and its highlight; deep: how far into a body of it (darker as it goes down);
// premultiplied
vec4 liquid(float f, vec2 g, float mine, float theirs, float deep) {
  float edge = length(g) * 0.8 + 0.0001;
  float a = smoothstep(1.0 - edge, 1.0 + edge, f);
  if (a <= 0.0) return vec4(0.0);
  float fs = max(f, 1.0001);
  float h = sqrt(1.0 - 1.0 / fs);
  vec2 slope = g * (0.5 / max(h, 0.06)) / (fs * fs);
  vec3 n = normalize(vec3(-slope * 0.13 * uScale, 1.0));
  vec3 l = normalize(LIGHT);
  float lit = max(dot(n, l), 0.0);
  float hi = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);
  float bot = theirs / max(mine + theirs, 0.0001);
  vec3 neon = mix(mix(DEEP, NEON, 0.25 + 0.75 * lit), DEEP * 0.9, deep);
  vec3 base = mix(neon, mix(GREY, PALE, 0.3 + 0.7 * lit), bot);
  vec3 c = base * (0.78 + 0.22 * n.z) + hi * 0.75 * vec3(1.0, 1.0, 0.88);
  return vec4(c * a, a);
}
vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float lane = -1.0;
  for (int j = 0; j < 2; j++) {
    vec4 r = uLane[j];
    if (p.x >= r.x && p.x < r.x + r.z && p.y >= r.y && p.y < r.y + r.w) lane = float(j);
  }
  if (lane < 0.0) { gl_FragColor = vec4(0.0); return; }

  // the drops: the order's light and (on the public venue) the bot in one liquid; Hyperwood's bot in one of its own
  float f = 0.0; vec2 g = vec2(0.0); float mine = 0.0; float theirs = 0.0;
  float fb = 0.0; vec2 gb = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    vec4 d = uDrop[i];
    float l = floor(d.w / 10.0 + 0.01);
    if (l != lane || d.z <= 0.0) continue;
    float kind = d.w - l * 10.0;
    vec2 v = p - d.xy;
    float q = dot(v, v) + 1.0;
    float k = d.z * d.z / q;
    vec2 gk = -2.0 * k / q * v;
    if (kind > 0.5 && lane > 0.5) { fb += k; gb += gk; }
    else { f += k; g += gk; if (kind > 0.5) theirs += k; else mine += k; }
  }
  // the book's liquid, up to its level, its surface moving and thrown up by what falls into it
  float deep = 0.0;
  for (int j = 0; j < 2; j++) {
    if (float(j) != lane) continue;
    vec4 b = uBook[j];
    vec4 lv = uLevel[j];
    float s = 0.07 * uScale;
    float surface = lv.x + sin(p.x / uScale * 9.0 + uTime * 2.3) * (0.006 + lv.y) * uScale + sin(p.x / uScale * 4.1 - uTime * 1.4) * 0.005 * uScale;
    float inside = smoothstep(b.x, b.x + 0.02 * uScale, p.x) * smoothstep(b.z, b.z - 0.02 * uScale, p.x) * smoothstep(b.w, b.w - 0.02 * uScale, p.y);
    float k = inside * min(exp((p.y - surface) / s), 40.0);
    f += k; g += vec2(0.0, k / s); mine += k;
    deep = smoothstep(0.0, 0.5 * uScale, p.y - surface) * 0.55;
  }

  vec4 c = liquid(f, g, mine, theirs, deep);
  if (fb > 0.0) c = over(liquid(fb, gb, 0.0, 1.0, 0.0), c);
  // the seal: a bead of dark glass about the order, its light seen at its middle; a hairline rim, a highlight
  if (lane > 0.5 && uSeal.w > 0.0) {
    vec2 v = p - uSeal.xy;
    float d = length(v);
    float R = uSeal.z;
    float shell = smoothstep(R + 1.0, R - 1.0, d) * uSeal.w;
    vec3 glass = mix(vec3(0.05, 0.055, 0.045), vec3(0.17, 0.18, 0.15), smoothstep(R * 0.4, R, d));
    float hl = smoothstep(0.42, 0.0, length((v / R - vec2(-0.32, -0.42)) * vec2(1.0, 1.9)));
    glass += hl * 0.5;
    float core = smoothstep(R * 0.46, R * 0.34, d);
    vec3 bead = mix(glass, NEON * (0.78 + 0.22 * (1.0 - d / R)), core);
    bead += smoothstep(1.4, 0.0, abs(d - R + 0.6)) * 0.42;
    c = over(vec4(bead * shell, shell), c);
  }
  gl_FragColor = c * uFade;
}
`



/** `onFrame` places the words over the liquid: it is given the story, each lane's box (pixels of the canvas's box,
 *  from its top left) and the lanes' unit (pixels per lane height). */
export function FrontRun({ className, onFrame }: { className?: string; onFrame?: (story: Story, lanes: { x: number; y: number; w: number; h: number }[], fade: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const frame = useRef(onFrame)
  useEffect(() => {
    frame.current = onFrame
  })
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let gl: WebGLRenderingContext | null = null
    const u: Record<string, WebGLUniformLocation | null> = {}
    let made = false
    let shown = false
    let raf = 0
    let last = 0
    let began = 0
    let scale = 1
    /** the lanes in css pixels of the canvas's box */
    let lanes: { x: number; y: number; w: number; h: number }[] = []

    const lay = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const gap = h * 0.04
      const lh = (h - gap) / 2
      lanes = [
        { x: 0, y: 0, w, h: lh },
        { x: 0, y: lh + gap, w, h: lh },
      ]
    }
    const fit = () => {
      scale = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 1024 ? 0.75 : 0.85)
      const w = Math.max(1, Math.round(el.clientWidth * scale))
      const h = Math.max(1, Math.round(el.clientHeight * scale))
      if (el.width !== w || el.height !== h) {
        el.width = w
        el.height = h
      }
      lay()
      if (!gl) return
      gl.viewport(0, 0, w, h)
      gl.uniform2f(u.res, w, h)
    }
    const draw = (t: number) => {
      lay()
      const lane0 = lanes[0]
      const unit = lane0.h
      const wide = lane0.w / unit
      const s = storyAt(t, wide)
      const fade = still ? 1 : fadeAt(t)
      frame.current?.(s, lanes, fade)
      if (!gl) return
      const k = scale
      // lanes and books, in the canvas's own pixels
      const lane = (i: number) => lanes[i]
      const lanesData = new Float32Array(8)
      const books = new Float32Array(8)
      const levels = new Float32Array(8)
      for (let i = 0; i < 2; i++) {
        const L = lane(i)
        lanesData.set([L.x * k, L.y * k, L.w * k, L.h * k], i * 4)
        books.set([(L.x + L.w * 0.78) * k, (L.y + L.h * 0.1) * k, (L.x + L.w * 0.95) * k, (L.y + L.h * 0.92) * k], i * 4)
        const level = i === 0 ? s.publicLevel : LEVEL.base
        const splash = i === 0 ? s.publicSplash : s.hyperwoodSplash
        levels.set([(L.y + L.h * level) * k, splash, 0, 0], i * 4)
      }
      const at = (i: number, xu: number, yu: number) => [(lane(i).x + xu * unit) * k, (lane(i).y + yu * unit) * k]
      const drops = new Float32Array(32)
      const put = (n: number, i: number, xu: number, yu: number, r: number, kind: number) => {
        const [px, py] = at(i, xu, yu)
        drops.set([px, py, r * unit * k, i * 10 + kind], n * 4)
      }
      put(0, 0, s.order.x, s.order.yPublic, s.order.r, 0)
      put(1, 0, s.publicBot.x, s.publicBot.y, s.publicBot.r, 1)
      put(2, 0, s.taken.x, s.taken.y, s.taken.r, 0)
      put(3, 1, s.order.x, s.order.yHyperwood, s.order.r * (0.62 + 0.38 * (1 - s.seal.there)), 0)
      put(4, 1, s.hyperwoodBot.x, s.hyperwoodBot.y, s.hyperwoodBot.r, 1)
      const [sx, sy] = at(1, s.seal.x, s.order.yHyperwood)
      gl.uniform4fv(u.lane, lanesData)
      gl.uniform4fv(u.book, books)
      gl.uniform4fv(u.level, levels)
      gl.uniform4fv(u.drop, drops)
      gl.uniform4f(u.seal, sx, sy, s.seal.r * unit * k, s.seal.there * (s.seal.r > 0 ? 1 : 0))
      gl.uniform1f(u.time, t)
      gl.uniform1f(u.scale, unit * k)
      gl.uniform1f(u.fade, fade)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const make = () => {
      if (made) return
      made = true
      gl = el.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
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
      gl.bindAttribLocation(program, 0, 'p')
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl = null
        return
      }
      gl.useProgram(program)
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      for (const [key, name] of [['res', 'uRes'], ['lane', 'uLane'], ['book', 'uBook'], ['level', 'uLevel'], ['drop', 'uDrop'], ['seal', 'uSeal'], ['time', 'uTime'], ['scale', 'uScale'], ['fade', 'uFade']])
        u[key] = gl.getUniformLocation(program, name)
      fit()
      // (the first drawing, at a still moment: the middle of the story, where the most is drawn)
      draw(still ? STORY.fadeFrom - 0.1 : 1.6)
    }
    const loop = (now: number) => {
      raf = 0
      if (!shown || still) return
      if (!began) began = now
      if (now - last >= 15.5) {
        last = now
        draw(((now - began) / 1000) % STORY.length)
      }
      raf = requestAnimationFrame(loop)
    }
    const watch = new IntersectionObserver(
      ([entry]) => {
        shown = entry.isIntersecting
        if (!shown) {
          began = 0
          return
        }
        make()
        if (still) draw(STORY.fadeFrom - 0.1)
        else if (!raf) raf = requestAnimationFrame(loop)
      },
      { threshold: 0.6 },
    )
    watch.observe(el)
    const resized = () => {
      if (!gl) return
      fit()
      draw(still ? STORY.fadeFrom - 0.1 : 0)
    }
    addEventListener('resize', resized)
    const stop = whenStill(make)
    return () => {
      watch.disconnect()
      removeEventListener('resize', resized)
      if (raf) cancelAnimationFrame(raf)
      stop()
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])
  return <canvas ref={canvas} className={className} aria-hidden="true" />
}
