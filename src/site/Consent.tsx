/**
 * The question about cookies, asked once at the foot of the screen, and only where there is something to ask about:
 * with an analytics id in site.json (analytics.ts). The counter is not loaded until the answer is yes; a no is kept
 * as well, so the question is not asked again. Anything marked `data-consent-again` (the footers' "Cookie choices")
 * asks it again, so an answer can be changed.
 *
 * It comes at a still moment after the opening, not over it, and never over the note that a part is not open
 * (that note is in the top layer). The words: `consent` in content.site.ts. Where it stands: consent.module.css.
 */
import { useEffect, useState } from 'react'
import { words } from '../content.site'
import { whenStill } from '../landing/still'
import { answer, count, keep } from './analytics'
import { ROOT, asksConsent, site } from './site'
import s from './consent.module.css'

const C = words.consent

export function Consent() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!asksConsent) return
    const said = answer()
    if (said === 'yes') count()
    const again = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.('[data-consent-again]')) return
      e.preventDefault()
      setShown(true)
    }
    document.addEventListener('click', again)
    // (asked when nothing has been answered yet; or, looked at with &consent=see, each time)
    const stop = said && !site.seeConsent ? () => {} : whenStill(() => setShown(true))
    return () => {
      document.removeEventListener('click', again)
      stop()
    }
  }, [])

  if (!shown) return null
  const say = (said: 'yes' | 'no') => () => {
    keep(said)
    setShown(false)
  }
  return (
    <aside className={s.consent} aria-labelledby="consent-title">
      <h2 id="consent-title">{C.title}</h2>
      <p>
        {C.body}{' '}
        <a href={`${ROOT}privacy/`}>{C.more}</a>
      </p>
      <div className={s.say}>
        <button type="button" className={s.yes} onClick={say('yes')}>
          {C.yes}
        </button>
        <button type="button" className={s.no} onClick={say('no')}>
          {C.no}
        </button>
      </div>
    </aside>
  )
}
