-- Fulfilment f2 (2026-10-27): capture real exam outcomes.
-- Learners tell us their exam date (profiles.exam_date) but we never learn
-- how the exam went, so no course claim can ever rest on a measured pass.
-- public.exam_results holds one self-reported answer per learner, exam and
-- exam date. The course home asks once, from exam_date + 7 days
-- (src/lib/examOutcome.js, src/components/course/ExamOutcomeQuestion.jsx);
-- no mail, no function, no access or entitlement depends on it.
--
-- Additive only: a new table, nothing existing is altered. Learners SELECT,
-- INSERT and UPDATE their own rows (auth.uid() = user_id, UPDATE with WITH
-- CHECK); there is no DELETE policy and no anon grant at all. The service
-- role reads it for reporting. Until this file is applied the card's read
-- fails ("relation does not exist"), and the card renders nothing.
--
-- outcome: passed | failed | not_taken | waiting ('waiting' = result not out
-- yet; the card asks again 14 days after that answer and updates the row).
-- sections: optional self-reported per-section results, a JSON object
-- (e.g. {"lesen":"passed","schreiben":"failed"}); the first card does not
-- ask for them.
--
-- Idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS before CREATE); owner applies.
-- Verify: as a signed-in learner with an exam_date at least 7 days ago, the
-- course home shows "Wie ist Ihre Prüfung gelaufen?"; answering inserts one
-- row; reloading hides the card; another learner's rows are invisible;
-- an anon request to /rest/v1/exam_results returns no rows / permission denied;
-- re-running the file changes nothing.
--
-- Rollback (drops the table and every answer in it; export first if needed):
--   DROP TABLE IF EXISTS public.exam_results;

BEGIN;

CREATE TABLE IF NOT EXISTS public.exam_results (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam text NOT NULL CHECK (exam ~ '^[a-z0-9_]{1,40}$'),
  exam_date date NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('passed', 'failed', 'not_taken', 'waiting')),
  sections jsonb CHECK (sections IS NULL OR jsonb_typeof(sections) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One answer per learner, exam and date (the card upserts on it).
CREATE UNIQUE INDEX IF NOT EXISTS exam_results_user_exam_date_idx
  ON public.exam_results (user_id, exam, exam_date);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_results_select_own" ON public.exam_results;
CREATE POLICY "exam_results_select_own" ON public.exam_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "exam_results_insert_own" ON public.exam_results;
CREATE POLICY "exam_results_insert_own" ON public.exam_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "exam_results_update_own" ON public.exam_results;
CREATE POLICY "exam_results_update_own" ON public.exam_results
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON TABLE public.exam_results FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.exam_results TO authenticated;
GRANT ALL ON TABLE public.exam_results TO service_role;

COMMIT;
