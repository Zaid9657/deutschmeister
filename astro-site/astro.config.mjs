import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { sitemapFilter } from './src/lib/sitemapFilter.js';

// Pure SSG — no adapter needed. Netlify serves static files natively.
export default defineConfig({
  site: 'https://deutsch-meister.de',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      // The statically rendered public routes, without the noindex "Coming
      // next" course pages — src/lib/sitemapFilter.js says which and why.
      filter: sitemapFilter,
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
