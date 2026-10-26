# How to sell DeutschMeister: 20-aspect deep evaluation + clean sheet, 2026-10-26

*Sources and method:*
- **20 aspect passes** by Codex (official `codex@openai-codex` plugin, Codex CLI 0.164.0, model gpt-6.1-sol, reasoning `xhigh`, read-only), one aspect per run.
- **One blind clean-sheet design** by Codex that never saw the site, code or plans.
- **Evidence they worked from:**
  - a Firecrawl capture of the live site and its competitors (77 pages, 12 screenshots, 8 buyer searches);
  - a live-facts pack from read-only Supabase;
  - the repository.
- **Checking:** Claude merged the passes and re-checked the key claims against the code, marked **(verified)**.

*Raw reports, briefs and facts:* [`docs/reviews/codex-sales-2026-10-26/`](../reviews/codex-sales-2026-10-26/). This document supersedes the
[first-pass evaluation](sales-evaluation-2026-10-26.md) and follows the
[clean-sheet rule](../agents/clean-sheet-rule.md). **The goal never changes: $1M a year (≈ €73k a month).**

---

## Bottom line

**Score: 40/100.** No aspect scores above 3.

The business doesn't fail for lack of content. It fails at four joints:
1. **Who is allowed to sell.** Operator, legal and FernUSG are unresolved, and that covers Pro and tickets too, not only telc.
2. **What exactly is sold.** The €149 premium over €9.99 Pro isn't earned yet, and rivals sell self-study at €20–70.
3. **Whether the product does what it claims.** The telc letters train 3 Leitpunkte; the real exam has 4.
4. **Who brings the buyers.** The site ranks in none of 8 buyer searches, and social has produced 0 sales.

**Clean sheet: hybrid.** Keep the platform, accounts, content and checkout. Replace three things:
- **The offer:** one exam-rehearsal kit with a self-serve core around €79, plus a €149 tier only *with* human review.
- **The exam buyer's front door:** a German, exam-first page with a free rehearsal.
- **The distribution:** teachers and creators, not the homepage or own social.

Run telc B1 and Goethe B1 side by side, and let paid demand pick.

---

## 1. The clean-sheet answer (blind) vs. what exists

Codex designed the business from zero. It was given only the goal, the demand data, the market and the hard constraints.

| | **Blind clean sheet** | **Current plan (million plan + site)** | **Recommended hybrid** |
|---|---|---|---|
| First buyer | Adult near B1, Goethe B1 booked in 2–8 weeks | telc B1 booked in 4–8 weeks | Both, behind one kit design. Paid demand decides which scales |
| Product | 28-day rehearsal kit: 24 writing tasks, 18 speaking scenarios, pre-recorded partner turns, worked weak/strong examples, 6 timed rehearsals. Low AI use | 20-session telc plan over the Pro library: 3 letters + revisions, 10 AI speaking rehearsals, 2 short tests | Clean-sheet kit structure, reusing the built telc programme, mocks, AI writing feedback and checkout |
| Price | €59 pilot → €79 core → €119 expanded | €89 live (off sale), €149 approved pilot, €199–249 hypothesis | **€79 self-serve core**; **€149 = core + human review** (2 letters assessed, 1 × 15-min paired rehearsal) |
| Front door | Hero is a playable speaking demo plus "€79 once, inkl. MwSt."; free rehearsal without signup | English train-line homepage; German exam pages that start with a 20-min placement test | German exam landing page with a free rehearsal and the offer right after the feedback |
| Distribution | Teachers and creators (20% of net) → 750 of the first 1,000 buyers; search 150; Telegram for referrals | Partner arm and exam pages as a 90-day two-arm test | Teachers and creators first, owner sends; finish the 10 existing task guides second; no new social |
| Owner time | 3 h/week | 17–25 min/week budgeted (not measured; 16-day median approval wait) | 60 min/week, fixed slots (§4) |
| $1M math | ≈ 1,005 purchases a month at a €91 mix | 389 a month at €249 | Decide after 300 qualified views per price |

**Why hybrid, not evolve or replace.**
- **Evolving** keeps the core mismatch: a beginner catalogue sold to exam buyers, and a premium that is "a plan over Pro".
- **Replacing** throws away a working stack, checkout, 18 guides and a built telc programme for no evidenced sales gain.
- **The legal gate gives us time.** It takes weeks whichever option we pick. Agents can build the Goethe B1 kit during that wait at no extra delay, so "telc first because it's built" stops being a reason.

**Two risks only the blind pass raised.**
- **Blue Card and side business:** confirm that your residence permit allows this self-employment (§21(6) AufenthG); counsel or the Ausländerbehörde decides.
- **FernUSG covers automated correction too** (ZFU FAQ). A self-serve core with less AI grading may change that classification; counsel decides.

---

## 2. Scores, all 20 aspects (Codex)

| # | Aspect | Score | The one finding that matters most | Evidence |
|---|---|---|---|---|
| 1 | Buyer & segments | 2 | You have exam *preferences*, not segments: 74 of 95 named exams are B1/B2, 4 profiles have a date, and country, purpose and occupation are unknown | `a01-buyer.md` |
| 2 | Offer & pricing | 2 | The €149 premium must beat 3 × €9.99 Pro by €119. The package is ≈6.4 h of planned practice (€23/h). Rivals: TestHelden €39, telc-trainer €19.99, TestGerman €44.90/3 mo; DeutschAkademie gives 12 teacher hours for €149 | `a02-offer.md` |
| 3 | Positioning | 2 | Six pages give six answers to "what am I buying?" The telc page sells grammar weeks, but the built programme starts with a test, then writing, revision and speaking. `/vergleich/` fights Babbel, not the exam shops that rank | `a03-positioning.md` |
| 4 | Trust & proof | **1** | The live Impressum shows "Entwurf — nicht freigegeben" and placeholder operator fields; the privacy controller is blank; AGB/Widerruf return 404; no outcome proof. The LS checkout says "64 Grammar Topics" while the site says 84 | `a04-trust.md` |
| 5 | Acquisition & SEO | 2 | Signups −64% (41/wk → 15/wk). Hypotheses ranked: Sep 14 signup copy changed to "Start your 7-day Pro trial"; grammar hubs switched to English; the Supabase pause; the Oct 4 redesign. Needs GSC to confirm. Absent from all 8 buyer top-10s | `a05-acquisition.md` |
| 6 | Conversion & UX | 2 | Exam intent dies at signup: the return path only allows `/course/…`, so "Übungstest starten" → signup → lands on the dashboard **(verified, `src/lib/returnPath.js:17`)**. Mobile hero overflow comes from the implicit grid track and `FirstStop` lacking `min-w-0` | `a06-conversion.md` |
| 7 | Activation & free→paid | 2 | Onboarding asks for the exam, then exits to A1.1 or placement. Goethe B1/DTZ choosers get a 60–65-min mock with no AI writing and no paid next step. Trial mails sell features, not the learner's result | `a07-activation.md` |
| 8 | Product value & outcomes | 2 | Mocks are short versions (8 reading items, 1 Sprachbausteine part, 2 generic listening sets). AI grading has no human validation; 1 completed telc mock ever. A1.2 shipped with known shortcut leaks | `a08-product.md` |
| 9 | Retention, LTV, billing | 2 | 13 of 13 Oct 22 money bugs fixed on main. 1 renewing payer and 3 at-risk subscriptions; dunning stamps "sent", not "recovered". Course-window expiry is skipped when mail secrets are missing | `a09-retention.md` |
| 10 | Measurement & unit economics | 2 | No join from offer view to payment. Astro `track()` marks once-events as sent *before* the consent check, so visitors who accept late lose their offer views **(verified, `astro-site/src/lib/track.js:55`)**. `cost_cents` is the learner's wallet charge, not provider cost | `a10-measurement.md` |
| 11 | Technical & crawlability | 3 | The stack is sound (static money pages, sitemap, schema, logout fixed). Mobile clipping is the defect. The fallback cache is 63 days old | `a11-technical.md` |
| 12 | Language | 2 | German exam page → English signup ("Start your 7-day Pro trial"). `preferred_language` is never written from the UI, so the "all en" data is meaningless. German screens show `€40.00` instead of `deEur()` | `a12-language.md` |
| 13 | Content as sales asset | 2 | **telc writing tasks have 3 Leitpunkte; the official format has 4. The mock checks "Alle drei Leitpunkte" (verified, `src/data/writingTasks.js:27`, `mockExams/telcB1.js:222`).** The public guide teaches 4, so the paid product is worse than the free guide | `a13-content.md` |
| 14 | Email & owned channels | 2 | No recorded marketing consent at signup, so the legal list is ≈0. Daily mail (~33k a month) points to a free tool. Telegram ownership is unverified | `a14-lifecycle.md` |
| 15 | Legal & compliance | **1** | Operator/tax and FernUSG are unevidenced for **every** paid product. VAT-inclusive pricing is unverified (Oct 11: €9.99 became €11.89 at checkout). §312k cancellation button and §356a withdrawal function (in force since 19 June 2026) unverified. `check-legal-release` fails on 15 fields | `a15-legal.md` |
| 16 | Revenue integrity | 2 | A concurrent refund + order can leave refunded access active (reproduced). Paid A1.2 grammar answers sit in public HTML. Cancelled speaking openings cost money but refund the allowance. Pro X-Ray: 50/day at a 16k-token ceiling | `a16-integrity.md` |
| 17 | Design, brand, a11y | 3 | Recognisable brand. The mobile homepage looks broken. On mobile pricing, no paid price is visible on the first screen. The telc page shows no feedback example. Signup field borders are 1.25:1 contrast | `a17-design.md` |
| 18 | Competition | 2 | Price corridor: self-study €20–70, AI practice ≈€20/month, teacher-supported €89–389. €149 sits in the teacher band with no teacher. The wedge is the loop (diagnose → correct → revise → retest), not "AI" | `a18-competition.md` |
| 19 | Partnerships & B2B | 2 | The partner kit lacks proof and commission terms. `utm_source=partner` collapses all partners into one bucket. Coupons can't track full-price referrals. 10 concrete first targets listed | `a19-partnerships.md` |
| 20 | Operations | 2 | 10 open PRs, 8 unmergeable (incl. #221 AI-usage ledger, #199 X-Ray cost guard). The owner is the execution bottleneck. The ops guide still tells operators to enable support `send` | `a20-operations.md` |
| | **Total** | **40/100** | | |

---

## 3. What to do, in dependency order

**Who does what:**
- `[agents]` = normal PR, shippable now.
- `[owner]` = money, legal, brand message, auth/security or an outward action.
- "Defect" items are exempt from the kill-list freeze.

### Step 1 — Unblock selling at all (owner, this week)

| # | Action | Why | Who |
|---|---|---|---|
| 1.1 | Book counsel and a Steuerberater. The brief covers:<br>• operator/tax;<br>• **Blue Card self-employment permission**;<br>• FernUSG for Pro, tickets and the kit, both with and without AI grading;<br>• the checkout duties (§312j button, §312k cancellation, §356 / §356a withdrawal). | Blocks every euro, existing products included | [owner]; agents write the brief from `a15-legal.md` |
| 1.2 | In Lemon Squeezy:<br>• confirm tax-inclusive prices;<br>• fix the checkout product text ("64 Grammar Topics" → derived from `marketing.js`);<br>• keep telc in Draft. | Price surprise and a contradiction at the payment moment | [owner], ≈30 min |
| 1.3 | Grant Search Console access to this environment (`GSC_SERVICE_ACCOUNT_JSON`). | The only way to root-cause the 64% signup drop. That is the biggest lever we can measure, worth ≈25 signups/week if it's conversion | [owner], 10 min |
| 1.4 | Pick the offer: **€79 self-serve core + €149 with human review**, or stay at €149 only. | It's a pricing decision, and it replaces the million plan's €149-only pilot | [owner], one answer |

### Step 2 — Fix what is broken (agents, now, all defects)

| # | Fix | Where |
|---|---|---|
| 2.1 | **telc letters with 4 Leitpunkte**, and the mock checklists updated to match. The class rule and regression test: every telc task's Leitpunkte count equals the format contract | `src/data/writingTasks.js` (+ function twin), `mockExams/telcB1*.js` |
| 2.2 | **Mobile hero overflow** (`grid-cols-1`, `min-w-0`, wrapping CTAs), checked at 320/360/390 px with the consent banner visible | `astro-site/src/pages/index.astro:82–112`, `linie/FirstStop.astro:44`, `linie.css:88` |
| 2.3 | **Exam intent survives signup**: allow-list `/modelltest/<exam>` and `/schreiben/<exam>` in the return path; onboarding's primary exit opens the chosen exam task | `src/lib/returnPath.js:17`, `IntroSlides.jsx:207`, `firstRun.js:176` |
| 2.4 | **Consent-safe event dedupe**: mark once-events only after they actually send; keep `plan`/`amount` on `checkout_started` | `astro-site/src/lib/track.js:55`, `src/lib/funnelTracking.js:32` |
| 2.5 | **Main telc guide gets the telc offer door** (its 4 long-tail guides already have it) | `astro-site/src/data/guides/telc-b1.js` |
| 2.6 | Remove the unsupported "Die meisten fallen nicht durch…" claim (telc page and exam hub); "20 Trainingseinheiten in vier Wochen"; sell the built mechanism | `telc-b1-komplettvorbereitung.astro:138`, `data/exams/index.js:66` |
| 2.7 | German price formatting with `deEur()` on German screens; fix "Payment received" shown while entitlement is unverified | `SubscriptionPage.jsx:534`, `SubscriptionSuccessPage.jsx:259` |
| 2.8 | Partner links get a unique `utm_content`; the attribution keeps offer-door interest separately from first touch | `docs/partners/links.md`, `src/lib/attribution.js:33` |
| 2.9 | Course-window expiry runs even when mail secrets are missing | `netlify/functions/trial-lifecycle.mjs:390` |
| 2.10 | Comparison facts: narrow Lingoda's "Kein KI-Training", qualify Duolingo Roleplay. Keep `Stand:` dates until the vendor's own page is re-checked | both `competitorComparisons.js` |

### Step 3 — Build the hybrid offer while the gate runs (agents build, owner approves)

1. **One kit spec, two exams.**
   - telc B1 reuses `telcB1Komplett.js` with the 4-point letters, plus Sprachbausteine Teil 2 and three-part listening rehearsals.
   - Goethe B1 gets a writing bank (3 tasks) and the same 28-day structure.
   - The core tier works without AI grading. Worked weak/strong examples do the teaching, and AI feedback is an add-on.
2. **A free rehearsal on the offer page**, no signup: one letter, its feedback and the revision, labelled as a demonstration.
3. **German exam landing page plus German signup continuity.** The signup texts, errors and purchase summary are in German when the visitor arrives from a German page.
4. **€149 tier = human review.** It covers two assessed letters and one 15-min paired rehearsal, capped at 45 min of assessor time per buyer.
   - The same assessor blind-rates 20 AI letters; at most 2 may differ by more than one band.
   - Contribution ≈ €70 a sale before acquisition (`a08-product.md`).
5. **Partner kit finished:**
   - exact-exam offer sheet and teacher assignment sheet;
   - the demonstration;
   - opaque partner IDs;
   - commission terms (owner sets them; the clean sheet suggests 20% of net).

### Step 4 — Sell (after the gate)

1. **First buyers come from teachers and creators.** Agents research and draft; the owner sends 5 approaches a week.
   - First targets are in `a19-partnerships.md`: YourGermanTeacher, Sprachschule Aktiv's telc lead, DeutschAkademie's workshop lead, Deutsch mit Marija, VHS Berlin-Mitte (DTZ later), Club Dialog.
2. **Consent capture at signup.** Unchecked exam-offer and learning-mail choices, versioned and timestamped. It's an owner-approved release, and it's the only lawful way to build an email list.
3. **Open the kit when the gate passes:**
   - €79 core;
   - the €149 human tier capped at 10 places;
   - an introductory price for the first 20 buyers only if stated as such (no fake strike-through).
4. **Judge with the million plan's rule.** Look only after ≥300 qualified offer views from a reconciled server-side denominator. Fewer than 3 sales → change the package once.
   - Blind clean-sheet kill rules on top: <10 sales per 200 qualified views, refunds >15% or <60% starting within 48 h → revise before buying more traffic.

### Parked (unchanged from the kill list unless the owner reopens them)

- Pro optimisation and yearly pushes.
- New B1/B2 level tickets, the Arabic edition, new social packs, `/vergleich/` expansion and visual polish.
- Revenue-integrity hardening that needs owner security releases is queued, not parked. It is the refund race, server-side paid-content locks and the speaking attempt budget (`a16-integrity.md`), and it ranks after the gate.

---

## 4. Owner operating rhythm (proposal, `a20-operations.md`)

60 measured minutes a week:

| When | What | Minutes |
|---|---|---|
| Daily, 3 × a week | Inbox, tickets and payment exceptions | 21 |
| Monday | Read the packet, make up to 3 decisions, refunds | 20 |
| Wednesday | Send the partner approaches the agents prepared | 10 |
| Friday | Outcomes, costs, keep or kill | 9 |

Approval waits are tracked as ready → decided (target median ≤3 days). More than 30 support minutes a week for two weeks running pauses acquisition.

---

## 5. Live numbers (2026-10-26)

**Signups and usage:**
- Signups by week: Jul–Sep average 41; Oct average 15.
- 58 auth email rate-limit errors in 60 days, none since mid-September.
- 1,194 of 1,748 accounts confirmed.
- Last 30 days: 7 learners with lesson attempts, 11 speaking users; 4 writing users in 60 days.
- 1 completed telc mock; 0 telc programme rows.

**Money:**
- MRR €11.09 from 1 renewing payer.
- 3 lifetime purchase rows (course revenue €43.38 per weekly_metrics).
- 0 sales in the last 7 days.

**Market:** buyer-search top-10s contain telc, telc-trainer, BO, DeutschAkademie, TestHelden, Goethe and TestGerman; DeutschMeister is absent from all 8.

Full pack: [`FACTS.md`](../reviews/codex-sales-2026-10-26/FACTS.md).

---

## 6. Where Codex corrected the first-pass evaluation

| First-pass claim | Correction |
|---|---|
| "firstRun ignores exam_track" | False. The dashboard honours it; the breaks are onboarding exits and the return path |
| "Reach is *the* binding constraint" | Joint with legal clearance, differentiation and fulfilment quality |
| "Tickets stay on sale" | Only once the FernUSG/operator determination covers them |
| "Founder line fixed" | The wording is consistent now. The owner confirmed "team of doctors" on 2026-10-26; contributors' roles should be stated where they're used as proof |
| "Pages load fast" | Unmeasured; no Core Web Vitals or transfer budget exists |
