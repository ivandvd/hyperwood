/**
 * Section 03: equity markets (architecture paper, "Equity markets").
 * What a market is, how anyone lists one, the six stages of its life, the four capital accounts and the equity
 * rules every market has to define.
 * Two pictures carry it. The lifecycle: a line with six marks; the liquid runs along it as you scroll, or to the
 * stage you pick, and the bar under it shows the ETH bond held until the market is retired. The clock: the
 * network runs without a break, the price it can execute against does not.
 */
import { useRef, useState } from 'react'
import { sections } from '../content.sections'
import { Block, SectionHead } from './parts'
import { entering, reducedMotion, useLights, useScroll } from './motion'
import { order, share, two } from './util'
import { useInView } from './useInView'
import k from './kit.module.css'
import s from './Markets.module.css'

/** A week of equity pricing, in days from 0 to 7: sessions, one of them halted, a holiday, and two closed days. */
const SESSIONS: [number, number][] = [
  [0.3, 0.62],
  [1.3, 1.42],
  [1.5, 1.62],
  [3.3, 3.62],
  [4.3, 4.62],
]

export function Markets() {
  const C = sections.markets
  const K = C.rules.clock
  const stages = C.lifecycle.stages
  const last = stages.length - 1
  const [seenRef, lifeIn] = useInView<HTMLDivElement>(0.2)
  const [stage, setStage] = useState(0)
  const touched = useRef(false)
  const lights = useLights<HTMLElement>(`.${k.lit}`)

  // until a stage is picked, the market lives its life as the card travels up the screen
  const scrollRef = useScroll<HTMLDivElement>(entering(0.86, 0.22), (p) => {
    if (touched.current) return
    setStage(reducedMotion() ? 2 : Math.min(last, Math.floor(p * stages.length)))
  })

  const pick = (i: number) => {
    touched.current = true
    setStage(i)
  }

  return (
    <section className={k.section} id="markets" aria-labelledby="markets-title" ref={lights} data-lights>
      <SectionHead id="markets" index={C.index} label={C.label} title={C.title} lead={C.lead} />

      <div className={s.top}>
        <Block>
          <h3 className={`${k.h3} ${k.rise}`}>{C.create.title}</h3>
          <p className={`${k.text} ${k.rise} ${s.createText}`} style={order(1)}>
            {C.create.text}
          </p>
          <ol className={s.steps}>
            {C.create.steps.map(([title, text], i) => (
              <li className={k.rise} key={title} style={order(i + 2)}>
                <span className={s.stepNum}>{two(i)}</span>
                <div>
                  <strong>{title}</strong>
                  <p className={k.small}>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={`${s.defines} ${k.rise}`} style={order(5)}>
            <h4 className={`${k.mono} ${s.definesTitle}`}>{C.defines.title}</h4>
            <ul className={k.chips}>
              {C.defines.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Block>

        <div className={`${s.life} ${k.lit}`} ref={share(seenRef, scrollRef)} data-in={lifeIn ? '' : undefined}>
          <div className={`${s.lifeHead} ${k.rise}`}>
            <h3 className={k.h3}>{C.lifecycle.title}</h3>
            <span className={`${k.mono} ${s.count}`}>
              {two(stage)} / {two(last)}
            </span>
          </div>

          <div className={`${s.track} ${k.rise}`} style={{ ...order(1), ['--at' as string]: stage / last }} role="tablist" aria-label={C.lifecycle.title}>
            <span className={s.flow} aria-hidden />
            {stages.map(([name], i) => (
              <button
                key={name}
                type="button"
                role="tab"
                id={`life-tab-${i}`}
                aria-selected={i === stage}
                aria-controls="life-panel"
                tabIndex={i === stage ? 0 : -1}
                className={s.stop}
                data-past={i < stage ? '' : undefined}
                onClick={() => pick(i)}
                onMouseEnter={() => pick(i)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault()
                    const next = (i + (e.key === 'ArrowRight' ? 1 : stages.length - 1)) % stages.length
                    pick(next)
                    document.getElementById(`life-tab-${next}`)?.focus()
                  }
                }}
              >
                <i aria-hidden />
                <span className={s.stopNum}>{two(i)}</span>
                <span className={s.stopName}>{name}</span>
              </button>
            ))}
          </div>

          {/* the bond: held from the first stage, released at the last */}
          <div className={`${s.bond} ${k.rise}`} style={order(2)} data-free={stage === last ? '' : undefined} aria-hidden>
            <span className={s.bondFill} />
            <span className={`${k.mono} ${s.bondLabel}`}>{stage === last ? C.lifecycle.bond.free : C.lifecycle.bond.locked}</span>
          </div>

          <div className={`${s.stage} ${k.rise}`} style={order(3)} role="tabpanel" id="life-panel" aria-labelledby={`life-tab-${stage}`}>
            <div className={s.stageIn} key={stage}>
              <p className={s.stageName}>{stages[stage][0]}</p>
              <p className={k.text}>{stages[stage][1]}</p>
            </div>
          </div>
          <p className={`${k.fine} ${k.rise} ${s.lifeNote}`} style={order(4)}>
            {C.lifecycle.note}
          </p>
        </div>
      </div>

      <Block className={k.gap}>
        <h3 className={`${k.h3} ${k.rise}`}>{C.accounts.title}</h3>
        <ul className={s.accounts}>
          {C.accounts.rows.map(([name, purpose], i) => (
            <li className={`${k.lit} ${k.rise}`} key={name} style={order(i + 1)}>
              <span className={s.accountNum}>{two(i)}</span>
              <strong>{name}</strong>
              <p className={k.small}>{purpose}</p>
            </li>
          ))}
        </ul>
        <p className={`${k.fine} ${k.rise} ${s.accountsNote}`} style={order(5)}>
          {C.accounts.note}
        </p>
      </Block>

      <Block className={`${k.two} ${k.gap}`}>
        <div>
          <h3 className={`${k.h3} ${k.rise}`}>{C.rules.title}</h3>
          <ul className={`${k.chips} ${k.rise} ${s.rules}`} style={order(1)}>
            {C.rules.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={`${k.text} ${k.rise} ${s.rulesText}`} style={order(2)}>
            {C.rules.text}
          </p>
          <p className={`${k.small} ${k.rise} ${s.rulesMore}`} style={order(3)}>
            {C.rules.more}
          </p>
        </div>

        <figure className={`${k.card} ${k.lit} ${k.rise} ${s.clock}`} style={order(2)} role="img" aria-label={`${K.network}: ${K.always}. ${K.pricing}: ${K.follows}.`}>
          <div className={s.clockRow}>
            <p className={s.clockName}>
              <span className={`${k.mono} ${s.clockLabel}`}>{K.network}</span>
              <span className={`${k.mono} ${s.clockTag}`}>{K.always}</span>
            </p>
            <span className={s.rail}>
              <i className={s.on} style={{ left: 0, width: '100%' }} />
            </span>
          </div>
          <div className={s.clockRow}>
            <p className={s.clockName}>
              <span className={`${k.mono} ${s.clockLabel}`}>{K.pricing}</span>
              <span className={`${k.mono} ${s.clockTag}`}>{K.follows}</span>
            </p>
            <span className={s.rail}>
              {SESSIONS.map(([a, b], i) => (
                <i className={s.on} key={a} style={{ left: `${(a / 7) * 100}%`, width: `${((b - a) / 7) * 100}%`, ...order(i) }} />
              ))}
            </span>
            <span className={`${k.mono} ${s.marks}`} aria-hidden>
              <b style={{ left: `${(0.46 / 7) * 100}%` }}>{K.session}</b>
              <b style={{ left: `${(1.46 / 7) * 100}%` }}>{K.halt}</b>
              <b style={{ left: `${(2.46 / 7) * 100}%` }}>{K.holiday}</b>
              <b style={{ left: `${(6 / 7) * 100}%` }}>{K.closed}</b>
            </span>
          </div>
          <figcaption className={`${k.mono} ${s.clockNote}`}>{K.tag}</figcaption>
        </figure>
      </Block>
    </section>
  )
}
