/**
 * The deck: the page below the hero is a short stack of frames, each the size of the screen. The hero's scene
 * contracts into the first of them, and every later frame slides up over the one before, which draws back
 * and dims. While a frame is on top it is held for a stretch of scroll, and its picture follows that scroll,
 * the way the hero's scene does.
 *
 * CSS lays a frame out (deck.module.css): a tall track, a sticky screen inside it, the card in that.
 * This file measures the three movements of every track and hands them to whoever draws the frame:
 *   arrive  0 to 1 while the frame slides up into place
 *   dwell   0 to 1 while it is held and its picture plays
 *   cover   0 to 1 while the next frame slides over it
 * The values are eased towards the scroll (the hero's scrub does the same), so a step of the wheel reads as
 * movement and not as a jump. One scroll listener and one frame loop serve the whole page.
 *
 * Two modes, one switch (the `data-deck` attribute on <html>, set here and read by the CSS):
 *   stack  wide screens: the frames pin and stack as described
 *   flow   phones, upright or small windows, reduced motion: ordinary blocks, one under another. A picture
 *          plays as its frame crosses the screen; under reduced motion it simply shows its end state.
 */
import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react'

export type DeckMode = 'stack' | 'flow'
export interface Progress {
  arrive: number
  dwell: number
  cover: number
}

const STACK = '(min-width: 900px) and (min-height: 540px) and (min-aspect-ratio: 5/4)'
const REDUCED = '(prefers-reduced-motion: reduce)'
const query = (q: string) => (typeof matchMedia === 'function' ? matchMedia(q) : null)

let mode: DeckMode = 'flow'
let still = false
const modeFns = new Set<() => void>()

/** Reads the screen, sets the mode on <html> and keeps it current. Call once, before the first render. */
export function initDeck() {
  const apply = () => {
    still = !!query(REDUCED)?.matches
    const next: DeckMode = query(STACK)?.matches && !still ? 'stack' : 'flow'
    const changed = next !== mode || document.documentElement.dataset.deck !== next
    mode = next
    document.documentElement.dataset.deck = next
    if (changed) {
      tracks.forEach((t) => (t.fresh = true))
      modeFns.forEach((fn) => fn())
      kick()
    }
  }
  apply()
  query(STACK)?.addEventListener('change', apply)
  query(REDUCED)?.addEventListener('change', apply)
}

export const deckMode = () => mode
/** Motion is switched off for this visitor: pictures show their end state. */
export const deckStill = () => still

const subscribeMode = (fn: () => void) => {
  modeFns.add(fn)
  return () => {
    modeFns.delete(fn)
  }
}
export function useDeckMode(): DeckMode {
  return useSyncExternalStore(subscribeMode, deckMode, () => 'flow' as DeckMode)
}

/* ------------------------------------------------------------------ the engine */

/** How long a value takes to close most of its distance to the scroll (seconds). */
const SMOOTH = 0.22
const KEYS = ['arrive', 'dwell', 'cover'] as const

interface Track {
  el: HTMLElement
  /** Screens of scroll the frame is held for. */
  dwell: number
  /** The last frame of the deck is never covered. */
  last: boolean
  want: Progress
  now: Progress
  fns: Set<(p: Progress) => void>
  near: boolean
  /** Not measured yet (or the mode changed): take the measured values at once, without easing from zero. */
  fresh: boolean
}

const tracks = new Set<Track>()
let frame = 0
let stamp = 0
let dirty = true
let bound = false

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function measure(t: Track) {
  const w = t.want
  if (still) {
    w.arrive = 1
    w.dwell = 1
    w.cover = 0
    return
  }
  const box = t.el.getBoundingClientRect()
  const vh = window.innerHeight
  if (mode === 'stack') {
    w.arrive = clamp01(1 - box.top / vh)
    w.dwell = t.dwell > 0 ? clamp01(-box.top / (t.dwell * vh)) : box.top <= 0 ? 1 : 0
    w.cover = t.last ? 0 : clamp01((-box.top - t.dwell * vh) / vh)
  } else {
    // an ordinary block: it has arrived when its top is well inside the screen, and its picture plays while
    // the block travels from there until its lower part reaches the middle of the screen
    w.arrive = clamp01((vh - box.top) / (vh * 0.5))
    w.dwell = clamp01((vh * 0.7 - box.top) / Math.max(1, box.height * 0.62))
    w.cover = 0
  }
}

function tick(now: number) {
  frame = 0
  const dt = stamp ? Math.min(0.1, (now - stamp) / 1000) : 0.016
  stamp = now
  const k = 1 - Math.exp(-dt / SMOOTH)
  let moving = false
  tracks.forEach((t) => {
    if (!t.near && !t.fresh) return
    if (dirty || t.fresh) measure(t)
    let changed = t.fresh
    for (const key of KEYS) {
      const d = t.want[key] - t.now[key]
      if (d === 0) continue
      if (t.fresh || Math.abs(d) < 0.0005) t.now[key] = t.want[key]
      else {
        t.now[key] += d * k
        moving = true
      }
      changed = true
    }
    t.fresh = false
    if (changed) t.fns.forEach((fn) => fn(t.now))
  })
  dirty = false
  if (moving) frame = requestAnimationFrame(tick)
  else stamp = 0
}

function kick() {
  dirty = true
  if (!frame && typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick)
}

function bind() {
  if (bound) return
  bound = true
  window.addEventListener('scroll', kick, { passive: true })
  window.addEventListener('resize', kick)
}

export interface TrackApi {
  /** Called with the three movements whenever one of them changes, and once straight away. */
  subscribe(fn: (p: Progress) => void): () => void
  get(): Progress
}

/** Registers an element as a track. The returned ref goes on the track element. */
export function useTrack<T extends HTMLElement>(dwell: number, last = false) {
  const ref = useRef<T>(null)
  const state = useRef<Track | null>(null)
  const api = useRef<TrackApi>({
    subscribe(fn) {
      const t = state.current
      if (!t) return () => {}
      t.fns.add(fn)
      fn(t.now)
      return () => {
        t.fns.delete(fn)
      }
    },
    get: () => state.current?.now ?? { arrive: 0, dwell: 0, cover: 0 },
  })

  // registered before the children's effects run, so they can subscribe on their first pass
  if (!state.current) {
    state.current = { el: null as unknown as HTMLElement, dwell, last, want: { arrive: 0, dwell: 0, cover: 0 }, now: { arrive: 0, dwell: 0, cover: 0 }, fns: new Set(), near: false, fresh: true }
  }

  useEffect(() => {
    const el = ref.current
    const t = state.current
    if (!el || !t) return
    t.el = el
    t.dwell = dwell
    t.last = last
    t.fresh = true
    tracks.add(t)
    bind()
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              t.near = entry.isIntersecting
              // on the way out, one more measure so the values rest on their ends
              t.fresh = true
              kick()
            },
            { rootMargin: '25% 0px' },
          )
    if (io) io.observe(el)
    else t.near = true
    kick()
    return () => {
      io?.disconnect()
      tracks.delete(t)
    }
  }, [dwell, last])

  return [ref, api.current] as const
}

/**
 * Where to scroll so that a part of the page is shown at rest. For a frame of the deck in stack mode that is
 * the end of its dwell: the frame on top, its picture played. For anything else, its top under the header.
 */
export function restingScroll(el: HTMLElement) {
  const top = el.getBoundingClientRect().top + window.scrollY
  const dwell = parseFloat(el.style.getPropertyValue('--dwell'))
  if (!Number.isNaN(dwell)) {
    if (mode === 'stack') return Math.round(top + dwell * window.innerHeight)
    return Math.round(top - headerHeight() + 1)
  }
  return Math.round(top - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0))
}
const headerHeight = () => document.querySelector('header')?.getBoundingClientRect().height ?? 0

export const FrameContext = createContext<TrackApi | null>(null)

/** Inside a frame: follow its three movements. The callback writes straight to the DOM, never to React state. */
export function useProgress(fn: (p: Progress) => void) {
  const api = useContext(FrameContext)
  const latest = useRef(fn)
  useEffect(() => {
    latest.current = fn
  })
  useEffect(() => api?.subscribe((p) => latest.current(p)), [api])
}

/** A stretch of a 0 to 1 value, itself 0 to 1: `part(v, 0.2, 0.6)` runs from 0 at 0.2 to 1 at 0.6. */
/** Runs `fn` once the opening has let the page go (index.html marks <html> with data-opening until then), or
 *  at once where there is no opening. Before that the page is not yet as long as it will be (the hero has not
 *  taken its scroll), so "is this near the screen?" cannot be asked. Returns a way to call it off. */
export function afterOpening(fn: () => void) {
  const html = document.documentElement
  const up = () => 'opening' in html.dataset
  if (!up()) {
    fn()
    return () => undefined
  }
  const watch = new MutationObserver(() => {
    if (up()) return
    watch.disconnect()
    fn()
  })
  watch.observe(html, { attributes: true, attributeFilter: ['data-opening'] })
  return () => watch.disconnect()
}

export const part = (v: number, from: number, to: number) => clamp01((v - from) / (to - from))
/** The same with a soft start and a soft stop. */
export const ease = (v: number) => v * v * (3 - 2 * v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
