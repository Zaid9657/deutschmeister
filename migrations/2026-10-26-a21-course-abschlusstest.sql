-- NOT APPLIED. Owner applies before setting A21_PROMOTED = true.
-- Separate key prevents resuming a legacy short-test attempt in the new paper.
-- Retain every previously admitted exam key; no data, grants or RLS changes.
BEGIN;
ALTER TABLE public.exam_attempts
  DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_exam_key_check
  CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1',
    'a1_1_abschluss', 'a1_2_abschluss', 'goethe_a2', 'a2_1_abschluss',
    'a2_2_abschluss', 'a2_1_course_abschluss'));
COMMIT;

-- Verification (read-only):
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'public.exam_attempts'::regclass
--   AND conname = 'exam_attempts_exam_key_check';
-- Rollback: first disable A21_PROMOTED. Leave this additive CHECK in place
-- if new-version attempts exist; never delete or rewrite learner attempts.
