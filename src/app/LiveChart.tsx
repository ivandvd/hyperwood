/**
 * A market's real price over the last year, drawn by TradingView's own embeddable chart (their "symbol
 * overview" widget) in the page's colours: one Neon line on Ink, hairlines, the price scale and the dates.
 * The data is theirs and live: the page holds none of it. Pointing at the line reads a day's price.
 *
 * Their script is asked for only when a chart is first wanted, and it puts the chart in a frame of its own.
 * The credit under the chart is part of using it: it stays.
 *
 * Give each market its own `key`, so a new market is a new chart.
 */
import { useEffect, useRef, useState } from 'react'
import s from './liveChart.module.css'

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'

/** What the widget is asked for: the look. Colours are written out (the frame cannot read the page's tokens):
 *  Ink #0a0a0a, Hyper Neon #ccff00, Paper #f4f5f0. */
const settings = (symbol: string) => ({
  symbols: [[`${symbol}|12M`]],
  chartOnly: true,
  width: '100%',
  height: '100%',
  autosize: true,
  locale: 'en',
  colorTheme: 'dark',
  isTransparent: true,
  backgroundColor: 'rgba(10, 10, 10, 0)',
  chartType: 'area',
  lineWidth: 2,
  lineType: 0,
  lineColor: 'rgba(204, 255, 0, 1)',
  topColor: 'rgba(204, 255, 0, 0)',
  bottomColor: 'rgba(204, 255, 0, 0)',
  gridLineColor: 'rgba(244, 245, 240, 0.07)',
  fontColor: 'rgba(244, 245, 240, 0.5)',
  widgetFontColor: 'rgba(244, 245, 240, 1)',
  fontFamily: 'IBM Plex Mono, ui-monospace, Menlo, Consolas, monospace',
  fontSize: '10',
  scalePosition: 'right',
  scaleMode: 'Normal',
  noTimeScale: false,
  valuesTracking: '1',
  changeMode: 'price-and-percent',
  showVolume: false,
  showMA: false,
  hideDateRanges: true,
  hideMarketStatus: true,
  hideSymbolLogo: true,
  dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
})

/** How long the chart may take before the page says it is not coming (ms). */
const PATIENCE = 12000

export function LiveChart({ symbol, name }: { symbol: string; name: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'wait' | 'there' | 'none'>('wait')

  useEffect(() => {
    const box = host.current
    if (!box) return
    let shown = 0
    const holder = document.createElement('div')
    holder.className = 'tradingview-widget-container'
    holder.style.cssText = 'width:100%;height:100%'
    const inner = document.createElement('div')
    inner.className = 'tradingview-widget-container__widget'
    inner.style.cssText = 'width:100%;height:100%'
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = SCRIPT
    script.textContent = JSON.stringify(settings(symbol))
    script.onerror = () => setState('none')
    holder.append(inner, script)
    // (asked for a moment later: a chart that is dropped at once never asks, and leaves nothing behind)
    const ask = window.setTimeout(() => box.append(holder), 80)

    // the widget puts a frame in; once the frame has loaded, the line is a moment away
    const arrived = (frame: HTMLIFrameElement) => {
      frame.title = `${name}: price over the last year, by TradingView`
      frame.addEventListener('load', () => (shown = window.setTimeout(() => setState('there'), 450)), { once: true })
    }
    const watch = new MutationObserver(() => {
      const frame = box.querySelector('iframe')
      if (!frame) return
      watch.disconnect()
      arrived(frame)
    })
    watch.observe(box, { childList: true, subtree: true })
    const late = window.setTimeout(() => setState((now) => (now === 'wait' ? 'none' : now)), PATIENCE)
    return () => {
      watch.disconnect()
      window.clearTimeout(ask)
      window.clearTimeout(late)
      window.clearTimeout(shown)
      box.replaceChildren()
    }
  }, [symbol, name])

  return (
    <figure className={s.chart} data-state={state}>
      <div ref={host} className={s.frame} />
      {state === 'none' && <p className={s.none}>The chart could not be loaded.</p>}
      <figcaption className={s.credit}>
        <a href="https://www.tradingview.com/" target="_blank" rel="noopener nofollow">
          {name} chart by TradingView
        </a>
      </figcaption>
    </figure>
  )
}
