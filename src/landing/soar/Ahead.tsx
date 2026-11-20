/**
 * Why no one can trade ahead of an order here (&ground=ink, After.tsx), as the Investor Overview argues it: on most
 * venues an order can be read before it fills, by bots watching a public queue or by a market maker with a privileged
 * agreement; here it is sealed before it leaves the device. No firm is named: the point is structural, as the paper
 * itself says.
 *
 * Under the words, the paper's own example as a liquid engine in a glass panel like How it works' (liquid/FrontRun.tsx:
 * drawn on the GPU): a $40,000 market buy in two lanes, flowing into a book whose level is the price. On a public venue
 * a bot reads the order, gets into the book first, the level climbs from $184.00 to $185.60 and the order fills there;
 * the bot pulls back out with $1,400 of it. On Hyperwood the order travels sealed, the bot cannot read it and sinks
 * away, and it fills at $184.00. The words over the liquid are placed with it, every frame, by transforms.
 *
 * The words: `soar.ahead` in content.home.ts. Where everything stands: ahead.module.css.
 */
import { useCallback, useRef } from 'react'
import { home } from '../../content.home'
import { FrontRun } from './liquid/FrontRun'
import { BOOK, LEVEL, type Story } from './liquid/frontRunStory'
import s from './ahead.module.css'

const A = home.soar.ahead

type Box = { x: number; y: number; w: number; h: number }

export function Ahead() {
  /** the words that move with the liquid, by name */
  const words = useRef<Record<string, HTMLElement | null>>({})
  const word = (key: string) => (el: HTMLElement | null) => {
    words.current[key] = el
  }
  const said = useRef(new Map<HTMLElement, string>())
  const place = useCallback((story: Story, lanes: Box[], fade: number) => {
    const w = words.current
    const put = (key: string, x: number, y: number, on: number) => {
      const el = w[key]
      if (!el) return
      const value = `${x.toFixed(1)}|${y.toFixed(1)}|${on.toFixed(3)}`
      if (said.current.get(el) === value) return
      said.current.set(el, value)
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      el.style.opacity = (on * fade).toFixed(3)
    }
    const at = (i: number, xu: number, yu: number): [number, number] => {
      const L = lanes[i]
      return [L.x + xu * L.h, L.y + yu * L.h]
    }
    const W = story.words
    const R = 0.13
    const across = (i: number, u: number) => (lanes[i].w / lanes[i].h) * u
    // the order's word over it, in each lane; the bots' words beside them (under them, they ran into the lane below
    // on a phone); the fills by each book; the cost with what the bot takes away; the price the level climbs to
    put('order', ...at(0, story.order.x, story.order.yPublic - R - 0.06), W.order)
    put('sealed', ...at(1, story.order.x, story.order.yHyperwood - R * 1.32 - 0.06), W.order)
    put('bot', ...at(0, story.publicBot.x + 0.1, story.publicBot.y), W.bot)
    put('notRead', ...at(1, story.hyperwoodBot.x + 0.1, story.hyperwoodBot.y), W.notRead)
    put('filledPublic', ...at(0, across(0, 0.865), 0.98), W.filledPublic)
    // (the cost: beside the book, between the level the order paid and the one it should have, a bracket across them)
    put('cost', ...at(0, across(0, BOOK.left) - 0.06, (LEVEL.high + LEVEL.base) / 2), W.cost)
    put('bracket', ...at(0, across(0, BOOK.left) - 0.03, LEVEL.high), W.cost)
    const bracket = w.bracket
    if (bracket) bracket.style.height = `${((LEVEL.base - LEVEL.high) * lanes[0].h).toFixed(1)}px`
    put('filledHyperwood', ...at(1, across(1, 0.865), 0.98), W.filledHyperwood)
    put('high', ...at(0, across(0, 0.955), 0.3), W.high)
  }, [])

  return (
    <section className={s.ahead} aria-labelledby="ahead-title">
      <h2 id="ahead-title" className={s.title}>
        <span className={s.claim}>{A.title[0]}</span> <span className={s.who}>{A.title[1]}</span>
      </h2>
      <p className={s.body}>{A.body}</p>
      <figure className={s.panel}>
        <figcaption className={s.example}>{A.example}</figcaption>
        <div className={s.engine} role="img" aria-label={A.shows}>
          {/* each lane: its name, its book (a vessel of glass), the price at its level */}
          {[0, 1].map((i) => (
            <div key={i} className={s.lane} data-lane={i}>
              <p className={s.laneName} data-lane={i}>
                {A.lines[i]}
              </p>
              <i className={s.book} />
              <p className={s.price}>$184.00</p>
            </div>
          ))}
          <FrontRun className={s.liquid} onFrame={place} />
          <p ref={word('order')} className={s.tag}>
            {A.order}
          </p>
          <p ref={word('sealed')} className={`${s.tag} ${s.tagSealed}`}>
            {A.sealed}
          </p>
          <p ref={word('bot')} className={`${s.tag} ${s.tagBot}`}>
            {A.bot}
          </p>
          <p ref={word('notRead')} className={`${s.tag} ${s.tagBot}`}>
            {A.notRead}
          </p>
          <p ref={word('high')} className={s.mark}>
            $185.60
          </p>
          <p ref={word('filledPublic')} className={s.fill}>
            {A.fills[0]}
          </p>
          <p ref={word('cost')} className={s.cost}>
            {A.cost}
          </p>
          <i ref={word('bracket')} className={s.bracket} />
          <p ref={word('filledHyperwood')} className={`${s.fill} ${s.fillSealed}`}>
            {A.fills[1]}
          </p>
        </div>
      </figure>
      <p className={s.after}>{A.after}</p>
    </section>
  )
}
