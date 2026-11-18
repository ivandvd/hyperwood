/**
 * A link whose letters fall into place when the pointer comes over it, as the links of the reference's side
 * panel do (read off that page: bulk.trade). For a moment every letter is a chance letter or figure, new with
 * every frame, and the word settles from its first letter on, one letter after another, while a small icon
 * comes in beside it and the link takes its other colour. The icon is an arrow, or the channel's own (`icon`).
 *
 * The word itself stays in the page for those who do not see it; what scrambles is a copy. Only letters and
 * figures scramble: spaces and signs stay where they are. It is meant for a typeface whose letters are all as
 * wide as one another, so the word keeps its width. Under reduced motion nothing scrambles: the colour and the
 * icon say that the pointer is there. An address that begins with http opens in a new tab.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { icons } from './icons'
import s from './scrambleLink.module.css'

const CHANCE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
/** A letter settles this long after the one before it (ms): the reference's pace. A long word settles
 *  faster, so that none takes longer than `LONGEST`. */
const STEP = 85
const LONGEST = 720

interface Props {
  href: string
  children: string
  className?: string
  /** Which side of the word the icon comes on: after it, or before it (for a word set flush right). */
  arrow?: 'after' | 'before'
  /** The icon in place of the arrow. */
  icon?: ReactNode
}

export function ScrambleLink({ href, children: word, className, arrow = 'after', icon }: Props) {
  const seen = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const away = /^https?:/.test(href)

  const settle = () => {
    cancelAnimationFrame(frame.current)
    if (seen.current) seen.current.textContent = word
  }
  const scramble = () => {
    const el = seen.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    cancelAnimationFrame(frame.current)
    const began = performance.now()
    const step = Math.min(STEP, LONGEST / word.length)
    const tick = (now: number) => {
      // (a frame's own time can lie a little before the moment the pointer came)
      const settled = Math.max(0, Math.floor((now - began) / step))
      if (settled >= word.length) {
        el.textContent = word
        return
      }
      let text = word.slice(0, settled)
      for (let i = settled; i < word.length; i++) text += /[a-z0-9]/i.test(word[i]) ? CHANCE[Math.floor(Math.random() * CHANCE.length)] : word[i]
      el.textContent = text
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <a
      className={className ? `${s.link} ${className}` : s.link}
      href={href}
      target={away ? '_blank' : undefined}
      rel={away ? 'noopener noreferrer' : undefined}
      data-arrow={arrow}
      data-icon={icon ? '' : undefined}
      onPointerEnter={scramble}
      onPointerLeave={settle}
      onFocus={scramble}
      onBlur={settle}
    >
      <span className={s.word}>{word}</span>
      <span ref={seen} className={s.seen} aria-hidden="true">
        {word}
      </span>
      <span className={s.icon} aria-hidden="true">
        {icon ?? icons.arrow}
      </span>
    </a>
  )
}
