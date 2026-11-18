/**
 * Every word of the film hero (film.html): a try of the landing page's first screen with a short film in
 * place of the journey. The tagline and the line beside it are the approved ones, word for word.
 */
import { home } from './content.home'
import type { FilmName } from './film/reel'

export const BRAND = 'Hyperwood'

export const film = {
  /** The tagline, one line each. */
  title: ['Equity perps.', 'Private positions.'],
  /** Beside the film: the approved line. */
  line: 'Go long or short on stocks and indices. Zero-knowledge proofs verify settlement onchain.',
  launch: { label: 'Launch App', href: './#app' },

  /** The panel in the third column: the way around the site. */
  nav: [
    [
      { label: 'App', href: './#app' },
      { label: 'Markets', href: './#markets' },
      { label: 'Mobile', href: './#mobile' },
      { label: 'Network', href: './#network' },
    ],
    [{ label: 'Architecture', href: 'architecture/' }],
  ],

  /** What each film shows, for those who cannot see it: the landing page's own words for them. */
  clips: Object.fromEntries(home.films.map((film) => [film.film, film.shows])) as Record<FilmName, string>,

  /** The markets whose cards ride with the film, in turn. `symbol` is what the live quote is asked for. */
  markets: [
    { ticker: 'NVDA', name: 'NVIDIA', symbol: 'NASDAQ:NVDA' },
    { ticker: 'TSLA', name: 'Tesla', symbol: 'NASDAQ:TSLA' },
    { ticker: 'SPX', name: 'S&P 500', symbol: 'FOREXCOM:SPXUSD' },
  ],
}
