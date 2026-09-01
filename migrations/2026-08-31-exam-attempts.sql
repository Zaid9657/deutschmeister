-- ============================================================================
-- Mock-exam attempts — renovation Phase 5a
--   (docs/renovation-plan-2026-08-31.md; exam keys from src/data/examTracks.js,
--    mock content from src/data/mockExams/*)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- One row per practice-exam run. The client scores the objective sections
-- (the answer keys ship in the app bundle either way — same trust level as
-- user_listening_progress.score) and persists answers as it goes, so a
-- refresh resumes instead of losing the attempt. `section_deadline` is the
-- authoritative timer anchor: the client renders a countdown against it and
-- cannot extend it by reloading.
--
-- RLS posture: own-row SELECT/INSERT/UPDATE with WITH CHECK on both write
-- paths; no DELETE policy (attempt history is the learner's progress record —
-- rows expire with the account via the FK cascade).
--
-- Rollback: DROP TABLE IF EXISTS public.exam_attempts;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_key text NOT NULL CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2')),
  -- 'full' = the whole practice set; single-section runs may come later
  section text NOT NULL DEFAULT 'full'
    CHECK (section IN ('full', 'lesen', 'hoeren', 'sprachbausteine', 'schreiben')),
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  section_deadline timestamptz,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  max_score integer,
  section_scores jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exam_attempts_user_started_idx
  ON public.exam_attempts (user_id, started_at DESC);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_attempts_select_own" ON public.exam_attempts;
CREATE POLICY "exam_attempts_select_own" ON public.exam_attempts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "exam_attempts_insert_own" ON public.exam_attempts;
CREATE POLICY "exam_attempts_insert_own" ON public.exam_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "exam_attempts_update_own" ON public.exam_attempts;
CREATE POLICY "exam_attempts_update_own" ON public.exam_attempts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy on purpose.

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'exam_attempts'; -- t
--   SELECT polname, polcmd FROM pg_policy
--     WHERE polrelid = 'public.exam_attempts'::regclass;                 -- 3 rows, no DELETE
-- ---------------------------------------------------------------------------
