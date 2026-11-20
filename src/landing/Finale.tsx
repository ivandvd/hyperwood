/**
 * The page's last screen before its foot (with the films after the hero: the address ?films=after), as the reference
 * ends its own (trysoar.com, "Try the beta"): a line in two tones at the left, the app on a phone standing on the
 * ground in the middle, seen from above and from its side with its long shadow, and the call to action at the right.
 *
 * Ours: the ground is the page's Ink, a light behind the phone lays a pool of Hyper Neon on it, and the shadow is the
 * dark in that. The picture is taken of the app's own markup (src/product/Standing.tsx, studio.html). The words:
 * `finale` in content.home.ts.
 */
import { useEffect, useRef } from 'react'
import { home } from '../content.home'
import standing1100 from '../assets/product/standing-1100.webp'
import standing2000 from '../assets/product/standing-2000.webp'
import { LaunchLink } from '../ui/LaunchLink'
import { whenStill } from './still'
import s from './finale.module.css'

export function Finale() {
  const F = home.finale
  const picture = useRef<HTMLImageElement>(null)
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
    <section className={s.finale} aria-labelledby="finale-title">
      <h2 id="finale-title" className={s.line}>
        <span>{F.title[0]}</span> <b>{F.title[1]}</b>
      </h2>
      <div className={s.picture}>
        <img ref={picture} src={standing1100} srcSet={`${standing1100} 1100w, ${standing2000} 2000w`} sizes="(max-width: 1023px) 128vw, 42vw" width="2000" height="1998" alt={F.shows} loading="lazy" decoding="async" />
      </div>
      <LaunchLink className={s.go} href={home.launch.href} soft>
        {home.launch.label}
      </LaunchLink>
    </section>
  )
}
