/**
 * A reel: a short film of the app, a few seconds long, that loops. It is not a video file: the page plays
 * it. The interface (the "set") is real markup laid on a plane, and a camera is moved over it: the plane is
 * turned and brought closer in perspective, one part of the picture is in focus and the rest is soft, the
 * whole goes soft when the camera swings from one thing to the next, and meanwhile the film changes what the
 * set shows (a figure counts, a knob is dragged, an order is sealed). So it is sharp on any screen, takes the
 * page's own type and colours, and weighs nothing to download.
 *
 * How the softness is made: the set is drawn twice. Once behind, blurred. Once in front, sharp, and shown
 * only inside a soft-edged oval: the place the lens is focused on. Both copies get the same camera and the
 * same changes.
 *
 * A film (films.ts) is its length, where the camera is at which moment, and what it does to the set. A reel
 * runs only while it is on screen, and for a reader who does not want motion it stands on one chosen moment.
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { whenStill } from '../still'
import s from './reel.module.css'

/** Where the camera is at a moment. Whatever a key leaves out runs on from the keys about it.
 *  `x`, `y`: the point of the set under the middle of the frame (px of the set). `s`: how close (1 is the
 *  set at its own size). `rx`, `ry`, `rz`: how the plane is turned (degrees). `fx`, `fy`: where in the frame
 *  the lens is focused (hundredths). `soft`: how far out of focus the whole picture is (px). `lit`: a light
 *  across the picture (0 to 1). */
export interface Key {
  t: number
  x?: number
  y?: number
  s?: number
  rx?: number
  ry?: number
  rz?: number
  fx?: number
  fy?: number
  soft?: number
  lit?: number
}
type Prop = Exclude<keyof Key, 't'>
const REST: Record<Prop, number> = { x: 0, y: 0, s: 1, rx: 0, ry: 0, rz: 0, fx: 50, fy: 50, soft: 0, lit: 0 }

/** A film's way to the parts of its set, by the name they carry (`data-part`), in both copies at once. */
export interface Parts {
  text(name: string, value: string): void
  /** A style property or a custom property of the part. */
  style(name: string, property: string, value: string): void
  /** A state the stylesheet answers to: `data-<flag>` on the part. */
  flag(name: string, flag: string, on: boolean): void
}

export interface Film {
  /** Seconds from its start to its loop. */
  length: number
  /** The frame the film was made for (px): the camera's distances are scaled to the frame it is shown in. */
  frame: [number, number]
  camera: Key[]
  /** What the film does to its set at moment `t`. */
  play(t: number, parts: Parts): void
  /** The moment it stands on for a reader who does not want motion. */
  still: number
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/** For each thing the camera has, its course through the film: eased from key to key. */
function course(keys: Key[]) {
  const tracks = {} as Record<Prop, (t: number) => number>
  for (const prop of Object.keys(REST) as Prop[]) {
    const points = keys.filter((key) => key[prop] !== undefined).map((key) => [key.t, key[prop] as number])
    tracks[prop] = (t) => {
      if (!points.length) return REST[prop]
      if (t <= points[0][0]) return points[0][1]
      for (let i = 1; i < points.length; i++) {
        if (t > points[i][0]) continue
        const [t0, v0] = points[i - 1]
        const [t1, v1] = points[i]
        return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0 || 1))
      }
      return points[points.length - 1][1]
    }
  }
  return tracks
}

interface Props {
  film: Film
  /** What the film shows, for those who cannot see it. */
  label: string
  /** Seconds this reel runs ahead, so reels side by side do not move as one. */
  ahead?: number
  children: ReactNode
}

export function Reel({ film, label, ahead = 0, children }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const sets = Array.from(el.querySelectorAll<HTMLElement>('[data-set]'))
    const found = new Map<string, HTMLElement[]>()
    const nodes = (name: string) => {
      let list = found.get(name)
      if (!list) {
        list = sets.flatMap((set) => Array.from(set.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)))
        found.set(name, list)
      }
      return list
    }
    /** What was last written, so nothing is written twice. */
    const written = new Map<string, string>()
    const fresh = (key: string, value: string) => {
      if (written.get(key) === value) return false
      written.set(key, value)
      return true
    }
    const parts: Parts = {
      text: (name, value) => {
        if (fresh(`t:${name}`, value)) for (const node of nodes(name)) node.textContent = value
      },
      style: (name, property, value) => {
        if (fresh(`s:${name}:${property}`, value)) for (const node of nodes(name)) node.style.setProperty(property, value)
      },
      flag: (name, flag, on) => {
        if (fresh(`f:${name}:${flag}`, on ? '1' : '')) for (const node of nodes(name)) node.toggleAttribute(`data-${flag}`, on)
      },
    }
    const at = course(film.camera)
    let scale = 1
    const measure = () => {
      scale = el.clientWidth / film.frame[0]
      el.style.setProperty('--k', scale.toFixed(4))
      written.delete('pose')
    }
    const show = (t: number) => {
      const pose = `rotateX(${at.rx(t).toFixed(2)}deg) rotateY(${at.ry(t).toFixed(2)}deg) rotateZ(${at.rz(t).toFixed(2)}deg) scale(${(at.s(t) * scale).toFixed(4)}) translate(${(-at.x(t)).toFixed(1)}px, ${(-at.y(t)).toFixed(1)}px)`
      if (fresh('pose', pose)) for (const set of sets) set.style.transform = pose
      const lens = `${at.fx(t).toFixed(1)}% ${at.fy(t).toFixed(1)}%`
      if (fresh('lens', lens)) el.style.setProperty('--focus', lens)
      const soft = at.soft(t).toFixed(2)
      if (fresh('soft', soft)) el.style.setProperty('--soft', soft)
      const lit = at.lit(t).toFixed(3)
      if (fresh('lit', lit)) el.style.setProperty('--lit', lit)
      film.play(t, parts)
    }

    const still = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let seen = false
    const began = performance.now()
    const tick = (now: number) => {
      frame = 0
      show(((now - began) / 1000 + ahead) % film.length)
      run()
    }
    const run = () => {
      if (frame || !seen || still.matches || document.hidden) return
      frame = requestAnimationFrame(tick)
    }
    const rest = () => {
      if (still.matches) show(film.still)
      else run()
    }
    const watch = new IntersectionObserver(
      (entries) => {
        seen = entries.some((entry) => entry.isIntersecting)
        run()
      },
      { rootMargin: '8% 0px' },
    )
    const resize = () => {
      measure()
      if (!frame) show(still.matches ? film.still : ((performance.now() - began) / 1000 + ahead) % film.length)
    }
    measure()
    show(still.matches ? film.still : ahead % film.length)
    watch.observe(el)
    // Off screen a reel is not laid out at all (reel.module.css), and laying its two sets out takes the page's
    // thread several frames on a phone. Left to the browser that happens as the reader comes near, which on the
    // landing page is while the journey's light goes to the gate: so it is done at a still moment before.
    const laid = whenStill(() => {
      el.dataset.laid = ''
    })
    addEventListener('resize', resize)
    document.addEventListener('visibilitychange', run)
    still.addEventListener('change', rest)
    return () => {
      laid()
      watch.disconnect()
      removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', run)
      still.removeEventListener('change', rest)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [film, ahead])

  const shape = { aspectRatio: `${film.frame[0]} / ${film.frame[1]}` } as CSSProperties
  return (
    <div ref={root} className={s.reel} style={shape} role="img" aria-label={label}>
      {/* (the same set twice: soft behind, sharp in front where the lens is focused) */}
      <div className={s.far} aria-hidden="true" inert>
        <div className={s.set} data-set="">
          {children}
        </div>
      </div>
      <div className={s.near} aria-hidden="true" inert>
        <div className={s.set} data-set="">
          {children}
        </div>
      </div>
      <div className={s.lens} aria-hidden="true" />
    </div>
  )
}
