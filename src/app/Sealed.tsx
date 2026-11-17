/**
 * A value that is the owner's alone. It is shown as it is in the owner's view, and as a bar wherever an
 * ancestor is marked `data-view="network"`: what the network has in its place.
 */
import type { ReactNode } from 'react'
import s from './sealed.module.css'

export function Sealed({ children }: { children: ReactNode }) {
  return (
    <span className={s.sealed}>
      <span className={s.clear}>{children}</span>
      <span className={s.bar} aria-hidden="true" />
    </span>
  )
}
