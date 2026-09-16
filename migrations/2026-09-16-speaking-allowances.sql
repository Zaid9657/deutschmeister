-- Speaking allowances: fixed second-based buckets, atomic reservations and an
-- immutable ledger (2026-09-15 rebuild plan, speaking-entitlements-ledger).
--
-- Replaces the cents/session-count model (the speaking_wallet cents column,
-- PRO_MONTHLY_LIMIT) with:
--   * speaking_credit_buckets       — grants: subscription months (expiring),
--                                     course/top-up seconds (permanent)
--   * speaking_session_reservations — reserve → finalize/refund lifecycle
--   * speaking_minute_ledger        — immutable, idempotency-keyed history
--   * speaking_mission_entitlements — the 12 included first mission attempts
--                                     a course purchase carries
--
-- Postgres owns the money-shaped state: every mutation is a SECURITY DEFINER
-- RPC that locks rows FOR UPDATE, replays idempotently via the ledger's
-- op_key, and either commits the whole allocation or nothing. Clients may
-- SELECT their own rows; no client write policy exists anywhere here.
--
-- Consumption order: expiring buckets first (soonest expiry first), then
-- permanent buckets, oldest first — pinned by tests/speaking-allowance.test.mjs
-- (the pure allocator mirrors this) and proved live by
-- tests/speaking-ledger-concurrency.test.mjs.
--
-- Apply by hand (see migrations/README.md). Idempotent: safe to re-run.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.speaking_credit_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('subscription', 'course', 'topup', 'adjustment')),
  source_ref text NOT NULL,
  granted_seconds integer NOT NULL CHECK (granted_seconds > 0),
  remaining_seconds integer NOT NULL CHECK (remaining_seconds >= 0),
  period_start timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, source_ref)
);

CREATE TABLE IF NOT EXISTS public.speaking_session_reservations (
  session_token uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id uuid NOT NULL REFERENCES public.speaking_credit_buckets(id),
  reserved_seconds integer NOT NULL CHECK (reserved_seconds > 0),
  consumed_seconds integer NOT NULL DEFAULT 0 CHECK (consumed_seconds >= 0),
  refunded_seconds integer NOT NULL DEFAULT 0 CHECK (refunded_seconds >= 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'finalized', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz,
  PRIMARY KEY (session_token, bucket_id),
  CHECK (consumed_seconds + refunded_seconds <= reserved_seconds)
);

CREATE TABLE IF NOT EXISTS public.speaking_minute_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token uuid,
  bucket_id uuid REFERENCES public.speaking_credit_buckets(id),
  kind text NOT NULL CHECK (kind IN ('grant', 'reserve', 'finalize', 'refund', 'expire', 'revoke')),
  seconds integer NOT NULL CHECK (seconds > 0),
  idempotency_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.speaking_mission_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_key text NOT NULL,
  source_ref text NOT NULL,
  attempts_total integer NOT NULL CHECK (attempts_total > 0),
  attempts_remaining integer NOT NULL CHECK (attempts_remaining >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_key, source_ref)
);

CREATE INDEX IF NOT EXISTS speaking_credit_buckets_user_active
  ON public.speaking_credit_buckets (user_id) WHERE remaining_seconds > 0;
CREATE INDEX IF NOT EXISTS speaking_reservations_status
  ON public.speaking_session_reservations (status, created_at);
CREATE INDEX IF NOT EXISTS speaking_ledger_user_created
  ON public.speaking_minute_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS speaking_ledger_op_key
  ON public.speaking_minute_ledger ((metadata->>'op_key'));

-- ---------------------------------------------------------------------------
-- RLS: learners read their own rows; ALL writes go through the RPCs below.
-- ---------------------------------------------------------------------------

ALTER TABLE public.speaking_credit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_session_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_minute_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_mission_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own buckets readable" ON public.speaking_credit_buckets;
CREATE POLICY "Own buckets readable" ON public.speaking_credit_buckets
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own reservations readable" ON public.speaking_session_reservations;
CREATE POLICY "Own reservations readable" ON public.speaking_session_reservations
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own ledger readable" ON public.speaking_minute_ledger;
CREATE POLICY "Own ledger readable" ON public.speaking_minute_ledger
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own mission entitlements readable" ON public.speaking_mission_entitlements;
CREATE POLICY "Own mission entitlements readable" ON public.speaking_mission_entitlements
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- grant_speaking_seconds — one bucket per (user, source, source_ref), replay-
-- safe: the same op_key (or the same source_ref) returns the existing bucket.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.grant_speaking_seconds(
  p_user_id uuid,
  p_source text,
  p_source_ref text,
  p_seconds integer,
  p_idempotency_key text,
  p_period_start timestamptz DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_bucket public.speaking_credit_buckets%ROWTYPE;
BEGIN
  IF p_seconds IS NULL OR p_seconds <= 0 THEN
    RAISE EXCEPTION 'INVALID_SECONDS';
  END IF;

  SELECT * INTO v_bucket FROM public.speaking_credit_buckets
   WHERE user_id = p_user_id AND source = p_source AND source_ref = p_source_ref;
  IF FOUND THEN
    RETURN jsonb_build_object('bucketId', v_bucket.id, 'replayed', true,
      'grantedSeconds', v_bucket.granted_seconds, 'remainingSeconds', v_bucket.remaining_seconds);
  END IF;

  INSERT INTO public.speaking_credit_buckets
    (user_id, source, source_ref, granted_seconds, remaining_seconds, period_start, expires_at)
  VALUES (p_user_id, p_source, p_source_ref, p_seconds, p_seconds, p_period_start, p_expires_at)
  ON CONFLICT (user_id, source, source_ref) DO NOTHING
  RETURNING * INTO v_bucket;
  IF v_bucket.id IS NULL THEN
    -- lost a race to an identical grant: return the winner
    SELECT * INTO v_bucket FROM public.speaking_credit_buckets
     WHERE user_id = p_user_id AND source = p_source AND source_ref = p_source_ref;
    RETURN jsonb_build_object('bucketId', v_bucket.id, 'replayed', true,
      'grantedSeconds', v_bucket.granted_seconds, 'remainingSeconds', v_bucket.remaining_seconds);
  END IF;

  INSERT INTO public.speaking_minute_ledger (user_id, bucket_id, kind, seconds, idempotency_key, metadata)
  VALUES (p_user_id, v_bucket.id, 'grant', p_seconds, p_idempotency_key,
          jsonb_build_object('op_key', p_idempotency_key, 'source', p_source, 'source_ref', p_source_ref));

  RETURN jsonb_build_object('bucketId', v_bucket.id, 'replayed', false,
    'grantedSeconds', v_bucket.granted_seconds, 'remainingSeconds', v_bucket.remaining_seconds);
END;
$$;

-- ---------------------------------------------------------------------------
-- reserve_speaking_seconds — lock active buckets, consume expiring-first,
-- all-or-nothing. Raises INSUFFICIENT_ALLOWANCE without mutation when the
-- eligible total is short. Replays (same op_key) return the reservation as
-- first written. A session_token that exists for another user raises
-- DUPLICATE_SESSION.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reserve_speaking_seconds(
  p_user_id uuid,
  p_session_token uuid,
  p_requested_seconds integer,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_bucket RECORD;
  v_left integer;
  v_take integer;
  v_total integer := 0;
  v_reserved integer := 0;
BEGIN
  IF p_requested_seconds IS NULL OR p_requested_seconds <= 0 THEN
    RAISE EXCEPTION 'INVALID_SECONDS';
  END IF;

  -- Replay of the same logical start → return the existing reservation.
  IF EXISTS (SELECT 1 FROM public.speaking_minute_ledger
              WHERE user_id = p_user_id AND metadata->>'op_key' = p_idempotency_key) THEN
    RETURN public.speaking_session_summary(p_user_id, p_session_token);
  END IF;

  -- The same token reused: same user gets its current state back (a lost
  -- response, not a new spend); another user is a conflict.
  IF EXISTS (SELECT 1 FROM public.speaking_session_reservations
              WHERE session_token = p_session_token AND user_id <> p_user_id) THEN
    RAISE EXCEPTION 'DUPLICATE_SESSION';
  END IF;
  IF EXISTS (SELECT 1 FROM public.speaking_session_reservations
              WHERE session_token = p_session_token AND user_id = p_user_id) THEN
    RETURN public.speaking_session_summary(p_user_id, p_session_token);
  END IF;

  v_left := p_requested_seconds;

  -- Lock eligible buckets in consumption order: expiring first (soonest
  -- expiry first), then permanent, oldest first.
  FOR v_bucket IN
    SELECT * FROM public.speaking_credit_buckets
     WHERE user_id = p_user_id
       AND remaining_seconds > 0
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY (expires_at IS NULL), expires_at, created_at
     FOR UPDATE
  LOOP
    v_total := v_total + v_bucket.remaining_seconds;
  END LOOP;

  IF v_total < p_requested_seconds THEN
    RAISE EXCEPTION 'INSUFFICIENT_ALLOWANCE';
  END IF;

  FOR v_bucket IN
    SELECT * FROM public.speaking_credit_buckets
     WHERE user_id = p_user_id
       AND remaining_seconds > 0
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY (expires_at IS NULL), expires_at, created_at
     FOR UPDATE
  LOOP
    EXIT WHEN v_left = 0;
    v_take := LEAST(v_bucket.remaining_seconds, v_left);
    v_left := v_left - v_take;
    v_reserved := v_reserved + v_take;

    UPDATE public.speaking_credit_buckets
       SET remaining_seconds = remaining_seconds - v_take
     WHERE id = v_bucket.id;

    INSERT INTO public.speaking_session_reservations
      (session_token, user_id, bucket_id, reserved_seconds)
    VALUES (p_session_token, p_user_id, v_bucket.id, v_take);

    INSERT INTO public.speaking_minute_ledger (user_id, session_token, bucket_id, kind, seconds, idempotency_key, metadata)
    VALUES (p_user_id, p_session_token, v_bucket.id, 'reserve', v_take,
            p_idempotency_key || ':' || v_bucket.id,
            jsonb_build_object('op_key', p_idempotency_key));
  END LOOP;

  RETURN public.speaking_session_summary(p_user_id, p_session_token);
END;
$$;

-- ---------------------------------------------------------------------------
-- finalize_speaking_session — cap used seconds at the reserved total,
-- distribute consumption in the reservation's own consumption order, restore
-- the remainder to its buckets. Replay-safe; a second call returns the state
-- the first call left.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.finalize_speaking_session(
  p_user_id uuid,
  p_session_token uuid,
  p_used_seconds integer,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_res RECORD;
  v_left integer;
  v_consume integer;
  v_back integer;
BEGIN
  IF p_used_seconds IS NULL OR p_used_seconds < 0 THEN
    RAISE EXCEPTION 'INVALID_SECONDS';
  END IF;

  IF EXISTS (SELECT 1 FROM public.speaking_minute_ledger
              WHERE user_id = p_user_id AND metadata->>'op_key' = p_idempotency_key) THEN
    RETURN public.speaking_session_summary(p_user_id, p_session_token);
  END IF;

  -- Already settled (finalized or refunded) → idempotent no-op.
  IF NOT EXISTS (SELECT 1 FROM public.speaking_session_reservations
                  WHERE session_token = p_session_token AND user_id = p_user_id AND status = 'reserved') THEN
    RETURN public.speaking_session_summary(p_user_id, p_session_token);
  END IF;

  v_left := p_used_seconds;

  FOR v_res IN
    SELECT r.*, b.expires_at, b.created_at AS bucket_created_at
      FROM public.speaking_session_reservations r
      JOIN public.speaking_credit_buckets b ON b.id = r.bucket_id
     WHERE r.session_token = p_session_token AND r.user_id = p_user_id AND r.status = 'reserved'
     ORDER BY (b.expires_at IS NULL), b.expires_at, b.created_at
     FOR UPDATE OF r, b
  LOOP
    v_consume := LEAST(v_res.reserved_seconds, v_left);
    v_left := GREATEST(0, v_left - v_consume);
    v_back := v_res.reserved_seconds - v_consume;

    UPDATE public.speaking_session_reservations
       SET consumed_seconds = v_consume,
           refunded_seconds = v_back,
           status = 'finalized',
           finalized_at = now()
     WHERE session_token = v_res.session_token AND bucket_id = v_res.bucket_id;

    IF v_back > 0 THEN
      UPDATE public.speaking_credit_buckets
         SET remaining_seconds = remaining_seconds + v_back
       WHERE id = v_res.bucket_id;
      INSERT INTO public.speaking_minute_ledger (user_id, session_token, bucket_id, kind, seconds, idempotency_key, metadata)
      VALUES (p_user_id, p_session_token, v_res.bucket_id, 'refund', v_back,
              p_idempotency_key || ':refund:' || v_res.bucket_id,
              jsonb_build_object('op_key', p_idempotency_key));
    END IF;

    IF v_consume > 0 THEN
      INSERT INTO public.speaking_minute_ledger (user_id, session_token, bucket_id, kind, seconds, idempotency_key, metadata)
      VALUES (p_user_id, p_session_token, v_res.bucket_id, 'finalize', v_consume,
              p_idempotency_key || ':finalize:' || v_res.bucket_id,
              jsonb_build_object('op_key', p_idempotency_key));
    END IF;
  END LOOP;

  RETURN public.speaking_session_summary(p_user_id, p_session_token);
END;
$$;

-- ---------------------------------------------------------------------------
-- refund_speaking_session — a technical failure returns the complete
-- unfinalized reservation. Replay-safe like finalize.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.refund_speaking_session(
  p_user_id uuid,
  p_session_token uuid,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_res RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM public.speaking_minute_ledger
              WHERE user_id = p_user_id AND metadata->>'op_key' = p_idempotency_key) THEN
    RETURN public.speaking_session_summary(p_user_id, p_session_token);
  END IF;

  FOR v_res IN
    SELECT r.* FROM public.speaking_session_reservations r
     WHERE r.session_token = p_session_token AND r.user_id = p_user_id AND r.status = 'reserved'
     FOR UPDATE
  LOOP
    UPDATE public.speaking_session_reservations
       SET refunded_seconds = v_res.reserved_seconds,
           status = 'refunded',
           finalized_at = now()
     WHERE session_token = v_res.session_token AND bucket_id = v_res.bucket_id;

    UPDATE public.speaking_credit_buckets
       SET remaining_seconds = remaining_seconds + v_res.reserved_seconds
     WHERE id = v_res.bucket_id;

    INSERT INTO public.speaking_minute_ledger (user_id, session_token, bucket_id, kind, seconds, idempotency_key, metadata)
    VALUES (p_user_id, p_session_token, v_res.bucket_id, 'refund', v_res.reserved_seconds,
            p_idempotency_key || ':' || v_res.bucket_id,
            jsonb_build_object('op_key', p_idempotency_key));
  END LOOP;

  RETURN public.speaking_session_summary(p_user_id, p_session_token);
END;
$$;

-- ---------------------------------------------------------------------------
-- revoke_speaking_grant — a refunded order: unspent seconds become
-- unavailable; used history is never rewritten and no bucket goes negative.
-- Also revokes unused included mission attempts from the same order.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.revoke_speaking_grant(
  p_user_id uuid,
  p_source text,
  p_source_ref text,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_bucket public.speaking_credit_buckets%ROWTYPE;
  v_removed integer := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM public.speaking_minute_ledger
              WHERE user_id = p_user_id AND metadata->>'op_key' = p_idempotency_key) THEN
    RETURN jsonb_build_object('replayed', true);
  END IF;

  SELECT * INTO v_bucket FROM public.speaking_credit_buckets
   WHERE user_id = p_user_id AND source = p_source AND source_ref = p_source_ref
   FOR UPDATE;
  IF FOUND AND v_bucket.remaining_seconds > 0 THEN
    v_removed := v_bucket.remaining_seconds;
    UPDATE public.speaking_credit_buckets SET remaining_seconds = 0 WHERE id = v_bucket.id;
    INSERT INTO public.speaking_minute_ledger (user_id, bucket_id, kind, seconds, idempotency_key, metadata)
    VALUES (p_user_id, v_bucket.id, 'revoke', v_removed, p_idempotency_key,
            jsonb_build_object('op_key', p_idempotency_key, 'source_ref', p_source_ref));
  END IF;

  UPDATE public.speaking_mission_entitlements
     SET attempts_remaining = 0
   WHERE user_id = p_user_id AND source_ref = p_source_ref AND attempts_remaining > 0;

  RETURN jsonb_build_object('replayed', false, 'revokedSeconds', v_removed);
END;
$$;

-- ---------------------------------------------------------------------------
-- Mission entitlements: grant the 12 included first attempts with an order,
-- consume one atomically at mission start.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.grant_mission_attempts(
  p_user_id uuid,
  p_source_ref text,
  p_mission_keys text[]
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_key text;
  v_created integer := 0;
BEGIN
  FOREACH v_key IN ARRAY p_mission_keys LOOP
    INSERT INTO public.speaking_mission_entitlements
      (user_id, mission_key, source_ref, attempts_total, attempts_remaining)
    VALUES (p_user_id, v_key, p_source_ref, 1, 1)
    ON CONFLICT (user_id, mission_key, source_ref) DO NOTHING;
    IF FOUND THEN v_created := v_created + 1; END IF;
  END LOOP;
  RETURN v_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_mission_attempt(
  p_user_id uuid,
  p_mission_key text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.speaking_mission_entitlements
   WHERE user_id = p_user_id AND mission_key = p_mission_key AND attempts_remaining > 0
   ORDER BY created_at
   LIMIT 1
   FOR UPDATE SKIP LOCKED;
  IF v_id IS NULL THEN
    RETURN false;
  END IF;
  UPDATE public.speaking_mission_entitlements
     SET attempts_remaining = attempts_remaining - 1
   WHERE id = v_id;
  RETURN true;
END;
$$;

-- ---------------------------------------------------------------------------
-- speaking_session_summary — the read model start/end/refund return, and the
-- balance the client may display (never authoritative client-side).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.speaking_session_summary(
  p_user_id uuid,
  p_session_token uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_reserved integer;
  v_consumed integer;
  v_refunded integer;
  v_status text;
  v_monthly integer;
  v_permanent integer;
BEGIN
  SELECT COALESCE(SUM(reserved_seconds), 0), COALESCE(SUM(consumed_seconds), 0), COALESCE(SUM(refunded_seconds), 0),
         COALESCE(MIN(status), 'none')
    INTO v_reserved, v_consumed, v_refunded, v_status
    FROM public.speaking_session_reservations
   WHERE session_token = p_session_token AND user_id = p_user_id;

  SELECT COALESCE(SUM(remaining_seconds) FILTER (WHERE expires_at IS NOT NULL AND expires_at > now()), 0),
         COALESCE(SUM(remaining_seconds) FILTER (WHERE expires_at IS NULL), 0)
    INTO v_monthly, v_permanent
    FROM public.speaking_credit_buckets
   WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'sessionToken', p_session_token,
    'reservedSeconds', v_reserved,
    'consumedSeconds', v_consumed,
    'refundedSeconds', v_refunded,
    'status', v_status,
    'balance', jsonb_build_object(
      'monthlySeconds', v_monthly,
      'permanentSeconds', v_permanent,
      'totalSeconds', v_monthly + v_permanent
    )
  );
END;
$$;

COMMIT;
