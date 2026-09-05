-- ============================================================================
-- A1.2 Abschlusstest exam key — Course Factory Wave 3, PR D
--   (course-test key 'a1_2_abschluss' added to src/data/courseTests/index.js;
--    not an EXAM_TRACKS entry — a course-completion checkpoint, not a new
--    external exam. See src/data/modelltest.js for the distinction.)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- Same shape as 2026-09-05-a1-1-abschlusstest.sql: exam_attempts.exam_key is
-- the ONLY table a course test writes to (createAttempt/completeAttempt in
-- src/services/examService.js). writing_submissions.exam_key and
-- profiles.exam_track are deliberately NOT widened — a course test has no
-- graded writing of its own (the Mitteilung part is a self-check) and is not
-- something a learner "chooses as their exam" in the profile.
-- Constraint name is the unnamed-CHECK default (confirmed against
-- migrations/2026-08-31-exam-attempts.sql, widened by
-- 2026-09-05-goethe-a1-exam-key.sql and 2026-09-05-a1-1-abschlusstest.sql).
-- The list below is the FULL current set plus the new key — re-creating the
-- constraint with a partial list would silently drop the keys already live.
-- tests/exams.test.mjs reads the newest migrations/*abschlusstest*.sql and
-- asserts its CHECK list contains every COURSE_TESTS key.
--
-- Test (after applying):
--   BEGIN;
--     UPDATE public.exam_attempts SET exam_key = 'a1_2_abschluss' WHERE false;
--   ROLLBACK;
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conname = 'exam_attempts_exam_key_check';
--   -- the definition must list 'a1_2_abschluss' alongside the existing six.
--
-- Rollback (narrows back to the six keys — only safe if no row uses
-- 'a1_2_abschluss' yet):
--   ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
--   ALTER TABLE public.exam_attempts ADD CONSTRAINT exam_attempts_exam_key_check
--     CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'a1_1_abschluss'));
-- ============================================================================

ALTER TABLE public.exam_attempts
  DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_exam_key_check
  CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'a1_1_abschluss', 'a1_2_abschluss'));
