# DeutschMeister — Repo & Website Evaluation

**Date:** 2026-08-16 · **Scope:** full repository + the deutsch-meister.de site it produces
(hybrid Vite/React SPA + Astro 5 static site, 15 Netlify functions, Supabase, Lemon Squeezy).

Statuses reference the enhancement PR this file ships in. **Before** scores describe the repo
as found; **after** scores assume this PR is merged *and* the manual steps below are done.

---

## 🔴 Do this first: rotate the Supabase service-role key

`PUBLIC_SUPABASE_ANON_KEY` in Netlify held the **service-role key** — byte-identical to
`SUPABASE_SERVICE_ROLE_KEY`. That key bypasses every RLS policy in the database.
`PUBLIC_*` variables are compiled into client output by Astro, so it sat one client-side
import away from being published to every visitor, and its prefix was printed into build
logs. It has been corrected to the real anon key (verified: the value now carries
`"role":"anon"`), but **the key must be assumed compromised and rotated**:

Supabase Dashboard → Project Settings → API → *Rotate* the `service_role` key, then update
`SUPABASE_SERVICE_ROLE_KEY` in Netlify. Nothing else needs the old value.

## ✅ Already done (applied and verified against production)

- **RLS hardening applied** to project `omqyueddktqeyrrqvnyq` — both files in `migrations/`
  are a record of changes that are already live, not a to-do.
- **Netlify config fixed**: `PUBLIC_SUPABASE_ANON_KEY` corrected; `CAMPAIGN_SECRET` created
  (it did not exist, so `/api/send-campaign` returned 500); `VITE_POSTHOG_HOST` corrected
  from a dashboard URL (`us.posthog.com/project/443299/home`) to the ingest host
  `https://us.i.posthog.com`, which is why PostHog was not receiving events.
- `UNSUB_SECRET` confirmed present, so the fail-closed email changes are safe to deploy.

Verified as the `anon` role after the changes: `subscriptions`, `webhook_logs`,
`xray_usage`, `payment_failures` and `mastery_*` all return **0 rows**; paid
reading/listening return 0 while free-tier (a1.1) still works; grammar still returns all
**64 topics** so the Astro build is unaffected; `DELETE`/`UPDATE` against the catalogue now
affect **0 rows**. A simulated self-grant-Pro attack left `is_subscribed = false`,
`subscription_tier = 'free'` and 0 subscription rows. The service role can still write, so
the Lemon Squeezy webhook keeps working. Supabase security advisor: **21 ERROR-level
findings → 0**.

## ⚠️ Still requires a human

1. **Rotate the service-role key** (above) — the only urgent item.
2. **Review the draft `/privacy/` and `/impressum/` pages**, fill in the Impressum address
   placeholders (§5 DDG), then remove `noindex` and the draft banners.
3. **Watch CSP reports** for a couple of weeks, then promote
   `Content-Security-Policy-Report-Only` to enforcing in `netlify.toml`.
4. **Mark secrets as secret** in Netlify: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
   `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET`,
   `GEMINI_API_KEY`, `UNSUB_SECRET` are all stored unmasked (`is_secret: false`).
5. **Enable leaked-password protection** (Supabase Auth → Passwords) — currently off.
6. Re-test the flows in `migrations/README.md` (signup, purchase, anonymous grammar,
   a1.1 reading/listening, X-Ray, speaking).

---

## Scores

| Category | Before | After | Rationale |
|---|---:|---:|---|
| Architecture | 7/10 | 7/10 | The SPA+Astro merge is genuinely clever and well-commented, and the static takeover of SEO routes is the right call. Cost: a 600-char build one-liner, a manually-synced route allow-list in three places, and two React runtimes shipped. Unchanged by this PR (documented in README instead). |
| Security | 2/10 | 8/10 | Worse than first assessed: a service-role key stored under a `PUBLIC_` name, RLS disabled outright on 13 tables (catalogue publicly deletable), two unauthenticated email endpoints, self-grantable Pro, forgeable AI evaluations, `'changeme'` HMAC fallback, no CSP. All now fixed and verified in production (advisor: 21 errors → 0). Remaining: rotate the exposed key, no rate limiting, anon X-Ray quota still client-keyed. |
| SEO | 5/10 | 8/10 | Strong foundations (static pages, sitemaps, JSON-LD, IndexNow, llms.txt) undermined by a broken og:image on every static page, 301 hops on internal links, wrong `lang`, self-conflicting hreflang, a 404ing sitemap entry, and an indexable duplicate shell. All fixed. Remaining: FAQ/snippet enrichment covers 1 of 64 grammar topics. |
| Performance | 6/10 | 7/10 | Grammar pages ship one small React island — excellent. Astro pages had render-blocking fonts (fixed). Remaining: no image pipeline/dimensions in Astro, two full vendor bundles across SPA+islands, `getAllTopics()` refetched per page at build. |
| Accessibility | 4/10 | 7/10 | Mobile visitors had **no navigation at all** on static pages; no skip link, no focus styles, colour-only exercise feedback. All fixed. Remaining: low-contrast slate-400 text, modal focus traps in the SPA, icon-only buttons. |
| Legal/compliance | 2/10 | 6/10 | Cookie banner linked to a nonexistent privacy policy; no Impressum (§5 DDG) for a German-market commercial site; PostHog ran without consent while GA waited for it; campaign emails ignored opt-outs and lacked unsubscribe links. Drafts + consent gating + opt-outs shipped; owner legal review still required. |
| Code quality | 5/10 | 6/10 | Clean, well-commented code in places (webhook, auth helper, ErrorBoundary) but 1500-line pages, duplicated renderers/data/templates/CORS preambles, dead files, and zero typing. This PR adds lint + drift checks and removes dead code; the refactors are roadmap. |
| Content | 8/10 | 8/10 | 64 DB-backed grammar topics, a genuinely strong telc-B1 guide, comparisons, podcasts. The DB data is messy enough to need four renderer-side normalizers — fixing data beats maintaining them. |
| DevOps | 2/10 | 6/10 | No README, no CI, no tests, no lint, loose SQL contradicting `.gitignore`. This PR adds README, CI (lint + function syntax + SPA build), lint config, `.env.example`, and a migrations convention. Tests remain zero. |
| **Overall** | **4.3/10** | **7.1/10** | Weighted toward security, SEO, and legal — the categories that gate a commercial launch. |

---

## Issues found

Severity: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low
Status: ✅ fixed in this PR · 🔶 migration/manual step provided · 🗺 roadmap

### Security

| ID | Sev | Issue | Where | Status |
|---|---|---|---|---|
| S-00 | 🔴 | **`PUBLIC_SUPABASE_ANON_KEY` held the service-role key** (identical to `SUPABASE_SERVICE_ROLE_KEY`), which bypasses all RLS. `PUBLIC_*` vars are compiled into Astro client output, and the prefix was logged during builds | Netlify env vars, `astro-site/src/lib/supabase.js` | ✅ corrected to the anon key — **but rotate the old key** |
| S-0A | 🔴 | **RLS was disabled entirely on 13 tables** while `anon` held INSERT/UPDATE/DELETE — the whole course catalogue was publicly destroyable, and `payment_failures` / `mastery_purchases` publicly readable | `grammar*`, `sentences`, `words`, `mastery_*`, `payment_failures` | ✅ applied + verified |
| S-0B | 🟠 | `debit_speaking_wallet` (SECURITY DEFINER, moves wallet balances) was callable by anon/authenticated over `/rest/v1/rpc/`, bypassing server-side pricing | Supabase RPC | ✅ EXECUTE revoked |
| S-01 | 🔴 | `/api/send-daily-test?email=X` was an unauthenticated open relay sending DeutschMeister-branded mail (own DKIM) to any address | `netlify/functions/send-daily-test.mjs` | ✅ secret-gated; owner-only without secret |
| S-02 | 🔴 | `/api/daily-sentence` publicly triggerable send-to-ALL-users blast; `?secret=` documented but never checked | `netlify/functions/daily-sentence.mjs` | ✅ scheduler-marker or secret required; 401 otherwise |
| S-03 | 🔴 | RLS lets any user INSERT/UPDATE their own `subscriptions` row and `profiles.is_subscribed` → self-grant Pro from the browser console | `supabase-subscription-schema.sql:21-46` | 🔶 `migrations/2026-08-16-fix-rls-security.sql` |
| S-04 | 🔴 | `evaluate-speaking` graded a client-supplied transcript though the authentic one exists in `speaking_messages` → score forgery + prompt injection into the grader | `netlify/functions/evaluate-speaking.mjs` | ✅ transcript loaded server-side; client only as fallback |
| S-05 | 🟠 | `speaking-turn` accepted unbounded `audioBase64` and arbitrary client `history` straight into the LLM | `netlify/functions/speaking-turn.mjs` | ✅ 10 MB cap; history truncated 40×5000 |
| S-06 | 🟠 | `'changeme'` fallback HMAC secret made unsubscribe tokens forgeable if env unset | `unsubscribe.mjs`, `daily-sentence.mjs`, `send-daily-test.mjs` | ✅ fail closed |
| S-07 | 🟠 | All paid reading/listening content SELECT-open to `anon`; paywall client-side only | `fix-anon-access-free-tier.sql` | 🔶 anon narrowed to a1.1 in migration (grammar stays public by design — Astro build + SEO pages) |
| S-08 | 🟠 | `webhook_logs` RLS `USING (true) WITH CHECK (true)` exposed raw Lemon Squeezy payloads (emails, order data) to any client | `fix-subscription-schema.sql:39` | 🔶 deny-all in migration |
| S-09 | 🟠 | `xray_usage` readable/insertable for all anonymous rows incl. submitted sentences | `create-xray-usage-table.sql` | 🔶 own-rows-only in migration |
| S-10 | 🟠 | `send-campaign` ignored opt-outs and sent without unsubscribe links (GDPR/CAN-SPAM) | `netlify/functions/send-campaign.mjs` | ✅ opt-out filter + HMAC unsubscribe footer |
| S-11 | 🟠 | No Content-Security-Policy at all | `netlify.toml` | ✅ Report-Only added; 🗺 promote to enforcing |
| S-12 | 🟡 | `error.message` leaked to clients in three functions | `analyze-sentence`, `check-speaking-usage`, `evaluate-speaking` | ✅ generic bodies |
| S-13 | 🟡 | Anonymous X-Ray quota keyed on client-generated `anonymousId` — trivially reset for unmetered Claude spend | `analyze-sentence.mjs` | 🗺 needs IP-hash secondary key (privacy/proxy design) |
| S-14 | 🟡 | No rate limiting on any endpoint | all functions | 🗺 |
| S-15 | 🟡 | Supabase anon key + admin email hardcoded in source; client-side admin check | `src/utils/supabase.js`, `AdminVideosPage.jsx` | 🗺 env-drive the key; server-side admin role |

### SEO

| ID | Sev | Issue | Where | Status |
|---|---|---|---|---|
| SEO-01 | 🔴 | Default og:image `/og-default.png` does not exist → broken social preview on **every** static page | `Layout.astro:16` | ✅ real `/og-image.png` + dimensions |
| SEO-02 | 🟠 | `trailingSlash: 'always'` but internal links slash-less → 301 hop on nearly every in-site link | Astro pages/layout | ✅ |
| SEO-03 | 🟠 | `lang="en"` hardcoded on German pages; hreflang self-referential/conflicting; `og:locale` malformed | `Layout.astro`, `SEO.jsx` | ✅ lang prop, hreflang removed, en_US/de_DE |
| SEO-04 | 🟠 | `/app.html` (raw SPA shell) indexable duplicate of every prerendered route | build output | ✅ robots.txt + X-Robots-Tag |
| SEO-05 | 🟡 | `sitemap-spa.xml` listed 404ing `/sentences` and duplicated `/pricing/` | `public/sitemap-spa.xml` | ✅ |
| SEO-06 | 🟡 | Homepage `SearchAction` schema targeted nonexistent `/search` | `index.astro` | ✅ removed |
| SEO-07 | 🟡 | www/apex split: IndexNow pinged `www.` while canonicals are apex; no www redirect | `ping-indexnow.mjs`, `netlify.toml` | ✅ apex everywhere + forced 301 |
| SEO-08 | 🟡 | FAQ/snippet enrichment (`topicSeo.js`) covers 1 of 64 grammar topics | `astro-site/src/lib/topicSeo.js` | 🗺 highest-leverage content task |
| SEO-09 | ⚪ | No `lastmod` in sitemaps; stale hardcoded `datePublished` on vergleich/leitfaden; no Course/LearningResource schema | various | 🗺 |
| SEO-10 | ⚪ | Prerendered SPA copy is hand-mirrored from React components — drift risk | `scripts/prerender-spa-routes.mjs` | 🗺 (documented in README) |

### Performance

| ID | Sev | Issue | Where | Status |
|---|---|---|---|---|
| P-01 | 🟠 | Render-blocking Google Fonts stylesheet on all Astro pages (SPA had the preload pattern) | `Layout.astro` | ✅ preload pattern |
| P-02 | 🟡 | No image pipeline in Astro; no width/height/lazy anywhere in the Astro tree | `astro-site/` | 🗺 |
| P-03 | 🟡 | `getAllTopics()` re-fetched inside each of 64 topic-page builds; build hard-fails on any Supabase hiccup | `astro-site/src/lib/grammar.js` | 🗺 build-time cache |
| P-04 | ⚪ | Two React runtimes ship (SPA vendor bundle + Astro islands); no HTML cache header | build | 🗺 |

### Accessibility

| ID | Sev | Issue | Where | Status |
|---|---|---|---|---|
| A-01 | 🔴 | Mobile nav on all static pages contained **zero navigation links** (only Log in/Start) | `Layout.astro` | ✅ pure-HTML `<details>` menu |
| A-02 | 🟠 | No skip link, no `:focus-visible` styles anywhere | `Layout.astro` | ✅ |
| A-03 | 🟠 | Exercise feedback colour-only; no live region, no pressed state | `ExercisePlayer.jsx` | ✅ aria-live + aria-pressed + sr-only text |
| A-04 | 🟡 | Low-contrast slate-400/500 body text; icon-only buttons; modals without focus traps; consent dialog doesn't move focus | SPA + Astro | 🗺 |

### Functional / revenue

| ID | Sev | Issue | Where | Status |
|---|---|---|---|---|
| F-01 | 🔴 | **`/payment/:planType` was a live fake checkout.** It collected card number, expiry and CVC, validated them client-side only, waited 1500 ms to "simulate payment processing", then granted a real subscription — no money taken. Nothing in the UI linked to it (the real flow opens Lemon Squeezy), but the route was served by `netlify.toml` and `App.jsx`, so anyone reaching the URL got Pro free. | `src/pages/PaymentPage.jsx`, `netlify.toml`, `App.jsx` | ✅ removed (page, route, redirect rule) along with the now-orphaned client-side `createSubscription()` grant path |
| F-02 | 🟡 | `VITE_POSTHOG_HOST` pointed at a dashboard URL, not the ingest host, so product analytics were silently not recording | Netlify env vars | ✅ corrected |
| F-03 | 🟡 | `CAMPAIGN_SECRET` was never set, so `/api/send-campaign` always returned 500 | Netlify env vars | ✅ created |

### Legal / compliance

| ID | Sev | Issue | Where | Status |
|---|---|---|---|---|
| L-01 | 🔴 | Cookie banner linked to `/privacy` — a 404. No privacy policy existed at all | `public/consent.js` | ✅ draft `/privacy/` page (owner review required) |
| L-02 | 🔴 | No Impressum — §5 DDG obligation for a commercial German-market site | — | ✅ draft `/impressum/` with placeholders (owner must complete) |
| L-03 | 🟠 | PostHog initialized without consent while GA was consent-gated | `src/lib/analytics.js` | ✅ same consent gate + banner text updated |
| L-04 | 🟠 | Campaign emails without opt-out honoring or unsubscribe link | `send-campaign.mjs` | ✅ (see S-10) |

### Code quality / DevOps

| ID | Sev | Issue | Where | Status |
|---|---|---|---|---|
| Q-01 | 🟠 | No README, no CI, no tests, no lint config, no root `.env.example` | repo | ✅ all but tests; 🗺 tests |
| Q-02 | 🟡 | `.gitignore` listed `*.sql` while 11 SQL files were tracked; no migrations convention | repo root | ✅ + `migrations/` |
| Q-03 | 🟡 | Byte-identical `competitorComparisons.js` in SPA and Astro with nothing preventing drift | `src/data/`, `astro-site/src/data/` | ✅ CI drift check (single-source is 🗺) |
| Q-04 | 🟡 | Dead code: unreferenced `daily-sentences.json` in src; `getSubscriptionTier()` ignores its argument | various | ✅ file removed; 🗺 webhook cleanup |
| Q-05 | 🟡 | ~20-line CORS/preflight preamble copy-pasted into 13 functions; Supabase init duplicated 8× | `netlify/functions/` | 🗺 consolidation refactor |
| Q-06 | 🟡 | 1502-line `GrammarLessonPage.jsx`, 761-line `LandingPage.jsx`; grammar rule rendering implemented twice (SPA + Astro) | `src/pages/`, `astro-site/` | 🗺 |
| Q-07 | ⚪ | Dormant `de` i18n bundle pinned to `lng: 'en'`; React 18 with `@astrojs/react` v4 (expects 19) version skew; stray `ansi-regex` direct dep | various | 🗺 |
| Q-08 | ⚪ | DB data quality forces four renderer-side normalizers (ALL-CAPS, word order, option shapes, breakdown shapes); `related_slugs` column empty, graph lives in code | DB + renderers | 🗺 fix data at source |

---

## Roadmap (deliberately not in this PR)

Ordered by value-for-effort:

1. **Grammar FAQ/snippet enrichment for the remaining 63 topics** (`topicSeo.js`) — the
   proven pattern exists for `a1.1/nouns-gender`; this is the biggest organic-traffic lever.
2. **Rate limiting** (Netlify rate-limit rules or an edge function) for the AI endpoints,
   plus an IP-hash secondary key on the anonymous X-Ray quota (S-13/S-14).
3. **Tests**: start with the pure logic — quota math in `_shared/speakingUsage.mjs`,
   webhook event handling, exercise-option normalization in `lib/grammar.js`.
4. **Server-side speaking history**: rebuild the conversation from `speaking_messages`
   in `speaking-turn` instead of trusting the client copy.
5. **Shared function helpers**: one CORS/preflight helper + one Supabase init in
   `_shared/`, adopted function-by-function as they're touched.
6. **Promote CSP to enforcing** after a clean report-only period; drop `X-XSS-Protection`
   (obsolete) at the same time.
7. **Astro image pipeline** (`astro:assets`) + build-time topic cache; single-source the
   comparison data.
8. **Subscription-aware RLS** for reading/listening beyond the anon/free-tier split.
9. **Fix DB content at the source** (caps, word order, option shapes) and retire the
   four renderer-side normalizers; populate `related_slugs` and drop `relatedTopics.js`.
10. **Refactor `GrammarLessonPage.jsx`** into stage components; decide the fate of the
    dormant i18n `de` bundle (ship a switcher or delete it).

---

*Generated as part of the evaluation-and-enhancement PR on branch
`claude/deutschmeister-eval-enhance-uc8d35`. Method: full repo exploration (all source,
functions, SQL, build scripts), local SPA build + lint verification, and a compile-level
Astro build check. The live site was not reachable from the sandbox; all site-level
findings derive from the code that produces it.*
