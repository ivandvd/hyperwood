/**
 * The call to action: a square button in Hyper Neon with an arrow after its words. Under the pointer it moves
 * as the reference's button does (read off that page, bulk.trade, frame by frame):
 *
 *   - its letters roll up one after another: each letter stands in a window one line high, over a copy of
 *     itself, and the pair rises by one line, the next letter 29 ms after the one before, each in about 450 ms
 *     on a steep ease-out. When the pointer leaves they drop back at once, which cannot be seen, since a letter
 *     and its copy are the same;
 *   - the arrow after the words goes out to the right while one comes in before them, on the same curve, so
 *     the button keeps its width;
 *   - the button lightens (here: Neon turns white).
 *
 * The words are in the page once, whole, for those who do not see it. Under reduced motion nothing rolls or
 * slides. Its measures come from where it stands (--launch-height, --launch-pad, --launch-type).
 */
import type { CSSProperties } from 'react'
import s from './launchLink.module.css'

const arrow = (
  <svg viewBox="0 0 20 12" aria-hidden="true" focusable="false">
    <path d="M1 6h17M13 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" />
  </svg>
)

export function LaunchLink({ href, children, className }: { href: string; children: string; className?: string }) {
  return (
    <a className={className ? `${s.launch} ${className}` : s.launch} href={href}>
      <span className={s.lead} aria-hidden="true">
        {arrow}
      </span>
      <span className={s.words}>
        <span className={s.said}>{children}</span>
        <span className={s.letters} aria-hidden="true">
          {Array.from(children).map((ch, i) =>
            ch === ' ' ? (
              <span key={i} className={s.space}>
                {' '}
              </span>
            ) : (
              <span key={i} className={s.cell} style={{ '--i': i } as CSSProperties}>
                <span className={s.roll}>
                  <span>{ch}</span>
                  <span>{ch}</span>
                </span>
              </span>
            ),
          )}
        </span>
      </span>
      <span className={s.trail} aria-hidden="true">
        {arrow}
      </span>
    </a>
  )
}
