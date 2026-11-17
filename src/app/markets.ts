/**
 * The markets the app previews show. They are well-known tickers used as examples, as the client asked: the
 * papers name no market (Stage 1 starts with three to five equity references). Prices and changes are sample
 * figures for the previews, not quotes. There are 36, so the wall of markets fills every row at 6, 4 and 3 a row.
 */
export interface Market {
  ticker: string
  name: string
  kind: 'stock' | 'index'
  price: number
  /** The day's change, in per cent. */
  change: number
}

export const markets: Market[] = [
  { ticker: 'NVDA', name: 'NVIDIA', kind: 'stock', price: 184.2, change: 1.84 },
  { ticker: 'AAPL', name: 'Apple', kind: 'stock', price: 262.4, change: 0.62 },
  { ticker: 'MSFT', name: 'Microsoft', kind: 'stock', price: 512.75, change: -0.38 },
  { ticker: 'AMZN', name: 'Amazon', kind: 'stock', price: 228.1, change: 1.12 },
  { ticker: 'GOOGL', name: 'Alphabet', kind: 'stock', price: 247.3, change: 0.47 },
  { ticker: 'META', name: 'Meta Platforms', kind: 'stock', price: 712.6, change: -1.21 },
  { ticker: 'TSLA', name: 'Tesla', kind: 'stock', price: 438.9, change: 2.96 },
  { ticker: 'AVGO', name: 'Broadcom', kind: 'stock', price: 356.2, change: 0.88 },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway', kind: 'stock', price: 498.4, change: 0.14 },
  { ticker: 'LLY', name: 'Eli Lilly', kind: 'stock', price: 842.1, change: -0.72 },
  { ticker: 'JPM', name: 'JPMorgan Chase', kind: 'stock', price: 301.55, change: 0.33 },
  { ticker: 'V', name: 'Visa', kind: 'stock', price: 348.2, change: -0.19 },
  { ticker: 'WMT', name: 'Walmart', kind: 'stock', price: 104.35, change: 0.41 },
  { ticker: 'XOM', name: 'Exxon Mobil', kind: 'stock', price: 117.8, change: -0.56 },
  { ticker: 'MA', name: 'Mastercard', kind: 'stock', price: 571.9, change: 0.27 },
  { ticker: 'NFLX', name: 'Netflix', kind: 'stock', price: 1184.0, change: 1.36 },
  { ticker: 'COST', name: 'Costco', kind: 'stock', price: 921.4, change: -0.11 },
  { ticker: 'ORCL', name: 'Oracle', kind: 'stock', price: 286.7, change: 1.58 },
  { ticker: 'AMD', name: 'Advanced Micro Devices', kind: 'stock', price: 232.15, change: 2.21 },
  { ticker: 'PLTR', name: 'Palantir', kind: 'stock', price: 176.4, change: -1.64 },
  { ticker: 'CRM', name: 'Salesforce', kind: 'stock', price: 262.9, change: 0.09 },
  { ticker: 'KO', name: 'Coca-Cola', kind: 'stock', price: 68.45, change: 0.22 },
  { ticker: 'DIS', name: 'Walt Disney', kind: 'stock', price: 111.2, change: -0.44 },
  { ticker: 'INTC', name: 'Intel', kind: 'stock', price: 36.8, change: 0.95 },
  { ticker: 'UNH', name: 'UnitedHealth', kind: 'stock', price: 362.4, change: -0.83 },
  { ticker: 'HD', name: 'Home Depot', kind: 'stock', price: 388.15, change: 0.36 },
  { ticker: 'BAC', name: 'Bank of America', kind: 'stock', price: 52.3, change: 0.58 },
  { ticker: 'ADBE', name: 'Adobe', kind: 'stock', price: 341.6, change: -0.27 },
  { ticker: 'UBER', name: 'Uber', kind: 'stock', price: 96.75, change: 1.42 },
  { ticker: 'GS', name: 'Goldman Sachs', kind: 'stock', price: 782.9, change: 0.64 },
  { ticker: 'IBM', name: 'IBM', kind: 'stock', price: 304.2, change: 0.52 },
  { ticker: 'PEP', name: 'PepsiCo', kind: 'stock', price: 148.65, change: -0.31 },
  { ticker: 'SPX', name: 'S&P 500', kind: 'index', price: 6842.5, change: 0.41 },
  { ticker: 'NDX', name: 'Nasdaq 100', kind: 'index', price: 25310.8, change: 0.73 },
  { ticker: 'DJI', name: 'Dow Jones', kind: 'index', price: 47215.3, change: 0.18 },
  { ticker: 'RUT', name: 'Russell 2000', kind: 'index', price: 2478.6, change: -0.35 },
]

/** A figure as a price: thousands separated, two decimals. */
export const money = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** The day's change with its sign. */
export const percent = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}%`

/**
 * A day's price line for a market: the same line every time for the same ticker (seeded by its letters),
 * ending on the market's price and having risen or fallen by its change.
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
