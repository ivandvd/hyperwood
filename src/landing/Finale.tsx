/**
 * The page's last screen before its foot (with the films after the hero: the address ?films=after), as the reference
 * ends its own (trysoar.com, "Try the beta"): a line in two tones at the left, the app on a phone standing on the
 * ground in the middle, seen from above and from its side with its long shadow, and the call to action at the right.
 *
 * Ours: the ground is the page's Ink, a light behind the phone lays a pool of Hyper Neon on it, and the shadow is the
 * dark in that. The phone is the reference's kind: silver, its metal side and its buttons towards the camera (the model
 * of the phone shots, scripts/product/shot.js, with the app's own screen under its glass; the pool and the shadow are
 * taken of src/product/Standing.tsx on studio.html, and scripts/product/bake-standing.py puts them together). The words:
 * `finale` in content.home.ts.
 */
import { useEffect, useRef } from 'react'
import { home } from '../content.home'
import standing1100 from '../assets/product/standing-1100.webp'
import standing2000 from '../assets/product/standing-2000.webp'
import { LaunchLink } from '../ui/LaunchLink'
import { useRise } from './rise'
import { whenStill } from './still'
import s from './finale.module.css'

/** `call`: with the call to action at the phone's right, or (false) without it. */
export function Finale({ call = true }: { call?: boolean }) {
  const F = home.finale
  const picture = useRef<HTMLImageElement>(null)
  // (its line and the phone rise into place as the scroll brings them in: rise.ts)
  const riseIn = useRise<HTMLElement>()
  // (the picture is fetched and unpacked at a still moment, before the page is scrolled to it)
  useEffect(
    () =>
      whenStill(() => {
        const img = picture.current
        if (!img) return
        img.loading = 'eager'
        void img.decode().catch(() => {})
      }),
    [],
  )
  return (
    <section ref={riseIn} className={s.finale} aria-labelledby="finale-title">
      <h2 id="finale-title" className={s.line}>
        <span data-rise="">{F.title[0]}</span> <b data-rise="">{F.title[1]}</b>
      </h2>
      <div className={s.picture}>
        <img data-rise="" ref={picture} src={standing1100} srcSet={`${standing1100} 1100w, ${standing2000} 2000w`} sizes="(max-width: 1023px) 128vw, 42vw" width="2000" height="1991" alt={F.shows} loading="lazy" decoding="async" />
      </div>
      {call && (
        <LaunchLink className={s.go} href={home.launch.href} soft>
          {home.launch.label}
        </LaunchLink>
      )}
    </section>
  )
}
