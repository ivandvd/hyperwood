/**
 * The exchange part by part, on the light ground (&flow=soar), as the reference has its own (trysoar.com, "The
 * exchange in detail."): a headline at the left of the middle column and two round arrows at its right; under them
 * a row of tall cards that begins at the column and runs on off the right of the screen, each a picture with a part
 * of the exchange and a sentence at its foot. The arrows (or the finger) move the row a card at a time. The pictures
 * are the app's own close views and stills of the films. The words: `soar.detail` in content.home.ts.
 */
import { useRef } from 'react'
import { home } from '../../content.home'
import { films, type FilmName } from '../../film/reel'
import ticket from '../../assets/product/card-ticket-700.webp'
import request from '../../assets/product/card-request-700.webp'
import payout from '../../assets/product/card-payout-700.webp'
import s from './soar.module.css'

const PICTURES: Record<string, string> = { ticket, request, payout, booth: films.booth.still, board: films.board.still, seal: films.seal.still }

export function Detail() {
  const D = home.soar.detail
  const row = useRef<HTMLUListElement>(null)
  const move = (way: 1 | -1) => {
    const el = row.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: way * (card.getBoundingClientRect().width + gap), behavior: 'smooth' })
  }
  return (
    <section className={`${s.paper} ${s.detail}`} aria-labelledby="detail-title" data-light="">
      <div className={s.detailHead}>
        <h2 id="detail-title" className={s.two}>
          <b>{D.title[0]}</b> <span>{D.title[1]}</span>
        </h2>
        <div className={s.arrows}>
          <button type="button" onClick={() => move(-1)} aria-label="Back">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M12.5 8H4.3M7.8 4.4 4.2 8l3.6 3.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" onClick={() => move(1)} aria-label="On">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3.5 8h8.2M8.2 4.4 11.8 8l-3.6 3.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <ul ref={row} className={s.cardsRow}>
        {D.cards.map((card) => (
          <li key={card.lead} className={s.tall} data-film={card.picture in films ? '' : undefined}>
            <img src={PICTURES[card.picture] ?? films[card.picture as FilmName]?.still} alt="" loading="lazy" decoding="async" />
            <p>
              <b>{card.lead}</b>
              <span>{card.rest}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
