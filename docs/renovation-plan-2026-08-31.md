# RENOVATION PLAN — deutsch-meister.de rebuilt exam-first (2026-08-31)

> **EXECUTION STATUS (2026-08-31, same day):** all six phases BUILT and pushed
> on the renovation branch (PR #31), all four migrations APPLIED live and
> verified (exam-profile, exam-attempts, writing-submissions, vocab-srs),
> 86 tests green, SPA + Astro (93 pages) + build:verify + duplicate pairs all
> clean. Ships on merge. Still open after merge: walkthrough on the deploy
> preview with a real account (dashboard/mock/writing/SRS need auth), mocks
> for the other three exams (pure data on the same rails), telc-b1 hub CTAs
> for Modelltest/Schreiben, and the Phase-4 dashboard reorg's library-first
> variant polish.

## Context

The owner ordered a full re-evaluation "without holding back": is the current
structure the best the website can offer, compared against competitors, before
we push selling harder? Two deep codebase audits + live competitor research
answered: **no.** The content library is genuinely deep and worth money, but
the product wrapped around it is structurally broken in ways that silently
kill trust and retention, and the information architecture is level-first
(a textbook) while every successful competitor is exam-first (an outcome).

This plan supersedes the priority stack in the earlier revenue plan
(`docs/revenue-plan-2026-08-31.md` stays as the revenue/marketing reference;
its launch-email P0 continues in parallel — the renovation is "in place",
the site never stops selling).

## Owner decisions (locked, 2026-08-31)

1. **Exam-first hybrid**: nav, homepage, and logged-in app reorganize around
   "your exam + your level" (tracks: telc B1, Goethe B1, DTZ, telc B2); the
   A1.1–B2.2 library becomes the engine underneath.
2. **Build all four**: timed mock-exam simulator with scoring, AI writing
   feedback vs exam rubric, spaced-repetition vocab trainer, real streak +
   daily-goal system.
3. **Renovate in place**: staged PRs, site keeps working and selling
   throughout.

## Verified findings the plan must fix (audited 2026-08-31, firsthand)

**Trust-breaking bugs (users watch meters lie):**
- Placement test result discarded: `profiles.current_level` written by
  `LevelTest.jsx` but `DashboardPage.deriveCurrent()` walks all levels from
  a1.1 — a B2 placer is routed to A1.1 topic 1. Read by `SpeakingPage` only.
- Three progress meters structurally 0% forever: LevelPage ring, ProfilePage
  total (both read unpersisted in-memory vocab/sentence arrays in
  `ProgressContext`), dashboard hero bar (`current_stage` hardcoded 1).
- Vocab "Mark learned" not persisted for logged-in users
  (`ProgressContext.saveProgressToDb` body commented out) — anonymous users
  keep progress, paying users lose it.
- Daily-goal ring double-counts (`dashboardStats.js` pushes `last_accessed`
  AND `completed_at` from the same row).
- `SubscriptionGuard` race can make a brand-new user's first screen the
  paywall (`/subscription`) before trial bootstrap lands.
- ProfilePage level bars render `bg-gradient-to-r undefined` (keys `a1|a2`
  vs iterated `a1.1`); LevelPage dynamic Tailwind class purged at build.

**Structural (two front doors, two taxonomies, orphaned limbs):**
- Three inconsistent navs (SPA Navbar / Astro Layout nav with NO auth
  awareness / Dashboard's own fourth header). Astro→app links are full
  reloads; logged-in identity vanishes on ~75 of ~93 pages.
- `/grammar/:level/:slug` serves TWO different lesson implementations on one
  URL: Astro page (632 ln) on direct load, SPA `GrammarLessonPage.jsx`
  (1,521 ln) via react-router — dashboard hero goes to the SPA one.
- Orphaned: `/vocabulary` (zero inbound links, 1,935 words), `/level/:level`
  (unreachable logged-in), `/telc-b1-kurs` (one link on /subscription),
  `/grammar/overview` (zero links), guides + FAQ (Astro footer only).
- Dead code: SPA `GrammarSectionPage`/`GrammarTopicsPage`/`Vergleich` pages
  shadowed by Astro (~1,200 lines); dead `ProgressContext` methods; stale
  "5 learning stages / unlock" copy that describes nothing real.

**Experience gaps vs Duolingo-class baseline:**
- No completion moments anywhere (results end "Back / Try again";
  `onNextLevel={undefined}` deliberately); no XP/celebration; no SRS/review
  of any kind (dashboard "Review" card is a decoy to the same lesson as the
  hero); vocab is a browse-only dictionary; no PWA/bottom nav; dashboard
  path SVG horizontally scrolls on phones; wall-of-options at every decision
  point (11 dashboard destinations, 5 result-page cards).

**Competitor pattern (measured 2026-08-31 — deutsch-meister-app.com,
deutschexam.ai, examdeutsch.com, testgerman.de, deutschmeister.vn):**
exam landing pages per exam · timed mock exams with auto scoring vs official
rubrics · AI writing feedback on exam letter tasks · free daily quota ·
€7.99–12.99/mo. We already have what they don't: AI speaking, Sentence
X-Ray, an 8-level library, and exam guides — the renovation connects those
strengths to the exam-first shape buyers expect.

## Phases (each 1–2 PRs, site green throughout; order = trust first)

Facts verified in-repo before design: the Astro grammar lesson
(`astro-site/src/pages/grammar/[level]/[slug].astro`) already renders rules,
runs interactive exercises (ExercisePlayer island) AND writes
`user_grammar_progress` for signed-in users via
`astro-site/src/lib/grammarProgress.js`; guides already exist for exactly the
four exam tracks; `netlify.toml` has no SPA rewrite for `/grammar/:level/:slug`
(static file wins on load). These drive the de-dup and IA decisions.

### Phase 1 — Truth repairs (1 PR, no route/DB changes)
1. Placement respected: extract `deriveCurrent` from `DashboardPage.jsx` into
   pure `src/services/currentPosition.js` with `(progress, placementLevel)` —
   floor the walk at `profiles.current_level` (normalize case at boundary;
   profile already loaded via `useSubscription()`).
2. Honest percentages: redefine `getLevelProgress`/`getOverallProgress`/
   `getTotalStats` in `ProgressContext.jsx` on persisted signals only
   (grammar + reading + add a `user_listening_progress` loader); drop the
   never-persisted vocab/sentences arrays from % math (localStorage stays for
   anon A1.1 only); delete `registerLevelItemCounts`.
3. Daily-goal fix: `dashboardStats.js` one stamp per grammar row
   (`completed_at || last_accessed`, never both); export `computeStreak`/
   `computeActivitiesToday` for tests.
4. Guard race: `SubscriptionContext` holds `loading` until trial bootstrap
   resolves; `SubscriptionGuard` retries once for users < ~10 min old before
   bouncing to `/subscription`.
5. Cosmetic truth: ProfilePage gradient keys via `level.slice(0,2)`; practice
   grid `sm:grid-cols-2 lg:grid-cols-3`; dashboard path SVG drops
   `min-w-[560px]`.
6. Delete `ProgressContext` dead code (`saveProgressToDb` corpse etc.).
Tests: new `tests/progress.test.mjs` (dedupe, streak, placement flooring).

### Phase 2 — ONE nav + de-dup + deletions (2 PRs)
PR 2a: new byte-identical pair `src/data/navigation.js` +
`astro-site/src/data/navigation.js` (add to check-duplicates PAIRS) with
`NAV_GROUPS` (groups: exams/learn/tools; items carry canonical trailing-slash
href + kind spa|static + auth visibility) and `FOOTER_GROUPS`. `Navbar.jsx`
and `Layout.astro` both render from it; Astro nav gets auth awareness via an
inline `sb-*-auth-token` check toggling `[data-anon-only]`/`[data-auth-only]`
(no islands). New `src/components/Footer.jsx` in App.jsx (guides/FAQ finally
linked in-app). Delete DashboardPage's own top bar — one header. New
`tests/navigation.test.mjs`: nav ↔ App.jsx ↔ netlify.toml ↔ Astro pages
consistency + trailing-slash classes.
PR 2b: **the Astro page is THE grammar lesson** (SEO surface + full
interactivity + progress write already). Delete `GrammarLessonPage.jsx`
(1,521 ln) + route; rewire all in-app grammar links to full-load `<a>` with
trailing slash (GrammarTopicCard, dashboard hero, LevelTestResults,
telcB1Komplett.js, LevelPage). Delete shadowed `GrammarSectionPage`,
`GrammarTopicsPage`, orphan `GrammarOverviewPage` (netlify rewrite → 301
`/grammar/`), dead `VergleichHubPage`/`ComparisonPage` (+ routes/lazy
imports); keep `src/data/competitorComparisons.js` (PAIRS/tests read it).
De-orphan: `/vocabulary` into nav; dashboard cards for `/level/:level` and
`/telc-b1-kurs` (purchasers). Net ≈2,900 lines deleted.

### Phase 3 — Exam-first public IA (1 PR)
New shared pair `src/data/examTracks.js` (+ astro twin, PAIRS): registry of
the 4 exams (key/slug/level/sublevels/guideSlug/sections) +
`MOCK_DISCLAIMER_DE` (no official-material claims). Exam hub engine mirroring
the Leitfaden engine: `astro-site/src/data/exams/*.js` +
`pages/pruefung/[slug].astro` + `pruefung/index.astro` — definition-first
content, facts imported from the sibling guide module (derive-never-retype),
"Dein Weg bei DeutschMeister" mapping into the library, factsCheckedOn
rendered. New top-level segment plumbing: netlify.toml `cp -r` step, sitemap
filter, check-built-html MANIFEST. Homepage hero becomes "Auf welche Prüfung
bereitest du dich vor?" with 4 exam cards + an "ohne Prüfung" library path;
counts stay from marketing.js. Nav `exams` group goes live. New
`tests/exams.test.mjs`: registry integrity + outcome-promise ban + official-
material ban + disclaimer presence.

### Phase 4 — Exam-first logged-in app (2 PRs)
PR 4a: migration `exam-profile.sql` — `profiles.exam_track` (CHECK in 4 keys
+ 'none'), `exam_date`, `daily_goal_target int DEFAULT 3` (client-writable
tier, like `current_level`). Onboarding gains a "Welche Prüfung?" step
(skippable → 'none'). Dashboard reorg: header "Dein Ziel: telc B1 · Dein
Level: B1.1" (+ exam-date countdown); Row 1 continue-lesson (placement-
floored); Row 2 goal ring (user target) + streak; Row 3 exam tools + level
shortcuts + purchaser course card; 'none' users get library-first layout.
Profile edits exam/goal.
PR 4b: new `src/components/CompletionMoment.jsx` (score, streak/goal delta,
ONE next action) wired into listening ExercisePlayer, ReadingLessonPage,
LevelTestResults, SpeakingPage (pass real `onNextLevel` — the disable is
superseded); Astro lesson recap gains "Nächstes Thema →". Mobile:
`BottomNav.jsx` (Dashboard/Üben/Prüfung/Wörter/Profil, authed, added to
brand-test chrome list); PWA `manifest.webmanifest` + icons (link tag
UNstamped per head-tags doctrine; no service worker yet).

### Phase 5 — Mock exams + AI writing (2 PRs)
PR 5a: mock content as repo data `src/data/mockExams/*.js` (reading/
Sprachbausteine items inline; listening references existing
`listening_exercises` ids for audio; writing → task_key; speaking → existing
missions; every module carries the disclaimer). Migration
`exam-attempts.sql`: own-row RLS SELECT/INSERT/UPDATE (no DELETE),
`section_deadline` persisted server-side of client state, answers jsonb,
scores. SPA routes `/modelltest`, `/:examSlug`, `/run`, `/result/:attemptId`
behind SubscriptionGuard + netlify.toml allow-list (noindex, not
prerendered — the /telc-b1-kurs precedent). `src/services/examService.js`
(programProgress pattern; debounced saveAnswers so refresh resumes) +
pure `examScoring.js` (unit-tested). Results: bands labeled "Richtwert —
keine offizielle Bewertung", wrong items deep-link to their grammar topic.
PR 5b: `netlify/functions/evaluate-writing.mjs` cloned from the
evaluate-speaking skeleton (CORS, v1 handler, `_shared/auth.mjs` identity,
tier via shared getTier, limits by counting `writing_submissions`
{trial 2 total, pro 20/mo, expired 0}, rubric prompts server-owned in
`_shared/writingRubrics.mjs` keyed by validated exam/task key, Claude via
existing `_shared/speakingAI.mjs`, service-role insert). Migration
`writing-submissions.sql`: SELECT-own, NO client writes (speaking/purchases
doctrine — AI cost = server-gated). `src/data/writingTasks.js` task bank
with provenance. SPA routes `/schreiben`, `/schreiben/:examSlug` +
allow-list. Claims: `WRITING_*` constants in marketing.js (+ twin) with
provenance; claims.test parses `WRITING_LIMITS` from the function (the
DAILY_LIMITS pattern). Copy says "Einschätzung nach Prüfungskriterien",
never a pass prediction.

### Phase 6 — Vocab SRS + goal maturation (1–2 PRs)
Migration `vocab-srs.sql`: `vocab_srs_cards` (PK user_id+word_id — verify
`words.id` type live first; ease/interval/due_at/reps/lapses; index
user_id+due_at; own-row RLS all four verbs WITH CHECK — program_progress
pattern verbatim). Pure `srsScheduler.js` (SM-2-lite, unit-tested) +
`srsService.js` (fetchDueCards/recordReview/enqueueWords). `/vocabulary`
becomes the trainer home: due-queue flashcards (reuse WordCard; no
audio-dependent UX), browse, "aus Lektionen hinzufügen"; level pages get
"Diese Wörter in den Trainer" (the persisted markAsLearned replacement);
`getLevelProgress` gains a real vocab component. Streak/goal:
`fetchActivityTimestamps` gains SRS reviews + writing submissions + exam
attempts; goal target editable; BottomNav badge = due count.

## Deletion ledger
`GrammarLessonPage.jsx`, `GrammarSectionPage.jsx`, `GrammarTopicsPage.jsx`,
`GrammarOverviewPage.jsx`, `VergleichHubPage.jsx`, `ComparisonPage.jsx` +
routes/lazy imports (≈2,900 lines); DashboardPage's own top bar;
ProgressContext dead methods; `/grammar/overview` rewrite → 301.

## Critical files
`src/App.jsx` · `netlify.toml` · `src/contexts/ProgressContext.jsx` ·
`src/pages/DashboardPage.jsx` · `astro-site/src/layouts/Layout.astro` ·
`src/services/dashboardStats.js` · `scripts/check-duplicates.mjs` ·
`scripts/check-built-html.mjs` · `astro-site/astro.config.mjs`

## Verification
- Every PR: `npm run lint && npm run check:duplicates && npm test` +
  `npm run build:verify`; CI full built-HTML check (Astro from committed
  grammar cache).
- Playwright walkthrough of each rebuilt surface on the production build
  (`scripts/serve-like-netlify.mjs`), screenshots sent to the owner.
- Live DB verification via the Supabase connector for every new table/write
  path; migrations hand-applied per migrations/README — UI ships failing
  soft to an "activation pending" empty state until SQL is applied (read
  the supabase-js error, never rely on a throw).
- Claims/brand/guides/exams suites green on every PR; mock/writing copy
  never claims official material or predicts passing.
- Revenue work (launch emails, START49, purchase E2E) continues in parallel
  per `docs/revenue-plan-2026-08-31.md` — the renovation never blocks it.
