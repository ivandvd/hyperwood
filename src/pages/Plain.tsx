/**
 * A page of words alone: the two legal pages and the page that thanks. On Ink, in the landing page's own type: the
 * mark at the upper left (the way back to the start) and the call to action at the upper right, as the landing page
 * has them; the page's name in two tones at the left with a few lines under it, and what it says in a column at the
 * right (one under the other on a narrow screen); a hairline and a row of links at its foot.
 *
 * Where everything stands: plain.module.css.
 */
import type { ReactNode } from 'react'
import { home } from '../content.home'
import { words } from '../content.site'
import { LegalLinks } from '../site/LegalLinks'
import { ROOT } from '../site/site'
import { LaunchLink } from '../ui/LaunchLink'
import s from './plain.module.css'

export function Plain({ title, lead, under, children }: { title: string[]; lead?: string; under?: ReactNode; children?: ReactNode }) {
  return (
    <div className={s.page}>
      <header className={s.top}>
        <a className={s.mark} href={ROOT || './'} aria-label={`Hyperwood: ${words.home.toLowerCase()}`}>
          <i aria-hidden="true" />
        </a>
        <LaunchLink href={home.launch.href} soft>
          {home.launch.label}
        </LaunchLink>
      </header>
      <main className={s.main} data-alone={children ? undefined : ''}>
        <div className={s.head}>
          <h1>
            <b>{title[0]}</b> <span>{title[1]}</span>
          </h1>
          {lead && <p className={s.lead}>{lead}</p>}
          {under}
        </div>
        {children && <div className={s.text}>{children}</div>}
      </main>
      <footer className={s.foot}>
        <span>{home.footer.rights}</span>
        <nav aria-label="Footer">
          <a href={ROOT || './'}>{words.home}</a>
          <a href={`${ROOT}architecture/`}>Architecture</a>
          <LegalLinks />
        </nav>
      </footer>
    </div>
  )
}

/** A part of such a page: its heading and its paragraphs. */
export function Part({ head, children }: { head: string; children: ReactNode }) {
  return (
    <section className={s.part}>
      <h2>{head}</h2>
      {children}
    </section>
  )
}
