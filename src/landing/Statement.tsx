/**
 * The statement, after the films (the address ?films=after, After.tsx), as the reference has its own after its first
 * screen (bulk.trade, measured on its page): one screen of the page's Ink; five lines of large type at its upper
 * left, the first three light and the last two heavy, each on a line of its own; and under them three steps of
 * light, flush with the screen's left edge, the longest at the foot.
 *
 * Everything in it moves with the scroll, not by itself. The lines rise one after another as it comes up, each as
 * it clears the foot of the screen. Then it is held on the screen (its frame is sticky for --pin more of scrolling:
 * statement.module.css) while the steps fill with light from the left at the reference's own pace, the lowest
 * first: the lowest while the first third of a screen goes past, the middle one from 0.12 to 0.52 of a screen, the
 * highest from a quarter to three quarters. Then it lets go.
 *
 * The words: `statement` in content.home.ts.
 */
import { useCallback, useEffect, useRef } from 'react'
import { home } from '../content.home'
import s from './statement.module.css'

/** When each line rises: how far the statement has come up the screen (0: its top at the foot, 1: at the top). */
const LINE = (i: number): [number, number] => [0.32 + 0.09 * i, 0.62 + 0.09 * i]
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
  const words = [...S.light.map((line) => ({ line, heavy: false })), ...S.heavy.map((line) => ({ line, heavy: true }))]
  const root = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const lines = useRef<(HTMLElement | null)[]>([])
  const fills = useRef<(HTMLElement | null)[]>([])

  // The words are as large as the reference's, and no larger than lets the longest line stand on one line
  // (--st-w: its width in ems, measured once the typeface is there and whenever the words are put in the page).
  const putWords = useCallback((box: HTMLDivElement | null) => {
    if (!box) return
    const measure = () => {
      const widths = Array.from(box.querySelectorAll('p')).map((p) => {
        const range = document.createRange()
        range.selectNodeContents(p)
        return range.getBoundingClientRect().width / (parseFloat(getComputedStyle(p).fontSize) || 1)
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
    const update = () => {
      raf = 0
      const top = el.getBoundingClientRect().top
      const rise = (innerHeight - top) / Math.max(1, innerHeight)
      const past = -top / Math.max(1, held.offsetHeight)
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
      if (near) ask()
    }
    const watch = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting
      ask()
    }, { rootMargin: '50% 0px' })
    watch.observe(el)
    update()
    addEventListener('scroll', scrolled, { passive: true })
    addEventListener('resize', ask)
    return () => {
      watch.disconnect()
      removeEventListener('scroll', scrolled)
      removeEventListener('resize', ask)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={root} className={s.statement} aria-label="What Hyperwood is">
      <div ref={frame} className={s.frame}>
        <div ref={putWords} className={s.words}>
          {words.map(({ line, heavy }, i) => (
            <p key={line} ref={(node) => { lines.current[i] = node }} className={heavy ? s.heavy : s.light}>
              {line}
            </p>
          ))}
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
