/**
 * The protocol section: the light page that scrolls up over the journey. An order's five stages as dotted
 * rings, the two-line statement, four things the protocol does, and the way to the long read.
 */
import { home } from '../content.home'
import s from './protocol.module.css'

/** Five dotted rings, Ink at the top running down into Neon: an order's life, a ring a stage. */
function Stages() {
  const centres = [163, 441, 719, 997, 1275]
  return (
    <figure className={s.stages}>
      <svg viewBox="0 0 1440 350" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="stage-tone" x1="0" y1="0" x2="0" y2="350" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--stage-top)" />
            <stop offset=".3" stopColor="var(--stage-top)" />
            <stop offset=".62" stopColor="var(--stage-mid)" />
            <stop offset=".84" stopColor="var(--stage-low)" />
            <stop offset="1" stopColor="var(--stage-foot)" />
          </linearGradient>
        </defs>
        <g stroke="url(#stage-tone)" strokeWidth="4" strokeLinecap="round" strokeDasharray=".1 18">
          {centres.map((cx) => (
            <ellipse key={cx} cx={cx} cy="175" rx="156" ry="165" />
          ))}
        </g>
      </svg>
      <figcaption className={s.names}>
        {home.stages.map((name, i) => (
          <span key={name}>
            <i>{String(i + 1).padStart(2, '0')}</i>
            {name}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

export function Protocol() {
  return (
    <main id="protocol" className={s.main}>
      <div className={s.label}>{home.section}</div>
      <Stages />
      <div className={s.grid}>
        <div>
          <h2 className={s.title}>
            {home.title.map((line) => (
              <span key={line}>{line} </span>
            ))}
          </h2>
          <a className={s.more} href={home.more.href}>
            {home.more.label} <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className={s.features} id="features">
          {home.features.map((feature) => (
            <article key={feature.title}>
              <h3 className={s.featureTitle}>{feature.title}</h3>
              <p className={s.featureText}>{feature.body}</p>
            </article>
          ))}
          <p className={s.fine}>{home.fine}</p>
        </div>
      </div>
    </main>
  )
}
