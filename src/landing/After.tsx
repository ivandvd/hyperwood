/**
 * What follows the journey, on the journey's own Ink. There are no sections with grounds of their own: three
 * hairlines run down the whole of it, and everything stands in the three columns they make.
 *
 * - The app, as three things it does. Each is a line, a short text, and a short film of the app doing it
 *   (landing/reel): the order, the sealed positions, the payout. The outer two stand a step lower.
 * - The markets: every ticker in the first column, and the picked one's real price over the last year in the
 *   other two (app/MarketsBoard.tsx: a live chart).
 * - The mobile app: a wider film of its two screens. On a narrow screen the two phones simply stand there.
 * - The network: the journey's gate, lit, inside two more (Hyperwood inside Robinhood Chain inside
 *   Ethereum), what each is, and the papers' speed targets.
 *
 * It begins under the journey's held river (journey.module.css): its first lines come up over it.
 */
import { home } from '../content.home'
import { MarketsBoard } from '../app/MarketsBoard'
import { CloseScreen, Phone, TradeScreen } from '../app/Phone'
import { Reel } from './reel/Reel'
import { orderFilm, payoutFilm, phonesFilm, sealedFilm } from './reel/films'
import { OrderSet, PayoutSet, PhonesSet, SealedSet } from './reel/sets'
import { FilmBlock } from './FilmBlock'
import { Reveal } from './Reveal'
import { Statement } from './Statement'
import { useSeen } from './useSeen'
import s from './after.module.css'

const films = [
  { film: orderFilm, set: <OrderSet /> },
  { film: sealedFilm, set: <SealedSet /> },
  { film: payoutFilm, set: <PayoutSet /> },
]

/** A try (the address ?films=after): the three films come after the hero, as the reference shows its own
 *  (FilmBlock.tsx), then the statement (Statement.tsx), and the journey has none (timeline.ts). Only with the
 *  films' hero. */
const filmsAfter = new URLSearchParams(window.location.search).get('films') === 'after'

export function After() {
  const [board, boardSeen] = useSeen<HTMLDivElement>(0.02)
  const M = home.markets
  const P = home.mobile
  const N = home.network
  return (
    <div className={s.after} data-films={filmsAfter ? 'after' : undefined}>
      {filmsAfter && <FilmBlock />}
      {filmsAfter && <Statement />}
      <div className={s.rules} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <section id="app" className={s.films} aria-label="The app">
        {home.app.map((item, i) => (
          <article key={item.line} className={s.film}>
            <Reveal delay={i}>
              <h2 className={s.claim}>{item.line}</h2>
              <p className={s.sub}>{item.body}</p>
              <Reel film={films[i].film} label={item.film} ahead={i * 1.45}>
                {films[i].set}
              </Reel>
            </Reveal>
          </article>
        ))}
      </section>

      <section id="markets" className={s.block} aria-labelledby="markets-title">
        <Reveal className={s.head}>
          <h2 id="markets-title" className={s.line}>
            {M.line}
          </h2>
          <p className={s.body}>{M.body}</p>
        </Reveal>
        <Reveal>
          <div ref={board} className={s.board}>
            <MarketsBoard live={boardSeen} />
          </div>
        </Reveal>
      </section>

      <section id="mobile" className={`${s.block} ${s.mobile}`} aria-labelledby="mobile-title">
        <Reveal className={s.aside}>
          <h2 id="mobile-title" className={s.line}>
            {P.line}
          </h2>
          <p className={s.body}>{P.body}</p>
        </Reveal>
        <Reveal delay={1} className={s.wide}>
          <div className={s.onFilm}>
            <Reel film={phonesFilm} label={P.film}>
              <PhonesSet labels={P.screens} />
            </Reel>
          </div>
          <div className={s.phones}>
            <Phone label={P.screens[0]}>
              <TradeScreen />
            </Phone>
            <Phone label={P.screens[1]}>
              <CloseScreen />
            </Phone>
          </div>
        </Reveal>
      </section>

      <section id="network" className={s.block} aria-labelledby="network-title">
        <Reveal className={s.head}>
          <h2 id="network-title" className={s.line}>
            {N.line}
          </h2>
          <p className={s.body}>
            {N.body}{' '}
            <a href={N.more.href}>
              {N.more.label} <span aria-hidden="true">↗</span>
            </a>
          </p>
        </Reveal>
        <Reveal className={s.network}>
          <div className={s.gates} aria-hidden="true">
            <i />
            <i data-ours="" />
            <i data-lit="" />
          </div>
          <ol className={s.layers}>
            {N.layers.map(([tag, name, role]) => (
              <li key={tag} data-ours={tag === 'L3' ? '' : undefined}>
                <i>{tag}</i>
                <b>{name}</b>
                <span>{role}</span>
              </li>
            ))}
          </ol>
          <div className={s.targets}>
            <p>{N.targets.label}</p>
            <dl>
              {N.targets.list.map(([value, unit, what]) => (
                <div key={what}>
                  <dd>
                    {value}
                    <small>{unit}</small>
                  </dd>
                  <dt>{what}</dt>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
