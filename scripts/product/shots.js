/**
 * The takes of the app that the landing page shows (with the films after the hero: AppStage.tsx and Finale.tsx),
 * made of the app's own markup on the studio page (studio.html, src/product/Studio.tsx) while the dev server runs.
 *
 * A Playwright page function: run it with any Playwright page, for instance in a Playwright MCP's run-code tool, after
 * setting what it needs:
 *
 *   globalThis.__shots = { out: 'C:/somewhere/takes/', base: 'http://localhost:5220', only: ['standing'] }
 *
 * `out` (a folder, with its slash) is required; `base` is the dev server; `only` picks some of: monitor, cards,
 * phones, standing, screen, shots. To try the standing phone's lights: `phoneOnly` (the pool and the shadow are not
 * taken again), `spp` (how many renders are added up, 256 unless given) and `ask` (more of shot.html's address, as
 * '&key=1,0.3,96,2'). It writes there:
 *
 *   monitor.png                                the web app on its monitor, nothing behind it (2x)
 *   card-ticket.png, -request.png, -payout.png  the three close views, 700 by 934 on Ink (3x)
 *   phones.png                                 the mobile app on three phones, nothing behind them (2x)
 *   standing-pool.png, -shade.png              the phone that ends the page: its pool of light and its shadow
 *                                              alone, white on black (2x)
 *   standing-phone.png                         that phone alone with nothing behind it: the model of the phone shots
 *                                              (shot.html?shot=standing), drawn on a page of the same size where the
 *                                              studio page's own phone stands, so it lies exactly over the two
 *   phone-screen.png                           the mobile app's Trade screen alone at an iPhone 18 Pro's screen
 *                                              size, 1206 by 2622 (3x), for Apple's own picture of the phone
 *                                              (bake-bezel.py)
 *   app-trade.png, -receipt.png, -close.png    the mobile app's three screens alone at that size, 2412 by 5244 (6x)
 *   shot-trade.png, -receipt.png, -close.png   the phone shots made with them (shot.html), 1600 by 2000
 *
 * Then bake.py (monitor, cards, phones), bake-standing.py (the standing phone) and bake-shots.py (the phone shots)
 * make the pictures in src/assets/product.
 */
// (the file is the function itself, as a run-code tool reads it)
// oxlint-disable-next-line no-unused-expressions
async (page) => {
  const o = globalThis.__shots || {}
  if (!o.out) throw new Error('globalThis.__shots.out: the folder to write the takes to')
  const base = o.base || 'http://localhost:5220'
  const want = (name) => !o.only || o.only.includes(name)
  const browser = page.context().browser()
  const done = []
  // one view of the studio page, at a given screen and pixel ratio, saved as a take
  const take = async ({ viewport, scale, address, file, clear, clip }) => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale })
    try {
      const p = await ctx.newPage()
      await p.goto(base + '/studio.html?' + address + (clear ? '&clear' : ''), { waitUntil: 'load' })
      await p.evaluate(() => document.fonts.ready)
      await p.waitForTimeout(900)
      await p.screenshot({ path: o.out + file, omitBackground: !!clear, clip })
      done.push(file)
    } finally {
      await Promise.race([ctx.close(), new Promise((r) => setTimeout(r, 8000))])
    }
  }
  if (want('monitor')) await take({ viewport: { width: 2700, height: 2400 }, scale: 2, address: 'scene=monitor&w=2300&screen=trade', file: 'monitor.png', clear: true })
  if (want('cards'))
    for (const card of ['ticket', 'request', 'payout'])
      await take({ viewport: { width: 700, height: 934 }, scale: 3, address: 'scene=card&card=' + card, file: 'card-' + card + '.png', clip: { x: 0, y: 0, width: 700, height: 934 } })
  if (want('phones')) await take({ viewport: { width: 2900, height: 1750 }, scale: 2, address: 'scene=phones&w=2600', file: 'phones.png', clear: true })
  if (want('standing')) {
    const frame = { width: 3300, height: 2700 }
    if (!o.phoneOnly)
      for (const part of ['pool', 'shade']) await take({ viewport: frame, scale: 2, address: 'scene=standing&w=2300&part=' + part, file: 'standing-' + part + '.png' })
    // the phone: the app's screen alone, then the model with it under its glass, drawn where the studio page's own
    // phone stands (that page is asked where its rig is)
    await take({ viewport: { width: 402, height: 874 }, scale: 6, address: 'scene=screen&app=trade', file: 'app-trade.png', clip: { x: 0, y: 0, width: 402, height: 874 } })
    const ctx = await browser.newContext({ viewport: frame, deviceScaleFactor: 2 })
    try {
      await ctx.route('**/shot-screens/*.png', (route) => route.fulfill({ path: o.out + 'app-' + route.request().url().split('/').pop(), contentType: 'image/png' }))
      const p = await ctx.newPage()
      await p.goto(base + '/studio.html?scene=standing&w=2300&part=pool', { waitUntil: 'load' })
      await p.waitForSelector('[data-standing]')
      const row = await p.evaluate(() => {
        const box = document.querySelector('[data-standing]').getBoundingClientRect()
        return [box.left, box.top, box.width].join(',')
      })
      await p.goto(base + '/scripts/product/shot.html?shot=standing&frame=3300,2700,2&row=' + row + '&spp=' + (o.spp || 256) + (o.ask || ''), { waitUntil: 'load' })
      await p.waitForFunction(() => window.__done === true, null, { timeout: 240000 })
      await p.screenshot({ path: o.out + 'standing-phone.png', omitBackground: true })
      done.push('standing-phone.png at ' + row)
    } finally {
      await Promise.race([ctx.close(), new Promise((r) => setTimeout(r, 8000))])
    }
  }
  if (want('screen'))
    await take({ viewport: { width: 402, height: 874 }, scale: 3, address: 'scene=screen', file: 'phone-screen.png', clip: { x: 0, y: 0, width: 402, height: 874 } })
  // the phone shots: the three screens alone at six pixels to the point, then the shots rendered with them under the
  // phone's glass (shot.html asks for each screen at /shot-screens/<app>.png, which is answered here from the takes)
  if (want('shots')) {
    for (const app of ['trade', 'receipt', 'close'])
      await take({ viewport: { width: 402, height: 874 }, scale: 6, address: 'scene=screen&app=' + app, file: 'app-' + app + '.png', clip: { x: 0, y: 0, width: 402, height: 874 } })
    for (const shot of ['trade', 'receipt', 'close']) {
      const ctx = await browser.newContext({ viewport: { width: 1600, height: 2000 }, deviceScaleFactor: 1 })
      try {
        await ctx.route('**/shot-screens/*.png', (route) => route.fulfill({ path: o.out + 'app-' + route.request().url().split('/').pop(), contentType: 'image/png' }))
        const p = await ctx.newPage()
        await p.goto(base + '/scripts/product/shot.html?shot=' + shot + '&w=1600&h=2000&spp=256', { waitUntil: 'load' })
        await p.waitForFunction(() => window.__done === true, null, { timeout: 120000 })
        await p.screenshot({ path: o.out + 'shot-' + shot + '.png', clip: { x: 0, y: 0, width: 1600, height: 2000 } })
        done.push('shot-' + shot + '.png')
      } finally {
        await Promise.race([ctx.close(), new Promise((r) => setTimeout(r, 8000))])
      }
    }
  }
  return 'took ' + done.join(', ')
}
