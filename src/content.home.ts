/**
 * Every word of the landing page (index.html): the journey, and the sections after it as they are built.
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
     What the papers say Hyperwood does, as capabilities: no dates, as the client asked. Figures from the papers
     are targets and are labelled so. Markets and prices in the previews are examples (app/markets.ts). */

  /** The app: one window, and four things said about it as the scroll moves through it. */
  app: {
    label: 'The app',
    beats: [
      { tag: 'Your screen', line: 'Everything on your screen.', body: 'Markets, a chart, your order and your positions. The whole trade, where you can see it.' },
      { tag: 'The order', line: 'Long or short.', body: 'Pick a stock or an index. Set the size, the leverage and a limit price. Your wallet signs an encrypted instruction.' },
      { tag: 'The network', line: 'Nothing on theirs.', body: 'The network orders your instruction and verifies its proof. Market, direction, size, entry and PnL stay sealed.' },
      { tag: 'The payout', line: 'Cash, or the stock.', body: 'When a position closes, keep the collateral or convert the proceeds into an approved equity tracker.' },
    ],
    switchLabel: 'Whose view',
    views: { yours: 'Your view', network: 'Network view' },
    caption: 'A preview of the web app, with sample data.',
  },

  markets: {
    label: 'Markets',
    line: 'Stocks and indices.',
    body: 'Each market is a perpetual on a stock price or an equity index, with its own sessions, funding and risk limits.',
    facts: ['Trading sessions, halts and corporate actions are part of every market.', 'Operators and users list markets through one registry, with a bond in ETH.'],
    sides: ['Long', 'Short'],
    caption: 'Example markets with sample prices.',
  },

  mobile: {
    label: 'Mobile',
    line: 'In your pocket.',
    body: 'Open, manage and close positions from your phone. Encrypted receipts, a private history and key recovery keep the account yours.',
    screens: ['Preview of the mobile app: opening a trade', 'Preview of the mobile app: closing a position and choosing the payout'],
    caption: 'A preview of the mobile app, with sample data.',
  },

  network: {
    label: 'The network',
    line: 'A Layer 3 with ETH for gas.',
    body: 'A general purpose EVM network with a confidential trading core. It settles to Robinhood Chain, and through it to Ethereum.',
    layers: [
      ['L3', 'Hyperwood', 'General EVM and confidential equity execution'],
      ['L2', 'Robinhood Chain', 'Parent rollup contracts and bridge'],
      ['L1', 'Ethereum', 'Base settlement and data availability'],
    ],
    target: 'Target',
    targets: [
      ['250', 'ms', 'Blocks'],
      ['<1', 's', 'Order feedback'],
      ['5–12', 's', 'To a verified proof'],
    ],
    note: 'These figures are development targets, not measurements.',
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
      'Deployment on Robinhood Chain does not establish an affiliation with Robinhood. Markets and prices in the previews are samples.',
    ],
    rights: '© 2026 Hyperwood',
  },
}
