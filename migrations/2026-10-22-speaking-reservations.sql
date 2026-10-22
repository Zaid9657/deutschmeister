-- Fixes B-security #5/#6/#9 and A-money #4: reserve speaking allowance and
-- wallet funds before providers; serialize turns/close-out; refund atomically.
-- Not applied: owner applies. Runtime fails closed until these RPCs exist.
-- Verify: simultaneous final-slot starts admit one; an in-flight turn defers
-- cancellation, and a failed refund leaves the session active for retry.
-- Rollback: disable speaking before removing the new RPCs/turn ledger/column;
-- keep wallet transactions for reconciliation. Safe to re-run.
BEGIN;

ALTER TABLE public.speaking_sessions ADD COLUMN IF NOT EXISTS close_requested_at timestamptz;
CREATE TABLE IF NOT EXISTS public.speaking_turn_reservations (
  id uuid PRIMARY KEY,
  session_token text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS speaking_turn_reservations_session_idx
  ON public.speaking_turn_reservations (session_token, status);
ALTER TABLE public.speaking_turn_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.speaking_turn_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.speaking_turn_reservations TO service_role;

CREATE OR REPLACE FUNCTION public.speaking_usage_status(p_user_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.speaking_usage WHERE user_id = p_user_id),
    'monthly',
      (SELECT count(*) FROM public.speaking_usage
       WHERE user_id = p_user_id AND created_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
      + (SELECT count(*) FROM public.speaking_sessions s
         WHERE s.user_id = p_user_id AND s.cost_cents = 0 AND s.planned_minutes = 5
           AND s.mode <> 'placement' AND s.status <> 'cancelled'
           AND s.started_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
           AND NOT EXISTS (SELECT 1 FROM public.speaking_usage u
                           WHERE u.user_id = p_user_id AND u.id::text = substring(s.session_token FROM 4))))
$$;

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
BEGIN
  IF v_token !~ '^sp_[0-9a-f-]{36}$' OR v_minutes NOT IN (5,10,15)
     OR v_cost IS NULL OR v_cost < 0 OR p_pro_limit < 1 OR p_trial_limit < 1 THEN
    RAISE EXCEPTION 'Invalid speaking reservation';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('speaking:' || v_user::text, 0));
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

CREATE OR REPLACE FUNCTION public.reserve_speaking_turn(p_session_token text, p_user_id uuid, p_turn_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session public.speaking_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.speaking_sessions
    WHERE session_token = p_session_token AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_session.status <> 'active' OR v_session.close_requested_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'session_closed');
  END IF;
  IF now() > v_session.started_at + make_interval(mins => v_session.planned_minutes + 2) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'session_expired');
  END IF;
  IF EXISTS (SELECT 1 FROM public.speaking_turn_reservations WHERE session_token = p_session_token AND status = 'pending') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'turn_pending');
  END IF;
  INSERT INTO public.speaking_turn_reservations (id, session_token, user_id) VALUES (p_turn_id, p_session_token, p_user_id);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_speaking_session(p_session_token text, p_user_id uuid, p_duration_seconds integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_session public.speaking_sessions%ROWTYPE;
  v_turns integer;
  v_status text;
  v_last timestamptz;
  v_duration integer;
  v_refund integer := 0;
  v_released boolean := false;
BEGIN
  SELECT * INTO v_session FROM public.speaking_sessions
    WHERE session_token = p_session_token AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_session.status <> 'active' THEN
    RETURN jsonb_build_object('closed', false, 'released', false, 'refundCents', 0);
  END IF;
  UPDATE public.speaking_sessions SET close_requested_at = coalesce(close_requested_at, now())
    WHERE session_token = p_session_token;
  -- A crashed function cannot hold an allowance forever. Settlement fences
  -- late replies with this same lease, so expired turns can never be delivered.
  UPDATE public.speaking_turn_reservations SET status = 'failed'
    WHERE session_token = p_session_token AND status = 'pending' AND created_at < now() - interval '15 minutes';
  IF EXISTS (SELECT 1 FROM public.speaking_turn_reservations WHERE session_token = p_session_token AND status = 'pending') THEN
    RETURN jsonb_build_object('closed', false, 'pending', true, 'released', false, 'refundCents', 0);
  END IF;
  SELECT count(*) FILTER (WHERE role = 'user'), max(created_at) INTO v_turns, v_last
    FROM public.speaking_messages WHERE session_token = p_session_token;
  -- A delivered text-only/no-speech reply still spent the reserved turn.
  v_turns := greatest(v_turns, (SELECT count(*) FROM public.speaking_turn_reservations
    WHERE session_token = p_session_token AND status = 'delivered'));
  v_status := CASE WHEN v_turns > 0 THEN 'completed' ELSE 'cancelled' END;
  v_duration := least((v_session.planned_minutes + 2) * 60, greatest(0, coalesce(p_duration_seconds,
    extract(epoch FROM (coalesce(v_last, v_session.started_at) - v_session.started_at))::integer, 0)));
  IF v_turns = 0 AND v_session.mode <> 'placement' THEN
    IF v_session.cost_cents > 0 THEN
      v_refund := v_session.cost_cents;
      INSERT INTO public.speaking_wallet (user_id, balance_cents, updated_at) VALUES (p_user_id, v_refund, now())
      ON CONFLICT (user_id) DO UPDATE SET balance_cents = speaking_wallet.balance_cents + EXCLUDED.balance_cents, updated_at = now();
      INSERT INTO public.speaking_wallet_transactions (user_id, amount_cents, reason, session_token)
        VALUES (p_user_id, v_refund, 'refund_no_speech', p_session_token);
      v_released := true;
    ELSIF p_session_token ~ '^sp_[0-9a-f-]{36}$' THEN
      DELETE FROM public.speaking_usage WHERE id = substring(p_session_token FROM 4)::uuid AND user_id = p_user_id;
      v_released := true;
    END IF;
  END IF;
  UPDATE public.speaking_sessions SET status = v_status, user_turns = v_turns, duration_seconds = v_duration,
    completed_at = CASE WHEN p_duration_seconds IS NULL THEN coalesce(v_last, v_session.started_at) ELSE now() END
    WHERE session_token = p_session_token;
  RETURN jsonb_build_object('closed', true, 'status', v_status, 'userTurns', v_turns, 'released', v_released, 'refundCents', v_refund);
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_speaking_turn(p_session_token text, p_user_id uuid, p_turn_id uuid, p_delivered boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_closing timestamptz;
BEGIN
  SELECT close_requested_at INTO v_closing FROM public.speaking_sessions
    WHERE session_token = p_session_token AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.speaking_turn_reservations SET status = CASE WHEN p_delivered THEN 'delivered' ELSE 'failed' END
    WHERE id = p_turn_id AND session_token = p_session_token AND user_id = p_user_id AND status = 'pending'
      AND created_at >= now() - interval '15 minutes';
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_closing IS NOT NULL THEN
    BEGIN
      PERFORM public.settle_speaking_session(p_session_token, p_user_id, NULL);
    EXCEPTION WHEN OTHERS THEN
      -- Preserve the settled turn if refunding fails. The session stays active
      -- with close_requested_at set, and the end call / sweep retries it.
      RAISE WARNING 'Speaking close-out will retry: %', SQLERRM;
    END;
  END IF;
  RETURN true;
END;
$$;

-- Both the debit and its refund are transactional. Any failed credit leaves
-- the session active and eligible for an end retry or the existing sweeper.
REVOKE ALL ON FUNCTION public.speaking_usage_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_speaking_session(jsonb,text,integer,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_speaking_turn(text,uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_speaking_session(text,uuid,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_speaking_turn(text,uuid,uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.speaking_usage_status(uuid), public.reserve_speaking_session(jsonb,text,integer,integer),
  public.reserve_speaking_turn(text,uuid,uuid), public.settle_speaking_session(text,uuid,integer),
  public.settle_speaking_turn(text,uuid,uuid,boolean) TO service_role;
COMMIT;
