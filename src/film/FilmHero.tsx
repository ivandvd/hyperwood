/**
 * The film hero: a try of the landing page's first screen in the manner of bulk.trade's.
 *
 * The films stand in a box two of the page's three columns wide, going round as a strip (FilmStrip.tsx), each
 * with the next market's card on it. The tagline stands across the box's lower edge, the way around the site
 * and the call to action in the third column.
 *
 * Where everything stands is the stylesheet (filmHero.module.css).
 */
import { useEffect, useRef } from 'react'
import { BRAND, film } from '../content.film'
import lockup from '../assets/brand/hyperwood-lockup-neon.svg'
import type { Copy } from './edges'
import { FilmStrip, type FilmStripHandle } from './FilmStrip'
import { Quote } from './Quote'
import s from './filmHero.module.css'

export function FilmHero() {
  const root = useRef<HTMLElement>(null)
  const strip = useRef<FilmStripHandle>(null)

  // the films play only while the hero is on screen
  useEffect(() => {
    const el = root.current
    if (!el) return
    const watch = new IntersectionObserver(([entry]) => strip.current?.run(entry.isIntersecting))
    watch.observe(el)
    return () => watch.disconnect()
  }, [])

  /** The market's card, which rides on a frame with its film. */
  const card = (turn: number, copy: Copy, shown: boolean) => {
    const market = film.markets[turn % film.markets.length]
    return (
      <a className={s.card} href="./#markets" tabIndex={shown ? 0 : -1} aria-hidden={shown ? undefined : true}>
        {copy === 'sharp' ? (
          <Quote key={market.symbol} symbol={market.symbol} ticker={market.ticker} name={market.name} />
        ) : (
          // (the smeared copy needs something on its card to smear: the words, not a second live quote)
          <span className={s.plain}>
            <span className={s.ticker}>{market.ticker}</span>
            <span className={s.name}>{market.name}</span>
          </span>
        )}
      </a>
    )
  }

  return (
    <section ref={root} className={s.hero} id="top">
      <a className={s.logo} href="./" aria-label={`${BRAND} home`}>
        <img src={lockup} alt="" />
      </a>

      <FilmStrip ref={strip} className={s.film} labels={film.clips} inFrame={card} />

      <aside className={s.side}>
        <nav className={s.panel} aria-label="Main navigation">
          {film.nav.map((list, i) => (
            <ul key={i}>
              {list.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          ))}
        </nav>
        {/* (a word with a hyphen in it stays on one line) */}
        <p className={s.line}>
          {film.line.split(' ').map((word, i) => (
            <span key={i} className={word.includes('-') ? s.whole : undefined}>
              {word}{' '}
            </span>
          ))}
        </p>
        <a className={s.launch} href={film.launch.href}>
          {film.launch.label}
          <svg className={s.arrow} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
          </svg>
        </a>
      </aside>

      {/* the figures on the cards are TradingView's: saying so is part of using them */}
      <a className={s.credit} href="https://www.tradingview.com/" target="_blank" rel="noopener nofollow">
        Quotes by TradingView
      </a>

      <h1 className={s.title}>
        {film.title.map((line) => (
          <span key={line}>{line} </span>
        ))}
      </h1>
    </section>
  )
}
