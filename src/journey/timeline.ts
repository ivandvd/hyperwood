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
 * That is the journey with the mark as its hero (the address ?hero=mark). The page shows the hero as a room:
 * the drop rises to where a bulb hangs and is the lamp, the lamp's light opens the room, and in the room
 * stands a film (film/FilmStack.tsx). Scrolled on, the light draws back to the lamp, the lamp goes over to
 * where the next film's bulb hangs, and its light opens the next room: three films, each with its words.
 * Then the light draws back for the last time, the lamp swells into the drop again, and the drop goes to the
 * gate. For that hero this file also lays the films' box where the hero's layout has its place, says which
 * film is in the box, moves the lamp from bulb to bulb and brings each film's words in and out (`screen`, and
 * "The room" in `frame`).
 *
 * When each happens is timing.ts (config.journey's beats and lids, carried over into the room's longer journey
 * where the hero is the room), which the shader reads too: the words take the lids' colour exactly where the
 * lids are.
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
import type { FilmStackHandle } from '../film/FilmStack'
import { SHAPE } from '../film/reel'
import { FRAGMENT, FRAGMENT_ROOM, FRAGMENT_ROOM_EXCHANGE, VERTEX, roomFragmentWith } from './shader'
import { EXCHANGE_PICTURES } from './exchange.pictures'
import { buildMarkField, MARK_FLOW, type MarkField } from './markField'
import { markTiming, roomTiming } from './timing'
import { ROW } from './row'
import { callLate } from '../landing/flags'

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

/**
 * The journey's program is kept with its canvas (a canvas has one context for life). A journey that is stopped
 * and started again on the same canvas takes the program over: it is neither thrown away nor asked for twice.
 * In development React stops and starts every effect once as the page mounts, so this happens on every load
 * there. Throwing away a program that is still being built makes the graphics process wait for the build, and
 * the whole screen waits with it: a quarter of a second, measured, with the opening's mark standing still.
 */
const built = new WeakMap<HTMLCanvasElement, { source: string; program: WebGLProgram; shaders: WebGLShader[] }>()

export interface JourneyParts {
  journey: HTMLElement
  stage: HTMLElement
  canvas: HTMLCanvasElement
  header: HTMLElement
  intro: HTMLElement
  lines: HTMLElement[]
  hero: HTMLElement
  /** Where the mark's body is drawn. (Where the hero is the room: where the films' box stands.) */
  sculpture: HTMLElement
  /** Where the wordmark is drawn (the hero as the mark has one; the room has not). */
  word?: HTMLElement
  closing: HTMLElement
  /** Where the gate is drawn. */
  door: HTMLElement
  /** As tall as the journey holds its last picture (journey.module.css). */
  hold: HTMLElement
  /** The films, where the hero is the room and not the mark. They lie under the canvas: the picture is then
   *  drawn with a share left clear, and the films show through it (shader.ts, "the room"). */
  films?: FilmStackHandle
  /** The films' words, in the films' order: for each film the elements that say them. */
  says?: HTMLElement[][]
  /** The column at the gate, with the way around the site and the call to action (not shown on a screen
   *  with no room for it). */
  side?: HTMLElement
  /** The logo that stays at the upper left after the hero (a try: SwimLogo.tsx). It comes as the closing comes,
   *  in the hero's own logo's place, and does not go with it. */
  logo?: HTMLElement
}

export function startJourney(parts: JourneyParts): () => void {
  const { journey, stage, canvas, header, intro, lines, hero, sculpture, word, closing, door, hold, films, says = [], side, logo } = parts
  const J = config.journey
  /** When things happen: the journey as it was made, or carried over into the room's longer one (timing.ts). */
  const when = films ? roomTiming : markTiming
  const B = when.beats
  const L = { ...J.lids, ...when.lids }
  const R = J.room
  const turns = films ? roomTiming.room.turns : []
  const roomOpen = roomTiming.room.open
  const roomShut = roomTiming.room.shut
  /** A try (?films=after): the films come after the hero (landing/FilmBlock.tsx) and the journey has none. It is
   *  the room's journey with the films' stretch left out: from where the lamp's light would begin to open the
   *  first room to where it has drawn back from the last. On either side of that stretch the picture is the same
   *  (the lamp hangs where the drop stood, in the middle of the eye, `measure`, and no room is open), so the
   *  journey goes on from the one end of it to the other as one picture, and its section is that much shorter.
   *  (The scroll is eased first and then carried over the gap: `along`.) The header's call to action comes as the
   *  light runs into the mark, not with a first film. */
  const filmsAfter = !!films && new URLSearchParams(window.location.search).get('films') === 'after'
  /** (&flow=soar&dawn=river: the river stays lit while the morning comes up over it, its light pouring into the
   *  morning's, and goes out only once the morning has covered it: soar/Daybreak.tsx) */
  const pour =
    filmsAfter && new URLSearchParams(window.location.search).get('flow') === 'soar' && new URLSearchParams(window.location.search).get('dawn') === 'river'
  const skipped = filmsAfter ? roomShut[1] - roomOpen[0] : 0
  const along = (eased: number) => {
    const s = eased * (1 - skipped)
    return s < roomOpen[0] ? s : s + skipped
  }
  const headerAfter: readonly [number, number] = [roomShut[1] + 0.003, roomShut[1] + 0.04]
  // (the room's journey is longer by its films' stay: journey.module.css makes the section that much taller; without
  // the films it is shorter by their stretch)
  if (films) journey.style.setProperty('--room-stay', String(filmsAfter ? (1 + R.stay) * (1 - skipped) - 1 : R.stay))
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  /** How the river is drawn. As the guide draws it: one painted picture, laid by the gate (config.journey.
   *  picture). Or, when the address ends in ?wave=traced or ?wave=old, one of the two earlier currents, which
   *  the shader draws itself: the wave traced from the reference frame, or the first course. The traced wave
   *  also stands in if the picture does not come. (journey.module.css gives each its gate and its words.) */
  const asked = new URLSearchParams(window.location.search).get('wave')
  const traced = asked !== 'old'
  /** The gate as the doorway of a stock exchange of our own, when the address asks for it (?gate=exchange): its
   *  pictures stand in for the guide's (exchange.ts, shader.ts "the exchange"). Only with the films. */
  const exchanged = !!films && new URLSearchParams(window.location.search).get('gate') === 'exchange'
  /** A try beside it (?gate=exchange&layout=right): the exchange stands at the right of the screen (Journey.tsx
   *  and journey.module.css lay it out). Its pictures then end within the screen, so their light is thinned out
   *  towards their sides (shader.ts). */
  const sided = exchanged && new URLSearchParams(window.location.search).get('layout') === 'right'
  /** Another (?drop=mark): the light goes to the gate as the mark (shader.ts, "the beats of the light ... the
   *  mark"). It needs the mark's outline, which is worked out once the opening words stand still: it is not
   *  wanted before the films are past. */
  const viaMark = !!films && new URLSearchParams(window.location.search).get('drop') === 'mark'
  let markAsked = false
  // (the exchange keeps the guide's river: it runs on from the foot of the exchange's steps)
  let pictured = asked !== 'old' && asked !== 'traced'
  if (!pictured && !exchanged) journey.dataset.wave = traced ? 'traced' : 'old'
  if (exchanged) journey.dataset.gate = 'exchange'
  let disposed = false

  /* ------------------------------------------------------------------ WebGL: asked for, never waited for */
  // (with the films under it, the picture has a clear share: the canvas keeps its alpha)
  const attrs = { alpha: !!films, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' as const }
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
  /** The exchange's pictures: their textures, the pictures once they have come and been read, how many the driver
   *  has, and how far they have come in. */
  const exchangeTextures: WebGLTexture[] = []
  const exchangeSources: (TexImageSource | null)[] = [null, null, null, null]
  let exchangeSent = 0
  let exchangeIn = 0
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
    markField = buildMarkField(viaMark)
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
    // (the mark as one stroke, where the light runs along it: shader.ts)
    if (field.flow) {
      g.uniform3fv(u.markTail, field.flow.tail)
      g.uniform3fv(u.markHead, field.flow.head)
      g.uniform3fv(u.markPath, field.flow.path)
    }
    g.uniform1f(u.markReady, 1)
  }

  /** The glow the shader lays round the wordmark: a soft copy of it (green), drawn once per size at the
   *  canvas's own pixels, where the page has laid the word's box. (The letters themselves are that box: the
   *  wordmark as supplied, drawn by the browser.) */
  const typeCanvas = document.createElement('canvas')
  const typeContext = typeCanvas.getContext('2d')
  const drawType = () => {
    if (!word || !gl || !typeTexture || !typeContext || !canvas.width || !canvas.height) return
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
    // its soft copy: only the shadow of a copy drawn off the canvas lands on it
    const off = typeCanvas.width * 2
    ctx.fillStyle = '#000'
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
    for (const name of ['res', 'time', 'progress', 'pointer', 'pointerActive', 'typeTex', 'typeReady', 'markTex', 'markReady', 'body', 'gate', 'course', 'traced', 'pieces', 'gateX', 'flow', 'picture', 'portalTex', 'cInk', 'cNeon', 'cHot', 'cLime', 'cMoss', 'cDeep', 'lamp', 'room', 'drop', 'roomSide', 'lens', 'exchange', 'exBase', 'exDoor', 'exGlow', 'exSpace', 'markTail', 'markHead', 'markPath'])
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
    g.uniform1f(u.flow, pictured || exchanged ? 0 : 1)
    if (exchanged) {
      const names = ['exBase', 'exDoor', 'exGlow', 'exSpace'] as const
      names.forEach((name, i) => {
        exchangeTextures.push(texture(3 + i))
        g.uniform1i(u[name], 3 + i)
      })
    }
    // (the mark's stroke, as it was measured, until the page has measured it itself: markField.ts)
    if (viaMark) {
      g.uniform3fv(u.markTail, MARK_FLOW.tail)
      g.uniform3fv(u.markHead, MARK_FLOW.head)
    }
    // (the address ?drop=lens: the drop as the films' lamp out of focus, grainy: shader.ts, "the lamp")
    g.uniform1f(u.lens, new URLSearchParams(window.location.search).get('drop') === 'lens' ? 1 : 0)
    journey.dataset.shader = ''
    ready = true
    state.scene = true
    milestone('journey-program')
    measure()
    whole()
  }
  /** The opening is told when the journey is whole: the program is there, the fields are, the type has set.
   *  (The room needs no fields: its light is a round one.) */
  const whole = () => {
    if (state.whole || !ready || (!markField && !films) || !typeSet) return
    state.whole = true
    milestone('journey-whole')
  }

  if (gl) {
    const g = gl
    const tried = sided || viaMark
    const source = films ? (tried ? roomFragmentWith(exchanged, { thinned: sided, mark: viaMark }) : exchanged ? FRAGMENT_ROOM_EXCHANGE : FRAGMENT_ROOM) : FRAGMENT
    const had = built.get(canvas)
    if (had && had.source === source && !g.isContextLost()) {
      // (this canvas has the program already, built or being built: see `built`)
      program = had.program
      shaders.push(...had.shaders)
    } else {
      const make = (type: number, text: string) => {
        const shader = g.createShader(type)!
        shaders.push(shader)
        g.shaderSource(shader, text)
        g.compileShader(shader)
        return shader
      }
      program = g.createProgram()!
      g.attachShader(program, make(g.VERTEX_SHADER, VERTEX))
      g.attachShader(program, make(g.FRAGMENT_SHADER, source))
      g.linkProgram(program)
      built.set(canvas, { source, program, shaders: [...shaders] })
    }
    // where the driver can say "done" without being waited for, ask it now and then
    const parallel = g.getExtension('KHR_parallel_shader_compile')
    const ask = () => {
      if (disposed) return
      if (!parallel || g.isContextLost() || g.getProgramParameter(program!, parallel.COMPLETION_STATUS_KHR)) finish()
      else askTimer = window.setTimeout(ask, 16)
    }
    askTimer = window.setTimeout(ask, 0)
    // the mark's fields take a moment to work out: after this turn, beside the driver's own work
    if (!films) window.setTimeout(buildMark, 0)
  } else still()

  /* ------------------------------------------------------------------ the guide's picture of the gate and the river */
  /** Without the picture the traced wave is drawn, with its own gate and words. */
  const fallBack = () => {
    if (disposed || !pictured) return
    pictured = false
    pictureSource = null
    // (the exchange has a river of its own to fall back on: shader.ts)
    if (exchanged) return
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
  if (exchanged && gl) {
    const order = [EXCHANGE_PICTURES.base, EXCHANGE_PICTURES.door, EXCHANGE_PICTURES.glow, EXCHANGE_PICTURES.space]
    order.forEach((url, i) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (disposed) return
        const keep = (source: TexImageSource) => {
          if (!disposed) exchangeSources[i] = source
        }
        if (typeof createImageBitmap === 'function')
          createImageBitmap(img).then(
            (bitmap) => keep(bitmap),
            () => keep(img),
          )
        else keep(img)
      }
      img.src = url
    })
  }
  /** The exchange's pictures, handed to the driver one a frame (a few milliseconds each), as the guide's is. */
  const sendExchange = () => {
    if (!gl || exchangeSent >= 4 || exchangeTextures.length < 4) return
    const source = exchangeSources[exchangeSent]
    if (!source) return
    const g = gl
    g.activeTexture(g.TEXTURE3 + exchangeSent)
    g.bindTexture(g.TEXTURE_2D, exchangeTextures[exchangeSent])
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false)
    // (the three lights are grey: with WebGL 2 each is kept as one channel and with its smaller copies, so the
    // page reads it smoothly where it is drawn smaller than it is; the river's place is read as it is)
    const light = exchangeSent < 3 && gl2 !== null
    try {
      if (light && gl2) gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.R8, gl2.RED, gl2.UNSIGNED_BYTE, source)
      else g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, source)
    } catch {
      // (a picture the page may not read: the gate stands alone)
      exchangeSent = 9
      return
    }
    if (light && gl2) {
      gl2.generateMipmap(gl2.TEXTURE_2D)
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR_MIPMAP_LINEAR)
    }
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close()
    exchangeSources[exchangeSent] = null
    exchangeSent++
    if (exchangeSent === 4 && reduced.matches) exchangeIn = 1
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
  /** The journey runs over all of its height but the last stretch (`held`, px). Over that stretch its last
   *  picture stays, and goes out: `duskAim` runs 0 to 1 there. */
  let held = 0
  let duskAim = 0
  let dusk = 0
  const progress = () => {
    const run = Math.max(1, journey.offsetHeight - innerHeight - held)
    const gone = -journey.getBoundingClientRect().top
    duskAim = held > 0 ? clamp((gone - run) / held) : 0
    return clamp(gone / run)
  }
  /** Where the page has put the three boxes, as the shader counts: in screen heights, across from the middle
   *  of the stage and up from its bottom. (Layout offsets: the blocks' transforms do not move them.) */
  const place = { body: [0, 0.59, 0.43], gate: [0.095, 0.9, 0.555], gateX: 0, room: Infinity, free: 1, clear: 0 }
  /** Where the hero is the room. The films' box, as the shader counts (its middle, half its width and half
   *  its height), and how much of it melts into the page at either side; the drop's radius; where each film's
   *  bulb hangs and how wide that film is drawn (`bulbs`, read off the films whenever the screen has changed);
   *  and the lamp, which is at the bulb of the film that is in the box, or on its way from one to the next. */
  const screen = { box: [0, 0.55, 0.43, 0.31], side: R.side as number, drop: 0.11, bulbs: [[-0.15, 0.78, 0.86]], lamp: [-0.15, 0.78, 0.86] }
  /** Whether the column at the gate is shown (there is room for it): it has the call to action then, and the
   *  header's own goes while the gate stands. */
  let sideShown = false
  /** With the exchange at the right: whether the screen has the bar's row (the header's call to action is the
   *  last thing in it, and stays), or only the button that opens the way around (the header's gives way to it). */
  const row = window.matchMedia(ROW)
  let gives = false
  /** Which film is in the box (-1: none, the box is not to be seen), and whether the films have been asked for. */
  let filmIn = -1
  let filmsAsked = false

  function measure() {
    held = hold.offsetHeight
    target = progress()
    const sw = Math.max(1, stage.clientWidth)
    const sh = Math.max(1, stage.clientHeight)
    place.body = [
      (sculpture.offsetLeft + sculpture.offsetWidth / 2 - sw / 2) / sh,
      1 - (sculpture.offsetTop + sculpture.offsetHeight / 2) / sh,
      sculpture.offsetWidth / 2 / sh,
    ]
    // (a column that is no longer in the page is not shown: the page can be built anew under the journey)
    sideShown = !!side && side.isConnected && getComputedStyle(side).display !== 'none'
    gives = sided ? !row.matches : sideShown
    if (films?.box) {
      // the films' box is laid where the hero's layout has its place, under the canvas
      const box = films.box
      box.style.left = `${sculpture.offsetLeft}px`
      box.style.top = `${sculpture.offsetTop}px`
      box.style.width = `${sculpture.offsetWidth}px`
      box.style.height = `${sculpture.offsetHeight}px`
      screen.box = [place.body[0], place.body[1], place.body[2], sculpture.offsetHeight / 2 / sh]
      // (a box that runs from edge to edge of the screen keeps its sides: the screen's edges are its own)
      screen.side = sculpture.offsetWidth >= sw - 1 ? 0 : R.side
      // (the drop is as large as it was when it carried the mark: a share of half the mark's width)
      screen.drop = J.body.drop * 0.43 * Math.min(1, sw / sh)
      // where the films' bulbs hang, now that the box is laid
      const rect = stage.getBoundingClientRect()
      const bulbs = films
        .lights()
        .filter((at) => at.width > 0)
        .map((at) => [(at.x - rect.left - rect.width / 2) / sh, 1 - (at.y - rect.top) / sh, at.width / sh])
      if (bulbs.length) screen.bulbs = bulbs
      // (no films: the lamp hangs where the drop stood, in the middle of the eye, as large as the first film's
      // bulb would be, the film covering the box)
      if (filmsAfter) {
        const wide = sculpture.offsetWidth / Math.max(1, sculpture.offsetHeight) > SHAPE
        screen.bulbs = [[0, 0.5, (wide ? sculpture.offsetWidth : sculpture.offsetHeight * SHAPE) / sh]]
      }
    }
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
    if (exchanged) g.uniform1f(u.exchange, exchangeSent === 4 ? exchangeIn : 0)
    if (films) {
      g.uniform3f(u.lamp, screen.lamp[0], screen.lamp[1], screen.lamp[2])
      g.uniform4f(u.room, screen.box[0], screen.box[1], screen.box[2], screen.box[3])
      g.uniform1f(u.drop, screen.drop)
      g.uniform1f(u.roomSide, screen.side)
    }
    if (!pictured && !exchanged && s > B.stand[0]) {
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
  const pictureBeats = { ...B, closing: when.picture.copy }

  function frame(now: number) {
    const dt = Math.min(64, now - last || 16)
    last = now
    current += (target - current) * (reduced.matches ? 1 : 1 - Math.exp(-dt / J.ease))
    if (Math.abs(target - current) < 0.00002) current = target
    const s = filmsAfter ? along(current) : current
    // the light stays while what follows comes up over it, then goes out: the stage is Ink before it leaves
    if (dusk !== duskAim) {
      dusk = reduced.matches ? duskAim : dusk + (duskAim - dusk) * (1 - Math.exp(-dt / 70))
      if (Math.abs(duskAim - dusk) < 0.0005) dusk = duskAim
      // (with the films after the hero, the light goes out sooner: within the first quarter of the hold, so the river
      // is dark before the films' box comes up across it)
      stage.style.setProperty('--dusk', (pour ? smooth(0.62, 0.96, dusk) : filmsAfter ? smooth(0, 0.26, dusk) : smooth(0.1, 0.66, dusk)).toFixed(3))
      // (the closing words go first: see below)
      drawnS = -1
    }
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
      const beats = flat ? { ...B, ...when.stillBeats } : pictured || exchanged ? pictureBeats : B
      // (the line leaves in the first half of the beat: the body fills with light in the second)
      const heroOut = smooth(0, 0.5, smooth(beats.heroOut[0], beats.heroOut[1], s))
      hero.style.opacity = String(smooth(beats.word[0], beats.word[1], s) * (1 - heroOut))
      hero.style.filter = heroOut > 0 ? `blur(${(heroOut * 10).toFixed(2)}px)` : ''
      hero.style.transform = heroOut > 0 ? `scale(${(1 + heroOut * 0.025).toFixed(4)})` : ''
      // the closing words come out from the gate (journey.module.css moves them by --in)
      const closingIn = smooth(beats.closing[0], beats.closing[1], s)
      // (when the journey holds, its words go out at once, before the river's light: other words come up
      // over them)
      const closingThere = closingIn * (1 - (filmsAfter ? smooth(0, 0.12, dusk) : smooth(0.02, 0.3, dusk)))
      closing.style.opacity = String(closingThere)
      // (with the films the closing has links in it: they can be used only while it is there)
      if (films) closing.inert = closingThere < 0.6
      closing.style.setProperty('--in', closingIn.toFixed(4))
      // (the logo that stays comes with the closing, where the closing's own would be, and stays. After the hero it
      // is its mark alone, a little larger: its word goes as the closing's words go, and comes back with them;
      // SwimLogo.tsx is told, and draws the mark at its size)
      if (logo) {
        logo.style.opacity = String(closingIn)
        logo.style.pointerEvents = closingIn > 0.6 ? 'auto' : 'none'
        logo.inert = closingIn < 0.6
        const after = (filmsAfter ? smooth(0, 0.12, dusk) : smooth(0.02, 0.3, dusk)).toFixed(4)
        if (logo.style.getPropertyValue('--after') !== after) {
          logo.style.setProperty('--after', after)
          logo.dispatchEvent(new Event('after'))
        }
      }
      // With the films the header is the call to action alone. It comes with the first film and stays for the
      // rest of the page, but for the gate: there the column at the right has the call to action, where the
      // header's would stand, so the header's goes as the gate comes to stand and is back when the journey's
      // last picture goes out. (On a screen with no room for the column it simply stays. With the exchange at the
      // right it stays where the bar has its row, being the last thing in it; where the bar has only the button
      // that opens the way around, it gives way to that button, which stands in its place.)
      const forGate = films && gives ? smooth(beats.stand[0], beats.stand[1], s) * (1 - (filmsAfter ? smooth(0.1, 0.24, dusk) : smooth(0.3, 0.6, dusk))) : 0
      // (With the films after the hero the first screen is the opening words alone: the call to action is then there
      // from that screen on, in its one place for the whole page, so that there is one to use before any scrolling.
      // &call=late brings it in after the hero, as it was.)
      const headerAt = filmsAfter ? headerAfter : beats.header
      const headerIn = (filmsAfter && !callLate ? 1 : smooth(headerAt[0], headerAt[1], s)) * (1 - forGate)
      header.style.opacity = String(headerIn)
      header.style.pointerEvents = headerIn > 0.6 ? 'auto' : 'none'
      header.inert = headerIn < 0.6
    }

    if (films?.box) {
      // The room. Its box is there from the moment the lamp's light begins to reach until it has drawn back
      // for the last time, and a film plays only while it is in the box.
      // Which film: the first until the middle of the first change, then the next. (The shader has drawn the
      // light back to the lamp by then: the box is dark while its film is changed.)
      let which = 0
      for (const turn of turns) if (s >= turn.at) which++
      // (without a picture there is no lamp: the room comes and goes with the hero's words)
      const shown = !filmsAfter && (flat ? Number(hero.style.opacity) > 0.001 : drawing && s > roomOpen[0] - when.span(0.004) && s < roomShut[1] + when.span(0.004))
      const film = shown ? which : -1
      if (film !== filmIn) {
        if (film < 0 !== filmIn < 0) films.box.style.visibility = shown ? 'visible' : 'hidden'
        filmIn = film
        films.show(film)
      }
      // The lamp hangs where the bulb of that film hangs, and goes over to the next bulb in the dark.
      const bulbs = screen.bulbs
      let lamp = bulbs[0]
      turns.forEach((turn, i) => {
        const to = bulbs[Math.min(bulbs.length - 1, i + 1)]
        const over = smooth(turn.over[0], turn.over[1], s)
        if (over > 0) lamp = lamp.map((v, k) => v + (to[k] - v) * over)
      })
      screen.lamp = lamp
      if (drawnS !== s) {
        // Each film's words come as its room opens and go as the light draws back from it: into focus and up
        // a little, out of focus and on. (The first film's come with the hero and the last film's go with it:
        // above.)
        says.forEach((say, i) => {
          const come = i === 0 ? 1 : smooth(turns[i - 1].wordsIn[0], turns[i - 1].wordsIn[1], s)
          const go = i < turns.length ? smooth(turns[i].wordsOut[0], turns[i].wordsOut[1], s) : 0
          const there = come * (1 - go)
          const soft = (1 - come) * 12 + go * 10
          const shift = (1 - come) * 14 - go * 10
          for (const el of say) {
            el.style.opacity = there.toFixed(3)
            el.style.visibility = there > 0.001 ? '' : 'hidden'
            el.style.filter = soft > 0.01 && there > 0.001 ? `blur(${soft.toFixed(2)}px)` : ''
            el.style.transform = Math.abs(shift) > 0.01 ? `translate3d(0, ${shift.toFixed(2)}px, 0)` : ''
          }
        })
        // (without a picture the box itself goes dark between two films)
        if (flat) {
          let lit = Number(hero.style.opacity)
          for (const turn of turns) lit *= 1 - smooth(turn.shut[0], turn.shut[1], s) * (1 - smooth(turn.open[0], turn.open[1], s))
          films.box.style.opacity = lit.toFixed(3)
        }
      }
      // (The films are fetched once the page has been let go and its opening words stand still, or at the
      // first scroll: a film's first frame makes the graphics process set up its decoder, which cost a late
      // frame while the words were still coming into focus.)
      if (!filmsAsked && state.opened && (now - state.openedAt > J.intro.delay + J.intro.focus + 400 || target > 0.01)) {
        filmsAsked = true
        films.fetch()
      }
      // (the mark's outline, where the light goes to the gate as the mark: worked out in a quiet moment after that)
      if (viaMark && !markAsked && state.opened && now - state.openedAt > J.intro.delay + J.intro.focus + 900) {
        markAsked = true
        if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => buildMark(), { timeout: 2000 })
        else window.setTimeout(buildMark, 0)
      }
    }

    if (ready && active && gl && program) {
      if (!drawing && mayBegin(now)) begin()
      if (drawing) {
        // (fields that were not there for the first picture go with the next)
        if (!markSent && (!films || viaMark)) sendMark()
        if (pictureSource && (target === current || s > B.heroOut[0])) sendPicture()
        if (pictureSent && pictureIn < 1) pictureIn = Math.min(1, pictureIn + dt / 240)
        if (exchanged && exchangeSent < 4 && (target === current || s > B.heroOut[0])) sendExchange()
        if (exchangeSent === 4 && exchangeIn < 1) exchangeIn = Math.min(1, exchangeIn + dt / 240)
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
  // (the films' box is laid by the script: it is laid again whenever the stage changes its size, which a
  // scrollbar that comes or goes does without the window changing its own)
  const sized = films ? new ResizeObserver(() => measure()) : null
  sized?.observe(stage)
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
    sized?.disconnect()
    removeEventListener('scroll', onScroll)
    removeEventListener('resize', measure)
    stage.removeEventListener('pointermove', onMove)
    stage.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('blur', onLeave)
    if (gl) {
      textures.forEach((t) => gl!.deleteTexture(t))
      if (buffer) gl.deleteBuffer(buffer)
      // (the program is not thrown away: it stays with its canvas, see `built`)
    }
    delete journey.dataset.webgl
    delete journey.dataset.shader
    delete journey.dataset.drawn
    delete journey.dataset.gate
    if (films?.box) {
      films.show(-1)
      films.box.style.visibility = ''
      films.box.style.opacity = ''
      journey.style.removeProperty('--room-stay')
    }
    for (const say of says) for (const el of say) el.removeAttribute('style')
  }
}
