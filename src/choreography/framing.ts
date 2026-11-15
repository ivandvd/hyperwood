/**
 * World-space framing helpers shared by the camera and the lights.
 * The choreography works in sphere-local units; the world is that × sphere.worldScale.
 */
import { config } from '../config'
import { lerp, smoothstep } from '../utils/math'

export const WORLD_SCALE = config.sphere.worldScale

/** World centre of the final composition. */
export function phraseWorldCenter(): [number, number, number] {
  const c = config.phrase.center
  return [c[0] * WORLD_SCALE, c[1] * WORLD_SCALE, c[2] * WORLD_SCALE]
}

/** Share of the viewport width the reference piece spans in the final frame: larger on tall screens. */
export function finalScreenShare(aspect: number): number {
  const { keyScreenWidth, keyScreenWidthTall, tallBlend } = config.phrase
  return lerp(keyScreenWidth, keyScreenWidthTall, smoothstep(tallBlend[0], tallBlend[1], aspect))
}

/** Camera distance (from the final plane) so one reference piece spans its share of the viewport width. */
export function finalCameraDistance(aspect: number, fov = config.camera.final.fov): number {
  const keyWidth = 2 * config.sphere.keyScale * WORLD_SCALE
  const visibleWidthPerUnit = 2 * Math.tan((fov * Math.PI) / 360) * aspect
  return keyWidth / (finalScreenShare(aspect) * visibleWidthPerUnit) + keyWidth * 0.6
}

/** Tall screens: the factor on tan(fov / 2) that keeps the resting globe inside the viewport width (1 on wide screens). */
export function lensWiden(aspect: number): number {
  return Math.max(1, config.camera.tall.fitAspect / aspect)
}

/** A field of view (degrees) widened by the `lensWiden` factor. */
export function widenFov(fov: number, widen: number): number {
  return widen === 1 ? fov : (Math.atan(Math.tan((fov * Math.PI) / 360) * widen) * 360) / Math.PI
}

/** Final width of the mark as a share of the viewport width: larger on tall screens. */
export function markScreenShare(aspect: number): number {
  const { share, shareTall } = config.mark
  const { tallBlend } = config.phrase
  return lerp(share, shareTall, smoothstep(tallBlend[0], tallBlend[1], aspect))
}

/** World radius the last droplet settles to: on screen it is then exactly the drop the mark is morphed from. */
export function keptFinalRadius(aspect: number, fov = config.camera.final.fov): number {
  const A = config.mark.art
  // the drop’s radius as a share of the viewport width, then that share of what the final camera sees
  const share = (markScreenShare(aspect) * A.dropRadius * A.dropScale) / A.width
  return share * 2 * Math.tan((fov * Math.PI) / 360) * aspect * finalCameraDistance(aspect, fov)
}
