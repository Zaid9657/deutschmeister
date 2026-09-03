# Open actions — consolidated tracker

Every still-open item across the report corpus, in one place, each with its source
document and how long it has been open. **This file is an index, not a source of truth:
if it disagrees with a source document or the code, the source wins — then fix this file.**

Rule: any commit that closes, obsoletes, or reclassifies an item here updates this file
in the same commit. Last full reconciliation: **2026-08-31** (from `REMEDIATION.md`,
`docs/medmeister-parity-roadmap.md`, `docs/seo-routines/README.md`,
`drafts/seo-CORRECTION-2026-08-24.md`, `drafts/seo-audit-2026-08-24.md`, the two Class-B
drafts, and `migrations/README.md`). Partial reconciliation 2026-09-03 against the code (E-6, E-7 closed) —
see `docs/HANDOFF-2026-09-03.md` for measured state.

## 1 · Owner-only (not code)

| # | Item | Source | Open since |
|---|---|---|---|
| O-1 | **Rotate the exposed Supabase service-role key** | `REMEDIATION.md` §Still open; `EVALUATION.md` | 2026-08-16 |
| O-2 | Enable Supabase leaked-password protection | `REMEDIATION.md` §Still open | 2026-08-16 |
| O-3 | **Fill the Impressum** (real operator data, §5 DDG) and de-noindex `/privacy/` + `/impressum/` after legal review | `AUDIT-2026-08-16.md` A-10; `REMEDIATION.md` | 2026-08-16 |
| O-4 | **Fix the upstream Resend bounce job at source** — re-measured 2026-08-31 via the Resend connector: **the storm appears over.** The last ~15 sends (MedMeister lifecycle + DeutschMeister welcome/confirmation) are all `delivered`; recent bounce suppressions are ordinary bad addresses (typos), not the dead-address loop; no `emailinbo.live` traffic visible. Also: **`deutsch-meister.de` is already a verified Resend sending domain** (sending enabled since 2026-03-09), so the dedicated-domain item is done. Keep monitoring the confirmation rate for the week-2 gate rather than treating this as an emergency | `AUDIT-2026-08-16.md` A-07; measured 2026-08-31 | 2026-08-16 |
| O-5 | **Decide card-at-trial-start** — the structural conversion blocker (trial takes no card; the roadmap calls this the highest-leverage single decision) | `REMEDIATION.md` §Still open; roadmap §3.6 | 2026-08-17 |
| O-6 | **GSC property**: confirm which Google account owns the verified `deutsch-meister.de` Search Console property (verification files are already deployed) and grant the service account access. Until then both SEO Routines run without impressions/clicks/position/URL-Inspection data | `docs/seo-routines/README.md`; `drafts/seo-CORRECTION-2026-08-24.md` | 2026-08-24 (reclassified; connector work opened 08-22) |
| O-7 | ~~Activate the activation-lifecycle mailer~~ — **DONE 2026-08-31, fully via connectors**: migration applied (Supabase), selection dry-checked in SQL (1,371 new / 159 activated / 7 subscribed; next run mails 6 d1 + 10 d4), `LIFECYCLE_ACTIVATION_ENABLED=true` set in Netlify (production, functions scope). First live run: next 09:30 UTC — check the function log once | roadmap §3.1 (Batch E) | closed 2026-08-31 |
| O-8 | Run `scripts/generate-example-audio.mjs` with an OpenAI key — 0/673 grammar examples have audio; the script exists and is resumable | `AUDIT-2026-08-16.md` P2; roadmap §3.4 | 2026-08-16 |
| O-9 | `REVOKE EXECUTE` on `public.notify_welcome_email()` from `anon`/`authenticated` | `AUDIT-2026-08-16.md` §Owner-only | 2026-08-16 |
| O-10 | Move `pg_net` out of the `public` schema (needs a coordinated trigger update) | `AUDIT-2026-08-16.md`; `REMEDIATION.md` | 2026-08-16 |
| O-11 | Create the two SEO Routines from the bootstrap texts — only after O-6, or their GSC halves write BLOCKED every run (`geo-weekly` can run degraded on DataForSEO alone since the 08-24 amendment) | `docs/seo-routines/README.md` | 2026-08-22 |
| O-12 | **E-E-A-T identity**: supply a real author name, precise qualification, and one verifiable `sameAs` URL; decide whether `/ueber-uns` becomes a real Astro page or stays a noindex utility page | `drafts/eeat-author-identity.md` (Class B) | 2026-08-24 |
| O-13 | Verify the official telc/Goethe Modelltest PDF download URLs (vendor domains are proxy-blocked from agent sessions) before the Modelltest cluster ships | `drafts/brief-modelltest.md` (Class B) | 2026-08-24 |
| O-15 | **Course go-live** (revenue plan Lane 2) — nearly done 2026-08-31: purchases migration ✅ applied; LS product ✅ created via Claude in Chrome (product 1329566, **numeric variant 2077984** for webhook routing, checkout UUID `0875bbbb-c936-41e3-af85-d43f9be5556a`); all 8 webhook events ✅ incl. `order_refunded`; Netlify env vars set by the agent (numeric → `LEMONSQUEEZY_TELC_B1_VARIANT_ID` functions scope; UUID → `VITE_…`/`PUBLIC_…` builds). **Remaining:** finish the START49 discount in the LS dashboard (draft may exist at discounts/1117757 — set expiry 2026-09-14, restrict to the product, save) and verify €89→€49 at checkout; tax category left at store default (owner's tax call). Checkout goes live on the next production deploy (merge of PR #30) | `docs/revenue-plan-2026-08-31.md` | 2026-08-31 |
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
| E-6 | ~~Brand ratchet remainder~~ — **DONE**: `MAX_RETIRED_STOP_FILES` and `MAX_LEGACY_CTA_FILES` are both **0** in `tests/brand.test.mjs`; the retired palette is fully migrated | `tests/brand.test.mjs`; roadmap Batch F | closed by 2026-09-03 |
| E-7 | ~~`LevelTest.css` token migration~~ — **DONE**: the file is deleted; `src/index.css` is the SPA's only stylesheet | roadmap Batch F close | closed by 2026-09-03 |
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
