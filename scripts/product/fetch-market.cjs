/**
 * The market figures the app's screens show (src/product): real prices, read once and kept in the repo, so the
 * screens show what the markets really did and nothing has to be fetched by a visitor.
 *
 *   node scripts/product/fetch-market.cjs
 *
 * For every market in the list: the last price, the close before it, and its last five sessions in half hours (the
 * small lines beside a ticker). For the market the screens trade (FOCUS): six months of daily candles, and five
 * sessions in quarter hours. Written to src/product/market.json with the moment it was read.
 *
 * Read from Yahoo Finance's public chart feed. The figures are not a feed of Hyperwood's: the screens are designed
 * scenes, and say so nowhere on the page because nothing on the page is offered as a quote.
 */
const fs = require('node:fs')
const path = require('node:path')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const FOCUS = 'NVDA'
/** ticker shown, name, kind, the feed's own symbol where it differs */
const LIST = [
  ['NVDA', 'NVIDIA', 'stock'], ['AAPL', 'Apple', 'stock'], ['MSFT', 'Microsoft', 'stock'], ['AMZN', 'Amazon', 'stock'],
  ['GOOGL', 'Alphabet', 'stock'], ['META', 'Meta', 'stock'], ['TSLA', 'Tesla', 'stock'], ['AVGO', 'Broadcom', 'stock'],
  ['AMD', 'AMD Inc.', 'stock'], ['PLTR', 'Palantir', 'stock'], ['NFLX', 'Netflix', 'stock'], ['JPM', 'JPMorgan', 'stock'],
  ['LLY', 'Eli Lilly', 'stock'], ['COST', 'Costco', 'stock'], ['ORCL', 'Oracle', 'stock'], ['UBER', 'Uber', 'stock'],
  ['SPX', 'S&P 500', 'index', '^GSPC'], ['NDX', 'Nasdaq 100', 'index', '^NDX'], ['DJI', 'Dow Jones', 'index', '^DJI'], ['RUT', 'Russell 2000', 'index', '^RUT'],
]

const round = (v, d = 2) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d)

async function chart(symbol, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
      if (!res.ok) throw new Error(String(res.status))
      const body = await res.json()
      const r = body.chart && body.chart.result && body.chart.result[0]
      if (!r) throw new Error('empty')
      return r
    } catch (e) {
      if (attempt === 3) throw new Error(`${symbol} ${range}/${interval}: ${e.message}`)
      await new Promise((go) => setTimeout(go, 700 * (attempt + 1)))
    }
  }
}

/** [time (s), open, high, low, close] for every bar that has all four. */
function candles(r) {
  const q = r.indicators.quote[0]
  const out = []
  ;(r.timestamp || []).forEach((t, i) => {
    if ([q.open[i], q.high[i], q.low[i], q.close[i]].some((v) => v == null)) return
    out.push([t, round(q.open[i]), round(q.high[i]), round(q.low[i]), round(q.close[i])])
  })
  return out
}

;(async () => {
  const markets = []
  for (const [ticker, name, kind, feed] of LIST) {
    const r = await chart(feed || ticker, '5d', '30m')
    const closes = candles(r).map((c) => c[4])
    const price = round(r.meta.regularMarketPrice)
    const prev = round(r.meta.previousClose ?? r.meta.chartPreviousClose)
    // (the close before the last session: the feed's own, or the last bar of the session before)
    const days = {}
    candles(r).forEach((c) => { days[new Date((c[0] + r.meta.gmtoffset) * 1000).toISOString().slice(0, 10)] = c[4] })
    const dayCloses = Object.values(days)
    const before = dayCloses.length > 1 ? dayCloses[dayCloses.length - 2] : prev
    markets.push({ ticker, name, kind, price, prev: round(before), change: round(((price - before) / before) * 100), spark: closes })
    process.stdout.write(`${ticker} ${price} (${markets[markets.length - 1].change}%)  `)
    await new Promise((go) => setTimeout(go, 160))
  }
  const day = await chart(FOCUS, '6mo', '1d')
  const quarter = await chart(FOCUS, '5d', '15m')
  const out = {
    asOf: new Date().toISOString(),
    source: 'Yahoo Finance chart feed',
    focus: FOCUS,
    markets,
    daily: candles(day),
    intraday: candles(quarter),
    session: { gmtoffset: day.meta.gmtoffset, timezone: day.meta.timezone, marketTime: day.meta.regularMarketTime },
  }
  const file = path.join(__dirname, '..', '..', 'src', 'product', 'market.json')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(out))
  console.log(`\nwrote ${file}: ${markets.length} markets, ${out.daily.length} daily and ${out.intraday.length} quarter-hour candles of ${FOCUS}`)
})().catch((e) => {
  console.error('\n' + e.message)
  process.exit(1)
})
