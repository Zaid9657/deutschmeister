-- Admin panel, phase 1 (Foundation) — docs/admin-panel.md.
--
-- What it enables: role-based access to the /admin/* panel (capabilities are
-- derived from ONE role column, see netlify/functions/_shared/adminRbacLib.mjs),
-- an append-only administrative record (admin_audit_log), and the search
-- indexes the user directory (phase 2) needs.
--
-- Additive only: no existing table is modified or dropped, and the new column
-- defaults to NULL = "no admin role", which is what every existing row already
-- means. Nothing a learner sees changes when this runs.
--
-- How to test after applying:
--   SELECT email, role FROM public.profiles WHERE role IS NOT NULL;   -- the seeded admins
--   As an authenticated user: UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
--     → the trigger silently keeps role unchanged (same posture as is_subscribed).
--   INSERT INTO public.admin_audit_log (...) as the service role works; UPDATE/DELETE fail.
--
-- Rollback (nothing else references any of this):
--   DROP TABLE public.admin_audit_log;
--   DROP INDEX IF EXISTS idx_profiles_email_trgm, idx_profiles_name_trgm,
--                        idx_profiles_created_at, idx_profiles_updated_at;
--   ALTER TABLE public.profiles DROP COLUMN role;
--   -- then re-apply the trigger body from migrations/2026-08-16-fix-rls-security.sql

-- ----------------------------------------------------------------------------
-- 1. The role column. One text column, five values; the capability matrix is
--    declared in code (adminRbacLib.mjs) and read against THIS value on every
--    admin request. A row a user may read (own-profile SELECT) but never write.
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IS NULL OR role IN ('admin', 'support', 'finance', 'auditor', 'content'));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Freeze `role` for non-service-role callers, alongside the paid-access
--    columns. Same function as 2026-08-16 with one column added; the SECURITY
--    INVOKER posture and the trusted-role list are unchanged.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
BEGIN
  -- Service role (Netlify functions, Lemon Squeezy webhook) and direct
  -- superuser/SQL-editor access are trusted.
  IF jwt_role = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin')
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_subscribed     := false;
    NEW.subscription_tier := NULL;
    NEW.role              := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE: paid-access columns and the admin role can never be changed by
  -- the user themselves.
  NEW.is_subscribed     := OLD.is_subscribed;
  NEW.subscription_tier := OLD.subscription_tier;
  NEW.role              := OLD.role;

  -- Trial dates may be set once (first trial start) but never rewritten,
  -- so a user cannot renew their own trial indefinitely.
  IF OLD.trial_started_at IS NOT NULL THEN
    NEW.trial_started_at := OLD.trial_started_at;
  END IF;
  IF OLD.trial_ends_at IS NOT NULL THEN
    NEW.trial_ends_at := OLD.trial_ends_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- ----------------------------------------------------------------------------
-- 3. Seed: the two owner accounts (src/config/admins.js) become `admin`.
--    Idempotent; every other row stays NULL.
-- ----------------------------------------------------------------------------
UPDATE public.profiles
   SET role = 'admin'
 WHERE lower(email) IN ('zaid199660@gmail.com', 'baraawail101@gmail.com')
   AND role IS DISTINCT FROM 'admin';

-- ----------------------------------------------------------------------------
-- 4. Search support for the user directory (phase 2). Every directory filter
--    is a database predicate, never a client-side sift, so the columns it
--    searches and sorts by get indexes now.
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles USING btree (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm ON public.profiles USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm  ON public.profiles USING gin (full_name gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- 5. The administrative record. The existing audit_logs table cannot serve:
--    its user_id is the TARGET of an event, it has no actor column, and its
--    rows are ordinary application events (logins). This table answers the
--    one question an audit trail exists for — who did this — and cannot be
--    edited: UPDATE and DELETE are revoked; correcting an entry means
--    appending another one.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),

  -- WHO. Never nullable: an entry that cannot name its actor is not an audit
  -- entry, and a mutation that cannot name its actor must fail rather than log.
  actor_id uuid NOT NULL REFERENCES auth.users (id),
  actor_role text NOT NULL,

  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,

  -- WHY. Required by the API for every sensitive action.
  reason text,

  before_state jsonb,
  after_state jsonb,

  correlation_id text,
  idempotency_key text UNIQUE,          -- a retried mutation cannot be recorded, or applied, twice

  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  error_message text,
  source text
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_occurred ON public.admin_audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor    ON public.admin_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target   ON public.admin_audit_log (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action   ON public.admin_audit_log (action);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No policy, deliberately: with RLS on and no policy, any client key reads
-- nothing. The service role bypasses RLS, so only the functions write, and
-- only the audit endpoint reads — through a capability check, not a key.

REVOKE UPDATE, DELETE, TRUNCATE ON public.admin_audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON public.admin_audit_log FROM anon, authenticated;
