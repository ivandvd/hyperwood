/**
 * The mark on a card, as the second reference has its own logo beside its markets (hyperliquid's: its logo moving
 * in a rounded tile). Here the card is a little wider than tall, and the mark on it is the mark, swimming as it swims in the journey on
 * its way to the door (shader.ts, SWIM): its body waves, the wave running back from its head to its tail and wider
 * towards its tail, as a swimmer's does, at the journey's own measure (a wave 0.13 of half its width high at the
 * tail, a third of that at the head, 1.3 of half its width long); and it rides a little up and down as it goes.
 *
 * Drawn in a canvas: the master's outline (its 98 curves, followed closely), each point of it moved by the wave,
 * which is broad and smooth, so the outline stays smooth and the mark is always the mark.
 *
 * It moves only while it is on screen and the page is shown; under reduced motion it stands, as the mark.
 */
import { useEffect, useRef, type Ref } from 'react'
import { fillOutline, markOutline } from '../brand/markOutline'

/** How much of the card's width the mark takes (the mark is 2 wide in its own units). */
const WIDE = 0.7
/** The swim: as the journey's (shader.ts, SWIM: how high the wave is at the tail, what share of that at the head, how
 *  long a wave is), how fast the wave runs back along the body (radians a second), how its height swells and eases
 *  over a few seconds, and how far and how slowly the mark rides up and down. */
const SWIM = { wave: 0.13, head: 0.35, length: 1.3, speed: 4.4, breathe: 0.15, breatheSpeed: 0.7, ride: 0.045, rideSpeed: 1.1 }
const INK = '#0a0a0a'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function MarkTile({ className, ref }: { className?: string; ref?: Ref<HTMLDivElement> }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const P = markOutline()
    const count = P.length / 2
    const moved = new Float32Array(P.length)
    const calm = matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let seen = false
    const began = performance.now()
    let last = 0

    /** The mark swimming at `time` (s); `still`: standing, as the mark. */
    const draw = (time: number, still = false) => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      const w = Math.max(1, Math.round(c.clientWidth * dpr))
      const h = Math.max(1, Math.round(c.clientHeight * dpr))
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
      }
      const S = (w * WIDE) / 2
      const high = still ? 0 : SWIM.wave * (1 - SWIM.breathe + SWIM.breathe * Math.sin(time * SWIM.breatheSpeed))
      const ride = still ? 0 : SWIM.ride * Math.sin(time * SWIM.rideSpeed)
      for (let i = 0; i < count; i++) {
        const x = P[i * 2]
        // (the wave, as the journey's: wider towards the tail, running back from the head)
        const wave = high * (1 + (SWIM.head - 1) * smooth(-1, 1, x)) * Math.sin((x * Math.PI * 2) / SWIM.length + time * SWIM.speed)
        moved[i * 2] = w / 2 + x * S
        moved[i * 2 + 1] = h / 2 - (P[i * 2 + 1] - wave + ride) * S
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = INK
      fillOutline(ctx, moved)
    }

    const may = () => seen && !document.hidden && !calm.matches
    const frame = (now: number) => {
      raf = 0
      last = (now - began) / 1000
      draw(last)
      if (may()) raf = requestAnimationFrame(frame)
    }
    /** (standing: the mark under reduced motion; otherwise as it was) */
    const stand = () => draw(last, calm.matches)
    const update = () => {
      if (may()) {
        if (!raf) raf = requestAnimationFrame(frame)
      } else {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        stand()
      }
    }
    const watch = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting
      update()
    })
    watch.observe(c)
    const sized = new ResizeObserver(() => {
      if (!raf) stand()
    })
    sized.observe(c)
    document.addEventListener('visibilitychange', update)
    calm.addEventListener('change', update)
    stand()
    return () => {
      watch.disconnect()
      sized.disconnect()
      document.removeEventListener('visibilitychange', update)
      calm.removeEventListener('change', update)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className={className} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  )
}
