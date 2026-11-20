/**
 * A sea of points (the part on what Hyperwood is building, &ground=ink, soar/Building.tsx), as Hyperliquid's site shows
 * its own (a film of a sheet of dots in perspective that swells like a liquid, where dots that come close run together):
 * ours drawn live, in the page's colours, Hyper Neon on the Ink. A grid of points on a swelling plane, seen from a little
 * above and turned, each drawn as a soft round spot added into a picture at half the canvas's size; a second pass lets
 * through only where the spots add up past a line, so each is a crisp dot and two that come close run together, as two
 * drops do. The far ones fade into the Ink.
 *
 * One canvas, two programs; drawn at most 60 times a second, only while on the screen; under reduced motion one picture.
 * The programs, the half-size picture and the first drawing are made at a still moment, before the page reaches it (a
 * program made, or first drawn, as it came onto the screen would hold a frame back).
 */
import { useEffect, useRef } from 'react'
import { whenStill } from '../still'

/** the sheet: its points across and deep (fewer on a narrow screen), and the camera over it */
const SHEET = {
  across: 64,
  deep: 24,
  narrowAcross: 34,
  narrowDeep: 20,
  /** half its breadth and its depth, in its own units */
  half: 7,
  depth: 9,
}
const CAMERA = { eye: [0, 1.5, -2.6], at: [0.6, -0.15, 3.6], fov: 34, narrowFov: 40, roll: -11 }
/** how large a point is (its spot, before the line cuts it to a dot), in the half-size picture's pixels at depth one */
const SPOT = 40

const POINTS_VERTEX = `
attribute vec3 aP;          // across (-1 to 1), deep (0 to 1), and a number of its own (0 to 1)
uniform mat4 uView;
uniform float uTime;
uniform float uSpot;
uniform vec2 uSheet;        // half its breadth, its depth
void main() {
  float x = aP.x * uSheet.x;
  float z = aP.y * uSheet.y;
  float t = uTime;
  // the swell: three slow waves across it, and a little of each point's own
  float y = 0.34 * sin(x * 0.42 + z * 0.31 + t * 0.42)
          + 0.20 * sin(x * 0.83 - z * 0.57 - t * 0.61)
          + 0.12 * sin(z * 1.13 + x * 0.21 + t * 0.33)
          + 0.03 * sin(t * 1.7 + aP.z * 40.0);
  vec4 p = uView * vec4(x, y, z, 1.0);
  gl_Position = p;
  gl_PointSize = uSpot * (0.75 + 0.5 * aP.z) / max(p.w, 0.3);
}
`
const POINTS_FRAGMENT = `
precision mediump float;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float f = max(0.0, 1.0 - dot(c, c));
  gl_FragColor = vec4(f * f, 0.0, 0.0, 1.0);
}
`
const SCREEN_VERTEX = `attribute vec2 p; varying vec2 vUv; void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`
const SCREEN_FRAGMENT = `
precision mediump float;
uniform sampler2D uField;
varying vec2 vUv;
const vec3 INK = vec3(0.039, 0.039, 0.039);
const vec3 NEON = vec3(0.8, 1.0, 0.0);
void main() {
  float f = texture2D(uField, vUv).r;
  float dot = smoothstep(0.4, 0.56, f);
  // (the far ones, higher on the screen, fade into the Ink)
  float near = 1.0 - 0.6 * smoothstep(0.35, 0.95, vUv.y);
  gl_FragColor = vec4(mix(INK, NEON, dot * near), 1.0);
}
`

/* ------------------------------------------------------------------ a small matrix kit */
type M4 = Float32Array
const perspective = (fovDeg: number, aspect: number, near: number, far: number): M4 => {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360)
  const nf = 1 / (near - far)
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0])
}
const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: number[]) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
/** a camera at `eye` looking at `at`, turned about its own line by `roll` degrees (right-handed, looking down -z) */
const lookAt = (eye: number[], at: number[], roll: number): M4 => {
  const zAxis = norm(sub(eye, at))
  const r = (roll * Math.PI) / 180
  const up0 = [Math.sin(r), Math.cos(r), 0]
  const xAxis = norm(cross(up0, zAxis))
  const yAxis = cross(zAxis, xAxis)
  return new Float32Array([xAxis[0], yAxis[0], zAxis[0], 0, xAxis[1], yAxis[1], zAxis[1], 0, xAxis[2], yAxis[2], zAxis[2], 0, -dot3(xAxis, eye), -dot3(yAxis, eye), -dot3(zAxis, eye), 1])
}
const multiply = (a: M4, b: M4): M4 => {
  const o = new Float32Array(16)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]
  return o
}

export function ParticleSea({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let gl: WebGLRenderingContext | null = null
    let points: WebGLProgram | null = null
    let screen: WebGLProgram | null = null
    let pointBuffer: WebGLBuffer | null = null
    let screenBuffer: WebGLBuffer | null = null
    let field: WebGLTexture | null = null
    let frame: WebGLFramebuffer | null = null
    let count = 0
    let fw = 1
    let fh = 1
    const u: Record<string, WebGLUniformLocation | null> = {}
    let made = false
    let shown = false
    let raf = 0
    let last = 0
    const began = performance.now()

    const narrow = () => innerWidth < 1024 || innerWidth <= innerHeight
    const fit = () => {
      // (the dots are drawn crisp by the second pass: three quarters of the screen's pixels are enough, half on a phone)
      const scale = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 1024 ? 0.6 : 0.75)
      const w = Math.max(1, Math.round(el.clientWidth * scale))
      const h = Math.max(1, Math.round(el.clientHeight * scale))
      if (el.width !== w || el.height !== h) {
        el.width = w
        el.height = h
      }
      if (!gl || !field) return
      fw = Math.max(1, Math.round(w / 2))
      fh = Math.max(1, Math.round(h / 2))
      gl.bindTexture(gl.TEXTURE_2D, field)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      const view = multiply(perspective(narrow() ? CAMERA.narrowFov : CAMERA.fov, w / h, 0.1, 60), lookAt(CAMERA.eye, CAMERA.at, CAMERA.roll))
      gl.useProgram(points)
      gl.uniformMatrix4fv(u.view, false, view)
      // (a spot as large on any screen, against the picture's height)
      gl.uniform1f(u.spot, (SPOT * fh) / 260)
    }
    const draw = (now: number) => {
      if (!gl || !points || !screen) return
      // the spots, added up, into the half-size picture
      gl.bindFramebuffer(gl.FRAMEBUFFER, frame)
      gl.viewport(0, 0, fw, fh)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(points)
      gl.uniform1f(u.time, still ? 4 : (now - began) / 1000)
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)
      gl.drawArrays(gl.POINTS, 0, count)
      gl.disable(gl.BLEND)
      // and through the line, onto the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, el.width, el.height)
      gl.useProgram(screen)
      gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.bindTexture(gl.TEXTURE_2D, field)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const make = () => {
      if (made) return
      made = true
      gl = el.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' })
      if (!gl) return
      const program = (vs: string, fs: string) => {
        const shader = (type: number, source: string) => {
          const one = gl!.createShader(type)!
          gl!.shaderSource(one, source)
          gl!.compileShader(one)
          return one
        }
        const p = gl!.createProgram()!
        gl!.attachShader(p, shader(gl!.VERTEX_SHADER, vs))
        gl!.attachShader(p, shader(gl!.FRAGMENT_SHADER, fs))
        // (both programs read their one attribute from the same place)
        gl!.bindAttribLocation(p, 0, vs.includes('aP') ? 'aP' : 'p')
        gl!.linkProgram(p)
        return gl!.getProgramParameter(p, gl!.LINK_STATUS) ? p : null
      }
      points = program(POINTS_VERTEX, POINTS_FRAGMENT)
      screen = program(SCREEN_VERTEX, SCREEN_FRAGMENT)
      if (!points || !screen) {
        gl = null
        return
      }
      u.view = gl.getUniformLocation(points, 'uView')
      u.time = gl.getUniformLocation(points, 'uTime')
      u.spot = gl.getUniformLocation(points, 'uSpot')
      gl.useProgram(points)
      gl.uniform2f(gl.getUniformLocation(points, 'uSheet'), SHEET.half, SHEET.depth)
      gl.useProgram(screen)
      gl.uniform1i(gl.getUniformLocation(screen, 'uField'), 0)
      // the points: a grid, each a little off its place, and a number of its own
      const across = narrow() ? SHEET.narrowAcross : SHEET.across
      const deep = narrow() ? SHEET.narrowDeep : SHEET.deep
      count = across * deep
      const data = new Float32Array(count * 3)
      let seed = 0x3c6ef3
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0
        return (seed >>> 8) / 16777216
      }
      for (let j = 0, k = 0; j < deep; j++)
        for (let i = 0; i < across; i++, k += 3) {
          data[k] = ((i + 0.5 + (random() - 0.5) * 0.7) / across) * 2 - 1
          // (closer rows a little further apart: the sheet is laid out as it is seen)
          data[k + 1] = Math.pow((j + 0.5 + (random() - 0.5) * 0.6) / deep, 1.25)
          data[k + 2] = random()
        }
      pointBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      screenBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      field = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, field)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      frame = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, frame)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, field, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      fit()
      draw(performance.now())
    }
    const loop = (now: number) => {
      raf = 0
      if (!shown || still) return
      // (at most 60 pictures a second: the sea moves slowly)
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
      watch.disconnect()
      removeEventListener('resize', resized)
      if (raf) cancelAnimationFrame(raf)
      stop()
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])
  return <canvas ref={canvas} className={className} aria-hidden="true" />
}
