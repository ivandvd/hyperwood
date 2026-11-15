/**
 * The last beat: the drop becomes the mark.
 * Two parts. While the story darkens, the scroll lets the last drop gather neon from its rim inward, so the
 * eye never loses it. Then a short timeline on the experience clock (not on the scroll, so the brand kit's
 * curve plays as designed) fills the drop and morphs it into the mark; it runs back when the scroll goes back.
 * The globe reports where its last droplet is; the mark (scene/liquid/Mark) is drawn there, inside the scene.
 */
import * as THREE from 'three'
import { config } from '../config'
import { brandEase } from '../brand/mark'
import { smoothstep } from '../utils/math'

export const mark = {
  /** Seconds along the clock timeline: 0 = the gathered drop, `ignite` = a full neon drop, the end = the mark. */
  t: 0,
  on: false,
  /** The mark has taken over from the liquid drop, so the globe stops drawing its droplet. */
  covers: false,
  /** How far the drop has filled with neon (0..1): the scroll's share first, then the clock's. */
  fill: 0,
  /** Morph position after the kit's curve (0 = the drop, 1 = the master). */
  e: 0,
  /** Seconds the mark has been at rest (drives its ambient life). */
  rest: 0,
  /** The last droplet in the world: centre and radius. */
  pos: new THREE.Vector3(),
  radius: 0,
}

const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Advance by `dt` seconds of the experience clock, for the current story progress. */
export function stepMark(dt: number, progress: number) {
  const M = config.mark
  if (progress >= M.at) mark.on = true
  else if (progress < M.undoAt) mark.on = false
  const total = M.ignite + M.morph
  mark.t = mark.on ? Math.min(total, mark.t + dt) : Math.max(0, mark.t - (dt * total) / M.undo)
  const a = Math.min(1, mark.t / M.ignite)
  const gathered = smoothstep(M.gatherFrom, M.at, progress)
  mark.fill = M.gather * gathered + (1 - M.gather) * a * a * (3 - 2 * a)
  mark.covers = mark.t >= M.ignite
  const p = Math.min(1, Math.max(0, (mark.t - M.ignite) / M.morph))
  // reduced motion: the kit shows the resolved mark with no animation
  mark.e = reduced ? (p > 0 ? 1 : 0) : brandEase(p)
  mark.rest = mark.e >= 1 ? mark.rest + dt : 0
}
