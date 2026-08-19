# Remediation of AUDIT-2026-08-16

What was fixed, how it was verified, and what is still open. Production changes
(Supabase, Resend) are live now; code changes ship with PR #16.

SQL is recorded in `migrations/2026-08-17-audit-remediation.sql`.

---

## P0 — fixed

| # | Finding | Fix | Verification |
|---|---|---|---|
| A-01 | The free tier rendered a permanent spinner for logged-out visitors: `OnboardingGate` waits on `profileLoaded`, which `useOnboarding` never sets without a user. `/level/a1.1`, the free grammar lessons, `/reading/a1.1` and `/listening/a1.1` were all unreachable — since 2026-05-28. | `OnboardingGate` returns `children` immediately when there is no user. | Headless run of the merged `dist/` with no auth session: `/level/a1.1`, `/reading/a1.1` and `/grammar/a1.1/nouns-gender` all render content, 0 spinners. |
| A-02 | `analyze-sentence` was an unauthenticated, unmetered Claude endpoint — `countTodayUsage` returned 0 when the request carried no identity, so the gate never fired. ~$290/hr at 5 req/s. | Requests with neither a JWT nor a usable `anonymousId` are rejected; the no-identity path now reports "over quota" rather than zero; added a per-hashed-IP daily ceiling (12) that the client cannot reset. | Fixture harness: no id → 400, short id → 400, valid id → 200, over quota → 429. Exactly one Anthropic call fired across all four. |
| A-03 | `evaluate-speaking` had no rate limit and graded a client-supplied transcript when the `session_token` matched nothing — fabricated conversations, arbitrary scores, prompt injection, ~$0.75–1.50 a call. | The client-transcript fallback is gone (no stored transcript → 404) and evaluations are capped at 20/user/day. | `node --check`; the fallback branch no longer exists in the file. |
| A-04 | `speaking_usage`'s policy named "Service role full access" was `polroles = {0}` — PUBLIC — with `cmd=ALL`. Any visitor could delete every quota row. | Policy dropped. The service role bypasses RLS, so zero policies is the correct state (same as `webhook_logs`). | `pg_policy` dump: `speaking_usage` has no policies; no PUBLIC policy remains on any speaking table. |
| A-05 | Clients could INSERT their own `speaking_sessions` rows, which `speaking-turn` accepted as authorization, bypassing the wallet debit; the UPDATE policy had no `WITH CHECK`, so `started_at` could be reset forever. | Dropped client INSERT/UPDATE on `speaking_sessions`, and INSERT on `speaking_messages`/`speaking_evaluations`. Read-own policies kept. | Confirmed the SPA only ever SELECTs these tables before dropping; `pg_policy` dump shows read + service-role only. |
| A-06 | `send-daily-test` gated only the `?email=` case, so the no-parameter case was a public trigger that mailed the owner on every request. | The campaign secret is now required on every invocation. | Fixture: no secret → 401, wrong secret → 401, correct secret → 200 with exactly one Resend call. |
| A-07 | 84 of the last 100 emails on the shared Resend account were hard bounces to one dead address, ~190/day. Signup confirmations fell 91% (Mar) → 34% (Aug). | Address added to the Resend suppression list, which stops the bounces without touching the automation that generates them. | Suppression created and confirmed by id. **The upstream job still needs fixing at source — see "Still open".** |
| A-08 | All 80 level-test "focus on this topic" links were dead: hyphenated levels (`/grammar/a1-1/…`), 23 renamed slugs, and `/vocabulary/…` / `/reading/<band>` routes that never existed. | Rewrote every URL against the live topic list: 71 → real grammar topics (renamed slugs mapped by meaning), 5 → the level's vocabulary tab, 4 → the level's reading list. | Script validates every URL post-write: 0 invalid. |
| A-10 | Impressum published as an unfilled draft. | **Not fixed — owner action.** | — |

## P1 — fixed

| # | Finding | Fix | Verification |
|---|---|---|---|
| B-01 | `is_subscribed` was only cleared by the `subscription_expired` handler, so cancelled/past_due/unpaid accounts kept Pro. Three were entitled unbilled. | The webhook now revokes entitlement on `expired`/`unpaid`/`past_due` (`cancelled` deliberately keeps access to period end); existing rows reconciled. | `SELECT` for entitled-without-active-subscription: **0**. |
| B-02 | 334 of 399 listening answers were "b" (83.7%) — always picking "b" passed every exercise without listening. Grammar MC was 48% index 0. | Rotated option positions per question and moved the key with them. | An md5 over every correct option's **text** is byte-identical before and after, so no key changed meaning. Distribution now a/b/c = 32/38/30%, grammar 26/24/26/24%. |
| B-03 | Every b1.2 reading lesson existed twice (seeder ran twice on 2026-02-03), doubling that level's progress denominator. | Deleted the later copy of each; added a unique index on `(level, title_de)`. | b1.2: 16 rows → 8, 8 distinct texts. Total 74 → 66. |
| B-04 | All 24 podcasts have empty transcripts, while an indexed `FAQPage` rich result claimed "every episode includes a full transcript". | Removed the transcript Q&A from the JSON-LD and every transcript claim from the page copy, meta description and keywords. | `grep -ci transcript PodcastsPage.jsx` → 0. |
| B-05 | All 64 grammar topic descriptions were punctuation-stripped in the DB and leaked into 52+ meta descriptions. | Re-seeded from `src/data/grammarTopics.js`. 8 slugs had been renamed in the DB; each remapping was confirmed by matching `title_en` before applying. | 64/64 descriptions end in terminal punctuation, both languages. |
| B-06 | Logging in removed the only link to Listening and Reading (the nav pill was wrapped in `{!user && …}`), so 480 dialogues and 74 lessons were unreachable after signup. | Listening and Reading are now first-class nav items (desktop + mobile) for everyone, and are linked from the Astro footer. | Rendered nav in the headless run shows "Listening Reading". |
| B-07 | The whole post-signup UI was German on an English-marketed product for A1 beginners. | Converted VerifyEmail, IntroSlides, WelcomeModal, Dashboard, Subscription, SessionTimeout, Login, Profile, SpeakingSession, SpeakingEvaluationResults and the mic-permission strings, reusing the author's own `{/* EN: */}` wording where present. German learning content and the German marketing pages are untouched. | 0 residual German markers in the converted files; lint + build pass. |
| B-09 | Grammar lesson progress silently failed to save on re-submission — the upsert had no `onConflict`, so it violated `UNIQUE(user_id, topic_id)`, and supabase-js resolves rather than throws. | Added `onConflict: 'user_id,topic_id'` and an error check. | Matches the working pattern at `grammarService.js:551`. |
| B-10 | The post-checkout page told paying customers their payment hadn't gone through — `hasActiveSubscription` was captured in a `[]` effect and kept reading the mount-time `null`. | Verification is derived from context state each render; added a "Check again" action and a terminal message with a contact route. | — |
| B-11 | `?tab=` was ignored, so podcast rows, the prerendered "Start Listening" CTA and the level test all landed on the vocabulary tab. | `LevelPage` initialises from `useSearchParams`, responds to query changes, and writes the tab back to the URL. | — |
| B-13 | `speaking_sessions_level_check` rejected `'placement'`, so every level-test session 500'd **after** paying for a teacher reply and a TTS render. Zero placement rows existed. | Added `'placement'` to the constraint, and `speaking-session` now validates the level before spending. | Constraint updated; unsupported levels rejected up front. |
| B-14 | The free A1.1 page rendered a debug panel naming the queried table and RLS policies. | Replaced both with a new `EmptyState` component; added a distinct empty state for "filter matched nothing", which previously rendered a blank grid. | — |
| B-15 | 852 internal links 301-hopped because Astro linked the non-slash form of prerendered SPA routes while their canonicals and the sitemap used the slash form. | Links now use the canonical slash form; `CLAUDE.md`'s trailing-slash rule was wrong and now describes all three cases. | Built output: non-slash links **852 → 0**, 1,098 canonical. |
| B-16 | The telc guide (2,032 words) and `/reading/` had zero inbound links; `/listening/` had one, from the orphan. | Added Listening, Reading, Podcasts and a Guides column (telc, Vergleich, FAQ, Über uns) to the footer. | Present on all 83 built pages. |

## P2/P3 — fixed

- **Storage crashes**: `localStorage`/`sessionStorage` access in `TrialBanner`, `ProgressContext` and `ErrorBoundary` (the last-resort handler could itself throw) now goes through `src/utils/safeStorage.js`, so private-mode visitors don't get the error screen.
- **`payment_failures` duplicates**: retried deliveries inserted the same event up to 5×. Deduped, unique index added, and the webhook now upserts.
- **The "5 analyses per day" claim** advertised a tier that has never existed. All limit numbers now come from `src/config/limits.js`, which documents that it must track the server-side gates.
- **Accessibility**: the fill-blank input on 47 exercise pages had placeholder-only labelling (WCAG 3.3.2) — now has a `sr-only` label naming the prompt; the 5 auth inputs are paired with their labels via `id`/`htmlFor`; `SessionTimeoutModal` got `role="dialog"`, `aria-modal`, focus management and Escape; the SPA gained a skip link and a `<main>` landmark.
- **Performance**: `posthog-js` is now a dynamic import behind the consent check — entry chunk **372 KB → 179 KB** raw, **118 KB → 55 KB** gzip (measured with `VITE_POSTHOG_KEY` set, so PostHog splits into its own 194 KB lazy chunk rather than being tree-shaken). Fixing the eager `OnboardingGate → IntroSlides` import also let `IntroSlides` finally split into its own 4 KB chunk and silenced the long-standing Rollup warning.
- **Homepage**: the stats band said "1,400+ Learners" while the closing CTA said "350+"; both now derive from one constant. "323 Sentences X-Ray analyzed" (a total-ever count that reads as *nobody uses this*) became "480 Native-speaker dialogues". Fixed "German German Noun Genders".
- **Speaking missions (B-12)** existed only for A1.1, leaving 7 of 8 levels with an empty Speaking tab. 56 new missions were authored and seeded, so all 8 levels now have 8 published missions, each linked to the grammar topic at the same position in its level and drilling that topic's structures. Difficulty is graded: survival tasks at A1.2, past-tense narration at A2.x, opinions and complaints at B1.x, counterfactuals and formal register at B2.x. Recorded in `migrations/2026-08-17-speaking-missions.md`.

## P2/P3 backlog — also fixed (2026-08-17, second pass)

- **Data quality.** `acceptable_answers` on all 433 fill-blanks (7 have a real
  second answer; the rest test one form), plurals resolved for all 101 nouns
  (98 are mass nouns — the table already had a `'null'` convention), 47
  duplicate vocabulary rows removed with conflicting glosses merged rather than
  dropped, reading-lesson CRLF and broken `-̈e` plural markers repaired,
  `word_count`/`estimated_reading_time` recomputed against a *derived* 57 wpm,
  and `prerequisite_slugs` populated for 60 of 64 topics.
- **Three unanswerable exercises.** Their correct answer was `(complete)` or
  `(nothing needed)` — a stage direction no learner can type. Rewritten so the
  blank falls on the noun of the Funktionsverbgefüge being taught.
- **~8,300 lines of dead code deleted** — `PricingPage` (unreachable: every
  pricing link is a hard nav to the Astro page), the five `Stage*.jsx`
  components, `grammarContent.js`, `paragraphService`, six unused components
  and two dead service exports. Importers were re-checked immediately before
  each delete.
- **Dashboard** gained Listening and Reading cards, and reading now counts
  toward the streak — a learner finishing a lesson every day previously still
  showed a 0-day streak.
- **Checkout** no longer opens a new tab (iOS Safari blocks the popup and
  in-app browsers swallow it): it prefers the LemonSqueezy overlay and falls
  back to same-tab navigation.
- **Vocabulary page**: progress bars were hard-coded to `0`, the card component
  was redefined inside render (remounting all eight on every update), and the
  counts came from eight sequential full-table fetches. All three fixed.
- **Robustness**: the X-Ray call is timeboxed, the podcasts page has a real
  error+retry state instead of silently showing "coming soon", and the grammar
  lesson fetch got the stale-response guard every other data page already had.
- **Perf**: Fira Code dropped from the SPA (only the Astro pages use
  `font-accent`), the two Google Fonts requests merged into one, cache headers
  added for unhashed root assets, and 48 KB of unreferenced files deleted.
- **SEO/a11y**: per-route `og:locale`, the `/level-test/` and `/podcasts/` FAQ
  markup now backed by visible content, `h2`s on the level hubs, `lang`
  corrected on 9 majority-English pages with the German headings marked,
  1,223 German table cells tagged `lang="de"`, 11 JS-only URLs dropped from the
  sitemap, and the listening level pages fixed (case, per-level canonicals,
  de-noindexed).
- **Two tooling traps closed**: `lighthouse-batch.mjs` now serves gzip (it was
  measuring uncompressed bytes, which produced a phantom 30-point deficit), and
  `mustReplace` in the prerender script asserts on marker *presence* rather
  than diffing, so a no-op replacement is no longer reported as a missing
  marker.

## Third pass (2026-08-17) — email scale, activation loop, remaining function audit

- **Both bulk mailers could not finish.** `daily-sentence` sent one request per
  recipient with a 300 ms sleep — over five minutes of sleeping alone for 1,004
  confirmed users, well past the function budget, so a killed run mailed the
  same prefix of the list every morning and the rest never heard from it. Now
  Resend's batch endpoint: **11 requests, 504 ms**, measured on a 1,004-recipient
  fixture, with each recipient keeping their own unsubscribe token.
  `send-campaign` had the same shape (1 s between sends) and additionally
  targeted all 1,450 accounts — including the 446 that never confirmed. Batched,
  and confirmed-only.
- **Trial lifecycle emails** (`netlify/functions/trial-lifecycle.mjs`, daily at
  08:00 UTC). Day 3 "what you haven't tried", day 6 "ends tomorrow", day 8
  "your progress is saved". The only mail a learner previously received was the
  welcome and the daily sentence — nothing ever announced that the trial was
  ending, which is a large part of how 1,450 signups became 4 subscriptions.
  Idempotent by construction: the `lifecycle_emails` row is claimed *before* the
  send under `UNIQUE(user_id, kind)`, so a crash can drop a message but never
  duplicate one. **Nothing sends until this PR is merged** — the copy is in the
  diff for review.
- **Listening progress finally persists.** `useListening.js` has always upserted
  `answers` and `plays_used` into `user_listening_progress`, but the live table
  lacked both columns, so every completed exercise was silently discarded.
  Columns added; listening now feeds the streak alongside reading.
- **Grammar topic titles restored** — the same punctuation-stripping the
  descriptions had. "Adjective Declension Weak Mixed" is again "Adjective
  Declension (Weak/Mixed)". 64 rows, one reversible UPDATE set.
- **`verify-subscription`** filtered webhook_logs *after* fetching a global
  newest-10 page, so a paying user's recovery silently failed whenever ten other
  customers' events sat ahead of theirs — exactly the backlog condition the
  recovery path exists for. The user filter is now in the query.
- **`/api/speaking/*`** was a wildcard proxying *every* function under a path
  whose name implies a narrow scope. Replaced with the four routes the SPA calls.
- **`podcast-feed`** lost its hardcoded anon-key fallback (a valid JWT good to
  2084 that silently defeated key rotation) and no longer takes the whole feed
  down on an episode with a null `audio_url`.
- Internal error text is no longer returned to clients from five handlers, and
  two orphaned functions were deleted.

## Fourth pass (2026-08-17) — placement, anon content leak

- **The placement test was decorative.** `LevelTest.jsx` computed a sub-level,
  displayed it, and never wrote it: `profiles.current_level` was the string
  `'a1'` for all 1,455 accounts — a single distinct value across the table — and
  `SpeakingPage`, its only reader, coerced that back to `A1.1`. Someone placed
  at B1.2 was still handed A1.1 content. Now persisted for signed-in users;
  anonymous testers are unaffected, since the landing page promises no account
  is required. Confirmed first that the profiles UPDATE policy permits own-row
  writes and that `protect_profile_privileged_columns` pins only
  `is_subscribed`, `subscription_tier` and the trial dates.
- **A-09 closed.** `words`, `sentences` and `paragraphs` were fully readable
  with the anon key that ships in the SPA bundle — every level's vocabulary and
  sentence bank one request away, with only client-side gating in front of it.
  Each table carried 2–4 overlapping permissive read policies, and because
  policies are OR'd, all had to go before the narrow ones could bite. Anon now
  sees only the a1.1 free tier; authenticated keeps full read.
  Verified by impersonating the anon role **server-side** (a REST check from
  this sandbox proves nothing — supabase.co egress is blocked, so every request
  fails identically whether the policy is right or wrong): a1.1 → 225 words /
  120 sentences, b2.2 → 0 across all three, podcasts still 24, grammar 64.
  `podcasts` deliberately untouched — `podcast-feed.js` builds the public RSS
  feed with the anon key.
- Filled the last 3 empty `prerequisite_slugs`; `alphabet-pronunciation` stays
  empty because it is the first topic in the course. No dangling references.

## Merged to production (2026-08-18)

Both open pull requests are merged and live; the repository has no open PRs.

- **#16 — the audit remediation** (17 commits, 103 files) squash-merged as
  `d066e7f`. Production deploy `ready` at 14:27 UTC. Everything in it had been
  sitting unmerged, so until now the free-tier spinner, the unmetered
  `analyze-sentence` endpoint and the discarded placement results were all
  still live-broken on `8b2f9d4`.
  - `trial-lifecycle` now registers in Netlify's schedules (`0 8 * * *`,
    alongside `daily-sentence` at `0 7 * * *`).
  - **The welcome-email webhook works.** It had returned 500 "Server
    misconfigured" twice this morning because `WEBHOOK_SECRET` never persisted
    when it was first created as a secret-typed variable. Probed it through
    `pg_net` with the trigger's own bearer and a deliberately email-less body:
    it now returns **400 "Valid email is required"**, i.e. it clears both the
    shared-secret and `RESEND_API_KEY` checks and fails only on the missing
    field — proof without mailing anyone.
- **#10 — grammar momentum** (opened 2026-07-18, based on a month-old main)
  rebased onto the new main and squash-merged as `70fb969`. Three conflicts,
  all in the same shape: #16 had added Astro's required trailing slashes to the
  grammar links that #10 was decorating with `data-topic-*` attributes. Kept
  both, and gave #10's five newly added grammar links the trailing slash too,
  so none of them 301-hops. Verified on the rebased tree: lint 0 errors, SPA
  build, duplicate check, 83 Astro pages, 64 topic cards on the hub, the
  cross-level "Next up" bridging `a1.1/present-tense-regular/` →
  `a1.2/basic-sentence-structure/`, and the code-split intact — the hub's eager
  script is 2.4 KB with zero Supabase references, loading the progress chunk
  only behind the `sb-*-auth-token` localStorage gate.
  - It also carried a real live bug fix of its own: `grammarService` read and
    wrote a `completed` column that does not exist on `user_grammar_progress`
    (it is `is_completed`), so the dashboard's grammar continue-state was
    pinned to topic 1 for everyone and its saves were silently dropped.
- Small: the welcome email's "Try Sentence X-Ray" button pointed at
  `/analyze`, which 301s to `/analyze/`. Now correct — it is the one email
  template that links a prerendered SPA route.

## Podcasts (2026-08-19)

- **10 of 24 podcasts had no audio file.** Storage answers `NoSuchKey` for every
  episode from B1.1 #3 onward, so B1.2, B2.1 and B2.2 had nothing playable at
  all. All ten were `is_published = true`, which meant they were listed on the
  site *and* served to podcast directories through the RSS feed — that feed
  filters on `is_published` only. Now unpublished; flip the flag back per row as
  audio lands.
- **The 14 that work are video, not audio.** `video/mp4`, 117 MB at A1.1 rising
  to 420 MB for one B1.1 episode, 2.8 GB in total. Every play streams the whole
  video — brutal on mobile data and billed as Storage egress — to deliver what
  the product sells as a podcast. `duration_seconds` is placeholder data as well
  (18 of 24 rows were exactly 180), which is the "card says 3:00, player says
  5:03" bug. `scripts/reencode-podcast-audio.mjs` fixes both in one pass; it
  needs ffmpeg and Storage access, so it is run by hand, not in the build.
- Method note: the first size probes downloaded whole files and cost ~360 MB of
  egress before switching to `Range: bytes=0-0`. Use the range form.

## Still open — needs the owner

1. **The upstream bounce job.** Suppression stops the damage, but something in the MedMeister automation still tries to mail `a831969a52@emailinbo.live` every 15 minutes. Fix it at source.
2. **Impressum.** Ships with "Entwurf" and `[Vollständiger Name des Betreibers]` placeholders. Legally required, and I will not invent operator details.
3. **Rotate the Supabase service-role key** and enable leaked-password protection.
4. **Take a card at trial start.** The trial requires no card and the only checkout path is a new-tab `window.open`, which iOS Safari and in-app browsers block. Until that changes, passive conversion is structurally 0% — this is a Lemon Squeezy product decision, not a code change.
6. **Run `scripts/generate-example-audio.mjs`** with an OpenAI key — 0 of 673 grammar examples have audio.
7. **`pg_net` lives in the `public` schema**; moving it needs a coordinated trigger update.
