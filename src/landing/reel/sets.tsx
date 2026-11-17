/**
 * The sets of the app's short films (Reel.tsx plays them, films.ts says how): parts of the Hyperwood app laid
 * out large on a flat screen, for a camera to move over. They show the same designed scene as the app's
 * window and the phone (app/scene.ts, app/markets.ts). Whatever a film changes carries a `data-part` name.
 *
 * Each set is drawn twice by its reel (sharp and soft), so nothing here has an id.
 */
import { Phone, CloseScreen, TradeScreen } from '../../app/Phone'
import { marketOf, money } from '../../app/markets'
import { book, closed } from '../../app/scene'
import s from './reel.module.css'

/** The pointer: an arrow, drawn here so it looks the same on every system. */
function Cursor() {
  return (
    <span className={s.cursor} data-part="cursor">
      <svg viewBox="0 0 22 30" aria-hidden="true">
        <path d="M3 2.5v21l5.6-5 3.7 8.6 3.4-1.5-3.7-8.4h7.6z" fill="#f4f5f0" stroke="#0a0a0a" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** The order: the ticket, and under it what comes back once the order is signed. */
export function OrderSet() {
  return (
    <>
      {/* (far behind: the market's line and its list, never in focus) */}
      <div className={s.ghost} style={{ left: 30, top: 70, width: 360, height: 250 }}>
        <svg viewBox="0 0 360 250" preserveAspectRatio="none">
          <path d="M0 206 30 190 58 198 92 150 124 162 150 120 186 132 214 92 246 104 280 58 312 70 360 26" />
        </svg>
      </div>
      <div className={s.ghost} style={{ left: 30, top: 360, width: 330 }}>
        {[86, 64, 78, 52, 70, 60].map((w, i) => (
          <i key={i} data-neon={i === 1 ? '' : undefined} style={{ width: `${w}%` }} />
        ))}
      </div>

      <div className={`${s.panel} ${s.ticket}`}>
        <div className={s.chips}>
          <span>Cross</span>
          <span>5×</span>
          <span>Private</span>
        </div>
        <p className={s.tabs}>
          <span data-on="">Market</span>
          <span>Limit</span>
        </p>
        <p className={s.row}>
          Size
          <small>
            Available<b>12,480.00</b>
          </small>
        </p>
        <p className={s.field}>
          <b data-part="size">0.00</b>
          <span>NVDA</span>
        </p>
        <div className={s.slider} data-part="slider">
          {[0, 25, 50, 75, 100].map((at) => (
            <em key={at} style={{ left: `${at}%` }} />
          ))}
          <i className={s.fill} />
          <u className={s.knob} />
        </div>
        <div className={s.sides}>
          <span data-part="long" data-long="" data-on="">
            Long
          </span>
          <span data-part="short">Short</span>
        </div>
        <span className={s.sign} data-part="sign">
          Sign sealed order
        </span>
      </div>

      <div className={`${s.panel} ${s.toast}`} data-part="toast">
        <i className={s.tick} />
        <b>Order sealed</b>
        <span data-part="what">NVDA-PERP · Long · 10 units</span>
        <ol className={s.stages}>
          <li data-on="">Sealed</li>
          <li data-part="accepted">Accepted</li>
          <li data-part="matched">Matched</li>
          <li data-part="proven">Proven</li>
        </ol>
      </div>
      <Cursor />
    </>
  )
}

/** The account's positions as rows, with one more beside the two of the scene. */
const rows = [
  ...book.map((p) => {
    const mark = marketOf(p.ticker).price
    const pnl = (mark - p.entry) * p.size * (p.side === 'Long' ? 1 : -1)
    return [`${p.ticker}-PERP`, p.side, String(p.size), money(p.entry), `+$${money(pnl)}`]
  }),
  ['TSLA-PERP', 'Long', '3', '371.10', '+$25.92'],
]
const heads = ['Market', 'Side', 'Size', 'Entry', 'PnL']

/** The positions, and what the network has of them. */
export function SealedSet() {
  return (
    <>
      <div className={`${s.panel} ${s.book}`}>
        <p className={s.tabs}>
          <span data-on="">Positions</span>
          <span>Orders</span>
          <span>Receipts</span>
        </p>
        <div className={s.table}>
          {heads.map((head) => (
            <span key={head} data-head="">
              {head}
            </span>
          ))}
          {rows.map((row, r) =>
            row.map((value, c) => (
              <span key={`${r}-${c}`} data-last={r === rows.length - 1 ? '' : undefined}>
                <span className={s.cell} data-part={`cell-${r * 5 + c}`}>
                  <b data-neon={c === 4 || value === 'Long' ? '' : undefined}>{value}</b>
                  <i />
                </span>
              </span>
            )),
          )}
        </div>
      </div>

      <div className={`${s.panel} ${s.sees}`}>
        <p className={s.label}>What reaches the network</p>
        <p>
          Commitment <code data-part="commitment">0x7c1e…a94f</code>
        </p>
        <p>
          State root <code data-part="root">0x8f2c…41ab</code>
        </p>
        <p className={s.proof} data-part="proof">
          <i />
          Proof verified
        </p>
      </div>
    </>
  )
}

/** Closing a position: what it made, and the two places its proceeds can go. */
export function PayoutSet() {
  return (
    <>
      <div className={`${s.panel} ${s.sheet}`}>
        <p className={s.sheetHead}>
          <b>Close position</b>
          <span>
            {closed.ticker}-PERP · {closed.side} · {closed.size} units
          </span>
        </p>
        <p className={s.sheetRow}>
          <span>Entry to mark</span>
          <b>
            {money(closed.entry)} to {money(closed.mark)}
          </b>
        </p>
        <p className={s.sheetRow}>
          <span>Realized PnL</span>
          <b data-neon="" data-part="pnl">
            +$0.00
          </b>
        </p>
        <p className={s.sheetSum}>
          <span>Available equity</span>
          <strong data-part="equity">$0.00</strong>
        </p>
      </div>

      <div className={s.options}>
        <div className={s.option} data-part="keep">
          <b>Keep collateral</b>
          <span>${money(closed.equity)} to your balance</span>
        </div>
        <div className={s.option} data-part="convert">
          <b>Convert to {closed.ticker} tracker</b>
          <span>
            <em data-part="units" style={{ fontStyle: 'normal' }}>
              0.00
            </em>{' '}
            units at {money(closed.mark)}
          </span>
        </div>
        <span className={s.confirm} data-part="confirm">
          Confirm payout
        </span>
      </div>
      <Cursor />
    </>
  )
}

/** The mobile app: its two screens, as two phones lying side by side. */
export function PhonesSet({ labels }: { labels: readonly string[] }) {
  return (
    <div className={s.phones}>
      <Phone label={labels[0]}>
        <TradeScreen />
      </Phone>
      <Phone label={labels[1]}>
        <CloseScreen />
      </Phone>
    </div>
  )
}
