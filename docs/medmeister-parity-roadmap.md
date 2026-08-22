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
| **SEO content engine** | Blog system (`content/blog/posts/*.ts`), 3 long Leitfäden (~35 KB each), per-audience landing pages (7 locales), comparison pages, glossary | **Batch C:** a data-driven guide engine (`astro-site/src/data/guides/`), a `/leitfaden/` hub that did not exist, and **4** guides (telc B1 migrated, Goethe B1, telc B2, DTZ) with Article + FAQPage + BreadcrumbList and rendered fact provenance. Still: no per-audience locale pages, no glossary, guides not yet keyword-validated | Largely closed |
| **SEO operations** | `.mcp.json` (DataForSEO + GSC MCP), repo-hosted routine prompts (`docs/seo-routines/geo-weekly.md`, `measurement-fortnightly.md`), `drafts/geo-tracking.csv` ledger, evidence-ranked fix order | None — no keyword research loop, no rank/GEO measurement, no routines | Whole capability absent |
| **Built-output CI verification** | `scripts/check-exported-heads.mjs` gates CI: reads `dist/` HTML — unique titles/descriptions, one `<h1>`, one `lang`, min body chars, sitemap integrity, banned-literals list, `THIN_PAGE_DEBT` that fails when paid | **Batch A:** `scripts/check-built-html.mjs` now gates CI over the built SPA pages (unique title/description, one visible `<h1>`, one `lang`, canonical, min body chars, sitemap integrity, banned literals). **Still open:** the Astro build — the entire static/SEO surface — is not built in CI, so the check runs `--spa-only` and says so every run | Half closed |
| **Head/route registry** | `constants/seoRoutes.ts` (single registry, `noindex` fallback, `brandedTitle()` ≤60), guarded by `__tests__/constants/seoRoutes.test.ts` (no duplicate title/description/h1) | Per-page manual props into `Layout.astro` + `src/components/SEO.jsx`; good but unguarded — nothing prevents two pages sharing a title | Medium |
| **Design system** | `theme/tokens.ts` — one file, provenance in header, named type roles with mobile step-downs, 2–3 binding rules, `sectionOrder` as data; primitives module (`components/homepage/v4/primitives.tsx`) as the only home of raw values; versioned page dirs (v1…v4); `content.ts` copy split per page | No system: teal/gold chrome + 8 unused CEFR level palettes + blue **dark** pricing page (the only dark page) + the retired amber→rose gradient still on the primary CTAs of both landing pages *and* in every email template and the cookie banner; logo defined in 3 places; ~109 bespoke card treatments; near-duplicate Tailwind configs (root vs `astro-site/`) unguarded by CI | Large; user wants a fresh identity |
| **Copy/price discipline** | `constants/marketing.ts` (claims, provenance comments, UWG §5 framing) split from `constants/pricing.ts` (what checkout charges); `__tests__/constants/pricingConsistency.test.ts` (912 ln) reads page *sources* and bans literal claims per file list | **Batch A: closed.** `src/data/pricing.js` (what the checkout charges) split from `src/data/marketing.js` (what the copy claims, provenance inline), both mirrored into `astro-site/src/data/` and drift-guarded; every day-rate and saving derives; `tests/claims.test.mjs` bans price literals, bans "unlimited" on metered surfaces, and compares the limits against the servers that enforce them | Closed |
| **Lifecycle email** | One handler-less sender (`_email-core.js`) + one idempotency lock; declarative journey registry (`_lifecycle-journeys.js`); hourly runner with dry-run, canary allowlist, master switch shipping `paused` | 3 trial-clock emails (`trial-lifecycle.mjs`) + daily sentence (30-item loop) + welcome + dunning; good idempotency (`lifecycle_emails` UNIQUE) but no behavioral journeys, HTML hand-written per function, **wrong (retired) logo** in every template | Medium |
| **Analytics** | Consent-gated, non-throwing `lib/marketingEvents.ts` (~30 typed GA4 wrappers), CTA-ladder tracking, server-side funnel row per session, guard-event table | GA4 + PostHog consent-gated, 26 funnel events defined in `src/lib/funnelTracking.js` — client-only, and nothing reads them; no server-side events despite 15 functions seeing every conversion | Medium |
| **Tests** | Jest + Playwright + axe; source-reading guard suites (pricing, Sie-form, SEO registry) | **Batch A:** `node --test` wired as `npm test`, with `tests/claims.test.mjs` as the first suite. No component, route or E2E tests yet | Started |
| **Repo knowledge discipline** | `CLAUDE.md` trust table + known-traps + working rules + `.claude/JOURNAL.md` correction log | Good `CLAUDE.md` + README; no journal, root littered with historical SQL | Small |

**What DeutschMeister has that MedMeister doesn't** (keep, don't regress): the Astro static-site
architecture itself (cleaner than kp-med's prerender fights), `@astrojs/sitemap`, i18next runtime,
podcast RSS, the CEFR level test, X-Ray. The port goes one way on process, not on architecture.

---

## Roadmap

Effort: S ≤ 2 h · M = half day · L = 1–2 days · XL = multi-day. Each item is scoped to be a
follow-up task prompt on its own.

### Tier 1 — SEO / organic growth

**1.1 Guide (Leitfaden) content engine — DONE (Batch C, 2026-08-22).**
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

**1.3 Built-HTML verification gating CI — DONE for the SPA half (Batch A, 2026-08-22); Astro half still open.**
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

**2.1 Design tokens — DONE (Batch B, 2026-08-22).**
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

**2.2 Landing page rebuild — DONE (Batch B, 2026-08-22).**
Blank sheet on the new tokens. Structural lessons to carry from MedMeister v4 (not its look):
`sectionOrder` as data; a `content.ts`-style copy/data split so words aren't buried in markup;
a reusable proof artifact (the equivalent of `SampleFeedbackReport` — e.g. a real X-Ray analysis
or a speaking-evaluation excerpt rendered as a component, one copy reused on landing + signup);
settled-first rendering for anything animated (static HTML must contain the final state).
Delete the divergent `src/pages/LandingPage.jsx` as part of this.

**2.3 Pricing page rebuild — DONE (Batch B, 2026-08-22).**
Blank sheet; kill the dark-theme outlier. Adopt the v4 *thesis*, adapted: open with the buyer's
real question ("What's your goal — B1 certificate? When's your exam?") feeding a small pure
recommendation engine; then one open, transparent price presentation (two plans here, so no
accordion gymnastics — transparency as layout); FAQ close. Every figure derives from the shared
pricing data file (2.4) — no retyped numbers. Fix the `window.open` checkout as part of this
(iOS Safari blocks it; use same-tab navigation or LemonSqueezy overlay).

**2.4 Shared marketing/pricing data — DONE (Batch A, 2026-08-22).**
Shipped as `src/data/pricing.js` + `src/data/marketing.js`, byte-identical with their
`astro-site/src/data/` twins and guarded by `scripts/check-duplicates.mjs`. All day-rates,
monthly-equivalents and the saving percentage now derive; ten surfaces stopped retyping them.
`tests/claims.test.mjs` (the repo's first test) enforces derivation, bans price literals and
blanket "unlimited" claims on metered surfaces, and — the check that earns its keep — parses the
limits out of the Netlify functions that enforce them and compares. What that caught is in
"Defects found and fixed" below.

NOTE, correcting this document twice over. It first proposed drift-guarding the two Tailwind
configs, then claimed the Astro one "does not carry the eight CEFR level palettes at all". Both
readings came from a truncated diff. Measured: **both configs carry all eight level palettes**
and are near-identical, differing only in their `content` globs and one extra `glow` animation on
the SPA side. They still cannot be a byte-identical pair (the globs must differ), which is why
2.1 solved it the other way — both configs now import `src/data/design-tokens.js`, and *that*
file is the drift-guarded pair. Verified by building both halves and grepping the emitted CSS.

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

### Defects found and fixed while shipping Batch A

The guards were written first and then run; everything below is something they caught, not
something the audit had already listed.

| Defect | Where | Why it mattered |
|---|---|---|
| Pro advertised as **"5 speaking sessions per month"** | `src/config/lemonsqueezy.js` | The server has always granted **30** (`speakingUsage.mjs`). The checkout config understated the product six-fold. |
| **Eleven** claims that AI speaking is "unbegrenzt"/"Unlimited" | `competitorComparisons.js` (both copies), `src/pages/LandingPage.jsx` | Speaking is capped at 30/month and X-Ray at 50/day. A blanket "unlimited" beside a price is irreführende Werbung under UWG §5. One sat directly in the Lingoda price row: *"9,99 €/Monat (Pro) — unbegrenzt"*. |
| Podcast **transcripts promised** in an indexed `FAQPage` rich result and in visible copy | `scripts/prerender-spa-routes.mjs` | All 24 episodes have empty transcripts. The 2026-08-16 audit (B-04) removed this from `PodcastsPage.jsx` but missed this second hardcoded copy, so the claim stayed live. |
| **Two `<h1>` on every prerendered page** | shell identity `<h1>` + the route's own | A visually-hidden site-wide heading competed with each page's real subject. The prerender script now strips it per route; `app.html` keeps it for client-only routes. |
| Dark-on-dark price text (`text-slate-600` on `bg-slate-800`) | `astro-site/src/pages/index.astro`, **both** cards | Near-invisible. The earlier audit note caught only the yearly one. |
| German badge **"Beliebteste Wahl"** on the English pricing page | `pricing.astro` billing toggle | DE/EN mixing at the moment of purchase. |

Two claims this document made were **retracted on verification**: the €0.33 vs €0.22 day-rates
are the monthly and yearly rates and were both correct (the real problem was that they were
retyped, not that they disagreed), and the Tailwind configs cannot be a byte-identical pair.

### Batch B so far (2026-08-22): the design system, and the first surface on it

**The identity is derived from the product, not invented for it.** Sentence X-Ray already colours
the four German cases — Nominativ `#378ADD`, Akkusativ `#D85A30`, Dativ `#1D9E75`, Genitiv
`#7F77DD`. `src/data/design-tokens.js` promotes those to the system's accent palette under one
binding rule: **colour means case**. They may appear only where a grammatical case is named —
never as a section fill, never on a CTA. The payoff is that the marketing page and the analyser
teach the same visual language. Two further rules ship in the file header: one interactive colour
(the Meister-Siegel teal, sampled from the logo the owner chose in August), and structure from
hairline rules rather than resting shadows, because the declension table is this subject's native
artifact.

Type: **Fraunces** replaces Cormorant Garamond as the display face — both were already being
loaded, and Cormorant is the generic "elegant serif" that lands on every project, while Fraunces
has an optical-size axis and enough spine for long German compounds. Body stays Nunito Sans. A
mono stack carries *data* — level codes, case labels, prices — because marking figures as data
rather than prose is information. Named type roles each carry their own mobile step-down, so the
mobile behaviour travels with the decision instead of being re-guessed per surface.

Both Tailwind configs import the tokens, so no hex or font stack is written anywhere else, and
the tokens file is drift-guarded like the pricing and marketing data.

**`/pricing` rebuilt on it, blank sheet.** The thesis: a language buyer's real question is "how
far does this get me", and the product's own eight-level CEFR ladder answers it. Free lights one
rung, Pro lights all eight — so the ladder *is* the pricing argument, rendered as static markup
that is true with JavaScript off. The plan comparison is a declension table rather than two
bullet lists. Gone: the dark gradient that made this the only dark page on the site, and a blue
accent belonging to no system. Kept: every figure derived, and the same-tab checkout (a new tab
is blocked by iOS Safari).

**2.5 done too: the retired brand is out of every customer-facing surface.** The August
remediation replaced the amber-to-rose "D" identity in the site chrome, but it survived wherever
nobody looks until a customer receives one — the welcome mail, the trial sequence, the daily
sentence, the **dunning email**, the owner test send, the unsubscribe page and the cookie banner.
All seven now carry the Meister-Siegel teal and the "M" mark, via
`netlify/functions/_shared/brand.mjs` (a synced copy of the tokens, because the functions bundle
cannot reliably reach `src/` and `consent.js` is served verbatim). `tests/brand.test.mjs` compares
every value against the tokens and bans the retired hexes on those surfaces — it also bans CSS
gradients there, since several mail clients drop them and an unpainted gradient leaves white text
on white.

That ban is deliberately scoped to marketing and transactional surfaces, **not** repo-wide:
`#f43f5e` is also the B2.1 *level* colour in `src/utils/listeningHelpers.js`, where it means
something else entirely. A blind sweep would have "fixed" it.

**2.2 done: the homepage is rebuilt and the unsourced figures are gone.** Its signature is the
product's own artifact — a real German sentence marked by case in the hero, exactly as Sentence
X-Ray marks it, which is the one thing no competitor has. Gone: the amber-to-rose gradient hero,
the blurred colour blobs, the emoji level cards on eight different palettes, the dark "your German
won't improve by waiting" urgency block, and the full-bleed rainbow CTA.

The claims decision was the owner's, and it was **content counts only**. The old stats band read
"1,400+ Learners", "170+ New learners this month" and "2,488 AI speaking exercises": the first two
trace to the 2026-08-16 database audit but "this month" is stale by construction, and the third
appears in **no audit and has no source at all**. Chasing it turned up two more surfaces carrying
the same class of claim, disagreeing with each other and with the homepage — `components/StatsBar.jsx`
(rendered on the SPA comparison page) repeated the same three figures in German, and
`vergleich/[slug].astro` carried an *older* set copied in May 2026: 959 learners, 350 a month, 154
sentences analysed. Three surfaces, three different answers, none sourced. All three now show only
counts of what the product contains — figures true by construction that cannot drift apart.

`src/pages/LandingPage.jsx` was deleted with its `/` route. It had been unreachable since the
August remediation made every in-app "/" link a full page load; `src/App.jsx` now carries a comment
at that spot explaining that Astro serves the homepage, so nobody re-adds it.

Still open in Batch B: the in-app SPA surfaces that still carry retired-brand hexes (`components/onboarding/IntroSlides.jsx`,
`components/LevelTest/LevelTestResults.jsx`, `styles/LevelTest.css`). Those are the in-product
migration rather than the marketing chrome, and `LevelTest.css` alone is ~1,500 lines, so they are
their own change.

**A note on the landing rebuild before it starts.** Its current stats band claims "1,400+
Learners", "170+ New learners this month" and "2,488 AI speaking exercises". The first two are
traceable to EVALUATION.md's 2026-08-16 database audit (1,449 accounts all-time, 172 signups in 30
days) but the second is a rolling claim that is stale by construction; the third appears in no
audit and has **no source at all**. Per the counts rule in `src/data/marketing.js`, a figure with
no provenance should not survive a rebuild. Re-measure against the live database, or drop it.

### Batch C so far (2026-08-22): the content engine, and the first wave on it

**A guide is data now.** `astro-site/src/data/guides/<slug>.js` holds the content;
`pages/leitfaden/[slug].astro` renders it through typed blocks (`p`, `h3`, `list`, `callout`,
`table`, `steps`, `warnings`, `cards`). The proven telc-B1 page was ~274 lines of hardcoded
consts, which is precisely why nobody wrote a second one — copying all of it was the price of
entry. Adding a guide is now a data module plus one MANIFEST line: `netlify.toml` already copies
the whole `/leitfaden/` directory and the sitemap filter already whitelists the prefix.

**Four guides ship**, all German, matching the proven page's depth (1,444–1,735 words each):
`telc-b1` (migrated, URL unchanged), `goethe-b1`, `telc-b2`, `dtz`. Plus `/leitfaden/` itself,
which **did not exist** — it fell through the SPA rewrite to NotFoundPage, so the one guide the
site had was an orphan under a 404.

**What the engine fixed while migrating:** the TOC is derived from the sections, so an anchor can
no longer point at a renamed section (the original kept two hand-synced lists); `/grammar/b1.2`
was missing its trailing slash and 301-hopped on every click; absolute `https://deutsch-meister.de/…`
self-links became relative; "Zuletzt aktualisiert: Mai 2026" and "Stand: Mai 2026" were hardcoded
and already stale, and now derive. The page is on the design tokens — the original was slate/amber
with a local `<style>` block of raw hex, predating the system. Schema went from Article + FAQPage
to **Article + FAQPage + BreadcrumbList** with `inLanguage` and a real publisher, matching the
vergleich hub, which had been richer than the guide it linked to.

**Fact discipline, because these pages state exam rules people plan around.** Every guide carries
`factsCheckedOn` and a `sources` list, both **rendered on the page** rather than buried in a
comment — honest, and the kind of verifiable-provenance signal AI answer engines cite. No fees are
stated (set per centre, change without notice); no pass-rate or outcome promises. `goethe.de`,
`babbel.com` and the exam-centre mirrors are all blocked by the agent proxy, so official PDFs could
not be fetched directly — the module structures and pass marks come from search summaries citing
those PDFs, corroborated across independent centre descriptions, and the DTZ's scaled result is
explained as a mechanism rather than asserted as a threshold, because secondary sources describe
that rule inconsistently and a wrong claim there affects somebody's residence paperwork.

`tests/guides.test.mjs` (10 assertions) pins slug/title/description integrity, derived-TOC
anchors, **the three trailing-slash cases on all 24 internal links**, ISO dates not in the future,
a source per guide, the ban on outcome promises and fee ranges, and the JSON-LD shape.

**Vergleich:** `/vergleich/<slug>/` rendered an FAQ but emitted no FAQPage schema and no
breadcrumb — both added. The **stale "Stand: Mai 2026" data was NOT refreshed**: every vendor
domain is egress-blocked here, aggregators (reachable) indicate all three have raised prices since,
and writing an aggregator's number for a competitor is both unsourced and, if it overstates them,
actionable under §6 UWG. The stored figures understate competitors, which is the direction that
costs us rather than them. The attempt and its findings are recorded in the data file's header.

Still open in Batch C's area: more guides (Goethe B2, TestDaF, a "B1 in drei Monaten" method
guide), and **keyword validation** — these four were picked on obvious exam-name intent, not on
measured volume, which arrives with Batch D.

### Suggested implementation batches (each = one follow-up task)

1. ~~**Batch A (foundation):** shared pricing/marketing data + first guard test + built-HTML
   CI verification.~~ **Done 2026-08-22.** Still open from it: **verifying the Astro half**.
   `check-built-html.mjs` runs `--spa-only` in CI and prints on every run that the static/SEO
   pages went unverified. Two ways to close it, either is enough:
   - **Build Astro in CI** — add `PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY` to the repo
     secrets (or commit a `GRAMMAR_CONTENT_CACHE` from `scripts/dump-grammar-cache.mjs`), then
     append the build + copy steps and drop `--spa-only`. `.github/workflows/ci.yml` carries the
     exact lines in a comment.
   - **Run the full check on Netlify** — the deploy build already produces the complete merged
     `dist/`, so appending `node scripts/check-built-html.mjs dist` to the `netlify.toml` command
     would verify every page in the manifest, Astro included. Deliberately NOT done in Batch A:
     the check has never been run against the real Astro output (this sandbox is egress-blocked
     from both Supabase and the deploy preview), and putting an unverified gate on the production
     deploy path risks blocking a deploy on a false positive — the checker had one on its first
     run, an `<html lang>` quoted inside an HTML comment. Run it once against a real full build
     first, then gate.
2. **Batch B (design):** 2.1 tokens/primitives → 2.2 landing → 2.3 pricing → 2.5 email skin.
3. **Batch C (SEO engine):** 1.1 guide infrastructure + first guide; 1.4 schema/internal links.
4. **Batch D (SEO ops):** 1.2 `.mcp.json` + routines + first keyword-research run; 1.5 decision.
5. **Batch E (growth loop):** 3.1 activation journeys + 3.2 server-side events.
