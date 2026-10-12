# Review brief for Codex: deutsch-meister.de, path to €10,000 profit a month

You are reviewing a live German-learning business in this repository (`/home/user/deutschmeister`), as a
senior direct-response offer strategist and growth engineer. Claude (Anthropic) is running an
independent review of the same brief; afterwards the two of you will cross-examine each other. So
work independently and be specific: we need your own view, not a consensus guess.

**Rules**
- Read-only. Do not modify any file.
- Verify what you can in the code; cite `path:line` for every claim about the site.
- The facts in §2 come from the production database (you cannot query it); treat them as measured.
  If anything in this brief contradicts the code, say so in §10.
- Money-first and blunt. No generic advice ("improve SEO", "add social proof") without the concrete
  move, where it goes, and what it should change in numbers.
- Respect §7 (constraints). If you recommend crossing one (e.g. a guarantee), say so explicitly and
  give compliant wording.

## 1. The goal and the owner
- **Goal:** the website able to make **€10,000 profit per month**. The owner believes it can, but
  that things must change.
- **Owner:** a solo founder, a physician working in Germany (Blue Card), building this on the side.
  Very limited time and energy. Prefers shipping the ugly version this week over perfect next quarter,
  and distribution over polish. Any human-delivered component must be minimal or outsourceable.
- **Stack:** Astro static site (`astro-site/`) for `/`, `/pricing/`, `/courses/**`, `/grammar/**`,
  `/leitfaden/*`, `/pruefung/*`, `/vergleich/*`; Vite/React SPA (`src/`) for the app; Netlify
  functions (`netlify/functions/`); Supabase; Lemon Squeezy (merchant of record) for payments.
  Read `CLAUDE.md` first — it is the project map.

## 2. Measured facts (production, 2026-10-11 unless dated)

**Revenue**
- MRR €32.97 from 3 paying Pro subscribers (2 more are past-due / cancelled in grace).
- **Every paid order ever** (`webhook_logs`, `order_created`): 12 Pro Monthly first orders, all
  €9.99 net: 03-10, 05-21, 05-23, 06-03, 06-27, 07-10, 07-11, 07-13, 08-15, 08-17, 08-26, 08-27.
  **None since 2026-08-27.** One €0.00 owner test (a €49 course) on 09-03.
- **The store is tax-exclusive** (`tax_inclusive=false` on every order): buyers pay the shown price
  **plus** VAT at checkout. German buyers paid €11.89 for the "€9.99" plan (19%); others paid
  €11.09 (11%), €11.19 (12%) or €9.99 (0%). The site shows €9.99 / €40 / €50 / €89 everywhere.
- **0 real one-time course or ticket sales, ever.** The only `purchases` rows are 2 €0 owner tests.
- Lifetime paid revenue ≈ €200 (18 payments incl. renewals; 42 failed payments).

**Signups per week** (Mon-start weeks, `auth.users`; confirmed in brackets)

| Week | Signups | Week | Signups |
|---|---|---|---|
| 05-25 | 55 (39) | 08-03 | 37 (11) |
| 06-01 | 55 (47) | 08-10 | 32 (18) |
| 06-08 | 62 (38) | 08-17 | 35 (22) |
| 06-15 | 33 (23) | 08-24 | 45 (20) |
| 06-22 | 48 (34) | 08-31 | 55 (29) |
| 06-29 | 39 (25) | 09-07 | 46 (29) |
| 07-06 | 44 (30) | 09-14 | 22 (17) |
| 07-13 | 45 (30) | 09-21 | 31 (23) |
| 07-20 | 32 (16) | 09-28 | 16 (15) |
| 07-27 | 47 (18) | 10-05 | 10 (8) — week to Sun 10-11 |

- Accounts: ~1,700 total, **1,165 confirmed**. ~32% never confirm their email.
- Attribution (since 09-20): Google-attributed signups steady at ~12–13/week; "untracked"
  (direct/homepage) fell from 15 to 3 per week. Untagged homepage signups: 22 in the 10.6 days before
  the 10-04 redesign, 1 in the 6.9 days after (the redesign removed the hero signup link; it was
  put back on 10-11, commit 62af951).
- Of 70 recent signups who named a goal, **41 named B1**. 1,632 of 1,686 profiles sit on the A1 default.

**Conversion and activation**
- 0 of 181 trials converted in September (7-day trial, no card, every level open).
- Signup → first lesson ≈ 10% (Aug 10.3%, Sep 10.1%). September cohort: 147 signups → 95 confirmed →
  84 finished onboarding → 15 ever touched a lesson.
- Rebuilt A1.1 course (the flagship): in the 14 days to 10-05, Lektion 1 started 7 times, finished 0.

**Traffic and distribution**
- Site visits are not measurable from here (GA4 consent-gated; Search Console not connected).
- SEO (09-22): 22 ranked keywords, 0 of 20 target queries in the top 30, ~11 referring domains.
- Social: Instagram 0, Facebook 2, YouTube 7 followers; 0 signups from social. No Telegram channel yet.
- Email: ~1,100 confirmed accounts never sold to. A launch email is blocked on a recorded consent
  basis (§7 UWG) — the owner has not decided.

**Costs:** Lemon Squeezy 5% + $0.50 per order (+1.5% international cards, +1.5% PayPal). AI cost per
user is not measured (OpenAI/Azure for speaking, writing, X-Ray). Hosting is small.

## 3. What is sold today (verify in code)
- `src/data/pricing.js`, `src/data/offers.js`, `src/data/marketing.js` (byte-identical twins in
  `astro-site/src/data/`); `astro-site/src/pages/pricing.astro`; `astro-site/src/pages/index.astro`
  + `astro-site/src/data/homepage.js`; `astro-site/src/components/linie/*`;
  `astro-site/src/pages/courses/`; `astro-site/src/pages/telc-b1-komplettvorbereitung.astro`;
  `src/pages/SubscriptionPage.jsx`; `src/contexts/SubscriptionContext.jsx`.
- Free: A1.1 course without an account; grammar rule text of all levels; X-Ray 1/day.
- 7-day trial on signup, no card: every level, mock exams; AI capped (X-Ray 10/day, speaking 2 total,
  writing 2 total).
- Pro: €9.99/month or €79.99/year — all 8 levels, "30 AI speaking sessions a month", "20 writing
  corrections a month", 50 X-Ray/day, mock exams.
- Level tickets (one-time, "yours to keep", + 3 months of Pro): A1.2 €40, A2.1 €50, A2.2 €50.
  B1.1–B2.2 listed at €60/€65 but **not buyable** ("Im Bau · coming soon").
- telc B1 Komplettvorbereitung: €89 one-time (20-day plan + 3 months Pro), guest checkout.
- Six mock exams exist (Start Deutsch 1, Goethe A2, telc B1, Goethe B1, DTZ, telc B2 —
  `src/data/mockExams/`), plus exam guides (`astro-site/src/data/guides/`) and exam hubs
  (`astro-site/src/pages/pruefung/`).
- No guarantee, no testimonials, no urgency, no bonuses — **enforced by tests**:
  `tests/offers.test.mjs` (approx. lines 100–107) and `tests/refund-claims.test.mjs`. The FAQ refund
  answer is "Write to support … the request will be reviewed" (`src/data/faqContent.js`).

## 4. Timeline of changes (facts)
- 03-08: Pro €9.99/€79.99 launched; 03-17 7-day no-card trial on signup.
- 04-04/06: sales pages rewritten (hero, comparison table, urgency section, pricing CTA above fold).
- 05-28: email-verification gate; FAQ "7 Tage Geld-zurück-Garantie"; learner-count social proof.
- 07-18: homepage + pricing moved to Astro, copied verbatim: "MOST POPULAR", "cheaper than a coffee",
  trust row "Secure Payment · Cancel Anytime · 7-Day Money Back", objections block, learner counts,
  four "Start Your Free Trial" links, Pro price cards on the homepage.
- **08-22 (#21): pricing + homepage rebuilt ("8 levels. One price." / "German grammar you can see.").**
  Removed: MOST POPULAR, the money-back/secure/cancel row, objections, coffee line, social proof,
  urgency block with price cards, every in-body signup link. (Some removed claims were untrue —
  "Unlimited", unsourced counts.) Last paid subscription: 08-27.
- 08-31: telc B1 course €89. 09-01: exam-first homepage.
- **09-03: one-time level courses become "the product"; Pro becomes "the AI add-on".** Grammar
  exercises above A1.1 locked. 09-08: per-sub-level prices; B1/B2 "coming soon".
- September purchase-path bugs (all fixed later): a signed-out Buy never reached checkout
  (09-03 → 10-05); sub-level buy intents dropped (09-08 → 09-28); "Start 7-day Pro trial" button
  opened a paid checkout (09-14 → 09-30); `/subscription` falsely said every plan had a trial.
- 09-13: owner paused the A1.2 rebuild ("only create A1.1").
- **10-04 (#181, #184): "Die Linie" redesign** — levels sold as one-time "tickets" on a transit-line
  metaphor; no signup link on the first screen; truth rules (no testimonials, counts, most popular,
  refund promise).
- 10-05 (#186): FAQ money-back guarantee removed; a test bans refund promises.
- 10-07: non-blocking "save progress" signup ask after the first answer in a lesson.
- 10-11 (#201): "Create a free account" put back in the hero.

## 5. Funnel facts (verify)
- Signup: 3 fields (email, password, confirm password), no Google/social login, no magic link
  (`src/pages/SignupPage.jsx`, `src/contexts/AuthContext.jsx`). Email confirmation is mandatory
  before any account feature **and before buying** (`src/components/EmailVerificationGate.jsx`).
- Signed-out Buy: stores `localStorage dm_buy_intent` → `/signup` → confirm email (same browser
  required) → `/login` → `/subscription?buy=<key>` opens checkout (`src/lib/buyIntent.js`,
  `astro-site/src/components/CourseCheckout.astro`).
- Exam doors (`/modelltest/*`, the A1.1 Abschlusstest, `/schreiben`) send anonymous visitors to
  `/login` ("Welcome Back"), not signup (`src/components/ExamSubscriptionGuard.jsx`).
- Anonymous level lock shows no price and no Buy (`src/components/LockedContentOverlay.jsx`).
- Level-test results offer no product for the placed level (`src/pages/LevelTest*`).
- A1.1 completion: "The next level is a paused draft…" (`src/pages/CourseCompletePage.jsx`).
- Every in-app upgrade prompt and the trial emails sell only Pro at €9.99
  (`netlify/functions/trial-lifecycle.mjs`, `src/components/TrialBanner.jsx`).

## 6. Known defects (verify)
- An order whose variant is not mapped to a course falls into the subscription path, logs a warning
  and returns 200 — the customer pays and gets nothing (`netlify/functions/lemonsqueezy-webhook.mjs`
  ~lines 308–334). The functions-scope course variant ids are unconfirmed in production.
- Ticket owners lose `/dashboard` and `/profile` after their 90-day Pro window
  (`src/components/SubscriptionGuard.jsx` uses trial/subscription only).
- Copy vs server: "30 AI speaking sessions a month" vs 2 free 5-minute sessions per day for Pro and an
  un-toppable wallet (`netlify/functions/speaking-session.mjs`); "7 days of Pro" vs trial caps; the
  day-6 trial email promises "50 analyses a day" while trial users get 10.

## 7. Constraints
- German consumer law: §5 UWG (no misleading claims — outcome promises, fake scarcity, unsourced
  counts), §7 UWG (marketing email needs consent), PAngV (consumers must see the total price incl.
  VAT; strike-through prices only against a real prior price). Guarantees are fine if the terms are
  clear and honoured.
- Lemon Squeezy products, prices, discounts and redirect URLs are created only in the LS dashboard
  (owner action); the code maps variant ids from env vars.
- The course speaks "Sie". Only A1.1 is built to the new course standard; A1.2 is a paused draft;
  B1/B2 courses are not built (older grammar/reading/listening content exists for all levels).
- The repo's truth rules were set by the owner's agents; the owner can overrule them.

## 8. Framework to apply: Alex Hormozi, *$100M Offers*
- **Market first:** a "starving crowd" — massive pain, purchasing power, easy to target, growing.
- **Value equation:** Value = (Dream Outcome × Perceived Likelihood of Achievement) ÷ (Perceived Time
  Delay × Perceived Effort & Sacrifice). Score each lever 1–10.
- **Pricing:** escape commodity comparison (here: Babbel/Duolingo/Busuu at ~€10/month); charge for
  the outcome; the virtuous cycle of premium price → more delivery budget → better results.
- **Grand slam offer, 5 steps:** (1) dream outcome; (2) every problem/obstacle before, during and after;
  (3) turn each into a solution; (4) delivery vehicles (DIY / done-with-you / done-for-you; 1:1 / group;
  sync / async); (5) trim (high cost, low value) and stack.
- **Enhancers:** scarcity, urgency (honest ones only), bonuses (each solves an objection, named,
  valued), guarantees (unconditional, conditional, anti-, implied/performance; "service guarantee":
  we keep helping until you get the result), naming (MAGIC: Magnetic reason, Announce avatar, Give a
  goal, Indicate a time interval, Complete with a container word).

## 9. What to deliver (Markdown, these headings, in this order)
1. **Bottom line** — 5 lines max: can the site reach €10k profit/month, what must be true, the one move
   that matters most.
2. **Why sales stopped** — rank the causes by evidence; say what is proven vs inferred.
3. **Value-equation scorecard** — table: free A1.1, trial, Pro, level ticket, telc B1 €89 × the four
   levers (1–10) + one line on the weakest lever of each.
4. **Grand slam offer(s)** — 1–2 designs. For each: avatar and starving-crowd check; dream outcome;
   the problem→solution list; delivery vehicles (what already exists in the repo vs what must be built,
   with file paths); the stack with each item's perceived value and delivery cost; price and why;
   guarantee; honest scarcity/urgency; bonuses; MAGIC name (German).
5. **Price ladder** — free → entry → core → premium; what happens to Pro and the €40–50 tickets.
6. **Guarantees** — 2–3 options with exact German wording + conditions + legal risk notes.
7. **Friction: top 10** — ranked by money impact; `path:line`; the concrete fix; effort (S/M/L).
8. **Copy** — rewrites in German (and English where the page is English): homepage hero (H1, sub, CTA),
   pricing headline + card, one lock screen, the trial day-6 email subject + first lines.
9. **The €10k math** — explicit assumptions (price, net per sale after VAT/fees, conversion rates,
   traffic, list launch), a month-1/month-3/month-6 projection, and what traffic is needed.
10. **Facts in this brief I disagree with / could not verify.**

## 11. Market facts gathered by Claude today (web, sourced; use with the caveats)
- telc B1 exam fee: €194 at GLS Berlin (undated page, languagecourse.net/sprachschulen-berlin/telc);
  late-registration surcharge €35. Basel (CH): CHF 250 for a 24.01.2026 session.
- A 20-unit telc B1 prep course in Berlin (WBS Training): €297.50 incl. 19% VAT
  (wbstraining.de/kurse/sprachkurs/vorbereitungskurs-telc-pruefung-b1/).
- Goethe-Institut sells a 6-week "Prüfungsvorbereitung Online Individual B1" (~60 teaching hours,
  online teacher feedback, speaking simulation; price not shown in the snippet).
- Citizenship: B1 German is required for Einbürgerung (migrando.de, updated July 2026). VGH München,
  20.03.2026 (5 ZB 23.2060): a B1 certificate is only an indication; the authority may test the
  applicant itself — "insbesondere im Sprechen". Speaking competence is the risk point.
- Lingoda Sprint: a conditional cash-back challenge in the same market (attend every class for 2
  months → 50% back, "up to 100%" in headlines). A guarantee precedent that German learners know.
- Not found / unverified: Goethe B1 fee in Germany; DTZ fees (often subsidised via BAMF integration
  courses); Niederlassungserlaubnis B1 requirement (§9 AufenthG — verify before use in copy).
