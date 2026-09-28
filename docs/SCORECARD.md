# DeutschMeister scorecard (living)

**Current: 31 / 100** · last measured 2026-09-28 (steward, after `weekly-truth` 06:00 UTC) · next refresh: Monday 2026-10-05 after `weekly-truth` (06:00 UTC)

This is the single source of truth for how the business is doing and what to work on next.
Every session that works on this business reads it first. Any session that moves an aspect
updates it in the same PR: the row, the metric, the work-order status, one history line, and
one experiment line. Scores come from the rubric (§5), never from judgement, so two sessions
measuring the same week get the same number. The dated snapshot this started from is
`docs/business-scorecard-2026-09-27.md`.

---

## 1. Scorecard

| Area | Weight | Score | Trend | Evidence (2026-09-28, steward) |
|---|---|---|---|---|
| Revenue | 25% | **1** | — | `weekly_metrics` 09-28 06:00 UTC: MRR €32.97 from 3 payers (€55.15 on 09-21), which is also the 30-day cash (3 renewals: €11.09, €9.99, €11.89). 3 more failing (2 past_due after failed renewals on 09-26 and 09-27, 1 unpaid). **0 real course sales ever**: `purchases` has 2 rows, both €0 (09-03 test, 09-08). No new paid sub in 30 days. Launch Email 1 is staged and guarded but **not sent**, and there is no `course_a2_1` test purchase yet (§3 #2, owner) Speaking: 12 learners in 30 d, 0 paying, 11 past the free cap, and that screen offered nothing to buy (#7b, fixed 09-28). **Signed-out Buy → signup never resumed the checkout for any sub-level course since 09-08** (fixed 09-28, #7b) |
| Activation | 20% | **2** | — | Last full month, **Aug: 17/165 = 10.3%** signup→first lesson (Jun 15%, Jul 16%). Sep so far: 15/148 = 10.1%. A1.1 over 14 days: 3 started Lektion 1, 0 finished; 2 active learners in the last 7 days. Writing: 0 ever. The first-lesson path (#155) has been live since the evening of 09-27, and there have been 0 signups since, so there is nothing to judge until the October cohort |
| Acquisition | 15% | **2** | — | 161 signups in 30 days = **37.6/week** (30 in the last 7 days). Since tracking began 09-20: 35 signups. 20 untracked, 15 attributed (13 Google, 1 Android app, 1 DuckDuckGo, all organic). 14 of the 15 landed on `/` (brand search) and 1 on `/podcasts/`, so non-brand is 1/15 (7%). **0** signups came from grammar, leitfaden or xray, but the #160 doors went live 09-27 23:24 UTC and there has been no signup of any kind since (the last one was 20:37 UTC), so no reading yet. The X-Ray crawler block holds: 3 analyses in the 11 h since #155 (was ~8/h), and `xray_usage.source` is now written. Keywords: the 09-22 baseline, 0/20 in the top 30 (DataForSEO still blocked, §9) |
| Product & reliability | 15% | **5** | — | 8 − 1 (paid levels still on older content) − 2 (**payment failures left unhandled**: the unpaid sub and the 2 renewals that failed on 09-26/27 all still hold Pro, to 10-03 and 10-26/27, because the webhook rolls `subscription_end` forward whatever the status; the fix is held on `owner-decision/paid-period-access`, §3 #3). The speaking −2 **no longer applies**: zero-turn rate is **24%** (11/45 in 30 days) after the closeout repair recounted the same sessions (it read 53%). There have been **0 speaking sessions since the fix** (the last was 09-26). A1.1 has 0 blocker/major findings; 84 grammar topics; 3 mock exams. Webhooks: 17 in 30 days, 0 errors. Product run 09-28 (Supabase logs, 7 days): **no listening or reading progress has ever been saved**. 4 of 4 listening saves answered 400, 823 progress reads failed (734 listening, 89 reading), and both tables have 0 rows ever, because the SPA named columns the live tables lack (fix in review, §3 #16; no score change, since listening and reading are not AI flows). Mock exams: 2 of 5 attempts finished in 30 days. A1.1: 5 started Lektion 1, 0 finished. Writing: 0 submissions ever |
| Retention & email | 10% | **3** | — | 1 + 2 (deutsch-meister.de 08-30→09-28: 31,872 sent, **1.88% bounce** (595 of 599 transient), 0 complaints). The click rate is **not scored yet**. The first tracked daily batch went out at 07:00 UTC today (1,122 sends). 70 min later it had 2 unique clickers (≈0.2%, provisional). It scores once that batch has had 24 h, i.e. next run. **The daily sentence went out once on 09-28**: one set of 12 batch calls, 07:00:52–59 UTC (on 09-27 it went out twice). 0 offer emails in 30 days. 3 of 6 live paid subs are failing. The bounce margin is thin: 09-27's double send alone produced 38 bounces at 21:00 UTC (§3 #2b) |
| Website performance | 5% | **10** | — | Mobile Lighthouse, median of 3, local build made the CI way (2026-09-28, 5b5ca6f, 138 pages verified): / 99, /pricing/ 99, grammar 99, course 99, guide 99, /level-test/ 83, /login 90 → **median 99**, worst CLS 0. /level-test/ and /login read 3–4 points under the 09-27 run (86/94) on a different container, which is still inside the band. At target, so no work here |
| Support | 5% | **5** | — | 0 tickets ever (0 messages) from 1,686 accounts. `/support` has been open to everyone since #155 (live the evening of 09-27), with footer and account-menu links. So the "no visible channel" half of band 5 no longer holds. Band 7 needs a measured median first response, though, and there is none without a ticket, so this stays 5 until the first ticket |
| Security & engineering | 5% | **6** | — | Advisors 0 ERROR. 2 actionable WARN groups: leaked-password protection off, and `pg_net` + `pg_trgm` in `public`. 14 INFO `rls_enabled_no_policy`: service-role-only tables, by design. CI green on `main` (run 704, 06f45bd; re-read 09-28 by the security agent, advisors unchanged). RLS (not in the advisor, so not scored): 5 own-row UPDATE policies had no explicit `WITH CHECK`; Postgres reuses USING, so none was exploitable, and the migration is written (#17). `video_library` and its storage bucket are writable by every signed-in account (#18). `npm audit --omit=dev`: root 0 high / 0 critical (15 moderate); astro-site **1 high / 1 critical on `main`** (was 10/1; #161), and the rest needs Astro 7 (§3 #14b, owner). Netlify's deploy secret scan on 5b5ca6f reports 0 matches, basic and enhanced. That does not clear #0: the basic scan only looks for the values of env vars marked secret, and none are, and the enhanced scan is not documented to know PostHog's `phx_` shape. **Still open: env vars stored non-secret, and the `phx_` key in the public JS** (#0, owner) → −2 |

Total = Σ(weight × score). First measurement, 2026-09-27: 25+40+30+75+30+40+25+35 = **300 → 30/100**.
Same evening, after the secrets finding and the rubric line it added: security 7 → 6, so
295 → **30/100** (rounded). 2026-09-28: 25+40+30+75+30+50+25+30 = **305 → 31/100** (30.5,
rounded half up, as on 09-27 late).

## 2. Metrics we track (the aspects)

| Area | Metric | Now | Next target | Source |
|---|---|---|---|---|
| Revenue | MRR | €32.97 (€55.15 on 09-21) | €100 | `weekly_truth_metrics()->subscriptions` |
| Revenue | Real course sales / 30 d | 0 (0 ever) | 3 | `purchases` where `price_paid > 0` |
| Revenue | Failing paid subs | 3 | 0 | `subscriptions.status in ('past_due','unpaid')` |
| Revenue | New paid subs / 30 d | 0 | 2 | `webhook_logs` `subscription_created` |
| Revenue | Speaking learners (30 d) who now pay | 0 of 12 (11 past the free cap) | ≥1 | §7 "speaking cap → paid" |
| Activation | Signup→first lesson (last full month) | 10.3% (Aug, 17/165); Sep so far 10.1% | 18% | cohort query §7 |
| Activation | A1.1 Lektionen finished / 14 d | 0 (3 started L1) | 5 | `weekly_truth_metrics()->course` |
| Acquisition | Signups / week (30-day avg) | 37.6 (161 / 30 d) | 50 | `auth.users` |
| Acquisition | Non-brand share of attributed signups | 1/15 (7%) | 30% | `profiles.acquisition_*` + landing page; leave `medium='onsite'` out (a page, not a channel — `docs/tracking-links.md`) |
| Acquisition | Signups through a grammar/guide door / 30 d | 0 (doors live since 09-27 23:24 UTC; 0 signups of any kind since) | 5 | `profiles.acquisition_last_source in ('grammar','leitfaden')` |
| Acquisition | Signups through the level-test door / 30 d | untraceable until #5c is merged and deployed; placed share of new signups 29/161 (18%, 09-28) | 5; placed share >18% | `acquisition_last_source = 'level-test'`; placed = `profiles.current_level` on the sub-level ladder |
| Acquisition | X-Ray → signup rate | 0 xray signups; the denominator is now separable (`xray_usage.source` written since 09-28 07:02; 1 human anon analysis in the 11 h after #155) | measured | `acquisition_last_source = 'xray'` ÷ human anon analyses (crawlers now 403) |
| Acquisition | Target keywords in top 30 | 0/20 (09-22 baseline) | 3/20 | DataForSEO (`docs/seo-routines/`) |
| Product | Speaking zero-turn rate / 30 d | 24% (11/45, the recount; it read 53%). 09-28 product run: still 0 sessions since the fix (the last was 09-26 15:29 UTC) | <15% | `speaking_sessions.user_turns` |
| Product | Learner progress requests the DB rejects / 7 d | 4 of 4 listening saves (100%); 823 failed progress reads (734 listening, 89 reading), all "column … does not exist" | 0 | Supabase `query_logs` edge + postgres logs (§7) |
| Email | Click tracking on | yes (2026-09-27 20:07 UTC). First tracked daily batch 09-28 07:00: 2 unique clickers of 1,122 after 70 min (≈0.2%, provisional) | click rate ≥3% | Resend `get-email-metrics` hourly, `unique_clicked` ÷ sent for the 07:00 batch, read ≥24 h after the send |
| Email | Daily-sentence copies per recipient per day | **1 on 09-28** (2 on 09-27; 1 on every other day since 08-30) | 1, every day | Resend `get-email-metrics` hourly, domain deutsch-meister.de, 07:00 UTC ÷ recipients; `list-logs`: one set of `/emails/batch` calls |
| Email | Offer/campaign emails sent / 30 d | 0 | 2 | Resend / `send-campaign` |
| Web | Mobile Lighthouse median, 7 pages | 99 (09-28 local build) | ≥95 (hold) | Lighthouse §7 |
| Web | Worst CLS | 0 | <0.1 (hold) | Lighthouse §7 |
| Security | Actionable advisor warnings | 2 | 0 | Supabase `get_advisors` |
| Security | Known exposed secrets | 2 (phx_ key in bundle; env vars non-secret) | 0 | agent-reported 2026-09-27; verify: grep the built JS for `phx_`; Netlify env `is_secret` |
| Security | CI on `main` | green (run 704, 06f45bd) | green | GitHub Actions, latest `main` run |
| Security | `npm audit --omit=dev` high / critical | root 0/0 · astro-site **1/1 on `main`** (was 10/1) | 0/0 both | `npm audit --omit=dev` in `/` and `astro-site/` |

## 3. Work order — one at a time, top first

The order follows one rule: **take the money already sitting there first** (the email list
and the failing subscriptions), then the traffic you already have (grammar pages, X-Ray), then new traffic
(social), then keep who arrives (activation). Polish comes last. Move down only when the
item above is done or blocked on someone else.

**Re-ranked 2026-09-28 (steward) by expected money per hour of work.** Row order is the rank,
and `#` is a stable id that other lines refer to. #0 stays on top as a safety override, not
for money. Items that are shipped and only being measured sit below the open ones. "Held"
means built on a local branch that is **not on `main` and not a PR**. It counts as shipped only
after the owner decides and merges.

| # | Move | Area | Who | Status | Done when |
|---|---|---|---|---|---|
| 0 | **URGENT, secrets.** The revenue audit (2026-09-27) found every Netlify env var stored with `is_secret=false`, so the API returns them in plain text. `VITE_POSTHOG_KEY` is a `phx_` **personal** API key bundled into the public JS. Owner: revoke that key in PostHog and set `VITE_POSTHOG_KEY` to the `phc_` project key; mark every Netlify env var secret; rotate the Supabase service-role key and the other server secrets | Security | Owner | open (09-28: Netlify's own deploy scan reports 0 matches, but its basic scan only checks vars marked secret, and none are, so it proves nothing here) | no `phx_` in the built JS; all env vars secret; keys rotated |
| 2 | **Launch the sub-level courses by email.** Do NOT run `drafts/send-launch-email-1.sh`: it is the old telc B1 email with code START49, which expired 2026-09-14 (now hard-retired: it exits before any request). Steps: (a) owner creates a new 100% code in Lemon Squeezy restricted to the A2.1 product (DMTEST100 is tied to the retired product); (b) owner buys A2.1 for €0 on `/pricing/` with a **fresh** account, and checks the A1.2/A2.1/A2.2 cards all show Buy; (c) agent verifies the `course_a2_1` purchase row and the 90-day `plan_type='course'` Pro row, and owner deactivates the code; ~~(d) agent stages `drafts/send-launch-sublevel-1.sh`~~ **done, merged #157**: copy in `drafts/launch-sublevel-1.mjs`, prices derived from `pricing.js`, excludes subscribers + every owner of a level it sells, `tests/launch-email.test.mjs`; (e) owner runs `preview`, `test`, then `LAUNCH_PRECONDITION_VERIFIED=yes … live` **once**. Nothing records sends, so a rerun would re-mail everyone; the script stamps itself and refuses a second live run | Revenue | Owner + agent | (d) merged; **owner next: (a) Lemon Squeezy → Discounts → new 100% code limited to the A2.1 product, then (b)** — the script refuses `live` until (c) is confirmed. 09-28: still no `course_a2_1` row | email sent once; clicks visible; first real sale |
| 4 | **Trial end sells only Pro.** 181 trials ended in 30 days and 0 converted. The day-6 and trial-ended emails offer only €9.99/mo, never the one-time courses | Revenue, Email | Agent (built) · **owner decision** | **held** on `owner-decision/trial-end-course-offer` (52912ff): day-6 + trial-ended also offer the level course (A1.2 for unplaced learners, the placed level if buyable, none for B1/B2), every site link UTM-tagged. **Owner:** approve the copy and merge; confirm `LEMONSQUEEZY_COURSE_A1_2/A2_1/A2_2_VARIANT_ID` are set in Netlify's functions scope, or the mail stays Pro-only | a trial-end email offers the course; trial→paid measured |
| 1 | One 10-min dashboard sitting: ~~Resend click tracking on~~ (done 2026-09-27 via connector) · Lemon Squeezy failed-payment emails on (2 renewals failed on 09-26/27) · Supabase leaked-password protection on (still WARN 09-28) | Revenue, Security | Owner | 1 of 3 done | all three toggles on |
| 3 | **Unpaid subscribers keep Pro.** The webhook copies the next renewal date into `subscription_end` even when the status is `unpaid`/`past_due`, so access rolls forward every month. 09-28: the unpaid sub holds Pro to 10-03, and the 2 past_due to 10-26/27. This is the −2 on Product | Revenue, Product | Agent (built) · **owner decision** | **held** on `owner-decision/paid-period-access` (3930892): one access rule (`src/lib/subscriptionAccess.js` = `_shared/subscriptionAccess.mjs`); unpaid/expired never grant; past_due keeps 15 d; `tests/subscription-access.test.mjs`; a data migration. **Owner:** approve the rule (15-day past_due grace), merge, deploy, then run the migration's preview and apply it | an unpaid sub loses Pro at the end of its paid period; test pins it; Product 5 → 7 |
| 0b | **No secret can ship in the public site.** A build gate (`scripts/check-bundle-secrets.mjs`) reads the finished `dist/` and fails the Netlify build and CI on a server-credential shape or a server-secret env value, and never prints it | Security | Agent (built) · **owner decision** | **held** on `owner-decision/bundle-secret-gate` (adc57d4). **Owner: merge only after #0**, or the first deploy fails on the live `phx_` key (the site stays on the last good deploy) | every deploy log measures the bundle half of "known exposed secrets" |
| 2b | **~20 recipients bounce every day.** About 20 daily-sentence recipients soft-bounce each day (the bounce lands ~14 h later, ~21:00 UTC). That is ~90% of the 1.88% bounce rate, just under the 2% rubric edge (595 of 599 bounces in 30 days were transient, so Resend never suppresses them). The launch email (#2) would hit them too, so do this **before** that send. Stop mailing addresses that bounced on ≥3 of the last 7 days | Email | Agent | open, **first agent move** | bounce rate <0.5% |
| 8b | **The activation emails point away from the lesson.** `activation-lifecycle.mjs` mails only users with zero lesson activity (23 day-1 + 24 day-4 mails in the last 7 days). But its two CTAs go to `/level-test/` (d1) and `/analyze/` (d4), and neither counts as a first lesson. Neither link carries a UTM either. Point the primary CTA at `FIRST_LESSON_HREF` (`src/lib/firstRun.js`, A1.1 Lektion 1). Tag both with `utm_source=email&utm_medium=lifecycle&utm_campaign=activation_d1\|d4`, and keep the rule that we never tell someone they have not used a lesson (added 09-28, steward) | Activation | Agent draft · **owner decision** (email content) | open | first lessons traceable to `activation_d1/d4`; October cohort ≥12% |
| 8d | **Signed-in placement saves a different level than the result shows.** `LevelTest.jsx` writes `determinedSublevel` (before the listening/speaking demotion), while `LevelTestResults` shows `finalSublevel` (after it). So a demoted signed-in tester is stored one step higher than the screen said, and the first-run card sends them to that level. The signed-out path (#5c) stores the level shown. Found 2026-09-28 by the acquisition agent, left for Activation | Activation | Agent | open | the stored level equals the level shown, signed in or out; a test pins it |
| 8c | **The activation audience missed the A1.1 course.** `activation-lifecycle.mjs` mails only status `new` in `lifecycle_customer_state`, and that view counted 3 tables (grammar, listening, reading). The course player writes `lesson_progress`/`lesson_attempts`, so a learner inside an A1.1 Lektion stayed `new`. Measured 09-28: of 160 activation mails in 30 days (87 users), **6 (3 users) went to learners who had opened an A1.1 Lektion before the send**. Counting every uncounted source (mock exams, AI speaking, vocabulary) it was 30 mails (17 users). `migrations/2026-09-28-lifecycle-lesson-activity.sql`: `status` reads one `has_lesson_activity` over 11 sources (placement speaking left out); 20 of 1,505 `new` users move. The mailer requires that column in both reads, so on the old view it sends nothing. `tests/lifecycle.test.mjs` classifies every table the app writes as a lesson source or not, and fails when the newest view drifts from that list (12 mutations, all caught; found by the orchestrator). **Also found, not in this move:** the admin "Aktiviert" figure (`_shared/adminCockpit.mjs`) re-derives its own 5-table rule and counts a Lektion only at `status === 'completed'`, a value `lesson_progress` never holds (`complete`/`gold`) | Activation | Agent (built) · **owner decision** (email audience, migration) | **built, migration not yet applied**. **Owner:** run the preview in the migration header, apply it, then merge. If it is merged first, activation mail pauses until the migration is applied | 0 activation mails to users with lesson activity before the send, over the 30 days after apply (§7 query) |
| 7b | **The free-speaking limit offers nothing to buy.** Measured 2026-09-28: 12 learners used AI speaking in 30 d, 0 paying, and 11 are past the free allowance (3 used both trial sessions, 8 more are past the end of their trial). Past the cap, `/speaking` showed a disabled "Start · €1" and "Not enough credit — top-ups are coming soon"; a locked mission linked the generic `/pricing/`. Now one offer card replaces both: the buyable course for the learner's level with its included Pro months, else Pro (B1/B2 coming soon, A1.1 free, level already owned, or checkout id unset). The level is the precise profile level, else the level being practised, because 1,632 of 1,686 profiles hold the signup default `a1`. Decision: `src/lib/speakingOffer.js`; card: `src/components/speaking/SpeakingLimitOffer.jsx`; both buttons use `/subscription?buy=<key>`; `paywall_shown` fires with `feature: speaking_limit`. `tests/speaking-offer.test.mjs` (11 tests, 8 mutations, all caught). **Found while testing that path:** `buyIntent.js` accepted only `course_[a-z0-9]+`, so since the 09-08 sub-level re-cut it dropped every `course_a1_2`/`course_a2_1`/`course_a2_2` intent, and a signed-out Buy on `/pricing/` or `/courses/` landed on `/dashboard` after signup with no checkout. Fixed in the same branch; the test runs every product key through the real pattern | Revenue | Agent (review) | shipped 2026-09-28 (loop round 4). **Owner check:** as a free account past the trial on `/speaking`, pick A2.1: the A2.1 card shows and its button opens the A2.1 checkout | first real sale or paid sub from a learner who hit the speaking cap (§2 row) |
| 16 | **Listening and reading progress was never saved.** Measured 2026-09-28 in the Supabase edge and Postgres logs over 7 days: 4 of 4 listening completions answered 400 on save, and 823 progress reads failed ("column user_listening_progress.completed does not exist" 734 times; `user_reading_progress.completed_at` 89 times). The SPA asked each table for the other one's column: listening has only `completed_at`, and reading has `completed` + `last_read_at`. supabase-js resolves on a 400 instead of throwing, and every caller was fail-soft, so both tables have 0 rows ever. As a result, the level cards, the dashboard streak and the activation mailer's "activated" status never saw a finished exercise, so a listening-only learner could still get the "you haven't started" mail. The 2026-08-17 migration fixed this table once for two other columns and missed the third. **Fix:** the six call sites now use the real columns, with one definition in `src/lib/listeningProgress.js`. **Class closed by a rule:** `tests/db-columns.test.mjs` parses every supabase-js chain in `src/` + `netlify/functions/` (323 chains, 1,352 column references) and fails on any table or column missing from `tests/fixtures/db-schema.json`, the live-schema snapshot. Run on the old code, it reports exactly those six. No migration, no email copy or rule change | Product | Agent (review) | built 2026-09-28 on branch `worktree-agent-af8654ce897a86176`, not merged. **Owner check:** signed in, finish exercise 1 on `/listening/a1.1/1`, then reload `/listening/`. The A1.1 card should read 1/N and the exercise card should show a check. In Supabase, `select count(*) from user_listening_progress` should be ≥1 | 0 REST 4xx on `user_listening_progress`/`user_reading_progress` for 7 days; one saved row per listening submit |
| 6 | Social pack live 2026-10-01: accounts created, IDs filled, posting Routine on | Acquisition | Owner, then agent | open, owner (3 days left) | first attributed social signup |
| 10 | Measurement: verify `deutsch-meister.de` in GSC (confirm which Google account owns the property); allow `api.dataforseo.com` for this environment (09-28: direct curl gets CONNECT 403, and the DataForSEO connector gets "Host not in allowlist") | Acquisition | Owner | open | both connectors return data |
| 13 | Earn real backlinks (r/German answers, VHS/university resource lists) | Acquisition | Owner/brother | ongoing | 5 non-spam referring domains |
| 18 | **Every signed-in account can rewrite the video library.** Measured 2026-09-28 (security agent, pg_policies): `video_library` has INSERT, UPDATE and DELETE policies `TO authenticated` with `true`, and the `video-library` storage bucket has the same three for `authenticated`, with public read. So any of the ~1,686 accounts (signup is free) can delete or replace the 11 published videos, or host arbitrary files on our storage. The cause is that `src/pages/AdminVideosPage.jsx` writes with the user's own JWT. Fix: move the admin video writes behind the admin role (a service-role Netlify function, as `_shared/adminContentLib.mjs` does for the other content tables), then drop the six client write policies in one migration | Security | Agent | open | no INSERT/UPDATE/DELETE policy on `video_library` or the `video-library` bucket for `public`/`anon`/`authenticated`; `OPEN_ELSEWHERE` in `tests/rls-update-check.test.mjs` is empty |
| 14 | **astro-site dependencies.** (a) **Merged #161**: `npm audit fix` in range, 34 packages, astro 5.18.1 → 5.18.2, the hollow `@types/ms` lock entry fixed; `main` now reads **1 high / 1 critical** (09-28), and the built site is byte-identical. `tests/astro-deps.test.mjs` pins the floors and the reachability guards. (b) **Owner decision:** the critical (`astro` ≤7.2.7, AVIF-optimisation RCE) and `sharp` are fixed only by **Astro 5 → 7**, a major. Neither is reachable today (no `astro:assets`, no adapter, sharp never loaded), and the test holds that line | Security | Owner (b) | (a) done; (b) **owner: approve or decline an Astro 7 upgrade PR** | astro-site 0 critical, 0 high |
| 15 | Root **dev** dependencies (not in the `--omit=dev` metric): 14 high on 09-27 (vite 5, rollup, postcss, lighthouse/puppeteer, sharp). This is SPA build and local tooling, and none of it reaches the bundle. `npm audit fix` covers 12; vite and sharp need majors | Security | Agent | open (unblocked: #14a merged); no money, so last | root full audit 0 high |
| 17 | **`user_reading_progress` UPDATE policy has no `WITH CHECK`** (found 2026-09-28 by the product agent while verifying #16, not touched). `USING (auth.uid() = user_id)` alone lets a signed-in user move their own row to another `user_id`. The impact is low (reading progress only), but it is the documented past-bug shape (`migrations/2026-09-12-lesson-engine.sql`). `user_listening_progress` already has the check. Fix: a migration that recreates the policy `TO authenticated … WITH CHECK (auth.uid() = user_id)`, for the owner to apply | Security | Agent, then owner | **migration written, not applied** (09-28, security agent). Measured: 5 own-row UPDATE policies with no `WITH CHECK` (`user_grammar_notes`, `user_grammar_progress`, `user_progress` "Users can update own progress", `user_reading_progress`, `user_script_progress`, all `TO public`). **Correction:** none let a user move a row: Postgres reuses USING as the check when WITH CHECK is absent (verified in Postgres 17.5), so the fix is visibility and decoupling, with no behaviour change. `tests/rls-update-check.test.mjs` holds migrations/ and a live-policy snapshot to the rule. **Owner:** run the preview in `migrations/2026-09-28-update-policies-with-check.sql` (expect 5 rows), apply it, then refresh `tests/fixtures/db-policies.json` and empty `PENDING_APPLY` | `pg_policies` shows a `with_check` on every UPDATE/ALL policy a client role can use (the preview query returns 0 rows) |
| 2a | **Daily sentence sent twice on 2026-09-27** (a Netlify scheduler retry). Every live batch now carries a Resend `Idempotency-Key` of (UTC date, batch index), and recipients are in a deterministic order | Email | Agent | **merged #159**, deployed 09-27 22:42 UTC. **09-28: 1 copy** (1,122 sends, one set of 12 batch calls in 7 s; no retry happened, so the key path was not exercised). Day 1 of 7 | 07:00 UTC sends ≈ recipient count every day for 7 days (to 10-04) |
| 5 | Sign-up + course offer under the X-Ray result; record X-Ray→signup; crawler renders now 403 before any AI call | Acquisition, Activation | Agent | shipped 2026-09-27 (#155). 09-28: 3 analyses in 11 h (was ~8/h); `source` is being written | X-Ray→signup measured, ≥2% |
| 5b | **Convert the grammar and guide traffic, and make it traceable.** Every signup door on the 84 grammar lessons and 8 guides now carries `?ref=grammar\|leitfaden&utm_medium=onsite&utm_content=<slug>` (`astro-site/src/lib/onsiteLinks.js`), and `tests/onsite-attribution.test.mjs` fails on any bare door | Acquisition | Agent | **merged #160**, live 09-27 23:24 UTC. 09-28: 0 door signups, but also 0 signups of any kind since | ≥5 signups / 30 d with `acquisition_last_source` in (grammar, leitfaden). If still 0 after 30 days live, those pages have too little traffic to convert and the lever is authority (#13), not conversion |
| 5c | **The level-test result's signup door saved nothing and was untraceable.** "Find your level — free" is the homepage's primary button (twice), and 14 of the 15 attributed signups since 09-20 landed on `/`. The test ends on "Sign up free — save my results", but a signed-out result lived in React state only and the link's `?level=` was never read, so the new account kept the `a1` default and was offered the test again; the door carried no tag. Now the result the screen shows is kept in localStorage `dm_placement`, written to `profiles.current_level` at the first profile load after sign-in on that browser (only into an unplaced account, once), `/signup` names the level it will save, and the door is `/signup?ref=level-test&utm_medium=onsite&utm_content=<level>` (`src/lib/placement.js`, `src/services/placementService.js`; `tests/placement.test.mjs`: 7 tests, 9 mutations, all caught). The card's figures now come from `marketing.js` (it said "2 free AI speaking sessions" and "unlock your level" without the trial) | Acquisition | Agent (review) | shipped 2026-09-28 (branch, not merged). **Owner check:** signed out, finish `/level-test/` and press "Sign up free — save my results": `/signup` names the level; confirm, sign in on the same browser, and the dashboard's first card points at that level, not at the test | ≥5 signups / 30 d with `acquisition_last_source = 'level-test'`; placed share of new signups above 18% (29/161 on 09-28). If `level-test` stays 0 while signups hold, the homepage's main path is not the test, and the next conversion work belongs on `/` itself |
| 7 | Fix speaking starts that end with zero learner turns | Product | Agent | shipped 2026-09-27 (#155) + closeout repair applied. 09-28: 24% (recount), 0 sessions since | zero-turn rate <15% |
| 8 | First-lesson path for new signups (land in a lesson, not a menu) | Activation | Agent | shipped 2026-09-27 (#155); judged on the October cohort | October cohort ≥18% |
| 12 | Visible support/contact entry in the app | Support | Agent | shipped 2026-09-27 (#155); 0 tickets at 09-28 | first ticket or reply received |
| 9 | ~~Revoke EXECUTE on the exposed SECURITY DEFINER functions~~ | Security | Agent | done 2026-09-27 | advisor warning gone |
| 11 | Tree-shake lucide-react; self-host the two fonts; fix `/login` CLS | Web | Agent | shipped 2026-09-27 (#156); 09-28 median 99, CLS 0 | median ≥95, worst CLS <0.1 |

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
| 2026-09-27 | Email | Resend click tracking switched on for deutsch-meister.de (via connector) | click rate unknown → still unknown at 22:18 UTC: 1 click from ~50 sends after the switch (20:07), 0 tracked daily batches → **09-28 08:10 UTC: first tracked daily batch (07:00, 1,122 sends): 2 unique clickers after 70 min (≈0.2%, provisional)** | keep | a tracking switch has no "after" until one full send cycle has run. Re-measure over 7 days of daily batches (from 09-28); the rubric's "known" is read once a batch has had 24 h |
| 2026-09-27 | Security | Revoked PUBLIC/anon/authenticated EXECUTE on 3 SECURITY DEFINER functions (applied) + class test | exposed functions 2 → 0 | keep | `REVOKE … FROM anon, authenticated` is a no-op while PUBLIC holds EXECUTE; always name PUBLIC |
| 2026-09-27 | Revenue | Launch-readiness audit | — (no metric) | keep | the staged launch script was the expired telc/START49 email; the precondition purchase never happened; audit before any send |
| 2026-09-27 | Acquisition | Traced the X-Ray "spike" (150–350 anon analyses/day since 09-14) | 98.3% of anon analyses = our own `grammar_examples` sentences, flat over 24 h, N ids per IP-day, 49 IP-days stopped at the 12 cap → **crawler** rendering the "Examine in X-Ray" links added 09-14 (96fe7e1) | fixed | a traffic number is not reach until it is split into humans vs bots; the "bright spot" in the first scorecard was wrong |
| 2026-09-27 | Support | `/support` open to everyone + links in every footer and the account menu (the only form sat behind the subscription guard: ~97% of accounts could not reach it) | tickets/30 d 0 → 0 at 09-28 08:15 UTC (~13 h live; window to 10-11) | — (window open) | expected: first tickets within 2 weeks |
| 2026-09-27 | Activation | Confirm link no longer dead-ends on /login; last onboarding slide sends beginners straight to A1.1 Lektion 1; dashboard "Start here" card | Sep cohort signup→lesson 10% → _October cohort_ (09-28: 0 signups since the deploy, nothing to read) | — | expected ≥18% |
| 2026-09-27 | Product | Speaking: close sessions by server-counted turns; zero-turn sessions return the trial allowance; mic checked before a session is created | zero-turn 53% (13 of 24 were a counting bug) → **24% (11/45)** on 09-28: the same 45 sessions, recounted by the applied closeout repair; 0 sessions since the fix (last 09-26) → **closed 09-28 (product run): still 0 sessions started after 09-27 20:48 UTC**; 30 d 11/45, and every zero-turn session is `cancelled` (free 4/14, mission 3/6, placement 4/25) | keep | half the "zero-turn" problem was counting, and the recount alone removed the −2. The behaviour change cannot be judged at ~1.5 sessions a day. Read it again once ≥20 post-fix sessions exist, instead of re-opening this line every run |
| 2026-09-27 | Revenue | Staged launch Email 1 (`drafts/send-launch-sublevel-1.sh` + `launch-sublevel-1.mjs`): prices derived from `pricing.js`; excludes subscribers and owners of any sold level; `live` refuses without `LAUNCH_PRECONDITION_VERIFIED=yes`, a test of the same copy, and a typed SEND, and stamps itself one-shot; START49 script hard-retired | real course sales / 30 d 0 → 0 on 09-28 (not sent: owner steps (a)–(b) still open; offer emails / 30 d still 0) | — (not run yet) | expected: owner sends once after (a)–(c) to ~1,080 accounts; ≥1 real sale within 14 days of the send, clicks visible in Resend. If 0 sales in 14 days, the next lever is traffic, not copy |
| 2026-09-27 | Security | astro-site `npm audit fix` in range (no `--force`, 34 packages, astro 5.18.1 → 5.18.2), hollow lock entry removed, `tests/astro-deps.test.mjs` (6 tests; 6 mutations, all caught). Branch, not merged | astro-site high/critical 10/1 → 1/1 in branch → **1/1 on `main`** (09-28, after #161; CI run 616 green) | keep | expected: `main` reads 1/1 after merge, and 0/0 only with Astro 7 (owner). A lockfile left for the session hook to rewrite is itself a bug: the hollow entry, not agents, caused the churn |
| 2026-09-27 | Web | Tree-shook lucide-react, self-hosted Fraunces + Nunito Sans with metric-matched fallbacks, hero slides instead of fading, `<main>` min-height on /login | median 89 → 99; worst CLS 2.0 → 0; vendor-ui 757 → 102 KB | keep | area now at target; the 5% weight means no more work here unless it regresses |
| 2026-09-27 | Email | Daily sentence made idempotent per UTC day: a Resend `Idempotency-Key` per (date, batch) plus a deterministic recipient order, so a Netlify scheduler retry replays instead of re-sending (branch, not merged) | copies per recipient on 09-27: 2 → **1 on 09-28** (1,122 sends in the 07:00 hour; one set of 12 batch calls, 07:00:52–59 UTC). No retry happened, so the key path was not exercised | keep (1 of 7 days) | expected: 1 copy every day. A retry shows up in Resend's log as a second set of batch calls with no second 07:00 volume. If a day still doubles, the payload differed between runs: look at what in `buildEmail` changes between invocations |
| 2026-09-27 | Acquisition | Attributed every signup door on the 84 grammar lessons + 8 guides (+ both hubs, nav) and added a free-account door to the guides and a signed-out "score not saved" line under the exercises (#5b) | grammar/guide-door signups / 30 d: 0 (untraceable; 20/35 signups since 09-20 untracked) → 0 on 09-28 08:15 UTC, with 0 signups of any kind since the doors went live (09-27 23:24 UTC) → **0 at 09-28 09:22 UTC** (acquisition agent): still 0 signups of any kind since 09-27 20:37 UTC, a 12.7 h gap. Not yet a signal: 16 gaps of ≥12 h in the last 30 days (longest 27.5 h), the signup path is unchanged since 09-21, and `signup_attempts` has logged no failure since 09-22 | — (window to 10-11) | expected: first `grammar`/`leitfaden` signups within 14 days of deploy, untracked share below 57%. 0 after 30 days = those pages don't get the traffic; stop polishing conversion there |
| 2026-09-28 | Revenue | Speaking-limit offer (#7b): the level's buyable course with its included Pro months, else Pro, in place of "top-ups are coming soon" and the generic `/pricing/` link. Same branch: `dm_buy_intent` accepts sub-level keys again (dropped since 09-08) | speaking learners (30 d) who now pay: 0 of 12 → _next run_; real course sales / 30 d 0 → _next run_ | — | expected: ≥1 course sale or paid sub from a capped speaking learner within 30 days of deploy; the A1.2/A2.1/A2.2 learners (3 of the 12 this month) see a course, the rest see Pro. If still 0 with ~10 capped learners a month, the volume is too small for this moment to matter and the next revenue lever is the launch email (#2), not more paywall work |
| 2026-09-28 | Product | Listening + reading progress written and read with the live columns, plus a rule: every supabase-js query in `src/` + `netlify/functions/` must name only tables and columns in the live-schema snapshot (#16; branch, not merged) | listening saves rejected (7 d): 4 of 4 → _next run_; failed progress reads (7 d): 823 → _next run_; rows ever in both tables: 0 / 0 → _next run_ | — | expected: 0 "does not exist" errors on both tables from the first day after deploy, and one row per listening submit. Found by reading the DB's error logs, not the tables: no table showed the failure, only the logs did. Every run should start from the 4xx list in §7 |
| 2026-09-28 | Acquisition | Level-test signup door (#5c): the signed-out result is kept and saved at the first sign-in on that browser, `/signup` names it, and the door carries `ref=level-test` (branch, not merged) | level-test-door signups / 30 d: untraceable → _next run_ (countable only after merge + deploy); placed share of new signups: 29/161 (18%) → _next run_ | — | expected: the homepage's main path becomes countable, ≥5 `level-test` signups within 30 days of deploy, and the placed share rises because signed-out testers now arrive placed. The door existed already, so the signup count itself may not move: this buys the measurement and keeps a promise. Chosen over a 9th Leitfaden because the 09-22 baseline says authority, not on-page, is the limit (0 of 8 guides in the top 30) |
| 2026-09-28 | Activation | #8c: `lifecycle_customer_state` counts every lesson-activity source (11, the A1.1 course player included), and the activation mailer requires `has_lesson_activity = false` in both reads. Migration **not applied**; branch, not merged | activation mails (30 d) to users who already had lesson activity: 6 of 160 via the course player (3 users), 30 via any uncounted source (17 users) → _30 days after apply_ | — | expected: 0 (§7 query). The audience shrinks by 20 of 1,505 `new` users, so d1/d4 volume barely moves. A definition that lists its tables goes stale the day a feature writes a new one, so the test classifies every written table rather than trusting a comment |
| 2026-09-28 | Security | #17: one migration recreates the 5 own-row UPDATE policies with an explicit `WITH CHECK`, `TO authenticated`, in one transaction whose closing guard aborts if any is left (checked in PGlite: idempotent, behaviour unchanged, guard aborts on a stray policy). `tests/rls-update-check.test.mjs` (10 tests; 14 mutations, all caught) holds migrations/ and the new live snapshot `tests/fixtures/db-policies.json` to the rule. **Not applied**; branch, not merged | client UPDATE/ALL policies without a check that keeps their owner: 5 own-row + 1 open (`video_library`) → _after the owner applies_ (expected 0 own-row, `video_library` stays until #18) | — | expected: the preview query returns 0 rows after apply. with_check = NULL is not "no check": Postgres reuses USING. The shape that does open a table is a permissive sibling with a weaker check (policies are OR-combined), or a USING (true) write policy, and the one live instance of that is `video_library` (#18). Read the rows that are `true` before the ones that are NULL |

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
-- speaking cap → paid (work order #7b): speaking learners in 30 d who now pay
with s as (select distinct user_id from speaking_sessions
           where started_at > now() - interval '30 days' and coalesce(mode,'') <> 'placement')
select count(*) speaking_users,
  count(*) filter (where exists (select 1 from purchases p where p.user_id = s.user_id and p.price_paid > 0
                                   and p.lemonsqueezy_order_id not like 'owner-%')
                      or exists (select 1 from subscriptions x where x.user_id = s.user_id
                                   and x.subscription_end > now() and x.price_paid > 0)) paid
from s;
-- activation mail honesty (work order #8c): activation mails in 30 d whose recipient
-- already had lesson activity. Keep the union in step with LESSON_ACTIVITY_SOURCES in
-- tests/lifecycle.test.mjs; the 3 tables the old view already counted are left out.
with m as (select user_id, sent_at from lifecycle_emails
           where kind in ('activation_d1','activation_d4') and sent_at > now() - interval '30 days'),
src as (select user_id, updated_at t from lesson_progress
  union all select user_id, created_at from lesson_attempts
  union all select user_id, created_at from review_cards
  union all select user_id, completed_at from program_progress
  union all select user_id, created_at from writing_submissions
  union all select user_id, created_at from exam_attempts
  union all select user_id, created_at from vocab_srs_cards
  union all select user_id, created_at from speaking_sessions where coalesce(mode,'') <> 'placement')
select count(*) mails, count(*) filter (where exists (select 1 from src
  where src.user_id = m.user_id and src.t < m.sent_at)) mailed_with_lessons
from m;
```

- **Product, requests the DB rejects** (§3 #16): Supabase `query_logs`, one call per 24 h window
  (7 calls for a week). The request side is `source = 'edge_logs'`:
  `select splitByString(' | ', event_message)[1] m, splitByString(' | ', event_message)[2] s, extract(splitByString(' | ', event_message)[3], 'supabase\\.co(/[a-z0-9]+/v1/[a-z_0-9-]+)') p, count(*) n from logs where source = 'edge_logs' and toInt32OrZero(splitByString(' | ', event_message)[2]) >= 400 group by m, s, p order by n desc`.
  The reason is in `source = 'postgres_logs'`, `event_message like '%does not exist%'`. Singletons
  there are usually ad-hoc connector SQL, not the app. Token 400s are wrong passwords.
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
| 2026-09-28 | **31** | 1 | 2 | 2 | 5 | 3 | 10 | 5 | 6 | Monday re-score after `weekly-truth`. Merged since the last line: #157 (guarded sub-level launch email, START49 retired), #159 (daily sentence idempotent: **1 copy on 09-28**, was 2), #160 (attributed grammar/guide doors, no signup since they went live), #161 (astro-site audit 10/1 → 1/1). No score moved. Product holds at 5 for a new reason: the speaking −2 dropped (24% zero-turn after the recount), and a −2 now applies for failed renewals keeping Pro (fix held, §3 #3). The click rate first became measurable today, so Retention can reach 5 next run. Merged this week: #146, #148, #150, #152, #154–#157, #159–#161. Held for the owner, not counted: trial-end course offer, paid-period access, bundle-secret gate |

## 9. Can't measure yet

- Live PageSpeed: the shared quota runs out (429), and the live site is blocked from agent
  sessions.
- Search Console: the `deutsch-meister.de` property is not verified on the connected
  account.
- DataForSEO: `api.dataforseo.com` is not on this environment's network allowlist. Re-checked 2026-09-28 (steward): a direct curl gets `CONNECT tunnel failed, 403`, and the DataForSEO MCP connector gets "Host not in allowlist". Re-checked 09-28 09:20 UTC (acquisition agent): the connector still answers "Host not in allowlist: api.dataforseo.com". Keyword figures are the 09-22 baseline.
- Grammar/guide page traffic: no page-view source is reachable (GA4 and PostHog are not connected to agent sessions; GSC unverified), so the new doors give a signup **count**, not a conversion **rate**. The same holds for `/level-test/`: signed-out test completions are recorded nowhere, so the #5c door gives a count too.
- Email opens: open tracking is off by choice; pixels are unreliable. Clicks have been
  tracked since 2026-09-27.
- X-Ray traffic source: ~~not separable~~ **resolved 2026-09-28**. `xray_usage.source` is written from 09-28 07:02 UTC (2 of the 3 analyses since #155; the 09-27 21:28 one has none). One came from the Gmail Android app, i.e. a daily-sentence link. Human anonymous analyses can now be counted, so the X-Ray→signup denominator exists.
- Email click rate: at a morning run, the day's 07:00 batch has had only ~1 h of clicks. The steward scores the rubric's "click rate is known" once a batch has had 24 h (first: the 09-28 batch, readable on 09-29).
- Web: the 09-28 Lighthouse figures are a local build made the CI way, run in this container (Chromium 1194, gzip static server), not PageSpeed. Expect ±3–4 points between containers on the SPA pages.
- `phx_` in the live bundle: `deutsch-meister.de` answers the agent proxy with `CONNECT 403`. A local build has no production env values, so grepping it proves nothing. Agents must not read Netlify env values: the API returns them in plain text, so reading one prints it.
- Netlify function logs: the Netlify connector has no log API (re-checked 2026-09-28 by the product agent: its read operations are only projects, forms and deploys). So AI function error rates (speaking, writing, X-Ray) are not measurable from agent sessions. The Supabase edge logs cover only what the functions write back. The 09-27 scheduler retry is inferred from Resend's API-log timing and was not read in Netlify's own log. The owner can confirm it in the UI (§3 #2a).
