-- ============================================================================
-- Goethe-Zertifikat A2 exam track key — Course Factory Wave 4, PR D1
--   (docs/course-factory-tracker.md; key added to src/data/examTracks.js and
--    its astro twin as 'goethe_a2', with the Leitfaden, the /pruefung/ hub and
--    four SMS/E-Mail writing tasks)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- What this does and why: the profile exam-goal picker (profiles.exam_track)
-- and the writing grader (writing_submissions.exam_key, evaluate-writing.mjs)
-- both sit behind CHECK constraints that hardcode the exam-key list. Without
-- widening them, choosing "Goethe-Zertifikat A2" as a goal or submitting one
-- of the goethe_a2 tasks fails on INSERT/UPDATE.
--   profiles.exam_track            (last widened by 2026-09-05-goethe-a1-exam-key.sql)
--   writing_submissions.exam_key   (same)
-- exam_attempts.exam_key is deliberately NOT touched here: goethe_a2 has no
-- mock yet (hasMock: false), so nothing can write an attempt under that key.
-- PR D2's 2026-09-06-a2-1-abschlusstest.sql re-creates that CHECK with the
-- full list (incl. goethe_a2 and a2_1_abschluss); tests/exams.test.mjs reads
-- the newest *abschlusstest*.sql for it.
--
-- Test (after applying):
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conname IN ('writing_submissions_exam_key_check', 'profiles_exam_track_check');
--   -- both definitions must list 'goethe_a2' after 'goethe_a1'.
--
-- Rollback (only safe if no row uses 'goethe_a2' yet):
--   ALTER TABLE public.writing_submissions DROP CONSTRAINT IF EXISTS writing_submissions_exam_key_check;
--   ALTER TABLE public.writing_submissions ADD CONSTRAINT writing_submissions_exam_key_check
--     CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1'));
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_exam_track_check;
--   ALTER TABLE public.profiles ADD CONSTRAINT profiles_exam_track_check
--     CHECK (exam_track IS NULL OR exam_track IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'none'));
-- ============================================================================

ALTER TABLE public.writing_submissions
  DROP CONSTRAINT IF EXISTS writing_submissions_exam_key_check;
ALTER TABLE public.writing_submissions
  ADD CONSTRAINT writing_submissions_exam_key_check
  CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'goethe_a2'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_exam_track_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_exam_track_check
  CHECK (exam_track IS NULL OR exam_track IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'goethe_a2', 'none'));
