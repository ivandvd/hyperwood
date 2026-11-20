/**
 * What every page of the site has besides its own matter: the note that a part is not open yet (Soon.tsx) and the
 * question about cookies (Consent.tsx). Each page's entry puts it after the page.
 */
import { Consent } from './Consent'
import { Soon } from './Soon'

export function SiteExtras() {
  return (
    <>
      <Soon />
      <Consent />
    </>
  )
}
