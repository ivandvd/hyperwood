/**
 * Counting visits (Google Analytics 4), and only after the reader has said yes (Consent.tsx). Until then nothing
 * of it is in the page: no script, no cookie, no request. With no id in site.json there is none of it at all.
 */
import { site } from './site'

/** Where the reader's answer is kept, in their own browser: 'yes' or 'no'. */
const KEY = 'hw-consent'

type Counting = { dataLayer?: unknown[]; gtag?: (...all: unknown[]) => void } & Record<string, unknown>

export function answer(): 'yes' | 'no' | null {
  try {
    const kept = localStorage.getItem(KEY)
    return kept === 'yes' || kept === 'no' ? kept : null
  } catch {
    // (a browser that keeps nothing: the question is asked each time, and nothing is counted without a yes)
    return null
  }
}

export function keep(said: 'yes' | 'no') {
  try {
    localStorage.setItem(KEY, said)
  } catch {
    /* nothing to keep it in */
  }
  if (said === 'yes') count()
  else uncount()
}

let counting = false

/** Load the counter, once. */
export function count() {
  if (counting || !site.ga4) return
  counting = true
  const w = window as unknown as Counting
  w[`ga-disable-${site.ga4}`] = false
  w.dataLayer = w.dataLayer ?? []
  // (the counter reads its queue as lists of arguments, not as arrays)
  w.gtag = function gtag() {
    // oxlint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', site.ga4)
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(site.ga4)}`
  document.head.appendChild(script)
}

/** A yes taken back: the counter is told to stop, and its cookies are taken out of the browser. */
function uncount() {
  if (!site.ga4) return
  const w = window as unknown as Counting
  w[`ga-disable-${site.ga4}`] = true
  for (const pair of document.cookie.split(';')) {
    const name = pair.split('=')[0].trim()
    if (!name.startsWith('_ga')) continue
    const host = location.hostname
    for (const domain of [host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]) document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`
    document.cookie = `${name}=; Max-Age=0; path=/`
  }
}
