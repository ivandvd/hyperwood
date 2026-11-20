/**
 * The liquid of the page's two liquid cards (the foot's: foot/LiquidFoot.tsx; and why no one can trade ahead of an
 * order: Ahead.tsx), after a reference's (a footer by Kevser, x.com/kevserctk, read frame by frame: a broad lit
 * surface in one hue that runs like a liquid, black where it folds away from the light, the body of the hue, pale
 * where the light is, the folds soft on one side and sharp on the other). Ours in the page's colours: a deep green,
 * then lime and Hyper Neon where the light is; never paler than Neon.
 *
 * It is one surface drawn along by another, each moving its own way (so it runs and does not slide), and a second
 * surface for the fold: where that one crosses its middle the liquid goes dark, softly on the side the light leaves
 * and sharply where it comes back, and lies a little darker beyond.
 *
 * The card's words stand in its middle, and the liquid makes room for them in one of two ways:
 * - the foot's: the middle of the card is kept light and free of folds, and the words are Ink on it. The folds are
 *   the page's Ink;
 * - with `seal` (no one can trade ahead): the words stand in a capsule of the page's Ink, an element of the page
 *   laid over the liquid, and the liquid is a stream that runs past it. The capsule is given here (`seal`) so that
 *   the stream knows where it is: the liquid is looked up along the stream's own lines round the capsule (the height
 *   above the capsule's middle, taken to nothing at its outline), so it parts at the capsule's nose, runs along it
 *   and closes behind it. And there is no black in this liquid: its darkest is a deep green and its folds are creases
 *   of that green, so that all the black in the card is the capsule's, and its outline is never lost in a fold.
 *
 * One canvas, one program, one triangle; drawn at most 60 times a second and only while on the screen; the program
 * and its first picture are made at a still moment. Under reduced motion one picture. (Worked out first as the same
 * sums in numpy, beside the reference's frames, before it was a shader.)
 */
import { type RefObject, useEffect, useRef } from 'react'
import { whenStill } from '../../still'

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

const FRAGMENT = `
precision highp float;
uniform vec2 uSize;    // the canvas, in its pixels
uniform float uTime;   // seconds
uniform vec4 uSeal;    // the capsule: its centre and its half width and half height, in the canvas's pixels
uniform float uRound;  // the radius of its corners

const vec3 INK = vec3(0.039, 0.039, 0.039);
const vec3 DEEP = vec3(0.02, 0.085, 0.075);
const vec3 GREEN = vec3(0.035, 0.15, 0.075);
const vec3 CREASE = vec3(0.02, 0.085, 0.055);
const vec3 BODY = vec3(0.16, 0.36, 0.10);
const vec3 LIME = vec3(0.56, 0.80, 0.03);
const vec3 NEON = vec3(0.8, 1.0, 0.0);

float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 q) {
  vec2 i = floor(q), f = fract(q);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// two rounds of it, spread over 0 to 1: broad and smooth
float field(vec2 q) { return (0.5 * noise(q) + 0.25 * noise(q * 2.03 + vec2(1.7, 9.2))) / 0.75; }

void main() {
  vec2 at = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  float t = uTime;

#if SEALED
  // How far outside the capsule this is; and the height above the capsule's middle, taken to nothing at its outline
  // over half the card's height: the stream's own lines, which part at the nose and close behind the tail.
  vec2 c = at - uSeal.xy;
  vec2 e = abs(c) - (uSeal.zw - uRound);
  float d = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - uRound;
  float k = clamp(d / (0.5 * uSize.y), 0.0, 1.0);
  float k2 = k * k;
  float lift = k * (15.0 - 10.0 * k2 + 3.0 * k2 * k2) / 8.0;
  // (the card's height is the measure both ways, or seven tenths of its width where it is upright and narrow; the
  // shapes a little less broad than the foot's, and more of it light, so that whatever the moment there is light
  // somewhere in the stream round the capsule)
  vec2 p = vec2(at.x, uSeal.y + c.y * lift) / min(uSize.y, 0.7 * uSize.x) * 0.75;
  // the stream runs to the right: the surface, what draws it along and the fold all go that way, each at its own pace
  vec2 q = vec2(field(p + vec2(-0.17 * t, -0.05 * t)), field(p + vec2(5.2 - 0.07 * t, 1.3 + 0.08 * t)));
  float h = field(p + 1.9 * q + vec2(-0.09 * t, 0.0));
  float g = field(p * 0.8 + 1.6 * q.yx + vec2(3.1 - 0.12 * t, 7.7 + 0.02 * t));
  float x = 0.16 + 0.84 * smoothstep(0.26, 0.72, h);
  float keep = 1.0;
  vec3 col = mix(GREEN, BODY, smoothstep(0.0, 0.5, x));
#else
  // (the card's height is the measure both ways, so the liquid's shapes are as broad as the card is tall)
  vec2 p = at / uSize.y * 0.62;
  // the surface, drawn along by another; and the fold's surface, drawn along by the same
  vec2 q = vec2(field(p + vec2(0.23 * t, -0.14 * t)), field(p + vec2(5.2 - 0.17 * t, 1.3 + 0.21 * t)));
  float h = field(p + 1.9 * q + vec2(0.10 * t, -0.07 * t));
  float g = field(p * 0.8 + 1.6 * q.yx + vec2(3.1 - 0.12 * t, 7.7 + 0.14 * t));
  // the middle of the card, where the words stand: kept light, and free of folds (on an upright card the words
  // and the buttons under them fill it from side to side and nearly from top to foot, so the light part does too:
  // only its corners and edges are left to the dark)
  vec2 reach = mix(vec2(0.78, 0.70), vec2(0.27, 0.46), smoothstep(1.2, 2.0, uSize.x / uSize.y));
  float mid = 1.0 - smoothstep(0.5, 1.3, length((at / uSize - vec2(0.5, 0.52)) / reach));
  float x = smoothstep(0.30, 0.78, h);
  x = mix(x, 0.7 + 0.3 * x, mid);
  float keep = 1.0 - mid;
  vec3 col = mix(DEEP, BODY, smoothstep(0.0, 0.5, x));
#endif

  col = mix(col, LIME, smoothstep(0.45, 0.8, x));
  col = mix(col, NEON, smoothstep(0.72, 0.98, x));
  // the fold: soft where the light leaves it, sharp where it comes back; and the liquid a little darker beyond it,
  // as if it lay in the fold's shadow
  float fold = smoothstep(0.36, 0.5, g) * (1.0 - smoothstep(0.5, 0.535, g)) * keep;
#if SEALED
  col = mix(col, CREASE, 0.86 * fold);
#else
  col = mix(col, INK, 0.96 * fold);
#endif
  col *= 1.0 - 0.35 * smoothstep(0.5, 0.75, g) * keep;

  // (a step of a 255th, unseen, so its broad soft turns of colour have no bands)
  col += (hash(gl_FragCoord.xy + 0.37) - 0.5) / 255.0;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

export function FlowLiquid({ className, seal }: { className?: string; seal?: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const capsule = seal?.current ?? null
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let gl: WebGLRenderingContext | null = null
    let size: WebGLUniformLocation | null = null
    let time: WebGLUniformLocation | null = null
    let sealAt: WebGLUniformLocation | null = null
    let round: WebGLUniformLocation | null = null
    let made = false
    let shown = false
    let raf = 0
    let last = 0
    const began = performance.now()
    const fit = () => {
      // (it is all broad, soft shapes: drawn at three quarters of the screen's pixels, or half on a phone's)
      const scale = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 1024 ? 0.5 : 0.75)
      const w = Math.max(1, Math.round(el.clientWidth * scale))
      const h = Math.max(1, Math.round(el.clientHeight * scale))
      if (el.width !== w || el.height !== h) {
        el.width = w
        el.height = h
      }
      if (!gl) return
      gl.viewport(0, 0, w, h)
      gl.uniform2f(size, w, h)
      if (!capsule) return
      // where the capsule is on the canvas (both are in the card, so whatever moves the card moves both)
      const box = el.getBoundingClientRect()
      const cap = capsule.getBoundingClientRect()
      if (!box.width || !box.height) return
      const kx = w / box.width
      const ky = h / box.height
      const radius = Math.min(parseFloat(getComputedStyle(capsule).borderTopLeftRadius) || 0, cap.width / 2, cap.height / 2)
      gl.uniform4f(sealAt, (cap.left + cap.width / 2 - box.left) * kx, (cap.top + cap.height / 2 - box.top) * ky, (cap.width / 2) * kx, (cap.height / 2) * ky)
      gl.uniform1f(round, radius * ky)
    }
    const draw = (now: number) => {
      if (!gl) return
      gl.uniform1f(time, still ? 7 : (now - began) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const make = () => {
      if (made) return
      made = true
      gl = el.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
      if (!gl) return
      const shader = (type: number, source: string) => {
        const one = gl!.createShader(type)!
        gl!.shaderSource(one, source)
        gl!.compileShader(one)
        return one
      }
      const program = gl.createProgram()!
      const fragment = shader(gl.FRAGMENT_SHADER, `#define SEALED ${capsule ? 1 : 0}${FRAGMENT}`)
      gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX))
      gl.attachShader(program, fragment)
      gl.bindAttribLocation(program, 0, 'p')
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('The liquid could not be drawn.', gl.getShaderInfoLog(fragment) || gl.getProgramInfoLog(program))
        gl = null
        return
      }
      gl.useProgram(program)
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      size = gl.getUniformLocation(program, 'uSize')
      time = gl.getUniformLocation(program, 'uTime')
      sealAt = gl.getUniformLocation(program, 'uSeal')
      round = gl.getUniformLocation(program, 'uRound')
      fit()
      draw(performance.now())
      el.setAttribute('data-drawn', '')
    }
    const loop = (now: number) => {
      raf = 0
      if (!shown || still) return
      if (now - last >= 15.5) {
        last = now
        draw(now)
      }
      raf = requestAnimationFrame(loop)
    }
    const watch = new IntersectionObserver(
      ([entry]) => {
        shown = entry.isIntersecting
        if (!shown) return
        make()
        if (still) draw(performance.now())
        else if (!raf) raf = requestAnimationFrame(loop)
      },
      { rootMargin: '15% 0px' },
    )
    watch.observe(el)
    // (the card, or the capsule in it, changes its size: with the window, or when the words' face has come)
    const sized = new ResizeObserver(() => {
      if (!gl) return
      fit()
      draw(performance.now())
    })
    sized.observe(el)
    if (capsule) sized.observe(capsule)
    const stop = whenStill(make)
    return () => {
      watch.disconnect()
      sized.disconnect()
      if (raf) cancelAnimationFrame(raf)
      stop()
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [seal])
  return <canvas ref={canvas} className={className} aria-hidden="true" />
}
