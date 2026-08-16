-- ============================================================================
-- RLS security hardening — ALREADY APPLIED to project omqyueddktqeyrrqvnyq
-- on 2026-08-16. Kept here as the record of what was changed.
--
-- Every statement is idempotent, so re-running this file is safe (and is how
-- you would rebuild the same state on a fresh/branch database).
--
-- IMPORTANT: the live database differed from the repo's schema SQL. Policies
-- had accumulated in the dashboard that the repo files never showed — several
-- named "Service role ..." were actually `TO public USING (true)`, i.e. they
-- granted every anonymous visitor full access. The statements below reflect
-- the ACTUAL live state that was fixed, not the repo files.
--
-- What this fixes (see EVALUATION.md: S-03, S-07, S-08, S-09):
--   1. Any logged-in user could INSERT/UPDATE their own `subscriptions` row and
--      flip `profiles.is_subscribed` — a one-line self-grant of Pro from the
--      browser console, since paid access is read from those columns.
--   2. `webhook_logs` was fully readable/writable by anyone (raw Lemon Squeezy
--      payloads: emails, customer ids, order data).
--   3. `xray_usage` exposed every anonymous row, including submitted sentences.
--   4. All paid reading/listening content was readable by any anonymous client
--      on every level; the paywall existed only in the frontend.
--
-- Verified after applying, as the `anon` role: subscriptions/webhook_logs/
-- xray_usage/payment_failures all return 0 rows; paid reading/listening return
-- 0 rows while free-tier (a1.1) still returns content; grammar still returns
-- all 64 topics (the Astro build depends on that).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. subscriptions — service-role writes only.
--    "Service role can manage all subscriptions" was TO public USING(true):
--    despite the name it granted every client full ALL access.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own subscription"        ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription"        ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;
-- keeps: "Users can view own subscription" (SELECT USING auth.uid() = user_id)

-- ----------------------------------------------------------------------------
-- 2. profiles — users keep INSERT/UPDATE (onboarding, preferences, starting a
--    trial), but privileged columns are frozen for non-service-role callers.
--
--    Deliberately SECURITY INVOKER: current_user must reflect the role
--    PostgREST switched to (anon / authenticated / service_role), which
--    SECURITY DEFINER would mask as the function owner.
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
  IF jwt_role = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin')
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_subscribed     := false;
    NEW.subscription_tier := NULL;
    RETURN NEW;
  END IF;

  NEW.is_subscribed     := OLD.is_subscribed;
  NEW.subscription_tier := OLD.subscription_tier;

  -- Trial dates may be set once but never rewritten, so a user cannot renew
  -- their own trial indefinitely.
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
-- 3. webhook_logs — RLS on with no policies denies all anon/authenticated
--    access; the service role bypasses RLS.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access on webhook_logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Service role only"                        ON public.webhook_logs;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. xray_usage — drop the `OR user_id IS NULL` escape hatch. Anonymous quota
--    accounting runs through the service role in analyze-sentence.mjs.
--    NOTE: the legacy INSERT policy name contains an embedded CRLF, so it is
--    dropped by lookup rather than by literal name.
-- ----------------------------------------------------------------------------
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='xray_usage' AND roles::text = '{public}'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.xray_usage', pol.policyname);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Users can insert own xray usage" ON public.xray_usage;
DROP POLICY IF EXISTS "Users can read own xray usage"   ON public.xray_usage;

CREATE POLICY "Users can insert own xray usage" ON public.xray_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own xray usage" ON public.xray_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. Paid content — anonymous access limited to the free tier (a1.1, matching
--    FREE_LEVELS in src/config/freeTier.js). Each table had THREE overlapping
--    permissive read policies; since policies are OR'd, all had to go.
--    Authenticated users keep full read access, preserving today's behavior —
--    making that subscription-aware is tracked in EVALUATION.md.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to reading_lessons"   ON public.reading_lessons;
DROP POLICY IF EXISTS "Anon can read reading_lessons"                 ON public.reading_lessons;
DROP POLICY IF EXISTS "Reading lessons are viewable by everyone"      ON public.reading_lessons;
CREATE POLICY "Reading lessons readable by authenticated" ON public.reading_lessons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reading lessons free tier for anon" ON public.reading_lessons
  FOR SELECT TO anon USING (lower(level) = 'a1.1');

DROP POLICY IF EXISTS "Anon can read listening_exercises"             ON public.listening_exercises;
DROP POLICY IF EXISTS "Anyone can read exercises"                     ON public.listening_exercises;
DROP POLICY IF EXISTS "Listening exercises are viewable by everyone"  ON public.listening_exercises;
CREATE POLICY "Listening exercises readable by authenticated" ON public.listening_exercises
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Listening exercises free tier for anon" ON public.listening_exercises
  FOR SELECT TO anon USING (lower(level) = 'a1.1');

DROP POLICY IF EXISTS "Anon can read listening_questions"             ON public.listening_questions;
DROP POLICY IF EXISTS "Anyone can read questions"                     ON public.listening_questions;
DROP POLICY IF EXISTS "Listening questions are viewable by everyone"  ON public.listening_questions;
CREATE POLICY "Listening questions readable by authenticated" ON public.listening_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Listening questions free tier for anon" ON public.listening_questions
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.listening_exercises e
            WHERE e.id = listening_questions.exercise_id AND lower(e.level) = 'a1.1')
  );

DROP POLICY IF EXISTS "Anon can read listening_dialogues"             ON public.listening_dialogues;
DROP POLICY IF EXISTS "Anyone can read dialogues"                     ON public.listening_dialogues;
DROP POLICY IF EXISTS "Listening dialogues are viewable by everyone"  ON public.listening_dialogues;
CREATE POLICY "Listening dialogues readable by authenticated" ON public.listening_dialogues
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Listening dialogues free tier for anon" ON public.listening_dialogues
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.listening_exercises e
            WHERE e.id = listening_dialogues.exercise_id AND lower(e.level) = 'a1.1')
  );
