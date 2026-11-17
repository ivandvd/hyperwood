/**
 * How the last drop becomes the mark.
 *  - 'draw': the drop sits in the mark's first lobe and pours out along it, drawing the mark from one end to
 *    the other (scene/liquid/Mark + brand/flow).
 *  - 'morph': the brand kit's morph, where the whole outline changes at once (brand/mark).
 * The setting is `config.mark.reveal`; `?mark=draw` or `?mark=morph` in the address overrides it, to compare.
 */
import { config } from '../config'

export type MarkReveal = 'draw' | 'morph'

const asked = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('mark') : null

export const markReveal: MarkReveal = asked === 'draw' || asked === 'morph' ? asked : config.mark.reveal

/** The drop the mark starts from, in artwork units: where it sits and how large it is. */
export function markStart(): { centre: [number, number]; radius: number } {
  const M = config.mark
  return markReveal === 'draw' ? M.start : { centre: M.art.drop, radius: M.art.dropRadius * M.art.dropScale }
}
