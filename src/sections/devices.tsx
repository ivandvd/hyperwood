/**
 * The brand kit's own imagery, used as the kit defines it (kit 03, "Graphic devices" and "Ambient surfaces").
 * Hyperwood has no separate illustration style: the master contour is scaled, cropped and repeated.
 *  - FlowBand: "Flow repeat", the symbol in a half-drop grid, as a banner. It slides with the scroll.
 *  - CurrentLines: thin neon lines drifting as slow waves on Ink, ported from the kit. They part around the pointer.
 *  - Arrow and Check: two icons from the kit's set (1.75 px stroke, round joins).
 * The other two devices, "Current crop" and "Open field", are masks of the symbol file: see Payout and Execution.
 */
import { useEffect, useId, useRef } from 'react'
import { MARK_D } from '../brand/mark'
import { crossing, reducedMotion, useScroll } from './motion'
import s from './devices.module.css'

export function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12h18m-6-6 6 6-6 6" />
    </svg>
  )
}

export function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m4 12 5 5L20 6" />
    </svg>
  )
}

/** The kit's tile: 510 by 460 units, three symbols, the second row half a step along. */
const TILE = { w: 510, h: 460, y: -40, mark: 1.0514018691588785 }

export function FlowBand({ scale = 0.5 }: { scale?: number }) {
  const id = useId().replace(/[^a-z0-9]/gi, '')
  const tile = TILE.w * scale
  // one tile of travel while the band crosses the screen: slow enough to read as drift, not as a ticker
  const ref = useScroll<HTMLDivElement>(crossing, (p, el) => {
    const inner = el.firstElementChild as HTMLElement | null
    if (inner) inner.style.transform = `translate3d(${(-p * tile).toFixed(1)}px, 0, 0)`
  })
  return (
    <div className={s.flow} ref={ref} style={{ height: TILE.h * scale }} aria-hidden>
      <svg className={s.flowArt} style={{ width: `calc(100% + ${tile}px)` }}>
        <defs>
          <path id={`${id}m`} d={MARK_D} />
          <pattern id={`${id}p`} patternUnits="userSpaceOnUse" width={TILE.w} height={TILE.h} y={TILE.y} patternTransform={`scale(${scale})`}>
            <g fill="currentColor">
              <use href={`#${id}m`} transform={`scale(${TILE.mark})`} />
              <use href={`#${id}m`} transform={`translate(310 230) scale(${TILE.mark})`} />
              <use href={`#${id}m`} transform={`translate(-200 230) scale(${TILE.mark})`} />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id}p)`} />
      </svg>
    </div>
  )
}

interface LinesProps {
  className?: string
  rows?: number
  speed?: number
}

export function CurrentLines({ className, rows = 18, speed = 1 }: LinesProps) {
  const host = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = host.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const still = reducedMotion()
    const st = { raf: 0, last: 0, t: 0, visible: false, w: 0, h: 0, dpr: 1 }
    // the pointer, eased, and how strongly the lines give way to it (0 when it is elsewhere)
    const pt = { x: 0, y: 0, tx: 0, ty: 0, force: 0, want: 0 }

    const resize = () => {
      const box = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = Math.floor(box.width)
      const h = Math.floor(box.height)
      if (w !== st.w || h !== st.h || dpr !== st.dpr) {
        st.w = w
        st.h = h
        st.dpr = dpr
        canvas.width = Math.max(1, Math.round(w * dpr))
        canvas.height = Math.max(1, Math.round(h * dpr))
      }
    }
    const render = () => {
      resize()
      const { w, h } = st
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(204,255,0,.42)'
      for (let i = 0; i < rows; i++) {
        const y0 = ((i + 1) / (rows + 1)) * h
        const ph = i * 0.55
        ctx.beginPath()
        for (let x = 0; x <= w + 6; x += 6) {
          // the kit's two waves
          let y = y0 + Math.sin((x / w) * 4.5 + st.t * 0.9 + ph) * 7 + Math.sin((x / w) * 11 - st.t * 0.6 + ph * 1.7) * 3
          if (pt.force > 0.002) {
            const dx = x - pt.x
            const dy = y0 - pt.y
            y += Math.sign(dy || 1) * Math.exp(-(dx * dx + dy * dy) / 26000) * 16 * pt.force
          }
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(st.t * 0.4 + ph))
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    const tick = (ts: number) => {
      st.raf = 0
      if (!st.visible) return
      if (still) {
        render()
        return
      }
      // the kit draws these at thirty frames a second; while the pointer is on them they follow it every frame
      const lively = pt.force > 0.002 || pt.want > 0
      if (lively || ts - st.last >= 33) {
        const dt = Math.min(0.05, (ts - st.last) / 1000 || 0.033)
        st.t += dt * speed
        st.last = ts
        pt.x += (pt.tx - pt.x) * 0.16
        pt.y += (pt.ty - pt.y) * 0.16
        pt.force += (pt.want - pt.force) * 0.08
        render()
      }
      st.raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (!st.raf) st.raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver((entries) => {
      st.visible = entries.some((e) => e.isIntersecting)
      if (st.visible) start()
    })
    io.observe(canvas)

    // the canvas sits behind content, so the pointer is read on the window and tested against its box
    const fine = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches
    const move = (e: PointerEvent) => {
      if (!st.visible) return
      const box = canvas.getBoundingClientRect()
      const inside = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom
      pt.want = inside ? 1 : 0
      if (inside) {
        pt.tx = e.clientX - box.left
        pt.ty = e.clientY - box.top
        if (pt.force < 0.01) {
          pt.x = pt.tx
          pt.y = pt.ty
        }
      }
    }
    if (fine && !still) window.addEventListener('pointermove', move, { passive: true })
    render()

    return () => {
      cancelAnimationFrame(st.raf)
      io.disconnect()
      window.removeEventListener('pointermove', move)
    }
  }, [rows, speed])

  return <canvas ref={host} className={className} aria-hidden />
}
