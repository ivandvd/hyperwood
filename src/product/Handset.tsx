/**
 * A phone with one of the mobile app's screens on it (PhoneApp.tsx), built in the page as the monitor is
 * (Monitor.tsx): a slab in CSS perspective, the screen the app's own markup. Three of them stand side by side on the
 * landing page (`Handsets`): the middle one faces the camera, the outer two are turned in towards it, stand a little
 * back and are a little out of focus.
 *
 * The landing page shows a picture taken of them (studio.html, scripts/product), not this markup.
 */
import type { CSSProperties, ReactNode } from 'react'
import { PhoneClose, PhoneReceipt, PhoneTrade } from './PhoneApp'
import h from './handset.module.css'

export function Handset({ children, turn = 0, back = 0, soft = 0, shift = 0 }: { children: ReactNode; turn?: number; back?: number; soft?: number; shift?: number }) {
  return (
    <div className={h.phone} style={{ transform: `translate3d(${shift}px, 0, ${-back}px) rotateY(${turn}deg)`, filter: soft ? `blur(${soft}px)` : undefined } as CSSProperties}>
      <div className={h.frame}>
        <div className={h.glass}>{children}</div>
        <i className={h.island} />
      </div>
    </div>
  )
}

/** The three, side by side: the receipt, the trade, the close. `width`: how wide the row is drawn (px). */
export function Handsets({ width = 1500 }: { width?: number }) {
  // (the row is laid out at the phones' own size, 3 phones of 414 and the room between and about them, and scaled)
  const own = 1620
  return (
    <div className={h.row} style={{ width, height: (width / own) * 900 }}>
      <div className={h.rig} style={{ transform: `scale(${width / own})` }}>
        <Handset turn={24} back={150} soft={1.1} shift={44}>
          <PhoneReceipt />
        </Handset>
        <Handset>
          <PhoneTrade />
        </Handset>
        <Handset turn={-24} back={150} soft={1.1} shift={-44}>
          <PhoneClose />
        </Handset>
      </div>
    </div>
  )
}
