# A2.1 build — Step 1: engine prerequisites

Status: complete — G2–G6 implemented and verified. No A2.1 curriculum registration or content. Required tests: 257 passed, 0 failed; final focused tests: 15 passed, 0 failed. A1.1/A1.2 validator stdout is unchanged byte for byte.

## Scope and binding decisions

Read `CLAUDE.md`, the A2.1 plan (especially §5), binding decisions of 2026-10-22, the A2 scout and the course standard. D1's bank split and D5's limits govern this step. No network/database operation, commit, push, checkout or reset is used. Existing staged scout/plan files and the untracked owner decisions are not edited.

Only engine prerequisites G2–G6 are being built. No curriculum, authored pool, writing tasks, A2 item kinds or promotion. The A2 registry's curriculum pointer must remain null; trying to validate it must fail explicitly rather than report a fabricated course pass. Counts of linked missions/listening/reading are the plan's offline inventory, not a new live measurement.

Investigation hypotheses after reproducing the missing third-level registry/inheritance path:

- Missing A1.1 source entries: rejected; the A1.1 baseline contains 263 Wortfeld entries and the source has the inherited nouns.
- Tokenisation alone: a first test incorrectly compared a multiword meta label (`Zahlen 0–10`) with a token set. Corrected the new test to check every generated form. No pre-existing assertion was changed.
- A one-hop traversal: confirmed in `seedVocabulary`, `wechselInventory`, `adjectiveLexicon` and checkpoint `knownUpTo`; each resolved only `seedFrom` once. The common chain walker addresses the cause.
- Shared adjective exclusion rather than missing items: confirmed; `never: true` and the attributive-adjective rejection both prevented availability. A1's default remains pinned; A2 needs explicit taught horizons.

The required Fablize `create` refused because `.fablize` already tracks an unrelated production release. Its `next` output named “G008 Production release verification” and hit a Windows cp1252 print error. That unrelated tracker was not replaced or checkpointed; this report tracks the authorized work. The regular Node test command failed before loading tests with `Error: spawn EPERM`; subsequent test runs use the expressly permitted `--experimental-test-isolation=none`.

## Baseline evidence

Both validators exited 0 before implementation. Exact stdout is recorded below; final verification will compare the complete output, including every diagnostic, byte for byte.

### A1.1 before — `node scripts/validate-curriculum.mjs`

```text
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
  RULE 10 Wortfeld-Deckung: 14 ungenutzt von 263 (Ratchet 14)
    L1 Freut mich
    L3 das Einzelkind
    L4 wie viele
    L6 die Nummer
    L10 die Fahrerin
    L10 das Land
    L10 nächste Woche
    L11 letzte Woche
    L11 der Wochentag
    L11 nach Hause
    L12 das Datum
    L12 das Alter
    L12 das Zuhause
    L12 Bis später
  RULE 11 Item-Lexik (ganzer Pool, informativ): 59 ungelehrte Tokens (Ratchet 59)
    L1 0eb1a415-1bd6-5983-8951-b33d16ebb054: Artikel
    L1 0eb1a415-1bd6-5983-8951-b33d16ebb054: Beruf
    L1 0eb1a415-1bd6-5983-8951-b33d16ebb054: mit
    L1 23520fbd-d64b-5992-838d-6c6f27c7e999: Deutsch
    L1 23520fbd-d64b-5992-838d-6c6f27c7e999: Jott
    L1 32eb463d-1209-5db8-8aee-d227e1d99d62: Artikel
    L1 32eb463d-1209-5db8-8aee-d227e1d99d62: mit
    L1 32eb463d-1209-5db8-8aee-d227e1d99d62: Wohnort
    L1 3befc1a5-09d9-5c0e-8f59-67c00b247ffa: Nachname
    L1 559f4c15-815e-5d09-8929-f19548ef12cb: Deutsch
    L1 74f91cf4-e8b5-5ee1-887a-84e6370ac670: Adresse
    L1 74f91cf4-e8b5-5ee1-887a-84e6370ac670: Artikel
    L1 74f91cf4-e8b5-5ee1-887a-84e6370ac670: die
    L1 74f91cf4-e8b5-5ee1-887a-84e6370ac670: mit
    L1 85386a42-7cb4-5293-8a1b-fb8a5bb8e494: Deutsch
    L1 87e8f16d-a3fa-5012-8d47-373e6b16f736: Vorname
    L1 92ac55de-fb60-5f58-8698-7e85444b2255: Artikel
    L1 92ac55de-fb60-5f58-8698-7e85444b2255: die
    L1 92ac55de-fb60-5f58-8698-7e85444b2255: mit
    L1 92ac55de-fb60-5f58-8698-7e85444b2255: Telefonnummer
    L1 9f22442a-a212-57af-8f9f-fd3c30231a4e: Vorname
    L1 b08c9136-4135-57f2-89d8-c1eabb28ef77: Telefonnummer
    L1 cbee2a2c-2b4a-5d9b-88d1-1b5bc64f3294: Artikel
    L1 cbee2a2c-2b4a-5d9b-88d1-1b5bc64f3294: Formular
    L1 cbee2a2c-2b4a-5d9b-88d1-1b5bc64f3294: mit
    L1 eb59458f-62a5-539c-805e-5e94744b68cc: Deutsch
    L1 extra-a11-l01-09: am
    L1 extra-a11-l01-10: zu
    L1 extra-a11-l01-15: am
    L1 ff1f6816-195c-5bf3-846d-9f904ef8c7cd: Deutsch
    L2 19f1aa27-7634-5599-8a61-8f69e259f6d4: Kaffee
    L2 1e3a7370-9e9c-55ea-b513-496b45421861: Kollegen
    L2 459b2960-6610-57b4-b4f9-631bf6eeed01: Schwester
    L2 dcfdd24d-b6da-4222-92a9-2e816bf4cc5d: müde
    L2 extra-a11-l02-12: hat
    L3 4299d5ca-a80e-5528-a6b9-0ac7bee052bb: Freunde
    L3 b19be5e4-48c0-5fad-a8a7-e16bf8e1772f: schön
    L3 b19be5e4-48c0-5fad-a8a7-e16bf8e1772f: Tasche
    L3 b19be5e4-48c0-5fad-a8a7-e16bf8e1772f: teuer
    L4 319b95b6-ca95-5b56-b585-09aaaba51d9c: Kaffee
    L4 319b95b6-ca95-5b56-b585-09aaaba51d9c: kocht
    L4 f153c9f2-8ecc-586d-8b69-550edaf75dd1: Wein
    L5 1beeb08a-c03e-5ab8-8969-b3aec12ef2e5: Computer
    L5 1beeb08a-c03e-5ab8-8969-b3aec12ef2e5: neu
    L5 88087bc2-73f6-5e32-a234-6674fcfff68e: Auto
    L5 be8069b8-e189-4fa9-9888-c78e2d51736f: Auto
    L5 be8069b8-e189-4fa9-9888-c78e2d51736f: Autos
    L5 c68e4835-4ac3-4cc6-9372-3b67f4a09daf: arbeitet
    L5 extra-a11-l05-03: neu
    L5 fbc025da-31e9-44c1-9191-aab034a4e538: kocht
    L6 404c4a60-3448-46bf-99ed-3405eda0bd0f: habe
    L6 51c0db3b-9a30-4ccb-8c6c-d1361eec51da: Auto
    L6 bb5c0422-921b-5e81-86fc-aa36c456ae8a: habe
    L7 10822333-762f-5cf7-a878-3934135461a5: lernt
    L7 4416ce85-3576-5677-9dea-08f332dbdd97: heute
    L7 ea61494a-4f8e-4851-a5f6-1fa8a95364ab: lernst
    L9 68be03d3-c547-41dc-9dc0-772fa974f74f: Auto
    L10 0b5c7d74-0e60-51b3-802e-50a4c8457f36: müde
    L10 5c5c272b-ff81-5811-83b6-6e7fde71ba1b: müde
  RULE 11b gezogene Item-Lexik: 0 ungelehrte Tokens (Ratchet 0)
  RULE 12 Kann-Beschreibungen ohne Übung: 0 (harte Regel, kein Ratchet)
  RULE 13 Sprechaufträge ohne Mission: 4 (Ratchet 4) — L7, L10, L11, L12
  RULE 6b Notice-Formen ohne Beleg: 23 (Ratchet 23)
    L2 „sein“
    L2 „bist“
    L2 „seid“
    L3 „es“
    L3 „wir“
    L3 „ihr“
    L6 „kaufen“
    L7 „spricht“
    L8 „Viertel nach“
    L8 „acht Uhr dreißig“
    L9 „hast“
    L9 „hat“
    L9 „habt“
    L10 „fahren“
    L10 „fährst“
    L11 „schlafen“
    L12 „sein“
    L12 „ihr“
    L12 „Ihr“
    L12 „unser“
    L12 „euer“
    L12 „unsere“
    L12 „eure“
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 3 (Ratchet 3)
    L6 Zeile 9 [time-and-dates] „um eins“ — Die Pause ist um eins.
    L8 Zeile 6 [verb-haben] „Hast“ — Und am Dienstag? Hast du nachmittags Zeit?
    L8 Zeile 7 [verb-haben] „habe“ — Am Dienstag habe ich abends Zeit.
  RULE 15b aufgeschobene Konstruktionen in Produktionstexten: 0 (Ratchet 0)
  RULE 16 ungedeckte Prüfungsteile: 0 (Ratchet 0)
  RULE 17 Mustertexte, die ihre eigene Checkliste reißen: 0 (harte Regel, kein Ratchet)
  RULE 18 Lektionen, die Diktat und Vorlesen auf dieselbe Zeile legen: 0 (Ratchet 0)
  RULE 19 Mustertexte gegen den eigenen Dialog: 0 (harte Regel, kein Ratchet)
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (Ratchet 0)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 57 von 263 (Ratchet 57)
    L1 Gute Nacht
    L1 Entschuldigung
    L1 Freut mich
    L1 der Gruß
    L2 der Student
    L2 die Lehrerin
    L3 der Vater
    L3 die Mutter
    L3 die Frau
    L3 das Einzelkind
    L3 zusammen
    L4 die Uhr
    L4 die Tasche
    L4 der Rucksack
    L4 wie viele
    L4 der Flohmarkt
    L4 der Preis
    L5 der Kugelschreiber
    L5 das Papier
    L5 die Tafel
    L5 die Tür
    L5 das Fenster
    L5 die Wohnung
    L5 weiß
    L5 braun
    L6 die Firma
    L6 der Chef
    L6 die Chefin
    L6 die Kollegin
    L6 die Arbeit
    L6 die Handynummer
    L6 die E-Mail-Adresse
    L6 die Ingenieurin
    L6 der Verkäufer
    L6 die Verkäuferin
    L6 die Nummer
    L8 der Abend
    L8 krank
    L10 der Fahrer
    L10 die Fahrerin
    L10 Deutschland
    L10 das Land
    L10 morgen
    L10 nächste Woche
    L10 das Auto
    L11 letzte Woche
    L11 der Wochentag
    L11 nach Hause
    L11 abholen
    L12 das Datum
    L12 das Alter
    L12 die Karte
    L12 das Zuhause
    L12 lieben
    L12 grüßen
    L12 Bis später
    L12 Schönen Tag noch
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (harte Regel, kein Ratchet)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (harte Regel, kein Ratchet) — Lektionen 0, Pool-Items ohne explanationEn 0 von 379
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

### A1.2 before — `node scripts/validate-curriculum.mjs a1.2`

```text
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 206 (Ratchet 0)
  RULE 11 Item-Lexik (ganzer Pool, informativ): 26 ungelehrte Tokens (Ratchet 26)
    L1 68174fed-dcd5-52e1-93aa-a3efccab10f0: fliegen
    L1 6d0a5335-94cd-5d2d-b844-0343b6171c63: früh
    L1 b3a0ddfa-93c1-4fbb-a853-baed75243483: fliege
    L1 extra-a12-l01-03: Danach
    L1 extra-a12-l01-09: Neben
    L3 2392f776-9fcc-5cf1-8c10-b5c3cedbdd68: sehe
    L3 61b02e29-d65b-4d7b-8138-c50e5fcf9366: sehe
    L3 8e481c5f-9052-529b-9af0-addaf53c66f8: meinen
    L3 c5971132-1f0f-4f77-864c-da02a732da80: Nominativ
    L3 c8ba2936-e494-510a-b33e-75feca9f2678: Onkel
    L4 extra-a12-l04-03: Gibt
    L4 extra-a12-l04-09: gibt
    L6 0cc83e06-3be5-50a6-af81-9a15d0f3ac6c: laufen
    L6 0cc83e06-3be5-50a6-af81-9a15d0f3ac6c: läufst
    L6 294e446d-7b8d-57d0-babe-c3e2bb5790a7: Jacke
    L6 294e446d-7b8d-57d0-babe-c3e2bb5790a7: trägt
    L6 c4173d7e-4f5f-5a2e-a95b-cca816cac3e6: fern
    L6 c8d92aa6-dd5a-517f-b2d4-0e94ed4d1fdf: Läufst
    L6 ef8fe41f-51e0-5c6a-88c8-1e5fd291452a: fern
    L6 extra-a12-l06-05: nichts
    L6 fe82234e-04e0-57c0-b2ee-2fb3f6b3b1e6: tragen
    L6 fe82234e-04e0-57c0-b2ee-2fb3f6b3b1e6: tragt
    L8 9194344b-73c8-5b83-aec9-4d275b788251: schnell
    L8 cfaf34e4-e9b5-5f1b-a551-6da2b642d3c6: langsam
    L9 extra-a12-l09-04: kann
    L9 extra-a12-l09-08: kann
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
    L3 das Kaufhaus
    L3 das Geschäft
    L3 die Bibliothek
    L7 der Körper
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (Ratchet 0)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 295
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

## G2 — Vocabulary inheritance

Implemented a shared, cycle-checked `seedFrom` traversal, nearest ancestor first, for validator vocabulary seeds, the Wechsel inventory, the adjective lexicon and the checkpoint lexicon. The latter now resolves A1.2's real module when another level inherits it. Unknown ancestors and cycles fail explicitly. The current level still stops at the requested Lektion.

The additional reader found was `src/lib/lesson/gloss.js`: new levels inherit glosses by default, while explicit flags on the two live A1 rows preserve their existing same-level gloss contract. The pool builder, `taughtUpTo`, `minLektionIndex`, dialogue validation and production checks consume the corrected seed rather than another one-hop reader.

Passing tests cover all inherited Wortfeld forms from both A1 halves in the validator/checkpoint readers, all inherited glossary entries, adjective and Wechsel inventories, arbitrary chain depth, malformed chains, exclusion of future current-level words and exact A1 glossary serialization. `tests/fixtures/a21-engine-a1-baseline.json` pins the pre-edit serialization hashes: A1.1 lexicon 1,239 forms, A1.2 lexicon 2,074 forms. The after-edit fingerprint test passes without changing that fixture.

## G3 — Exam Teile

Added `examFormats.js`, keyed by `examKey`, describing A1's unchanged 11 Teile and A2's 13 Teile. A2 Lesen 1–3 are `mc3`, Lesen 4 is `match`; Hören and Sprechen formats are also data. No A2 renderer was implemented.

RULE 2/7/16 use the selected exam's Teile and writing contract. A2 uses `schreiben.kind: 'mitteilung'` plus `textsorte: 'sms' | 'email'`, with 20–30 / 30–40 word ranges. A1 retains Formular/Mitteilung, its 5–40 / 25–45 ranges, and existing RULE 16 error strings. The self-introduction requirement applies only to the exam part whose data says `self-introduction`; A2 Teil 1 is question cards. Checkpoint writing lookups receive the curriculum's examKey.

An A2 checkpoint explicitly refuses the A1 Lesen builder with `authored exam Lesen surfaces are required (G9)` until the deferred surfaces exist. Tests cover both exam contracts, the writing bank selection, the self-introduction distinction and this fail-closed boundary. Existing A1 checkpoint output is also pinned by the pre-edit fingerprints.

## G4 — Adjective declension availability

Kept the existing `never: true` default and its untouched A1 assertion. Explicit A2.1 construction matching maps article/possessive adjectives to `adjective-endings-intro`, and dative adjective/ordinal endings to `prepositions-dative`. The introducing Lektion is read from the primary slug, so moving the lesson moves the horizon; it is not an item-id exception or a fixed lesson-number bypass.

Article-led A2 adjectives no longer hit the blanket attributive-adjective ban. Article-less endings outside existing formulas remain excluded. Passing tests cover L4/L11, before/after the lesson, moved primaries, possessives, negated articles, dative pronouns/determiners, line horizons and model-production checks, with A1 still deferred.

Incomplete integration at the mandated stop: `constructions.js` has an Astro twin. The duplicate gate reports drift; the twin has not been synced. This is a release-blocking failure, not an accepted baseline.

## G5 — Validator level registry

Added an engine-only A2.1 row beside the complete-level registry in `scripts/validate-curriculum.mjs`: code `A2.1`, examKey `goethe_a2`, twelve bank primaries, cumulative seed, language policy, personaSource and D5 limits. Validator boundary tests accept 14-word lines, 70-word notices and 30-entry Wortfelder, then reject 15/71/31. A1 keeps its original limits. Persona data inherits A1.2 facts. Zero ratchets describe zero existing A2.1 content debt and remain ceilings; they do not certify a course. Offline linked-content counts are the plan's inventory.

The first implementation exposed a real registry contract: the untouched `tests/curricula.test.mjs` enumerates `Object.keys(LEVELS)` and requires a complete curriculum for every row. A null curriculum in that collection failed its persona test. Resolved with an explicit `PENDING_LEVELS` registry in the same validator and a shared `levelSpec()` lookup across both collections. This keeps `LEVELS`' existing meaning and assertions intact; the A2.1 policy remains queryable. A new test pins both the pending row and unchanged complete-level enumeration.

`curriculum` stays null. Neither curriculum index was edited. The CLI refuses A2.1 validation with `✗ A2.1: engine policy registered; curriculum module not built yet`; no fake curriculum or fabricated pass is supplied.

## G6 — Word forms

Added an A2.1-only word-form policy shared by validator and browser readers. It supplies strong participles, separable and ge-less formation, multiword verbal heads, modal Präteritum, könnte/sollte, adjective stems/endings and dative plural forms. A1 retains its original generator and dictionaries. Lexical expansion and production permission remain separate: §5.2 forms wait for the primary teaching slug, and §5.3 exclusions stay unavailable.

Tests cover positive morphology examples in both readers, unavailable full Präteritum/Konjunktiv-II forms, bounded lesson horizons, and positive/negative probes for all fourteen exclusion families. They caught three implementation defects, now fixed: longest-prefix matching is needed for `zurückkommen`; clause-first detection must accept whitespace added by prompt assembly; subordinate Perfekt exclusion must also recognize ge-less participles such as `bezahlt hat`. No existing assertion was changed.

No determinacy repair (G7), answer-checker change, course content or A2 item kind was implemented.

## Changed files

The following fourteen files were changed or added by this step:

| File | Purpose |
| --- | --- |
| `scripts/validate-curriculum.mjs` | Full-chain readers, exam policies, A2 adjective horizons, pending level row, D5 limits, level-aware forms. |
| `src/data/curricula/inheritance.js` | Shared cycle-checked ancestor traversal. |
| `src/data/curricula/examFormats.js` | A1/A2 exam Teile, formats and writing contracts. |
| `src/data/curricula/a21-language.js` | A2.1 morphology, teaching horizons and exclusions. |
| `src/data/curricula/constructions.js` | Level-aware adjective declension and teaching-slug resolution. |
| `astro-site/src/data/curricula/constructions.js` | Required byte-identical copy of construction policy. |
| `src/lib/checkpoint/lexis.js` | Cumulative checkpoint vocabulary and A2 forms. |
| `src/lib/checkpoint/buildCheckpoint.js` | Exam-aware writing lookup and A2 Lesen boundary. |
| `src/lib/lesson/gloss.js` | Cumulative A2 glosses with live A1 behavior preserved. |
| `tests/a21-engine.test.mjs` | Pre-edit A1 fingerprints, inheritance and pending-registry regression tests. |
| `tests/a21-language.test.mjs` | Rule-level G2–G6 positive, negative and boundary tests. |
| `tests/helpers/a21-engine-baseline.mjs` | Repeatable A1 engine fingerprint measurement. |
| `tests/fixtures/a21-engine-a1-baseline.json` | Fingerprints captured before source edits; not regenerated afterward. |
| `docs/course-factory/a21-build/STEP-1-REPORT.md` | This report, created as a skeleton and filled one section per write. |

Pre-existing scout files, plan and owner decisions were left as found. Neither curriculum index, any A1 curriculum/pool/task data, nor any existing test file was edited. No ratchet was raised.

## A1 output preservation

Both final validator commands exited 0. Complete captured stdout is byte-for-byte equal to the pre-edit output, including diagnostic ordering and ratchet counts:

```text
A1.1 before.output === after.output: true
A1.2 before.output === after.output: true
```

### A1.1 after — `node scripts/validate-curriculum.mjs`

```text
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
  RULE 10 Wortfeld-Deckung: 14 ungenutzt von 263 (Ratchet 14)
    L1 Freut mich
    L3 das Einzelkind
    L4 wie viele
    L6 die Nummer
    L10 die Fahrerin
    L10 das Land
    L10 nächste Woche
    L11 letzte Woche
    L11 der Wochentag
    L11 nach Hause
    L12 das Datum
    L12 das Alter
    L12 das Zuhause
    L12 Bis später
  RULE 11 Item-Lexik (ganzer Pool, informativ): 59 ungelehrte Tokens (Ratchet 59)
    L1 0eb1a415-1bd6-5983-8951-b33d16ebb054: Artikel
    L1 0eb1a415-1bd6-5983-8951-b33d16ebb054: Beruf
    L1 0eb1a415-1bd6-5983-8951-b33d16ebb054: mit
    L1 23520fbd-d64b-5992-838d-6c6f27c7e999: Deutsch
    L1 23520fbd-d64b-5992-838d-6c6f27c7e999: Jott
    L1 32eb463d-1209-5db8-8aee-d227e1d99d62: Artikel
    L1 32eb463d-1209-5db8-8aee-d227e1d99d62: mit
    L1 32eb463d-1209-5db8-8aee-d227e1d99d62: Wohnort
    L1 3befc1a5-09d9-5c0e-8f59-67c00b247ffa: Nachname
    L1 559f4c15-815e-5d09-8929-f19548ef12cb: Deutsch
    L1 74f91cf4-e8b5-5ee1-887a-84e6370ac670: Adresse
    L1 74f91cf4-e8b5-5ee1-887a-84e6370ac670: Artikel
    L1 74f91cf4-e8b5-5ee1-887a-84e6370ac670: die
    L1 74f91cf4-e8b5-5ee1-887a-84e6370ac670: mit
    L1 85386a42-7cb4-5293-8a1b-fb8a5bb8e494: Deutsch
    L1 87e8f16d-a3fa-5012-8d47-373e6b16f736: Vorname
    L1 92ac55de-fb60-5f58-8698-7e85444b2255: Artikel
    L1 92ac55de-fb60-5f58-8698-7e85444b2255: die
    L1 92ac55de-fb60-5f58-8698-7e85444b2255: mit
    L1 92ac55de-fb60-5f58-8698-7e85444b2255: Telefonnummer
    L1 9f22442a-a212-57af-8f9f-fd3c30231a4e: Vorname
    L1 b08c9136-4135-57f2-89d8-c1eabb28ef77: Telefonnummer
    L1 cbee2a2c-2b4a-5d9b-88d1-1b5bc64f3294: Artikel
    L1 cbee2a2c-2b4a-5d9b-88d1-1b5bc64f3294: Formular
    L1 cbee2a2c-2b4a-5d9b-88d1-1b5bc64f3294: mit
    L1 eb59458f-62a5-539c-805e-5e94744b68cc: Deutsch
    L1 extra-a11-l01-09: am
    L1 extra-a11-l01-10: zu
    L1 extra-a11-l01-15: am
    L1 ff1f6816-195c-5bf3-846d-9f904ef8c7cd: Deutsch
    L2 19f1aa27-7634-5599-8a61-8f69e259f6d4: Kaffee
    L2 1e3a7370-9e9c-55ea-b513-496b45421861: Kollegen
    L2 459b2960-6610-57b4-b4f9-631bf6eeed01: Schwester
    L2 dcfdd24d-b6da-4222-92a9-2e816bf4cc5d: müde
    L2 extra-a11-l02-12: hat
    L3 4299d5ca-a80e-5528-a6b9-0ac7bee052bb: Freunde
    L3 b19be5e4-48c0-5fad-a8a7-e16bf8e1772f: schön
    L3 b19be5e4-48c0-5fad-a8a7-e16bf8e1772f: Tasche
    L3 b19be5e4-48c0-5fad-a8a7-e16bf8e1772f: teuer
    L4 319b95b6-ca95-5b56-b585-09aaaba51d9c: Kaffee
    L4 319b95b6-ca95-5b56-b585-09aaaba51d9c: kocht
    L4 f153c9f2-8ecc-586d-8b69-550edaf75dd1: Wein
    L5 1beeb08a-c03e-5ab8-8969-b3aec12ef2e5: Computer
    L5 1beeb08a-c03e-5ab8-8969-b3aec12ef2e5: neu
    L5 88087bc2-73f6-5e32-a234-6674fcfff68e: Auto
    L5 be8069b8-e189-4fa9-9888-c78e2d51736f: Auto
    L5 be8069b8-e189-4fa9-9888-c78e2d51736f: Autos
    L5 c68e4835-4ac3-4cc6-9372-3b67f4a09daf: arbeitet
    L5 extra-a11-l05-03: neu
    L5 fbc025da-31e9-44c1-9191-aab034a4e538: kocht
    L6 404c4a60-3448-46bf-99ed-3405eda0bd0f: habe
    L6 51c0db3b-9a30-4ccb-8c6c-d1361eec51da: Auto
    L6 bb5c0422-921b-5e81-86fc-aa36c456ae8a: habe
    L7 10822333-762f-5cf7-a878-3934135461a5: lernt
    L7 4416ce85-3576-5677-9dea-08f332dbdd97: heute
    L7 ea61494a-4f8e-4851-a5f6-1fa8a95364ab: lernst
    L9 68be03d3-c547-41dc-9dc0-772fa974f74f: Auto
    L10 0b5c7d74-0e60-51b3-802e-50a4c8457f36: müde
    L10 5c5c272b-ff81-5811-83b6-6e7fde71ba1b: müde
  RULE 11b gezogene Item-Lexik: 0 ungelehrte Tokens (Ratchet 0)
  RULE 12 Kann-Beschreibungen ohne Übung: 0 (harte Regel, kein Ratchet)
  RULE 13 Sprechaufträge ohne Mission: 4 (Ratchet 4) — L7, L10, L11, L12
  RULE 6b Notice-Formen ohne Beleg: 23 (Ratchet 23)
    L2 „sein“
    L2 „bist“
    L2 „seid“
    L3 „es“
    L3 „wir“
    L3 „ihr“
    L6 „kaufen“
    L7 „spricht“
    L8 „Viertel nach“
    L8 „acht Uhr dreißig“
    L9 „hast“
    L9 „hat“
    L9 „habt“
    L10 „fahren“
    L10 „fährst“
    L11 „schlafen“
    L12 „sein“
    L12 „ihr“
    L12 „Ihr“
    L12 „unser“
    L12 „euer“
    L12 „unsere“
    L12 „eure“
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 3 (Ratchet 3)
    L6 Zeile 9 [time-and-dates] „um eins“ — Die Pause ist um eins.
    L8 Zeile 6 [verb-haben] „Hast“ — Und am Dienstag? Hast du nachmittags Zeit?
    L8 Zeile 7 [verb-haben] „habe“ — Am Dienstag habe ich abends Zeit.
  RULE 15b aufgeschobene Konstruktionen in Produktionstexten: 0 (Ratchet 0)
  RULE 16 ungedeckte Prüfungsteile: 0 (Ratchet 0)
  RULE 17 Mustertexte, die ihre eigene Checkliste reißen: 0 (harte Regel, kein Ratchet)
  RULE 18 Lektionen, die Diktat und Vorlesen auf dieselbe Zeile legen: 0 (Ratchet 0)
  RULE 19 Mustertexte gegen den eigenen Dialog: 0 (harte Regel, kein Ratchet)
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (Ratchet 0)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 57 von 263 (Ratchet 57)
    L1 Gute Nacht
    L1 Entschuldigung
    L1 Freut mich
    L1 der Gruß
    L2 der Student
    L2 die Lehrerin
    L3 der Vater
    L3 die Mutter
    L3 die Frau
    L3 das Einzelkind
    L3 zusammen
    L4 die Uhr
    L4 die Tasche
    L4 der Rucksack
    L4 wie viele
    L4 der Flohmarkt
    L4 der Preis
    L5 der Kugelschreiber
    L5 das Papier
    L5 die Tafel
    L5 die Tür
    L5 das Fenster
    L5 die Wohnung
    L5 weiß
    L5 braun
    L6 die Firma
    L6 der Chef
    L6 die Chefin
    L6 die Kollegin
    L6 die Arbeit
    L6 die Handynummer
    L6 die E-Mail-Adresse
    L6 die Ingenieurin
    L6 der Verkäufer
    L6 die Verkäuferin
    L6 die Nummer
    L8 der Abend
    L8 krank
    L10 der Fahrer
    L10 die Fahrerin
    L10 Deutschland
    L10 das Land
    L10 morgen
    L10 nächste Woche
    L10 das Auto
    L11 letzte Woche
    L11 der Wochentag
    L11 nach Hause
    L11 abholen
    L12 das Datum
    L12 das Alter
    L12 die Karte
    L12 das Zuhause
    L12 lieben
    L12 grüßen
    L12 Bis später
    L12 Schönen Tag noch
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (harte Regel, kein Ratchet)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (harte Regel, kein Ratchet) — Lektionen 0, Pool-Items ohne explanationEn 0 von 379
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

### A1.2 after — `node scripts/validate-curriculum.mjs a1.2`

```text
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 206 (Ratchet 0)
  RULE 11 Item-Lexik (ganzer Pool, informativ): 26 ungelehrte Tokens (Ratchet 26)
    L1 68174fed-dcd5-52e1-93aa-a3efccab10f0: fliegen
    L1 6d0a5335-94cd-5d2d-b844-0343b6171c63: früh
    L1 b3a0ddfa-93c1-4fbb-a853-baed75243483: fliege
    L1 extra-a12-l01-03: Danach
    L1 extra-a12-l01-09: Neben
    L3 2392f776-9fcc-5cf1-8c10-b5c3cedbdd68: sehe
    L3 61b02e29-d65b-4d7b-8138-c50e5fcf9366: sehe
    L3 8e481c5f-9052-529b-9af0-addaf53c66f8: meinen
    L3 c5971132-1f0f-4f77-864c-da02a732da80: Nominativ
    L3 c8ba2936-e494-510a-b33e-75feca9f2678: Onkel
    L4 extra-a12-l04-03: Gibt
    L4 extra-a12-l04-09: gibt
    L6 0cc83e06-3be5-50a6-af81-9a15d0f3ac6c: laufen
    L6 0cc83e06-3be5-50a6-af81-9a15d0f3ac6c: läufst
    L6 294e446d-7b8d-57d0-babe-c3e2bb5790a7: Jacke
    L6 294e446d-7b8d-57d0-babe-c3e2bb5790a7: trägt
    L6 c4173d7e-4f5f-5a2e-a95b-cca816cac3e6: fern
    L6 c8d92aa6-dd5a-517f-b2d4-0e94ed4d1fdf: Läufst
    L6 ef8fe41f-51e0-5c6a-88c8-1e5fd291452a: fern
    L6 extra-a12-l06-05: nichts
    L6 fe82234e-04e0-57c0-b2ee-2fb3f6b3b1e6: tragen
    L6 fe82234e-04e0-57c0-b2ee-2fb3f6b3b1e6: tragt
    L8 9194344b-73c8-5b83-aec9-4d275b788251: schnell
    L8 cfaf34e4-e9b5-5f1b-a551-6da2b642d3c6: langsam
    L9 extra-a12-l09-04: kann
    L9 extra-a12-l09-08: kann
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
    L3 das Kaufhaus
    L3 das Geschäft
    L3 die Bibliothek
    L7 der Körper
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (Ratchet 0)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 295
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

## Final verification

All commands run from `C:\Users\zaid1\deutschmeister-a21`, without network or database access.

| Command | Result |
| --- | --- |
| `node scripts/validate-curriculum.mjs` | PASS, exit 0; complete stdout identical before/after. |
| `node scripts/validate-curriculum.mjs a1.2` | PASS, exit 0; complete stdout identical before/after. |
| `node scripts/a12-determinacy.mjs a1.2` | PASS, exit 0. |
| `npm run check:duplicates` | PASS, exit 0. |
| Required combined six-file Node suite, below | PASS, 257 tests, 257 passed, 0 failed, exit 0. |
| Final focused run of both new test files | PASS, 15 tests, 15 passed, 0 failed, exit 0. |
| ESLint on all changed JS/MJS files, below | PASS, exit 0, no output and no warnings. |

Exact determinacy output:
```text
a1.2: 481 served items, 0 correct alternatives rejected
```

Exact duplicate-check pass lines:
```text

> deutschmeister@1.0.0 check:duplicates
> node scripts/check-duplicates.mjs

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

Final focused command:
```text
node --experimental-test-isolation=none --test tests/a21-engine.test.mjs tests/a21-language.test.mjs
```

Exact focused test output:
```text
✔ A1 engine behaviour is byte-for-byte identical to the pre-Step-1 baseline (16874.9751ms)
✔ G2: a third level inherits A1.1-only Wortfeld entries (70.8756ms)
✔ G5: A2.1 has an engine row without a curriculum module (5.3723ms)
✔ G2: A2.1 validator, checkpoint, adjective, Wechsel and gloss readers inherit the whole chain (301.3423ms)
✔ G2: arbitrary-depth chains preserve order and reject cycles and missing links (8.5499ms)
✔ G2: the existing A1 gloss lists remain exactly their same-level lists (72.6286ms)
✔ G3: examKey selects 11 A1 or 13 A2 Teile and the correct Textsorten (8.3788ms)
✔ G3: checkpoint lookup follows examKey and A2 cannot fall back to A1 Lesen (76.2134ms)
✔ G4: article and possessive adjective endings open at L4, dative endings at L11 (163.0008ms)
✔ G4: adjective gating reaches line horizons and model-production checks, A1 stays never (68.0025ms)
✔ G5: engine limits, personas and zero initial debt do not register a curriculum (12.834ms)
✔ G5: validation accepts the D5 boundaries and rejects one word or entry above each (717.7334ms)
✔ G6: validator and browser generate A2.1 strong, separable, ge-less, modal and adjective forms (7.2944ms)
✔ G6: bounded forms wait for their teaching lesson (11.5992ms)
✔ G6: every never-taught family has positive and negative probes (15.3253ms)
ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 22010.3124
```

Required combined command (worker isolation is disabled because the ordinary command failed with `Error: spawn EPERM`):
```text
node --experimental-test-isolation=none --test tests/curricula.test.mjs tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/a21-engine.test.mjs tests/a21-language.test.mjs
```

Exact combined result (exit 0):

```text
ℹ tests 257
ℹ suites 0
ℹ pass 257
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2418891.9053
```

The full command took about 40 minutes. It includes the unchanged mutation tests (`A1.1: the validator bites for this level` and `A1.2: the validator bites for this level`), both passing. The separate 15-test run above verifies the final focused edits as well. Two earlier long-running verification attempts were interrupted during implementation; neither is counted as passing.

Final lint command (local installed binary; npm offline mode enabled):
```text
npx eslint --no-ignore --max-warnings 0 scripts/validate-curriculum.mjs src/data/curricula/inheritance.js src/data/curricula/examFormats.js src/data/curricula/a21-language.js src/data/curricula/constructions.js astro-site/src/data/curricula/constructions.js src/lib/checkpoint/lexis.js src/lib/checkpoint/buildCheckpoint.js src/lib/lesson/gloss.js tests/a21-engine.test.mjs tests/a21-language.test.mjs tests/helpers/a21-engine-baseline.mjs
```

Failures encountered and resolved: the initial null row violated the existing complete-curriculum registry contract (resolved with the pending registry); new morphology probes exposed the three G6 defects described above; a new speaking probe initially used `Beruf`, which A1 intentionally recognizes as self-introduction, and was corrected to ask about the time; the duplicate checker found line-ending-only drift (both construction files normalized); ESLint initially reported the ignored Astro copy (`✖ 1 problem (0 errors, 1 warning)`), resolved by linting it explicitly with `--no-ignore`. Existing tests/assertions were not edited or weakened.

The pre-edit fingerprint covers insertion-ordered validator/browser lexicons and forms, taught sets, adjective/Wechsel inventories, line/pool construction horizons, exam coverage, ratchets and default checkpoint papers. This is runtime evidence from Node, alongside the unchanged full validator diagnostics; it is not a claim that an unwritten A2.1 course has passed.
