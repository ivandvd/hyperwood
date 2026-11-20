/**
 * Questions and answers (&flow=soar), on the light ground before the last screen: the headline in two tones at the
 * left, standing still while the questions go by at the right, each between hairlines. A question opens its answer
 * (and closes the one open before), the answer's room growing with the brand's curve while its words come up; the
 * sign at the right turns from a plus into a minus. The first stands open. Every answer is in the page, open or not.
 * The words: `soar.faq` in content.home.ts.
 */
import { useState } from 'react'
import { home } from '../../content.home'
import s from './soar.module.css'
import f from './faq.module.css'

export function Faq() {
  const F = home.soar.faq
  const [open, setOpen] = useState(0)
  return (
    <section className={`${s.paper} ${f.faq}`} aria-labelledby="faq-title" data-light="">
      <div className={f.inner}>
        <h2 id="faq-title" className={f.title}>
          <span>{F.title[0]}</span> <b>{F.title[1]}</b>
        </h2>
        <div className={f.list}>
          {F.items.map((item, i) => {
            const shown = open === i
            const id = `faq-${i}`
            return (
              <div key={item.q} className={f.item} data-open={shown ? '' : undefined}>
                <h3>
                  <button type="button" aria-expanded={shown} aria-controls={id} id={`${id}-q`} onClick={() => setOpen(shown ? -1 : i)}>
                    <span>{item.q}</span>
                    <i aria-hidden="true" />
                  </button>
                </h3>
                <div id={id} className={f.answer} role="region" aria-labelledby={`${id}-q`}>
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
