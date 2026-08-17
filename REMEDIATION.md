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
- **Speaking missions** existed only for A1.1, leaving 7 of 8 levels with an empty tab — authored and seeded for the remaining levels.

## Still open — needs the owner

1. **The upstream bounce job.** Suppression stops the damage, but something in the MedMeister automation still tries to mail `a831969a52@emailinbo.live` every 15 minutes. Fix it at source.
2. **Impressum.** Ships with "Entwurf" and `[Vollständiger Name des Betreibers]` placeholders. Legally required, and I will not invent operator details.
3. **Rotate the Supabase service-role key** and enable leaked-password protection.
4. **Take a card at trial start.** The trial requires no card and the only checkout path is a new-tab `window.open`, which iOS Safari and in-app browsers block. Until that changes, passive conversion is structurally 0% — this is a Lemon Squeezy product decision, not a code change.
5. **Grammar topic *titles*** are punctuation-stripped in the DB the same way descriptions were ("Adjective Declension Weak Mixed" vs "Adjective Declension (Weak/Mixed)"). Restoring them changes 64 indexed H1s, so it is your call.
6. **Run `scripts/generate-example-audio.mjs`** with an OpenAI key — 0 of 673 grammar examples have audio.
7. **`pg_net` lives in the `public` schema**; moving it needs a coordinated trigger update.
