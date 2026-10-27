## 1. Score: **2/5**

DeutschMeister has usable payment plumbing, but the journey repeatedly loses the visitor’s purpose. Course purchases survive signup on the same browser; checkout avoids popup blockers; ownership checks prevent duplicate purchases. Those are strengths. However, exam visitors encounter an unavailable package, signup can discard their requested exam route, and the mobile homepage clips an acquisition button. Meanwhile, **554 of 1,748 accounts remain unconfirmed**—a lifetime stock, not today’s signup abandonment rate. The root problem is continuity between landing intent, authentication, the relevant offer, and fulfilled access. Evidence: `FACTS.md`, Accounts; [buyIntent.js:33](/home/user/deutschmeister/src/lib/buyIntent.js:33), [openCheckout.js:15](/home/user/deutschmeister/src/utils/openCheckout.js:15).

**Clean sheet: hybrid.** Evolving the catalogue is cheapest but preserves its branching journey. Replacing it with exam-specific sample → payment → account creation could remove friction, but requires a substantial owner-approved identity and fulfilment redesign. I would retain checkout and build a continuous exam-specific journey around it. Replacement impact and effort remain **unverified**.

Code observations below concern local-main implementation; deployment parity is unverified unless a capture corroborates it.

## 2. Findings, most important first

### 1. Exam intent survives navigation better than it survives signup

The commercial mismatch matters: **74 of 95 named exam preferences concern B1/B2**, while available tickets cover A1–A2. Preferences demonstrate interest, not willingness to pay. Pro remains purchasable for B1/B2 practice. Evidence: `FACTS.md`, exam choices; `site__courses-b1-1.md`: **“Ride B1.1 today with Pro.”**

The actual journeys are:

| Entry and steps | Leak and required correction |
|---|---|
| **Home → free course:** “Start A1.1 free” → `/course/a1.1` → lesson → optional signup at the first part’s pause → email confirmation → remembered course. Completion can offer the next paid level. | This is coherent for beginners. Its completion offer has little measured exposure: **zero L12 finishes in the supplied 14-day window**. Preserve this journey; give exam candidates an earlier relevant route. Evidence: [SaveProgressAsk.jsx:9](/home/user/deutschmeister/src/components/course/SaveProgressAsk.jsx:9), [CourseCompletePage.jsx:187](/home/user/deutschmeister/src/pages/CourseCompletePage.jsx:187); `FACTS.md`, Activation. |
| **Home → account:** “Create a free account” → signup → confirmation → dashboard/onboarding. “I know my level” instead scrolls to the ticket catalogue. | The account door carries attribution, not an exam or product destination. Beginners and exam candidates enter the same general trial proposition. Evidence: [index.astro:101](/home/user/deutschmeister/astro-site/src/pages/index.astro:101), [buyIntent.js:33](/home/user/deutschmeister/src/lib/buyIntent.js:33). |
| **Pricing → level purchase:** Buy → `dm_buy_intent` → signup → confirmation link to `/login` → `/subscription?buy=course_a1_2` → ownership/billing checks → checkout → webhook → success. | **Already substantially repaired.** `/subscription` bypasses onboarding. Remaining weaknesses: intent lives only in localStorage, and the resume handler clears it before establishing that checkout opened. Another browser loses the purchase context; an unavailable product silently falls through. Evidence: [CourseCheckout.astro:60](/home/user/deutschmeister/astro-site/src/components/CourseCheckout.astro:60), [App.jsx:166](/home/user/deutschmeister/src/App.jsx:166), [SubscriptionPage.jsx:227](/home/user/deutschmeister/src/pages/SubscriptionPage.jsx:227). |
| **Pricing → Pro:** anonymous visitor → “Start 7-day Pro trial” → signup, **without** buy intent. Signed-in visitor → priced checkout; an existing recurring customer → billing portal. | The anonymous button deliberately starts a free trial. It is not an interrupted purchase. Do not “repair” it by automatically opening payment after confirmation. Evidence: [proCta.js:37](/home/user/deutschmeister/astro-site/src/lib/proCta.js:37). |
| **Telc offer → account:** unavailable package → attributed signup → confirmation → general onboarding. After trial feedback, the matching telc offer can return to the unavailable package page. | This collects accounts without completing a sale or offering a definite next exam task. Live evidence: `site__telc-b1-komplettvorbereitung.md`: **“Kostenloses Konto anlegen”**, **“Der Kurs startet in Kürze”**, and **“89,00 €”**. The sale switch correctly blocks checkout: [lemonsqueezy.js:55](/home/user/deutschmeister/src/config/lemonsqueezy.js:55), [examFeedbackOffer.js:22](/home/user/deutschmeister/src/lib/examFeedbackOffer.js:22). |
| **Exam hub → practice:** `/pruefung/telc-b1/` → `/modelltest/telc-b1` → signup lock → signup → confirmation → dashboard/onboarding. | **The requested mock is discarded.** The lock calls `setReturnPath()`, but its validator accepts only `/course/...`. Preserve a narrowly allow-listed exam destination through confirmation. Evidence: `site__pruefung-telc-b1.md`: **“Übungstest starten →”**; [LockedContentOverlay.jsx:70](/home/user/deutschmeister/src/components/LockedContentOverlay.jsx:70), [returnPath.js:17](/home/user/deutschmeister/src/lib/returnPath.js:17). |

The public exam page also places a **20-minute placement test first**, ahead of writing or mock practice. That is an unnecessary detour for someone who already selected their examination. Evidence: [exams/index.js:110](/home/user/deutschmeister/astro-site/src/data/exams/index.js:110).

**Disagreement with the existing evaluation:** its blanket diagnosis that `firstRun` ignores exams is outdated. `firstRunAction()` already selects writing/mock work for eligible exam choosers. The remaining break is more specific: `onboardingExitPath()` still sends its learning exits to A1.1 or placement, and public exam signup loses its destination. Fix those boundaries instead of rebuilding the resolver. Evidence: [sales evaluation:106](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:106), [firstRun.js:107](/home/user/deutschmeister/src/lib/firstRun.js:107), [firstRun.js:176](/home/user/deutschmeister/src/lib/firstRun.js:176).

### 2. Email confirmation has known historical causes; custom SMTP is unverified

Signup now requires **email and password only**, with a six-character minimum, password visibility control, and no repeated-password field. Field count is therefore not the obvious bottleneck. Evidence: [SignupPage.jsx:391](/home/user/deutschmeister/src/pages/SignupPage.jsx:391).

The documented historical failure was structural: successful signup returned **no session**, yet the app sent the person to a verification page requiring a session, which redirected them to login. Confused users then retried authentication or requested another email inside the resend window. The current implementation instead shows an inbox panel, waits before resending, handles existing accounts, and forwards confirmed sessions. Evidence: [signupConfirmation.js:3](/home/user/deutschmeister/src/lib/signupConfirmation.js:3), [SignupPage.jsx:151](/home/user/deutschmeister/src/pages/SignupPage.jsx:151).

However:

- **58 rate-limit attempts are not 58 lost people.** Distinct addresses and successful later confirmations matter.
- The error code alone does not establish Supabase’s default SMTP cap. Repository examples include **per-address cooldown refusals**.
- **Custom SMTP, sender authentication, delivery and spam placement are unverified.** Application mail sent through Resend does not establish Supabase Auth’s SMTP configuration.

Evidence: `FACTS.md`, Accounts; [signup-confirmation.test.mjs:32](/home/user/deutschmeister/tests/signup-confirmation.test.mjs:32).

Consequently, neither “SMTP is fixed” nor “default SMTP caused all 32%” is justified.

### 3. Mobile clipping is a layout defect that hides an acquisition action

I opened both supplied 360px PNGs. In `scratchpad/shots/home.png`, lead text and **“Create a free account”** extend beyond the right edge. The cookie banner occupies approximately **142/800 pixels—18%**. The pricing screenshot shows no paid CTA in its initial viewport.

The source-level CSS cause is the hero’s **implicit auto-sized grid column**: it declares `grid`, but no mobile `grid-cols-1`; the adjacent FirstStop article lacks `min-w-0`. Intrinsic content can therefore widen the shared track. Parent `overflow-hidden`/`overflow-x-clip` masks the excess. Non-wrapping buttons compound it. Evidence: [index.astro:82](/home/user/deutschmeister/astro-site/src/pages/index.astro:82), [FirstStop.astro:44](/home/user/deutschmeister/astro-site/src/components/linie/FirstStop.astro:44), [linie.css:88](/home/user/deutschmeister/astro-site/src/styles/linie.css:88). **Computed-width confirmation of the precise intrinsic contributor remains unverified.**

The hero presents **three buttons plus two utility links**; mobile navigation repeats the free-course action. Main buttons have a 46px minimum, but several overrides reduce targets to 40px. Evidence: [index.astro:101](/home/user/deutschmeister/astro-site/src/pages/index.astro:101), [Layout.astro:273](/home/user/deutschmeister/astro-site/src/layouts/Layout.astro:273).

### 4. Checkout transport is sound; price certainty and recovery need proof

The SPA prefers a Lemon Squeezy overlay and falls back to same-tab navigation. It no longer depends on a new browser tab. Astro has equivalent overlay/navigation branches. Evidence: [openCheckout.js:15](/home/user/deutschmeister/src/utils/openCheckout.js:15), [CourseCheckout.astro:92](/home/user/deutschmeister/astro-site/src/components/CourseCheckout.astro:92).

The homepage tells buyers to use their login email, but checkout also supplies `custom.user_id`, which webhook resolution prioritises. **Email matching is fallback behaviour, not the normal account-linking requirement.** Evidence: [Progression.astro:15](/home/user/deutschmeister/astro-site/src/components/linie/Progression.astro:15), [lemonsqueezy-webhook.mjs:233](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:233).

VAT is unresolved: an October 11 owner note records **€9.99 becoming €11.89** at checkout. That is historical evidence; today’s setting is **unverified**. Payment methods are likewise unverified and should not be promised from provider capabilities alone. Evidence: [owner-prompts.md:55](/home/user/deutschmeister/docs/owner-prompts.md:55), [faqContent.js:125](/home/user/deutschmeister/src/data/faqContent.js:125).

After payment, subscriptions have a verification fallback; course orders do not. Worse, the unsuccessful confirmation branch says **“Payment received”** even though its condition means entitlement remains unverified. Evidence: [SubscriptionSuccessPage.jsx:70](/home/user/deutschmeister/src/pages/SubscriptionSuccessPage.jsx:70), [SubscriptionSuccessPage.jsx:253](/home/user/deutschmeister/src/pages/SubscriptionSuccessPage.jsx:253).

### 5. Distinguish unavailable offers from broken routes

B1.1’s capture clearly explains its unavailable course and offers Pro. It is a commercial compromise, not a literal dead end. `/de/`, `/agb/` and `/widerruf/` are recorded 404s; whether buyers actually followed links to those URLs is unverified. Astro serving `/` outside React is intentional, not a routing defect. Evidence: `site__courses-b1-1.md`: **“Not for sale yet, on purpose”**; `FACTS.md`, Live site; [App.jsx:141](/home/user/deutschmeister/src/App.jsx:141).

## 3. Sub-scores

| Question | Score | Evidence |
|---|---:|---|
| **a. Money paths** | **2/5** | Course resume works; exam return validation discards mock routes: `buyIntent.js:33`, `returnPath.js:17`. |
| **b. Signup/confirmation** | **2/5** | Better recovery code; 554 unconfirmed accounts; SMTP unverified: `SignupPage.jsx:151`, FACTS Accounts. |
| **c. Mobile/desktop UX** | **2/5** | Confirmed 360px clipping; desktop visual behaviour unverified. |
| **d. Checkout friction** | **3/5** | Overlay fallback and account IDs exist; live tax/payment details unverified: `openCheckout.js:15`, `lemonsqueezy.js:79`. |
| **e. Dead ends** | **2/5** | Telc cannot be bought; named 404s confirmed in FACTS. |

## 4. Recommendations ranked by expected revenue per hour

**Sizing assumptions—not forecasts:** after the approved €149 pilot opens, 19% VAT and 10% refunds yield approximately **€113 per order**. At 100 relevant visits/month, a one-percentage-point conversion improvement produces roughly €113/month. Traffic and lifts below are **unverified planning assumptions**; effects overlap and must not be added. A current €40 ticket yields approximately €30 under the same assumptions.

| Rank | Change and exact location | Conditional effect; effort | Authority; measure/kill rule |
|---|---|---|---|
| **1** | Constrain the mobile hero: base `grid-cols-1`, shrinkable demo, wrapping controls. Check existing 40px overrides. `index.astro:86`, `FirstStop.astro:45`, `linie.css:88`. | Assumed +1–2 points: **€113–225/month** after launch; **2–3h**. | **[agents]** Accept only when 320/360/390px layouts expose every CTA with banner visible; verify desktop. No sequential homepage experiment. |
| **2** | Verify VAT-inclusive totals and checkout identity before changing copy. `docs/owner-prompts.md:55`; Lemon Squeezy dashboard. | **€0–225/month**, assuming 0–2 recovered points; **1–2h**, excluding broader legal gate. | **[owner]** If totals already match, close the issue. Otherwise require German-address checkout evidence before adding VAT wording. |
| **3** | Preserve the selected exam through signup and make onboarding offer that task directly. `returnPath.js:17`, `LockedContentOverlay.jsx:70`, `firstRun.js:176`. | Assumed +1–3 points: **€113–338/month**; **4–6h**. | **[owner]**, agent-prepared auth-return PR. Require successful confirmation round trips and no open redirects; measure first exam-task completion. |
| **4** | Complete the telc journey once the release gate passes; align the off-sale page, approved price, matching feedback offer and first paid task. `telc-b1-komplettvorbereitung.astro:145`, `examFeedbackOffer.js:22`, `lemonsqueezy.js:55`. | At assumed 2% conversion from 100 qualified views: **€225/month**; **4–8h technical work**, counsel time unverified. | **[owner]** Gate before opening. After ≥300 reconciled qualified views, fewer than three sales triggers the plan’s single package revision—not a price cut. |
| **5** | Make cancellation, unavailable-product and delayed-activation states explicit; retain purchase intent until checkout actually opens. `SubscriptionPage.jsx:227`, `SubscriptionSuccessPage.jsx:253`. | Revenue recovery unverified; **2–4h**. | **[owner]**, agent-prepared money-path PR. Simulate close, blocked overlay, delayed webhook and missing variant; none may claim an unverified payment. |
| **6** | Audit Auth SMTP and current confirmation cohorts before further signup redesign. `AuthContext.jsx:142`, Supabase Auth settings, `signup_attempts`. | Illustratively **€0–29/month**: 65 signups ×32% ×25% recovered ×5% purchase ×€113; **2–4h**. Lifetime confirmation share may not describe today. | **[owner]** Separate timed cooldowns, untimed caps and delivery failures. Measure the next 30 legitimate attempts; no unsupported claim that SMTP caused all losses. |

The release gate covers existing Pro and tickets too. Prices and claims must continue deriving from `pricing.js`/`marketing.js`. Existing analytics remain consent-gated; binding revenue decisions require the plan’s privacy-approved, reconciled server denominator. Evidence: [million plan:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128), [million plan:175](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:175), [track.js:62](/home/user/deutschmeister/astro-site/src/lib/track.js:62).

## 5. What I could not verify

- **Desktop and computed mobile layout:** capture desktop plus 320–390px widths; inspect grid/child rectangles. `capture/shots/` remained empty; I used the two supplied extra PNGs.
- **SMTP and current confirmation loss:** inspect redacted Auth configuration and message-level delivery results; cohort attempts by unique address and subsequent confirmation.
- **Checkout totals, methods and deployment parity:** record country/device-specific checkout screens and compare the deployed build with local main.
- **Cross-device resume and paid fulfilment:** owner-run mobile/desktop confirmation, purchase, refund and webhook replay.
- **Actual conversion rates:** reconcile qualified views, checkout, payments and refunds. Consented browser events alone do not supply that denominator.

Five focused test files passed. No files changed. Live-browser inspection required approval unavailable in this unattended session.

