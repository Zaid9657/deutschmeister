# Codex build brief 1: the guided lesson, steps 0 and 1 (A1.1 Lektion 1 only) — 2026-11-12

## What the founder decided, verbatim

- "i dont want the user to be needing any source to learn the langiage or to feel that he needs a teacher or a language learning center"
- On his own German course: "it was throwing informations and hoping i would learn somehow, not too much speaking was done"
- "use higgsfield to build the best and most beautiful courses, hold no limits"
- He approved the lesson design in `docs/strategy/lesson-design-2026-11-12.md` and chose teacher A.

Read that design first (sections 3 and 4). This brief builds its **step 0 and step 1 only**.
Later steps (hint-first correction, sounds, fluency, the proof and the locked path, "Ask the
teacher", the scripted conversation, Arabic) come in later briefs. Do not start them.

## The one rule behind the design

The learner never gets more than about two minutes of input without producing something that is
checked. Today Lektion 1 opens with a 10-line dialogue, 20 word cards, a grammar card and three
self-ticked sounds before the first scored practice.

## Hard boundary: only Lektion 1 changes

Lektionen 2–12 and all of A1.2 must behave exactly as today. The legacy build path stays
byte-identical in behaviour: `tests/lesson-engine.test.mjs`, `tests/lesson-scoring.test.mjs`,
`tests/lesson-back-skip.test.mjs`, `tests/curricula.test.mjs`, `tests/save-progress-ask.test.mjs`,
the speaking-coach suites, `tests/explain-cache.test.mjs` and `tests/explain-refund.test.mjs` stay
green **without edits**.

Lektion 1's existing data shape is pinned by `tests/curricula.test.mjs` (15–25 Wortfeld entries,
6–10 dialogue lines, 3 Phonetik items, 2 dictation and 2 read-aloud lines, `minutes: 15`). So the
change is **additive**: keep every existing L1 field and add a flow on top.

## Step 0: measure where learners stop

Today we cannot tell where a learner quits a lesson: practice answers are written only at the recap
(`src/lib/course/syncOutbox.js`), and `startLesson` runs when the intro screen mounts
(`src/pages/lesson/LessonPlayerPage.jsx`, the effect near line 196), before Start is pressed.

1. Write "started" when the learner presses Start, not when the intro mounts.
2. Record the furthest stage reached for signed-in learners: new columns
   `lesson_progress.furthest_stage` (text) and `furthest_at` (timestamptz), written on stage change.
   - Write the SQL as a new file under `migrations/` following `migrations/README.md`. It is
     owner-applied: **never assume it landed**. The client must fail soft when the columns are
     missing (no error shown, no retry storm, the lesson plays on), with a test for that.
3. Finer analytics steps: `lesson_stage_viewed` already fires per stage with `run_id`
   (`src/lib/funnelTracking.js`, registry `src/data/events.js`). Give the new scene stage item-level
   `step` values (for example `scene:2:say`), so the consented funnel shows the exact item.
   `src/data/events.js` is a shared file: keep its copies identical via `scripts/sync-shared.mjs`,
   and keep analytics behind the consent flag as today (`public/consent.js`).

## Step 1: the scene in short chunks, with say-it scoring

### Data (`src/data/curricula/a11.js`, Lektion 1 only)

Add `flow: 'guided'` and a `guided` block. For this step it holds:

- `chunks`: boundaries over the existing 10 dialogue lines, 2–3 lines per chunk (for example
  lines 0–1, 2–5, 6–7, 8–9);
- one meaning check per chunk (the learner shows they understood: a choice among English
  meanings, or matching a line to its meaning), graded through `src/lib/lesson/check.js`
  (`checkAnswer` / `checkOptionsFor`), never by a new comparison;
- per chunk, which line the learner says aloud. It is always one of Ana's lines (the learner's own
  role), adapted so the learner uses their own name where the line has one.

English twins for every new learner-facing text go where the existing ones live (`a11.meta.js` or
inline `…En` fields, as the neighbouring fields do). German task text speaks **Sie**.

### Engine

- New `src/lib/lesson/buildGuided.js`. `buildLesson()` in `src/lib/lesson/buildLesson.js` gets one
  early branch on `lektion.flow === 'guided'`; nothing else in it changes.
- `src/lib/lesson/sessions.js`: a stage may carry its own `part`
  (`sessionOf = stage.part ?? SESSION_OF[stage.kind]`); the legacy table is unchanged.
- `src/lib/lesson/runState.js`: store `flow` in the saved run and discard a saved run whose flow
  differs. Do **not** bump `RUN_VERSION` (that would reset learners mid-run in every Lektion).

Stage order for guided Lektion 1 in this step:

| Part | Stage | Notes |
|---|---|---|
| 1 | `pretest` | Existing model-first pretest, unchanged |
| 1 | `scene` (new) | Per chunk: hear and read 2–3 lines → meaning check → say the line aloud |
| 1 | `wortfeld` | Existing stage, fed only the Wortfeld entries that occur in the dialogue |
| 1 | `notice`, `phonetik` | Existing, unchanged |
| 2 | `wortfeld` (second, short) | The remaining Wortfeld entries, titled as more words for this topic; nothing is dropped |
| 2 | `practice`, `derived`, `dictation` | Existing: same 7 + 3 + 2, same draw |
| 3 | `speaking`, `writing`, `requeue`, `recap` | Existing, unchanged |

- New `src/components/lesson/SceneStage.jsx`. Reuse `GlossLine`, `AudioSourceBadge`, `PlayButton`
  and `ReadAloudLine` (speech scoring through the existing `netlify/functions/score-readaloud.mjs`;
  its fallbacks stay: no microphone, signed out, limit reached → the self-confirm "I said it").
- Scoring stays as it is: `scene` is **not** a first-pass practice stage (`src/lib/lesson/mastery.js`,
  `FIRST_PASS_STAGES`); practice gold remains practice-only.
- `lektionMinutesEstimate` in `src/data/curricula/a11.meta.js` becomes flow-aware for the shown
  estimate; `minutes: 15` stays as the validator's target and is never shown.
- Add a validator rule for every new L1 field (`scripts/validate-curriculum.mjs`), with a
  regression test. Close a finding class with a rule plus a test, never with a list of ids.

### Look: match the picture

`docs/strategy/lesson-look-2026-11-12/lesson-screens.jpg`, **left screen**, is the approved look for
the scene step on a phone:

- a slim top bar with back arrow, "Lesson 1 · Part 1 of 3" and a three-segment progress bar;
- the painted scene in a rounded frame: `public/art/a11/l01-rezeption-640.webp` (74 KB),
  `-800.webp`, `-1168.webp` (1168×880). Wire it through `src/data/curricula/a11.art.js`
  (`situations['a1.1-l01'].src` / `srcSmall`; `SituationScene` already has the `<img>` branch).
  Update `generatedWith` honestly for a manifest that is now partly painted, and
  `tests/course-art.test.mjs` with it. Alt text: "Ana arrives at a hostel reception in Bremen and
  Frau Kaya welcomes her";
- a speech bubble with the German line, its English underneath, and a play button;
- the heading "Now you say it", a card with the line to say, and one large round coral button to
  record;
- **leave out the "Ask the teacher" button**: it arrives with its endpoint in a later step. Never
  ship a dead control.

Colours and fonts come only from `src/data/design-tokens.js` (coral is the one action colour,
deep teal the brand colour, serif headlines). No hex in components. Motion: only transform and
opacity, the token tiers, `prefers-reduced-motion` respected. Lazy-load the new stage.

The audio stays the browser voice with its "Computerstimme" label for now; generated audio is a
later step.

## Rules that stay binding

`CLAUDE.md` binds. In particular: derive, never retype; `check.js` decides answers; the three
parts keep their pauses and the guest save-ask replaces the **first** pause; can-dos lead the
recap; no XP; local-first saving through the outbox; after any content edit run
`node scripts/build-lesson-pool.mjs a1.1` and then `node scripts/validate-curriculum.mjs`.

Do **not** edit `CLAUDE.md` (owner file). List in your report every course rule this step bends or
will need changed.

## Tests

Expect to update, each with the reason in your report: `tests/course-value.test.mjs` (it looks for
L1's `dialog` stage and `glossOpen`), `tests/lesson-run-resume.test.mjs`, `tests/course-meta.test.mjs`
(flow-aware estimate; L1 keeps `practice` = 7 and `derived` = 3), `tests/course-art.test.mjs`,
`tests/funnel-events.test.mjs`, `tests/course-player.test.mjs` (new strings and components).

Add tests for: the guided stage order of L1; Lektion 2 and an A1.2 Lektion still building the
legacy order; the saved-run flow tag; the scene meaning checks going through `checkAnswer`; the
fail-soft furthest-stage write; "started" written on Start.

Never delete or weaken a meaningful assertion to get a green run.

## Gates (all must pass; start from a clean `dist/`)

```bash
node scripts/build-lesson-pool.mjs a1.1 && node scripts/validate-curriculum.mjs && node scripts/sync-shared.mjs
npm run lint && node scripts/check-duplicates.mjs && npm test
for f in netlify/functions/*.mjs netlify/functions/*.js netlify/functions/_shared/*.mjs; do node --check "$f"; done
rm -rf dist && npm run build && mv dist/index.html dist/app.html
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/merge-site-builds.mjs && node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs dist
```

`.git` is read-only for you: do not commit. Never commit `astro-site/package-lock.json`.
Claude plays Lektion 1 on a phone-sized browser against the picture and sends you the differences.

## Report

Write `docs/course-factory/a11-guided/build-report-1.md`: files changed; the new L1 data; the
stage order as built; the migration file and its fail-soft behaviour; tests added and changed (with
reasons); course rules bent; gate results; anything left open or that you could not verify.
