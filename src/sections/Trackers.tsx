/**
 * Section 05: equity tracker tokens and where they can go (architecture paper, "Equity tracker tokens" and
 * "Liquidity and portability").
 * Three small pictures carry it. The follow: a token's line keeping to its reference, and the one place where
 * it does not, because the paper says it can. The shortfall: a liability that grew by a tenth beside a reserve
 * that did not. The path: a tracker starts sealed, like the confidential rows of section 02, and from export
 * onward it is in the open, like the public ones.
 */
import { sections } from '../content.sections'
import { Block, SectionHead } from './parts'
import { useLights } from './motion'
import { order, two } from './util'
import k from './kit.module.css'
import s from './Trackers.module.css'

/** Where the tracker leaves its reference for a while, as a share of the chart's width. */
const GAP_AT = 0.67

/** Two lines for the picture: a reference, and a tracker that keeps to it except around GAP_AT. */
function lines() {
  const n = 96
  let ref = ''
  let trk = ''
  let gap = { x: 0, a: 0, b: 0 }
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const value = (u: number) => 0.47 + 0.3 * (u - 0.5) + 0.2 * Math.sin(u * 6.6 + 0.4) + 0.08 * Math.sin(u * 16.6 + 1.1) + 0.03 * Math.sin(u * 34 + 2)
    const r = value(t)
    // the tracker answers a moment later, with a little noise of its own, and sags where liquidity thins
    const tr = value(t - 0.012) + 0.008 * Math.sin(t * 61) - 0.12 * Math.exp(-(((t - GAP_AT) / 0.055) ** 2))
    const x = t * 100
    const y = (v: number) => 92 - v * 86
    ref += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y(r).toFixed(2)}`
    trk += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y(tr).toFixed(2)}`
    if (Math.abs(t - GAP_AT) < 0.5 / (n - 1)) gap = { x, a: y(r), b: y(tr) }
  }
  return { ref, trk, gap }
}
const L = lines()

export function Trackers() {
  const C = sections.trackers
  const F = C.follow
  const lights = useLights<HTMLElement>(`.${k.lit}`)
  return (
    <section className={k.section} id="trackers" aria-labelledby="trackers-title" ref={lights} data-lights>
      <SectionHead id="trackers" index={C.index} label={C.label} title={C.title} lead={C.lead} />

      <div className={s.top}>
        <Block as="figure" className={`${k.card} ${k.lit} ${s.follow}`} line={0.22}>
          <figcaption className={`${s.legend} ${k.rise}`}>
            <span className={`${k.mono} ${s.key} ${s.keyRef}`}>{F.reference}</span>
            <span className={`${k.mono} ${s.key} ${s.keyTrk}`}>{F.tracker}</span>
            <span className={`${k.mono} ${s.tagRight}`}>{F.tag}</span>
          </figcaption>
          <div className={s.plot} role="img" aria-label={`${F.tracker}: ${C.tracking}`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {[22, 44, 66, 88].map((y) => (
                <line key={y} className={s.grid} x1="0" x2="100" y1={y} y2={y} />
              ))}
              <line className={s.gapLine} x1={L.gap.x} x2={L.gap.x} y1={L.gap.a} y2={L.gap.b} />
            </svg>
            <svg className={s.draw} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <path className={s.ref} d={L.ref} />
            </svg>
            <svg className={`${s.draw} ${s.drawTrk}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <path className={s.trk} d={L.trk} />
            </svg>
            <span className={`${k.mono} ${s.gapLabel}`} style={{ left: `${L.gap.x}%`, top: `${L.gap.b}%` }}>
              {F.gap}
            </span>
          </div>
          <p className={`${k.fine} ${k.rise} ${s.tracking}`} style={order(2)}>
            {C.tracking}
          </p>
        </Block>

        <Block>
          <h3 className={`${k.h3} ${k.rise}`}>{C.backing.title}</h3>
          <p className={`${k.text} ${k.rise} ${s.after}`} style={order(1)}>
            {C.backing.text}
          </p>
          <ul className={s.kinds}>
            {C.backing.kinds.map(([title, text], i) => (
              <li className={k.rise} key={title} style={order(i + 2)}>
                <span className={s.kindNum}>{two(i)}</span>
                <div>
                  <strong>{title}</strong>
                  <p className={k.small}>{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className={`${k.small} ${k.rise} ${s.after}`} style={order(4)}>
            {C.backing.design}
          </p>
        </Block>
      </div>

      <Block className={`${k.card} ${k.lit} ${s.short} ${k.gapS}`} line={0.22}>
        <div>
          <h3 className={`${k.h3} ${k.rise}`}>{C.shortfall.title}</h3>
          <p className={`${k.small} ${k.rise} ${s.shortText}`} style={order(2)}>
            {C.shortfall.text}
          </p>
        </div>
        <div className={`${s.bars} ${k.rise}`} style={order(1)} role="img" aria-label={`${C.shortfall.liability[0]} ${C.shortfall.liability[1]}, ${C.shortfall.reserve[0]} ${C.shortfall.reserve[1]}, ${C.shortfall.gap}`}>
          <div className={s.bar}>
            <span className={`${k.mono} ${s.barLabel}`}>{C.shortfall.liability[0]}</span>
            <span className={s.rail}>
              <i className={s.liability} />
              <i className={s.gap} />
            </span>
            <strong>{C.shortfall.liability[1]}</strong>
          </div>
          <div className={s.bar}>
            <span className={`${k.mono} ${s.barLabel}`}>{C.shortfall.reserve[0]}</span>
            <span className={s.rail}>
              <i className={s.reserve} />
            </span>
            <strong>{C.shortfall.reserve[1]}</strong>
          </div>
          <p className={`${k.mono} ${s.shortLabel}`}>{C.shortfall.gap}</p>
        </div>
      </Block>

      <Block className={k.gap}>
        <h3 className={`${k.h3} ${k.rise}`}>{C.path.title}</h3>
        <ol className={s.path}>
          {C.path.stops.map(([title, text], i) => (
            <li className={`${s.stop} ${i === 0 ? s.sealed : s.open} ${k.lit} ${k.rise}`} key={title} style={order(i + 1)}>
              {i === 1 && <span className={s.seam} aria-hidden />}
              <span className={`${k.mono} ${s.tag}`}>
                <b>{two(i)}</b>
                {i === 0 ? C.path.sealed : C.path.open}
              </span>
              <strong>{title}</strong>
              <p className={k.small}>{text}</p>
            </li>
          ))}
        </ol>
        <p className={`${k.fine} ${k.rise} ${s.pathNote}`} style={order(5)}>
          {C.path.note}
        </p>
      </Block>
    </section>
  )
}
