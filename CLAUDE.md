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

## The SPA has no "/" route, on purpose

`/` is served by the Astro build (`astro-site/src/pages/index.astro`) via `netlify.toml`. The SPA
used to carry its own divergent `LandingPage.jsx` at `/`, unreachable after the August remediation
made every in-app "/" link a full page load — two homepages, one dead. It was deleted 2026-08-22.
On the Vite dev server `/` now falls through to `NotFoundPage`; work on the homepage in
`astro-site/`.

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
- **`.mcp.json` is committed and must stay credential-free.** It declares the DataForSEO and Google
  Search Console MCP servers the SEO Routines depend on (`docs/seo-routines/`). Values are `${VAR}`
  references Claude Code expands from the environment; the literals belong in the environment's
  variables, never in the file. `.claude/hooks/session-start.sh` materialises
  `GSC_SERVICE_ACCOUNT_JSON` to `~/.gsc-credentials.json` (chmod 600) and installs both dependency
  trees — it skips silently when the secret is unset. **Neither connector works yet, and the
  DataForSEO blocker is a network policy, not a credential**: `api.dataforseo.com` answers
  `CONNECT tunnel failed, 403` at the proxy, so credentials alone change nothing until the domain is
  allowlisted on the environment. Diagnose with
  `curl -sS "$HTTPS_PROXY/__agentproxy/status"`. GSC's domain *is* reachable. Routine prompts live in
  `docs/seo-routines/` rather than the Routines UI, because an agent cannot edit a Routine it did not
  create and a UI-only prompt drifts from the repo silently.
- **Leitfäden are data, not pages.** A guide lives in
  `astro-site/src/data/guides/<slug>.js` and is rendered by
  `pages/leitfaden/[slug].astro`; the hub lists the registry. Adding one is a data module,
  a line in `GUIDES`, and a line in `scripts/check-built-html.mjs`'s MANIFEST — nothing in
  `netlify.toml` (the whole `/leitfaden/` directory is already copied) and nothing in the
  sitemap config (the filter already whitelists the prefix). A new **top-level** segment
  would need its own `cp -r` step. Guides get **no SPA twin**: Netlify serves the static
  page, so `src/pages/leitfaden/TelcB1Page.jsx` is dead code on the dev server only.
  `tests/guides.test.mjs` pins slug/title/description/anchor integrity, the three
  trailing-slash cases on every internal link, and the ban on outcome promises and fee
  figures. Exam facts carry `factsCheckedOn` + `sources`, both rendered on the page.
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
- **Lifecycle email is two jobs with one ledger and one rule.** `trial-lifecycle.mjs` is
  clock-based (days 3/6/8 of the trial); `activation-lifecycle.mjs` is behaviour-based (days 1
  and 4, ONLY users with zero lesson activity) and **ships off** — it no-ops unless
  `LIFECYCLE_ACTIVATION_ENABLED=true`, supports `?dry=1` and a `LIFECYCLE_TEST_RECIPIENTS`
  canary allowlist, and cannot send until `migrations/2026-08-22-activation-lifecycle.sql` is
  applied (the ledger's CHECK rejects unmigrated kinds, and claim-before-send means no claim →
  no send). Both jobs claim into `lifecycle_emails` (UNIQUE user_id+kind) BEFORE sending.
  Funnel status has ONE definition: the `lifecycle_customer_state` view (service-role only) —
  the mailer, any dashboard, and ad-hoc queries must read it rather than re-deriving status,
  or the queue shown diverges from the queue mailed. The activation windows are deliberately
  disjoint from the trial windows and `tests/lifecycle.test.mjs` pins that — move a window in
  either file and update the test's occupied-days table in the same commit. The rule the
  re-read defends: never tell someone they have not used a lesson when they have.
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
  Batches A–D have shipped (claims data layer + guards, design tokens + rebuilt `/` and
  `/pricing`, the Leitfaden engine + four guides, SEO-routine machinery), and Batch E adds the
  activation lifecycle (shipping OFF — owner must apply its migration and set
  `LIFECYCLE_ACTIVATION_ENABLED=true`). Still open: the SEO connectors (network allowlist +
  credentials — see `docs/seo-routines/README.md`), the in-app SPA brand migration, and
  verifying the Astro half in CI. NOTE: grammar pages already carry
  `['Article','LearningResource']` schema and Related-Topics links — two earlier claims that
  they were missing were wrong (see the corrections section in the roadmap).
- **Competitor pricing on `/vergleich/` is stamped "Stand: Mai 2026" and could not be
  re-verified** — every vendor domain is blocked by the agent proxy. Aggregators suggest all
  three have since raised prices, i.e. the stored figures understate them, which is the
  conservative direction. Never advance a "Stand:" stamp without checking the vendor's own
  page: an overstated competitor price is actionable under §6 UWG.
- **User-facing counts are content counts, never usage counts.** The homepage, `StatsBar.jsx` and
  the `/vergleich/` pages each used to claim learner/usage figures, and by August 2026 the three
  disagreed with each other; one ("2,488 AI speaking exercises") had no source in any audit. They
  now render only `marketing.js` constants counted against live tables. Before adding a usage
  claim, measure it and record the provenance — see the counts rule in `src/data/marketing.js`.
- `EVALUATION.md` holds the older full audit: scores, issue tables, roadmap. Read it with
  `AUDIT-2026-08-16.md` and `REMEDIATION.md`, which supersede much of it.
- CSP ships as Report-Only — do not promote to enforcing without checking reports.
- `/privacy/` + `/impressum/` are noindex drafts pending owner legal review.
- Astro build in CI is possible via `GRAMMAR_CONTENT_CACHE` (see commands above).
