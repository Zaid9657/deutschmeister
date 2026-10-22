-- Fix course reminders failing on completed checkpoint ids such as a1.1-cp1.
-- Only numbered Lektionen contribute to completion counts and the next number;
-- checkpoints still contribute to latest activity. Idempotent; owner applies.
-- Verify: call course_reminder_candidates with complete '*-cp1' progress;
-- it must return normally and keep that row's updated_at as activity.
-- Rollback: disable reminders, then restore the previous function definition.

BEGIN;

CREATE OR REPLACE FUNCTION public.course_reminder_candidates(
  p_min_hours   int DEFAULT 20,
  p_max_hours   int DEFAULT 44,
  p_window_days int DEFAULT 30
)
RETURNS TABLE (
  user_id           uuid,
  level             text,
  last_activity_at  timestamptz,
  done_count        int,
  next_lektion_nr   int,
  email_opted_out   boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH prog AS (
    SELECT
      lp.user_id,
      lower(lp.level) AS level,
      max(lp.updated_at) AS last_progress_at,
      count(*) FILTER (
        WHERE lp.status IN ('complete', 'gold') AND lp.lektion_id ~ '-l[0-9]+$'
      )::int AS done_count,
      max(substring(lp.lektion_id from '-l([0-9]+)$')::int)
        FILTER (WHERE lp.status IN ('complete', 'gold')) AS max_done_nr
    FROM public.lesson_progress lp
    WHERE lp.updated_at > now() - make_interval(days => p_window_days)
    GROUP BY lp.user_id, lower(lp.level)
  ),
  att AS (
    SELECT la.user_id, lower(la.level) AS level, max(la.created_at) AS last_attempt_at
    FROM public.lesson_attempts la
    WHERE la.created_at > now() - make_interval(days => p_window_days)
    GROUP BY la.user_id, lower(la.level)
  ),
  latest AS (
    SELECT
      p.user_id,
      p.level,
      p.done_count,
      p.max_done_nr,
      greatest(p.last_progress_at, coalesce(a.last_attempt_at, p.last_progress_at)) AS last_activity_at
    FROM prog p
    LEFT JOIN att a ON a.user_id = p.user_id AND a.level = p.level
  ),
  ranked AS (
    SELECT l.*, row_number() OVER (PARTITION BY l.user_id ORDER BY l.last_activity_at DESC) AS rn
    FROM latest l
  )
  SELECT
    r.user_id,
    r.level,
    r.last_activity_at,
    r.done_count,
    (coalesce(r.max_done_nr, 0) + 1) AS next_lektion_nr,
    (pr.email_daily_sentence IS NOT DISTINCT FROM false) AS email_opted_out
  FROM ranked r
  JOIN public.profiles pr ON pr.id = r.user_id
  WHERE r.rn = 1
    AND r.last_activity_at <= now() - make_interval(hours => p_min_hours)
    AND r.last_activity_at >  now() - make_interval(hours => p_max_hours);
$$;

REVOKE ALL ON FUNCTION public.course_reminder_candidates(int, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.course_reminder_candidates(int, int, int) TO service_role;

COMMIT;
