/**
 * Why no one can trade ahead of an order here (&ground=ink, After.tsx), as the Investor Overview argues it: on most
 * venues an order can be read before it fills, by bots watching a public queue or by a market maker with a privileged
 * agreement; here it is sealed before it leaves the device. No firm is named: the point is structural, as the paper
 * itself says.
 *
 * One card, as the foot's (foot/LiquidFoot.tsx), with the same liquid in it (liquid/FlowLiquid.tsx): here a stream,
 * and in it the claim, sealed: a capsule of the page's Ink that the stream runs past and cannot come into, parting at
 * its nose and closing behind it. The capsule is an element of the page (its edge is the page's own, and its words are
 * words); the liquid is told where it is. Under the card, the reason in a paragraph.
 *
 * The words: `soar.ahead` in content.home.ts. Where everything stands: ahead.module.css.
 */
import { useRef } from 'react'
import { home } from '../../content.home'
import { useRise } from '../rise'
import { FlowLiquid } from './liquid/FlowLiquid'
import s from './ahead.module.css'

const A = home.soar.ahead

export function Ahead() {
  // (the card, its words and the paragraph rise into place as the scroll brings them in: rise.ts)
  const riseIn = useRise<HTMLElement>()
  const seal = useRef<HTMLDivElement>(null)
  return (
    <section ref={riseIn} className={s.ahead} aria-labelledby="ahead-title">
      <div className={s.card} data-rise="">
        <FlowLiquid className={s.liquid} seal={seal} />
        <div ref={seal} className={s.seal}>
          <h2 id="ahead-title" className={s.title}>
            <span className={s.claim} data-rise="">
              {A.title[0]}
            </span>{' '}
            <span className={s.who} data-rise="">
              {A.title[1]}
            </span>
          </h2>
        </div>
      </div>
      <p className={s.body} data-rise="">
        {A.body}
      </p>
    </section>
  )
}
