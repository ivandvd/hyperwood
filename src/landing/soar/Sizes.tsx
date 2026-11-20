/**
 * Who it is for, on the light ground after the app's stage (&flow=soar), as the reference has its own there
 * (trysoar.com, "Built for everyone."): a headline in the middle, and under it two large cards side by side, each a
 * picture with who it is for and why at its upper left, in white, and a round button at its lower right. The
 * pictures are stills of the films; the reasons are the Investor Overview's own. The words: `soar.sizes` in
 * content.home.ts.
 */
import { home } from '../../content.home'
import { films, type FilmName } from '../../film/reel'
import s from './soar.module.css'

/** Where each card's button goes: the app for traders; the long read for funds and desks. */
const TO = [home.launch.href, 'architecture/']

export function Sizes() {
  const S = home.soar.sizes
  return (
    <section className={`${s.paper} ${s.sizes}`} aria-labelledby="sizes-title" data-light="">
      <h2 id="sizes-title" className={s.middle}>
        <span>{S.title[0]}</span> <b>{S.title[1]}</b>
      </h2>
      <div className={s.pair}>
        {S.cards.map((card, i) => (
          <article key={card.lead} className={s.big}>
            <img src={films[card.film as FilmName].still} alt="" loading="lazy" decoding="async" />
            <p>
              <b>{card.lead}</b> {card.rest}
            </p>
            <a className={s.round} href={TO[i]} aria-label={`${card.lead} More`}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M3.5 8h8.2M8.2 4.4 11.8 8l-3.6 3.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}
