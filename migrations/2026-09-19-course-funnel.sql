-- Course funnel in the weekly truth run.
--
-- What it enables: weekly_truth_metrics() (2026-09-03) measured one-and-done on
-- the grammar hub (user_grammar_progress), not on the course. The A1.1 rebuild
-- (docs/course-standard-2026-09-12.md) is judged by Lektion 1 → Lektion 2
-- continuation, and nothing measured it. This re-declares the function in full
-- (body copied verbatim from 2026-09-03-weekly-metrics.sql) and ADDS a `course`
-- block read from lesson_progress. Every other key is unchanged, so the
-- weekly_metrics history stays comparable row to row.
--
-- Windows mirror the existing blocks: the funnel counts and the one-and-done
-- cohort use the trailing 14 days (like grammar.one_and_done_14d); the active
-- learner count uses 7 days (like grammar.active_users_7d).
--
-- What lesson_progress holds (2026-09-12-lesson-engine.sql, verified live
-- 2026-09-19): level is stored LOWERCASE ('a1.1'), lektion_id is 'a1.1-l01' …
-- 'a1.1-l12', a passed checkpoint is upserted as 'a1.1-cp1' with status
-- 'complete'. There is no started_at: startLesson writes updated_at once
-- (ignoreDuplicates), completeLesson overwrites it with completed_at, so for a
-- started-only row updated_at IS the start time. Level is normalised with
-- lower() anyway.
--
-- Omitted on purpose: placement_to_course_7d. profiles.current_level has no
-- timestamp of its own (profiles.updated_at is touched by every profile write),
-- so "placed this week" is not derivable; add a placed_at column first.
--
-- Security: unchanged — SECURITY DEFINER (reads auth.users), EXECUTE revoked
-- from anon/authenticated, service role only.
--
-- How to test after applying: SELECT public.weekly_truth_metrics()->'course';
-- returns {"l01_started":…,"l1_to_l2_pct":…}. As authenticated: permission
-- denied. Rollback: re-run migrations/2026-09-03-weekly-metrics.sql (its
-- CREATE OR REPLACE restores the previous body).

CREATE OR REPLACE FUNCTION public.weekly_truth_metrics()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH
  u AS (
    SELECT count(*) AS total,
           count(email_confirmed_at) AS confirmed,
           count(*) FILTER (WHERE created_at > now() - interval '7 days') AS signups_7d,
           count(*) FILTER (WHERE created_at > now() - interval '30 days') AS signups_30d
    FROM auth.users
  ),
  -- "paying" = a live paid period that is still renewing: status active,
  -- price > 0. Cancelled-but-paid-through and unpaid/past_due grace periods
  -- still have access (checkSubscriptionStatus) but are not MRR — they are
  -- counted separately as at_risk so a churn wave is visible a week early.
  s AS (
    SELECT count(*) FILTER (WHERE subscription_end > now() AND plan_type IN ('monthly','yearly','quarterly') AND coalesce(price_paid,0) > 0 AND status = 'active') AS paying,
           count(*) FILTER (WHERE subscription_end > now() AND plan_type IN ('monthly','yearly','quarterly') AND coalesce(price_paid,0) > 0 AND status <> 'active') AS at_risk,
           count(*) FILTER (WHERE subscription_end > now() AND plan_type IN ('monthly','yearly','quarterly')) AS live_any,
           count(*) FILTER (WHERE subscription_end > now() AND plan_type = 'course') AS course_pro_windows,
           round(coalesce(sum(CASE WHEN subscription_end > now() AND coalesce(price_paid,0) > 0 AND status = 'active' THEN
             CASE plan_type WHEN 'yearly' THEN price_paid/12 WHEN 'quarterly' THEN price_paid/3 WHEN 'monthly' THEN price_paid ELSE 0 END END), 0), 2) AS mrr
    FROM public.subscriptions
  ),
  p AS (
    SELECT count(*) FILTER (WHERE created_at > now() - interval '7 days') AS sales_7d,
           coalesce(sum(price_paid) FILTER (WHERE created_at > now() - interval '7 days'), 0) AS revenue_7d,
           count(*) AS sales_all,
           coalesce(sum(price_paid), 0) AS revenue_all
    FROM public.purchases WHERE status = 'active'
  ),
  pb AS (
    SELECT coalesce(jsonb_object_agg(product_key, n), '{}'::jsonb) AS j
    FROM (SELECT product_key, count(*) AS n FROM public.purchases
          WHERE status = 'active' AND created_at > now() - interval '7 days' GROUP BY product_key) t
  ),
  g AS (
    SELECT count(DISTINCT user_id) AS active_users_7d
    FROM public.user_grammar_progress
    WHERE coalesce(last_accessed, created_at) > now() - interval '7 days'
  ),
  f AS (
    SELECT user_id, min(created_at) AS first_at, count(*) AS topics
    FROM public.user_grammar_progress GROUP BY user_id
  ),
  o AS (
    SELECT count(*) FILTER (WHERE first_at > now() - interval '14 days') AS new_cohort_14d,
           count(*) FILTER (WHERE first_at > now() - interval '14 days' AND topics = 1) AS one_and_done_14d
    FROM f
  ),
  l AS (
    SELECT coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) AS j
    FROM (SELECT kind, count(*) AS n FROM public.lifecycle_emails
          WHERE sent_at > now() - interval '7 days' GROUP BY kind) t
  ),
  w AS (
    SELECT count(*) AS total_7d,
           count(*) FILTER (WHERE processed = false) AS failed_7d
    FROM public.webhook_logs WHERE created_at > now() - interval '7 days'
  ),
  a AS (
    SELECT (SELECT count(*) FROM public.speaking_sessions WHERE created_at > now() - interval '7 days') AS speaking_7d,
           (SELECT count(*) FROM public.writing_submissions WHERE created_at > now() - interval '7 days') AS writing_7d,
           (SELECT count(*) FROM public.exam_attempts WHERE created_at > now() - interval '7 days') AS exams_7d,
           (SELECT count(*) FROM public.xray_usage WHERE used_at > now() - interval '7 days') AS xray_7d
  ),
  -- Course funnel (A1.1). "started" = a row exists for that Lektion whose last
  -- activity falls in the window; "finished" = completed in the window with
  -- status complete/gold. One row per (user, lektion), so counts are users.
  cp AS (
    SELECT user_id, lower(level) AS level, lektion_id, status, completed_at, updated_at
    FROM public.lesson_progress
    WHERE lower(level) = 'a1.1'
  ),
  cf AS (
    SELECT count(*) FILTER (WHERE lektion_id = 'a1.1-l01' AND updated_at > now() - interval '14 days') AS l01_started,
           count(*) FILTER (WHERE lektion_id = 'a1.1-l01' AND status IN ('complete','gold') AND completed_at > now() - interval '14 days') AS l01_finished,
           count(*) FILTER (WHERE lektion_id = 'a1.1-l02' AND updated_at > now() - interval '14 days') AS l02_started,
           count(*) FILTER (WHERE lektion_id = 'a1.1-l03' AND status IN ('complete','gold') AND completed_at > now() - interval '14 days') AS l03_finished,
           count(*) FILTER (WHERE lektion_id = 'a1.1-l12' AND status IN ('complete','gold') AND completed_at > now() - interval '14 days') AS l12_finished,
           count(*) FILTER (WHERE lektion_id = 'a1.1-cp1' AND status IN ('complete','gold') AND completed_at > now() - interval '14 days') AS checkpoint1_passed,
           count(DISTINCT user_id) FILTER (WHERE updated_at > now() - interval '7 days') AS active_learners_7d
    FROM cp
  ),
  -- One-and-done: the user's ONLY lesson_progress row (any level) is L1 of
  -- A1.1, still 'started', begun at least 2 days ago and inside the window.
  -- The 2-day floor keeps someone who started an hour ago out of the count.
  co AS (
    SELECT count(*) AS one_and_done_14d
    FROM (
      SELECT user_id
      FROM public.lesson_progress
      GROUP BY user_id
      HAVING count(*) = 1
         AND bool_and(lower(level) = 'a1.1' AND lektion_id = 'a1.1-l01' AND status = 'started' AND completed_at IS NULL)
         AND max(updated_at) BETWEEN now() - interval '14 days' AND now() - interval '2 days'
    ) t
  )
  SELECT jsonb_build_object(
    'measured_at', now(),
    'users', (SELECT to_jsonb(u) FROM u),
    'subscriptions', (SELECT to_jsonb(s) FROM s),
    'purchases', (SELECT to_jsonb(p) || jsonb_build_object('by_product_7d', (SELECT j FROM pb)) FROM p),
    'grammar', jsonb_build_object(
      'active_users_7d', (SELECT active_users_7d FROM g),
      'new_cohort_14d', (SELECT new_cohort_14d FROM o),
      'one_and_done_14d', (SELECT one_and_done_14d FROM o)),
    'lifecycle_emails_7d', (SELECT j FROM l),
    'webhooks_7d', (SELECT to_jsonb(w) FROM w),
    'ai_7d', (SELECT to_jsonb(a) FROM a),
    'course', (SELECT jsonb_build_object(
      'level', 'a1.1',
      'window_days', 14,
      'l01_started', l01_started,
      'l01_finished', l01_finished,
      'l02_started', l02_started,
      'l03_finished', l03_finished,
      'l12_finished', l12_finished,
      'checkpoint1_passed', checkpoint1_passed,
      'one_and_done_14d', (SELECT one_and_done_14d FROM co),
      -- null when nobody finished L1: a 0/0 must never read as 0 %.
      'l1_to_l2_pct', round(100.0 * l02_started / nullif(l01_finished, 0), 1),
      'active_learners_7d', active_learners_7d) FROM cf)
  );
$$;

REVOKE ALL ON FUNCTION public.weekly_truth_metrics() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.weekly_truth_metrics() FROM anon, authenticated;
