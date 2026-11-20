/**
 * The statement on the light ground under the hero (&flow=soar), as the reference has its own under its first
 * screen (trysoar.com): at the left, a line in two tones (the first part dim, the last bright), a sentence under it,
 * and the call to action as an outlined pill with an arrow. The words: `soar.opening` in content.home.ts.
 */
import { home } from '../../content.home'
import s from './soar.module.css'

export function Opening() {
  const O = home.soar.opening
  return (
    <section className={`${s.paper} ${s.opening}`} aria-label="What Hyperwood is" data-light="">
      <h2 className={s.two}>
        <span>{O.dim}</span> <b>{O.bright}</b>
      </h2>
      <p className={s.sentence}>{O.body}</p>
      <a className={s.pill} href={home.launch.href}>
        {home.launch.label}
        <i aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M3.5 8h8.2M8.2 4.4 11.8 8l-3.6 3.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </i>
      </a>
    </section>
  )
}
