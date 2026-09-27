# DeutschMeister scorecard (living)

**Current: 31 / 100** · last measured 2026-09-27 (late) · next refresh: Monday after `weekly-truth` (06:00 UTC)

This is the single source of truth for how the business is doing and what to work on next.
Every session that works on this business reads it first. Any session that moves an aspect
updates it in the same PR: the row, the metric, the work-order status, one history line, and
one experiment line. Scores come from the rubric (§5), never from judgement, so two sessions
measuring the same week get the same number. The dated snapshot this started from is
`docs/business-scorecard-2026-09-27.md`.

---

## 1. Scorecard

| Area | Weight | Score | Trend | Evidence (2026-09-27) |
|---|---|---|---|---|
| Revenue | 25% | **1** | — | MRR €32.97 from 3 payers (€55.15 on 09-21); 3 more past_due/unpaid. 0 real course sales since launch 09-03. No new paid sub since 08-27. Lifetime ≈ €203 gross (18 payments) |
| Activation | 20% | **2** | ↓ | Signup→first lesson: Jun 15%, Jul 16%, Aug 10%, **Sep 10%**. Rebuilt A1.1: 4 learners, 0 Lektionen finished. Writing 0 ever, mock exams 5 ever |
| Acquisition | 15% | **2** | ↓ | Signups: 205 (Jun) → 147 (Sep). Search signups are brand searches (13 of 14 land on `/`). 22 keywords in DE, 0/20 targets in top 30, 11 referring domains (10 spam). No social running. The \"X-Ray spike\" since 09-14 was a **crawler** rendering the new example links (98% of anon analyses = our own example sentences); real anon X-Ray use is ~1–8/day |
| Product & reliability | 15% | **5** | — | A1.1 at 0 blocker/major after 23 DaF reviews; 84 grammar topics; 3 mock exams. **Speaking: 24/45 starts (53%) got zero learner turns.** Paid levels still on older content. Webhooks: 0 failed in 30 days |
| Retention & email | 10% | **3** | — | 29,500 sends/30 d, 1.95% bounce, 0 complaints. Click tracking switched **on** 2026-09-27; the click rate isn't known yet. Launch email written, never sent. 3 of 6 live paid subs failing |
| Website performance | 5% | **10** | ↑ | Mobile Lighthouse, local build (2026-09-27, after PR #156): / 100, /pricing/ 99, grammar 99, course 99, guide 100, /level-test/ 86, /login 94 → median 99; worst CLS 2.0 → 0. `vendor-ui` 757 → 102 KB raw. Fonts self-hosted. **At target: this agent does nothing until it regresses** |
| Support | 5% | **5** | — | 0 tickets ever from 1,685 accounts — no backlog, no signal |
| Security & engineering | 5% | **6** | ↓ | Advisors: 0 errors; 2 actionable warnings (leaked-password protection off; 2 extensions in `public`). The exposed-function warning is fixed (2026-09-27). **New: every Netlify env var is stored non-secret, and a `phx_` PostHog personal API key ships in the public JS** (work order #0). CI green |

Total = Σ(weight × score). First measurement, 2026-09-27: 25+40+30+75+30+40+25+35 = **300 → 30/100**.
Same evening, after the secrets finding and the rubric line it added: security 7 → 6, so
295 → **30/100** (rounded).

## 2. Metrics we track (the aspects)

| Area | Metric | Now | Next target | Source |
|---|---|---|---|---|
| Revenue | MRR | €32.97 | €100 | `weekly_truth_metrics()->subscriptions` |
| Revenue | Real course sales / 30 d | 0 | 3 | `purchases` where `price_paid > 0` |
| Revenue | Failing paid subs | 3 | 0 | `subscriptions.status in ('past_due','unpaid')` |
| Revenue | New paid subs / 30 d | 0 | 2 | `webhook_logs` `subscription_created` |
| Activation | Signup→first lesson (last full month) | 10% | 18% | cohort query §7 |
| Activation | A1.1 Lektionen finished / 14 d | 0 | 5 | `weekly_truth_metrics()->course` |
| Acquisition | Signups / week (30-day avg) | 38 | 50 | `auth.users` |
| Acquisition | Non-brand share of attributed signups | ~6% | 30% | `profiles.acquisition_*` + landing page |
| Acquisition | X-Ray → signup rate | unknown | measured | `acquisition_last_source = 'xray'` ÷ human anon analyses (crawlers now 403) |
| Acquisition | Target keywords in top 30 | 0/20 | 3/20 | DataForSEO (`docs/seo-routines/`) |
| Product | Speaking zero-turn rate / 30 d | 53% | <15% | `speaking_sessions.user_turns` |
| Email | Click tracking on | yes (2026-09-27) | click rate ≥3% | Resend |
| Email | Offer/campaign emails sent / 30 d | 0 | 2 | Resend / `send-campaign` |
| Web | Mobile Lighthouse median, 7 pages | 99 (was 89) | ≥95 (hold) | Lighthouse §7 |
| Web | Worst CLS | 0 (was 2.0) | <0.1 (hold) | Lighthouse §7 |
| Security | Actionable advisor warnings | 2 (was 3) | 0 | Supabase `get_advisors` |
| Security | Known exposed secrets | 2 (phx_ key in bundle; env vars non-secret) | 0 | agent-reported 2026-09-27; verify: grep the built JS for `phx_`; Netlify env `is_secret` |

## 3. Work order — one at a time, top first

The order follows one rule: **take the money already sitting there first** (the email list
and the failing subscriptions), then the traffic you already have (grammar pages, X-Ray), then new traffic
(social), then keep who arrives (activation). Polish comes last. Move down only when the
item above is done or blocked on someone else.

| # | Move | Area | Who | Status | Done when |
|---|---|---|---|---|---|
| 0 | **URGENT, secrets.** The revenue audit (2026-09-27) found every Netlify env var stored with `is_secret=false`, so the API returns them in plain text. `VITE_POSTHOG_KEY` is a `phx_` **personal** API key bundled into the public JS. Owner: revoke that key in PostHog and set `VITE_POSTHOG_KEY` to the `phc_` project key; mark every Netlify env var secret; rotate the Supabase service-role key and the other server secrets | Security | Owner | open | no `phx_` in the built JS; all env vars secret; keys rotated |
| 1 | One 10-min dashboard sitting: ~~Resend click tracking on~~ (done 2026-09-27 via connector) · Lemon Squeezy failed-payment emails on · Supabase leaked-password protection on | Revenue, Security | Owner | 1 of 3 done | all three toggles on |
| 2 | **Launch the sub-level courses by email.** Do NOT run `drafts/send-launch-email-1.sh`: it is the old telc B1 email with code START49, which expired 2026-09-14. Steps: (a) owner creates a new 100% code in Lemon Squeezy restricted to the A2.1 product (DMTEST100 is tied to the retired product); (b) owner buys A2.1 for €0 on `/pricing/` with a **fresh** account; (c) agent verifies the `course_a2_1` purchase row and the 90-day `plan_type='course'` Pro row, and owner deactivates the code; (d) agent stages `drafts/send-launch-sublevel-1.sh` from Email 1 of `drafts/launch-sublevel-courses-2026-09.md`, excluding subscribers and buyers, and fixes 3 copy issues (unsourced quote, "Goethe exam format" → Goethe-*style*, "since Monday"); (e) owner runs `test`, then `live` **once** — nothing records sends, so a rerun re-mails everyone | Revenue | Owner + agent | open | email sent once; clicks visible; first real sale |
| 3 | **Unpaid subscribers keep Pro.** The webhook copies the next renewal date into `subscription_end` even when the status is `unpaid`/`past_due`, so access rolls forward every month (e.g. last paid 06-03, Pro until 10-03). Fix: access must follow status, not only `subscription_end` | Revenue, Product | Agent (review) | open | an unpaid sub loses Pro at the end of its paid period; test pins it |
| 4 | **Trial end sells only Pro.** 181 trials ended in 30 days and 0 converted. The day-6 and trial-ended emails offer only €9.99/mo, never the one-time courses. Draft course-offer versions | Revenue, Email | Agent draft + **owner decision** | open | a trial-end email offers the course; trial→paid measured |
| 5 | Sign-up + course offer under the X-Ray result; record X-Ray→signup; find the traffic source — **source found: a crawler** (see §6); crawler renders now 403 before any AI call; offer card + `ref=xray` shipped | Acquisition, Activation | Agent | shipped 2026-09-27 (#155) | X-Ray→signup measured, ≥2% |
| 6 | Social pack live 2026-10-01: accounts created, IDs filled, posting Routine on | Acquisition | Owner, then agent | open | first attributed social signup |
| 7 | Fix speaking starts that end with zero learner turns (and 8 of 12 speaking users hit the free cap — an offer moment) | Product | Agent | shipped 2026-09-27 (#155) | zero-turn rate <15% |
| 8 | First-lesson path for new signups (land in a lesson, not a menu) | Activation | Agent | shipped 2026-09-27 (#155) | October cohort ≥18% |
| 9 | ~~Revoke EXECUTE on the exposed SECURITY DEFINER functions~~ — **done 2026-09-27**: `migrations/2026-09-27-revoke-public-execute.sql` applied via connector; 0 functions executable by anon/authenticated; `tests/function-grants.test.mjs` closes the class | Security | Agent | done | advisor warning gone |
| 10 | Measurement: verify `deutsch-meister.de` in GSC; allow `api.dataforseo.com` for this environment | Acquisition | Owner | open | both connectors return data |
| 11 | Stop bundling all of lucide-react (`vite.config.js:13`); self-host the two fonts; fix `/login` CLS | Web | Agent | shipped 2026-09-27 (#156) | median ≥95, worst CLS <0.1 |
| 12 | Visible support/contact entry in the app | Support | Agent | shipped 2026-09-27 (#155) | first ticket or reply received |
| 13 | Earn real backlinks (r/German answers, VHS/university resource lists) | Acquisition | Owner/brother | ongoing | 5 non-spam referring domains |

## 4. How the loop works (agents)

There is **one agent per area**, and each one is defined in `.claude/agents/<area>-agent.md`.
The **scorecard steward** (`.claude/agents/scorecard-steward.md`) owns the whole card.

All of them follow `docs/agents/PROTOCOL.md`:
1. Close the last experiment.
2. Measure.
3. Re-score with §5.
4. Make **one** move: the area's top §3 item, or a new one.
5. Log it in §6.
6. Open a PR.

Agents never merge. The owner reviews and merges. The weekly schedule and the Routine
prompts are in `docs/scorecard-routine.md`. On Monday the steward re-scores everything,
writes §8 and lists the PRs waiting for review.

Two rules keep eight loops from turning into eight polishing machines:
- An area that meets its §2 target does nothing that week.
- Every move needs a measurable "done when".

The learning is §6. Each run fills in the previous move's "after" value before choosing the
next move, and an idea logged as dropped does not come back without a new reason.

## 5. Rubric (how a score is decided)

- **Revenue** — monthly revenue (MRR + course sales in the last 30 days):
  1 <€100 · 2 €100–250 · 3 €250–500 · 4 €500–1k · 5 €1–2k · 6 €2–3.5k · 7 €3.5–5k ·
  8 €5–7k · 9 €7–10k · 10 ≥€10k (the goal).
- **Activation** — signup→first lesson, last full-month cohort:
  1 <5% · 2 5–12% · 3 12–18% · 4 18–25% · 5 25–32% · 6 32–40% · 7 40–50% · 8 50–60% ·
  9 60–70% · 10 >70%.
- **Acquisition** — signups per week, 30-day average:
  1 <25 · 2 25–50 · 3 50–100 · 4 100–200 · 5 200–350 · 6 350–500 · 7 500–750 ·
  8 750–1,000 · 9 1,000–1,500 · 10 >1,500. Capped at 3 until a non-brand channel brings
  ≥30% of attributed signups.
- **Product & reliability** — start at 8 for content built to the course standard.
  −2 if any core AI flow loses >30% of starts. −1 if a paid level is not on the standard.
  −2 if a payment or webhook failure went unhandled in the last 30 days. +1 when ≥30% of
  course starters finish Lektion 3.
- **Retention & email** — start at 1.
  +2 if bounce <2% and 0 complaints · +2 if open/click tracking is on and the click rate is
  known · +2 if ≥1 offer email was sent in the last 30 days · +2 if no live paid sub is
  failing · +1 if the email click rate is ≥3%.
- **Website performance** — median mobile Lighthouse performance over the 7 pages in §7,
  divided by 10 and rounded. −1 if any page has CLS >0.25.
- **Support** — 3 if any ticket is unanswered after 72 h · 5 if there are no tickets and no
  visible channel · 7 if the channel is visible and the median first response is <24 h ·
  10 if it is <4 h with nothing open past 48 h.
- **Security & engineering** — start at 10. −3 per advisor ERROR. −1 per actionable
  WARN group. −2 if CI is red on `main`. −2 while any known secret is exposed (a private
  key in the public bundle, or server secrets readable in plain text). This line was added
  2026-09-27, when the revenue audit found both.

Change a band only in a PR that says why, and re-score the history line it affects.

## 6. Experiments log (what was tried, what it moved)

| Date | Area | Move | Metric before → after | Keep / drop | Lesson |
|---|---|---|---|---|---|
| 2026-09-03 | Activation | A1.1 reordered: der/die/das first, alphabet moved to lesson 5 | grammar one-and-done (14 d): 1/9 (09-07) → 5/8 (09-21) → 1/4 (09-27) | inconclusive | cohorts of 4–9 can't show an effect; judge on a full month |
| 2026-09-12→14 | Product | A1.1 rebuilt + 23 DaF review rounds | Lektionen finished: 0 → 0 | keep content, stop polishing | quality without traffic moved nothing |
| 2026-09-27 | Email | Resend click tracking switched on for deutsch-meister.de (via connector) | click rate unknown → _next run_ | — | expected: click rate becomes measurable; required before any offer email |
| 2026-09-27 | Security | Revoked PUBLIC/anon/authenticated EXECUTE on 3 SECURITY DEFINER functions (applied) + class test | exposed functions 2 → 0 | keep | `REVOKE … FROM anon, authenticated` is a no-op while PUBLIC holds EXECUTE; always name PUBLIC |
| 2026-09-27 | Revenue | Launch-readiness audit | — | — | the staged launch script was the expired telc/START49 email; the precondition purchase never happened; audit before any send |
| 2026-09-27 | Acquisition | Traced the X-Ray "spike" (150–350 anon analyses/day since 09-14) | 98.3% of anon analyses = our own `grammar_examples` sentences, flat over 24 h, N ids per IP-day, 49 IP-days stopped at the 12 cap → **crawler** rendering the "Examine in X-Ray" links added 09-14 (96fe7e1) | fixed | a traffic number is not reach until it is split into humans vs bots; the "bright spot" in the first scorecard was wrong |
| 2026-09-27 | Support | `/support` open to everyone + links in every footer and the account menu (the only form sat behind the subscription guard: ~97% of accounts could not reach it) | tickets/30 d 0 → _next run_ | — | expected: first tickets within 2 weeks |
| 2026-09-27 | Activation | Confirm link no longer dead-ends on /login; last onboarding slide sends beginners straight to A1.1 Lektion 1; dashboard "Start here" card | Sep cohort signup→lesson 10% → _October cohort_ | — | expected ≥18% |
| 2026-09-27 | Product | Speaking: close sessions by server-counted turns; zero-turn sessions return the trial allowance; mic checked before a session is created | zero-turn 53% (13 of 24 were a counting bug) → _next run_ | — | expected <15%; 7/20 trial sessions this month were burnt |
| 2026-09-27 | Web | Tree-shook lucide-react, self-hosted Fraunces + Nunito Sans with metric-matched fallbacks, hero slides instead of fading, `<main>` min-height on /login | median 89 → 99; worst CLS 2.0 → 0; vendor-ui 757 → 102 KB | keep | area now at target; the 5% weight means no more work here unless it regresses |

## 7. How to refresh (exact sources)

Run these in order. Paste the numbers into §1 and §2, re-score with §5, and add a line to §8.

```sql
-- headline numbers (users, subs, MRR, course, AI use, lifecycle)
select public.weekly_truth_metrics();
-- activation cohorts
with c as (select u.id, date_trunc('month', u.created_at)::date m from auth.users u
           where u.created_at >= now() - interval '4 months')
select m, count(*) signups,
  count(*) filter (where exists (select 1 from user_grammar_progress g where g.user_id=c.id)
                      or exists (select 1 from lesson_progress l where l.user_id=c.id)) did_lesson
from c group by 1 order by 1;
-- speaking reliability
select count(*) started, count(*) filter (where coalesce(user_turns,0)=0) zero_turns
from speaking_sessions where created_at > now() - interval '30 days';
-- revenue ledger
select event_type, count(*) from webhook_logs where created_at > now() - interval '30 days' group by 1;
select status, count(*) from subscriptions where price_paid > 0 group by 1;
```

- **Security:** Supabase `get_advisors(type: security)`.
- **Email:** Resend `get-email-metrics` for the last 30 days, by domain.
- **Web:** Lighthouse mobile, median of 3 runs, on `/`, `/pricing/`,
  `/grammar/a1.1/definite-articles/`, `/courses/a1-1/`, `/leitfaden/telc-b1/`,
  `/level-test/` and `/login`. Use PageSpeed Insights when its quota allows; otherwise use a
  local production build, and label which one you used.
- **Search:** DataForSEO `domain_rank_overview` and `ranked_keywords`, with the procedure in
  `docs/seo-routines/`.

## 8. History

| Date | Total | Rev | Act | Acq | Prod | Ret | Web | Sup | Sec | What changed |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-09-27 | **30** | 1 | 2 | 2 | 5 | 3 | 8 | 5 | 7 | First measurement |
| 2026-09-27 (eve) | **30** | 1 | 2 | 2 | 5 | 3 | 8 | 5 | 6 | Exposed-function warning fixed (+1), but exposed secrets found (−2, new rubric line); click tracking on (the score moves once the click rate is measured) |
| 2026-09-27 (late) | **31** | 1 | 2 | 2 | 5 | 3 | 10 | 5 | 6 | Web to target (#156). Support, activation, speaking and X-Ray fixes shipped in #155; their areas are re-scored when the next cohort or run measures them |

## 9. Can't measure yet

- Live PageSpeed: the shared quota runs out (429), and the live site is blocked from agent
  sessions.
- Search Console: the `deutsch-meister.de` property is not verified on the connected
  account.
- DataForSEO: `api.dataforseo.com` is not on this environment's network allowlist.
- Email opens: open tracking is off by choice; pixels are unreliable. Clicks have been
  tracked since 2026-09-27.
- X-Ray traffic source: logged per call since PR #155; stored once `migrations/2026-09-27-xray-usage-source.sql` is applied.
