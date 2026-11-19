/**
 * Every word of the landing page (index.html): the journey, and what follows it.
 * The tagline and the line under it are the approved ones, word for word. Everything else follows the
 * architecture paper ("Hyperwood: Architecture and Core Execution") and is a draft for approval.
 * The long read is the Architecture page (content.ts, content.sections.ts).
 */
import type { FilmName } from './film/reel'
import type { IconName } from './ui/icons'

/** A link of the way around the site at the gate. `icon`: the small icon it shows under the pointer, in
 *  place of the arrow (ui/icons.tsx). */
export interface PanelLink {
  label: string
  href: string
  icon?: IconName
}

export const BRAND = 'Hyperwood'

export const home = {
  /** What a screen reader is told the journey is. */
  label: 'Equity perps. Private positions.',

  /** The opening words, one line each: the tagline, in its two lines. The lids close over them. */
  intro: ['Equity perps.', 'Private positions.'],

  /** The approved line. It stands under the wordmark in the journey as it was before the films (?hero=mark), and
   *  in the page's description (index.html). (With the films, the gate has a line of its own: `gate`.) */
  heroLine: 'Go long or short on stocks and indices. Zero-knowledge proofs verify settlement onchain.',

  /** The hero: three films, one after another as the page is scrolled, and what is said on each. Read in
   *  turn the three titles are one story, the story of a trade: what you do, what becomes of it, what settles
   *  it. The gate's tagline (below) ends it.
   *  `film` names the film (film/reel.ts). `shows` says what it shows, for those who cannot see it. `title`
   *  is the sentence across the film's lower edge, in its two halves: one line on a wide screen, the halves one
   *  under the other on an upright one. `note` is the smaller sentence under it. All a draft for approval: the
   *  notes are the approved line and the page's own words, taken apart. */
  films: [
    {
      film: 'board',
      shows: 'A board boy on a ladder chalking prices onto a great blackboard, while a crowd of brokers below him shouts and waves order slips.',
      title: ['Go long', 'or short.'],
      note: 'Perpetuals on stocks and equity indices.',
    },
    {
      film: 'booth',
      shows: 'A broker alone in a lit telephone booth, writing down an order, while the floor of a 1920s stock exchange crowds past outside the glass.',
      title: ['It stays', 'private.'],
      note: 'Market, direction, size and entry stay sealed.',
    },
    {
      film: 'seal',
      shows: 'A settlement clerk pressing the seal into stock certificates at an iron press, while clerks and runners hurry past his desk.',
      title: ['A proof', 'settles it.'],
      note: 'Zero-knowledge proofs verify settlement onchain.',
    },
  ] satisfies { film: FilmName; shows: string; title: [string, string]; note: string }[],

  /** At the gate, the way around the site, as the reference's side panel: two lists between two hairlines, in a
   *  column at the right with the gate's line and the call to action under them, four and four as the
   *  reference has them: the site's parts on the left; the channels and the docs on the right, each with its
   *  icon. (The header's own list, below, belongs to the journey as it was before the films.)
   *  Products opens the app on this page. Learn and Docs open the Architecture page, the long read, until
   *  there are guides and docs of their own. Stake, and the channels, have no address yet (nothing in the
   *  papers describes staking): until then each points to a part of the page that does not exist, so it goes
   *  nowhere. Put the real address in its place (one beginning with https opens in a new tab). */
  panel: [
    [
      { label: 'Products', href: '#app' },
      { label: 'Markets', href: '#markets' },
      { label: 'Learn', href: 'architecture/' },
      { label: 'Stake', href: '#stake' },
    ],
    [
      { label: 'X (Twitter)', href: '#x', icon: 'x' },
      { label: 'Discord', href: '#discord', icon: 'discord' },
      { label: 'Telegram', href: '#telegram', icon: 'telegram' },
      { label: 'Docs', href: 'architecture/', icon: 'docs' },
    ],
  ] as PanelLink[][],

  /** At the gate, which is the page's hero: its tagline and the line beside it, over the call to action. A
   *  draft for approval. The tagline is two sentences, a line each: the first heavy, the second light and set
   *  in, as the reference sets the two lines of its own. It is as large as the reference's where the room
   *  beside the gate allows: the shorter its widest line, the larger it can be (the page measures it:
   *  Journey.tsx). Each sentence is given in its two halves: on an upright screen, with no room beside the
   *  gate, the halves stand one under the other, four lines across the screen. The line is given as its two
   *  lines: where it stands under the tagline (the exchange at the right) each is a line, as the reference
   *  sets its own in two; in the column beside the gate they run on. */
  gate: {
    title: [
      ['Trade', 'the market.'],
      ['Privately,', 'anytime.'],
    ],
    line: ['A confidential network for stocks and indices,', 'designed for you to trade privately.'],
    /** Where the bar across the top has the call to action (the exchange at the right), the column's own, under
     *  the line, says this. It opens what the bar's opens, until the client names another place. */
    call: { label: 'Trade now', href: '#app' },
  },

  /** At the gate: what leaves the engine, and what does not. The two sentences are one title; each stands on
   *  its side of the gate with its note under it. Every part is a line there (on a phone they run on). */
  closing: [
    {
      title: ['The proof', 'is public.'],
      note: ['Every order is matched', 'inside a protected engine', 'and checked by a public contract.'],
    },
    {
      title: ['The position', 'is yours.'],
      note: ['What reaches the network', 'is a commitment', 'and a proof.'],
    },
  ],

  /** (on a phone only the first and the last fit: header.module.css) */
  nav: [
    { label: 'App', href: '#app' },
    { label: 'Markets', href: '#markets' },
    { label: 'Network', href: '#network' },
    { label: 'Architecture', href: 'architecture/' },
  ],
  /** (no app is live: until the client names a destination the button shows the preview) */
  launch: { label: 'Launch App', href: '#app' },
  /** On a screen with no room for the bar's links: what the button that opens them and the one that closes them
   *  are called, and the sheet they are on. */
  menu: { label: 'Menu', open: 'Open the menu', close: 'Close the menu' },

  /* ------------------------------------------------------------ after the journey (all of it a draft for approval)
     What the papers say Hyperwood does, as capabilities: no dates, as the client asked. The speed figures are
     the papers' targets and are named so. (landing/After.tsx lays it out.) */

  /** The app, as three things it does. Each is said in a line with a short text, and shown by a short film of
   *  the app doing it (landing/reel). `film` says what the film shows, for those who cannot see it. */
  app: [
    {
      line: 'Long or short.',
      body: 'On stocks and indices, with the size, leverage and limit price you set.',
      film: 'The order ticket: the size is set, the side is chosen, the order is signed. It comes back sealed, accepted, matched and proven.',
    },
    {
      line: 'Private positions.',
      body: 'Market, direction, size, entry and PnL stay sealed. The network gets a commitment and a proof.',
      film: 'The positions table: every value turns into a bar. Then what reaches the network: two commitments and a verified proof.',
    },
    {
      line: 'Cash, or the stock.',
      body: 'When a position closes, keep the collateral or convert it into an equity tracker.',
      film: 'A position is closed: its profit and equity count up. Then the payout is chosen: the equity tracker, in place of collateral.',
    },
  ],

  markets: {
    line: 'Stocks and indices.',
    body: 'Perpetuals on stock prices and equity indices, each with its own sessions and risk limits. Listing a market takes a bond in ETH.',
  },

  mobile: {
    line: 'In your pocket.',
    body: 'Open, manage and close positions from your phone. Encrypted receipts, a private history and key recovery keep the account yours.',
    screens: ['The mobile app: opening a trade', 'The mobile app: closing a position and choosing the payout'],
    film: 'Two phones side by side: a trade being opened on one, a position being closed and its payout chosen on the other.',
  },

  network: {
    line: 'A Layer 3 with ETH for gas.',
    body: 'A general purpose EVM network with a confidential trading core. It settles to Robinhood Chain, and through it to Ethereum.',
    layers: [
      ['L3', 'Hyperwood', 'General EVM and confidential equity execution'],
      ['L2', 'Robinhood Chain', 'Parent rollup contracts and bridge'],
      ['L1', 'Ethereum', 'Base settlement and data availability'],
    ],
    /** (the papers give these as development targets, not measurements: the column says so once) */
    targets: {
      label: 'Targets',
      list: [
        ['250', 'ms', 'Blocks'],
        ['<1', 's', 'Order feedback'],
        ['5–12', 's', 'To a verified proof'],
      ],
    },
    more: { label: 'Read the architecture', href: 'architecture/' },
  },

  footer: {
    tagline: ['Equity perps.', 'Private positions.'],
    links: [
      { label: 'App', href: '#app' },
      { label: 'Markets', href: '#markets' },
      { label: 'Mobile', href: '#mobile' },
      { label: 'Network', href: '#network' },
      { label: 'Architecture', href: 'architecture/' },
    ],
    /** What the papers insist on being said. */
    notes: [
      'Hyperwood is a proposed network. Nothing on this page describes a live deployment, a guaranteed fill or a guaranteed peg.',
      'Markets provide synthetic price exposure. They do not establish shareholder ownership or issuer permission.',
      'Privacy holds within a defined threat model. Transaction timing and the sender can still be visible.',
      'Deployment on Robinhood Chain does not establish an affiliation with Robinhood.',
    ],
    rights: '© 2026 Hyperwood',
  },
}
