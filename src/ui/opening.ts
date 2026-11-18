/**
 * The opening: what is on screen while the page gets ready, and how the page is then uncovered.
 *
 * Its elements and styles are in the page itself (index.html), so the page is Ink and the Hyperwood mark is
 * already filling from the very first paint, before this file has arrived. What is here decides how far the
 * mark goes and when the cover comes down:
 *
 *  - the mark fills in movements the browser runs by itself (config.opening.fill). The first is under way
 *    when this runs: brisk, then creeping for as long as the page takes to arrive. How the mark then comes
 *    full is the page's choice (`finish`):
 *      'run' (the landing page): when what the page opens on is whole, the first movement is stopped where
 *      it stands and one movement runs on from there to the full mark, leaving at the speed the first had and
 *      easing out. So the mark fills in one sweep. (Until 2026-11-18 it filled as the earlier page's does,
 *      below: on a quick load the first movement had crept to a tenth or a fifth of the mark when the last
 *      closed all the rest in under half a second. It read as a stall and then a rush.)
 *      'close' (the earlier page, classic.html): a second movement starts when what the page opens on
 *      exists, and a last one closes whatever is left once that is whole; the three add up.
 *    Then the cover goes. On the landing page it fades with the mark, and the page's words come into focus
 *    where the mark stood. On the earlier page it sinks: a wave runs down the screen as its lit edge. That
 *    page asks for the wave with `data-crest` on its cover;
 *  - on the earlier page a small figure says the same in numbers (the landing page has none).
 *
 * Nothing here moves anything frame by frame. Each movement is handed to the browser whole, as an animation of
 * transform, and the browser runs those on its own thread: while the page is busy starting up the mark keeps
 * filling evenly. That is the point of the arrangement.
 *
 * What "exists", "whole" and "runs evenly" mean is the page's own business: it says so through an
 * OpeningSource (the journey of the landing page: journey/timeline.ts; the earlier hero: hero/heroOpening.ts).
 */
import { config } from '../config'
import { milestone } from '../utils/milestone'

export interface OpeningSource {
  /** Asked once a frame while the opening is up: how far has what is behind it got?
   *  `scene`: it exists (the second movement starts). `whole`: all of it is there (the last movement starts).
   *  `settled`: it runs evenly (the cover may go as soon as the mark is full). */
  poll(now: number): { scene: boolean; whole: boolean; settled: boolean }
  /** The cover starts to go: the page may show what is its own. */
  opened?(reduced: boolean): void
}

type Curve = readonly [number, number, number, number]

/** A CSS cubic-bezier as a function: progress of the movement at a share `x` of its time. */
function bezier([x1, y1, x2, y2]: Curve) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const X = (t: number) => ((ax * t + bx) * t + cx) * t
  const Y = (t: number) => ((ay * t + by) * t + cy) * t
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    let t = x
    for (let i = 0; i < 40; i++) {
      const e = X(t) - x
      if (Math.abs(e) < 1e-7) break
      if (e > 0) hi = t
      else lo = t
      t = (lo + hi) / 2
    }
    return Y(t)
  }
}

/** The wave that tops a cover that sinks (classic.html): one screen long, repeated once so it can run
 *  sideways without a seam. */
function crest() {
  const NS = 'http://www.w3.org/2000/svg'
  const W = 2000
  const H = 72
  let line = ''
  for (let x = 0; x <= W; x += 10) {
    const t = (x / 1000) * Math.PI * 2
    const y = 36 + 15 * Math.sin(t + 0.4) + 8 * Math.sin(2 * t + 1.9) + 4 * Math.sin(3 * t + 0.2)
    line += `${x ? 'L' : 'M'}${x},${y.toFixed(2)}`
  }
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('class', 'op-crest')
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
  svg.setAttribute('preserveAspectRatio', 'none')
  // the Ink under the wave; then the wave three times over: a wide breath of light, a closer one, the line
  for (const [d, name] of [
    [`${line}L${W},${H}L0,${H}Z`, ''],
    [line, 'op-halo'],
    [line, 'op-glow'],
    [line, ''],
  ]) {
    const path = document.createElementNS(NS, 'path')
    path.setAttribute('d', d)
    if (name) path.setAttribute('class', name)
    svg.appendChild(path)
  }
  return svg
}

/** Height of one figure of the counter, px (index.html, .op-win). */
const ROW = 16

export interface OpeningWay {
  /** How the mark comes full once the page is whole: in one run from where it stands, or by a last movement
   *  that closes whatever is left (see the head of this file). */
  finish?: 'run' | 'close'
}

export function startOpening(source: OpeningSource, { finish = 'close' }: OpeningWay = {}) {
  const el = document.getElementById('opening')
  if (!el) return
  const O = config.opening
  const F = O.fill
  const html = document.documentElement
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const find = (name: string) => el.querySelector<HTMLElement>(name)
  const first = find('.op-a')
  const second = find('.op-b')
  const last = find('.op-c')
  const strip = find('.op-strip')
  const moves = !reduced && typeof el.animate === 'function'
  /** The page's own clock, the one its animations run on (ms). */
  const clock = () => (document.timeline?.currentTime as number | null) ?? performance.now()

  // (the wave only where the page's cover asks for it: the landing page's cover fades and has none)
  const cover = find('.op-cover')
  if (!reduced && cover?.hasAttribute('data-crest')) cover.prepend(crest())
  if (strip) {
    strip.textContent = Array.from({ length: 101 }, (_, i) => i).join('\n')
    // the figure is shown once its typeface is there, so it never changes shape in view
    const type = () => el.setAttribute('data-type', '')
    if (document.fonts?.load) document.fonts.load("400 11px 'IBM Plex Mono'").then(type, type)
    else type()
  }

  /* ------------------------------------------------------------------ how far the mark is filled */
  /** The first movement, as the page's own styles have started it. */
  const A = finish === 'run' ? O.flow.first : F.first
  const eFirst = bezier(A.ease)
  const eScene = bezier(F.scene.ease)
  const eDone = bezier(F.done.ease)
  /** When each movement began, on the page's clock (-1: not yet). */
  let tFirst = clock()
  let tScene = -1
  let tDone = -1
  /** The share of the mark that is filled at `t`: what the three movements make together. */
  const filled = (t: number) => {
    const a = A.share * eFirst((t - tFirst) / (A.seconds * 1000))
    const b = tScene < 0 ? 0 : F.scene.share * eScene((t - tScene) / (F.scene.seconds * 1000))
    const c = tDone < 0 ? 0 : eDone((t - tDone) / (F.done.seconds * 1000))
    return 1 - (1 - a - b) * (1 - c)
  }

  /** The figure follows the mark. It is one column of figures behind a window, and it moves a row at a time:
   *  the rows and their moments are worked out here from the same curves and given to the browser as one
   *  animation, so it steps by itself. Worked out again whenever a movement starts. */
  let counting: Animation | null = null
  const count = () => {
    if (!strip || !moves) return
    const now = clock()
    const end = Math.max(tFirst + A.seconds * 1000, tScene < 0 ? 0 : tScene + F.scene.seconds * 1000, tDone < 0 ? 0 : tDone + F.done.seconds * 1000)
    const at = (n: number) => `translate3d(0, ${-n * ROW}px, 0)`
    const figure = (t: number) => Math.min(100, Math.floor(100 * filled(t) + 1e-4))
    let n = figure(now)
    const span = Math.max(1, end - now)
    const frames: Keyframe[] = [{ offset: 0, transform: at(n), easing: 'steps(1, end)' }]
    for (let t = now + 2; t < end; t += 2) {
      const v = figure(t)
      if (v > n) {
        n = v
        frames.push({ offset: (t - now) / span, transform: at(n), easing: 'steps(1, end)' })
      }
    }
    frames.push({ offset: 1, transform: at(figure(Math.max(now, end))) })
    const next = strip.animate(frames, { duration: span, fill: 'forwards' })
    next.startTime = now
    counting?.cancel()
    counting = next
  }

  /** One movement, handed to the browser whole. */
  const play = (node: HTMLElement | null, frames: Keyframe[], seconds: number, ease: Curve, at: number) => {
    if (!node || !moves) return
    node.animate(frames, { duration: seconds * 1000, easing: `cubic-bezier(${ease.join(',')})`, fill: 'forwards' }).startTime = at
  }

  // the first movement was started by the page itself, with its first paint: when was that?
  const began = moves ? first?.getAnimations()[0] : undefined
  if (began) {
    if (typeof began.startTime === 'number') tFirst = began.startTime
    else
      began.ready
        .then(() => {
          if (typeof began.startTime === 'number') tFirst = began.startTime
          count()
        })
        .catch(() => undefined)
  }
  count()

  /**
   * The mark comes full in one run (`finish: 'run'`). The first movement is stopped where it stands, and one
   * movement takes the dim block on from there until it has left the mark. It leaves at the speed the first
   * had at that moment, so nothing changes pace where the one takes over, and it eases out. It is one
   * animation, handed to the browser whole like the others. Gives how long it takes (seconds).
   */
  const runOn = (now: number) => {
    if (!moves) return 0
    const at = (t: number) => A.share * eFirst((t - tFirst) / (A.seconds * 1000))
    // (the first movement is held at this very moment of the page's clock: where it is said to stand is where
    // it stands)
    if (began) {
      began.pause()
      began.currentTime = now - tFirst
    }
    const from = at(now)
    const perSecond = (at(now + 8) - at(now - 8)) / 0.016
    const left = 1 - from
    const seconds = O.flow.run.base + O.flow.run.per * left
    // a curve that leaves at that speed: its first handle lies on the line of that speed
    const [x1, x2] = O.flow.run.ease
    const y1 = Math.max(0, Math.min(0.92, ((perSecond * seconds) / left) * x1))
    // (the block is a little wider than the mark: it runs on until all of it is out)
    play(second, [{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(${(left * 100 + 4).toFixed(2)}%, 0, 0)` }], seconds, [x1, y1, x2, 1], now)
    return seconds
  }

  /* ------------------------------------------------------------------ when the page may be shown */
  let openAt = Infinity

  const open = () => {
    delete html.dataset.opening
    el.style.pointerEvents = 'none'
    el.dataset.state = 'open'
    source.opened?.(reduced)
    window.setTimeout(
      () => {
        el.dataset.state = 'gone'
        el.replaceChildren()
      },
      reduced ? 400 : 1500,
    )
  }

  const tick = (now: number) => {
    const at = source.poll(now)
    // what the page opens on exists: the second movement (where the mark fills in three)
    if (tScene < 0 && at.scene && finish === 'close') {
      tScene = clock()
      milestone('scene')
      play(second, [{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(${F.scene.share * 100}%, 0, 0)` }], F.scene.seconds, F.scene.ease, tScene)
      count()
    }
    // it is whole: the mark comes full, in one run from where it stands or by a last movement that closes
    // what is left
    if (tDone < 0 && at.whole) {
      tDone = clock()
      milestone('ready')
      let seconds: number = F.done.seconds
      if (finish === 'run') seconds = runOn(tDone)
      else play(last, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], F.done.seconds, F.done.ease, tDone)
      count()
      openAt = moves ? Math.max(tDone + (seconds + F.hold) * 1000, tFirst + O.minShow * 1000) : tDone
    }
    // ...and the cover goes once the mark is full and what is behind it runs evenly
    if (tDone >= 0 && at.settled && clock() >= openAt) {
      open()
      return
    }
    requestAnimationFrame(tick)
  }
  // (there is one opening per page load, and it ends by itself)
  requestAnimationFrame(tick)
}
