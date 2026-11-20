/**
 * The way from a dark part of the page into a light one (&flow=soar), as the reference makes it (trysoar.com, read
 * off its picture of it): from one edge of the screen to the other, a fifth of a screen tall, Ink that rises through
 * warm greys into a horizon of light, brighter in the middle than at the sides, and on into the Paper, all through a
 * grain (--paper-grain, set by After.tsx). Theirs is blue at the horizon; ours is Hyper Neon. After the hero it comes
 * up over the held river, so its top lets the river through.
 */
import s from './soar.module.css'

export function Daybreak({ from }: { from: 'river' | 'ink' }) {
  return (
    <div className={s.daybreak} data-from={from} aria-hidden="true">
      {/* (its light lower part, for what stands at the top of the screen: soar/tone.ts) */}
      <i className={s.lit} data-light="" />
    </div>
  )
}
