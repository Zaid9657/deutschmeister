-- ============================================================================
-- AI writing feedback — renovation Phase 5b
--   (docs/renovation-plan-2026-08-31.md; tasks from src/data/writingTasks.js,
--    graded by netlify/functions/evaluate-writing.mjs)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- One row per graded submission. Security posture is the speaking_evaluations
-- / purchases doctrine: every write costs an AI call, so rows are inserted by
-- the Netlify function with the SERVICE ROLE only — clients can read their own
-- history and write nothing. The function enforces the per-tier limits by
-- counting rows here (parsed and compared by tests/claims.test.mjs).
--
-- Rollback: DROP TABLE IF EXISTS public.writing_submissions;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.writing_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_key text NOT NULL CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2')),
  task_key text NOT NULL,
  exam_attempt_id uuid REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
  submission_text text NOT NULL,
  word_count integer,
  feedback jsonb,
  total_score integer,
  max_score integer,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS writing_submissions_user_created_idx
  ON public.writing_submissions (user_id, created_at DESC);

ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "writing_submissions_select_own" ON public.writing_submissions;
CREATE POLICY "writing_submissions_select_own" ON public.writing_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- NO client INSERT/UPDATE/DELETE policies on purpose — service-role writes only.

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT polname, polcmd FROM pg_policy
--     WHERE polrelid = 'public.writing_submissions'::regclass;  -- exactly 1 row (SELECT)
-- ---------------------------------------------------------------------------
