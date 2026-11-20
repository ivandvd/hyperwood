/**
 * The app, shown as the reference shows its own (trysoar.com, its dark part, read off that page): a stage in the
 * dark with a great arc of light over it; under the arc a headline in two lines, the first dim and the second
 * bright; under that the whole web app on a monitor, turned away so that one side is out of focus, on a stand that
 * is lost in the dark at its foot; then, clear of it, three cards, each a close view of another part of the app with
 * a line under it (a claim, and what it means); and a horizon of light the stage ends on. Nothing in it moves with the scroll; the dust in the
 * air drifts, slowly. (The reference shows its mobile app elsewhere, as phones in pictures of their own; here the
 * phones stand at the stage's end, before the horizon.)
 *
 * Ours, in the page's own terms: the arc is the arch of the journey's gate, so the app stands in the doorway the
 * journey ends at; the light is Hyper Neon on the page's Ink and nowhere else (it is let through a grain: grain.ts);
 * and the horizon at the foot is the gate's threshold.
 *
 * The app is real markup (src/product), and what is shown here are pictures taken of it (studio.html), at several
 * times the size and reduced: a browser draws a turned plane softer than that. The words: `appStage` in
 * content.home.ts. Where everything stands: appStage.module.css.
 */
import { useEffect, useRef, type CSSProperties } from 'react'
import { home } from '../content.home'
import monitor1400 from '../assets/product/monitor-1400.webp'
import monitor2600 from '../assets/product/monitor-2600.webp'
import ticket700 from '../assets/product/card-ticket-700.webp'
import ticket1050 from '../assets/product/card-ticket-1050.webp'
import request700 from '../assets/product/card-request-700.webp'
import request1050 from '../assets/product/card-request-1050.webp'
import payout700 from '../assets/product/card-payout-700.webp'
import payout1050 from '../assets/product/card-payout-1050.webp'
import phones1300 from '../assets/product/phones-1300.webp'
import phones2400 from '../assets/product/phones-2400.webp'
import shotTrade800 from '../assets/product/shot-trade-800.webp'
import shotTrade1200 from '../assets/product/shot-trade-1200.webp'
import shotReceipt800 from '../assets/product/shot-receipt-800.webp'
import shotReceipt1200 from '../assets/product/shot-receipt-1200.webp'
import shotClose800 from '../assets/product/shot-close-800.webp'
import shotClose1200 from '../assets/product/shot-close-1200.webp'
import { arcPlain, cardsUnder, phonesShot } from './flags'
import { grain } from './grain'
import { useRise } from './rise'
import { DropScene } from './soar/DropScene'
import { RiverScene } from './soar/RiverScene'
import { whenStill } from './still'
import s from './appStage.module.css'

/** With the arc (sky="drop"), when the headline's two lines and the monitor come: from and to (how far the stage has
 *  come up the screen, in screens: 0 its top at the foot, 1 at the top) and how far each rises as it comes (its own
 *  ems). The arc opens over 0.08 to 0.72 (DropScene.tsx): the lines come into it as it opens, the monitor last, and
 *  the monitor is whole well before the stage's top reaches the screen's (it is the stage's subject: while it was
 *  still coming there, it stood dim under an arc already open). */
const COME: [from: number, to: number, rise: number][] = [
  [0.36, 0.66, 0.55],
  [0.44, 0.74, 0.55],
  [0.5, 0.86, 1.6],
]
/** How far the monitor answers the pointer, across and down (px at the pointer's furthest): a little, and the other
 *  way from the drop over it, so the two stand at different depths. */
const SWAY: [x: number, y: number] = [9, 5]
/** A rise eased gently at both ends, as every scrolled movement on the page is. */
const rising = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)))

const PICTURES = [
  [ticket700, ticket1050],
  [request700, request1050],
  [payout700, payout1050],
]

/** (with &phones=shot) the phone shots, in the order of a trade: opened, sealed and proven, closed */
const SHOTS = [
  [shotTrade800, shotTrade1200],
  [shotReceipt800, shotReceipt1200],
  [shotClose800, shotClose1200],
]

/** The dust: where each speck hangs (hundredths of the stage's width, and of the screen's height from the stage's
 *  top), how large (px), how soft, how bright, and how far and how slowly it drifts. */
const DUST: [x: number, y: number, size: number, soft: number, bright: number, dx: number, dy: number, seconds: number][] = [
  [8, 34, 3, 1.2, 0.5, 14, -18, 19],
  [14, 71, 2, 0.6, 0.6, -10, -12, 23],
  [21, 22, 4, 2.2, 0.3, 12, 10, 27],
  [27, 55, 2, 0.4, 0.7, 8, -14, 17],
  [33, 16, 3, 1, 0.45, -12, 8, 21],
  [41, 9, 2, 0.5, 0.55, 10, 12, 25],
  [58, 12, 3, 1.4, 0.4, -8, 14, 22],
  [66, 26, 2, 0.4, 0.7, 12, -10, 18],
  [72, 60, 4, 2.4, 0.28, -14, -8, 29],
  [79, 18, 2, 0.6, 0.6, 9, 13, 20],
  [86, 44, 3, 1, 0.5, -11, -15, 24],
  [92, 76, 2, 0.5, 0.55, 10, -9, 26],
  [4, 92, 3, 1.6, 0.35, 12, -12, 28],
  [96, 30, 2, 0.5, 0.5, -9, 11, 22],
]

/** `sky`: over the stage, the gate's arch and its halo; or (with &flow=soar, under the light ground) the light that
 *  hangs into the dark as a drop (soar/DropScene.tsx), entered from the light above by a gradient; or (with
 *  &ground=ink, all on the Ink) the journey's river, coming out of the dark under the headline and winding to the
 *  monitor, which stands in it (soar/RiverScene.tsx). */
export function AppStage({ sky = 'gate' }: { sky?: 'gate' | 'drop' | 'river' }) {
  const A = home.appStage
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  // (the phones' words and pictures rise into place as the scroll brings them in: rise.ts)
  const riseIn = useRise<HTMLDivElement>()
  // (the lights' grain: made once, in the page)
  useEffect(() => {
    root.current?.style.setProperty('--grain', grain())
  }, [])
  // With the arc (sky="drop"): the headline's two lines and the monitor come with it. As the stage comes up the
  // screen the arc opens out of the dark (DropScene.tsx), and the two lines rise into it one after the other, then
  // the monitor, each with the scroll and back with it (COME).
  useEffect(() => {
    if (sky !== 'drop') return
    const el = root.current
    const head = title.current
    const screen = el?.querySelector<HTMLElement>(`.${s.monitor}`)
    if (!el || !head || !screen) return
    const parts = [...(Array.from(head.children) as HTMLElement[]), screen]
    const calm = matchMedia('(prefers-reduced-motion: reduce)')
    let come = 1
    let raf = 0
    const said = new Map<HTMLElement, string>()
    // (read where it is when the page has been scrolled; only write in the frame)
    const read = () => {
      come = (innerHeight - el.getBoundingClientRect().top) / Math.max(1, innerHeight)
    }
    const update = () => {
      raf = 0
      parts.forEach((part, i) => {
        const [a, b, rise] = COME[Math.min(i, COME.length - 1)]
        const k = calm.matches ? 1 : rising((come - a) / (b - a))
        const opacity = k.toFixed(3)
        const transform = k < 1 ? `translate3d(0, ${((1 - k) * rise).toFixed(3)}em, 0)` : 'none'
        if (said.get(part) === opacity + transform) return
        said.set(part, opacity + transform)
        part.style.opacity = opacity
        part.style.transform = transform
      })
    }
    const ask = () => {
      read()
      if (!raf) raf = requestAnimationFrame(update)
    }
    parts.forEach((part) => (part.style.willChange = 'transform, opacity'))
    // The monitor's picture answers the pointer (SWAY): eased towards where the pointer is, a frame at a time, and
    // written only while it still has some way to go and the stage is on the screen.
    const picture = screen.querySelector('img')
    let want: [number, number] = [0, 0]
    let now: [number, number] = [0, 0]
    let drift = 0
    const sway = () => {
      drift = 0
      now = [now[0] + (want[0] - now[0]) * 0.06, now[1] + (want[1] - now[1]) * 0.06]
      if (picture) picture.style.transform = `translate3d(${(-now[0] * SWAY[0]).toFixed(2)}px, ${(-now[1] * SWAY[1]).toFixed(2)}px, 0)`
      if (Math.abs(want[0] - now[0]) + Math.abs(want[1] - now[1]) > 0.002) drift = requestAnimationFrame(sway)
    }
    const point = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || calm.matches || come < 0 || come > 3.4) return
      want = [(event.clientX / innerWidth) * 2 - 1, (event.clientY / innerHeight) * 2 - 1]
      if (!drift) drift = requestAnimationFrame(sway)
    }
    if (picture) picture.style.willChange = 'transform'
    ask()
    addEventListener('scroll', ask, { passive: true })
    addEventListener('resize', ask)
    addEventListener('pointermove', point, { passive: true })
    return () => {
      removeEventListener('scroll', ask)
      removeEventListener('resize', ask)
      removeEventListener('pointermove', point)
      if (raf) cancelAnimationFrame(raf)
      if (drift) cancelAnimationFrame(drift)
      parts.forEach((part) => {
        part.style.opacity = ''
        part.style.transform = ''
        part.style.willChange = ''
      })
      if (picture) {
        picture.style.transform = ''
        picture.style.willChange = ''
      }
    }
  }, [sky])
  // The pictures are fetched and unpacked at a still moment, before the page is scrolled to them: unpacked as they
  // come onto the screen, a large picture can hold a frame back. (Left alone, each is fetched as it comes near.)
  useEffect(
    () =>
      whenStill(() => {
        root.current?.querySelectorAll('img').forEach((img) => {
          img.loading = 'eager'
          void img.decode().catch(() => {})
        })
      }),
    [],
  )
  return (
    <section ref={root} id="app" className={s.stage} aria-labelledby="app-title" data-sky={sky}>
      {sky === 'drop' && <DropScene className={s.scene} plain={arcPlain} />}
      {sky === 'river' && <RiverScene className={s.river} head={title} />}
      <div className={s.sky} aria-hidden="true" hidden={sky !== 'gate'}>
        <div className={s.halo} />
        <div className={s.gate}>
          <i />
        </div>
        <div className={s.veil} />
        {DUST.map(([x, y, size, soft, bright, dx, dy, seconds], i) => (
          <i
            key={i}
            className={s.dust}
            style={{ left: `${x}%`, top: `${y}vh`, '--d': `${size}px`, '--soft': `${soft}px`, '--bright': bright, '--dx': `${dx}px`, '--dy': `${dy}px`, '--t': `${seconds}s` } as CSSProperties}
          />
        ))}
      </div>

      <h2 ref={title} id="app-title" className={s.title}>
        <span>{A.title[0]}</span> <b>{A.title[1]}</b>
      </h2>

      <div className={s.monitor}>
        <img src={monitor1400} srcSet={`${monitor1400} 1400w, ${monitor2600} 2600w`} sizes="(max-width: 1023px) 165vw, 66vw" width="2600" height="2194" alt={A.shows} loading="lazy" decoding="async" />
      </div>

      {!cardsUnder && (
        <ul className={s.cards}>
          {A.cards.map((card, i) => (
            <li key={card.lead} className={s.card}>
              <img src={PICTURES[i][0]} srcSet={`${PICTURES[i][0]} 700w, ${PICTURES[i][1]} 1050w`} sizes="(max-width: 1023px) 78vw, 19vw" width="700" height="934" alt={card.shows} loading="lazy" decoding="async" />
              <p>
                <b>{card.lead}</b> {card.rest}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* the mobile app: three phones before the horizon the stage ends on */}
      <div ref={riseIn} id="mobile" className={s.pocket} data-lines={cardsUnder ? '' : undefined}>
        <h2 className={s.title}>
          <span data-rise="">{A.pocket.title[0]}</span> <b data-rise="">{A.pocket.title[1]}</b>
        </h2>
        <p className={s.lede} data-rise="">
          {A.pocket.body}
        </p>
        {phonesShot ? (
          <ul className={s.shots}>
            {SHOTS.map(([small, large], i) => (
              <li key={small}>
                <div className={s.shot} data-rise="">
                  <img src={small} srcSet={`${small} 800w, ${large} 1200w`} sizes="(max-width: 599px) 92vw, (max-width: 1023px) 31vw, (max-aspect-ratio: 1/1) 31vw, 29vw" width="1200" height="1500" alt={A.pocket.shots[i]} loading="lazy" decoding="async" />
                </div>
                {cardsUnder && (
                  <p className={s.shotLine} data-rise="">
                    <b>{A.cards[i].lead}</b> {A.cards[i].rest}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <>
            <div className={s.dawn} aria-hidden="true" />
            <div className={s.phones}>
              <img src={phones1300} srcSet={`${phones1300} 1300w, ${phones2400} 2400w`} sizes="(max-width: 1023px) 170vw, 62vw" width="2400" height="1634" alt={A.pocket.shows} loading="lazy" decoding="async" />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
