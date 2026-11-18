/**
 * A market's live quote on its card: the ticker, the last price and the day's change, drawn by TradingView's
 * own embeddable widget ("tickers", one symbol, no company logo). The figures are theirs and real: the page
 * holds none of them. Until the widget is there, and if it never comes, the card says the ticker and the
 * market's name and no figure.
 *
 * The widget stands in a frame of its own, in their type and their red and green. It is not a link here (the
 * whole card is one, to the markets): their credit is said beside the film (FilmHero.tsx).
 */
import { useEffect, useRef, useState } from 'react'
import s from './filmHero.module.css'

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-tickers.js'

export function Quote({ symbol, ticker, name }: { symbol: string; ticker: string; name: string }) {
  const host = useRef<HTMLSpanElement>(null)
  const [there, setThere] = useState(false)

  useEffect(() => {
    const box = host.current
    if (!box) return
    let shown = 0
    const holder = document.createElement('div')
    holder.className = 'tradingview-widget-container'
    const inner = document.createElement('div')
    inner.className = 'tradingview-widget-container__widget'
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = SCRIPT
    script.textContent = JSON.stringify({
      symbols: [{ proName: symbol, title: ticker }],
      isTransparent: true,
      showSymbolLogo: false,
      colorTheme: 'light',
      locale: 'en',
    })
    holder.append(inner, script)
    // (asked for a moment later: a card that is dropped at once never asks, and leaves nothing behind)
    const ask = window.setTimeout(() => box.append(holder), 80)
    const watch = new MutationObserver(() => {
      const frame = box.querySelector('iframe')
      if (!frame) return
      watch.disconnect()
      frame.title = `${name}: last price and change, by TradingView`
      frame.tabIndex = -1
      frame.addEventListener('load', () => (shown = window.setTimeout(() => setThere(true), 600)), { once: true })
    })
    watch.observe(box, { childList: true, subtree: true })
    return () => {
      watch.disconnect()
      window.clearTimeout(ask)
      window.clearTimeout(shown)
      box.replaceChildren()
    }
  }, [symbol, ticker, name])

  return (
    <>
      <span className={s.plain} data-gone={there ? '' : undefined}>
        <span className={s.ticker}>{ticker}</span>
        <span className={s.name}>{name}</span>
      </span>
      <span ref={host} className={s.quote} data-there={there ? '' : undefined} aria-hidden="true" />
    </>
  )
}
