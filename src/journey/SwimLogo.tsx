/**
 * The logo at the upper left for the rest of the page (a try: the address &logo=swim, with the films after the hero
 * and the exchange at the right). It is the hero's own logo, the same lockup in the same place and at the same size:
 * it comes with the hero (timeline.ts) and then stays, as the call to action stays at the upper right, so the page
 * keeps the reference's pair at its top (bulk.trade: the logo at the left, the button at the right, on every
 * screen). The hero's own is then not shown (journey.module.css).
 *
 * Its mark swims as the mark swims in the journey on its way to the door (shader.ts, SWIM: a wave 0.13 of half its
 * width high at the tail, a third of that at the head, 1.3 of half its width long), and only while the page is
 * scrolled: the faster the page goes, the fuller the swim, and when it stands the mark settles into the mark. The
 * wave runs back from its head as the page goes down, as a swimmer's does going forward, and the other way as the
 * page goes up. (A logo that never stops draws the eye away from the words; the kit asks that the logo not loop.)
 *
 * The word is the lockup's own, its mark covered; the mark is drawn in a canvas from the master's outline, each
 * point moved by the wave, so the outline stays smooth and, standing, is the mark. Under reduced motion it stands.
 */
import { useEffect, useRef, type Ref } from 'react'
import { BRAND } from '../content.home'
import lockup from '../assets/brand/hyperwood-lockup-neon.svg'
import { fillOutline, markOutline } from '../brand/markOutline'
import s from './swimLogo.module.css'

const NEON = '#ccff00'
/** The canvas is the mark's box with this much room about it, in the mark's heights: up and down (for the wave),
 *  and to either side. (The lockup's mark is 2.2373 of its height wide: swimLogo.module.css.) */
const ROOM = { y: 0.3, x: 0.1, wide: 2.2373 }
/** The swim: the journey's (`wave`, `head`, `length`); how far the wave runs for each pixel the page is scrolled
 *  (radians), and at most how fast (radians a second); how fast the page must go for the full swim (pixels a
 *  second); and how quickly the swim comes and goes (seconds). */
const SWIM = { wave: 0.13, head: 0.35, length: 1.3, perPixel: 0.0055, fastest: 9, full: 700, come: 0.1, go: 0.45 }

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function SwimLogo({ ref }: { ref: Ref<HTMLAnchorElement> }) {
  const link = useRef<HTMLAnchorElement | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    const a = link.current
    if (!c || !ctx || !a) return
    // (the outline at three points a curve: at the logo's size as smooth as seven, and less than half the work)
    const P = markOutline(3)
    const count = P.length / 2
    const moved = new Float32Array(P.length)
    // What does not change from one picture to the next, for each point: how high the wave is there (the full
    // height at the tail, a third of it at the head), and the sine and cosine of where it is along the wave. A
    // picture is then sin(a + phase) = sin a cos phase + cos a sin phase, with no sine to take for each point.
    const reach = new Float32Array(count)
    const sinA = new Float32Array(count)
    const cosA = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = P[i * 2]
      reach[i] = SWIM.wave * (1 + (SWIM.head - 1) * smooth(-1, 1, x))
      sinA[i] = Math.sin((x * Math.PI * 2) / SWIM.length)
      cosA[i] = Math.cos((x * Math.PI * 2) / SWIM.length)
    }
    const calm = matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let phase = 0
    let high = 0
    let speed = 0
    let lastY = scrollY
    let lastT = 0
    /** what the last picture was drawn with (a picture that would not differ by a hair is not drawn again) */
    let drawn = { phase: NaN, high: NaN, w: 0, h: 0 }
    /** The canvas laid on the screen's own pixels (`laid`): its corners on whole pixels of the screen, at the
     *  screen's own pixel ratio, so its picture is never stretched or shifted by a part of a pixel (it was, and the
     *  mark looked bolder than the word beside it, and soft on a phone); and where the mark's middle falls in it and
     *  how wide it is, to a part of a pixel, exactly where the lockup has its own. */
    let laid = { w: 1, h: 1, cx: 0, cy: 0, S: 1 }
    const lay = () => {
      const dpr = Math.min(3, devicePixelRatio || 1)
      const box = a.getBoundingClientRect()
      const L = box.height
      // (the room about the mark, on the screen, and the screen's pixels it covers)
      const x0 = Math.floor((box.left - ROOM.x * L) * dpr)
      const y0 = Math.floor((box.top - ROOM.y * L) * dpr)
      const x1 = Math.ceil((box.left + (ROOM.wide + ROOM.x) * L) * dpr)
      const y1 = Math.ceil((box.top + (1 + ROOM.y) * L) * dpr)
      const w = Math.max(1, x1 - x0)
      const h = Math.max(1, y1 - y0)
      c.style.left = `${x0 / dpr - box.left}px`
      c.style.top = `${y0 / dpr - box.top}px`
      c.style.width = `${w / dpr}px`
      c.style.height = `${h / dpr}px`
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
      }
      // (the lockup's mark is its first 2.2373 heights across and its whole height: its middle, and half its width)
      laid = { w, h, cx: (box.left + (ROOM.wide / 2) * L) * dpr - x0, cy: (box.top + L / 2) * dpr - y0, S: (ROOM.wide / 2) * L * dpr }
      drawn = { ...drawn, w: 0 }
    }

    const draw = () => {
      const { w, h, cx, cy, S } = laid
      // (the most a point moves between this picture and the last, in the canvas's pixels)
      const change = (Math.abs(high - drawn.high) + high * Math.abs(phase - drawn.phase)) * SWIM.wave * S
      if (w === drawn.w && h === drawn.h && change < 0.05) return
      drawn = { phase, high, w, h }
      const sp = Math.sin(phase)
      const cp = Math.cos(phase)
      for (let i = 0; i < count; i++) {
        const wave = high * reach[i] * (sinA[i] * cp + cosA[i] * sp)
        moved[i * 2] = cx + P[i * 2] * S
        moved[i * 2 + 1] = cy - (P[i * 2 + 1] - wave) * S
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = NEON
      fillOutline(ctx, moved)
    }

    const frame = (now: number) => {
      raf = 0
      const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 1 / 60
      lastT = now
      const y = scrollY
      const dy = y - lastY
      lastY = y
      // (how fast the page goes, a little smoothed; the swim follows it, coming quickly and going slowly)
      speed += (dy / dt - speed) * Math.min(1, dt / 0.08)
      const wanted = Math.min(1, Math.abs(speed) / SWIM.full)
      high += (wanted - high) * (1 - Math.exp(-dt / (wanted > high ? SWIM.come : SWIM.go)))
      phase += Math.max(-SWIM.fastest * dt, Math.min(SWIM.fastest * dt, dy * SWIM.perPixel))
      if (high < 0.002 && Math.abs(speed) < 1) {
        // (settled: the mark, and nothing more to do until the page moves)
        high = 0
        speed = 0
        lastT = 0
        draw()
        return
      }
      draw()
      raf = requestAnimationFrame(frame)
    }
    const scrolled = () => {
      // (not while it is not shown: before the hero, timeline.ts keeps it out of sight)
      if (raf || calm.matches || document.hidden || Number(a.style.opacity || 0) < 0.01) {
        if (!raf) lastY = scrollY
        return
      }
      raf = requestAnimationFrame(frame)
    }
    // (laid again whenever the window or its pixel ratio changes: the logo's place and size go by the width)
    const relay = () => {
      lay()
      if (!raf) draw()
    }
    let ratio = matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
    const reratio = () => {
      ratio.removeEventListener('change', reratio)
      ratio = matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
      ratio.addEventListener('change', reratio)
      relay()
    }
    ratio.addEventListener('change', reratio)
    addEventListener('resize', relay)
    addEventListener('scroll', scrolled, { passive: true })
    lay()
    draw()
    return () => {
      ratio.removeEventListener('change', reratio)
      removeEventListener('resize', relay)
      removeEventListener('scroll', scrolled)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <a
      ref={(node) => {
        link.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className={s.logo}
      href="#top"
      aria-label={`${BRAND} home`}
      inert
    >
      <img className={s.word} src={lockup} alt="" />
      <canvas ref={canvas} className={s.swim} aria-hidden="true" />
    </a>
  )
}
