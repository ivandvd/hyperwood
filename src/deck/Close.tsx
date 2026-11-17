/**
 * Frame 4: the close. The page ends where it began, on the tagline, now over the brand's own picture: the
 * kit's liquid artwork ("glossy dark material, neon reflected light, strong areas of quiet space"), with one
 * call to action in its quiet side. The picture arrives with the kit's Resolve, coarse blocks settling into
 * the sharp image, and it drifts a little with the scroll and the pointer.
 */
import { useEffect, useRef, useState } from 'react'
import { landing } from '../content.landing'
import { sections } from '../content.sections'
import { Arrow } from '../sections/devices'
import kit from '../sections/kit.module.css'
import artwork from '../assets/brand/hyperwood-liquid-artwork.jpg'
import artworkSmall from '../assets/brand/hyperwood-liquid-artwork-1200.jpg'
import { Frame } from './Frame'
import { resolve } from './resolve'
import { deckStill, useProgress } from './track'
import s from './close.module.css'

function Picture() {
  const art = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [shown, setShown] = useState(false)
  const lean = useRef({ x: 0, y: 0, drift: 0 })

  const place = () => {
    const el = inner.current
    const L = lean.current
    if (el) el.style.transform = `translate3d(${(-L.x * 10).toFixed(2)}px, ${(L.drift - L.y * 8).toFixed(2)}px, 0)`
  }

  useProgress((p) => {
    // the picture is there while the card is still on its way up, so the card never arrives empty
    if (!shown && (deckStill() || p.arrive > 0.26)) setShown(true)
    lean.current.drift = deckStill() ? 0 : (1 - p.arrive) * 40 - p.dwell * 16
    place()
  })

  // the Resolve, once, when the frame is mostly in
  useEffect(() => {
    const picture = img.current
    const cv = canvas.current
    if (!shown || !picture || !cv || deckStill()) return
    let stop = () => {}
    const run = () => {
      stop = resolve(picture, cv)
    }
    if (picture.complete && picture.naturalWidth) run()
    else picture.addEventListener('load', run, { once: true })
    return () => {
      picture.removeEventListener('load', run)
      stop()
    }
  }, [shown])

  // the picture leans a few pixels away from the pointer (fine pointers only)
  useEffect(() => {
    const el = art.current
    if (!el || deckStill() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const host = el.closest('section')
    let queued = 0
    const move = (e: PointerEvent) => {
      lean.current.x = (e.clientX / window.innerWidth) * 2 - 1
      lean.current.y = (e.clientY / window.innerHeight) * 2 - 1
      if (!queued)
        queued = requestAnimationFrame(() => {
          queued = 0
          place()
        })
    }
    host?.addEventListener('pointermove', move, { passive: true })
    return () => {
      host?.removeEventListener('pointermove', move)
      cancelAnimationFrame(queued)
    }
  }, [])

  return (
    <>
      <div className={s.art} ref={art} data-in={shown ? '' : undefined} aria-hidden>
        <div className={s.artIn} ref={inner}>
          <img ref={img} src={artwork} srcSet={`${artworkSmall} 1200w, ${artwork} 1536w`} sizes="(max-width: 900px) 100vw, 80vw" width={1536} height={1024} alt="" decoding="async" />
          <canvas ref={canvas} />
        </div>
      </div>
      <div className={s.shade} aria-hidden />
    </>
  )
}

export function Close() {
  const C = landing.close
  const cta = sections.cta
  return (
    <Frame
      id="launch"
      dwell={0.3}
      last
      label={C.label}
      title={C.title}
      lead={C.lead}
      className={s.close}
      aside={
        <a
          className={`${kit.btn} ${s.cta}`}
          href={cta.href}
          onClick={(e) => {
            // no destination yet: stay where you are instead of jumping to the top
            if (cta.href === '#') e.preventDefault()
          }}
        >
          {cta.label}
          <Arrow />
        </a>
      }
    >
      <Picture />
    </Frame>
  )
}
