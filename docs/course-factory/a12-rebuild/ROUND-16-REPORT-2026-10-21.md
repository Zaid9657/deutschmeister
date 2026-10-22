# A1.2 rebuild — round 16 — 2026-10-21

Implemented M15-1 and M15-2 as rules with tests. A1.2 remains a draft; this is not a ship decision. Work stayed in `C:\Users\zaid1\deutschmeister-a12`, branch `claude/a12-rebuild`, HEAD `4a7c054`. No commit, push, checkout, reset, external network request or database operation was performed. Browser verification used loopback only, with `connect-src 'none'` and in-memory service stubs.

## Exit proof

Required: neutral feedback until all dependent Lesen items are answered; full feedback afterwards; all 16 A1.2 papers return to the static strategy measurement; both levels preserve scores, answer payloads and one stamped attempt; every servable tense task has a German selector or accepts its fitting taught contrast; independent person/tense matrix and selector-removal mutation; requested scripts, regressions and zero-warning lint.

Observed: 333/333 regression tests, followed by 8/8 focused tests after the final audit enhancement; 42/64 static = 42/64 deferred versus 53/64 with the premature-feedback mutation; 282 servable pool items and 481 served records, no missing selectors, 39/39 selector-removal mutations caught; browser checks pass for both levels. Live authentication, persistence, audio and AI grading were deliberately not exercised.

## Files changed

All paths below are relative to the repository root.

| File | Change |
|---|---|
| `.fablize/round-16/goals.json` | Round-specific verification goals; existing unrelated ledger preserved. |
| `.fablize/round-16/ledger.jsonl` | Evidence checkpoints and final verification gate. |
| `src/lib/checkpoint/feedback.js` | Shared graded Lesen feedback projection and section-completion predicate. |
| `src/pages/lesson/CheckpointPage.jsx` | Neutral receipts during Lesen; section-end review before proceeding. |
| `src/lib/lesson/strings.js` | English/German neutral receipt and section review labels. |
| `src/data/lessonPools/a12.extra.json` | Tense selectors and matching English tasks/German explanations for authored items. |
| `src/data/lessonPools/a12.corrections.json` | Source overrides for bank items, with German/English tasks and explanations. |
| `src/data/lessonPools/a12.explanationsEn.json` | Matching English explanation sidecar for authored items. |
| `src/data/lessonPools/a12.json` | Regenerated pool, still 295 items; unchanged keys and accepted answer sets. |
| `src/data/curricula/a12.js` | Introduce the word Präteritum beside war/hatte in the L7 notice, in both languages. |
| `astro-site/src/data/curricula/a12.js` | Byte-identical curriculum twin. |
| `scripts/a12-tense-check.mjs` | Class-based tense audit, including all servable items and actual draws. |
| `scripts/checkpoint-feedback-browser.mjs` | Repeatable offline real-component browser harness with in-memory service boundaries. |
| `tests/checkpoint-feedback.test.mjs` | Generic release gate, sequential audit/mutation, and score preservation for both levels. |
| `tests/a12-tense.test.mjs` | Independent 56-case contrast matrix, inventory/whole-pool coverage, twins and 39 removal mutations. |
| `docs/course-factory/a12-rebuild/ROUND-16-REPORT-2026-10-21.md` | This report. |

The pool builder also regenerated `netlify/functions/_shared/ruleCards.mjs`; its bytes have no Git diff. No existing test file or assertion was changed. No ratchet was raised. A1.1 curriculum/pool files, `src/data/curricula/index.js`, the checkpoint builder/scorer and checkpoint service have no diff.

The repository already contained an unrelated unfinished fablize ledger. Its state was inspected and preserved. The same installed `goals.py` create → next → checkpoint → verification-gate functions were run from the repository root with paths scoped to `.fablize/round-16/`.

## M15-1 — shared section feedback rule

| Level | Before | After |
|---|---|---|
| A1.1 | Every submitted Lesen item immediately marked the correct option and showed correctness, the key on a wrong answer, and explanation before Continue. | Every Lesen submission gives a neutral receipt and Continue. No correctness colour/icon/text, key marking or explanation is released while the section is open. After all four answers are recorded, a section review shows each response, correctness, key and explanation. Continue resumes the next item. |
| A1.2 | Same immediate behaviour; mirrored questions expose the opposite answer position to a later item. | Exactly the same section rule as A1.1. No level-specific exception. |

The helper returns only the submitted answer while gated, so neither option rendering nor the receipt can use correctness or a key. The final item's receipt is neutral too; its Continue records the response and opens the completed-section review. Practice/remediation and other sections retain their existing feedback. The reading text's JSX, text content, whitespace handling and position were left unchanged.

The page's score calculation, save function, attempt stamp/payload, finish function and result-screen block were not changed. Only progression at the end of Lesen inserts the review. Existing focus behaviour remains: the neutral receipt takes focus; the section review heading takes focus on entry. No existing test pinned A1.1's immediate correctness behaviour.

The sequential audit exposes only visible option/question features plus already released feedback. It flips its previous guess when no feedback is available, reproducing the review's static rule. It obtains 42/64 on exactly the same 16 papers; forcing early release restores 53/64 and fails the equality gate. This does not remove the separately accepted static M8 residue (46/64 and 10/16); its ratchets and bank remain unchanged.

## M15-2 — source selectors and taught-tense coverage

39 source items changed: 23 authored items in `a12.extra.json`, 16 bank items in `a12.corrections.json`. All have matching English instructions and explanations; authored English explanations remain in the sidecar. Keys and accepted answer sets are unchanged.

The audit covers both directions of sein/haben Präsens–Präteritum, plus the course's present–perfect verbs (including regular forms such as wohnen, brauchen and spielen). An item has no expiry at its minimum Lektion, so all 282 servable pool items are checked through L12, as well as both real practice draws and checkpoint rounds 0–3 at their actual horizon. This includes tasks earlier than L7 that can be reused after the competing tense is taught.

Fixed-tense scaffolds are distinguished from open tense choices: a participle gap after a printed auxiliary and an auxiliary gap before a printed participle do not admit a present alternative in that gap; an article-only correction preserves its supplied tense; imperatives are not indicative tense choices. The existing L7 tense correction already accepts its past alternatives.

The independent matrix has 56 cases: sein/haben × seven subjects (including a new noun subject and formal/plural Sie) × present/past directions × gap/sentence tasks. It checks rejection without a selector, acceptance with one, acceptance of both fitting forms, and failure of English-only, explanation-only or negated selectors. Additional present/perfect contrasts cover kaufen, fahren and wohnen. Every one of the 39 source selectors is independently removed in memory with the key and accepted set unchanged; every mutation is caught.

L7 now explicitly names the selector before practice:
- German notice ending: `Früher: ich/sie **war**, ich/sie **hatte**.` → `Präteritum (früher): ich/sie **war**, ich/sie **hatte**.`
- English: `In the past: …` → `Präteritum (simple past): …`

This resolves the existing vocabulary assertion by teaching the word, without adding a test whitelist or changing an assertion.

### Every changed task: old and new German

These are the built, learner-visible prompts, including the builder's existing opening cues. The only prompt difference is the tense selector; the source column identifies where it is authored.

| Item | Source | Old German | New German |
|---|---|---|---|
| `0aae594f-f849-5da0-a289-2aafc08052ba` | a12.corrections.json | Schreiben Sie den Satz (Beginnen Sie mit „Ich“): [ich / kein / Computer / haben] | Schreiben Sie den Satz (Beginnen Sie mit „Ich“): [ich / kein / Computer / haben] (Präsens) |
| `18fdc9ae-c2b8-5aa4-83cf-c9e11fe8edf5` | a12.corrections.json | Schreiben Sie den Satz: [ich / kaufen / ein Geschenk / für / meine Mutter] (Beginnen Sie mit „Ich“) | Schreiben Sie den Satz: [ich / kaufen / ein Geschenk / für / meine Mutter] (Beginnen Sie mit „Ich“) (Präsens) |
| `1b0e08fd-2629-52c8-881a-287913fb41a7` | a12.corrections.json | Schreiben Sie den Satz: [wir / das Auto / kaufen / nicht] (Beginnen Sie mit „Wir“; „nicht“ steht am Satzende) | Schreiben Sie den Satz: [wir / das Auto / kaufen / nicht] (Beginnen Sie mit „Wir“; „nicht“ steht am Satzende) (Präsens) |
| `20fdea30-db58-5380-b2e5-c2a3eff7f6c7` | a12.corrections.json | Schreiben Sie den Satz: [heute / meine Mutter / kochen / das Essen] (Beginnen Sie mit „Heute“) | Schreiben Sie den Satz: [heute / meine Mutter / kochen / das Essen] (Beginnen Sie mit „Heute“) (Präsens) |
| `2ad09e18-9732-5d7a-9af3-e3abf270533f` | a12.corrections.json | Ich ___ gestern krank. (sein, ich) | Ich ___ gestern krank. (sein, ich) (Präteritum) |
| `5223d628-e272-56f3-888a-d9ac6d33fe18` | a12.corrections.json | Am Freitag ___ meine Eltern nicht zu Hause. (sein) | Am Freitag ___ meine Eltern nicht zu Hause. (sein) (Präsens) |
| `686d81f5-816b-53fc-b84e-2ea6c5aa237a` | a12.corrections.json | Schreiben Sie den Satz: [Fußball / wir / am Wochenende / spielen] (Beginnen Sie mit „Fußball“) | Schreiben Sie den Satz: [Fußball / wir / am Wochenende / spielen] (Beginnen Sie mit „Fußball“) (Präsens) |
| `8b2e5c13-dce3-5540-a8dc-6e37a389d300` | a12.corrections.json | Schreiben Sie den Satz: [ich / arbeiten / bei / die Bank] (mit bestimmtem Artikel) (Beginnen Sie mit „Ich“) | Schreiben Sie den Satz: [ich / arbeiten / bei / die Bank] (mit bestimmtem Artikel) (Beginnen Sie mit „Ich“) (Präsens) |
| `91763b6e-9511-54a0-b044-ff13b01990ac` | a12.corrections.json | Schreiben Sie den Satz: [ich / fahren / nicht / ohne / mein Bruder] (Beginnen Sie mit „Ich“; „nicht“ steht vor „ohne“) | Schreiben Sie den Satz: [ich / fahren / nicht / ohne / mein Bruder] (Beginnen Sie mit „Ich“; „nicht“ steht vor „ohne“) (Präsens) |
| `97cb2bd7-3f5d-586f-bee1-032808437aab` | a12.corrections.json | Schreiben Sie die Frage: [wie viele / Kinder / du / haben] | Schreiben Sie die Frage: [wie viele / Kinder / du / haben] (Präsens) |
| `9ffacea3-144f-5ec1-8d5a-4a89c5e0aec9` | a12.corrections.json | Schreiben Sie den Satz: [er / mit dem Zug / fahren] (Beginnen Sie mit „Er“) | Schreiben Sie den Satz: [er / mit dem Zug / fahren] (Beginnen Sie mit „Er“) (Präsens) |
| `b484df20-10dc-5a1d-ab9e-68374c0fce16` | a12.corrections.json | Schreiben Sie den Satz: [das Buch / sein / von / meine Mutter] (Beginnen Sie mit „Das Buch“) | Schreiben Sie den Satz: [das Buch / sein / von / meine Mutter] (Beginnen Sie mit „Das Buch“) (Präsens) |
| `c8ba2936-e494-510a-b33e-75feca9f2678` | a12.corrections.json | Schreiben Sie den Satz (Beginnen Sie mit „Ich“): [ich / einen / Onkel / haben] | Schreiben Sie den Satz (Beginnen Sie mit „Ich“): [ich / einen / Onkel / haben] (Präsens) |
| `d2d9655f-6089-5f12-a81b-aabc0ea911ae` | a12.corrections.json | Schreiben Sie den Satz: [der Lehrer / heute / krank / sein] (Beginnen Sie mit „Der Lehrer“) | Schreiben Sie den Satz: [der Lehrer / heute / krank / sein] (Beginnen Sie mit „Der Lehrer“) (Präsens) |
| `e2bd9783-ab59-5017-87b9-74872bf836c4` | a12.corrections.json | Schreiben Sie den Satz (Beginnen Sie mit „Wir“): [wir / keine / Zeit / haben] | Schreiben Sie den Satz (Beginnen Sie mit „Wir“): [wir / keine / Zeit / haben] (Präsens) |
| `ee2c444a-6f1f-5166-85e7-a801dbcd5590` | a12.corrections.json | Schreiben Sie den Satz: [ich / wohnen / bei / meine Eltern] (Beginnen Sie mit „Ich“) | Schreiben Sie den Satz: [ich / wohnen / bei / meine Eltern] (Beginnen Sie mit „Ich“) (Präsens) |
| `extra-a12-l01-01` | a12.extra.json | Bilden Sie den Satz: [zuerst / gehen / Sie / geradeaus] (Beginnen Sie mit „Zuerst“) | Bilden Sie den Satz: [zuerst / gehen / Sie / geradeaus] (Präsens) (Beginnen Sie mit „Zuerst“) |
| `extra-a12-l01-02` | a12.extra.json | Bilden Sie den Satz: [dann / gehen / Sie / an der Ecke / links] (Beginnen Sie mit „Dann“) | Bilden Sie den Satz: [dann / gehen / Sie / an der Ecke / links] (Präsens) (Beginnen Sie mit „Dann“) |
| `extra-a12-l01-05` | a12.extra.json | Bilden Sie die Frage: [wie / kommen / ich / zum Rathaus] | Bilden Sie die Frage: [wie / kommen / ich / zum Rathaus] (Präsens) |
| `extra-a12-l01-06` | a12.extra.json | Bilden Sie die Frage: [wo / sein / die Haltestelle] | Bilden Sie die Frage: [wo / sein / die Haltestelle] (Präsens) |
| `extra-a12-l01-07` | a12.extra.json | Bilden Sie den Satz (Beginnen Sie mit „Am Platz“): [am Platz / sein / die Haltestelle] | Bilden Sie den Satz (Beginnen Sie mit „Am Platz“): [am Platz / sein / die Haltestelle] (Präsens) |
| `extra-a12-l03-08` | a12.extra.json | Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / brauchen / Supermarkt] (mit unbestimmtem Artikel) | Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / brauchen / Supermarkt] (mit unbestimmtem Artikel) (Präsens) |
| `extra-a12-l03-09` | a12.extra.json | Bilden Sie den Satz: [Ana / kaufen / Kuchen / im Geschäft] (mit bestimmtem Artikel) (Beginnen Sie mit „Ana“) | Bilden Sie den Satz: [Ana / kaufen / Kuchen / im Geschäft] (mit bestimmtem Artikel) (Präsens) (Beginnen Sie mit „Ana“) |
| `extra-a12-l04-12` | a12.extra.json | Bilden Sie den Satz: [der Eingang / sein / nicht / schön] (Beginnen Sie mit „Der Eingang“) | Bilden Sie den Satz: [der Eingang / sein / nicht / schön] (Präsens) (Beginnen Sie mit „Der Eingang“) |
| `extra-a12-l04-13` | a12.extra.json | Bilden Sie den Satz (Beginnen Sie mit „Das Hotel“): [das Hotel / haben / kein / Steckdose] | Bilden Sie den Satz (Beginnen Sie mit „Das Hotel“): [das Hotel / haben / kein / Steckdose] (Präsens) |
| `extra-a12-l05-07` | a12.extra.json | Bilden Sie die Frage: [wann / kommen / der Bus / zum Konzert] | Bilden Sie die Frage: [wann / kommen / der Bus / zum Konzert] (Präsens) |
| `extra-a12-l05-08` | a12.extra.json | Bilden Sie die Frage: [wohin / fahren / wir / im Urlaub] | Bilden Sie die Frage: [wohin / fahren / wir / im Urlaub] (Präsens) |
| `extra-a12-l07-05` | a12.extra.json | Meine Tante ___ glücklich. (sein) | Meine Tante ___ glücklich. (sein) (Präsens) |
| `extra-a12-l07-06` | a12.extra.json | Bilden Sie die Frage: [wer / sein / die Tante] | Bilden Sie die Frage: [wer / sein / die Tante] (Präsens) |
| `extra-a12-l07-07` | a12.extra.json | Bilden Sie den Satz: [mein Opa / sein / alt] (Beginnen Sie mit „Mein Opa“) | Bilden Sie den Satz: [mein Opa / sein / alt] (Präsens) (Beginnen Sie mit „Mein Opa“) |
| `extra-a12-l07-10` | a12.extra.json | Gestern ___ mein Opa müde. (sein) | Gestern ___ mein Opa müde. (sein) (Präteritum) |
| `extra-a12-l07-11` | a12.extra.json | Gestern ___ meine Tante keine Zeit. (haben) | Gestern ___ meine Tante keine Zeit. (haben) (Präteritum) |
| `extra-a12-l07-12` | a12.extra.json | Früher ___ ich klein. (sein) | Früher ___ ich klein. (sein) (Präteritum) |
| `extra-a12-l07-14` | a12.extra.json | Gestern ___ mein Opa Fieber. (haben) | Gestern ___ mein Opa Fieber. (haben) (Präteritum) |
| `extra-a12-l10-05` | a12.extra.json | Bilden Sie den Satz: [ich / kaufen / die Jacke / für / meine Oma] (Beginnen Sie mit „Ich“) | Bilden Sie den Satz: [ich / kaufen / die Jacke / für / meine Oma] (Präsens) (Beginnen Sie mit „Ich“) |
| `extra-a12-l10-06` | a12.extra.json | Bilden Sie den Satz: [Tim / gehen / ohne / den Mantel] (Beginnen Sie mit „Tim“) | Bilden Sie den Satz: [Tim / gehen / ohne / den Mantel] (Präsens) (Beginnen Sie mit „Tim“) |
| `extra-a12-l11-08` | a12.extra.json | Bilden Sie den Satz: [wir / fahren / bei Regen / mit / Bus] (mit bestimmtem Artikel) (Beginnen Sie mit „Wir“) | Bilden Sie den Satz: [wir / fahren / bei Regen / mit / Bus] (mit bestimmtem Artikel) (Präsens) (Beginnen Sie mit „Wir“) |
| `extra-a12-l12-08` | a12.extra.json | Bilden Sie den Satz: [ich / haben / die Kartoffel / kaufen] (Beginnen Sie mit „Ich“) | Bilden Sie den Satz: [ich / haben / die Kartoffel / kaufen] (Perfekt) (Beginnen Sie mit „Ich“) |
| `extra-a12-l12-09` | a12.extra.json | Bilden Sie den Satz: [Tim / haben / den Reis / kochen] (Beginnen Sie mit „Tim“) | Bilden Sie den Satz: [Tim / haben / den Reis / kochen] (Perfekt) (Beginnen Sie mit „Tim“) |

The extra selector changes the existing practice task-shape categories for some items. The two practice draws therefore contain one additional distinct (Lektion,item) record: the determinacy coverage count is now 481 instead of 480. The pool remains 295 items, of which 282 remain servable. No scoring rule or ratchet was adjusted to accommodate this.

## Exact verification output

All commands ran from the repository root; script/test/source file arguments were absolute in the actual invocations. Relative spellings here are for readability. Exit codes refer to observed tool results.

### Build and validators

`node scripts/build-lesson-pool.mjs a1.2` — exit 0, then `node scripts/validate-curriculum.mjs a1.2` — exit 0:

```text
→ /C:/Users/zaid1/deutschmeister-a12/netlify/functions/_shared/ruleCards.mjs (24 rule cards for a1.1, a1.2, 12 from a1.2)
a1.2: 287 in cache → 141 kept (96 more dropped as untaught-lexis) + 0 generated + 154 hand-authored = 295
→ /C:/Users/zaid1/deutschmeister-a12/src/data/lessonPools/a12.json
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

`node scripts/validate-curriculum.mjs` (A1.1 default) — exit 0:

```text
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
  RULE 10 Wortfeld-Deckung: 14 ungenutzt von 263 (Ratchet 14)
  RULE 11 Item-Lexik (ganzer Pool, informativ): 59 ungelehrte Tokens (Ratchet 59)
  RULE 11b gezogene Item-Lexik: 0 ungelehrte Tokens (Ratchet 0)
  RULE 12 Kann-Beschreibungen ohne Übung: 0 (harte Regel, kein Ratchet)
  RULE 13 Sprechaufträge ohne Mission: 4 (Ratchet 4) — L7, L10, L11, L12
  RULE 6b Notice-Formen ohne Beleg: 23 (Ratchet 23)
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 3 (Ratchet 3)
  RULE 15b aufgeschobene Konstruktionen in Produktionstexten: 0 (Ratchet 0)
  RULE 16 ungedeckte Prüfungsteile: 0 (Ratchet 0)
  RULE 17 Mustertexte, die ihre eigene Checkliste reißen: 0 (harte Regel, kein Ratchet)
  RULE 18 Lektionen, die Diktat und Vorlesen auf dieselbe Zeile legen: 0 (Ratchet 0)
  RULE 19 Mustertexte gegen den eigenen Dialog: 0 (harte Regel, kein Ratchet)
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (Ratchet 0)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 57 von 263 (Ratchet 57)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (harte Regel, kein Ratchet)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (harte Regel, kein Ratchet) — Lektionen 0, Pool-Items ohne explanationEn 0 von 379
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

### Lesen, determinacy and tense audits

`node scripts/a12-lesen-check.mjs -v` — exit 0:

```text
Bank feature × order: 55944 rules, limit 36/64
Bank feature pairs × order: 5859 families, measured ratchet (not a gate)
Bank worst feature-pair rule: Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank 46/64; 1/1:B, T/T:A, T/0:B, T/1:B, 1/0:A, 0/1:A, 1/T:A, 0/T:B, 0/0:B; W 1:inverse, W 2:feature, Wer 1:inverse, Wer 2:feature
Bank most whole papers: Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank 10/16; 1/1:B, T/T:A, T/0:B, T/1:B, 1/0:A, 0/1:A, 1/T:B, 0/T:B, 0/0:B; W 1:inverse, W 2:feature, Wer 1:inverse, Wer 2:feature
OK: no findings
```

`node scripts/a12-determinacy.mjs a1.2` and `node scripts/a12-tense-check.mjs` — exit 0:

```text
a1.2: 481 served items, 0 correct alternatives rejected
M15-2 audit: 282 servable pool items; 481 served items; 0 missing tense selectors
```

### Regression tests

The regular worker-spawning invocation failed before executing the new feedback suite:

```text
Error: spawn EPERM
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

All subsequent test runs used `--experimental-test-isolation=none`, as requested.

Final regression command (exit 0):

```text
node --test --experimental-test-isolation=none
  tests/a12-rebuild.test.mjs
  tests/checkpoint.test.mjs
  tests/check-answer.test.mjs
  tests/lesson-extra-items-a12.test.mjs
  tests/lesson-extra-items.test.mjs
  tests/assessment-integrity.test.mjs
  tests/course-front-door.test.mjs
  tests/course-player.test.mjs
  tests/course-value.test.mjs
  tests/checkpoint-feedback.test.mjs
  tests/a12-tense.test.mjs
  tests/rule-card-overrides.test.mjs
ℹ tests 333
ℹ suites 0
ℹ pass 333
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 107782.9928
```

This includes every test file found referencing CheckpointPage. After adding present/perfect acceptance contrasts and the direct L7 terminology check, the two new suites were rerun (exit 0):

```text
M15-2 audit: 282 servable pool items; 481 served items; 0 missing tense selectors
M15-2 audit: 282 servable pool items; 481 served items; 0 missing tense selectors
M15-2 selector-removal mutations: 39/39 caught
M15-1 audit: 16 papers; static 42/64; deferred 42/64; premature mutation 53/64 (caught)
✔ M15-2 independent sein/haben matrix: seven subjects, both tense directions, gaps and sentences (64.6597ms)
✔ M15-2 includes other taught present/perfect verbs and distinguishes fixed tense scaffolds (6.4919ms)
✔ M15-2 scans every servable pool item, both practice draws and checkpoint rounds 0–3 (2188.1163ms)
✔ M15-2 all selected tenses survive the build with English twins; removing any selector is caught (27.0019ms)
✔ M15-2 the tense inventory covers every currently servable perfect verb (1.6035ms)
✔ graded Lesen releases correctness, key and explanations only after the entire dependency group (2.1015ms)
✔ 16 A1.2 papers: deferred sequential strategy equals static 42/64; premature-feedback mutation reaches 53/64 (1690.6381ms)
✔ both levels preserve answers and scores through deferred Lesen feedback on all 16 papers (3511.0689ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 7727.3519
```

### Duplicates, lint and protected scope

`npm run check:duplicates` — exit 0:

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

`npx --offline eslint --no-ignore --max-warnings 0` on every changed JS/JSX/MJS file listed above (and regenerated ruleCards.mjs) — exit 0, no output. A final rerun on the enhanced audit, browser harness and tense test also exited 0 with no output. `--offline` prevents a package fetch; `--no-ignore` includes the normally ignored Astro twin.

`git diff --check` — exit 0, no output. Protected-path/scorer/service diff — exit 0, no output.

Additional final comparisons against HEAD (exit 0):

```text
PASS integrity: 295 pool items; answer keys and accepted sets unchanged.
PASS integrity: result-screen block unchanged.
PASS integrity: protected content, registry, scorer, service and existing assertions unchanged.
PASS git diff --check.
```

Final branch/HEAD:

```text
claude/a12-rebuild
4a7c054
```

### Browser observation

`node scripts/checkpoint-feedback-browser.mjs` serves only 127.0.0.1:5174. Real React, CheckpointPage, UI primitives, builders, checker and scorer run in Chrome. Auth, service writes, audio playback, writing grading, speech grading and icon imports are local test stubs. A1.2's draft curriculum is exposed only by the harness, without editing the registry.

I observed the neutral first-wrong-answer receipt and the complete section review, including screenshots. Both 20-item runs completed. Exact rendered statuses:

```text
PASS browser a1.2: 20 items; Lesen text unchanged; 4 neutral receipts; full section feedback; 1 stamped attempt; answers, scoring and result preserved.
PASS browser a1.1: 20 items; Lesen text unchanged; 4 neutral receipts; full section feedback; 1 stamped attempt; answers, scoring and result preserved.
```

Both result screens showed `95 %`, `19 of 20 scored tasks correct`, and Lesen `3/4 · 75 %`. The harness checks the full saved answer map, score object, level and stamp. This is evidence of the page's save behaviour with a service stub, not evidence of a live database write.

Final report and goal gate output (exit 0):

```text
PASS report: all 16 changed files and all 39 old/new German task rows recorded.
fablize: G002 → complete
fablize: all stories complete ✓
fablize: 2/2 complete — Round 16: close M15-1 and M15-2 without weakening assertions
```

The verification tab was closed and its local server stopped after observation.

## Investigation and resolved failures

M15-1 hypotheses:
1. **Earlier feedback supplies new information — confirmed.** Before repair the page directly computed and rendered correctness; the sequential strategy scores 53/64. Removing that information alone yields 42/64; restoring it in the mutation restores 53/64.
2. **Pure A/B position imbalance — rejected.** The unchanged Lesen audit keeps every position/type-rank cell at 8/8 and all fixed-position rules at 32/64.
3. **Scorer changed the measurement — rejected.** The same production scorer grades all strategies; its source has no diff, and both-level score/payload tests and browser runs agree.

M15-2 hypotheses:
1. **German task underspecified the tense — confirmed.** The original Tante and Opa prompts reject `war` / `Mein Opa war alt.`; only the present key was accepted, without a German tense instruction.
2. **Wrong person/invalid form — rejected.** The independent contrast matrix verifies the fitting person forms in both directions.
3. **Past tense not taught yet — rejected.** L7 already taught `war/hatte`; it was the grammatical label “Präteritum” that was absent. The label is now introduced beside those forms.

Resolved development failures (not omitted from the evidence):
- An initial static probe scored 32 because it failed to remember its own first guess. The audited implementation now reproduces the review's occurrence-aware static rule (42) and immediate rule (53).
- Read-only probe commands initially hit PowerShell UTF-8/quoting errors (`SyntaxError: Unexpected token '?'`, `SyntaxError: Unexpected identifier 'node'`) and an overlong temporary environment value (`Environment variable name or value is too long.`). The successful probes used UTF-8 stdin and bounded in-memory data; these attempts did not change files.
- A new test initially assumed the previous coverage count, producing `481 !== 480`. The observed task-shape effect was traced in the two practice plans; only that newly introduced exact coverage expectation was corrected. No pre-existing assertion or ratchet changed.
- The first broad regression run ended `ℹ tests 298`, `ℹ pass 297`, `ℹ fail 1`, with `AssertionError [ERR_ASSERTION]: extra-a12-l07-10: „Präteritum" in „(Präteritum)" is not German the course knows`. Teaching the term in L7 resolved this; the final 333-test run passed unchanged existing assertions.
- The first lint run reported `✖ 1 problem (0 errors, 1 warning)` and `ESLint found too many warnings (maximum: 0).` because the Astro twin was ignored. Explicit `--no-ignore` resolved it, with zero output and exit 0.
- Vite failed to start with `Error: spawn EPERM` in esbuild. The local renderer uses installed Sucrase/PostCSS without child processes. The unavailable in-app browser was replaced by the available Chrome connector.
- Initial harness-only failures were `FAIL browser: Timed out waiting for the page` (label matching/stub identity), then `FAIL browser: Typed input missing` following a default-export stub mismatch. Those stubs and the incomplete harness CSS input list were corrected; both final browser runs passed. A screenshot API timeout was resolved using the documented tab screenshot method.
- No live network/database, authentication, AI or audio integration result is claimed. Existing review minors and the accepted static M8 residue remain outside this round.
