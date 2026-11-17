/**
 * Section 02: public and confidential.
 * The hero ends on two lines, "The proof is public." on the left and "The position is yours." on the right.
 * This section continues them as two columns: what the network publishes, and what stays with the owner.
 * Content: the architecture paper, "Confidential trading" (the table, private state, order book privacy, limits).
 *
 * The two columns look like what they say. Public rows stand open on hairlines with lit values.
 * Confidential rows are sealed records: each one carries an example value, and a moment after the rows arrive
 * you watch those values turn to cipher. The switch above shows the same order as its owner still reads it.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { content } from '../content'
import { FocusReveal } from '../ui/FocusReveal'
import { FadeUpLines } from '../ui/FadeUpLines'
import { playTitles } from '../ui/titles'
import { Cipher } from './Cipher'
import { reducedMotion, useLights } from './motion'
import { useInView } from './useInView'
import k from './kit.module.css'
import s from './Split.module.css'

const order = (i: number) => ({ '--i': i }) as CSSProperties
const two = (i: number) => String(i + 1).padStart(2, '0')

export function Split() {
  const C = content.split
  const V = C.view
  const [head, headIn] = useInView<HTMLDivElement>(0.16)
  const [rows, rowsIn] = useInView<HTMLUListElement>(0.14)
  const [notes, notesIn] = useInView<HTMLDivElement>(0.14)
  const [limits, limitsIn] = useInView<HTMLDivElement>(0.12)
  const lights = useLights<HTMLElement>(`.${k.lit}`)
  // the order arrives readable and is sealed in front of you, unless motion is reduced or the switch was used
  const [sealed, setSealed] = useState(reducedMotion)
  const touched = useRef(false)

  useEffect(() => {
    if (headIn) playTitles('split')
  }, [headIn])

  useEffect(() => {
    if (!rowsIn || touched.current) return
    const t = window.setTimeout(() => {
      if (!touched.current) setSealed(true)
    }, 2100)
    return () => window.clearTimeout(t)
  }, [rowsIn])

  const view = (next: boolean) => {
    touched.current = true
    setSealed(next)
  }

  return (
    <section className={s.section} id="confidential" aria-labelledby="split-title" ref={lights} data-lights>
      <h2 id="split-title" className={s.srOnly}>
        {C.title}
      </h2>

      <div className={s.top} data-in={headIn ? '' : undefined}>
        <p className={`${k.eyebrow} ${k.rise}`}>
          <b>{C.index}</b>
          <span>{C.label}</span>
        </p>
        <div className={`${s.view} ${k.rise}`} style={order(2)}>
          <span className={`${k.mono} ${s.viewLabel}`}>{V.label}</span>
          <div className={k.seg} role="group" aria-label={V.label}>
            <button type="button" aria-pressed={sealed} onClick={() => view(true)}>
              {V.network}
            </button>
            <button type="button" aria-pressed={!sealed} onClick={() => view(false)}>
              {V.owner}
            </button>
          </div>
        </div>
      </div>

      <div className={s.cols} ref={head} data-rows={rowsIn ? '' : undefined} data-view={sealed ? 'network' : 'owner'}>
        {[C.open, C.sealed].map((col, c) => (
          <div className={`${s.col} ${c === 0 ? s.open : s.sealed}`} key={col.word}>
            <h3 className={s.word}>
              <FocusReveal text={col.word} group="split" delay={c * 0.22} />
            </h3>
            <FadeUpLines className={s.lead} group="split" delay={0.5 + c * 0.22} text={col.lead} />
            <ul className={s.list} ref={c === 0 ? rows : undefined}>
              {col.rows.map(([what, value], i) => (
                <li className={s.row} key={what} style={order(i)}>
                  {c === 0 ? (
                    <>
                      <span className={s.idx}>{two(i)}</span>
                      <span className={s.what}>
                        {what}
                        <span className={s.value}>{value}</span>
                      </span>
                    </>
                  ) : (
                    <span className={`${s.slab} ${k.lit}`}>
                      <span className={s.idx}>{two(i)}</span>
                      <span className={s.what}>
                        {what}
                        <Cipher className={s.value} text={value} sealed={sealed} sealedLabel={V.sealed} delay={i * 0.09} />
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className={`${k.fine} ${s.example}`} data-in={rowsIn ? '' : undefined}>
        {V.note}
      </p>

      <div className={s.notes} ref={notes} data-in={notesIn ? '' : undefined}>
        {C.notes.map(([title, text], i) => (
          <article className={s.note} key={title} style={order(i)}>
            <span className={s.noteNum}>{two(i)}</span>
            <h3 className={s.noteTitle}>{title}</h3>
            <p className={s.noteText}>{text}</p>
          </article>
        ))}
      </div>

      <div className={s.limits} ref={limits} data-in={limitsIn ? '' : undefined}>
        <h3 className={s.limitsTitle}>{C.limits.title}</h3>
        <ul className={s.limitsList}>
          {C.limits.items.map((item, i) => (
            <li key={item} style={order(i)}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
