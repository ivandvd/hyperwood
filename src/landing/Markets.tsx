/**
 * The markets. The statement runs straight on into its own examples: after "Stocks and indices." the tickers
 * follow in the same large type, dim, as one block of text. One of them is lit at a time, and a single line
 * under the block reads it out: its name, its day, its price. The light moves on by itself, slowly, until the
 * reader points at a ticker; then it is theirs. They are examples with sample prices (app/markets.ts).
 */
import { useEffect, useMemo, useState } from 'react'
import { home } from '../content.home'
import { markets, money, percent, series } from '../app/markets'
import { Reveal } from './Reveal'
import { useSeen } from './useSeen'
import k from './kit.module.css'
import s from './markets.module.css'

const M = home.markets
const ordered = [...markets.filter((m) => m.kind === 'index'), ...markets.filter((m) => m.kind === 'stock')]

export function Markets() {
  const [lit, setLit] = useState(4)
  const [held, setHeld] = useState(false)
  const [wall, seen] = useSeen<HTMLParagraphElement>(0.2)
  const market = ordered[lit]

  // the light moves on by itself while the wall is in view and nobody is pointing (not under reduced motion)
  useEffect(() => {
    if (held || !seen || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return
    const timer = window.setInterval(() => setLit((i) => (i + 7) % ordered.length), 2400)
    return () => window.clearInterval(timer)
  }, [held, seen])

  const line = useMemo(() => {
    const values = series(market, 48)
    const low = Math.min(...values)
    const high = Math.max(...values)
    return values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * 240).toFixed(1)},${(34 - ((v - low) / (high - low || 1)) * 30).toFixed(1)}`).join('')
  }, [market])

  return (
    <section id="markets" className={k.section} aria-labelledby="markets-title">
      <div className={k.wrap}>
        <Reveal>
          <p className={k.label}>{M.label}</p>
          <p ref={wall} className={s.wall} onPointerLeave={() => setHeld(false)}>
            <strong id="markets-title" role="heading" aria-level={2}>
              {M.line}
            </strong>{' '}
            {ordered.map((m, i) => (
              <span key={m.ticker}>
                <button
                  type="button"
                  data-on={i === lit ? '' : undefined}
                  onPointerEnter={() => {
                    setHeld(true)
                    setLit(i)
                  }}
                  onFocus={() => {
                    setHeld(true)
                    setLit(i)
                  }}
                >
                  {m.ticker}
                </button>{' '}
              </span>
            ))}
          </p>
        </Reveal>
        <Reveal delay={1}>
          <div className={s.readout} data-up={market.change >= 0 ? '' : undefined} aria-live="off">
            <p className={s.who}>
              <b>{market.ticker}-PERP</b>
              <span>
                {market.name} · {market.kind === 'index' ? 'Equity index' : 'Stock'}
              </span>
            </p>
            <svg key={market.ticker} viewBox="0 0 240 36" preserveAspectRatio="none" aria-hidden="true">
              <path d={line} />
            </svg>
            <p className={s.price}>{money(market.price)}</p>
            <p className={s.day}>{percent(market.change)}</p>
            <p className={s.sides}>
              <span data-long="">{M.sides[0]}</span>
              <span>{M.sides[1]}</span>
            </p>
          </div>
          <p className={k.caption}>{M.caption}</p>
        </Reveal>
        <Reveal className={s.about}>
          <p className={s.body}>{M.body}</p>
          <ul className={s.facts}>
            {M.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
