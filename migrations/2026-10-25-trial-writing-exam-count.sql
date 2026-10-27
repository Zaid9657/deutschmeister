-- Trial exam-writing budget counts exam texts only (cross-check 2026-10-25,
-- AI-13 / C-038, C-044).
--
-- What it fixes: on the trial, reserve_writing_usage's lifetime count
-- (p_since IS NULL) counted EVERY writing_submissions row against the two
-- trial exam evaluations — the free A1.1 course texts too, although those are
-- billed against their course's own allowance (the course branch of this same
-- function) and src/data/marketing.js calls that allowance separate. A trial
-- learner who wrote Lektion 1 and 2 met "Limit erreicht (2/2)" on their first
-- telc or Goethe letter.
--
-- The rule, the same one netlify/functions/evaluate-writing.mjs tierUsage()
-- applies (tests/writing-course.test.mjs holds the two equal): when the window
-- is lifetime (p_since IS NULL, the trial) and the submitted task is an exam
-- task, only non-course rows count. Every other case is unchanged — a paid
-- plan keeps the one shared monthly ledger with free course revisions left out.
--
-- Same signature as migrations/2026-10-22-ai-usage-reservations.sql (applied).
-- Not applied: owner applies. Until then the applied function stays the
-- authority (and keeps refusing the trial's exam letter after two course texts).
-- Idempotent (CREATE OR REPLACE; REVOKE/GRANT restated) — safe to re-run.
--
-- How to test (after applying): on a trial account with two a11-l0x rows,
--   SELECT public.reserve_writing_usage('<uuid>', 'telc_b1', 'einladung-absage',
--     NULL, 'Text', 'claude-sonnet-4-6', 2, NULL, NULL, 1);
--   → {"allowed": true, "used": 0, ...} (it inserts one row; delete it after).
-- Rollback: re-run the reserve_writing_usage definition from
-- migrations/2026-10-22-ai-usage-reservations.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.reserve_writing_usage(
  p_user_id uuid, p_exam_key text, p_task_key text, p_exam_attempt_id uuid,
  p_text text, p_model text, p_limit integer, p_since timestamptz,
  p_course_prefix text, p_revisions integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  v_used integer;
  v_before integer;
  v_revision boolean;
  v_id uuid;
  -- The trial's lifetime window, for an exam task: exam texts only.
  v_exam_only boolean := p_since IS NULL
    AND coalesce(p_task_key, '') !~ '^a[0-9][0-9]-(l[0-9][0-9]|cp[0-9])$';
BEGIN
  IF p_user_id IS NULL OR p_limit IS NULL OR p_limit < 1 OR p_revisions IS NULL OR p_revisions < 0 THEN
    RAISE EXCEPTION 'Invalid usage reservation';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('writing:' || p_user_id::text, 0));
  IF p_exam_attempt_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.exam_attempts WHERE id = p_exam_attempt_id
      AND user_id = p_user_id AND exam_key = p_exam_key
  ) THEN
    RAISE EXCEPTION 'Invalid exam attempt';
  END IF;
  SELECT count(*) INTO v_before FROM public.writing_submissions
    WHERE user_id = p_user_id AND task_key = p_task_key;
  IF p_course_prefix IS NOT NULL THEN
    SELECT count(DISTINCT task_key) INTO v_used FROM public.writing_submissions
      WHERE user_id = p_user_id AND task_key LIKE p_course_prefix || '%';
    v_revision := v_before > 0;
    IF (v_revision AND v_before > p_revisions) OR (NOT v_revision AND v_used >= p_limit) THEN
      RETURN jsonb_build_object('allowed', false, 'used', v_used);
    END IF;
  ELSE
    -- Number each course task over its lifetime, then exempt its improved
    -- version only in the allowance window where that revision was submitted.
    -- On the trial an exam task counts exam texts only.
    WITH numbered AS (
      SELECT task_key, created_at,
        row_number() OVER (PARTITION BY task_key ORDER BY created_at, id) AS n
      FROM public.writing_submissions WHERE user_id = p_user_id
    )
    SELECT CASE WHEN v_exam_only
        THEN count(*) FILTER (WHERE coalesce(task_key, '') !~ '^a[0-9][0-9]-(l[0-9][0-9]|cp[0-9])$')
        ELSE count(*) FILTER (WHERE p_since IS NULL OR created_at >= p_since) -
          count(*) FILTER (WHERE (p_since IS NULL OR created_at >= p_since)
            AND task_key ~ '^a[0-9][0-9]-(l[0-9][0-9]|cp[0-9])$'
            AND n BETWEEN 2 AND p_revisions + 1)
      END
      INTO v_used FROM numbered;
    v_revision := p_task_key ~ '^a[0-9][0-9]-(l[0-9][0-9]|cp[0-9])$'
      AND v_before BETWEEN 1 AND p_revisions;
    IF NOT v_revision AND v_used >= p_limit THEN
      RETURN jsonb_build_object('allowed', false, 'used', v_used);
    END IF;
  END IF;
  -- A result update can fail without erasing this committed spending record.
  INSERT INTO public.writing_submissions(user_id, exam_key, task_key, exam_attempt_id,
    submission_text, word_count, model)
    VALUES (p_user_id, p_exam_key, p_task_key, p_exam_attempt_id, p_text,
      cardinality(regexp_split_to_array(trim(p_text), '\s+')), p_model)
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('allowed', true, 'used', v_used, 'id', v_id,
    'before', v_before, 'revision', v_revision);
END;
$$;

-- CREATE OR REPLACE keeps the ACL; restated so this file is complete on its own.
REVOKE ALL ON FUNCTION public.reserve_writing_usage(uuid,text,text,uuid,text,text,integer,timestamptz,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_writing_usage(uuid,text,text,uuid,text,text,integer,timestamptz,text,integer) TO service_role;

COMMIT;
