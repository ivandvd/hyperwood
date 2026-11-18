/**
 * Site header: the horizontal lockup (the kit's symbol, and the word outlined from the kit's typeface:
 * scripts/brand/lockup.py), in Hyper Neon, fixed for the whole page.
 * Over the hero it is the lockup alone, so the opening stays clean. Once the film hands over to the page it
 * becomes a bar on Ink with the links and the call to action. On the landing page the lockup takes you back
 * to the top; on the Architecture page it takes you home.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { content } from '../content'
import { sections } from '../content.sections'
import { restartExperience } from '../scroll/useScrollTimeline'
import { glideTo } from './glide'
import lockup from '../assets/brand/hyperwood-lockup-neon.svg'
import kit from '../sections/kit.module.css'
import styles from './SiteHeader.module.css'

interface Props {
  /** The bar: Ink behind the header, with the links and the call to action, once the page has taken over
   *  from the hero. Over the hero the header is the lockup alone. */
  backed: boolean
  /** Links to parts of this page: label and element id. */
  nav: [string, string][]
  /** A link to the other page, shown after the page's own links. */
  more?: { label: string; href: string }
  /** Where the lockup leads when it is not "back to the top" (the Architecture page: home). */
  home?: string
}

export function SiteHeader({ backed, nav, more, home }: Props) {
  const [current, setCurrent] = useState('')

  // a hairline under the bar shows how much of the page below the hero has been read, and the link of the
  // part you are in is marked
  const progress = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const line = progress.current
    const first = nav.length ? document.getElementById(nav[0][1]) : null
    if (!line || !first) return
    let frame = 0
    const paint = () => {
      frame = 0
      const start = first.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5
      const end = document.documentElement.scrollHeight - window.innerHeight
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)))
      line.style.transform = `scaleX(${p.toFixed(4)})`
      // the link that is marked: the last linked part whose top has passed the middle of the screen
      let at = ''
      for (const [, id] of nav) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) at = id
      }
      setCurrent(at)
    }
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    // the page changes height as it sets itself up (the intro pins, fonts arrive): look again when it does
    const grown = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(queue)
    grown?.observe(document.body)
    paint()
    return () => {
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      grown?.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [nav])

  const go = (e: MouseEvent, id: string) => {
    if (glideTo(id, 1.1)) e.preventDefault()
  }

  const cta = sections.cta
  const mark = <img className={styles.logo} src={lockup} alt="" />
  return (
    <header className={styles.header} data-backed={backed ? '' : undefined}>
      {home ? (
        <a className={styles.home} href={home} aria-label={`${content.brand}: home`}>
          {mark}
        </a>
      ) : (
        <button type="button" className={styles.home} onClick={restartExperience} aria-label={`${content.brand}: back to the top`}>
          {mark}
        </button>
      )}
      {content.extras.label && <span className={`t-label ${styles.label}`}>{content.label}</span>}
      <nav className={styles.nav} aria-label="Sections" inert={!backed}>
        {nav.map(([label, id]) => (
          <a key={id} href={`#${id}`} aria-current={current === id ? 'true' : undefined} onClick={(e) => go(e, id)}>
            {label}
          </a>
        ))}
        {more && (
          <a className={styles.more} href={more.href}>
            {more.label}
          </a>
        )}
      </nav>
      <a
        className={`${kit.btn} ${kit.btnSmall} ${styles.cta}`}
        href={cta.href}
        inert={!backed}
        onClick={(e) => {
          // no destination yet: stay where you are instead of jumping to the top
          if (cta.href === '#') e.preventDefault()
        }}
      >
        {cta.label}
      </a>
      <span className={styles.progress} ref={progress} aria-hidden />
    </header>
  )
}
