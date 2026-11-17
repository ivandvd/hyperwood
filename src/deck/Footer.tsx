/**
 * The footer, shared by both pages: the way back to every part, the cautions the architecture paper insists
 * on, and the wordmark at full width, which comes up out of the bottom edge as the footer arrives.
 */
import type { MouseEvent } from 'react'
import { content } from '../content'
import { sections } from '../content.sections'
import { glideTo } from '../ui/glide'
import { Block } from '../sections/parts'
import { entering, useScroll } from '../sections/motion'
import { order } from '../sections/util'
import wordmark from '../assets/brand/hyperwood-wordmark-neon.svg'
import k from '../sections/kit.module.css'
import s from './footer.module.css'

interface Props {
  nav: [string, string][]
  /** A link to the other page. */
  more?: { label: string; href: string }
}

export function Footer({ nav, more }: Props) {
  const C = sections.closing
  const word = useScroll<HTMLDivElement>(entering(1, 0.9), (p, el) => el.style.setProperty('--p', p.toFixed(4)))
  const go = (e: MouseEvent, id: string) => {
    if (glideTo(id)) e.preventDefault()
  }

  return (
    <footer className={s.footer}>
      <Block className={s.grid} line={0.04}>
        <nav className={`${s.nav} ${k.rise}`} aria-label="Sections, again">
          {nav.map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={(e) => go(e, id)}>
              {label}
            </a>
          ))}
          {more && <a href={more.href}>{more.label}</a>}
        </nav>
        <ul className={s.cautions}>
          {C.notes.map((note, i) => (
            <li className={`${k.fine} ${k.rise}`} key={note} style={order(i + 1)}>
              {note}
            </li>
          ))}
        </ul>
      </Block>
      <div className={s.word} ref={word}>
        <img src={wordmark} alt={content.brand} width={1000} height={155} />
      </div>
      <p className={`${k.mono} ${s.rights}`}>{C.rights}</p>
    </footer>
  )
}
