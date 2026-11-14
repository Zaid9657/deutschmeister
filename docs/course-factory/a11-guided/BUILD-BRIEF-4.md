# Codex build brief 4: the proof and the locked path — 2026-11-14

Continues briefs 1–3 (all merged and live: all twelve A1.1 Lektionen run on the guided flow; see
`build-report-1.md` to `build-report-3.md`). Read `CLAUDE.md` first.

## What the founder decided

- 2026-11-12: the path is **locked**: the next Lektion opens only after the learner passes a final
  check; after a failed check the learner retries at once with help, never a dead end.
- 2026-11-14, the pass rule (Claude's recommendation, accepted): **the learner must show every goal
  of the Lektion once. A missed goal is taught again and asked again at once, as often as needed.**
  There is no percentage mark and no way to fail out.

Sales number this serves: a course a learner can finish alone is what the coming subscription
sells; today a Lektion counts as done at any score, so "done" proves nothing.

## Scope

1. A `proof` stage at the end of a guided Lektion, built and authored for **Lektion 1** as the model.
2. Completion of a Lektion that has a proof requires passing it.
3. One lock rule, used by the course home **and** by the lesson and checkpoint routes.
4. The draft checker learns the proof block, so agents can write Lektionen 2–12 next.

A Lektion without a `proof` block behaves exactly as today (Lektionen 2–12 until their proofs are
merged, and all of A1.2). Not in this brief: "Ask the teacher", the scripted conversation, Arabic,
generated audio, the subscription, corrections to existing dialogues. Do not start them.

Work part by part; after each part run the fast gates and append to the report, so a restart of
the machine loses little. Do not stop to ask: where this brief and a protected test conflict, the
protected test wins and you record it.

## Part A: the proof stage (engine + Lektion 1 data)

### Data

A new optional Lektion field `proof` in `src/data/curricula/a11.js`:

- exactly **one task per can-do**, in can-do order, each naming its can-do by index;
- each task: a situation prompt in German (**Sie**) with its English twin, the answer the learner
  must produce, what counts as right, and a pointer to where the Lektion taught it (a dialogue
  line, a Wortfeld entry or the notice) for the re-teach step;
- the task asks the learner to **do** the can-do in a small real situation ("Sie kommen an die
  Rezeption. Begrüßen Sie Frau Kaya."), not to recite a sentence shown on screen and not to
  translate a sentence word by word;
- where the answer contains the learner's own name or spelling, it is checked the way the
  model-first pretest and the scene's `ownName` lines already do it; find and reuse that, do not
  write a second mechanism;
- a can-do about understanding (not producing) may be a checked choice; a can-do about writing a
  short message may be a short typed production. Decide per can-do and say why in the report.

Write Lektion 1's proof (four can-dos). Every word a proof task shows or expects must be taught
by the Lektion (the taught-words rule that binds the read text binds the proof too).

### How an answer is given and judged

- Everyone can **type** the answer; `src/lib/lesson/check.js` decides it (`checkAnswer` /
  `checkOptionsFor`). Never a new comparison, never `accepted` widened alone.
- A signed-in learner with a microphone may **speak** it instead, judged by the existing
  `ReadAloudLine` / `netlify/functions/score-readaloud.mjs` path with its existing pass threshold.
  If the scorer is unavailable, over its limit or unsure, the learner types.
- **Self-confirmation ("I said it") never passes a proof task.** That fallback stays where it is
  today (scene, sound, fluency), not here.

### The loop

Per task: answer → right: next task. Wrong: the hint-first rule already built applies (a hint that
never contains the answer, one second try). Still wrong: a **re-teach card** shows where the
Lektion taught it (the model with its English and its audio), then the same task is asked again
with the model hidden. This repeats until the task is right. No countdown, no attempt limit, no
skip control, no way to leave the proof as "done" without every task right.

- The proof is **not** practice for gold; scoring rules are unchanged (first response of
  first-pass practice only).
- Record per can-do whether it was shown on the first try. Keep it where run and attempt data
  already live; prefer an existing field. If and only if a database column is unavoidable, write
  the SQL under `migrations/` (owner-applied, never assume it landed) and make the client fail
  soft, with a test, as brief 1 did.
- A learner who leaves mid-proof resumes in the proof (saved run, local-first, the outbox rules).

### Where it sits

Part 3 becomes `speaking`, `writing`, `proof`, `requeue`, `recap`. `requeue` stays directly before
`recap` (protected `tests/lesson-back-skip.test.mjs`). Back never opens an empty requeue; Back from
the recap must not let a learner re-enter a passed proof in a way that un-passes it.

### Look

Same visual language as the scene step (`docs/strategy/lesson-look-2026-11-12/lesson-screens.jpg`):
slim top bar, one task per screen, one primary action. A small "Goal 2 of 4" line names the can-do
being shown, in the learner's view language. Tokens only, motion on transform and opacity, lazy
loaded. No teacher portrait or "Ask the teacher" control yet.

### Recap

Can-dos still lead. For a Lektion with a proof, each can-do carries a quiet mark that it was shown
in the proof. Scores stay in the closed details. No XP.

## Part B: completion and the lock

- For a Lektion with a `proof`, the completion write (`completeLesson` through
  `src/lib/course/localProgress.js` and the outbox) happens only once the proof is passed. Guests
  and signed-in learners alike. A Lektion without a proof completes as today.
- Extract the unlock rule that today lives inline in `src/pages/CurriculumHomePage.jsx`
  (`unlocked = (!user || loaded) && (endowed || node.index === 0 || done.has(previous))`) into one
  module, `src/lib/course/lock.js`, and use it from the course home **and** as a guard in
  `LessonPlayerPage` and `CheckpointPage` (routes in `src/App.jsx`). Keep its behaviour exactly:
  placement ("endowed") still opens the path, the first node is always open, and nothing shows as
  locked while progress is still loading (see the LSN-15 comment there).
- A learner who opens a locked Lektion or checkpoint by link sees a short, friendly screen: what
  is locked, why, and one button to the Lektion they are on. German and English. Never an error
  page, never a redirect loop, never a flash of the locked screen while progress loads.
- Everything a learner completed before this change stays completed and unlocked.
- The lock is enforced in the app only. Say so in the report; do not add server checks.
- Level access (`hasLevelAccess`) is a different rule and is not touched.

## Part C: validator and draft checker

- A validator rule for the `proof` block by class (shape, one task per can-do in order, bilingual
  texts, Sie, exactly one right option for choices through the common checker, the re-teach pointer
  resolves, taught words only, a hint never contains an accepted answer), with regression tests.
- `scripts/check-guided-draft.mjs` accepts an optional `proof` block in a draft file and runs the
  same rule on it. Add Lektion 1's proof to `content/l01.json` as the model for the writers.
- Add a short "Proof" section to `CONTENT-BRIEF.md` that tells a writer what a good proof task is,
  with Lektion 1's four tasks as the example.

## Rules that stay binding

As in briefs 1–3. Protected and unedited: `tests/lesson-engine.test.mjs`,
`tests/lesson-scoring.test.mjs`, `tests/lesson-back-skip.test.mjs`, `tests/curricula.test.mjs`,
`tests/save-progress-ask.test.mjs`, the speaking-coach suites, `tests/explain-cache.test.mjs`,
`tests/explain-refund.test.mjs`. Three parts with both pauses; the guest save-ask replaces the
first pause. Derive, never retype. Analytics behind the consent flag; new funnel step names for
the proof go through `src/data/events.js` and its synced copies. Do not edit `CLAUDE.md` or
`astro-site/package-lock.json`; list in the report every `CLAUDE.md` rule this step changes in
fact (for one, "a Lektion completes at any score" no longer holds where a proof exists). Never
weaken an assertion to get a green run.

## Tests

Add tests for: the stage order with and without a proof; a proof cannot be passed with a wrong
answer, by self-confirmation, by Back, by reload or by resuming; the loop (hint, second try,
re-teach, ask again) ends only when every task is right; first-try results recorded and fail-soft;
completion withheld until the pass and written once; the lock module giving the same answers as
the old inline rule for every case (guest, loading, placed above, first node, previous done,
previous not done); the route guard for lesson and checkpoint, including no flash while loading;
previously completed Lektionen still open; Lektion 2 (no proof yet) and an A1.2 Lektion unchanged;
the validator rule and the draft checker.

## Gates (all must pass at the end; start from a clean `dist/`)

```bash
node scripts/build-lesson-pool.mjs a1.1 && node scripts/validate-curriculum.mjs && node scripts/sync-shared.mjs
node scripts/check-guided-draft.mjs 1 2 3 4 5 6 7 8 9 10 11 12
npm run lint && node scripts/check-duplicates.mjs && npm test
for f in netlify/functions/*.mjs netlify/functions/*.js netlify/functions/_shared/*.mjs; do node --check "$f"; done
rm -rf dist && npm run build && mv dist/index.html dist/app.html
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/merge-site-builds.mjs && node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs dist
```

`.git` is read-only for you: do not commit.

## Report

Write `docs/course-factory/a11-guided/build-report-4.md` **as you go**, a section per part with its
gate results: Lektion 1's four proof tasks and why each has its form; the loop as built; where
first-try results are stored; the lock module and the guard; tests added and changed; course rules
changed in fact; anything open or unverified.
