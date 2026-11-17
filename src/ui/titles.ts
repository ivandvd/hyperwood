/**
 * Title choreography.
 *  - Inside the pinned hero, each title plays its reveal when its part of the story is on screen and reverses
 *    when it leaves. That is driven from the scroll timeline (syncTitles) plus the loader (setTitlesReady), so
 *    the hero title waits until the scene is actually visible.
 *  - Below the hero, a section's titles play once, when the section comes into view (playTitles).
 */
import { config } from '../config'
import { store } from '../state/store'
import { demo } from '../scroll/demo'

/** 'hero' and 'final' live in the pinned hero; every other name belongs to a section below it. */
export type TitleGroup = string
interface Ctl {
  play(): void
  reverse(): void
}

const groups = new Map<TitleGroup, Set<Ctl>>()
const shown = new Map<TitleGroup, boolean>()
let ready = false
let last = 0

export function registerTitle(group: TitleGroup, ctl: Ctl) {
  let set = groups.get(group)
  if (!set) {
    set = new Set()
    groups.set(group, set)
  }
  set.add(ctl)
  if (shown.get(group)) ctl.play()
  return () => {
    groups.get(group)?.delete(ctl)
  }
}

function show(group: TitleGroup, on: boolean) {
  if ((shown.get(group) ?? false) === on) return
  shown.set(group, on)
  groups.get(group)?.forEach((c) => (on ? c.play() : c.reverse()))
}

/** Where the hero copy leaves and the closing copy arrives, in raw scroll progress. */
export const HERO_OUT = 0.7
export const FINAL_IN = 0.895

/** The hero's two groups follow the scroll: these windows match the UI fades in useScrollTimeline. */
export function syncTitles(p: number) {
  last = p
  if (!ready) return
  const k = config.phases.storyEnd
  show('hero', p < HERO_OUT * k)
  show('final', p >= FINAL_IN * k)
}

/** A section below the hero has come into view: its titles play, once. */
export function playTitles(group: TitleGroup) {
  show(group, true)
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
