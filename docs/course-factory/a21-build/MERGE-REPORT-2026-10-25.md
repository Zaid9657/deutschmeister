# A2.1 integration merge report — 2026-10-25

## Scope and exit proof

Resolve the in-progress merge of `origin/claude/live-fixes-2026-10-25` into
`claude/a21-build` (starting HEAD `c5b8145`). Live A1.1/A1.2 behavior is authoritative;
retain the A2 engine and draft registration. A2 content repair belongs to the next step.
No network, database, staging, commits, reset, checkout, stash, push, or `.fablize/` changes.

Completion requires: byte-identical A1 validator output against the supplied baselines;
determinacy counts 406/481 served with zero rejected and A2 zero rejected; both A1 Lesen
checks OK; A2 validator exit 0 with hard rules zero and measured ratchets; duplicate and
conflict-marker checks; affected tests with exactly the known A2 content failures named;
and zero-warning ESLint on changed JavaScript/JSX. Generated pools, rule cards, and twins
must be rebuilt from resolved sources. Record exact observed output and any gaps below.

## Progress

Skeleton created before conflict resolution; sections below were added as work completed.
All 30 working-tree conflicts are resolved and generated files rebuilt. Full verification
is not certified: see the final table for reproduced baseline failures and environment limits.

## Source resolutions

| Conflicted file | Resolution |
| --- | --- |
| `CLAUDE.md` | Retained both sides' guidance; explicitly states A1.2 live and A2.1 draft in progress. |
| `src/data/curricula/a12.js` | Live housing dialogue, cancellation sample and imperative notice. |
| `src/data/curricula/index.js` | A1.1/A1.2 live; A2.1 draft and pending registration retained. |
| `src/data/lessonPools/a12.extra.json` | Live named-repair prompts retained. |
| `src/data/lessonPools/quality.js` | Live named-repair parser and acceptance rules apply across levels; A2 additions retained. |
| `src/data/writingTasks.js` | Retained A2 lesson/checkpoint tasks alongside live A1 changes. |
| `scripts/a12-determinacy.mjs` | A2 clauses, choice determinacy and fixture support retained; live A1 scanning retained. |
| `scripts/build-lesson-pool.mjs` | Live canonical named-repair validation and final bilingual constraint pass; A2 build support retained. |
| `scripts/check-duplicates.mjs` | Live manifest-based checker; moved A2 pairs into `scripts/shared-files.mjs`. |
| `scripts/checkpoint-feedback-browser.mjs` | Live offline browser fixture checks both Hören and Lesen deferred feedback. |
| `scripts/rule-card-overrides.mjs` | Live imperative exception wording; A2 authored cards retained. |
| `scripts/validate-curriculum.mjs` | A2 formats, construction horizon, adjective rules and recursive inheritance retained; A1 parity checked below. |
| `src/lib/checkpoint/buildCheckpoint.js` | A1 four-paper authored Lesen/true-false path and statement metadata; A2 exam-format routing, grading and non-leaking exam items retained. |
| `src/lib/checkpoint/feedback.js` | Defer all Hören/Lesen feedback and A2 grouped items until section completion. |
| `src/lib/checkpoint/lexis.js` | Live named-word instruction lexer alongside A2 inheritance. |
| `src/lib/lesson/buildLesson.js` | Live supported tile frames, sentence extraction and fallback matching; A2 token limit and exam/speaking builders retained. |
| `src/lib/lesson/check.js` | Live strong-stem, ending and tile checks; A2 mc3/match recognition retained. |
| `src/lib/lesson/strings.js` | Live Hören receipt/review wording with other A2 additions. |
| `src/lib/lesson/writing.js` | Live question-evidence and fair-marking behavior retained; the shared Formcheck remains identical to live-fixes. A2 exam formats are routed by the checkpoint/evaluator callers. |
| `src/pages/Modelltest/ModelltestRun.jsx` | Live ordered autosave/section transition safeguards plus A2 exam audio/speaking. |
| `src/pages/lesson/CheckpointPage.jsx` | Live receipts, Hören review and null guard; A2 exam rendering/export and readiness helper retained. |
| `src/services/examService.js` | Live queued section writes preserve autosave ordering. |
| `tests/a12-rebuild.test.mjs` | Live A1 state values and explicit legacy generator fixtures; retained other assertions. |
| `tests/checkpoint.test.mjs` | Live authored-vs-generated fixture separation; retained other assertions. |
| `tests/helpers/lesenGate.mjs` | Live true/false statement strategies and order gates; retained existing helper behavior. |

The five generated conflicts are deferred to regeneration: Astro `a12.js` and `index.js`,
function `writingTasks.mjs` and `ruleCards.mjs`, and pool `a12.json`.
The index is deliberately left unmerged for the supervisor to stage after review.

## Regeneration and first invariant results

Regenerated all 28 destinations in `scripts/shared-files.mjs` with `sync-shared.mjs`,
including its 15 curriculum-source pairs with `sync-curricula.mjs`. The full list follows:

- `astro-site/src/data/competitorComparisons.js` (from `src/data/competitorComparisons.js`)
- `astro-site/src/data/pricing.js` (from `src/data/pricing.js`)
- `astro-site/src/data/marketing.js` (from `src/data/marketing.js`)
- `astro-site/src/data/design-tokens.js` (from `src/data/design-tokens.js`)
- `astro-site/src/data/organization.js` (from `src/data/organization.js`)
- `astro-site/src/data/navigation.js` (from `src/data/navigation.js`)
- `astro-site/src/data/examTracks.js` (from `src/data/examTracks.js`)
- `astro-site/src/data/events.js` (from `src/data/events.js`)
- `astro-site/src/data/courseContents.js` (from `src/data/courseContents.js`)
- `astro-site/src/data/offers.js` (from `src/data/offers.js`)
- `netlify/functions/_shared/writingTasks.mjs` (from `src/data/writingTasks.js`)
- `netlify/functions/_shared/readaloud.mjs` (from `src/lib/lesson/readaloud.js`)
- `netlify/functions/_shared/examFormats.mjs` (from `src/data/curricula/examFormats.js`)
- `netlify/functions/_shared/speaking.mjs` (from `src/lib/lesson/speaking.js`)
- `astro-site/src/data/curricula/a11.js` (from `src/data/curricula/a11.js`)
- `astro-site/src/data/curricula/a11.lesen.js` (from `src/data/curricula/a11.lesen.js`)
- `astro-site/src/data/curricula/a12.js` (from `src/data/curricula/a12.js`)
- `astro-site/src/data/curricula/a12.lesen.js` (from `src/data/curricula/a12.lesen.js`)
- `astro-site/src/data/curricula/a21.js` (from `src/data/curricula/a21.js`)
- `astro-site/src/data/curricula/a21.exams.js` (from `src/data/curricula/a21.exams.js`)
- `astro-site/src/data/curricula/a21.meta.js` (from `src/data/curricula/a21.meta.js`)
- `astro-site/src/data/curricula/a21.word-ids.js` (from `src/data/curricula/a21.word-ids.js`)
- `astro-site/src/data/curricula/a21-language.js` (from `src/data/curricula/a21-language.js`)
- `astro-site/src/data/curricula/examFormats.js` (from `src/data/curricula/examFormats.js`)
- `astro-site/src/data/curricula/inheritance.js` (from `src/data/curricula/inheritance.js`)
- `astro-site/src/data/curricula/a11.audio.js` (from `src/data/curricula/a11.audio.js`)
- `astro-site/src/data/curricula/index.js` (from `src/data/curricula/index.js`)
- `astro-site/src/data/curricula/constructions.js` (from `src/data/curricula/constructions.js`)

Also regenerated `src/data/lessonPools/a11.json`, `a12.json`, `a21.json` and
`netlify/functions/_shared/ruleCards.mjs` through the pool builder, sequentially A1.1 → A1.2 → A2.1.
The first card build discarded the unreadable conflict-marked generated map; subsequent builds
reconstructed all 36 cards for all three levels from cache and overrides. No generated conflict
was hand-merged. A1 curriculum, extras and both generated pools match live-fixes after newline normalization.

### Curriculum a1.1

Exit 0. Raw stdout is byte-identical to supplied baseline (6517 bytes). No differing lines.

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

### Curriculum a1.2

Exit 0. Raw stdout is byte-identical to supplied baseline (2767 bytes). No differing lines.

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

### Curriculum a2.1

Exit 0. All hard rules are zero; the only nonzero ratchet is RULE 13 = 4, at its measurement.

```text
✓ A2.1: 12 Lektionen, 216 Wortfeld-Einträge (156 mit wordId, 72 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 216 (Ratchet 0)
  RULE 11 Item-Lexik (ganzer Pool, informativ): 0 ungelehrte Tokens (Ratchet 0)
  RULE 11b gezogene Item-Lexik: 0 ungelehrte Tokens (Ratchet 0)
  RULE 12 Kann-Beschreibungen ohne Übung: 0 (harte Regel, kein Ratchet)
  RULE 13 Sprechaufträge ohne Mission: 4 (Ratchet 4) — L4, L6, L9, L10
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
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 0 von 216 (Ratchet 0)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (Ratchet 0)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 353
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

### Determinacy, Lesen and duplicate checks

`node scripts/a12-determinacy.mjs a1.1` — exit 0.

```text
a1.1: 406 served items, 0 correct alternatives rejected
```

`node scripts/a12-determinacy.mjs a1.2` — exit 0.

```text
a1.2: 481 served items, 0 correct alternatives rejected
```

`node scripts/a12-determinacy.mjs a2.1` — exit 0.

```text
a2.1: 521 served items, 0 correct alternatives rejected
```

`node scripts/a11-lesen-check.mjs -v` — exit 0.

```text
A1.1 Lesen declared strategies: max 2/4; bank max 32/64
Templates: 64 distinct; maximum repetition 1
REPORT ONLY: feature × order 50/64; feature-pair × order 50/64; whole papers 7/16
constant Richtig: 32/64
constant Falsch: 32/64
number → Falsch: 32/64
number → Falsch (inverse): 32/64
negation → Falsch: 32/64
negation → Falsch (inverse): 32/64
all statement words in text → Richtig: 32/64
all statement words in text → Richtig (inverse): 32/64
overlap above paper median → Richtig: 32/64
overlap above paper median → Richtig (inverse): 32/64
overlap below paper median → Richtig: 32/64
overlap below paper median → Richtig (inverse): 32/64
statement longer than paper median → Richtig: 32/64
statement longer than paper median → Richtig (inverse): 32/64
Worst pair family: Zahl+ + Aussage wörtlich+ × position; T/0:A, T/1:B; 1:feature, 2:feature, 3:feature, 4:feature
PASS: A1.1 Lesen — 64 independent units; all gates pass
```

`node scripts/a12-lesen-check.mjs -v` — exit 0.

```text
a1.2-cp1: worst strategy over the bank Zahl+ 8/16
a1.2-cp2: worst strategy over the bank Zahl+ 8/16
a1.2-cp3: worst strategy over the bank Zahl+ 8/16
a1.2-cp4: worst strategy over the bank Zahl+ 8/16
Bank positions (A/B): 1=8/8, 2=8/8, 3=8/8, 4=8/8
Bank type-rank (A/B): Wer 1=8/8, Wer 2=8/8, W 1=8/8, W 2=8/8
Bank fixed sequences: AAAA=32/64, AAAB=32/64, AABA=32/64, AABB=32/64, ABAA=32/64, ABAB=32/64, ABBA=32/64, ABBB=32/64, BAAA=32/64, BAAB=32/64, BABA=32/64, BABB=32/64, BBAA=32/64, BBAB=32/64, BBBA=32/64, BBBB=32/64
Bank type-rank rules (Wer1,Wer2,W1,W2): AAAA=32/64, AAAB=32/64, AABA=32/64, AABB=32/64, ABAA=32/64, ABAB=32/64, ABBA=32/64, ABBB=32/64, BAAA=32/64, BAAB=32/64, BABA=32/64, BABB=32/64, BBAA=32/64, BBAB=32/64, BBBA=32/64, BBBB=32/64
Bank worst fixed sequence: AAAA 32/64; worst type-rank rule: AAAA 32/64
Bank feature × order: 70152 rules, limit 36/64
Bank worst feature rule: Länge Zeichen+ (tie→B) × position [1:inverse, 2:feature, 3:feature, 4:inverse] 36/64
Bank worst feature rule: Länge Zeichen+ (tie→B) × type-rank [W 1:inverse, W 2:feature, Wer 1:feature, Wer 2:inverse] 36/64
Bank worst feature rule: Länge Zeichen+ (tie→B) × text form × position [exchange 1:feature, exchange 2:feature, exchange 3:feature, exchange 4:inverse, other 1:inverse, other 2:feature, other 3:feature, other 4:feature] 36/64
Bank worst feature rule: Zahlwert+ (tie→B) × text form × position [exchange 1:feature, exchange 2:feature, exchange 3:inverse, exchange 4:feature, other 1:inverse, other 2:feature, other 3:inverse, other 4:feature] 36/64
Bank worst feature rule: Alphabet+ × position [1:feature, 2:inverse, 3:feature, 4:inverse] 36/64
Bank worst feature rule: Alphabet+ × type-rank [W 1:feature, W 2:feature, Wer 1:inverse, Wer 2:feature] 36/64
Bank worst feature rule: Alphabet+ × pair member [1:inverse, 2:feature] 36/64
Bank worst feature rule: Alphabet+ × option-set occurrence [1:inverse, 2:feature] 36/64
Bank worst feature rule: Alphabet+ × text form × position [exchange 1:feature, exchange 2:inverse, exchange 3:feature, exchange 4:inverse, other 1:feature, other 2:feature, other 3:feature, other 4:feature] 36/64
Bank worst feature rule: Sprecher Wortzahl+ (tie→A) × position [1:feature, 2:feature, 3:feature, 4:inverse] 36/64
Bank feature pairs × order: 9243 families, measured ratchet (not a gate)
Bank worst feature-pair rule: Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank 46/64; 1/1:B, T/T:A, T/0:B, T/1:B, 1/0:A, 0/1:A, 1/T:A, 0/T:B, 0/0:B; W 1:inverse, W 2:feature, Wer 1:inverse, Wer 2:feature
Bank most whole papers: Länge Zeichen+ + Abstand zu Fragewörtern fern × type-rank 10/16; 1/1:B, T/T:A, T/0:B, T/1:B, 1/0:A, 0/1:A, 1/T:B, 0/T:B, 0/0:B; W 1:inverse, W 2:feature, Wer 1:inverse, Wer 2:feature
OK: no findings
```

`node scripts/check-duplicates.mjs` — exit 0.

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
OK: src/data/curricula/examFormats.js === netlify/functions/_shared/examFormats.mjs
OK: src/lib/lesson/speaking.js === netlify/functions/_shared/speaking.mjs
OK: src/data/curricula/a11.js === astro-site/src/data/curricula/a11.js
OK: src/data/curricula/a11.lesen.js === astro-site/src/data/curricula/a11.lesen.js
OK: src/data/curricula/a12.js === astro-site/src/data/curricula/a12.js
OK: src/data/curricula/a12.lesen.js === astro-site/src/data/curricula/a12.lesen.js
OK: src/data/curricula/a21.js === astro-site/src/data/curricula/a21.js
OK: src/data/curricula/a21.exams.js === astro-site/src/data/curricula/a21.exams.js
OK: src/data/curricula/a21.meta.js === astro-site/src/data/curricula/a21.meta.js
OK: src/data/curricula/a21.word-ids.js === astro-site/src/data/curricula/a21.word-ids.js
OK: src/data/curricula/a21-language.js === astro-site/src/data/curricula/a21-language.js
OK: src/data/curricula/examFormats.js === astro-site/src/data/curricula/examFormats.js
OK: src/data/curricula/inheritance.js === astro-site/src/data/curricula/inheritance.js
OK: src/data/curricula/a11.audio.js === astro-site/src/data/curricula/a11.audio.js
OK: src/data/curricula/index.js === astro-site/src/data/curricula/index.js
OK: src/data/curricula/constructions.js === astro-site/src/data/curricula/constructions.js
```

## Integration follow-ups and generated conflict resolutions

| Conflicted generated file | Resolution |
| --- | --- |
| `astro-site/src/data/curricula/a12.js` | Regenerated from the authoritative live A1.2 source through the shared manifest. |
| `astro-site/src/data/curricula/index.js` | Regenerated with A1.1/A1.2 live and A2.1 draft. |
| `netlify/functions/_shared/writingTasks.mjs` | Regenerated from the combined writing bank; duplicate check confirms byte identity. |
| `netlify/functions/_shared/ruleCards.mjs` | Rebuilt through the pool builder for A1.1, A1.2 and A2.1, preserving live A1 overrides and draft A2 overrides. |
| `src/data/lessonPools/a12.json` | Regenerated from live A1.2 curriculum/extras and the combined builder. |

The earlier 15-file curriculum sync included the function exam-format twin. After integrating
the live shared manifest, `scripts/sync-shared.mjs` now restricts its curriculum-only mode
to Astro destinations, preserving that command's contract. Final exact output:

```text
Synced 14 curriculum file(s).
```

Full shared sync still covers all 28 destinations listed above. The shared-files test retains
the no-function-file-in-curriculum-only-mode assertion and normalizes Windows path separators.

Additional integration changes:

- Removed a duplicate, obsolete `cancelPendingSave` helper from the automatic merge in
  `ModelltestRun.jsx`; the live ordered-autosave implementation remains.
- Recomputed `tests/fixtures/a21-engine-a1-baseline.json` from the immutable live-fixes
  merge input `1263407efa5305e78481d44ce369e15378ffd555`, independently of the working tree.
  Updated the baseline helper/test description. Both A1 engine fingerprints now match that
  input, including live A1.2 vocabulary and the authored A1.1 Lesen checkpoints.
- Updated `tests/a21-exam.test.mjs` to require the live Hören completion receipt on A2 too.
  Retained the 11-token A2 / 8-token A1 limit assertions, while checking that an unsupported
  subordinate-clause tile sentence is omitted under the live closed-grammar rule. A supported
  A2 sentence still accepts its alternate valid tile order.
- Pointed `tests/a21-render.test.mjs` at the immutable live-fixes baseline rather than HEAD;
  its A1 equality and A2 rendering assertions remain. Execution is blocked as detailed below.
- Adapted the VM contexts in `tests/ai-spend-reservations.test.mjs` and
  `tests/writing-migration-fallback.test.mjs` to inject the evaluator's added
  `a2WritingFormat` import. Their import-stripping expression now accepts CRLF as well as LF.
  All reservation, quota, ownership, provider-order and fallback assertions remain.
- The new live canonical-writing model guard in `tests/writing-course.test.mjs` uses
  `CURRICULA` (live courses) and the curriculum's exam key. This preserves its live A1.1/A1.2
  coverage; it does not promote the unreviewed A2 draft into an A1 content gate. Existing
  A2 engine/allowance assertions still use `ALL_CURRICULA`. The draft A2 checkpoint 2 model
  does not satisfy the A1 Formcheck's apology/new-date keyword evidence; that content work
  remains deferred rather than changing the model or loosening live marking.
- Reflowed both sides' complete `CLAUDE.md` guidance into 146 lines, preserving its
  bootstrap-size contract; explicitly identified historical workflows and current course state.

Investigation distinguished competing causes: stale A1 golden values were confirmed by
independent live-input fingerprints; dropped A1 behavior was rejected by those fingerprints,
exact validator bytes and determinacy/Lesen results; missing VM dependencies were confirmed
by failures disappearing after injecting the real A2 helper; Windows line endings/path handling
and denied child-process execution were independently reproduced against the live input.
The known draft-content failures also reproduce against pre-merge HEAD. No A2 authored content
was repaired in this integration step.

## Remaining known A2.1 content failures — exactly 20

These are unchanged pre-merge failures: the same test names fail with the source overlay from
HEAD `c5b8145` and with the integrated working tree. They are intentionally deferred to the
next content step. No assertion was removed to suppress them.

### `tests/rule-card-overrides.test.mjs` — 6 failures

- each card carries exactly one short English support line
- every card carries at least two commonMistakes
- no card duzt outside a paradigm listing
- every example noun stands in the Wortfeld the course has taught by that Lektion
- no card uses a word the course has not used by that Lektion
- no card teaches a form the course introduces after its own Lektion

Exact final reporter summary:

```json
{"type":"test:summary","success":false,"counts":{"tests":35,"failed":6,"passed":29,"cancelled":0,"skipped":0,"todo":0,"topLevel":35,"suites":0},"duration_ms":1416.2776}
```

### `tests/a2-1-abschlusstest.test.mjs` — 14 failures

- identity fields and the COURSE_TESTS boundary
- shape/content guards pass, perfect sheet = 100%, empty sheet = 0%
- sections: hoeren 15 + lesen 20 + schreiben 20 = 55 minutes
- Hören: exactly one listening part, capped at 10 questions
- Lesen: two parts, 5 + 5 = 10 items, every item three-option a/b/c
- a/b/c key spread: both parts use all three letters, none more than twice
- Schreiben: two writing parts (SMS + halbformelle E-Mail) with word ranges and >=3 criteria
- no sentence in any German string exceeds 14 words
- no banned A2.1 grammar in any authored string
- the honesty contract is actually in the intro
- every attributive adjective sits after an article — no strong (null-article) endings
- the header does not quote the fabricated round-1 #6 line, and does quote the real one
- exactly one cancellation scenario, and none of PR D1s three writing topics
- no Schreiben Leitpunkt reproduces a live writing task by meaning

Exact final reporter summary:

```json
{"type":"test:summary","success":false,"counts":{"tests":25,"failed":14,"passed":11,"cancelled":0,"skipped":0,"todo":0,"topLevel":25,"suites":0},"duration_ms":252.8557}
```

The last rule-card horizon guard also reports the live A1.1 yes/no card against the draft
A2 “gesprochen” notice; that cross-level failure already exists on HEAD. The authoritative
live A1 card was not changed to accommodate draft content.

## Affected test results and environment limits

Selected 174 test files from the changed application/server/scripts modules, their recursive
local import dependents and tests that read those source paths. Each file ran in a separate
Node invocation to avoid cross-file VM/mock pollution:

```text
node --test --experimental-test-isolation=none --test-reporter=file:///C:/Users/zaid1/deutschmeister-a21/.cache/a21-merge/test-reporter.mjs <absolute-test-path>
```

After rerunning the integration fixes, the combined final per-file results are **2,071 tests:
1,955 passed, 116 failed, 0 skipped/cancelled/todo**. This is not an all-green test gate.
The failures divide into the **20 known A2 content failures** above and **96 additional
failures in 32 files that also reproduce against the live-fixes input in this Windows sandbox**.
No remaining failing test name falls outside those two groups. The renderer aborts during
setup, so its five individual rendering assertions could not execute.

The baseline comparison used Git object reads into an in-memory source overlay; no checkout,
index update or source mutation. It ran the same current test assertions against
`MERGE_HEAD = 1263407efa5305e78481d44ce369e15378ffd555`. Source text was presented with the
working tree's line endings so that Windows-sensitive harness failures remained comparable.
A separate LF-only read overlay then reran the baseline-failing files against current sources;
this diagnostic did not change repository files, assertions, or product behavior.

Key successful suites include `a12-rebuild` (60), `checkpoint` (77), `curricula` (95),
`writing-course` (71), `a21-engine` (3), `a21-exam` (9), `a21-surfaces` (6),
`a21-content` (10), `a21-language` (12), `ai-spend-reservations` (18),
`writing-migration-fallback` (9), `shared-files` (3), and `checkpoint-feedback` (3).
The conflicted Lesen helper is exercised by the Lesen and checkpoint suites.

In the table, “live” is the matching failure count reproduced with the live source overlay;
“LF” is the supplemental current-source diagnostic after normalizing string reads. A dash
means that supplemental run was unnecessary or unavailable. Counts are from actual reporter
events, not inferred success.

| Test file under `tests/` | Tests | Passed | Failed | Live failures | LF failures |
| --- | ---: | ---: | ---: | ---: | ---: |
| `a1-1-listening.test.mjs` | 9 | 9 | 0 | — | — |
| `a1-2-wortliste.test.mjs` | 9 | 9 | 0 | — | — |
| `a11-content-classes.test.mjs` | 9 | 9 | 0 | — | — |
| `a11-lesen.test.mjs` | 10 | 10 | 0 | — | — |
| `a12-buyer-claims.test.mjs` | 4 | 4 | 0 | — | — |
| `a12-rebuild.test.mjs` | 60 | 60 | 0 | — | — |
| `a12-tense.test.mjs` | 5 | 5 | 0 | — | — |
| `a2-1-abschlusstest.test.mjs` | 25 | 11 | 14 | — | — |
| `a2-1-wortliste.test.mjs` | 11 | 11 | 0 | — | — |
| `a2-2-abschlusstest.test.mjs` | 24 | 24 | 0 | — | — |
| `a2-2-wortliste.test.mjs` | 12 | 12 | 0 | — | — |
| `a21-content.test.mjs` | 10 | 10 | 0 | — | — |
| `a21-engine.test.mjs` | 3 | 3 | 0 | — | — |
| `a21-exam.test.mjs` | 9 | 9 | 0 | — | — |
| `a21-language.test.mjs` | 12 | 12 | 0 | — | — |
| `a21-render.test.mjs` | 1 | 0 | 1 | 1 | — |
| `a21-surfaces.test.mjs` | 6 | 6 | 0 | — | — |
| `accessibility-security.test.mjs` | 5 | 5 | 0 | — | — |
| `admin-dispatch.test.mjs` | 3 | 3 | 0 | — | — |
| `admin-ops.test.mjs` | 13 | 13 | 0 | — | — |
| `admin-product.test.mjs` | 8 | 8 | 0 | — | — |
| `admin-rbac.test.mjs` | 6 | 6 | 0 | — | — |
| `ai-spend-reservations.test.mjs` | 18 | 18 | 0 | — | — |
| `app-shell-counts.test.mjs` | 3 | 3 | 0 | — | — |
| `assessment-integrity.test.mjs` | 28 | 28 | 0 | — | — |
| `astro-course-front-door.test.mjs` | 4 | 3 | 1 | 1 | 1 |
| `astro-deps.test.mjs` | 6 | 6 | 0 | — | — |
| `astro-hex.test.mjs` | 1 | 0 | 1 | 1 | 1 |
| `attribution.test.mjs` | 12 | 12 | 0 | — | — |
| `b3-answer-checking.test.mjs` | 3 | 3 | 0 | — | — |
| `b3-course-persistence.test.mjs` | 9 | 9 | 0 | — | — |
| `b3-lesson-generation.test.mjs` | 5 | 5 | 0 | — | — |
| `b3-player-recovery.test.mjs` | 4 | 4 | 0 | — | — |
| `b4-privacy-navigation.test.mjs` | 10 | 7 | 3 | 3 | 0 |
| `brand.test.mjs` | 7 | 7 | 0 | — | — |
| `cancel-path.test.mjs` | 5 | 5 | 0 | — | — |
| `check-answer.test.mjs` | 23 | 23 | 0 | — | — |
| `checkout-access.test.mjs` | 4 | 4 | 0 | — | — |
| `checkpoint-feedback.test.mjs` | 3 | 3 | 0 | — | — |
| `checkpoint.test.mjs` | 77 | 77 | 0 | — | — |
| `claims.test.mjs` | 23 | 23 | 0 | — | — |
| `consent.test.mjs` | 2 | 2 | 0 | — | — |
| `conversion-trust.test.mjs` | 4 | 4 | 0 | — | — |
| `coupons-access-regressions.test.mjs` | 13 | 13 | 0 | — | — |
| `course-art.test.mjs` | 10 | 10 | 0 | — | — |
| `course-audio.test.mjs` | 28 | 28 | 0 | — | — |
| `course-certificate.test.mjs` | 9 | 9 | 0 | — | — |
| `course-front-door.test.mjs` | 7 | 7 | 0 | — | — |
| `course-home.test.mjs` | 18 | 18 | 0 | — | — |
| `course-meta.test.mjs` | 25 | 25 | 0 | — | — |
| `course-next.test.mjs` | 6 | 6 | 0 | — | — |
| `course-plan.test.mjs` | 19 | 19 | 0 | — | — |
| `course-player.test.mjs` | 46 | 46 | 0 | — | — |
| `course-reminder-checkpoints.test.mjs` | 4 | 4 | 0 | — | — |
| `course-reminder.test.mjs` | 19 | 19 | 0 | — | — |
| `course-value.test.mjs` | 8 | 8 | 0 | — | — |
| `crawl-guard.test.mjs` | 28 | 27 | 1 | 1 | 1 |
| `curricula.test.mjs` | 95 | 95 | 0 | — | — |
| `daily-sentence-grammar.test.mjs` | 16 | 16 | 0 | — | — |
| `daily-sentence-links.test.mjs` | 6 | 6 | 0 | — | — |
| `db-columns.test.mjs` | 11 | 11 | 0 | — | — |
| `dead-modules.test.mjs` | 2 | 2 | 0 | — | — |
| `delete-account.test.mjs` | 11 | 3 | 8 | 8 | 0 |
| `dunning-link.test.mjs` | 8 | 8 | 0 | — | — |
| `email-opt-out.test.mjs` | 14 | 14 | 0 | — | — |
| `entitlement-webhook.test.mjs` | 33 | 33 | 0 | — | — |
| `evaluation-output.test.mjs` | 5 | 5 | 0 | — | — |
| `exam-autosave-order.test.mjs` | 7 | 3 | 4 | 4 | 0 |
| `exam-feedback-offer.test.mjs` | 4 | 3 | 1 | 1 | 0 |
| `exams.test.mjs` | 16 | 16 | 0 | — | — |
| `fahrschein.test.mjs` | 4 | 4 | 0 | — | — |
| `faq-podcasts.test.mjs` | 6 | 6 | 0 | — | — |
| `first-run.test.mjs` | 26 | 25 | 1 | 1 | 0 |
| `first-stop.test.mjs` | 5 | 5 | 0 | — | — |
| `free-door.test.mjs` | 4 | 4 | 0 | — | — |
| `function-grants.test.mjs` | 6 | 6 | 0 | — | — |
| `funnel-events.test.mjs` | 9 | 9 | 0 | — | — |
| `german-sie.test.mjs` | 4 | 4 | 0 | — | — |
| `grammar-publication-pages.test.mjs` | 4 | 4 | 0 | — | — |
| `grammar-snapshot.test.mjs` | 9 | 0 | 9 | 9 | 0 |
| `grammar-topic-ux.test.mjs` | 3 | 3 | 0 | — | — |
| `guides.test.mjs` | 11 | 11 | 0 | — | — |
| `head-tags.test.mjs` | 8 | 8 | 0 | — | — |
| `language-strategy.test.mjs` | 4 | 4 | 0 | — | — |
| `launch-consent.test.mjs` | 7 | 3 | 4 | 4 | 4 |
| `lesson-ai-migration-fallback.test.mjs` | 11 | 0 | 11 | 11 | 0 |
| `lesson-attempts.test.mjs` | 8 | 8 | 0 | — | — |
| `lesson-back-skip.test.mjs` | 5 | 5 | 0 | — | — |
| `lesson-engine.test.mjs` | 62 | 62 | 0 | — | — |
| `lesson-extra-items-a12.test.mjs` | 13 | 13 | 0 | — | — |
| `lesson-extra-items.test.mjs` | 28 | 28 | 0 | — | — |
| `lesson-pool-rules.test.mjs` | 48 | 48 | 0 | — | — |
| `lesson-run-resume.test.mjs` | 10 | 10 | 0 | — | — |
| `lesson-scoring.test.mjs` | 14 | 14 | 0 | — | — |
| `lifecycle-claims.test.mjs` | 12 | 12 | 0 | — | — |
| `lifecycle-links.test.mjs` | 6 | 6 | 0 | — | — |
| `lifecycle.test.mjs` | 12 | 11 | 1 | 1 | 1 |
| `linie-design.test.mjs` | 14 | 14 | 0 | — | — |
| `listening-attempt-regressions.test.mjs` | 3 | 1 | 2 | 2 | 0 |
| `live-course-batch1.test.mjs` | 8 | 8 | 0 | — | — |
| `live-course-batch2.test.mjs` | 3 | 3 | 0 | — | — |
| `llms.test.mjs` | 2 | 1 | 1 | 1 | 0 |
| `lock-signup-door.test.mjs` | 5 | 5 | 0 | — | — |
| `migration-advisors.test.mjs` | 11 | 11 | 0 | — | — |
| `migrations-ledger.test.mjs` | 3 | 3 | 0 | — | — |
| `milestones.test.mjs` | 9 | 9 | 0 | — | — |
| `navigation.test.mjs` | 19 | 19 | 0 | — | — |
| `netlify-static-server.test.mjs` | 8 | 8 | 0 | — | — |
| `offers.test.mjs` | 6 | 6 | 0 | — | — |
| `onboarding-completion-regressions.test.mjs` | 2 | 2 | 0 | — | — |
| `onsite-attribution.test.mjs` | 7 | 7 | 0 | — | — |
| `page-login-return.test.mjs` | 4 | 2 | 2 | 2 | 2 |
| `placement-assessment.test.mjs` | 5 | 5 | 0 | — | — |
| `placement.test.mjs` | 7 | 7 | 0 | — | — |
| `plan-status.test.mjs` | 6 | 6 | 0 | — | — |
| `podcast-seo.test.mjs` | 2 | 2 | 0 | — | — |
| `pro-cta.test.mjs` | 4 | 4 | 0 | — | — |
| `profile-plan-button.test.mjs` | 8 | 8 | 0 | — | — |
| `progress.test.mjs` | 19 | 19 | 0 | — | — |
| `purchase-route-gates.test.mjs` | 6 | 5 | 1 | 1 | 1 |
| `purchase-route-imports.test.mjs` | 4 | 4 | 0 | — | — |
| `purchases.test.mjs` | 23 | 23 | 0 | — | — |
| `readaloud-startup-cancellation.test.mjs` | 6 | 6 | 0 | — | — |
| `readaloud.test.mjs` | 20 | 20 | 0 | — | — |
| `readiness.test.mjs` | 9 | 9 | 0 | — | — |
| `reading-level-access.test.mjs` | 4 | 4 | 0 | — | — |
| `refund-claims.test.mjs` | 2 | 2 | 0 | — | — |
| `repository-archive.test.mjs` | 2 | 1 | 1 | 1 | 1 |
| `repository-guidance.test.mjs` | 6 | 5 | 1 | 1 | 0 |
| `rls-update-check.test.mjs` | 11 | 11 | 0 | — | — |
| `rule-card-overrides.test.mjs` | 35 | 29 | 6 | — | — |
| `save-progress-ask.test.mjs` | 16 | 16 | 0 | — | — |
| `sentinel.test.mjs` | 56 | 55 | 1 | 1 | 0 |
| `seo-performance-release.test.mjs` | 5 | 5 | 0 | — | — |
| `shared-files.test.mjs` | 3 | 3 | 0 | — | — |
| `site-audit-regressions.test.mjs` | 11 | 11 | 0 | — | — |
| `social-pack.test.mjs` | 5 | 2 | 3 | 3 | 0 |
| `spa-shell-h1.test.mjs` | 1 | 0 | 1 | 1 | 0 |
| `speaking-closeout.test.mjs` | 17 | 17 | 0 | — | — |
| `speaking-course-task.test.mjs` | 18 | 18 | 0 | — | — |
| `speaking-evaluation-history.test.mjs` | 5 | 0 | 5 | 5 | 0 |
| `speaking-evaluation-reservations.test.mjs` | 15 | 1 | 14 | 14 | 0 |
| `speaking-evaluation-stats.test.mjs` | 2 | 0 | 2 | 2 | 0 |
| `speaking-migration-fallback.test.mjs` | 15 | 15 | 0 | — | — |
| `speaking-offer.test.mjs` | 11 | 11 | 0 | — | — |
| `speaking-reservations.test.mjs` | 5 | 5 | 0 | — | — |
| `speaking-startup-cancellation.test.mjs` | 8 | 8 | 0 | — | — |
| `strong-verb-check.test.mjs` | 2 | 2 | 0 | — | — |
| `subscription-account-race.test.mjs` | 1 | 0 | 1 | 1 | 0 |
| `subscription-heading.test.mjs` | 6 | 5 | 1 | 1 | 0 |
| `subscription-plan-lines.test.mjs` | 7 | 7 | 0 | — | — |
| `subscription-portal-link.test.mjs` | 5 | 4 | 1 | 1 | 0 |
| `support-agent.test.mjs` | 40 | 40 | 0 | — | — |
| `support-areas.test.mjs` | 8 | 8 | 0 | — | — |
| `support-billing-place.test.mjs` | 8 | 8 | 0 | — | — |
| `support.test.mjs` | 7 | 7 | 0 | — | — |
| `sync-outbox.test.mjs` | 19 | 19 | 0 | — | — |
| `telc-deep-links.test.mjs` | 6 | 6 | 0 | — | — |
| `telc-pilot-gate.test.mjs` | 5 | 3 | 2 | 2 | 0 |
| `telc-pilot.test.mjs` | 14 | 14 | 0 | — | — |
| `trial-end-claims.test.mjs` | 4 | 4 | 0 | — | — |
| `trial-fallback.test.mjs` | 3 | 3 | 0 | — | — |
| `trial-grant.test.mjs` | 5 | 5 | 0 | — | — |
| `unlimited-claims.test.mjs` | 2 | 2 | 0 | — | — |
| `web-performance.test.mjs` | 9 | 6 | 3 | 3 | 3 |
| `webhook-refund-replay.test.mjs` | 11 | 11 | 0 | — | — |
| `webhook-unrouted-order.test.mjs` | 7 | 7 | 0 | — | — |
| `welcome-links.test.mjs` | 4 | 4 | 0 | — | — |
| `wortfeld-pacing.test.mjs` | 2 | 2 | 0 | — | — |
| `writing-course.test.mjs` | 71 | 71 | 0 | — | — |
| `writing-migration-fallback.test.mjs` | 9 | 9 | 0 | — | — |
| `xray-migration-fallback.test.mjs` | 8 | 2 | 6 | 6 | 0 |
| `xray-submission.test.mjs` | 4 | 4 | 0 | — | — |
| `xray.test.mjs` | 16 | 14 | 2 | 2 | 0 |

The LF-only diagnostic clears 22 of the 32 remaining baseline-failing files. Those failures
come from import-stripping/section-extraction expressions that assume LF, or other direct
source-string comparisons. The other ten files retain these pre-existing limits:

- `a21-render.test.mjs`: `spawnSync git EPERM`; child-process startup is denied, before React
  rendering assertions. The renderer also depends on esbuild's child process.
- `astro-course-front-door.test.mjs`: existing index-page “start free” CTA count is 0 where
  the test expects at least 1; identical against the live input.
- `astro-hex.test.mjs`, `lifecycle.test.mjs`, `page-login-return.test.mjs`,
  `purchase-route-gates.test.mjs`: Windows backslashes defeat POSIX path comparisons.
- `crawl-guard.test.mjs`: Windows case-insensitive path behavior changes the expected
  `/grammar/A1.1` redirect diagnostic.
- `launch-consent.test.mjs`: denied child-process startup produces a null exit status.
- `repository-archive.test.mjs`: raw-byte archive hashes reflect CRLF checkout bytes;
  normalizing string reads does not change Buffer hashes.
- `web-performance.test.mjs`: URL/path conversion attempts to scan
  `C:\C:\Users\zaid1\deutschmeister-a21\src`.

Browser observation was attempted with the offline checkpoint fixture: it served on
`http://127.0.0.1:5174`, but the in-app browser was unavailable and the Chrome connector
timed out twice (tab creation and tab selection). The local fixture server was stopped.
No browser output was observed; the render/interaction verification gate remains open.
No external network or database was used. Existing live product code was not changed
to work around these environment or baseline-test issues.

## Final lint, parity and handoff status

Final application lint used offline local ESLint in 25-file batches:

```text
npx --offline eslint --max-warnings 0 <absolute changed paths>
```

All **193 application, function, script and test JS/JSX/MJS files** passed with empty output
and exit 0. All **8 changed Astro JavaScript files** passed with empty output and exit 0 when
adding `--no-ignore --rule react-hooks/rules-of-hooks:off` for this server/static-site code.

The unmodified root React lint configuration reports this existing error when forced onto
the Astro server helper without that override:

```text
C:\Users\zaid1\deutschmeister-a21\astro-site\src\lib\grammar.js
  99:20  error  React Hook "useEmergencyCache" is called in function "withFallback" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use"  react-hooks/rules-of-hooks

✖ 1 problem (1 error, 0 warnings)
```

All seven changed vendored scroll-craft JavaScript/MJS files were also checked with
`npx --offline eslint --no-ignore --max-warnings 0`. The six scripts pass; its engine
`.claude/skills/scroll-craft/engine/scrollcraft.js` has these existing `no-unused-vars`
warnings: `scrollEls` at 306:9, `needsLayout` at 308:16, and `e` at 677:97, 843:18,
1044:73, 1054:90, 1086:38, 1092:18, 1102:40, 1259:38 and 1261:68. Exact footer:

```text
✖ 11 problems (0 errors, 11 warnings)

ESLint found too many warnings (maximum: 0).
```

Both the Astro helper and vendored engine are identical to the live-fixes input after CRLF
normalization. They were not modified for this integration. Thus the literal unqualified
zero-warning lint invariant across every changed file is **not met**, despite clean application
lint and the successful Astro-specific diagnostic.

Additional final checks:

```text
{"liveRuleCards":24,"identical":24,"mismatches":[]}
```

All 24 live A1 rule-card objects match the live-fixes input exactly. The final
`npm run check:duplicates` exited 0 with the 28 exact `OK:` lines already recorded above;
this includes byte-identical writing-task twins. `git grep -n "^<<<<<<<\\|^>>>>>>>"`
produced no stdout or stderr (exit 1 means no matches). `git diff --name-only -- .fablize`
was empty. The index intentionally still reports the original 30 unmerged paths because
the supervisor alone stages and commits.

| Required invariant | Final result |
| --- | --- |
| A1.1 validator bytes | PASS — exit 0; 6,517/6,517 bytes, identical, no differing lines. |
| A1.2 validator bytes | PASS — exit 0; 2,767/2,767 bytes, identical, no differing lines. |
| Determinacy A1.1 / A1.2 / A2.1 | PASS — 406 / 481 / 521 served, zero rejected for every level. |
| A1 Lesen checks | PASS — A1.1 prints `PASS: A1.1 Lesen — 64 independent units; all gates pass`; A1.2 prints `OK: no findings`. Both exit 0. |
| A2 validator | PASS — exit 0, every hard rule 0; RULE 13 = 4 at ratchet 4; other ratchets 0. |
| Generated twins / marker scan | PASS — all 28 pairs match; no conflict markers. |
| Conflicted and affected tests | NOT FULLY MET — 20 known content failures plus 96 reproduced baseline/environment failures; no unexplained new failing names. |
| Changed-code ESLint | NOT FULLY MET — application files clean; existing Astro React-rule false positive and 11 vendored warnings require the qualifications above. |
| Real renderer observation | BLOCKED — Chrome connector timeouts and denied child-process startup; no successful observation claimed. |

All 30 conflict files have concrete working-tree resolutions and the generated artifacts have
been rebuilt. **The merge is not certified complete under the user's full exit criteria.**
The outstanding verification limits are listed above for the supervisor; this report does not
authorize staging or committing, and no staging, commit or other prohibited Git operation occurred.
