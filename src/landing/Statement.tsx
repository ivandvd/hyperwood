/**
 * The statement, after the films (the address ?films=after, After.tsx), as the reference has its own after its first
 * screen (bulk.trade, measured on its page): one screen of the page's Ink with its words in the upper part, and
 * under them three steps of light, flush with the screen's left edge, the longest at the foot. The words are laid
 * out as aevo.xyz lays out its own statement: a headline at the left; at the right a paragraph in small type with its
 * key words in white, and under it two heavy lines.
 *
 * Everything in it moves with the scroll, not by itself. The headline's lines, the paragraph and the heavy lines rise
 * one after another as it comes up, the last of them as it reaches the top. Then it is held on the screen (its frame is sticky for --pin more of scrolling:
 * statement.module.css) while the steps fill with light from the left at the reference's own pace, the lowest
 * first: the lowest while the first third of a screen goes past, the middle one from 0.12 to 0.52 of a screen, the
 * highest from a quarter to three quarters. Then it lets go.
 *
 * The words: `statement` in content.home.ts.
 */
import { useCallback, useEffect, useRef } from 'react'
import { home } from '../content.home'
import s from './statement.module.css'

/** How many things rise: the headline's lines, the paragraph, the heavy lines. */
const COUNT = home.statement.title.length + 1 + home.statement.heavy.length
/** The paragraph, its words between stars in white. */
const marked = (text: string) => text.split('*').map((part, i) => (i % 2 ? <b key={i} data-key="">{part}</b> : part))
/** When each line rises: how far the statement has come up the screen (0: its top at the foot, 1: at the top). The
 *  lines follow one another a tenth of a screen apart, closer when there are more of them, so the last is always in
 *  place a little after the statement has reached the top. */
const GAP = Math.min(0.09, 0.45 / Math.max(1, COUNT - 1))
const LINE = (i: number): [number, number] => [0.32 + GAP * i, 0.62 + GAP * i]
/** When each step fills, the highest to the lowest: screens of scrolling since the statement came to fill the
 *  screen (the reference's pace). */
const STEP: [number, number][] = [
  [0.25, 0.75],
  [0.12, 0.52],
  [0, 1 / 3],
]
const clamp = (x: number) => Math.min(1, Math.max(0, x))
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)

/** A style is written only when it changes (most of the time the scroll moves the page and nothing in here). */
const said = new WeakMap<HTMLElement, Record<string, string>>()
const put = (el: HTMLElement | null | undefined, name: 'opacity' | 'transform', value: string) => {
  if (!el) return
  let had = said.get(el)
  if (!had) said.set(el, (had = {}))
  if (had[name] === value) return
  had[name] = value
  el.style[name] = value
}

export function Statement() {
  const S = home.statement
  const root = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const lines = useRef<(HTMLElement | null)[]>([])
  const fills = useRef<(HTMLElement | null)[]>([])

  // The headline is as large as the reference's, and no larger than lets its longest line stand on one line in its
  // column (--st-w: its width in ems, measured once the typeface is there and whenever the words are put in the page).
  const putWords = useCallback((box: HTMLDivElement | null) => {
    if (!box) return
    const measure = () => {
      const widths = Array.from(box.querySelectorAll<HTMLElement>('[data-fit]')).map((line) => {
        const range = document.createRange()
        range.selectNodeContents(line)
        return range.getBoundingClientRect().width / (parseFloat(getComputedStyle(line).fontSize) || 1)
      })
      const widest = Math.max(0, ...widths)
      if (widest > 0) box.style.setProperty('--st-w', widest.toFixed(3))
    }
    measure()
    void document.fonts.ready.then(measure)
  }, [])

  useEffect(() => {
    const el = root.current
    const held = frame.current
    if (!el || !held) return
    let raf = 0
    // Where it is, read when the page has been scrolled (then the page is as it was last drawn, and reading it costs
    // nothing); the frame only writes. (Read in the frame, after the app's films below had written their styles,
    // the reading made the browser work the page's styles out again with every frame.)
    // (the window's height too: in this browser reading it in the frame works the page's layout out as well)
    let top = 0
    let frameH = 1
    let vh = 1
    const measure = () => {
      top = el.getBoundingClientRect().top
      frameH = Math.max(1, held.offsetHeight)
      vh = Math.max(1, innerHeight)
    }
    const update = () => {
      raf = 0
      const rise = (vh - top) / vh
      const past = -top / frameH
      lines.current.forEach((line, i) => {
        const [from, to] = LINE(i)
        const k = easeOut(clamp((rise - from) / (to - from)))
        put(line, 'opacity', k.toFixed(3))
        put(line, 'transform', k < 1 ? `translate3d(0, ${((1 - k) * 0.6).toFixed(3)}em, 0)` : 'none')
      })
      STEP.forEach(([from, to], i) => put(fills.current[i], 'transform', `scaleX(${clamp((past - from) / (to - from)).toFixed(4)})`))
    }
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    // (the scroll is followed only while the statement is within half a screen of being seen; it is brought up to
    // date once more as it goes out of that, so it is left as it should be)
    let near = false
    const scrolled = () => {
      if (!near) return
      measure()
      ask()
    }
    const sized = () => {
      measure()
      ask()
    }
    const watch = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting
      measure()
      ask()
    }, { rootMargin: '50% 0px' })
    watch.observe(el)
    measure()
    update()
    addEventListener('scroll', scrolled, { passive: true })
    addEventListener('resize', sized)
    return () => {
      watch.disconnect()
      removeEventListener('scroll', scrolled)
      removeEventListener('resize', sized)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={root} className={s.statement} aria-label="What Hyperwood is">
      <div ref={frame} className={s.frame}>
        <div ref={putWords} className={s.words}>
          <h2 className={s.title}>
            {S.title.map((line, i) => (
              <span key={line} data-rise="" data-fit="" ref={(node) => { lines.current[i] = node }}>
                {/* (the space between the lines counts on a narrow screen, where they run on as one sentence) */}
                {i < S.title.length - 1 ? line + ' ' : line}
              </span>
            ))}
          </h2>
          <div className={s.side}>
            <p data-rise="" data-keyed="" className={s.body} ref={(node) => { lines.current[S.title.length] = node }}>
              {marked(S.body)}
            </p>
            <div className={s.closing}>
              {S.heavy.map((line, i) => (
                <p key={line} data-rise="" ref={(node) => { lines.current[S.title.length + 1 + i] = node }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className={s.steps} aria-hidden="true">
          {STEP.map((_, i) => (
            <span key={i} className={s.step}>
              <i />
              <b ref={(node) => { fills.current[i] = node }} />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
