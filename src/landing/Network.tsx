/**
 * The network. The gate of the journey comes back three times, one inside the other: Hyperwood, lit, inside
 * Robinhood Chain, inside Ethereum: where it settles (the architecture paper's first figure). Under them the
 * speed figures the papers give, very large, each labelled as the target it is.
 */
import { home } from '../content.home'
import { Heading, Reveal } from './Reveal'
import k from './kit.module.css'
import s from './network.module.css'

export function Network() {
  const N = home.network
  return (
    <section id="network" className={k.section} aria-labelledby="network-title">
      <div className={k.wrap}>
        <div className={s.top}>
          <div>
            <Heading id="network-title" label={N.label} line={N.line} body={N.body} />
            <Reveal delay={1}>
              <a className={s.more} href={N.more.href}>
                {N.more.label} <span aria-hidden="true">↗</span>
              </a>
            </Reveal>
          </div>
          <Reveal delay={1} className={s.gates}>
            <div className={s.arches} aria-hidden="true">
              <i data-layer="1" />
              <i data-layer="2" />
              <i data-layer="3" />
              <u />
            </div>
            <ol className={s.layers}>
              {N.layers.map(([tag, name, role]) => (
                <li key={tag} data-ours={tag === 'L3' ? '' : undefined}>
                  <i>{tag}</i>
                  <b>{name}</b>
                  <span>{role}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
        <Reveal>
          <dl className={s.targets}>
            {N.targets.map(([value, unit, what]) => (
              <div key={what}>
                <dt>
                  {what}
                  <em>{N.target}</em>
                </dt>
                <dd>
                  {value}
                  <small>{unit}</small>
                </dd>
              </div>
            ))}
          </dl>
          <p className={k.caption}>{N.note}</p>
        </Reveal>
      </div>
    </section>
  )
}
