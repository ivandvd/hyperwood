/**
 * Section 04: the payout choice (architecture paper, "Settlement choices").
 * One closing instruction, two destinations for what is left: collateral or an equity tracker token.
 *
 * This is the part of Hyperwood to remember, so it gets the kit's pairing for such moments: Ink on Hyper Neon,
 * with the kit's "Current crop" (one oversized contour) running through it. Type that crosses the contour
 * changes colour exactly on its edge: the contour and a second, neon copy of the type share one mask.
 *
 * Under the poster, the paper's worked example is live. Drag the price the position is closed at, pick long or
 * short, pick where the proceeds go. The stream runs to the destination you choose, and that one lights up.
 * The numbers follow the paper's own assumptions and nothing else.
 */
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { sections } from '../content.sections'
import { Block, Notes } from './parts'
import { crossing, useLights, useScroll } from './motion'
import { order, share } from './util'
import { useInView } from './useInView'
import k from './kit.module.css'
import s from './Payout.module.css'

const num = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const usd = (v: number) => `${v < 0 ? '-' : ''}$${num.format(Math.abs(v))}`
const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '-' : ''}$${num.format(Math.abs(v))}`

type Example = typeof sections.payout.example

/** The chart keeps a little air above the highest price and below the lowest (in hundredths of its height). */
const PAD = 9
/** Where the price line starts, after the axis labels, and where it ends, before the tag with the exit price
 *  (in hundredths of the width). */
const START = 16
const END = 80

/** The statement and its lead, set once in Ink and once more in Neon for the parts that lie on the contour. */
function PosterCopy({ twin = false }: { twin?: boolean }) {
  const C = sections.payout
  const title = (C.title.match(/[^.]+\.?/g) ?? [C.title]).map((line) => <span key={line}>{line.trim()} </span>)
  return (
    <div className={s.copy}>
      <p className={`${k.mono} ${s.posterEyebrow} ${k.rise}`}>
        <b>{C.index}</b>
        <span>{C.label}</span>
      </p>
      {twin ? (
        <p className={`${s.posterTitle} ${k.rise}`} style={order(1)}>
          {title}
        </p>
      ) : (
        <h2 id="payout-title" className={`${s.posterTitle} ${k.rise}`} style={order(1)}>
          {title}
        </h2>
      )}
      <p className={`${s.posterLead} ${k.rise}`} style={order(3)}>
        {C.lead}
      </p>
    </div>
  )
}

/** The position as a price line from the entry to the exit. The exit is yours to move. */
function Chart({ side, exit, example: E, onExit }: { side: 'long' | 'short'; exit: number; example: Example; onExit: (v: number) => void }) {
  const W = sections.payout.words
  const dragging = useRef(false)
  const span = E.exitMax - E.exitMin
  const y = (price: number) => PAD + (1 - (price - E.exitMin) / span) * (100 - 2 * PAD)
  const yEntry = y(E.entry)
  const yExit = y(exit)

  // a line that sets off from the entry, wanders, and arrives exactly at the exit
  let line = ''
  for (let i = 0; i < 64; i++) {
    const t = i / 63
    const ease = t * t * (3 - 2 * t)
    const swell = Math.pow(Math.sin(Math.PI * t), 0.8)
    const price = E.entry + (exit - E.entry) * ease + (5.5 * Math.sin(t * 9.4 + 0.8) + 2.6 * Math.sin(t * 20.5 + 2.1)) * swell
    line += `${i ? 'L' : 'M'}${(START + t * (END - START)).toFixed(2)} ${y(price).toFixed(2)}`
  }
  const area = `${line}L${END} ${yEntry}L${START} ${yEntry}Z`

  const set = (e: ReactPointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const at = ((e.clientY - box.top) / box.height) * 100
    const price = E.exitMax - ((at - PAD) / (100 - 2 * PAD)) * span
    onExit(Math.round(Math.min(E.exitMax, Math.max(E.exitMin, price))))
  }

  const up = side === 'long' ? 'gain' : 'loss'
  const down = side === 'long' ? 'loss' : 'gain'
  return (
    <div
      className={s.chart}
      onPointerDown={(e) => {
        // touch keeps scrolling the page; the slider under the chart does the same job
        if (e.pointerType === 'touch') return
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        set(e)
      }}
      onPointerMove={(e) => {
        if (dragging.current) set(e)
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <clipPath id="payout-above">
            <rect x="0" y="0" width="100" height={yEntry} />
          </clipPath>
          <clipPath id="payout-below">
            <rect x="0" y={yEntry} width="100" height={100 - yEntry} />
          </clipPath>
        </defs>
        {[E.exitMax, (E.exitMax + E.entry) / 2, (E.exitMin + E.entry) / 2, E.exitMin].map((price) => (
          <line key={price} className={s.grid} x1="0" x2="100" y1={y(price)} y2={y(price)} />
        ))}
        <path className={s.area} data-tone={up} clipPath="url(#payout-above)" d={area} />
        <path className={s.area} data-tone={down} clipPath="url(#payout-below)" d={area} />
        <line className={s.entry} x1="0" x2="100" y1={yEntry} y2={yEntry} />
        <line className={s.level} x1={END} x2="100" y1={yExit} y2={yExit} />
        <path className={s.line} d={line} />
      </svg>
      <span className={`${k.mono} ${s.axis}`} style={{ top: `${y(E.exitMax)}%` }}>
        {usd(E.exitMax)}
      </span>
      <span className={`${k.mono} ${s.axis}`} style={{ top: `${y(E.exitMin)}%` }}>
        {usd(E.exitMin)}
      </span>
      <span className={`${k.mono} ${s.axis} ${s.axisEntry}`} style={{ top: `${yEntry}%` }}>
        <i>{W.entry} </i>
        {usd(E.entry)}
      </span>
      <span className={s.knot} style={{ left: `${END}%`, top: `${yExit}%` }} />
      <span className={s.tag} style={{ top: `${yExit}%` }}>
        {usd(exit)}
      </span>
    </div>
  )
}

export function Payout() {
  const C = sections.payout
  const E = C.example
  const W = C.words
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [exit, setExit] = useState<number>(E.exitLong)
  const [to, setTo] = useState<'collateral' | 'tracker'>('tracker')
  const [posterSeen, posterIn] = useInView<HTMLDivElement>(0.24)
  const lights = useLights<HTMLElement>(`.${k.lit}`)
  // the contour drifts a little as the poster crosses the screen, and the type on it changes colour as it passes
  const posterScroll = useScroll<HTMLDivElement>(crossing, (p, el) => el.style.setProperty('--drift', ((p - 0.5) * 2).toFixed(4)))

  const dir = side === 'long' ? 1 : -1
  const pnl = dir * E.units * (exit - E.entry)
  const equity = E.margin + pnl
  const units = equity / exit
  const at = (exit - E.exitMin) / (E.exitMax - E.exitMin)

  const choose = (next: 'long' | 'short') => {
    setSide(next)
    setExit(next === 'long' ? E.exitLong : E.exitShort)
  }

  return (
    <section className={s.section} id="payout" aria-labelledby="payout-title" ref={lights} data-lights>
      <div className={s.poster} ref={share(posterSeen, posterScroll)} data-in={posterIn ? '' : undefined}>
        <div className={s.crop} aria-hidden />
        <PosterCopy />
        <div className={s.flip} aria-hidden inert>
          <PosterCopy twin />
        </div>
      </div>

      <Block className={`${s.board} ${k.lit}`} line={0.12}>
        {/* the position: its side, the price it is closed at, and what follows from them */}
        <div className={`${s.inputs} ${k.rise}`}>
          <div className={s.row}>
            <span className={`${k.mono} ${s.label}`}>{W.side}</span>
            <div className={k.seg} role="group" aria-label={W.side}>
              <button type="button" aria-pressed={side === 'long'} onClick={() => choose('long')}>
                {W.long}
              </button>
              <button type="button" aria-pressed={side === 'short'} onClick={() => choose('short')}>
                {W.short}
              </button>
            </div>
          </div>

          <div className={s.price}>
            <label className={`${k.mono} ${s.label}`} htmlFor="payout-exit">
              {W.exit}
            </label>
            <span className={`${k.mono} ${s.hint}`} aria-hidden>
              {W.drag}
            </span>
            <Chart side={side} exit={exit} example={E} onExit={setExit} />
            <div className={`${k.mono} ${s.ends2}`} aria-hidden>
              <span>{W.opened}</span>
              <span>{W.closed2}</span>
            </div>
            <input
              id="payout-exit"
              className={s.range}
              type="range"
              min={E.exitMin}
              max={E.exitMax}
              step={1}
              value={exit}
              style={{ '--at': at } as CSSProperties}
              onChange={(e) => setExit(Number(e.target.value))}
            />
            <output className={s.srOnly} htmlFor="payout-exit">
              {usd(exit)}
            </output>
          </div>

          <dl className={s.figures}>
            <div>
              <dt>{W.margin}</dt>
              <dd>{usd(E.margin)}</dd>
            </div>
            <div>
              <dt>{W.exposure}</dt>
              <dd>
                {dir > 0 ? '' : '-'}
                {E.units} {W.units}
              </dd>
            </div>
            <div>
              <dt>{W.pnl}</dt>
              <dd data-tone={pnl >= 0 ? 'up' : 'down'}>{signed(pnl)}</dd>
            </div>
          </dl>
        </div>

        {/* the stream: closed position, available equity, then the destination */}
        <div className={`${s.flow} ${k.rise}`} style={order(2)} data-to={to}>
          <div className={s.node}>
            <span className={`${k.mono} ${s.nodeLabel}`}>{W.closed}</span>
            <strong className={s.nodeValue} data-tone={pnl >= 0 ? 'up' : 'down'}>
              {signed(pnl)}
            </strong>
            <span className={s.nodeSub}>{W.closedSub}</span>
          </div>
          <span className={s.pipe} aria-hidden />
          <div className={`${s.node} ${s.equity}`}>
            <span className={`${k.mono} ${s.nodeLabel}`}>{W.equity}</span>
            <strong className={s.nodeBig}>{usd(equity)}</strong>
            <span className={s.nodeSub}>{W.equitySub}</span>
          </div>
          <svg className={s.fork} viewBox="0 0 60 200" preserveAspectRatio="none" aria-hidden>
            <path className={s.bed} d="M0 100 C 34 100 26 49 60 49" />
            <path className={s.bed} d="M0 100 C 34 100 26 151 60 151" />
            <path className={`${s.run} ${s.runUp}`} pathLength={1} d="M0 100 C 34 100 26 49 60 49" />
            <path className={`${s.run} ${s.runDown}`} pathLength={1} d="M0 100 C 34 100 26 151 60 151" />
          </svg>
          <div className={s.ends} role="group" aria-label={W.to}>
            <button type="button" className={s.end} aria-pressed={to === 'collateral'} onClick={() => setTo('collateral')}>
              <span className={`${k.mono} ${s.nodeLabel}`}>{W.collateral}</span>
              <strong className={s.endValue}>{usd(equity)}</strong>
              <span className={s.nodeSub}>{W.collateralSub}</span>
            </button>
            <button type="button" className={s.end} aria-pressed={to === 'tracker'} onClick={() => setTo('tracker')}>
              <span className={`${k.mono} ${s.nodeLabel}`}>{W.tracker}</span>
              <strong className={s.endValue}>
                {num.format(units)} <em>{W.trackerUnit}</em>
              </strong>
              <span className={s.nodeSub}>
                {W.at} {usd(exit)}. {W.trackerSub}
              </span>
            </button>
          </div>
        </div>

        <p className={`${k.fine} ${k.rise} ${s.assume}`} style={order(4)} aria-live="polite">
          {C.assumptions}
        </p>
      </Block>

      <Notes items={C.notes} className={k.gap} />
    </section>
  )
}
