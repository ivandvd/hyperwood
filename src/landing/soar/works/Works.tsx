/**
 * How it works, on the Ink (&ground=ink), as the architecture paper lays it out: its title and its first paragraph,
 * then three cards of words, one for each of its first three parts: the network (Hyperwood settles onto Robinhood
 * Chain, which settles onto Ethereum), confidential trading (encrypted on the device, matched in secure hardware,
 * proven before it is committed) and the equity markets (perpetuals on stocks and indices, listed with an ETH bond).
 * Each card: a title, what it means, and at its foot the paper's figure for it in a few lines.
 *
 * Nothing in it moves of itself: its words and its cards rise into place, one after another, as the scroll brings
 * them in (rise.ts); over a card, the card comes up a little and its edge takes a hairline of Neon. The words:
 * `soar.works` in content.home.ts. Where everything stands: works.module.css.
 */
import { home } from '../../../content.home'
import { useRise } from '../../rise'
import s from './works.module.css'

const W = home.soar.works

export function Works() {
  const riseIn = useRise<HTMLElement>()
  return (
    <section ref={riseIn} id="how" className={s.works} aria-labelledby="works-title">
      <div className={s.head}>
        <h2 id="works-title" className={s.title}>
          <span data-rise="">{W.title[0]}</span> <b data-rise="">{W.title[1]}</b>
        </h2>
        <p className={s.lede} data-rise="">
          {W.lede}
        </p>
      </div>

      <ul className={s.cards}>
        {W.cards.map((card) => (
          <li key={card.title} data-rise="">
            <article className={s.card}>
              <h3 className={s.cardTitle}>{card.title}</h3>
              <p className={s.text}>{card.text}</p>
              <dl className={s.facts}>
                {card.facts.map(([label, name, what]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      {name && <b>{name}</b>}
                      {name && ' '}
                      <span>{what}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
