/**
 * The landing page's footer: the tagline, the way around the page, the call to action, and what the papers
 * insist on being said.
 */
import { BRAND, home } from '../content.home'
import s from './footer.module.css'

export function Footer() {
  const F = home.footer
  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <div className={s.top}>
          <p className={s.tagline}>
            {F.tagline.map((line) => (
              <span key={line}>{line} </span>
            ))}
          </p>
          <nav className={s.links} aria-label="Footer">
            {F.links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <a className={s.launch} href={home.launch.href}>
            {home.launch.label} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <ul className={s.notes}>
          {F.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <div className={s.bottom}>
          <span className={s.mark} role="img" aria-label={BRAND} />
          <span>{F.rights}</span>
        </div>
      </div>
    </footer>
  )
}
