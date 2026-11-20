/**
 * The films after the hero (the address ?films=after, After.tsx): the three films shown as the reference shows its
 * own on its first screen (bulk.trade), one box of film over two of the page's three columns, its upper and lower
 * edges smeared into the page; and moved by the scroll. The block is held on the screen while the page is scrolled
 * through it: each film stands for a stretch of the scroll, and between two of them the one goes out into the dark
 * of the page, drifting up a little, and the next comes up out of it. (The strip of the reference, the films moving
 * on by one frame's height, drew a hard line across the box between the two films; held by the scroll it stood
 * there.) The films' own light carries the one into the next, as in the journey: as a film goes out, its bulb's
 * light stays, goes over to where the next film's bulb hangs, and the next film comes up about it (the lamp, drawn
 * with the bulbs' own fall). With each film its two lines, large, across the box's lower edge, and what it means in
 * the third column; they go and come with their film. (The journey then has no films: timeline.ts.)
 *
 * The edges are smeared as the reference's are: a sharp copy of the strip faded out along them over a smeared one.
 * The page draws the smeared one itself from the film that plays, into a canvas: the film squeezed to a tenth of
 * its height and stretched back, which smears it up and down only. Only one film plays at a time, the one the box
 * mostly shows. (A second film playing held the screen to 60 refreshes a second where it can do 120, and a filter
 * of the page's over a playing film made it miss them: measured on the production build.)
 *
 * The films are put into the page at a still moment (still.ts), or when the block comes within a screen and a half
 * of the screen's foot; until then the box shows their first frames. They play only while the block is on screen,
 * never while the page is hidden or under reduced motion.
 *
 * Where everything stands: filmBlock.module.css. The words: `filmsAfter` in content.home.ts.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { asked } from '../address'
import { home } from '../content.home'
import { films, SHAPE, type FilmName } from '../film/reel'
import { MarkTile } from './MarkTile'
import { whenStill } from './still'
import e from '../film/edges.module.css'
import s from './filmBlock.module.css'

/** The films in the order of their story, each with its words. */
const story = home.filmsAfter
/** With the logo that stays at the upper left (a try: the address &logo=swim, journey/SwimLogo.tsx), the swimming
 *  mark is the logo's, and the third column has no card. */
const swimLogo = asked.get('gate') === 'exchange' && asked.get('layout') === 'right' && asked.get('logo') === 'swim'
/** What each film shows, for those who cannot see it (the journey's own words for them). */
const shows = Object.fromEntries(home.films.map((one) => [one.film, one.shows])) as Record<FilmName, string>

/** Where in the block's held stretch (0 to 1) one film gives way to the next: the first change, the second.
 *  Between them, before and after, a film stands. */
const MOVES: [number, number][] = [
  [0.17, 0.41],
  [0.59, 0.83],
]
/** On the dark page (`exit`: How it works comes after the block, soar/works/Works.tsx), the block is held a little
 *  longer (filmBlock.module.css), the films change at the same places of the longer stretch, and at its end the last
 *  film goes out as the others do, its words with it (EXIT, of the held stretch), so the block leaves the screen dark
 *  and what follows rises into the dark, with nothing of the films over it. */
const TRAVEL = 240
const TRAVEL_EXIT = 265
const MOVES_EXIT = MOVES.map(([a, b]) => [(a * TRAVEL) / TRAVEL_EXIT, (b * TRAVEL) / TRAVEL_EXIT] as [number, number])
const EXIT: [number, number] = [0.86, 0.98]
/** The smear: as many pixels as the films have (960 by 720), and how much the film is squeezed up and down on its
 *  way (a smear about as strong as the reference's). */
const DRAWN = 960
const SQUEEZE = 10
/** As the block comes up the screen (0: its top at the screen's foot, 1: it fills the screen and is held), the first
 *  film's words come in with the scroll, each as the scroll brings it up: its words at the top of the third column,
 *  its facts at the column's foot, its title. For each: from, to, and how far it rises as it comes, in its own ems.
 *  (They stood there whole while the block was still coming up, before the film was there.) */
const ENTER = { say: [0.5, 0.86, 1.4], facts: [0.8, 1, 1.4], title: [0.68, 0.97, 0.12], tile: [0.42, 0.78, 1.4] } as const

/** A style is written only when it changes: most of the time the scroll moves the page and nothing in the block. */
const said = new WeakMap<HTMLElement, Record<string, string>>()
const put = (el: HTMLElement | null | undefined, name: 'opacity' | 'transform' | 'visibility', value: string) => {
  if (!el) return
  let had = said.get(el)
  if (!had) said.set(el, (had = {}))
  if (had[name] === value) return
  had[name] = value
  el.style[name] = value
}

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** (a film that says when each of its frames is shown: not every browser has it) */
type Framed = HTMLVideoElement & { requestVideoFrameCallback?: (step: () => void) => number; cancelVideoFrameCallback?: (id: number) => void }

export function FilmBlock({ exit = false }: { exit?: boolean } = {}) {
  const root = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  /** each film's place in the box, in either copy (sharp, smeared), which go and come together */
  const slides = useRef<(HTMLDivElement | null)[][]>([[], []])
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const smears = useRef<(HTMLCanvasElement | null)[]>([])
  const titles = useRef<(HTMLElement | null)[]>([])
  const bodies = useRef<(HTMLElement | null)[]>([])
  const factLists = useRef<(HTMLElement | null)[]>([])
  const tile = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const lamp = useRef<HTMLDivElement>(null)
  /** whether the films are in the page */
  const [ready, setReady] = useState(false)
  /** (the film squeezed on its way to its smear) */
  const squeezed = useRef<HTMLCanvasElement | null>(null)

  /** The smear of the frame a film shows now, drawn into its canvas. */
  const drawSmear = (i: number) => {
    const v = videos.current[i]
    const canvas = smears.current[i]
    if (!v || !canvas || v.readyState < 2) return
    let low = squeezed.current
    if (!low) {
      low = squeezed.current = document.createElement('canvas')
      low.width = DRAWN
      low.height = Math.round(DRAWN / SHAPE / SQUEEZE)
    }
    const squeeze = low.getContext('2d')
    const out = canvas.getContext('2d')
    if (!squeeze || !out) return
    squeeze.drawImage(v, 0, 0, low.width, low.height)
    out.drawImage(low, 0, 0, canvas.width, canvas.height)
  }

  // The films come into the page at a still moment, or when the block draws near.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const cancel = whenStill(() => setReady(true))
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setReady(true)
    }, { rootMargin: '0px 0px 150% 0px' })
    near.observe(el)
    return () => {
      cancel()
      near.disconnect()
    }
  }, [])

  // The scroll moves everything; the film the box mostly shows plays.
  useEffect(() => {
    const el = root.current
    const held = frame.current
    if (!el || !held) return
    const calm = matchMedia('(prefers-reduced-motion: reduce)')
    /** (the films, as the page has them: the list is filled as they are put into the page) */
    const all = videos.current
    let raf = 0
    let seen = false
    /** the film that plays (or would, were the block on screen), and what it was last asked for */
    let playing = -1
    let ask: { id: number; frames: boolean } | null = null
    /** which film's words a screen reader was last told are the ones */
    let told = -1

    const unfollow = () => {
      const v = videos.current[playing] as Framed | null | undefined
      if (ask) {
        if (ask.frames) v?.cancelVideoFrameCallback?.(ask.id)
        else cancelAnimationFrame(ask.id)
      }
      ask = null
    }
    /** its smear follows it, frame by frame */
    const follow = (i: number) => {
      const v = videos.current[i] as Framed | null | undefined
      if (!v) return
      const frames = typeof v.requestVideoFrameCallback === 'function'
      const step = () => {
        ask = null
        drawSmear(i)
        if (!v.paused && playing === i) next()
      }
      const next = () => {
        ask = { id: frames ? v.requestVideoFrameCallback!(step) : requestAnimationFrame(step), frames }
      }
      next()
    }
    const play = (which: number) => {
      const may = seen && !document.hidden && !calm.matches
      const now = may ? which : -1
      if (now === playing) return
      unfollow()
      if (playing >= 0) videos.current[playing]?.pause()
      playing = now
      const v = videos.current[now]
      if (now >= 0 && v) {
        v.currentTime = 0
        void v.play().catch(() => {})
        follow(now)
      }
    }

    /** Where each film's bulb hangs in the box, and how wide that film is drawn there (px): the film covers the
     *  box, laid as its stylesheet says (object-position). Read again whenever the box changes its size. */
    let bulbs: { x: number; y: number; w: number }[] = []
    const measure = () => {
      const area = box.current
      if (!area) return
      const bw = area.clientWidth
      const bh = area.clientHeight
      const wide = bw / Math.max(1, bh) > SHAPE
      const w = wide ? bw : bh * SHAPE
      const h = wide ? bw / SHAPE : bh
      bulbs = story.map((one, i) => {
        const picture = slides.current[0][i]?.firstElementChild
        const [px, py] = (picture ? getComputedStyle(picture).objectPosition : '50% 12%').split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5))
        const [fx, fy] = films[one.film].bulb
        return { x: (bw - w) * px + fx * w, y: (bh - h) * py + fy * h, w }
      })
      const light = lamp.current
      // (the lamp's round reaches as far as the bulbs' faint fall does: 0.15 of the film's width from the middle)
      if (light && bulbs[0]) light.style.width = light.style.height = `${(bulbs[0].w * 0.3).toFixed(1)}px`
    }
    const sized = new ResizeObserver(() => {
      measure()
      later()
    })
    if (box.current) sized.observe(box.current)

    // Where the block is, read when the page has been scrolled (or resized, or the block comes into reach): then the
    // page is as it was last drawn and reading it costs nothing. The frame only writes. (Read in the frame, after
    // the app's films further down had written their styles, a reading made the browser work the page's styles out
    // again.)
    // (the window's height too: in this browser reading it in the frame works the page's layout out as well)
    let travel = 1
    let top = 0
    let boxH = 0
    let vh = 1
    const read = () => {
      travel = Math.max(1, el.offsetHeight - held.offsetHeight)
      top = el.getBoundingClientRect().top
      boxH = box.current?.clientHeight ?? 0
      vh = Math.max(1, innerHeight)
    }

    const update = () => {
      raf = 0
      const along = clamp(-top / travel)
      // (how far the block has come up the screen: the first film's words come in by it, ENTER, and the card)
      const come = clamp(1 - top / vh)
      const card = easeOut(clamp((come - ENTER.tile[0]) / (ENTER.tile[1] - ENTER.tile[0])))
      put(tile.current, 'opacity', card.toFixed(3))
      put(tile.current, 'transform', card < 1 ? `translate3d(0, ${((1 - card) * ENTER.tile[2]).toFixed(3)}em, 0)` : 'none')
      // which film: 0 the first, 1 the second, 2 the third, and between two on the way from the one to the next
      // (with `exit`, on to half a film past the last: the last goes out as if a next one were coming)
      const at = (exit ? MOVES_EXIT : MOVES).reduce((sum, [a, b]) => sum + smooth(a, b, along), 0) + (exit ? 0.5 * smooth(EXIT[0], EXIT[1], along) : 0)
      // The lamp: between two films, where the bulb's light is while the one film goes out and the next comes
      // up. It is as bright as the films are dark, so with the film's own bulb it is one light throughout; it
      // goes over from the one film's bulb (as that film drifts up) to the next's (as that one does) in the dark.
      const light = lamp.current
      const from = Math.min(story.length - 2, Math.floor(at))
      const f = at - from
      if (light && bulbs[from + 1]) {
        const drift = boxH * 0.07
        const a = bulbs[from]
        const b = bulbs[from + 1]
        const go = smooth(0.25, 0.75, f)
        const x = a.x + (b.x - a.x) * go
        const y = a.y - f * drift + (b.y + (1 - f) * drift - (a.y - f * drift)) * go
        // (the lamp is as wide as measure() makes it)
        const half = (a.w * 0.3) / 2
        const bright = 1 - Math.max(1 - smooth(0, 0.5, f), 1 - smooth(0, 0.5, 1 - f))
        put(light, 'visibility', bright > 0.002 ? 'visible' : 'hidden')
        if (bright > 0.002) {
          put(light, 'opacity', bright.toFixed(3))
          put(light, 'transform', `translate3d(${(x - half).toFixed(1)}px, ${(y - half).toFixed(1)}px, 0)`)
        }
      }
      story.forEach((_, i) => {
        const off = at - i
        // The film goes out into the dark over the first half of a change, drifting up a little, and the next
        // comes up out of it over the second half: the box is dark for a moment between them, never two films.
        const lit = 1 - smooth(0, 0.5, Math.abs(off))
        for (const copy of slides.current) {
          const slide = copy[i]
          put(slide, 'visibility', lit > 0.002 ? 'visible' : 'hidden')
          if (lit <= 0.002) continue
          put(slide, 'opacity', lit.toFixed(3))
          put(slide, 'transform', `translate3d(0, ${(-off * 7).toFixed(2)}%, 0)`)
        }
        // its words go with it, up and out, as the next film's come up after them; the first film's come in as the
        // block comes up the screen, each rising into its place as the scroll brings it there
        const there = 1 - smooth(0.1, 0.48, Math.abs(off))
        const words = [
          [titles.current[i], 0.32, ENTER.title],
          [bodies.current[i], 1.4, ENTER.say],
          [factLists.current[i], 1.4, ENTER.facts],
        ] as const
        for (const [el, rise, [a, b, lift]] of words) {
          const k = i === 0 ? easeOut(clamp((come - a) / (b - a))) : 1
          const seen = there * k
          put(el, 'visibility', seen > 0.002 ? 'visible' : 'hidden')
          if (seen <= 0.002) continue
          put(el, 'opacity', seen.toFixed(3))
          put(el, 'transform', `translate3d(0, ${(-off * rise + (1 - k) * lift).toFixed(3)}em, 0)`)
        }
      })
      // (none plays once the last has gone out)
      const shown = at > story.length - 1 + 0.45 ? -1 : Math.round(at)
      play(shown)
      // (what is said of the film the box shows is what a screen reader is told)
      if (shown !== told) {
        told = shown
        titles.current.forEach((t, i) => t?.setAttribute('aria-hidden', i === shown ? 'false' : 'true'))
        bodies.current.forEach((b, i) => b?.setAttribute('aria-hidden', i === shown ? 'false' : 'true'))
        factLists.current.forEach((f, i) => f?.setAttribute('aria-hidden', i === shown ? 'false' : 'true'))
      }
    }
    // (each time the frame is asked for, the block is read first: see `read`)
    const later = () => {
      read()
      if (!raf) raf = requestAnimationFrame(update)
    }
    const watch = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting
      later()
    })
    watch.observe(el)
    measure()
    read()
    update()
    addEventListener('scroll', later, { passive: true })
    addEventListener('resize', later)
    document.addEventListener('visibilitychange', later)
    calm.addEventListener('change', later)
    return () => {
      watch.disconnect()
      sized.disconnect()
      removeEventListener('scroll', later)
      removeEventListener('resize', later)
      document.removeEventListener('visibilitychange', later)
      calm.removeEventListener('change', later)
      if (raf) cancelAnimationFrame(raf)
      unfollow()
      all.forEach((v) => v?.pause())
    }
    // (the films are in the page once `ready`: then the effect starts again with them)
  }, [ready, exit])

  const at = (name: FilmName) => ({ '--at': `${films[name].at}%` }) as CSSProperties

  return (
    <section ref={root} className={s.block} aria-label="The films" data-exit={exit ? '' : undefined}>
      <div ref={frame} className={s.frame}>
        <div ref={box} className={s.film}>
          {/* the sharp copy, its edges faded out (and until the films come, their first frames) */}
          <div className={e.sharp}>
            <div className={s.rail}>
              {story.map((one, i) => (
                <div key={one.film} ref={(slide) => { slides.current[0][i] = slide }} className={s.slide}>
                  {ready ? (
                    <video
                      ref={(v) => { videos.current[i] = v }}
                      className={s.picture}
                      style={at(one.film)}
                      src={films[one.film].clip}
                      poster={films[one.film].still}
                      muted
                      loop
                      playsInline
                      preload="auto"
                      aria-label={shows[one.film]}
                      tabIndex={-1}
                      onLoadedData={() => drawSmear(i)}
                      onSeeked={() => drawSmear(i)}
                    />
                  ) : (
                    <img className={s.picture} style={at(one.film)} src={films[one.film].still} alt="" />
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* the smeared copy, along the edges only: drawn from the films */}
          <div className={e.smear} aria-hidden="true">
            <div className={s.rail}>
              {story.map((one, i) => (
                <div key={one.film} ref={(slide) => { slides.current[1][i] = slide }} className={s.slide}>
                  <canvas
                    ref={(canvas) => { smears.current[i] = canvas }}
                    className={s.picture}
                    style={at(one.film)}
                    width={DRAWN}
                    height={Math.round(DRAWN / SHAPE)}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* the bulbs' light between two films */}
          <div ref={lamp} className={s.lamp} aria-hidden="true" />
        </div>

        {/* each film's two lines, and what it means: the ones whose film the box shows stand */}
        <div className={s.titles}>
          {story.map((one, i) => (
            <h2 key={one.film} ref={(h) => { titles.current[i] = h }} className={s.title}>
              <span>{one.title[0]}</span> <span>{one.title[1]}</span>
            </h2>
          ))}
        </div>
        {/* the third column, as the second reference lays out its markets (hyperliquid's): the mark on its card;
            and what the film means, each film's in one place, the one whose film the box shows standing */}
        <div className={s.side} data-logo={swimLogo ? '' : undefined}>
          {!swimLogo && <MarkTile ref={tile} className={s.tile} />}
          <div className={s.says}>
            {story.map((one, i) => (
              <div key={one.film} ref={(say) => { bodies.current[i] = say }} className={s.say} data-keyed="">
                <p className={s.lede} data-key="">{one.lede}</p>
                <p className={s.body}>{one.body}</p>
              </div>
            ))}
          </div>
          {/* (with the logo that stays: each film's three facts at the column's foot, level with the title's foot,
              the one whose film the box shows standing. Apart from the words above them, so that what goes and
              comes with a film is never as tall as the column) */}
          {swimLogo && (
            <div className={s.factsStack}>
              {story.map((one, i) => (
                <dl key={one.film} ref={(list) => { factLists.current[i] = list }} className={s.facts}>
                  {one.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>
                        {fact.value}
                        {'target' in fact && fact.target && <span> target</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
