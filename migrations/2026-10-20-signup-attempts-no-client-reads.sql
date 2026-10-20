-- ============================================================================
-- signup_attempts: no client role reads it.
-- APPLIED 2026-10-20 by the owner in the Supabase SQL editor (see migrations/README.md). Idempotent.
--
-- The table logs failed signups. The signup page only INSERTs into it
-- (src/pages/SignupPage.jsx, no read-back), and its one reader is the admin
-- marketing endpoint (netlify/functions/admin-marketing.mjs), which uses the
-- service role and so bypasses RLS. No client needs a SELECT policy, so the two
-- SELECT policies granted to authenticated (both USING (true)) are dropped.
-- The two INSERT policies stay.
--
-- Test (read-only): only the two INSERT policies remain.
--   select policyname, cmd from pg_policies
--    where schemaname = 'public' and tablename = 'signup_attempts';
--
-- Rollback: none intended. Recreating either policy lets every signed-in
-- account read the table again.
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read signup attempts" ON public.signup_attempts;
DROP POLICY IF EXISTS "Only admins can view" ON public.signup_attempts;
