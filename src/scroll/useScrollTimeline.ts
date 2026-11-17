/**
 * ScrollController: one pinned, scrubbed GSAP timeline drives everything.
 *  - a proxy tween 0→1 feeds store.target (the 3D scene reads it every frame);
 *  - the DOM interface is animated on the same timeline, so UI and 3D can never drift apart;
 *  - fully reversible: scrolling back plays the same timeline backwards.
 *
 * The story is the first second of the timeline. After it comes the hand-over to the page:
 *  - `--frame` 0→1: the scene draws in to a frame of the page (a rounded card under the header);
 *  - `--covered` 0→1 (wide screens): the first frame of the deck slides up over it, and it draws back.
 * Both are CSS variables on the stage; App.module.css and Interface.module.css turn them into the picture.
 */
import { useLayoutEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { config } from '../config'
import { store } from '../state/store'
import { FINAL_IN, HERO_OUT, syncTitles } from '../ui/titles'
import { content } from '../content'
import { demo } from './demo'
import type { DeckMode } from '../deck/track'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

const PHASES = content.phases

export interface StageState {
  /** The scene has begun to draw in to its frame: the page has taken over from the film. */
  framed: boolean
  /** The first frame of the deck lies over the scene completely. */
  covered: boolean
}

let started = false

export function useScrollTimeline(stage: RefObject<HTMLElement | null>, mode: DeckMode, onState?: (s: StageState) => void) {
  const report = useRef(onState)
  useLayoutEffect(() => {
    report.current = onState
  })

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    if (!started) {
      started = true
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      window.scrollTo(0, 0)
    }

    const ph = config.phases
    // the story lives in the first `storyEnd` of the scroll; the rest is its resting tail
    const k = ph.storyEnd
    // 01 Accepted · 02 Matched · 03 Proven · 04 Settled
    const bounds = [ph.activation[1] * k, ph.decoding[1] * k, ph.disassembly[1] * k, 1.01]
    const num = el.querySelector<HTMLElement>('[data-ui="phase-num"]')
    const name = el.querySelector<HTMLElement>('[data-ui="phase-name"]')
    const fill = el.querySelector<HTMLElement>('[data-ui="phase-fill"]')
    let lastPhase = -1
    const finalFrom = FINAL_IN * k
    // one magnet: let go once the closing section has begun and the scroll glides to its resting point
    const magnets = [{ from: finalFrom - 0.04, to: 1.0001, at: 1 }]

    // the hand-over, in screens and as timeline time (the story is 1)
    const L = config.scroll.lengthScreens
    const H1 = config.scroll.handoffScreens
    const H2 = mode === 'stack' ? 1 : 0
    const total = 1 + (H1 + H2) / L
    const state: StageState = { framed: false, covered: false }

    const ctx = gsap.context(() => {
      const proxy = { p: 0 }
      // ?demo=1: no scrolling, the take drives the same timeline from the scene clock (scroll/demo.ts)
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        paused: demo.on,
        scrollTrigger: demo.on ? undefined : {
          trigger: el,
          start: 'top top',
          end: () => `+=${window.innerHeight * (L + H1 + H2)}`,
          pin: true,
          scrub: config.scroll.scrub,
          snap: {
            // magnets are set in story progress; the trigger also spans the hand-over
            snapTo: (v: number) => {
              const p = v * total
              for (const m of magnets) if (p > m.from && p < m.to) return m.at / total
              return v
            },
            duration: { min: config.scroll.magnetDuration[0], max: config.scroll.magnetDuration[1] },
            delay: 0.12,
            ease: 'power2.inOut',
            inertia: false,
          },
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      tl.to(
        proxy,
        {
          p: 1,
          duration: 1,
          onUpdate: () => {
            store.target = proxy.p
            syncTitles(proxy.p)
            if (fill) fill.style.transform = `scaleY(${proxy.p.toFixed(4)})`
            const i = Math.max(0, bounds.findIndex((b) => proxy.p < b))
            if (i !== lastPhase) {
              lastPhase = i
              if (num) num.textContent = PHASES[i][0]
              if (name) name.textContent = PHASES[i][1]
            }
          },
        },
        0,
      )

      // Hero UI
      // (the hint and the closing extras can be switched off in content.ts: only animate what is there)
      if (el.querySelector('[data-ui="hint"]')) tl.to('[data-ui="hint"]', { autoAlpha: 0, y: 8, duration: 0.04 }, 0.01)
      tl.to('[data-ui="hero"] [data-fade]', { autoAlpha: 0, y: -6, duration: 0.05, stagger: 0.008 }, HERO_OUT * k)
      // Section titles and body copy reveal themselves (Focus Reveal / Fade Up, see ui/titles.ts).
      // Closing extras, once the kept droplet has settled
      if (el.querySelector('[data-ui="final"] [data-fade]')) tl.fromTo('[data-ui="final"] [data-fade]', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.04, stagger: 0.009 }, Math.min(0.955, finalFrom + 0.05))

      // The hand-over: the film becomes a frame of the page, then the page's first frame covers it.
      tl.fromTo(el, { '--frame': 0 }, { '--frame': 1, duration: H1 / L, ease: 'power2.inOut', immediateRender: false }, 1)
      if (H2) tl.fromTo(el, { '--covered': 0 }, { '--covered': 1, duration: H2 / L, immediateRender: false }, 1 + H1 / L)
      tl.eventCallback('onUpdate', () => {
        const t = tl.time()
        const framed = t > 1.0004
        const covered = H2 > 0 && t >= total - 0.0004
        if (framed === state.framed && covered === state.covered) return
        state.framed = framed
        state.covered = covered
        report.current?.({ ...state })
      })
      if (demo.on) demo.tl = tl
    }, el)

    // fonts / layout can shift the pin geometry once loaded
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    document.fonts?.ready.then(onLoad).catch(() => undefined)

    return () => {
      window.removeEventListener('load', onLoad)
      demo.tl = null
      ctx.revert()
      el.style.removeProperty('--frame')
      el.style.removeProperty('--covered')
      report.current?.({ framed: false, covered: false })
    }
  }, [stage, mode])
}

/** Smooth return to the hero; the scrubbed timeline plays the whole transformation in reverse. */
export function restartExperience() {
  gsap.to(window, { scrollTo: { y: 0, autoKill: false }, duration: config.scroll.restartDuration, ease: 'power2.inOut' })
}
