/**
 * The web app's Trade screen, as a picture of the product: the markets with their real prices, the traded market's
 * real candles, the ticket that signs a sealed order, the account's positions as only the account sees them, and
 * the last request on its way through the papers' four stages (accepted, matched, proven, settled).
 *
 * It is drawn at a fixed size (1280 by 820: `.app` in terminal.module.css) and shown scaled, on the monitor of the
 * landing page (landing/AppStage.tsx) and by itself (studio.html). Nothing in it works: it is the app's face, with
 * the mechanics of the papers behind every figure (data.ts).
 *
 * `sheet`: with 'close', the sheet that closes the position and asks how it is paid out lies over it.
 */
import type { ReactNode } from 'react'
import { Chart } from './Chart'
import { CloseSheet } from './CloseSheet'
import { Icon } from './icons'
import { Mark, Sealed } from './parts'
import { account, focus, hedge, markets, money, order, percent, position, request, signed, sparkPath, usd } from './data'
import t from './terminal.module.css'

const Stat = ({ label, children, note }: { label: string; children: ReactNode; note?: string }) => (
  <div className={t.stat}>
    <span>{label}</span>
    <b>{children}</b>
    {note && <em>{note}</em>}
  </div>
)

export function Terminal({ sheet }: { sheet?: 'close' }) {
  const up = focus.change >= 0
  const value = order.units * order.limit
  return (
    <div className={t.app} data-sheet={sheet}>
      {/* ------------------------------------------------------------ the bar across the top */}
      <header className={t.top}>
        <Mark className={t.mark} />
        <nav className={t.nav}>
          <b>Trade</b>
          <span>Portfolio</span>
          <span>Markets</span>
          <span>Trackers</span>
        </nav>
        <div className={t.proven}>
          <i>{Icon.shield}</i>
          Batch 48,112 proven
        </div>
        <div className={t.gas}>
          <span>Gas</span>
          {account.gas.toFixed(4)} ETH
        </div>
        <div className={t.account}>
          <i />
          {account.address}
          {Icon.chevron}
        </div>
      </header>

      {/* ------------------------------------------------------------ the markets */}
      <aside className={t.markets}>
        <div className={t.search}>
          {Icon.search}
          <span>Search markets</span>
          <kbd>/</kbd>
        </div>
        <div className={t.kinds}>
          <b>All</b>
          <span>Stocks</span>
          <span>Indices</span>
          <span>Watchlist</span>
        </div>
        <ul className={t.list}>
          {markets.map((m) => (
            <li key={m.ticker} data-on={m.ticker === focus.ticker ? '' : undefined}>
              <div>
                <b>{m.ticker}</b>
                <span>{m.name}</span>
              </div>
              <svg viewBox="0 0 52 20" data-down={m.change < 0 ? '' : undefined} aria-hidden="true">
                <path d={sparkPath(m.spark, 52, 20)} />
              </svg>
              <div className={t.quote}>
                <b>{money(m.price)}</b>
                <span data-down={m.change < 0 ? '' : undefined}>{percent(m.change)}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* ------------------------------------------------------------ the traded market */}
      <main className={t.centre}>
        <div className={t.head}>
          <div className={t.name}>
            <div>
              <b>{focus.ticker}-PERP</b>
              {Icon.chevron}
            </div>
            <span>{focus.name} · Perpetual</span>
          </div>
          <div className={t.price} data-down={up ? undefined : ''}>
            <b>{money(focus.price)}</b>
            <span>
              {signed(focus.price - focus.prev)} ({percent(focus.change)})
            </span>
          </div>
          <Stat label="Index">{money(focus.price - 0.04)}</Stat>
          <Stat label="Funding / 8h">0.0041%</Stat>
          <Stat label="Session" note="closes 16:00 ET">
            Regular
          </Stat>
          <Stat label="Depth" note="no public book">
            <i className={t.lock}>{Icon.lock}</i>Sealed
          </Stat>
        </div>

        <div className={t.chartBar}>
          <div className={t.frames}>
            <span>5m</span>
            <b>15m</b>
            <span>1h</span>
            <span>4h</span>
            <span>1D</span>
          </div>
          <div className={t.legend}>
            <span>
              <i data-kind="entry" />
              Your entry
            </span>
            <span>
              <i data-kind="order" />
              Your order
            </span>
            <em>
              {Icon.eyeOff}
              Only you see these
            </em>
          </div>
        </div>
        <Chart height={426} />

        <div className={t.lower}>
          <div className={t.tabs}>
            <b>
              Positions <i>2</i>
            </b>
            <span>
              Open orders <i>1</i>
            </span>
            <span>Receipts</span>
            <span>Trackers</span>
            <em>
              {Icon.eyeOff}
              Visible to you only
            </em>
          </div>
          <table className={t.table}>
            <thead>
              <tr>
                <th>Market</th>
                <th>Side</th>
                <th>Size</th>
                <th>Entry</th>
                <th>Mark</th>
                <th>Liq. price</th>
                <th>PnL</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[position, hedge].map((p) => (
                <tr key={p.market}>
                  <td>
                    <b>{p.market}</b>
                  </td>
                  <td>
                    <i className={t.side} data-short={p.side === 'Short' ? '' : undefined}>
                      {p.side} {p.leverage}×
                    </i>
                  </td>
                  <td>{p.units}</td>
                  <td>{money(p.entry)}</td>
                  <td>{money(p.mark)}</td>
                  <td>{money(p.liquidation)}</td>
                  <td data-down={p.pnl < 0 ? '' : undefined} className={t.pnl}>
                    {usd(p.pnl).replace('$', p.pnl >= 0 ? '+$' : '$')} <span>{percent(p.roe)}</span>
                  </td>
                  <td>
                    <u>Close</u>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={t.network}>
            <span>What the network holds</span>
            <b>2 commitments</b>
            <Sealed width={74} />
            <Sealed width={48} />
            <Sealed width={92} />
            <em>
              <i>{Icon.check}</i>
              Proof verified
            </em>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------ the ticket, and the last request */}
      <aside className={t.ticket}>
        <div className={t.sides}>
          <b>Long</b>
          <span>Short</span>
        </div>
        <div className={t.types}>
          <b>Limit</b>
          <span>Market</span>
          <em>
            <i />
            Reduce only
          </em>
        </div>
        <label className={t.field}>
          <span>Size</span>
          <div>
            <b>{order.units.toFixed(2)}</b>
            <i>{focus.ticker}</i>
          </div>
        </label>
        <label className={t.field}>
          <span>Limit price</span>
          <div>
            <b>{money(order.limit)}</b>
            <i>USD</i>
          </div>
        </label>
        <div className={t.leverage}>
          <span>Leverage</span>
          <b>{order.leverage}×</b>
          <div>
            <i />
            <u />
          </div>
        </div>
        <dl className={t.sums}>
          <div>
            <dt>Order value</dt>
            <dd>{usd(value)}</dd>
          </div>
          <div>
            <dt>Margin</dt>
            <dd>{usd(value / order.leverage)}</dd>
          </div>
          <div>
            <dt>Free collateral</dt>
            <dd>{usd(account.free)}</dd>
          </div>
        </dl>
        <button className={t.sign} type="button" tabIndex={-1}>
          {Icon.lock}
          Sign sealed order
        </button>
        <p className={t.note}>The network gets a commitment and a proof.</p>

        {/* where another venue shows its book: this one's is sealed. Every price and size a bar */}
        <div className={t.book}>
          <div>
            <span>Order book</span>
            <em>
              {Icon.lock}
              Sealed
            </em>
          </div>
          <ul>
            {[0, 1].map((i) => (
              <li key={`a${i}`} data-ask="">
                <Sealed width={58} />
                <Sealed width={40} />
              </li>
            ))}
            <li data-mid="">
              <b>{money(focus.price)}</b>
              <span>Mark</span>
            </li>
            {[0, 1].map((i) => (
              <li key={`b${i}`}>
                <Sealed width={58} />
                <Sealed width={40} />
              </li>
            ))}
          </ul>
        </div>

        <div className={t.request}>
          <div className={t.requestHead}>
            <span>Last request</span>
            <b>{request.id}</b>
          </div>
          <p>{request.what}</p>
          <ol>
            {request.stages.map((stage, i) => (
              <li key={stage.name} data-done={i < request.done ? '' : undefined} data-now={i === request.done ? '' : undefined}>
                <i>{i < request.done && Icon.check}</i>
                <b>{stage.name}</b>
                <span>{stage.note}</span>
                <em>{stage.at || 'in progress'}</em>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      {/* ------------------------------------------------------------ the line along the foot */}
      <footer className={t.status}>
        <span>
          <i />
          Connected
        </span>
        <span>Hyperwood L3</span>
        <span>Settles to Robinhood Chain</span>
        <em>Equity {usd(account.equity)}</em>
        <em>Collateral {usd(account.collateral)}</em>
      </footer>

      {sheet === 'close' && <CloseSheet />}
    </div>
  )
}
