/**
 * The three films on the light ground (&flow=soar), as the reference shows its three features (trysoar.com): each a
 * row of two rounded cards, the words on a white card at the left (the film's two lines at the top, what it means at
 * the foot) and the film on a tall card at the right. The rows stand still near the top of the screen one after
 * another while the page goes on, each next one coming up over the last, which steps back as it is covered (a
 * class, and a transition the compositor runs). Only the film of the row on top plays.
 *
 * The reference numbers its rows 01 to 03; these carry no numbers. The words: `filmsAfter` in content.home.ts.
 */
import { useEffect, useRef } from 'react'
import { home } from '../../content.home'
import { films } from '../../film/reel'
import { whenStill } from '../still'
import s from './soar.module.css'

/** Where in each film its subject stands, across (the card shows a tall part of a wide film). */
const AIM: Record<string, string> = { board: '40% 50%', booth: '31% 50%', seal: '58% 50%' }

export function Features() {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-row]'))
    const videos = rows.map((row) => row.querySelector('video'))
    // Which row is on top: the last one whose top has reached its place. The ones under it step back; only its
    // film plays, and only while the rows are on the screen. (Where the rows are is read when the page has been
    // scrolled, while it is as it was last drawn; the frame only writes.)
    let shown = false
    let stand = 0
    let wanted = 0
    let top = -1
    let playing = -1
    const measure = () => {
      let now = 0
      rows.forEach((row, i) => {
        if (row.getBoundingClientRect().top <= stand + 1) now = i
      })
      wanted = now
    }
    // (a film plays only while the page rests: one starting as the page moves held the screen to half its pace for
    // a few frames, measured on the production build; moving, a card shows the frame its film stopped on)
    let resting = true
    let rest = 0
    const apply = () => {
      raf = 0
      if (wanted !== top) {
        top = wanted
        rows.forEach((row, i) => row.toggleAttribute('data-under', i < top))
      }
      const play = shown && resting ? top : -1
      if (play === playing) return
      playing = play
      videos.forEach((video, i) => {
        if (!video) return
        if (i === play) void video.play().catch(() => {})
        else video.pause()
      })
    }
    let raf = 0
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const sized = () => {
      stand = parseFloat(getComputedStyle(rows[0]).top) || 0
      measure()
      ask()
    }
    const scrolled = () => {
      if (!shown) return
      resting = false
      window.clearTimeout(rest)
      rest = window.setTimeout(() => {
        resting = true
        ask()
      }, 260)
      measure()
      ask()
    }
    const watch = new IntersectionObserver(([entry]) => {
      shown = entry.isIntersecting
      measure()
      ask()
    })
    watch.observe(el)
    addEventListener('scroll', scrolled, { passive: true })
    addEventListener('resize', sized)
    sized()
    // (the films are fetched at a still moment, before the page reaches them)
    const stop = whenStill(() => videos.forEach((video) => video && (video.preload = 'auto')))
    return () => {
      watch.disconnect()
      removeEventListener('scroll', scrolled)
      removeEventListener('resize', sized)
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(rest)
      stop()
    }
  }, [])
  return (
    <section ref={root} className={`${s.paper} ${s.features}`} aria-label="What Hyperwood does" data-light="">
      {home.filmsAfter.map((one) => {
        const film = films[one.film]
        return (
          <div key={one.film} className={s.row} data-row="">
            <article className={s.panel}>
              <h3 className={s.panelTitle}>
                <span>{one.title[0]}</span> <span>{one.title[1]}</span>
              </h3>
              <p className={s.panelText}>
                <b>{one.lede}</b> {one.body}
              </p>
            </article>
            <div className={s.media}>
              <video src={film.clip} poster={film.still} muted loop playsInline preload="none" aria-hidden="true" style={{ objectPosition: AIM[one.film] }} />
            </div>
          </div>
        )
      })}
    </section>
  )
}
