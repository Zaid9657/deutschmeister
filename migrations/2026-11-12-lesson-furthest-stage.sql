-- Step 0: distinguish opening an intro from starting, and measure where lessons stop.
-- OWNER-APPLIED. The client silently disables these writes if either column is absent.
-- Test after applying (own test account): open intro (no new row), press Start, advance,
-- go back/reload; furthest_stage/at advance only forwards, status/accuracy stay unchanged.
-- Inspect: SELECT lektion_id, furthest_stage, furthest_at FROM public.lesson_progress
--         WHERE user_id = auth.uid();
-- Rollback (owner only): ALTER TABLE public.lesson_progress DROP COLUMN IF EXISTS
-- furthest_stage, DROP COLUMN IF EXISTS furthest_at;
BEGIN;
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS furthest_stage text,
  ADD COLUMN IF NOT EXISTS furthest_at timestamptz;
COMMIT;
