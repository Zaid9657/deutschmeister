# DeutschMeister to $1M a year, run by AI: the plan

*Claude + Codex, 2026-10-19. Scope: DeutschMeister only.*

**How we got here.**
- One fact pack, measured 2026-10-19.
- Six blind evaluations, three by Claude and three by Codex, on one 10-aspect rubric.
- Two cross-examination rounds.
- One Codex red-team of the merged plan. Its verdict was "rework", and all of its fixes are applied below.

Nothing was built, merged, mailed or changed for this.

**Working files.** They are in the session scratchpad, not the repo: the fact pack, the rubric, the six evaluations and both rounds. This document is the agreed result.

**Revenue basis (both sides).** Revenue counts VAT-exclusive and after refunds, at EUR/USD ≈ 1.14. On that basis $1M a year ≈ **€73.1k a month**.

---

## Bottom line

- **The upside is real, and it is one product.** A B1 exam-rehearsal package (€199–249, one-time) sold to people with a booked exam is the leading hypothesis for $1M.
  - The demand is compulsory and large: 318,550 DTZ takers, 332,500 naturalisations and 461,000 Goethe B1 exams, all in 2025.
  - The aggressive path runs to about **$1.24M a year**.
  - It has **zero sales so far**, so product demand and distribution are joint constraints until a cohort pays.
- **What $1M takes:**
  - **389 sales a month at €249** (≈ €188 per sale after VAT and refunds), or 486 at €199;
  - **15,000–26,000 qualified visits a month at €249**, or 18,700–32,400 at €199, at 1.5–2.6% conversion.
  - Today's exam-intent traffic is **unmeasured**. All we know is 808 search clicks in September, at least 67% of them brand searches.
- **Where it stands today:**
  - about €268 of lifetime revenue and €11.09 MRR;
  - 0 exam products on sale;
  - signups falling, from 181 to 83 over 30 days;
  - an agent team with no recorded commercial improvement from its 64 changes, idle since 10-09.
- **The merged base case is ≈ $500k a year at steady state** (month 12–18). $1M needs the aggressive case: strong traffic, conversion and price together, around month 24+.
- **The first moves**, in dependency order:
  1. contain the live risks and clear the release gate;
  2. make the agent loop survive;
  3. make the telc pilot reviewable and bounded;
  4. line up its buyers;
  5. then prove €199–249 purchases and earn distribution.

---

## Scorecards (blind, side by side)

| # | Aspect | Claude | Codex | Binding constraint both sides accept |
|---|---|---|---|---|
| 1 | Market and demand | 5 | 4 | No paying segment found yet. Demand is large and compulsory, but no exam offer can be bought |
| 2 | Offer and pricing | 3 | 3 | No exam offer can be bought. The telc package is off sale, still €89 on main, and its €149 page (PR C) is not merged |
| 3 | Positioning | 3 | 3 | The money pages sell "a German course line" to exam candidates, so the comparison becomes €10–19-a-month apps. Nothing proves the exam mechanism |
| 4 | Acquisition | 2 | 2 | No channel delivers exam-intent visitors. Search is mostly brand; social has brought 0 signups |
| 5 | Activation and funnel | 2 | 2 | No exam path. `src/lib/firstRun.js` ignores `exam_track`, so exam choosers land on A1.1 or a 20-minute placement test |
| 6 | Product and outcomes | 3 | 3 | Only telc has a route. The day-20 retest replays day 1, AI grading is not validated by a human, and no learner has ever reached an exam result |
| 7 | Retention and LTV | 1 | 1 | 11 of 12 subscriptions that ever paid hit a failed payment, and 1 recovered. Pro's lifetime collection is €18.69 per payer |
| 8 | Unit economics and AI cost | 4 | 3 | Margin after acquisition has never been observed, and provider cost is unmetered. X-Ray runs with thinking on and a 16k-token ceiling |
| 9 | AI operations | 2 | 2 | No loop survives losing its session: the orchestrator was deleted and the re-homed team wrote nothing for 9 days. No recorded commercial improvement from 64 changes |
| 10 | Risk, legal and measurement | 2 | 1 | The release gate is incomplete. Its first and slowest item is who legally operates the business. The visitor-to-payment funnel is not measurable |
| | **Total** | **27** | **24** | |

No aspect differs by 3 or more. The disagreements were about binding constraints and moves. They were answered in cross-examination, and what remains is in the log at the end.

---

## The $1M model

**Sales needed for $1M**, revenue per sale = price ÷ 1.19 × 0.9:

| Price | Revenue per sale | Sales a month for $1M | Qualified visits at 2.6% / 1.5% |
|---|---|---|---|
| €249 | €188 | 389 | 15,000 / 26,000 |
| €199 | €150 | 486 | 18,700 / 32,400 |
| €149 (pilot) | €113 | — | — |

**Segment.** Adults already around B1 with a booked exam 4–8 weeks out.
- **Germany:** telc B1, DTZ, Goethe B1, telc B2. There are about 34,000 exam-name searches a month (overlapping searches, not unique candidates); telc B1/B2 and DTZ make up about 95% of them.
- **Abroad:** Goethe B1/B2 before migration (India, Indonesia, nursing). It counts as **zero** until a paid regional test earns it.
- **After the exam:** practice and B1→B2 continuity. It counts as **zero** until renewals are explained.

**Channels:**
- **Agent-built exam pages** with a capped free sample check. The public endpoint is an owner-approved security release.
- **Partners and creators** on an affiliate link: agents draft the outreach, the owner sends it.
- **Paid search:** agents draft, the owner approves and activates. It opens only after ≥30 attributed sales leave ≥€40 contribution each, within an owner cash budget.
- **B2B:** discovery only, after 10 paid buyers.

**Scenarios.** Steady-state run-rates, S1 only. Abroad and continuity are zero until earned.

| | Conservative | Base | Aggressive |
|---|---|---|---|
| Qualified visits a month | 3,000 | 12,000 | 20,000 |
| …pages / partners / paid / owned | 2,000 / 800 / 0 / 200 | 4,000 / 4,000 / 3,000 / 1,000 | 7,000 / 7,000 / 5,000 / 1,000 |
| Visit → purchase | 1.2% | 1.8% | 2.4% |
| Average price | €199 | €224 | €249 |
| Sales a month | 36 | 216 | 480 |
| **Revenue a month** | **≈ €5.4k** | **≈ €36.6k** | **≈ €90.4k** |
| **A year** | **≈ $74k** | **≈ $500k** | **≈ $1.24M** |
| When (assumption) | month 6–9 | month 12–18 | month 24+ |

**How to read the scenarios:**
- The six blind base cases ranged from $237k to $1.03M a year. Every input is an assumption until the pilot measures it.
- **Paid traffic costs cash before it returns.** At the repo's dated €1.90 CPC estimate, 3,000 or 5,000 paid visits a month cost €5,700 or €9,500, before commissions, fulfilment and overhead.

**Milestones:**

| Revenue a month | Sales a month | Qualified visits | Where they come from |
|---|---|---|---|
| €1k | ≈ 7–9 | ≈ 400–550 | The pilot plus a named source of telc candidates |
| €10k | ≈ 55–65 | ≈ 3,000–4,400 | Exam pages ranking, 5–10 sending partners, a paid test once it clears the gate |
| ≈ €73k ($1M) | ≈ 389–486 | ≈ 15,000–32,000 | All variants, partners at scale, paid search at proven contribution |

---

## The five moves, in the order they must happen

The ranking is by dependency, not by "€ per owner-minute". Revenue estimates without probability and timing are not comparable. Each move has an expected effect and a kill rule.

### 1. Contain the live risks and clear one release gate

- **Owner, week 1:**
  - run the 2 `DROP POLICY` lines on `signup_attempts` (280 rows, still readable by any signed-in account on 10-19);
  - revoke the public PostHog personal key;
  - decide the daily mail's basis now. It goes out opt-out (`DEFAULT true`), with an X-Ray button;
  - confirm that Netlify's `SUPPORT_AGENT_MODE` is not `send`;
  - **book a lawyer and a Steuerberater.**
- **Agents:**
  - write the 3-page brief;
  - make the support agent's `send` mode inert in code, with a test;
  - correct the pilot runbook's authority errors: no agent entitlement repairs, no customer-send path.
- **The gate checklist (100% evidenced before any public sale):**
  - operator and tax position;
  - a product-specific FernUSG/ZFU determination covering the package **and the existing Pro and tickets**;
  - the §7 UWG mail basis;
  - Impressum and privacy facts;
  - cancellation and guarantee terms;
  - the merchant identity on Lemon Squeezy;
  - a VAT-inclusive store;
  - the telc product renamed and repriced to €149 (kept in Draft);
  - **a test purchase, full refund and order replay that produce exactly the intended access states.**
- **Expected effect:** the pilot can lawfully open.
- **Kill rule:**
  - If FernUSG needs approval, there is no sale until the approval is effective.
  - A re-scoped product needs its own fresh legal determination, and demand and economics re-run.
  - No paid traffic before the gate passes.

### 2. Make the agent loop survive and honour every reserved action

- **The setup:**
  - 14 Routines become 4 roles: sales, distribution, fulfilment and controller. The existing agent files stay; no new framework.
  - Team state moves from the private artifact into Supabase tables (an additive migration).
- **What to prove separately:**
  - scheduling;
  - credentials and connector access;
  - recovery.
  - Run a **14-day canary with a deliberate session loss**.
- **What the agents add:**
  - a request-level AI cost ledger, including thinking tokens, retries, failures and anonymous use;
  - a margin-per-sale view;
  - one Monday packet.
- **Expected effect:**
  - ≤1 missed daily cycle in 14 days;
  - recovery within 24 hours;
  - a P&L every Monday;
  - 0 unauthorised sends, money moves or entitlement changes;
  - the owner's measured time within budget for 2 consecutive weeks.
- **Kill rule:** if the canary fails, repair the executor and add no roles.

### 3. Make the telc pilot reviewable and bounded

- **Agents build; the owner approves anything that touches entitlement, limits or terms:**
  - PR C with accurate terms: exam-first weeks, *Sie*, and the unsupported claim removed;
  - "90 days" defined as course access versus AI access, with code, terms and copy aligned (today `hasProduct()` checks no expiry);
  - **enforceable AI limits before launch**: trial counts that no longer fail open, the placement-quota bypass closed, and Pro's X-Ray at 20 a day instead of 50;
  - an unseen second retest;
  - **a funded DaF assessor** blind-rating 20 AI-graded letters, with one agreed tolerance: at most 2 of 20 off by more than one band;
  - outcome capture (an `exam_results` table plus an in-app question after the exam date);
  - a **privacy-compliant server-side denominator**, reconciled source → offer view → checkout → payment → refund before any kill clock starts;
  - a reliable 10-place capacity stop. The owner closes the store side, because hidden Buy buttons don't close old checkout links;
  - the documented refund/order race checked by hand.
- **The narrow funnel change ships with it.** `firstRun` starts from the chosen exam's first task, and the AI feedback ends in the matching offer (or the waitlist). If exam activation is weak, repair the failing step; experienced learners are never sent back to A1.1.
- **Expected effect:**
  - ≥35% of exam-track signups finish a first exam task within 7 days (September: 28% did any learning);
  - ≥5% click the offer;
  - P95 AI cost ≤ €20 per buyer, staged at 10 buyers and then 30.

### 4. Line up the buyers before opening

- **The gap:** only 3 profiles carry an exam date, and telc choosers average about 5 a month. 10 sales from 150 offer views would need 6.7% conversion; at 1.8–2.4%, 10 sales need **≈ 420–560 qualified offer views**.
- **The move:**
  - agents build a partner kit, a sample-feedback demo and tagged links;
  - the owner sends the first 10–30 approaches to telc teachers and course providers;
  - **one tightly capped, tagged community placement** is allowed, judged by qualified buyers.
- **Then:** the owner says "open the sale" once the gate passes.
- **Kill rule:**
  - Judge only after ≥300 qualified offer views, and tell insufficient exposure apart from rejection.
  - Fewer than 3 sales from 300 or more views: change the package once, not the price.
  - Abroad must be validated with **paid** sales; reservations alone don't count.

### 5. Prove retained €199–249 purchases, then earn distribution

- **Price arms after the pilot:**
  - ≥30 sales or ≥1,500 qualified visitors per arm;
  - adopt €249 if its retained revenue per visitor ≥ €199's (≥79.9% conversion ratio at equal refunds) with refunds ≤10%;
  - the test must show why buyers choose the package over €9.99 Pro. Any change to what Pro includes needs owner approval, and existing entitlements are protected.
- **A 90-day two-arm distribution test:**
  - **(A) Exam pages:** 10, then 30 exam long-tail pages (DE telc/DTZ, EN Goethe), each with the free check, released as an owner-approved security change. Needs Search Console and DataForSEO access.
  - **(B) Partners and creators:** on an affiliate link at ≤ €40 a sale.
  - Score each arm on retained revenue per owner-minute. Drop an arm below its line: (A) ≥300 non-brand clicks a month by day 90; (B) ≥3 sending partners, ≥300 qualified visitors and ≥3 retained sales.
- **Second variant:** prepared in parallel, opened only when telc sells ≥5 of 10 within 30 days and the content and assessor checks pass.
- **Rebuild the forecast** from measured contribution, cash needs and owner time.

---

## Owner time: one budget

**Pilot phase, weeks 1–12:**

| When | Task | Minutes |
|---|---|---|
| Once | Live-risk fixes | 30 |
| Once | Booking counsel | 10 |
| Once | Lemon Squeezy gate steps | 30 |
| Once | GSC / DataForSEO access | 10 |
| Once | Authority sheet | 20 |
| Once | Counsel sessions | ≈ 90 |
| **Once, total** | | **≈ 190** |
| Weekly | Read the Monday packet | 5 |
| Weekly | Up to 3 decisions | 5 |
| Weekly | Refunds and approvals | 2–5 |
| Weekly | Partner outreach batch | 5–10 |
| **Weekly, total** | | **≈ 17–25** |

Above 15 a week while outreach runs. **At 15 strictly, the partner arm runs at half speed.**

**At the $1M volume** (≈ 90 sales a week):

| Owner-only task | Minutes a week |
|---|---|
| Refunds (≈ 9) | ≥ 9 |
| Sending support replies (drafts only) | ≈ 6 |
| Posting approvals and decisions | ≈ 10 |
| **Total** | **≈ 25–30** |

**15 minutes a week at $1M does not fit the current rules.** Getting there means changing the brief: for example, delegating refunds below a threshold, or letting support send templated answers on safe topics. That is your decision later, and this plan does not assume it.

---

## The AI operating model

**Four roles:**

| Role | Merges | Levers |
|---|---|---|
| Sales | revenue + conversion | Offer pages, checkout, pilot operations, price arms (owner-approved), dunning, the refund queue |
| Distribution | acquisition + seo + content | Exam pages, partner kit, affiliate recruiting drafts. Paid-search *drafts* only |
| Fulfilment | product + support + retention | Exam variants and retests, outcome capture, support **drafts**, lifecycle copy (consent rule) |
| Controller | supervisor + website + webperf + security | The weekly P&L (payments, VAT, fees, refunds, AI cost, CAC), the canary and recovery, incidents, the Monday packet |

**Owner-only, unchanged and explicit:**
- money: prices, refunds, budgets, payouts, commission, **ad activation**;
- **every entitlement decision and every release that changes access, quotas or eligibility**;
- legal;
- outward posting under the brand;
- security, RLS, auth and **new public endpoints**;
- deleting customer data;
- `CLAUDE.md`.

Support is draft-only, enforced in code.

**Why the team stalled:**
- Revenue levers waited a median of 16 days for one-off approvals.
- Its only executor session was deleted on 10-10.
- The re-homed orchestrator then got a 404 on the team artifact (owned by this account), so it only self-checked.

---

## Kill list

Both sides agree. Correctness defects, access failures and promised delivery are **exempt** from every freeze.

1. **Visual polish:** no new scroll-craft or station-art builds (close #185), and no sequential homepage tests at 2–3 signups a day.
2. **New curriculum:**
   - freeze A1.1 waves (#204, #209, #210) at "works";
   - park Course v2's held levels (#149);
   - A1.2 stays paused;
   - build no B1/B2 level tickets.
3. **Localisation:** the Arabic edition (#188) is parked.
4. **New social packs on our own accounts:** they have brought 0 attributed signups ever. Let the scheduled pack run out.
5. **Pro-selling optimisation:** keep only the loss-stoppers (dunning, access follows payment).
6. **Expanding `/vergleich/`:** fix the 3 false claims, then stop.
7. **Deferred:** speaking-wallet top-ups, the €29 entry product, the human-review premium and the €299 test.
8. **Promotional mail without a documented basis.** The legacy list counts as zero in the plan. An engagement filter is not consent.
9. **Agent paperwork:** rubric scoring, playbook counters, the Monday curator pass, 5×-daily snapshots and post quotas.
10. **Recurring low-value owner chores.** One capped, tagged acquisition test (move 4) is allowed.

---

## Your decisions, one at a time, in order

1. **Live risks, ≈ 30 min:**
   - run the 2 `DROP POLICY` lines;
   - revoke the PostHog key;
   - decide the daily mail's basis;
   - confirm `SUPPORT_AGENT_MODE` is not `send`.
2. **Book the lawyer and Steuerberater.** Agents send the brief.
3. **Lemon Squeezy, ≈ 30 min:**
   - turn on tax-inclusive pricing;
   - rename and reprice the telc product to €149 and keep it Draft;
   - approve the paid-period-access branch.

   The prompts are in `docs/owner-prompts.md`.
4. **Grant Search Console and DataForSEO access**, plus sign the authority sheet (≈ 30 min).
5. **Approve the enforceable AI limits and the "90 days" definition.**
6. **Once the gate passes:**
   - the test purchase, refund and replay;
   - send the first partner batch;
   - "open the sale".
7. **Later:**
   - the €199 vs €249 arms;
   - the second variant's product;
   - a paid-search budget once it clears the gate;
   - B2B calls.

---

## Disagreement log: what is still open

| Topic | Claude | Codex | Settled by |
|---|---|---|---|
| Second variant | DTZ next: German search is ≈95% telc/DTZ, and its letter task clones telc's | Goethe B1 next: 42 of 60 in-app B1 choosers | Whichever clears first after telc sells ≥5 of 10: the DTZ waitlist (≥10 sign-ups) or *paid* Goethe validation abroad |
| Typical AI cost per buyer | ≈ €5–12; caps fix the extremes | Unknown; the stress case is ≥ €62 | The ledger on the first 10 → 30 buyers, reconciled to invoices within 5%; P95 ≤ €20 |
| Partner scale | 47–50 partners don't fit owner time; self-serve affiliates and creators | Test 3 partners first; scale neither arm early | Retained revenue per owner-minute per arm at day 90 |
| Grading tolerance | AI vs rater: ≤30% of letters off by more than one band | ≤2 of 20 off by more than one band | **Adopted: the stricter one (≤2 of 20)** |
| Red-team verdict | Ship with fixes | Rework | All red-team fixes applied. The remaining risk is that no reachable, urgent buyer source exists, which move 4 tests |

---

## Facts corrected in cross-examination and red-team

**Product and revenue:**
- **A1.1 completions:** 1 learner finished A1.1 L1 in the last 14 days (not 0).
- **What has sold:** Pro is not the only product that sold. One A1.2 course sold for €43.38 on 10-14. €20.6 per payer is a mixed-product average.
- **Daily mail reach:** about 1,100 a day are sent, not 1,661. 1,661 is the count of default-on profile flags.

**Assumptions in the model:**
- **Revenue per visitor at €249:** holding it needs ≥79.9% of €199's conversion. 76% was a contribution threshold.
- **CPC:** €1.90 is a dated repo estimate from 09-03, not a measured campaign.
- **Unproven ceilings:** "1/6 of demand", "telc caps at 34% of $1M" and "60–175× today's traffic" are not established.
- **Renewal benchmark:** the 59.2% figure is Adapty's global number, not an education-specific one.

**Systems:**
- **`signup_attempts`:** 280 rows on 10-19, with both SELECT policies still live.
- **The four 10-09 builds:** pushed as branches on 10-19, not merged.
- **X-Ray cost per call:** not bounded by ~$0.01. Thinking is on with a 16k-token ceiling, so output alone can reach ≈ $0.16.
- **"50 failed payment attempts":** may count retries twice. Count unique invoices.

## What would change our minds

**The measure:** retained revenue per qualified offer visitor over the first ≥300 qualified views, split Germany vs abroad, from a reconciled server-side funnel.
- **≥3% purchase with ≤10% refunds:** the base case becomes the plan.
- **≤0.5% after real exposure:** the €149+ exam thesis has failed for that source. Test the next source or segment before concluding.

The $1M line needs ≈ €7.31 per qualified visitor at 10,000 visits a month (≈ 3.9% at €249).
