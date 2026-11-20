/**
 * The way around the site on a screen with no room for the bar's row (a phone, a tablet held upright): a button
 * at the bar's right, and behind it a sheet over the whole screen with what the row has: the site's parts and
 * the docs as rows, the channels as their icons under them, and the call to action at its foot, as broad as the
 * sheet.
 *
 * The button stands where the header's call to action stands on the other screens: at the hero that one gives
 * way to it (timeline.ts), which is why the sheet carries the call to action. The sheet lies on the page itself.
 * It has the logo where the hero has it, and its own button to close where the one that opened it stands. While
 * it is open the page does not scroll, Escape closes it, and so does a screen that has become wide enough for
 * the row. A screen with the row has neither the button nor the sheet (menu.module.css).
 */
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { home, type PanelLink } from '../content.home'
import lockup from '../assets/brand/hyperwood-lockup-neon.svg'
import { icons } from '../ui/icons'
import { LaunchLink } from '../ui/LaunchLink'
import { ROW } from './row'
import s from './menu.module.css'

const away = (href: string) => (/^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})

export function Menu({ ways, channels }: { ways: PanelLink[]; channels: PanelLink[] }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const opener = useRef<HTMLButtonElement>(null)
  const closer = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const was = root.style.overflow
    root.style.overflow = 'hidden'
    closer.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const row = window.matchMedia(ROW)
    const onRow = () => {
      if (row.matches) setOpen(false)
    }
    addEventListener('keydown', onKey)
    row.addEventListener('change', onRow)
    const from = opener.current
    return () => {
      root.style.overflow = was
      removeEventListener('keydown', onKey)
      row.removeEventListener('change', onRow)
      from?.focus({ preventScroll: true })
    }
  }, [open])

  const shut = () => setOpen(false)
  // (the button's two lines: side by side they open, crossed they close)
  const lines = (
    <>
      <span />
      <span />
    </>
  )
  return (
    <>
      <button ref={opener} type="button" className={s.open} aria-label={home.menu.open} aria-expanded={open} aria-controls={id} onClick={() => setOpen(true)}>
        {lines}
      </button>
      {createPortal(
        <div id={id} className={s.sheet} data-open={open ? '' : undefined} role="dialog" aria-modal="true" aria-label={home.menu.label} inert={!open}>
          <img className={s.logo} src={lockup} alt="" width={907} height={114} />
          <button ref={closer} type="button" className={s.close} aria-label={home.menu.close} onClick={shut}>
            {lines}
          </button>
          <nav aria-label="Main navigation">
            <ul className={s.rows}>
              {ways.map((link, i) => (
                <li key={link.label} style={{ '--i': i } as CSSProperties}>
                  <a href={link.href} onClick={shut} {...away(link.href)}>
                    {link.label}
                    {icons.arrow}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ul className={s.channels} style={{ '--i': ways.length } as CSSProperties}>
            {channels.map((link) => (
              <li key={link.label}>
                <a href={link.href} aria-label={link.label} onClick={shut} {...away(link.href)}>
                  {link.icon && icons[link.icon]}
                </a>
              </li>
            ))}
          </ul>
          {/* (a click on the call to action closes the sheet on its way) */}
          <div className={s.call} style={{ '--i': ways.length + 1 } as CSSProperties} onClick={shut}>
            <LaunchLink href={home.launch.href} soft>
              {home.launch.label}
            </LaunchLink>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
