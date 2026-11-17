/**
 * The header of the landing page: links, the mark in the middle, the call to action. It comes in with the
 * hero and stays inert until it is mostly there (timeline.ts); then it stays at the top of the screen.
 */
import type { Ref } from 'react'
import { BRAND, home } from '../content.home'
import s from './header.module.css'

export function Header({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <header ref={ref} className={s.header} inert>
      <nav className={s.nav} aria-label="Main navigation">
        {home.nav.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <a className={s.brand} href="#top" aria-label={`${BRAND} home`}>
        <span className={s.mark} aria-hidden="true" />
      </a>
      <a className={s.launch} href={home.launch.href}>
        {home.launch.label} <span aria-hidden="true">↗</span>
      </a>
    </header>
  )
}
