/**
 * Every line of interface copy.
 * Draft for approval: wording follows the architecture document (confidential equity markets on an EVM
 * Layer 3; orders match in private; the network verifies changes without publishing individual positions).
 */
export const content = {
  brand: 'Hyperwood',
  label: 'Confidential equity markets / 001',
  /** The scroll follows one order through the stages the protocol names. */
  phases: [
    ['01', 'Accepted'],
    ['02', 'Matched'],
    ['03', 'Proven'],
    ['04', 'Settled'],
  ] as [string, string][],
  hero: {
    title: 'Equity perps.\nPrivate positions.',
    text: 'Go long or short on stocks and indices. Zero-knowledge proofs verify settlement onchain.',
    hint: 'Scroll to follow an order ↓',
  },
  final: {
    text: 'Every order is matched inside a protected engine and checked by a public contract. What reaches the network is a commitment and a proof.',
    line1: 'The proof is public.',
    line2: 'The position is yours.',
    restart: 'Back to the top ↑',
  },
  /** Section 02, straight after the hero: its two closing lines become two columns.
   *  Source: the architecture paper, "Confidential trading" (the public / confidential table, private state and
   *  protected execution, order book privacy, and the limits the paper states). */
  split: {
    index: '01',
    label: 'Confidential trading',
    title: 'What is public and what is confidential',
    open: {
      word: 'Public.',
      lead: 'Observers can see opening and closing activity, the order of transactions and the commitments to the new state.',
      /* each row: what it is, and an example of it. The names in the examples are the paper's own fields. */
      rows: [
        ['Operation type and a fresh request identifier', 'OPEN · requestId 0x7c1e…a4f2'],
        ['Batch timing and ordering commitments', 'batchId 4812 · inbox 1024 to 1087'],
        ['Global state roots and settlement proofs', 'newStateRoot 0x3fa9…d07b · proof verified'],
        ['Public market specifications', 'oracle · funding · margin'],
      ] as [string, string][],
    },
    sealed: {
      word: 'Confidential.',
      lead: 'The objective is to conceal which equity you trade, the direction of the position, its size, collateral, entry price and profit or loss.',
      /* the examples are the worked example of section 04: 10 units opened at $100 on $400 of margin */
      rows: [
        ['Market selection and long or short direction', 'equity perpetual · long'],
        ['Quantity, leverage, limit price and collateral', '10 units · 2.5× · $100.00 · $400.00'],
        ['Positions, account balances, funding and PnL', '+10 units · PnL +$200.00'],
        ['The association between a user and a market', 'this account, this market'],
      ] as [string, string][],
    },
    /** The switch above the two columns: the same order, as the network sees it and as its owner does. */
    view: { label: 'View as', network: 'The network', owner: 'The owner', sealed: 'Sealed', note: 'Example values, from the worked example in section 03.' },
    notes: [
      ['Private state', 'A shared shielded pool holds encrypted records for balances, orders and positions. Commitments bind each record to its contents, and nullifiers stop a consumed record from being used again.'],
      ['Protected execution', 'Matching and risk processing run inside trusted execution environments. Zero knowledge proofs then show that the settlement is correct.'],
      ['Confidential order book', 'There is no live public depth feed. You receive your own execution details privately, and public statistics follow an aggregation and delay policy.'],
      ['Shielded risk', 'Liquidations, funding and insurance use shielded accounting. A public keeper trigger identifies an epoch, not a position.'],
    ] as [string, string][],
    limits: {
      title: 'What this does not claim',
      items: [
        'Privacy holds within a defined threat model. It is not a claim of absolute anonymity.',
        'Counterparties know the details of their own fills. Thin activity, or public deposits and withdrawals, can permit inference.',
        'A standard EVM transaction exposes its sender unless a separate relayer is used.',
        'Zero knowledge proofs hide private inputs from public verifiers, not from the party that produces the proof.',
      ],
    },
  },
  loading: 'Loading',
  /** Small interface extras, switched off for now to keep the frame clean: the label in the header, the
   *  stage counter, the scroll hint and the link back to the top. Set one to true to bring it back. */
  extras: { label: false, phase: false, hint: false, restart: false },
}
