# Build report 6 — 2026-11-14

Scope: BUILD-BRIEF-6, A → B → C. No commits, dependency changes, SQL, protected-test edits, draft JSON edits, CLAUDE.md edits or lockfile edits.

## Part A — German-dependent scene checks

Implemented. English is hidden per line in both interface languages, with an accessible per-line show/hide control; German word glosses remain tappable. Lektion 1's first exchange keeps English initially visible: the learner's first German minute needs an understandable model. It is labelled supported evidence even if no control was opened. Later exchanges start hidden. Final feedback shows the complete English exchange in either interface language.

Numeric line ids and true-only opened flags persist in the run; first scene responses carry separate `translationOpened` and `translationShown` flags. The existing attempt `error_tag` text field encodes fixed scene evidence labels on sync; no new column is needed. Recap distinguishes responses with/without the translation inside its closed details; neither is included in practice gold. A consent-gated registered scene-answer funnel event carries only ids, fixed step names and booleans.

RULE 38 is an authoring advisory with explicit word-count/detail thresholds. Existing questions are reported, not rewritten; it does not turn known authoring debt into a failing build. A unique longest answer needs at least three extra words and a 1.5× margin, or three clauses against single-clause alternatives and at least three extra words. Human review must still catch world-knowledge/text-free answers.

RULE 38 findings (same before/after, questions untouched):

| L | Findings (option word counts) |
|---|---|
| 1 | scene 1 (longest-by-margin; 8/5/3); scene 3 (longest-by-margin; 3/4/7) |
| 2 | none |
| 3 | none |
| 4 | none |
| 5 | none |
| 6 | none |
| 7 | none |
| 8 | none |
| 9 | none |
| 10 | none |
| 11 | none |
| 12 | none |

Part A gates: curriculum validator green; lint green; guided scene/read/feedback, new quality, funnel registry/consent and outbox suites green (5 files). Remaining full gates run after C.

## Part B — every word, grouped retrieval

Baseline captured from the actual built flow before edits (all three seeded draws). 169/263 entries received cards; 94 did not, including two meta headings that belong to taught sets. The time model uses 8–15 seconds per card; these are assumptions, not observed completion times. Before the change a full card block had no checked response even across its navigation pages.

| L | Entries | Meta | Cards before | Missing before | Unchecked card input before, seconds | Lesson estimate before, minutes |
|---|---:|---:|---:|---:|---|---|
| 1 | 20 | 0 | 11 | 9 | 88–165 | 30–65 |
| 2 | 25 | 1 | 15 | 10 | 120–225 | 30–65 |
| 3 | 23 | 0 | 17 | 6 | 136–255 | 30–65 |
| 4 | 18 | 1 | 9 | 9 | 72–135 | 30–70 |
| 5 | 24 | 0 | 16 | 8 | 128–240 | 30–65 |
| 6 | 19 | 0 | 9 | 10 | 72–135 | 30–60 |
| 7 | 23 | 0 | 21 | 2 | 168–315 | 25–60 |
| 8 | 25 | 0 | 18 | 7 | 144–270 | 30–65 |
| 9 | 23 | 0 | 21 | 2 | 168–315 | 30–65 |
| 10 | 21 | 0 | 13 | 8 | 104–195 | 30–60 |
| 11 | 18 | 0 | 7 | 11 | 56–105 | 30–60 |
| 12 | 24 | 0 | 12 | 12 | 96–180 | 30–65 |

Implemented two saved card steps: scene words remain after the scene; remaining non-meta words follow them, before sound and reading, so even sound checks follow all word cards. Both use the ordinary Wortfeld card component with fetched article/plural/audio where available. Tappable reading glosses remain. Meta headings are excluded from cards and still delivered by their taught sets.

Groups are balanced at **at most five** (stricter than six), followed by 2–3 checked tasks: German → English meaning, hear-and-pick, and article if the group contains a noun. Meaning uses the extracted existing derived matching question builder; hearing uses the extracted derived listen/select builder and component. Targets rotate with the seeded attempt; alternatives are from the same group in the same Lektion. Audio fallback still requires a checked text response, records no listening evidence, and never affects gold. These attempts are tagged word-retrieval and excluded from gold, combo and the final requeue.

The estimator uses actual card/check counts: 8–15 seconds/card, the existing 20–40-second choice budget, and 3–6 seconds of listening input. Its maximum stretch includes the first checked response after input. Five careful cards plus that first response = 115 seconds. RULE 39 rejects missing cards, groups above six, missing/incorrect group retrieval, input over 120 seconds, and later checks placed before the full card sequence, across all three draws. Mutations merge groups, remove checks/cards, add a meta card and move practice early.

Order interpretation: the brief simultaneously says cards must precede dependent checks and scene words must stay where they were (after scene meaning). I retained the explicitly requested placement. Scene meaning is the teaching check on its immediately preceding hear model; the card-before-check guarantee applies to card retrieval and subsequent sound/read/practice/derived/dictation/proof checks. Pretest remains diagnostic. This is a scope interpretation, not a protected-test exception.

| L | Cards after (scene + remaining) | Groups | Retrieval checks | Max stretch after, seconds (scene / remaining) | Lesson estimate after, minutes |
|---|---|---|---:|---|---|
| 1 | 11 + 9 | 3 + 2 | 11 | 100 / 115 | 35–75 |
| 2 | 15 + 9 | 3 + 2 | 15 | 115 / 115 | 35–75 |
| 3 | 17 + 6 | 4 + 2 | 17 | 115 / 85 | 35–75 |
| 4 | 9 + 8 | 2 + 2 | 11 | 115 / 100 | 35–75 |
| 5 | 16 + 8 | 4 + 2 | 17 | 100 / 100 | 35–75 |
| 6 | 9 + 10 | 2 + 2 | 12 | 115 / 115 | 35–70 |
| 7 | 21 + 2 | 5 + 1 | 16 | 115 / 70 | 35–70 |
| 8 | 18 + 7 | 4 + 2 | 17 | 115 / 100 | 35–75 |
| 9 | 21 + 2 | 5 + 1 | 18 | 115 / 70 | 35–75 |
| 10 | 13 + 8 | 3 + 2 | 15 | 115 / 100 | 35–75 |
| 11 | 7 + 11 | 2 + 3 | 12 | 100 / 100 | 30–70 |
| 12 | 12 + 12 | 3 + 3 | 17 | 100 / 100 | 35–75 |

All 261 non-meta entries now receive cards (169 previously). Two headings receive taught sets; zero word cards missing. Before counts and after counts agree across the three seeded draws.

Part B gates: pool rebuilt; curriculum validator green (RULE 36/37/39 zero); guided quality/lesson/rollout/repair, taught-set, course-meta and protected engine suites green (7 files before added coverage; 5 focused files with new coverage); lint green after removing one unused test helper. Full end gates follow C. No protected tests were edited; existing unprotected flow tests now assert the two actual card stages and delivered non-meta coverage.

Notices remain unchanged. A later brief should split each rule/example cluster with checked retrieval and measure time to the next checked response; the existing 60–120-second body-only budget excludes examples. Longer reads and optional recap study retain the separate risks identified in review 24.

## Part C — helpful hints

Inventory below compares the original hint generator with the completed generator over every real hint-bearing render path in all three seeded draws. The original main-flow counts were captured before implementation; the audit also enumerates individual derived-match pairs (the first inventory did not expand those), proof tasks and the new word-retrieval checks. Original-generator counts for word-retrieval are a counterfactual for the new stage, not a claim that it existed before B. Read/sound are potential hints only: those components currently reveal the answer on the first miss. Sets, pretest, warm-up, requeue and A1.2 do not use this guided hint policy. Dictation and all four derived match pairs are included.

| Stage / item type / availability | Items, draws 1/2/3 | Original neutral hints, draws 1/2/3 | Neutral hints after, draws 1/2/3 |
|---|---|---|---|
| scene/multiple_choice/active | 58/58/58 | 58/58/58 | 0/0/0 |
| word-retrieval/multiple_choice/active | 114/114/114 | 114/114/114 | 0/0/0 |
| word-retrieval/listen_select/active | 64/64/64 | 0/1/0 | 0/0/0 |
| sound/multiple_choice/potential | 36/36/36 | 36/36/36 | 0/0/0 |
| read/multiple_choice/potential | 24/24/24 | 24/24/24 | 0/0/0 |
| practice/fill_blank/active | 64/54/56 | 4/3/5 | 0/0/0 |
| practice/multiple_choice/active | 1/3/4 | 1/3/4 | 0/0/0 |
| practice/error_correction/active | 7/13/7 | 0/0/0 | 0/0/0 |
| derived-match/multiple_choice/active | 48/48/48 | 48/48/48 | 0/0/0 |
| derived/word_order/active | 12/12/12 | 0/0/0 | 0/0/0 |
| derived/listen_select/active | 12/12/12 | 0/0/0 | 0/0/0 |
| dictation/dictation/active | 24/24/24 | 0/0/0 | 0/0/0 |
| proof/production/active | 3/3/3 | 0/0/0 | 0/0/0 |
| proof/listen_spelling/active | 1/1/1 | 0/0/0 | 0/0/0 |
| practice/sentence_building/active | 12/14/17 | 0/0/0 | 0/0/0 |

Across the complete A1.1 pool, original fallbacks: 14 multiple_choice and 24 fill_blank items. The latter fell through because the German generic hint itself contained accepted article/pronoun answers (especially “der” and “Sie”). After: zero across all 379 pool items, plus zero in all delivered/potential guided hints for all draws.

Each covered type now has substantive bilingual alternatives. Article tasks point to noun-card gender/number; pronoun tasks to the speaker/referent; verb tasks to subject/endings; time tasks to the taught clock model; spelling, word order, dictation, matching and listening retain their task-specific cues with useful collision-safe alternatives. No neutral candidates remain. The existing answer-leak filter and protected checks remain intact; RULE 40 applies the answer-free and non-neutral contract to all built hint paths as well as the existing RULE 33 pool check.

Scene hints derive original line numbers from chunk boundaries and offer replay controls for each source line with its original audio key. Replay controls appear only on the first-miss hint, without revealing the English explanation. The next result still reveals the complete exchange, and only the original response contributes evidence.

Part C focused gates: guided learning/repair and proof-content tests green (3 files); curriculum validator green, including RULE 33/36/37/39/40. All final gates below are green.

## Final gates and verification limits

- Pool generation, complete curriculum validator and shared-file sync: passed. RULE 36, RULE 37, RULE 39 and RULE 40 findings are zero. RULE 38 emits the two L1 authoring advisories listed above.
- Draft checker for L1–L12: passed without modifying or merging any draft content.
- Lint with zero warnings and byte-identical shared-file checks: passed.
- Full `npm test`: **309/309 test files passed**, zero failures (final source, 112.8 seconds). Focused final state/audio/outbox tests and the German-mode exchange-feedback regression are also green.
- Syntax check of every top-level Netlify function and shared `.mjs` module: passed.
- Clean SPA build, carved `app.html`, offline Astro build, merge, prerender and complete built-HTML check: passed. Astro built 143 pages; HTML checker checked 151 pages with zero failures and zero warnings, including 146 sitemap URLs. Built lesson regressions preserve both part pauses, the guest save-ask replacement and requeue immediately before recap.
- A1.2: all 36 built lesson/draw outputs are deep-identical to the original HEAD builder; its curriculum, pool, routes and dependencies are untouched. Translation run fields are emitted only for guided runs.
- Protected tests, draft JSON, CLAUDE.md and astro-site/package-lock.json remain unedited. No assertions were weakened. No commits, SQL, dependency installation or deployment.

The ordinary offline Astro command initially failed because Vite tried to remove its cache through the read-only `astro-site/node_modules` symlink. The successful build used a temporary config importing the unchanged normal Astro config and overriding only `vite.cacheDir` to `/tmp/brief6-astro-vite-cache`. That temporary workspace file was removed after verification. Dependencies and the lockfile were untouched. Each clean `dist/` was made by moving the previous generated output to a temporary backup, then building afresh; prerender was never applied twice to the same build.

The committed grammar cache is dated **2026-08-24**. The offline build explicitly reported “Using content cache”; these HTML checks verify that snapshot, not live grammar content. No content-cache refresh was claimed.

Browser screenshot/walkthrough verification could not run in this sandbox: a loopback static server failed with `listen EPERM`, and the installed Playwright/Chromium launch failed with a denied socket operation (`setsockopt`, SIGTRAP). No dependency was installed. The real JSX components were exercised with the repository's rendering harness, but there is no screenshot, played voice/microphone validation or measured beginner timing from this run.

Existing tests caught import ordering and required explicit listening playback/fallback callbacks; the implementation was adjusted to satisfy them without changing those assertions. The tests that changed are only the unprotected guided-flow suites: their expected order now contains both actual card steps, their card coverage checks exclude only explicit taught-set headings, and their JSX stubs load the shared pure builders. New regressions are in `tests/guided-learning-quality.test.mjs`.

Still for later work: the reported distractors and text-free answer routes need content review; notice stretches need embedded checks; longer reads and optional recap study need their own timing/retrieval work. The scene/card ordering interpretation is documented in Part B. No learner-outcome claim is made.

## Claude's check (2026-11-14)

Gates re-run by Claude on the final tree: pool build, validator, sync, draft checks, lint,
duplicates, `npm test` (3,050 of 3,050), SPA build. Protected tests, `CLAUDE.md` and
`astro-site/package-lock.json` unchanged.

Played as a guest in a phone-sized browser against the built site (Lektion 1):

- Scene 1 shows its English with a "Hide English" control per line (the first exchange keeps the
  English visible, as decided); the meaning check and the say step follow.
- The word-card step: a group of four cards, then "Recall the word cards": "What does 'Guten Tag'
  mean?" with four choices from the same group; a wrong answer gets the hint "Return to the word
  card and compare its meaning with the choices.", then a second try, then the answer; a
  hear-and-pick task follows. No page errors, no horizontal overflow.
- A guest opening Lektion 3 by link gets the locked screen, so later Lektionen were not played by
  hand in this round; their scenes (English hidden by default) are covered by the tests only.

Open:

- The hear-and-pick task inside "Recall the word cards" still carries the label "Step 4 · More
  practice 1/3" from the practice stage.
- The alphabet's listening checks, without a German voice, show the letter and then ask for it,
  which makes the check trivial on such a device.
- The distractor rule's findings are reported, not yet corrected in the questions.
- Notices still have no checked response.
