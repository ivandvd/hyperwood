/**
 * The links every footer has to the two legal pages, and, where visits are counted, the one that asks about cookies
 * again (Consent.tsx). Plain links, to be laid out by the footer they stand in.
 */
import { words } from '../content.site'
import { ROOT, asksConsent } from './site'

export function LegalLinks() {
  const L = words.legal
  return (
    <>
      <a href={`${ROOT}privacy/`}>{L.privacy}</a>
      <a href={`${ROOT}terms/`}>{L.terms}</a>
      {asksConsent && (
        <a href="#cookies" data-consent-again="">
          {words.consent.again}
        </a>
      )}
    </>
  )
}
