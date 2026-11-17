/**
 * Shared parts of the sections below the hero: the section head, a block that reveals itself once, notes,
 * tables and code. Styles are in kit.module.css.
 */
import { createElement, useEffect, type CSSProperties, type ReactNode } from 'react'
import { FadeUpLines } from '../ui/FadeUpLines'
import { playTitles } from '../ui/titles'
import { useInView } from './useInView'
import { order } from './util'
import k from './kit.module.css'

/** A block whose `rise` children appear once, when it comes into view. */
export function Block({ className = '', line = 0.14, as = 'div', children, style }: { className?: string; line?: number; as?: 'div' | 'ol' | 'ul' | 'figure'; children: ReactNode; style?: CSSProperties }) {
  const [ref, seen] = useInView<HTMLElement>(line)
  return createElement(as, { ref, className, style, 'data-in': seen ? '' : undefined }, children)
}

/** Number and name, the statement, and the lead paragraph. The statement and the lead rise line by line. */
export function SectionHead({ id, index, label, title, lead }: { id: string; index: string; label: string; title: string; lead: string }) {
  const [ref, seen] = useInView<HTMLElement>(0.16)
  useEffect(() => {
    if (seen) playTitles(id)
  }, [seen, id])
  return (
    <header className={k.head} ref={ref} data-in={seen ? '' : undefined}>
      <p className={`${k.eyebrow} ${k.rise}`}>
        <b>{index}</b>
        <span>{label}</span>
      </p>
      <FadeUpLines as="h2" id={`${id}-title`} className={k.title} group={id} text={title} />
      <FadeUpLines className={k.lead} group={id} delay={0.25} text={lead} />
    </header>
  )
}

/** Short notes side by side, each a title and a paragraph. */
export function Notes({ items, cols = 4, className = '' }: { items: [string, string][]; cols?: number; className?: string }) {
  return (
    <Block className={`${k.notes} ${className}`} style={{ '--cols': cols } as CSSProperties}>
      {items.map(([title, text], i) => (
        <article className={`${k.note} ${k.rise}`} key={title} style={order(i)}>
          <h3 className={k.kicker}>{title}</h3>
          <p className={k.small}>{text}</p>
        </article>
      ))}
    </Block>
  )
}

/** A two-column table, as the paper sets them. */
export function Table({ head, rows, mono = false }: { head?: [string, string]; rows: [string, string][]; mono?: boolean }) {
  const [ref, seen] = useInView<HTMLTableElement>(0.1)
  return (
    <table className={k.table} ref={ref} data-in={seen ? '' : undefined}>
      {head && (
        <thead>
          <tr>
            <th scope="col">{head[0]}</th>
            <th scope="col">{head[1]}</th>
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map(([a, b], i) => (
          <tr key={a}>
            <td>
              <span className={k.rise} style={{ ...order(i), fontFamily: mono ? 'var(--font-mono)' : undefined, fontSize: mono ? '13px' : undefined, letterSpacing: mono ? '0' : undefined }}>
                {a}
              </span>
            </td>
            <td>
              <span className={k.rise} style={order(i)}>
                {b}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A block of code. The name that opens a call or a record is lit. */
export function Code({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure className={k.code}>
      <pre>
        <code>
          {code.split('\n').map((line, i) => {
            const m = /^([A-Za-z]\w*)(\(| \{)/.exec(line)
            return (
              <span key={i}>
                {m ? (
                  <>
                    <b>{m[1]}</b>
                    {line.slice(m[1].length)}
                  </>
                ) : (
                  line
                )}
                {'\n'}
              </span>
            )
          })}
        </code>
      </pre>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
