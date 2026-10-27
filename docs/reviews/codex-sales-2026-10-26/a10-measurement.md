## 1. Score: **2/5**

DeutschMeister can count accounts, usage and some revenue, but cannot reliably explain **which exposure produced a retained, profitable sale**. Useful foundations exist: consent controls, first-touch attribution, weekly snapshots and webhook-based revenue reconstruction. The missing piece is a reconciled journey connecting offer exposure, checkout, payment, refund and provider cost. The admin funnel explicitly marks payment as unavailable ([adminFunnelLib.mjs:19](/home/user/deutschmeister/netlify/functions/_shared/adminFunnelLib.mjs:19)). With 65 signups in 30 days, zero sales in seven days and €11.09 MRR, decisions based on incompatible denominators are commercially expensive relative to the business’s size ([FACTS:5–14](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:5)).

## 2. Findings, most important first

### 1. The funnel has observations at both ends, without a dependable connection

| Stage | What exists on main | Missing commercial evidence |
|---|---|---|
| Visitor | Consent-gated GA; SPA PostHog | Reconciled eligible visitor population |
| Signup | Server account timestamps; browser submit and confirmation events | Consistent acquisition cohort through payment |
| Offer | Astro visibility event | Server denominator, purchase availability and candidate qualification |
| Checkout | Browser intent/open/start events | Durable checkout attempt linked to exposure |
| Payment | Signed webhooks; purchases; subscription records | Exposure-to-payment join |
| Refund | Refund webhook payloads; access revocation | Refund-adjusted contribution by acquisition cohort |

Evidence: [events.js:30](/home/user/deutschmeister/src/data/events.js:30), [analytics.js:88](/home/user/deutschmeister/src/lib/analytics.js:88), [webhook:132](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:132), [checkout URL:79](/home/user/deutschmeister/src/config/lemonsqueezy.js:79).

A concrete defect compounds this: SPA `markCheckoutStarted(plan, amount)` stores those properties locally but emits `checkout_started` **without either property** ([funnelTracking.js:32](/home/user/deutschmeister/src/lib/funnelTracking.js:32)). Product-level abandonment therefore loses information already available.

**Root cause:** browser observations, mutable access records and financial facts evolved separately. Dividing this week’s purchases by this week’s signups is an activity ratio, not cohort conversion; the repository nevertheless recommends that proxy ([measurement.md:46](/home/user/deutschmeister/docs/redesign-2026-10/measurement.md:46)).

**Sales cost:** the founder cannot distinguish inadequate exposure, signup friction, checkout abandonment and offer rejection. The approved ≥300-view kill rule cannot responsibly run yet ([million plan:175](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:175)).

### 2. “Zero speaking cost” is the wrong interpretation of the column

FACTS reports eleven speaking users and `cost_cents = 0` over 30 days. However, this column records **the learner’s wallet charge**. Included sessions and placement set it to zero before provider calls; charged sessions debit the wallet ([speaking-session.mjs:214](/home/user/deutschmeister/netlify/functions/speaking-session.mjs:214), [reservation SQL:66](/home/user/deutschmeister/migrations/2026-10-22-speaking-reservations.sql:66)). Provider expense remains unknown.

Speaking separately calls transcription, speech synthesis and a language model; the helper returns text/audio without recording billing usage ([speakingAI.mjs:207](/home/user/deutschmeister/netlify/functions/_shared/speakingAI.mjs:207), [speakingAI.mjs:318](/home/user/deutschmeister/netlify/functions/_shared/speakingAI.mjs:318)).

X-Ray requests `max_tokens: 16000` with low effort; its comments describe thinking consuming that budget. Response handling extracts text and discards usage ([analyze-sentence.mjs:360](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:360), [analyze-sentence.mjs:415](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:415)). Low effort is not a measured euro ceiling.

**Margin illustration, not observed economics:** at the approved €149 pilot price, assume 19% VAT, 10% full refunds, fees of 6% + €0.50 per sale, €20 AI and €40 commission. Expected contribution is:

`149 / 1.19 × 0.90 − 9.44 − 20 − 40 = €43.25`

That excludes support and overhead. Actual fees, VAT mix and AI expense are **unverified**. A “high-margin digital product” claim is currently unjustified.

### 3. Consent creates an unknown sample—and an avoidable additional undercount

GA loads only after Accept; PostHog checks the same flag. Astro sends GA events, while PostHog runs in the SPA ([consent.js:42](/home/user/deutschmeister/public/consent.js:42), [analytics.js:34](/home/user/deutschmeister/src/lib/analytics.js:34), [track.js:3](/home/user/deutschmeister/astro-site/src/lib/track.js:3)). Acceptance coverage is unverified.

More seriously, Astro adds once-only events to `sent` **before checking consent**, and unobserves an offer before attempting transmission ([track.js:55](/home/user/deutschmeister/astro-site/src/lib/track.js:55), [track.js:123](/home/user/deutschmeister/astro-site/src/lib/track.js:123)). I reproduced: before Accept → false; same surface after Accept → false; new surface → true.

**Root cause:** observation deduplication occurs before measurement eligibility. Even visitors accepting on that page can lose their offer denominator.

The inspected mobile screenshots visibly show the consent banner. They establish presentation, not whether analytics requests actually obey consent.

### 4. Attribution is useful but cannot justify “campaigns do not work”

FACTS lists 165 untracked accounts, but its 60-day source buckets total **233**, versus 229 in the brief. The corresponding percentages are 70.8% and 72.1%; the denominator needs reconciliation ([FACTS:8](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:8)).

First touch is preserved. Signup metadata retains first-touch campaign but only the **source** of last touch ([attribution.js:150](/home/user/deutschmeister/public/attribution.js:150), [signup metadata:33](/home/user/deutschmeister/src/lib/attribution.js:33)). Someone arriving through Google and later using a campaign door can remain outside `signups_by_campaign_30d`, which groups first-touch campaign ([SQL:195](/home/user/deutschmeister/migrations/2026-09-20-acquisition-attribution.sql:195)).

The live homepage capture confirms a tagged door: “Create a free account” links to `ref=home&utm_medium=onsite&utm_content=hero` (`capture/site__home.md:48`). A tag is not an exposure count.

**Sales cost:** zero labelled signups establishes zero recorded first-touch campaign signups, not zero visitors or proven channel rejection. “Untracked” also cannot be relabelled “direct.”

### 5. X-Ray spikes are suspicious, but the supplied data cannot prove humans or bots

FACTS shows 1,591 and 1,826 rows in the weeks beginning September 14 and 21; October 12 shows 422 rows/403 IP hashes ([FACTS:22](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:22)).

`{"ref":"none","entry":"link"}` means no usable document referrer and a prefilled/link analysis. The SPA auto-runs `?s=` for callers it does not classify as crawlers. It proves neither a human click nor a direct visit ([xray.js:87](/home/user/deutschmeister/src/lib/xray.js:87), [SentenceXRay.jsx:381](/home/user/deutschmeister/src/pages/SentenceXRay.jsx:381)).

Historical code comments report 3,314/3,372 anonymous analyses matching grammar examples: strong supporting evidence for crawling, but a dated repository assertion, not a fresh forensic result ([xray.js:4](/home/user/deutschmeister/src/lib/xray.js:4)).

Current main enforces valid anonymous IDs, one analysis/day per ID, crawler-UA refusal and twelve/day per IP when salt exists. IDs are client-generated; UA classification is spoofable; absent salt skips IP protection. Atomic SQL improves concurrency, while missing-schema fallback counts then inserts separately ([handler:298](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:298), [reservation SQL:58](/home/user/deutschmeister/migrations/2026-10-22-ai-usage-reservations.sql:58)).

Crucially, failures delete usage rows, while cache hits retain them. Rows are neither provider-call counts nor people. Cache/reservation migrations are recorded as applied, but current deployment and settings remain unverified ([handler:152](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:152), [handler:342](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:342), [migration ledger:83](/home/user/deutschmeister/migrations/README.md:83)).

At an **assumed** €0.01–€0.10 per uncached call, September’s 3,417 rows represent €34–€342. That is sensitivity analysis, not an invoice estimate.

## 3. Sub-scores

| Question | Score | Evidence |
|---|---:|---|
| (a) Complete commercial funnel | **2/5** | Payment explicitly unavailable in the admin funnel: `adminFunnelLib.mjs:19`. |
| (b) Consent impact understood | **2/5** | Gating exists; late acceptance loses views: `track.js:55`. |
| (c) Attribution quality | **2/5** | First touch survives; last campaign does not: `src/lib/attribution.js:33`. |
| (d) AI economics | **1/5** | Wallet charge mistaken for provider expense: `speaking-session.mjs:215`. |
| (e) Bot/human discrimination | **2/5** | Heuristic classification and conditional IP ceiling: `analyze-sentence.mjs:270`. |
| (f) Server funnel/owner packet | **2/5** | Weekly storage exists, without commercial joins or costs: `weekly-truth.mjs:121`. |

## 4. Recommendations ranked by expected commercial return per hour

Incremental revenue is **unverified for every measurement change**. Ranking below reflects decision coverage and effort; assigning precise revenue uplift would invent evidence.

| Rank | Change and exact location | Expected effect; effort | Authority; measure/kill rule |
|---|---|---|---|
| 1 | Fix post-Accept observation in `astro-site/src/lib/track.js`; preserve plan/product in `src/lib/funnelTracking.js` | Recover existing observations; **2–3h**. Direct revenue effect unknown. | **[agents]**. Verify no pre-consent transmission; exactly one fresh eligible view after Accept; no historical replay. |
| 2 | Reconcile Monday money using `_shared/adminRevenueLib.mjs` inside `weekly-truth.mjs` | Prevent decisions based on grants, status counts or gross totals; **4–6h**. | **[agents]** for reporting. Require all provider orders/invoices accounted for; unexplained differences block commercial judgments. |
| 3 | Add the server journey and checkout connection described below | Makes the pilot’s ≥300-view decision usable; **10–14h** plus owner privacy review. At €149, each retained sale contributes €112.69 revenue after assumed VAT/refunds, before costs. | **[owner]**: new endpoint, consent and money integration. No kill clock until reconciliation passes. |
| 4 | Add provider ledger around X-Ray, `speakingAI.mjs`, writing/speaking evaluators and other AI handlers | Establish contribution and cost exposure; **10–14h**. Savings unknown. | **[agents]** instrumentation; **[owner]** for policies, budgets or limits. Reconcile invoices within 5%; unknown expense stays unknown. |
| 5 | Audit X-Ray bursts using existing usage and available request logs | Determine avoidable expense; **3–4h**. Historical sensitivity €34–€342/burst. | **[agents]** read-only analysis; **[owner]** for guard changes. Do not tighten quotas solely because IP counts look suspicious. |

### Minimum server-side design

**[owner]** Approve purpose, lawful basis, retention and notices before release. Server-side collection is not automatically consent-free. Terminal storage generally requires consent unless an exception applies; personal-data processing also requires a lawful basis ([TDDDG §25](https://www.gesetze-im-internet.de/ttdsg/__25.html), [GDPR Articles 5–7](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)). The existing attribution script’s “no cookie” justification does not itself establish an exemption (`public/attribution.js:15`).

Use three restricted tables; schema below is a proposal:

```text
funnel_events:
  event_id UUID PK, occurred_at, received_at, event_name,
  journey_id nullable, user_id nullable, checkout_attempt_id nullable,
  product_key, offer_version, source/medium/campaign/content,
  consent_version, qualification_version, dedupe_key UNIQUE

checkout_attempts:
  id UUID PK, user_id, journey_id nullable, product_key,
  offer_version, provider_checkout_id nullable, created_at, status

payment_facts:
  provider, object_type, object_id UNIQUE together,
  order_id, invoice_id, checkout_attempt_id nullable, user_id nullable,
  product_key, currency, paid_at, refund_updated_at,
  gross_minor, tax_minor, refunded_minor, refunded_tax_minor,
  fees_minor nullable, payout_minor nullable, test_mode
```

Hook consented landing/offer observations in both frontends; account creation/confirmation at authoritative server timestamps; checkout creation through a JWT-verified handler called by both checkout surfaces; payment/refund after signature verification. Pass an opaque checkout attempt reference through provider custom data and validate the association.

Keep operational account/payment totals separate from consented journey analytics. Declined visitors receive no persistent analytics identifier; request aggregates must be labelled **requests**, not unique qualified people. Never divide all payments by consented views.

Define qualification before launch: matching exam intent, purchasable offer, visible exposure and deduplication. Exclude test/staff traffic and identified automation; retain an “unknown automation” category. Preserve first touch and separate offer-touch attribution.

Restrict tables/RPCs to server access, with owner-reviewed RLS/grants. Allowlist labels; exclude email, learner text, click IDs, raw IP and full URLs. Propose 90-day behavioural retention, subject to owner review.

Add `ai_requests` with request/attempt/provider IDs, feature, model, outcome, cache hit, token/audio units, rate version, currency and nullable cost. Record failures and retries independently; avoid double-counting thinking already included in output billing.

### Exact weekly owner packet

**[agents]**, assembled in `weekly-truth.mjs`, stored before delivery as today ([weekly-truth.mjs:183](/home/user/deutschmeister/netlify/functions/weekly-truth.mjs:183)):

- UTC window, deployment/event-definition versions, freshness and reconciliation gaps.
- Eligible journeys → created accounts → confirmed accounts → qualified offer views → checkout attempts → unique paid buyers → retained buyers; counts and cohort conversion, split by product/source.
- Consent coverage, untracked share, unmatched payments and excluded/unknown automation.
- Gross collections, tax, refunds, retained revenue, fees, AI, acquisition/commission and contribution, separated by currency.
- Retained revenue per qualified journey; CAC per new retained buyer; contribution per owner-hour.
- Renewing paid subscriptions, at-risk subscriptions, collections and renewal cohorts—not merely `active` rows.
- AI cost by feature, anonymous/free/paid usage, cache savings, failures and invoice discrepancy; buyer cost P50/P95 with cohort age and sample size.
- Pilot exposure against ≥300; P95 AI against €20; explicit **insufficient evidence** status where appropriate.
- Owner minutes and at most three decisions.

Reuse existing revenue reconstruction: it already handles initial-payment duplication, refunds, tax and currencies ([adminRevenueLib.mjs:43](/home/user/deutschmeister/netlify/functions/_shared/adminRevenueLib.mjs:43)). Upgrade renewal deduplication from its subscription/day/total heuristic to provider invoice identity.

## 5. What remains unverified

The capture `INDEX.md` was absent and `capture/shots/` empty. I inspected the available homepage capture and both PNGs under `scratchpad/shots/`. Captures cannot verify event delivery.

Verify deployed consent behaviour with network traces for unset, declined, accepted and withdrawn states. Reconcile 229 versus 233 using one timestamped query. Compare payment facts with provider exports/payouts; inspect invoice-level AI usage. For X-Ray, compare timestamps, sentence repetition, UA classes and repeat identities—IP hashes alone cannot identify humans.

I disagree with the current evaluation’s claim that reach is already the binding constraint (`sales-evaluation-2026-10-26.md:44`): exposure versus conversion remains unresolved. Its five `active` subscriptions also do not mean five renewing payers; FACTS reports one. Its requirement for a reconciled server denominator is correct.

No files were changed.

