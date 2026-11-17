/**
 * Frame 3: a Layer 3 on Robinhood Chain. Four tiles, each one statement with a small picture, each a way into
 * the section of the Architecture page that carries the detail:
 *   Network    three plates that draw apart: Hyperwood on Robinhood Chain on Ethereum
 *   Execution  an instruction passing inbox, engine, prover and verifier, and the state root it changes
 *   Markets    the lifecycle of a listed market, with its ETH bond locked until it is retired
 *   Trackers   a token's line following its equity reference
 * The tiles rise in one after another as the frame arrives, and their pictures play in turn while it is held.
 */
import { useRef, type CSSProperties, type JSX } from 'react'
import { landing } from '../content.landing'
import { Arrow, Check } from '../sections/devices'
import { useLights } from '../sections/motion'
import kit from '../sections/kit.module.css'
import { Frame } from './Frame'
import { deckStill, ease, part, useProgress } from './track'
import s from './network.module.css'

const N = landing.network

/** The tracker picture: a reference that wanders upward, and a token that follows it a step behind. */
const FOLLOW = (() => {
  const n = 44
  const ref: [number, number][] = []
  const trk: [number, number][] = []
  const y = (t: number) => 63 - 43 * t - 9 * Math.sin(t * 6.1 + 0.4) - 5 * Math.sin(t * 14.3 + 1.9) + 4 * Math.sin(t * 27 + 0.7)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    ref.push([t * 100, y(t)])
    trk.push([t * 100, y(Math.max(0, t - 0.022)) + 2.2 * Math.sin(t * 19 + 2.6) + 1.4])
  }
  const d = (pts: [number, number][]) => pts.map(([x, v], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${v.toFixed(2)}`).join('')
  return { ref: d(ref), trk: d(trk), at: (t: number) => trk[Math.min(n, Math.max(0, Math.round(t * n)))] }
})()

function Layers() {
  return (
    <div className={s.layers} aria-hidden>
      <div className={s.plates}>
        {N.layers
          .slice()
          .reverse()
          .map(([code], i) => (
            <i key={code} data-layer={code} style={{ '--z': i } as CSSProperties} />
          ))}
      </div>
      <ol className={s.names}>
        {N.layers.map(([code, name], i) => (
          <li key={code} style={{ '--z': 1 - i } as CSSProperties} data-layer={code}>
            <b>{code}</b>
            {name}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Core() {
  return (
    <div className={s.core} aria-hidden>
      <ol className={s.nodes}>
        <span className={s.wire}>
          <span />
        </span>
        {N.core.map((name, i) => (
          <li key={name} data-node={i}>
            <i>{i === N.core.length - 1 && <Check />}</i>
            {name}
          </li>
        ))}
      </ol>
      <p className={s.root}>
        <span>stateRoot</span>
        <b data-root="old">0x8b21…9c04</b>
        <b data-root="new">0x3fa9…d07b</b>
      </p>
    </div>
  )
}

function Lifecycle() {
  return (
    <div className={s.life} aria-hidden>
      <ol className={s.dots}>
        <span className={s.wire}>
          <span />
        </span>
        {N.lifecycle.map((name, i) => (
          <li key={name} data-dot={i} />
        ))}
      </ol>
      <p className={s.stage}>
        {N.lifecycle.map((name, i) => (
          <em key={name} data-name={i}>
            {name}
          </em>
        ))}
      </p>
      <p className={s.bond}>
        <i />
        <span>
          <em data-bond="locked">{N.bond.locked}</em>
          <em data-bond="free">{N.bond.free}</em>
        </span>
      </p>
    </div>
  )
}

function Follow() {
  return (
    <div className={s.follow} aria-hidden>
      <div className={s.chart}>
        <svg viewBox="0 0 100 70" preserveAspectRatio="none">
          <path d={FOLLOW.ref} className={s.refLine} />
          <path d={FOLLOW.trk} className={s.trkLine} />
        </svg>
        <i className={s.token} />
      </div>
      <p className={s.keys}>
        <span data-k="trk">{N.follow.tracker}</span>
        <span data-k="ref">{N.follow.reference}</span>
      </p>
    </div>
  )
}

const PICTURES: Record<string, () => JSX.Element> = { layers: Layers, core: Core, markets: Lifecycle, trackers: Follow }

function Tiles() {
  const host = useLights<HTMLDivElement>(`.${kit.lit}`)
  const last = useRef<number[]>([])

  useProgress((p) => {
    const el = host.current
    if (!el) return
    const still = deckStill()
    const tiles = Array.from(el.children) as HTMLElement[]
    tiles.forEach((tile, i) => {
      // arriving: one after another, up out of the card
      const up = still ? 1 : ease(part(p.arrive, 0.3 + i * 0.09, 0.82 + i * 0.06))
      tile.style.transform = up < 0.999 ? `translate3d(0, ${((1 - up) * 54).toFixed(1)}px, 0)` : ''
      tile.style.opacity = up.toFixed(3)
      // held: each picture plays in its turn
      const play = still ? 1 : ease(part(p.dwell, 0.02 + i * 0.2, 0.42 + i * 0.2))
      if (Math.abs((last.current[i] ?? -1) - play) < 0.0008) return
      last.current[i] = play
      tile.style.setProperty('--p', play.toFixed(4))
      const key = tile.dataset.key
      if (key === 'core') tile.dataset.step = String(Math.min(4, Math.floor(play * 4.4)))
      if (key === 'markets') tile.dataset.stage = String(Math.min(5, Math.floor(play * 5.6)))
      if (key === 'trackers') {
        const dot = tile.querySelector<HTMLElement>(`.${s.token}`)
        const [x, y] = FOLLOW.at(play)
        if (dot) {
          dot.style.left = `${x.toFixed(2)}%`
          dot.style.top = `${((y / 70) * 100).toFixed(2)}%`
        }
      }
    })
  })

  return (
    <div className={s.tiles} ref={host} data-lights>
      {N.tiles.map((t, i) => {
        const Picture = PICTURES[t.key]
        return (
          <a className={`${s.tile} ${kit.lit}`} key={t.key} href={`${landing.docs.href}#${t.to}`} data-key={t.key} data-step="0" data-stage="0" style={{ '--p': 0, '--i': i } as CSSProperties}>
            <p className={s.name}>
              <span>{t.name}</span>
              <Arrow />
            </p>
            <div className={s.picture}>
              <Picture />
            </div>
            <h3 className={s.title}>{t.title}</h3>
            <p className={s.text}>{t.text}</p>
          </a>
        )
      })}
    </div>
  )
}

export function Network() {
  return (
    <Frame
      id="network"
      dwell={0.7}
      label={N.label}
      title={N.title}
      lead={N.lead}
      apart
      aside={
        <a className={`${kit.btn} ${s.more}`} href={landing.docs.href}>
          {N.more}
          <Arrow />
        </a>
      }
    >
      <Tiles />
    </Frame>
  )
}
