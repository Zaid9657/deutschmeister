-- Weekly truth run: the measurement loop that makes the project learn.
--
-- What it enables: netlify/functions/weekly-truth.mjs runs every Monday 06:00
-- UTC, calls weekly_truth_metrics() (one SQL pass over the tables that matter),
-- stores the JSON in weekly_metrics, and emails the owner a plain-text delta
-- against the previous row. Agent sessions read the latest row instead of
-- re-deriving revenue from scratch (the 2026-09-03 handoff had to correct an
-- earlier "9 subs, €75–90/mo" claim that was never re-measured).
--
-- Security: weekly_metrics has RLS on and NO policies — service role only.
-- The function is SECURITY DEFINER (it reads auth.users) and EXECUTE is
-- revoked from anon/authenticated, so only the service role can call it.
--
-- How to test after applying: SELECT public.weekly_truth_metrics(); as the
-- service role returns a JSON object with users/subscriptions/purchases/...
-- As authenticated: permission denied. Rollback: DROP FUNCTION
-- public.weekly_truth_metrics(); DROP TABLE public.weekly_metrics;

CREATE TABLE IF NOT EXISTS public.weekly_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measured_at timestamptz NOT NULL DEFAULT now(),
  metrics jsonb NOT NULL,
  summary text
);
ALTER TABLE public.weekly_metrics ENABLE ROW LEVEL SECURITY;
-- no policies on purpose: service-role only

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
    'ai_7d', (SELECT to_jsonb(a) FROM a)
  );
$$;

REVOKE ALL ON FUNCTION public.weekly_truth_metrics() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.weekly_truth_metrics() FROM anon, authenticated;
