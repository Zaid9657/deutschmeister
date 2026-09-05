-- ============================================================================
-- A1.1 Abschlusstest exam key — Course Factory Wave 2, PR D
--   (course-test key 'a1_1_abschluss' added to src/data/courseTests/index.js;
--    not an EXAM_TRACKS entry — a course-completion checkpoint, not a new
--    external exam. See src/data/modelltest.js for the distinction.)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- What this does and why: exam_attempts.exam_key is the ONLY table a course
-- test writes to (createAttempt/completeAttempt in src/services/examService.js
-- key every attempt row on exam_key, same as an exam-track mock). Unlike the
-- Goethe A1 exam-key migration (2026-09-05-goethe-a1-exam-key.sql), a course
-- test is deliberately NOT added to writing_submissions.exam_key or
-- profiles.exam_track: it has no writing task of its own (A1.1 owns only the
-- Formular half; see src/data/programs/a11Phase.js) and it is not something a
-- learner "chooses as their exam" in the profile — those two constraints stay
-- exactly as the Goethe A1 migration left them.
-- Constraint name is the unnamed-CHECK default (confirmed against
-- migrations/2026-08-31-exam-attempts.sql, widened once already by
-- 2026-09-05-goethe-a1-exam-key.sql). No other exam key changes — the
-- existing five keep working exactly as before.
--
-- Test (after applying):
--   -- should now succeed (rolled back, not committed):
--   BEGIN;
--     UPDATE public.exam_attempts SET exam_key = 'a1_1_abschluss' WHERE false;
--   ROLLBACK;
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conname = 'exam_attempts_exam_key_check';
--   -- the definition must list 'a1_1_abschluss' alongside the existing five.
--
-- Rollback (narrows back to the pre-Abschlusstest five keys — only safe if no
-- row uses 'a1_1_abschluss' yet):
--   ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
--   ALTER TABLE public.exam_attempts ADD CONSTRAINT exam_attempts_exam_key_check
--     CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1'));
-- ============================================================================

ALTER TABLE public.exam_attempts
  DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_exam_key_check
  CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'a1_1_abschluss'));
