/**
 * The markets the app's screens show: well-known stocks and the four large indices, as the client asked (the
 * papers name no market: Stage 1 starts with three to five equity references).
 *
 * `symbol` is what the live chart is asked for (LiveChart.tsx): a stock's own ticker, or for an index the
 * index contract that TradingView's embeddable charts offer (the exchanges' own index symbols are not given
 * to embedded charts).
 *
 * `price` and `change` belong to the app's Trade screen. That screen is a designed scene, not a feed: its
 * prices stand at the levels of mid November 2026, so the scene agrees with the live charts beside it, and
 * the day's changes are the scene's own. Nothing here is a quote.
 */
export interface Market {
  ticker: string
  name: string
  kind: 'stock' | 'index'
  /** The symbol the live chart is asked for. */
  symbol: string
  price: number
  /** The day's change in the Trade scene, in per cent. */
  change: number
}

export const markets: Market[] = [
  { ticker: 'NVDA', name: 'NVIDIA', kind: 'stock', symbol: 'NVDA', price: 156.14, change: 1.84 },
  { ticker: 'AAPL', name: 'Apple', kind: 'stock', symbol: 'AAPL', price: 352.78, change: 0.62 },
  { ticker: 'MSFT', name: 'Microsoft', kind: 'stock', symbol: 'MSFT', price: 517.99, change: -0.38 },
  { ticker: 'AMZN', name: 'Amazon', kind: 'stock', symbol: 'AMZN', price: 257.75, change: 1.12 },
  { ticker: 'GOOGL', name: 'Alphabet', kind: 'stock', symbol: 'GOOGL', price: 283.72, change: 0.47 },
  { ticker: 'META', name: 'Meta Platforms', kind: 'stock', symbol: 'META', price: 626.41, change: -1.21 },
  { ticker: 'TSLA', name: 'Tesla', kind: 'stock', symbol: 'TSLA', price: 379.74, change: 2.96 },
  { ticker: 'AVGO', name: 'Broadcom', kind: 'stock', symbol: 'AVGO', price: 333.4, change: 0.88 },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway', kind: 'stock', symbol: 'BRK.B', price: 592.85, change: 0.14 },
  { ticker: 'LLY', name: 'Eli Lilly', kind: 'stock', symbol: 'LLY', price: 1431.67, change: -0.72 },
  { ticker: 'JPM', name: 'JPMorgan Chase', kind: 'stock', symbol: 'JPM', price: 338.21, change: 0.33 },
  { ticker: 'V', name: 'Visa', kind: 'stock', symbol: 'V', price: 426.46, change: -0.19 },
  { ticker: 'WMT', name: 'Walmart', kind: 'stock', symbol: 'WMT', price: 128.41, change: 0.41 },
  { ticker: 'XOM', name: 'Exxon Mobil', kind: 'stock', symbol: 'XOM', price: 166.87, change: -0.56 },
  { ticker: 'MA', name: 'Mastercard', kind: 'stock', symbol: 'MA', price: 661.71, change: 0.27 },
  { ticker: 'NFLX', name: 'Netflix', kind: 'stock', symbol: 'NFLX', price: 60.75, change: 1.36 },
  { ticker: 'COST', name: 'Costco', kind: 'stock', symbol: 'COST', price: 1113.74, change: -0.11 },
  { ticker: 'ORCL', name: 'Oracle', kind: 'stock', symbol: 'ORCL', price: 119.09, change: 1.58 },
  { ticker: 'AMD', name: 'Advanced Micro Devices', kind: 'stock', symbol: 'AMD', price: 504.28, change: 2.21 },
  { ticker: 'PLTR', name: 'Palantir', kind: 'stock', symbol: 'PLTR', price: 160.39, change: -1.64 },
  { ticker: 'CRM', name: 'Salesforce', kind: 'stock', symbol: 'CRM', price: 214.83, change: 0.09 },
  { ticker: 'KO', name: 'Coca-Cola', kind: 'stock', symbol: 'KO', price: 99.48, change: 0.22 },
  { ticker: 'DIS', name: 'Walt Disney', kind: 'stock', symbol: 'DIS', price: 118.7, change: -0.44 },
  { ticker: 'INTC', name: 'Intel', kind: 'stock', symbol: 'INTC', price: 55.47, change: 0.95 },
  { ticker: 'UNH', name: 'UnitedHealth', kind: 'stock', symbol: 'UNH', price: 412.02, change: -0.83 },
  { ticker: 'HD', name: 'Home Depot', kind: 'stock', symbol: 'HD', price: 347.51, change: 0.36 },
  { ticker: 'BAC', name: 'Bank of America', kind: 'stock', symbol: 'BAC', price: 50.08, change: 0.58 },
  { ticker: 'ADBE', name: 'Adobe', kind: 'stock', symbol: 'ADBE', price: 246.0, change: -0.27 },
  { ticker: 'UBER', name: 'Uber', kind: 'stock', symbol: 'UBER', price: 69.99, change: 1.42 },
  { ticker: 'GS', name: 'Goldman Sachs', kind: 'stock', symbol: 'GS', price: 891.54, change: 0.64 },
  { ticker: 'IBM', name: 'IBM', kind: 'stock', symbol: 'IBM', price: 242.51, change: 0.52 },
  { ticker: 'PEP', name: 'PepsiCo', kind: 'stock', symbol: 'PEP', price: 146.43, change: -0.31 },
  { ticker: 'SPX', name: 'S&P 500', kind: 'index', symbol: 'FOREXCOM:SPXUSD', price: 7408.7, change: 0.41 },
  { ticker: 'NDX', name: 'Nasdaq 100', kind: 'index', symbol: 'FOREXCOM:NSXUSD', price: 27286.0, change: 0.73 },
  { ticker: 'DJI', name: 'Dow Jones', kind: 'index', symbol: 'FOREXCOM:DJI', price: 51177.2, change: 0.18 },
  { ticker: 'RUT', name: 'Russell 2000', kind: 'index', symbol: 'FOREXCOM:US2000', price: 2733.1, change: -0.35 },
]

/** A market by its ticker. */
export const marketOf = (ticker: string) => markets.find((m) => m.ticker === ticker)!

/** A figure as a price: thousands separated, two decimals. */
export const money = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** The day's change with its sign. */
export const percent = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}%`

/**
 * The Trade scene's price line for a market: the same line every time for the same ticker (seeded by its
 * letters), ending on the market's price and having risen or fallen by its change.
 */
export function series(market: Market, points = 72): number[] {
  let seed = 2166136261
  for (const letter of market.ticker) seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619)
  const random = () => {
    seed += 0x6d2b79f5
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const walk = [0]
  for (let i = 1; i < points; i++) walk.push(walk[i - 1] + (random() - 0.5))
  const start = market.price / (1 + market.change / 100)
  const reach = Math.max(...walk) - Math.min(...walk) || 1
  // (the day's wander: about one and a half hundredths of the price)
  const size = (market.price * 0.015) / reach
  const last = walk[points - 1]
  return walk.map((step, i) => {
    const along = i / (points - 1)
    return start + (market.price - start) * along + (step - last * along) * size
  })
}
