-- ============================================================================
-- Goethe A1 (Start Deutsch 1) exam key — Course Factory Wave 1, step 1
--   (docs/course-factory-tracker.md; key added to src/data/examTracks.js as
--    'goethe_a1')
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- What this does and why: three earlier migrations each hardcoded the same
-- four-value exam-key enum in a CHECK constraint before 'goethe_a1' existed —
-- widening all three is what lets the A1 writing strand (evaluate-writing.mjs)
-- and any future A1 mock/exam-attempt row actually insert:
--   writing_submissions.exam_key  (2026-08-31-writing-submissions.sql)
--   exam_attempts.exam_key        (2026-08-31-exam-attempts.sql)
--   profiles.exam_track           (2026-08-31-exam-profile.sql)
-- Constraint names are the unnamed-CHECK default (writing_submissions and
-- exam_attempts) or the explicit name given at creation (profiles); confirmed
-- against each source file. No other exam key changes — the existing four
-- keep working exactly as before.
--
-- Test (after applying):
--   -- each of these should now succeed (rolled back, not committed):
--   BEGIN;
--     UPDATE public.profiles SET exam_track = 'goethe_a1' WHERE false;
--   ROLLBACK;
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conname IN (
--       'writing_submissions_exam_key_check',
--       'exam_attempts_exam_key_check',
--       'profiles_exam_track_check'
--     );
--   -- each definition must list 'goethe_a1' alongside the original four/five values.
--
-- Rollback (narrows back to the pre-A1 four keys — only safe if no row uses
-- 'goethe_a1' yet):
--   ALTER TABLE public.writing_submissions DROP CONSTRAINT IF EXISTS writing_submissions_exam_key_check;
--   ALTER TABLE public.writing_submissions ADD CONSTRAINT writing_submissions_exam_key_check
--     CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2'));
--   ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
--   ALTER TABLE public.exam_attempts ADD CONSTRAINT exam_attempts_exam_key_check
--     CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2'));
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_exam_track_check;
--   ALTER TABLE public.profiles ADD CONSTRAINT profiles_exam_track_check
--     CHECK (exam_track IS NULL OR exam_track IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'none'));
-- ============================================================================

ALTER TABLE public.writing_submissions
  DROP CONSTRAINT IF EXISTS writing_submissions_exam_key_check;
ALTER TABLE public.writing_submissions
  ADD CONSTRAINT writing_submissions_exam_key_check
  CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1'));

ALTER TABLE public.exam_attempts
  DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_exam_key_check
  CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_exam_track_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_exam_track_check
  CHECK (exam_track IS NULL OR exam_track IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'none'));
