# PR C integration checklist (orchestrator)
- [ ] branch claude/wave5-c-reading-listening from origin/main after PR B merges
- [ ] `node scripts/reading-from-json.mjs S/reading/rewrites-a2.2.json S/reading/exam-format-a2.2.json migrations/2026-09-06-a2-2-reading.sql`
- [ ] `node scripts/listening-questions-from-json.mjs S/listening/questions-a2.2-additions.json S/listening/existing-row-edits.json migrations/2026-09-06-a2-2-listening.sql`
- [ ] C2 renumber to the fixed grid (MC 11/13/15/17/19, rf 12/14/16/18/20 with 3R/3F per position across the six exercises, dictation 21/22/23) — ask in round 2
- [ ] `src/components/ReadingChecks.jsx`: heading derived from the option set ("Wähle a, b oder c" for 3 options; "Wähle a, b, c, d, e, f oder x" otherwise) + English twin; pin in the reading test
- [ ] `content/reading/a2-lessons.json` seed: update the a2.2 entries it holds with the rewrites, append the 2 exam-format rows (mirror test)
- [ ] marketing.js (both twins): READING_LESSON_COUNTS_BY_LEVEL a2.2 8→10, READING_LESSON_COUNT 72→74; public/llms-full.txt "72 leveled reading passages" → 74
- [ ] tests: prc-staging/a2-2-listening.test.mjs, a2-2-reading.test.mjs (derive: rewrites ≤150, exam-format ≤190, Teil-2 keys a/b/c spread, Teil-4 five distinct answers incl. exactly one x, heading pin, seed mirror)
- [ ] README rows ×2, tracker row C; gates; screenshots (one rewrite with checks, the Teil-4 lesson, one dictation item — gated SPA from dist); PR; merge; live apply (reading chunks + listening chunks); verify 10 lessons / 8 ≤150 words with checks / 6×23 questions

# PR D2 integration notes (orchestrator)
- [ ] guarded UPDATE in the D2 migration: speaking_missions row titled "Der Urlaub, der schiefging" (A2.2) →
      "Mein Urlaub: Nichts hat geklappt" (WHERE title = old); verify by SELECT; a22Phase derives the title
- [ ] exam_attempts_exam_key_check re-created with all ten keys (tests/exams.test.mjs reads the newest *abschlusstest*.sql)
- [ ] D1 mock export name: check index.js convention (goetheA1.js exports?) before registering `goetheA2Mock`

# PR D1 integration notes (orchestrator)
- [ ] decision for the tracker log: the Goethe A2 Kurzversion plays BOTH Hören parts once (`playsAllowed: 1`),
      Hören 20 min, total 60 min — the runner's section clock never pauses for audio and ships no stop control,
      so 2 × ~8-min exercises with a default double play (24:25) cannot fit; "halbe Länge" dropped in favour of
      "gekürzt, 20 auto-scored items". Intro/instructions say the real exam plays Teile 1/3/4 twice.
- [ ] verify `src/data/mockExams/goetheA1.js` Hören parts (no questionMax → 23 items each since Wave 2/3): cap
      at 10 in this PR if confirmed; same for goetheB1/telcB1/telcB2/dtz listening parts if they lack it
- [ ] export name in S/exam/goetheA2.js is `goetheA2Mock` — register under the index.js convention
- [ ] `exam_attempts_exam_key_check` already admits goethe_a2 (reviewer verified) — no migration in D1
- [ ] D2a: `tests/exams.test.mjs` course-test consistency loop must handle a `matching` part (per the D2a author);
      extend in the same commit that registers abschlusstestA22 in COURSE_TESTS; exercise #2 (486 s) at playsAllowed 1
- [ ] D1 (verified 2026-09-06): NO mock declares questionMax — goetheA1 (A1.1 #1, A1.2 #2), dtz (A2.2 #1, B1.1 #4),
      goetheB1, telcB1, telcB2. A-level exercises carry 23 questions since Waves 2–5, so goetheA1 presents 46 Hören
      items and dtz's A2.2 part 23 after PR C. Fix in D1: `questionMax: 10` on every mock listening part (B1/B2
      exercises have 10, so a no-op there) + a pin in tests/exams.test.mjs ("every mock listening part declares
      questionMax"); tracker decision entry.
- [ ] D2a (reviewer, verified in code): tests/exams.test.mjs §7 course-test loop branches mc-group/listening/writing
      else assert.fail → copy the §5 MOCK_EXAMS `matching` branch VERBATIM incl. the perfect-sheet entries
      (`perfect[`${part.key}:${t.id}`]`) — scoreObjectiveSections counts matching texts into maxScore, so a bare
      "allow matching" branch swaps the failure for "perfect sheet does not score 100%".
- [ ] C1 post-review: re-letter one or two rewrite choice items so keys use a, b AND c across the 8 (test 4 pin); rerun tests/a2-2-reading.test.mjs
- [ ] C1 round 3 in progress (agent a7870269301fff0ce): R2-B1/R2-B2 + M2-1..11. Reviewer M2-12 (process, mine):
      the JSON was edited (re-lettering) while the review was open, and a pre-review migration/seed sits in the
      repo — FREEZE S/reading/* while a review is open; regenerate migration + seed only after PASS and diff the
      regenerated file against the committed one before flipping #96 to ready. Reviewer pinned md5s in review-2.md.
- [ ] D2a round 3 in progress (agent a4947a75824f14436): singular null-article in lesen-4 ad f + 6 minors; then a
      final delta re-review by a60a8c621043f4ddd before integration.
- [x] D2a PASS (review-3.md, 0 blocking). At integration apply the two header nits myself: backtick the four
      double-quoted withdrawn/foreign German runs in abschlusstestA22.js's header; note in validate-a22's
      NULL_ARTICLE_STRONG comment that it catches initial-position capitalised adjectives only. Keys: lesen-2
      a,b,c,b,c; lesen-4 s1→b s2→e s3→f s4→c s5→x. Hören: A2.2 #2, questionMax 10, playsAllowed 1.
- [x] C merged #96 + applied live (listening 6×23/18 dictation; reading 10 lessons, 8 rewrites md5 44a9ad5f… identical).
- [x] D1 merged #97 (no migration). D2 = draft #98 (branch claude/wave5-d2-a2-2-abschluss, 2bc7c04) — awaiting the
      CI-mirror build + screenshots on the restored tree (a stray `reset --hard` hit the worktree mid-build; recovered).
- [ ] After #98 merges: apply migrations/2026-09-06-a2-2-abschlusstest.sql live (one chunk, 3 statements), verify
      pg_get_constraintdef (ten keys) + the two mission rows; README row Applied; tracker D2 merged; wave close.
- [ ] Wave close: tracker "Wave 5 status: COMPLETE" + live counts; briefs to docs/course-factory/wave5/; carried.md
      items; owner asks (Azure audio, cache dump, unverifiable sandbox items); PR E decision unanswered → hold.
