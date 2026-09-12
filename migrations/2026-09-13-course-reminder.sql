-- ============================================================================
-- Course reminder: one ledger kind per day + ONE definition of "who is warm"
--   2026-09-13 · P4 "completion levers" of the A1.1 plan
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- HAND-APPLY REQUIRED BEFORE THE FEATURE CAN SEND ANYTHING, and it ships off
-- twice over like activation-lifecycle:
--   1. netlify/functions/course-reminder.mjs no-ops unless
--      COURSE_REMINDER_ENABLED is exactly 'true';
--   2. even switched on, an unmigrated database cannot send — selection calls
--      the function created below (absent → the run errors out and sends
--      nothing) and the claim insert is rejected by the old CHECK. A failed
--      claim means no send (claim-before-send), so unmigrated fails safe.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. lifecycle_emails.kind — admit ONE course_reminder kind per calendar day
-- ---------------------------------------------------------------------------
-- WHY A DATE INSIDE THE KIND, and not a new column.
-- The ledger's claim lock is UNIQUE(user_id, kind) — that is what makes
-- claim-before-send work for every other mailer, and nothing here is worth
-- reshaping it for. The other kinds are once-per-user-ever, so a bare name is
-- enough; a course reminder is a RECURRING message, so the unit of "already
-- claimed" is (user, day). Encoding the day in the kind
-- (`course_reminder_2026-09-13`) makes the existing unique index do exactly
-- that work, with no second column, no second index, and no change to the
-- other four jobs.
--   The alternative considered and rejected: add `sent_on date` plus a partial
-- UNIQUE(user_id, kind, sent_on). It would need every existing row backfilled
-- and every existing mailer's onConflict target changed — five files churned
-- to store a fact the kind can carry on its own.
--   The cost of this choice is that the CHECK can no longer be a bare IN list,
-- so it gains one anchored pattern branch. The pattern is strict: the prefix,
-- then exactly YYYY-MM-DD, nothing else — a typo'd kind is still rejected.
-- Weekly frequency ("at most 3 in 7 days") is NOT enforced here; it is counted
-- from this table by the function, which is the only place that can see a
-- rolling window.
ALTER TABLE public.lifecycle_emails
  DROP CONSTRAINT IF EXISTS lifecycle_emails_kind_check;
ALTER TABLE public.lifecycle_emails
  ADD CONSTRAINT lifecycle_emails_kind_check
  CHECK (
    kind IN (
      'trial_day3', 'trial_day6', 'trial_ended',
      'activation_d1', 'activation_d4',
      'confirm_nudge'
    )
    OR kind ~ '^course_reminder_[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  );

-- The rolling-window count reads (kind prefix, sent_at) per user; the existing
-- lifecycle_emails_sent_at_idx covers the date, this covers the per-user slice.
CREATE INDEX IF NOT EXISTS lifecycle_emails_user_kind_idx
  ON public.lifecycle_emails (user_id, kind);

-- ---------------------------------------------------------------------------
-- 2. course_reminder_candidates() — ONE definition of "warm course learner"
-- ---------------------------------------------------------------------------
-- CLAUDE.md's rule: funnel status has one definition, read by the mailer and
-- by any ad-hoc query, or the queue shown diverges from the queue mailed. The
-- activation journey has lifecycle_customer_state; this is its equivalent for
-- the course engine, and the mailer does not re-derive a single part of it.
--
-- "Warm" = a learner who is IN the course and paused mid-stride:
--   * has a lesson_progress row touched within p_window_days (default 30) —
--     someone who left three months ago is not warm, they are gone;
--   * whose LATEST course activity — the later of lesson_progress.updated_at
--     and lesson_attempts.created_at, i.e. finishing and working both count —
--     is between p_min_hours and p_max_hours ago (default 20–44 h). The floor
--     is what keeps the mail honest: a learner who studied today is never
--     told to come back today. The ceiling keeps it a nudge rather than a
--     win-back, and the two together mean a daily run reaches a given
--     yesterday-learner once.
--   * one row per user (their most recently touched level), never one per
--     level, so a learner cannot be mailed twice in a run.
--
-- It also returns `email_opted_out` (profiles.email_daily_sentence = false,
-- the same expression lifecycle_customer_state uses) and the next Lektion
-- number, derived from the highest COMPLETED Lektion — the course unlocks
-- strictly in order, so max(completed) + 1 is where the learner stands. The
-- caller clamps it to the level's Lektion count and looks the title up.
--
-- SECURITY DEFINER because it reads every user's rows (the tables are own-row
-- RLS for clients); revoked from anon and authenticated, granted to
-- service_role only — same posture as lifecycle_customer_state.
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
      count(*) FILTER (WHERE lp.status IN ('complete', 'gold'))::int AS done_count,
      max(NULLIF(regexp_replace(lp.lektion_id, '^.*-l', ''), '')::int)
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

REVOKE ALL ON FUNCTION public.course_reminder_candidates(int, int, int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.course_reminder_candidates(int, int, int) TO service_role;

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT count(*) FROM public.course_reminder_candidates();      -- the queue right now
--   SELECT * FROM public.course_reminder_candidates(0, 24 * 365);  -- should list every course learner
--   INSERT INTO public.lifecycle_emails (user_id, kind)
--     SELECT user_id, 'course_reminder_' || to_char(now(), 'YYYY-MM-DD')
--     FROM public.course_reminder_candidates(0, 24 * 365) LIMIT 1;
--   DELETE FROM public.lifecycle_emails WHERE kind LIKE 'course_reminder_%';
--     -- the insert must succeed (pattern branch) and this cleans it up
--   INSERT INTO public.lifecycle_emails (user_id, kind)
--     VALUES ('00000000-0000-0000-0000-000000000000', 'course_reminder_today');
--     -- must FAIL: the pattern rejects anything but a real date
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.course_reminder_candidates(int, int, int);
--   DELETE FROM public.lifecycle_emails WHERE kind LIKE 'course_reminder_%';
--   ALTER TABLE public.lifecycle_emails DROP CONSTRAINT lifecycle_emails_kind_check;
--   ALTER TABLE public.lifecycle_emails ADD CONSTRAINT lifecycle_emails_kind_check
--     CHECK (kind IN ('trial_day3','trial_day6','trial_ended',
--                     'activation_d1','activation_d4','confirm_nudge'));
-- ---------------------------------------------------------------------------
