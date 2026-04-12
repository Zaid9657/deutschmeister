import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Pure SSG — no adapter needed. Netlify serves static files natively.
export default defineConfig({
  site: 'https://deutsch-meister.de',
  output: 'static',
  trailingSlash: 'never',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      // Only emit grammar routes in this sitemap — the SPA has its own
      filter: (page) => page.includes('/grammar/'),
    }),
  ],
  build: {
    format: 'directory', // /grammar/a1.1/nouns-gender/ → index.html inside a dir
  },
});
