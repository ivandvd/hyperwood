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

  /** The films after the hero instead (the address ?films=after: landing/FilmBlock.tsx), in the same order, as the
   *  same story of a trade: what you do, that it stays yours, what settles it. `title`: its two lines, the first
   *  heavy and the second light, large across the film's lower edge. Beside it, under the mark's tile, `lede`: the
   *  one thing to know, and `body`: what it means, in the page's own words (the papers' as the rest of the page has
   *  them). A draft for approval. The first lede's oil, FX and markets that never close are the client's to confirm:
   *  the papers name stocks and equity indices, each with its own sessions. */
  filmsAfter: [
    {
      film: 'board',
      title: ['Pick a stock.', 'Pick a side.'],
      lede: 'Equities, the S&P 500, oil, FX and more, on markets that never close.',
      body: 'Perpetuals on stock prices and equity indices. Go long or short with the size, leverage and limit price you set.',
      facts: [
        { label: 'Gas', value: 'ETH' },
        { label: 'New markets', value: 'Listed with an ETH bond' },
        { label: 'On close', value: 'Cash or the stock' },
      ],
    },
    {
      film: 'booth',
      title: ['No one sees', 'your trade.'],
      lede: 'Market, side, size, entry and PnL stay sealed.',
      body: 'Your position lives inside a protected engine. What reaches the network is a commitment and a proof, never the position itself.',
      facts: [
        { label: 'Order book', value: 'No public depth' },
        { label: 'Your fills', value: 'Encrypted receipts' },
        { label: 'Market stats', value: 'Aggregated and delayed' },
      ],
    },
    {
      film: 'seal',
      title: ['Every trade,', 'proven.'],
      lede: 'Settled onchain, verified by zero-knowledge proofs.',
      body: 'Every order is matched in the engine and checked by a public contract, on a Layer 3 that settles to Robinhood Chain and Ethereum.',
      facts: [
        { label: 'Blocks', value: '250 ms', target: true },
        { label: 'Order feedback', value: 'Under 1 s', target: true },
        { label: 'To a verified proof', value: '5 to 12 s', target: true },
      ],
    },
  ] satisfies {
    film: FilmName
    title: [string, string]
    lede: string
    body: string
    /** (with the logo that stays, a try: three short facts at the foot of the third column, level with the
     *  title's foot, each a label and what it is. Only what the papers say; `target`: one of the papers' targets,
     *  and said to be one, as the papers insist) */
    facts: { label: string; value: string; target?: boolean }[]
  }[],

  /** After those films (the address ?films=after: landing/Statement.tsx): the statement, in five lines, the first
   *  three light and the last two heavy, said as the reference says its own (bulk.trade: what it combines, what it
   *  is, its qualities, who it is for). Each line stands on a line of its own on a wide screen, so keep them about
   *  this long (the page sizes them so that the longest fits). Only what the papers say. A draft for approval. */
  statement: {
    light: ['We combine a confidential trading engine', 'with settlement anyone can verify.', 'Hyperwood is private trading for public markets.'],
    heavy: ['Sealed. Matched. Proven.', 'Built for traders who keep their book closed.'],
  },

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

  /** A try, &flow=soar (with ?films=after): the page after the hero laid out part for part as trysoar.com lays out
   *  its own, light and dark by turns (landing/soar). The words of its parts; only what the papers say. A draft. */
  soar: {
    /** the statement on the light ground, under the hero: a line in two tones, a sentence, the call to action */
    opening: {
      dim: 'Private trading for public markets.',
      bright: 'Sealed. Matched. Proven.',
      body: 'We combine a confidential trading engine with settlement anyone can verify. Built for traders who keep their book closed.',
    },
    /** under the app's stage: two cards, each who it is for and why (the Investor Overview's own reasons) */
    sizes: {
      title: ['Built for', 'every size.'],
      cards: [
        { lead: 'For traders.', rest: 'Size stops being a liability. A position no one can see is a position no one can hunt.', film: 'booth' },
        { lead: 'For funds and desks.', rest: 'Hedge without showing the book to competitors, or the order to a rival before the market.', film: 'board' },
      ],
    },
    /** a row of cards, each one part of the exchange, moved along by the arrows or the finger */
    detail: {
      title: ['The exchange', 'in detail.'],
      cards: [
        { lead: 'Sealed orders', rest: 'Encrypted on your device and signed as one instruction.', picture: 'ticket' },
        { lead: 'Private matching', rest: 'A confidential engine matches orders. There is no public book.', picture: 'booth' },
        { lead: 'Proofs', rest: 'A zero-knowledge proof checks every batch on a public contract.', picture: 'request' },
        { lead: 'Settlement', rest: 'A Layer 3 that settles to Robinhood Chain, and through it to Ethereum.', picture: 'seal' },
        { lead: 'Open listings', rest: 'Anyone can list a market with an ETH bond and an approved template.', picture: 'board' },
        { lead: 'Payouts', rest: 'Close into collateral, or into an equity tracker you can hold or export.', picture: 'payout' },
      ],
    },
    /** How a trade goes, from the device to the chain (soar/HowItWorks.tsx): the request's four stages as the papers
     *  name them, after the sealing on the device. Each: the stage, what happens there, and, where the papers give
     *  one, the development target for it (`figure`, `of`; the section says once that these are targets). Only what
     *  the papers say. A draft for approval. */
    how: {
      title: ['How it works.', 'From your device to the chain.'],
      steps: [
        {
          name: 'Sealed',
          text: 'Your device encrypts the order and signs it as one instruction. Market, direction, size and leverage stay inside it.',
          figure: '1',
          of: 'signed instruction',
        },
        {
          name: 'Accepted',
          text: 'The sequencer adds it to a public queue and returns a request id. The queue shows that a request arrived and when, not what it says.',
          figure: '<1 s',
          of: 'feedback on an accepted order',
        },
        {
          name: 'Matched',
          text: 'A sealed engine matches orders in batches. There is no public order book and no public tape.',
          figure: '250 ms',
          of: 'blocks',
        },
        {
          name: 'Proven',
          text: 'A zero-knowledge proof shows that the batch followed the rules, without showing the orders. A public contract checks it.',
          figure: '5–12 s',
          of: 'to a verified proof',
        },
        {
          name: 'Settled',
          text: 'The batch settles to Robinhood Chain, and through it to Ethereum. Your fill comes back as a receipt only your key opens.',
          figure: '~30 s',
          of: 'to Robinhood Chain at low load',
        },
      ],
      targets: 'Times are development targets, not measurements.',
      /** what the pictures beside the stages show, for those who cannot see them */
      shows: [
        'An order being sealed: market NVDA-PERP, long, size 10, leverage 2.5 times and margin $603.48 turn into ciphertext, signed as one instruction.',
        'The public queue: request ids and times, and this request, 0x3fa9…c2d1, accepted at 14:32:07.',
        'The sealed engine: two sealed orders meet inside it and are filled in one batch.',
        'The proof of the batch, checked on the public contract.',
        'The batch going down from Hyperwood to Robinhood Chain and Ethereum, and the receipt coming back.',
      ],
    },
    /** The same position as its owner sees it and as the network does (soar/WhoSees.tsx): the Investor Overview's
     *  list of what is hidden and what is still visible. A draft for approval. */
    who: {
      title: ['Who sees what.', 'The same trade, two views.'],
      views: ['You', 'The network'],
      hidden: {
        label: 'Hidden',
        list: ['Market', 'Direction', 'Size', 'Leverage', 'Collateral', 'Entry', 'Profit and loss'],
      },
      visible: {
        label: 'Still visible',
        list: ['Your address', 'When you send', 'Deposits and withdrawals', 'Total open interest', 'That batches run', 'Market specifications'],
      },
      note: 'Privacy holds within a defined threat model. It is not anonymity.',
    },
    /** Questions, each answered only with what the papers say (soar/Faq.tsx). A draft for approval. */
    faq: {
      title: ['Questions.', 'Straight answers.'],
      items: [
        {
          q: 'What is Hyperwood?',
          a: 'A proposed network for private perpetual futures on stocks and equity indices. It is a Layer 3 that settles to Robinhood Chain, and through it to Ethereum.',
        },
        {
          q: 'What is an equity perpetual?',
          a: 'A future on the price of a stock or an index, with no expiry date. You go long or short with margin, and close when you choose.',
        },
        {
          q: 'What stays private?',
          a: 'The market you trade, your direction, size, leverage, collateral, entry, and profit or loss. Your fills come back as encrypted receipts that only your key opens.',
        },
        {
          q: 'What can others still see?',
          a: 'That your address sent a request and when, deposits and withdrawals, total open interest, that batches run, and each market’s specifications. Privacy holds within a defined threat model; it is not anonymity.',
        },
        {
          q: 'How do I know a batch was matched fairly?',
          a: 'Each batch comes with a zero-knowledge proof that it followed the rules. A public contract checks the proof before the batch settles.',
        },
        {
          q: 'Do I own the shares?',
          a: 'No. Markets give synthetic price exposure, not shareholder ownership or issuer permission. When you close, you can take your proceeds as an equity tracker: a separately backed, unlevered long you can hold, or export as a public token.',
        },
        {
          q: 'What do I pay gas in?',
          a: 'ETH. It is the network’s gas, and the bond for listing a market.',
        },
        {
          q: 'Who can list a market?',
          a: 'Anyone, with an ETH bond and an approved template. A market goes through a warmup before it is active, and follows its stock’s sessions, holidays and halts.',
        },
        {
          q: 'Is Hyperwood live?',
          a: 'Not yet. It is a proposed network. The plan runs through an integrated devnet and a public testnet to a first mainnet stage, about seven months from its start.',
        },
        {
          q: 'Is Hyperwood affiliated with Robinhood?',
          a: 'No. It is built to settle on Robinhood Chain, which does not establish an affiliation with Robinhood.',
        },
      ],
    },
    /** the last screen: its line is the dark last screen's (`finale`); what its picture shows */
    ending: {
      shows: 'The Hyperwood mobile app on an iPhone: the NVDA perpetual with its chart, the account’s position, and the buttons to go long or short.',
    },
  },

  /** With the films after the hero (the address ?films=after), the app on its stage (landing/AppStage.tsx): the
   *  headline over the monitor, in its two lines, the first dim and the second bright; what the monitor's picture
   *  shows, for those who cannot see it; and the three cards under it, each a claim (`lead`) and what it means
   *  (`rest`) under a close view of that part of the app (`shows`). Only what the papers say. A draft for approval. */
  appStage: {
    title: ['Everything on your screen.', 'Only you can see it.'],
    shows:
      'The Hyperwood web app on a monitor: a list of stock and index markets with their prices, the chart of the NVDA perpetual with the account’s entry and its waiting order marked on it, the account’s two positions, a ticket that signs a sealed order, an order book whose prices and sizes are sealed, and the last request, accepted, matched and proven, settling.',
    cards: [
      {
        lead: 'Trade sealed.',
        rest: 'Your order is encrypted before it leaves your device.',
        shows: 'The order ticket: long or short, size, limit price, leverage, and the button that signs the sealed order.',
      },
      {
        lead: 'Proof on every fill.',
        rest: 'Matched in a sealed engine, checked by a public contract.',
        shows: 'A request on its way: accepted by the sequencer, matched in the sealed engine, proven by a zero-knowledge proof, settling on Robinhood Chain.',
      },
      {
        lead: 'Close into the stock.',
        rest: 'Keep the collateral, or take the equity tracker.',
        shows: 'Closing a position: its cleared equity, and the choice to be paid out as collateral or as units of the stock’s tracker.',
      },
    ],
    /** Under the cards, the mobile app on three phones, standing before the horizon the stage ends on: its two
     *  lines, a sentence, and what the picture shows. */
    pocket: {
      title: ['The same account.', 'In your pocket.'],
      body: 'Open, manage and close positions from your phone. Encrypted receipts, a private history and key recovery keep the account yours.',
      shows:
        'The Hyperwood mobile app on three phones: a receipt for a sealed order, accepted, matched and proven; the NVDA perpetual with its chart, the account’s position and the buttons to go long or short; and a position being closed, paid out as units of the stock’s tracker.',
      shots: [
        'The Hyperwood mobile app on an iPhone, seen close: the NVDA perpetual at 156.31 with its chart.',
        'The receipt for a sealed order on an iPhone: accepted, matched and proven.',
        'A position being closed on an iPhone: the cleared equity, paid out as units of the NVDA tracker.',
      ],
    },
  },

  /** With the films after the hero, the page's last screen before its foot (landing/Finale.tsx): a line in two
   *  tones, the first dim and the second bright, beside the app on a standing phone, and the call to action
   *  (`launch`, below). The second sentence is the Investor Overview's own line; whether it is said in public is the
   *  client's to decide. A draft for approval. */
  finale: {
    title: ['Trade the market.', 'Show them nothing.'],
    shows: 'The Hyperwood mobile app on a phone standing on the ground, lit from behind, its long shadow running out before it.',
  },

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
    /** (with &foot=: a few words in bold before each note, as the reference leads its own) */
    leads: ['Not yet live.', 'Synthetic exposure.', 'Private within limits.', 'No affiliation.'],
    rights: '© 2026 Hyperwood',
  },
}
