-- Placement speaking cap (cross-check 2026-10-25, AI-01 / C-030, C-040).
--
-- What it fixes: the level test's speaking step (mode 'placement') reserves a
-- session at cost 0 on EVERY tier — free_expired and refunded accounts too —
-- writes no speaking_usage row, and nothing counted placement sessions, so any
-- account could run the free AI speaking cascade without limit, 15 minutes at a
-- time. speaking-session.mjs now forces 5 minutes and counts the caller's
-- non-cancelled placement starts before reserving; this file repeats that cap
-- inside reserve_speaking_session, under the per-user advisory lock the
-- reservation already takes, so concurrent starts cannot both pass.
--
-- Same signature as migrations/2026-10-22-speaking-reservations.sql (applied);
-- only the placement branch is new. The numbers equal the constants in
-- netlify/functions/speaking-session.mjs (PLACEMENT_MINUTES,
-- PLACEMENT_SESSIONS_PER_DAY, PLACEMENT_SESSIONS_PER_30_DAYS) —
-- tests/speaking-reservations.test.mjs holds them equal. Owner-adjustable:
-- change both together.
--
-- Not applied: owner applies. Until then the handler's own count enforces the
-- cap (without the lock, so two simultaneous starts could both pass).
-- Idempotent (CREATE OR REPLACE; REVOKE/GRANT restated) — safe to re-run.
--
-- How to test (after applying, on a test account):
--   1. Start the level test's speaking step and say one sentence → allowed.
--   2. Start it again the same day → the start answers 429 placement_limit.
--   3. SELECT public.reserve_speaking_session(jsonb_build_object(
--        'user_id', '<uuid>', 'session_token', 'sp_' || gen_random_uuid(),
--        'level', 'placement', 'mode', 'placement', 'planned_minutes', 15,
--        'cost_cents', 0), 'free_expired', 30, 2);
--      → raises 'Invalid speaking reservation' (placement is 5 minutes).
-- Rollback: re-run the reserve_speaking_session definition from
-- migrations/2026-10-22-speaking-reservations.sql (the handler keeps its own count).

BEGIN;

CREATE OR REPLACE FUNCTION public.reserve_speaking_session(
  p_session jsonb, p_tier text, p_pro_limit integer, p_trial_limit integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := (p_session->>'user_id')::uuid;
  v_token text := p_session->>'session_token';
  v_mode text := p_session->>'mode';
  v_minutes integer := (p_session->>'planned_minutes')::integer;
  v_cost integer := (p_session->>'cost_cents')::integer;
  v_usage jsonb;
  v_included boolean := false;
  v_balance integer;
  -- The placement cap (= speaking-session.mjs).
  v_placement_minutes CONSTANT integer := 5;
  v_placement_per_day CONSTANT integer := 1;
  v_placement_per_30_days CONSTANT integer := 3;
BEGIN
  IF v_token !~ '^sp_[0-9a-f-]{36}$' OR v_minutes NOT IN (5,10,15)
     OR (v_mode = 'placement' AND v_minutes <> v_placement_minutes)
     OR v_cost IS NULL OR v_cost < 0 OR p_pro_limit < 1 OR p_trial_limit < 1 THEN
    RAISE EXCEPTION 'Invalid speaking reservation';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('speaking:' || v_user::text, 0));
  -- A start the learner never spoke in is closed as 'cancelled' and does not count.
  IF v_mode = 'placement' AND (
    (SELECT count(*) FROM public.speaking_sessions
      WHERE user_id = v_user AND mode = 'placement' AND status <> 'cancelled'
        AND started_at > now() - interval '24 hours') >= v_placement_per_day
    OR (SELECT count(*) FROM public.speaking_sessions
      WHERE user_id = v_user AND mode = 'placement' AND status <> 'cancelled'
        AND started_at >= now() - interval '30 days') >= v_placement_per_30_days
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'placement_limit');
  END IF;
  v_usage := public.speaking_usage_status(v_user);
  v_included := v_mode = 'placement' OR (v_minutes = 5 AND (
    p_tier = 'premium' OR (p_tier = 'pro' AND (v_usage->>'monthly')::integer < p_pro_limit)
    OR (p_tier = 'free_trial' AND (v_usage->>'total')::integer < p_trial_limit)));
  -- The API quote must still be valid under the lock. It never silently
  -- charges a wallet when the caller was shown an included session.
  IF (v_cost = 0) IS DISTINCT FROM v_included THEN
    RETURN jsonb_build_object('ok', false, 'code', 'allowance_changed');
  END IF;
  IF v_cost > 0 THEN
    UPDATE public.speaking_wallet SET balance_cents = balance_cents - v_cost, updated_at = now()
      WHERE user_id = v_user AND balance_cents >= v_cost RETURNING balance_cents INTO v_balance;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'code', 'insufficient_funds', 'cost_cents', v_cost,
        'balance_cents', coalesce((SELECT balance_cents FROM public.speaking_wallet WHERE user_id = v_user), 0));
    END IF;
  END IF;
  INSERT INTO public.speaking_sessions
    (user_id, session_token, level, mission_id, mode, status, started_at, planned_minutes, cost_cents, topic, scenario)
  SELECT v_user, v_token, p_session->>'level', (p_session->>'mission_id')::uuid, v_mode,
    'active', now(), v_minutes, v_cost, p_session->>'topic', p_session->>'scenario';
  IF v_included AND v_mode <> 'placement' THEN
    INSERT INTO public.speaking_usage (id, user_id, created_at) VALUES (substring(v_token FROM 4)::uuid, v_user, now());
  ELSIF v_cost > 0 THEN
    INSERT INTO public.speaking_wallet_transactions (user_id, amount_cents, reason, session_token)
      VALUES (v_user, -v_cost, 'session_' || v_minutes || 'min', v_token);
  END IF;
  RETURN jsonb_strip_nulls(jsonb_build_object('ok', true, 'balance_cents', v_balance));
END;
$$;

-- CREATE OR REPLACE keeps the ACL; restated so this file is complete on its own.
REVOKE ALL ON FUNCTION public.reserve_speaking_session(jsonb,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_speaking_session(jsonb,text,integer,integer) TO service_role;

COMMIT;
