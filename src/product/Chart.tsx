/**
 * The traded market's chart: its real candles of the last five sessions, quarter hour by quarter hour (data.ts), with
 * each session set a little apart and dated, and over them what only the account sees: where it entered, and where
 * its order waits.
 *
 * Drawn as one SVG, in the box it is given (`width` by `height`, the app's own pixels).
 */
import { exchangeOffset, focus, intraday, money, order, position } from './data'
import c from './chart.module.css'

const AXIS = 58
const FOOT = 24
const TOP = 14

/** Round steps for the price lines: about `count` of them between `lo` and `hi`. */
function steps(lo: number, hi: number, count: number) {
  const raw = (hi - lo) / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(Math.round(v * 100) / 100)
  return out
}

const dayOf = (time: number) => new Date((time + exchangeOffset) * 1000).toISOString().slice(0, 10)
const dateOf = (time: number) => new Date((time + exchangeOffset) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export function Chart({ width = 732, height = 400, compact = false }: { width?: number; height?: number; compact?: boolean }) {
  const axis = compact ? 54 : AXIS
  const plotW = width - axis
  const plotH = height - FOOT - TOP
  // the sessions: a gap of two candles' room between two of them
  const sessions: number[][] = []
  intraday.forEach((candle, i) => {
    if (!i || dayOf(candle[0]) !== dayOf(intraday[i - 1][0])) sessions.push([])
    sessions[sessions.length - 1].push(i)
  })
  const GAP = 1.6
  const slots = intraday.length + (sessions.length - 1) * GAP
  const step = (plotW - 10) / slots
  const xs: number[] = []
  sessions.forEach((session, s) => session.forEach((i) => (xs[i] = 5 + (i + s * GAP + 0.5) * step)))

  const lows = intraday.map((k) => k[3])
  const highs = intraday.map((k) => k[2])
  const lo0 = Math.min(...lows, position.entry)
  const hi0 = Math.max(...highs)
  const pad = (hi0 - lo0) * 0.09
  const lo = lo0 - pad
  const hi = hi0 + pad
  const y = (v: number) => TOP + (1 - (v - lo) / (hi - lo)) * plotH
  const body = Math.max(1.6, step * 0.62)
  const last = intraday[intraday.length - 1]

  return (
    <svg className={c.chart} viewBox={`0 0 ${width} ${height}`} width={width} height={height} data-compact={compact ? '' : undefined} role="img" aria-label={`${focus.ticker}: the last five sessions`}>
      {/* the price lines */}
      {steps(lo, hi, compact ? 4 : 5).map((v) => (
        <g key={v}>
          <line className={c.grid} x1="0" x2={plotW} y1={y(v)} y2={y(v)} />
          <text className={c.tick} x={plotW + (compact ? 7 : 10)} y={y(v) + 3.5}>
            {money(v)}
          </text>
        </g>
      ))}
      {/* the sessions, each dated */}
      {sessions.map((session, s) => {
        const from = xs[session[0]] - step / 2
        return (
          <g key={s}>
            {s > 0 && <line className={c.session} x1={from - (GAP * step) / 2} x2={from - (GAP * step) / 2} y1={TOP - 6} y2={height - FOOT} />}
            <text className={c.date} x={from + 2} y={height - 7}>
              {dateOf(intraday[session[0]][0])}
            </text>
          </g>
        )
      })}
      {/* the candles */}
      {intraday.map(([time, open, high, low, close], i) => {
        const down = close < open
        const top = y(Math.max(open, close))
        const tall = Math.max(1, Math.abs(y(open) - y(close)))
        return (
          <g key={time} className={down ? c.down : c.up}>
            <line x1={xs[i]} x2={xs[i]} y1={y(high)} y2={y(low)} />
            <rect x={xs[i] - body / 2} y={top} width={body} height={tall} rx="0.6" />
          </g>
        )
      })}
      {/* where the account entered, and where its order waits (a tag is as wide as its words: the mono face's
          letters are 0.6 of its size wide) */}
      {(() => {
        const entry = compact ? `Entry ${money(position.entry)}` : `Long ${position.units} · entry ${money(position.entry)}`
        const waits = compact ? `Buy ${money(order.limit)}` : `Buy ${order.units} · limit ${money(order.limit)}`
        const wide = (words: string) => Math.ceil(words.length * 6.32) + 16
        const second = 8 + wide(entry) + 10
        return (
          <>
            <g className={c.entry}>
              <line x1="0" x2={plotW} y1={y(position.entry)} y2={y(position.entry)} />
              <rect x="8" y={y(position.entry) - 10} width={wide(entry)} height="20" rx="4" />
              <text x="16" y={y(position.entry) + 3.6}>
                {entry}
              </text>
            </g>
            <g className={c.order}>
              <line x1="0" x2={plotW} y1={y(order.limit)} y2={y(order.limit)} />
              <rect x={second} y={y(order.limit) - 10} width={wide(waits)} height="20" rx="4" />
              <text x={second + 8} y={y(order.limit) + 3.6}>
                {waits}
              </text>
            </g>
          </>
        )
      })()}
      {/* the last price */}
      <g className={c.last}>
        <line x1="0" x2={plotW} y1={y(last[4])} y2={y(last[4])} />
        <rect x={plotW + 4} y={y(last[4]) - 9.5} width={axis - 6} height="19" rx="3" />
        <text x={plotW + (compact ? 7 : 10)} y={y(last[4]) + 3.6}>
          {money(focus.price)}
        </text>
      </g>
    </svg>
  )
}
