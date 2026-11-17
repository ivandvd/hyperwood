/**
 * The mobile app: two of its screens, drawn in HTML. A trade being opened, and a position being closed with
 * its payout chosen. They belong to the same designed scene as the web app's Trade screen (markets.ts,
 * AppPreview.tsx): the same market, the same position, the same figures.
 *
 * Everything is measured in ems of the phone's own type, so whoever shows a phone sets one font size and the
 * whole of it follows: a phone is 17.5 em wide and 36.5 em tall.
 *
 * `Phone` is one phone standing in the page. `PhoneScreens` is the inside of a phone whose body somebody else
 * draws (landing/Film.tsx: the window that becomes the phone), with the screen it shows chosen from outside.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { closed } from './scene'
import { marketOf, money, percent, series } from './markets'
import s from './phone.module.css'

const nvda = marketOf('NVDA')

/** The phone's own bar, and the cut-out at its top. */
function Top() {
  return (
    <>
      <span className={s.island} aria-hidden="true" />
      <div className={s.status} aria-hidden="true">
        <span>9:41</span>
        <span className={s.icons}>
          <i />
          <i />
          <i />
          <b />
        </span>
      </div>
    </>
  )
}

export function TradeScreen() {
  const [side, setSide] = useState<'Long' | 'Short'>('Long')
  const line = useMemo(() => {
    const values = series(nvda, 40)
    const low = Math.min(...values)
    const high = Math.max(...values)
    return values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * 100).toFixed(2)},${(38 - ((v - low) / (high - low || 1)) * 34).toFixed(2)}`).join('')
  }, [])
  return (
    <div className={s.screen}>
      <div className={s.bar}>
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
        <path d={line} />
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

export function CloseScreen() {
  const [choice, setChoice] = useState<'keep' | 'convert'>('convert')
  const options = [
    { name: 'keep' as const, title: 'Keep collateral', detail: `$${money(closed.equity)} to your private balance` },
    { name: 'convert' as const, title: `Convert to ${closed.ticker} tracker`, detail: `${(closed.equity / closed.mark).toFixed(2)} units at ${money(closed.mark)}` },
  ]
  return (
    <div className={s.screen}>
      <div className={s.bar}>
        <span className={s.back} aria-hidden="true" />
        <b>Position</b>
        <span className={s.pill}>
          <i aria-hidden="true" />
          Private
        </span>
      </div>
      <div className={s.card}>
        <p className={s.cardHead}>
          <b>{closed.ticker}-PERP</b>
          <span className={s.long}>{closed.side}</span>
          <span className={s.chip}>Closed</span>
        </p>
        <p className={s.path}>
          {closed.size} units · {money(closed.entry)} to {money(closed.mark)}
        </p>
        <p className={s.pnl}>
          <strong>+${money(closed.pnl)}</strong>
          <small>Realized</small>
        </p>
      </div>
      <p className={s.equity}>
        <span>Available equity</span>
        <b>${money(closed.equity)}</b>
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

/** One phone standing in the page: its body is an outline, like the app's window. */
export function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.phone} role="group" aria-label={label}>
      <Top />
      {children}
    </div>
  )
}

/** The inside of a phone whose body is drawn by somebody else: both screens, the one asked for in view. The
 *  other waits to its side, as a screen does in an app. `scripted`: the page moves it; it does not answer. */
export function PhoneScreens({ screen, labels, scripted = false }: { screen: 0 | 1; labels: readonly string[]; scripted?: boolean }) {
  return (
    <div className={s.screens} data-screen={screen}>
      <Top />
      {[TradeScreen, CloseScreen].map((Screen, i) => (
        <div key={labels[i]} className={s.slide} role="group" aria-label={labels[i]} aria-hidden={screen !== i} inert={scripted || screen !== i}>
          <Screen />
        </div>
      ))}
    </div>
  )
}
