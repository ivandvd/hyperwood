/**
 * The header of the landing page. It stays inert until it is mostly there (timeline.ts); then it stays at the
 * top of the screen.
 *
 * With the room as hero it is the call to action alone, at the upper right, and it comes once the films have
 * been scrolled past: while they are on screen the hero itself has the logo, the way around the site and the
 * call to action (as the reference has it: its first screen carries them, and past it only its button stays).
 * With the mark as hero (`only` left out) it is as it was: links, the mark in the middle, the call to action,
 * coming in with the hero.
 *
 * `row`: the hero has a bar across its top (the exchange at the right), and on a screen with room for the bar's
 * row the call to action is the last thing in it: it then stands there, in the row's measures, for the whole page
 * (header.module.css; the bar keeps its place: Journey.tsx). On a screen without the row it gives way at the hero
 * to the button that opens the way around (timeline.ts). It is the softer button there (ui/LaunchLink.tsx).
 */
import type { Ref } from 'react'
import { BRAND, home } from '../content.home'
import { LaunchLink } from '../ui/LaunchLink'
import s from './header.module.css'

export function Header({ ref, only, row }: { ref: Ref<HTMLElement>; only?: 'launch'; row?: boolean }) {
  if (only === 'launch')
    return (
      <header ref={ref} className={s.bar} data-row={row ? '' : undefined} inert>
        <LaunchLink href={home.launch.href} soft={row}>
          {home.launch.label}
        </LaunchLink>
      </header>
    )
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
