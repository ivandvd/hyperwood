/**
 * The mobile app, as pictures of the product: three of its screens, in the web app's own manner and with its
 * figures (data.ts). A trade (the market, its real candles, the account's position, long or short); a receipt (the
 * request on its way through the papers' four stages, and the receipt only the account's key opens); and a position
 * being closed, with the payout chosen (collateral, or the stock's tracker).
 *
 * Each is drawn at a phone's own size (390 by 844: phoneApp.module.css) and shown in a handset (Handset.tsx).
 * Nothing in them works.
 */
import type { ReactNode } from 'react'
import { Chart } from './Chart'
import { Icon, TabIcon } from './icons'
import { Mark, Sealed } from './parts'
import { focus, money, percent, position, request, signed, usd } from './data'
import p from './phoneApp.module.css'

/** The phone's own line at the top: the time, and its signs. */
const Status = () => (
  <div className={p.status} aria-hidden="true">
    <b>9:41</b>
    <span>
      <i data-kind="cell" />
      <i data-kind="wifi" />
      <i data-kind="battery" />
    </span>
  </div>
)

const TABS = ['Trade', 'Portfolio', 'Markets', 'Receipts']
const Tabs = ({ on }: { on: string }) => (
  <nav className={p.tabs} aria-hidden="true">
    {TABS.map((tab) => (
      <span key={tab} data-on={tab === on ? '' : undefined}>
        <i>{TabIcon[tab][tab === on ? 1 : 0]}</i>
        {tab}
      </span>
    ))}
  </nav>
)

const Screen = ({ children, tab }: { children: ReactNode; tab?: string }) => (
  <div className={p.screen}>
    <Status />
    {children}
    {tab && <Tabs on={tab} />}
    <i className={p.home} aria-hidden="true" />
  </div>
)

export function PhoneTrade() {
  return (
    <Screen tab="Trade">
      <header className={p.head}>
        <Mark className={p.mark} />
        <div className={p.pair}>
          <b>{focus.ticker}-PERP</b>
          {Icon.chevron}
        </div>
        <em>
          {Icon.lock}
          Sealed
        </em>
      </header>
      <div className={p.price}>
        <b>{money(focus.price)}</b>
        <span>
          {signed(focus.price - focus.prev)} ({percent(focus.change)})
        </span>
      </div>
      <div className={p.chart}>
        <Chart width={390} height={348} compact />
      </div>
      <div className={p.frames}>
        <span>5m</span>
        <b>15m</b>
        <span>1h</span>
        <span>4h</span>
        <span>1D</span>
      </div>
      <div className={p.position}>
        <div>
          <span>Your position</span>
          <em>
            {Icon.eyeOff}
            Only you see this
          </em>
        </div>
        <div>
          <b>
            <i>
              {position.side} {position.leverage}×
            </i>
            {position.units} {position.ticker}
          </b>
          <strong>
            +{usd(position.pnl)} <small>{percent(position.roe)}</small>
          </strong>
        </div>
      </div>
      <div className={p.sides}>
        <b>Long</b>
        <span>Short</span>
      </div>
    </Screen>
  )
}

export function PhoneReceipt() {
  return (
    <Screen tab="Receipts">
      <header className={p.head}>
        <Mark className={p.mark} />
        <div className={p.pair}>
          <b>Receipt</b>
        </div>
        <em>{request.id}</em>
      </header>
      <div className={p.sealed}>
        <i>{Icon.lock}</i>
        <b>Order sealed</b>
        <span>
          {request.what}-PERP · {position.leverage}×
        </span>
      </div>
      <ol className={p.stages}>
        {request.stages.map((stage, i) => (
          <li key={stage.name} data-done={i < request.done ? '' : undefined} data-now={i === request.done ? '' : undefined}>
            <i>{i < request.done && Icon.check}</i>
            <div>
              <b>{stage.name}</b>
              <span>{stage.note}</span>
            </div>
            <em>{stage.at || 'in progress'}</em>
          </li>
        ))}
      </ol>
      <div className={p.receipt}>
        <div>
          <span>Encrypted receipt</span>
          <em>
            {Icon.shield}
            Proof verified
          </em>
        </div>
        <p>Only your key opens it. The network holds this:</p>
        <div className={p.bars}>
          <Sealed width={132} />
          <Sealed width={86} />
          <Sealed width={110} />
          <Sealed width={64} />
        </div>
      </div>
    </Screen>
  )
}

export function PhoneClose() {
  return (
    <Screen>
      <header className={p.head}>
        <Mark className={p.mark} />
        <div className={p.pair}>
          <b>Close position</b>
        </div>
        <em>Reduce only</em>
      </header>
      <div className={p.closing}>
        <span>
          {position.market} · {position.side} {position.units} · {position.leverage}×
        </span>
        <dl>
          <div>
            <dt>Entry</dt>
            <dd>{money(position.entry)}</dd>
          </div>
          <div>
            <dt>Mark</dt>
            <dd>{money(position.mark)}</dd>
          </div>
          <div>
            <dt>PnL</dt>
            <dd data-up="">+{usd(position.pnl)}</dd>
          </div>
        </dl>
      </div>
      <div className={p.equity}>
        <span>Cleared equity</span>
        <b>{usd(position.equity)}</b>
      </div>
      <p className={p.ask}>Pay out as</p>
      <div className={p.options}>
        <div>
          <i />
          <div>
            <b>Collateral</b>
            <span>Back to your margin account</span>
          </div>
          <em>{usd(position.equity)}</em>
        </div>
        <div data-on="">
          <i />
          <div>
            <b>{focus.ticker} tracker</b>
            <span>An unlevered long you hold</span>
          </div>
          <em>
            {position.trackerUnits.toFixed(4)}
            <small>units</small>
          </em>
        </div>
      </div>
      <p className={p.hint}>
        {Icon.shield}
        A tracker is an unlevered long on the stock. Hold it here, or send it out later as a public token.
      </p>
      <button className={p.sign} type="button" tabIndex={-1}>
        {Icon.lock}
        Sign sealed close
      </button>
      <p className={p.note}>
        {position.trackerUnits.toFixed(4)} units at {money(focus.price)}. One sealed instruction.
      </p>
    </Screen>
  )
}
