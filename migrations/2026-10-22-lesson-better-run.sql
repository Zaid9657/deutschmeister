-- Fixes concurrent lesson completions replacing a stronger saved run (course review #2).
-- The invoker's own-row RLS still applies. The conflict locks the current row before
-- comparing accuracy, matching src/lib/lesson/mastery.js betterRun (ties keep it).
-- The program tick is in the same transaction; the client detects this RPC and keeps
-- its existing read/compare/upsert path until the owner applies this file.
-- Test: complete a weak row from two sessions, saving Gold first while the weaker
-- completion waits on the conflict; the final row must retain Gold and its accuracy.
-- Also test as anon / another p_user_id: both must fail; the own-user call must tick
-- program_progress. Rollback: DROP FUNCTION public.complete_lesson(uuid,text,text,numeric,text);

BEGIN;

CREATE OR REPLACE FUNCTION public.complete_lesson(
  p_user_id uuid,
  p_level text,
  p_lektion_id text,
  p_accuracy numeric,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  learner_id uuid := auth.uid();
BEGIN
  IF learner_id IS NULL OR p_user_id IS DISTINCT FROM learner_id THEN
    RAISE EXCEPTION 'Cannot complete another learner''s lesson' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('complete', 'gold') OR p_status IS NULL
     OR p_accuracy IS NULL OR p_accuracy < 0 OR p_accuracy > 1 THEN
    RAISE EXCEPTION 'Invalid completed lesson result' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.lesson_progress AS stored
    (user_id, level, lektion_id, status, accuracy, completed_at, updated_at)
  VALUES
    (learner_id, lower(p_level), p_lektion_id, p_status, p_accuracy, now(), now())
  ON CONFLICT (user_id, lektion_id) DO UPDATE
    SET level = EXCLUDED.level,
        status = EXCLUDED.status,
        accuracy = EXCLUDED.accuracy,
        completed_at = EXCLUDED.completed_at,
        updated_at = EXCLUDED.updated_at
    WHERE stored.status = 'started'
       OR EXCLUDED.accuracy > coalesce(stored.accuracy, 0);

  INSERT INTO public.program_progress (user_id, program_key, item_id)
  VALUES (learner_id, replace(lower(p_level), '.', '') || '_course', p_lektion_id)
  ON CONFLICT (user_id, program_key, item_id) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_lesson(uuid, text, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_lesson(uuid, text, text, numeric, text) TO authenticated;

COMMIT;
