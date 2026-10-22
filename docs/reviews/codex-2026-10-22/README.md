# Codex full-repo review — 2026-10-22

Six read-only reviews run with Codex CLI 0.163.0, model `gpt-6.1-sol`, reasoning effort `ultra`,
on `main` at `ac85196`. Briefs: `brief-*.md`. Raw findings per area: `a-money.md`, `b-security.md`,
`c-course.md`, `d-routing.md`, `e-frontend.md`, `f-structure.md`.

**Verified** = re-checked against the code (and, where marked, the live database) by Claude after the run.
Unmarked findings are Codex's claim with its own in-memory reproduction, not yet re-checked.

## Top fixes, ranked (money, security, learner trust)

| # | Fix | Why it matters | Where | Status |
|---|-----|----------------|-------|--------|
| 1 | Pro speaking: enforce the advertised 30/month, not 2/day then €1 | Paying customers get charged against the pricing page | `netlify/functions/speaking-session.mjs:25,226` | Verified |
| 2 | Payment recovery (`past_due → active`) never restores `profiles.is_subscribed` | A paying learner stays locked out of writing/speaking/Astro exercises | `lemonsqueezy-webhook.mjs:770-810` | Verified |
| 3 | Admin RBAC bypass: `{"view":["transcript"]}` passes the read check, dispatches the privileged view | Support role reads learner transcripts / mutates coupons, content | `admin-usage.mjs:24`, `admin-coupons.mjs`, `admin-content.mjs` | Verified (usage) |
| 4 | "Delete account" button does nothing | GDPR Art. 17 exposure; learner told data is deleted | `src/pages/ProfilePage.jsx:375` | Verified |
| 5 | Paid reading lessons open via `/reading/a1.1/<paid-id>` | Paywall bypass | `LevelSubscriptionGuard.jsx:20`, `readingService.js:65` | Verified |
| 6 | Checker gives typo credit for wrong verb endings (`spielst` for `spielt`) and wrong multiple-choice spellings (`Dane` for `Danke`) | Learners practise wrong German and get credit | `src/lib/lesson/check.js:151`, `PracticeItem.jsx:79` | Verified (node probe) |
| 7 | First checkpoint pass breaks course reminders for everyone (`'a1.1-cp1'::int` cast) | Live mailer dies the first time anyone passes CP1 — zero cp rows today, so latent | `migrations/2026-09-13-course-reminder.sql:110` | Verified (live DB: 0 cp rows, last send 2026-10-21) |
| 8 | Learners can delete their own `lesson_attempts` rows, resetting AI daily limits | Unlimited AI spend | `migrations/2026-09-12-lesson-engine.sql:84`, `explain-answer.mjs`, `score-readaloud.mjs` | Verified (policy present) |
| 9 | AI calls made before quota reservation (X-Ray bad anon id, writing bad attempt id, empty-wallet speaking start) | Unmetered AI spend | `analyze-sentence.mjs`, `evaluate-writing.mjs`, `speaking-session.mjs:262` | Codex |
| 10 | Logout and "All courses" navigate client-side to Astro-only URLs → SPA 404 | Every sign-out ends on "Page Not Found" | `Navbar.jsx:73`, `CourseHomePage.jsx:154` | Verified (logout) |

## Next tier (Codex, high confidence)

Money: existing subscribers can buy a second subscription; `verify-subscription` can grant a fresh
30 days from an expired event; failed renewals extend `subscription_end`; refunding course B wipes
course A's Pro window; replaying a fulfilled order restarts 90 days; admin "sync flags" grants
lifetime owners permanent Pro; coupon field sends no product/price; resumed checkout ignores bundle
ownership; Pro buyers' course purchase never refreshes.
Backend: lifecycle claims with `ignoreDuplicates` still send to the full list (concurrent runs
double-mail); failed wallet refunds never retried; ending a session mid-turn refunds delivered audio.
Learning: auth-loading race overwrites a saved lesson run; concurrent completions let a weaker run
overwrite Gold (no atomic guard); decomposed umlauts (NFD) marked wrong; derived word tiles reject
valid orders; Formcheck greens questions as answers; DST off-by-one in exam plan; mic denial traps
checkpoint Sprechen; failed guest save reported as saved; guest merge skips review cards.
Front end: subscription refresh race can hand account A's entitlements to account B; consent
withdrawal during PostHog load still initialises it; listening "Next exercise" shows old results;
mic left live after leaving speaking startup; level test gives B2.2 from one answer + skips and saves a
different level than shown; exam autosave regresses section; mobile bottom nav covers the course
return bar; third listen can't resume after pause.
SEO/routing: hidden (`is_published=false`) grammar topics still built and in the sitemap; mid-build
Supabase failure mixes live routes with cached content; X-Ray "Learn more" links all 404; podcast FAQ
says all podcasts are free; `google.co.uk` attributed as source `co`; FAQ anchor points at Related Topics.

## Structure (f-structure.md)

Top low-risk moves: shorten CLAUDE.md to ~150 lines with links out; one manifest for the duplicated
SPA/Astro files; complete `migrations/README.md` (6 files missing); move 11 root `*.sql` and the three
August audits to `docs/archive/`; delete 5 zero-import modules and Astro's unused `lucide-react`;
add `scripts/README.md` + `tests/README.md`; send audit screenshots to an ignored `.cache/`.
Do not: monorepo split, feature-folder reshuffle, migration squash, LFS.
