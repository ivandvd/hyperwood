/**
 * Frame 1: sealed orders, proven settlement.
 * The order the hero followed, as a ticket. As the frame is held, Ink runs down the confidential values and
 * seals them (what is left to read is cipher), and the order then passes through the stages the paper names:
 * Accepted, when its request identifier becomes public; Matched; Proven, when the batch, the new state root
 * and the proof become public. A switch shows the same order as its owner reads it.
 *
 * The Ink is one SVG shape with a living edge: two slow waves, the same idea as the kit's current lines. It is
 * drawn from one number, `seal` (0 open, 1 sealed), which follows the scroll or the switch.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { landing } from '../content.landing'
import { brandEase } from '../brand/mark'
import { Check } from '../sections/devices'
import kit from '../sections/kit.module.css'
import { Frame } from './Frame'
import { deckStill, ease, part, useProgress } from './track'
import s from './privacy.module.css'

const HEX = '0123456789abcdef'

/** Twelve hex digits in three groups, the same for the same text every time. */
function cipherOf(text: string) {
  let seed = 2166136261
  for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619)
  let out = ''
  for (let i = 0; i < 12; i++) {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    out += HEX[((t ^ (t >>> 14)) >>> 0) % 16]
    if (i % 4 === 3 && i < 11) out += ' '
  }
  return out
}
const noise = () => {
  let out = ''
  for (let i = 0; i < 12; i++) out += HEX[(Math.random() * 16) | 0] + (i % 4 === 3 && i < 11 ? ' ' : '')
  return out
}

/** Where on the dwell each thing happens. */
const SEAL: [number, number] = [0.07, 0.5]
const AT = { accepted: 0.58, matched: 0.7, proven: 0.82 }
const STATUS = ['draft', 'sealed', 'accepted', 'matched', 'proven'] as const

/** A line of mono text settles into `to` through noise (the same length), over `ms`. */
function settle(el: HTMLElement, to: string, ms = 520) {
  if (deckStill()) {
    el.textContent = to
    return () => {}
  }
  let id = 0
  let start = 0
  let last = -1
  const step = (now: number) => {
    if (!start) start = now
    const t = now - start
    const tick = Math.floor(t / 46)
    if (tick !== last) {
      last = tick
      const done = Math.floor((t / ms) * to.length)
      let out = ''
      for (let i = 0; i < to.length; i++) out += i < done || to[i] === ' ' ? to[i] : HEX[(Math.random() * 16) | 0]
      el.textContent = out
    }
    if (t < ms) id = requestAnimationFrame(step)
    else el.textContent = to
  }
  id = requestAnimationFrame(step)
  return () => cancelAnimationFrame(id)
}

function Ticket() {
  const C = landing.privacy
  const T = C.ticket
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const [view, setView] = useState<'network' | 'owner'>('network')

  const zone = useRef<HTMLDivElement>(null)
  const ticket = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const ink = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const fill = useRef<SVGPathElement>(null)
  const sheen = useRef<SVGPathElement>(null)
  const band = useRef<SVGPathElement>(null)
  const edge = useRef<SVGPathElement>(null)
  const edgeSoft = useRef<SVGPathElement>(null)
  const grad = useRef<SVGLinearGradientElement>(null)
  const req = useRef<HTMLSpanElement>(null)
  const line = useRef<HTMLSpanElement>(null)
  const sweep = useRef<HTMLSpanElement>(null)

  /** Everything the drawing needs, outside React. */
  const st = useRef({
    arrive: 0,
    dwell: 0,
    /** The switch: once the visitor has used it, it decides the seal instead of the scroll. */
    manual: false,
    manualSeal: 1,
    manualTo: 1,
    manualFrom: 1,
    manualStart: 0,
    w: 0,
    h: 0,
    rowY: [] as number[],
    rowH: 40,
    status: -1,
    public: false,
    raf: 0,
    px: 0,
    py: 0,
    tx: 0,
    ty: 0,
    stopSettle: () => {},
  })
  const viewRef = useRef(view)
  const draw = useRef<(now: number) => void>(() => {})

  useEffect(() => {
    const S = st.current
    const el = ticket.current
    const inkEl = ink.current
    if (!el || !inkEl) return
    const ciphers = Array.from(el.querySelectorAll<HTMLElement>('[data-cipher]'))
    const finals = ciphers.map((c) => c.dataset.cipher ?? '')
    const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-row]'))
    const dots = Array.from(el.querySelectorAll<HTMLElement>('[data-stage]'))
    let scrambleTick = -1
    let scrambled: string[] = []

    const measure = () => {
      S.w = inkEl.clientWidth
      S.h = inkEl.clientHeight
      svg.current?.setAttribute('viewBox', `0 0 ${Math.max(1, S.w)} ${Math.max(1, S.h)}`)
      S.rowH = rows[0]?.offsetHeight ?? 40
      S.rowY = rows.map((r) => r.offsetTop + r.offsetHeight / 2 - inkEl.offsetTop)
    }

    /** The Ink, from the seal (0 to 1) and the clock. Returns where its front stands (px from the top). */
    const paintInk = (seal: number, time: number) => {
      const { w, h } = S
      const amp = Math.max(4, S.rowH * 0.17)
      const front = -(amp + 3) + seal * (h + 2 * amp + 6)
      const k1 = (Math.PI * 2) / Math.max(120, w * 0.72)
      const k2 = (Math.PI * 2) / Math.max(50, w * 0.29)
      const y = (x: number) => front + amp * (0.62 * Math.sin(x * k1 + time * 1.5) + 0.38 * Math.sin(x * k2 - time * 1.15 + 1.3))
      // the front, left to right; the body of the Ink and the light above the front both run it back again
      const step = 7
      let wave = ''
      let back = ''
      let lift = ''
      for (let x = 0; x < w + step; x += step) {
        const xx = Math.min(x, w)
        const yy = y(xx)
        const at = `${xx.toFixed(1)},${yy.toFixed(2)}`
        wave += `${x === 0 ? 'M' : 'L'}${at}`
        back = `L${at}` + back
        lift = `L${xx.toFixed(1)},${(yy - amp * 4.2).toFixed(2)}` + lift
      }
      const body = `M0,0L${w},0${back}Z`
      fill.current?.setAttribute('d', body)
      sheen.current?.setAttribute('d', body)
      edge.current?.setAttribute('d', wave)
      edgeSoft.current?.setAttribute('d', wave)
      band.current?.setAttribute('d', wave + lift + 'Z')
      // the light on the front leaves with the front: once everything is sealed the Ink is simply Ink
      const light = (1 - part(seal, 0.9, 0.995)).toFixed(3)
      if (band.current) band.current.style.opacity = light
      if (edgeSoft.current) edgeSoft.current.style.opacity = light
      grad.current?.setAttribute('y1', (front - amp * 5).toFixed(1))
      grad.current?.setAttribute('y2', (front + amp).toFixed(1))
      return front
    }

    draw.current = (now: number) => {
      S.raf = 0
      const time = now / 1000
      const still = deckStill()
      const d = still ? 1 : S.dwell
      const scrollSeal = still ? 1 : ease(part(d, SEAL[0], SEAL[1]))

      // the switch glides the seal; the scroll takes it back once the visitor scrolls above the sealing
      if (S.manual) {
        const t = still ? 1 : Math.min(1, (now - S.manualStart) / 900)
        S.manualSeal = S.manualFrom + (S.manualTo - S.manualFrom) * brandEase(t)
        if (t >= 1 && S.manualTo === 1) S.manual = false
        if (!still && d < SEAL[1] - 0.03) S.manual = false
      }
      const seal = S.manual ? S.manualSeal : scrollSeal
      if (!S.manual && viewRef.current !== 'network') {
        viewRef.current = 'network'
        setView('network')
      }

      const front = paintInk(seal, time)
      const moving = seal > 0.001 && seal < 0.999

      // the cipher over the Ink: each row's appears as the front passes it, and flickers while it does
      const tick = Math.floor(now / 55)
      if (moving && tick !== scrambleTick) {
        scrambleTick = tick
        scrambled = finals.map(() => noise())
      }
      ciphers.forEach((c, i) => {
        const y = S.rowY[i] ?? 0
        const shown = Math.min(1, Math.max(0, (front - (y - S.rowH * 0.16)) / (S.rowH * 0.42)))
        c.style.opacity = shown.toFixed(3)
        const passing = moving && Math.abs(front - y) < S.rowH * 0.9
        const text = passing ? (scrambled[i] ?? finals[i]) : finals[i]
        if (c.textContent !== text) c.textContent = text
      })
      inkEl.toggleAttribute('data-sealed', seal > 0.985)

      // the stages
      const status = d >= AT.proven ? 4 : d >= AT.matched ? 3 : d >= AT.accepted ? 2 : scrollSeal >= 0.999 ? 1 : 0
      if (status !== S.status) {
        S.status = status
        el.dataset.status = STATUS[status]
        dots.forEach((dot, i) => dot.toggleAttribute('data-on', i < status - 1))
        const isPublic = status >= 2
        if (isPublic !== S.public) {
          S.public = isPublic
          S.stopSettle()
          if (req.current) {
            if (isPublic) S.stopSettle = settle(req.current, T.request)
            else req.current.textContent = T.pending
          }
        }
      }
      if (line.current) line.current.style.transform = `scaleX(${(part(d, AT.accepted, AT.proven) * (2 / 3)).toFixed(4)})`
      // at Proven a light runs once round the ticket
      if (sweep.current) {
        const p = still ? 0 : part(d, AT.proven, 0.985)
        sweep.current.style.opacity = Math.sin(Math.PI * p).toFixed(3)
        sweep.current.style.setProperty('--turn', `${(-70 + 330 * ease(p)).toFixed(1)}deg`)
      }

      // arriving: the ticket comes up out of depth; then it leans a few pixels away from the pointer
      const a = still ? 1 : S.arrive
      S.px += (S.tx - S.px) * 0.09
      S.py += (S.ty - S.py) * 0.09
      const rest = 1 - ease(a)
      el.style.transform = rest > 0.001 || Math.abs(S.px) + Math.abs(S.py) > 0.002 ? `translate3d(${(-S.px * 7).toFixed(2)}px, ${(rest * 64 - S.py * 5).toFixed(2)}px, 0) rotateX(${(rest * 9).toFixed(2)}deg)` : ''
      el.style.opacity = (0.2 + 0.8 * ease(Math.min(1, a * 1.25))).toFixed(3)
      if (glow.current) glow.current.style.transform = `translate3d(${(S.px * 16).toFixed(2)}px, ${(S.py * 12 + (0.5 - d) * 26).toFixed(2)}px, 0)`

      const leaning = Math.abs(S.tx - S.px) + Math.abs(S.ty - S.py) > 0.003
      if ((moving || leaning || (S.manual && !still)) && !S.raf) S.raf = requestAnimationFrame(draw.current)
    }

    measure()
    const ro = new ResizeObserver(() => {
      measure()
      if (!S.raf) S.raf = requestAnimationFrame(draw.current)
    })
    ro.observe(inkEl)
    S.raf = requestAnimationFrame(draw.current)

    // the pointer, over the card
    const host = zone.current?.closest('section') ?? null
    const fine = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches
    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect()
      S.tx = Math.max(-1, Math.min(1, (e.clientX - (box.left + box.width / 2)) / (window.innerWidth * 0.5)))
      S.ty = Math.max(-1, Math.min(1, (e.clientY - (box.top + box.height / 2)) / (window.innerHeight * 0.5)))
      if (!S.raf) S.raf = requestAnimationFrame(draw.current)
    }
    const leave = () => {
      S.tx = 0
      S.ty = 0
      if (!S.raf) S.raf = requestAnimationFrame(draw.current)
    }
    if (fine && !deckStill() && host) {
      host.addEventListener('pointermove', move, { passive: true })
      host.addEventListener('pointerleave', leave)
    }
    return () => {
      cancelAnimationFrame(S.raf)
      S.raf = 0
      S.stopSettle()
      ro.disconnect()
      host?.removeEventListener('pointermove', move)
      host?.removeEventListener('pointerleave', leave)
    }
  }, [T.pending, T.request])

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useProgress((p) => {
    const S = st.current
    S.arrive = p.arrive
    S.dwell = p.dwell
    if (!S.raf) S.raf = requestAnimationFrame(draw.current)
  })

  const choose = (next: 'network' | 'owner') => {
    const S = st.current
    if (next === viewRef.current) return
    // from wherever the Ink stands now
    const now = S.manual ? S.manualSeal : deckStill() ? 1 : ease(part(S.dwell, SEAL[0], SEAL[1]))
    S.manual = true
    S.manualFrom = now
    S.manualSeal = now
    S.manualTo = next === 'owner' ? 0 : 1
    S.manualStart = performance.now()
    viewRef.current = next
    setView(next)
    if (!S.raf) S.raf = requestAnimationFrame(draw.current)
  }

  return (
    <div className={s.zone} ref={zone}>
      <div className={s.view}>
        <span className={kit.mono}>{C.view.label}</span>
        <div className={kit.seg} role="group" aria-label={C.view.label}>
          <button type="button" aria-pressed={view === 'network'} onClick={() => choose('network')}>
            {C.view.network}
          </button>
          <button type="button" aria-pressed={view === 'owner'} onClick={() => choose('owner')}>
            {C.view.owner}
          </button>
        </div>
      </div>

      <div className={s.stand}>
        <div className={s.glow} ref={glow} aria-hidden />
        <div className={s.ticket} ref={ticket} data-status="draft">
          <header className={s.head}>
            <div>
              <p className={s.name}>
                {T.name} <b>{T.operation}</b>
              </p>
              <p className={s.req}>
                <span ref={req}>{T.pending}</span>
              </p>
            </div>
            <p className={s.status}>
              <i aria-hidden />
              <span>
                <em data-s="draft">{T.draft}</em>
                <em data-s="sealed">{T.sealed}</em>
                <em data-s="accepted">{T.stages[0]}</em>
                <em data-s="matched">{T.stages[1]}</em>
                <em data-s="proven">{T.stages[2]}</em>
              </span>
            </p>
          </header>

          <dl className={s.rows}>
            {T.rows.map(([name, value]) => (
              <div className={s.row} key={name} data-row>
                <dt>{name}</dt>
                <dd>
                  <span className={s.val}>{value}</span>
                  <span className={s.cip} data-cipher={cipherOf(value)} aria-hidden />
                </dd>
              </div>
            ))}
            <div className={s.ink} ref={ink} aria-hidden>
              <svg ref={svg} preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`${uid}g`} ref={grad} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#ccff00" stopOpacity="0" />
                    <stop offset="1" stopColor="#ccff00" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity="0.07" />
                    <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
                    <stop offset="1" stopColor="#ccff00" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path ref={fill} fill="#050605" />
                <path ref={sheen} fill={`url(#${uid}s)`} />
                <path ref={band} fill={`url(#${uid}g)`} />
                <path ref={edgeSoft} fill="none" stroke="#ccff00" strokeOpacity="0.22" strokeWidth="6" strokeLinejoin="round" />
                <path ref={edge} fill="none" stroke="#ccff00" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className={s.lock}>{T.sealedLabel}</span>
            </div>
          </dl>

          <ol className={s.stages} aria-label="Stages">
            <span className={s.rail} aria-hidden>
              <span ref={line} />
            </span>
            {T.stages.map((name) => (
              <li key={name} data-stage>
                <i aria-hidden />
                {name}
              </li>
            ))}
          </ol>

          <footer className={s.foot}>
            <span>{T.batch}</span>
            <span>{T.root}</span>
            <b>
              <Check />
              {T.verified}
            </b>
          </footer>
          <span className={s.sweep} ref={sweep} aria-hidden />
        </div>
      </div>

      <p className={s.legend}>
        <span data-k="open">{C.legend.open}</span>
        <span data-k="sealed">{C.legend.sealed}</span>
        <span>{C.legend.note}</span>
      </p>
    </div>
  )
}

export function Privacy() {
  const C = landing.privacy
  return (
    <Frame id="privacy" dwell={0.95} label={C.label} title={C.title} lead={C.lead} fine={C.fine}>
      <Ticket />
    </Frame>
  )
}
