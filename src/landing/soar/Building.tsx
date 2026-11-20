/**
 * What Hyperwood is building (&ground=ink, After.tsx): the Investor Overview's own sentence for what it is, a sea of
 * points from one edge of the screen to the other (ParticleSea.tsx, after Hyperliquid's film of its own), the paper's
 * three closing figures along the sea's foot between hairlines (as Hyperliquid sets its numbers under its film), and the
 * paper's note on them. (What is being built is said by the statement, above: Statement.tsx.) The words:
 * `soar.building` in content.home.ts. Where everything stands: building.module.css.
 */
import { home } from '../../content.home'
import { ParticleSea } from './ParticleSea'
import s from './building.module.css'

export function Building() {
  const B = home.soar.building
  return (
    <section className={s.building} aria-labelledby="building-title">
      <h2 id="building-title" className={s.line}>
        <span>{B.line[0]}</span> <b>{B.line[1]}</b>
      </h2>
      <div className={s.sea}>
        <ParticleSea className={s.canvas} />
      </div>
      <dl className={s.figures}>
        {B.figures.map(([value, what]) => (
          <div key={what}>
            <dt>{what}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className={s.note}>{B.note}</p>
    </section>
  )
}
