YOUR ASPECT:
**11. Technical quality, performance & crawlability — does the tech help or hurt sales?**
Sub-questions: (a) page weight, JS/CSS/font/image budgets of built pages (run `npm run build:verify` is NOT allowed to write? — you are read-only: inspect astro-site and src source, vite/astro config, image pipeline, font preloads, third-party scripts); (b) Core Web Vitals risks (LCP hero, CLS from cookie banner/fonts, INP from SPA hydration); (c) Astro/SPA split: which money URLs are Astro vs SPA, full-page vs client navigation bugs, SPA 404 on logout (docs/reviews/codex-2026-10-22), trailing slash/redirect chains (netlify.toml); (d) crawlability of money pages (prerender list scripts/prerender-spa-routes.mjs, sitemaps, robots, canonical, structured data/JSON-LD for Product/Offer/Course/FAQ); (e) error states and 404s seen in capture; (f) uptime/fallback risks (Supabase outages → cached content). Rank defects by sales impact.


