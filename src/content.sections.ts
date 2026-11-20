/**
 * Copy for the Architecture page (sections 02 to 08; section 01, "Public and confidential", is in content.ts),
 * and the words both pages share: the call to action and the cautions in the footer.
 * Everything here comes from the architecture paper ("Hyperwood: Architecture and Core Execution"), in its own
 * words where possible, section by section. Draft for approval, like the rest of the copy.
 * The landing page's own, shorter copy is in content.landing.ts.
 */
import { cautions } from './content.cautions'

type Pair = [string, string]

export const sections = {
  /** The Architecture page: its opening, and the link that leads back to the landing page. */
  doc: {
    label: 'Architecture',
    sub: 'The full design',
    title: 'Architecture\nand core execution.',
    lead: 'How Hyperwood is designed, section by section, in the order of the architecture paper: what is confidential and what is public, how markets are listed, how a position settles, what a tracker token is, how an order executes, and what has to be shown to work before any of it is switched on.',
    home: 'Overview',
  },
  /** The Architecture page's navigation: label and the id of the section it scrolls to. */
  nav: [
    ['Privacy', 'confidential'],
    ['Markets', 'markets'],
    ['Payout', 'payout'],
    ['Trackers', 'trackers'],
    ['Execution', 'execution'],
    ['Network', 'network'],
    ['Roadmap', 'roadmap'],
  ] as Pair[],
  /** The call to action. The app has no address yet: until it has, this points to a place that is not in the page,
   *  and a link that leads nowhere opens the note that says so (site/Soon.tsx). */
  cta: { label: 'Launch App', href: '#launch' },

  /* ------------------------------------------------------------ 03, paper p. 4 */
  markets: {
    index: '02',
    label: 'Equity markets',
    title: 'Perpetuals on stocks and equity indices.',
    lead: 'Each market defines a perpetual derivative against a specified stock price or equity index. A synthetic market provides price exposure. Shareholder ownership and voting rights arise only if an instrument explicitly grants them.',
    create: {
      title: 'Anyone can list a market',
      text: 'The operator and users create markets through the same registry validation path. Registration can be automatic when all objective activation conditions are met.',
      steps: [
        ['Deposit the ETH bond', 'The registry quotes the bond in ETH according to the approved template and capacity tier.'],
        ['Choose an approved template', 'A new user market starts with isolated margin, a limited open interest allowance and a separate insurance allocation.'],
        ['Submit the market', 'The equity reference, the oracle configuration and the risk parameters.'],
      ] as Pair[],
    },
    defines: {
      title: 'Every market states',
      items: ['Reference currency', 'Unit multiplier', 'Oracle methodology', 'Funding rules', 'Margin requirements'],
    },
    lifecycle: {
      title: 'Market lifecycle',
      stages: [
        ['Proposed', 'The bond is deposited and the market is submitted through the registry.'],
        ['Warmup', 'Oracle continuity and the conditions for launch are verified.'],
        ['Active', 'Trading under the risk template. Increased capacity requires predefined evidence and additional resources.'],
        ['Reduce Only', 'Existing exposure can be reduced. It cannot be increased.'],
        ['Settlement', 'Positions and market obligations are settled.'],
        ['Retired', 'The bond unlocks once obligations are settled and the dispute period has ended.'],
      ] as Pair[],
      note: 'Slashing applies only to defined, provable breaches or to an explicitly disclosed governance procedure.',
      /** The bar under the stages: the bond is held from Proposed until the market is Retired. */
      bond: { locked: 'ETH bond locked', free: 'ETH bond unlocked' },
    },
    accounts: {
      title: 'Four capital accounts, kept apart',
      rows: [
        ['Creator ETH bond', 'Listing obligations and the cost of protocol abuse'],
        ['Trader collateral', 'Margin for positions and resting orders'],
        ['Market insurance', 'Defined losses remaining after liquidation'],
        ['Tracker issuance reserves', 'Liabilities of separately issued equity tokens'],
      ] as Pair[],
      note: 'Bond capital, trader collateral and tracker reserves cannot be silently substituted for one another.',
    },
    rules: {
      title: 'Equity rules, defined per market',
      items: ['Trading sessions', 'Exchange holidays', 'Halts', 'Splits and reverse splits', 'Dividends', 'Mergers', 'Symbol changes', 'Delisting'],
      text: 'The network may operate continuously, while executable equity pricing follows the selected data product. A 24 hour blockchain does not create a continuously executable underlying stock market.',
      more: 'A market listing grants access to derivative trading under its risk template. Tracker issuance and bridge access require separate approval and capacity.',
      /** A small picture of that sentence: the network never stops, the price it can execute against does. */
      clock: {
        tag: 'Schematic',
        network: 'Network',
        always: 'Continuous',
        pricing: 'Executable equity pricing',
        follows: 'Follows the data product',
        session: 'Session',
        halt: 'Halt',
        holiday: 'Holiday',
        closed: 'Closed',
      },
    },
  },

  /* ------------------------------------------------------------ 04, paper p. 10 */
  payout: {
    index: '03',
    label: 'Settlement choices',
    title: 'Close the position. Choose the payout.',
    lead: 'One closing instruction supports both. Clearing first closes the derivative and finalizes its obligations, then determines the positive equity available. You choose where it goes: collateral, or an approved equity tracker token.',
    /** The paper's worked example: 10 units opened at $100 on $400 of margin. */
    example: { margin: 400, units: 10, entry: 100, exitLong: 120, exitShort: 80, exitMin: 70, exitMax: 130 },
    words: {
      side: 'Position',
      long: 'Long',
      short: 'Short',
      exit: 'Exit price',
      entry: 'Entry',
      margin: 'Initial margin',
      exposure: 'Exposure',
      units: 'units',
      pnl: 'Realized PnL before charges',
      closed: 'Closed derivative',
      closedSub: 'PnL and obligations finalized',
      equity: 'Available equity',
      equitySub: 'Choose amount and limits',
      to: 'Settle in',
      collateral: 'Collateral',
      collateralSub: 'Private balance or withdrawal',
      tracker: 'Equity tracker',
      trackerSub: 'Funded conversion or issuance',
      trackerUnit: 'tracker units',
      at: 'at',
      opened: 'Opened',
      closed2: 'Closed',
      drag: 'Drag the price',
    },
    assumptions: 'Illustrative amounts. They assume collateral worth $1 per unit, no fees or funding, no other obligations and conversion at the stated price. Actual output depends on execution and issuance terms.',
    notes: [
      ['Settlement in collateral', 'Released margin and realized PnL are credited in the approved collateral token after funding and fees. You may retain a private balance, fund another position or withdraw.'],
      ['Settlement in an equity tracker', 'The SettlementRouter converts the amount you select into an approved tracker, from available inventory, an approved venue or an independently funded issuance vault. You set a minimum output, a deadline and the permitted route.'],
      ['A new exposure', 'The tracker is a new unlevered long exposure, including when the previous position was short. Conversion does not preserve the old direction or leverage.'],
      ['If conversion fails', 'The cleared collateral stays available. A failed conversion does not reopen the derivative.'],
    ] as Pair[],
  },

  /* ------------------------------------------------------------ 05, paper p. 11 to 12 */
  trackers: {
    index: '04',
    label: 'Equity tracker tokens',
    title: 'A token designed to follow the stock.',
    lead: 'A Hyperwood Equity Tracker Token is a transferable claim designed to follow a published equity reference. Every token specification states fee treatment, dividend treatment, adjustment rules, redemption value, eligible holders and any transfer conditions.',
    backing: {
      title: 'Backed before it is minted',
      text: 'Closing a profitable derivative cannot authorize unbacked token minting. The clearing system first funds the payout. Any mint then transfers the conversion value into a separate backing arrangement and must meet its capital and issuance rules.',
      kinds: [
        ['Asset backed vault', 'Holds eligible assets or contractual exposure that follows the reference, with enforceable custody and redemption terms.'],
        ['Synthetic issuance vault', 'Carries an index linked liability supported by separate collateral, provider capital and approved hedging arrangements.'],
      ] as Pair[],
      design: 'The recommended native design uses a dedicated vault per approved reference, with issuance caps, conservative collateral valuation, current liability valuation and a defined liquidation or resolution process.',
    },
    shortfall: {
      title: 'Why cash alone does not track',
      text: 'If $600 of tracker liabilities rises by 10 percent, the liability becomes $660. A reserve still worth $600 has a $60 shortfall. Backing exposure, hedging or additional provider capital must absorb the difference.',
      liability: ['Liability', '$660'] as Pair,
      reserve: ['Reserve', '$600'] as Pair,
      gap: '$60 shortfall',
    },
    /** The picture beside the backing rules: two lines, one following the other, and one place where it does not. */
    follow: { reference: 'Published equity reference', tracker: 'Tracker token', gap: 'Can diverge', tag: 'Schematic' },
    tracking: 'The target is economic tracking through backing and arbitrage. Secondary market prices can diverge from the reference when liquidity, redemption or hedging is constrained. Trader margin, creator bonds and market insurance remain separate from tracker reserves.',
    path: {
      title: 'Where a tracker can go',
      sealed: 'Confidential',
      open: 'Public',
      stops: [
        ['Shielded balance', 'Held in the shared pool. The asset, the amount and the owner stay concealed.'],
        ['Public export', 'A separate instruction you authorize. It consumes the private claim and releases its public ERC 20 equivalent, without a second claim on the backing.'],
        ['Pools and swaps', 'Swap an exported tracker or provide liquidity, at the pool\'s own prices and depth.'],
        ['Other chains', 'Supported bridge routes transfer a token representation. Escrow and wrapper are one economic claim.'],
      ] as Pair[],
      note: 'Public export does not preserve the confidentiality of a shielded balance. Standard token transfers expose addresses and amounts.',
    },
  },

  /* ------------------------------------------------------------ 06, paper p. 5 to 9 */
  execution: {
    index: '05',
    label: 'Core execution',
    title: 'A position changes only through a verified transition.',
    lead: 'TradingCore is the public execution authority for the confidential trading state. It records instructions, verifies settlement proofs and commits state updates. The protected engine computes in private. The sequencer only decides the order.',
    tabs: ['Boundary', 'Calls', 'Batch', 'Private state', 'Position lifecycle'],
    boundary: {
      nodes: [
        ['User or EVM app', 'A signed private instruction, in an encrypted envelope'],
        ['TradingCore', 'Ordered public inbox. No plaintext positions'],
        ['Protected engine', 'Matches and manages risk. Builds the state transition'],
        ['Prover', 'Private execution witness. Proof and output records'],
        ['Core verifier gate', 'Root and inbox checks. Proof and data checks'],
        ['Canonical state', 'New root and cursor, in one atomic commit'],
      ] as Pair[],
      links: ['CALL', 'READ', '', '', ''],
      claims: [
        'The sequencer orders transactions and submits batches.',
        'The contract accepts a position update only through a verified transition.',
        'No public setPosition or unrestricted setBalance function.',
      ],
      notes: [
        ['What a system CALL does', 'A user account or another EVM contract submits a previously authorized encrypted instruction. The immediate return value is a request identifier. It acknowledges intake and does not certify that an order filled or a position closed.'],
        ['Where execution occurs', 'The engine constructs a deterministic transition from the current private state. TradingCore accepts it only after the verifier confirms the bound inputs and resulting outputs. A failed check leaves the state root and the inbox cursor unchanged.'],
      ] as Pair[],
    },
    calls: {
      code: [
        'submitIntent(ActionClass action, uint32 keyEpoch,',
        '             bytes32 intentCommitment, bytes envelope)',
        '    returns (bytes32 requestId)',
        '',
        'submitBatch(BatchHeader header, bytes encryptedOutputs,',
        '            bytes publicEffects, bytes proof)',
        '',
        'getRequestStatus(bytes32 requestId) returns (RequestStatus)',
        'claimWithdrawal(WithdrawalClaim claim, bytes proof)',
      ].join('\n'),
      caption: 'A proposed contract surface. Exact proof encoding, fee handling and ciphertext limits belong in the implementation specification.',
      head: ['Call or integration', 'Caller and effect'] as Pair,
      rows: [
        ['submitIntent', 'Any fee payer may enqueue. Private authority is verified before assets are used.'],
        ['open / close', 'User authorized payload. Increase exposure or request a reduce only reduction.'],
        ['manage', 'User authorized amend or cancel of the remaining order quantity.'],
        ['settle', 'Allocate available cleared equity under signed asset, route and output limits.'],
        ['submitBatch', 'A designated batch submitter initially. A valid proof is still mandatory.'],
        ['claimWithdrawal', 'Any executor. Payout is fixed to the proven asset, amount and recipient.'],
        ['deposit via CollateralVault', 'Custody creates a unique inbox credit. A batch consumes it once.'],
        ['configuration activation', 'Separate governance path with scheduled activation and timelock.'],
      ] as Pair[],
      notes: [
        'The transaction sender may be a relayer. Paying the intake fee grants no right to spend the owner\'s assets.',
        'Public request status exposes queued or processed state only. Fills, rejection reasons and position details remain in encrypted receipts.',
        'Batch submission can later become permissionless without weakening proof checks.',
      ],
    },
    batch: {
      nodes: [
        ['Freeze a prefix', 'Read the current stateRoot. Choose the inbox range'],
        ['Execute privately', 'Orders and protocol actions, using approved snapshots'],
        ['Prove the result', 'Bind outputs and effects. Seal the new state root'],
        ['Submit the batch', 'Header, ciphertexts and proof. The transaction is ordered'],
        ['Validate in Core', 'Current root and queue. Snapshot, data and proof'],
        ['Commit atomically', 'Advance root and cursor. Record output claim roots'],
      ] as Pair[],
      claims: ['A stale state root or an invalid proof reverts the entire batch.', 'New queue entries can arrive while the selected prefix is being proved.'],
      notes: [
        'Invalid or expired inputs receive a committed disposition rather than being omitted.',
        'Output ciphertexts must be published through the approved data availability route. A hash by itself is insufficient.',
        'A proof based on an obsolete state must be rebased or regenerated.',
      ],
      code: [
        'BatchHeader {',
        '  circuitId; batchId; previousStateRoot; newStateRoot;',
        '  startIndex; endIndex; inboxPrefixCommitment;',
        '  oracleSnapshotRoot; oracleEpoch; configurationRoot;',
        '  encryptedOutputDataHash; requestDispositionRoot;',
        '  publicEffectsCommitment;',
        '}',
      ].join('\n'),
      caption: 'Header commitments. The proof binds every request in the range, in recorded order.',
    },
    state: {
      root: ['One public stateRoot', 'Commits the complete confidential state'] as Pair,
      trees: [
        ['Accounts and notes', 'Balances and authorization'],
        ['Orders and positions', 'Private market and quantity'],
        ['Clearing and control', 'Funding, risk and nullifiers'],
      ] as Pair[],
      claims: [
        'Subtree paths and records are private proof witnesses.',
        'An update consumes the old record and creates a fresh commitment.',
        'No public address to market to position mapping.',
      ],
      head: ['Public Core storage', 'Committed private state'] as Pair,
      rows: [
        ['stateRoot and batchId', 'Accounts, balances and spend authority'],
        ['inboxTail, processedHead and prefix commitments', 'Order book, partial fills and reserved margin'],
        ['Accepted output and withdrawal claim roots', 'Position quantities, cost basis and funding'],
        ['Verifier and snapshot registry references', 'Risk queues, insurance and consumed nullifiers'],
      ] as Pair[],
      code: ['PositionRecord {', '  ownerAuthority; marketId; signedQuantity;', '  entryCostBasis; isolatedMargin;', '  fundingCheckpoint; riskTier;', '  recordNonce; noteRandomness;', '}'].join('\n'),
      caption: 'An illustrative private position record. signedQuantity privately encodes long or short.',
    },
    lifecycle: {
      lead: 'Orders and positions are separate objects. An OPEN request can be admitted without a fill. Only matched quantity creates exposure.',
      flow: [
        ['Queued OPEN', 'Instruction only'],
        ['Resting order', 'Reserve eligible margin'],
        ['Open position', 'Filled quantity only'],
        ['Cleared balance', 'Collateral or tracker settlement'],
      ] as Pair[],
      links: ['', 'FILL', 'Quantity = 0'],
      branches: [
        ['Cancel or expire', 'Release unfilled reservation'],
        ['Reduce or liquidate', 'Proven quantity reduction'],
        ['Increase or funding', 'Fresh private checkpoint'],
      ] as Pair[],
      head: ['Transition', 'Rule enforced by the execution proof'] as Pair,
      rows: [
        ['Partial opening fill', 'Update filled exposure only. Preserve the remaining order and reservation.'],
        ['Increase or partial close', 'Accrue fees and funding. Update cost basis and release only eligible collateral.'],
        ['Reduce only close', 'Cannot increase absolute exposure or cross through zero into a reverse position.'],
        ['Cancel versus fill', 'Committed order resolves the race. Cancellation never reverses completed fills.'],
        ['Protocol liquidation', 'Prove the margin breach, valid price, permitted reduction and loss allocation.'],
      ] as Pair[],
      notes: ['Cancel affects orders. Existing fills remain.', 'Partial close leaves residual exposure, as a fresh private record.', 'A position is closed only when its quantity reaches zero.'],
    },
  },

  /* ------------------------------------------------------------ 07, paper p. 1 to 2 */
  network: {
    index: '06',
    label: 'Network architecture',
    title: 'A general purpose EVM Layer 3.',
    lead: 'Hyperwood deploys its rollup contracts and bridge on Robinhood Chain, an Arbitrum Layer 2 that uses Ethereum for settlement and data availability. Standard EVM transactions execute normally, alongside the confidential engine.',
    layers: [
      ['L3', 'Hyperwood', 'General EVM and confidential equity execution'],
      ['L2', 'Robinhood Chain', 'Parent rollup contracts and bridge'],
      ['L1', 'Ethereum', 'Base settlement and data availability'],
    ] as [string, string, string][],
    settles: 'settles to',
    facts: [
      ['Stack', 'Arbitrum Nitro, in rollup mode'],
      ['Gas and bonds', 'ETH is the native gas asset and the bond currency for market creation'],
      ['System contracts', 'Predeployed at genesis, callable through standard EVM CALL operations'],
      ['Proofs', 'Public contracts verify zero knowledge proofs of confidential trading transitions'],
    ] as Pair[],
    head: ['Component', 'Protocol responsibility'] as Pair,
    rows: [
      ['TradingCore', 'System entry point for encrypted user instructions'],
      ['State and Verifier', 'Global commitments and verification of settlement proofs'],
      ['MarketRegistry and BondVault', 'Market configuration and locked ETH bonds'],
      ['Collateral and Insurance Vaults', 'Trader assets and segregated market reserves'],
      ['SettlementRouter and IssuanceVault', 'Payout conversion and separately backed tracker issuance'],
      ['OracleRouter and BridgeGateway', 'Approved price snapshots and supported asset export'],
    ] as Pair[],
    notes: [
      ['Still to validate', 'Robinhood is not currently listed among the parent networks with canonical Arbitrum factory deployments. Rollup creation, ETH bridging and proof contracts must first be validated on its testnet.'],
      ['Backing', 'Native ETH balances require corresponding backing in parent chain bridge escrow.'],
      ['No affiliation', 'Deployment on Robinhood Chain does not establish an affiliation with Robinhood.'],
    ] as Pair[],
  },

  /* ------------------------------------------------------------ 08, paper p. 13 */
  policy: {
    index: '07',
    label: 'Finality and operating policy',
    title: 'Four stages, never confused.',
    lead: 'Hyperwood separates intake, provisional matching, proof verification and parent settlement. A proof verifies the confidential trading transition. The surrounding chain keeps its own settlement and dispute model.',
    stages: [
      ['Accepted', 'The encrypted instruction entered the ordered inbox.'],
      ['Matched', 'The engine produced a provisional execution result.'],
      ['Proven', 'TradingCore verified and committed the trading transition.'],
      ['Parent settlement', 'Publication, finality and exits follow the rollup and parent chain rules.'],
    ] as Pair[],
    target: {
      title: 'Targets, not measurements',
      figure: '100 to 250 ms',
      figureLabel: 'block interval under evaluation',
      text: 'The target is subsecond acceptance and provisional matching under defined load. Proof latency and withdrawal availability must be measured independently. Fast sequencer confirmation is not Ethereum finality.',
    },
    blocks: [
      ['Risk work', 'A bounded maintenance queue and a committed scan cursor schedule risk processing. The protocol defines a maximum processing lag and stops admitting new risk when maintenance falls behind.'],
      ['Stale prices', 'Stale or disrupted prices stop new risk under the market policy. Reopening requires fresh price validation and an exchange gap policy.'],
      ['Censorship', 'Intake receipts, inclusion deadlines and a parent chain forced inclusion path address censorship separately from matching correctness.'],
      ['Authority', 'Sequencing, market administration, oracle configuration, tracker issuance and upgrades use separate permissions. Upgrades follow a timelock and an explicit emergency policy.'],
      ['Recovery', 'Encrypted outputs must be recoverable by their owners from retained data. An outage freezes the last verifier accepted trading state, then cancels pending risk and resolves obligations before withdrawal.'],
      ['Inherited dependencies', 'The parent chain\'s governance, bridge controls and validator assumptions remain inherited dependencies.'],
    ] as Pair[],
  },

  /* ------------------------------------------------------------ 09, paper p. 14 */
  roadmap: {
    index: '08',
    label: 'Implementation sequence',
    title: 'Built in an order that can be checked.',
    lead: 'Delivery starts with parent chain integration and a deterministic clearing model. Confidentiality, proving and tracker issuance are activated only after their accounting and recovery paths work end to end.',
    head: ['Phase', 'Acceptance evidence'] as Pair,
    phases: [
      ['Parent integration', 'L3 deployment, ETH bridge, DA and proof contracts operate on Robinhood testnet.'],
      ['Execution kernel', 'Bilateral fills, partial fills, margin reservations, funding and liquidation reconcile.'],
      ['Core verification', 'Stale roots, reordered inputs, replay and mismatched outputs cannot advance state.'],
      ['Confidential execution', 'Protected witnesses, encrypted receipts, key recovery and leakage controls operate.'],
      ['Equity markets', 'Oracle sessions, corporate actions, bonds and isolated risk limits behave as specified.'],
      ['Tracker settlement', 'Backing, redemption, conversion and supply conservation receive independent review.'],
      ['External integrations', 'LP execution, bridge claims and failure recovery preserve their authorized bounds.'],
    ] as Pair[],
    invariants: {
      title: 'Core accounting invariants',
      items: [
        'Each fill has authorized counterparties and equal opposite quantities.',
        'User orders cannot spend collateral twice.',
        'Filled, remaining and cancelled quantities reconcile to the original instruction.',
        'Funding, fees and PnL are accrued consistently, with explicit rounding accounts.',
        'Each payout claim is consumed once.',
        'Tracker issuance requires valid backing.',
      ],
      close: 'None of these rules can be bypassed by a sequencer role.',
    },
  },

  /* ------------------------------------------------------------ 10: the close and the footer */
  closing: {
    title: 'Equity perps.\nPrivate positions.',
    text: 'Go long or short on stocks and indices. Zero-knowledge proofs verify settlement onchain.',
    notes: cautions,
    rights: '© 2026 Hyperwood',
  },
}
