/**
 * The app's Markets screen: every market by its ticker on the left, and the one picked on the right with its
 * real price over the last year (LiveChart.tsx). Picking a ticker changes the chart.
 *
 * `live`: whether the chart may be asked for yet (it is fetched from TradingView: not before it is near).
 */
import { useState } from 'react'
import { markets } from './markets'
import { LiveChart } from './LiveChart'
import s from './marketsBoard.module.css'

const groups = [
  { label: 'Stocks', list: markets.filter((m) => m.kind === 'stock') },
  { label: 'Indices', list: markets.filter((m) => m.kind === 'index') },
]

export function MarketsBoard({ live = true }: { live?: boolean }) {
  const [picked, setPicked] = useState(markets[0].ticker)
  const market = markets.find((m) => m.ticker === picked) ?? markets[0]
  return (
    <div className={s.board}>
      <div className={s.index}>
        {groups.map((group) => (
          <div key={group.label} className={s.group} role="group" aria-label={group.label}>
            <p className={s.label}>{group.label}</p>
            <ul>
              {group.list.map((m) => (
                <li key={m.ticker}>
                  <button type="button" aria-pressed={m.ticker === picked} title={m.name} onClick={() => setPicked(m.ticker)}>
                    {m.ticker}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={s.detail}>
        <div className={s.head}>
          <h3>{market.ticker}</h3>
          <p>{market.name}</p>
          <span className={s.label}>{market.kind === 'index' ? 'Equity index' : 'Stock'} · 1 year</span>
        </div>
        <div className={s.chart}>{live && <LiveChart key={market.symbol} symbol={market.symbol} name={market.name} />}</div>
      </div>
    </div>
  )
}
