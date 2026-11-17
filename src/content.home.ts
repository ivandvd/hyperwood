/**
 * Every word of the landing page (index.html): the journey, and what follows it.
 * The tagline and the line under it are the approved ones, word for word. Everything else follows the
 * architecture paper ("Hyperwood: Architecture and Core Execution") and is a draft for approval.
 * The long read is the Architecture page (content.ts, content.sections.ts).
 */
export const BRAND = 'Hyperwood'

export const home = {
  /** What a screen reader is told the journey is. */
  label: 'Equity perps. Private positions.',

  /** The opening words, one line each: the tagline, in its two lines. The lids close over them. */
  intro: ['Equity perps.', 'Private positions.'],

  /** Under the word in the hero: the approved line. */
  heroLine: 'Go long or short on stocks and indices. Zero-knowledge proofs verify settlement onchain.',

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
