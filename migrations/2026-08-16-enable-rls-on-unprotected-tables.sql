-- ============================================================================
-- CRITICAL: enable RLS on 13 tables that had it switched OFF entirely.
-- ALREADY APPLIED to project omqyueddktqeyrrqvnyq on 2026-08-16.
--
-- Found via Supabase's own security advisor, not the repo SQL — these tables
-- were created ad hoc in the dashboard and never appeared in any schema file.
--
-- The exposure: RLS disabled + the `anon` role holding SELECT/INSERT/UPDATE/
-- DELETE grants, while the anon key ships inside the client bundle. Anyone who
-- opened the site could rewrite or DELETE the entire course catalogue —
-- 64 grammar topics, 453 rules, 673 examples, 672 exercises, 1982 words — and
-- read or alter `payment_failures` and `mastery_purchases`. Three of the
-- tables even carried explicit "Allow public insert/update" policies, which
-- were dormant only because RLS was off and would have ACTIVATED the moment
-- RLS was enabled; they are dropped first below.
--
-- Safe because it is behavior-preserving: every content table is read-only
-- from both the SPA and the Astro build (verified: zero client writes), the
-- mastery_* tables are unreferenced anywhere in the codebase, and
-- payment_failures is written only by lemonsqueezy-webhook.mjs via the service
-- role, which bypasses RLS.
--
-- Verified after applying, as the `anon` role: grammar still returns all 64
-- topics (the Astro build needs this), while DELETE and UPDATE against the
-- catalogue now affect 0 rows and payment_failures/mastery_* return nothing.
-- ============================================================================

-- 1. Drop the permissive WRITE policies that would otherwise activate with RLS.
DROP POLICY IF EXISTS "Allow public insert on grammar"   ON public.grammar;
DROP POLICY IF EXISTS "Allow public update on grammar"   ON public.grammar;
DROP POLICY IF EXISTS "Allow public insert on sentences" ON public.sentences;
DROP POLICY IF EXISTS "Allow public update on sentences" ON public.sentences;
DROP POLICY IF EXISTS "Allow public insert on words"     ON public.words;
DROP POLICY IF EXISTS "Allow public update on words"     ON public.words;

-- 2. Content tables: RLS on, reads preserved for anon (Astro build + public SEO
--    pages) and authenticated (the app). No write policies => writes are
--    service-role only.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'grammar','grammar_topics','grammar_rules','grammar_examples',
    'grammar_exercises','grammar_introductions','sentences','words'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'dm_read_anon_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'dm_read_auth_' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)',
                   'dm_read_anon_' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
                   'dm_read_auth_' || t, t);
  END LOOP;
END;
$$;

-- 3. Service-role-only tables: RLS on with no policies denies every
--    anon/authenticated request.
ALTER TABLE public.payment_failures     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_purchases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_writing      ENABLE ROW LEVEL SECURITY;

-- 4. Function hardening.
--    debit_speaking_wallet moves wallet balances and is called only by
--    speaking-session.mjs via the service role, but was callable by anon and
--    authenticated over /rest/v1/rpc/ — letting any signed-in user debit or
--    probe wallets directly, bypassing the server-side pricing logic.
REVOKE EXECUTE ON FUNCTION public.debit_speaking_wallet(uuid, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- A mutable search_path lets a caller shadow objects a function references.
ALTER FUNCTION public.update_updated_at_column()          SET search_path = public, pg_temp;
ALTER FUNCTION public.set_trial_dates_on_profile_insert()  SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()                    SET search_path = public, auth, pg_temp;
