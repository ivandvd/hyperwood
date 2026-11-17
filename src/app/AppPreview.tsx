/**
 * A preview of the Hyperwood web app: markets, a chart, the order ticket and the account's positions, with
 * sample data (markets.ts). It is a picture of the product that can be touched: a market can be picked, the
 * side switched, an order signed.
 *
 * `view` is whose eyes it is seen through. "yours": everything, as the owner sees it. "network": what the
 * papers say stays inside the protected engine (market, direction, size, leverage, price, PnL) is sealed, and
 * what is left is what the network has: an encrypted instruction, commitments and a proof.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { markets, money, percent, series } from './markets'
import { Sealed } from './Sealed'
import s from './appPreview.module.css'

export type View = 'yours' | 'network'

/** What the account holds in the preview: the market, the side, how many units and the entry price. */
const book = [
  { ticker: 'NVDA', side: 'Long', size: 12, entry: 178.4 },
  { ticker: 'SPX', side: 'Short', size: 0.2, entry: 6871 },
] as const

/** The first position, closed at its mark: what the payout sheet shows (margin at five times leverage). */
const closed = (() => {
  const p = book[0]
  const mark = markets.find((m) => m.ticker === p.ticker)!.price
  const pnl = (mark - p.entry) * p.size
  return { ...p, mark, pnl, equity: (p.entry * p.size) / 5 + pnl }
})()

/** An order's life, as the architecture paper names its stages. */
const stages = ['Sealed', 'Accepted', 'Matched', 'Proven']

const W = 640
const H = 250

/** `live`: the section has been seen, so the chart may draw itself in. `sheet`: a position is being closed,
 *  and the sheet that asks where its proceeds go is up. */
export function AppPreview({ view, live = true, sheet = false }: { view: View; live?: boolean; sheet?: boolean }) {
  const [picked, setPicked] = useState(0)
  const [side, setSide] = useState<'Long' | 'Short'>('Long')
  const [stage, setStage] = useState(-1)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const market = markets[picked]
  const up = market.change >= 0
  const chart = useMemo(() => {
    const line = series(market)
    const low = Math.min(...line)
    const high = Math.max(...line)
    const x = (i: number) => (i / (line.length - 1)) * W
    const y = (v: number) => 14 + (1 - (v - low) / (high - low || 1)) * (H - 40)
    let d = `M${x(0).toFixed(1)},${y(line[0]).toFixed(1)}`
    for (let i = 1; i < line.length; i++) {
      const mid = ((x(i - 1) + x(i)) / 2).toFixed(1)
      d += `C${mid},${y(line[i - 1]).toFixed(1)} ${mid},${y(line[i]).toFixed(1)} ${x(i).toFixed(1)},${y(line[i]).toFixed(1)}`
    }
    const marks = [0, 1, 2, 3].map((k) => low + ((high - low) * k) / 3)
    return { d, area: `${d}L${W},${H}L0,${H}Z`, end: y(line[line.length - 1]), marks, y }
  }, [market])

  /** Signing walks the order through its stages, then lets it rest. */
  const sign = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    setStage(0)
    timers.current = [
      window.setTimeout(() => setStage(1), 600),
      window.setTimeout(() => setStage(2), 1400),
      window.setTimeout(() => setStage(3), 2400),
      window.setTimeout(() => setStage(-1), 5600),
    ]
  }

  return (
    <div className={s.app} data-view={view} data-live={live ? '' : undefined} role="group" aria-label="Preview of the Hyperwood web app, with sample data">
      <header className={s.bar0}>
        <span className={s.logo} aria-hidden="true" />
        <nav className={s.tabs} aria-label="Preview sections">
          <span data-on="">Trade</span>
          <span>Markets</span>
          <span>Portfolio</span>
          <span>Trackers</span>
        </nav>
        <span className={s.pill}>
          <i aria-hidden="true" />
          Private account
        </span>
        <span className={s.wallet}>0x71C4…9A3f</span>
      </header>

      <aside className={s.list} data-part="list" aria-label="Markets">
        <p className={s.label}>Markets</p>
        <ul>
          {markets.map((m, i) => (
            <li key={m.ticker}>
              <button type="button" className={s.row} data-on={i === picked ? '' : undefined} onClick={() => setPicked(i)}>
                <span className={s.ticker}>{m.ticker}</span>
                <span className={s.name}>{m.name}</span>
                <span className={s.price}>{money(m.price)}</span>
                <span className={s.change} data-up={m.change >= 0 ? '' : undefined}>
                  {percent(m.change)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className={s.main}>
        <div className={s.head}>
          <div className={s.what}>
            <Sealed>
              <strong>{market.ticker}-PERP</strong>
            </Sealed>
            <span className={s.kind}>
              <Sealed>{market.kind === 'index' ? 'Equity index' : 'Stock'} · Regular session</Sealed>
            </span>
          </div>
          <div className={s.stat}>
            <span className={s.label}>Mark</span>
            <b>
              <Sealed>{money(market.price)}</Sealed>
            </b>
          </div>
          <div className={s.stat}>
            <span className={s.label}>Today</span>
            <b data-up={up ? '' : undefined} className={s.change}>
              <Sealed>{percent(market.change)}</Sealed>
            </b>
          </div>
          <div className={s.stat}>
            <span className={s.label}>Funding</span>
            <b>
              <Sealed>0.004%</Sealed>
            </b>
          </div>
        </div>

        <div className={s.chart} data-part="chart">
          {/* (a new market draws its line in from the left: the key makes it a new picture) */}
          <svg key={`line-${market.ticker}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="app-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--hw-neon)" stopOpacity="0.22" />
                <stop offset="1" stopColor="var(--hw-neon)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {chart.marks.map((v) => (
              <line key={v} x1="0" x2={W} y1={chart.y(v)} y2={chart.y(v)} className={s.grid} />
            ))}
            <path d={chart.area} fill="url(#app-fill)" />
            <path d={chart.d} className={s.line} />
          </svg>
          <ol className={s.scale} aria-hidden="true">
            {chart.marks.map((v) => (
              <li key={v} style={{ top: `${(chart.y(v) / H) * 100}%` }}>
                {money(v)}
              </li>
            ))}
          </ol>
          <span key={`last-${market.ticker}`} className={s.last} style={{ top: `${(chart.end / H) * 100}%` }}>
            {money(market.price)}
          </span>
          <div className={s.veil} aria-hidden={view === 'yours'}>
            <span className={s.lock} aria-hidden="true" />
            <p>Encrypted instruction</p>
            <small>The network orders it and checks its proof. It cannot read it.</small>
          </div>
        </div>

        <div className={s.book} data-part="book">
          <p className={s.label}>Positions</p>
          <table>
            <thead>
              <tr>
                <th>Market</th>
                <th>Side</th>
                <th>Size</th>
                <th>Entry</th>
                <th>Mark</th>
                <th>PnL</th>
              </tr>
            </thead>
            <tbody>
              {book.map((p) => {
                const mark = markets.find((m) => m.ticker === p.ticker)!.price
                const pnl = (mark - p.entry) * p.size * (p.side === 'Long' ? 1 : -1)
                return (
                  <tr key={p.ticker}>
                    <td>
                      <Sealed>{p.ticker}-PERP</Sealed>
                    </td>
                    <td>
                      <Sealed>
                        <span className={s.side} data-long={p.side === 'Long' ? '' : undefined}>
                          {p.side}
                        </span>
                      </Sealed>
                    </td>
                    <td>
                      <Sealed>{p.size}</Sealed>
                    </td>
                    <td>
                      <Sealed>{money(p.entry)}</Sealed>
                    </td>
                    <td>
                      <Sealed>{money(mark)}</Sealed>
                    </td>
                    <td>
                      <Sealed>
                        <span className={s.change} data-up={pnl >= 0 ? '' : undefined}>
                          {pnl >= 0 ? '+' : '−'}${money(Math.abs(pnl))}
                        </span>
                      </Sealed>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className={s.ticket} data-part="ticket" aria-label="Order">
        <div className={s.sides}>
          {(['Long', 'Short'] as const).map((name) => (
            <button key={name} type="button" data-on={side === name ? '' : undefined} data-long={name === 'Long' ? '' : undefined} onClick={() => setSide(name)}>
              <Sealed>{name}</Sealed>
            </button>
          ))}
        </div>
        <dl className={s.fields}>
          <div>
            <dt>Size</dt>
            <dd>
              <Sealed>10 units</Sealed>
            </dd>
          </div>
          <div>
            <dt>Leverage</dt>
            <dd>
              <Sealed>5×</Sealed>
            </dd>
          </div>
          <div>
            <dt>Limit price</dt>
            <dd>
              <Sealed>{money(market.price)}</Sealed>
            </dd>
          </div>
          <div>
            <dt>Margin</dt>
            <dd>
              <Sealed>${money((market.price * 10) / 5)}</Sealed>
            </dd>
          </div>
        </dl>
        <button type="button" className={s.sign} onClick={sign}>
          Sign sealed order
        </button>
        <ol className={s.stages} aria-label="Order status">
          {stages.map((name, i) => (
            <li key={name} data-on={stage >= i ? '' : undefined}>
              {name}
            </li>
          ))}
        </ol>
        <div className={s.sees}>
          <p className={s.label}>What reaches the network</p>
          <p>
            Commitment <code>0x7c1e…a94f</code>
          </p>
          <p>
            State root <code>0x8f2c…41ab</code>
          </p>
          <p className={s.proof}>
            <i aria-hidden="true" />
            Proof verified
          </p>
        </div>
      </aside>

      {/* closing a position: where its proceeds go (the figures follow the first position in the book) */}
      <div className={s.sheet} data-part="sheet" data-on={sheet ? '' : undefined} aria-hidden={!sheet}>
        <p className={s.sheetHead}>
          <b>Close position</b>
          <span>
            {closed.ticker}-PERP · {closed.side} · {closed.size} units
          </span>
        </p>
        <p className={s.sheetRow}>
          <span>Realized PnL</span>
          <b className={s.change} data-up="">
            +${money(closed.pnl)}
          </b>
        </p>
        <p className={s.sheetSum}>
          <span>Available equity</span>
          <strong>${money(closed.equity)}</strong>
        </p>
        <div className={s.payouts}>
          <div>
            <b>Keep collateral</b>
            <span>${money(closed.equity)} to your private balance</span>
          </div>
          <div data-on="">
            <b>Convert to {closed.ticker} tracker</b>
            <span>
              {(closed.equity / closed.mark).toFixed(2)} units at {money(closed.mark)}
            </span>
          </div>
        </div>
        <span className={s.confirm}>Confirm payout</span>
      </div>
    </div>
  )
}
