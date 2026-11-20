import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { site } from './site.plugin.ts';

/**
 * A page that carries the opening in its own HTML (index.html, classic.html) has it on screen with the first
 * paint. A stylesheet linked in the head would hold that paint back until it has arrived; linked at the end of
 * the body it holds back nothing that is above it. The scripts still wait for it, so nothing is laid out unstyled.
 */
function openingFirst(): Plugin {
  return {
    name: 'hyperwood-opening-first',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (!html.includes('id="opening"')) return html;
        const sheets: string[] = [];
        const rest = html.replace(/[ \t]*<link rel="stylesheet"[^>]*>\r?\n?/g, (tag) => {
          sheets.push(tag.trim());
          return '';
        });
        if (!sheets.length) return html;
        return rest.replace('</body>', `  ${sheets.join('\n    ')}\n  </body>`);
      },
    },
  };
}

const here = import.meta.dirname;
// The pages: the landing page (index.html), the long read (architecture/), the two legal pages (privacy/, terms/)
// and the page that thanks (thanks/); and three that ask not to be found: the earlier landing page, kept as it was
// (classic.html), the film hero (film.html) and the app's screens by themselves, for looking at them and for
// taking the landing page's pictures (studio.html).
const pages = {
  main: resolve(here, 'index.html'),
  architecture: resolve(here, 'architecture/index.html'),
  privacy: resolve(here, 'privacy/index.html'),
  terms: resolve(here, 'terms/index.html'),
  thanks: resolve(here, 'thanks/index.html'),
  classic: resolve(here, 'classic.html'),
  film: resolve(here, 'film.html'),
  studio: resolve(here, 'studio.html'),
};

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: { port: 5210 },
  // (site.plugin.ts: the icons and the share tags in every page's head, robots.txt, sitemap.xml, 404.html)
  plugins: [react(), openingFirst(), site(here, pages)],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: { input: pages },
  },
});
