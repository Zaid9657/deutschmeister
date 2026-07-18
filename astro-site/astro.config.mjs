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
      // (grammar + comparison + guide pages). SPA-only routes stay in
      // public/sitemap-spa.xml. The 404 page is excluded.
      filter: (page) =>
        page.includes('/grammar/') ||
        page.includes('/vergleich') ||
        page.includes('/leitfaden/'),
    }),
  ],
  build: {
    format: 'directory', // /grammar/a1.1/nouns-gender/ → index.html inside a dir
  },
});
