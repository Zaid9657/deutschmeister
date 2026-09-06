# Wave 4 PR D1 — Goethe-Zertifikat A2 as an exam identity (track + Leitfaden + hub copy + writing tasks)

Read `S/wave4/common-header.md`, then in the repo:
- `src/data/examTracks.js` (+ its byte-identical twin under astro-site/src/data/), the header's
  fact discipline; `astro-site/src/data/guides/index.js` (Guide typedef + rules) and
  `astro-site/src/data/guides/start-deutsch-1.js` (the closest template — an A-level Goethe exam);
  `astro-site/src/data/exams/index.js` (HUB_COPY shape); `src/data/writingTasks.js` (task shape,
  registers: informell / halbformell / formell / formular; the goethe_a1 block); `tests/guides.test.mjs`,
  `tests/exams.test.mjs` (what is pinned: title ≤60, description 50–160, answer 45–120 words,
  no fee, no outcome promise, internal-link trailing slashes, sources ≥1, hasWriting ⇔ tasks exist).

Facts to establish with WebSearch (goethe.de is blocked from this sandbox: cite Goethe's own URLs
as sources but mark in notes which ones you could not open; use ≥2 secondary sources for each
figure and record them): Goethe-Zertifikat A2 (Erwachsene) — the four parts, minutes, items per
Teil, points (25 per part, 100 total), the pass rule (45/75 in the written parts + 15/25 in
Sprechen), pair oral exam, Schreiben Teil 1 (SMS/Nachricht, ~20–30 Wörter, 3 Leitpunkte) and
Teil 2 (E-Mail halbformell, ~30–40 Wörter, 3 Leitpunkte), who typically needs A2 in Germany
(Aufenthalt/Ausbildung contexts — be careful and cite; do NOT state visa law you cannot source),
Modellsatz availability. `factsCheckedOn` = the date you verify.

## Deliverables (all under S/wave4/exam/)
1. `goethe-a2.js` — `export const goetheA2 = {…}` Guide module, slug 'goethe-a2', title ≤60 chars
   (e.g. "Goethe-Zertifikat A2: Leitfaden 2026"), h1, description 50–160, keywords, badge
   'Leitfaden', lead (may use <strong>), answer 45–120 words (definition-first, restates only
   figures that also appear in sections), datePublished '2026-09-06', factsCheckedOn, sources[],
   sections[] (ids anchor-safe: ueberblick, aufbau (table: Teil | Dauer | Aufgaben | Punkte), punkte
   (pass rule), anmeldung, lernplan (steps block, 8–12 Wochen, realistic), fehler (warnings
   block), vorbereitung-mit-deutschmeister (cards, product counts imported from ../marketing.js —
   never typed; link the A2.1 course area as `/level/a2.1` (SPA route, no slash) and the grammar
   library `/grammar/a2.1/` (Astro, slash))), faq (≥6 q/a), cta {heading, body}. German, du-form
   consistent with start-deutsch-1.js. No fee figures, no "du bestehst", no pass-rate promises.
2. `examTracks.entry.js` — the object literal to append to EXAM_TRACKS: key 'goethe_a2', slug
   'goethe-a2', nameDe 'Goethe-Zertifikat A2', level 'A2', sublevels ['a2.1','a2.2'], guideSlug
   'goethe-a2', courseHref null (PR D2 flips it to '/a2-1-phase'), hasMock false, hasWriting true,
   with a comment block in the file's style.
3. `hub-copy.js` — the HUB_COPY.goethe_a2 object {title (≤60, "… | DeutschMeister"), description,
   intro, focus} in the voice of the existing entries.
4. `writingTasks.goethe-a2.js` — 4 task objects (examKey 'goethe_a2'): two Teil-1 tasks
   (taskKey 'sms-…', register 'informell', minWords 20, maxWords 40, 3 Leitpunkte each, e.g.
   Einladung absagen / Treffen verschieben) and two Teil-2 tasks (taskKey 'email-…', register
   'halbformell', minWords 30, maxWords 60, 3 Leitpunkte: Kursanmeldung / Termin beim Amt /
   Nachbarn um Hilfe bitten). pointsNote states the Teil's points and the pass rule as verified.
   All task text inside the A2.1 level constraint.
5. `notes.md` — sources table (URL, opened?/blocked, what it confirmed), doubts, and the list of
   internal links you used with their trailing-slash case.
Run `node --check` on every .js file. Mirror tests/guides.test.mjs checks by hand in a small
`verify.mjs` (title length, description length, answer word count, fee/outcome regex from the
test, section id uniqueness, link slash rules) and run it clean.
