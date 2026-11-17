/**
 * The landing page's footer. It waits under the page, fixed to the bottom, and is uncovered as the protocol
 * section scrolls off it. The wordmark runs the full width: crisp at the top of the letters and softening
 * towards the baseline, in a gradient from hot Neon down to moss (foot.module.css).
 */
import { BRAND, home } from '../content.home'
import { cautions } from '../content.cautions'
import s from './foot.module.css'

export function Foot() {
  const F = home.footer
  return (
    <>
      <footer className={s.footer}>
        <div className={s.top}>
          <p>
            {F.left[0]}
            <br />
            {F.left[1]}
          </p>
          <span className={s.mark} role="img" aria-label={BRAND} />
          <p className={s.end}>
            {F.right[0]}
            <br />
            {F.right[1]}
          </p>
        </div>
        {/* what the architecture paper insists on being said */}
        <ul className={s.cautions}>
          {cautions.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <div className={s.wordmark} role="img" aria-label={BRAND}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={s.band} data-band={i}>
              <span className={s.soft}>
                <span className={s.letters} />
              </span>
            </span>
          ))}
        </div>
      </footer>
      {/* the call to action comes here, to the very end of the page: a link to the footer itself would stop
          where the footer already shows */}
      <div id="launch" />
    </>
  )
}
