# notes.md — Wave 6 PR B: goetheA2Kurs.js (Round 2, after adversarial review 1)

## What this is
`goetheA2Kurs.js` mirrors the shape of `src/data/programs/a22Phase.js` (PROGRAM_KEY,
PROGRAM_TITLE, derived PROGRAM_MINUTES/PROGRAM_HOURS, PROGRAM, allItemIds) but, per the brief,
teaches nothing new: every grammar-review item revisits an already-taught A2.1 or A2.2 topic,
placed only where a Goethe A2 Prüfungsteil needs that form. The spine is Lesen/Hören/Schreiben/
Sprechen, not the grammar list.

## Round 2: what changed and why (per `S/reviews/plan-review-1.md`)

### Blocking
- **B1 (Tag 27 below the 45-min floor)** — Tag 27 was 35 min, the lightest day in the plan while
  the two designated Puffertage sat at 40. Fixed by B2's Schreiben re-run landing there too:
  Tag 27 is now `hubReview(a2.1) + hubReview(a2.2) + schreiben(email, re-run)` = 50 min.
  Round 2 also DROPPED `d27-reading` (the round-1 `reading('d27-reading','a2.1')`, 15 min) to keep
  the day at 50 rather than 65 — Woche 4 still reads on Tage 24/25/28 (declared per m6 of the round-2 review).
  `verify.mjs` now asserts `dayMinutes >= 45` on every day whose label does not contain
  "— Puffertag".
- **B2 (Woche 1 and Woche 4 had no Schreiben at all)** — added `d6-schreiben` (a 15-min re-run
  of the SMS task, Tag 6, Woche 1) and `d27-schreiben` (a 20-min re-run of the first E-Mail
  task, Tag 27, Woche 4). Every study week now schedules `/schreiben/goethe-a2` at least once —
  see the per-week table below. New unique ids; the re-run is deliberate rehearsal, not an
  accidental duplicate.
- **B3 (mock minutes 70 → 60, derived not estimated)** — `src/data/mockExams/goetheA2.js`
  (`goetheA2Mock.sections`) sums Hören 20 + Lesen 20 + Schreiben 20 = 60. Both `mockExam()`
  calls now pass `minutes: 60`; `verify.mjs` imports `goetheA2Mock` directly, sums its sections,
  and fails if either mock item's `minutes` disagrees. `PROGRAM_MINUTES` moved from 1564 to a
  recomputed value that also reflects B2/M10's added items (see Hour budget below).
- **B4 (gReview titles cut to ≤10 words)** — `gReview()`'s title frame changed from
  `Wiederholen für ${examPart} — ${topic.titleDe}` (12–15 words on 7 of 9 calls, actually 11 on
  an 8th once counted precisely) to `${primaryPart}: ${shortTopicTitle}`, where `primaryPart` is
  only the FIRST Prüfungsteil named in `examPart` (split on `" und "`) and `shortTopicTitle` is
  `topic.titleDe` truncated at its own first colon where it has one (only
  `konjunktiv-ii-polite`'s titleDe carries one, a colon-led list of forms — truncating at the
  topic's own punctuation boundary is not a paraphrase, it is still the topic's own name
  verbatim up to that point). All 9 resulting titles are 3–9 words. `verify.mjs` now asserts
  every item title (not just gReview's) is ≤10 words, per the plan-brief's item-shape rule.
- **B5 (subtitle's Zustandspassiv)** — `'Vorausgesetzt: A2.1 und A2.2 sind abgeschlossen.'` used
  `sind abgeschlossen` (Zustandspassiv, sein + Partizip II — banned) and a participial heading
  (`Vorausgesetzt:`, B1 register). Replaced with `'Du hast A2.1 und A2.2 schon beendet.'`
  (Perfekt, allowed). Confirms the reviewer's point that the ban battery's Passiv regex needs
  `werden` and cannot see `sein`-Zustandspassiv — this was an eye-only catch, not a verifier catch,
  and remains one; a future author should not treat a clean `verify.mjs` run as a level-compliance
  proof on its own.
- **B6 (listening overlap comment)** — added the two-line comment the brief asked for, directly
  above `A22_LISTENING_TITLES`: exercise #1/#6 are also drawn on by the mock (Tag 26/30) and #2 by
  the Abschlusstest A2.2 (Probe, Tag 12); this plan still schedules all three as ordinary practice
  beforehand, and the re-runs are deliberate, not an oversight.

### Minor
- **M1** — deleted the unfinished draft sentence ("…temporal-... wait, see the actual call sites
  below…") from the module's plan-overview comment, and rewrote that paragraph without the
  dangling fragment. The equivalent artefact in Round 1's `notes.md` (an unfinished href-count
  breakdown ending "…and… (full breakdown: …)") is gone in this rewrite — see the explicit,
  finished breakdown under "Href class counts" below.
- **M2** — `PROGRAM.subtitle` no longer contains a raw URL path (`/speaking/`); it now reads "im
  Sprechen-Bereich".
- **M3 / M4** — every week `intro`'s "Am Ende …" claim was checked against where its named event
  actually falls and rewritten to name the day directly instead of claiming "am Ende": Woche 1 →
  "In der Wochenmitte wiederholst du den Abschlusstest A2.1." (Tag 5 of 7); Woche 2 → "Am Tag 12
  wiederholst du den Abschlusstest A2.2." (this also drops the Woche-1/Probe-title contradiction
  M4 named, since "wiederholst" now matches `probeAbschlusstest()`'s own "noch einmal machen"
  framing rather than calling it the learner's "ersten" attempt); Woche 4 → "Am Tag 26 machst du
  deinen ersten gewerteten Übungstest." (accurate: Tag 26 of 28, and genuinely the first of the
  two graded attempts, so "ersten" stays here). Pufferzeit's own "Am Ende …" was already true
  (Tag 30 is literally the plan's last item) and is unchanged.
- **M5** — `mockExam()`'s title changed from `Modelltest Goethe A2 — Versuch N (finaler Check)
  (gewertet, ohne Sprechen)` to `Übungstest Goethe A2 — Versuch N (Kurzversion, ohne Sprechen)` —
  using the artifact's own name (`goetheA2Mock.title` = "Goethe-Zertifikat A2 Übungstest
  (Kurzversion)") instead of an invented "Modelltest" label, naming the shortened format, and
  dropping the double-parenthesis and the non-Wortliste "finaler Check".
- **M6** — declared below, not only in `verify.mjs`'s regex: two href classes beyond the
  plan-brief's literal allow-list are legitimate and precedented (`a22Phase.js` uses both):
  `/vocabulary` (the SRS trainer route, `VocabularySectionPage.jsx`) and the bare grammar hubs
  `/grammar/a2.1/` / `/grammar/a2.2/` (used by `hubReview()`, external:true, same Astro route
  class as a per-slug grammar page).
- **M7** — Woche 2's title changed from "Schreiben Teil 1 und mehr Grammatik" to "Schreiben Teil 1
  und Wiederholung" — "mehr Grammatik" contradicted the module's own header ("teaches NOTHING
  new … the spine is not the grammar list").
- **M8** — Woche 3's intro dropped the unsourced "ohne Vorbereitungszeit" claim and the
  non-Wortliste coinage "Sprechrunden"; now reads "Dazu kommen zwei weitere Sprechübungen."
- **M9** — `d27-review` (a single `/grammar/a2.2/` hub item, implying weak spots are always A2.2)
  is now two items, `d27-review-a21` and `d27-review-a22`, one hub review per level, so an A2.1
  gap surfaced by the first Übungstest is not silently pointed only at A2.2.
- **M10 (recommended, applied)** — the minutes B3 freed, plus the day-budget headroom already in
  Woche 4, were used for a second pass at the two hardest NEW A2.2 topics inside the final week:
  `d22-review-2` (verbs-with-prepositions-intro, alongside the Tag 22 PDF) and `d23-review-2`
  (konjunktiv-ii-polite, alongside the Tag 23 PDF). Both days stay at 70 min, under the 75-min cap.

## Day map (30 days, 5 weeks: 4 study + Pufferzeit)
- **Woche 1 (Tag 1–7)** — orientation (Leitfaden, Tag 1), first Lesen/Hören, two Sprechen
  rehearsals (Teil 1, Teil 2), grammar review for Lesen (subordinating-conjunctions) and for
  Schreiben-Teil-1/Sprechen-Teil-3 (pronouns-accusative-dative), a Schreiben re-run (Tag 6, SMS),
  **Probe: Abschlusstest A2.1 (Tag 5)**, week close with SRS + hub review.
- **Woche 2 (Tag 8–14)** — Schreiben Teil 1 (both SMS tasks, Tag 8/11), grammar review for
  Schreiben-Teil-1/Sprechen-Teil-2 (modal-verbs-past) and Lesen/Schreiben-Teil-2
  (subordinate-word-order), Sprechen Teil 3 rehearsal paired with its grammar
  (konjunktiv-ii-polite), **Probe: Abschlusstest A2.2 (Tag 12)**, **Tag 14 Puffertag** (light:
  SRS + hub review only).
- **Woche 3 (Tag 15–21)** — orientation revisited (Tag 15), Schreiben Teil 2 (both E-Mail tasks,
  Tag 15/17) paired with indirect-questions-intro and adjective-endings-intro, Sprechen Teil 1+2
  combined rehearsal paired with verbs-with-prepositions-intro, infinitive-with-zu-intro for
  Schreiben-Teil-1/Sprechen, Sprechen Teil 3 rehearsal, week close with SRS + full-course hub
  review.
- **Woche 4 (Tag 22–28)** — the two official Goethe PDFs (Tag 22 Modellsatz, Tag 23 Übungssatz),
  each now paired with a second-pass grammar review (verbs-with-prepositions-intro /
  konjunktiv-ii-polite), the two exam-format reading texts (A2.2 order 9 "Lesen Teil 2" on
  Tag 24, order 10 "Lesen Teil 4" on Tag 25) both before the mock, **Übungstest Goethe A2
  Versuch 1, gewertet (Tag 26)**, a two-level weak-spot review + Schreiben re-run (Tag 27),
  final full-skills day (Tag 28).
- **Pufferzeit (Tag 29–30)** — **Tag 29 Puffertag** (light: SRS + one X-Ray only),
  **Übungstest Goethe A2 Versuch 2 (Tag 30)** — last item of the plan, nothing after (no A2.3).

## Per-week Schreiben presence (B2)
| Week | Schreiben items | Tag |
| --- | --- | --- |
| Woche 1 | SMS 1 (re-run, 15 min) | Tag 6 |
| Woche 2 | SMS 1, SMS 2 | Tag 8, Tag 11 |
| Woche 3 | E-Mail 1, E-Mail 2 | Tag 15, Tag 17 |
| Woche 4 | E-Mail 1 (re-run, 20 min) | Tag 27 |
| Pufferzeit | — (none scheduled; not required by the brief for the 2-day buffer) | — |

## Grammar review placement (9 topics with one touch each, 2 with a Woche-4 second pass)
a2.1/pronouns-accusative-dative → Schreiben T1 (Tag 4); a2.1/modal-verbs-past → Schreiben T1
(Tag 8); a2.1/adjective-endings-intro → Schreiben T2 (Tag 17); a2.2/subordinating-conjunctions →
Lesen (Tag 2); a2.2/subordinate-word-order → Lesen (Tag 9); a2.2/konjunktiv-ii-polite → Sprechen
T3 (Tag 10, **second pass Tag 23**); a2.2/indirect-questions-intro → Schreiben T2 (Tag 15);
a2.2/verbs-with-prepositions-intro → Sprechen T1 (Tag 18, **second pass Tag 22**);
a2.2/infinitive-with-zu-intro → Schreiben T1 (Tag 19). Each `gReview()` call carries its full
`examPart` argument inline (e.g. "Schreiben Teil 1 und Sprechen Teil 3") even where the item
title now shows only the first-named part — the mapping shown above and the title both derive
from that one argument, so they cannot drift from each other.

## Hour budget
PROGRAM_MINUTES = 1614 (derived, printed by verify.mjs) → PROGRAM_HOURS = 27 (rounded), inside
the brief's 25–30h target. Max single-day load is 70 min (both mock days, Tag 22, Tag 23), under
the 75-min cap; both designated Puffertage (Tag 14, Tag 29) are 40 min, and `verify.mjs` now
confirms they are the plan's only sub-45-minute days.

## Href class counts (from verify.mjs, and declared explicitly per M6)
- **20 Astro/prerendered/PDF hrefs**, all carrying `external: true`: 9 grammar-review links
  (`gReview`, one per topic's first touch) + 2 second-pass grammar-review links (`d22-review-2`,
  `d23-review-2`) + 2 Leitfaden visits (Tag 1, Tag 15) + 2 Goethe PDFs (Tag 22, Tag 23) + 5
  hub-review links to `/grammar/a2.1/` or `/grammar/a2.2/` (`d7-review`, `d14-review`,
  `d21-review`, `d27-review-a21`, `d27-review-a22`) = 20.
- **57 SPA hrefs** (no `external`): reading hub (`/reading/a2.1`, `/reading/a2.2`, incl. the two
  exam-format texts), listening (`/listening/a2.2/1-6`), speaking (`/speaking/`), X-Ray
  (`/analyze/`), Schreiben (`/schreiben/goethe-a2`), Modelltest
  (`/modelltest/abschlusstest-a2-[12]`, `/modelltest/goethe-a2`), and `/vocabulary` (the SRS
  trainer, `srsReview()`, 4 uses — one per study week).
- **77 items total** across 30 days.

## Verifier output (clean run, Round 2)
```
OK — goetheA2Kurs.js verified.
weeks: 5, days: 30, items: 77
PROGRAM_MINUTES: 1614, PROGRAM_HOURS: 27
max single-day minutes: 70
href classes: {"astro/pdf (external)":20,"spa (no external)":57}
mock (/modelltest/goethe-a2) days: Tag 26, Tag 30, minutes: 60 (derived from goetheA2Mock.sections)
```
`verify.mjs` now additionally: imports `goetheA2Mock` and asserts both mock items' minutes equal
its sections' sum (B3); asserts every item title is ≤10 words (B4); asserts every day except the
two `"— Puffertag"`-labeled days has `dayMinutes >= 45` (B1).

## Deliberate choices / non-changes (carried from Round 1, still true)
- **Writing task titles derived, not retyped.** `writingTasks.js`'s real titles ("SMS: Eine
  Einladung absagen", "SMS: Einen neuen Tag vorschlagen", "E-Mail: Nach einem Deutschkurs
  fragen", "E-Mail: Einen Termin beim Amt ändern") are used verbatim minus the frame-word strip,
  not the plan-brief's paraphrase of them.
- **Reading hrefs are the two level hubs, not per-lesson ids** — `reading_lessons` rows are
  DB-issued and cannot be verified offline; the two A2.2 exam-format lessons (order 9/10) still
  resolve through `/reading/a2.2`, only their title is pinned.
- **Probe course tests are framed as ungraded re-attempts** ("Probe: Abschlusstest … noch einmal
  machen") since the product framing has the learner already sitting both Abschlusstests during
  A2.1/A2.2 — see open doubt 3 below for the limit of this assumption.
- **The mock has no Sprechen part.** The title says so ("ohne Sprechen") and `PROGRAM.subtitle`
  repeats it.
- **Staging note (verify.mjs only):** `S/grammarTopics.js` and `S/writingTasks.js` are symlinked
  to the repo's real files so `goetheA2Kurs.js`'s own `../grammarTopics.js` / `../writingTasks.js`
  imports resolve exactly as they will once this file is moved into `src/data/programs/`.
  `verify.mjs` additionally imports `src/data/mockExams/goetheA2.js` by absolute path (B3) — this
  one is a real repo path, not a scratchpad symlink, since `verify.mjs` itself is not staged as a
  same-directory sibling of that module.

## Open doubts for the reviewer
1. **`primaryPart` (B4) always takes the FIRST exam part named in `examPart`.** For the two
   second-pass items (M10) I passed the SAME `examPart` string as the first-touch call (e.g.
   `'Sprechen Teil 1 bis 3 und Schreiben Teil 2'` for both `d18-review` and `d22-review-2`), so
   both touches of a topic carry an identical title. A reviewer who wants the second pass to read
   distinctly (e.g. naming the day-27/28 mock instead) would need a title override parameter on
   `gReview()`, which I did not add to keep the factory's signature stable across this round.
2. **Grammar review still gives most topics exactly one touch** — only the two hardest NEW
   topics (M10) get a second pass. A reviewer who wants spaced repetition for all nine, or for
   the three A2.1 topics too, would need more days or a tighter minute budget elsewhere; the
   current 27h total has roughly 3h of headroom before the 30h ceiling if more repetition is
   wanted.
3. **`probeAbschlusstest()`'s title ("… noch einmal machen")** still assumes the learner's own
   product framing (already sat both tests). Unchanged from Round 1 since no finding asked for it
   to change; flagged again in case a learner could reach this plan without having sat A2.1/A2.2's
   own Abschlusstests.

## Round 3 (orchestrator, residual minors m1–m7 of plan-review-2.md)
- m1 "Modelltest" → "Übungstest" in the subtitle, Woche 4's title and the Pufferzeit intro.
- m2 second passes are marked: "(Wiederholung)" on d8-schreiben (SMS 1, first pass Tag 6) and d27-schreiben
  (E-Mail 1, first pass Tag 15), d22-review-2, d23-review-2 — via a `round` argument on schreiben()/gReview().
- m3 gReview titles are `Wiederholen: <shortTopicTitle>`; `examPart` stays as the call-site rationale.
- m4 "Am Tag N" → "An Tag N" (Wochen 2 and 4). m5 Woche 1 intro names Tag 5 instead of "Wochenmitte".
- m6 declared above. m7 verify.mjs pins exactly two Puffertage, both lighter than every ordinary day.
