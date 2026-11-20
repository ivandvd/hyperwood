/**
 * One phone standing on the ground, seen from above and from its side, with its long shadow: as the reference ends
 * its page (trysoar.com, "Try the beta": a phone upright on the page's white, turned so that its screen looks to the
 * left of the camera and its side shows, a soft shadow running out from its foot).
 *
 * Here, on the page's Ink: a light behind the phone lays a pool of Hyper Neon on the ground, and the phone's shadow
 * is the dark in it. The phone is a slab with a body: the frame's shape laid many times one behind another, so its
 * side is one round band. The screen is the mobile app's own markup (PhoneApp.tsx).
 *
 * The landing page shows a picture taken of it (studio.html, scripts/product), not this markup. The picture is put
 * together from three takes of the same view (`part`): the phone alone, the pool alone and the shadow alone, the two
 * last in white on black; the ground is then worked out from them in full precision, so that the light falls off
 * with no bands and the shadow is never darker than the page (scripts/product/bake-standing.py).
 */
import type { CSSProperties, ReactNode } from 'react'
import h from './handset.module.css'

/** The phone (px, its own), how thick its body is, how it is turned, and how the camera looks down on it (degrees). */
const PHONE = { w: 414, h: 868, deep: 36 }
const TURN = -38
const LOOK = -27
/** The light: where the shadow runs on the ground (degrees from straight towards the camera, to the left), and how
 *  long it is, in the phone's heights. */
const SHADOW = { way: 52, long: 1.45 }
/** The ground: a square sheet this wide (px), the phone's foot at its middle. */
const G = 2400

/** What is drawn: everything, or one part of it alone (the pool and the shadow in white, to be taken on black). */
export type StandingPart = 'all' | 'phone' | 'pool' | 'shade'

export function Standing({ children, width = 1500, part = 'all' }: { children: ReactNode; width?: number; part?: StandingPart }) {
  const own = 1700
  const layers = Array.from({ length: PHONE.deep / 2 }, (_, i) => -(i + 1) * 2)
  // The foot of the phone on the ground (the ground's own flat coordinates: x to the right, y towards the camera,
  // from the middle of the phone's foot), and where its shadow runs to.
  const turn = (TURN * Math.PI) / 180
  const half = PHONE.w / 2
  const a = [-half * Math.cos(turn), half * Math.sin(turn)]
  const b = [half * Math.cos(turn), -half * Math.sin(turn)]
  const way = (SHADOW.way * Math.PI) / 180
  const run = [-Math.sin(way) * PHONE.h * SHADOW.long, Math.cos(way) * PHONE.h * SHADOW.long]
  const at = ([x, y]: number[]) => (G / 2 + x).toFixed(1) + 'px ' + (G / 2 + y).toFixed(1) + 'px'
  const far = (p: number[]) => [p[0] + run[0], p[1] + run[1]]
  const shape = 'polygon(' + [a, b, far(b), far(a)].map(at).join(', ') + ')'
  // (the shadow is darkest at the foot and gone before its end: the gradient runs the way the shadow does, through
  // the sheet's middle, which is the foot, so the foot is at its half)
  const along = (Math.atan2(run[0], -run[1]) * 180) / Math.PI
  const fade = 'linear-gradient(' + along.toFixed(2) + 'deg, rgb(var(--dark)) 0, rgb(var(--dark)) 50%, rgba(var(--dark), 0.94) 58%, rgba(var(--dark), 0.62) 72%, rgba(var(--dark), 0.2) 84%, rgba(var(--dark), 0) 92%)'
  const colours = { '--light': part === 'pool' ? '255, 255, 255' : '204, 255, 0', '--dark': part === 'shade' ? '255, 255, 255' : '10, 10, 10' } as CSSProperties
  return (
    <div className={h.row} style={{ width, height: (width / own) * 1500 }}>
      <div className={h.standRig} style={{ transform: 'scale(' + width / own + ')' }}>
        <div className={h.world} style={{ transform: 'rotateX(' + LOOK + 'deg)' }}>
          {/* the ground: the pool of light, and the phone's shadow in it, soft at its edges */}
          {part !== 'phone' && (
            <div className={h.ground} style={{ width: G, height: G, margin: -G / 2 + 'px 0 0 ' + -G / 2 + 'px', ...colours }} aria-hidden="true">
              {part !== 'shade' && <i className={h.pool} style={{ left: G / 2 + run[0] * 0.14, top: G / 2 + run[1] * 0.14 }} />}
              {part !== 'pool' && (
                <i className={h.shade}>
                  <i style={{ clipPath: shape, background: fade }} />
                </i>
              )}
            </div>
          )}
          {/* the phone, turned about its upright */}
          {(part === 'all' || part === 'phone') && (
            <div className={h.stand} style={{ transform: 'rotateY(' + TURN + 'deg)' }}>
              {layers.map((z) => (
                <i key={z} className={h.layer} style={{ transform: 'translateZ(' + z + 'px)' }} />
              ))}
              <div className={h.frame}>
                <div className={h.glass}>{children}</div>
                <i className={h.island} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
