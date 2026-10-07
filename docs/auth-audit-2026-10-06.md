# Authentication & account creation — full-track audit (2026-10-06)

Read-only investigation of every component a learner touches from "Sign up" to "signed in and
learning", plus the database and email side. Live numbers come from the production Supabase
project (`omqyueddktqeyrrqvnyq`) on 2026-10-06; code references are to `main` at `1c7281a`.
Nothing was changed in production.

## Bottom line

The signup → confirm → login path itself now works (confirmation rate went from 44–63 % in
August to 74–94 % in the last three weeks, median 1 minute to confirm). The real problems sit
**around** it: one personal-data leak, a fake "Delete account" button, a post-login destination
that sends 98 % of confirmed accounts to a paywall, and session handling that signs people out
or reloads their page behind their back.

## Status (same PR, 2026-10-06)

| Finding | Status |
|---|---|
| F1 signup_attempts leak | Migration written: `migrations/2026-10-06-signup-attempts-no-client-read.sql`. **Not applied yet.** The owner approved it on 2026-10-07, but the Supabase connector's `apply_migration` timed out twice (60 s each, nothing applied, no query waiting on a lock). The owner pastes it into the SQL editor. |
| F2 fake delete | Fixed: the button now opens a filled-in deletion email (`src/lib/accountDeletion.js`). |
| F3 paywall after login | Fixed (owner decision 2026-10-07): `/dashboard` uses `<SubscriptionGuard freeHome>`, which sends a signed-in learner without a trial or plan to `courseHomeFor()` (the free A1.1 course, or a course they bought) instead of `/subscription`. `/profile` is behind `ProtectedRoute`, so password, deletion and support are reachable without a plan. The other paid routes keep the paywall. |
| F4 idle global sign-out | Fixed: `useSessionTimeout` and its modal removed. |
| F5 page remounts | Fixed: `AuthContext` keeps the user object when an event carries the same person (`src/lib/authUser.js`); `SubscriptionContext` reloads the account on screen without flipping `loading`. |
| F6 audit rows | Corrected below; no code change. |
| F7–F10 | Open. |

Guarded by `tests/auth-session.test.mjs`.

## 1. How the track works today (map)

| Step | Component | What happens |
|---|---|---|
| Landing | `public/attribution.js` (both heads) | Writes `dm_attribution` {first,last} to localStorage. |
| Buy click (signed out) | `src/lib/buyIntent.js` | Stores `dm_buy_intent`; `postAuthPath()` later resumes at `/subscription?buy=<key>`. |
| `/signup` | `src/pages/SignupPage.jsx` → `AuthContext.signUp` | `supabase.auth.signUp` with `emailRedirectTo=/login` and the attribution as user metadata. Failed attempts are inserted into `signup_attempts` from the browser. |
| Signup outcome | `src/lib/signupConfirmation.js` | No session (confirm-email is ON) → in-page "Check your inbox" panel with a rate-limit-aware resend; empty `identities` → "this address already has an account". |
| DB on insert | `auth.users` triggers | `handle_new_user()` creates `profiles` (+ `acquisition_*`); `set_trial_dates_on_profile_insert` starts the **7-day trial at signup**; `notify_welcome_email()` POSTs to `send-welcome-email` **at signup, before confirmation**. |
| Confirmation link | Supabase `/verify` → `/login#access_token…` | supabase-js (implicit flow, default) reads the hash; `LoginPage` sees a user and forwards to `postAuthPath()`. |
| `/login` | `src/pages/LoginPage.jsx` | Password login; "Email not confirmed" → resend panel. Returns to `state.from` via `src/lib/loginReturn.js` (open-redirect-safe). |
| Not confirmed after 2 days | `confirmation-nudge.mjs` → `confirm-continue.mjs` | One mail per account; click mints a fresh magic link → `/dashboard`. |
| After login | `/dashboard` = `SubscriptionGuard` → `EmailVerificationGate` → `OnboardingGate` → `DashboardPage` | Onboarding slides first, then the first-run card (`src/lib/firstRun.js`). |
| Every page | `AuthContext` `onAuthStateChange`, `SubscriptionContext`, `useSessionTimeout` | Session state, entitlement load, 30-min idle logout. |
| Password reset | `/reset-password` → mail → `/update-password` | `resetPasswordForEmail` / `updateUser`. |
| Server | `netlify/functions/_shared/auth.mjs` | Verifies the bearer JWT with `auth.getUser(token)`; identity never from the body. Correct. |
| Astro pages | `sb-*-auth-token` localStorage check | Presence check only, one client per front end. Fine. |

Measured state: 1,703 accounts, 537 never confirmed (32 % all-time), 0 accounts without a
profile row, 1,149 of 1,166 confirmed accounts are free users whose trial has ended.

## 2. Findings, ranked

### P0 — fix now

**F1. Any signed-in user can read every failed signup's email address (personal-data leak).**
`signup_attempts` has two SELECT policies for `authenticated` with `USING (true)`
("Authenticated users can read signup attempts", "Only admins can view" — the second name is
wrong, its rule is the same). A free account plus the public anon key in `src/utils/supabase.js`
is enough: `supabase.from('signup_attempts').select('*')` returns 278 rows / **152 distinct email
addresses** with user agents (and an `ip_address` column). DSGVO Art. 32/33 exposure. The only
legitimate reader is `admin-marketing.mjs`, which uses the service role and does not need a policy.
*Fix:* `drop policy "Authenticated users can read signup attempts" on public.signup_attempts;
drop policy "Only admins can view" on public.signup_attempts;` (migration file + apply).

**F2. "Delete account" does nothing.** `src/pages/ProfilePage.jsx:374-377`: the modal says "All
your progress and data will be permanently deleted", and the Delete button's handler is the
comment `// Handle account deletion` followed by closing the modal. The learner believes the
account is gone; nothing is deleted. Misleading and an Art. 17 problem. *Fix:* either a real
`delete-account` function (service role, `auth.admin.deleteUser`, cascade) or replace the button
with "Email us to delete your account" until that exists.

### P1 — revenue / activation

**F3. Login sends expired-trial users to the paywall, not to their free course.** `postAuthPath()`
returns `/dashboard`, and `/dashboard` (also `/profile`, `/modelltest`) sits behind
`SubscriptionGuard`, which redirects anyone without trial/subscription to `/subscription`.
1,149 of 1,166 confirmed accounts are in that state; 25 of them signed in during the last 30
days and all landed on the plan page instead of A1.1, the free front door `firstRun.js` was built
around. The confirmation-nudge rescue does the same: 276 sent, 5 confirmed afterwards, **4 of
the 5 into an already-expired trial** (trial starts at signup, the nudge mails at day 2+), so
the rescued learner's first screen is a paywall. Side effect: expired users cannot reach
`/profile` at all (password change, delete account). *Fix (owner call):* open `/dashboard` and
`/profile` to every signed-in user and gate the Pro cards inside the page, or send
`postAuthPath()` to `/course/a1.1` when `hasAccess` is false.

**F4. The idle timer signs the learner out on every device.** `src/hooks/useSessionTimeout.js`
calls `supabase.auth.signOut()` after 30 min without mouse/key/scroll/touch **in that tab**.
auth-js defaults to `scope: 'global'`, so this revokes every session the user has — phone,
laptop, the tab they are actually using. Timers fire late when a phone or laptop wakes, so the
first thing a returning learner sees is "You were signed out because you were inactive".
Observed in today's logs: one learner's tab woke at 06:17:13 UTC, refreshed its token, and was
logged out server-side 2 s later with no app-level logout recorded (the timer path skips the
audit), i.e. the timer, not the learner. Token refresh already handles real expiry; a learning
app has no need for a 30-minute kill switch. *Fix:* remove the hook, or at minimum use
`signOut({ scope: 'local' })` and measure idle across tabs.

**F5. Paid pages reload behind the learner's back (tab return + every hour).** Two causes stack:
(a) auth-js emits `SIGNED_IN` on every hidden→visible tab switch and `TOKEN_REFRESHED` about
hourly; `AuthContext` stores `session.user`, a new object each time; (b) `SubscriptionContext`
reloads on every new `user` object **and** on its own `visibilitychange` listener, and each load
sets `loading=true`. `LevelSubscriptionGuard`, `SubscriptionGuard`, `ExamSubscriptionGuard` and
`PurchaseGuard` render a spinner while loading — so the page underneath **unmounts and remounts**.
A paying learner on `/level/b1.1`, `/reading/a2.1/…`, `/listening/…` who checks a dictionary in
another tab comes back to a spinner and a reset exercise. (Mock exams autosave, so they lose only
the last debounce window; A1.1 is free and skips the guard.) *Fix:* keep `user` stable by id in
`AuthContext` (only `setUser` when `id`/`email_confirmed_at` changed), and make the background
refresh silent (do not flip `loading` once data is loaded).

**F6. `audit_logs` "logins" are app opens, not logins.** Same `SIGNED_IN` cause: 1,176
`auth.login` rows from 125 users in 30 days = 5.7 per user-day, max 56 in one day. The admin
panel's "Login-aktive Nutzer (7/28 T)" counts *distinct* users per window, so it is right as an
"opened the app while signed in" measure. Do not rename or narrow the event without changing that
metric. Only raw row counts are inflated. `auth.signup` (104 rows for 34 users, and it only
counts a `SIGNED_IN` < 60 s after creation) misses most real signups, and nothing reads it. Use
`profiles.created_at` for signups. *Fix if ever needed:* log `auth.login` once per user per day.

### P2 — first-session polish

**F7. Welcome email goes out before the address is confirmed.** `notify_welcome_email` fires on
`auth.users` INSERT, so the learner gets two mails at once and the welcome one (CTA: Sentence
X-Ray) competes with the confirmation link — `SignupPage` even carries a line warning about it.
It also mails addresses that never confirm (bounce risk for the sending domain). *Fix:* fire on
`email_confirmed_at` going from NULL to set, and point the CTA at Lektion 1 (`firstRun.js` rule).

**F8. Trial clock starts at signup, not at confirmation.** Harmless for the 1-minute majority;
decisive for late confirmers (F3). *Fix:* set trial dates on confirmation, or extend on confirm.

**F9. Expired or pre-scanned links fail silently.** A dead confirmation link returns to
`/login#error_code=otp_expired…`; nothing reads it, so the learner sees "Welcome Back" and a
password form, and only learns the account is unconfirmed after a failed login. Same on
`/update-password`: no session check, so an expired reset link ends in the raw "Auth session
missing!" after the learner typed a new password twice. *Fix:* read the hash error on both
pages and show the resend / "request a new link" action up front.

**F10. Smaller items.**
- `/update-password` success says "Redirecting to login…", but the recovery session is live, so
  `/login` forwards straight to the dashboard (copy mismatch only).
- Login fields lack `autoComplete="email"` / `"current-password"`; password managers on iOS
  fill less reliably.
- `/verify-email` and `EmailVerificationGate` can never trigger while confirm-email is ON (an
  unconfirmed user never has a session); its resend shows raw 429 text. Dead path, not a bug.
- `ResetPasswordPage` logs `PASSWORD_RESET_REQUESTED` through `logAuditEvent`, which returns
  early without a user, so it never records (1 row in 30 days).
- `signOut()` (Navbar) also uses global scope: logging out on the phone logs out the laptop.
- Supabase security advisor: leaked-password protection is off; client minimum is 6 characters.
- `handle_new_user()` casts `acquisition_at` with `::timestamptz` after a prefix regex; a malformed
  value would fail the whole signup. Only our own script writes it, so low risk.

## 3. What is solid (keep)

Server-side identity (`_shared/auth.mjs`), `loginReturn.js` open-redirect hardening, the
privileged-column trigger on `profiles`, the welcome trigger's never-block-signup guard, the
existing-account and rate-limit handling on `/signup` and `/login`, `confirm-continue`'s
click-time magic link, and the buy-intent resume.

## 4. Suggested order

1. F1 (one migration, minutes). 2. F2 (honest button today, real deletion later).
3. F3 (owner decision, biggest activation lever). 4. F4 + F5 together (one `AuthContext`
change plus removing the idle hook). 5. F7–F9 as one first-session PR.
