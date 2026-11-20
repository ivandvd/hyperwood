/**
 * The page that shows the app's screens by themselves (studio.tsx), and the scenes the landing page's pictures are
 * taken of (scripts/product):
 *
 *   ?screen=trade | close            a screen flat, at its own size (&fit: fitted to the window)
 *   ?scene=monitor&w=2300            the Trade screen on the monitor, that wide
 *   ?scene=card&card=ticket | request | payout
 *                                    a close view of one part of the app, in a card's own shape (700 by 934)
 *   ?scene=phones&w=1500             the mobile app on three phones, the row that wide
 *   ?scene=standing&w=1500           one phone standing on the ground, with its shadow
 *     &part=phone|pool|shade         one part of it alone (the pool and the shadow in white on black)
 *   ?scene=screen                    the mobile app's Trade screen alone, at an iPhone 18 Pro's screen size (402 by 874)
 *     &app=receipt | close           (or its receipt, or a position being closed)
 *   &clear                           with nothing behind it (a picture to lay over the page)
 */
import { useEffect, useState } from 'react'
import { Handsets } from './Handset'
import { PhoneClose, PhoneReceipt, PhoneTrade } from './PhoneApp'
import { Standing, type StandingPart } from './Standing'
import { Monitor, type Focus } from './Monitor'
import { Terminal } from './Terminal'
import s from './studio.module.css'

const asked = new URLSearchParams(window.location.search)

/** The close views: which screen, how wide the monitor is drawn (the card is 700 wide), where its box begins in
 *  the card, how it is turned, and what is sharp. What matters in each stands in the upper six tenths: the card's
 *  line is written over the rest. */
const CARDS: Record<string, { sheet?: 'close'; w: number; left: number; top: number; turn: number; lean: number; eye: string; focus: Focus[] }> = {
  // the ticket, from its size down to the button that signs: the right of the Trade screen, the chart beside it soft
  ticket: {
    w: 2090, left: -1446, top: -235, turn: -13, lean: 3, eye: '86% 120%',
    focus: [
      { blur: 5, span: [0, 0, 0.5, 0.66] },
      { blur: 1.6, span: [0.5, 0.66, 0.66, 0.78] },
      { blur: 0, span: [0.66, 0.78, 1, 1] },
    ],
  },
  // the request on its way: the foot of the ticket's column
  request: {
    w: 2300, left: -1720, top: -985, turn: -11, lean: -4, eye: '88% 40%',
    focus: [
      { blur: 6, span: [0, 0, 0.5, 0.68] },
      { blur: 1.8, span: [0.5, 0.68, 0.68, 0.79] },
      { blur: 0, span: [0.68, 0.79, 1, 1] },
    ],
  },
  // the payout: the sheet in the middle of the screen, from what the position cleared down to the button
  payout: {
    sheet: 'close', w: 2024, left: -662, top: -479, turn: 12, lean: 3, eye: '50% 110%',
    focus: [
      { blur: 4, span: [0, 0, 0.16, 0.3] },
      { blur: 0, span: [0.16, 0.3, 0.7, 0.86] },
      { blur: 3, span: [0.7, 0.86, 1, 1] },
    ],
  },
}

export function Studio() {
  const screen = asked.get('screen') ?? 'trade'
  const scene = asked.get('scene')
  const fit = asked.has('fit')
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (!fit) return
    const size = () => setScale(Math.min(innerWidth / 1280, innerHeight / 820))
    size()
    addEventListener('resize', size)
    return () => removeEventListener('resize', size)
  }, [fit])
  useEffect(() => {
    if (!asked.has('clear')) return
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    // (and no scroll bar in the picture)
    document.documentElement.style.overflow = 'hidden'
  }, [])
  const app = <Terminal sheet={screen === 'close' ? 'close' : undefined} />
  if (scene === 'monitor')
    return (
      <div className={s.scene} data-clear={asked.has('clear') ? '' : undefined}>
        <div style={{ width: Number(asked.get('w')) || 1200 }}>
          <Monitor>{app}</Monitor>
        </div>
      </div>
    )
  // The mobile app's Trade screen alone at the size of an iPhone 18 Pro's screen (402 by 874 points), for laying
  // into Apple's own picture of the phone (scripts/product/bake-bezel.py). The app is laid out at 390 by 844 and
  // drawn 1.031 times as large; what is left at the foot is its own ground.
  // (no scroll bar, and no room kept for one: in a window the screen's own width, the page's gutter for it took 15 px
  // off the screen's right)
  if (scene === 'screen') {
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.scrollbarGutter = 'auto'
  }
  if (scene === 'screen') {
    const which = asked.get('app')
    return (
      <div className={s.screenScene}>
        <div style={{ width: 402, height: 874, overflow: 'hidden', background: '#0a0a0a' }}>
          <div style={{ width: 390, height: 844, transform: 'scale(' + 402 / 390 + ')', transformOrigin: '0 0' }}>
            {which === 'receipt' ? <PhoneReceipt /> : which === 'close' ? <PhoneClose /> : <PhoneTrade />}
          </div>
        </div>
      </div>
    )
  }
  if (scene === 'phones')
    return (
      <div className={s.scene} data-clear={asked.has('clear') ? '' : undefined}>
        <Handsets width={Number(asked.get('w')) || 1500} />
      </div>
    )
  // (the pool and the shadow alone are taken on black, the page's ground too)
  const black = scene === 'standing' && (asked.get('part') === 'pool' || asked.get('part') === 'shade')
  if (black) document.documentElement.style.background = '#000'
  if (scene === 'standing')
    return (
      <div className={s.scene} data-clear={asked.has('clear') ? '' : undefined} data-black={black ? '' : undefined}>
        <Standing width={Number(asked.get('w')) || 1500} part={(asked.get('part') as StandingPart | null) ?? 'all'}>
          <PhoneTrade />
        </Standing>
      </div>
    )
  if (scene === 'card') {
    const card = CARDS[asked.get('card') ?? 'ticket'] ?? CARDS.ticket
    // (each number can be tried from the address: &w= &left= &top= &turn= &lean=)
    const n = (name: 'w' | 'left' | 'top' | 'turn' | 'lean') => (asked.has(name) ? Number(asked.get(name)) : card[name])
    return (
      <div className={s.cardScene}>
        <div className={s.card}>
          <div style={{ position: 'absolute', left: n('left'), top: n('top'), width: n('w') }}>
            <Monitor turn={n('turn')} lean={n('lean')} eye={asked.get('eye') ?? card.eye} focus={card.focus} bare>
              <Terminal sheet={card.sheet} />
            </Monitor>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={s.studio} data-fit={fit ? '' : undefined}>
      <div className={s.board} style={fit ? { transform: `scale(${scale})` } : undefined}>
        {app}
      </div>
    </div>
  )
}
