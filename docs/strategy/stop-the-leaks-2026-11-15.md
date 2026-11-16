# Stop the leaks: a top-class website, aspect by aspect

## Context

Zaid (2026-11-15, verbatim): "lets work on each aspect and stop leaks and make it a top class
website from all aspect , we go big and then step by step in smaller details".

Standing limits from the same day: courses, offers and prices are left to the end; so is bringing
people in (group posts). He gets findings and results, not tasks or end-stage questions.

Where people are lost today (Google Analytics 18 Oct – 14 Nov, cookie-accepting visitors; database
same window):

| Step | People | Lost here |
|---|---|---|
| Visited | 352 | |
| Started a lesson as a guest | 98 | 72% never start |
| Wrote a first sentence | 59 | |
| Started signing up | 49 | |
| Signed up (database) | 63 | |
| Confirmed their email | ~47 | 25–29% never confirm |
| Came back on a second day | 3 | 95% never return |

Causes found in the live code (origin/main) and the data:

- **Sign-up depends on the inbox.** Email + password only, no Google sign-in, although 93% of
  addresses are gmail.com. Until the link is clicked the account can use nothing
  (`EmailVerificationGate`, `src/App.jsx`). A welcome email is sent at the same moment as the
  confirmation email and its button opens Lektion 1 without an account
  (`netlify/functions/send-welcome-email.mjs`), so some people click the wrong one. On another
  device or in Gmail's in-app browser the link lands on the dashboard, not the lesson
  (`AUTH_CONTINUITY_ENABLED` is off by default, `src/lib/authContinuityFlag.js`).
- **No email leads back.** Only the course reminder links to the learner's own next step
  (8 of 34 came back). Trial day 3 / day 6 / ended link to `/analyze/` or `/pricing/`; no email
  signs a learner in. 236 lifecycle emails in 30 days → 17 sign-ins.
- **The domain mails people who are gone.** 31,810 emails in 29 days (Resend), almost all the
  daily sentence, to every confirmed account that has not opted out (`daily-sentence.mjs`
  `getRecipients`): 1,150 people, of whom 58 signed in during the last 30 days. Clicks 0.39%,
  bounces 2.08%. Likely harm to inbox placement of the confirmation email: plausible, not proven.
- **A support ticket notifies nobody.** `support-ticket-create.mjs` writes the row and returns;
  the alert paths ship off. One ticket of 2026-10-20 has no reply.
- **Google Analytics has no conversions marked** (0 key events), so no rate per source.

## How the work runs

- One fresh branch from `origin/main` per step (the local folder is 42 commits behind; never build
  on it). One PR per step, merged when green.
- Every step: find the cause → smallest fix → test → play it in a real browser → read the number
  it was meant to move a week later.
- Gates per PR: `npm test`, `npm run lint`, `npm run check:duplicates`, `npm run build:verify`.
- Board and `.planning/lessons.md` updated in the same step as each decision or lesson.

## Wave 1 — the big three (in this order)

### 1. Sign in without the inbox — "Continue with Google"
Moves: signups that never confirm (25–29% → target under 10%).
- Add `signInWithOAuth({ provider: 'google' })` to `src/contexts/AuthContext.jsx`; one button on
  `src/pages/SignupPage.jsx`, `src/pages/LoginPage.jsx` and the save-progress ask
  (`src/components/course/SaveProgressAsk.jsx`). `redirectTo` = `/login`, so the existing
  `postAuthPath()` (`src/lib/buyIntent.js`) returns the learner to the stored lesson and the guest
  progress merge (`LessonPlayerPage.jsx`) runs unchanged.
- Attribution: OAuth cannot carry sign-up metadata, so after the first Google sign-in write
  `dm_attribution` to the profile once (reuse `src/lib/attribution.js`; only when
  `acquisition_source` is null).
- Fire `signup_started` / completed events on this path too (`src/lib/funnelTracking`).
- Tests: extend `tests/signup-confirmation.test.mjs`, `tests/lock-signup-door.test.mjs`; new test
  for the attribution backfill.
- Needs outside the repo: a Google OAuth client and the Google provider switched on in Supabase
  Auth (see "Your yes").

### 2. Email that brings people back
Moves: second-day return (3 of 64 → target 15 of 64) and email clicks (0.39%).
- **One signed "continue" link.** Generalise `netlify/functions/confirm-continue.mjs` (it already
  mints a magic link at click time) so confirmed learners get a link that signs them in and opens
  their next step. Reuse the next-step resolver in `netlify/functions/course-reminder.mjs` and the
  link helpers in `netlify/functions/_shared/emailLinks.mjs`. Signed, expiring (7 days), one
  purpose.
- **Point the lifecycle emails at the next lesson**: trial day 3, activation day 4 and "your
  progress is saved" (`trial-lifecycle.mjs`, `activation-lifecycle.mjs`) use that link instead of
  `/analyze/` and `/pricing/`. Link targets only; wording changes are drafted for approval.
- **Welcome email after confirmation**, not at account creation (`send-welcome-email.mjs`: skip
  while `email_confirmed_at` is null; send from the confirmation path).
- **Confirmation nudge after one hour**, not two days (`confirmation-nudge.mjs` window).
- Tests: `tests/lifecycle-links.test.mjs`, `tests/welcome-links.test.mjs`,
  `tests/confirmation-nudge-canary.test.mjs`, `tests/lifecycle.test.mjs` (window table).

### 3. Stop mailing people who are gone
Moves: email health (bounce 2.08% → under 1%; volume about 31,800 → about 7,000 a month).
- **First a small test:** one fresh Gmail address signs up; note where the confirmation email
  lands (inbox, promotions, spam). Repeat after the change.
- `daily-sentence.mjs` `getRecipients`: send only to learners who signed in during the last
  90 days (247 today). Everyone else gets one "keep my daily sentence" email with the continue
  link, then silence unless they click.
- Tests: `tests/daily-sentence.test.mjs`, `tests/email-opt-out.test.mjs`.

## Wave 2 — medium

### 4. Visitor → first lesson, and the hand-over to sign-up
Moves: 72% of visitors who never start; 59 → 49 between first sentence and sign-up.
- Diagnose first in Google Analytics (which landing pages and which lesson stage lose people;
  `lesson_stage_viewed` already records it). Fix only what the data shows.
- Known fixes: turn on confirmation continuity so the link returns to the lesson on any device
  (`AUTH_CONTINUITY_ENABLED`, already built and tested); the sign-up page reached from a lesson
  names that lesson instead of the generic heading (`SignupPage.jsx`).
- The save-progress ask keeps its place (owner decision 2026-10-09).

### 5. Pages missing from Google
Moves: 33 of 184 pages indexed.
Causes, ranked (the sitemap, canonicals and internal links themselves are clean):
- Every grammar example links to `/analyze/?s=<sentence>` (`astro-site/src/pages/grammar/[level]/[slug].astro`),
  about 800 crawlable parameter URLs against about 138 real pages, plus `?ref=…&utm_*` variants
  (`onsiteLinks.js`). Google's queue fills with these. Fix: disallow `/analyze/?s=` and the
  `?ref=` / `utm_` variants in `public/robots.txt`, and mark the example links `rel="nofollow"`.
- Six "Coming next" course pages (`/courses/a2-1/` … `/courses/b2-2/`) are thin, near-identical,
  indexable and in the sitemap. Fix: `noindex` and out of the sitemap until the level exists
  (`astro-site/src/pages/courses/[level].astro`, sitemap filter in `astro-site/astro.config.mjs`).
- The 84 grammar pages load their exercises late in a React island (`ExercisePlayer
  client:visible`). Fix: render the first exercises as static HTML so the page Google reads is
  the page a learner sees.
- The 20 "page with redirect" are old URL variants (www, dotted, uppercase). Expected; no action.
- After the fixes: resubmit the sitemap and request indexing for the key pages in Search Console.
- Guards to update: `scripts/crawl-guard.mjs` (its page count comment is stale),
  `scripts/check-built-html.mjs` MANIFEST.

### 6. Back office
- Support: `support-ticket-create.mjs` emails the owner on every new ticket (one Resend call,
  reuse `_shared/brand.mjs`). The 10-20 ticket gets a drafted reply for Zaid to send.
- Failed payments: a second dunning mail on day 3 (`lemonsqueezy-webhook.mjs`, behind the existing
  `PAYMENT_RECOVERY_RETRY_ENABLED`).
- Costs: one monthly cost table on the board (tools, AI, email); AI spend per call is recorded
  later, with the courses work.

## Wave 3 — smaller details

### 7. Measurement
- The site already sends `signup_completed`, `email_verified`, `lesson_completed` and
  `checkout_completed` to GA4 (`src/data/events.js` and its astro twin), but GA4's standard names
  (`sign_up`, `begin_checkout`, `purchase`) appear nowhere, and `value`, `currency`,
  `transaction_id` are stripped by `ALLOWED_PROPS`, which is why revenue reads $0. Fix: send the
  standard names alongside the existing ones (`src/lib/analytics.js`, `astro-site/src/lib/track.js`)
  and allow the three purchase properties. Then mark `sign_up`, `lesson_completed` and `purchase`
  as key events in GA4 Admin.
- Apply `migrations/2026-11-12-lesson-furthest-stage.sql` (two nullable columns) so the app-side
  record of the furthest lesson step saves.

### 8. Quality pass
- Mobile Lighthouse on the tracked pages, then fix only regressions (speed, layout shift,
  accessibility). Read every public page once on a phone-sized screen for broken copy (one found:
  `astro-site/src/data/guides/goethe-b1.js` FAQ reads "AI Practice Modul sind maximal 100 Punkte").

## Your yes (approving this plan approves these, nothing else)

Each is a setting or a send that only you may allow. I do the clicks in your browser where possible.
1. Create a Google OAuth client for deutsch-meister.de and switch on the Google provider in
   Supabase Auth.
2. A sign-in link inside our own emails (step 2). It signs in whoever opens the email, as
   newsletters do; signed and valid 7 days.
3. Daily sentence only to learners active in the last 90 days, plus one "keep me subscribed" email
   to the rest (text shown to you first).
4. Apply the two-column migration of 2026-11-12.
5. Mark three events as key events in your Google Analytics, and resubmit the sitemap in Search
   Console.
6. Test accounts on the live site, on an address of yours, for checking sign-up. You type any
   password; I never do.

Not in this plan: courses, offers, prices, group posts, new designs, new tracking tools.

## Verification

- Each PR: the four gates above, plus the changed flow played in a browser on the deploy preview
  (grounding rule: observe the real page, not the code).
- Step 1: a new Google sign-up lands back in the lesson it came from with guest progress kept;
  `profiles.acquisition_source` is filled; `auth.users` shows provider `google`.
- Step 2: click each changed email's link from a logged-out browser → signed in, on the next
  Lektion. `lifecycle_emails` followed by sign-ins rises above 17 of 236.
- Step 3: Resend metrics a week later (volume, bounce rate, click rate); the seed address's
  confirmation email placement before and after.
- Weekly read, same five numbers: visitors, lesson starts, sign-ups confirmed, second-day return,
  sales. Targets after Wave 1: unconfirmed under 10%, second-day return 15 of 64.
