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
        page.includes('/leitfaden/') ||
        page.includes('/telc-b1-komplettvorbereitung'),
      // No lastmod, deliberately. This used to stamp the BUILD time on every
      // URL, so each deploy told crawlers all ~85 pages changed — the exact
      // failure public/sitemap-spa.xml's header argues against ("the fastest
      // way to teach a crawler to ignore the field"). The honest per-page date
      // now lives in each page's dateModified schema (from the DB's
      // updated_at); a sitemap without lastmod is valid and Google discounts
      // an inaccurate one anyway. Reinstate only with a real per-URL date map.
    }),
  ],
  build: {
    format: 'directory', // /grammar/a1.1/nouns-gender/ → index.html inside a dir
  },
});
