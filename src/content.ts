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
    title: 'Equity markets,\nkept confidential.',
    text: 'Long and short exposure to stocks and indices on an EVM Layer 3. Orders match in private. The network publishes proofs, not positions.',
    hint: 'Scroll to follow an order ↓',
  },
  final: {
    text: 'Every order is matched inside a protected engine and checked by a public contract. What reaches the network is a commitment and a proof.',
    line1: 'The proof is public.',
    line2: 'The position is yours.',
    restart: 'Back to the top ↑',
  },
  loading: 'Loading',
  /** Small interface extras, switched off for now to keep the frame clean: the label in the header, the
   *  stage counter, the scroll hint and the link back to the top. Set one to true to bring it back. */
  extras: { label: false, phase: false, hint: false, restart: false },
}
