# Revenue plan — deutsch-meister.de → €10,000/month (milestone, not ceiling)

Adopted 2026-08-31. Owner decisions: 3-month horizon · ≤€300/mo ad budget · full
pricing/product freedom · all owner actions committed · **staged** approach
(weeks 1–4 fix conversion/copy/product, weeks 3+ open distribution) · all four
distribution channels created from zero and grown over time.

**Ownership:** the site belongs to the owner's brother in Jordan (domain, revenue,
ownership). No German/EU legal structuring in this plan. Lemon Squeezy is merchant
of record — the legal seller; it collects/remits EU VAT and handles consumer
billing, which is the right setup for a non-EU owner. The truth-in-advertising
test suites stay (jurisdiction-neutral; they protect the business anywhere).
Legal-page presentation is an owner decision, never a plan gate.

**Owner's thesis, adopted as the spine:** the site earned subscribers passively
with zero marketing while untouched for months — value is proven. The game is
(1) verify and raise the product's value, (2) maximize conversion and copywriting,
(3) distribution at scale to a worldwide audience (millions learn German; single
Facebook groups have ~2M members).

## Starting position (measured, Aug 2026)

€40/mo revenue (4 subs) · €9.99/mo / €79.99/yr · card-less 7-day trial ·
172 signups/mo with zero marketing · ~1,003 confirmed emails · 85% of signups
never open a lesson · activation emails built but OFF · English-marketed
(global-ready) · distribution channels: none exist yet.

## Is the product worth paying for?

**Yes — the library is deep; the *perceived* value at the moment of decision is
what's weak, and some features have never had a paying-user walkthrough.**

| Asset | State | Verdict |
|---|---|---|
| 64 grammar topics / 453 rules / 673 examples / 672 exercises, 8 CEFR levels | Complete, audited, German verified | Core value — real |
| AI speaking (STT→Claude→TTS), 64 missions | Works; 2 trial → 30/mo Pro; wallet half-built | Differentiator vs app competitors |
| Sentence X-Ray (case-colored analysis) | Works; 1/day free → 50/day Pro | **The "aha" moment** — underused in funnel & marketing |
| 480 listening dialogues + audio, 66 reading lessons, 24 podcasts, 1,935 words | Complete; discoverability was broken (fixed) | Value exists, invisible — surface it |
| Level test (80 questions) | Works; results persist | Best lead magnet on the site |
| Grammar example audio | **0/673** — TTS script exists, never run | Cheapest big value-add (owner runs script) |
| Free tier | Full A1.1 forever, no account | Generous top of funnel |

Week-1 product truth check: full paying-user walkthrough (signup → verify →
onboard → lesson → X-Ray → speaking → LS test-mode checkout → Pro → cancel) +
`scripts/evaluate-site.mjs` sweep; fix what breaks.

## The math

| Stream | Month-3 target | Revenue |
|---|---|---|
| Pro subscriptions (~€8.5 ARPU) | 300–450 active | €2,500–3,800 |
| telc B1 (+B2) Komplettvorbereitung, one-time €89 (launch €49–59) | 60–80 sales | €4,500–6,000 |
| Small offers (Modelltest-Paket; conditional wallet top-ups) | 30–50 | €600–1,200 |

Traffic goal: 172 → 1,500–2,500 signups/mo by month 3, distribution-driven.
Market anchor (researched 2026-08-31): telc B1 prep courses sell at €89–499
(DeutschAkademie €89–249; Sprachschule Aktiv €499) — €49–89 digital is
under-market. Honesty clause: low base, high variance; the gates below decide
scale-vs-fix; if month 3 lands at €3–5k the same machinery reaches €10k on a
5–6-month glide and keeps compounding.

## Lane 0 — Product truth check & value raise (week 1, then continuous)

1. E2E paying-user walkthrough + route sweep; fix breakage.
2. Owner: run `scripts/generate-example-audio.mjs` (0/673 → 673 with audio).
3. Shareable X-Ray result card — the product's built-in viral artifact (doubles
   as the social content format).
4. Surface listening/reading/speaking in the dashboard "today" flow.

## Lane 1 — Conversion & copywriting overhaul (weeks 1–4)

Direct-response rewrite of every money surface, inside the claims discipline:
1. Homepage + pricing: lead with the X-Ray artifact and the learner's
   job-to-be-done; benefit-led copy; honest proof (content counts, founder line).
2. **Onboarding → first lesson**: LevelTest results CTA into the first topic of
   the placed level; dashboard "continue" card for zero-lesson users. The 85%
   activation cliff is the biggest single conversion lever.
3. Email overhaul: welcome + trial day-3/6/8 + activation day-1/4 as one nurture
   arc; day-6 hardcoded €9.99 → derived from `pricing.js`; owner switches the
   activation sequence ON (migration + `LIFECYCLE_ACTIVATION_ENABLED=true`);
   owner fixes the Resend bounce job + dedicated sending domain (34% → 80%+
   confirmation).
4. Measurement: wire `trackCheckoutStarted/Completed`; owner verifies GSC.
   Card-at-trial: decided later, with data.

## Lane 2 — Premium offer: "telc B1 Komplettvorbereitung" (weeks 1–4)

4-week Prüfungsfahrplan over existing content + 90-day Pro window. €89 list,
€49–59 expiring launch code (never repricing the variant).
- Commerce: one-time LS product (store 309512); new `purchases` table
  (`product_key`, `lemonsqueezy_order_id` UNIQUE, `status`, `access_until`; RLS
  read-own, service-role writes); `lemonsqueezy-webhook.mjs` routes
  `order_created` by variant id → purchase + (if no active sub) a
  `{plan_type:'course', subscription_end: now+90d}` subscription row; new
  `order_refunded` case; course-row expiry appended to the daily
  trial-lifecycle run.
- Delivery: `PurchaseGuard.jsx` (clone of `SubscriptionGuard`); SPA route
  `/telc-b1-kurs` rendered from `src/data/programs/telcB1Komplett.js` +
  `program_progress` checkboxes.
- Sales page: `astro-site/src/pages/telc-b1-komplettvorbereitung.astro` on the
  guide-engine tokens (+ its `cp -r` line in `netlify.toml`, same PR); guest
  checkout for logged-out buyers; no outcome promises.
- Claims plumbing: `COURSE_TELC_B1_PRICE_EUR` in both `pricing.js` copies;
  extend `tests/claims.test.mjs`.
- Launch (week 4) to the ~1,003 list via `send-campaign.mjs` (add
  `exclude: ['subscribed','purchased']` first): 4 sends over 9 days —
  announcement → value → FAQ → genuine code expiry. No false scarcity.
  telc B2 clone in month 2 (pure data on the same rails).

## Lane 3 — Distribution engine (create from zero, weeks 2–12) — THE growth lane

One **daily content atom** feeds every channel: a German sentence, X-Ray'd
(case-colored breakdown + one insight + TTS audio). Agent produces; owner posts,
fronts, and grows the accounts.

| Channel | Build | Cadence |
|---|---|---|
| TikTok + Reels + Shorts (reach) | New accounts; faceless format: X-Ray visual + TTS + captions; repeatable template, batch-produced weekly | 1 clip/day (~90 by month 3); CTA: free level test / free A1.1 |
| Telegram (community) | New channel — replicate the proven MedMeister playbook (daily cards, native quizzes, humanization rules) | 1–2 posts/day; target 1–2k members by month 3; launches announced here |
| Facebook groups (borrowed audiences) | Owner's account in the big German-learning groups — value-first posts of the daily atom, no naked promo; own group later | 3–5 posts/wk |
| Reddit/forums (trust) | Genuinely helpful answers in r/German etc.; tools linked where rules allow | 2–3 answers/wk |

Product-led loop: the shareable X-Ray card is the same artifact users generate
and share themselves; the daily-sentence email doubles as the newsletter lead
magnet.

## Lane 4 — SEO + ads (continuous)

1. Modelltest sections on the four guides (`drafts/brief-modelltest.md`):
   telc-b1 first with the course CTA; owner verifies official PDF URLs first.
2. €300/mo Google Ads exact-match on the Modelltest terms → guide → offer, as a
   conversion-validation instrument (scale if CAC < ~€25/course sale).
3. More guides on DataForSEO-validated keywords; weekly measurement via the
   existing SEO routines once GSC is verified.
4. Cross-audience: MedMeister channels (pre-FSP doctors at B1/B2 = same buyers).

## 12-week schedule

| Week | Work | Owner |
|---|---|---|
| 1 | Product truth check + fixes; onboarding→lesson; checkout tracking; day-6 derived price; this plan committed | Resend fix + domain; activation migration + flag; GSC; example-audio script |
| 1–2 | `purchases` migration + webhook + PurchaseGuard; homepage/pricing copy rewrite | LS product, webhook event, env vars |
| 2–3 | Program module + `/telc-b1-kurs`; email arc rewrite; shareable X-Ray card; TikTok/Telegram accounts + first 14 atoms | Create channel accounts; review course schedule |
| 3–4 | Sales page + claims tests; telc-b1 `#modelltest` section; campaign exclusion filter; channels go live | Verify PDF URLs; approve copy; launch code |
| 4 | **Course launch** (4 emails / 9 days); daily posting running | Trigger sends; post daily |
| 5–6 | Remaining Modelltest sections; Google Ads live; FB playbook running; iterate clips | Fund ads; FB participation |
| 6–8 | Funnel iteration on real data; telc B2 clone; Telegram rituals; card-at-trial decision | Pricing decisions |
| 9–12 | Scale what works; conditional wallet top-ups; second campaign to non-buyers; DTZ course | — |

## Gates & kill/scale rules

- **Week 2**: confirmation rate >60% and activation emails sending — else the
  Resend fix escalates above everything email-dependent.
- **Week 4**: walkthrough clean + funnel instrumented → only then full posting
  cadence.
- **Week 5**: ≥20 course sales from the list (2%). <10 ⇒ offer/price problem —
  interview, reprice, reframe before ad spend.
- **Week 6**: ads CAC/course < €25 ⇒ scale to €300; > €50 ⇒ kill ads, keep SEO.
- **Week 8**: channel with >1k followers or >5% of signups ⇒ double down; flat
  after 6 weeks of consistent posting ⇒ change format, not channel. MRR + course
  run-rate ≥ €2,500/mo ⇒ on-plan; < €1,000 ⇒ say so plainly, switch to the
  5–6-month glidepath.
- Standing: no false scarcity, no outcome promises, no invented counts — the
  test suites enforce it and stay green on every PR.

## Beyond €10k

Everything compounds: content atoms become a library, channels become owned
audiences, courses replicate per exam (B2, DTZ, TestDaF, Goethe), the
subscription base grows with every cohort. The €10k architecture is the €50k
architecture — only traffic changes. Next layers once the engine runs: localized
funnels (AR/TR/RU-speaking learners), B2B (integration course providers), the
speaking wallet.

## Weekly log (append-only; measured figures with provenance)

| Date | Signups/wk | Active subs | Course sales | Revenue run-rate | Notes |
|---|---|---|---|---|---|
| 2026-08-31 | ~40 (baseline ≈172/mo) | 4 | — (no product yet) | ≈€40/mo | Plan adopted; baseline from Aug audits |
| 2026-08-31 (live) | **48** (≈206/mo pace) | **9** live paid periods | — | ≈€75–90/mo | Measured via Supabase connector: subs more than doubled since the Aug-16 audit with zero marketing — the passive-value thesis holds. Activation emails switched ON this day (migration + env flag; selection dry-checked: 1,371 new / 159 activated / 7 subscribed profiles, next run mails 6+10) |
