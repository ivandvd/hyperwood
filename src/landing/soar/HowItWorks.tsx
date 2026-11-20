/**
 * How a trade goes (&flow=soar), on the Ink after the app's stage: from the device to the chain, in the stages the
 * papers name (the request's Accepted, Matched, Proven and its settlement, after the sealing on the device).
 *
 * One line runs down the stages, the brand's current line, and a drop of Neon goes down it as the page is scrolled
 * (it stands where the reading eye does, six tenths of the way down the screen). The line is lit behind it. Where it
 * passes a stage, the stage's name comes up bright and the part of the app beside it does what the stage does, once,
 * with the brand's one curve: the order turns into ciphertext and is signed; the public queue takes the request; two
 * sealed orders meet in the engine and are filled; the proof is stamped; the batch goes down the three layers and the
 * receipt comes back. Scrolled back above a stage, it is undone, so it can be seen again.
 *
 * What moves is moved by the compositor (the drop, the lit line, the parts' own transitions); the letters of the
 * ciphertext are written a few times a second for under a second. The page's figures are the app's own (data.ts).
 * With reduced motion every stage stands done and nothing moves. The words: `soar.how` in content.home.ts.
 */
import { useEffect, useRef, useState } from 'react'
import { home } from '../../content.home'
import { money, position, request } from '../../product/data'
import { scramble, settle } from './scramble'
import h from './how.module.css'

const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches

const Lock = () => (
  <svg viewBox="0 0 256 256" aria-hidden="true">
    <path fill="currentColor" d="M208,76H180V56A52,52,0,0,0,76,56V76H48A20,20,0,0,0,28,96V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V96A20,20,0,0,0,208,76ZM100,56a28,28,0,0,1,56,0V76H100ZM204,204H52V100H204Z" />
  </svg>
)
const Key = () => (
  <svg viewBox="0 0 256 256" aria-hidden="true">
    <path fill="currentColor" d="M160,12A84.09,84.09,0,0,0,79.37,119.66L23.51,175.51A12,12,0,0,0,20,184v40a12,12,0,0,0,12,12H72a12,12,0,0,0,12-12V212H96a12,12,0,0,0,12-12V188h12a12,12,0,0,0,8.49-3.51l7.85-7.86A84,84,0,1,0,160,12Zm0,144a59.53,59.53,0,0,1-22.42-4.36,12,12,0,0,0-13.42,2.48L115,164H96a12,12,0,0,0-12,12v12H72a12,12,0,0,0-12,12v12H44V189l59.88-59.88a12,12,0,0,0,2.48-13.42A60,60,0,1,1,160,156Zm32-76a16,16,0,1,1-16-16A16,16,0,0,1,192,80Z" />
  </svg>
)

/** The order as the ticket has it, and what each value is once sealed. */
const SEAL: [label: string, plain: string, sealed: string][] = [
  ['Market', position.market, '9c4e1b70'],
  ['Direction', position.side, 'e07f'],
  ['Size', String(position.units), '5a'],
  ['Leverage', `${position.leverage}×`, 'b13d'],
  ['Margin', `$${money(position.margin)}`, '4f0d8c2'],
]

function Seal({ on }: { on: boolean }) {
  const values = useRef<(HTMLElement | null)[]>([])
  useEffect(() => {
    const waits: number[] = []
    values.current.forEach((el, i) => {
      if (!el) return
      const to = on ? SEAL[i][2] : SEAL[i][1]
      if (quiet()) settle(el, to)
      else waits.push(window.setTimeout(() => scramble(el, to, 560), on ? i * 105 : 0))
    })
    return () => waits.forEach((w) => window.clearTimeout(w))
  }, [on])
  return (
    <div className={h.panel}>
      <p className={h.head}>
        <span>Order</span>
        <span>On your device</span>
      </p>
      <dl className={h.rows}>
        {SEAL.map(([label, plain], i) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd
              ref={(el) => {
                values.current[i] = el
              }}
            >
              {plain}
            </dd>
          </div>
        ))}
      </dl>
      <p className={h.sealed}>
        <Lock />
        Signed as one instruction
      </p>
    </div>
  )
}

/** The public queue: what anyone sees of the requests before this one. */
const QUEUE: [id: string, at: string][] = [
  ['0x6b02…19fa', '14:32:05'],
  ['0xd4e7…8a03', '14:32:06'],
  ['0x2a90…c7e5', '14:32:06'],
  ['0x81fc…3b6d', '14:32:07'],
]

function Queue({ on }: { on: boolean }) {
  return (
    <div className={h.panel}>
      <p className={h.head}>
        <span>Public queue</span>
        <span>Request · time</span>
      </p>
      <div className={h.queue}>
        <ul data-on={on ? '' : undefined}>
          {QUEUE.map(([id, at]) => (
            <li key={id}>
              <span>{id}</span>
              <span>{at}</span>
              <span>Sealed</span>
            </li>
          ))}
          <li data-mine="">
            <span>{request.id}</span>
            <span>{request.stages[0].at}</span>
            <span>Accepted</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

/** (The two drops meet without a filter, which would need a shader of its own the first time it is drawn and hold a
 *  frame back: a neck grows between them as they near, and is gone inside them once they are one.) */
function Engine({ on }: { on: boolean }) {
  return (
    <div className={h.panel}>
      <p className={h.head}>
        <span>Sealed engine</span>
        <span>Batch 48,112</span>
      </p>
      <div className={h.engine} data-on={on ? '' : undefined}>
        <svg viewBox="0 0 320 112" aria-hidden="true">
          <ellipse className={h.neck} cx="160" cy="56" rx="44" ry="10" />
          <circle className={h.mine} cx="62" cy="56" r="19" />
          <circle className={h.theirs} cx="258" cy="56" r="19" />
        </svg>
        <p className={h.pair}>
          <span>{request.id}</span>
          <span>0x6b02…19fa</span>
        </p>
        <p className={h.filled}>Filled in one batch</p>
      </div>
    </div>
  )
}

const PROOF = '0x9c1f 7a2e … 41d0 e2a4'
const UNPROVEN = '·'.repeat(PROOF.length)

function Proof({ on }: { on: boolean }) {
  const hash = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const el = hash.current
    if (!el) return
    if (quiet()) settle(el, on ? PROOF : UNPROVEN)
    else scramble(el, on ? PROOF : UNPROVEN, on ? 900 : 300)
  }, [on])
  return (
    <div className={h.panel}>
      <p className={h.head}>
        <span>Proof</span>
        <span>Batch 48,112</span>
      </p>
      <div className={h.proof} data-on={on ? '' : undefined}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle className={h.ring} cx="32" cy="32" r="28" pathLength="100" />
          <path className={h.tick} d="M20 33 l8 8 l16 -18" pathLength="100" />
        </svg>
        <div>
          <p ref={hash} className={h.hash}>
            {UNPROVEN}
          </p>
          <p className={h.verified}>Checked on the public contract · {request.stages[2].at}</p>
        </div>
      </div>
      <dl className={h.rows} data-two="">
        <div>
          <dt>Shows</dt>
          <dd>The batch followed the rules</dd>
        </div>
        <div>
          <dt>Hides</dt>
          <dd>Every order in it</dd>
        </div>
      </dl>
    </div>
  )
}

function Chain({ on }: { on: boolean }) {
  return (
    <div className={h.panel}>
      <p className={h.head}>
        <span>Settlement</span>
        <span>Batch 48,112</span>
      </p>
      <ol className={h.layers} data-on={on ? '' : undefined}>
        {home.network.layers.map(([tier, name, what]) => (
          <li key={tier}>
            <b>{tier}</b>
            <span>{name}</span>
            <em>{what}</em>
          </li>
        ))}
      </ol>
      <p className={h.receipt} data-on={on ? '' : undefined}>
        <Key />
        Receipt: only your key opens it
      </p>
    </div>
  )
}

const PARTS = [Seal, Queue, Engine, Proof, Chain]

export function HowItWorks() {
  const H = home.soar.how
  const root = useRef<HTMLElement>(null)
  /** the last stage the drop has passed (-1: none yet) */
  const [reached, setReached] = useState(-1)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const path = el.querySelector<HTMLElement>('[data-path]')
    const line = el.querySelector<HTMLElement>('[data-line]')
    const lit = el.querySelector<HTMLElement>('[data-lit]')
    const drop = el.querySelector<HTMLElement>('[data-drop]')
    const stations = Array.from(el.querySelectorAll<HTMLElement>('[data-station]'))
    if (!path || !line || !lit || !drop || !stations.length) return
    const still = quiet()
    // Where the line begins on the page and how long it is: measured when the page is laid out, not as it scrolls.
    let begin = 0
    let length = 0
    let marks: number[] = []
    const measure = () => {
      const top = path.getBoundingClientRect().top + scrollY
      const at = stations.map((s) => {
        const r = s.getBoundingClientRect()
        return r.top + r.height / 2 + scrollY - top
      })
      begin = top + at[0]
      length = at[at.length - 1] - at[0]
      marks = at.map((a) => a - at[0])
      line.style.top = `${at[0]}px`
      line.style.height = `${length}px`
    }
    let raf = 0
    let shown = -2
    const frame = () => {
      raf = 0
      const y = still ? length : Math.min(length, Math.max(0, scrollY + innerHeight * 0.6 - begin))
      drop.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`
      lit.style.transform = `scaleY(${length ? (y / length).toFixed(4) : 0})`
      let n = -1
      marks.forEach((m, i) => {
        if (y >= m - 0.5) n = i
      })
      if (n !== shown) {
        shown = n
        setReached(n)
      }
    }
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const sized = () => {
      measure()
      ask()
    }
    sized()
    const watch = new ResizeObserver(sized)
    watch.observe(el)
    addEventListener('scroll', ask, { passive: true })
    addEventListener('resize', sized)
    void document.fonts?.ready.then(sized)
    return () => {
      watch.disconnect()
      removeEventListener('scroll', ask)
      removeEventListener('resize', sized)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <section ref={root} className={h.how} aria-labelledby="how-title">
      <h2 id="how-title" className={h.title}>
        <span>{H.title[0]}</span> <b>{H.title[1]}</b>
      </h2>
      <div className={h.path} data-path="">
        <div className={h.line} data-line="" aria-hidden="true">
          <i className={h.lit} data-lit="" />
          <i className={h.drop} data-drop="" />
        </div>
        <ol className={h.steps}>
          {H.steps.map((step, i) => {
            const Part = PARTS[i]
            const on = i <= reached
            return (
              <li key={step.name} className={h.step} data-on={on ? '' : undefined}>
                <div className={h.say}>
                  <h3>
                    <i className={h.station} data-station="" aria-hidden="true" />
                    {step.name}
                  </h3>
                  <p>{step.text}</p>
                  <p className={h.figure}>
                    <b>{step.figure}</b> <span>{step.of}</span>
                  </p>
                </div>
                <div className={h.show} role="img" aria-label={H.shows[i]}>
                  <Part on={on} />
                </div>
              </li>
            )
          })}
        </ol>
        <p className={h.targets}>{H.targets}</p>
      </div>
    </section>
  )
}
