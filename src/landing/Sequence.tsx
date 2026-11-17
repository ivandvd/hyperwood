/**
 * After the journey: the app, as one sequence.
 *
 * The app's window (app/AppPreview.tsx) lies under the river's last light like a slab on the floor. As the
 * page is scrolled it rises to face the reader, and then the scroll is a camera: it moves over the one window
 * and stops four times, and at each stop one thing is said in large type. Everything on your screen. Long or
 * short. Nothing on theirs (the window seals: the network's view). Cash, or the stock (a position closes and
 * the payout sheet comes up). Nothing moves by itself: the scroll moves all of it.
 *
 * On a small screen, or where motion is not wanted, there is no camera: the window stands in the page with a
 * switch between the two views, and the four things are said under one another.
 */
import { useEffect, useRef, useState } from 'react'
import { home } from '../content.home'
import { AppPreview, type View } from '../app/AppPreview'
import k from './kit.module.css'
import s from './sequence.module.css'

const A = home.app
/** Where the camera is used: room for the window beside the words, and motion welcome. */
const CINEMA = '(min-width: 961px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)'
/** The window as it is laid out, before the camera moves it (px: sequence.module.css, .win). */
const WIN = { w: 1180, h: 620 }

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** A stop of the camera. `at`: when, in the sequence's progress. `tilt`: how far the window leans back (deg).
 *  `zoom`: its size, 1 being fitted to the screen. `fx`, `fy`: the point of the window looked at (shares of its
 *  box). `sx`, `sy`: where on the screen that point lies (shares of the screen, from its middle). */
interface Shot {
  at: number
  tilt: number
  zoom: number
  fx: number
  fy: number
  sx: number
  sy: number
}

/** When each thing is said, the window seals, and the payout sheet comes up (progress). */
const SAY = [0.19, 0.39, 0.6, 0.8]
const SEALED: [number, number] = [0.6, 0.8]
const SHEET = 0.815

export function Sequence() {
  const [cinema, setCinema] = useState(() => typeof matchMedia === 'function' && matchMedia(CINEMA).matches)
  const [beat, setBeat] = useState(-1)
  const [view, setView] = useState<View>('yours')
  const [sheet, setSheet] = useState(false)
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const win = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia(CINEMA)
    const change = () => setCinema(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])

  useEffect(() => {
    const root = section.current
    const box = win.current
    const scene = stage.current
    if (!cinema || !root || !box || !scene) return
    let shots: Shot[] = []
    let fit = 1
    let frame = 0
    let near = false
    let current = -1
    let last = performance.now()
    const state = { beat: -1, view: 'yours' as View, sheet: false }

    /** Where the camera stops: worked out from where the window's parts lie. */
    const measure = () => {
      const app = box.querySelector<HTMLElement>('[data-view]')
      const part = (name: string): [number, number] => {
        const el = app?.querySelector<HTMLElement>(`[data-part="${name}"]`)
        if (!app || !el) return [0.5, 0.5]
        return [(el.offsetLeft + el.offsetWidth / 2) / app.offsetWidth, (el.offsetTop + el.offsetHeight / 2) / app.offsetHeight]
      }
      const ticket = part('ticket')
      const payout = part('sheet')
      fit = Math.min((innerHeight * 0.7) / WIN.h, (innerWidth * 0.86) / WIN.w, 1.3)
      // (the window's left edge keeps clear of the words; the ticket, the sealed window and the payout sheet
      // each lie whole in the right-hand part of the screen)
      const whole: Shot = { at: 0.2, tilt: 0, zoom: 1, fx: 0.35, fy: 0.5, sx: 0.215, sy: 0.02 }
      const order: Shot = { at: 0.45, tilt: 0, zoom: 1.5, fx: ticket[0], fy: 0.43, sx: 0.215, sy: 0 }
      const sealed: Shot = { at: 0.66, tilt: 0, zoom: 1, fx: 0.64, fy: 0.5, sx: 0.2, sy: 0.02 }
      const paid: Shot = { at: 0.87, tilt: 0, zoom: 1.2, fx: payout[0], fy: payout[1] - 0.03, sx: 0.212, sy: 0 }
      shots = [
        { at: 0, tilt: 62, zoom: 0.6, fx: 0.5, fy: 0.5, sx: 0, sy: 0.16 },
        whole,
        { ...whole, at: 0.33 },
        order,
        { ...order, at: 0.55 },
        sealed,
        { ...sealed, at: 0.76 },
        paid,
        { ...paid, at: 1 },
      ]
    }

    const draw = (p: number) => {
      let i = 0
      while (i < shots.length - 2 && p > shots[i + 1].at) i++
      const a = shots[i]
      const b = shots[i + 1]
      const t = smooth(clamp((p - a.at) / Math.max(1e-6, b.at - a.at)))
      const zoom = mix(a.zoom, b.zoom, t) * fit
      const tx = mix(a.sx, b.sx, t) * innerWidth - zoom * (mix(a.fx, b.fx, t) - 0.5) * WIN.w
      const ty = mix(a.sy, b.sy, t) * innerHeight - zoom * (mix(a.fy, b.fy, t) - 0.5) * WIN.h
      box.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotateX(${mix(a.tilt, b.tilt, t).toFixed(2)}deg) scale(${zoom.toFixed(4)})`
      scene.style.setProperty('--shade', smooth(clamp((p - 0.07) / 0.13)).toFixed(3))
      scene.style.setProperty('--lit', (1 - smooth(clamp(p / 0.2))).toFixed(3))
      // what is said, and what the window shows, change at their moments
      let said = -1
      for (let n = 0; n < SAY.length; n++) if (p >= SAY[n]) said = n
      const seen: View = p >= SEALED[0] && p < SEALED[1] ? 'network' : 'yours'
      const up = p >= SHEET
      if (said !== state.beat) setBeat((state.beat = said))
      if (seen !== state.view) setView((state.view = seen))
      if (up !== state.sheet) setSheet((state.sheet = up))
    }

    const progress = () => clamp(-root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - innerHeight))
    const tick = (now: number) => {
      frame = 0
      const target = progress()
      const dt = Math.min(64, now - last)
      last = now
      // (the camera follows the scroll closely, not stiffly)
      current = current < 0 ? target : current + (target - current) * (1 - Math.exp(-dt / 70))
      if (Math.abs(target - current) < 0.0002) current = target
      draw(current)
      if (near && current !== target) frame = requestAnimationFrame(tick)
    }
    const ask = () => {
      if (!frame && near) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }
    const resize = () => {
      measure()
      draw(current < 0 ? progress() : current)
    }
    const watch = new IntersectionObserver(
      (entries) => {
        near = entries.some((entry) => entry.isIntersecting)
        ask()
      },
      { rootMargin: '50% 0px' },
    )
    measure()
    draw(progress())
    watch.observe(root)
    addEventListener('scroll', ask, { passive: true })
    addEventListener('resize', resize)
    return () => {
      watch.disconnect()
      removeEventListener('scroll', ask)
      removeEventListener('resize', resize)
      if (frame) cancelAnimationFrame(frame)
      box.style.transform = ''
    }
  }, [cinema])

  const toggle = (
    <div className={s.switch} role="group" aria-label={A.switchLabel}>
      {(['yours', 'network'] as const).map((name) => (
        <button key={name} type="button" aria-pressed={view === name} data-view={name} onClick={() => setView(name)}>
          {A.views[name]}
        </button>
      ))}
    </div>
  )

  if (!cinema)
    return (
      <section ref={section} id="app" className={`${s.section} ${s.flat}`} aria-labelledby="app-title">
        <div className={k.wrap}>
          <p className={k.label}>{A.label}</p>
          <h2 id="app-title" className={k.statement}>
            {A.beats[0].line}
          </h2>
          <p className={k.body}>{A.beats[0].body}</p>
          {toggle}
          <div className={s.frame}>
            <AppPreview view={view} />
          </div>
          <p className={k.caption}>{A.caption}</p>
          <ol className={s.rest}>
            {A.beats.slice(1).map((item) => (
              <li key={item.line}>
                <h3>{item.line}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )

  return (
    <section ref={section} id="app" className={`${s.section} ${s.cinema}`} aria-labelledby="app-title">
      <div ref={stage} className={s.stage}>
        <div className={s.glow} aria-hidden="true" />
        <div ref={win} className={s.win}>
          <div className={s.frame}>
            <AppPreview view={view} sheet={sheet} />
          </div>
        </div>
        <div className={s.shade} aria-hidden="true" />
        <ol className={s.captions}>
          {A.beats.map((item, i) => (
            <li key={item.line} data-on={beat === i ? '' : undefined} aria-hidden={beat !== i}>
              <p className={s.tag}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                {item.tag}
              </p>
              {i === 0 ? (
                <h2 id="app-title" className={s.line}>
                  {item.line}
                </h2>
              ) : (
                <h3 className={s.line}>{item.line}</h3>
              )}
              <p className={s.body}>{item.body}</p>
            </li>
          ))}
        </ol>
        <ol className={s.rail} aria-hidden="true">
          {A.beats.map((item, i) => (
            <li key={item.tag} data-on={beat === i ? '' : undefined} data-done={beat > i ? '' : undefined}>
              {item.tag}
            </li>
          ))}
        </ol>
        <p className={s.note}>{A.caption}</p>
      </div>
    </section>
  )
}
