-- ============================================================================
-- Acquisition attribution: which link brought each customer (2026-09-20)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- public/attribution.js records utm_* / ?ref= / the social referrer on the
-- first landing (localStorage dm_attribution). At signup the SPA passes that
-- record as auth.signUp user metadata; handle_new_user() below copies it into
-- profiles.acquisition_*. Nothing is written for existing users — the columns
-- stay NULL, and every reader treats NULL as "before tracking existed", never
-- as "direct".
--
-- No click ids (gclid/fbclid) are ever stored: only the campaign labels the
-- owner typed into the link, plus the referrer HOST (never the full URL).
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS acquisition_source      text,
  ADD COLUMN IF NOT EXISTS acquisition_medium      text,
  ADD COLUMN IF NOT EXISTS acquisition_campaign    text,
  ADD COLUMN IF NOT EXISTS acquisition_content     text,
  ADD COLUMN IF NOT EXISTS acquisition_referrer    text,
  ADD COLUMN IF NOT EXISTS acquisition_landing     text,
  ADD COLUMN IF NOT EXISTS acquisition_at          timestamptz,
  ADD COLUMN IF NOT EXISTS acquisition_last_source text;

COMMENT ON COLUMN public.profiles.acquisition_source IS
  'First-touch utm_source / ?ref= / classified referrer at first landing (public/attribution.js). NULL = signed up before 2026-09-20 or arrived direct.';

CREATE INDEX IF NOT EXISTS profiles_acquisition_source_idx
  ON public.profiles (acquisition_source) WHERE acquisition_source IS NOT NULL;

-- The profile-creation trigger, now also copying the attribution metadata.
-- Everything else is byte-for-byte the live definition (email, full_name
-- fallbacks, ON CONFLICT upsert). left(…, 200) bounds what a client can send.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, created_at, updated_at,
    acquisition_source, acquisition_medium, acquisition_campaign, acquisition_content,
    acquisition_referrer, acquisition_landing, acquisition_at, acquisition_last_source
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(m->>'full_name', m->>'name', ''),
    NOW(),
    NOW(),
    left(NULLIF(m->>'acquisition_source', ''), 200),
    left(NULLIF(m->>'acquisition_medium', ''), 200),
    left(NULLIF(m->>'acquisition_campaign', ''), 200),
    left(NULLIF(m->>'acquisition_content', ''), 200),
    left(NULLIF(m->>'acquisition_referrer', ''), 200),
    left(NULLIF(m->>'acquisition_landing', ''), 200),
    CASE WHEN m->>'acquisition_at' ~ '^\d{4}-\d{2}-\d{2}T' THEN (m->>'acquisition_at')::timestamptz ELSE NULL END,
    left(NULLIF(m->>'acquisition_last_source', ''), 200)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
    acquisition_source = COALESCE(profiles.acquisition_source, EXCLUDED.acquisition_source),
    acquisition_medium = COALESCE(profiles.acquisition_medium, EXCLUDED.acquisition_medium),
    acquisition_campaign = COALESCE(profiles.acquisition_campaign, EXCLUDED.acquisition_campaign),
    acquisition_content = COALESCE(profiles.acquisition_content, EXCLUDED.acquisition_content),
    acquisition_referrer = COALESCE(profiles.acquisition_referrer, EXCLUDED.acquisition_referrer),
    acquisition_landing = COALESCE(profiles.acquisition_landing, EXCLUDED.acquisition_landing),
    acquisition_at = COALESCE(profiles.acquisition_at, EXCLUDED.acquisition_at),
    acquisition_last_source = COALESCE(profiles.acquisition_last_source, EXCLUDED.acquisition_last_source),
    updated_at = NOW();

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- Weekly truth: signups and course sales by first-touch source, so the
-- Monday mail says which channel converts. weekly_truth_metrics() is
-- re-created with one added key ('acquisition'); every other key is unchanged.
CREATE OR REPLACE FUNCTION public.weekly_truth_metrics()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  WITH
  u AS (
    SELECT count(*) AS total,
           count(email_confirmed_at) AS confirmed,
           count(*) FILTER (WHERE created_at > now() - interval '7 days') AS signups_7d,
           count(*) FILTER (WHERE created_at > now() - interval '30 days') AS signups_30d
    FROM auth.users
  ),
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
  ),
  -- Acquisition: first-touch source on profiles. 'untracked' = signed up
  -- before the capture existed or arrived direct; the two are not separable.
  aq_s AS (
    SELECT coalesce(jsonb_object_agg(src, n), '{}'::jsonb) AS j
    FROM (SELECT coalesce(acquisition_source, 'untracked') AS src, count(*) AS n
          FROM public.profiles WHERE created_at > now() - interval '7 days' GROUP BY 1) t
  ),
  aq_s30 AS (
    SELECT coalesce(jsonb_object_agg(src, n), '{}'::jsonb) AS j
    FROM (SELECT coalesce(acquisition_source, 'untracked') AS src, count(*) AS n
          FROM public.profiles WHERE created_at > now() - interval '30 days' GROUP BY 1) t
  ),
  aq_p AS (
    SELECT coalesce(jsonb_object_agg(src, n), '{}'::jsonb) AS j
    FROM (SELECT coalesce(pr.acquisition_source, 'untracked') AS src, count(*) AS n
          FROM public.purchases pu LEFT JOIN public.profiles pr ON pr.id = pu.user_id
          WHERE pu.status = 'active' AND pu.created_at > now() - interval '30 days' GROUP BY 1) t
  ),
  aq_c AS (
    SELECT coalesce(jsonb_object_agg(c, n), '{}'::jsonb) AS j
    FROM (SELECT acquisition_source || ' / ' || acquisition_campaign AS c, count(*) AS n
          FROM public.profiles
          WHERE created_at > now() - interval '30 days' AND acquisition_campaign IS NOT NULL AND acquisition_source IS NOT NULL
          GROUP BY 1) t
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
      'l1_to_l2_pct', round(100.0 * l02_started / nullif(l01_finished, 0), 1),
      'active_learners_7d', active_learners_7d) FROM cf),
    'acquisition', jsonb_build_object(
      'signups_by_source_7d', (SELECT j FROM aq_s),
      'signups_by_source_30d', (SELECT j FROM aq_s30),
      'signups_by_campaign_30d', (SELECT j FROM aq_c),
      'purchases_by_source_30d', (SELECT j FROM aq_p))
  );
$function$;

REVOKE ALL ON FUNCTION public.weekly_truth_metrics() FROM anon, authenticated;
