/**
 * Who sees what (&flow=soar), on the Ink under how a trade goes: one position, as its owner sees it and as the network
 * does, with a switch between the two views; beside it, the Investor Overview's lists of what is hidden and what is
 * still visible, and the papers' caution under them.
 *
 * In the network's view each hidden value runs into ciphertext and is covered by a bar; what stays visible (the
 * address, the request, when it was sent) is marked in Neon. The card turns to the network's view by itself once,
 * when it is first well on the screen, unless the switch has been touched. The figures are the app's own (data.ts).
 * The words: `soar.who` in content.home.ts.
 */
import { useEffect, useRef, useState } from 'react'
import { home } from '../../content.home'
import { account, money, position, request, signed } from '../../product/data'
import { scramble, settle } from './scramble'
import w from './who.module.css'

/** label, the owner's value, its ciphertext, and whether the network sees it */
const ROWS: [label: string, value: string, sealed: string, seen: boolean][] = [
  ['Market', position.market, '3b8e0f1c', false],
  ['Direction', position.side, 'c41a', false],
  ['Size', String(position.units), '7e', false],
  ['Leverage', `${position.leverage}×`, '0d9f', false],
  ['Collateral', `$${money(position.margin)}`, 'a52c7e1', false],
  ['Entry', money(position.entry), '6f30b2', false],
  ['Profit and loss', `${signed(position.pnl)}`, 'e9017d', false],
  ['Address', account.address, '', true],
  ['Request', request.id, '', true],
  ['Sent', request.stages[0].at, '', true],
]

export function WhoSees() {
  const W = home.soar.who
  const [view, setView] = useState(0)
  const touched = useRef(false)
  const card = useRef<HTMLDivElement>(null)
  const values = useRef<(HTMLElement | null)[]>([])
  // the card turns to the network's view by itself, once
  useEffect(() => {
    const el = card.current
    if (!el) return
    let wait = 0
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        watch.disconnect()
        wait = window.setTimeout(() => {
          if (!touched.current) setView(1)
        }, 1100)
      },
      { threshold: 0.6 },
    )
    watch.observe(el)
    return () => {
      watch.disconnect()
      window.clearTimeout(wait)
    }
  }, [])
  // the hidden values run into ciphertext (and back)
  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    values.current.forEach((el, i) => {
      const [, value, sealed, seen] = ROWS[i]
      if (!el || seen) return
      const to = view ? sealed : value
      if (still) settle(el, to)
      else scramble(el, to, 420)
    })
  }, [view])
  const choose = (i: number) => {
    touched.current = true
    setView(i)
  }
  return (
    <section className={w.who} aria-labelledby="who-title">
      <h2 id="who-title" className={w.title}>
        <span>{W.title[0]}</span> <b>{W.title[1]}</b>
      </h2>
      <div className={w.body}>
        <div ref={card} className={w.card} data-view={view ? 'network' : 'you'}>
          <div className={w.switch} role="group" aria-label="Whose view">
            {W.views.map((label, i) => (
              <button key={label} type="button" aria-pressed={view === i} onClick={() => choose(i)}>
                {label}
              </button>
            ))}
            <i className={w.thumb} aria-hidden="true" />
          </div>
          <p className={w.head}>
            <span>Position</span>
            <span>{view ? 'As the network sees it' : 'As you see it'}</span>
          </p>
          <dl className={w.rows}>
            {ROWS.map(([label, value, , seen], i) => (
              <div key={label} data-seen={seen ? '' : undefined}>
                <dt>{label}</dt>
                <dd>
                  <span
                    ref={(el) => {
                      values.current[i] = el
                    }}
                    aria-hidden={!seen && view === 1 ? true : undefined}
                  >
                    {value}
                  </span>
                  {!seen && <i className={w.bar} aria-hidden="true" />}
                  {!seen && view === 1 && <span className={w.away}>hidden</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={w.lists}>
          {[W.hidden, W.visible].map((group, g) => (
            <div key={group.label} className={w.list} data-kind={g ? 'visible' : 'hidden'}>
              <p>{group.label}</p>
              <ul>
                {group.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className={w.note}>{W.note}</p>
        </div>
      </div>
    </section>
  )
}
