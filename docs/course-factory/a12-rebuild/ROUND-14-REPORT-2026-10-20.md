**A1.2 rebuild, round 14 — 2026-10-20**

B1 now requires an explicit German meaning selector; tense, adverbs and sentence contrast do not decide the key. M8 now audits answer features together with order, including every inverse. The delivered bank's worst score is **36/64**, down from **54/64**. Pure A/B order remains **32/64**. A1.2 remains a draft.

Verification gap: the requested default test command cannot spawn its workers on this Windows sandbox (`EPERM`). With `--experimental-test-isolation=none`, **195/196 tests pass**. The sole failure is the existing test that itself spawns the authoring-check subprocess. The identical authoring check passes when run directly. No assertion was removed, skipped or weakened, and no ratchet was raised.

All commands ran from `C:\Users\zaid1\deutschmeister-a12`; filesystem reads and script/test file arguments used absolute paths. `CLAUDE.md`, the A1.2 handoff, the round-13 report, and the complete review #13 were read. No network or database access, commit, push, checkout, or reset was performed. Branch: `claude/a12-rebuild`; HEAD: `e0a1d0e`.

**Files changed**

| File | Change |
|---|---|
| `src/data/lessonPools/a12.extra.json` | Explicit German selectors, matching English prompts and German explanations for the three lesson-11 time gaps. |
| `src/data/lessonPools/a12.explanationsEn.json` | Matching English explanations of the requested meanings. |
| `src/data/lessonPools/a12.json` | Rebuilt pool, still 295 items. |
| `src/data/curricula/a12.js` | Lesson 11 reserves `vor` through the existing `mustCover` mechanism, preserving practice in both attempts after the selector changes. |
| `astro-site/src/data/curricula/a12.js` | Synced curriculum twin. |
| `src/data/curricula/a12.lesen.js` | Reordered units within papers, reversed both option arrays of selected pairs, and documented the feature/order rule in the header. |
| `astro-site/src/data/curricula/a12.lesen.js` | Synced Lesen twin. |
| `tests/helpers/lesenGate.mjs` | Generic `auditBankFeatures`: feature/order combinations, all binary preference rules and inverses, explicit tie handling and worst-rule reporting. |
| `scripts/a12-lesen-check.mjs` | Enforces the new bank audit and prints its worst rules with `-v`. |
| `tests/a12-rebuild.test.mjs` | Stricter time-selector rule, corrected hand annotations, open/cued contrasts, choice-gap probe, selector-removal mutations, taught-vocabulary checks, delivered-bank audit, planted shortcuts and independent counterbalanced control. |
| `docs/course-factory/a12-rebuild/ROUND-14-REPORT-2026-10-20.md` | This report. |

The temporary local search, patch-generation and comparison scripts were removed. The pool builder regenerated `netlify/functions/_shared/ruleCards.mjs` without a content diff. The sync command copied its eight registered modules; A1.1 content remains byte-equivalent to HEAD. `tests/fixtures/a12-lesen-review.json` is unchanged.

**B1 — every changed item, old and new German**

| Item | Old `questionDe` | New `questionDe` |
|---|---|---|
| `extra-a12-l11-10` | Heute ist es kalt. ___ einer Woche war es warm. (vor oder seit?) | Heute ist es kalt. ___ einer Woche war es warm. (Zeit: eine Woche früher, keine Dauer; vor oder seit?) |
| `extra-a12-l11-11` | Der Regen ist ___ einer Woche da. (vor oder seit?) | Der Regen ist ___ einer Woche da. (Dauer bis heute; vor oder seit?) |
| `extra-a12-l11-12` | Das Gewitter war ___ einer Woche. (vor oder seit?) | Das Gewitter war ___ einer Woche. (Zeit: eine Woche früher, keine Dauer; vor oder seit?) |

| Item | Old `explanationDe` | New `explanationDe` |
|---|---|---|
| `extra-a12-l11-10` | vor + Zeit: eine Woche früher. Vor einer Woche war es warm. | Gefragt ist eine Woche früher, keine Dauer: vor einer Woche. |
| `extra-a12-l11-11` | seit: von damals bis jetzt. Der Regen ist seit einer Woche da. | Gefragt ist die Dauer bis heute: seit einer Woche. |
| `extra-a12-l11-12` | Das Gewitter ist vorbei: vor einer Woche. | Gefragt ist eine Woche früher, keine Dauer: vor einer Woche. |

Keys and accepted answer lists are unchanged. The English prompts retain their translations and now state the same explicit selectors; both explanation languages explain the requested point or duration.

The validator rejected `Zeitpunkt` and `Vergangenheit` as untaught at lesson 11. It accepts the actual selector wording without untaught tokens or a later construction horizon. All three rebuilt items remain servable at **L11**.

The pool-wide scan found six current temporal contrast gaps. The other three already have explicit German selectors: `Ende`, `Montag ist der erste Tag`, and `erste Uhrzeit zum Einsteigen`. They need no content change. The test scans all servable gaps, including choice gaps, without an item-id exemption list. It covers ab/bis, vor/seit, um/gegen, von/bis and further temporal contrasts. New weather and illness examples must fail with a single key and no selector; open examples accepting both readings pass. Cued examples distinguish the requested key from its rival. Removing the selector from **each of the six current temporal gaps** fails while the sentence, English and explanations remain.

Before the content edits, the stricter test failed on exactly the three lesson-11 gaps. This rejects the round-13 hypothesis that past tense, a present-state sentence or contrast supplies the missing selector.

The first full test run also exposed a practice regression introduced by the new wording: both `vor` items entered lesson-11 attempt 1, so attempt 2 contained neither. An in-memory comparison with only the new selectors removed restored the old split. Both items still had `minLektion: 11` and unchanged keys, rejecting vocabulary exclusion and changed-answer hypotheses. Reserving the existing `vor` answer key with `mustCover` fixes the coverage dependency; the existing M7 test and all its deletion mutations pass unchanged. Determinacy now visits 400 distinct served items rather than 401 because the practice selection changed; the pool still has 295 items.

**M8 — rule, allowed moves and before/after evidence**

The audit obtains the existing gate's base feature strategies and adds German alphabetical collation, identical-option-set membership within the mirrored pair, and pair role. It freezes visible picks and order history before reading keys to score them.

For every feature it exhaustively enumerates the binary preference assignment in every context cell: paper position, question type × occurrence rank, first/second mirrored-pair member, and identical-option-set occurrence. It also covers the review's visible text-form × position family. Pair role identifies the first introduced pair versus the second; pair-member rank follows delivery order. Delivered items work without authoring IDs or pair metadata. Every rule's inverse is present. Ties score ½, and fixed A/B tie-breaking is audited too.

The final 64-unit bank has **55,944 rules**. Its limit is the requested **36/64**; independent smaller controls use the same proportion. The old per-paper limits and exact position/type-rank balance retain their stricter limits.

| Rule/family | Before | After |
|---|---:|---:|
| Review's exact alphabet-first/second-of-question-type rule | 54/64 | 28/64 |
| Inverse of that exact rule | 10/64 | 36/64 |
| Review's exact alphabet-first/second-of-identical-option-set rule | 50/64 | 28/64 |
| Inverse of that exact rule | 14/64 | 36/64 |
| Best alphabet × type-rank rule | 54/64 | 36/64 |
| Best alphabet × identical-option-set occurrence rule | 50/64 | 36/64 |
| Best alphabet × position rule | 44/64 | 36/64 |
| Best character-length × position rule, ties ½ | 38/64 | 33/64 |
| Best word-length × position rule, ties ½ | 33/64 | 33/64 |
| Best numeric-value rule across order contexts, ties ½ | 35/64 | 34/64 |
| Best first-mention rule across order contexts, ties ½ | 49/64 | 35/64 |
| Best last-mention rule across order contexts, ties ½ | 49/64 | 35/64 |
| Best identical-option-set-within-pair × order rule | 45/64 | 36/64 |
| Best pair-role × order rule | 41/64 | 36/64 |
| Best A/B × visible-text-form × position rule | 41/64 | 33/64 |
| Worst of **all** rules, including fixed tie-breaks | **54/64** | **36/64** |
| All 16 pure A/B position sequences | 32/64 each | 32/64 each |
| All 16 pure A/B type-rank rules | 32/64 each | 32/64 each |

Before/after measurements use the same new auditor, with the original bank read from HEAD and the final bank imported from the working tree. The original bank fails 9,465 enumerated rules; the final bank fails zero.

A field-by-field comparison against HEAD observed:

```text
Allowed moves: 64/64 units preserve every semantic field and option set; 16/16 papers reordered; 13/32 pairs reversed BOTH option arrays.
BEFORE: 55944 rules; worst 54/64; 9465 findings; pure order passes=true
AFTER: 55944 rules; worst 36/64; 0 findings; pure order passes=true
```

Every unit stays in its original paper. No text, question, key, evidence, rival or explanation changes. The unchanged semantic fixture passes. Incorrect keys and broken pure A/B balance are rejected as causes: the semantic checks pass, and the original bank already passed the pure-order audit. The missing feature/order combination was the cause.

The planted alphabetical rank code still passes the old per-paper and A/B-order gates, scores **64/64**, and fails the new audit. Aligning every mirrored pair also produces **64/64** and fails. An independent control counterbalances pair-member swaps and paired option reversals across 16 papers; all its feature/order rules score **32/64**.

**Commands and exact result lines**

Commands below use repository-relative spelling for readability; execution used the absolute paths under the root stated above. `npm_config_offline=true` was set for npm/npx. Exit labels shown below were emitted by the command wrappers. Long diagnostic listings are omitted; pass/fail and summary lines are reproduced.

`node scripts/build-lesson-pool.mjs a1.2`, then `node scripts/validate-curriculum.mjs a1.2`:

```text
corrections: 16 item(s) corrected, 0 bank English text(s) kept over the sidecar
explanationEn: 143 from the bank, 152 from the sidecar, 0 from the templates, 0 missing
a1.2: 287 in cache → 141 kept (96 more dropped as untaught-lexis) + 0 generated + 154 hand-authored = 295
BUILD_EXIT=0
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 206 (Ratchet 0)
  RULE 11 Item-Lexik (ganzer Pool, informativ): 26 ungelehrte Tokens (Ratchet 26)
  RULE 11b gezogene Item-Lexik: 0 ungelehrte Tokens (Ratchet 0)
  RULE 12 Kann-Beschreibungen ohne Übung: 0 (harte Regel, kein Ratchet)
  RULE 13 Sprechaufträge ohne Mission: 1 (Ratchet 1) — L11
  RULE 6b Notice-Formen ohne Beleg: 0 (Ratchet 0)
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 0 (Ratchet 0)
  RULE 15b aufgeschobene Konstruktionen in Produktionstexten: 0 (Ratchet 0)
  RULE 16 ungedeckte Prüfungsteile: 0 (Ratchet 0)
  RULE 17 Mustertexte, die ihre eigene Checkliste reißen: 0 (harte Regel, kein Ratchet)
  RULE 18 Lektionen, die Diktat und Vorlesen auf dieselbe Zeile legen: 0 (Ratchet 0)
  RULE 19 Mustertexte gegen den eigenen Dialog: 0 (harte Regel, kein Ratchet)
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (harte Regel, kein Ratchet)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (harte Regel, kein Ratchet)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 4 von 206 (Ratchet 4)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (harte Regel, kein Ratchet)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 295
  RULE 14 Figuren-Widersprüche: 0 (Ratchet 0)
VALIDATOR_EXIT=0
```

`node scripts/sync-curricula.mjs`:

```text
Synced 8 file(s) from src/data/curricula/ to astro-site/src/data/curricula/.
SYNC_EXIT=0
```

`node scripts/a12-lesen-check.mjs -v` — exit 0:

```text
a1.2-cp1: worst strategy over the bank Zahl+ 8/16
a1.2-cp2: worst strategy over the bank Zahl+ 8/16
a1.2-cp3: worst strategy over the bank Zahl+ 8/16
a1.2-cp4: worst strategy over the bank Zahl+ 8/16
Bank positions (A/B): 1=8/8, 2=8/8, 3=8/8, 4=8/8
Bank type-rank (A/B): Wer 1=8/8, Wer 2=8/8, W 1=8/8, W 2=8/8
Bank worst fixed sequence: AAAA 32/64; worst type-rank rule: AAAA 32/64
Bank feature × order: 55944 rules, limit 36/64
Bank worst feature rule: Länge Zeichen+ (tie→B) × position [1:inverse, 2:feature, 3:feature, 4:inverse] 36/64
Bank worst feature rule: Länge Zeichen+ (tie→B) × type-rank [W 1:inverse, W 2:feature, Wer 1:feature, Wer 2:inverse] 36/64
Bank worst feature rule: Alphabet+ × position [1:feature, 2:inverse, 3:feature, 4:inverse] 36/64
Bank worst feature rule: Alphabet+ × type-rank [W 1:feature, W 2:feature, Wer 1:inverse, Wer 2:feature] 36/64
Bank worst feature rule: Alphabet+ × pair member [1:inverse, 2:feature] 36/64
Bank worst feature rule: Alphabet+ × option-set occurrence [1:inverse, 2:feature] 36/64
OK: no findings
LESEN_EXIT=0
```

`node scripts/a12-determinacy.mjs a1.2`:

```text
a1.2: 400 served items, 0 correct alternatives rejected
DETERMINACY_EXIT=0
```

`npm run check:duplicates`:

```text
OK: src/data/competitorComparisons.js === astro-site/src/data/competitorComparisons.js
OK: src/data/pricing.js === astro-site/src/data/pricing.js
OK: src/data/marketing.js === astro-site/src/data/marketing.js
OK: src/data/design-tokens.js === astro-site/src/data/design-tokens.js
OK: src/data/organization.js === astro-site/src/data/organization.js
OK: src/data/navigation.js === astro-site/src/data/navigation.js
OK: src/data/examTracks.js === astro-site/src/data/examTracks.js
OK: src/data/events.js === astro-site/src/data/events.js
OK: src/data/courseContents.js === astro-site/src/data/courseContents.js
OK: src/data/offers.js === astro-site/src/data/offers.js
OK: src/data/writingTasks.js === netlify/functions/_shared/writingTasks.mjs
OK: src/lib/lesson/readaloud.js === netlify/functions/_shared/readaloud.mjs
OK: src/data/curricula/a11.js === astro-site/src/data/curricula/a11.js
OK: src/data/curricula/a12.js === astro-site/src/data/curricula/a12.js
OK: src/data/curricula/a12.lesen.js === astro-site/src/data/curricula/a12.lesen.js
OK: src/data/curricula/a11.audio.js === astro-site/src/data/curricula/a11.audio.js
OK: src/data/curricula/index.js === astro-site/src/data/curricula/index.js
OK: src/data/curricula/constructions.js === astro-site/src/data/curricula/constructions.js
DUPLICATES_EXIT=0
```

`node --test tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/lesson-extra-items-a12.test.mjs tests/lesson-extra-items.test.mjs`:

```text
ℹ tests 5
ℹ suites 0
ℹ pass 0
ℹ fail 5
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
  Error: spawn EPERM
    code: 'EPERM',
TEST_EXIT=1
```

All five failures are worker-spawn failures; the tests themselves did not start.

`node --test --experimental-test-isolation=none tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/lesson-extra-items-a12.test.mjs tests/lesson-extra-items.test.mjs`:

```text
ℹ tests 196
ℹ suites 0
ℹ pass 195
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
✖ failing tests:
✖ DaF review #11 M8 (round 12): A1.2 reads authored units — four disjoint papers per checkpoint, served by round, checked by the authoring check (13.3187ms)
  AssertionError [ERR_ASSERTION]: scripts/a12-lesen-check.mjs:
  null !== 0
TEST_EXIT=1
```

Direct diagnostic of that subprocess failure:

```text
{"status":null,"error":"EPERM","message":"spawnSync C:\\Program Files\\nodejs\\node.exe EPERM"}
```

This is the same isolated sandbox limitation recorded in round 13. The direct authoring-check command above succeeds. The test assertion remains unchanged.

`node --test --experimental-test-isolation=none --test-name-pattern='DaF review #13' tests/a12-rebuild.test.mjs`:

```text
✔ DaF review #13 B1: every single-key time-preposition gap has an explicit German meaning selector, with open/cued contrasts (201.008ms)
✔ DaF review #13 M8: every delivered surface feature × order rule and its inverse score at most 36/64 (8354.0232ms)
✔ DaF review #13 M8: alphabetical type-rank and aligned-pair mutations fail, even with unchanged semantic content (5914.3894ms)
✔ DaF review #13 M8: an independent counterbalanced bank passes the generic feature × order audit (752.4289ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
REGRESSION_TEST_EXIT=0
```

Supplemental checks required by the repository handoff:

`node --test --experimental-test-isolation=none tests/curricula.test.mjs tests/rule-card-overrides.test.mjs`:

```text
ℹ tests 117
ℹ suites 0
ℹ pass 117
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 703863.1076
SUPPLEMENTAL_TEST_EXIT=0
```

`npx eslint --max-warnings 0 --no-ignore` on all seven changed JavaScript files:

```text
src/data/curricula/a12.js
astro-site/src/data/curricula/a12.js
src/data/curricula/a12.lesen.js
astro-site/src/data/curricula/a12.lesen.js
scripts/a12-lesen-check.mjs
tests/helpers/lesenGate.mjs
tests/a12-rebuild.test.mjs
```

ESLint printed no diagnostics:

```text
ESLINT_EXIT=0
```

`--no-ignore` includes the Astro mirrors. JSON is parsed by the pool builder and tests.

Final read-only repository checks:

```text
DIFF_CHECK_EXIT=0
PROTECTED_DIFF_EXIT=0
claude/a12-rebuild
e0a1d0e
```

`git diff --check` found no whitespace errors. The protected diff covers source and Astro A1.1 curriculum files, all A1.1 pool files, and the unchanged Lesen fixture. Git emitted only its LF→CRLF working-copy notices. Final status contains exactly the eleven files listed above.

**Intermediate failures and resolution**

- The new B1 test initially reported `ℹ tests 1`, `ℹ pass 0`, `ℹ fail 1`, naming exactly l11-10, l11-11 and l11-12. After the selectors were added, it passed.
- The new M8 tests initially reported `ℹ tests 4`, `ℹ pass 3`, `ℹ fail 1`; the delivered bank failed at 54/64 while both mutations and the control behaved as required. Rebalancing resolved it.
- The first full no-isolation run reported `ℹ tests 196`, `ℹ pass 194`, `ℹ fail 2`. Besides the known subprocess failure, M7 reported `vor + Zeitangabe: L11 attempt 2 does not practise it`. The `mustCover` fix resolved it; the final run has only the environment failure.
- An initial comparison pipe converted German quotation marks to `?` through PowerShell's default output encoding. Re-running the same comparison with UTF-8 output encoding passed all 64 exact semantic comparisons; no authored strings were changed to accommodate the diagnostic.
- One exploratory PowerShell here-string had a missing terminator; the corrected vocabulary probe ran successfully. Context-mode tool discovery was unavailable, so local commands were used with bounded output. An early read-only batch was terminated and re-run directly.
- A process-status query while waiting for the supplemental curriculum suite was denied by Windows (`Get-CimInstance : Access denied`); no permission escalation or process mutation was attempted.

The external fablize scripts/packs were not accessed because this round explicitly restricted work to this repository. The exit proof used here is the reproductions, general rules, mutation/control tests, exact-content comparison, and requested local checks documented above.
