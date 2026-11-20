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
import { Fragment, useCallback, useEffect, useRef, type CSSProperties, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { asked } from '../address'
import { BRAND, home } from '../content.home'
import lockup from '../assets/brand/hyperwood-lockup-neon.svg'
import { FilmStack, type FilmStackHandle } from '../film/FilmStack'
import type { FilmName } from '../film/reel'
import { icons } from '../ui/icons'
import { LaunchLink } from '../ui/LaunchLink'
import { ScrambleLink } from '../ui/ScrambleLink'
import { startJourney } from './timeline'
import { Header } from './Header'
import { Menu } from './Menu'
import { SwimLogo } from './SwimLogo'
import s from './journey.module.css'

/** The films in the order of their story, and what each shows. */
const story = home.films.map((film) => film.film)
const shows = Object.fromEntries(home.films.map((film) => [film.film, film.shows])) as Record<FilmName, string>

/** A try beside the arrangement the page shows (the address ?gate=exchange&layout=right): the exchange stands at
 *  the right, and everything said stands in one column at the left: the tagline, the line, the call to action.
 *  The way around the site is a bar across the top: the logo at the left, and at the right the site's parts, the
 *  channels as their icons, and the header's call to action, which stands at the row's end for the whole page.
 *  An upright screen has the column across it, the exchange under it, and at the bar's right a button that opens
 *  the way around and the call to action (Menu.tsx). The buttons are the softer ones (ui/LaunchLink.tsx).
 *  (journey.module.css, "the hero with the exchange at the right".) */
const sided = asked.get('gate') === 'exchange' && asked.get('layout') === 'right'
/** Another (the address ?films=after): the films come after the hero (landing/FilmBlock.tsx), and the journey goes
 *  from the opening eye straight on to the gate. Its box for the films stays, empty: the light still counts by it
 *  (timeline.ts). */
const filmsAfter = asked.get('films') === 'after'
/** A try on that (the address &logo=swim, with the films after the hero and the exchange at the right): the hero's
 *  logo stays at the upper left for the rest of the page, its mark swimming while the page is scrolled
 *  (SwimLogo.tsx), and the films' block has no card (landing/FilmBlock.tsx). */
const swimLogo = sided && filmsAfter && asked.get('logo') === 'swim'
/** The bar's links: the site's parts and the docs; and the channels, which it shows as their icons. */
const ways = [...home.panel[0], ...home.panel[1].filter((link) => link.icon === 'docs')]
const channels = home.panel[1].filter((link) => link.icon && link.icon !== 'docs')

/** How wide an element is, in ems of its own type. */
const em = (el: Element) => el.getBoundingClientRect().width / (parseFloat(getComputedStyle(el).fontSize) || 1)

/**
 * The tagline's measures, found on the page itself, so that it can be as large as the room it has allows and
 * other words take their own size (journey.module.css: .tagline, and the column):
 *
 *   --tag-indent   how far the light sentence is set in: so that it ends where the first ends, by no more than
 *                  the reference's 0.95 of the type size. The tagline is then no wider than its first sentence,
 *                  so as large as it can be.
 *   --tag-w        its widest sentence on one line, with that indent (in ems, as the next)
 *   --tag-w2       the widest of the sentences' halves (an upright screen sets each sentence in two lines)
 *   --tag-lines, --tag-halves   how many lines that makes, either way
 *
 * (Measured from the halves, which keep their own width however the screen sets them, so a screen turned from
 * upright to wide is still right.) They are told to the whole journey, its section: on an upright screen the
 * exchange is laid by them too, since it takes the room the tagline leaves. Says whether any of them is new.
 */
function fitTagline(h: HTMLElement) {
  const lines = Array.from(h.children).map((line) => {
    const halves = Array.from(line.querySelectorAll('[data-part]')).map(em)
    // (the space between the halves, in the line's own weight: a no-break space is as wide)
    const space = document.createElement('span')
    space.textContent = String.fromCharCode(160)
    line.append(space)
    const gap = em(space)
    space.remove()
    return { light: line.hasAttribute('data-light'), halves: halves.length, whole: halves.reduce((a, b) => a + b, 0) + gap * (halves.length - 1), half: Math.max(...halves) }
  })
  const first = lines[0]?.whole ?? 0
  // (not laid out: there is nothing to go by)
  if (!(first > 0)) return false
  const indent = Math.min(0.95, Math.max(0, first - Math.max(0, ...lines.filter((line) => line.light).map((line) => line.whole))))
  const set = (line: (typeof lines)[number], width: number) => (line.light ? indent : 0) + width
  const measures = {
    '--tag-indent': indent.toFixed(3),
    '--tag-w': Math.max(...lines.map((line) => set(line, line.whole))).toFixed(3),
    '--tag-w2': Math.max(...lines.map((line) => set(line, line.half))).toFixed(3),
    '--tag-lines': String(lines.length),
    '--tag-halves': String(lines.reduce((n, line) => n + line.halves, 0)),
  }
  const told = h.closest<HTMLElement>('section') ?? h
  let fresh = false
  for (const [name, value] of Object.entries(measures))
    if (told.style.getPropertyValue(name) !== value) {
      told.style.setProperty(name, value)
      fresh = true
    }
  return fresh
}

/** The films' titles likewise (.says): the widest on one line (--say-w), and the widest of their halves
 *  (--say-w2: an upright screen sets each title in two lines). */
function fitSays(box: HTMLElement) {
  const titles = Array.from(box.children).map((say) => Array.from(say.querySelectorAll('[data-part]')).map(em))
  const widest = Math.max(0, ...titles.flat())
  if (!(widest > 0)) return
  // (a title on one line is its halves and the space between them, about 0.22 of its size)
  box.style.setProperty('--say-w', Math.max(...titles.map((halves) => halves.reduce((a, b) => a + b, 0) + 0.22)).toFixed(3))
  box.style.setProperty('--say-w2', widest.toFixed(3))
}

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
  const swimmer = useRef<HTMLAnchorElement>(null)

  // The large words are measured whenever they are put into the page, and again when a typeface has come: so
  // they are fitted however they came to be there (a part of the page that is built anew is measured like the
  // first; measured once only, such a part stood unfitted, larger than its room).
  const putTagline = useCallback((h: HTMLHeadingElement | null) => {
    tagline.current = h
    if (h) fitTagline(h)
  }, [])
  const putSays = useCallback((box: HTMLDivElement | null) => {
    says.current = box
    if (box) fitSays(box)
  }, [])
  useEffect(() => {
    const again = () => {
      const fresh = tagline.current ? fitTagline(tagline.current) : false
      if (says.current) fitSays(says.current)
      // (on an upright screen the exchange is laid by the tagline's measures, and timeline.ts lays the picture
      // again when the window is resized: so it is told that way)
      if (fresh) window.dispatchEvent(new Event('resize'))
    }
    again()
    void document.fonts.ready.then(again)
    document.fonts.addEventListener('loadingdone', again)
    return () => document.fonts.removeEventListener('loadingdone', again)
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
        logo: swimmer.current ?? undefined,
      }),
    [films],
  )

  // The closing's parts with the films, whichever way they are laid out: the logo, the gate's line, the call to
  // action, and the tagline.
  const logo = (
    <a className={s.logo} href="#top" aria-label={`${BRAND} home`}>
      <img src={lockup} alt="" width={907} height={114} />
    </a>
  )
  // (the line's two lines: they run on in the column beside the gate, and each is a line where everything said
  // stands in one column. A word with a hyphen in it stays on one line)
  const line = (
    <p className={s.line}>
      {home.gate.line.map((row) => (
        <span key={row} className={s.lineRow}>
          {row.split(' ').map((word, i) => (
            <span key={i} className={word.includes('-') ? s.whole : undefined}>
              {word}{' '}
            </span>
          ))}
        </span>
      ))}
    </p>
  )
  // (where the bar has the call to action, the column's own says what the line leads to)
  const call = sided ? home.gate.call : home.launch
  const launch = (
    <LaunchLink className={s.launch} href={call.href} soft={sided}>
      {call.label}
    </LaunchLink>
  )
  // (the tagline's two sentences, a line each: the first heavy, the second light and set in. On an upright screen
  // each sentence's halves are its lines. The space between the sentences stands outside them, and the space
  // between a sentence's halves outside the halves)
  const title = (
    <h2
      ref={putTagline}
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
  )

  // id "top": the logo comes back here
  return (
    <section
      ref={journey}
      id="top"
      className={s.journey}
      data-hero={films ? 'room' : undefined}
      data-layout={films && sided ? 'right' : undefined}
      data-logo={films && swimLogo ? 'swim' : undefined}
      aria-label={home.label}
    >
      <span ref={hold} className={s.hold} aria-hidden="true" />
      <div ref={stage} className={s.stage}>
        {/* (the films lie under the picture: timeline.ts lays their box where the hero's layout has its place) */}
        {films && <FilmStack ref={stack} className={s.room} films={filmsAfter ? [] : story} labels={shows} />}
        <canvas ref={canvas} className={s.light} aria-hidden="true" />
        {/* (the header lies on the page itself, so it can stay over the sections after the journey) */}
        {createPortal(<Header ref={header} only={films ? 'launch' : undefined} row={films && sided} />, document.body)}
        {/* (the logo that stays, with that try: it lies on the page itself too) */}
        {films && swimLogo && createPortal(<SwimLogo ref={swimmer} />, document.body)}
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
            <div ref={putSays} className={s.says}>
              {(filmsAfter ? [] : home.films).map((film) => (
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
          {films && sided ? (
            <>
              {logo}
              {/* the way around the site, at the right of the bar across the top: the site's parts, the channels
                  as their icons, and the place of the header's call to action, which stands at the row's end. (A
                  screen with no room for the row has a button there that opens all of it.) */}
              <div className={s.bar}>
                <nav className={s.ways} aria-label="Main navigation">
                  <ul>
                    {ways.map((link) => (
                      <li key={link.label}>
                        <ScrambleLink href={link.href}>{link.label}</ScrambleLink>
                      </li>
                    ))}
                  </ul>
                </nav>
                <ul className={s.channels}>
                  {channels.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} aria-label={link.label} {...(/^https?:/.test(link.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                        {link.icon && icons[link.icon]}
                      </a>
                    </li>
                  ))}
                </ul>
                <Menu ways={ways} channels={channels} />
                <span className={s.spare} aria-hidden="true">
                  <LaunchLink href={home.launch.href} soft>
                    {home.launch.label}
                  </LaunchLink>
                </span>
              </div>
              {/* everything said, in one column: the tagline, the line, the call to action */}
              <div className={s.lede}>
                {title}
                <div ref={side as Ref<HTMLDivElement>} className={s.pitch}>
                  {line}
                  {launch}
                </div>
              </div>
            </>
          ) : films ? (
            <>
              {logo}
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
                {line}
                {launch}
              </aside>
              {title}
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
