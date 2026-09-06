# a21Phase.js — notes (round 3, after review-2.md: 1 blocking + 5 minor, all fixed)

`S/wave4/plan/a21Phase.js` — "A2.1-Phase: 28 Tage bis zum Abschlusstest", PROGRAM_KEY
`a21_phase`. Shape copied from `src/data/programs/a12Phase.js` (item factories, throwing
lookups, derive-never-retype, comment discipline); no content copied. Six exports:
PROGRAM_KEY, PROGRAM_TITLE, PROGRAM_MINUTES, PROGRAM_HOURS, PROGRAM, allItemIds.

## Round 3 changes (every finding in `review-2.md`)
1. **[blocking]** The review-gap header comment now matches what the file measures: **eleven of
   the twelve Wiederholungen at 2 days, one — imperative-mood (Tag 22→23) — at 1**, where
   Woche 4's fixed test days leave no room for a second. Round 2's "nine at 2, three at 1" was
   itself wrong; the two matching lines in these notes are corrected below.
2. **[minor]** Tag 22's block opener reindented to 6 spaces (round 2 fixed the comment about it
   but not the code).
3. **[minor]** `xray()` now THROWS on a missing title, like `missionByOrder`, `listeningTitle`,
   `reading` and `schreiben` — a required-but-silent argument was the odd factory out.
4. **[minor]** Tag 8 → "X-Ray: fünf Sätze mit den Possessivpronomen meinem, deiner und unserem",
   the same "mit den <Wortart> <Formen>" pattern Tag 11 uses.
5. **[minor]** Tag 13's derived hub title no longer stacks two coordinators: "Wiederholen:
   Possessivpronomen, Pronomen im Akkusativ und Dativ" (comma, not a second "und"). verify.mjs
   pins it — 87 checks now.
6. **[minor]** Stale Doubt 2 deleted: the writing-title assumption was verified against the real
   `S/wave4/exam/writingTasks.goethe-a2.js` in round 2 (the strip is not a no-op).

## Round 2 changes (every finding in `review-1.md`)
1. **[blocking 1]** Woche 4 reshuffled: `gReview('temporal-prepositions')` moved Tag 24 → Tag 25
   and `gReview('adjective-endings-intro')` Tag 25 → Tag 26, with `listeningReuse(6)` pulled to
   Tag 24 to keep the minute bands and ≥3 Hören/week. No day now carries a topic's Übungen and
   its Wiederholung together, and no day repeats any href at all — pinned by a new check.
2. **[blocking 2]** `uebung()` title is now `Übungen zur Lektion — <titleDe>`: the frame word
   appears once and adds no colon, so "Zeit-Präpositionen: wann und wie lange" no longer nests a
   second one. The reading factory got the same treatment: items 9/10 keep their source title
   verbatim and take the numbering as a suffix ("Lesen Teil 1: … — Text 9 von 10") instead of
   being wrapped in a second "Lesen: …" frame.
3. **[blocking 3]** Tag 11 X-Ray is now "fünf Sätze mit den Pronomen mich, dir und ihn" — `mit`
   governs the noun "Pronomen", not the cited forms. Re-checked every cited form in every title:
   Tag 8's "mit meinem, deiner und unserem" is dative and correct; the others cite infinitives,
   finite verbs, prepositions or question words, none of which reads as a `mit`-complement.
4. **[blocking 4]** The three self-refuting header comments corrected: the review gap now reads
   "1–2 days" (round 3 corrected the split to eleven at 2, imperative-mood at 1); the ordering comment names the real
   topic_order sequence (1,2,3,4,10,5,6,7,11,8,12,9 — four topics interleaved, not one moved);
   the register note now states that AUTHORED copy avoids adjective endings before Tag 24 while
   two DERIVED sources carry them (topic names such as "Trennbare Verben", and the writing bank's
   "Einen neuen Tag vorschlagen" on Tag 16) and that fixing those belongs upstream.
5. **[minor 5/6]** The four a2.1 topics landed on main (`accecf9`), so the grammar stub is gone:
   verify.mjs reads the REAL `src/data/grammarTopics.js` with the real estimatedTime values
   (25/25/**22**/25, not the assumed 25/25/20/20). The missing-slugs guard variant is pinned to a
   frozen pre-wave copy (`git show accecf9^:…`) so the assertion cannot rot.
6. **[minor 7]** verify.mjs gained the two checks that would have caught blocking 1 and 2 —
   same-day duplicate hrefs, and frame-word/colon hygiene across every title — plus a check that
   each week intro's countable claims ("drei Sprechmissionen", "deine erste SMS-Aufgabe", "deine
   erste E-Mail") match that week's actual contents.
7. **[minor 8]** Tag 13's hub review reuses the topic's own `titleDe` ("… und Pronomen im
   Akkusativ und Dativ") instead of naming half of it.
8. **[minor 9]** `xray()`'s generic default is gone; `title` is a required argument and all 17
   items name their own target (verify.mjs checks the 17 titles are distinct).
9. **[minor 10]** Subtitle: "Phase 1 im A2-Band" → "Teil 1 von A2" (no CEFR jargon, no adjective
   ending). **[minor 12]** Tag 22's block reindented to 6 spaces like its siblings.
10. **[minor 11 + 13]** surfaced under Doubts 6 and 7 rather than silently shipped.

## Measured totals (verify.mjs, 2026-09-06, against the REAL grammarTopics.js)
4 weeks · 28 days (Tag 14 and Tag 27 "— Puffertag") · **93 items** · all ids unique ·
`allItemIds().length === 93` · **PROGRAM_MINUTES = 1782** (29.70 h → "Rund 30 Stunden") ·
every day 55–75 min except the two Puffertage (both 40) · every day 2–4 items ·
week minutes 435 / 405 / 467 / 475. **87/87 checks pass, 0 failures** (re-run in round 3).

## Coverage
| strand | count | placement |
|---|---|---|
| Grammatik-Lektionen | 12/12 slugs, each once | 3 per week: Tag 1/3/5, 8/10/12, 15/17/19, 22/23/24 |
| Wiederholungen (`review-<slug>`) | 12 | 1–2 days after its own lesson (eleven at 2 days, imperative-mood at 1), never on the same day as that topic's Übungen |
| Übungen der neuen Themen (`uebung-<slug>`) | 4 | Tag 11, 20, 24, 25 — always lesson day + 1, each paired with an X-Ray item |
| Sprechmissionen | 8/8 (order 1–8), each once | always its prereq lesson's day + 1: Tag 2, 4, 6, 9, 13, 16, 18, 23 |
| Hören | 12 = 6 exercises × 2 passes | first pass Woche 1–2, Diktat pass Woche 3–4; ≥3 per week |
| Lesen | 10 (texts 1–8 live + 9/10 exam format) | 3/3/3/1 per week; Teil 1 on Tag 20, Teil 3 on Tag 25 — both before the Probe |
| Woche 4 im Detail | — | Lektionen Tag 22/23/24 · Mission M8 Tag 23 · Übungen Tag 24/25 · Wiederholungen Tag 23/25/26 · Probe Tag 26 · Puffertag 27 · Abschlusstest + Hand-off Tag 28 |
| Schreiben | 4 (2 SMS + 2 E-Mail) | SMS Tag 9 (Woche 2) + Tag 16 (Woche 3); E-Mail Tag 18 (Woche 3) + Tag 22 (Woche 4) |
| Kurstest | 2 | Probe Tag 26, gewertet Tag 28 (`/modelltest/abschlusstest-a2-1`) |
| Weitere `exam`-Items | 2 | Prüfungsüberblick Tag 1 (`/leitfaden/goethe-a2/`), Hand-off "Weiter: A2.2" Tag 28 (`/level/a2.2`) |
| X-Ray / Wortschatz-SRS / Hub-Wiederholung | 17 / 4 / 6 | X-Ray on 17 days, SRS once per week, hub reviews on consolidation days |

Href classes (all checked): `/grammar/a2.1/<slug>/` and `/grammar/a2.1/` and
`/leitfaden/goethe-a2/` → trailing slash + `external: true` (Astro, case 1); `/speaking/`
and `/analyze/` → trailing slash, no `external` (prerendered SPA hubs, case 2);
`/reading/a2.1`, `/listening/a2.1/<1-6>`, `/vocabulary`, `/schreiben/goethe-a2`,
`/modelltest/abschlusstest-a2-1`, `/level/a2.2` → no slash (SPA rewrites, case 3).

## Harness build commands (round 2 — run, then deleted)
1. `git show accecf9^:src/data/grammarTopics.js > _harness/grammarTopics.pre-wave.js` — the
   FROZEN 8-slug copy, used only to prove the missing-slugs guard fires. (Round 1's recipe
   pointed that variant at the live file, which now has all 12; the assertion rotted the day
   `accecf9` merged, which is how the reviewer's first run scored 78/79.)
2. `_harness/writingTasks.stub.js` = copy of `src/data/writingTasks.js` with the four
   `goethe_a2` task objects taken **verbatim from `S/wave4/exam/writingTasks.goethe-a2.js`**
   (`sms-einladung-absagen`, `sms-treffen-verschieben`, `email-kursanmeldung`,
   `email-termin-beim-amt`). No grammar stub any more — the real repo file is imported.
3. `_harness/a21Phase.harness.js` = copy of `a21Phase.js` with the grammarTopics import pointed
   at the real repo file and the writingTasks import at that stub; `.missing-slugs.js` = the
   same copy against `grammarTopics.pre-wave.js`; `.missing-writing.js` = the same copy against
   the real `writingTasks.js` (no goethe_a2 task until PR D1 — freeze it the same way once it
   lands).
4. `node verify.mjs` → 87 PASS / 0 FAIL. `_harness/` deleted afterwards; nothing was written
   into `/home/user/deutschmeister` at any point (`git status --porcelain` unchanged).

## Deliberate decisions
- **No mission for the 4 new topics** (brief). Their production day is the day after the
  lesson — `uebung-<slug>` (the lesson page's own exercise block) + a written X-Ray item
  naming the target forms. Stated in the module header; pinned by verify.mjs.
- **Missions land exactly on lesson day + 1**, not merely "on or after" (the wave-3 review's
  blocking finding). Sequencing is pedagogical, so `pronouns-accusative-dative` (topic_order
  10) is taught right after `possessive-pronouns`, before `separable-verbs`.
- **Both course-test items are budgeted at 55 minutes**, the real length of the Abschlusstest
  A2.1 per `S/wave4/test-brief.md`, not a guessed slot.
- **Titles say "(Kurzversion)", not "halbe Länge"** — the course test's own title is
  "Abschlusstest A2.1 (Kurzversion)"; the ≈half-length comparison belongs to that file's
  intro, not to a plan item.
- **X-Ray items carry no generic fallback**: `xray()` requires an explicit title, so no day can
  silently reuse "fünf Sätze aus dieser Woche" (round-1 minor 9).
- **Register sweep against `S/wave4/level-a2.1.md`**: removed a superlative
  ("deine schwächsten Themen"), a Genitiv ("die Übungen **der** Lektion" → "zur Lektion") and
  every adjective ending occurring before Tag 24, where `adjective-endings-intro` is taught
  ("dein erster Satz", "sofortige Analyse", "letztes Aufwärmen", "mit trennbaren Verben",
  "Die erste Phase"). What remains is DERIVED, never authored here: grammar topic names
  ("Trennbare Verben") and one writing-bank title ("Einen neuen Tag vorschlagen", Tag 16, eight
  days before adjective-endings-intro). verify.mjs pins the removed authored forms.
- **Week intros are exactly 2 sentences AND every sentence ≤14 words** — unlike a12Phase.js,
  where the two caps were declared to conflict; short intros satisfy both here.
- **Omitted on purpose**: a11Phase.js's per-category `vocab()` browsing family (not requested);
  a repeated speaking mission (a12Phase.js's `speakingRepeat` — A2.1 has 8 missions and every
  new topic already has its own production day, so nothing needed padding); a link to
  `/level/a2.1` (the plan is reached FROM that page); the Tag-28 hand-off is the level page
  `/level/a2.2`, never an invented `/a2-2-phase` (pinned by verify.mjs).
- Reading items link the level hub `/reading/a2.1` rather than per-lesson ids (the hub rotates
  content), but each item carries its real title so the learner can find the text.

## Doubts for the reviewer
1. **Mission titles are unverified against the DB.** There is no `speaking-missions-a2.json`
   in `S/wave4/source/`, and the sandbox cannot reach Supabase, so the eight `title_de`
   strings and their `mission_order` come from the brief verbatim. If a live title differs,
   `A21_SPEAKING_MISSIONS` is the single place to fix.
2. **RESOLVED in round 2**: the four `estimatedTime` values are live (25/25/22/25); every day
   stays in band with them (Tag 19 = 62, Tag 23 = 70) and PROGRAM_MINUTES is 1782.
3. `/leitfaden/goethe-a2/` (PR D1) and `/modelltest/abschlusstest-a2-1` (PR D2a) are same-wave
   forward references: URL shape is safe, data is pending. A merge order that lands this file
   first ships two links to 404s.
4. **Integration is out of scope here** (three-place route rule): `/a2-1-phase` in App.jsx +
   netlify.toml allow-list, `A21PhasePage.jsx`, LevelPage `PHASE_PLAN`, ModelltestHub /
   ModelltestResult wiring and `tests/purchases.test.mjs` all belong to PR D2 per
   `S/wave4/integration-checklist.md`.
5. Tag 26 carries only 2 items (Wiederholung + Probetest) and Tag 21 carries three review-type
   items (SRS, Themenwiederholung, Hub) — both inside the 2–4 rule, both intentional, but they
   are the two days most likely to read thin/repetitive on the rendered page.
6. **`adjective-endings-intro` still has the shortest runway** (review-1 minor 11): lesson
   Tag 24, Übungen + X-Ray Tag 25, Wiederholung Tag 26 — three contacts, the last on the Probe
   day — while `dative-case` gets twenty-five days. It follows from the brief's fixed
   pedagogical order plus the fixed test days (26/28) and 3 lessons/week; a fourth day would
   mean four lessons in Woche 3. Flagged for the coordinator rather than silently shipped.
7. **Inherited ASCII quotes** (review-1 minor 13): `grammarTopics.js` `titleDe` renders
   `Perfekt mit "haben"` / `"sein"` beside this module's own „…“. Derive-never-retype says do not
   paraphrase them here — the fix is two `titleDe` values upstream, in a separate commit.
