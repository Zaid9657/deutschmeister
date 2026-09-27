# Course v2 — entitlement, the AI allowance, and learner state

**Date:** 2026-09-27 · **Implements:** BLUEPRINT §1.5 (entitlement), §4.7 (allowances), §3.5 (completion),
§5.3/§5.6 (Teil-Karte, Prüfungsstand); SCHEMA §2 (bank keys), §5 (`course.completion`), §14 (learner state).
**Code:** `netlify/functions/_shared/entitlement.mjs`, `_shared/courseV2Config.mjs`, `_shared/speakingUsage.mjs`
(course path), `netlify/functions/score-readaloud.mjs`, `src/contexts/SubscriptionContext.jsx`
(`hasCourseAccess`), `src/components/LevelSubscriptionGuard.jsx`, `src/lib/course-v2/completion.js`,
`src/lib/course-v2/board/`. **SQL:** `migrations/2026-10-01-course-v2.sql`.
**Tests:** `tests/course-v2-entitlement.test.mjs`, `tests/course-v2-completion.test.mjs`.

---

## 1. The rule

A v2 course level is open when **either**

1. the level is free: **A1.1** (`V2_FREE_LEVELS`, the same list as `FREE_LEVELS` in `src/config/freeTier.js`), **or**
2. the user has an **active** `purchases` row whose product covers the level: the per-level products
   `course_a1_2` … `course_b2_2`, or one of the retired band products `course_a1`, `course_a2`, `course_b1`,
   `course_b2`, `course_alle` (their levels come from `levelsForProduct()` in `src/data/pricing.js`). A refunded
   purchase opens nothing. The course is lifetime — the purchase's `access_until` (the included Pro window) plays
   no part.

A trial or a Pro subscription opens a paid v2 level **only** while `V2_TRIAL_PRO_OPENS_PAID` is `true` (§2).

| Question | Server | Client |
|---|---|---|
| May this user open v2 content of level L? | `hasCourseAccess(admin, userId, level)` (and `courseAccess()` for the reason) | `useSubscription().hasCourseAccess(level)` |
| May this user have one more graded AI attempt on bank key K? | `checkCourseAiAllowance(admin, userId, bankKey)` → `{ allowed, reason, remaining, … }` | — (the server decides) |
| Count one graded attempt | `recordCourseAiUse(admin, userId, bankKey, kind)` | — |

**The legacy rule is unchanged.** `hasLevelAccess(level)` (free ∨ trial/subscription ∨ purchase) still governs the
legacy courses and every other level surface (grammar, reading, listening, vocabulary, podcasts). The route guard
asks the v2 question only on the v2 routes — `/course/:level/v2`, `/course/:level/u/:nr`, `/course/:level/p/:nr` —
and on `/course/:level` once that level is in `COURSE_V2_LIVE`.

**Lookup errors fail closed.** If the purchases lookup fails, a paid level stays closed (`reason: 'lookup_failed'`).
A paid level is never opened because the database hiccuped.

## 2. The flag — owner decision D1 (pending)

`V2_TRIAL_PRO_OPENS_PAID` lives twice, and both must carry the same value:

- `netlify/functions/_shared/courseV2Config.mjs` (functions)
- `src/config/courseV2.js` (SPA)

`tests/course-v2-entitlement.test.mjs` fails when they differ.

| Value | Meaning |
|---|---|
| **`false` (default; the blueprint's recommendation)** | A paid v2 level opens only with a purchase. Trial and Pro keep the existing tools — X-Ray, open speaking with the wallet, the legacy course while it lives. |
| `true` | Today's legacy rule applies to v2 as well: an active trial or subscription opens **every** v2 level. That includes the 90-day Pro window every course purchase grants, so during those 90 days a €40 A1.2 buyer could also open B2.2. This undercuts every half-level price (BLUEPRINT §1.5). |

Whichever value you choose, reconcile the „3 Monate Pro inklusive" claim in `pricing.js`/`marketing.js` in the same
PR (BLUEPRINT §1.5 item 4). With `false`, the included Pro window still opens the *existing* tools. It no longer
opens v2 levels that were not bought.

## 3. The course AI allowance

Grading costs money, so the server counts graded attempts per **slot**. A slot is a bank key without its lane
suffix, so `a21-u07-w` and `a21-u07-w-ta2` share one allowance and switching lanes never doubles it. Numbers are
design values (BLUEPRINT §4.7). The owner sets the real ones after the pilot (§13 D8) in `courseV2Config.mjs`:

| Slot class | Bank keys | Lifetime graded attempts |
|---|---|---|
| Aufgabe | `<p>-uNN-w`, `<p>-uNN-s` | **3** (1 attempt + 2 graded revisions) |
| Micro-output | `<p>-uNN-moN`, `<p>-pN-mo` | **2** |
| Plateau part | `<p>-pN-w`, `<p>-pN-s` | **2** |
| Halbtest part | `<p>-ht-…` | **2** |
| Modelltest part | `<p>-m[abc]-…` | **2** |
| Diagnose part (free) | `<p>-dx-…` | **1** |
| **Daily fair-use cap** | every v2 slot together, since 00:00 UTC | **25** |

The free A1.1 gets the same per-slot allowance as a bought level. Legacy keys (`a11-l03`) never enter this path
(`reason: 'legacy_key'`); `evaluate-writing` keeps its own legacy course allowance for them.

**How callers use it** (the order matters — a provider failure must not cost the learner an attempt):

1. `checkCourseAiAllowance()` **before** the AI call. It checks access too; a caller needs no separate
   `hasCourseAccess()`. `remaining` = attempts still open on the slot *including* the one about to be made.
2. Make the AI call.
3. `recordCourseAiUse()` **after** it succeeded. It never throws.

- **Writing** (`evaluate-writing`, via `_shared/rubrics/courseAi.mjs`): one record per graded text, including every
  revision and every written micro-output.
- **Speaking** (`speaking-session`): one record per session, written once the session row exists.
  `speaking-turn` and `evaluate-speaking` never record. `speakingUsage.checkUsage(userId, { courseTaskKey })` /
  `incrementUsage(userId, { courseTaskKey })` route a v2 key to this allowance, and calls without a key keep the
  legacy tiers (Pro 30/month, trial 2 total) unchanged.
- **Read-aloud** (`score-readaloud`): **access only, no allowance.** A line whose `lektionId` is a v2 id (`a2.1-u07…`,
  `a2.1-p2…`, `…-ht-…`, `…-dx-…`, `…-m[abc]-…`) is scored only when `courseAccess()` allows (else 403, or 500 if
  the lookup failed). The existing 60 clips/day cap applies to everyone. Legacy ids (`a1.1-l03`, `a1.1-cp1`) keep
  their old posture.

Reasons returned: `ok` · `ledger_missing` (allowed, degraded, §5) · `slot_allowance_exhausted` · `daily_cap_reached` ·
`purchase_required` · `no_user` · `invalid_key` · `legacy_key` · `lookup_failed` · `usage_lookup_failed`.

## 4. Learner state and completion

v2 reuses the lesson-engine tables with v2 ids (they cannot collide with the live `a1.1-lNN`):

- `lesson_progress.lektion_id` = unit (`a2.1-u07`), Plateau (`a2.1-p2`), closing (`a2.1-ht-ga2`) or Modelltest
  form (`a2.2-ma-ga2`). Status `started` · `tested_out` (new) · `complete` · `gold`.
- `lesson_attempts` = one row per answered item, as before. `review_cards` gains the kinds `teil` and `repair`.

**Completion is one function:** `src/lib/course-v2/completion.js`. It reads the `completion` block of the level's
course.json, either authored or as the compiled manifest:

- `unitCompletion(unit, state, course.completion)`: every Lernschritt (situation/text/sprache/pruefung/check) is
  finished or credited by a passed test-out, **and** both Aufgaben (sprechen, schreiben) are submitted as a real
  attempt. What counts as a real attempt is decided by `isAufgabeSubmitted`: writing ≥ 50 % of the lower word bound,
  never the prompt pasted back; speaking ≥ 20 s, or ≥ 2 turns in a card mode. Überarbeiten never decides completion,
  and completion once stored is never taken away. It returns the `status` the caller should store in
  `lesson_progress`.
- `courseCompletion(course, state)`: 12 units complete, P1–P3 submitted, and the closing block's first form
  submitted (the Halbtest in a .1 course, Modelltest A in a .2 course, from any lane). It never counts the Diagnose
  or Modelltest B/C. For a .2 course whose mocks still run on the legacy `src/data/mockExams` runner, the caller
  maps a submitted `exam_attempts` row to `progress[<Modelltest form id>] = 'complete'`.
- **No score is ever read.** No gate reads an AI score (PRG-01).

The course home, the Teilnahmebescheinigung and the reminders must call these functions and not re-derive them. The
SQL side (the course funnel and `weekly_truth_metrics()`) follows in the PR that switches a level to v2 (SCHEMA §14).

`src/lib/course-v2/board/` turns `exam_practice_results` rows into Teil states and labels. Numbers come only from
full-length Prüfungsmodus attempts. The weighting is: last five attempts, Modelltest × 1.5, attempts older than
21 days × 0.5. Labels read „in voller Länge geübt – Übungswert 11/15" / „im Kleinen geübt" / „kommt in …", and the
banned words are listed and tested.

## 5. What the owner must apply — `migrations/2026-10-01-course-v2.sql`

Apply it by hand in the Supabase SQL editor, like every file in `migrations/`. It is idempotent. **Apply it before any
level enters `COURSE_V2_LIVE` and before the first paid v2 sale.** It creates or changes:

1. **`course_ai_usage`**: the allowance ledger (user, level, bank key, slot key, kind, time). Learners can read
   their own rows. There is **no client write policy**: only the functions (service role) write, so a learner
   cannot reset their own allowance.
2. **`exam_practice_results`**: the Prüfungsstand evidence (SCHEMA §14). Learners can read their own rows and may
   insert **deterministic** rows only (no `ai_range`/`model_id`/`rubric_profile`). AI-graded rows are written by the
   functions. Rows are append-only (no update); learners may delete their own.
3. **`learner_goals`**: lane, exam date, pace, reminder. Own row, all four verbs.
4. **`review_cards.kind`** += `teil`, `repair`, and **`lesson_progress.status`** += `tested_out`. These CHECKs are
   found by column, not by guessed name, then re-added under fixed names.

Not included: the exam-key CHECKs. The four primary-lane keys (`goethe_a1`, `goethe_a2`, `telc_b1`, `telc_b2`)
are already admitted, and secondary lanes widen them when they ship.

Verification queries are at the foot of the file. After applying it, add a row to `migrations/README.md`.

**Before the migration (graceful degradation).** Nothing breaks:

- `checkCourseAiAllowance()` detects the missing table (PostgREST `PGRST205` / Postgres `42P01`) and counts
  `writing_submissions` instead, so written slots stay capped by the grader's own ledger — per slot (the key and its
  lane variants together) and only rows a model graded (`model <> 'deterministic'`: a rule-decided zero costs no model
  call and no attempt, exactly as with the ledger). Spoken slots are gated by
  access only, and the result carries `degraded: true, reason: 'ledger_missing'`.
- `recordCourseAiUse()` returns `{ recorded: false, reason: 'ledger_missing' }`.
- A one-time warning in the function log names this file.
- Any **other** ledger error fails closed (`usage_lookup_failed`), as does a missing Supabase client.

## 6. Open owner decisions this code waits on

- **D1**: does trial/Pro open paid v2 levels? Flip `V2_TRIAL_PRO_OPENS_PAID` in both files (§2).
- **D8**: the real allowance numbers after the pilot (`COURSE_AI_SLOT_ATTEMPTS`, `COURSE_AI_DAILY_CAP`).
- **D7**: anonymous first-sentence scoring (BLUEPRINT §4.7). It is not built; `score-readaloud` requires a
  signed-in user.
- **FernUSG** (counsel, BLUEPRINT §1.6 rule 1): paid AI grading is not promised until it is answered.
