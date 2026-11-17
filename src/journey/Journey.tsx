/**
 * The pinned opening of the landing page: a tall section whose stage stays on screen while it is scrolled.
 * The stage holds the canvas the shader draws on, and over it the header and the words. What moves, and when,
 * is timeline.ts; what it looks like is shader.ts and journey.module.css.
 *
 * Three boxes here are places, not pictures: the hero's `sculpture` and `word`, and the closing's `door`. The
 * page's layout puts them, and the shader draws the mark's body, the wordmark and the gate where they stand.
 */
import { useEffect, useRef } from 'react'
import { BRAND, home } from '../content.home'
import { startJourney } from './timeline'
import { Header } from './Header'
import s from './journey.module.css'

export function Journey() {
  const journey = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const header = useRef<HTMLElement>(null)
  const intro = useRef<HTMLParagraphElement>(null)
  const hero = useRef<HTMLDivElement>(null)
  const sculpture = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLHeadingElement>(null)
  const closing = useRef<HTMLDivElement>(null)
  const door = useRef<HTMLSpanElement>(null)

  useEffect(
    () =>
      startJourney({
        journey: journey.current!,
        stage: stage.current!,
        canvas: canvas.current!,
        header: header.current!,
        intro: intro.current!,
        lines: Array.from(intro.current!.children) as HTMLElement[],
        hero: hero.current!,
        sculpture: sculpture.current!,
        word: word.current!,
        closing: closing.current!,
        door: door.current!,
      }),
    [],
  )

  // id "top": the mark in the header comes back here
  return (
    <section ref={journey} id="top" className={s.journey} aria-label={home.label}>
      <div ref={stage} className={s.stage}>
        <canvas ref={canvas} className={s.light} aria-hidden="true" />
        <Header ref={header} />
        <p ref={intro} className={s.intro}>
          {home.intro.map((line) => (
            <span key={line}>{line} </span>
          ))}
        </p>
        <div ref={hero} className={s.hero}>
          <div ref={sculpture} className={s.sculpture} aria-hidden="true" />
          <h1 ref={word} className={s.word}>
            {BRAND}
          </h1>
          <p className={s.heroLine}>{sentences(home.heroLine)}</p>
        </div>
        <div ref={closing} className={s.closing}>
          <span ref={door} className={s.door} aria-hidden="true" />
          <h2 className={s.title}>
            {home.closing.map((side, i) => (
              <span key={side.title[0]} className={`${s.half} ${i ? s.right : s.left}`}>
                {side.title.map((part) => (
                  <span key={part} className={s.part}>
                    {part}{' '}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          {home.closing.map((side, i) => (
            <p key={side.note[0]} className={`${s.aside} ${i ? s.right : s.left}`}>
              {side.note.map((part) => (
                <span key={part} className={s.row}>
                  {part}{' '}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

/** A line breaks between its sentences, never inside one. */
const sentences = (text: string) =>
  text.split(/(?<=\.)\s+/).flatMap((part, i) => [
    i > 0 ? ' ' : '',
    <span key={part} className={s.sentence}>
      {part}
    </span>,
  ])
