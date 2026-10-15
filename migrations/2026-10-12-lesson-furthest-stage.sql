-- ============================================================================
-- Where a learner stops in a Lektion (2026-10-12)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- WHY. The Monday mail said how many learners OPENED A1.1 Lektion 1 (the
-- lesson_progress row is written when the page loads) and how many finished
-- it, and nothing in between: the player writes nothing until the recap.
-- 2026-09-12 → 10-12: 11 signed-in learners opened Lektion 1, 0 finished it,
-- and 9 left no trace after opening. The lesson_stage_viewed analytics event
-- (#204) sees only visitors who accepted cookies, and no agent session can
-- read it, so the drop-off point was unknowable from the database.
--
-- WHAT. Three nullable columns on lesson_progress, written by the player for
-- a signed-in learner each time a stage is shown
-- (src/services/lessonService.js recordFurthestStage), FORWARD ONLY — the
-- rank guard sits in that UPDATE's WHERE, so going Back or reopening an
-- earlier stage never lowers it:
--   furthest_stage       the stage key (src/lib/lesson/stageOrder.js)
--   furthest_stage_rank  its place in STAGE_ORDER (not the run's index: the
--                        warm-up shifts every index in a run that has one)
--   furthest_stage_at    when it was reached
-- updated_at is deliberately NOT touched by that write, so every metric that
-- reads it (l01_started, active_learners_7d, one_and_done_14d) keeps its
-- meaning week over week.
--
-- weekly_truth_metrics() is re-created with one added key at the end of the
-- course block, 'l01_stopped_at': for the rows counted in l01_started, how
-- many reached which stage, in stage order. Every other line is the live
-- definition: on 2026-10-12 the live prosrc equalled the body in
-- 2026-09-20-acquisition-attribution.sql minus one comment (md5 of the
-- whitespace-normalised text), and this file was generated from that body
-- with exactly three edits (cp's column list, the l1s CTE, the new key).
--
-- No new table and no new policy: lesson_progress already has RLS with
-- own-row SELECT/INSERT/UPDATE/DELETE for authenticated
-- (2026-09-12-lesson-engine.sql). One transaction.
-- ============================================================================

BEGIN;

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS furthest_stage      text,
  ADD COLUMN IF NOT EXISTS furthest_stage_rank smallint,
  ADD COLUMN IF NOT EXISTS furthest_stage_at   timestamptz;

-- A client writes these, so bound them: a short lowercase key, a small rank,
-- and the key and rank set together. A format check rather than a list of
-- keys, so a stage added to the player later is recorded, not rejected.
ALTER TABLE public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_furthest_stage_check;
ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_furthest_stage_check CHECK (
  (furthest_stage IS NULL) = (furthest_stage_rank IS NULL)
  AND (furthest_stage IS NULL OR furthest_stage ~ '^[a-z]{1,24}$')
  AND (furthest_stage_rank IS NULL OR furthest_stage_rank BETWEEN 0 AND 63)
);

COMMENT ON COLUMN public.lesson_progress.furthest_stage IS
  'Furthest Lektion stage this learner has been shown (src/lib/lesson/stageOrder.js). Forward only. NULL = none recorded: never pressed Start, or opened before 2026-10-12.';
COMMENT ON COLUMN public.lesson_progress.furthest_stage_rank IS
  'Rank of furthest_stage in STAGE_ORDER; the forward-only guard compares it.';

-- Weekly truth: where Lektion 1 learners stop.

CREATE OR REPLACE FUNCTION public.weekly_truth_metrics()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
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
    SELECT user_id, lower(level) AS level, lektion_id, status, completed_at, updated_at,
           furthest_stage, furthest_stage_rank
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
  -- Lektion 1, where each learner counted in l01_started got to (the same
  -- rows, so the buckets sum to l01_started). 'intro' = opened the page but no
  -- stage recorded: never pressed Start, or opened before the column existed.
  -- A finished row with no recorded stage counts as 'recap'.
  l1s AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('stage', stage, 'n', n) ORDER BY stage_rank), '[]'::jsonb) AS j
    FROM (
      SELECT CASE WHEN furthest_stage IS NOT NULL THEN furthest_stage
                  WHEN status IN ('complete','gold') THEN 'recap'
                  ELSE 'intro' END AS stage,
             min(CASE WHEN furthest_stage_rank IS NOT NULL THEN furthest_stage_rank
                      WHEN status IN ('complete','gold') THEN 99
                      ELSE -1 END) AS stage_rank,
             count(*) AS n
      FROM cp
      WHERE lektion_id = 'a1.1-l01' AND updated_at > now() - interval '14 days'
      GROUP BY 1
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
      'active_learners_7d', active_learners_7d,
      'l01_stopped_at', (SELECT j FROM l1s)) FROM cf),
    'acquisition', jsonb_build_object(
      'signups_by_source_7d', (SELECT j FROM aq_s),
      'signups_by_source_30d', (SELECT j FROM aq_s30),
      'signups_by_campaign_30d', (SELECT j FROM aq_c),
      'purchases_by_source_30d', (SELECT j FROM aq_p))
  );
$function$;

REVOKE ALL ON FUNCTION public.weekly_truth_metrics() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.weekly_truth_metrics() FROM anon, authenticated;

COMMIT;

-- Rollback (not part of the migration):
--   ALTER TABLE public.lesson_progress
--     DROP CONSTRAINT IF EXISTS lesson_progress_furthest_stage_check,
--     DROP COLUMN IF EXISTS furthest_stage_at,
--     DROP COLUMN IF EXISTS furthest_stage_rank,
--     DROP COLUMN IF EXISTS furthest_stage;
--   then re-run the weekly_truth_metrics() block of 2026-09-20-acquisition-attribution.sql.
