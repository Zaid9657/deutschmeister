-- ============================================================================
-- Abschlusstest A2.1 exam key — Course Factory Wave 4, PR D2
--   (docs/course-factory-tracker.md; course test registered in
--    src/data/courseTests/index.js as 'a2_1_abschluss', formatOf 'goethe_a2')
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- What this does and why: exam_attempts.exam_key is guarded by a CHECK that
-- hardcodes the admitted keys. Every course test re-creates it with the FULL
-- current list — tests/exams.test.mjs reads the newest *abschlusstest*.sql and
-- requires every COURSE_TESTS key and every mock-bearing EXAM_TRACKS key in
-- it, so a later file can never silently narrow an earlier test out.
-- This one adds two keys at once:
--   'goethe_a2'      — the Goethe-Zertifikat A2 track (PR D1 widened
--                      profiles/writing_submissions only; it has no mock yet,
--                      so nothing writes an attempt under it today — admitted
--                      here so the eventual A2 mock needs no CHECK change)
--   'a2_1_abschluss' — the Abschlusstest A2.1 (Kurzversion, Goethe-A2 format,
--                      gated on A2.1 access)
--
-- Test (after applying):
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conname = 'exam_attempts_exam_key_check';
--   -- must list all nine keys below.
--
-- Rollback (only safe if no exam_attempts row uses either new key yet):
--   ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
--   ALTER TABLE public.exam_attempts ADD CONSTRAINT exam_attempts_exam_key_check
--     CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'a1_1_abschluss', 'a1_2_abschluss'));
-- ============================================================================

ALTER TABLE public.exam_attempts
  DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_exam_key_check
  CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'a1_1_abschluss', 'a1_2_abschluss', 'goethe_a2', 'a2_1_abschluss'));
