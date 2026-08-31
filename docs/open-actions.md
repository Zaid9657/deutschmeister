# Open actions — consolidated tracker

Every still-open item across the report corpus, in one place, each with its source
document and how long it has been open. **This file is an index, not a source of truth:
if it disagrees with a source document or the code, the source wins — then fix this file.**

Rule: any commit that closes, obsoletes, or reclassifies an item here updates this file
in the same commit. Last full reconciliation: **2026-08-31** (from `REMEDIATION.md`,
`docs/medmeister-parity-roadmap.md`, `docs/seo-routines/README.md`,
`drafts/seo-CORRECTION-2026-08-24.md`, `drafts/seo-audit-2026-08-24.md`, the two Class-B
drafts, and `migrations/README.md`).

## 1 · Owner-only (not code)

| # | Item | Source | Open since |
|---|---|---|---|
| O-1 | **Rotate the exposed Supabase service-role key** | `REMEDIATION.md` §Still open; `EVALUATION.md` | 2026-08-16 |
| O-2 | Enable Supabase leaked-password protection | `REMEDIATION.md` §Still open | 2026-08-16 |
| O-3 | **Fill the Impressum** (real operator data, §5 DDG) and de-noindex `/privacy/` + `/impressum/` after legal review | `AUDIT-2026-08-16.md` A-10; `REMEDIATION.md` | 2026-08-16 |
| O-4 | **Fix the upstream Resend bounce job at source** (MedMeister automation mailing a dead address ~190/day; suppression only stops the damage) | `AUDIT-2026-08-16.md` A-07; `REMEDIATION.md` | 2026-08-16 |
| O-5 | **Decide card-at-trial-start** — the structural conversion blocker (trial takes no card; the roadmap calls this the highest-leverage single decision) | `REMEDIATION.md` §Still open; roadmap §3.6 | 2026-08-17 |
| O-6 | **GSC property**: confirm which Google account owns the verified `deutsch-meister.de` Search Console property (verification files are already deployed) and grant the service account access. Until then both SEO Routines run without impressions/clicks/position/URL-Inspection data | `docs/seo-routines/README.md`; `drafts/seo-CORRECTION-2026-08-24.md` | 2026-08-24 (reclassified; connector work opened 08-22) |
| O-7 | **Activate the activation-lifecycle mailer**: apply `migrations/2026-08-22-activation-lifecycle.sql`, dry-run against the canary list (`?dry=1`, `LIFECYCLE_TEST_RECIPIENTS`), then set `LIFECYCLE_ACTIVATION_ENABLED=true` | roadmap §3.1 (Batch E) | 2026-08-22 |
| O-8 | Run `scripts/generate-example-audio.mjs` with an OpenAI key — 0/673 grammar examples have audio; the script exists and is resumable | `AUDIT-2026-08-16.md` P2; roadmap §3.4 | 2026-08-16 |
| O-9 | `REVOKE EXECUTE` on `public.notify_welcome_email()` from `anon`/`authenticated` | `AUDIT-2026-08-16.md` §Owner-only | 2026-08-16 |
| O-10 | Move `pg_net` out of the `public` schema (needs a coordinated trigger update) | `AUDIT-2026-08-16.md`; `REMEDIATION.md` | 2026-08-16 |
| O-11 | Create the two SEO Routines from the bootstrap texts — only after O-6, or their GSC halves write BLOCKED every run (`geo-weekly` can run degraded on DataForSEO alone since the 08-24 amendment) | `docs/seo-routines/README.md` | 2026-08-22 |
| O-12 | **E-E-A-T identity**: supply a real author name, precise qualification, and one verifiable `sameAs` URL; decide whether `/ueber-uns` becomes a real Astro page or stays a noindex utility page | `drafts/eeat-author-identity.md` (Class B) | 2026-08-24 |
| O-13 | Verify the official telc/Goethe Modelltest PDF download URLs (vendor domains are proxy-blocked from agent sessions) before the Modelltest cluster ships | `drafts/brief-modelltest.md` (Class B) | 2026-08-24 |
| O-14 | Get the `/vergleich/` vendor domains (duolingo, babbel, lingoda) allowlisted so competitor pricing can be re-verified — the "Stand: Mai 2026" stamp must never advance unchecked (§6 UWG), and stale-page citation eligibility degrades from ~November | `drafts/seo-audit-2026-08-24.md` §Roadmap 6 | 2026-08-24 |

## 2 · Product decisions needed (then small code)

| # | Item | Source | Since |
|---|---|---|---|
| D-1 | **SPA shell on 22+ crawlable URLs with no noindex and no canonical** (`/faq`, `/ueber-uns`, `/vocabulary`, `/level/*`, …). Either prerender `/faq` + `/ueber-uns` properly (three-place treatment) or accept them noindex and reconsider the 87 footer links | `drafts/seo-audit-2026-08-24.md` §Needs your decision | 2026-08-24 |
| D-2 | `/speaking/` renders a sign-in wall to anonymous visitors (~25 words of unique content at sitemap priority 0.9) — needs real above-the-gate copy like `/analyze/` has | same, §Class B | 2026-08-24 |
| D-3 | `Offer.priceValidUntil` on `/pricing/` — a pricing commitment through a date; owner's call | same | 2026-08-24 |
| D-4 | Bilingual URL strategy (one language per page vs `/en/` split with reciprocal hreflang) — gates whether future guides are written once or twice | roadmap §1.5 | 2026-08-22 |
| D-5 | Promote CSP from Report-Only to enforcing — only after a clean report window review | `EVALUATION.md`; standing note | 2026-08-16 |

## 3 · Engineering backlog (no decision blocking)

| # | Item | Source | Since |
|---|---|---|---|
| E-1 | **One head registry** (`src/data/seoRoutes.js`): six prerendered routes each own two copies of their titles (`prerender-spa-routes.mjs` + `src/pages/*.jsx`); the drift guard detects, a registry prevents | `drafts/seo-audit-2026-08-24.md` §Roadmap 1; roadmap comparison table | 2026-08-24 |
| E-2 | One `Organization` JSON-LD entity with an `@id` — currently declared five different ways across both build trees | same, §Roadmap 2 | 2026-08-24 |
| E-3 | Remove the SPA's dead second grammar corpus: `src/App.jsx` still routes `/grammar/:level/:topicSlug` to SPA components Netlify never serves (same "two copies, one dead" shape as the deleted `LandingPage.jsx` and `TelcB1Page.jsx`) | same, §Roadmap 3 | 2026-08-24 |
| E-4 | Accurate `lastmod`/`dateModified` for the 64 grammar pages (all claim the build date; needs `updated_at` selected in `grammar.js`) | same, §Roadmap 4 | 2026-08-24 |
| E-5 | The **Modelltest cluster** content (≈5,830/mo, competition median ~8; extend the existing guides; Class B; order: telc-b1 → telc-b2 → goethe-b1 → dtz) — after O-13 | `drafts/brief-modelltest.md` | 2026-08-24 |
| E-6 | Brand ratchet remainder: `MAX_RETIRED_STOP_FILES` = **10** files (level/listening components; account, grammar, X-Ray, subscription, video-library screens) — lower the ceiling with each migration | `tests/brand.test.mjs`; roadmap Batch F | 2026-08-22 |
| E-7 | `src/components/LevelTest/LevelTest.css` token migration — 1,765 class-scoped lines on one conversion route; **needs a visual check alongside**, deliberately deferred as its own task | roadmap Batch F close | 2026-08-22 |
| E-8 | Thin prerendered SPA routes (37–297 body words) — `/analyze/` first (the unique asset) | `drafts/seo-audit-2026-08-24.md` §Roadmap 7 | 2026-08-24 |
| E-9 | More guides (Goethe B2, TestDaF, "B1 in drei Monaten") — now keyword-validatable via DataForSEO before writing | roadmap Batch C close; `seo-CORRECTION-2026-08-24.md` | 2026-08-22 |
| E-10 | Content completion: reading depth beyond 8/level where warranted; pick ONE grammar-intro system (`grammar_introductions` table vs `rules` introduction type); real `acceptable_answers` for genuine synonyms | `EVALUATION.md` roadmap; roadmap §3.4 | 2026-08-16 |
| E-11 | Fix root `README.md` drift (lint policy, CI description, quality-gates list, audit pointer) — the four rows are enumerated in `docs/reports-assessment-2026-08-31.md` §2 | this assessment | 2026-08-31 |
| E-12 | Test/CI depth: route-consistency test for the three-place rule, level-case boundary test (no component/E2E tests exist yet) | roadmap §3.3 | 2026-08-22 |
| E-13 | Drop the dead `scripts` DB table (0 rows, no code references) | `EVALUATION.md` B-07 note | 2026-08-16 |

## 4 · Discrepancies to verify before working (do not trust either side yet)

| # | Conflict | The two sources |
|---|---|---|
| V-1 | **De-CAPS of shouting grammar rules**: applied 2026-08-16 (270 rows, 892 edits) per `migrations/README.md` — yet roadmap §3.4 (2026-08-22) still lists "de-CAPS the 222 rules at source" as open. Query the DB (`content::text ~ '[A-ZÄÖÜ]{4,}'`) and close whichever is wrong here + in JOURNAL | `migrations/README.md` vs roadmap §3.4 |
| V-2 | **`related_slugs`**: populated for all 64 topics per the same 08-16 migration; EVALUATION measured 0/64 the same day; Batch D later corrected the roadmap to "column is a preferred override, falls back to the code map". Verify the column state before anyone re-populates it | `migrations/README.md` vs `EVALUATION.md` |
