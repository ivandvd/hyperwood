/**
 * The note that a part is not open yet. No link or button on the site goes nowhere: one that leads to something not
 * built yet (the app, a channel with no address) opens this note instead, on every page.
 *
 * Which those are is not listed anywhere. A link to a place on its own page (#...) whose place is not in the page
 * leads nowhere, and that is the rule: Launch App points to #launch (content.home.ts) and the channels to #x,
 * #discord and #telegram, none of which exist. Give one a real address and it simply works; anything else can ask
 * for the note with `data-soon`. A click that something else has already taken care of is left alone.
 *
 * The note is the page's own dialog (so the page behind it cannot be used, Escape closes it, and the place the
 * reader was is given back), on Ink: the mark, filling as it does in the opening; the note in two tones; the way to
 * what can be read meanwhile. When there is somewhere to send it (site.json, notify), it also offers to write once
 * when the app opens: one field, checked before it is sent (empty, not an address), busy while it is sent, a line
 * of its own if the sending fails, and on to the page that thanks (thanks/) when it has gone.
 *
 * The words: `soon` in content.site.ts. Where everything stands: soon.module.css.
 */
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { words } from '../content.site'
import { LaunchLink } from '../ui/LaunchLink'
import { ROOT, site } from './site'
import s from './soon.module.css'

const S = words.soon
const N = S.notify
const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Does this lead to something that is not there? */
function leadsNowhere(el: Element): boolean {
  if (el.hasAttribute('data-soon')) return true
  // (the footers' "Cookie choices" is the question about cookies' own: Consent.tsx)
  if (!(el instanceof HTMLAnchorElement) || el.hasAttribute('data-consent-again')) return false
  const href = el.getAttribute('href') ?? ''
  // (#top is the browser's own way to the top of a page, with or without a place of that name)
  if (!href.startsWith('#') || href.length < 2 || href === '#top') return false
  return !document.getElementById(decodeURIComponent(href.slice(1)))
}

export function Soon() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState('')
  const withForm = !!site.notify || site.seeNotify

  const shut = useCallback(() => {
    const box = dialog.current
    if (!box?.open || box.hasAttribute('data-closing')) return
    // (it goes as it came, a little quicker; then the dialog is closed, which gives the reader's place back)
    box.setAttribute('data-closing', '')
    window.setTimeout(() => {
      box.removeAttribute('data-closing')
      box.close()
    }, 190)
  }, [])

  useEffect(() => {
    const box = dialog.current
    if (!box) return
    const clicked = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const el = (e.target as Element | null)?.closest?.('a[href], [data-soon]')
      if (!el || box.contains(el) || !leadsNowhere(el)) return
      e.preventDefault()
      setWrong('')
      setBusy(false)
      if (!box.open) box.showModal()
    }
    // while it is open the page behind stays where it is: it does not scroll, and the wheel does not reach the
    // page's own glide (journey/glide.ts listens on the window)
    const opened = new MutationObserver(() => document.documentElement.toggleAttribute('data-soon-open', box.open))
    opened.observe(box, { attributes: true, attributeFilter: ['open'] })
    const held = (e: Event) => e.stopPropagation()
    document.addEventListener('click', clicked)
    box.addEventListener('wheel', held, { passive: true })
    return () => {
      document.removeEventListener('click', clicked)
      box.removeEventListener('wheel', held)
      opened.disconnect()
      document.documentElement.removeAttribute('data-soon-open')
    }
  }, [])

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const field = form.elements.namedItem('email') as HTMLInputElement
    const address = field.value.trim()
    const refuse = (why: string) => {
      setWrong(why)
      field.focus()
    }
    if (!address) return refuse(N.errors.empty)
    if (!ADDRESS.test(address)) return refuse(N.errors.wrong)
    // (looked at with nowhere to send: it says that it could not be sent, which is so)
    if (!site.notify) return refuse(N.errors.failed)
    setWrong('')
    setBusy(true)
    try {
      const answer = await fetch(site.notify, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      if (!answer.ok) throw new Error(String(answer.status))
      location.assign(`${ROOT}thanks/`)
    } catch {
      setBusy(false)
      refuse(N.errors.failed)
    }
  }

  return (
    <dialog
      ref={dialog}
      className={s.soon}
      aria-labelledby="soon-title"
      onCancel={(e) => {
        e.preventDefault()
        shut()
      }}
      onClick={(e) => {
        // (a click beside the note, on the dark round it)
        if (e.target === dialog.current) shut()
      }}
    >
      <div className={s.note}>
        <div className={s.top}>
          <span className={s.mark} aria-hidden="true">
            <i />
          </span>
          <button type="button" className={s.close} onClick={shut} aria-label={S.close}>
            <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
              <path d="M2 2l10 10M12 2 2 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
            </svg>
          </button>
        </div>
        <h2 id="soon-title" className={s.title}>
          <span>{S.title[0]}</span> <b>{S.title[1]}</b>
        </h2>
        <p className={s.body}>{S.body}</p>
        {withForm && (
          <form className={s.form} noValidate onSubmit={send} action={site.notify || undefined} method="post" aria-busy={busy}>
            <label className={s.ask} htmlFor="soon-mail">
              {N.ask}
            </label>
            <div className={s.field} data-wrong={wrong ? '' : undefined} data-busy={busy ? '' : undefined}>
              <input
                id="soon-mail"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                placeholder={N.hint}
                aria-label={N.label}
                aria-invalid={wrong ? true : undefined}
                aria-describedby={wrong ? 'soon-wrong' : undefined}
                readOnly={busy}
                onInput={() => wrong && setWrong('')}
              />
              <button type="submit" disabled={busy}>
                {busy ? N.sending : N.send}
              </button>
            </div>
            <p id="soon-wrong" className={s.wrong} role="alert">
              {wrong}
            </p>
          </form>
        )}
        <div className={s.actions}>
          <LaunchLink className={s.more} href={`${ROOT}${S.more.href}`} soft>
            {S.more.label}
          </LaunchLink>
          <button type="button" className={s.done} onClick={shut}>
            {S.done}
          </button>
        </div>
      </div>
    </dialog>
  )
}
