/**
 * Title choreography: each section's H1 plays its Focus Reveal when the section is on screen and
 * reverses when it leaves. Driven from the scroll timeline (syncTitles) plus the loader (setTitlesReady),
 * so the hero title waits until the scene is actually visible.
 */
import { config } from '../config'
import { store } from '../state/store'
import { demo } from '../scroll/demo'

export type TitleGroup = 'hero' | 'final'
interface Ctl {
  play(): void
  reverse(): void
}

const groups: Record<TitleGroup, Set<Ctl>> = { hero: new Set(), final: new Set() }
const shown: Record<TitleGroup, boolean> = { hero: false, final: false }
let ready = false
let last = 0

export function registerTitle(group: TitleGroup, ctl: Ctl) {
  groups[group].add(ctl)
  if (shown[group]) ctl.play()
  return () => {
    groups[group].delete(ctl)
  }
}

/** Where the hero copy leaves and the closing copy arrives, in raw scroll progress. */
export const HERO_OUT = 0.7
export const FINAL_IN = 0.895

/** Visibility windows in raw scroll progress: they match the UI fades in useScrollTimeline. */
function windows(p: number): Record<TitleGroup, boolean> {
  const k = config.phases.storyEnd
  return {
    hero: p < HERO_OUT * k,
    final: p >= FINAL_IN * k,
  }
}

export function syncTitles(p: number) {
  last = p
  if (!ready) return
  const vis = windows(p)
  ;(Object.keys(groups) as TitleGroup[]).forEach((g) => {
    if (vis[g] === shown[g]) return
    shown[g] = vis[g]
    groups[g].forEach((c) => (vis[g] ? c.play() : c.reverse()))
  })
}

export function setTitlesReady() {
  if (ready) return
  ready = true
  if (demo.on) {
    demo.start = store.time
    ;(window as unknown as { __hyperwoodDemo: typeof demo }).__hyperwoodDemo = demo
  }
  syncTitles(last)
}
