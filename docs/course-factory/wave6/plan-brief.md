# Wave 6 PR B — the Goethe-A2 30-day exam plan (author brief)

Read S/common-header.md and S/level-a2.2.md first. Deliverable: S/plan/goetheA2Kurs.js (an ES module in the
exact export shape of the repo's src/data/programs/a22Phase.js — PROGRAM_KEY, PROGRAM_TITLE, PROGRAM_MINUTES,
PROGRAM_HOURS, PROGRAM, allItemIds) + S/plan/verify.mjs + S/plan/notes.md. Read these repo files first
(read-only): src/data/programs/startDeutsch1.js (the A1 exam plan this mirrors: 30 days = 4 study weeks +
"Pufferzeit", item factories, the two gewertete Modelltest runs, the official PDFs on external hrefs),
src/data/programs/a22Phase.js (the newer conventions: derived PROGRAM_MINUTES/HOURS, cached DB titles for
listening/reading/missions, nextStep hand-off), docs/course-factory/wave5/plan-brief.md (item shape, hour
budget rules, allowed href classes, what a reviewer rejects).

## Product framing (binding)
- PROGRAM_KEY 'goethe_a2_30_tage', PROGRAM_TITLE 'Goethe-Zertifikat A2: 30 Tage bis zur Prüfung'. The learner
  has finished A2.1 + A2.2 (both Abschlusstests exist) and now rehearses the EXAM: the four Prüfungsteile
  (Lesen Teil 1–4, Hören Teil 1–4, Schreiben Teil 1–2, Sprechen Teil 1–3) are the spine, not the grammar.
- 30 days, 5 weeks (4 study + Pufferzeit), 45–75 min/day, two lighter Puffertage; PROGRAM_MINUTES derived,
  PROGRAM_HOURS ≈ 25–30 — never a hand-written hour figure in prose.
- Honesty: no outcome promise; Sprechen can only be rehearsed on /speaking/ (missions) and with a partner;
  the mock has no Sprechen and the intro says so; the two official Goethe practice sets are external links
  (there are only TWO for A2 Erwachsene: A2_Modellsatz_Erwachsene.pdf and A2_Uebungssatz_Erwachsene.pdf —
  take the exact URLs from astro-site/src/data/guides/goethe-a2.js `sources`; never invent a third).
- Content inventory (all live; use these hrefs exactly; every internal href must resolve):
  grammar review days → `/grammar/a2.1/<slug>/` and `/grammar/a2.2/<slug>/` (external: true; the 24 slugs
  are in src/data/grammarTopics.js a2.1-gt1..12 and a2.2-gt1..12 — use `getTopicsForLevel` like a22Phase.js
  does, and pick the exam-relevant ones for review, not all 24); reading `/reading/a2.1` and `/reading/a2.2`
  (the two exam-format lessons at A2.2 order 9/10 are "Lesen Teil 2"/"Lesen Teil 4" practice — name them in the
  item title; titles cached in a22Phase.js); listening `/listening/a2.2/1`..`/6` (titles in a22Phase.js
  A22_LISTENING_TITLES; #1 and #6 are used by the mock, #2 by the Abschlusstest — say so in a comment and
  still schedule them, they are practice); writing `/schreiben/goethe-a2` (the 4 goethe_a2 tasks live there —
  SMS Einladung absagen, SMS Treffen verschieben, E-Mail Kursanmeldung, E-Mail Termin beim Amt; name the task
  in the item title, the route is the exam slug); speaking `/speaking/` (missions; Sprechen Teil 1/2/3
  rehearsal titles); X-Ray `/analyze/`; course tests `/modelltest/abschlusstest-a2-1` and
  `/modelltest/abschlusstest-a2-2` as Probe (Tag 5 and Tag 12); the mock `/modelltest/goethe-a2` on Tag 26
  (Versuch 1, gewertet) and Tag 30 (Versuch 2, gewertet); Leitfaden `/leitfaden/goethe-a2/` (external: true)
  as orientation on Tag 1 and again Tag 15; official PDFs Tage 22–23 (external: true).
- Item shape: { id, type, title, minutes, href, external? } with type ∈ lesson|listening|reading|speaking|
  xray|exam|review (same TYPE_ICON set as StartDeutsch1KursPage); ids unique, d<day>-<slug>; titles in
  German inside the level file (short, ≤ 10 words; exam-part names like "Lesen Teil 4" are fine); week
  `intro` strings in German inside the level file (they render as prose).
- Hand-off: the last item of Tag 30 is the second gewertete mock; nothing after (there is no A2.3). The
  plan is reached from /modelltest results, the A2.2 plan's Tag 28 and the Prüfung hub — you do not wire
  that; you only write the module.

## Verifier S/plan/verify.mjs
Loads the module (import it from S/plan), asserts: 5 weeks, 30 days, unique ids, every href matches one of
the allowed classes (/grammar/a2.[12]/<slug>/ with a real slug from grammarTopics.js, /reading/a2.[12],
/listening/a2.2/[1-6], /schreiben/goethe-a2, /speaking/, /analyze/, /modelltest/(goethe-a2|abschlusstest-a2-[12]),
/leitfaden/goethe-a2/, the two goethe.de PDF URLs), external:true exactly on Astro pages + PDFs, no day over
75 min, PROGRAM_MINUTES equals the sum, the mock appears exactly twice (Tage 26 and 30), every German string
passes the ban battery from /home/user/deutschmeister/tests/helpers/a2Bans.mjs and the ≤16-word cap, no
outcome promise. Exit 0 with counts printed. Then notes.md (day map, hour budget, doubts).
