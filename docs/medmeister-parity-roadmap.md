# DeutschMeister ↔ MedMeister — parity audit & roadmap

**Date:** 2026-08-22 · **Repos compared:** `Zaid9657/deutschmeister` (this repo) vs `Zaid9657/kp-med` (MedMeister)

**Purpose.** MedMeister got months of focused work — a full SEO/GEO operation, a rebuilt design
system, copy/pricing discipline, lifecycle email, and telemetry. DeutschMeister is to catch up,
taking inspiration from the *quality of the work*, not the look: **DeutschMeister keeps its own
identity and audience** (German learners, not doctors). This document is the audit + prioritized
roadmap; implementation happens in follow-up tasks, one item at a time.

**Priorities set by the owner:** (1) SEO / organic growth, (2) design (landing + pricing, fresh
identity built from a blank sheet). Everything else is Tier 3.

**Standing inputs, reconciled:**

- `EVALUATION.md` / `AUDIT-2026-08-16.md` / `REMEDIATION.md` — the Aug 16–18 remediation already
  fixed the security holes, funnel-blocking bugs, and most technical SEO (PRs #13, #15–#18).
  This roadmap builds on REMEDIATION's "still open" list, not EVALUATION's older roadmap.
- `kp-med/deutschmeister-port-checklist.md` (2026-05-27) — an earlier port plan. Its Tier 1 is
  now **mostly done here** (PostHog + funnel events, FAQ, Über-uns, IndexNow, email-verification
  gate, comparison pages, one Leitfaden). What it correctly predicted and is still open: the
  blog/guide system at scale, onboarding-into-first-lesson, testing infrastructure, and the
  glossary/localized-landing long tail. Treat that file as historical; this document supersedes it.

**Method note (MedMeister discipline applied to this doc):** every claim below was verified this
session against the named file or the repo's own audit documents. No figure is retyped from memory.

---

## Where DeutschMeister stands (one paragraph)

The technical base is good: Astro pages measure Lighthouse 99–100 with centralized head handling
(`astro-site/src/layouts/Layout.astro`), sitemap index + robots + `llms.txt`/`llms-full.txt`,
FAQ/snippet enrichment on all 64 grammar topics (`astro-site/src/lib/topicSeo.js`), prerendered
SPA meta injection (`scripts/prerender-spa-routes.mjs`), IndexNow. The product core is stocked
(64 grammar topics / 453 rules / 672 exercises, 480 listening dialogues with audio, 66 reading
lessons, 24 podcasts, level test, speaking, X-Ray). What's missing is what MedMeister spent its
months on: a **content growth engine**, a **design system**, **claim/price discipline enforced by
tests**, **behavioral lifecycle email**, and **CI that verifies the built output**. Funnel reality:
1,449 accounts → 23 WAU → 4 active subs (~0.3% conversion), with activation as the cliff.

---

## Side-by-side comparison

| Area | MedMeister has (kp-med refs) | DeutschMeister has (this repo) | Gap |
|---|---|---|---|
| **SEO content engine** | Blog system (`content/blog/posts/*.ts`), 3 long Leitfäden (~35 KB each), per-audience landing pages (7 locales), comparison pages, glossary | **1** Leitfaden (`astro-site/src/pages/leitfaden/telc-b1.astro` — measured SEO 100), **3** Vergleich pages stamped "Stand: Mai 2026", no blog infra | **Largest gap.** The winning pattern exists and was never replicated |
| **SEO operations** | `.mcp.json` (DataForSEO + GSC MCP), repo-hosted routine prompts (`docs/seo-routines/geo-weekly.md`, `measurement-fortnightly.md`), `drafts/geo-tracking.csv` ledger, evidence-ranked fix order | None — no keyword research loop, no rank/GEO measurement, no routines | Whole capability absent |
| **Built-output CI verification** | `scripts/check-exported-heads.mjs` gates CI: reads `dist/` HTML — unique titles/descriptions, one `<h1>`, one `lang`, min body chars, sitemap integrity, banned-literals list, `THIN_PAGE_DEBT` that fails when paid | CI (`.github/workflows/ci.yml`) runs lint + one duplicate check + `node --check` + SPA build. **The Astro build — the entire SEO surface — is not built in CI**, though `GRAMMAR_CONTENT_CACHE` makes it possible offline | High-value, low-effort port |
| **Head/route registry** | `constants/seoRoutes.ts` (single registry, `noindex` fallback, `brandedTitle()` ≤60), guarded by `__tests__/constants/seoRoutes.test.ts` (no duplicate title/description/h1) | Per-page manual props into `Layout.astro` + `src/components/SEO.jsx`; good but unguarded — nothing prevents two pages sharing a title | Medium |
| **Design system** | `theme/tokens.ts` — one file, provenance in header, named type roles with mobile step-downs, 2–3 binding rules, `sectionOrder` as data; primitives module (`components/homepage/v4/primitives.tsx`) as the only home of raw values; versioned page dirs (v1…v4); `content.ts` copy split per page | No system: teal/gold chrome + 8 unused CEFR level palettes + blue **dark** pricing page (the only dark page) + the retired amber→rose gradient still on the primary CTAs of both landing pages *and* in every email template and the cookie banner; logo defined in 3 places; ~109 bespoke card treatments; near-duplicate Tailwind configs (root vs `astro-site/`) unguarded by CI | Large; user wants a fresh identity |
| **Copy/price discipline** | `constants/marketing.ts` (claims, provenance comments, UWG §5 framing) split from `constants/pricing.ts` (what checkout charges); `__tests__/constants/pricingConsistency.test.ts` (912 ln) reads page *sources* and bans literal claims per file list | Prices hardcoded in 6+ places (`src/config/lemonsqueezy.js`, `pricing.astro`, `SubscriptionPage.jsx`, `LandingPage.jsx`, `FAQPage.jsx`, `competitorComparisons.js` ×2, `llms.txt`); day-rates retyped rather than derived (`€0.33/day` monthly, `€0.22/day` yearly — both correct today, see note); `src/config/limits.js` is a good limits SSOT but Astro can't import it, so `pricing.astro` retypes claims as prose | Medium effort, legally relevant |
| **Lifecycle email** | One handler-less sender (`_email-core.js`) + one idempotency lock; declarative journey registry (`_lifecycle-journeys.js`); hourly runner with dry-run, canary allowlist, master switch shipping `paused` | 3 trial-clock emails (`trial-lifecycle.mjs`) + daily sentence (30-item loop) + welcome + dunning; good idempotency (`lifecycle_emails` UNIQUE) but no behavioral journeys, HTML hand-written per function, **wrong (retired) logo** in every template | Medium |
| **Analytics** | Consent-gated, non-throwing `lib/marketingEvents.ts` (~30 typed GA4 wrappers), CTA-ladder tracking, server-side funnel row per session, guard-event table | GA4 + PostHog consent-gated, 26 funnel events defined in `src/lib/funnelTracking.js` — client-only, and nothing reads them; no server-side events despite 15 functions seeing every conversion | Medium |
| **Tests** | Jest + Playwright + axe; source-reading guard suites (pricing, Sie-form, SEO registry) | **Zero tests** | Foundational |
| **Repo knowledge discipline** | `CLAUDE.md` trust table + known-traps + working rules + `.claude/JOURNAL.md` correction log | Good `CLAUDE.md` + README; no journal, root littered with historical SQL | Small |

**What DeutschMeister has that MedMeister doesn't** (keep, don't regress): the Astro static-site
architecture itself (cleaner than kp-med's prerender fights), `@astrojs/sitemap`, i18next runtime,
podcast RSS, the CEFR level test, X-Ray. The port goes one way on process, not on architecture.

---

## Roadmap

Effort: S ≤ 2 h · M = half day · L = 1–2 days · XL = multi-day. Each item is scoped to be a
follow-up task prompt on its own.

### Tier 1 — SEO / organic growth

**1.1 Guide (Leitfaden) content engine — L, then M per guide. The single biggest lever.**
`leitfaden/telc-b1.astro` measured SEO 100 and is called the site's best top-of-funnel asset by
its own audit. Replicate deliberately:
- Extract the telc-b1 page's structure into a reusable Astro layout/collection (Astro content
  collections + MDX) so a new guide is content, not markup.
- First wave of guides (German-exam search demand, same logic as MedMeister's FSP/KP guides):
  *Goethe-Zertifikat B1/B2 komplett*, *telc B2*, *DTZ (Deutsch-Test für Zuwanderer)*,
  *TestDaF*, *"Deutsch B1 in 3 Monaten"* — keyword-validated first via item 1.2 before writing.
- Add `Article` + author infrastructure (byline module that ships empty until real details are
  provided — copy kp-med's `content/site/author.ts` honesty pattern).
- Refresh the 3 `vergleich/` pages (data stamped "Stand: Mai 2026") and add 2–3 more
  bottom-of-funnel comparisons.

**1.2 SEO operations: keyword research + measurement loop — M setup.**
Port the MedMeister pattern wholesale, retargeted to German-learning keywords:
- `.mcp.json` at repo root declaring DataForSEO + GSC MCP servers via `${VAR}` references
  (kp-med's file is the template; secrets stay in the environment).
- `docs/seo-routines/` with repo-hosted prompt files + a 3-line Routine bootstrap; adopt the
  proven rules: two engines × two runs for GEO measurement, evidence-ranked fixes (citable
  statistic > answer-shaping > freshness > schema-as-hygiene), Class A autonomous / Class B
  drafts-for-review, `drafts/geo-tracking.csv` ledger, batch keyword requests (DataForSEO
  charges per request).
- Market settings differ from MedMeister: primary keywords are learner-intent German-exam and
  "Deutsch lernen" queries; target languages include EN (the app is EN-marketed) — decide
  location/language per cluster rather than fixing `Germany/de` globally.

**1.3 Built-HTML verification gating CI — M.**
Port `check-exported-heads.mjs` conceptually to the merged `dist/`:
- Assert per page: non-empty unique `<title>` (≤60 soft/70 hard) and meta description, exactly
  one visible `<h1>`, one `<html lang>`, canonical present, min body chars.
- Sitemap cross-check: every sitemap URL exists, is not noindex, not thin, no duplicates;
  `THIN_PAGE_DEBT` map that fails when debt is *paid*.
- `BANNED_LITERALS`: any "unlimited"/"unbegrenzt" X-Ray or speaking claim (the limits are 1/10/50
  per day and 30 sessions/month — `src/config/limits.js`), the price digits outside the sanctioned
  data file, and stale date stamps like "Stand: Mai 2026".
- Turn on the Astro build in CI via the existing `GRAMMAR_CONTENT_CACHE` + a committed/artifact
  cache (the workflow already documents the three lines to add). Until the Astro build runs in
  CI, the entire SEO surface ships unverified.

**1.4 Schema & internal-linking upgrades — M.**
- Add `Course`/`LearningResource` JSON-LD to grammar level/topic pages (education product with
  zero education schema today); keep the existing FAQ/Breadcrumb/Quiz blocks.
- Populate `related_slugs` in the DB from `astro-site/src/lib/relatedTopics.js` (currently
  0/64 — the graph exists only in code) and render related-topic links on both Astro and SPA.
- Fix `public/sitemap-spa.xml`'s hardcoded `2026-08-16` lastmods (generate at build).
- GEO: extend `llms.txt`/pages with verifiable statistics (the +37–41 % citation-lift lever
  MedMeister's routine ranks first) — real counts derived from the DB, never invented.

**1.5 Bilingual URL decision — M (decision + spec), L (implementation).**
Today one URL serves two languages via a client-side `[data-en]` text swap; crawlers see only
German on those pages and there is no hreflang. Decide: either (a) commit affected pages to one
language each (cheapest, honest), or (b) split into `/en/`-prefixed variants with reciprocal
hreflang (kp-med's `constants/hreflang.ts` is the reference — reciprocity or Google discards the
pair). This gates whether the guides in 1.1 get written once or twice, so decide before wave 2.

### Tier 2 — Design (fresh identity, blank sheet)

Governing rule (MedMeister working rule 9, adopted here): **rebuild means a blank sheet.** Do not
inherit the current landing/pricing layout; research real references in the language-learning
space first. Carry over only invariants: derived figures, legal/copy rules, the Astro/SPA routing
split, and accessibility fixes already won (contrast AA, skip link).

**2.1 Design tokens + primitives first — M.**
One token module (mirrored root + `astro-site/`, guarded by extending
`scripts/check-duplicates.mjs` — the mechanism already exists):
- Resolve the four color stories into one: a single DeutschMeister chrome (owner chose the
  teal/gold M-seal in the Aug remediation — confirm or evolve it, don't fork it again), with the
  8 CEFR level palettes retained as a *scoped accent system* (they're genuinely good and
  currently unused by any chrome surface).
- Named type roles with measured mobile step-downs (not a raw scale); an explicit 2–3 rule
  contract in the file header (e.g. "CTA accent on conversion buttons and badges only"), and
  provenance: name the outside references the system samples.
- One logo source consumed by SPA, Astro, and email (today: 3 divergent copies —
  `src/components/Logo.jsx` + two inline SVGs in `Layout.astro`).

**2.2 Landing page rebuild — L.**
Blank sheet on the new tokens. Structural lessons to carry from MedMeister v4 (not its look):
`sectionOrder` as data; a `content.ts`-style copy/data split so words aren't buried in markup;
a reusable proof artifact (the equivalent of `SampleFeedbackReport` — e.g. a real X-Ray analysis
or a speaking-evaluation excerpt rendered as a component, one copy reused on landing + signup);
settled-first rendering for anything animated (static HTML must contain the final state).
Delete the divergent `src/pages/LandingPage.jsx` as part of this.

**2.3 Pricing page rebuild — L.**
Blank sheet; kill the dark-theme outlier. Adopt the v4 *thesis*, adapted: open with the buyer's
real question ("What's your goal — B1 certificate? When's your exam?") feeding a small pure
recommendation engine; then one open, transparent price presentation (two plans here, so no
accordion gymnastics — transparency as layout); FAQ close. Every figure derives from the shared
pricing data file (2.4) — no retyped numbers. Fix the `window.open` checkout as part of this
(iOS Safari blocks it; use same-tab navigation or LemonSqueezy overlay).

**2.4 Shared marketing/pricing data — M (prerequisite for 2.2/2.3, do first).**
`data/marketing.js` + `data/pricing.js` as byte-identical SPA/Astro pairs (extend
`check-duplicates.mjs` to guard them), MedMeister-style: pricing = what checkout charges
(variant IDs, €9.99/€79.99), marketing = what copy claims, each value with an inline provenance
comment. **Derive** day-rates and savings from the prices rather than retyping them: today
`€0.33/day` (monthly, 9,99 ÷ 30) and `€0.22/day` (yearly, 79,99 ÷ 365) are both correct, but they
are typed by hand in four files — a single price change makes every one of them false at once,
silently. Deriving re-runs the arithmetic; retyping is what rots. Then a small Node test (the
first test in the repo) that reads page sources and bans the literal price digits everywhere
outside the data files.

**2.5 Roll the new brand everywhere it still isn't — S–M.**
The Aug remediation unified the *logo* but not the palette. Still on the retired amber→rose
gradient: the primary CTAs on both landing pages (`astro-site/src/pages/index.astro`,
`src/pages/LandingPage.jsx`), every Resend template (plus purple CTA buttons), and the cookie
banner in `public/consent.js` (which builds its own inline styles and so inherits no tokens).
Give the 6 email functions one shared template module while doing it.

**Two concrete defects found while auditing — fold into whichever batch touches them first:**
- `astro-site/src/pages/index.astro:238` sets `text-slate-600` on a `bg-slate-800` card (the
  yearly price, "€79.99 / year") — near-invisible dark-on-dark. Its SPA twin
  `src/pages/LandingPage.jsx:434` correctly uses `text-slate-400`. A contrast regression that
  survived the audit's AA pass.
- `scripts/check-duplicates.mjs` guards exactly one file pair. The two Tailwind configs and
  (after 2.4) the pricing/marketing data are equally drift-prone — the script takes a new
  `PAIRS` entry per pair, so this is a one-line fix each.

### Tier 3 — supporting parity (after or alongside)

- **3.1 Activation email journeys — M–L.** The funnel's diagnosed cliff (85 % of signups never
  open a lesson). Port the journey-registry shape: single sender module + declarative journeys
  (`activation_zero_lesson` day 1/3/7 anchored on registration, `first_to_habit` anchored on
  first lesson), exits re-checked immediately before send, dry-run + canary allowlist + master
  switch shipping off. The existing `lifecycle_emails` unique-index lock stays the one lock.
- **3.2 Server-side conversion events — M.** Emit signup/trial/checkout/paid events from the
  Netlify functions (webhook + speaking + X-Ray) into a Supabase table or PostHog server-side,
  so the funnel is measured on 100 % of traffic, not the consent-accepting minority. Then
  actually wire a weekly read of it (a Routine, per 1.2's pattern).
- **3.3 Test + CI foundation — M.** Vitest (or plain node:test) with the 2.4 pricing guard, a
  "three-place route rule" consistency test (App.jsx routes ↔ netlify.toml allow-list ↔
  prerender list ↔ sitemap-spa), and a level-case boundary test. CI: add the Astro build (1.3).
- **3.4 Content completion** (from EVALUATION's roadmap, still valid): reading for B2.1/A1.x;
  de-CAPS the 222 rules at source (`scripts/decaps-grammar-rules.mjs` exists); pick one intro
  system; run `scripts/generate-example-audio.mjs` (0/673 examples have audio; TTS pipeline
  exists); real `acceptable_answers` for genuine synonyms.
- **3.5 Repo hygiene — S.** Adopt the journal rule (`.claude/JOURNAL.md`, corrections logged in
  the same commit as the fix); update `CLAUDE.md` when this roadmap changes reality.
- **3.6 Owner actions (not code, listed so they don't get lost):** fill the Impressum + de-noindex
  legal pages; rotate the exposed service-role key; fix the upstream Resend bounce job; decide
  card-at-trial-start (the structural conversion blocker — highest-leverage single decision).

### Suggested implementation batches (each = one follow-up task)

1. **Batch A (foundation):** 2.4 shared pricing/marketing data + first guard test + 1.3 CI
   verification (Astro build on + built-HTML checks + banned literals).
2. **Batch B (design):** 2.1 tokens/primitives → 2.2 landing → 2.3 pricing → 2.5 email skin.
3. **Batch C (SEO engine):** 1.1 guide infrastructure + first guide; 1.4 schema/internal links.
4. **Batch D (SEO ops):** 1.2 `.mcp.json` + routines + first keyword-research run; 1.5 decision.
5. **Batch E (growth loop):** 3.1 activation journeys + 3.2 server-side events.
