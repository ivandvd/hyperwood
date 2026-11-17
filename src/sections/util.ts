import type { CSSProperties, RefObject } from 'react'

/** The place of an item in its block: the reveal of each one starts a little after the one before. */
export const order = (i: number) => ({ '--i': i }) as CSSProperties

/** 0 becomes "01". */
export const two = (i: number) => String(i + 1).padStart(2, '0')

/** One element, several refs: for an element that is both watched for coming into view and followed on scroll. */
export const share =
  <T,>(...refs: RefObject<T | null>[]) =>
  (node: T | null) => {
    for (const ref of refs) ref.current = node
  }
