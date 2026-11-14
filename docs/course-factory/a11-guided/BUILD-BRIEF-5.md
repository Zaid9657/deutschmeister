# Codex build brief 5: teach it before you ask it — 2026-11-14

Follows briefs 1–4b. Read `CLAUDE.md`, then `REVIEW-daf-24-2026-11-14.md` in this folder: its ten
opening lines and section **B1** (the one BLOCKER). This brief closes B1 and one open point of the
proof. Nothing else; the other findings come in later briefs.

## Why

The founder: "i dont want the user to be needing any source to learn the language or to feel that
he needs a teacher." Review 24's verdict is "not yet", and its first reason is that the course
**asks for basics it never teaches**. Claude checked the data and it is true:

- Lektion 1 asks the learner to spell their own name. The course shows the German names of only
  nine letters (in the notice, after the scene). There is no alphabet.
- Lektion 2 checks phone digits and promises "numbers from zero to ten". The numbers exist only as
  a heading entry (`die Zahlen 0–10`, `meta: true`) that is never shown as cards.
- Lektion 4 checks prices (fünfzehn / fünfzig, dreißig / dreizehn) and promises prices to a hundred.
  `die Zahlen 11–100` is again only a heading. How a two-digit number is built is never shown.
- Lektion 6 needs a clock time in its read and its writing task; `um` + time is explained in
  Lektion 8. Lektion 8's read needs „halb zehn“ before its own notice explains it.

A learner with no teacher is stuck at each of these. This was already so before the guided flow.

## Part A: a taught set, as a stage

Add one new guided stage kind for a **set the learner must be able to produce**: the alphabet, a
number range. Build it once; three Lektionen use it.

- **Data, not code:** a set is declared in the curriculum as its members, each with what is written,
  what is said and, where it helps, a short note (letter `J` → „Jot“; `15` → „fünfzehn“). The two
  existing heading entries (`meta: true`) point to their set; the validator rejects a `meta` heading
  with no set. German letter names and number words are facts of the language: write them
  carefully (26 letters, Ä Ö Ü, ß; 0–10; 11–20, the tens, 21–99 as a rule with examples, hundert)
  and list them in the report so Claude can check every one.
- **Stage:** small groups (about six members), each group: hear and see each member, say it aloud
  (`ReadAloudLine`, existing fallbacks), then two or three **checked** tasks on that group through
  `checkAnswer` / `checkOptionsFor` before the next group. Fair with the browser voice: "which
  letter / number do you hear?" among members of the set, and "write what you hear" for a spelled
  word or a spoken number. For 21–99 teach the rule (einundzwanzig = one-and-twenty) with a few
  members and check it with numbers that were **not** shown, since the rule is the target.
- **Pairs that are easy to confuse get a check of their own:** E / I, G / J, V / W; fünfzehn /
  fünfzig, dreizehn / dreißig, and the other -zehn / -zig pairs.
- The two-minute rule holds inside the stage: no stretch of input longer than about two minutes
  without a checked response.
- Not practice for gold; first-response scoring unchanged. Saved runs resume inside it. Bilingual,
  German task text with **Sie**. Tokens only, motion on transform and opacity, lazy loaded.

## Part B: put each set before its first use

- **Lektion 1:** the alphabet stage comes before the scene chunk that asks for spelling. Decide
  whether before the whole scene or between chunks, and say why. The notice keeps its role (the
  confusing pairs, asking „Wie buchstabiert man das?“) and may be shortened where it now repeats.
- **Lektion 2:** numbers 0–10 before the scene chunk with the phone number.
- **Lektion 4:** numbers 11–100 before the first price.
- **Lektion 6 and 8 (clock times):** teach `um` + full hour as a usable chunk in Lektion 6 before
  its read and writing need it, with a checked task; in Lektion 8 make sure „halb“ is taught before
  the read question that needs it (reorder so the notice comes first, or teach it in place). Use
  the smallest change that makes the order right; do not rewrite the dialogues.
- Every existing field of the curriculum stays; protected tests stay unedited. If a protected test
  blocks a placement, the protected test wins: choose another placement and record it.

## Part C: a rule so it cannot come back

The validator has let this through because a word counted as "taught" when it sat in
`FUNCTION_WORDS` or under a `meta` heading. Add a rule by class, with regression tests:

- a `meta` heading must declare a set, and that set must be delivered by a stage **earlier in the
  built order** than the first checked item that needs one of its members;
- for the guided flow, a checked scene, read, sound or proof item must not need a number word,
  letter name or clock-time form before the stage that teaches it. Implement it over the built
  lesson (`buildLesson`), for all three seeded draws, not over the raw data.

Report what the rule finds on today's course before your changes and after.

## Part D: the proof of "I can spell my name"

Today Lektion 1's proof goal 3 passes when the learner just types the surname, because typing
cannot show spelling. Change the task so it proves the can-do without a microphone and stays fair
with one: the learner **hears a spelled name and writes it** (a name from the Lektion's own
dialogue or cast, spelled by the voice letter by letter), and where the scored speech path is
available may instead spell their own name aloud. Self-confirmation still never passes. Update
RULE 35, the draft checker, `content/l01.json` and the "Proof" section of `CONTENT-BRIEF.md` for
this task form.

## Rules that stay binding

As in briefs 1–4b: protected tests unedited (`tests/lesson-engine.test.mjs`,
`tests/lesson-scoring.test.mjs`, `tests/lesson-back-skip.test.mjs`, `tests/curricula.test.mjs`,
`tests/save-progress-ask.test.mjs`, the speaking-coach suites, `tests/explain-cache.test.mjs`,
`tests/explain-refund.test.mjs`); three parts with both pauses; `requeue` directly before `recap`;
derive, never retype; analytics behind consent, new funnel step names through `src/data/events.js`
and its synced copies; flow-aware time estimates follow the new stages (never typed); A1.2
unchanged; no SQL; do not edit `CLAUDE.md` or `astro-site/package-lock.json`; never weaken an
assertion; do not stop to ask.

## Gates (all green at the end, from a clean `dist/`)

```bash
node scripts/build-lesson-pool.mjs a1.1 && node scripts/validate-curriculum.mjs && node scripts/sync-shared.mjs
node scripts/check-guided-draft.mjs 1 2 3 4 5 6 7 8 9 10 11 12
npm run lint && node scripts/check-duplicates.mjs && npm test
for f in netlify/functions/*.mjs netlify/functions/*.js netlify/functions/_shared/*.mjs; do node --check "$f"; done
rm -rf dist && npm run build && mv dist/index.html dist/app.html
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/merge-site-builds.mjs && node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs dist
```

`.git` is read-only for you: do not commit. `node_modules` and `astro-site/node_modules` are
symlinks: do not install or change dependencies.

## Report

Write `docs/course-factory/a11-guided/build-report-5.md` as you go, a section per part with its gate
results: every member of every set as written and as said; the stage as built and where each
Lektion places it; what the new rule found before and after; the new proof task; tests added and
changed; anything open or unverified.
