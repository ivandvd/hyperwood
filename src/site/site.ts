/**
 * What the site needs to know about itself that is not a word on a page (site.json, at the project's root; the
 * build reads the same file: site.plugin.ts):
 *
 *   url        the site's own address, as https://example.com with no slash at its end. Until it is given there is
 *              no sitemap, no canonical address and the share picture is named by a relative address.
 *   contact    an e-mail address for the two legal pages. Until it is given they say that one will be published.
 *   analytics  ga4: a Google Analytics measurement id (G-...). Until it is given no script is loaded and nobody is
 *              asked about cookies.
 *   notify     endpoint: where the "tell me when it opens" form posts an e-mail address (a form service's address
 *              that answers JSON). Until it is given the form is not shown.
 *
 * To look at the parts that are off until then, from the address: &consent=see shows the question about cookies,
 * &notify=see the form (it then has nowhere to send, and says so).
 */
import config from '../../site.json'

const asked = new URLSearchParams(location.search)

export const site = {
  url: config.url.replace(/\/+$/, ''),
  contact: config.contact,
  ga4: config.analytics.ga4,
  notify: config.notify.endpoint,
  /** (looking at the question about cookies without an analytics id) */
  seeConsent: asked.get('consent') === 'see',
  /** (looking at the form without anywhere to send) */
  seeNotify: asked.get('notify') === 'see',
}

/** Is there a question about cookies to ask on this site at all? (The footers show "Cookie choices" only then.) */
export const asksConsent = !!site.ga4 || site.seeConsent

/** From this page to the site's first page: '' there, '../' on a page one folder down (its HTML says so). */
export const ROOT = document.documentElement.getAttribute('data-root') ?? ''
