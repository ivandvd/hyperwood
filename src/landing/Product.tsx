/**
 * After the journey: the app. A preview of the web app (app/AppPreview.tsx) under a two-line statement, with
 * a switch between the owner's view and what the network has of the same account. It stands on Ink, lit from
 * above by the river it follows, so the page does not change its look between the hero and here.
 */
import { useState } from 'react'
import { home } from '../content.home'
import { AppPreview, type View } from '../app/AppPreview'
import s from './product.module.css'

export function Product() {
  const [view, setView] = useState<View>('yours')
  const A = home.app
  return (
    <section id="app" className={s.section} aria-labelledby="app-title">
      <div className={s.head}>
        <p className={s.eyebrow}>{A.eyebrow}</p>
        <div>
          <h2 id="app-title" className={s.title}>
            {A.title.map((line) => (
              <span key={line}>{line} </span>
            ))}
          </h2>
          <p className={s.lead}>{A.lead}</p>
        </div>
        <div className={s.switch} role="group" aria-label={A.switchLabel}>
          {(['yours', 'network'] as const).map((name) => (
            <button key={name} type="button" aria-pressed={view === name} data-view={name} onClick={() => setView(name)}>
              {A.views[name]}
            </button>
          ))}
        </div>
      </div>
      <div className={s.frame}>
        <AppPreview view={view} />
      </div>
      <p className={s.caption}>{A.caption}</p>
    </section>
  )
}
