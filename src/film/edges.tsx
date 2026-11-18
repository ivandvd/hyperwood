/**
 * How a box of film melts into the page along its upper and lower edge, as the reference's does: what is in the
 * box is drawn twice, once sharp with those edges faded out, once smeared up and down and shown only along
 * them (edges.module.css has the two fades). This is the smear: a blur up and down only, a share of the box's
 * height strong (an SVG filter, set from script, because a filter cannot take a share of its box reliably).
 *
 * `useSmear(box)` gives the two copies' classes, the style that puts the blur on the smeared copy, and the
 * filter itself, to be put anywhere inside the box.
 */
import { useEffect, useId, useRef, type CSSProperties, type RefObject } from 'react'
import e from './edges.module.css'

/** How far the smeared copy is blurred up and down, as a share of the box's height (7 px on a box 638 px tall). */
const SMEAR = 0.011

export type Copy = 'sharp' | 'smear'
export const COPIES: Copy[] = ['sharp', 'smear']

export function useSmear(box: RefObject<HTMLElement | null>) {
  const id = `film-smear-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const blur = useRef<SVGFEGaussianBlurElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const set = () => blur.current?.setAttribute('stdDeviation', `0 ${(el.clientHeight * SMEAR).toFixed(2)}`)
    const watch = new ResizeObserver(set)
    watch.observe(el)
    set()
    return () => watch.disconnect()
  }, [box])

  return {
    /** the class of a copy, and the style that goes with it */
    copy: (which: Copy): { className: string; style?: CSSProperties; 'aria-hidden'?: true } =>
      which === 'sharp' ? { className: e.sharp } : { className: e.smear, style: { filter: `url(#${id})` }, 'aria-hidden': true },
    defs: (
      <svg className={e.defs} aria-hidden="true" focusable="false">
        <defs>
          <filter id={id}>
            <feGaussianBlur ref={blur} stdDeviation="0 7" edgeMode="duplicate" />
          </filter>
        </defs>
      </svg>
    ),
  }
}
