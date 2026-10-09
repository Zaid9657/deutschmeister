-- ============================================================================
-- Revoke PUBLIC EXECUTE from the service-role-only SECURITY DEFINER functions.
-- APPLIED 2026-09-27 via the Supabase connector (see migrations/README.md). Idempotent.
--
-- Finding (Supabase security advisor, lints 0028 + 0029, measured 2026-09-27):
-- public.course_reminder_candidates(int,int,int) and
-- public.notify_welcome_email() are SECURITY DEFINER and executable by anon
-- and authenticated through /rest/v1/rpc/<name>. Both had
--     proacl = {=X/postgres,postgres=X/postgres,service_role=X/postgres}
-- The leading "=X" is PUBLIC. Every role inherits from PUBLIC, so the
--     REVOKE ... FROM anon, authenticated
-- lines in 2026-08-17-audit-remediation.sql (notify_welcome_email) and
-- 2026-09-13-course-reminder.sql (course_reminder_candidates) removed only the
-- explicit grants and changed nothing an anon caller could do.
--
-- Why both grants exist: Postgres gives EXECUTE on every new function to
-- PUBLIC, and this project's pg_default_acl for postgres in schema public
-- ALSO grants anon, authenticated and service_role explicitly. A new function
-- therefore carries both, and a lockdown must name PUBLIC as well as anon and
-- authenticated. tests/function-grants.test.mjs now fails any migration that
-- revokes from anon/authenticated without revoking from PUBLIC.
--
-- Who calls these (grep of src/, astro-site/src/, netlify/functions/ on
-- 2026-09-27 — the SPA and the Astro site make no .rpc() call at all):
--   course_reminder_candidates  netlify/functions/course-reminder.mjs, service
--                               role (SUPABASE_SERVICE_ROLE_KEY). Reads every
--                               learner's progress and opt-out flag: a browser
--                               must never see it.
--   notify_welcome_email        trigger on_auth_user_created_welcome on
--                               auth.users. Trigger functions are fired by the
--                               trigger, not called: EXECUTE is checked at
--                               CREATE TRIGGER time only. handle_new_user(),
--                               the sibling trigger on the same table, already
--                               has exactly this ACL and fired for all 52
--                               signups of the last 14 days (52/52 profiles).
--   weekly_truth_metrics        netlify/functions/weekly-truth.mjs, service
--                               role. Already correct live (no PUBLIC entry —
--                               2026-09-03 and 2026-09-19 revoked it); its
--                               latest record, 2026-09-20-acquisition-
--                               attribution.sql, repeats the anon/authenticated
--                               -only line. Re-stated here so the newest
--                               statement about it is a complete one. No-op.
--
-- Every other SECURITY DEFINER function in public (debit_speaking_wallet,
-- handle_new_user, the speaking wallet/session and mission functions) was
-- measured with proacl {postgres=X/postgres,service_role=X/postgres} and is
-- not touched.
--
-- Idempotent: REVOKE of a privilege not held and GRANT of one already held
-- are no-ops, so re-running is safe.
-- ============================================================================

BEGIN;

REVOKE EXECUTE ON FUNCTION public.course_reminder_candidates(int, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.course_reminder_candidates(int, int, int) TO service_role;

REVOKE EXECUTE ON FUNCTION public.notify_welcome_email() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_welcome_email() TO service_role;

REVOKE EXECUTE ON FUNCTION public.weekly_truth_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_truth_metrics() TO service_role;

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--
-- 1. The class, not the instance — must return ZERO rows:
--      SELECT p.oid::regprocedure AS fn, p.proacl
--      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--      WHERE n.nspname = 'public' AND p.prosecdef
--        AND (has_function_privilege('anon', p.oid, 'EXECUTE')
--             OR has_function_privilege('authenticated', p.oid, 'EXECUTE'));
--
-- 2. The three ACLs — each must read {postgres=X/postgres,service_role=X/postgres}
--    (no leading "=X/postgres"):
--      SELECT oid::regprocedure, proacl FROM pg_proc
--      WHERE oid IN ('public.course_reminder_candidates(int,int,int)'::regprocedure,
--                    'public.notify_welcome_email()'::regprocedure,
--                    'public.weekly_truth_metrics()'::regprocedure);
--
-- 3. The service role still reaches the selection function:
--      SELECT has_function_privilege('service_role',
--        'public.course_reminder_candidates(int,int,int)'::regprocedure, 'EXECUTE');  -- true
--    and the mailer still selects: call course-reminder with ?dry=1 and the
--    campaign secret — expect {"dry":true,"wouldSend":N}, not a
--    "course_reminder_candidates failed" error.
--
-- 4. Signups still fire the welcome webhook: after the next signup,
--      SELECT status_code FROM net._http_response ORDER BY id DESC LIMIT 5;  -- 200
--
-- 5. Security advisor (get_advisors, type security): the
--    anon_security_definer_function_executable and
--    authenticated_security_definer_function_executable findings are gone.
--
-- Rollback (restores the exact pre-migration ACLs; weekly_truth_metrics needs
-- none — it already had no PUBLIC entry). Rolling back re-opens both advisor
-- findings and no browser code calls either function, so there is no
-- functional reason to:
--   GRANT EXECUTE ON FUNCTION public.course_reminder_candidates(int, int, int) TO PUBLIC;
--   GRANT EXECUTE ON FUNCTION public.notify_welcome_email() TO PUBLIC;
-- ---------------------------------------------------------------------------
