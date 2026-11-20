/**
 * The river under the app's stage headline (&ground=ink, AppStage.tsx): the journey's river, the road of light the
 * hero's gate pours out, coming out of the dark under the headline and winding towards the screen, the monitor
 * standing in it. It is the journey's own picture of the river (config.journey.picture), read as the journey reads it:
 * Neon where the picture is light, Ink where it is dark, and rippled by the same numbers, so it runs as the hero's
 * runs. The gate is not drawn: the headline stands where it would, on the Ink, and the gate's pour comes out of the
 * dark a little under it, falls, and turns into the river, which goes behind the monitor and is let go before the
 * picture's foot.
 *
 * One canvas, one program, one full-screen triangle; drawn at most 60 times a second, only while it is on the screen;
 * under reduced motion one picture. The context, the picture (unpacked off the main thread at half its size) and the
 * first drawing are made at a still moment, before the page reaches it. Where it stands: appStage.module.css.
 */
import { useEffect, useRef, type RefObject } from 'react'
import { config } from '../../config'
import { whenStill } from '../still'

const PICTURE = config.journey.picture

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))

/** In the picture's height (0 its foot, 1 its top): where the pour comes out of the dark (it comes in between the first
 *  two, under the gate's doorway), and where the river goes into it again (between the last two, before the foot). */
const FADE = [0.66, 0.6, 0.12, 0.001]
/** How wide the picture is laid, in the canvas's widths, and how far under the headline the pour comes out, in the
 *  same: on a wide screen, and on an upright or narrow one. */
const LAY = { wide: [1, 0.012], narrow: [2.5, 0.03] }

const FRAGMENT = `
precision highp float;
uniform vec2 uSize;     // the canvas, in its own pixels
uniform float uTime;    // seconds
uniform vec3 uLay;      // where the river's head stands (x, y down from the canvas's top) and how wide the picture is laid
uniform float uHave;    // 0 until the picture is in, then 1
uniform sampler2D uArt;

const vec3 INK = vec3(0.039, 0.039, 0.039);
const vec3 NEON = vec3(0.8, 1.0, 0.0);

float ss(float a, float b, float x) { return smoothstep(a, b, x); }
float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  float w = uLay.z;
  float h = w * ${f(PICTURE.size[1] / PICTURE.size[0])};
  // where this point lies in the picture: across, and up from its foot (the head, where it comes out, at uLay's point)
  vec2 tex = vec2(0.5 + (px.x - uLay.x) / w, ${f(FADE[0])} - (px.y - uLay.y) / h);
  float t = uTime;
  // (the journey's ripple, number for number: none at the head, more and more down the river)
  float riverDepth = clamp((0.48 - tex.y) / 0.48, 0.0, 1.0);
  float riverWeight = ss(0.0, 0.65, riverDepth);
  float travel = riverDepth * 8.5 - t * 0.48;
  float meander = 0.048 * sin(travel) + 0.022 * sin(riverDepth * 15.0 - t * 0.31 + 1.4);
  float breathing = 1.0 + riverWeight * 0.065 * sin(riverDepth * 10.0 - t * 0.38);
  tex.x = 0.5 + (tex.x - 0.5) / breathing + meander * riverWeight;
  tex.y += 0.012 * sin(riverDepth * 12.0 - t * 0.48) * riverWeight;
  tex.x += 0.006 * sin(riverDepth * 24.0 - t * 0.85) * riverWeight;
  // (past the picture's sides its last few hundredths are drawn out, as the journey does)
  float over = abs(tex.x - 0.5) - ${f(0.5 - PICTURE.margin)};
  if (over > 0.0) tex.x = 0.5 + sign(tex.x - 0.5) * (0.5 - ${f(PICTURE.margin)} * exp(-over / ${f(PICTURE.margin)}));
  vec3 art = texture2D(uArt, vec2(tex.x, 1.0 - tex.y)).rgb * step(0.0, tex.y) * step(tex.y, 1.0);
  // how lit: as light as the picture is there, in a straight line, a shade deeper where it runs cool (the journey's)
  float light = clamp((dot(art, vec3(0.3, 0.59, 0.11)) - ${f(PICTURE.light[0])}) / ${f(PICTURE.light[1] - PICTURE.light[0])}, 0.0, 1.0);
  light *= 1.0 - ${f(PICTURE.tone[0])} * ss(${f(PICTURE.tone[1])}, ${f(PICTURE.tone[2])}, art.b - art.r);
  // (out of the dark at its head, and into it again before the picture's foot)
  light *= ss(${f(FADE[0])}, ${f(FADE[1])}, tex.y) * ss(${f(FADE[3])}, ${f(FADE[2])}, tex.y) * uHave;
  vec3 col = mix(INK, NEON, light);
  // a breath of grain, so the long falloff cannot band
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`

/** `head`: the element the pour comes out under (a little under its foot, and in the middle across). */
export function RiverScene({ className, head }: { className?: string; head: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let gl: WebGLRenderingContext | null = null
    let u: Record<'size' | 'time' | 'lay' | 'have', WebGLUniformLocation | null> = { size: null, time: null, lay: null, have: null }
    let made = false
    let shown = false
    let disposed = false
    /** when the picture was handed to the driver (it comes in over 0.9 s), or 0 */
    let haveAt = 0
    let raf = 0
    let last = 0
    let scale = 1
    const began = performance.now()

    const narrow = () => innerWidth < 1024 || innerWidth <= innerHeight
    const fit = () => {
      // (the river is soft: drawn at three quarters of the screen's pixels, or half on a phone's)
      scale = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 1024 ? 0.5 : 0.75)
      const w = Math.max(1, Math.round(el.clientWidth * scale))
      const h = Math.max(1, Math.round(el.clientHeight * scale))
      if (el.width !== w || el.height !== h) {
        el.width = w
        el.height = h
      }
      if (!gl) return
      gl.viewport(0, 0, w, h)
      gl.uniform2f(u.size, w, h)
      // (the head: under the headline, by its own measures; both are laid in the stage, so offsets are enough)
      const words = head.current
      const foot = words ? words.offsetTop + words.offsetHeight - el.offsetTop : el.clientHeight * 0.3
      const [spread, gap] = narrow() ? LAY.narrow : LAY.wide
      gl.uniform3f(u.lay, w / 2, (foot + el.clientWidth * gap) * scale, w * spread)
    }
    const draw = (now: number) => {
      if (!gl) return
      gl.uniform1f(u.time, still ? 12 : (now - began) / 1000)
      const k = haveAt ? Math.min(1, (now - haveAt) / 900) : 0
      gl.uniform1f(u.have, still ? (haveAt ? 1 : 0) : k * k * (3 - 2 * k))
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
      u = {
        size: gl.getUniformLocation(program, 'uSize'),
        time: gl.getUniformLocation(program, 'uTime'),
        lay: gl.getUniformLocation(program, 'uLay'),
        have: gl.getUniformLocation(program, 'uHave'),
      }
      // (an empty picture until the river's comes: the program has a texture to read from the first drawing)
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.uniform1i(gl.getUniformLocation(program, 'uArt'), 0)
      fit()
      draw(performance.now())
      // the picture: asked for across origins (as the journey asks), unpacked off the main thread at half its size
      // (the river is soft), then handed to the driver at a still moment
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.onload = () => {
        const hand = (source: TexImageSource) => {
          if (disposed || !gl) return
          gl.bindTexture(gl.TEXTURE_2D, texture)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
          haveAt = performance.now()
          draw(haveAt)
        }
        // (on the screen already: at once; otherwise at a still moment)
        const give = (source: TexImageSource) => (shown ? hand(source) : whenStill(() => hand(source)))
        if (typeof createImageBitmap === 'function')
          createImageBitmap(img, { resizeWidth: Math.round(PICTURE.size[0] / 2), resizeHeight: Math.round(PICTURE.size[1] / 2), resizeQuality: 'high' }).then(give, () => give(img))
        else give(img)
      }
      img.src = PICTURE.url
    }
    const loop = (now: number) => {
      raf = 0
      if (!shown || still) return
      // (at most 60 pictures a second: the river moves slowly)
      if (now - last >= 15.5) {
        last = now
        draw(now)
      }
      raf = requestAnimationFrame(loop)
    }
    const watch = new IntersectionObserver(
      ([entry]) => {
        shown = entry.isIntersecting
        if (shown) {
          make()
          if (!raf && !still) raf = requestAnimationFrame(loop)
        }
      },
      { rootMargin: '10% 0px' },
    )
    watch.observe(el)
    const resized = () => {
      if (!gl) return
      fit()
      draw(performance.now())
    }
    addEventListener('resize', resized)
    const stop = whenStill(make)
    return () => {
      disposed = true
      watch.disconnect()
      removeEventListener('resize', resized)
      if (raf) cancelAnimationFrame(raf)
      stop()
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [head])
  return <canvas ref={canvas} className={className} aria-hidden="true" />
}
