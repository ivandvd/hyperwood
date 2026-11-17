/**
 * Mobile: the same private account on a phone. Two screens of the mobile app, drawn in HTML with sample data
 * (app/markets.ts): a trade being opened, and a position being closed with its payout chosen. They stand as
 * two large phones turned a little away, the second behind the first and running off the section's foot.
 */
import { useMemo, useState } from 'react'
import { home } from '../content.home'
import { markets, money, percent, series } from '../app/markets'
import { Heading, Reveal } from './Reveal'
import k from './kit.module.css'
import s from './mobile.module.css'

const nvda = markets.find((m) => m.ticker === 'NVDA')!

function Status() {
  return (
    <div className={s.status} aria-hidden="true">
      <span>9:41</span>
      <span className={s.icons}>
        <i />
        <i />
        <i />
        <b />
      </span>
    </div>
  )
}

function TradeScreen() {
  const [side, setSide] = useState<'Long' | 'Short'>('Long')
  const chart = useMemo(() => {
    const line = series(nvda, 40)
    const low = Math.min(...line)
    const high = Math.max(...line)
    const d = line.map((v, i) => `${i ? 'L' : 'M'}${((i / (line.length - 1)) * 100).toFixed(2)},${(38 - ((v - low) / (high - low || 1)) * 34).toFixed(2)}`).join('')
    return { d, area: `${d}L100,40L0,40Z` }
  }, [])
  return (
    <div className={s.screen}>
      <Status />
      <div className={s.top}>
        <span className={s.mark} aria-hidden="true" />
        <b>Trade</b>
        <span className={s.pill}>
          <i aria-hidden="true" />
          Private
        </span>
      </div>
      <div className={s.market}>
        <div>
          <b>NVDA-PERP</b>
          <small>NVIDIA · Stock</small>
        </div>
        <div className={s.quote}>
          <b>{money(nvda.price)}</b>
          <small>{percent(nvda.change)}</small>
        </div>
      </div>
      <svg className={s.spark} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="phone-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--hw-neon)" stopOpacity="0.24" />
            <stop offset="1" stopColor="var(--hw-neon)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={chart.area} fill="url(#phone-fill)" />
        <path d={chart.d} className={s.line} />
      </svg>
      <div className={s.sides}>
        {(['Long', 'Short'] as const).map((name) => (
          <button key={name} type="button" aria-pressed={side === name} data-long={name === 'Long' ? '' : undefined} onClick={() => setSide(name)}>
            {name}
          </button>
        ))}
      </div>
      <dl className={s.fields}>
        <div>
          <dt>Size</dt>
          <dd>10 units</dd>
        </div>
        <div>
          <dt>Leverage</dt>
          <dd>5×</dd>
        </div>
        <div>
          <dt>Margin</dt>
          <dd>${money((nvda.price * 10) / 5)}</dd>
        </div>
      </dl>
      <span className={s.cta}>Sign sealed order</span>
      <span className={s.home} aria-hidden="true" />
    </div>
  )
}

function CloseScreen() {
  const [choice, setChoice] = useState<'keep' | 'convert'>('convert')
  const size = 12
  const entry = 178.4
  const exit = nvda.price
  const pnl = (exit - entry) * size
  const equity = (entry * size) / 5 + pnl
  const options = [
    { name: 'keep' as const, title: 'Keep collateral', detail: `$${money(equity)} to your private balance` },
    { name: 'convert' as const, title: 'Convert to NVDA tracker', detail: `${(equity / exit).toFixed(2)} units at ${money(exit)}` },
  ]
  return (
    <div className={s.screen}>
      <Status />
      <div className={s.top}>
        <span className={s.back} aria-hidden="true" />
        <b>Position</b>
        <span className={s.pill}>
          <i aria-hidden="true" />
          Private
        </span>
      </div>
      <div className={s.card}>
        <p className={s.cardHead}>
          <b>NVDA-PERP</b>
          <span className={s.long}>Long</span>
          <span className={s.chip}>Closed</span>
        </p>
        <p className={s.path}>
          {size} units · {money(entry)} to {money(exit)}
        </p>
        <p className={s.pnl}>
          <strong>+${money(pnl)}</strong>
          <small>Realized</small>
        </p>
      </div>
      <p className={s.equity}>
        <span>Available equity</span>
        <b>${money(equity)}</b>
      </p>
      <div className={s.options} role="radiogroup" aria-label="Payout">
        {options.map((option) => (
          <button key={option.name} type="button" role="radio" aria-checked={choice === option.name} onClick={() => setChoice(option.name)}>
            <i className={s.radio} aria-hidden="true" />
            <b>{option.title}</b>
            <small>{option.detail}</small>
          </button>
        ))}
      </div>
      <span className={s.cta}>Confirm payout</span>
      <p className={s.receipt}>
        <i aria-hidden="true" />
        Encrypted receipt · Proof verified
      </p>
      <span className={s.home} aria-hidden="true" />
    </div>
  )
}

export function Mobile() {
  const M = home.mobile
  return (
    <section id="mobile" className={`${k.section} ${s.section}`} aria-labelledby="mobile-title">
      <div className={`${k.wrap} ${s.layout}`}>
        <div className={s.copy}>
          <Heading id="mobile-title" label={M.label} line={M.line} body={M.body} />
          <Reveal delay={1}>
            <p className={k.caption}>{M.caption}</p>
          </Reveal>
        </div>
        <Reveal delay={1} className={s.phones}>
          <span className={s.floor} aria-hidden="true" />
          {[TradeScreen, CloseScreen].map((Screen, i) => (
            <div key={M.screens[i]} className={s.phone} role="group" aria-label={M.screens[i]}>
              <span className={s.island} aria-hidden="true" />
              <Screen />
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
