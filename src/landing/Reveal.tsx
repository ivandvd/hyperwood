/**
 * A part of the page that comes in once, when it is first seen (kit.module.css, .reveal). `delay` counts in
 * steps of 90 ms, so parts that are seen together follow one another.
 */
import type { CSSProperties, ReactNode } from 'react'
import { useSeen } from './useSeen'
import k from './kit.module.css'

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, seen] = useSeen<HTMLDivElement>(0.15)
  return (
    <div ref={ref} className={`${k.reveal} ${seen ? k.shown : ''} ${className}`} style={{ '--i': delay } as CSSProperties}>
      {children}
    </div>
  )
}
