/**
 * Every word of the landing page (index.html). For now that is the journey: the sections after it are being
 * planned afresh.
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
    { label: 'Architecture', href: 'architecture/' },
  ],
  launch: { label: 'Launch App', href: '#' },
}
