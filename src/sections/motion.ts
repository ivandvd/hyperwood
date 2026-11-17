/**
 * Motion shared by the sections below the hero.
 *  - useScroll: a value that follows the scroll while an element is on screen, written straight to the element
 *    (a CSS variable or a transform), never through React state. One listener and one frame for the whole page.
 *  - useLights: where the pointer is over each slab of a container, for the light that slides along its rim.
 *  - countUp: a figure counts up once (the kit: 600 ms, its curve).
 * Everything rests under prefers-reduced-motion: scroll values jump to their end, lights stay off.
 */
import { useEffect, useRef } from 'react'
import { brandEase } from '../brand/mark'

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches

type Job = () => void
const jobs = new Set<Job>()
let frame = 0
let bound = false
const run = () => {
  frame = 0
  jobs.forEach((job) => job())
}
const kick = () => {
  if (!frame) frame = requestAnimationFrame(run)
}
function bind() {
  if (bound) return
  bound = true
  window.addEventListener('scroll', kick, { passive: true })
  window.addEventListener('resize', kick)
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** How far an element has come, 0 to 1, from its box and the height of the screen. */
export type Measure = (box: DOMRect, screen: number) => number

/** 0 when the element's top is at `from` of the screen height, 1 when it has risen to `to` (0 is the top edge). */
export const entering =
  (from = 1, to = 0.3): Measure =>
  (box, screen) =>
    clamp01((from * screen - box.top) / ((from - to) * screen))

/** 0 when the line at `at` of the screen height meets the element's top, 1 when it meets its bottom. */
export const passing =
  (at = 0.6): Measure =>
  (box, screen) =>
    clamp01((at * screen - box.top) / Math.max(1, box.height))

/** 0 when the element enters at the bottom of the screen, 1 when it has left at the top. */
export const crossing: Measure = (box, screen) => clamp01((screen - box.top) / (screen + box.height))

/**
 * Follows the scroll. `write(p, el)` is called with the measured progress whenever it changes while the
 * element is near the screen, and once more as it leaves, so it always rests on its end value.
 */
export function useScroll<T extends HTMLElement>(measure: Measure, write: (p: number, el: T) => void) {
  const ref = useRef<T>(null)
  const fn = useRef({ measure, write })
  useEffect(() => {
    fn.current = { measure, write }
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
      fn.current.write(1, el)
      return
    }
    bind()
    let last = -1
    const job = () => {
      const p = fn.current.measure(el.getBoundingClientRect(), window.innerHeight)
      if (p === last) return
      last = p
      fn.current.write(p, el)
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) jobs.add(job)
        else jobs.delete(job)
        job()
      },
      { rootMargin: '30% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      jobs.delete(job)
    }
  }, [])

  return ref
}

/**
 * Light on the slabs of a container. Put the ref on the container, give it `data-lights`, and give every slab
 * the kit's `lit` class (passed here as a selector). Fine pointers only.
 */
export function useLights<T extends HTMLElement>(selector: string) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !finePointer()) return
    let x = 0
    let y = 0
    let queued = 0
    const paint = () => {
      queued = 0
      const items = Array.from(el.querySelectorAll<HTMLElement>(selector))
      const boxes = items.map((item) => item.getBoundingClientRect())
      items.forEach((item, i) => {
        item.style.setProperty('--lx', `${(x - boxes[i].left).toFixed(1)}px`)
        item.style.setProperty('--ly', `${(y - boxes[i].top).toFixed(1)}px`)
      })
    }
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!queued) queued = requestAnimationFrame(paint)
    }
    el.addEventListener('pointermove', move, { passive: true })
    return () => {
      el.removeEventListener('pointermove', move)
      cancelAnimationFrame(queued)
    }
  }, [selector])
  return ref
}

/** Counts a figure up to `to` once, writing it into the element. Returns a function that cancels it. */
export function countUp(el: HTMLElement, to: number, format: (v: number) => string = (v) => String(Math.round(v)), ms = 600) {
  if (reducedMotion()) {
    el.textContent = format(to)
    return () => {}
  }
  let id = 0
  let start = 0
  const step = (now: number) => {
    if (!start) start = now
    const p = Math.min(1, (now - start) / ms)
    el.textContent = format(to * brandEase(p))
    if (p < 1) id = requestAnimationFrame(step)
  }
  id = requestAnimationFrame(step)
  return () => cancelAnimationFrame(id)
}
