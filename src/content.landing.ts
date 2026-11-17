/**
 * Copy for the landing page below the hero: four frames (deck/).
 * The landing page says each thing once and briefly; the full design, section by section, is on the
 * Architecture page (content.ts and content.sections.ts). Everything here follows the architecture paper
 * ("Hyperwood: Architecture and Core Execution"). Draft for approval, like the rest of the copy.
 */
type Pair = [string, string]

export const landing = {
  /** Header links: label and the id of the frame it scrolls to. */
  nav: [
    ['Privacy', 'privacy'],
    ['Payout', 'payout'],
    ['Network', 'network'],
  ] as Pair[],
  /** The long read. `href` is relative, so the site works from any folder. */
  docs: { label: 'Architecture', href: 'architecture/' },

  /* ------------------------------------------------------------ frame 1, paper p. 3 and p. 13 */
  privacy: {
    label: 'Confidential trading',
    title: 'Sealed orders.\nProven settlement.',
    lead: 'The network orders and verifies every instruction without reading it. Market, direction, size, leverage, collateral, entry price and PnL stay with you.',
    fine: 'Privacy holds within a defined threat model. It is not a claim of absolute anonymity.',
    view: { label: 'View as', network: 'The network', owner: 'The owner' },
    /** The order the hero followed, as a ticket. Values are the paper's worked example (10 units at $100 on
     *  $400 of margin); identifiers are examples. */
    ticket: {
      name: 'Order',
      operation: 'OPEN',
      request: 'requestId 0x7c1e…a4f2',
      pending: 'requestId pending',
      rows: [
        ['Market', 'Equity perpetual'],
        ['Direction', 'Long'],
        ['Size', '10 units'],
        ['Leverage', '2.5×'],
        ['Limit price', '$100.00'],
        ['Collateral', '$400.00'],
      ] as Pair[],
      /** What the status reads before the network has the order, then the four stages the paper names. */
      draft: 'Draft',
      sealed: 'Sealed',
      stages: ['Accepted', 'Matched', 'Proven', 'Parent settlement'],
      batch: 'batchId 4812',
      root: 'stateRoot 0x3fa9…d07b',
      verified: 'Proof verified',
      sealedLabel: 'Sealed',
    },
    legend: { open: 'Public', sealed: 'Confidential', note: 'Example values' },
  },

  /* ------------------------------------------------------------ frame 2, paper p. 10 to 12 */
  payout: {
    label: 'Settlement choices',
    title: 'Close the position.\nChoose the payout.',
    lead: 'One closing instruction settles in collateral, or converts the available equity into an approved equity tracker token.',
    fine: 'Illustrative amounts from the worked example. No fees or funding, conversion at the stated price.',
    /** The paper's worked example: 10 units opened at $100 on $400 of margin, closed at $120. */
    example: { margin: 400, units: 10, entry: 100, exit: 120 },
    words: {
      side: 'Long',
      units: 'units',
      open: 'Open',
      closed: 'Closed',
      entry: 'Entry',
      mark: 'Mark',
      pnl: 'PnL',
      equity: 'Available equity',
      collateral: 'Collateral',
      collateralSub: 'Private balance or withdrawal',
      tracker: 'Equity tracker',
      trackerSub: 'A new unlevered long',
      trackerUnit: 'tracker units',
      choose: 'Settle in',
    },
  },

  /* ------------------------------------------------------------ frame 3, paper p. 1 to 2, 4 to 9, 11 */
  network: {
    label: 'Architecture',
    title: 'A Layer 3\non Robinhood Chain.',
    lead: 'Hyperwood is a proposed general purpose EVM Layer 3. Its rollup contracts and bridge deploy on Robinhood Chain, an Arbitrum Layer 2 that uses Ethereum for settlement and data availability.',
    more: 'Read the architecture',
    /** Four tiles: a name, a statement, one line, and the section of the Architecture page it opens. */
    tiles: [
      { key: 'layers', name: 'Network', title: 'Three layers, one settlement path', text: 'Standard EVM transactions execute normally, beside the confidential engine.', to: 'network' },
      { key: 'core', name: 'Execution', title: 'No position changes without a proof', text: 'TradingCore accepts a state update only through a verified transition.', to: 'execution' },
      { key: 'markets', name: 'Markets', title: 'Anyone can list a market', text: 'An ETH bond and an approved template, through one registry path.', to: 'markets' },
      { key: 'trackers', name: 'Trackers', title: 'A token designed to follow the stock', text: 'Backed before it is minted. Exportable as a public ERC 20.', to: 'trackers' },
    ],
    layers: [
      ['L3', 'Hyperwood'],
      ['L2', 'Robinhood Chain'],
      ['L1', 'Ethereum'],
    ] as Pair[],
    core: ['Inbox', 'Engine', 'Prover', 'Verifier'],
    lifecycle: ['Proposed', 'Warmup', 'Active', 'Reduce Only', 'Settlement', 'Retired'],
    bond: { locked: 'ETH bond locked', free: 'ETH bond unlocked' },
    follow: { reference: 'Equity reference', tracker: 'Tracker token' },
  },

  /* ------------------------------------------------------------ frame 4: the close */
  close: {
    label: 'Hyperwood',
    title: 'Equity perps.\nPrivate positions.',
    lead: 'Go long or short on stocks and indices. Zero-knowledge proofs verify settlement onchain.',
  },
}
