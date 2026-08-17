# CLAUDE.md

Guidance for AI agents working in this repository (deutsch-meister.de — German-learning
platform: Vite/React SPA + Astro static site + Netlify functions + Supabase).

## Architecture in one paragraph

Two front ends merge into one `dist/` at deploy: the **SPA** (`src/`, Vite+React 18,
becomes `dist/app.html`) is the app; the **Astro site** (`astro-site/`, separate
package+lockfile) statically renders the SEO-facing routes (`/`, `/pricing/`,
`/grammar/**`, `/vergleich/*`, `/leitfaden/*`, `/privacy/`, `/impressum/`, 404) and wins
over the SPA for those URLs. 15 **Netlify functions** (`netlify/functions/`) power AI
speaking, X-Ray, payments (Lemon Squeezy webhook), and email (Resend). Content lives in
**Supabase**; the Astro build fetches it at build time. Full details: `README.md`.

## The three-place route rule (most common mistake)

Adding a `<Route>` in `src/App.jsx` is not enough. Every public SPA route must ALSO be:
1. added to the netlify.toml SPA allow-list (`from = "/route" to = "/app.html"`), or it
   returns a hard 404 in production;
2. (if crawlable) mirrored in `scripts/prerender-spa-routes.mjs` and `public/sitemap-spa.xml`.

## Commands

```bash
npm run dev          # SPA dev server
npm run build        # optimize images + vite build → dist/
npm run lint         # ESLint 9 flat config — errors fail, legacy warnings tolerated
npm run check:duplicates  # SPA/Astro shared data files must stay byte-identical
cd astro-site && npm run build   # needs PUBLIC_SUPABASE_URL/_ANON_KEY — or a cache:
GRAMMAR_CONTENT_CACHE=path/to/cache.json npx astro build   # offline build (CI/sandbox)
node scripts/dump-grammar-cache.mjs   # produce that cache (needs Supabase network)
node scripts/evaluate-site.mjs        # route walkthrough + screenshots (playwright)
```

There are no tests yet. CI (`.github/workflows/ci.yml`) runs lint + duplicate check +
`node --check` on functions + the SPA build.

## Conventions & gotchas

- **JS only** (no TypeScript; `Layout.astro` frontmatter uses TS-syntax Props interface —
  that's Astro-normal). ESLint stylistic rules are off; match surrounding style.
- **Levels are lowercase in URLs and code** (`a1.1`…`b2.2`), but **UPPERCASE in the DB**
  (`sub_level = 'A1.1'`) and in Supabase Storage folders (`audio/listening/A1.1/…`) —
  EXCEPT `reading_lessons.level`, which a check constraint forces to **lowercase**.
  Normalize at boundaries; queries use `ilike`/`lower()`. Mixed-case bugs are a recurring
  source of empty pages and failed inserts.
- **Trailing slashes** — three cases, get them right or every link 301-hops:
  1. **Astro pages** always end in `/` (`trailingSlash: 'always'`).
  2. **Prerendered SPA routes** (`/analyze`, `/level-test`, `/speaking`, `/podcasts`,
     `/listening`, `/reading`) also end in `/`. `scripts/prerender-spa-routes.mjs`
     writes `dist/<route>/index.html` and canonicalises to the slash form, and
     `public/sitemap-spa.xml` matches — so links to them must carry the slash too.
  3. **Every other SPA route** (`/faq`, `/ueber-uns`, `/dashboard`, `/level/:level`…)
     has **no** slash; it is served by a `netlify.toml` rewrite to `/app.html`.
- **Duplicated on purpose** (until refactor): `competitorComparisons.js` (SPA+Astro,
  CI-guarded), grammar rule rendering (SPA stages vs `RuleContent.astro`), pricing and
  comparison pages. Change both sides or the drift check fails.
- **Secrets fail closed**: email functions 500 without `CAMPAIGN_SECRET`/`UNSUB_SECRET`.
  Never reintroduce fallback secrets. Never widen the send-daily-test/daily-sentence auth.
- **DB writes to privileged columns** (`subscriptions`, `profiles.is_subscribed`, trial
  dates) go through the service role only — RLS + a trigger enforce this. Schema changes
  are hand-applied SQL in `migrations/` (see its README); legacy root `*.sql` is history,
  do not re-run.
- **Functions**: v1 handler signature (`export const handler`), CORS preamble per file,
  identity from the verified JWT via `_shared/auth.mjs` — never from the request body.
  The scheduled function `daily-sentence` distinguishes scheduler calls by the
  `next_run` body marker.
- The Netlify build command in `netlify.toml` is one long line that also copies Astro
  output into `dist/` — when adding a new top-level Astro route, add its copy step there.
- `public/consent.js` gates GA4 **and** PostHog behind the `dm_cookie_consent`
  localStorage flag; new analytics must hook the same consent (`dm-consent-accepted`).

## Current state / open threads

- `EVALUATION.md` holds the full audit: scores, issue tables (S-xx/SEO-xx/…), roadmap.
- CSP ships as Report-Only — do not promote to enforcing without checking reports.
- `/privacy/` + `/impressum/` are noindex drafts pending owner legal review.
- Astro build in CI is possible via `GRAMMAR_CONTENT_CACHE` (see commands above).
