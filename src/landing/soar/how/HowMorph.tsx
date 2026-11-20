/**
 * How it works, on the Ink (&ground=ink): one glass shape that becomes each stage of a trade in turn, as the reference
 * widget does (uberdesigner.ai's energy morph, studied frame by frame). The page is held while the stages go by; the
 * scroll says which stage it is, and the glass then morphs into it in its own time, as the reference's does (so it is
 * never left half way). Beside it, the stages by name, and what happens in the one shown.
 *
 * The stages and their shapes: the order sealed on the device (a circle the seal's light rises in, over the number:
 * under it the number is Ink); the public inbox (a wide capsule: the last blocks, 250 ms apart, this request's
 * lit, and the request as anyone sees it); the sealed engine (a pill: two sealed orders become one); the proof (a
 * rounded square: a ring of 44 that fills); the settlement (a tall capsule the liquid rises in and settles as three
 * layers, Hyperwood, Robinhood Chain and Ethereum, drawn on the GPU: the state falls in as a drop and sinks through
 * each, pressing it down, to the foot, where it settles; the receipt lifts out of the top: settleLiquid.ts). The number the glass
 * carries is the papers' target for the stage; it travels with the shape and dissolves into the next at the middle of
 * a morph.
 *
 * The glass keeps its layers through every morph, as the reference's: a gradient body, a light from its foot, a sheen
 * from above, a grain, a bevel, a hairline rim, and a halo behind it; in the page's colours (Ink, and Hyper Neon for
 * every light). Every motion is a pure function of a time (motion.ts); one frame loop writes straight to the page, and
 * only what changed. It runs only while the section is on the screen. Under reduced motion each stage is shown whole.
 *
 * The words: `soar.how` in content.home.ts. Where everything stands: howMorph.module.css.
 */
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { home } from '../../../content.home'
import { filmGrain } from '../../grain'
import { whenStill } from '../../still'
import {
  BLOCKS,
  BLOCK_MAX,
  BLUR_OUT,
  CAPTION_AT,
  CAPTION_RISE,
  DROPS,
  LIQUID,
  NUMBER_AT,
  OURS,
  RING,
  RING_GEO,
  ROW,
  SHAPES,
  STAGE,
  barGrow,
  chipIn,
  clamp01,
  contentIn,
  contentOut,
  dropsAt,
  haloOpacity,
  innerGlow,
  lerp,
  liquidWave,
  mixGeo,
  morphAt,
  numberIn,
  numberOut,
  ringLit,
  sealLevel,
  waveY,
  type Geo,
} from './motion'
import { COLUMN, settleAt, settleLiquid } from './settleLiquid'
import s from './howMorph.module.css'

const H = home.soar.how
const G = H.glass
const COUNT = H.steps.length
/** each stage's number, split into a sign before it (<, ≤), its value and its unit */
const FIGURES = H.steps.map((step) => {
  const at = step.figure.lastIndexOf(' ')
  const [value, unit] = at < 0 ? [step.figure, ''] : [step.figure.slice(0, at), step.figure.slice(at + 1)]
  const sign = /^[^0-9]/.test(value) ? value[0] : ''
  return [sign, value.slice(sign.length), unit]
})
const MID = STAGE / 2

/* ------------------------------------------------------------------ the ring's 44, and their colours */
const C = RING_GEO.size / 2
const point = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return `${(C + Math.cos(a) * r).toFixed(2)} ${(C + Math.sin(a) * r).toFixed(2)}`
}
/** from a deep Neon (Ink and Neon mixed) to the Neon itself, along the ring */
const RING_COLORS = [
  [91, 113, 6],
  [150, 186, 3],
  [204, 255, 0],
]
const segmentColor = (f: number) => {
  const [a, b] = f < 0.5 ? [RING_COLORS[0], RING_COLORS[1]] : [RING_COLORS[1], RING_COLORS[2]]
  const k = f < 0.5 ? f * 2 : f * 2 - 1
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`
}
const SEGMENTS = Array.from({ length: RING.segments }, (_, k) => {
  const { r, thick, start, sweep, fill } = RING_GEO
  const a0 = start + (sweep * k) / RING.segments
  const a1 = start + (sweep * (k + fill)) / RING.segments
  const ro = r + thick
  const ri = r - thick
  return {
    d: `M${point(a0, ro)} A${ro} ${ro} 0 0 1 ${point(a1, ro)} L${point(a1, ri)} A${ri} ${ri} 0 0 0 ${point(a0, ri)} Z`,
    color: segmentColor(k / (RING.segments - 1)),
  }
})
const OFF = 'rgba(244, 245, 240, 0.05)'

/* ------------------------------------------------------------------ two drops and the bridge between them */
/** The outline that joins two circles (r1 at c1, r2 at c2) as two drops of a liquid join: the curves from one to the
 *  other, drawn with the circles under it (a well-known construction, after Hiroyuki Sato's metaballs). */
function bridge(c1: [number, number], r1: number, c2: [number, number], r2: number, v = 0.5, handle = 2.4) {
  const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1])
  const maxD = r1 + r2 * 2.5
  if (d > maxD || d <= Math.abs(r1 - r2) + 0.01) return ''
  const u1 = d < r1 + r2 ? Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d)) : 0
  const u2 = d < r1 + r2 ? Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d)) : 0
  const between = Math.atan2(c2[1] - c1[1], c2[0] - c1[0])
  const spread = Math.acos((r1 - r2) / d)
  const a1 = between + u1 + (spread - u1) * v
  const a2 = between - u1 - (spread - u1) * v
  const a3 = between + Math.PI - u2 - (Math.PI - u2 - spread) * v
  const a4 = between - Math.PI + u2 + (Math.PI - u2 - spread) * v
  const at = (c: [number, number], a: number, r: number): [number, number] => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]
  const p1 = at(c1, a1, r1)
  const p2 = at(c1, a2, r1)
  const p3 = at(c2, a3, r2)
  const p4 = at(c2, a4, r2)
  const total = r1 + r2
  const d2 = Math.min(v * handle, Math.hypot(p1[0] - p3[0], p1[1] - p3[1]) / total) * Math.min(1, (d * 2) / total)
  const h1 = at(p1, a1 - Math.PI / 2, r1 * d2)
  const h2 = at(p2, a2 + Math.PI / 2, r1 * d2)
  const h3 = at(p3, a3 + Math.PI / 2, r2 * d2)
  const h4 = at(p4, a4 - Math.PI / 2, r2 * d2)
  const n = (p: [number, number]) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`
  return `M${n(p1)} C${n(h1)} ${n(h3)} ${n(p3)} A${r2.toFixed(2)} ${r2.toFixed(2)} 0 ${d > r1 ? 1 : 0} 0 ${n(p4)} C${n(h4)} ${n(h2)} ${n(p2)} Z`
}

/* ------------------------------------------------------------------ writing to the page: only what changed */
const said = new WeakMap<Element, Record<string, string>>()
const changed = (el: Element, key: string, value: string) => {
  let had = said.get(el)
  if (!had) said.set(el, (had = {}))
  if (had[key] === value) return false
  had[key] = value
  return true
}
const put = (el: HTMLElement | SVGElement | null | undefined, prop: string, value: string) => {
  if (el && changed(el, prop, value)) el.style.setProperty(prop, value)
}
const set = (el: Element | null | undefined, name: string, value: string | null) => {
  if (!el || !changed(el, '@' + name, value ?? '\u0000')) return
  if (value === null) el.removeAttribute(name)
  else el.setAttribute(name, value)
}

/** The blur of a fading number, as the reference's (up to 6 px as it goes), in four steps: each size of blur is a
 *  program the GPU makes the first time it is drawn, a continuous one made a new one at every step (a frame held
 *  back on a phone, measured), and the four are drawn once beforehand (the rehearsal, below). The opacity goes on
 *  smoothly over them. */
const BLURS = [1.5, 3, 4.5, 6]
const blurOf = (faint: number) => {
  const b = Math.round((faint * BLUR_OUT) / 1.5) * 1.5
  return b > 0 ? `blur(${b}px)` : 'none'
}

/** what is going on: the stage shown or coming (`to`), since when, and where everything was when it began */
type Run = { to: number; start: number; from: Geo; fromPos: [number, number, number]; visAt: number[]; numAt: number[]; instant: boolean }

export function HowMorph() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [on, setOn] = useState(0)
  const root = useRef<HTMLElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const widget = useRef<HTMLDivElement>(null)
  const halo = useRef<HTMLDivElement>(null)
  const shade = useRef<HTMLDivElement>(null)
  const shell = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const liquid = useRef<SVGSVGElement>(null)
  const waves = useRef<(SVGPathElement | null)[]>([])
  const row = useRef<HTMLDivElement>(null)
  const columns = useRef<(HTMLDivElement | null)[]>([])
  const fills = useRef<(HTMLDivElement | null)[]>([])
  const chip = useRef<HTMLParagraphElement>(null)
  const drops = useRef<SVGSVGElement>(null)
  const dropParts = useRef<(SVGElement | null)[]>([])
  const ring = useRef<SVGSVGElement>(null)
  const segs = useRef<(SVGPathElement | null)[]>([])
  /** the last stage's box, and the canvas its liquid is drawn into */
  const settle = useRef<HTMLDivElement>(null)
  const settleCanvas = useRef<HTMLCanvasElement>(null)
  const layerNames = useRef<(HTMLParagraphElement | null)[]>([])
  const receipt = useRef<HTMLParagraphElement>(null)
  const nums = useRef<(HTMLDivElement | null)[]>([])
  const ink = useRef<HTMLSpanElement>(null)
  const caps = useRef<(HTMLParagraphElement | null)[]>([])

  useEffect(() => {
    const section = root.current
    const frame = box.current
    const room = stage.current
    if (!section || !frame || !room) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const clock = () => performance.now() / 1000
    /** the last stage's liquid (made on its first drawing) */
    const liquid4 = settleCanvas.current ? settleLiquid(settleCanvas.current) : null
    /** each number's own width (stage px, its layout width: the stage's scale does not change it) */
    let widths: number[] = []
    /** the receipt's own size (stage px), so it lifts out of the liquid as itself on any screen */
    let receiptHeight = 37
    let receiptWidth = 150
    const measure = () => {
      widths = nums.current.map((el) => el?.offsetWidth ?? 0)
      receiptHeight = receipt.current?.offsetHeight || receiptHeight
      receiptWidth = receipt.current?.offsetWidth || receiptWidth
    }
    const posOf = (i: number): [number, number, number] => {
      const a = NUMBER_AT[i]
      return [a.x === 'centre' ? (-(widths[i] || 0) * a.scale) / 2 : a.x, a.y, a.scale]
    }
    let run: Run = { to: 0, start: clock(), from: SHAPES[0], fromPos: [0, 0, 1], visAt: [1, 0, 0, 0, 0], numAt: [1, 0, 0, 0, 0], instant: true }
    /** when each stage's own time began (its morph's start) */
    const entered = [clock(), 0, 0, 0, 0]
    /** whether each stage's content was drawn last time (a hidden one is drawn once more, faded out, then left) */
    const live = [true, true, true, true, true]
    const showing = (i: number, v: number) => {
      const was = live[i]
      live[i] = v > 0.001
      return live[i] || was
    }

    const now = (t: number) => {
      const since = t - run.start
      const k = run.instant ? 1 : morphAt(since)
      const geo = run.instant ? SHAPES[run.to] : mixGeo(run.from, SHAPES[run.to], k)
      const vis = run.visAt.map((v, i) => (i === run.to ? (run.instant ? 1 : Math.max(v, contentIn(since))) : run.instant ? 0 : v * contentOut(since)))
      const num = run.numAt.map((v, i) => (i === run.to ? (run.instant ? 1 : Math.max(v, numberIn(since))) : run.instant ? 0 : v * numberOut(since)))
      const aim = posOf(run.to)
      const pos = (run.instant ? aim : run.fromPos.map((v, j) => lerp(v, aim[j], k))) as [number, number, number]
      return { geo, vis, num, pos }
    }
    const go = (to: number, t: number) => {
      const was = now(t)
      run = { to, start: t, from: was.geo, fromPos: was.pos, visAt: was.vis, numAt: was.num, instant: reduced }
      entered[to] = reduced ? t - 10 : t
      setOn(to)
    }

    const draw = (t: number) => {
      const { geo, vis, num, pos } = now(t)
      const cx = geo.w / 2
      const cy = geo.h / 2
      const own = entered.map((e) => (reduced ? 10 : t - e))
      // ---- the glass, its halo, its light
      const sh = shell.current
      put(sh, 'width', `${geo.w.toFixed(2)}px`)
      put(sh, 'height', `${geo.h.toFixed(2)}px`)
      put(sh, 'left', `${(MID - cx).toFixed(2)}px`)
      put(sh, 'top', `${(MID - cy).toFixed(2)}px`)
      put(sh, 'border-radius', `${geo.rt.toFixed(2)}px ${geo.rt.toFixed(2)}px ${geo.rb.toFixed(2)}px ${geo.rb.toFixed(2)}px`)
      const sw = geo.w + 150
      const sh2 = geo.h + 150
      put(shade.current, 'transform', `translate(${(MID - sw / 2).toFixed(2)}px, ${(MID - sh2 / 2 + 40).toFixed(2)}px) scale(${(sw / 100).toFixed(4)}, ${(sh2 / 100).toFixed(4)})`)
      // (the halo: the reference's is 1.05 by 0.9 of the glass, 40 px lower, and blurred 70 px; this one is drawn soft,
      // so it is that and 140 px more each way)
      const hw = geo.w * 1.05 + 280
      const hh = geo.h * 0.9 + 280
      put(halo.current, 'transform', `translate(${(MID - hw / 2).toFixed(2)}px, ${(MID - hh / 2 + 40).toFixed(2)}px) scale(${(hw / 100).toFixed(4)}, ${(hh / 100).toFixed(4)})`)
      put(halo.current, 'opacity', haloOpacity(vis).toFixed(3))
      const level = sealLevel(own[0])
      put(glow.current, 'opacity', innerGlow(vis, level).toFixed(3))

      // ---- sealed: the liquid rises in the circle
      const lq = liquid.current
      const grow = 1 + 0.15 * (1 - vis[0])
      if (vis[0] > 0.001 || num[0] > 0.001) {
        const { y0, amp, phase } = liquidWave(own[0], reduced ? 3 : t)
        const N = LIQUID.size
        const body = (offset: number, a: number, cycles: number) => {
          let d = `M0 ${N} L0 ${y0.toFixed(2)}`
          for (let x = 0; x <= N; x += LIQUID.step) d += ` L${x} ${waveY(x, y0, offset, a, cycles, phase).toFixed(2)}`
          return `${d} L${N} ${N} Z`
        }
        let crest = ''
        for (let x = 0; x <= N; x += LIQUID.step) crest += `${x ? ' L' : 'M'}${x} ${waveY(x, y0, 0, amp, LIQUID.front.cycles, phase).toFixed(2)}`
        set(waves.current[0], 'd', body(LIQUID.back.offset, amp * LIQUID.back.ampScale, LIQUID.back.cycles))
        set(waves.current[1], 'd', body(LIQUID.front.offset, amp * LIQUID.front.ampScale, LIQUID.front.cycles))
        set(waves.current[2], 'd', crest)
        set(waves.current[3], 'd', crest)
        // (the number under the surface is Ink: its Ink copy is cut to the liquid, in the number's own measure)
        const [nx, ny, ns] = pos
        let cut = ''
        for (let x = -LIQUID.step * 4; x <= N + LIQUID.step * 4; x += LIQUID.step) {
          const sx = cx + (x - N / 2) * grow
          const sy = cy + (waveY(x, y0, 0, amp, LIQUID.front.cycles, phase) - N / 2) * grow
          cut += `${cut ? ' L' : 'M'}${((sx - cx - nx) / ns).toFixed(1)} ${((sy - cy - ny) / ns).toFixed(1)}`
        }
        const far = ((N / 2) * grow + 400) / ns
        cut += ` L${far.toFixed(1)} ${far.toFixed(1)} L${(-far).toFixed(1)} ${far.toFixed(1)} Z`
        put(ink.current, 'clip-path', `path('${cut}')`)
        put(ink.current, 'opacity', vis[0].toFixed(3))
      }
      put(lq, 'opacity', vis[0].toFixed(3))
      put(lq, 'transform', `scale(${grow.toFixed(4)})`)

      // ---- accepted: the blocks rise, this request's lit, and the request as anyone sees it
      if (showing(1, vis[1])) {
        put(row.current, 'left', `${(cx + ROW.x).toFixed(2)}px`)
        put(row.current, 'top', `${(cy + ROW.y).toFixed(2)}px`)
        put(row.current, 'opacity', vis[1].toFixed(3))
        BLOCKS.forEach((n, i) => {
          put(fills.current[i], 'height', `${((n / BLOCK_MAX) * ROW.h * barGrow(i, own[1])).toFixed(2)}px`)
          put(columns.current[i], 'opacity', vis[1].toFixed(3))
        })
        const c = chipIn(own[1]) * vis[1]
        put(chip.current, 'left', `${(cx + ROW.x + ROW.w).toFixed(2)}px`)
        put(chip.current, 'top', `${(cy + ROW.y + ROW.h - (BLOCKS[OURS] / BLOCK_MAX) * ROW.h - ROW.chipAbove).toFixed(2)}px`)
        put(chip.current, 'opacity', c.toFixed(3))
        put(chip.current, 'transform', `translate(-100%, ${((1 - c) * 10).toFixed(2)}px)`)
      }

      // ---- matched: two sealed orders come together and are one
      const dp = drops.current
      if (vis[2] > 0.001 || num[2] > 0.001) {
        const { d, r, swing, bob } = dropsAt(own[2])
        const a: [number, number] = [-d / 2, DROPS.y + bob]
        const b: [number, number] = [d / 2, DROPS.y - bob]
        const [one, two, join, shineA, shineB] = dropParts.current
        set(one, 'cx', a[0].toFixed(2))
        set(one, 'cy', a[1].toFixed(2))
        set(two, 'cx', b[0].toFixed(2))
        set(two, 'cy', b[1].toFixed(2))
        set(one, 'r', (r * (1 + swing)).toFixed(2))
        set(two, 'r', (r * (1 + swing)).toFixed(2))
        set(join, 'd', d > 0.5 ? bridge(a, r, b, r) : '')
        // (a light on each, high on its left, as on a drop)
        const shine = (el: SVGElement | null | undefined, c: [number, number]) => {
          set(el, 'cx', (c[0] - r * 0.3).toFixed(2))
          set(el, 'cy', (c[1] - r * 0.52).toFixed(2))
          set(el, 'rx', (r * 0.42).toFixed(2))
          set(el, 'ry', (r * 0.22).toFixed(2))
        }
        shine(shineA, a)
        shine(shineB, b)
        put(dp, 'transform', `scale(${(1 + swing * 0.6).toFixed(4)}, ${(1 - swing * 0.6).toFixed(4)})`)
      }
      put(dp, 'opacity', vis[2].toFixed(3))

      // ---- proven: the ring fills
      const rg = ring.current
      if (showing(3, vis[3])) {
        const lit = ringLit(own[3])
        SEGMENTS.forEach((seg, k) => {
          const el = segs.current[k]
          const o = clamp01(lit - k)
          set(el, 'fill', o > 0 ? seg.color : OFF)
          set(el, 'fill-opacity', o > 0 ? (0.35 + 0.65 * o).toFixed(3) : '1')
        })
      }
      put(rg, 'opacity', vis[3].toFixed(3))
      put(rg, 'transform', `scale(${(0.92 + 0.08 * vis[3]).toFixed(4)}) rotate(${((1 - vis[3]) * -12).toFixed(3)}deg)`)

      // ---- settled: the liquid rises and settles in three layers; the state sinks through them to the foot; the
      // receipt lifts out of the top (its place and its coming are the liquid's: settleLiquid.ts)
      if (showing(4, vis[4])) {
        const st = settleAt(own[4], { w: receiptWidth, h: receiptHeight })
        liquid4?.draw(st, reduced ? 0 : t)
        layerNames.current.forEach((el) => put(el, 'opacity', st.names.toFixed(3)))
        put(receipt.current, 'left', `${cx.toFixed(2)}px`)
        put(receipt.current, 'top', `${(cy - 280 + st.chipY - receiptHeight / 2).toFixed(2)}px`)
        put(receipt.current, 'opacity', (st.words * vis[4]).toFixed(3))
        put(receipt.current, 'transform', 'translateX(-50%)')
      }
      put(settle.current, 'opacity', vis[4].toFixed(3))
      put(settle.current, 'transform', `translateY(${((1 - vis[4]) * 14).toFixed(2)}px)`)

      // ---- the number, one place for all five; and the captions
      const [x, y, sc] = pos
      nums.current.forEach((el, i) => {
        put(el, 'transform', `translate(${(cx + x).toFixed(2)}px,${(cy + y).toFixed(2)}px) scale(${sc.toFixed(4)})`)
        put(el, 'opacity', num[i].toFixed(3))
        put(el, 'filter', blurOf(1 - num[i]))
        put(el, 'visibility', num[i] > 0.001 ? 'visible' : 'hidden')
      })
      caps.current.forEach((el, i) => {
        const a = CAPTION_AT[i]
        put(el, 'left', `${(cx + a.x).toFixed(2)}px`)
        put(el, 'top', `${(cy + a.y).toFixed(2)}px`)
        put(el, 'opacity', vis[i].toFixed(3))
        const rise = ((1 - vis[i]) * CAPTION_RISE).toFixed(2)
        put(el, 'transform', a.left ? `translateY(${rise}px)` : `translate(-50%, ${rise}px)`)
      })
    }

    // ---- which stage the scroll is at (with a little give at each change, so a page held still on one never flickers)
    const aimed = (r: DOMRect) => {
      const held = Math.max(1, r.height - innerHeight)
      const at = clamp01(-r.top / held) * COUNT
      const to = run.to
      if (at > to + 1 + 0.04 || at < to - 0.04) return Math.min(COUNT - 1, Math.max(0, Math.floor(at)))
      return to
    }

    let raf = 0
    /** whether the stages have begun: the first begins its own time once the glass is well up the screen (so its
     *  light rises as it is looked at), or a page opened further down begins at the stage it is at */
    let begun = false
    let shown = false
    let ready = false
    const loop = () => {
      raf = 0
      if (!shown || !ready) return
      const t = clock()
      const r = section.getBoundingClientRect()
      const want = aimed(r)
      if (!begun) {
        if (want > 0 || r.top < innerHeight * 0.14) {
          begun = true
          run = { ...run, to: want, start: t, instant: true, visAt: run.visAt.map((_, i) => (i === want ? 1 : 0)), numAt: run.numAt.map((_, i) => (i === want ? 1 : 0)) }
          entered[want] = reduced ? t - 10 : t
          setOn(want)
        } else entered[0] = t
      } else if (want !== run.to) go(want, t)
      draw(t)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!raf && shown && ready) raf = requestAnimationFrame(loop)
    }
    const watch = new IntersectionObserver(
      ([entry]) => {
        shown = entry.isIntersecting
        start()
      },
      { rootMargin: '10% 0px' },
    )
    watch.observe(section)

    // ---- the stage fitted to its box (and the last stage's canvas to the pixels it is shown at)
    const fit = () => {
      const w = frame.clientWidth
      const h = frame.clientHeight
      const wide = innerWidth >= 1024 && innerWidth > innerHeight
      const k = Math.min(w / (wide ? 1000 : 820), h / (wide ? 820 : 620))
      room.style.transform = `translate(${((w - STAGE * k) / 2).toFixed(2)}px, ${((h - STAGE * k) / 2).toFixed(2)}px) scale(${k.toFixed(5)})`
      const px = k * Math.min(devicePixelRatio || 1, 2)
      liquid4?.size(Math.max(1, Math.round(340 * px)), Math.max(1, Math.round(560 * px)))
    }
    fit()
    const resized = new ResizeObserver(fit)
    resized.observe(frame)

    // ---- a rehearsal: each stage drawn once, unseen, before the reader comes to it. The first drawing of a kind of
    // thing (the blocks, the doorways' strokes, the arch, a blurred number) held the screen back a tenth of a second or
    // more while the GPU readied itself for it, each time a stage was first shown (measured on the production build,
    // in a fresh browser); drawn at a still moment while the section is a screen or two away, laid in the window at
    // 1.2 hundredths so that it is drawn (at 0.4 it was not, on a phone: that is one 255th, which may count as none),
    // it costs the reader nothing.
    let gone = false
    let rehearsed = false
    const frames = (n: number) =>
      new Promise<void>((done) => {
        const step = () => (n-- <= 0 ? done() : requestAnimationFrame(step))
        requestAnimationFrame(step)
      })
    const rehearse = async () => {
      if (rehearsed || shown || begun || !ready || reduced) return
      rehearsed = true
      const kept = run
      const keptEntered = [...entered]
      const only = (k: number) => run.visAt.map((_, i) => (i === k ? 1 : 0))
      // (laid where the stage is drawn, it was not readied: drawn in place while the section was away, the stages
      // still held frames back when they came, measured)
      room.style.position = 'fixed'
      room.style.opacity = '0.012'
      room.style.zIndex = '30'
      room.style.pointerEvents = 'none'
      for (let k = 0; k < COUNT && !gone; k++) {
        const t = clock()
        run = { to: k, start: t, from: SHAPES[k], fromPos: posOf(k), visAt: only(k), numAt: only(k), instant: true }
        // (the sealed stage twice: its surface across the number, then over it; the settlement with its drop falling,
        // then going in, then done)
        for (const own of k === 0 ? [1.1, 10] : k === 4 ? [1.7, 3, 10] : [10]) {
          entered[k] = clock() - own
          draw(clock())
          await frames(3)
        }
      }
      // (and each morph, early and late: a stage going as it grows or turns, the shape between two, the numbers faint and
      // blurred, the next stage coming)
      for (let k = 0; k < COUNT - 1 && !gone; k++) {
        for (const since of [0.25, 0.85]) {
          const t = clock()
          run = { to: k + 1, start: t - since, from: SHAPES[k], fromPos: posOf(k), visAt: only(k), numAt: only(k), instant: false }
          entered[k] = t - 10
          entered[k + 1] = t - since
          draw(t)
          await frames(3)
        }
      }
      // (and the numbers at each of their blurs)
      for (const b of BLURS) {
        if (gone) break
        nums.current.forEach((el) => {
          put(el, 'visibility', 'visible')
          put(el, 'opacity', '0.6')
          put(el, 'filter', `blur(${b}px)`)
        })
        await frames(3)
      }
      room.style.position = room.style.opacity = room.style.zIndex = room.style.pointerEvents = ''
      if (gone) return
      // (said on the section, for whoever measures the page)
      section.dataset.rehearsed = ''
      run = kept
      keptEntered.forEach((e, i) => (entered[i] = e))
      draw(clock())
    }
    let stopRehearsal = () => {}
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !rehearsed) {
          stopRehearsal()
          stopRehearsal = whenStill(() => void rehearse())
        }
      },
      { rootMargin: '0px 0px 250% 0px' },
    )
    near.observe(section)

    // ---- the first frame once the type is in (the numbers are measured by it); until then the glass is hidden
    document.fonts.ready.then(() => {
      if (gone) return
      measure()
      ready = true
      run = { ...run, fromPos: posOf(run.to) }
      draw(clock())
      widget.current?.removeAttribute('data-pending')
      start()
    })
    return () => {
      gone = true
      liquid4?.dispose()
      watch.disconnect()
      near.disconnect()
      stopRehearsal()
      resized.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [id])

  return (
    <section ref={root} id="how" className={s.how} aria-labelledby="how-title" style={{ '--film-grain': filmGrain() } as CSSProperties}>
      <div className={s.frame}>
        <div className={s.copy}>
          <h2 id="how-title" className={s.title}>
            <span>{H.title[0]}</span> <b>{H.title[1]}</b>
          </h2>
          <ol className={s.steps}>
            {H.steps.map((step, i) => (
              <li key={step.name} data-on={i === on ? '' : undefined} data-passed={i < on ? '' : undefined} aria-current={i === on ? 'step' : undefined}>
                <h3>{step.name}</h3>
                <div className={s.say}>
                  <b aria-hidden="true">{step.name}</b>
                  <p>{step.text}</p>
                  <p className={s.figure}>
                    {step.figure} <span>{step.of}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className={s.targets}>{H.targets}</p>
        </div>

        <div ref={box} className={s.box} aria-hidden="true">
          <div ref={stage} className={s.stage}>
            <div className={s.backdrop} />
            <div ref={widget} className={s.widget} data-pending="">
              <div ref={halo} className={s.halo} />
              <div ref={shade} className={s.shade} />
              <div ref={shell} className={s.shell}>
                <div className={s.base} />
                <div ref={glow} className={s.innerGlow} />
                <div className={s.topGlow} />

                {/* sealed: the seal's light rises in the circle */}
                <svg ref={liquid} className={s.liquid} width="300" height="300" viewBox="0 0 300 300">
                  <defs>
                    <clipPath id={`${id}clip`}>
                      <circle cx="150" cy="150" r="150" />
                    </clipPath>
                    <linearGradient id={`${id}front`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" style={{ stopColor: 'var(--liquid-top)', stopOpacity: 0.96 }} />
                      <stop offset="0.35" style={{ stopColor: 'var(--liquid-mid)', stopOpacity: 0.88 }} />
                      <stop offset="1" style={{ stopColor: 'var(--liquid-bottom)', stopOpacity: 0.9 }} />
                    </linearGradient>
                    <linearGradient id={`${id}back`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" style={{ stopColor: 'var(--liquid-back-top)', stopOpacity: 0.5 }} />
                      <stop offset="1" style={{ stopColor: 'var(--liquid-back-bottom)', stopOpacity: 0.55 }} />
                    </linearGradient>
                  </defs>
                  <g clipPath={`url(#${id}clip)`}>
                    <path ref={(el) => { waves.current[0] = el }} fill={`url(#${id}back)`} />
                    <path ref={(el) => { waves.current[1] = el }} fill={`url(#${id}front)`} />
                    <path ref={(el) => { waves.current[2] = el }} className={s.crestGlow} />
                    <path ref={(el) => { waves.current[3] = el }} className={s.crest} />
                  </g>
                </svg>

                {/* accepted: the last blocks of the public inbox, this request's lit */}
                <div ref={row} className={s.row}>
                  {BLOCKS.map((_, i) => (
                    <div key={i} ref={(el) => { columns.current[i] = el }} className={s.column}>
                      <div className={s.slot} />
                      <div ref={(el) => { fills.current[i] = el }} className={i === OURS ? s.fill : s.fillDim} />
                      <div className={s.day} data-ours={i === OURS ? '' : undefined}>
                        {G.blocks[i]}
                      </div>
                    </div>
                  ))}
                </div>
                <p ref={chip} className={s.chip}>
                  <span className={s.dot} />
                  {G.request}
                </p>

                {/* matched: two sealed orders become one */}
                <svg ref={drops} className={s.drops} width="640" height="330" viewBox="-320 -165 640 330">
                  <defs>
                    <linearGradient id={`${id}drop`} gradientUnits="userSpaceOnUse" x1="0" y1="-10" x2="0" y2="130">
                      <stop offset="0" style={{ stopColor: 'var(--liquid-top)' }} />
                      <stop offset="0.4" style={{ stopColor: 'var(--liquid-mid)' }} />
                      <stop offset="1" style={{ stopColor: 'var(--liquid-bottom)' }} />
                    </linearGradient>
                    <radialGradient id={`${id}shine`}>
                      <stop offset="0" stopColor="#fbfff0" stopOpacity="0.62" />
                      <stop offset="1" stopColor="#fbfff0" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <g fill={`url(#${id}drop)`}>
                    <circle ref={(el) => { dropParts.current[0] = el }} cx="-190" cy={DROPS.y} r={DROPS.r} />
                    <circle ref={(el) => { dropParts.current[1] = el }} cx="190" cy={DROPS.y} r={DROPS.r} />
                    <path ref={(el) => { dropParts.current[2] = el }} />
                  </g>
                  <g fill={`url(#${id}shine)`}>
                    <ellipse ref={(el) => { dropParts.current[3] = el }} />
                    <ellipse ref={(el) => { dropParts.current[4] = el }} />
                  </g>
                </svg>

                {/* proven: a ring of 44 that fills */}
                <svg ref={ring} className={s.ring} width={RING_GEO.size} height={RING_GEO.size} viewBox={`0 0 ${RING_GEO.size} ${RING_GEO.size}`}>
                  <g>
                    {SEGMENTS.map((seg, k) => (
                      <path key={k} ref={(el) => { segs.current[k] = el }} d={seg.d} fill={OFF} />
                    ))}
                  </g>
                </svg>

                {/* settled: a column of three liquids, the state settling through it (settleLiquid.ts) */}
                <div ref={settle} className={s.settle}>
                  <canvas ref={settleCanvas} className={s.settleCanvas} />
                  {G.layers.map((name, i) => (
                    <p key={name} ref={(el) => { layerNames.current[i] = el }} className={s.layerName} data-layer={i} style={{ top: `${(((i === 0 ? COLUMN.top : i === 1 ? COLUMN.b1 : COLUMN.b2) + 22) / 560) * 100}%` }}>
                      {name}
                    </p>
                  ))}
                </div>
                <p ref={receipt} className={s.chip}>
                  <span className={s.dot} />
                  {G.receipt}
                </p>

                {/* the number the glass carries, and what it is */}
                {FIGURES.map(([sign, value, unit], i) => {
                  const figure = (
                    <>
                      {sign && <span className={s.sign}>{sign}</span>}
                      {value}
                      {unit && <small className={s.unit}>{unit}</small>}
                    </>
                  )
                  return (
                    <div key={i} ref={(el) => { nums.current[i] = el }} className={s.number}>
                      <span className={s.face}>{figure}</span>
                      {i === 0 && (
                        <span ref={ink} className={s.ink}>
                          {figure}
                        </span>
                      )}
                    </div>
                  )
                })}
                {H.steps.map((step, i) => (
                  <p key={step.name} ref={(el) => { caps.current[i] = el }} className={s.caption} data-ink={i === 0 ? '' : undefined}>
                    {step.caption}
                  </p>
                ))}

                <div className={s.grain} />
                <div className={s.bevel} />
                <div className={s.liner} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
