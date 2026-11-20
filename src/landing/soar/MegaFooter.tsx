/**
 * The foot of the page on the light ground (&flow=soar), as the reference's (trysoar.com): in the middle column, a
 * row with the long read at the left and where to follow at the right, over a hairline; the ways around the site in
 * columns, each under a small heading; what the papers insist on being said; and the mark and the year at the foot.
 * The channels have no address yet (as in the gate's panel, content.home.ts: panel): until then each points to a part
 * of the page that does not exist.
 *
 * With &foot=ink or &foot=neon the words stand darker and larger, as the reference's do; the channels are their
 * icons; each note is led by a few words in bold; and the page ends in a card with the logo large across it, Neon
 * on Ink (the brand's pairing for the web, on the ground of the phone shots: Ink, with the Neon mixed into one
 * corner, through a grain) or Ink on Neon (its pairing for a moment of recognition). The logo comes in once, as the
 * brand kit's Rise has it (600 ms, a 12 px lift, its one curve), when the card is a third on the screen.
 */
import { useEffect, useRef } from 'react'
import { BRAND, home } from '../../content.home'
import { icons } from '../../ui/icons'
import { footCard } from '../flags'
import { grain } from '../grain'
import s from './soar.module.css'

export function MegaFooter() {
  const F = home.footer
  const channels = home.panel[1].filter((link) => link.icon && link.icon !== 'docs')
  const x = channels.find((link) => link.icon === 'x')
  const columns: [string, { label: string; href: string }[]][] = [
    ['Product', [home.launch, { label: 'The app', href: '#app' }, { label: 'Mobile', href: '#mobile' }]],
    ['Learn', [{ label: 'Architecture', href: 'architecture/' }, { label: 'Docs', href: 'architecture/' }]],
    ['Community', channels.map((link) => ({ label: link.label, href: link.href }))],
  ]
  const card = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = card.current
    if (!el) return
    el.style.setProperty('--grain', grain())
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.setAttribute('data-shown', '')
        watch.disconnect()
      },
      { threshold: 0.35 },
    )
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  return (
    <footer className={`${s.paper} ${s.foot}`} data-light="" data-card={footCard ?? undefined}>
      <div className={s.footTop}>
        <a href="architecture/">Read the architecture</a>
        {footCard ? (
          <div className={s.follow}>
            <span>Follow us on</span>
            {channels.map((link) => (
              <a key={link.label} href={link.href} aria-label={link.label}>
                {link.icon && icons[link.icon]}
              </a>
            ))}
          </div>
        ) : (
          x && (
            <a href={x.href}>
              Follow us on
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                <path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.17h1.7L7.4 4.73H5.58l11.09 14.44Z" />
              </svg>
            </a>
          )
        )}
      </div>
      <nav className={s.footCols} aria-label="Footer">
        {columns.map(([heading, links]) => (
          <div key={heading}>
            <p>{heading}</p>
            {links.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className={s.footInfo}>
        <p>Product information</p>
        {F.notes.map((note, i) => (
          <p key={note}>
            {footCard && <b>{F.leads[i]} </b>}
            {note}
          </p>
        ))}
      </div>
      {footCard ? (
        <>
          <div ref={card} className={s.footCard} data-ground={footCard}>
            <span className={s.footLockup} role="img" aria-label={BRAND} />
          </div>
          <div className={s.footBottom}>
            <span>{F.rights}</span>
            <span className={s.footLine}>
              <span>{F.tagline[0]}</span> <b>{F.tagline[1]}</b>
            </span>
          </div>
        </>
      ) : (
        <div className={s.footBottom}>
          <span className={s.footMark} role="img" aria-label={BRAND} />
          <span>{F.rights}</span>
        </div>
      )}
    </footer>
  )
}
