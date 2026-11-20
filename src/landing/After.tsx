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
 *
 * With the films after the hero (a try: the address ?films=after) it begins otherwise: the three films
 * (FilmBlock.tsx), the statement (Statement.tsx), and the app on its stage (AppStage.tsx: the web app on a monitor,
 * three close views of it, then the app on phones), each from one edge of the screen to the other, and a last screen
 * of its own (Finale.tsx): a line, the app on a standing phone, the call to action. The hairlines, their columns, the markets, the network and the app's three short films
 * are not shown.
 */
import { useEffect, useRef } from 'react'
import { home } from '../content.home'
import { MarketsBoard } from '../app/MarketsBoard'
import { CloseScreen, Phone, TradeScreen } from '../app/Phone'
import { Reel } from './reel/Reel'
import { orderFilm, payoutFilm, phonesFilm, sealedFilm } from './reel/films'
import { OrderSet, PayoutSet, PhonesSet, SealedSet } from './reel/sets'
import { AppStage } from './AppStage'
import { FilmBlock } from './FilmBlock'
import { Finale } from './Finale'
import { filmsAfter, flowSoar } from './flags'
import { paperGrain } from './grain'
import { Reveal } from './Reveal'
import { Daybreak } from './soar/Daybreak'
import { Detail } from './soar/Detail'
import { Faq } from './soar/Faq'
import { Features } from './soar/Features'
import { HowItWorks } from './soar/HowItWorks'
import { Opening } from './soar/Opening'
import { Sizes } from './soar/Sizes'
import { TryIt } from './soar/TryIt'
import { watchTone } from './soar/tone'
import { WhoSees } from './soar/WhoSees'
import { Statement } from './Statement'
import { useSeen } from './useSeen'
import s from './after.module.css'

const films = [
  { film: orderFilm, set: <OrderSet /> },
  { film: sealedFilm, set: <SealedSet /> },
  { film: payoutFilm, set: <PayoutSet /> },
]

export function After() {
  const [board, boardSeen] = useSeen<HTMLDivElement>(0.02)
  // (with &flow=soar: the light ground's grain, made once in the page)
  const soarRoot = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = soarRoot.current
    if (!flowSoar || !root) return
    // (on the page's root: the foot, which stands outside this, has it too)
    document.documentElement.style.setProperty('--paper-grain', paperGrain())
    const foot = document.querySelector('footer[data-light]')
    const stop = watchTone(root, foot)
    return () => {
      stop()
      document.documentElement.style.removeProperty('--paper-grain')
    }
  }, [])
  const M = home.markets
  const P = home.mobile
  const N = home.network

  const rules = (
    <div className={s.rules} aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  )
  const markets = (
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
  )
  const network = (
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
  )

  if (flowSoar)
    return (
      <div ref={soarRoot} className={s.after} data-films="after" data-flow="soar">
        <Daybreak from="river" />
        <Opening />
        <Features />
        <AppStage sky="drop" />
        <HowItWorks />
        <WhoSees />
        <Daybreak from="ink" />
        <Sizes />
        <Detail />
        <Faq />
        <TryIt />
      </div>
    )

  if (filmsAfter)
    return (
      <div className={s.after} data-films="after">
        <FilmBlock />
        <Statement />
        <AppStage />
        <Finale />
      </div>
    )

  return (
    <div className={s.after}>
      {rules}

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

      {markets}

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

      {network}
    </div>
  )
}
