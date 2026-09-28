-- ============================================================================
-- Every own-row UPDATE policy states its WITH CHECK (scorecard §3 #17).
-- NOT YET APPLIED — apply by hand (Supabase SQL editor, as postgres).
--
-- Finding (pg_policies on omqyueddktqeyrrqvnyq, measured 2026-09-28): five
-- UPDATE policies in public constrain ownership in USING and have no
-- WITH CHECK (with_check IS NULL), all five granted TO public:
--
--   user_grammar_notes     "Users can update own grammar notes"
--   user_grammar_progress  "Users can update own grammar progress"
--   user_progress          "Users can update own progress"
--   user_reading_progress  "Users can update own reading progress"
--   user_script_progress   "Users can update own script progress"
--
-- None of them came from migrations/ (they predate it: supabase-grammar-schema.sql
-- and the dashboard). Every UPDATE policy written in migrations/ already has
-- the check. user_progress also carries an identical policy WITH the check
-- ("enable_update_own_progress"), left as it is.
--
-- What the gap is, and what it is not. Postgres reuses USING as the check
-- when an UPDATE (or ALL) policy has no WITH CHECK. So a signed-in user can
-- NOT move their row to another user_id today: verified 2026-09-28 in
-- Postgres 17.5 (PGlite), where a USING-only policy answered that UPDATE
-- with "new row violates row-level security policy". The invariant holds
-- by fallback, and that is the problem:
--   1. It is invisible. pg_policies shows with_check = NULL, which reads as
--      "no check": the product agent logged #17 from exactly that reading,
--      and so will every audit, advisor query or dashboard glance.
--   2. It is coupled. The row check is whatever USING says. Widen USING
--      (an admin or shared-row read, say) and the write check widens with it,
--      silently.
--   3. TO public evaluates the policy for anon too. auth.uid() is NULL there,
--      so it never matches; TO authenticated says so.
-- This file therefore changes no behaviour for any caller: the check it
-- writes is the one Postgres already applies, and anon matched no row.
--
-- PREVIEW before applying (expect exactly the 5 rows above):
--   select tablename, policyname, roles, qual, with_check from pg_policies
--    where schemaname = 'public' and cmd in ('UPDATE','ALL')
--      and with_check is null and qual like '%auth.uid()%';
--
-- VERIFY after applying: the same query returns 0 rows, and the five
-- policies show roles {authenticated} and with_check (auth.uid() = user_id).
-- Then refresh tests/fixtures/db-policies.json (its "refresh" key) and empty
-- PENDING_APPLY in tests/rls-update-check.test.mjs: the test fails until both
-- match production again.
--
-- The whole file is one transaction and ends with a guard that aborts it if
-- ANY own-row UPDATE/ALL policy in public still lacks WITH CHECK (e.g. a
-- policy renamed in the dashboard since this was measured), so it either
-- closes the class or changes nothing.
--
-- ROLLBACK (restores the fallback form; not recommended, and nothing needs
-- it since behaviour is unchanged). ALTER POLICY cannot remove a WITH CHECK,
-- so per policy:
--   DROP POLICY "<name>" ON public.<table>;
--   CREATE POLICY "<name>" ON public.<table> FOR UPDATE TO public
--     USING (auth.uid() = user_id);
--
-- Guarded by tests/rls-update-check.test.mjs: no migration may define an
-- UPDATE/ALL policy without WITH CHECK, or with a check that drops an owner
-- column its USING names; the live snapshot is held to the same rule.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "Users can update own grammar notes" ON public.user_grammar_notes;
CREATE POLICY "Users can update own grammar notes" ON public.user_grammar_notes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own grammar progress" ON public.user_grammar_progress;
CREATE POLICY "Users can update own grammar progress" ON public.user_grammar_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reading progress" ON public.user_reading_progress;
CREATE POLICY "Users can update own reading progress" ON public.user_reading_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own script progress" ON public.user_script_progress;
CREATE POLICY "Users can update own script progress" ON public.user_script_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- The class, not the five: abort if any own-row UPDATE/ALL policy is left
-- without its check.
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(format('%I.%I', tablename, policyname), ', ' ORDER BY tablename, policyname)
    INTO missing
    FROM pg_policies
   WHERE schemaname = 'public'
     AND cmd IN ('UPDATE', 'ALL')
     AND with_check IS NULL
     AND qual LIKE '%auth.uid()%';
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'UPDATE/ALL policies still without WITH CHECK: %', missing;
  END IF;
END $$;

COMMIT;
