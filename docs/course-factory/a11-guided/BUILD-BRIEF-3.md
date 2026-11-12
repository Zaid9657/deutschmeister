# Codex build brief 3: all twelve A1.1 Lektionen on the guided flow — 2026-11-12

Continues briefs 1 and 2 (built, checked, committed; see `build-report-1.md`, `build-report-2.md`).
Read `CLAUDE.md` and `CONTENT-BRIEF.md` in this folder first.

## What the founder decided

"Let's deploy agents … to create the whole course." Agents wrote the guided content for Lektionen
2–12 as drafts: `docs/course-factory/a11-guided/content/l02.json` … `l12.json`. Each passes
`node scripts/check-guided-draft.mjs <nr>` (RULE 32 and RULE 34). Each file's `notes` array holds
the writer's remarks; read them.

This brief makes the engine ready for them and merges them. Work in the order below and keep each
part green by itself, so a restart of the machine loses little: after each part run the fast gates
(pool build, validator, sync, lint, `npm test`) and append to the report before starting the next.

Not in this brief: the proof and the locked path, "Ask the teacher", the scripted conversation,
Arabic, generated audio, the subscription, corrections to existing dialogues. Do not start them.

## Part A: the sound stage learns the other sound exercises

Today `sound` only handles a word with one capitalised stressed syllable (`HAL-lo`). Lektionen
2–12 keep their existing `phonetik.items` (three per Lektion; the count and the data are pinned by
protected tests and must not change). They come in these shapes:

| Shape | Examples | Lektionen |
|---|---|---|
| word stress | `HAL-lo`, `EU-ro`, `Te-le-FON` | 1, 4, 5, 6, 9, 11 |
| word stress with a leading article or pronoun | `der BRU-der`, `ich HÖ-re`, `wir HÖ-ren` | 3, 7 |
| one-syllable sound word | `NEUN`, `SECHS`, `VIER`, `SCHÖN`, `MEIN`, `du SPIELST` | 4, 5, 6, 7, 9, 12 |
| a pair to tell apart | `wie – Sie`, `bin – sind` | 2 |
| a phrase without marking | `Sie sind` | 2 |
| sentence stress | `Wie SPÄT ist es?` | 8 |
| question melody | `Fährt der ZUG?↗` | 10 |

- Classify every item by shape with one function, used by the stage builder and by the validator.
  The validator rejects an item no kind accepts; replace the current single-shape rule in
  `scripts/lib/guided-content.mjs` with it, and cover each kind with a regression test.
- Each item keeps the three steps: listen, answer one **checked** question (through
  `checkAnswer` / `checkOptionsFor`), say it aloud with `ReadAloudLine`.
- **Fairness rule:** the audio is the browser voice. A question must be answerable from what that
  voice really produces, or from what the screen has shown the learner. Never ask the learner to
  hear a contrast the synthetic voice cannot be relied on to make (sentence stress, rising melody),
  and never synthesise a deliberately wrong form. For those kinds, ask about what the learner was
  shown: for example which word carries the stress in the marked sentence, or whether the voice
  goes up or down at the end of a yes/no question, with the marking or the rule on screen before
  the question. For pairs and one-syllable sound words, "which word do you hear?" among real words
  of the same Lektion's items is fair, because the voice says each correctly.
- Derive options and answers from the item's own marking and its Lektion's items. No hand-typed
  answer keys per Lektion.
- All texts bilingual; German task text speaks **Sie**.

## Part B: five flaws from Claude's play-through (see `build-report-2.md`)

1. The sound question confirms with "Yes, that is the meaning." Give sound questions their own
   confirmation wording.
2. Stress options show the word with the stressed syllable marked (`HAL-lo` / `hal-LO`), not "1"
   and "2".
3. The sound stage shows two Continue buttons, one inactive. One primary action per step.
4. A spelling item gets the generic gap hint ("Read the sentence before and after the gap."). The
   hint must fit the item's type; add the missing type(s) by class and keep the rule that a hint
   never contains an accepted answer.
5. In English view the scene's meaning question appears twice, because both slots hold the same
   English sentence. Show a prompt once when its two language versions are identical or when the
   view language already shows it.

Also: the no-German-voice notice is rendered twice in the sound stage's text; show it once.

## Part C: read coverage for number sets

Wortfeld entries flagged `meta: true` (`die Zahlen 0–10`, `die Zahlen 11–100`) are headings for a
set of words, not a word a text can naturally contain. Exempt `meta: true` entries from the
guided read-coverage rule (and only from that rule), with a test. Then simplify the two draft
lines that exist only to carry the heading: in `l02.json` the "(0–10)" and in `l04.json` the
"Zahlen 11–100" / table-number device (its writer names the line to drop in `notes`). The texts
must still pass `check-guided-draft.mjs`.

## Part D: merge the drafts

- For Lektionen 2–12 in `src/data/curricula/a11.js`: add `flow: 'guided'`, the draft's `guided`
  block and its `nextHook`, formatted like Lektion 1. Keep every existing field. Keep the Astro
  twin byte-identical through `scripts/sync-shared.mjs`.
- Lektion 12's draft has a hook towards A1.2; keep it only if the recap can honestly point across
  levels (A1.2 is live); otherwise leave it out and say so in the report.
- Lektionen 2–12 have no painted scene yet. The scene stage must look finished with the existing
  placeholder art (`SituationScene`'s non-image branch); do not reference image files that do not
  exist and do not change `a11.art.js` beyond what is needed for that.
- A say line that opens its chunk has no cue line before it (Lektion 10: all five). Show the
  line that precedes it in the dialogue as the cue when there is one; otherwise show the task
  without a cue. Derive this; do not add data.
- Tests that pin "Lektion 2 still builds the legacy order" lose their witness. Re-point them to an
  A1.2 Lektion and to a synthetic Lektion without `flow`, so the legacy path stays proven. Do not
  delete the assertion.
- Flow-aware estimates (`a11.meta.js`), funnel step names and the saved-run flow tag must work for
  all twelve. A learner with a saved legacy run of Lektion 2–12 is restarted cleanly on the new
  flow (the flow tag from brief 1 does this; prove it with a test).
- `scripts/check-guided-draft.mjs` stays; after the merge it must still pass for 1–12.

If a protected test conflicts with merging one Lektion, the protected test wins: leave that
Lektion on the legacy flow, merge the others, and report the conflict. Do not stop to ask.

## Rules that stay binding

As in briefs 1 and 2. Protected and unedited: `tests/lesson-engine.test.mjs`,
`tests/lesson-scoring.test.mjs`, `tests/lesson-back-skip.test.mjs`, `tests/curricula.test.mjs`,
`tests/save-progress-ask.test.mjs`, the speaking-coach suites, `tests/explain-cache.test.mjs`,
`tests/explain-refund.test.mjs`. `requeue` stays directly before `recap`. Scoring is unchanged:
first response only; scene, sound, read and fluency are not practice for gold. A1.2 behaves exactly
as today. Do not edit `CLAUDE.md` or `astro-site/package-lock.json`. Never weaken an assertion to
get a green run, never widen `accepted` alone.

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

Write `docs/course-factory/a11-guided/build-report-3.md` **as you go** (a section per part, with
its gate results), so a restart leaves a usable record: the sound kinds and the question each
asks; the fixes; which Lektionen were merged and which were not, with reasons; tests added and
changed; course rules bent; anything open or unverified.
