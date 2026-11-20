/**
 * The two legal pages and the page that thanks, each a page of words alone (Plain.tsx). The words are in
 * content.site.ts, with what they still need before the site is public.
 *
 * The privacy page says what is so on this build of the site, not more: that visits are counted only where they are
 * (an analytics id in site.json), and that an e-mail address is taken only where the form is shown.
 */
import { words } from '../content.site'
import { ROOT, asksConsent, site } from '../site/site'
import { LaunchLink } from '../ui/LaunchLink'
import { Part, Plain } from './Plain'
import s from './plain.module.css'

const updated = <p className={s.updated}>{words.updated}</p>
const lines = (text: string[]) => text.map((line) => <p key={line}>{line}</p>)

/** Where to write: the address from site.json, or that one will be published. */
function Contact() {
  return site.contact ? (
    <p>
      {words.contact} <a href={`mailto:${site.contact}`}>{site.contact}</a>.
    </p>
  ) : (
    <p>{words.noContact}</p>
  )
}

export function Privacy() {
  const P = words.privacy
  const part = P.parts
  return (
    <Plain title={P.title} lead={P.lead} under={updated}>
      <Part head={part.give.head}>{lines(site.notify ? part.give.list : part.give.none)}</Part>
      <Part head={part.count.head}>{lines(asksConsent ? part.count.counted : part.count.uncounted)}</Part>
      <Part head={part.others.head}>{lines(part.others.text)}</Part>
      <Part head={part.rights.head}>
        {lines(part.rights.text)}
        <Contact />
      </Part>
      <Part head={part.changes.head}>{lines(part.changes.text)}</Part>
    </Plain>
  )
}

export function Terms() {
  const T = words.terms
  return (
    <Plain title={T.title} lead={T.lead} under={updated}>
      {T.parts.map((part) => (
        <Part key={part.head} head={part.head}>
          {lines(part.text)}
        </Part>
      ))}
      <Part head={T.questions}>
        <Contact />
      </Part>
    </Plain>
  )
}

export function Thanks() {
  const T = words.thanks
  return (
    <Plain
      title={T.title}
      lead={T.body}
      under={
        <LaunchLink className={s.back} href={ROOT || './'} soft>
          {words.home}
        </LaunchLink>
      }
    />
  )
}
