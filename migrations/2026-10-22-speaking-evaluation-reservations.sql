-- Fix verification #4: reserve the daily speaking-evaluation allowance before
-- provider work and claim each owned session only once. Idempotent; owner applies.
-- Verify: concurrent final-slot requests admit one, and repeating a completed
-- session returns the stored evaluation without spending another allowance.
-- Rollback: deploy the previous runtime before dropping this function; pending
-- rows retain the attempted usage and must not be deleted to reset allowances.

BEGIN;

CREATE OR REPLACE FUNCTION public.reserve_speaking_evaluation(
  p_user_id uuid, p_session_token text, p_level text, p_limit integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  v_used integer;
  v_claimed integer;
  v_id public.speaking_evaluations.id%TYPE;
  v_existing public.speaking_evaluations%ROWTYPE;
  v_since timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF p_user_id IS NULL OR p_session_token IS NULL OR p_session_token = ''
     OR p_level IS NULL OR p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'Invalid evaluation reservation';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('speaking-evaluation:' || p_user_id::text, 0));
  SELECT * INTO v_existing FROM public.speaking_evaluations
    WHERE user_id = p_user_id AND session_id = p_session_token
      AND scores->>'_failed' IS DISTINCT FROM 'true'
    ORDER BY created_at DESC, id LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'used', 0, 'id', v_existing.id,
      'existing', true, 'evaluation', to_jsonb(v_existing));
  END IF;
  SELECT count(*) INTO v_used FROM public.speaking_evaluations
    WHERE user_id = p_user_id AND created_at >= v_since;
  IF v_used >= p_limit THEN
    RETURN jsonb_build_object('allowed', false, 'used', v_used);
  END IF;
  UPDATE public.speaking_sessions SET evaluated = true
    WHERE user_id = p_user_id AND session_token = p_session_token
      AND evaluated IS NOT TRUE;
  GET DIAGNOSTICS v_claimed = ROW_COUNT;
  IF v_claimed = 0 THEN
    RETURN jsonb_build_object('allowed', false, 'used', v_used, 'pending', true);
  END IF;
  INSERT INTO public.speaking_evaluations(user_id, session_id, session_token, level,
    score, total_score, scores)
    VALUES (p_user_id, p_session_token, p_session_token, p_level, 0, NULL, '{"_pending":true}'::jsonb)
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('allowed', true, 'used', v_used, 'id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_speaking_evaluation(uuid,text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_speaking_evaluation(uuid,text,text,integer) TO service_role;

COMMIT;
