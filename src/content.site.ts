/**
 * The words of what every page of the site shares besides its own matter: the note that a part is not open yet, the
 * question about cookies, the two legal pages, the page that thanks, and the page for an address that is not there.
 *
 * The legal pages say what this website does, in plain words, and no more: they are drafts until the company's
 * lawyer has read them, and they need its legal name, a contact address and the law they stand under before the
 * site is public (site.json has the address; the rest is words to add here). They are about the website alone: the
 * network and the app are not open, and will have terms and a privacy notice of their own.
 */

/** A part of a legal page: its heading and its paragraphs. */
export type Part = { head: string; text: string[] }

export const words = {
  /** A link or a button that leads to something not built yet opens this note instead of going nowhere
   *  (site/Soon.tsx). */
  soon: {
    title: ['Not open yet.', 'Come back soon.'],
    body: 'We are building this part right now. The app and its channels are not open yet.',
    close: 'Close',
    done: 'All right',
    more: { label: 'Read the architecture', href: 'architecture/' },
    /** (shown only when there is somewhere to send it: site.json, notify) */
    notify: {
      ask: 'Leave your e-mail and we will write once, when the app opens.',
      label: 'E-mail address',
      hint: 'name@example.com',
      send: 'Tell me',
      sending: 'Sending',
      errors: {
        empty: 'Enter your e-mail address.',
        wrong: 'That does not look like an e-mail address.',
        failed: 'We could not send that just now. Please try again in a moment.',
      },
    },
  },

  /** Asked once, at the foot of the screen, and only when there is an analytics id (site/Consent.tsx). */
  consent: {
    title: 'May we count this visit?',
    body: 'We use Google Analytics to see which pages are read. It sets cookies in your browser. Nothing is loaded until you say yes.',
    yes: 'Yes, count it',
    no: 'No, thanks',
    more: 'Privacy',
    /** (the footer's link that asks again) */
    again: 'Cookie choices',
  },

  /** The links to the legal pages, in every footer. */
  legal: { heading: 'Legal', privacy: 'Privacy', terms: 'Terms' },
  home: 'Back to the start',
  updated: 'Last updated 21 November 2026',
  /** (where a legal page would name the address to write to, until site.json has one) */
  noContact: 'A contact address will be published here before the app opens.',
  contact: 'Write to',

  privacy: {
    title: ['Privacy.', 'What this site learns about you.'],
    lead: 'This notice is about this website. It is short because the site is simple: it shows pages, and there is no account to open here yet. The network and the app are not open; they will have a notice of their own.',
    /** `counted` is said when visits are counted (an analytics id is set), `uncounted` when they are not; `list` when
     *  the form that takes an e-mail address is shown. */
    parts: {
      give: {
        head: 'What you give us',
        none: ['Nothing. The site has no accounts, no sign-in and no forms.'],
        list: [
          'An e-mail address, if you leave one in the form that offers to tell you when the app opens. We use it to write to you once about that, and for nothing else. Ask, and we delete it.',
          'Apart from that, nothing. The site has no accounts and no sign-in.',
        ],
      },
      count: {
        head: 'Counting visits',
        uncounted: ['We do not count visits and we do not follow you from page to page. The site sets no cookies.'],
        counted: [
          'With your consent we count visits with Google Analytics: the pages opened, the kind of device and browser, the country, and the site you came from. It sets cookies in your browser to tell one visit from another.',
          'Nothing is loaded and no cookie is set until you say yes to the question at the foot of the page. Your answer is kept in your own browser. You can change it at any time under Cookie choices, in the footer.',
        ],
      },
      others: {
        head: 'Others who serve parts of a page',
        text: [
          'Some parts of a page come from other companies’ servers: the market charts are TradingView’s own widget, and one picture is sent by its maker’s file server. When your browser asks them for those parts they see what any web server sees: your IP address, your browser, and the page that asked.',
          'The server that sends you these pages sees the same, and may keep it in its logs for a short time, as every website’s does.',
        ],
      },
      rights: {
        head: 'Your rights',
        text: ['You can ask what we hold about you, have it corrected or deleted, and take back a consent you gave.'],
      },
      changes: { head: 'Changes', text: ['If this notice changes, the date under it changes with it.'] },
    },
  },

  terms: {
    title: ['Terms.', 'For using this website.'],
    lead: 'These are the terms for this website. The network and the app are not open; they will have terms of their own when they are.',
    parts: [
      {
        head: 'What this site is',
        text: [
          'This website describes Hyperwood, a proposed network for trading perpetuals on stock prices and equity indices in confidence. It is information about a design.',
          'Nothing on it describes a live deployment, a guaranteed fill or a guaranteed peg. Figures named as targets are targets.',
        ],
      },
      {
        head: 'No offer and no advice',
        text: [
          'Nothing here is an offer to sell, or a solicitation to buy, any security, token or other financial instrument in any jurisdiction. Nothing here is investment, legal or tax advice.',
        ],
      },
      {
        head: 'Synthetic exposure',
        text: [
          'The markets described provide synthetic price exposure. They do not establish shareholder ownership, voting rights or the permission of any issuer.',
        ],
      },
      {
        head: 'Names that are not ours',
        text: [
          'The names and marks of other companies and networks shown on this site belong to their owners. Deployment on Robinhood Chain does not establish an affiliation with Robinhood.',
        ],
      },
      {
        head: 'Using the site',
        text: [
          'You may read the site, link to it and quote from it with its name. The words, pictures and marks on it are ours or are used with permission; do not present them as your own, and do not use the Hyperwood name or mark to suggest we stand behind something we do not.',
        ],
      },
      {
        head: 'As it is',
        text: [
          'We work to keep the site right. It may still contain mistakes or be out of date, and we may change or remove any part of it. To the extent the law allows, we are not liable for a loss that comes from relying on it.',
          'Links to other sites are there for convenience. We do not answer for what is on them.',
        ],
      },
      { head: 'Changes', text: ['If these terms change, the date under them changes with it.'] },
    ] as Part[],
    questions: 'Questions',
  },

  thanks: {
    title: ['Thank you.', 'We have your address.'],
    body: 'We will write to you once, when the app opens. Nothing else will come from us.',
  },

  /** (the page for an address that is not there is written by the build, with no script and no stylesheet of the
   *  site's: site.plugin.ts. Its words are here so that they are with the others.) */
  missing: {
    title: ['Nothing at this address.', 'Try the start.'],
    body: 'The address may be mistyped, or the page may have moved.',
  },
}
