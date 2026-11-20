/** Small parts the app's screens share. */
import { MARK_D } from '../brand/mark'
import t from './terminal.module.css'

/** The mark, as the app's own sign. */
export const Mark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="-2 -2 432 195" aria-hidden="true">
    <path d={MARK_D} fill="currentColor" />
  </svg>
)

/** A figure the network never sees: what it holds in its place is a commitment, shown as a bar. */
export const Sealed = ({ width }: { width: number }) => <i className={t.bar} style={{ width }} />
