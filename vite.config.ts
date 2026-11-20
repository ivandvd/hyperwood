import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

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

// https://vite.dev/config/
// Three pages: the landing page (index.html), the long read (architecture/index.html) and the earlier landing
// page, kept as it was (classic.html).
export default defineConfig({
  base: './',
  server: { port: 5210 },
  plugins: [react(), openingFirst()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        architecture: resolve(import.meta.dirname, 'architecture/index.html'),
        classic: resolve(import.meta.dirname, 'classic.html'),
        film: resolve(import.meta.dirname, 'film.html'),
        // (the app's screens by themselves: for looking at them and for taking the landing page's pictures)
        studio: resolve(import.meta.dirname, 'studio.html'),
      },
    },
  },
});
