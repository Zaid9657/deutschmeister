# Course Factory — Wave 4 (A2.1) handoff prompt

Paste everything below the line into a fresh Claude Code session on the `zaid9657/deutschmeister`
repository (any account with the repo's GitHub and Supabase MCP connectors attached). It resumes the
Course Factory orchestrator exactly where the previous session stopped on 2026-09-06 ~09:10 UTC.

---

You are the Course Factory orchestrator (v2) for deutsch-meister.de. Read, in this order, before doing
anything: `CLAUDE.md`, `docs/course-factory-prompt.md` (the orchestrator prompt — it is binding),
`docs/course-factory-tracker.md` (the Wave 4 section is the live ledger), `.claude/skills/steward/SKILL.md`
(PR conventions), and this folder: `docs/course-factory/wave4-handoff/`.

**Where we are.** Wave 4 = A2.1 as a standalone paid course, same shape as Waves 2–3
(recon → PR A → A2 → B → C → D1 → D2 → close; one PR each, serial). Status:

| PR | Content | State |
|---|---|---|
| A | 4 new A2.1 grammar topics (adjective-endings-intro, pronouns-accusative-dative, modal-verbs-past, temporal-prepositions) | merged #82, applied live, md5-verified |
| A2 | typed production for the 8 live A2.1 topics + depth patch | merged #83, applied live, 118 rows md5-verified (76/567/809/1246 totals = cache) |
| B | A2.1 Wortliste: 175 additions + 208 fixes | merged #84, applied live, verified (423 a2.1 words, 2390 total, 0 defects at a2.1, additions md5-identical to source) |
| C | reading rewrites + 2 Goethe-A2-format lessons + 78 listening questions + ReadingChecks heading | merged #85, applied live 2026-09-06, verified (72 lessons; 10 A2.1 lessons all with checks: 6/6/6/6/6/6/6/6/5/5, max 144 words; 6×23 A2.1 questions; 54 dictation rows; option fix live) |
| D1 | `goethe_a2` exam identity (track + Leitfaden + hub copy + 4 writing tasks + CHECK migration) | content authored, reviewed, accepted — not integrated |
| D2 | Abschlusstest A2.1 + 28-day plan `/a2-1-phase` + hand-offs | content authored, reviewed, accepted — not integrated |

Work branch: `claude/course-factory-orchestrator-v2-fn364h` (restarted from main at `7bae3e9`, clean; push with `--force-with-lease` after each restart).
Supabase project: `omqyueddktqeyrrqvnyq`. The scratchpad this handoff carries used to live at a path
called `S` in the briefs; it is now `docs/course-factory/wave4-handoff/scratchpad/` — every `S/wave4/...`
reference in the notes and checklists means that folder. Do NOT integrate the handoff folder into product
code and do NOT merge the carrier PR; the folder is reference material only. Delete the carrier branch at
wave close.

**Step 1 — DONE in the previous session.** PR #85 merged (`7bae3e9`), both migrations applied live and verified (numbers in the table above). Two bookkeeping items remain and belong in the PR D1 commit: flip the `2026-09-06-a2-1-reading.sql` and `2026-09-06-a2-1-listening.sql` rows in `migrations/README.md` to **Applied 2026-09-06** (reading: 2 chunks; listening: 2 chunks; the verified counts above), and set the tracker's C row to `merged, DB migrated 2026-09-06 (…) | #85`.

**Step 2 — PR D1** (`scratchpad/integration-checklist.md` § PR D1, `scratchpad/exam/notes.md` §7–9):
- `scratchpad/exam/examTracks.entry.js` → paste the literal into BOTH `src/data/examTracks.js` and
  `astro-site/src/data/examTracks.js` directly after `goethe_a1` (courseHref null, hasMock false,
  hasWriting true).
- `scratchpad/exam/goethe-a2.js` → `astro-site/src/data/guides/goethe-a2.js`; register in
  `astro-site/src/data/guides/index.js` GUIDES (after startDeutsch1); `astro-site/src/data/exams/index.js`:
  import, add to GUIDES_BY_SLUG as `'goethe-a2'`, add `HUB_COPY.goethe_a2` from `scratchpad/exam/hub-copy.js`
  after `goethe_a1`.
- `scratchpad/exam/writingTasks.goethe-a2.js` → append the 4 tasks to the end of WRITING_TASKS in BOTH
  `src/data/writingTasks.js` and `netlify/functions/_shared/writingTasks.mjs` (byte-identical twins).
- `scripts/check-built-html.mjs` MANIFEST: add `leitfaden/goethe-a2/index.html` and `pruefung/goethe-a2/index.html`.
- `tests/guides.test.mjs`: add `'/level/a2.1'` to `NO_SLASH_ROUTES` (the guide links the SPA course area).
- Migration `migrations/2026-09-06-goethe-a2-track.sql`: DROP/ADD `profiles_exam_track_check` with
  `('telc_b1','goethe_b1','dtz','telc_b2','goethe_a1','goethe_a2','none')` and
  `writing_submissions_exam_key_check` with `('telc_b1','goethe_b1','dtz','telc_b2','goethe_a1','goethe_a2')` —
  first read the CURRENT live definitions with `pg_get_constraintdef` (see `migrations/2026-09-05-goethe-a1-exam-key.sql`
  for the shape) and widen exactly those lists; `exam_attempts` is widened in D2.
- SPA surfaces that enumerate EXAM_TRACKS (IntroSlides, ProfilePage, ModelltestHub "coming" list,
  SchreibenPage picker, DashboardPage readiness) already handle no-mock tracks (goethe_b1/dtz) — confirm no crash.
- README row + tracker row D1; tests `exams.test.mjs`/`guides.test.mjs`; run the full CI mirror (lint,
  check:duplicates, npm test, vite build, offline Astro build with `GRAMMAR_CONTENT_CACHE=../grammar-content-cache.json`,
  the netlify.toml copy chain, prerender, `check-built-html.mjs dist`); screenshots of `/leitfaden/goethe-a2/`
  and `/pruefung/goethe-a2/` from the built dist (`npx serve -l 8811 dist` + playwright, see `scratchpad/shot-pr-a.mjs`).
- Draft PR → CI green → ready → squash-merge → apply the CHECK migration live → verify with pg_get_constraintdef.
- Owner ask to record: the five goethe.de URLs in the guide's `sources[]` could not be opened from the sandbox;
  `curl -I` them from an unrestricted network (notes §9).

**Step 3 — PR D2** (`scratchpad/integration-checklist.md` § PR D2, `scratchpad/test/notes.md`, `scratchpad/plan/notes.md`):
- `scratchpad/test/abschlusstestA21.js` → `src/data/courseTests/abschlusstestA21.js`; registry entry
  `{key 'a2_1_abschluss', slug 'abschlusstest-a2-1', level 'a2.1', formatOf 'goethe_a2'}` in `src/data/courseTests/index.js`.
  Runner change in `src/pages/Modelltest/ModelltestRun.jsx` `MockListeningPart`: add
  `const playsAllowed = part.playsAllowed ?? PLAYS_ALLOWED;` and point the canPlay guard and the "Noch …× abspielbar"
  label at it (the test's Hören plays once). Port `scratchpad/test/validate-a21.test.mjs` into `tests/`.
- Migration `migrations/2026-09-06-a2-1-abschlusstest.sql`: `exam_attempts_exam_key_check` listing ALL keys
  `('telc_b1','goethe_b1','dtz','telc_b2','goethe_a1','a1_1_abschluss','a1_2_abschluss','goethe_a2','a2_1_abschluss')`
  (tests/exams.test.mjs reads the newest *abschlusstest*.sql).
- `scratchpad/plan/a21Phase.js` → `src/data/programs/a21Phase.js`; `src/pages/A21PhasePage.jsx` (copy of
  A12PhasePage with LevelSubscriptionGuard level="a2.1"); route `/a2-1-phase` in `src/App.jsx` + netlify.toml
  SPA allow-list (three-place rule); LevelPage PHASE_PLAN 'a2.1'; ModelltestHub PHASE_PLAN_BY_LEVEL;
  ModelltestResult COURSE_NEXT (a2_1_abschluss → `/level/a2.2`); examTracks goethe_a2.courseHref → '/a2-1-phase'
  in both twins (this is the brief's default — the owner never answered whether the Prüfungen hub course button
  should link `/a2-1-phase`; keep the default and put the question in the final report). a12Phase's Tag-28
  hand-off stays SD1; never redirect A1 learners to A2.1.
- Tests: purchases.test.mjs (plan item ids unique, hrefs resolve, route+allow-list+guard), exams.test.mjs
  (course-test guards incl. questionMax/playsAllowed pin), port `scratchpad/plan/verify.mjs` checks.
- Screenshots `/a2-1-phase`, `/modelltest`, `/modelltest/abschlusstest-a2-1`. Draft PR → CI → merge → apply the
  CHECK migration live → verify.

**Step 4 — close the wave.** Tracker: Wave 4 COMPLETE paragraph, all rows with PR numbers and live counts;
migrations README rows Applied. Owner asks: run `scripts/generate-example-audio.mjs --table words` (175 new
A2.1 words have `audio_url` null) and `--table examples` (the 52 new examples from PR A/A2); rotate the Azure
Speech key that was pasted through chat earlier; spot-check the goethe.de URLs; content tickets carried from
the listening review (ex1 q1/q3 stems carry Genitiv, ex1 q9 wording, speaker labels, "Letzer Aufruf" typo in
a transcript). Carried item already logged: 688 Wortliste rows at a2.2/b1/b2 still carry article-in-headword
or `"null"` plurals. Delete the carrier branch `claude/wave4-handoff` and close its PR.

**Rules in force (do not relax).** Adversarial Opus review + delta re-review for every content piece (all
Wave 4 content is already accepted; only integration remains). Migrations are applied live by the
orchestrator via Supabase MCP in ≤27 KB chunks and verified by SELECT (counts + md5 over rows; Postgres jsonb
text has keys sorted by length then bytes with `", "` separators; use `COLLATE "C"` in ORDER BY when hashing
text with umlauts against a Node-side hash). Never paste the Supabase service_role key or any key through
chat. Never commit `astro-site/package-lock.json` — the session-start install churns it; `git checkout --
astro-site/package-lock.json` before every commit. `.mcp.json` stays credential-free. Secrets fail closed. No
model identifiers in commits, PR titles or bodies. No price, packaging, email or testimonial changes. Squash-merge
titled `<subject> (#N)`. `S/wave4/level-a2.1.md` (here `scratchpad/level-a2.1.md`) is the binding A2.1 level
constraint, including the "Reading exposure ruling" and the "Wortliste exception".

**Reporting format the owner expects** (from their preferences): open with a one-line bold bottom line; a
few short supporting lines; when action is involved end with an ordered list titled "Plan:" tagging each step
"[I do]" (with "(done)" when finished) or "[You do]" with the concrete button/command; finish with
"Question:" and exactly one question. Short by default; lead with the answer.
