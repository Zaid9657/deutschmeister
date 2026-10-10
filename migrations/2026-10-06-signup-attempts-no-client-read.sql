-- ============================================================================
-- signup_attempts: no client may read it (docs/auth-audit-2026-10-06.md, F1).
-- NOT YET APPLIED — apply by hand (see migrations/README.md). Idempotent.
--
-- Finding (pg_policies on omqyueddktqeyrrqvnyq, measured 2026-10-06): the
-- table that /signup writes every failed signup into (email, error, user
-- agent; it also has an ip_address column) carries two SELECT policies:
--
--   "Authenticated users can read signup attempts"  TO authenticated USING (true)
--   "Only admins can view"                          TO authenticated USING (true)
--
-- The second one's name says admins; its rule says everyone. Together they let
-- ANY signed-in account read every row with the anon key that ships in the SPA
-- bundle: supabase.from('signup_attempts').select('*') returned 278 rows and
-- 152 distinct email addresses of people who are not that account.
--
-- Who legitimately reads the table: only netlify/functions/admin-marketing.mjs,
-- with the service role, which bypasses RLS and needs no policy. The browser
-- only INSERTs (SignupPage.jsx logFailedSignup), and the two INSERT policies
-- stay as they are. After this, RLS stays ON with INSERT-only client access.
--
-- Rollback (not recommended): recreate either policy with USING (true).
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read signup attempts" ON public.signup_attempts;
DROP POLICY IF EXISTS "Only admins can view" ON public.signup_attempts;

-- Verify (expect 0 rows):
--   SELECT policyname FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'signup_attempts' AND cmd = 'SELECT';
