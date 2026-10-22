**A1.2 rebuild, round 13 — 2026-10-20**

B1 and M8 are fixed with class rules and mutation tests. Full green verification is blocked by Windows `spawn EPERM`: the exact test command cannot start its five file workers; the supplemental no-isolation run passes 192 of 193 tests, with only the existing subprocess-based authoring-check test failing. The authoring check itself passes when invoked directly.

Changed files:

- `src/data/lessonPools/a12.extra.json` — German cue “erste Uhrzeit zum Einsteigen”, English twin, German explanation.
- `src/data/lessonPools/a12.explanationsEn.json` — matching boarding-start explanation.
- `src/data/lessonPools/a12.json` — rebuilt pool.
- `src/data/curricula/a12.lesen.js` — paired option-array reversals and the bank-balance rule in the header.
- `astro-site/src/data/curricula/a12.lesen.js` — synced copy.
- `tests/helpers/lesenGate.mjs` — position and question-type/history strategies, all 16 rules in each family including inverses.
- `scripts/a12-lesen-check.mjs` — bank-level enforcement and score reporting.
- `tests/a12-rebuild.test.mjs` — corrected annotation, German-cue class test and cue-removal mutation; delivered-bank test, aligned-pair mutation, independent counterbalanced control.
- `docs/course-factory/a12-rebuild/ROUND-13-REPORT-2026-10-20.md` — this report.

The cue uses words already known by lesson 9. Every servable single-key time-preposition gap is checked in German alone. Removing the boarding cue fails even while its English twin and explanations retain it. The new regressions failed on the original pool/bank before the fixes.

Only both option arrays of selected mirrored pairs were reversed; no Lesen unit order, text, question, answer, evidence, rival, or explanation changed. A1.1 content and the blind-review fixture are unchanged. Existing assertions and ratchets remain intact. HEAD remains `fdfc1e1`.

Before: AABB 48/64, ABAB 46/64, first/second-of-type 62/64. After: every position and each of Wer-first, Wer-second, other-W-first, other-W-second is 8 A / 8 B. All 16 fixed sequences (including AABB, ABAB and ABBA) and all 16 type-rank rules score exactly 32/64. Every existing per-paper ceiling remains ≤ 2/4. Aligning each mirrored pair to key-A-first passes the old per-paper gates but fails the new bank gate at 64/64 for the type-rank rule.

Incorrect Lesen keys and broken per-paper balance were rejected as causes: the unchanged blind-review assertions and old gates pass. The causes were the missing German selector and an audit without position/history inputs.

Verification was run from `C:\Users\zaid1\deutschmeister-a12`, offline. Exact summary/output lines follow; commands without aggregate pass/fail counts are marked by their exit status.

`node scripts/build-lesson-pool.mjs a1.2` — exit 0.

```text
corrections: 16 item(s) corrected, 0 bank English text(s) kept over the sidecar
explanationEn: 143 from the bank, 152 from the sidecar, 0 from the templates, 0 missing
a1.2: 287 in cache → 141 kept (96 more dropped as untaught-lexis) + 0 generated + 154 hand-authored = 295
```

`node scripts/validate-curriculum.mjs` — exit 0.

```text
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
```

This command defaults to A1.1; A1.2 was also checked explicitly:

`node scripts/validate-curriculum.mjs a1.2` — exit 0.

```text
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
```

`node scripts/sync-curricula.mjs` — exit 0.

```text
Synced 8 file(s) from src/data/curricula/ to astro-site/src/data/curricula/.
```

`node scripts/a12-lesen-check.mjs -v` — exit 0.

```text
Bank positions (A/B): 1=8/8, 2=8/8, 3=8/8, 4=8/8
Bank type-rank (A/B): Wer 1=8/8, Wer 2=8/8, W 1=8/8, W 2=8/8
Bank worst fixed sequence: AAAA 32/64; worst type-rank rule: AAAA 32/64
OK: no findings
```

`node scripts/a12-determinacy.mjs a1.2` — exit 0.

```text
a1.2: 401 served items, 0 correct alternatives rejected
```

`npm run check:duplicates` — exit 0.

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
```

Duplicate check: 18 `OK` lines, no `DRIFT` lines; the script prints no aggregate count.

`node --test tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/lesson-extra-items-a12.test.mjs tests/lesson-extra-items.test.mjs` — exit 1.

```text
ℹ tests 5
ℹ suites 0
ℹ pass 0
ℹ fail 5
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

All five failures are file-worker `Error: spawn EPERM`; individual tests did not start.

`node --test --experimental-test-isolation=none tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/lesson-extra-items-a12.test.mjs tests/lesson-extra-items.test.mjs` — exit 1.

```text
ℹ tests 193
ℹ suites 0
ℹ pass 192
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The sole failure is “DaF review #11 M8 (round 12): A1.2 reads authored units … checked by the authoring check”, whose `spawnSync` returns `status: null`. Direct diagnostic:

```text
{"status":null,"error":"EPERM","message":"spawnSync C:\\Program Files\\nodejs\\node.exe EPERM"}
```

`node --test --experimental-test-isolation=none --test-name-pattern='DaF review #(7 BLOCKER 1|12)' C:\Users\zaid1\deutschmeister-a12\tests\a12-rebuild.test.mjs` — exit 0.

```text
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

These four tests cover the existing German-vocabulary assertion and all three new class regressions.

`npx eslint --max-warnings 0 --no-ignore --no-warn-ignored <changed files>` — exit 0.

No output.

ESLint was given every changed code/data file, including the Astro mirror. `--no-ignore` includes that mirror. JSON and Markdown have no matching ESLint configuration; `--no-warn-ignored` suppresses only those unsupported-file notices. The JSON files were parsed by the pool build and tests. npm was forced offline.

`git diff --check` and the protected A1.1/fixture diff checks exited 0 with no output. The source Lesen diff inspection printed:

```text
Lesen diff: 141 option/header lines; no other authored fields changed.
```

