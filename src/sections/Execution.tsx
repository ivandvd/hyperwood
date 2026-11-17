/**
 * Section 06: how an order executes (architecture paper, "TradingCore execution boundary", "Calls and
 * permissions", "Private state", "Sequencer batch execution" and "Position lifecycle").
 * Five pages of the paper, so five tabs: nothing is left out, and only one figure is on screen at a time.
 * The two six-step figures are drawn as the paper draws them, as a path that turns back on itself, and a light
 * walks the path one step at a time.
 * The section stands on Paper, the kit's surface for reading. Every figure is an Ink instrument set into it.
 */
import { useEffect, useRef, useState } from 'react'
import { sections } from '../content.sections'
import { Block, Code, SectionHead, Table } from './parts'
import { order, two } from './util'
import { useLights } from './motion'
import { useVisible } from './useInView'
import k from './kit.module.css'
import s from './Execution.module.css'

const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Six steps on a path that goes right, turns down, and comes back: the shape of the paper's figures. */
function Path({ nodes, links = [] }: { nodes: [string, string][]; links?: string[] }) {
  const [ref, visible] = useVisible<HTMLOListElement>()
  const [at, setAt] = useState(0)
  const held = useRef(false)

  useEffect(() => {
    if (!visible || reduced) return
    const id = window.setInterval(() => {
      if (!held.current) setAt((v) => (v + 1) % nodes.length)
    }, 1500)
    return () => window.clearInterval(id)
  }, [visible, nodes.length])

  return (
    <ol className={`${k.device} ${k.ink} ${s.path}`} ref={ref}>
      {nodes.map(([title, text], i) => (
        <li
          key={title}
          className={`${s.cell} ${k.lit}`}
          data-on={i === at ? '' : undefined}
          data-done={i < at ? '' : undefined}
          onMouseEnter={() => {
            held.current = true
            setAt(i)
          }}
          onMouseLeave={() => {
            held.current = false
          }}
        >
          <span className={s.cellNum}>{two(i)}</span>
          <strong>{title}</strong>
          <p>{text}</p>
          {links[i] && <span className={s.cellLink}>{links[i]}</span>}
        </li>
      ))}
    </ol>
  )
}

function Claims({ items }: { items: string[] }) {
  return (
    <ul className={k.claims}>
      {items.map((item, i) => (
        <li className={k.rise} key={item} style={order(i)}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Lines({ items }: { items: string[] }) {
  return (
    <ul className={k.list}>
      {items.map((item, i) => (
        <li className={`${k.small} ${k.rise}`} key={item} style={order(i)}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export function Execution() {
  const C = sections.execution
  const [tab, setTab] = useState(0)
  const lights = useLights<HTMLElement>(`.${k.lit}`)

  const panels = [
    // the boundary: who may do what
    <>
      <Path nodes={C.boundary.nodes} links={C.boundary.links} />
      <Block className={`${k.two} ${k.gapS}`}>
        <Claims items={C.boundary.claims} />
        <div className={s.pairs}>
          {C.boundary.notes.map(([title, text], i) => (
            <article className={k.rise} key={title} style={order(i + 1)}>
              <h3 className={k.kicker}>{title}</h3>
              <p className={k.small}>{text}</p>
            </article>
          ))}
        </div>
      </Block>
    </>,
    // the calls
    <>
      <Block className={k.two}>
        <div className={k.rise}>
          <Code code={C.calls.code} caption={C.calls.caption} />
          <div className={s.under}>
            <Lines items={C.calls.notes} />
          </div>
        </div>
        <Table head={C.calls.head} rows={C.calls.rows} mono />
      </Block>
    </>,
    // the batch
    <>
      <Path nodes={C.batch.nodes} />
      <Block className={`${k.two} ${k.gapS}`}>
        <div>
          <Claims items={C.batch.claims} />
          <div className={s.under}>
            <Lines items={C.batch.notes} />
          </div>
        </div>
        <div className={k.rise} style={order(1)}>
          <Code code={C.batch.code} caption={C.batch.caption} />
        </div>
      </Block>
    </>,
    // private state
    <>
      <Block className={k.two}>
        <div className={`${k.device} ${k.ink} ${s.tree} ${k.rise}`}>
          <div className={s.root}>
            <strong>{C.state.root[0]}</strong>
            <p>{C.state.root[1]}</p>
          </div>
          <ul className={s.leaves}>
            {C.state.trees.map(([title, text]) => (
              <li key={title}>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <Claims items={C.state.claims} />
      </Block>
      <Block className={`${k.two} ${k.gapS}`}>
        <Table head={C.state.head} rows={C.state.rows} />
        <div className={k.rise} style={order(1)}>
          <Code code={C.state.code} caption={C.state.caption} />
        </div>
      </Block>
    </>,
    // the position lifecycle
    <>
      <Block>
        <p className={`${k.text} ${k.rise} ${s.lifeLead}`}>{C.lifecycle.lead}</p>
        <div className={`${k.device} ${k.ink} ${s.life} ${k.rise}`} style={order(1)}>
          <ol className={s.chain}>
            {C.lifecycle.flow.map(([title, text], i) => (
              <li className={k.lit} key={title} data-last={i === C.lifecycle.flow.length - 1 ? '' : undefined}>
                <span className={s.chainLink}>{i > 0 ? C.lifecycle.links[i - 1] : ''}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <ul className={s.branches}>
            {C.lifecycle.branches.map(([title, text]) => (
              <li key={title}>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Block>
      <Block className={`${k.two} ${k.gapS}`}>
        <Table head={C.lifecycle.head} rows={C.lifecycle.rows} />
        <Claims items={C.lifecycle.notes} />
      </Block>
    </>,
  ]

  return (
    <section className={k.section} id="execution" aria-labelledby="execution-title" ref={lights} data-lights>
      <SectionHead id="execution" index={C.index} label={C.label} title={C.title} lead={C.lead} />

      <Block>
        <div className={`${s.tabs} ${k.rise}`} role="tablist" aria-label={C.label}>
          {C.tabs.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              id={`exec-tab-${i}`}
              aria-selected={i === tab}
              aria-controls="exec-panel"
              tabIndex={i === tab ? 0 : -1}
              onClick={() => setTab(i)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  const next = (i + (e.key === 'ArrowRight' ? 1 : C.tabs.length - 1)) % C.tabs.length
                  setTab(next)
                  document.getElementById(`exec-tab-${next}`)?.focus()
                }
              }}
            >
              <span>{two(i)}</span>
              {label}
            </button>
          ))}
        </div>
      </Block>

      <div className={s.panel} role="tabpanel" id="exec-panel" aria-labelledby={`exec-tab-${tab}`} key={tab}>
        {panels[tab]}
      </div>
    </section>
  )
}
