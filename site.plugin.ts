/**
 * What every page of the site needs in its head, and the three files a site has beside its pages, made by the build
 * from one place (site.json, and each page's own title and description):
 *
 *   - in every page: the icons (favicon.ico, the touch icon, the manifest; the SVG icon is in the page's own HTML),
 *     and for a page that may be found (no `noindex`) what a share of it shows: its title, its description and the
 *     share picture (public/og.jpg), and its canonical address when the site's address is known;
 *   - robots.txt: everything may be read; it names the sitemap when the site's address is known;
 *   - sitemap.xml: the pages that may be found. Written only when the site's address is known (a sitemap is a list
 *     of whole addresses);
 *   - 404.html: the page for an address that is not there. It may be sent for an address at any depth, so it carries
 *     everything it needs within itself: its styles, the mark, and the typeface (Manrope's Latin file, inside it).
 *
 * On the dev server the three files are answered at their addresses as well, to be looked at.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { HtmlTagDescriptor, Plugin } from 'vite'
import { words } from './src/content.site.ts'

type Site = { url: string; contact: string; analytics: { ga4: string }; notify: { endpoint: string } }
type Page = { path: string; hidden: boolean }

const NAME = 'Hyperwood'
const SHARE = { file: 'og.jpg', width: 1200, height: 630, alt: 'Hyperwood: equity perps, private positions. The mobile app on a phone standing in a pool of Hyper Neon light.' }

const titleOf = (html: string) => /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? NAME
const descriptionOf = (html: string) => /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? ''
const hiddenIn = (html: string) => /<meta name="robots" content="[^"]*noindex/.test(html)
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function site(root: string, pages: Record<string, string>): Plugin {
  const config = JSON.parse(readFileSync(resolve(root, 'site.json'), 'utf8')) as Site
  const url = config.url.replace(/\/+$/, '')
  /** The pages, as their addresses from the site's first page ('' for it, 'architecture/' ...), and whether each
   *  asks not to be found. */
  const list = (): Page[] =>
    Object.values(pages).map((file) => {
      const path = file.slice(resolve(root).length + 1).replace(/\\/g, '/').replace(/index\.html$/, '')
      return { path, hidden: hiddenIn(readFileSync(file, 'utf8')) }
    })

  const robots = () => ['User-agent: *', 'Allow: /', ...(url ? ['', `Sitemap: ${url}/sitemap.xml`] : []), ''].join('\n')

  const sitemap = () => {
    const day = new Date().toISOString().slice(0, 10)
    const entries = list()
      .filter((page) => !page.hidden)
      .map((page) => `  <url><loc>${url}/${page.path}</loc><lastmod>${day}</lastmod></url>`)
    return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...entries, '</urlset>', ''].join('\n')
  }

  const missing = () => {
    const M = words.missing
    const home = url ? `${url}/` : '/'
    const face = readFileSync(resolve(root, 'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')).toString('base64')
    const mark = /<path[^>]*\sd="([^"]+)"/.exec(readFileSync(resolve(root, 'src/assets/brand/hyperwood-symbol-neon.svg'), 'utf8'))?.[1] ?? ''
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a0a0a" />
    <meta name="robots" content="noindex" />
    <title>${NAME}: nothing at this address</title>
    <meta name="description" content="${escape(M.body)}" />
    <link rel="icon" type="image/svg+xml" href="${home}favicon.svg" />
    <style>
      @font-face { font-family: 'Manrope Variable'; font-style: normal; font-display: swap; font-weight: 200 800; src: url(data:font/woff2;base64,${face}) format('woff2-variations'); }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html { background: #0a0a0a; color-scheme: dark; }
      body { --u: max(1px, calc(100vw / 1440)); --side: calc(39 * var(--u)); min-height: 100vh; min-height: 100svh; display: grid; grid-template-rows: auto 1fr; font-family: 'Manrope Variable', Manrope, Arial, sans-serif; color: #f4f5f0; -webkit-font-smoothing: antialiased; }
      header { padding: calc(21 * var(--u)) var(--side); }
      header a { display: block; width: calc(58.4 * var(--u)); }
      svg { display: block; width: 100%; height: auto; fill: #ccff00; }
      main { align-self: center; padding: 0 var(--side) 16vh; max-width: 1100px; margin: 0 auto; width: 100%; }
      h1 { font-size: clamp(34px, 5.2vw, 76px); font-weight: 600; line-height: 1.05; letter-spacing: -0.042em; }
      h1 span { display: block; color: rgba(244, 245, 240, 0.5); }
      h1 b { display: block; font-weight: 600; color: #fff; }
      p { margin-top: 24px; max-width: 30em; font-size: clamp(16px, 1.2vw, 19px); line-height: 1.5; letter-spacing: -0.014em; color: rgba(244, 245, 240, 0.62); }
      .go { display: inline-flex; align-items: center; gap: 0.62em; height: 50px; margin-top: 36px; padding: 0 24px; border-radius: 10px; background: #ccff00; color: #0a0a0a; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; text-decoration: none; transition: background-color 0.26s ease; }
      .go:hover, .go:focus-visible { background: #fff; }
      .go:focus-visible, header a:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
      .go svg { width: 0.7em; fill: none; stroke: currentColor; stroke-width: 1.55; }
      @media (max-width: 1023px), (max-aspect-ratio: 1/1) {
        body { --side: 20px; }
        header { padding: 20px var(--side); }
        header a { width: 49px; }
      }
    </style>
  </head>
  <body>
    <header>
      <a href="${home}" aria-label="${NAME}: ${escape(words.home.toLowerCase())}">
        <svg viewBox="0 0 428 191" aria-hidden="true"><path fill-rule="evenodd" d="${mark}" /></svg>
      </a>
    </header>
    <main>
      <h1><span>${escape(M.title[0])}</span> <b>${escape(M.title[1])}</b></h1>
      <p>${escape(M.body)}</p>
      <a class="go" href="${home}">${escape(words.home)} <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.3 9.7 9.5 2.5M3.7 2.5h5.8v5.8" stroke-linecap="square" /></svg></a>
    </main>
  </body>
</html>
`
  }

  return {
    name: 'hyperwood-site',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // (how deep the page lies: its addresses of the files at the site's root begin with that many "../")
        const path = ctx.path.replace(/^\//, '').replace(/index\.html$/, '')
        const up = '../'.repeat(path.split('/').length - 1)
        const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs, injectTo: 'head' })
        const link = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'link', attrs, injectTo: 'head' })
        const tags: HtmlTagDescriptor[] = [
          link({ rel: 'icon', href: `${up}favicon.ico`, sizes: '32x32' }),
          link({ rel: 'apple-touch-icon', href: `${up}apple-touch-icon.png` }),
          link({ rel: 'manifest', href: `${up}site.webmanifest` }),
        ]
        if (!hiddenIn(html)) {
          const title = titleOf(html)
          const description = descriptionOf(html)
          const picture = url ? `${url}/${SHARE.file}` : `${up}${SHARE.file}`
          if (url) tags.push(link({ rel: 'canonical', href: `${url}/${path}` }), meta({ property: 'og:url', content: `${url}/${path}` }))
          tags.push(
            meta({ property: 'og:site_name', content: NAME }),
            meta({ property: 'og:type', content: 'website' }),
            meta({ property: 'og:title', content: title }),
            meta({ property: 'og:description', content: description }),
            meta({ property: 'og:image', content: picture }),
            meta({ property: 'og:image:width', content: String(SHARE.width) }),
            meta({ property: 'og:image:height', content: String(SHARE.height) }),
            meta({ property: 'og:image:alt', content: SHARE.alt }),
            meta({ name: 'twitter:card', content: 'summary_large_image' }),
            meta({ name: 'twitter:title', content: title }),
            meta({ name: 'twitter:description', content: description }),
            meta({ name: 'twitter:image', content: picture }),
          )
        }
        return { html, tags }
      },
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots() })
      this.emitFile({ type: 'asset', fileName: '404.html', source: missing() })
      if (url) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() })
      else this.warn('site.json has no url: sitemap.xml is not written and the pages have no canonical address')
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const asked = (req.url ?? '').split('?')[0]
        const send = (type: string, body: string) => {
          res.setHeader('Content-Type', type)
          res.end(body)
        }
        if (asked === '/robots.txt') return send('text/plain; charset=utf-8', robots())
        if (asked === '/sitemap.xml' && url) return send('application/xml; charset=utf-8', sitemap())
        if (asked === '/404.html') return send('text/html; charset=utf-8', missing())
        next()
      })
    },
  }
}
