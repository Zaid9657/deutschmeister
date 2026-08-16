import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Pure SSG — no adapter needed. Netlify serves static files natively.
export default defineConfig({
  site: 'https://deutsch-meister.de',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      // Emit the statically-rendered public routes into this sitemap
      // (homepage + pricing + grammar + comparison + guide pages). SPA-only
      // routes stay in public/sitemap-spa.xml. The 404 page and the noindex
      // legal drafts are excluded.
      filter: (page) =>
        page === 'https://deutsch-meister.de/' ||
        page === 'https://deutsch-meister.de/pricing/' ||
        page.includes('/grammar/') ||
        page.includes('/vergleich') ||
        page.includes('/leitfaden/'),
      // Freshness signal: every page redeploys with the content it was built
      // from, so the build date is the honest lastmod.
      serialize: (item) => ({ ...item, lastmod: new Date().toISOString() }),
    }),
  ],
  build: {
    format: 'directory', // /grammar/a1.1/nouns-gender/ → index.html inside a dir
  },
});
