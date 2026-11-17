/**
 * Frame 2: close the position, choose the payout. The paper's worked example, as liquid.
 * As the frame is held: the mark price runs from $100 to $120 and the available equity grows with it, as a
 * drop of neon under the figure. The position closes, and the drop runs down between the two destinations
 * and fills the first, Collateral. Then it passes across to the second, the equity tracker: the same value,
 * now counted in tracker units. After that the two destinations are buttons, and the liquid follows the choice.
 *
 * The liquid is drawn by liquid.ts. The type on a destination changes colour exactly on the liquid's surface:
 * an Ink copy of it is clipped by the same surface the shader draws.
 */
import { useEffect, useRef, useState } from 'react'
import { landing } from '../content.landing'
import { brandEase } from '../brand/mark'
import { Frame } from './Frame'
import { createLiquid, surfaceY, type Blob, type Liquid, type Vessel } from './liquid'
import { afterOpening, deckStill, ease, lerp, part, useProgress } from './track'
import s from './payout.module.css'

const E = landing.payout.example
const money = (v: number) => `$${v.toFixed(2)}`

/** Where on the dwell each thing happens. */
const RUN: [number, number] = [0.03, 0.3]
const CLOSE = 0.33
const POUR: [number, number] = [0.36, 0.64]
const PASS: [number, number] = [0.72, 0.94]

/** The mark price on its way from entry to exit, for the small chart: a rise with a little life in it. */
const PRICE = (() => {
  const n = 56
  const pts: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const env = Math.sin(Math.PI * t)
    const v = t * t * (3 - 2 * t) + env * (0.11 * Math.sin(t * 15.2 + 0.6) + 0.07 * Math.sin(t * 33 + 2.1) - 0.05 * Math.sin(t * 7.1))
    pts.push([t * 100, 26 - v * 22])
  }
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('')
  return { line, area: `${line}L100,30L0,30Z` }
})()

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function Tile({ name, sub, unit }: { name: string; sub: string; unit?: string }) {
  return (
    <>
      <span className={s.tName}>{name}</span>
      <span className={s.tValue}>
        <span data-v />
        {unit && <small>{unit}</small>}
      </span>
      <span className={s.tSub}>{sub}</span>
    </>
  )
}

function Board() {
  const W = landing.payout.words
  const [chosen, setChosen] = useState<'collateral' | 'tracker' | null>(null)
  const [closed, setClosed] = useState(false)
  const [plain, setPlain] = useState(false)

  const zone = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const guide = useRef<SVGPathElement>(null)
  const guideBox = useRef<SVGSVGElement>(null)
  const spark = useRef<SVGSVGElement>(null)
  const markEl = useRef<HTMLElement>(null)
  const pnlEl = useRef<HTMLElement>(null)
  const equityEl = useRef<HTMLParagraphElement>(null)
  const source = useRef<HTMLSpanElement>(null)
  const tileA = useRef<HTMLButtonElement>(null)
  const tileB = useRef<HTMLButtonElement>(null)

  const st = useRef({
    arrive: 0,
    dwell: 0,
    manual: false,
    manualX: 1,
    manualFrom: 1,
    manualTo: 1,
    manualStart: 0,
    raf: 0,
    amp: 0,
    lastA: -1,
    lastB: -1,
    chosen: null as 'collateral' | 'tracker' | null,
    closed: false,
    u: 1,
    cx: 0,
    sy: 0,
    jy: 0,
    a: { x: 0, y: 0, w: 0, h: 0 } as Box,
    b: { x: 0, y: 0, w: 0, h: 0 } as Box,
    radius: 16,
  })
  const draw = useRef<(now: number) => void>(() => {})

  useEffect(() => {
    const S = st.current
    const host = zone.current
    const cv = canvas.current
    const A = tileA.current
    const B = tileB.current
    if (!host || !cv || !A || !B) return
    // The liquid's canvas is made when the frame is a few screens away, not with the page: making it holds the
    // whole screen for a moment, and at page load that moment belongs to the opening. (Asked only once the
    // opening has gone: until then the page is short, and every frame counts as near.)
    let liquid: Liquid | null = null
    let made = false
    const make = () => {
      if (made) return
      made = true
      liquid = createLiquid(cv, { reach: 16, bevel: 13, relief: 8.5 }, (ready) => {
        if (!ready) setPlain(true)
        else if (!S.raf) S.raf = requestAnimationFrame(draw.current)
      })
      if (liquid) liquid.resize()
      else setPlain(true)
    }
    const near =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            (entries, io) => {
              if (!entries.some((e) => e.isIntersecting)) return
              io.disconnect()
              make()
            },
            { rootMargin: '250% 0px' },
          )
        : null
    const waiting = afterOpening(() => (near ? near.observe(host) : make()))
    const valuesA = Array.from(A.querySelectorAll<HTMLElement>('[data-v]'))
    const valuesB = Array.from(B.querySelectorAll<HTMLElement>('[data-v]'))
    const inkA = A.querySelector<HTMLElement>('[data-ink]')
    const inkB = B.querySelector<HTMLElement>('[data-ink]')

    const within = (el: HTMLElement): Box => {
      let x = 0
      let y = 0
      let n: HTMLElement | null = el
      while (n && n !== host) {
        x += n.offsetLeft
        y += n.offsetTop
        n = n.offsetParent as HTMLElement | null
      }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight }
    }

    const measure = () => {
      liquid?.resize()
      // the canvas reaches a little past the board on every side, so the liquid's light is never cut off:
      // everything below is in the canvas's own pixels
      const ox = -cv.offsetLeft
      const oy = -cv.offsetTop
      const place = (el: HTMLElement): Box => {
        const box = within(el)
        return { x: box.x + ox, y: box.y + oy, w: box.w, h: box.h }
      }
      S.a = place(A)
      S.b = place(B)
      S.u = S.a.h / 190
      S.radius = parseFloat(getComputedStyle(A).borderTopLeftRadius) || 16
      S.cx = (S.a.x + S.a.w + S.b.x) / 2
      const src = source.current ? place(source.current) : { x: S.cx, y: 0, w: 0, h: 0 }
      S.sy = src.y + src.h / 2
      S.jy = S.a.y + S.a.h - 30 * S.u
      // the two routes, as hairlines: down between the destinations, and across to each at the foot
      guideBox.current?.setAttribute('viewBox', `0 0 ${Math.max(1, host.clientWidth)} ${Math.max(1, host.clientHeight)}`)
      guide.current?.setAttribute('d', `M${S.cx - ox},${S.sy - oy}V${S.jy - oy}M${S.a.x + S.a.w - ox},${S.jy - oy}H${S.b.x - ox}`)
    }

    /** The Ink copy of a destination's type shows exactly where the liquid is. */
    const clip = (ink: HTMLElement | null, v: Vessel, box: Box, time: number) => {
      if (!ink) return
      if (v.level <= 0.001) {
        ink.style.clipPath = 'inset(100% 0 0 0)'
        return
      }
      if (v.level >= 0.999) {
        ink.style.clipPath = 'none'
        return
      }
      let poly = ''
      for (let x = 0; x <= box.w; x += 6) poly += `${x.toFixed(0)}px ${(surfaceY(v, box.x + x, time) - box.y).toFixed(2)}px,`
      ink.style.clipPath = `polygon(${poly}${box.w}px ${(surfaceY(v, box.x + box.w, time) - box.y).toFixed(2)}px,${box.w}px ${box.h + 1}px,0px ${box.h + 1}px)`
    }

    draw.current = (now: number) => {
      S.raf = 0
      const time = (now / 1000) % 600
      const still = deckStill()
      const d = still ? 1 : S.dwell
      const u = S.u

      // arriving: the whole board comes up with the card, a little behind it (the liquid's canvas with it)
      const up = still ? 1 : ease(Math.min(1, S.arrive * 1.15))
      host.style.transform = up < 0.999 ? `translate3d(0, ${((1 - up) * 60).toFixed(1)}px, 0)` : ''
      host.style.opacity = (0.15 + 0.85 * up).toFixed(3)

      // the price runs, and the figures with it
      const run = ease(part(d, RUN[0], RUN[1]))
      const mark = lerp(E.entry, E.exit, run)
      const pnl = E.units * (mark - E.entry)
      const equity = E.margin + pnl
      if (markEl.current) markEl.current.textContent = money(mark)
      if (pnlEl.current) pnlEl.current.textContent = `+${money(pnl)}`
      if (equityEl.current) equityEl.current.textContent = money(equity)
      valuesA.forEach((el) => (el.textContent = money(equity)))
      valuesB.forEach((el) => (el.textContent = (equity / mark).toFixed(2)))
      if (spark.current) spark.current.style.clipPath = `inset(0 ${((1 - run) * 100).toFixed(2)}% 0 0)`
      const isClosed = d >= CLOSE
      if (isClosed !== S.closed) {
        S.closed = isClosed
        setClosed(isClosed)
      }

      // where the liquid is: how much has reached the destinations, and how it is shared between them
      const q = still ? 1 : part(d, POUR[0], POUR[1])
      if (S.manual) {
        const t = still ? 1 : Math.min(1, (now - S.manualStart) / 1000)
        S.manualX = S.manualFrom + (S.manualTo - S.manualFrom) * brandEase(t)
        // scrolling back above the passage hands the liquid back to the scroll
        if (!still && d < PASS[1] - 0.03) S.manual = false
      }
      const x = S.manual ? S.manualX : still ? 1 : ease(part(d, PASS[0], PASS[1]))
      const poured = ease(part(q, 0.42, 1))
      const levelA = poured * (1 - x)
      const levelB = poured * x

      const moving = Math.abs(levelA - S.lastA) > 0.0004 || Math.abs(levelB - S.lastB) > 0.0004
      S.lastA = levelA
      S.lastB = levelB
      S.amp += ((moving && !still ? 4.6 * u : 0) - S.amp) * 0.09
      if (S.amp < 0.04) S.amp = 0

      const blobs: Blob[] = []
      const thick = 6.4 * u
      if (q < 1) {
        // the drop under the figure: it grows with the equity, then drains into the stream
        const r = u * lerp(10.5, 19, run) * (1 - ease(part(q, 0.06, 0.62)))
        if (r > 0.5) blobs.push({ ax: S.cx, ay: S.sy, bx: S.cx, by: S.sy, r })
        if (q > 0) {
          const head = lerp(S.sy, S.jy, ease(part(q, 0, 0.44)))
          const tail = lerp(S.sy, S.jy, ease(part(q, 0.52, 1)))
          const fade = 1 - part(q, 0.9, 1)
          if (head - tail > 0.5) blobs.push({ ax: S.cx, ay: tail, bx: S.cx, by: head, r: thick * fade })
          // at the foot it turns into the first destination
          const turn = ease(part(q, 0.38, 0.5))
          if (turn > 0) blobs.push({ ax: S.cx, ay: S.jy, bx: lerp(S.cx, S.a.x + S.a.w - 6 * u, turn), by: S.jy, r: thick * fade })
        }
      }
      // passing across: the two destinations are joined at the foot while the liquid changes sides
      const across = Math.sin(Math.PI * x)
      if (poured > 0.98 && across > 0.02) blobs.push({ ax: S.a.x + S.a.w - 8 * u, ay: S.jy, bx: S.b.x + 8 * u, by: S.jy, r: thick * Math.pow(across, 0.55) })

      const vA: Vessel = { ...S.a, r: S.radius, level: levelA, amp: S.amp }
      const vB: Vessel = { ...S.b, r: S.radius, level: levelB, amp: S.amp }
      // an empty destination holds no liquid at all (and so sheds no light)
      liquid?.draw(
        blobs,
        [vA, vB].filter((v) => v.level > 0.001),
        time,
      )
      clip(inkA, vA, S.a, time)
      clip(inkB, vB, S.b, time)

      // which destination holds the payout, once it is at rest
      const now_: 'collateral' | 'tracker' | null = poured < 0.999 ? null : x < 0.5 ? 'collateral' : 'tracker'
      if (now_ !== S.chosen) {
        S.chosen = now_
        setChosen(now_)
      }

      const gliding = S.manual && !still && now - S.manualStart < 1000
      if ((S.amp > 0 || gliding || moving) && !still && !S.raf) S.raf = requestAnimationFrame(draw.current)
    }

    measure()
    const ro = new ResizeObserver(() => {
      measure()
      if (!S.raf) S.raf = requestAnimationFrame(draw.current)
    })
    ro.observe(host)
    ro.observe(A)
    document.fonts?.ready.then(() => measure()).catch(() => undefined)
    S.raf = requestAnimationFrame(draw.current)
    return () => {
      cancelAnimationFrame(S.raf)
      S.raf = 0
      ro.disconnect()
      waiting()
      near?.disconnect()
      liquid?.dispose()
    }
  }, [])

  useProgress((p) => {
    const S = st.current
    S.arrive = p.arrive
    S.dwell = p.dwell
    if (!S.raf) S.raf = requestAnimationFrame(draw.current)
  })

  /** A destination was pressed: the liquid goes there. Only once it has arrived by itself. */
  const choose = (to: 0 | 1) => {
    const S = st.current
    if (S.chosen === null) return
    const from = S.manual ? S.manualX : S.chosen === 'collateral' ? 0 : 1
    if (Math.abs(from - to) < 0.001) return
    S.manual = true
    S.manualFrom = from
    S.manualX = from
    S.manualTo = to
    S.manualStart = performance.now()
    if (!S.raf) S.raf = requestAnimationFrame(draw.current)
  }

  return (
    <div className={s.zone} ref={zone} data-plain={plain ? '' : undefined}>
      <div className={s.slab} data-closed={closed ? '' : undefined}>
        <div className={s.slabTop}>
          <p className={s.side}>
            <b>{W.side}</b>
            {E.units} {W.units}
          </p>
          <p className={s.state}>
            <i aria-hidden />
            <span>
              <em data-s="open">{W.open}</em>
              <em data-s="closed">{W.closed}</em>
            </span>
          </p>
        </div>
        <dl className={s.nums}>
          <div>
            <dt>{W.entry}</dt>
            <dd>{money(E.entry)}</dd>
          </div>
          <div>
            <dt>{W.mark}</dt>
            <dd ref={markEl}>{money(E.entry)}</dd>
          </div>
          <div>
            <dt>{W.pnl}</dt>
            <dd ref={pnlEl} data-up>
              +{money(0)}
            </dd>
          </div>
        </dl>
        <svg className={s.spark} ref={spark} viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
          <path d={PRICE.area} className={s.sparkArea} />
          <path d={PRICE.line} className={s.sparkLine} />
        </svg>
      </div>

      <div className={s.equity}>
        <p className={s.eLabel}>{W.equity}</p>
        <p className={s.eValue} ref={equityEl}>
          {money(E.margin)}
        </p>
        <span className={s.source} ref={source} aria-hidden />
      </div>

      <div className={s.tiles} role="group" aria-label={W.choose}>
        <button type="button" className={s.tile} ref={tileA} aria-pressed={chosen === 'collateral'} data-on={chosen === 'collateral' ? '' : undefined} onClick={() => choose(0)}>
          <span className={s.tBase}>
            <Tile name={W.collateral} sub={W.collateralSub} />
          </span>
          <span className={s.tInk} data-ink aria-hidden>
            <Tile name={W.collateral} sub={W.collateralSub} />
          </span>
        </button>
        <button type="button" className={s.tile} ref={tileB} aria-pressed={chosen === 'tracker'} data-on={chosen === 'tracker' ? '' : undefined} onClick={() => choose(1)}>
          <span className={s.tBase}>
            <Tile name={W.tracker} sub={W.trackerSub} unit={W.trackerUnit} />
          </span>
          <span className={s.tInk} data-ink aria-hidden>
            <Tile name={W.tracker} sub={W.trackerSub} unit={W.trackerUnit} />
          </span>
        </button>
      </div>

      <svg className={s.guide} ref={guideBox} aria-hidden>
        <path ref={guide} />
      </svg>
      <canvas className={s.liquid} ref={canvas} aria-hidden />
    </div>
  )
}

export function Payout() {
  const C = landing.payout
  return (
    <Frame id="payout" dwell={0.95} label={C.label} title={C.title} lead={C.lead} fine={C.fine}>
      <Board />
    </Frame>
  )
}
