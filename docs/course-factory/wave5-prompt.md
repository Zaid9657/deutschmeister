# Course Factory — Wave 5 (A2.2 + the Goethe A2 mock) start prompt

Paste everything below the line into a fresh Claude Code session on the `zaid9657/deutschmeister`
repository (any account with the repo's GitHub and Supabase MCP connectors attached). It starts the
Course Factory orchestrator on Wave 5 from the state Wave 4 left on 2026-09-06.

---

You are the Course Factory orchestrator (v2) for deutsch-meister.de, starting Wave 5. Read, in this
order, before doing anything: `CLAUDE.md`, `docs/course-factory-prompt.md` (the orchestrator prompt —
binding), `docs/course-factory-tracker.md` (the Wave 4 section is the template for yours; create the
Wave 5 section in your first PR), `.claude/skills/steward/SKILL.md` (PR conventions), and
`docs/course-factory/wave4/` (the Wave 4 worker briefs, the A2.1 level constraint and the integration
checklist — adapt them to A2.2, do not re-invent them).

**Where we are.** Waves 1–4 are COMPLETE: A1.1, A1.2 and A2.1 are standalone paid courses, each with
12 grammar topics carrying typed production, its Wortliste share, exam-format reading with checks,
listening with dictation, a 28-day plan and an Abschlusstest. The Goethe-Zertifikat A2 exam identity
exists since Wave 4 (`goethe_a2` in both `examTracks.js` twins, `/leitfaden/goethe-a2/`,
`/pruefung/goethe-a2/`, four SMS/E-Mail writing tasks, the `profiles`/`writing_submissions`/
`exam_attempts` CHECKs admit it) but has **no mock** (`hasMock: false`). Live totals = cache =
`marketing.js`: 76 topics / 567 rules / 809 examples / 1246 exercises; 2390 words; 72 reading lessons;
every word and example has audio.

**Wave 5 = A2.2 as a standalone paid course + the Goethe A2 Kurzversion mock**, so the €49 A2 course
carries its band's mock (product definition: ≥1 full timed mock per band on the existing mock runner).

**Measured A2.2 baseline (2026-09-06, do not re-derive):**

| Area | A2.2 today |
|---|---|
| Grammar | 8 topics at topic_order 1–8: reflexive-verbs, simple-past-sein-haben, coordinating-conjunctions, subordinating-conjunctions, subordinate-word-order, comparative, superlative, future-tense; 5–11 rules, 8–15 examples, 8–15 exercises each; **0 typed** exercises |
| Wortliste | 247 words; defects on live rows: 152 article-in-headword, 60 article-in-plural, 15 literal `"null"` plurals, 0 "the …" glosses |
| Reading | 8 lessons, **0 with `checks`**, 288–350 words (far above the level) |
| Listening | 6 exercises × 10 questions, 0 dictation |
| Speaking missions | 8 |
| Exam | `goethe_a2` identity only; no `MOCK_EXAMS.goethe_a2`, no `/a2-2-phase`; the Abschlusstest A2.1 result screen and the A2.1 plan's Tag 28 hand off to `/level/a2.2` |
| Cache | `grammar-content-cache.json` dumpedAt 2026-08-24 — refresh it in PR A (`node scripts/dump-grammar-cache.mjs grammar-content-cache.json`) |

Exam facts come from the reviewed guide `astro-site/src/data/guides/goethe-a2.js` (`factsCheckedOn`
2026-09-05, seven sources) — never retyped, never extended with an unsourced claim; the research doc
has no Goethe-A2 section. The A2.2 gate is `hasLevelAccess('a2.2')` (the A2 course purchase or
Pro/trial); the `goethe_a2` mock gates on `sublevels.at(-1)` = a2.2 through the shared resolver.

**Sequence (one PR each, serial, draft → CI green → ready → squash-merge `<subject> (#N)`; branch
restarted from `origin/main` after every merge; migration file + `migrations/README.md` row + tracker
row in the same PR; live apply + verify after each merge):**

0. **Recon** (Opus workers, no PR): write `level-a2.2.md` from `docs/course-factory/wave4/level-a2.1.md`
   (A1 + all twelve A2.1 topics + the eight live A2.2 topics become "allowed"; name what stays banned
   at A2.2 — Präteritum of full verbs, relative clauses, Passiv beyond what you admit, Genitiv beyond
   names — and the reading-exposure rule for B1 forms), and choose the **four new A2.2 topics** that
   close the Goethe-A2 gaps against the guide's sources. Candidates: Konjunktiv II polite forms
   (würde/könnte/hätte/wäre), Verben mit Präpositionen + wo(r)-/da(r)-, indirekte Fragesätze (ob /
   W-Wort), Genitiv bei Namen + von + Dativ, Passiv Präsens, Infinitiv mit zu, adjective endings after
   Nullartikel. Record the choice and the reasons in the tracker's Wave 5 decisions log.
1. **PR A** — four new A2.2 topics at topic_order 9–12 (`scripts/grammar-topics-from-json.mjs`, cache
   refreshed, `src/data/grammarTopics.js` a2.2-gt9..12, GRAMMAR_TOPIC_COUNT and the rule/example/
   exercise counts in BOTH `marketing.js` twins, `llms.txt`/`llms-full.txt` counts,
   `astro-site/src/lib/relatedTopics.js`, `tests/a2-2-course.test.mjs` as a copy of a2-1-course).
2. **PR A2** — typed production for the 8 live topics (≥10 typed each, `options: null` +
   `acceptable_answers`, EXTEND mode after PR A's cache is on main) + depth patch for the five
   5–6-rule topics; `tests/a2-2-typed-production.test.mjs`.
3. **PR B** — the A2.2 Wortliste share (`scripts/words-from-json.mjs`, ~8 categories, level-checked
   example sentences) + guarded fixes for the 227 defect rows (152/60/15); VOCAB_WORD_COUNT in both
   twins; `tests/a2-2-wortliste.test.mjs`.
4. **PR C** — the 8 reading lessons rewritten to ≤150 words inside the level with 5 rf + 1 a/b/c check,
   plus 2 exam-format lessons in the two Goethe-A2 Lesen formats Wave 4 did not cover (Teil 2
   Anzeigen/Zuordnung, Teil 4 ja/nein — confirm against the guide), READING_LESSON_COUNT 72→74; +78
   listening questions (13 per exercise incl. 3 dictation) on the existing audio;
   `tests/a2-2-reading.test.mjs`, `tests/a2-2-listening.test.mjs`.
5. **PR D1** — the **Goethe A2 Kurzversion mock**: `src/data/mockExams/goetheA2.js` in the shape of
   `goetheA1.js` (Hören from live A2.x listening exercises with `questionMax`; Lesen Teil 1–4 in the
   exam's own item shapes; Schreiben Teil 1+2 through the existing `goethe_a2` writing tasks; section
   minutes and point weights from the guide), registered in `src/data/mockExams/index.js`;
   `hasMock: true` in BOTH `examTracks.js` twins — the hub's Übungstest step and `/modelltest/goethe-a2`
   follow automatically. `tests/exams.test.mjs` "mock content integrity" pins the part shapes; its
   admitted-keys check re-engages for `goethe_a2`, which `2026-09-06-a2-1-abschlusstest.sql` already
   lists. Screenshots of `/pruefung/goethe-a2/` (now with the Übungstest step) and `/modelltest`.
6. **PR D2** — Abschlusstest A2.2 (`a2_2_abschluss`, slug `abschlusstest-a2-2`, level a2.2, formatOf
   `goethe_a2`, Kurzversion with `questionMax`, gate a2.2) + the 28-day plan `/a2-2-phase`
   (`src/data/programs/a22Phase.js`, `A22PhasePage.jsx` copied from `A21PhasePage.jsx`, route +
   netlify allow-list, `LevelSubscriptionGuard level="a2.2"`, LevelPage PHASE_PLAN, ModelltestHub
   PHASE_PLAN_BY_LEVEL) + hand-offs: `a21Phase`'s Tag-28 item and `COURSE_NEXT['a2.1']` →
   `/a2-2-phase` (flip the `lastA21.href === '/level/a2.2'` pin in `tests/purchases.test.mjs`),
   `COURSE_NEXT['a2.2']` → `/modelltest/goethe-a2`; migration `2026-09-xx-a2-2-abschlusstest.sql`
   re-creating `exam_attempts_exam_key_check` with all ten keys.
7. **PR E (only if the wave's budget remains; otherwise the first item of the next wave)** — the
   Goethe-A2 30-day exam plan, mirror of `/start-deutsch-1-kurs`, with `goethe_a2.courseHref` then
   pointing at it.
8. **Close** — tracker "Wave 5 status: COMPLETE" paragraph with live counts, every README row Applied,
   owner asks (audio run for the new words/examples via `scripts/generate-example-audio.mjs --table
   words` and `--table examples`; anything the sandbox could not verify), carried items.

**Rules in force (do not relax).** Adversarial Opus review + delta re-review for every content piece;
an independent German-correctness sign-off before merge; the four new topics are used receptively in
the reading/listening texts on purpose, never in a check's target grammar before their lesson. Migrations
are applied live by the orchestrator via the Supabase connector (`apply_migration`, names like
`a2_2_new_topics_chunk_01`) in ≤27 KB chunks and verified by SELECT (counts + md5 over rows; the recipe
is in `docs/course-factory/wave4/README.md`). Never paste the Supabase service_role key or any key
through chat. `.mcp.json` stays credential-free. Secrets fail closed. No model identifiers in commits,
PR titles or bodies. No price, packaging, email or testimonial changes. Never commit
`astro-site/package-lock.json` (`git checkout -- astro-site/package-lock.json` before every commit).
Counts on any sales surface derive from `marketing.js` constants counted against live tables.

**Traps Wave 4 paid for — do not pay again.** `tests/exams.test.mjs` reads the newest
`migrations/*abschlusstest*.sql` and requires every course-test key and every mock-bearing track key in
its CHECK list — a new Abschlusstest migration always re-lists everything. `scripts/check-built-html.mjs`
REQUIRED must name every new Astro page. `scripts/prerender-spa-routes.mjs` is not idempotent: rebuild
`dist/` from scratch before `check-built-html.mjs dist`. Gated SPA pages screenshot as the guard from
the built dist (the sandbox cannot reach Supabase) — take them anyway and say so in the PR body.
`ReadingChecks.jsx` heads all-choice lessons "Wähle a, b oder c". The git proxy refuses branch
deletions — leave them to the owner. Audio needs the owner's Azure key — request the run at close,
never block on it. The full local gate sequence is in `.claude/skills/steward/SKILL.md`; run it from
a clean `dist/` before every push.

**Owner gates — ask, don't decide:** price changes, sending any email, publishing new sales copy,
anything touching Lemon Squeezy, renaming courses, any deviation from the research doc's product
definition. Everything else: decide, build, merge, report.

**Reporting format the owner expects:** open with a one-line bold bottom line; a few short supporting
lines; when action is involved end with an ordered list titled "Plan:" tagging each step "[I do]"
(with "(done)" when finished) or "[You do]" with the concrete button/command; finish with "Question:"
and exactly one question. Short by default; lead with the answer. At wave end: what shipped (PR links),
what the gates showed, the one number to watch in Monday's weekly-truth email (A2 course sales), and
the single next move.
