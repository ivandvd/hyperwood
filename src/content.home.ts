/**
 * Every word of the landing page (index.html): the journey, the protocol section and the footer.
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

  nav: [
    { label: 'Protocol', href: '#protocol' },
    { label: 'Architecture', href: 'architecture/' },
  ],
  launch: { label: 'Launch App', href: '#' },

  /* ------------------------------------------------------------ the protocol section */
  section: 'The Hyperwood protocol',
  /** An order's life, as the paper names it. */
  stages: ['Sealed', 'Accepted', 'Matched', 'Proven', 'Settled'],
  title: ['Sealed orders.', 'Proven settlement.'],
  features: [
    {
      title: 'Sealed orders',
      body: 'The network orders and verifies every instruction without reading it. Market, direction, size, leverage, collateral, entry price and PnL stay with you.',
    },
    {
      title: 'Nothing moves without a proof',
      body: 'Orders are matched inside a protected engine. TradingCore accepts a state update only through a verified transition, checked by a public contract.',
    },
    {
      title: 'Close into cash or into the stock',
      body: 'One closing instruction settles in collateral, or converts the available equity into an approved equity tracker token, backed before it is minted.',
    },
    {
      title: 'A Layer 3 on Robinhood Chain',
      body: 'A proposed general purpose EVM Layer 3. Its rollup contracts and bridge deploy on Robinhood Chain, an Arbitrum Layer 2 that uses Ethereum for settlement and data availability.',
    },
  ],
  more: { label: 'Read the architecture', href: 'architecture/' },
  fine: 'Privacy holds within a defined threat model. It is not a claim of absolute anonymity.',

  /* ------------------------------------------------------------ the footer */
  footer: {
    left: ['Equity perps.', 'Private positions.'],
    right: ['© 2026 Hyperwood', 'All rights reserved'],
  },
}
