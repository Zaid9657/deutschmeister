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
npm test             # node --test: claim/pricing guards (tests/claims.test.mjs)
npm run build:verify # build + prerender + check the BUILT html (spa-only mode)
cd astro-site && npm run build   # needs PUBLIC_SUPABASE_URL/_ANON_KEY — or a cache:
GRAMMAR_CONTENT_CACHE=path/to/cache.json npx astro build   # offline build (CI/sandbox)
node scripts/dump-grammar-cache.mjs   # produce that cache (needs Supabase network)
node scripts/evaluate-site.mjs        # route walkthrough + screenshots (playwright)
```

CI (`.github/workflows/ci.yml`) runs lint + duplicate check + `npm test` + `node --check` on
functions + the SPA build + prerender + `check-built-html.mjs --spa-only`. The Astro half is
still not built in CI (needs Supabase creds/egress), so the built-HTML check runs in `--spa-only`
mode and says so on every run — Netlify's deploy build remains the only gate on the static pages.

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
- **Duplicated on purpose** (until refactor): `competitorComparisons.js`, `pricing.js` and
  `marketing.js` under `src/data/` + `astro-site/src/data/` (all byte-identical, CI-guarded by
  `scripts/check-duplicates.mjs`), grammar rule rendering (SPA stages vs `RuleContent.astro`),
  comparison pages. Change both sides or the drift check fails.
- **Design tokens: `src/data/design-tokens.js` is the only place a hex value or font stack is
  written.** Both tailwind configs import it (`tailwindColors`, `tailwindFontFamily`), and it is
  drift-guarded against its `astro-site/src/data/` twin. Three binding rules live in its header:
  colour means grammatical case (the four `kasus` values may appear only where a case is named,
  never as decoration or on a CTA), one interactive colour (`siegel` teal), and structure from
  hairline rules rather than resting shadows. `font-display` resolves to **Fraunces**, not the
  Cormorant Garamond it used to be — Cormorant stays loaded only because the Meister-Siegel's "M"
  glyph sets it inline. Tailwind is JIT, so a token class only reaches the CSS once a component
  uses it; to check the wiring, build and grep the emitted CSS rather than reading the config.
- **Prices and claims: derive, never retype.** `src/data/pricing.js` is what the checkout
  charges; `src/data/marketing.js` is what the copy claims, and every value there carries its
  provenance inline (the server file it was verified against, and when). `src/config/limits.js`
  is now a thin re-export of the latter. `tests/claims.test.mjs` enforces it three ways: derived
  figures follow from the prices, no page source contains a price literal, and the limits are
  parsed out of the Netlify functions that enforce them and compared. That last check is what
  caught `lemonsqueezy.js` advertising "5 speaking sessions per month" against a server that has
  always granted 30.
- **`<head>` and headings must be verified against `dist/`, not the source.** The prerendered SPA
  routes get their title/canonical/visible copy injected at build time by
  `scripts/prerender-spa-routes.mjs`, so reading the source tells you what the injector intends,
  never what a crawler receives. `scripts/check-built-html.mjs` reads the artifact. Note the
  script is **not idempotent** — it strips the canonical from `app.html` — so a second run
  against an already-prerendered `dist/` fails; rebuild from scratch.
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

- `docs/medmeister-parity-roadmap.md` is the current plan: a comparison against the sibling
  MedMeister project and a tiered roadmap (SEO content engine, design system, lifecycle, tests).
  Batch A of it — the shared pricing/marketing data layer, the claim guards and the built-HTML
  check — has shipped; the rest has not.
- `EVALUATION.md` holds the older full audit: scores, issue tables, roadmap. Read it with
  `AUDIT-2026-08-16.md` and `REMEDIATION.md`, which supersede much of it.
- CSP ships as Report-Only — do not promote to enforcing without checking reports.
- `/privacy/` + `/impressum/` are noindex drafts pending owner legal review.
- Astro build in CI is possible via `GRAMMAR_CONTENT_CACHE` (see commands above).
