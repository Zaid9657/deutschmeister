# Data audit: what the usage numbers can and cannot say, 2026-10-27

*Read-only checks: Supabase (project `omqyueddktqeyrrqvnyq`), Netlify observability, the Resend
send log, plus code. They were written because the owner asked "investigate everything and be
very sceptical". Each row says what was claimed, what is true, and why.*

## Corrections to earlier claims

| Earlier claim | What the data actually supports | Why the earlier version was wrong |
|---|---|---|
| "Netlify: 20k unique users a month" | 20k **distinct IP addresses**, not people | Netlify counts IPs with no bot filter (its own docs). A one-hour sample of ~45 IPs was mostly our scheduler, prerender and Sentinel, plus Google, Bing, Facebook, Claude, Perplexity and Amazon bots and old-Chrome scanners on `/analyze/` and `/.git/config`; only 3–5 looked human. Search Console showed ≈808 Google clicks in September. **Real humans per month are unknown.** The 1–2k estimate rests on a single hour |
| "Mock exams, writing, listening and reading are close to unused" | **Mostly too new to judge** | Tracking starts late: `lesson_attempts` 2026-10-04, `writing_submissions` 10-15, `review_cards` and `program_progress` 10-15, `user_reading_progress` 10-01, `user_listening_progress` 09-30, `exam_attempts` 09-03, `speaking_sessions` 07-16. Only grammar (03-16) and X-Ray (03-31) have long history |
| "33% log in and never use a feature" | Overstated for older cohorts | Untracked actions exist: reading grammar without exercises, vocabulary, podcasts, videos, the level test (browser storage only), guest A1.1. For signups since 10-04 (tracking mostly complete): 45 signups → 31 confirmed → 16 used something → 3 on 2+ days |
| "Grammar brings 72% back; speaking is a one-time try" | **About 1 in 3 come back on another active day, whichever tool they start with**: grammar 53/159 (33%), X-Ray 23/79 (29%), speaking 19/56 (34%); mock 0/6 | The 72% used `audit_logs` "auth.login", which until 2026-10-25 was written on every tab focus and hourly token refresh (`src/contexts/AuthContext.jsx:113`). So a "login on another day" mostly meant "tab still open". Grammar days are also undercounted: `user_grammar_progress.last_accessed` is overwritten per topic |
| "7 have ever paid" | **≈11–13 distinct real payers ever** | Lemon Squeezy webhooks: 20 `subscription_payment_success` events from 11 distinct emails (€224.30 gross); 14 `order_created` from 13 emails (1 test mode, €175.66 gross, overlapping first subscription payments); 50 `subscription_payment_failed` from 7 emails |
| "38% never confirm their email" | True, and it has a probable root cause | 550 of 1,749 accounts are unconfirmed, 95% of them Gmail/Yahoo/Hotmail and spread over daytime hours, so these look like real people, not bots. The confirmation rate fell from 91% (March) to 49% (May) and 45% (August), then rose to 67% (September) and 73% (October). `over_email_send_rate_limit` errors stopped mid-September, and confirmation mails now go out through Resend (seen in the send log, delivered and clicked). **Probable cause: Supabase's built-in mail limit dropped confirmation emails before custom SMTP was set up. To confirm: check the Auth SMTP change date in Supabase** |

## Measurement breakages found (new)

1. **Since 2026-10-25 there is no "came back" signal for signed-in users.** The fix that stopped the
   fake login rows also stopped recording returns through a stored session. Only explicit sign-ins
   are logged now. Weekly "active users" built on `auth.login` will read near zero from this week.
2. **Netlify request logs reach back one hour** on this plan through the API, so traffic history
   is not available server-side.
3. **Guest learning is invisible to the database.** A1.1 without an account, the level test and grammar
   reading leave no server row.
4. **The shared Resend account** (DeutschMeister + MedMeister) reports 4.3% bounces/complaints in
   24 h, and daily mail still goes to disposable domains. Sender reputation is shared across both
   products.

## Step-by-step walkthrough of the live site (Playwright, Pixel 7 profile and 320/360/390 px, 2026-10-27)

| # | Step | Result | Verdict |
|---|---|---|---|
| 1 | Any SPA page (course, signup, level test, X-Ray, mock) | The bundle ships a **PostHog personal API key (`phx_…`)** as `VITE_POSTHOG_KEY`. PostHog answers `404 config.js` and `401 flags` on every page | **Broken + security.** SPA analytics record nothing, and a personal key (full API access to the PostHog account) is public. Owner: revoke it, set the project key (`phc_…`) in Netlify, redeploy |
| 2 | Homepage at 320 and 360 px | Hero eyebrow, H1 and lead are laid out 389 px wide and clipped (no scroll, text cut). Fine at 390 px and above | **Defect.** 360 px is the most common Android width. Root cause: the implicit grid track plus `whitespace-nowrap` H1 lines, hidden by the overflow clip |
| 3 | Home → "Start A1.1 free" → course → "Start Lektion 1" | Works, no account needed. The Lektion intro fills the first screen; **the "Start" button sits under the cookie banner** on first visit (Playwright: banner "intercepts pointer events") | **Friction.** Every first-time visitor has to dismiss the banner or scroll before the first exercise |
| 4 | First exercise ("Wie heißen Sie?") | Loads after Start; audio is labelled "Computer voice" | OK |
| 5 | `/pruefung/telc-b1/` → "Übungstest starten" | Lands on a B1.2 **level lock** ("Sign Up to Unlock") in English, with the SPA default page title | Works, but sells a generic trial rather than the mock |
| 6 | Lock → "Sign Up Free" | `/signup?ref=level-lock…`; `dm_return_to` is **null** | **Defect.** After signup the learner does not return to the mock (return path allows `/course/…` only) |
| 7 | telc offer page → "Kostenloses Konto anlegen" | German page → English signup "Start your 7-day Pro trial" | **Defect (language break)** |
| 8 | Pricing → "Buy A1.2" (signed out) | Signup page; `dm_buy_intent=course_a1_2` stored | OK |
| 9 | `/leitfaden/telc-b1/` | 0 links to the telc course | **Defect (missing offer door)** |
| 10 | Level test → "Start the Test" | Question 1 of 40 loads | OK; it is 40 questions before any result |
| 11 | X-Ray anonymous ("Ich gebe dir das Buch.") | Translation and case colours shown; "0 of 1 left today" | OK |
| 12 | Signup empty submit | Browser validation on email and password | OK |
| — | Font `archivo-v25-latin.woff2` | One 502, then 200 three times | One-off, not a defect |

Steps not walked: confirmation email → first login → onboarding → dashboard → trial → checkout. They need a test account (owner approval: it creates a real account and sends mail).

## What the numbers do support

- **Signups are falling over months, not just weeks:** March 428, April 184, May 363, June 205,
  July 190, August 165, September 155, 1–27 October 56. Sources before 2026-09-20 are untracked.
- **The biggest measurable leak is before first use:** about 1 in 3 signups never confirm, and about half of
  confirmed users in the recent cohort do nothing we record.
- **Of people who use a tool once, about 1 in 3 return on another day,** whichever tool it was.
- **About 0.7% of all accounts ever paid.**

## Fixes this implies (none applied here)

| Fix | Who |
|---|---|
| Record one server-side "active today" row per signed-in user per day (not per tab or refresh), so returns are measurable again | [agents] build; [owner] approves the data point |
| Check the Supabase Auth SMTP setting and the date custom SMTP was switched on | [owner], 5 min |
| Decide whether people can start before confirming (Supabase "allow unconfirmed sign-in"), or send a one-time re-invite to the unconfirmed accounts from 2026-03 to 2026-08 that never got a mail | [owner]: auth and mail-basis decision |
| Split the Resend sending domain or subdomain between DeutschMeister and MedMeister; suppress disposable domains from optional mail | [owner] |
| Give this environment Search Console access, the only source of real human visits by page | [owner] |
