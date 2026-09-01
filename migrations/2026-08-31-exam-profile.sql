-- ============================================================================
-- Exam identity on profiles — renovation Phase 4a
--   (docs/renovation-plan-2026-08-31.md; exam keys from src/data/examTracks.js)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- What this adds and why:
--   exam_track        — which exam the learner is preparing for ('none' = just
--                       learning). Drives the exam-first dashboard hierarchy
--                       and, later, mock-exam / writing-task defaults.
--   exam_date         — optional exam date; the dashboard renders a countdown.
--   daily_goal_target — the daily-goal ring's target, previously hardcoded to
--                       3 in src/services/dashboardStats.js; now user-settable
--                       within 1..10.
--
-- Security posture: all three are ordinary user preferences, client-writable
-- like current_level. The protect_profile_privileged_columns trigger
-- (2026-08-16-fix-rls-security.sql) pins only is_subscribed /
-- subscription_tier / trial dates and is untouched by this migration — it
-- ignores columns it does not name, so no trigger change is needed.
--
-- Rollback: ALTER TABLE public.profiles
--   DROP COLUMN IF EXISTS exam_track,
--   DROP COLUMN IF EXISTS exam_date,
--   DROP COLUMN IF EXISTS daily_goal_target;
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exam_track text,
  ADD COLUMN IF NOT EXISTS exam_date date,
  ADD COLUMN IF NOT EXISTS daily_goal_target integer NOT NULL DEFAULT 3;

-- CHECKs added separately so re-running after a partial apply stays safe.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_exam_track_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_exam_track_check
  CHECK (exam_track IS NULL OR exam_track IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'none'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_daily_goal_target_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_daily_goal_target_check
  CHECK (daily_goal_target BETWEEN 1 AND 10);

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT column_name, data_type FROM information_schema.columns
--     WHERE table_name = 'profiles'
--       AND column_name IN ('exam_track','exam_date','daily_goal_target');
--   -- and the CHECK must reject junk:
--   -- UPDATE public.profiles SET exam_track = 'ielts' WHERE false; -- (shape only)
-- ---------------------------------------------------------------------------
