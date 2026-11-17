/**
 * The deck: the four frames of the landing page below the hero, in order. See track.ts for how they move.
 */
import { Privacy } from './Privacy'
import { Payout } from './Payout'
import { Network } from './Network'
import { Close } from './Close'
import s from './deck.module.css'

export function Deck() {
  return (
    <div className={s.deck}>
      <Privacy />
      <Payout />
      <Network />
      <Close />
    </div>
  )
}
