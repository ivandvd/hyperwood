/**
 * Sections 07 to 09: the network, finality and operating policy, the implementation sequence
 * (architecture paper, "Network architecture", "Finality and operating policy", "Implementation sequence").
 * They stand on Paper, the kit's surface for reading. One picture each:
 *  07, three plates in the brand's three colours, one on top of the other, that draw apart as you arrive;
 *  08, a line that runs through the four stages with the scroll, and the kit's current lines behind the target;
 *  09, a rail that fills down the seven phases as you read them.
 */
import { useEffect, useRef, useState } from 'react'
import { sections } from '../content.sections'
import { CurrentLines } from './devices'
import { Block, Notes, SectionHead, Table } from './parts'
import { countUp, entering, passing, useScroll } from './motion'
import { order, share, two } from './util'
import { useInView } from './useInView'
import k from './kit.module.css'
import s from './Lower.module.css'

/** 07: three layers, each settling to the one below, and the contracts that make up the system. */
export function Network() {
  const C = sections.network
  const [hot, setHot] = useState(-1)
  // the plates start pressed together and draw apart as the picture comes up the screen
  const stack = useScroll<HTMLDivElement>(entering(0.96, 0.42), (p, el) => el.style.setProperty('--lift', (0.1 + 0.9 * p).toFixed(4)))
  return (
    <section className={k.section} id="network" aria-labelledby="network-title">
      <SectionHead id="network" index={C.index} label={C.label} title={C.title} lead={C.lead} />

      <div className={s.net}>
        <div className={s.iso} ref={stack} aria-hidden>
          <div className={s.isoGround} />
          <div className={s.isoStage}>
            {[...C.layers].reverse().map(([tag, name], i) => {
              const at = C.layers.length - 1 - i
              return (
                <div className={s.plate} key={tag} data-layer={tag} data-hot={hot === at ? '' : undefined} style={{ ['--z' as string]: i }} onMouseEnter={() => setHot(at)} onMouseLeave={() => setHot(-1)}>
                  <span className={s.plateName}>
                    <b>{tag}</b>
                    {name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <Block as="ol" className={s.layers} line={0.2}>
            {C.layers.map(([tag, name, text], i) => (
              <li className={`${s.layer} ${k.rise}`} key={tag} style={order(i)} data-hot={hot === i ? '' : undefined} onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(-1)}>
                <span className={s.layerTag} data-layer={tag}>
                  {tag}
                </span>
                <div>
                  <strong>{name}</strong>
                  <p>{text}</p>
                </div>
                {i < C.layers.length - 1 && <span className={`${k.mono} ${s.settles}`}>{C.settles}</span>}
              </li>
            ))}
          </Block>

          <Block as="ul" className={s.facts}>
            {C.facts.map(([name, text], i) => (
              <li className={k.rise} key={name} style={order(i)}>
                <span className={`${k.mono} ${s.factName}`}>{name}</span>
                <p>{text}</p>
              </li>
            ))}
          </Block>
        </div>
      </div>

      <div className={k.gap}>
        <Table head={C.head} rows={C.rows} />
      </div>
      <Notes items={C.notes} cols={3} className={k.gapS} />
    </section>
  )
}

/** 08: the four stages an order passes through, what is a target and what is measured, and how the system is run. */
export function Policy() {
  const C = sections.policy
  const figure = useRef<HTMLParagraphElement>(null)
  const [target, targetIn] = useInView<HTMLDivElement>(0.24)
  // the line runs through the four stages as they travel up the screen
  const line = useScroll<HTMLOListElement>(entering(0.82, 0.3), (p, el) => el.style.setProperty('--p', p.toFixed(4)))

  // the figure counts up once, when the card arrives (the kit: figures count up once)
  useEffect(() => {
    const el = figure.current
    if (!targetIn || !el) return
    const text = C.target.figure
    return countUp(el, 1, (e) => text.replace(/\d+/g, (n) => String(Math.round(Number(n) * e))), 900)
  }, [targetIn, C.target.figure])

  return (
    <section className={k.section} id="policy" aria-labelledby="policy-title">
      <SectionHead id="policy" index={C.index} label={C.label} title={C.title} lead={C.lead} />

      <ol className={s.stages} ref={line}>
        {C.stages.map(([name, text], i) => (
          <li key={name} style={{ ['--t' as string]: i / C.stages.length }}>
            <span className={s.stageNum}>{two(i)}</span>
            <strong>{name}</strong>
            <p className={k.small}>{text}</p>
          </li>
        ))}
      </ol>

      <div className={`${k.device} ${k.ink} ${s.target} ${k.gapS}`} ref={target} data-in={targetIn ? '' : undefined}>
        <CurrentLines className={s.lines} rows={14} />
        <div className={`${s.targetMain} ${k.rise}`}>
          <p className={`${k.mono} ${s.targetTag}`}>{C.target.title}</p>
          <p className={s.figure} ref={figure} aria-label={C.target.figure}>
            {C.target.figure}
          </p>
          <p className={`${k.mono} ${s.figureLabel}`}>{C.target.figureLabel}</p>
        </div>
        <p className={`${k.text} ${k.rise} ${s.targetText}`} style={order(1)}>
          {C.target.text}
        </p>
      </div>

      <Block as="ul" className={`${s.blocks} ${k.gap}`}>
        {C.blocks.map(([title, text], i) => (
          <li className={`${k.card} ${k.rise}`} key={title} style={order(i)}>
            <span className={s.blockNum}>{two(i)}</span>
            <h3 className={k.kicker}>{title}</h3>
            <p className={k.small}>{text}</p>
          </li>
        ))}
      </Block>
    </section>
  )
}

/** 09: seven phases, each with the evidence that closes it, and the rules the accounting always keeps. */
export function Roadmap() {
  const C = sections.roadmap
  const [seen, seenIn] = useInView<HTMLOListElement>(0.1)
  // the rail fills down the phases as the reading line passes them
  const rail = useScroll<HTMLOListElement>(passing(0.66), (p, el) => el.style.setProperty('--p', p.toFixed(4)))
  return (
    <section className={k.section} id="roadmap" aria-labelledby="roadmap-title">
      <SectionHead id="roadmap" index={C.index} label={C.label} title={C.title} lead={C.lead} />

      <div className={s.build}>
        <ol className={s.phases} ref={share(seen, rail)} data-in={seenIn ? '' : undefined}>
          <li className={`${s.phaseHead} ${k.mono}`} aria-hidden>
            <span />
            <span>{C.head[0]}</span>
            <span>{C.head[1]}</span>
          </li>
          {C.phases.map(([name, text], i) => (
            <li className={`${s.phase} ${k.rise}`} key={name} style={{ ...order(i), ['--t' as string]: i / C.phases.length }}>
              <span className={s.phaseNum}>{two(i)}</span>
              <strong>{name}</strong>
              <p className={k.small}>{text}</p>
            </li>
          ))}
        </ol>

        <Block className={`${k.device} ${k.ink} ${s.rules}`}>
          <h3 className={`${k.h3} ${k.rise}`}>{C.invariants.title}</h3>
          <ul className={`${k.list} ${s.ruleList}`}>
            {C.invariants.items.map((item, i) => (
              <li className={`${k.small} ${k.rise}`} key={item} style={order(i + 1)}>
                {item}
              </li>
            ))}
          </ul>
          <p className={`${s.ruleClose} ${k.rise}`} style={order(C.invariants.items.length + 1)}>
            {C.invariants.close}
          </p>
        </Block>
      </div>
    </section>
  )
}
