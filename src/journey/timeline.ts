/**
 * The journey: the pinned opening of the landing page. One number drives all of it, `s`, how far the tall
 * section has been scrolled (0 to 1, eased a little towards the scroll). From it, every frame, the shader's
 * picture (shader.ts) and the HTML laid over it:
 *
 *   the lids close over the opening words, and part; in the opening eye a drop of light
 *   spreads into the mark; the mark cools into a body of black liquid, the wordmark and the header come; the
 *   body fills with light again and gathers into a gate; the closing words come out from the gate, and the
 *   current runs out of it.
 *
 * When each happens is config.journey.beats and config.journey.lids, which the shader reads too: the words take
 * the lids' colour exactly where the lids are.
 *
 * Where the body, the word and the gate stand is the page's layout: three boxes (Journey.tsx) are measured
 * here and passed to the shader, so a different screen needs no numbers of its own.
 *
 * The program is compiled beside the page (nothing waits for the driver), and nothing is drawn while the
 * journey is off screen. Nothing is drawn while the opening is up either: see `mayBegin` below. Without WebGL the stage shows a still gradient and the words and fades still follow
 * the scroll.
 */
import { config } from '../config'
import { milestone } from '../utils/milestone'
import type { OpeningSource } from '../ui/opening'
import wordmarkFile from '../assets/brand/hyperwood-wordmark-neon.svg?raw'
import { FRAGMENT, VERTEX } from './shader'
import { buildMarkField, type MarkField } from './markField'

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
/** GLSL's smoothstep. */
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** The wordmark as supplied (1000 wide): the word in the hero is the brand's own lettering, not set type. */
const WORDMARK = (() => {
  // the file draws its path at a scale: the path's own units are the box divided by it
  const scale = Number(/scale\(([\d.]+)\)/.exec(wordmarkFile)?.[1] ?? 1)
  const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(wordmarkFile)
  return {
    d: /<path[^>]*\sd="([^"]+)"/.exec(wordmarkFile)?.[1] ?? '',
    width: Number(box?.[1] ?? 1000) / scale,
    height: Number(box?.[2] ?? 155) / scale,
  }
})()

/** What the opening (ui/opening.ts) is told about the journey behind it. */
const state = { scene: false, whole: false, opened: false, openedAt: 0 }
export function journeyOpening(): OpeningSource {
  const began = performance.now()
  return {
    poll(now) {
      // never held for ever: a journey that cannot draw still opens, as its still version
      const late = now - began > 4000
      return { scene: state.scene || late, whole: state.whole || late, settled: state.whole || late }
    },
    opened() {
      state.opened = true
      state.openedAt = performance.now()
    },
  }
}

export interface JourneyParts {
  journey: HTMLElement
  stage: HTMLElement
  canvas: HTMLCanvasElement
  header: HTMLElement
  intro: HTMLElement
  lines: HTMLElement[]
  hero: HTMLElement
  /** Where the mark's body is drawn. */
  sculpture: HTMLElement
  /** Where the wordmark is drawn. */
  word: HTMLElement
  closing: HTMLElement
  /** Where the gate is drawn. */
  door: HTMLElement
}

export function startJourney(parts: JourneyParts): () => void {
  const { journey, stage, canvas, header, intro, lines, hero, sculpture, word, closing, door } = parts
  const J = config.journey
  const B = J.beats
  const L = J.lids
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  /** How the river is drawn. As the guide draws it: one painted picture, laid by the gate (config.journey.
   *  picture). Or, when the address ends in ?wave=traced or ?wave=old, one of the two earlier currents, which
   *  the shader draws itself: the wave traced from the reference frame, or the first course. The traced wave
   *  also stands in if the picture does not come. (journey.module.css gives each its gate and its words.) */
  const asked = new URLSearchParams(window.location.search).get('wave')
  const traced = asked !== 'old'
  let pictured = asked !== 'old' && asked !== 'traced'
  if (!pictured) journey.dataset.wave = traced ? 'traced' : 'old'
  let disposed = false

  /* ------------------------------------------------------------------ WebGL: asked for, never waited for */
  const attrs = { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' as const }
  let gl2: WebGL2RenderingContext | null = null
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  try {
    gl2 = canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null
    gl = gl2 ?? (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null)
  } catch {
    gl = null
  }
  let program: WebGLProgram | null = null
  let ready = false
  let frames = 0
  const u: Record<string, WebGLUniformLocation | null> = {}
  const textures: WebGLTexture[] = []
  const shaders: WebGLShader[] = []
  let buffer: WebGLBuffer | null = null
  let typeTexture: WebGLTexture | null = null
  let markTexture: WebGLTexture | null = null
  let portalTexture: WebGLTexture | null = null
  /** The guide's picture, once it has come and been read; whether the driver has it; and how far it has
   *  come in. */
  let pictureSource: TexImageSource | null = null
  let pictureSent = false
  let pictureIn = 0
  /** The typeface has arrived: the boxes stand where they will stay. */
  let typeSet = false
  /** The mark's fields: worked out while the opening is up, handed to the driver with the first picture. */
  let markField: MarkField | null = null
  let markSent = false
  /** The first picture has been drawn (`begin`). */
  let drawing = false
  let askTimer = 0

  /** No picture: the words keep their own, closer timing (config.journey.stillBeats). */
  let flat = false
  const still = () => {
    flat = true
    journey.dataset.webgl = 'off'
    state.scene = true
    state.whole = true
  }

  const texture = (unit: number) => {
    const g = gl!
    const t = g.createTexture()!
    textures.push(t)
    g.activeTexture(g.TEXTURE0 + unit)
    g.bindTexture(g.TEXTURE_2D, t)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]))
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
    return t
  }

  /** The mark's two fields (markField.ts) are worked out... */
  const buildMark = () => {
    if (disposed) return
    const began = performance.now()
    markField = buildMarkField()
    if (import.meta.env.DEV) performance.measure('hw:mark-field', { start: began, end: performance.now() })
    milestone('mark-there')
    whole()
  }
  /** ...and handed over as a texture: floats where the device has them. */
  const sendMark = () => {
    const field = markField
    if (!gl || !markTexture || !field || markSent) return
    markSent = true
    const g = gl
    g.activeTexture(g.TEXTURE1)
    g.bindTexture(g.TEXTURE_2D, markTexture)
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false)
    const n = field.width * field.height
    let done = false
    if (gl2) {
      // two 16-bit floats a pixel: smooth enough for a mirror surface, and filtered everywhere
      g.pixelStorei(g.UNPACK_ALIGNMENT, 1)
      gl2.texImage2D(g.TEXTURE_2D, 0, gl2.RG16F, field.width, field.height, 0, gl2.RG, g.FLOAT, field.data)
      done = g.getError() === g.NO_ERROR
    } else if (g.getExtension('OES_texture_float') && g.getExtension('OES_texture_float_linear')) {
      const wide = new Float32Array(n * 4)
      for (let i = 0; i < n; i++) {
        wide[i * 4] = field.data[i * 2]
        wide[i * 4 + 1] = field.data[i * 2 + 1]
      }
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, field.width, field.height, 0, g.RGBA, g.FLOAT, wide)
      done = g.getError() === g.NO_ERROR
    }
    if (!done) {
      const bytes = new Uint8Array(n * 4)
      for (let i = 0; i < n; i++) {
        bytes[i * 4] = Math.round(field.data[i * 2] * 255)
        bytes[i * 4 + 1] = Math.round(field.data[i * 2 + 1] * 255)
        bytes[i * 4 + 3] = 255
      }
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, field.width, field.height, 0, g.RGBA, g.UNSIGNED_BYTE, bytes)
    }
    g.useProgram(program)
    g.uniform1f(u.markReady, 1)
  }

  /** The type the shader lights: the wordmark (red) and a soft copy of it (green), drawn once per size at the
   *  canvas's own pixels, where the page has laid the word's box. */
  const typeCanvas = document.createElement('canvas')
  const typeContext = typeCanvas.getContext('2d')
  const drawType = () => {
    if (!gl || !typeTexture || !typeContext || !canvas.width || !canvas.height) return
    const g = gl
    const w = stage.clientWidth
    const h = stage.clientHeight
    // WebGL 1 only mips powers of two: there the picture is stretched over one, and read back by position
    const pot = (v: number) => 2 ** Math.ceil(Math.log2(v))
    typeCanvas.width = gl2 ? canvas.width : Math.min(4096, pot(canvas.width))
    typeCanvas.height = gl2 ? canvas.height : Math.min(4096, pot(canvas.height))
    const sx = typeCanvas.width / w
    const sy = typeCanvas.height / h
    const ctx = typeContext
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, typeCanvas.width, typeCanvas.height)
    ctx.globalCompositeOperation = 'lighter'

    // the wordmark, as wide as its box and in the middle of it
    const k = word.offsetWidth / WORDMARK.width
    const wx = word.offsetLeft
    const wy = word.offsetTop + (word.offsetHeight - WORDMARK.height * k) / 2
    const shape = new Path2D(WORDMARK.d)
    ctx.setTransform(sx * k, 0, 0, sy * k, sx * wx, sy * wy)
    ctx.fillStyle = '#f00'
    ctx.fill(shape, 'evenodd')
    // its soft copy: only the shadow of a copy drawn off the canvas lands on it
    const off = typeCanvas.width * 2
    ctx.setTransform(sx * k, 0, 0, sy * k, sx * wx - off, sy * wy)
    ctx.shadowColor = '#0f0'
    ctx.shadowBlur = J.word.blur * 2 * Math.sqrt(sx * sy)
    ctx.shadowOffsetX = off
    ctx.fill(shape, 'evenodd')
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0

    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, typeTexture)
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, typeCanvas)
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false)
    g.generateMipmap(g.TEXTURE_2D)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR)
    g.useProgram(program)
    g.uniform1f(u.typeReady, 1)
  }

  const finish = () => {
    if (disposed || !gl || !program) return
    const g = gl
    if (!g.getProgramParameter(program, g.LINK_STATUS)) {
      console.error('Hyperwood journey:', shaders.map((sh) => g.getShaderInfoLog(sh)).join('\n') || g.getProgramInfoLog(program))
      still()
      return
    }
    g.useProgram(program)
    buffer = g.createBuffer()
    g.bindBuffer(g.ARRAY_BUFFER, buffer)
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW)
    const corner = g.getAttribLocation(program, 'corner')
    g.enableVertexAttribArray(corner)
    g.vertexAttribPointer(corner, 2, g.FLOAT, false, 0, 0)
    for (const name of ['res', 'time', 'progress', 'pointer', 'pointerActive', 'typeTex', 'typeReady', 'markTex', 'markReady', 'body', 'gate', 'course', 'traced', 'pieces', 'gateX', 'flow', 'picture', 'portalTex', 'cInk', 'cNeon', 'cHot', 'cLime', 'cMoss', 'cDeep'])
      u[name] = g.getUniformLocation(program, name)
    const P = J.palette
    g.uniform3fv(u.cInk, rgb(P.ink))
    g.uniform3fv(u.cNeon, rgb(P.neon))
    g.uniform3fv(u.cHot, rgb(P.hot))
    g.uniform3fv(u.cLime, rgb(P.lime))
    g.uniform3fv(u.cMoss, rgb(P.moss))
    g.uniform3fv(u.cDeep, rgb(P.deep))
    g.uniform1f(u.traced, traced ? 1 : 0)
    g.uniform1f(u.pieces, traced ? J.wave.pieces : J.floor.pieces)
    typeTexture = texture(0)
    g.uniform1i(u.typeTex, 0)
    markTexture = texture(1)
    g.uniform1i(u.markTex, 1)
    portalTexture = texture(2)
    g.uniform1i(u.portalTex, 2)
    g.uniform1f(u.flow, pictured ? 0 : 1)
    journey.dataset.shader = ''
    ready = true
    state.scene = true
    milestone('journey-program')
    measure()
    whole()
  }
  /** The opening is told when the journey is whole: the program is there, the fields are, the type has set. */
  const whole = () => {
    if (state.whole || !ready || !markField || !typeSet) return
    state.whole = true
    milestone('journey-whole')
  }

  if (gl) {
    const g = gl
    const make = (type: number, source: string) => {
      const shader = g.createShader(type)!
      shaders.push(shader)
      g.shaderSource(shader, source)
      g.compileShader(shader)
      return shader
    }
    program = g.createProgram()!
    g.attachShader(program, make(g.VERTEX_SHADER, VERTEX))
    g.attachShader(program, make(g.FRAGMENT_SHADER, FRAGMENT))
    g.linkProgram(program)
    // where the driver can say "done" without being waited for, ask it now and then
    const parallel = g.getExtension('KHR_parallel_shader_compile')
    const ask = () => {
      if (disposed) return
      if (!parallel || g.isContextLost() || g.getProgramParameter(program!, parallel.COMPLETION_STATUS_KHR)) finish()
      else askTimer = window.setTimeout(ask, 16)
    }
    askTimer = window.setTimeout(ask, 0)
    // the mark's fields take a moment to work out: after this turn, beside the driver's own work
    window.setTimeout(buildMark, 0)
  } else still()

  /* ------------------------------------------------------------------ the guide's picture of the gate and the river */
  /** Without the picture the traced wave is drawn, with its own gate and words. */
  const fallBack = () => {
    if (disposed || !pictured) return
    pictured = false
    pictureSource = null
    journey.dataset.wave = 'traced'
    if (gl && program && ready) {
      gl.useProgram(program)
      gl.uniform1f(u.flow, 1)
    }
    measure()
  }
  if (pictured && gl) {
    // asked for across origins, as the guide does: the driver may only read a picture that was
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      if (disposed) return
      const keep = (source: TexImageSource) => {
        if (disposed || !pictured) return
        pictureSource = source
      }
      // read off the main thread where the browser can (the hand-over to the driver is then quick)
      if (typeof createImageBitmap === 'function')
        createImageBitmap(img).then(
          (bitmap) => keep(bitmap),
          () => keep(img),
        )
      else keep(img)
    }
    img.onerror = fallBack
    img.src = J.picture.url
  }
  /** The picture is handed to the driver while the screen stands still (it takes a few milliseconds), or at
   *  the latest as the gate begins to gather. */
  const sendPicture = () => {
    if (!gl || !portalTexture || !pictureSource || pictureSent) return
    const g = gl
    g.activeTexture(g.TEXTURE2)
    g.bindTexture(g.TEXTURE_2D, portalTexture)
    // (as it comes, its top row first: the shader reads it from the top down)
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false)
    const began = performance.now()
    try {
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, pictureSource)
      pictureSent = true
    } catch {
      // (a picture the page may not read)
      fallBack()
    }
    if (import.meta.env.DEV) performance.measure('hw:picture', { start: began, end: performance.now() })
    milestone('picture-there')
    if (typeof ImageBitmap !== 'undefined' && pictureSource instanceof ImageBitmap) pictureSource.close()
    pictureSource = null
    if (pictureSent && reduced.matches) pictureIn = 1
  }

  // the boxes are measured again when the typeface has arrived (the line under the word moves them a little)
  document.fonts.ready.then(() => {
    if (disposed) return
    typeSet = true
    measure()
    whole()
  })

  /* ------------------------------------------------------------------ the pointer: turns the mark, aims the light */
  const pointer = { x: 0.5, y: 0.5, aimX: 0.5, aimY: 0.5, active: 0, target: 0 }
  const onMove = (event: PointerEvent) => {
    const rect = stage.getBoundingClientRect()
    pointer.aimX = (event.clientX - rect.left) / rect.width
    pointer.aimY = 1 - (event.clientY - rect.top) / rect.height
    pointer.target = event.pointerType === 'touch' ? 0 : 1
  }
  const onLeave = () => {
    pointer.target = 0
  }
  stage.addEventListener('pointermove', onMove)
  stage.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)

  /* ------------------------------------------------------------------ the scroll, and every frame */
  let target = 0
  let current = 0
  let last = 0
  let active = true
  let raf = 0
  let drawnS = -1
  const progress = () => clamp(-journey.getBoundingClientRect().top / Math.max(1, journey.offsetHeight - innerHeight))
  /** Where the page has put the three boxes, as the shader counts: in screen heights, across from the middle
   *  of the stage and up from its bottom. (Layout offsets: the blocks' transforms do not move them.) */
  const place = { body: [0, 0.59, 0.43], gate: [0.095, 0.9, 0.555], gateX: 0, room: Infinity, free: 1, clear: 0 }

  function measure() {
    target = progress()
    const sw = Math.max(1, stage.clientWidth)
    const sh = Math.max(1, stage.clientHeight)
    place.body = [
      (sculpture.offsetLeft + sculpture.offsetWidth / 2 - sw / 2) / sh,
      1 - (sculpture.offsetTop + sculpture.offsetHeight / 2) / sh,
      sculpture.offsetWidth / 2 / sh,
    ]
    place.gate = [door.offsetWidth / 2 / sh, 1 - door.offsetTop / sh, 1 - (door.offsetTop + door.offsetHeight) / sh]
    // (the gate's box is hung by its middle: its `left` is its middle line)
    place.gateX = (door.offsetLeft - sw / 2) / sh
    // How far to the right of the middle the pool at the gate's foot may spread. As far as it likes while the
    // note that stands to the right of the gate ends above the gate's foot. Where that note comes down to
    // the foot (a short screen), only up to the note, so the words never stand on the light: `room` is where
    // the note begins, `free` how clear of the foot it ends (1 clear, 0 not at all).
    // (`clear`: how far above the gate's foot the note ends. Above that height the gate's bell may be no
    // broader than the gap to the note. The note's place is read as it is drawn, since on a narrow screen it
    // is shifted by half its height.)
    const beside = closing.lastElementChild as HTMLElement | null
    const right = beside && beside !== door && beside.offsetLeft > sw / 2 ? beside : null
    const noteEnd = right ? right.getBoundingClientRect().bottom - stage.getBoundingClientRect().top : 0
    place.room = right ? (right.offsetLeft - sw / 2) / sh - 0.012 : Infinity
    place.clear = right ? (door.offsetTop + door.offsetHeight - noteEnd) / sh : 0
    place.free = right ? smooth(0.005, 0.03, place.clear) : 1
    if (ready && gl) {
      const dpr = Math.min(devicePixelRatio || 1, J.maxDpr, Math.sqrt(J.maxPixels / Math.max(1, stage.clientWidth * stage.clientHeight)))
      const w = Math.max(1, Math.round(stage.clientWidth * dpr))
      const h = Math.max(1, Math.round(stage.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
      if (drawing) drawType()
    }
    drawnS = -1
  }

  /**
   * When the first picture may be drawn. The first use of the program makes the graphics driver build it, and
   * that stops the whole screen for a few frames: the browser's own animations too, which share the graphics
   * process. So it does not happen while the opening is up, nor while the opening words are coming into focus,
   * but once the screen stands still (there is nothing to draw until the lids come anyway: the first screen is
   * Ink). A scroll begins it at once.
   */
  const mayBegin = (now: number) =>
    state.opened && (now - state.openedAt > J.intro.delay + J.intro.focus + 120 || target > 0.01)
  const begin = () => {
    drawing = true
    sendMark()
    drawType()
    journey.dataset.drawn = ''
  }
  const onScroll = () => {
    target = progress()
  }

  /** How much of the lid covers a point of the stage (u across, v down, both 0 to 1): the shader's lid. */
  const lidAt = (uu: number, v: number, cover: number, shown: number) => {
    const bow = L.bow * Math.pow(Math.abs(uu - 0.5) * 2, L.bowPower)
    const aperture = L.open + (L.shut - L.open) * cover - bow
    return smooth(aperture - L.feather, aperture + L.feather, Math.abs(v - 0.5)) * shown
  }
  const P = J.palette
  const lime = rgb(P.lime)
  const neon = rgb(P.neon)

  /**
   * The current's course, for the shader: a point for every piece of it, as it lies on the screen (in screen
   * heights, across from the middle and up from the bottom), each with how broad the piece that ends there is.
   * The course is laid on a floor that runs from the gate towards the eye: straight out of the gate, one long
   * bend to the left and back across to the right, the bends coming sooner as it runs. The floor's slant gives
   * it its perspective: flat and small far off, broad and steep near by. It begins inside the gate, half way
   * up it, so the gate's lower half and the current are one, and ends just below the bottom of the screen.
   */
  const F = J.floor
  /** (room for the course with the most pieces: a course with fewer leaves the rest alone, and the shader
   *  stops at its last) */
  const course = new Float32Array((Math.max(F.pieces, J.wave.pieces) + 1) * 3)
  /** The current's breadth at a point of its course: between the listed points, eased from one to the next. */
  const breadth = (l: number) => {
    const list = F.breadth
    for (let i = 1; i < list.length; i++)
      if (l <= list[i][0]) return list[i - 1][1] + (list[i][1] - list[i - 1][1]) * smooth(list[i - 1][0], list[i][0], l)
    return list[list.length - 1][1]
  }
  const layCourse = (seconds: number) => {
    const [gateHalf, gateTop, gateFoot] = place.gate
    const reach = Math.min(F.reach, (stage.clientWidth / Math.max(1, stage.clientHeight)) * F.reachNarrow)
    const end = gateFoot / (gateFoot + F.rise) + 0.06
    const middle = (l: number) => {
      const sway = F.sway * Math.sin(seconds * 0.27 - l * 5) * smooth(F.straight, F.straight + 0.2, l)
      return -reach * Math.sin(F.turn * Math.pow(Math.max(l - F.straight, 0), F.quicken) + sway)
    }
    let before = 0
    for (let i = 0; i <= F.pieces; i++) {
      // (the first point stands inside the gate, straight above its foot, under its arch)
      const l = i === 0 ? 0 : (end * (i - 1)) / (F.pieces - 1)
      const far = 1 - l
      course[i * 3] = i === 0 ? 0 : middle(l) / far
      course[i * 3 + 1] = i === 0 ? gateFoot + (gateTop - gateFoot) * 0.5 : gateFoot - (F.rise * l) / far
      // (the band a piece lays is soft: its light is down to half at 0.71 of its breadth, so that is where the
      // current's edge is seen, and the breadth is made that much more)
      course[i * 3 + 2] = (gateHalf * breadth((before + l) / 2)) / 0.71
      before = l
    }
  }

  /**
   * The course the page shows: the wave of the reference frame itself, traced. Three sweeps where the first
   * course has two: out of the gate into a pool that spreads to the right, away to the left, back across to
   * the right, and round again along the bottom of the screen towards the viewer. Its points (journey.wave)
   * are places on the screen measured from the gate. They are not on the course: they pull at it. The course
   * is the smooth curve between them (a cubic B-spline), which has no kink anywhere and cannot swing out
   * between two points that lie close; its breadth is carried along the same way. It is then cut into
   * pieces that are each about half as long as the current is broad there.
   */
  const W = J.wave
  const fine = 16
  const dense = new Float32Array(((W.points.length + 1) * fine + 1) * 4)
  const points = new Float32Array(W.points.length * 3)
  const layWave = (seconds: number) => {
    const [gateHalf, gateTop, gateFoot] = place.gate
    const squeeze = Math.min(1, stage.clientWidth / Math.max(1, stage.clientHeight) / W.fullAt)
    const n = W.points.length
    // the points as they lie on the screen: across from the middle, up from the bottom, and half as broad as
    // the current is seen there
    for (let i = 0; i < n; i++) {
      const [x, y, half] = W.points[i]
      // (the far sweeps wander a little; the gate's own foot and the pool beside it stay where they are)
      const drift = W.drift * Math.sin(seconds * 0.27 - i * 0.8) * smooth(W.pool[1] + 2, W.pool[1] + 6, i)
      const across = (x + drift) * gateHalf * squeeze
      const inPool = i >= W.pool[0] && i <= W.pool[1]
      const kept = Math.max(0, Math.min(across, place.room - half * gateHalf * 1.3))
      points[i * 3] = inPool ? kept + (across - kept) * place.free : across
      // (the gate's bell keeps out of the notes beside the gate: down to where they end it is no broader
      // than the gap to them, and it opens out below)
      const bell = i > 0 && i < W.pool[0] && -y * gateHalf > place.clear - 0.5 * gateHalf
      points[i * 3 + 1] = gateFoot - y * gateHalf
      points[i * 3 + 2] = bell ? Math.min(half * gateHalf, Math.max(W.points[0][2] * gateHalf, place.room - 0.004)) : half * gateHalf
    }
    // (the first and the last point count three times, so the curve begins and ends on them)
    const at = (i: number, c: number) => points[Math.min(n - 1, Math.max(0, i)) * 3 + c]
    // the curve, finely, and how far along it each fine point lies, measured in breadths
    let count = 0
    for (let i = 0; i <= n; i++) {
      for (let k = 0; k < (i === n ? fine + 1 : fine); k++) {
        const f = k / fine
        const b0 = ((1 - f) * (1 - f) * (1 - f)) / 6
        const b1 = (3 * f * f * f - 6 * f * f + 4) / 6
        const b2 = (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6
        const b3 = (f * f * f) / 6
        for (let c = 0; c < 3; c++) dense[count * 4 + c] = b0 * at(i - 2, c) + b1 * at(i - 1, c) + b2 * at(i, c) + b3 * at(i + 1, c)
        dense[count * 4 + 2] = Math.max(dense[count * 4 + 2], 0.008)
        const far = count === 0 ? 0 : Math.hypot(dense[count * 4] - dense[count * 4 - 4], dense[count * 4 + 1] - dense[count * 4 - 3])
        dense[count * 4 + 3] = count === 0 ? 0 : dense[count * 4 - 1] + far / (0.5 * (dense[count * 4 + 2] + dense[count * 4 - 2]))
        count++
      }
    }
    // cut into the shader's pieces: equal steps of that measure, so the pieces are short where the current
    // is thin and long where it is broad. The first point stands a little above the curve's beginning,
    // inside the gate.
    const whole = dense[count * 4 - 1]
    course[0] = dense[0]
    course[1] = Math.min(gateTop - gateHalf, dense[1] + dense[2] * 0.2)
    course[2] = dense[2] / W.seen
    let k = 1
    for (let j = 0; j < W.pieces; j++) {
      const want = (whole * j) / (W.pieces - 1)
      while (k < count - 1 && dense[k * 4 + 3] < want) k++
      const span = dense[k * 4 + 3] - dense[k * 4 - 1]
      const f = span > 0 ? Math.min(1, Math.max(0, (want - dense[k * 4 - 1]) / span)) : 0
      for (let c = 0; c < 3; c++) course[(j + 1) * 3 + c] = dense[k * 4 - 4 + c] + (dense[k * 4 + c] - dense[k * 4 - 4 + c]) * f
      course[(j + 1) * 3 + 2] /= W.seen
    }
  }

  /** One picture: the journey at `s`. */
  function paint(s: number, now: number) {
    if (!gl || !program) return
    const g = gl
    g.useProgram(program)
    g.uniform2f(u.res, canvas.width, canvas.height)
    g.uniform2f(u.pointer, pointer.x, pointer.y)
    g.uniform1f(u.pointerActive, pointer.active)
    g.uniform1f(u.time, reduced.matches ? 0 : now / 1000)
    g.uniform1f(u.progress, s)
    g.uniform3f(u.body, place.body[0], place.body[1], place.body[2])
    g.uniform3f(u.gate, place.gate[0], place.gate[1], place.gate[2])
    g.uniform1f(u.gateX, place.gateX)
    g.uniform1f(u.picture, pictured ? pictureIn : 0)
    if (!pictured && s > B.stand[0]) {
      if (traced) layWave(reduced.matches ? 0 : now / 1000)
      else layCourse(reduced.matches ? 0 : now / 1000)
      g.uniform3fv(u.course, course)
    }
    g.drawArrays(g.TRIANGLES, 0, 3)
  }
  // dev build only: window.__hwJourney.cost(s, n) draws the journey at `s` n times and gives the true cost of
  // one frame in ms (the display's refresh is not in the way; a one-pixel read makes the GPU finish)
  if (import.meta.env.DEV)
    (window as unknown as { __hwJourney: unknown }).__hwJourney = {
      cost(s: number, n = 40, lit = 1) {
        if (!gl || !ready) return -1
        if (!drawing) begin()
        const px = new Uint8Array(4)
        const was = pointer.active
        pointer.active = lit
        for (let i = 0; i < 6; i++) paint(s, performance.now())
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
        const t = performance.now()
        for (let i = 0; i < n; i++) paint(s, performance.now())
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
        pointer.active = was
        return (performance.now() - t) / n
      },
      size: () => [canvas.width, canvas.height],
    }

  /** With the guide's picture the closing words come as the guide has them come: with the river. */
  const pictureBeats = { ...B, closing: J.picture.copy }

  function frame(now: number) {
    const dt = Math.min(64, now - last || 16)
    last = now
    current += (target - current) * (reduced.matches ? 1 : 1 - Math.exp(-dt / J.ease))
    if (Math.abs(target - current) < 0.00002) current = target
    const s = current
    const follow = 1 - Math.exp(-dt / 95)
    pointer.x += (pointer.aimX - pointer.x) * follow
    pointer.y += (pointer.aimY - pointer.y) * follow
    pointer.active += (pointer.target - pointer.active) * (1 - Math.exp(-dt / 120))

    // the words come into focus once the opening has let the page go, then leave as the lids part
    const since = state.opened ? now - state.openedAt - J.intro.delay : -1
    const reveal = reduced.matches ? (state.opened ? 1 : 0) : smooth(0, J.intro.focus, since)
    intro.style.opacity = String((1 - smooth(B.introOut[0], B.introOut[1], s)) * reveal)
    intro.style.filter = reveal < 1 ? `blur(${((1 - reveal) * 22).toFixed(2)}px)` : ''
    intro.style.transform = reveal < 1 ? `scale(${(1 + (1 - reveal) * 0.05).toFixed(4)})` : ''

    // each line reads the lid at 9 by 5 points of its box: where it is covered it blurs, swells and takes the
    // lid's colour (layout offsets ignore transforms, so the swelling does not feed back)
    const cover = smooth(L.from, L.to, s)
    const shown = smooth(L.appear[0], L.appear[1], s)
    if (shown > 0 && s < B.introOut[1]) {
      const width = intro.clientWidth
      const height = intro.clientHeight
      const boxes = lines.map((line) => [line.offsetLeft, line.offsetTop, line.offsetWidth, line.offsetHeight])
      lines.forEach((line, i) => {
        const [left, top, lw, lh] = boxes[i]
        let contact = 0
        let tint = 0
        for (let y = 0; y < 5; y++)
          for (let x = 0; x < 9; x++) {
            const uu = (left + (lw * (x + 0.5)) / 9) / width
            const v = (top + (lh * (y + 0.5)) / 5) / height
            // the faint outer fringe does not count: only overlap that can be seen
            const overlap = smooth(0.12, 0.85, lidAt(uu, v, cover, shown))
            contact += overlap
            tint += overlap * smooth(0.04, 0.5, Math.abs(v - 0.5))
          }
        const hit = contact / 45
        const where = contact > 0 ? tint / contact : 0
        const mixTo = smooth(0, 0.55, hit)
        const c = [0, 1, 2].map((ch) => Math.round(255 * (1 - mixTo + mixTo * (lime[ch] + (neon[ch] - lime[ch]) * where))))
        line.style.color = `rgb(${c[0]},${c[1]},${c[2]})`
        line.style.webkitTextStroke = `${(hit * 4.5).toFixed(2)}px currentColor`
        line.style.filter = hit > 0.001 ? `blur(${(hit * 22).toFixed(2)}px)` : ''
        line.style.textShadow = hit > 0.001 ? `0 0 ${(hit * 32).toFixed(1)}px currentColor` : ''
        line.style.transform = hit > 0.001 ? `scale(${(1 + hit * 0.035).toFixed(4)},${(1 + hit * 0.06).toFixed(4)})` : ''
        line.style.opacity = String(1 - hit * 0.32)
      })
    } else if (drawnS !== s)
      lines.forEach((line) => {
        line.style.color = ''
        line.style.webkitTextStroke = ''
        line.style.filter = ''
        line.style.textShadow = ''
        line.style.transform = ''
        line.style.opacity = ''
      })

    if (drawnS !== s) {
      const beats = flat ? { ...B, ...J.stillBeats } : pictured ? pictureBeats : B
      // (the line leaves in the first half of the beat: the body fills with light in the second)
      const heroOut = smooth(0, 0.5, smooth(beats.heroOut[0], beats.heroOut[1], s))
      hero.style.opacity = String(smooth(beats.word[0], beats.word[1], s) * (1 - heroOut))
      hero.style.filter = heroOut > 0 ? `blur(${(heroOut * 10).toFixed(2)}px)` : ''
      hero.style.transform = heroOut > 0 ? `scale(${(1 + heroOut * 0.025).toFixed(4)})` : ''
      // the closing words come out from the gate (journey.module.css moves them by --in)
      const closingIn = smooth(beats.closing[0], beats.closing[1], s)
      closing.style.opacity = String(closingIn)
      closing.style.setProperty('--in', closingIn.toFixed(4))
      const headerIn = smooth(beats.header[0], beats.header[1], s)
      header.style.opacity = String(headerIn)
      header.style.pointerEvents = headerIn > 0.6 ? 'auto' : 'none'
      header.inert = headerIn < 0.6
    }

    if (ready && active && gl && program) {
      if (!drawing && mayBegin(now)) begin()
      if (drawing) {
        // (fields that were not there for the first picture go with the next)
        if (!markSent) sendMark()
        if (pictureSource && (target === current || s > B.heroOut[0])) sendPicture()
        if (pictureSent && pictureIn < 1) pictureIn = Math.min(1, pictureIn + dt / 240)
        paint(s, now)
        frames++
        if (frames === 1) milestone('journey-first-frame')
      }
    }
    drawnS = s
    raf = requestAnimationFrame(frame)
  }

  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', measure)
  // nothing is drawn while the journey is off screen
  const seen = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting
  })
  seen.observe(journey)
  measure()
  raf = requestAnimationFrame(frame)

  return () => {
    disposed = true
    cancelAnimationFrame(raf)
    window.clearTimeout(askTimer)
    seen.disconnect()
    removeEventListener('scroll', onScroll)
    removeEventListener('resize', measure)
    stage.removeEventListener('pointermove', onMove)
    stage.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('blur', onLeave)
    if (gl) {
      textures.forEach((t) => gl!.deleteTexture(t))
      shaders.forEach((sh) => gl!.deleteShader(sh))
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
    }
    delete journey.dataset.webgl
    delete journey.dataset.shader
    delete journey.dataset.drawn
  }
}
