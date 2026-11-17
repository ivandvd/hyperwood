/**
 * Interface: a minimal Swiss layout over the scene (1440 × 900 design).
 * H1 titles: Focus Reveal; body copy: line-by-line Fade Up. Both play/reverse with their section (ui/titles.ts).
 * Other reveals/hides are driven by the scroll timeline (useScrollTimeline).
 *  - the phase indicator is sticky across the whole experience (the site header lives in ui/SiteHeader);
 *  - hero layer and closing layer cross-fade with the 3D transformation;
 *  - `data-loading` keeps the hero's words out of sight until the opening lets the hero show (ui/opening.ts).
 */
import { restartExperience } from '../scroll/useScrollTimeline'
import { FocusReveal } from './FocusReveal'
import { FadeUpLines } from './FadeUpLines'
import { Cursor } from './Cursor'
import { config } from '../config'
import { content } from '../content'
import styles from './Interface.module.css'

export function Interface() {
  const C = content
  return (
    <div className={styles.ui} data-loading="">
      {/* the lower edge of the scene lands on Ink, so the page below joins it without a seam */}
      <div className={styles.ground} />

      {/* sticky phase indicator */}
      {C.extras.phase && (
        <aside className={styles.phase} aria-hidden>
          <span className={styles.track}>
            <span className={styles.fill} data-ui="phase-fill" />
          </span>
          <span className={`${styles.phaseLabel} t-micro`}>
            <span data-ui="phase-num">{C.phases[0][0]}</span>
            <span className={styles.phaseName} data-ui="phase-name">
              {C.phases[0][1]}
            </span>
          </span>
        </aside>
      )}

      {/* hero */}
      <div className={styles.layer} data-ui="hero">
        <div className={styles.heroShade} data-fade />
        <h1 className={`t-display ${styles.heroTitle}`}>
          <FocusReveal text={C.hero.title} group="hero" className="fr--stack" />
        </h1>
        <FadeUpLines className={`t-body ${styles.heroText}`} group="hero" delay={config.titles.bodyDelay} text={C.hero.text} />
        {C.extras.hint && (
          <span className={`t-label ${styles.hint}`} data-ui="hint">
            {C.hero.hint}
          </span>
        )}
      </div>

      {/* closing section */}
      <div className={styles.layer} data-ui="final">
        <FadeUpLines className={`t-body ${styles.finalText}`} group="final" delay={config.titles.bodyDelay} text={C.final.text} />
        {C.extras.restart && (
          <button type="button" className={`t-label ${styles.restart}`} data-fade onClick={restartExperience}>
            {C.final.restart}
          </button>
        )}
        <h2 className={`t-display ${styles.finalLine1}`}>
          <FocusReveal text={C.final.line1} group="final" />
        </h2>
        <h2 className={`t-display ${styles.finalLine2}`}>
          <FocusReveal text={C.final.line2} group="final" delay={config.titles.secondLineDelay} />
        </h2>
      </div>
      <Cursor />
    </div>
  )
}
