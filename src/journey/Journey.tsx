/**
 * The pinned opening of the landing page: a tall section whose stage stays on screen while it is scrolled.
 * The stage holds the canvas the shader draws on, and over it the header and the words. What moves, and when,
 * is timeline.ts; what it looks like is shader.ts and journey.module.css.
 *
 * Three boxes here are places, not pictures: the hero's `sculpture` and `word`, and the closing's `door`. The
 * page's layout puts them, and the shader draws the mark's body, the wordmark and the gate where they stand.
 *
 * With the films (the page as it is shown), two things stand where the mark's hero stood:
 *
 *   the films      In the first of those boxes the films stand (film/FilmStack.tsx), one after another as the
 *                  page is scrolled, and the journey's light is their bulb. Each has a sentence across its
 *                  lower edge and a smaller one under it (`films` in content.home.ts). They lie under the
 *                  canvas, which is then drawn with a share left clear. Nothing else is on these screens but
 *                  the call to action, at the upper right (Header.tsx).
 *   the closing    The gate and the river are the page's hero, and around them it is laid out as the reference
 *                  lays out its first screen (bulk.trade): the logo at the upper left, the way around the
 *                  site with its icons, the line and the call to action in a column at the right, and the
 *                  tagline at the gate's left, level with its crown, the first line heavy and the second light
 *                  (`gate` and `panel` in content.home.ts).
 *
 * `films={false}` gives the journey as it was before them: the mark as a body of black liquid with the
 * wordmark and the line under it, and the closing's two sentences on either side of the gate.
 */
import { Fragment, useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { BRAND, home } from '../content.home'
import lockup from '../assets/brand/hyperwood-lockup-neon.svg'
import { FilmStack, type FilmStackHandle } from '../film/FilmStack'
import type { FilmName } from '../film/reel'
import { icons } from '../ui/icons'
import { LaunchLink } from '../ui/LaunchLink'
import { ScrambleLink } from '../ui/ScrambleLink'
import { startJourney } from './timeline'
import { Header } from './Header'
import s from './journey.module.css'

/** The films in the order of their story, and what each shows. */
const story = home.films.map((film) => film.film)
const shows = Object.fromEntries(home.films.map((film) => [film.film, film.shows])) as Record<FilmName, string>

export function Journey({ films = true }: { films?: boolean }) {
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
  const hold = useRef<HTMLSpanElement>(null)
  const stack = useRef<FilmStackHandle>(null)
  const says = useRef<HTMLDivElement>(null)
  const side = useRef<HTMLElement>(null)
  const tagline = useRef<HTMLHeadingElement>(null)

  // How wide the large words are in ems, measured once their typeface is there, so that each can be as large as
  // the room it has allows (journey.module.css: .tagline, .says): other words take their own size.
  //   the tagline   its widest sentence on one line, and the widest of the sentences' halves (an upright screen
  //                 sets each sentence in two lines), each with the light sentence's indent, which is found here
  //   the films     the widest title on one line, and the widest of the titles' halves (an upright screen sets
  //                 each title in two lines)
  // (Measured from the halves, which keep their own width however the screen sets them, so a screen turned
  // from upright to wide is still right.)
  useEffect(() => {
    let gone = false
    const em = (el: Element) => el.getBoundingClientRect().width / (parseFloat(getComputedStyle(el).fontSize) || 1)
    void document.fonts.ready.then(() => {
      if (gone) return
      const h = tagline.current
      if (h) {
        const lines = Array.from(h.children).map((line) => {
          const halves = Array.from(line.querySelectorAll('[data-part]')).map(em)
          // (the space between the halves, in the line's own weight: a no-break space is as wide)
          const space = document.createElement('span')
          space.textContent = String.fromCharCode(160)
          line.append(space)
          const gap = em(space)
          space.remove()
          return { light: line.hasAttribute('data-light'), whole: halves.reduce((a, b) => a + b, 0) + gap * (halves.length - 1), half: Math.max(...halves) }
        })
        // The light sentence is set in so that it ends where the first ends, by no more than the reference's 0.95
        // of the type size: the tagline is then no wider than its first sentence, so as large as it can be.
        const first = lines[0]?.whole ?? 0
        const indent = Math.min(0.95, Math.max(0, first - Math.max(0, ...lines.filter((line) => line.light).map((line) => line.whole))))
        const set = (line: (typeof lines)[number], width: number) => (line.light ? indent : 0) + width
        h.style.setProperty('--tag-indent', indent.toFixed(3))
        h.style.setProperty('--tag-w', Math.max(...lines.map((line) => set(line, line.whole))).toFixed(3))
        h.style.setProperty('--tag-w2', Math.max(...lines.map((line) => set(line, line.half))).toFixed(3))
      }
      const box = says.current
      if (box) {
        const titles = Array.from(box.children).map((say) => Array.from(say.querySelectorAll('[data-part]')).map(em))
        // (a title on one line is its halves and the space between them, about 0.22 of its size)
        box.style.setProperty('--say-w', Math.max(...titles.map((halves) => halves.reduce((a, b) => a + b, 0) + 0.22)).toFixed(3))
        box.style.setProperty('--say-w2', Math.max(...titles.flat()).toFixed(3))
      }
    })
    return () => {
      gone = true
    }
  }, [films])

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
        word: word.current ?? undefined,
        closing: closing.current!,
        door: door.current!,
        hold: hold.current!,
        films: films ? stack.current! : undefined,
        says: films ? (Array.from(says.current!.children) as HTMLElement[]).map((say) => [say]) : undefined,
        side: side.current ?? undefined,
      }),
    [films],
  )

  // id "top": the logo comes back here
  return (
    <section ref={journey} id="top" className={s.journey} data-hero={films ? 'room' : undefined} aria-label={home.label}>
      <span ref={hold} className={s.hold} aria-hidden="true" />
      <div ref={stage} className={s.stage}>
        {/* (the films lie under the picture: timeline.ts lays their box where the hero's layout has its place) */}
        {films && <FilmStack ref={stack} className={s.room} films={story} labels={shows} />}
        <canvas ref={canvas} className={s.light} aria-hidden="true" />
        {/* (the header lies on the page itself, so it can stay over the sections after the journey) */}
        {createPortal(<Header ref={header} only={films ? 'launch' : undefined} />, document.body)}
        <p ref={intro} className={s.intro}>
          {home.intro.map((line) => (
            <span key={line}>{line} </span>
          ))}
        </p>
        {films ? (
          <div ref={hero} className={s.hero}>
            <div ref={sculpture} className={s.screen} aria-hidden="true" />
            {/* (the name is here to be read out: what is seen of the brand is the logo, at the closing) */}
            <h1 className={s.name}>{BRAND}</h1>
            <div ref={says} className={s.says}>
              {home.films.map((film) => (
                <div key={film.film} className={s.say}>
                  {/* (one line on a wide screen, its two halves one under the other on an upright one) */}
                  <p className={s.sayLine}>
                    {film.title.map((half, i) => (
                      <Fragment key={half}>
                        {i > 0 && ' '}
                        <span className={s.sayPart} data-part="">
                          {half}
                        </span>
                      </Fragment>
                    ))}
                  </p>
                  <p className={s.sayNote}>{film.note}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div ref={hero} className={s.hero}>
            <div ref={sculpture} className={s.sculpture} aria-hidden="true" />
            <h1 ref={word} className={s.word}>
              {BRAND}
            </h1>
            <p className={s.heroLine}>{sentences(home.heroLine)}</p>
          </div>
        )}
        <div ref={closing} className={s.closing}>
          <span ref={door} className={s.door} aria-hidden="true" />
          {films ? (
            <>
              <a className={s.logo} href="#top" aria-label={`${BRAND} home`}>
                <img src={lockup} alt="" />
              </a>
              <aside ref={side} className={s.side}>
                <nav className={s.panel} aria-label="Main navigation">
                  {home.panel.map((list, i) => (
                    <ul key={i}>
                      {list.map((link) => (
                        <li key={link.href}>
                          <ScrambleLink href={link.href} arrow={i ? 'before' : 'after'} icon={link.icon && icons[link.icon]}>
                            {link.label}
                          </ScrambleLink>
                        </li>
                      ))}
                    </ul>
                  ))}
                </nav>
                {/* (a word with a hyphen in it stays on one line) */}
                <p className={s.line}>
                  {home.gate.line.split(' ').map((word, i) => (
                    <span key={i} className={word.includes('-') ? s.whole : undefined}>
                      {word}{' '}
                    </span>
                  ))}
                </p>
                <LaunchLink className={s.launch} href={home.launch.href}>
                  {home.launch.label}
                </LaunchLink>
              </aside>
              {/* (the tagline's two sentences, a line each: the first heavy, the second light and set in. On an
                  upright screen each sentence's halves are its lines. The space between the sentences stands
                  outside them, and the space between a sentence's halves outside the halves) */}
              <h2
                ref={tagline}
                className={s.tagline}
                style={{ '--tag-lines': home.gate.title.length, '--tag-halves': home.gate.title.flat().length } as CSSProperties}
              >
                {home.gate.title.map((sentence, g) => (
                  <Fragment key={sentence.join(' ')}>
                    {g > 0 && ' '}
                    <span data-light={g > 0 ? '' : undefined}>
                      {sentence.map((half, i) => (
                        <Fragment key={half}>
                          {i > 0 && ' '}
                          <span data-part="">{half}</span>
                        </Fragment>
                      ))}
                    </span>
                  </Fragment>
                ))}
              </h2>
            </>
          ) : (
            <>
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
            </>
          )}
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
