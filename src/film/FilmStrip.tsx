/**
 * The strip: the films going round in a box by themselves, as film does through a gate. The film page's way
 * of showing them (the landing page changes film as it is scrolled: FilmStack.tsx).
 *
 * The box's upper and lower edges melt into the page (edges.tsx). When a film has played, the strip moves on
 * by one frame's height and the next film rises.
 *
 * Whoever uses it places the box (`className`) and says when it runs (`run`): the films play only then, and
 * never while the page is hidden or under reduced motion.
 *
 * Which films, and what is known about each: reel.ts. How the strip looks: filmStrip.module.css.
 */
import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react'
import { COPIES, useSmear, type Copy } from './edges'
import { films, reel, type FilmName } from './reel'
import s from './filmStrip.module.css'

/** The strip moves on this long before a film ends (the reference lets 4.8 s of a 5.2 s film play), and the
 *  move takes this long (ms). The stylesheet's transition has the same length. */
const EARLY = 420
const MOVE = 760
/** What a film is taken to last until the browser knows (s). */
const LENGTH = 7.3

type Place = 'here' | 'below' | 'above'
interface Slot {
  place: Place
  /** how many films have gone before this one: which film it shows */
  turn: number
}

export interface FilmStripHandle {
  /** Start or stop. */
  run(on: boolean): void
}

interface Props {
  ref?: Ref<FilmStripHandle>
  className?: string
  /** What each film shows, for those who cannot see it. */
  labels: Record<FilmName, string>
  /** Whatever rides on a frame with its film: told how many films went before it, which copy of the strip
   *  this is, and whether it is the one that is seen. */
  inFrame?: (turn: number, copy: Copy, shown: boolean) => ReactNode
}

export function FilmStrip({ ref, className, labels, inFrame }: Props) {
  const box = useRef<HTMLDivElement>(null)
  /** the films, by slot: one in the sharp copy and one in the smeared copy */
  const playing = useRef<HTMLVideoElement[][]>([[], []])
  const [slots, setSlots] = useState<Slot[]>([
    { place: 'here', turn: 0 },
    { place: 'below', turn: 1 },
  ])
  const smear = useSmear(box)
  /** which slot is showing, and each slot's turn (what `slots` says, for the script) */
  const now = useRef({ front: 0, turn: [0, 1] })
  const control = useRef<FilmStripHandle | null>(null)

  useImperativeHandle(ref, () => ({ run: (on) => control.current?.run(on) }), [])

  useEffect(() => {
    const at = now.current
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    /** asked to run; running in fact */
    let on = false
    let live = false
    let next = 0
    let settle = 0
    /** the slot whose frame is on its way out, or -1 */
    let leaving = -1

    const each = (slot: number, act: (v: HTMLVideoElement) => void) => playing.current[slot].forEach(act)
    const play = (slot: number, fromStart: boolean) =>
      each(slot, (v) => {
        if (fromStart) v.currentTime = 0
        void v.play().catch(() => {})
      })
    const pause = (slot: number) => each(slot, (v) => v.pause())
    /** how long the film in a slot still has to play before the strip moves on (ms) */
    const left = (slot: number) => {
      const v = playing.current[slot][0]
      const length = v && Number.isFinite(v.duration) && v.duration > 1 ? v.duration : LENGTH
      return Math.max(1200, (length - (v ? v.currentTime : 0)) * 1000 - EARLY)
    }

    /** The frame that has left waits below, with the film after the next one. */
    const settled = () => {
      window.clearTimeout(settle)
      settle = 0
      if (leaving < 0) return
      const from = leaving
      leaving = -1
      pause(from)
      at.turn[from] = at.turn[1 - from] + 1
      const turn = at.turn[from]
      setSlots((slots) => slots.map((slot, i) => (i === from ? { place: 'below', turn } : slot)))
    }
    const moveOn = () => {
      // (a move never begins on top of another)
      settled()
      const from = at.front
      const to = 1 - from
      at.front = to
      leaving = from
      play(to, true)
      setSlots((slots) => slots.map((slot, i) => ({ ...slot, place: i === to ? 'here' : 'above' })))
      settle = window.setTimeout(settled, MOVE + 60)
      next = window.setTimeout(moveOn, left(to))
    }
    const update = () => {
      const run = on && !document.hidden && !calm.matches
      if (run === live) return
      live = run
      window.clearTimeout(next)
      next = 0
      if (live) {
        play(at.front, false)
        next = window.setTimeout(moveOn, left(at.front))
      } else {
        settled()
        pause(0)
        pause(1)
      }
    }

    control.current = {
      run(yes) {
        if (yes === on) return
        on = yes
        update()
      },
    }
    document.addEventListener('visibilitychange', update)
    calm.addEventListener('change', update)
    return () => {
      control.current = null
      document.removeEventListener('visibilitychange', update)
      calm.removeEventListener('change', update)
      window.clearTimeout(next)
      settled()
      pause(0)
      pause(1)
    }
  }, [])

  return (
    <div ref={box} className={className ? `${s.strip} ${className}` : s.strip}>
      {COPIES.map((copy) => (
        <div key={copy} {...smear.copy(copy)}>
          {slots.map((slot, i) => {
            const name = reel[slot.turn % reel.length]
            const shown = copy === 'sharp' && slot.place === 'here'
            return (
              <div key={i} className={s.frame} data-place={slot.place}>
                <video
                  ref={(v) => {
                    if (v) playing.current[i][copy === 'sharp' ? 0 : 1] = v
                  }}
                  className={s.picture}
                  style={{ '--at': `${films[name].at}%` } as CSSProperties}
                  src={films[name].clip}
                  poster={films[name].still}
                  muted
                  playsInline
                  preload="auto"
                  aria-label={shown ? labels[name] : undefined}
                  aria-hidden={shown ? undefined : true}
                  tabIndex={-1}
                />
                {inFrame?.(slot.turn, copy, shown)}
              </div>
            )
          })}
        </div>
      ))}
      {smear.defs}
    </div>
  )
}
