# A1.2 round 15 — ihr repaired; M8 accepted as a measured ratchet

**Owner option A is implemented.** The ihr-imperative repair is retained unchanged. The pair-feature audit measures **46/64** and **10/16 whole papers**, pinned by one equality ratchet; it no longer adds findings. The Lesen command prints **OK: no findings**. The review's particular rule remains **42/64 and 7/16**; seven is not the maximum over the full pair family. A1.2 remains a draft, with accepted limitations recorded in the handoff.

## Owner decision and resolution

On **2026-10-20**, the owner chose option A: keep the ihr repair and accept the mirrored-pair M8
residue as a measured ratchet. The exhaustive **1,536-variant** proof remains: four fixed rules
partition all 16 papers, forcing a floor of **4/16**, so a cap of three is impossible. Removing
that structural limitation requires a reading bank without mirrored pairs and a fresh audit.

The full pair audit still reports both maxima and their witnesses. One delivered-bank test pins
**46/64 and 10/16**, with the message **“lower the ratchet in the same commit, never raise it”**.
The mutation test now measures exactly **42/64 and seven whole papers**; its partial hits are
balanced so no other rule in that synthetic family outperforms the planted rule. The independent
control and feasibility proof remain. All earlier assertions and gates are unchanged: per-paper
limits, pure A/B position and type-rank **32/64**, and single feature × order **36/64**.

The handoff now lists M8 and review #14's open minors in plain English. Windows blocks Node's
child-process pipes (`EPERM`), but inherited output works; the existing authoring-check test now
inherits output and keeps its exit-status assertion. The requested suite uses the authorized
`--experimental-test-isolation=none` fallback. Final verification is recorded below; earlier
failures are retained explicitly as the pre-decision history.

Work ran in `C:\Users\zaid1\deutschmeister-a12`, branch `claude/a12-rebuild`, HEAD `5837f9a`. Direct file reads used absolute paths or absolute file URLs. CLAUDE.md was read first, followed by the full review #14, the round-14 report and relevant A1.2 handoff guidance. No network, database, commit, push, checkout or reset was used. npm/npx ran with `npm_config_offline=true`. External fablize scripts/packs were not accessed because this task restricted work to this repository. Context-mode execution tools were unavailable.

## Why the original M8 cap was infeasible

Take precisely the review's visible rule R:

- Count Wer questions and other W-questions independently, first/second occurrence.
- Equal character lengths: choose alphabetically earlier on the first occurrence, later on the second.
- Unequal character lengths: choose later on the first occurrence, earlier on the second.

Now form four rules: R; R with just the Wer choices inverted; R with just the other-W choices inverted; R with both inverted. All four genuinely use the two requested features and question-type occurrence. They use no IDs, answers, text or pair metadata to choose.

| Fixed rule | Whole papers currently solved |
|---|---:|
| R | 7 |
| Invert Wer only | 3 |
| Invert other W only | 4 |
| Invert both | 2 |
| Sum | **16** |

**Every allowed variant of every paper is solved by exactly one of these same four rules.** The test enumerates all 24 unit permutations and all four independent paired option reversals for each of the 16 papers. Swapping a pair's members is already included among those permutations. Within a question type the review rule gets either both answers right or both wrong; reversing its preference for that type exchanges these outcomes. Paired option reversals preserve the selected answer values. Reordering other question types cannot change a type's occurrence count.

Therefore these four whole-paper counts always sum to 16. If each were at most three, their sum would be at most 12: a contradiction. At least one must solve **ceil(16/4) = 4** papers. This is an exhaustive invariant plus a counting proof, not an unsuccessful optimizer treated as proof.

There is also a simpler corroboration: all 32 question-type groups coincide with the authored pairs and have opposite A/B keys. The only resulting type-rank answer sequences are ABAB, ABBA, BAAB and BABA. Their current whole-paper counts are 5, 3, 3 and 5. The nonconstant four-rule proof above avoids depending on whether constant-A/B strategies count as answer features.

**A lower bound of four does not prove that changing the cap to four would make the full family feasible.** Before the owner decision, this blocked M8. The existing round-13 positive control also failed the proposed cap: it contains each of four answer sequences four times. Its assertion and construction remain intact; removing the pair family from the gate restores that control. The owner chose a measured ratchet, not a replacement cap of four.

## Every changed file

| File | Change |
|---|---|
| `scripts/imperative-variants.mjs` | New generic requested-person and task-mode expansion for optional emphatic du/ihr; existing pronouns, formal Sie and explicit restrictions are respected. |
| `scripts/build-lesson-pool.mjs` | Uses the generic expansion after word-order expansion; keeps ihr out of the optional du `-e` rule, including Seid. |
| `scripts/a12-determinacy.mjs` | Independently probes ihr, excludes ihr from du alternatives, and visits A1.2 checkpoint rounds 0–3. A1.1's three-round harness scope stays unchanged. |
| `src/data/curricula/a12.js` | Corrected L8 notice, German and English. |
| `astro-site/src/data/curricula/a12.js` | Identical corrected notice in the curriculum twin. |
| `src/data/lessonPools/a12.corrections.json` | German and English explanation corrections for the two bank rows saying “ohne ihr.” No per-ID accepted-answer fix. |
| `src/data/lessonPools/a12.json` | Rebuilt pool: exactly three ihr items change; still 295 items. |
| `tests/helpers/lesenGate.mjs` | Adds all feature pairs × the three requested order contexts, including inverses and explicit tie states, measuring maximum score and whole-paper coverage without adding findings. Earlier gates remain. |
| `scripts/a12-lesen-check.mjs` | Reports pair-family count and worst score/whole-paper witnesses as a measured ratchet; prints OK when the unchanged gates pass. |
| `tests/a12-rebuild.test.mjs` | Adds ihr coverage and person/mode matrix, one 46/64 + 10/16 equality ratchet, exact 42/64 mutation measurement, balanced control and exhaustive feasibility proof. All pre-existing assertions remain; the authoring subprocess inherits output to avoid Windows pipe EPERM. |
| `docs/course-factory/a12-rebuild/HANDOFF-2026-10-16.md` | Adds “Known issues at ship”: accepted M8 residue and review-14 minors. |
| `docs/course-factory/a12-rebuild/ROUND-15-REPORT-2026-10-20.md` | This report, owner resolution and final verification evidence. |

Temporary local probe/search scripts were removed. The authorized builder regenerated `netlify/functions/_shared/ruleCards.mjs` without a content diff. **Both Lesen source/twin files, the semantic fixture, both curriculum registries and all protected A1.1 files are unchanged.** No bank reordering was applied after the impossibility was established. A1.2 remains a draft.

## ihr-imperative: every changed item and notice, old/new German

The unchanged prompts and keys are included to identify exactly what the learner sees. The change is generated by a rule, not by an ID allowlist.

| Item | German prompt (unchanged) | Old accepted German | New accepted German added |
|---|---|---|---|
| `d12bc530-e164-55ab-a6be-8a5e51cb4a39` | `___ pünktlich! (kommen, ihr)` | `Kommt`, `kommt` | `Kommt ihr`, `kommt ihr` |
| `f957e0b7-85cd-56c6-b645-14be566d80f7` | `Schreiben Sie die Bitte: [ihr / pünktlich / kommen]` | Key `Kommt pünktlich!`; accepted `Kommt pünktlich`, `Kommt pünktlich.` | `Kommt ihr pünktlich!`, `Kommt ihr pünktlich`, `Kommt ihr pünktlich.` |
| `ce9fc6ec-6de9-5ebd-bd84-33f6023d21dc` | `___ bitte pünktlich! (sein, ihr)` | `Seid`, `seid` | `Seid ihr`, `seid ihr` |

For **each of the first two items**, `explanationDe` changes from:

> ihr-Imperativ = normale ihr-Form ohne ihr.

to:

> ihr-Imperativ: Kommt! Normalerweise ohne Pronomen; zur Betonung möglich: Kommt ihr!

Their English twin changes from `ihr-imperative = normal ihr-form without ihr.` to `The ihr-imperative: Kommt! Normally without a pronoun; possible for emphasis: Kommt ihr!`

The Seid item's explanation is unchanged: `sein ist unregelmäßig: der ihr-Imperativ heißt Seid!` Its English twin is unchanged: `sein is irregular: the ihr-imperative is Seid!` The Nehmt multiple-choice item is unchanged because the learner chooses from printed options.

**L8 notice, in both source and Astro twin — old German:**

> Der Imperativ steht vorn. Bei **du** fallen Pronomen und Endung -st weg: du komm**st** → **Komm!**, du hilf**st** → **Hilf!** Aus ä wird a: du fähr**st** → **Fahr!** Endet der Stamm auf s, fällt nur -t weg: du iss**t** → **Iss!** Bei ihr fällt nur das ihr weg: **Kommt!** Bei Sie bleibt das Pronomen: Helfen Sie **bitte**!

**New German:**

> Imperativ vorn: **du** ohne -st: du komm**st** → **Komm!**, du hilf**st** → **Hilf!** Aus ä wird a: du fähr**st** → **Fahr!** Endet der Stamm auf s, fällt nur -t weg: du iss**t** → **Iss!** Bei ihr fällt nur das ihr weg: **Kommt!** Beide normalerweise ohne Pronomen; zur Betonung möglich. Bei Sie bleibt das Pronomen: Helfen Sie **bitte**!

The existing assertion pins “Bei ihr fällt nur das ihr weg”; it was not changed. The immediately following qualification explicitly applies to **both** du and ihr. The notice was shortened while retaining all the tested formation rules, bold forms and unchanged dialogue examples.

**New English twin:**

> The imperative comes first: **du** without -st: du kommst → **Komm!**, du hilfst → **Hilf!** An ä becomes a: du fährst → **Fahr!** If the stem ends in s, drop only -t: du isst → **Iss!** With ihr only the pronoun is dropped: **Kommt!** Both normally omit the pronoun; it is possible for emphasis. With Sie the pronoun stays: Helfen Sie **bitte**!

The expansion uses the requested person, recognizes open sentence/correction and imperative-gap modes, and runs after the existing bitte/middle-field expansions. It expands in both directions from a bare or emphatic key, avoids duplicate pronouns and vocatives, and leaves Sie obligatory. Explicit “ohne Pronomen,” single-word/verb-only constraints and already-printed pronouns block insertion. A plural Seid sentence cannot inherit Seide or Seid du from the old singular heuristics.

The tests cover every servable ihr item and every served checkpoint round, 18 annotated du/ihr/Sie × holen/sein × sentence/correction/gap cases, incorrect persons/forms, existing pronouns, a pronoun restriction, bitte first, a vocative, an imperative gap without an exclamation mark, and the novel **Holt ihr den Brief!** probe. Before rebuilding, the all-servable test failed on `Kommt ihr`; afterwards it passes. The harness now observes 480 served items, including round 3, with no correct alternative rejected.

## M8 audit and worst bank rules before/after

The implementation retains the 55,944 existing single-feature/order rules. For **all 63 known features**, every unordered pair is combined with each of paper position, question type × occurrence rank, and option-set occurrence: **5,859 families**. Within a pair, all truth tables over the joint A/B/tie states are covered, then every order-context feature/inverse assignment is covered. The bank has **2,334,816 such assignments** (including equivalent rules).

Visible inputs are frozen before scoring. For each order mask, summing the best choice in each joint-state cell computes the exact maximum over every truth table. All inverses are included. Ties are explicit `T` states; half-credit tie policies are averages of their binary resolutions, so cannot exceed the maximum score or create another perfect paper. Maximum whole-paper coverage is computed separately by exact compatibility search over the papers' required cell choices; it is not inferred from the highest total score.

| Rule/family, measured with the same enhanced audit | Before | After |
|---|---:|---:|
| Review's exact alphabet × equal/unequal length × type-rank rule | 42/64; 7 whole papers | 42/64; 7 whole papers |
| Inverse of that exact rule | 22/64; 2 whole papers | 22/64; 2 whole papers |
| Best existing single-feature/order rule | 36/64 | 36/64 |
| Best score across all new pair families | 46/64 | 46/64 |
| Maximum whole papers across all new pair families | 10/16 | 10/16 |
| Pure A/B position and type-rank rules | 32/64 each | 32/64 each |

Before and after are identical because the bank itself is unchanged. The worst score and whole-paper witnesses belong to `Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank`; their exact choice tables are emitted by the authoring command below. These two maxima need not use the same truth table. Against the original proposed limits, 2,133 families exceeded the score limit and all 5,859 exceeded the whole-paper limit. Those pair-family limits are no longer gates.

The mutation independently plants the review rule at exactly **42/64 and seven whole papers**, and the audit detects those exact measurements. A synthetic control with all 16 independent four-answer patterns measures a maximum score of **32/64** and exactly **one** possible whole paper in every family. That control tests the auditor without imposing the bank's incompatible pair-complement restriction; it does not certify the delivered bank. The old mirrored-pair control and its assertion remain unchanged and pass the restored gates.

## Initial commands and exact pass/fail lines — before the owner decision

Commands below are spelled relative to the repo for readability; execution used absolute script/test paths from the repo root. Wrapper exit labels were printed explicitly. Diagnostic lists are shortened, not their results. Normalized line wrapping is used for the long PowerShell output lines.

`node scripts/build-lesson-pool.mjs a1.2`, followed by `node scripts/validate-curriculum.mjs a1.2`:

```text
corrections: 18 item(s) corrected, 0 bank English text(s) kept over the sidecar
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
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (Ratchet 0)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (harte Regel, kein Ratchet)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 4 von 206 (Ratchet 4)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (harte Regel, kein Ratchet)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 295
  RULE 14 Figuren-Widersprüche: 0 (Ratchet 0)
VALIDATOR_EXIT=0
```

`node scripts/a12-lesen-check.mjs -v` — **fails; no OK claimed**:

```text
Bank positions (A/B): 1=8/8, 2=8/8, 3=8/8, 4=8/8
Bank type-rank (A/B): Wer 1=8/8, Wer 2=8/8, W 1=8/8, W 2=8/8
Bank worst fixed sequence: AAAA 32/64; worst type-rank rule: AAAA 32/64
Bank feature × order: 55944 rules, limit 36/64
Bank worst feature rule: Länge Zeichen+ (tie→B) × position [1:inverse, 2:feature, 3:feature, 4:inverse] 36/64
Bank feature pairs × order: 5859 families, score limit 36/64, whole-paper limit 3/16
Bank worst feature-pair rule: Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank 46/64; 1/1:B, T/T:A, T/0:B, T/1:B, 1/0:A, 0/1:A, 1/T:A, 0/T:B, 0/0:B; W 1:inverse, W 2:feature, Wer 1:inverse, Wer 2:feature
Bank most whole papers: Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank 10/16; 1/1:B, T/T:A, T/0:B, T/1:B, 1/0:A, 0/1:A, 1/T:B, 0/T:B, 0/0:B; W 1:inverse, W 2:feature, Wer 1:inverse, Wer 2:feature
5859 finding(s)
LESEN_EXIT=1
```

`node scripts/a12-determinacy.mjs a1.2`:

```text
a1.2: 480 served items, 0 correct alternatives rejected
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

All five are worker-start failures. Re-run with the user-authorized fallback:

`node --test --experimental-test-isolation=none tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/lesson-extra-items-a12.test.mjs tests/lesson-extra-items.test.mjs`:

```text
ℹ tests 200
ℹ suites 0
ℹ pass 197
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
TEST_NO_ISOLATION_EXIT=1
```

The three failing tests are:

- `DaF review #11 M8 (round 12): A1.2 reads authored units — four disjoint papers per checkpoint, served by round, checked by the authoring check`: `AssertionError [ERR_ASSERTION]: scripts/a12-lesen-check.mjs:` / `null !== 0`. The child process cannot start in this sandbox. The direct command also fails the new gate, so this is **not** claimed to be solely an environment-blocked green check.
- `DaF review #13 M8: every delivered surface feature × order rule and its inverse score at most 36/64`: `AssertionError [ERR_ASSERTION]: Zahl+ + Wörter+ × position: best 34/64 (limit 36), most 4/4 papers 5/16 (limit 3)` / `false !== true`. The delivered bank fails the enhanced audit.
- `DaF review #13 M8: an independent counterbalanced bank passes the generic feature × order audit`: `AssertionError [ERR_ASSERTION]: Zahl+ + Wörter+ × position: best 32/64 (limit 36), most 4/4 papers 4/16 (limit 3)` / `false !== true`. The unchanged old control cannot meet the new cap.

`node --test --experimental-test-isolation=none --test-name-pattern='DaF review #14' tests/a12-rebuild.test.mjs` — all four new tests:

```text
✔ DaF review #14: every servable ihr-imperative accepts emphasis, including all four checkpoint rounds (856.5775ms)
✔ DaF review #14: imperative person × task-mode matrix, regular/sein, existing pronouns and novel Holt probe (8.0243ms)
✔ DaF review #14 M8: planted 42/64 rule fails; all sixteen independent answer patterns counterbalance the control (445.6928ms)
✔ DaF review #14 M8 feasibility proof: the allowed moves cannot reach a three-whole-paper ceiling (6.0995ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
REGRESSION_EXIT=0
```

`npx eslint --max-warnings 0 --no-ignore` on all eight changed JS/MJS files: both `a12.js` curricula, `scripts/a12-determinacy.mjs`, `scripts/a12-lesen-check.mjs`, `scripts/build-lesson-pool.mjs`, `scripts/imperative-variants.mjs`, `tests/a12-rebuild.test.mjs`, and `tests/helpers/lesenGate.mjs`:

```text
ESLINT_EXIT=0
```

No ESLint diagnostics. `--no-ignore` includes the Astro twin.

Read-only final safeguards:

```text
DIFF_CHECK_EXIT=0
PROTECTED_DIFF_EXIT=0
claude/a12-rebuild
5837f9a
```

`git diff --check` reports no whitespace errors (only Git's LF→CRLF notices). The protected diff includes A1.1 source/twin curricula, A1.1 pools, both registries, both Lesen banks and the frozen semantic fixture. No A1.2 promotion or protected content edit occurred.

## Investigation and remaining limits

Competing causes were checked: a wrong semantic key, a residual pure A/B score imbalance, and missing feature interactions. The unchanged semantic fixture and original paper gates pass in the aggregate run; all pure A/B scores remain 32/64. The extended audit reproduces the interaction leak, ruling out the first two explanations. For ihr, the original checker probes rejected the three correct plural forms, while du emphasis already existed; the missing requested-person branch and harness coverage caused the false rejections.

Two in-memory balance searches were stopped without applying a bank edit. They did not establish infeasibility; the subsequent exhaustive four-rule invariant did. An optional local SciPy availability probe returned `ModuleNotFoundError: No module named 'scipy'`; nothing was installed and no network was accessed.

Intermediate implementation failures were corrected, not waived: the first independent item scan included an ordinary ihr question and was restricted to imperative task modes; the initial builder hook ran before two du prompts acquired their imperative wording, so it now also recognizes their explicit imperative topic/key; an existing vocative needed verb-head matching to prevent `Du du, …`; a new Seid sentence probe exposed both old du-only harness branches, which now exclude the requested ihr person. Final regenerated pool differences are limited to the three ihr items listed above. None of those issues remains a claimed baseline exception.

**Initial exit proof:** ihr behavior, rebuild, validator, determinacy, duplicates, lint, mutation/control tests, invariant proof and protected-file checks passed. The original pair gate and aggregate suite failed, prompting the owner decision above. The impossible 3/16 ceiling has been replaced by the owner-authorized measured ratchet; final verification follows.

## Final verification after the owner decision (2026-10-20)

All commands ran from `C:\Users\zaid1\deutschmeister-a12`, with absolute script/test/file arguments.
Commands below use repo-relative paths only for readability. npm and npx ran with
`npm_config_offline=true`; no network, database, commit, push, checkout or reset was used.
This continuation changed only the helper, Lesen command, rebuild tests and two documentation
files; the earlier ihr implementation and generated content were retained as delivered.
The table above lists **all 12 changed/untracked files relative to HEAD 5837f9a**.

### Reading audit — exit 0

`node scripts/a12-lesen-check.mjs -v`:

```text
Bank worst fixed sequence: AAAA 32/64; worst type-rank rule: AAAA 32/64
Bank feature × order: 55944 rules, limit 36/64
Bank feature pairs × order: 5859 families, measured ratchet (not a gate)
Bank worst feature-pair rule: Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank 46/64; 1/1:B, T/T:A, T/0:B, T/1:B, 1/0:A, 0/1:A, 1/T:A, 0/T:B, 0/0:B; W 1:inverse, W 2:feature, Wer 1:inverse, Wer 2:feature
Bank most whole papers: Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank 10/16; 1/1:B, T/T:A, T/0:B, T/1:B, 1/0:A, 0/1:A, 1/T:B, 0/T:B, 0/0:B; W 1:inverse, W 2:feature, Wer 1:inverse, Wer 2:feature
OK: no findings
```

### Curriculum validator — exit 0

`node scripts/validate-curriculum.mjs a1.2`:

```text
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
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (Ratchet 0)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 4 von 206 (Ratchet 4)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (Ratchet 0)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 295
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

### Determinacy — exit 0

`node scripts/a12-determinacy.mjs a1.2`:

```text
a1.2: 480 served items, 0 correct alternatives rejected
```

### Duplicate files — exit 0

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
```

### Requested five-file test suite

The normal invocation was:
`node --test tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/lesson-extra-items-a12.test.mjs tests/lesson-extra-items.test.mjs`.

It failed to start all five test workers (exit 1):

```text
ℹ tests 5
ℹ suites 0
ℹ pass 0
ℹ fail 5
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
  Error: spawn EPERM
  Error: spawn EPERM
  Error: spawn EPERM
  Error: spawn EPERM
  Error: spawn EPERM
```

A process probe isolated the Windows restriction: `spawnSync` with piped output returned
`status: null, error: "EPERM"`; both ignored and inherited output returned status 0. The
authoring-check subprocess now inherits output; its existing status assertion is unchanged.
The first fallback run also exposed that the old mutation fixture let a different rule score
46/64. Balancing its partial hits retained the planted rule's 42/64 and seven whole papers and
made those the exact family maxima. Neither issue was waived.

The final invocation adds the authorized flag:
`node --test --experimental-test-isolation=none tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/lesson-extra-items-a12.test.mjs tests/lesson-extra-items.test.mjs`.

**Exit 0.** Exact final summary and review-13/review-14 pass lines:

```text
OK: no findings
✔ DaF review #14: every servable ihr-imperative accepts emphasis, including all four checkpoint rounds (990.8218ms)
✔ DaF review #14: imperative person × task-mode matrix, regular/sein, existing pronouns and novel Holt probe (8.8532ms)
✔ DaF review #13 B1: every single-key time-preposition gap has an explicit German meaning selector, with open/cued contrasts (75.007ms)
✔ DaF review #13 M8: every delivered surface feature × order rule and its inverse score at most 36/64 (4625.1046ms)
✔ DaF review #14 M8: delivered feature-pair maxima equal the measured ratchet (1816.4477ms)
✔ DaF review #14 M8: audit measures the planted rule at 42/64; all sixteen independent answer patterns counterbalance the control (607.635ms)
✔ DaF review #14 M8 feasibility proof: the allowed moves cannot reach a three-whole-paper ceiling (13.4829ms)
✔ DaF review #13 M8: alphabetical type-rank and aligned-pair mutations fail, even with unchanged semantic content (3809.9419ms)
✔ DaF review #13 M8: an independent counterbalanced bank passes the generic feature × order audit (524.7906ms)
ℹ tests 201
ℹ suites 0
ℹ pass 201
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### ESLint — exit 0, no diagnostics

`npx eslint --max-warnings 0 --no-ignore` ran on all eight changed JS/MJS files:
`astro-site/src/data/curricula/a12.js`, `src/data/curricula/a12.js`,
`scripts/a12-determinacy.mjs`, `scripts/a12-lesen-check.mjs`,
`scripts/build-lesson-pool.mjs`, `scripts/imperative-variants.mjs`,
`tests/a12-rebuild.test.mjs`, and `tests/helpers/lesenGate.mjs`.
`--no-ignore` includes the Astro twin. ESLint emitted no pass/fail text; the observed exit code was **0**.

### Scope and exit proof

`git diff --check` and the protected-file comparison both returned 0:

```text
DIFF_CHECK_EXIT=0
PROTECTED_DIFF_EXIT=0
```

The comparison covers all `**/a11*` paths, both curriculum registries, both A1.2 Lesen banks and
the semantic fixture. A diff against HEAD shows the only removed pre-existing test line is the
subprocess invocation replaced by the same invocation with inherited output: **no pre-existing
assertion was changed or removed**.

**Exit proof achieved:** accepting reading gate, unchanged earlier gates, exact pair ratchet,
42/64 mutation detection, exhaustive proof, validator, determinacy, duplicates, 201/201 tests and
zero-diagnostic lint. **Remaining limits:** the accepted M8 residue and review-14 minors listed
in the handoff; the ordinary worker-based test command is blocked by Windows EPERM, while the
authorized no-isolation suite passes. This is completion of the requested round-15 resolution,
not a production promotion.
