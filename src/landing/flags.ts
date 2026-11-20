/** The tries the landing page's address can ask for, read once. */
const asked = new URLSearchParams(window.location.search)

/** ?films=after: the films after the hero, the statement, the band, the app's stage and the last screen (After.tsx).
 *  Only with the films' hero. */
export const filmsAfter = asked.get('films') === 'after'

/** &flow=soar (with ?films=after): the page after the hero laid out part for part as trysoar.com lays out its own,
 *  light and dark by turns (landing/soar). */
export const flowSoar = filmsAfter && asked.get('flow') === 'soar'

/** &phones=shot: the mobile app at the app's stage as three close shots of the phone, each a card of its own
 *  (scripts/product/shot.html), in place of the three phones standing before the horizon. */
export const phonesShot = asked.get('phones') === 'shot'

/** &cards=under (with &phones=shot): no cards under the monitor; their three lines stand under the three shots
 *  instead, each under the shot that shows it (a trade sealed, its proof, a close into the stock). */
export const cardsUnder = phonesShot && asked.get('cards') === 'under'

/** &dawn=river (with &flow=soar): the way from the hero into the light part is the river's: the river stays lit
 *  while the morning comes up over it (journey/timeline.ts), and the morning's light pools where the river runs
 *  off the screen, so the river pours into it (soar/Daybreak.tsx). */
export const dawnRiver = flowSoar && asked.get('dawn') === 'river'

/** &ground=ink (with &flow=soar): everything after the hero stays on the hero's Ink, with Neon only as light. The
 *  statement right after the hero is the dark one with the steps of light (Statement.tsx, as after the films), the
 *  parts that were on the Paper are on the Ink (their colours turned in soar.module.css, faq.module.css and
 *  appStage.module.css under [data-night]), and there is no way into a light part. */
export const groundInk = flowSoar && asked.get('ground') === 'ink'

/** &foot=ink | neon (with &flow=soar): the foot of the page ends in a card with the logo large, Neon on Ink or Ink on
 *  Neon (soar/MegaFooter.tsx), and its words stand darker and larger, as the reference's do. */
const foot = asked.get('foot')
export const footCard: 'ink' | 'neon' | null = flowSoar && (foot === 'ink' || foot === 'neon') ? foot : null
