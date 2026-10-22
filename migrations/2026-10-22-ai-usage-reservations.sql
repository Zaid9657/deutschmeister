-- Fix B2 security #1/#3/#4: reserve AI usage atomically before provider work,
-- and keep learners from deleting metered lesson stages to reset daily caps.
-- Idempotent; owner applies. Before application the RPC callers fail closed.
-- Verify: concurrent final-slot requests admit exactly one; authenticated DELETE
-- keeps explain/readaloud rows but removes ordinary practice rows.
-- Rollback: deploy the previous runtime before dropping these three functions;
-- remove the restrictive policy only if AI endpoints have been disabled.

BEGIN;

DROP POLICY IF EXISTS "Keep metered lesson attempts" ON public.lesson_attempts;
CREATE POLICY "Keep metered lesson attempts" ON public.lesson_attempts
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (stage IS NULL OR stage NOT IN ('explain', 'readaloud'));

CREATE OR REPLACE FUNCTION public.reserve_lesson_ai_usage(
  p_user_id uuid, p_stage text, p_limit integer, p_level text,
  p_lektion_id text, p_item_id text, p_error_tag text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  v_used integer;
  v_id bigint;
  v_since timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF p_user_id IS NULL OR p_stage IS NULL OR p_stage NOT IN ('explain', 'readaloud')
     OR p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'Invalid usage reservation';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('lesson-ai:' || p_user_id::text || ':' || p_stage, 0));
  SELECT count(*) INTO v_used FROM public.lesson_attempts
    WHERE user_id = p_user_id AND stage = p_stage AND created_at >= v_since;
  IF v_used >= p_limit THEN
    RETURN jsonb_build_object('allowed', false, 'used', v_used);
  END IF;
  INSERT INTO public.lesson_attempts(user_id, level, lektion_id, item_id, stage, correct, error_tag)
    VALUES (p_user_id, p_level, p_lektion_id, p_item_id, p_stage, false, p_error_tag)
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('allowed', true, 'used', v_used, 'id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_xray_usage(
  p_user_id uuid, p_anonymous_id text, p_sentence text, p_ip_hash text,
  p_source jsonb, p_limit integer, p_ip_limit integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  v_used integer;
  v_ip_used integer;
  v_id uuid;
  v_since timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR (p_user_id IS NULL AND
    (p_anonymous_id IS NULL OR p_anonymous_id !~ '^[A-Za-z0-9_-]{8,128}$')) THEN
    RAISE EXCEPTION 'Invalid usage reservation';
  END IF;
  -- IP first, identity second: every anonymous request follows the same order.
  IF p_user_id IS NULL AND p_ip_hash IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('xray-ip:' || p_ip_hash, 0));
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('xray:' ||
    CASE WHEN p_user_id IS NULL THEN p_anonymous_id ELSE p_user_id::text END, 0));
  SELECT count(*) INTO v_used FROM public.xray_usage
    WHERE used_at >= v_since AND
      ((p_user_id IS NOT NULL AND user_id = p_user_id) OR
       (p_user_id IS NULL AND user_id IS NULL AND anonymous_id = p_anonymous_id));
  IF p_user_id IS NULL AND p_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_ip_used FROM public.xray_usage
      WHERE used_at >= v_since AND user_id IS NULL AND ip_hash = p_ip_hash;
    IF p_ip_limit IS NULL OR p_ip_limit < 1 OR v_ip_used >= p_ip_limit THEN
      RETURN jsonb_build_object('allowed', false, 'used', v_ip_used);
    END IF;
  END IF;
  IF v_used >= p_limit THEN
    RETURN jsonb_build_object('allowed', false, 'used', v_used);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.xray_usage'::regclass
      AND attname = 'source' AND NOT attisdropped) THEN
    INSERT INTO public.xray_usage(user_id, anonymous_id, sentence, ip_hash, source)
      VALUES (p_user_id, CASE WHEN p_user_id IS NULL THEN p_anonymous_id END,
        left(p_sentence, 500), CASE WHEN p_user_id IS NULL THEN p_ip_hash END, p_source)
      RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.xray_usage(user_id, anonymous_id, sentence, ip_hash)
      VALUES (p_user_id, CASE WHEN p_user_id IS NULL THEN p_anonymous_id END,
        left(p_sentence, 500), CASE WHEN p_user_id IS NULL THEN p_ip_hash END)
      RETURNING id INTO v_id;
  END IF;
  RETURN jsonb_build_object('allowed', true, 'used', v_used, 'id', v_id);
END;
$$;

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
    WITH numbered AS (
      SELECT task_key, created_at,
        row_number() OVER (PARTITION BY task_key ORDER BY created_at, id) AS n
      FROM public.writing_submissions WHERE user_id = p_user_id
    )
    SELECT count(*) FILTER (WHERE p_since IS NULL OR created_at >= p_since) -
      count(*) FILTER (WHERE (p_since IS NULL OR created_at >= p_since)
        AND task_key ~ '^a[0-9][0-9]-(l[0-9][0-9]|cp[0-9])$'
        AND n BETWEEN 2 AND p_revisions + 1)
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

REVOKE ALL ON FUNCTION public.reserve_lesson_ai_usage(uuid,text,integer,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_xray_usage(uuid,text,text,text,jsonb,integer,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_writing_usage(uuid,text,text,uuid,text,text,integer,timestamptz,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_lesson_ai_usage(uuid,text,integer,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_xray_usage(uuid,text,text,text,jsonb,integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_writing_usage(uuid,text,text,uuid,text,text,integer,timestamptz,text,integer) TO service_role;

COMMIT;
