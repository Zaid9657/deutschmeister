# DeutschMeister — Full Site & Repo Evaluation (v2)

**Date:** 2026-08-16 · **Site:** deutsch-meister.de · **Repo:** Zaid9657/deutschmeister

**v2 is evidence-based, not code-reading.** What was actually done:

| Method | Coverage | Artifacts |
|---|---|---|
| Headless rendering of **38 routes** (desktop 1440px + mobile 390px) | Every public Astro page + every SPA route, incl. logged-out views of gated areas | 76 screenshots in `docs/evaluation/screenshots/`, `docs/evaluation/walkthrough.json` |
| **12 Lighthouse runs** (6 pages × mobile/desktop) against the full merged build | Homepage, pricing, grammar hub, grammar topic, telc-B1 guide, SPA shell | `docs/evaluation/lighthouse.json` |
| **Production database audit** (read-only SQL, aggregates only) | All 41 tables: coverage per level, data quality, exercise sanity, engagement funnel | queries in Appendix |
| Full local production build | SPA + all 83 Astro pages via the new `GRAMMAR_CONTENT_CACHE` (real content, offline) | reproducible: see Appendix |

The live site is egress-blocked from this sandbox, so rendering used the local merged
build (identical output to Netlify's). Lighthouse numbers are local — absolute values
flatter (no real network), but bundle weight, contrast, and structural findings transfer.

---

## Executive summary — what v2 found that v1 missed

1. **Fill-in-the-blank exercises on all 64 static grammar pages were unanswerable.**
   The exercise player showed only the English translation ("That is the man's car.")
   and asked for a German word (`des`) — the German cloze sentence
   ("Das ist das Auto ___ Mannes.") was never displayed. **Fixed in this PR.**
2. **`/listening/a1.1` (the sitemap's own URL format) rendered an empty exercise list.**
   Queries matched the lowercase URL level against uppercase DB values (`A1.1`) with
   `.eq`. Audio URLs had the same case bug against case-sensitive Storage folders.
   **Fixed in this PR.**
3. **The site has two brand identities.** Static pages: pink-gradient "D" mark,
   serif Cormorant headings, amber/rose CTAs. The app: teal/gold **"M" monogram**,
   different wordmark, different nav (see `speaking-desktop.jpg` vs `home-desktop.jpg`).
   A visitor who clicks from the homepage into any app page watches the brand change
   in front of them. In-app clicks on the logo or "Pricing" render *React* versions of
   the homepage/pricing — different design and copy from the Astro versions that
   full page loads serve. Two homepages, two pricing pages, two brands.
4. **The app shell is 1,045 KiB and scores Lighthouse perf 62 on mobile**
   (FCP 5.8s, LCP 6.9s, 477 KiB unused JS) while every Astro page scores 99–100
   (72–162 KiB, LCP ≤1.8s). Feature pages (level test, speaking, X-Ray — the
   conversion surfaces) all pay the SPA tax.
5. **When the network fails, `/speaking` is an infinite spinner and several pages go
   blank** — no error state, no retry, no timeout (`speaking-desktop.jpg`). A learner
   on a flaky connection sees a broken product.
6. **The funnel leaks in the middle.** Production data: 1,449 signups (172 in the last
   30 days) → **23 weekly-active** → 153 users have ever done a grammar lesson →
   **0 users have ever completed a listening or reading exercise** → 10 subscriptions
   ever, 4 active (≈0.3% conversion). Signup works; activation and engagement don't.
7. **Marketing claims disagree with each other and with the code.** X-Ray allowance:
   free-plan card says 1/day, the signup page promises 5/day, the code grants 10/day
   (trial) and 50/day (pro). The pricing CTA is German ("Jetzt starten") on an English
   page; the signup page is fully German while login is English.
8. **Content is strong but unevenly finished**: grammar is complete and consistent
   (64 topics, 8 per level — sampled German is correct and natural), but reading
   ranges from **1 lesson (B2.1)** to 16 (B1.2); rich "introduction" content exists
   for exactly 1 of 64 topics in its dedicated table; 49% of rules still contain
   ALL-CAPS shouting that a renderer has to suppress; all 433 fill-blank exercises
   accept exactly one spelling (no `acceptable_answers` anywhere).

---

## Scorecard

Measured = from this audit's instruments; scores assume this PR's fixes are deployed.

| Category | Score | Measured evidence |
|---|---:|---|
| Static site (Astro) quality | **9/10** | Lighthouse 99–100 perf / 96 a11y / 96 bp, 72–162 KiB pages, CLS 0. Grammar topic pages render 12–15K chars of real content. Weak spots: `lang="en"` on the German-labelled grammar hub pages, `color-contrast` flagged on every page. |
| App (SPA) quality | **5/10** | 1,045 KiB shell, mobile perf 62, FCP 5.8s; infinite-spinner/blank failure states; brand split vs static site; lemon.js loaded on every page. Solid: routing guards, error boundary, clean console in normal operation. |
| Content — grammar | **8/10** | 64/64 topics complete & evenly distributed (49–67 rules/level); exercises structurally perfect (0 missing answers, 0 dupes); sampled German correct. Deductions: caps in 222/453 rules, 1/64 rich intros, exact-match-only fill-blanks. |
| Content — other skills | **5/10** | Listening: 48 exercises + 480 dialogues + audio present, but **zero completions ever** (and lowercase URLs were broken). Reading: 52 lessons, 1–16 per level. Vocab 1,982 words, sentences 945, podcasts 24, videos 11. `scripts` table: dead (0 rows). |
| UX / design | **5/10** | Two brands, two homepages, two pricing pages; DE/EN mixing at high-intent moments (signup German, login English, German CTA on English pricing); pricing page switches to a dark theme no other page uses; good: clean layouts, mobile nav (fixed in v1), readable typography. |
| Conversion funnel | **4/10** | 0.3% all-time paid conversion; 23 WAU on 1,449 accounts; inconsistent feature claims; free tier generous (full A1.1 without signup) but the path from free → habit → paywall is unmanaged (no email nurture beyond one daily sentence; features that build habit — listening/reading — have zero usage). |
| Security | **8/10** | v1 remediation applied & verified in production (advisor 21 errors → 0). Remaining: rotate the exposed service-role key (**still open**), no rate limiting, anon X-Ray quota client-keyed. |
| SEO | **8/10** | v1 fixes live (og:image, slashes, hreflang, www, sitemap). Measured SEO 92–100. Remaining: grammar-hub `lang`, snippet/FAQ enrichment on 1/64 topics, SPA feature pages rank-limited by prerender-only content. |
| DevOps / repeatability | **7/10** | CI (lint, functions, SPA build) + this PR adds offline Astro builds via content cache and repeatable audit scripts. Still zero tests. |
| **Overall** | **6.3/10** | The static/SEO layer is now excellent; the product core (app UX, engagement loop, funnel coherence) is where the site actually loses users. |

---

## Route-by-route (38 routes rendered)

Every route was loaded at two viewports; numbers from `walkthrough.json`. "Text" =
visible characters (a proxy for real content). Console errors from blocked external
hosts (fonts/analytics — sandbox artifacts) are excluded here.

### Static (Astro) pages — all healthy

| Route | Status | Text | Verdict |
|---|---|---:|---|
| `/` | 200 | 3.8K | Strong hero + clear CTAs; stats band is German on an English page; social-proof numbers hardcoded ("Stand: Mai 2026") |
| `/pricing/` | 200 | 2.2K | Sudden dark theme (only page); German CTA "Jetzt starten" on English page; claims vs code mismatch (X-Ray 1/day vs 50/day pro) |
| `/grammar/` | 200 | 5.5K | Good hub; German H1 ("Deutsche Grammatik") under `lang="en"` |
| `/grammar/{a1.1,a2.1,b1.1,b2.2}/` | 200 | ~1.4K | Clean level pages; same `lang` issue; descriptions truncate on cards |
| `/grammar/a1.1/nouns-gender/` | 200 | 15.5K | Flagship page: intro, tables, examples with word-breakdowns, exercises, FAQ — genuinely good |
| `/grammar/a2.1/dative-case/` | 200 | 12.9K | Same quality; "WHY YOU NEED THIS" callouts work well |
| `/grammar/b1.1/konjunktiv-ii-wurde/` | 200 | 14.8K | ✓ |
| `/grammar/b2.2/modal-particles/` | 200 | 15.3K | ✓ |
| `/vergleich/` + `/vergleich/duolingo/` | 200 | 1.2–3.8K | Solid German comparison content, correct `lang="de"` |
| `/leitfaden/telc-b1/` | 200 | 12.6K | Best top-of-funnel asset on the site; SEO 100 |
| `/privacy/`, `/impressum/` | 200 | 2.7K/1K | Drafts render correctly (noindex); Impressum placeholders pending |
| `/definitely-not-a-page` | **404** | 0.7K | Real 404 with recovery links ✓ |

### SPA routes — where the problems live

| Route | Renders (logged-out, network ok/fail) | Verdict |
|---|---|---|
| `/speaking` | **Infinite spinner on network failure; no error state** | Conversion feature with a blank failure mode |
| `/level-test` | Hero + CTA render statically ✓ | Good prerender; the 1 MiB shell drags mobile perf to 62 |
| `/analyze` | X-Ray hero renders ✓ | ✓ |
| `/podcasts` | List renders from prerender ✓ | ✓ |
| `/listening`, `/reading`, `/vocabulary`, `/video-library` | Hubs render; content areas empty/blank on fetch failure with no message | Resilience gap on all four |
| `/listening/a1.1` (lowercase, sitemap format) | **Empty exercise list** (case bug — fixed this PR) | Was silently broken for every deep-link visitor |
| `/intro` | Renders ✓ | Orphaned page — nothing links to it |
| `/login` | "Welcome Back" (EN) ✓ | English |
| `/signup` | "Kostenlos starten" (DE) ✓ | German — same flow, opposite language; **navbar shows the "M" logo while the form shows the "D" logo on one screen** |
| `/faq`, `/ueber-uns` | German content under `lang="en"` | Language signal mismatch |
| `/dashboard` `/profile` `/subscription` `/onboarding` | Redirect to login ✓ | Correct gating |
| `/vergleich/unknown-app` | Redirects to hub ✓ | Correct fallback |

---

## Measured performance (Lighthouse, local build)

| Page | Preset | Perf | A11y | BP | SEO | FCP | LCP | Transfer |
|---|---|---:|---:|---:|---:|---|---|---|
| `/` (Astro) | mobile | 100 | 96 | 96 | 92 | 1.1s | 1.4s | 82 KiB |
| `/pricing/` | mobile | 100 | 96 | 96 | 92 | 1.1s | 1.4s | 72 KiB |
| `/grammar/` | mobile | 100 | 96 | 96 | 92 | 1.2s | 1.5s | 94 KiB |
| `/grammar/a1.1/nouns-gender/` | mobile | 99 | 96 | 96 | 92 | 1.5s | 1.8s | 162 KiB |
| `/leitfaden/telc-b1/` | mobile | 100 | 96 | 96 | 100 | 1.2s | 1.5s | 101 KiB |
| **`/level-test` (SPA shell)** | **mobile** | **62** | 96 | 96 | 100 | **5.8s** | **6.9s** | **1,045 KiB** |
| `/level-test` (SPA shell) | desktop | 95 | 96 | 96 | 100 | 1.0s | 1.3s | 1,045 KiB |

Consistent flags across pages: `color-contrast` (the slate-400/500 text), ~30 KiB
unused CSS per page, and on the SPA shell **477 KiB unused JavaScript**. The SPA loads
`lemon.js` (Lemon Squeezy) on every page including non-commerce ones.

**Biggest wins, in order:** (1) route-level code-splitting already exists — the shell
still pulls 372 KiB `index.js` + all three vendor chunks up front; audit what's in the
entry. (2) Load lemon.js only on pricing/subscription surfaces. (3) Fix contrast
tokens once in Tailwind config (slate-400 → slate-500/600 on white).

---

## Content audit (production data)

### Coverage

| Level | Grammar topics | Rules | Examples | Exercises | Reading | Listening | Words | Sentences |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A1.1 | 8 | 49 | 78 | 77 | 3 | 6 | 232 | 120 |
| A1.2 | 8 | 65 | 99 | 99 | 4 | 6 | 250 | 120 |
| A2.1 | 8 | 67 | 99 | 99 | 5 | 6 | 250 | 120 |
| A2.2 | 8 | 53 | 78 | 78 | 6 | 6 | 250 | 120 |
| B1.1 | 8 | 57 | 85 | 85 | 7 | 6 | 250 | 120 |
| B1.2 | 8 | 57 | 85 | 85 | **16** | 6 | 250 | 120 |
| B2.1 | 8 | 54 | 78 | 78 | **1** | 6 | 250 | 120 |
| B2.2 | 8 | 51 | 71 | 71 | 10 | 6 | 250 | 105 |
| **Σ** | **64** | **453** | **673** | **672** | **52** | **48** | **1,982** | **945** |

Plus: 480 listening dialogues (audio confirmed in Storage), 24 podcasts (all with
audio), 11 videos, 8 speaking missions, 80 paragraphs. `scripts` table: 0 rows (dead).

### Quality findings

| Finding | Number | Impact |
|---|---|---|
| Rules containing ALL-CAPS runs | **222 / 453 (49%)** | Source data shouts; `RichText.astro` suppresses it at render time — fix the data, retire the normalizer |
| Topics with rich intro content (`grammar_introductions`) | **1 / 64** | The SPA's 5-stage lesson intro stage starves for 63 topics; a full intro block *does* exist inside `rules` (rule_type `introduction`, 64/64) — two competing systems |
| `related_slugs` populated | **0 / 64** | Relationship graph lives only in `astro-site/src/lib/relatedTopics.js` |
| Fill-blank exercises with `acceptable_answers` | **0 / 433** | One exact spelling accepted; "dem Mann" vs "dem  Mann" or missing capital = wrong |
| MC exercises with structural defects | **0 / 239** | Answers always in options, no dupes, ≥2 options — clean |
| Examples with `word_breakdown` | 673/673 | ✓ complete |
| Examples with audio | **0 / 673** | `audio_url` column entirely unused — grammar examples are silent |
| Sampled German (8 examples + 5 exercises) | 0 errors | Correct, natural, level-appropriate |
| Rule structure | 12 rule_types; tables 176, tips 60, memory tricks 176 | Well-structured pedagogy in the data model |

### Engagement (the numbers that matter)

| Metric | Value |
|---|---|
| Accounts all-time / confirmed | 1,449 / 1,003 |
| Signups last 30 days | 172 |
| **Active last 7 days** | **23 (1.6% of accounts)** |
| Users who ever did a grammar lesson | 153 (571 progress rows) |
| Users who ever completed a listening exercise | **0** |
| Users who ever completed a reading lesson | **0** |
| Speaking sessions / evaluations | 18 / 162 |
| X-Ray analyses | 323 |
| Subscriptions all-time / active | 10 / **4** |

**Reading of the funnel:** acquisition works (172 signups/mo with 8 grammar topics free),
but ~85% of signups never touch a lesson, two of the four skill pillars have literally
zero usage, and week-1 retention is the cliff. The daily-sentence email is the only
retention mechanism. Priorities this suggests: onboarding into a first lesson
(not a dashboard), surfacing listening/reading (now that lowercase URLs work),
and a real activation email sequence — before any more acquisition spend.

---

## Bugs found by this audit

| # | Bug | Status |
|---|---|---|
| B-01 | Static grammar pages: exercises showed `question_en` only — fill-blanks lacked the German sentence containing the blank | **Fixed** (`astro-site/src/components/ExercisePlayer.jsx`) |
| B-02 | `/listening/<lowercase-level>` → empty list (`.eq` vs uppercase DB); audio URL case vs Storage | **Fixed** (`src/hooks/useListening.js`, `src/utils/listeningHelpers.js`) |
| B-03 | `/speaking` infinite spinner / feature pages blank on network failure — no error states | Open — needs an error/retry pattern across data hooks |
| B-04 | Two brands (M vs D), two homepages, two pricing pages depending on navigation type | Open — product decision needed (unify on one identity) |
| B-05 | Claim inconsistencies: X-Ray 1 vs 5 vs 10/50 per day; DE/EN mixing in auth + pricing CTA | Open — pick one language per surface, one source of truth for limits |
| B-06 | `lang="en"` on German-labelled grammar hub/level pages | Open (one-line fixes in 2 Astro files) |
| B-07 | `/intro` orphaned (no inbound links); `scripts` table dead | Open — delete or wire up |
| B-08 | lemon.js injected on every SPA page | Open — load on demand |

---

## Previously found & fixed (v1, merged in PR #13)

Kept for the record; full details in that PR. Function security (open email relay,
public all-users blast, transcript forgery, fail-closed secrets, opt-outs), database
security applied & verified in production (RLS on 13 unprotected tables, self-grant-Pro
closed, `webhook_logs`/`xray_usage` locked, wallet RPC revoked — Supabase advisor
21 errors → 0), the mock-checkout route removal, Netlify env fixes (service-role key
mis-stored under a `PUBLIC_` name — corrected; **rotation still pending, do it**),
consent-gated PostHog, report-only CSP, og:image/hreflang/slashes/www SEO fixes,
mobile nav, skip link, draft legal pages.

**Still requires a human:** rotate the service-role key · fill Impressum placeholders
and de-noindex legal pages after review · promote CSP after a clean report window ·
mark Netlify secrets as secret values · enable Supabase leaked-password protection.

---

## Roadmap, re-ranked by this audit's evidence

1. **Activation & retention loop** (B-03 + funnel data): error states with retry on all
   data hooks; onboarding that lands users in lesson 1 of their level, not a dashboard;
   an activation email sequence (day 1/3/7) on top of the daily sentence.
2. **One brand, one homepage, one pricing page** (B-04/B-05): kill the M/D split,
   make in-app "/" and "/pricing" links full-page loads (or port the Astro design in),
   reconcile every numeric claim with `speakingUsage.mjs`/`analyze-sentence.mjs` limits.
3. **SPA bundle diet** (perf 62 → 85+): entry-chunk audit, defer lemon.js, defer
   vendor-supabase for anonymous visitors.
4. **Content completion**: reading for B2.1/A1.x (1–4 lessons is a hole vs 16 at B1.2);
   `acceptable_answers` for the 433 fill-blanks (accept case/umlaut variants);
   de-CAPS the 222 rules at the source; pick ONE intro system (populate
   `grammar_introductions` or drop the table); populate `related_slugs`.
5. **Listening/reading resurrection**: they're built, stocked (480 dialogues with
   audio!) and unused — surface them on the dashboard and in the grammar flow
   ("practice this topic by ear"), now that lowercase links work.
6. **Audio for grammar examples** (0/673): the TTS pipeline already exists for
   speaking; batch-generate example audio into Storage and fill `audio_url`.
7. **SEO content**: extend `topicSeo.js` FAQ/snippet enrichment from 1 → 64 topics;
   more `leitfaden/` guides (the telc-B1 pattern measurably works — SEO 100).
8. Everything still open from v1: rate limiting, tests, CORS consolidation,
   subscription-aware RLS, promote CSP.

---

## Appendix — reproduce this audit

```bash
# Full offline build (content cache produced via scripts/dump-grammar-cache.mjs
# or any Supabase-reachable environment):
npm run build
cd astro-site && GRAMMAR_CONTENT_CACHE=../.cache/grammar-content-cache.json npm run build && cd ..
# …then the netlify.toml copy steps (see README), then:

npm i --no-save playwright
node scripts/evaluate-site.mjs          # 38 routes → screenshots + walkthrough.json
CHROME_PATH=… node scripts/lighthouse-batch.mjs   # 12 runs → lighthouse.json
```

Content-audit SQL (read-only, aggregates): per-level `count(*)` joins over
`grammar_topics/rules/examples/exercises`, `reading_lessons`, `listening_exercises`,
`words`, `sentences`; quality probes: `content::text ~ '[A-ZÄÖÜ]{4,}'`,
`options @> to_jsonb(correct_answer)`, `jsonb_array_length(options) < 2`,
`acceptable_answers IS NULL`, `word_breakdown IS NULL`; engagement:
`auth.users` counts, `user_*_progress` distinct users, `subscriptions` by status;
storage check: `storage.objects WHERE bucket_id='audio'`.
