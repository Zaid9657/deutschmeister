# Wave 4 integration checklists (orchestrator notes; mirror of Wave 3 PRs #73–#77 + new goethe_a2 identity)

Order: PR A → A2 → B → C → D1 → D2. One PR each, serial, draft → CI green → ready → squash-merge
`<subject> (#N)`; migration file + README row; tracker row; branch restarted from origin/main
after each merge. Gates: lint (`--ignore-pattern '.claude/**'`), check:duplicates, npm test,
vite build, offline Astro build from the cache, check-built-html, screenshots. Live apply via
Supabase MCP in ≤27 KB chunks, verify by SELECT, byte-compare with the cache/JSON.

## PR A — four new A2.1 topics (mirror of #73)
- `node scripts/grammar-topics-from-json.mjs --json S/wave4/grammar/{adjective-endings-intro,pronouns-accusative-dative,modal-verbs-past,temporal-prepositions}.json --migration migrations/2026-09-06-a2-1-new-topics.sql --cache grammar-content-cache.json` (hand-fix the header comment; CHECK 1..12 already live — the generator's conditional widening block must be ABSENT or idempotent).
- `src/data/grammarTopics.js`: append a2.1 ids `a2.1-gt9..12` order 9–12 (titleEn/De, descriptions, icon, estimatedTime from the JSON). tests/topic-order.test.mjs pins slug+order vs cache.
- Counts (both marketing.js twins): GRAMMAR_TOPIC_COUNT 76, rule/example/exercise counts re-counted from the cache; comment "(A1.1, A1.2 and A2.1 have 12; every other level has 8)". `public/llms.txt` + `llms-full.txt` counts. 
- `tests/a2-1-course.test.mjs` (copy of a1-2-course: four slugs at A2.1 9–12, title_en ≤45 → page title ≤70, prerequisites resolve).
- Astro `astro-site/src/lib/relatedTopics.js` entries for the four slugs; topicSeo untouched.
- Screenshots `/grammar/a2.1/<slug>/` ×4. Live: apply in chunks; verify 76 topics, per-topic rows byte-identical to the cache.

## PR A2 — extend the 8 existing A2.1 topics
- `node scripts/grammar-topics-from-json.mjs --json S/wave4/extend/typed-a2.1/*.json --migration migrations/2026-09-06-a2-1-typed-production.sql --cache grammar-content-cache.json` (run AFTER PR A's cache is on main so ids/counters are current).
- Counts re-derived. `tests/a2-1-typed-production.test.mjs`: every A2.1 topic (12) has ≥10 typed exercises with options null (the 4 new ones from PR A satisfy this via their 16); the three depth-patched topics have ≥7 rules and ≥12 examples; migration shape counts pinned.
- Screenshot one old topic's stage-5 typed input.

## PR B — A2.1 Wortliste (mirror of #75)
- `node scripts/words-from-json.mjs --additions S/wave4/vocab/words-a2.1-additions.json --fixes S/wave4/vocab/words-a2.1-fixes.json --out migrations/2026-09-06-a2-1-wortliste.sql --wave-label "Course Factory Wave 4, PR B"`.
- VOCAB_WORD_COUNT 2215 + additions (both twins). `tests/a2-1-wortliste.test.mjs` mirror (fix guards, category set, no article prefix, no null plural). LevelPage category trainer generic.
- Live: apply; verify count at a2.1, 0 article-prefix rows, 0 null plurals. Then the owner runs the Azure audio script for the new words (`--table words`).

## PR C — A2.1 reading + listening (mirror of #76)
- `node scripts/reading-from-json.mjs S/wave4/reading/rewrites-a2.1.json S/wave4/reading/exam-format-a2.1.json migrations/2026-09-06-a2-1-reading.sql`; READING_LESSON_COUNTS_BY_LEVEL a2.1 10, READING_LESSON_COUNT 72.
- `node scripts/listening-questions-from-json.mjs S/wave4/listening/questions-a2.1-additions.json S/wave4/listening/existing-row-edits.json migrations/2026-09-06-a2-1-listening.sql`.
- `src/components/ReadingChecks.jsx`: the heading is hard-coded "Richtig oder falsch?" — make it conditional (all-choice lesson → "Wähle a, b oder c", mixed → keep) so the two exam-format lessons render correctly; pin in the reading test.
- `tests/a2-1-reading.test.mjs` + `tests/a2-1-listening.test.mjs` mirrors. Screenshots: one rewrite with checks, one exam-format lesson, one dictation item.
- Live: apply in chunks; verify 8 rewrites have checks + word_count ≤150, 10 lessons, 6×23 questions.

## PR D1 — goethe_a2 exam identity (NEW this wave)
- `src/data/examTracks.js` + astro twin: append goethe_a2 (courseHref null, hasMock false, hasWriting true).
- `astro-site/src/data/guides/goethe-a2.js` + GUIDES registry line + `astro-site/src/data/exams/index.js` (GUIDES_BY_SLUG + HUB_COPY.goethe_a2) + `scripts/check-built-html.mjs` MANIFEST rows `leitfaden/goethe-a2/index.html` and `pruefung/goethe-a2/index.html`.
- `src/data/writingTasks.js`: 4 goethe_a2 tasks (SchreibenPage picks by exam track — verify the picker shows the new track; `tests/claims.test.mjs` may parse pointsNote figures — check).
- Migration `2026-09-06-goethe-a2-track.sql`: widen `profiles_exam_track_check` (+goethe_a2), `writing_submissions_exam_key_check` (+goethe_a2). (exam_attempts widened in D2.)
- SPA surfaces that enumerate EXAM_TRACKS: IntroSlides, ProfilePage, ModelltestHub (hasMock false → no mock card; confirm no crash), DashboardPage readiness (keyed on exam_track — confirm a track without a mock renders the readiness panel gracefully or hides it), SchreibenPage.
- tests: exams.test.mjs registry integrity (guide file exists, flags match), guides.test.mjs (new guide passes all), check-built-html on the offline Astro build. Screenshots `/leitfaden/goethe-a2/`, `/pruefung/goethe-a2/`, `/schreiben` with goethe_a2.
- Live: apply the CHECK migration; verify with pg_get_constraintdef.

## PR D2 — Abschlusstest A2.1 + a21Phase (mirror of #77)
- `src/data/courseTests/abschlusstestA21.js` + registry entry {key a2_1_abschluss, slug abschlusstest-a2-1, level 'a2.1', formatOf 'goethe_a2'}.
- `migrations/2026-09-06-a2-1-abschlusstest.sql`: exam_attempts CHECK list + a2_1_abschluss (tests/exams.test.mjs reads the newest *abschlusstest*.sql — list ALL keys).
- `src/data/programs/a21Phase.js` + `src/pages/A21PhasePage.jsx` (copy of A12PhasePage, LevelSubscriptionGuard level="a2.1") + App.jsx route `/a2-1-phase` + netlify.toml allow-list + LevelPage PHASE_PLAN 'a2.1' + ModelltestHub PHASE_PLAN_BY_LEVEL + ModelltestResult COURSE_NEXT (a2_1_abschluss → /level/a2.2) + examTracks goethe_a2.courseHref → '/a2-1-phase' (both twins) + a12Phase Tag-28 hand-off stays SD1 (A1 path) — do NOT redirect A1 learners to A2.1.
- tests: purchases.test.mjs (a21_phase item ids unique, hrefs resolve, route+allow-list+guard pinned), exams.test.mjs (course test guards incl. questionMax), readiness test if any.
- Screenshots: /a2-1-phase, /modelltest (Kurstests), /modelltest/abschlusstest-a2-1, result.
- Live: apply CHECK migration; verify.

## Close
Tracker: Wave 4 COMPLETE paragraph, rows A/A2/B/C/D1/D2 with PR numbers, decisions (goethe_a2 minimal track without mock; no new missions for the 4 new topics; D split into D1/D2), live verification counts; owner asks (Azure audio for new words + examples; rotate the Azure key; Goethe URLs unverifiable from sandbox → owner spot-check).
