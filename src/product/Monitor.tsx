/**
 * A monitor with one of the app's screens on it, as the reference shows its own app (trysoar.com: one picture of a
 * monitor turned so that its right edge comes towards the camera, seen from below, one side out of focus). Here the
 * monitor is built in the page: a slab in CSS perspective (a front with the screen in its bezel, a right side that
 * catches a little light, an underside, and behind it a stand: a plate with a round hole under the chin, lost in the
 * dark at its foot), and the screen on it is the app's own markup.
 *
 * Out of focus: the front is drawn more than once, sharp and blurred, and each copy is let through where the camera
 * would see it so (`focus`: weights across the front that add up to one everywhere; the copies are added, so the
 * blend is exact and nothing sharp shows through the blur).
 *
 * It fills the width of its box, whatever that is: the slab is laid out at the screen's own size and scaled.
 *
 * The landing page does not show this markup: it shows pictures taken of it (studio.html, scripts/product), at
 * several times the size and reduced, which are sharper than a browser draws a turned plane.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import m from './monitor.module.css'

/** The screen's own size (the app's: terminal.module.css), and the bezel about it. */
const SCREEN = { w: 1280, h: 820, bezel: 13 }
const OUTER = { w: SCREEN.w + 2 * SCREEN.bezel, h: SCREEN.h + 2 * SCREEN.bezel }

/** A copy of the front: how blurred it is (the screen's own pixels), and where across the front (0 the left edge,
 *  1 the right) it is let through: [from, full from, full to, to]. */
export interface Focus {
  blur: number
  span: [number, number, number, number]
}
/** The monitor on the landing page: the near side, with the ticket, sharp; the far side soft. */
const NEAR: Focus[] = [
  { blur: 3.4, span: [0, 0, 0.04, 0.2] },
  { blur: 1.3, span: [0.04, 0.2, 0.2, 0.38] },
  { blur: 0, span: [0.2, 0.38, 1, 1] },
]
const through = ([a, b, c, d]: Focus['span']) => {
  const stops: string[] = []
  if (b > a) stops.push(`transparent ${(a * 100).toFixed(1)}%`)
  stops.push(`#000 ${(b * 100).toFixed(1)}%`, `#000 ${(c * 100).toFixed(1)}%`)
  if (d > c) stops.push(`transparent ${(d * 100).toFixed(1)}%`)
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

interface Props {
  children: ReactNode
  className?: string
  /** how far it is turned about its upright (degrees; negative: the right edge towards the camera) */
  turn?: number
  /** how far it leans back (degrees) */
  lean?: number
  /** where the eye is, in the slab's own box (CSS perspective-origin) */
  eye?: string
  /** how far the eye is (the slab's own pixels) */
  far?: number
  focus?: Focus[]
  /** without its neck (a close view) */
  bare?: boolean
}

export function Monitor({ children, className, turn = -17, lean = 0, eye = '50% 206%', far = 3600, focus = NEAR, bare }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const size = () => setFit(el.clientWidth / OUTER.w)
    size()
    const watch = new ResizeObserver(size)
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  return (
    <div ref={box} className={`${m.box} ${className ?? ''}`} style={{ '--fit': fit, '--w': `${OUTER.w}px`, '--h': `${OUTER.h}px`, '--bezel': `${SCREEN.bezel}px` } as CSSProperties}>
      <div className={m.rig} style={{ visibility: fit ? 'visible' : 'hidden', perspective: `${far}px`, perspectiveOrigin: eye }}>
        <div className={m.body} style={{ transform: `rotateX(${lean}deg) rotateY(${turn}deg)` }}>
          {!bare && (
            <div className={m.neck}>
              <i />
            </div>
          )}
          <div className={m.under} />
          <div className={m.right} />
          <div className={m.front}>
            {focus.map(({ blur, span }, i) => (
              <div
                key={i}
                className={m.copy}
                aria-hidden={blur ? 'true' : undefined}
                style={{ filter: blur ? `blur(${blur}px)` : undefined, WebkitMaskImage: through(span), maskImage: through(span), mixBlendMode: i ? 'plus-lighter' : undefined }}
              >
                <div className={m.bezel}>
                  <div className={m.screen}>{children}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
