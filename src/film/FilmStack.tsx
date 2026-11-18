/**
 * The films one over another in a box, one of them to be seen: the room of the landing page's journey, which
 * changes film as the page is scrolled (journey/timeline.ts says which film is in the box).
 *
 * The film that is in the box plays, round and round (the films are finished so that their end runs on into
 * their beginning: scripts/film/tint.cjs, LOOP); the others rest where they were. Nothing plays while the page
 * is hidden, and under reduced motion a film stands still.
 *
 * The box's upper and lower edges fade into the page, plainly: each film is in the page once. (The film page's
 * strip draws its films twice, the second time smeared along those edges: edges.tsx. Here that copy cost
 * frames: with it every new frame of the film made the screen miss a refresh, about one frame in five while a
 * film played; without it none is late. Measured on the production build, the frames shown read from a trace.)
 *
 * The journey's own light is the films' bulb, so the journey has to know where each film's bulb hangs on the
 * screen: `lights`.
 *
 * Which films there are, and what is known about each: reel.ts. How the box looks: filmStack.module.css.
 */
import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'
import { films, SHAPE, type FilmName } from './reel'
import s from './filmStack.module.css'

export interface FilmStackHandle {
  /** The box. */
  readonly box: HTMLElement | null
  /** Which film is in the box: its place in `films`, or -1 for none. */
  show(which: number): void
  /** Where each film's bulb hangs on the screen, and how wide that film is drawn there (px, as the viewport
   *  counts), in the order of `films`. */
  lights(): { x: number; y: number; width: number }[]
  /** The films may be fetched now: the first at once, each of the others when the one before it is in the
   *  box. (Until then only their stills are.) */
  fetch(): void
}

interface Props {
  ref?: Ref<FilmStackHandle>
  className?: string
  /** The films, in the order they are shown. */
  films: FilmName[]
  /** What each film shows, for those who cannot see it. */
  labels: Record<FilmName, string>
}

/** A CSS position given in per cent, as a share. */
const share = (value: string | undefined) => (value?.endsWith('%') ? parseFloat(value) / 100 : 0.5)

export function FilmStack({ ref, className, films: names, labels }: Props) {
  const box = useRef<HTMLDivElement>(null)
  /** the films, in their order */
  const pictures = useRef<(HTMLVideoElement | undefined)[]>([])
  const [shown, setShown] = useState(-1)
  /** how many of the films may be fetched */
  const [wanted, setWanted] = useState(0)

  useImperativeHandle(
    ref,
    () => ({
      get box() {
        return box.current
      },
      show: (which) => {
        setShown(which)
        // (the film after the one in the box may come too)
        if (which >= 0) setWanted((now) => (now > 0 ? Math.max(now, Math.min(names.length, which + 2)) : now))
      },
      lights: () =>
        names.map((name, i) => {
          const v = pictures.current[i]
          const r = v?.getBoundingClientRect()
          if (!v || !r || r.width < 1 || r.height < 1) return { x: 0, y: 0, width: 0 }
          const [x, y] = getComputedStyle(v).objectPosition.split(' ')
          // the film covers the box: as wide as the box, or as tall, whichever leaves nothing bare
          const wide = r.width / r.height > SHAPE
          const w = wide ? r.width : r.height * SHAPE
          const h = wide ? r.width / SHAPE : r.height
          const [bx, by] = films[name].bulb
          return { x: r.left + (r.width - w) * share(x) + bx * w, y: r.top + (r.height - h) * share(y) + by * h, width: w }
        }),
      fetch: () => setWanted((now) => Math.max(now, 1)),
    }),
    [names],
  )

  // (a film that was held back is asked for once it may come)
  useEffect(() => {
    for (const v of pictures.current.slice(0, wanted)) if (v && v.readyState === 0 && v.networkState !== v.NETWORK_LOADING) v.load()
  }, [wanted])

  // the film in the box plays; the others rest
  useEffect(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const all = pictures.current
    const update = () => {
      const may = !document.hidden && !calm.matches
      all.forEach((v, i) => {
        if (!v) return
        if (i === shown && may) void v.play().catch(() => {})
        else v.pause()
      })
    }
    update()
    document.addEventListener('visibilitychange', update)
    calm.addEventListener('change', update)
    return () => {
      document.removeEventListener('visibilitychange', update)
      calm.removeEventListener('change', update)
      all.forEach((v) => v?.pause())
    }
  }, [shown])

  return (
    <div ref={box} className={className ? `${s.stack} ${className}` : s.stack}>
      {names.map((name, i) => (
        <video
          key={name}
          ref={(v) => {
            pictures.current[i] = v ?? undefined
          }}
          className={s.picture}
          data-in={i === shown ? '' : undefined}
          style={{ '--at': `${films[name].at}%` } as CSSProperties}
          src={films[name].clip}
          poster={films[name].still}
          muted
          loop
          playsInline
          preload={i < wanted ? 'auto' : 'none'}
          aria-label={i === shown ? labels[name] : undefined}
          aria-hidden={i === shown ? undefined : true}
          tabIndex={-1}
        />
      ))}
    </div>
  )
}
