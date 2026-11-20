/**
 * What the app's screens show (src/product): the markets with their real prices (market.json, read by
 * scripts/product/fetch-market.cjs), and the one account the screens are about.
 *
 * The screens are designed scenes: an account, its position, its order and its request are made up, and follow the
 * papers' own mechanics (a margin, a long opened and marked to the market, proceeds kept as collateral or turned into
 * tracker units at the price). The prices they are worked from are the real ones.
 */
import feed from './market.json'

export interface Market {
  ticker: string
  name: string
  kind: 'stock' | 'index'
  price: number
  /** the close of the session before */
  prev: number
  /** the day's change, per cent */
  change: number
  /** the last five sessions, half hour by half hour */
  spark: number[]
}
/** [time (s), open, high, low, close] */
export type Candle = [number, number, number, number, number]

export const markets = feed.markets as Market[]
export const marketOf = (ticker: string) => markets.find((m) => m.ticker === ticker) ?? markets[0]
export const focus = marketOf(feed.focus)
/** The traded market's last five sessions, quarter hour by quarter hour, and its last six months, day by day. */
export const intraday = feed.intraday as Candle[]
export const daily = feed.daily as Candle[]
/** When the figures were read, and the exchange's offset from UTC then (s). */
export const asOf = new Date(feed.asOf)
export const exchangeOffset = feed.session.gmtoffset

export const money = (v: number, digits = 2) => v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
export const usd = (v: number, digits = 2) => `${v < 0 ? '−' : ''}$${money(Math.abs(v), digits)}`
export const signed = (v: number, digits = 2) => `${v >= 0 ? '+' : '−'}${money(Math.abs(v), digits)}`
export const percent = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}%`

/** The account's open position in the traded market: a long opened at the close of the session before the last. */
const UNITS = 10
const LEVERAGE = 2.5
const entry = focus.prev
const notional = UNITS * entry
const margin = notional / LEVERAGE
const pnl = UNITS * (focus.price - entry)
export const position = {
  market: `${focus.ticker}-PERP`,
  ticker: focus.ticker,
  side: 'Long' as const,
  units: UNITS,
  leverage: LEVERAGE,
  entry,
  mark: focus.price,
  margin,
  pnl,
  /** what the margin has earned, per cent */
  roe: (pnl / margin) * 100,
  /** where the margin would be used up, less a maintenance share of a twentieth */
  liquidation: entry * (1 - (1 / LEVERAGE) * 0.95),
  /** closed now: the margin and what it earned */
  equity: margin + pnl,
  /** that, as tracker units at the price */
  trackerUnits: (margin + pnl) / focus.price,
  commitment: '0x8f3c…e21a',
}

/** A second position, short an index, so the table shows both ways. */
const spx = marketOf('SPX')
export const hedge = {
  market: 'SPX-PERP',
  ticker: 'SPX',
  side: 'Short' as const,
  units: 0.2,
  leverage: 2,
  entry: spx.prev,
  mark: spx.price,
  margin: (0.2 * spx.prev) / 2,
  pnl: 0.2 * (spx.prev - spx.price),
  roe: ((0.2 * (spx.prev - spx.price)) / ((0.2 * spx.prev) / 2)) * 100,
  liquidation: spx.prev * (1 + (1 / 2) * 0.95),
  commitment: '0x41ab…9c0e',
}

/** The order in the ticket: more of the same, a hundredth and a half under the market. */
export const order = {
  side: 'Long' as const,
  units: 5,
  limit: Math.round(focus.price * 0.985 * 10) / 10,
  leverage: LEVERAGE,
}

/** The account. */
export const account = {
  address: '0x7c1e…a94f',
  collateral: 2480,
  equity: 2480 + pnl + hedge.pnl,
  free: 2480 - margin - hedge.margin,
  gas: 0.0421,
}

/** The last request and its four stages, as the papers name them. `at`: the time of day it reached each (the
 *  last is still to come). */
export const request = {
  id: '0x3fa9…c2d1',
  what: `Long ${UNITS} ${focus.ticker}`,
  stages: [
    { name: 'Accepted', note: 'Sequencer', at: '14:32:07' },
    { name: 'Matched', note: 'Sealed engine', at: '14:32:07' },
    { name: 'Proven', note: 'Zero-knowledge proof', at: '14:32:15' },
    { name: 'Settled', note: 'Robinhood Chain', at: '' },
  ],
  done: 3,
}

/** Earlier requests, for the receipts. */
export const receipts = [
  { id: '0x3fa9…c2d1', what: `Long ${UNITS} ${focus.ticker}-PERP`, at: '14:32:07', done: 3 },
  { id: '0x91d4…07be', what: 'Short 0.2 SPX-PERP', at: '13:58:41', done: 4 },
  { id: '0x2c77…f310', what: 'Deposit 1,000.00 USDC', at: '13:51:19', done: 4 },
  { id: '0xa6e0…4b92', what: 'Close 4 TSLA-PERP to tracker', at: '11:07:53', done: 4 },
  { id: '0x5d18…c6a7', what: 'Long 4 TSLA-PERP', at: '09:41:02', done: 4 },
]

/** A line through `values`, as an SVG path in a box `w` by `h`. */
export function sparkPath(values: number[], w: number, h: number, pad = 1.5) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  return values
    .map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * w).toFixed(2)} ${(pad + (1 - (v - lo) / span) * (h - 2 * pad)).toFixed(2)}`)
    .join('')
}
