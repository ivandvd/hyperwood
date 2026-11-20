/**
 * The foot of the page on the Ink (&ground=ink), laid out as a reference lays out its own (a footer by Kevser,
 * x.com/kevserctk, "Footer Section UI Animation", read frame by frame at 1425 wide): a card across 87 hundredths of
 * the screen with a liquid moving in it (liquid/FlowLiquid.tsx), the page's tagline in its middle over a sentence and
 * two buttons (the page's own, ui/LaunchLink.tsx: their letters roll and their arrow leaves through its corner); under it the logo and a line at the left and the ways around the site in columns at the right; what the
 * papers insist on being said; a hairline, with the year at the left and the tagline at the right; and the name very
 * large across the foot, running off the page's end. The reference's is a faint grey; ours is in the brand's colour:
 * Hyper Neon at its head, going faint towards its foot where it leaves the page (or, &name=solid, Neon all over).
 *
 * Ours where the reference's is not real for us: its place to leave an e-mail address is left out (there is no list
 * to send it to). The channels have no address yet (content.home.ts: panel), so each opens the note that it is not
 * open (site/Soon.tsx), as Launch App does. The last column is the legal pages (site/LegalLinks.tsx). The words in
 * the card are Ink on the liquid, which is kept light where they stand.
 *
 * Its parts rise into place as the scroll brings them in (rise.ts). The words: `footer`, `intro`, `heroLine` and
 * `launch` in content.home.ts. Where everything stands: liquidFoot.module.css.
 */
import { BRAND, home } from '../../../content.home'
import { words } from '../../../content.site'
import { nameSolid } from '../../flags'
import { useRise } from '../../rise'
import { LegalLinks } from '../../../site/LegalLinks'
import { LaunchLink } from '../../../ui/LaunchLink'
import { FlowLiquid } from '../liquid/FlowLiquid'
import s from './liquidFoot.module.css'

export function LiquidFoot() {
  const F = home.footer
  const channels = home.panel[1].filter((link) => link.icon && link.icon !== 'docs')
  const columns: [string, { label: string; href: string }[]][] = [
    ['Product', [home.launch, { label: 'Web app', href: '#app' }, { label: 'Mobile app', href: '#mobile' }]],
    ['Learn', [{ label: 'How it works', href: '#how' }, { label: 'Architecture', href: 'architecture/' }, { label: 'Questions', href: '#faq' }]],
    ['Community', channels.map((link) => ({ label: link.label, href: link.href }))],
  ]
  const riseIn = useRise<HTMLElement>()
  return (
    <footer ref={riseIn} className={s.foot}>
      <section className={s.card} aria-labelledby="foot-title" data-rise="">
        <FlowLiquid className={s.liquid} />
        <div className={s.say}>
          <h2 id="foot-title">
            <span>{home.intro[0]}</span> <span>{home.intro[1]}</span>
          </h2>
          <p>{home.heroLine}</p>
          <div className={s.actions}>
            <LaunchLink className={s.first} href={home.launch.href} soft>
              {home.launch.label}
            </LaunchLink>
            <LaunchLink className={s.second} href={home.network.more.href} soft>
              {home.network.more.label}
            </LaunchLink>
          </div>
        </div>
      </section>

      <div className={s.body}>
        <div className={s.brand} data-rise="">
          <a className={s.lockup} href="#top" aria-label={BRAND} />
          <p>{home.gate.line.join(' ')}</p>
        </div>
        <nav className={s.columns} aria-label="Footer">
          {columns.map(([heading, links]) => (
            <div key={heading} data-rise="">
              <p>{heading}</p>
              {links.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
          <div data-rise="">
            <p>{words.legal.heading}</p>
            <LegalLinks />
          </div>
        </nav>
      </div>

      <div className={s.notes} data-rise="">
        {F.notes.map((note, i) => (
          <p key={note} data-keyed="">
            <b data-key="">{F.leads[i]}</b> {note}
          </p>
        ))}
      </div>

      <div className={s.bottom} data-rise="">
        <span>{F.rights}</span>
        <span>
          {F.tagline[0]} {F.tagline[1]}
        </span>
      </div>

      <p className={s.name} data-solid={nameSolid ? '' : undefined} aria-hidden="true">
        {BRAND}
      </p>
    </footer>
  )
}
