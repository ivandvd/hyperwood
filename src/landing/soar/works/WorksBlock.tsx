/**
 * How it works, on the Ink (&ground=ink): one block, laid out as the reference lays out its own (trysoar.com/
 * institutional, read off its page: a block 1075 px wide at 1905, the words in a column of 541 px and a picture of
 * 470 by 588 beside it, 64 px between). At the left "How it works." and under it the part's headline, a paragraph,
 * and three facts, each an icon, a name and what it is, a hairline between them; at the right the part's picture in
 * a rounded card.
 *
 * The block comes as the last film goes out (its hold begins over the films' last screen, which is dark by then, so
 * there is no empty way between the two) and is held on the screen while the page goes on, and the three parts
 * change in it, one after another: the
 * architecture paper's first three (its own chain; matched in private and proven in public; markets on stocks and
 * indices). The scroll says which part it is; the change plays in its own time (the words go and the next come line
 * by line, the picture comes over the last one, which stays whole under it until it is covered), so it is never left
 * half way. Three short lines under the words show which part it is, and go to one when it is pressed.
 *
 * On an upright or narrow screen nothing is held: the three parts stand one under another, each with its picture
 * over it. Everything rises into place as the scroll brings it in (rise.ts). The words: `soar.works` (`title`,
 * `parts`) in content.home.ts; the pictures: src/assets/works (scripts/works/bake-works.py); where everything
 * stands: works.module.css.
 */
import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { home } from '../../../content.home'
import chain640 from '../../../assets/works/works-chain-640.webp'
import chain1120 from '../../../assets/works/works-chain-1120.webp'
import private640 from '../../../assets/works/works-private-640.webp'
import private1120 from '../../../assets/works/works-private-1120.webp'
import markets640 from '../../../assets/works/works-markets-640.webp'
import markets1120 from '../../../assets/works/works-markets-1120.webp'
import { fills, type FillName } from '../../../ui/icons'
import { useRise } from '../../rise'
import { whenStill } from '../../still'
import s from './works.module.css'

const W = home.soar.works

/** Each part's picture, 640 and 1120 wide (the first is as wide as it was given: 710). */
const PICTURES: Record<string, [small: string, large: string, largeWidth: number]> = {
  chain: [chain640, chain1120, 710],
  private: [private640, private1120, 1120],
  markets: [markets640, markets1120, 1120],
}

/** How far before its frame reaches its place the block comes, in screens. The last film goes out over the stretch
 *  that ends 0.053 of a screen before that (FilmBlock.tsx's EXIT, of a hold of 2.65 screens) and is under a tenth
 *  there by this point: so the block comes as the film's last light goes, and the screen is never empty between. */
const LEAD = 0.1

const step = (k: number) => ({ '--k': k }) as CSSProperties

export function WorksBlock() {
  const root = useRef<HTMLElement | null>(null)
  // (its words and its picture rise into place as the scroll brings them in: rise.ts)
  const riseIn = useRise<HTMLElement>()
  const both = useCallback(
    (el: HTMLElement | null) => {
      root.current = el
      return riseIn(el)
    },
    [riseIn],
  )
  /** how far down the page the block's hold begins, and how long it is (read when asked for) */
  const reach = useRef<() => [top: number, travel: number]>(() => [0, 0])
  useEffect(() => {
    const el = root.current
    const hold = el?.querySelector<HTMLElement>('[data-hold]')
    if (!el || !hold) return
    const parts = Array.from(el.querySelectorAll<HTMLElement>('[data-part]'))
    const pictures = Array.from(el.querySelectorAll<HTMLElement>('[data-picture]'))
    const ticks = Array.from(el.querySelectorAll<HTMLElement>('[data-tick]'))
    // Which part it is: how far the page has gone through the hold, in thirds. And whether the block is there at all:
    // where it is held, its hold begins over the films' last screen (works.module.css), so that it comes as the last
    // film goes out with no empty way between; it is there from just before its frame reaches its place (the last
    // film is all but gone by then: LEAD), and until then nothing of it is seen. (All read when the page has been
    // scrolled, while it is as it was last drawn; the frame only writes, and only when something changes.)
    let wanted = 0
    let shown = -1
    let live = false
    let was: boolean | null = null
    let raf = 0
    const read = () => {
      const box = hold.getBoundingClientRect()
      const travel = box.height - innerHeight
      const held = travel > 1
      const gone = held ? Math.min(0.999, Math.max(0, -box.top / travel)) : 0
      wanted = Math.floor(gone * parts.length)
      live = !held || box.top <= innerHeight * LEAD
    }
    const write = () => {
      raf = 0
      if (wanted === shown && live === was) return
      shown = wanted
      was = live
      el.toggleAttribute('data-live', live)
      // (a part is shown only while the block is there: so its lines and its picture come in as the block does)
      for (const list of [parts, pictures, ticks]) list.forEach((one, i) => one.toggleAttribute('data-on', live && i === shown))
      ticks.forEach((tick, i) => tick.setAttribute('aria-current', i === shown ? 'true' : 'false'))
    }
    const ask = () => {
      read()
      if (!raf) raf = requestAnimationFrame(write)
    }
    reach.current = () => {
      const box = hold.getBoundingClientRect()
      return [box.top + scrollY, box.height - innerHeight]
    }
    addEventListener('scroll', ask, { passive: true })
    addEventListener('resize', ask)
    ask()
    // (the pictures are fetched and unpacked at a still moment, before the page reaches them)
    const stop = whenStill(() => {
      pictures.forEach((picture) => {
        // (not where the card is not shown: there each part has its own picture)
        if (!(picture instanceof HTMLImageElement) || picture.offsetParent === null) return
        picture.loading = 'eager'
        void picture.decode().catch(() => {})
      })
    })
    return () => {
      removeEventListener('scroll', ask)
      removeEventListener('resize', ask)
      if (raf) cancelAnimationFrame(raf)
      stop()
    }
  }, [])
  /** to a part: the page goes to the middle of its third of the hold */
  const go = (i: number) => {
    const [top, travel] = reach.current()
    if (travel > 1) scrollTo({ top: top + (travel * (i + 0.5)) / W.parts.length, behavior: 'smooth' })
  }
  return (
    <section ref={both} id="how" className={s.works} data-block="" aria-labelledby="works-title">
      <div className={s.hold} data-hold="">
        <div className={s.frame}>
          <div className={s.block}>
            <div className={s.copy}>
              <h2 id="works-title" className={s.kicker} data-rise="">
                {W.title[0]}
              </h2>
              <div className={s.parts}>
                {W.parts.map((part) => {
                  const [small, large, largeWidth] = PICTURES[part.picture]
                  return (
                    <article key={part.title} className={s.part} data-part="">
                      <div data-rise="">
                        {/* (its own picture: only where the parts stand one under another) */}
                        <img className={s.own} src={small} srcSet={`${small} 640w, ${large} ${largeWidth}w`} sizes="92vw" width="640" height="800" alt={part.shows} loading="lazy" decoding="async" />
                        <h3 style={step(0)}>{part.title}</h3>
                        <p style={step(1)}>{part.text}</p>
                        <ul className={s.facts}>
                          {part.facts.map(([icon, name, what], k) => (
                            <li key={name} style={step(2 + k)} data-keyed="">
                              <i data-key="">{fills[icon as FillName]}</i>
                              <b data-key="">{name}</b>
                              <span>{what}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className={s.ticks} data-rise="">
                {W.parts.map((part, i) => (
                  <button key={part.title} type="button" data-tick="" aria-label={part.title} aria-current={i === 0 ? 'true' : 'false'} onClick={() => go(i)} />
                ))}
              </div>
            </div>

            <div className={s.card} data-rise="">
              {W.parts.map((part) => {
                const [small, large, largeWidth] = PICTURES[part.picture]
                return (
                  <img
                    key={part.picture}
                    data-picture=""
                    src={small}
                    srcSet={`${small} 640w, ${large} ${largeWidth}w`}
                    sizes="(max-width: 1023px) 1px, (max-aspect-ratio: 1/1) 1px, 25vw"
                    width="640"
                    height="800"
                    alt={part.shows}
                    loading="lazy"
                    decoding="async"
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
