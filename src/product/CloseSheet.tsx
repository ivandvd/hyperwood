/**
 * The sheet that closes a position and asks how it is paid out: the papers' payout choice. The proceeds stay as
 * collateral, or become units of the stock's tracker at the price (an unlevered long that can be held, or sent out
 * as a public token). It lies over the Trade screen (Terminal.tsx, `sheet="close"`).
 */
import { Icon } from './icons'
import { focus, money, percent, position, usd } from './data'
import s from './closeSheet.module.css'

export function CloseSheet() {
  return (
    <div className={s.veil}>
      <div className={s.sheet}>
        <div className={s.head}>
          <div>
            <b>Close position</b>
            <span>
              {position.market} · {position.side} {position.units} · {position.leverage}×
            </span>
          </div>
          <i>Reduce only</i>
        </div>

        <dl className={s.sums}>
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
            <dd data-up="">
              +{usd(position.pnl)} <span>{percent(position.roe)}</span>
            </dd>
          </div>
        </dl>
        <div className={s.equity}>
          <span>Cleared equity</span>
          <b>{usd(position.equity)}</b>
        </div>

        <p className={s.ask}>Pay out as</p>
        <div className={s.choice}>
          <div className={s.option}>
            <i />
            <div>
              <b>Collateral</b>
              <span>Back to your margin account</span>
            </div>
            <em>{usd(position.equity)}</em>
          </div>
          <div className={s.option} data-on="">
            <i />
            <div>
              <b>{focus.ticker} tracker</b>
              <span>An unlevered long you hold, or send out as a token</span>
            </div>
            <em>
              {position.trackerUnits.toFixed(4)} <small>units</small>
            </em>
          </div>
        </div>

        <button className={s.sign} type="button" tabIndex={-1}>
          {Icon.lock}
          Sign sealed close
        </button>
        <p className={s.note}>
          {position.trackerUnits.toFixed(4)} units at {money(focus.price)}. The close and the payout are one sealed instruction.
        </p>
      </div>
    </div>
  )
}
