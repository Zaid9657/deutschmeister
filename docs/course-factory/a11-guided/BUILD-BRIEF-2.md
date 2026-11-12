# Codex build brief 2: the guided lesson, step 2 (A1.1 Lektion 1 only) — 2026-11-12

Continues `BUILD-BRIEF-1.md` (built and committed; see `build-report-1.md`). Read the design in
`docs/strategy/lesson-design-2026-11-12.md`, sections 3 and 4, and `CLAUDE.md` first.

## What the founder decided since brief 1

- The teacher is candidate A and her name is **Frau Hoffmann** ("Frau Weber" was dropped: the
  story already has a Herr Weber). Her portrait is `public/art/a11/teacher-512.webp` and
  `teacher-160.webp`.
- He approved the plan again with these next steps.

## Scope of this brief

Step 2 of the design, for the guided flow of Lektion 1 only:

1. hint-first correction;
2. the sound slot;
3. the short read;
4. the fluency round;
5. the recap's story hook;
6. two fixes from Claude's walk-through;
7. the teacher's identity recorded as data (no control yet).

Not in this brief: the proof and the locked path, "Ask the teacher", the scripted conversation,
Arabic, generated audio, the subscription. Do not start them.

The hard boundary of brief 1 still holds: Lektionen 2–12 and all of A1.2 behave exactly as today,
the protected test files stay unedited, and every existing Lektion 1 field stays.

## Stage order after this brief (guided Lektion 1)

| Part | Stages |
|---|---|
| 1 Understand and say | `pretest`, `scene`, `wortfeld` (scene words), `sound` (new), `read` (new) |
| 2 Learn and practise | `notice`, `practice`, `derived`, `dictation`, `requeue`, `fluency` (new) |
| 3 Use it | `speaking`, `writing`, `recap` (with the story hook) |

Both saved pauses stay, and the guest save-ask still replaces the first pause.

## 1. Hint-first correction

Evidence: prompting the learner to repair an error works better than giving the answer
(Lyster & Saito 2010: prompts d = 0.83, recasts 0.53).

- In the guided flow, a wrong first answer in `practice`, `derived`, `dictation` and in the scene's
  meaning checks does **not** reveal the answer. The learner gets a hint and one second try; the
  answer and its one-line reason come after the second try (right or wrong).
- The hint must never contain the answer. Prefer a hint derived from data that already exists
  (the item's type, its error tag, its rule card, the line it comes from). If an item has no safe
  hint, fall back to a neutral prompt to try again. Enforce "a hint never contains an accepted
  answer" with a validator or test rule over the whole A1.1 pool, not with a list of ids.
- Scoring does not change: the **first** response is the only one recorded for the practice score
  and for gold (`src/lib/lesson/mastery.js`). The second try is a retry.
- The existing TYPO rule in `src/lib/lesson/check.js` stays as it is: a case-only or typo-class
  miss already gets its one retry; do not stack a second hint retry on top of it.
- A miss still returns later through `requeue`, which moves into Part 2 for the guided flow.
- German hints speak **Sie**; every hint has its English twin.

## 2. The sound slot (`sound`, new stage)

Evidence: pronunciation teaching works when it has feedback, and hearing the difference comes
before saying it (Lee, Jang & Plonsky 2015; Yao et al. 2025).

- It replaces the self-ticked `phonetik` stage **in the guided flow only**. Keep the existing
  `phonetik` data (three items; the count is pinned by `tests/curricula.test.mjs`) and build the
  sound items from it.
- Per item: the learner listens, answers one checked question about what they heard (for
  Lektion 1's word stress: which syllable is stressed), then says the word aloud through
  `ReadAloudLine` with its existing scoring and fallbacks.
- The audio is still the browser voice. Do not build anything that needs a deliberately wrong
  pronunciation to be synthesised; that waits for generated audio.
- The checked question goes through `checkAnswer` / `checkOptionsFor`.

## 3. The short read (`read`, new stage)

- One short real text for the situation (for Lektion 1: a hostel notice or check-in card), written
  only with words the Lektion has taught (its Wortfeld and dialogue; the taught-words rule that
  binds dialogues binds this text too, with a validator rule and a regression test).
- It carries the Wortfeld entries that do not occur in the dialogue, each tappable for its
  meaning, so the input-coverage rule (RULE 23) still holds and nothing is dropped. With that,
  the `wortfeld-more` stage of brief 1 is no longer needed in Part 2; remove it only if every one
  of those entries is covered by the read text.
- Two checked comprehension questions through the common checker.
- English twins for the title, the instruction and the questions.

## 4. The fluency round (`fluency`, new stage)

- At the end of Part 2 the learner says the four scene lines they already know again, one after
  the other, without the text first (the text is one tap away).
- It is practice for speed and ease with familiar language: unscored for gold, no countdown that
  can fail, no penalty. It may show how many of the four were said.
- It reuses `ReadAloudLine`; signed-out and no-microphone learners keep the self-confirm route.

## 5. The recap's story hook

- New optional Lektion field `nextHook` (German, with its English twin) shown on the recap after
  the can-dos. For Lektion 1: Ana has to register at the public office tomorrow; can she fill in
  the form? It must match what Lektion 2 really is.
- Add the field to Lektion 1 only in this brief, with a validator rule for its shape. The recap of
  every other Lektion is unchanged.
- Can-dos still lead the recap; scores stay in the closed details; no XP.

## 6. Fixes from the walk-through

1. The scene's first say step asks for the learner's name although they typed it one step earlier
   in the first-sentence step. Reuse that name (in memory for the run only; do not store it in the
   snapshot, analytics or the database), and let the learner change it.
2. The lesson intro still shows "about 20–50 min" as the first thing a beginner reads. Keep the
   estimate honest and labelled as an estimate, but show it as three parts (for example
   "3 parts · about 15 min each", derived from the same counts, never typed), since the lesson
   saves at each pause.

## 7. The teacher's identity as data

- Record the teacher in the A1.1 data: name "Frau Hoffmann", her two portrait files, alt text, and
  that she is an AI teacher. Put it where the course's art and meta data live
  (`src/data/curricula/a11.art.js` / `a11.meta.js`), not inside the dialogue cast (she is not a
  speaker in the story, and the cast is pinned to the dialogue speakers by tests).
- Add a test that the name does not collide with any dialogue speaker's surname in A1.1 or A1.2.
- Do **not** render a teacher button or portrait yet: it ships with its endpoint.

## Rules that stay binding

As in brief 1: `CLAUDE.md` binds; derive, never retype; `check.js` decides answers; three parts
with pauses; local-first saving; Sie in German course text; colours and fonts from
`src/data/design-tokens.js`; motion on transform and opacity only; lazy-load new stages; after any
content edit run `node scripts/build-lesson-pool.mjs a1.1` then
`node scripts/validate-curriculum.mjs`. Do not edit `CLAUDE.md`; list the rules this step bends.

Never delete or weaken a meaningful assertion to get a green run, and never widen `accepted` alone
to make an answer pass.

## Tests

Add tests for: the new stage order; Lektion 2 and an A1.2 Lektion unchanged; hint-first (first
response recorded, hint without the answer, answer after the second try, no stacking on the TYPO
retry); the sound question and the read questions going through the common checker; the read
text using taught words only and covering the remaining Wortfeld entries; fluency excluded from
gold; the story hook on Lektion 1's recap only; the name reuse without storing it; the teacher
data and the no-collision rule.

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

## Report

Write `docs/course-factory/a11-guided/build-report-2.md`: files changed; the new Lektion 1 data
(the read text, the sound questions, the hook, the hints' source); the stage order as built; tests
added and changed with reasons; course rules bent; gate results; anything open or unverified.
