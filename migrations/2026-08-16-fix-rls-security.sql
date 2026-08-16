-- ============================================================================
-- RLS security hardening — NOT auto-applied.
--
-- Run manually in the Supabase SQL editor (project omqyueddktqeyrrqvnyq).
-- Steps: 1) take a backup / note current policies, 2) run this file,
--        3) re-test: signup, login, subscription purchase (Lemon Squeezy
--           webhook), grammar pages as anonymous visitor, X-Ray, speaking.
--
-- What this fixes (see EVALUATION.md issues S-03, S-07, S-08):
--   1. Any logged-in user could INSERT/UPDATE their own `subscriptions` row
--      with the public anon key and self-grant Pro (the app reads paid access
--      from subscriptions.subscription_end).
--   2. Same for privileged `profiles` columns (is_subscribed, trial dates).
--   3. `webhook_logs` was readable/writable by everyone (raw Lemon Squeezy
--      payloads: emails, customer ids, order data).
--   4. `xray_usage` let ANY client read every anonymous row (including the
--      submitted sentences) and insert arbitrary rows.
--   5. Anonymous SELECT was open on ALL levels of reading/listening content;
--      the paywall existed only in the frontend. (Grammar tables stay
--      anon-readable on purpose: the Astro static build fetches them with the
--      anon key, and every grammar topic is published as a public SEO page.)
--
-- All statements are idempotent (DROP POLICY IF EXISTS / CREATE OR REPLACE).
-- The Lemon Squeezy webhook and all Netlify functions use the service-role
-- key, which BYPASSES RLS — removing user-write policies does not affect them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. subscriptions: users may read their own row, but only the service role
--    (webhook / verify-subscription function) may write.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
-- Keep: "Users can view own subscription" (SELECT USING auth.uid() = user_id)

-- ----------------------------------------------------------------------------
-- 2. profiles: users keep INSERT/UPDATE for onboarding and preferences, but a
--    trigger blocks non-service-role changes to privileged columns.
--    - is_subscribed can never be set truthy by a user.
--    - trial_started_at / trial_ends_at may be set once (on signup) but never
--      changed afterwards (prevents perpetual trial renewal).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
BEGIN
  -- The service role bypasses RLS but still fires triggers — let it through.
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_subscribed := false;
    RETURN NEW;
  END IF;

  -- UPDATE: privileged columns are frozen for non-service-role callers.
  NEW.is_subscribed    := OLD.is_subscribed;
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

-- If your profiles table also carries subscription_tier or similar privileged
-- columns added later, extend the trigger function above the same way.

-- ----------------------------------------------------------------------------
-- 3. webhook_logs: service-role only. RLS enabled with NO policies denies all
--    anon/authenticated access; the service role bypasses RLS entirely.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access on webhook_logs" ON public.webhook_logs;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. xray_usage: drop the `user_id IS NULL` escape hatch. Anonymous quota
--    checks run through the service-role key in analyze-sentence.mjs, so
--    clients don't need any access to anonymous rows.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own xray usage" ON public.xray_usage;
DROP POLICY IF EXISTS "Users can read own xray usage" ON public.xray_usage;

CREATE POLICY "Users can insert own xray usage" ON public.xray_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own xray usage" ON public.xray_usage
  FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. Paid content: limit ANONYMOUS access to free-tier levels only.
--    FREE_LEVELS in src/config/freeTier.js is ['a1.1'] — keep in sync.
--    Grammar tables are intentionally left anon-readable (see header).
--    Note: authenticated non-subscribers can still read all levels (as
--    before); full subscription-aware RLS is on the roadmap in EVALUATION.md.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reading lessons are viewable by everyone" ON public.reading_lessons;
CREATE POLICY "Reading lessons free tier for anon" ON public.reading_lessons
  FOR SELECT TO anon
  USING (lower(level) = 'a1.1');

DROP POLICY IF EXISTS "Listening exercises are viewable by everyone" ON public.listening_exercises;
CREATE POLICY "Listening exercises free tier for anon" ON public.listening_exercises
  FOR SELECT TO anon
  USING (lower(level) = 'a1.1');

DROP POLICY IF EXISTS "Listening questions are viewable by everyone" ON public.listening_questions;
CREATE POLICY "Listening questions free tier for anon" ON public.listening_questions
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.listening_exercises e
      WHERE e.id = listening_questions.exercise_id
        AND lower(e.level) = 'a1.1'
    )
  );

DROP POLICY IF EXISTS "Listening dialogues are viewable by everyone" ON public.listening_dialogues;
CREATE POLICY "Listening dialogues free tier for anon" ON public.listening_dialogues
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.listening_exercises e
      WHERE e.id = listening_dialogues.exercise_id
        AND lower(e.level) = 'a1.1'
    )
  );

-- ============================================================================
-- Rollback notes
-- ============================================================================
-- To restore the previous (insecure) behavior, re-run the policy blocks in:
--   supabase-subscription-schema.sql   (subscriptions / profiles self-write)
--   fix-subscription-schema.sql        (webhook_logs USING (true))
--   create-xray-usage-table.sql        (xray_usage with user_id IS NULL)
--   fix-anon-access-free-tier.sql      (anon USING (true) content policies)
-- and: DROP TRIGGER protect_profile_privileged_columns ON public.profiles;
--      DROP FUNCTION public.protect_profile_privileged_columns();
