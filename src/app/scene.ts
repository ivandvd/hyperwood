/**
 * The account in the app's designed scene: what it holds, and the first position closed at its mark. The web
 * app's window (AppPreview.tsx) and the phone (Phone.tsx) show the same account, so the figures are here once.
 * They follow the Trader Guide's own arithmetic: margin at five times leverage, cleared equity as margin plus
 * PnL, tracker units as equity over the mark.
 */
import { marketOf } from './markets'

/** The market, the side, how many units and the entry price. */
export const book = [
  { ticker: 'NVDA', side: 'Long', size: 12, entry: 151.2 },
  { ticker: 'SPX', side: 'Short', size: 0.2, entry: 7440 },
] as const

/** The first position, closed at its mark: what the payout sheet shows. */
export const closed = (() => {
  const p = book[0]
  const mark = marketOf(p.ticker).price
  const pnl = (mark - p.entry) * p.size
  return { ...p, mark, pnl, equity: (p.entry * p.size) / 5 + pnl }
})()
