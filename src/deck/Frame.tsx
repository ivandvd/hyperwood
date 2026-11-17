/**
 * One frame of the deck: a card the size of the screen with a title in the hero's place (large, bottom left),
 * a short paragraph and one picture. See track.ts for how frames move; this component only applies what
 * every frame shares: it draws back and dims while the next frame covers it, its title plays the hero's own
 * focus pull when it arrives, and the sky behind it moves a little against the scroll.
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { FocusReveal } from '../ui/FocusReveal'
import { FadeUpLines } from '../ui/FadeUpLines'
import { playTitles } from '../ui/titles'
import { config } from '../config'
import { FrameContext, deckMode, useTrack } from './track'
import s from './deck.module.css'

interface Props {
  id: string
  /** Screens of scroll the frame is held for while its picture plays. */
  dwell: number
  last?: boolean
  label: string
  title: string
  lead: string
  /** A line of small print under the lead. */
  fine?: string
  className?: string
  /** The paragraph stands apart from the title, at the lower right (the hero's own arrangement), leaving the
   *  upper part of the card to the picture. Without it the paragraph sits above the title, on the left. */
  apart?: boolean
  /** The picture, and anything else placed on the card. */
  children: ReactNode
  /** Extra content under the lead (a button, a switch). */
  aside?: ReactNode
}

export function Frame({ id, dwell, last = false, label, title, lead, fine, className = '', apart = false, children, aside }: Props) {
  const [track, api] = useTrack<HTMLElement>(dwell, last)
  const card = useRef<HTMLDivElement>(null)
  const dim = useRef<HTMLDivElement>(null)
  const sky = useRef<HTMLDivElement>(null)
  const played = useRef(false)

  useEffect(
    () =>
      api.subscribe((p) => {
        const el = card.current
        const shade = dim.current
        if (!el || !shade) return
        // the title plays once the card is most of the way in
        if (!played.current && p.arrive > (deckMode() === 'stack' ? 0.42 : 0.5)) {
          played.current = true
          playTitles(id)
        }
        const c = p.cover
        el.style.transform = c > 0.0005 ? `scale(${(1 - 0.05 * c).toFixed(4)})` : ''
        shade.style.opacity = (c * 0.62).toFixed(3)
        // fully covered: nothing of it can be seen, so it is not painted either
        el.style.visibility = c >= 0.999 ? 'hidden' : ''
        // the sky hangs back a little as the card comes up, and sinks as the frame is held
        if (sky.current) sky.current.style.transform = `translate3d(0, ${((1 - p.arrive) * -54 + p.dwell * 22).toFixed(1)}px, 0)`
      }),
    [api, id],
  )

  return (
    <section className={s.track} id={id} ref={track} style={{ '--dwell': dwell } as CSSProperties} data-last={last ? '' : undefined} aria-labelledby={`${id}-title`}>
      <div className={s.screen}>
        <div className={`${s.card} ${apart ? s.apart : ''} ${className}`} ref={card}>
          <div className={s.inner}>
            <FrameContext.Provider value={api}>
              <div className={s.sky} ref={sky} aria-hidden />
              <div className={s.copy}>
                <p className={s.label}>{label}</p>
                <h2 id={`${id}-title`} className={`t-display ${s.title}`}>
                  <FocusReveal text={title} group={id} className="fr--stack" />
                </h2>
                <div className={s.words}>
                  <FadeUpLines className={s.lead} group={id} delay={config.titles.bodyDelay} text={lead} />
                  {fine && <FadeUpLines className={s.fine} group={id} delay={config.titles.bodyDelay + 0.3} text={fine} />}
                  {aside}
                </div>
              </div>
              {children}
            </FrameContext.Provider>
          </div>
          <div className={s.dim} ref={dim} aria-hidden />
        </div>
      </div>
    </section>
  )
}
