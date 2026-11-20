/**
 * The page's last screen on the light ground (&flow=soar), as the reference ends its own (trysoar.com, "Try the
 * beta."): one screen; a line in two tones at the left of the middle column; in the middle the mobile app on an
 * iPhone; at the right of it the call to action as a white pill.
 *
 * The iPhone is Apple's own picture of it (an iPhone 18 Pro in silver, a product bezel from Apple's Design
 * Resources) with the app's screen laid into it (scripts/product: bake-bezel.py), shown as Apple's marketing
 * guidelines ask: as it is, upright and straight on, with nothing added (no shadow, no tilt), the words beside it and
 * not over it. (The reference's phone is turned and casts a long shadow; Apple's guidelines rule out both, and rule out
 * drawing an iPhone of one's own.) The words: `finale` in content.home.ts.
 */
import { useEffect, useRef } from 'react'
import { home } from '../../content.home'
import iphone700 from '../../assets/product/iphone-real-700.webp'
import iphone1350 from '../../assets/product/iphone-real-1350.webp'
import { whenStill } from '../still'
import s from './soar.module.css'

export function TryIt() {
  const F = home.finale
  const picture = useRef<HTMLImageElement>(null)
  // (fetched and unpacked at a still moment before the page reaches it)
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
    <section className={`${s.paper} ${s.tryit}`} aria-labelledby="tryit-title" data-light="">
      <h2 id="tryit-title" className={s.tryLine}>
        <span>{F.title[0]}</span> <b>{F.title[1]}</b>
      </h2>
      <img
        ref={picture}
        className={s.iphone}
        src={iphone700}
        srcSet={`${iphone700} 700w, ${iphone1350} 1350w`}
        sizes="(max-width: 1023px) 62vw, 36vh"
        width="1350"
        height="2760"
        alt={home.soar.ending.shows}
        loading="lazy"
        decoding="async"
      />
      <a className={s.whitePill} href={home.launch.href}>
        {home.launch.label}
      </a>
    </section>
  )
}
