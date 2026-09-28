-- ============================================================================
-- Course v2 — the AI allowance ledger and the learner state the v2 player adds
--   (docs/course-v2/ENTITLEMENT.md; BLUEPRINT §1.5, §4.7, §5.6; SCHEMA §14)
-- Idempotent; safe to re-run. Apply by hand in the Supabase SQL editor, like
-- every file in this folder (migrations/README.md). Nothing here is required
-- for the LIVE site: the code that reads these tables degrades gracefully while
-- they are missing (see ENTITLEMENT.md "Before the migration"). Apply it BEFORE
-- any level enters COURSE_V2_LIVE or any paid v2 course is sold — until then the
-- spoken half of the course AI allowance is gated by access only.
--
-- What it creates / changes:
--   1. course_ai_usage        one row per graded v2 AI attempt: the lifetime
--                             per-slot allowance and the daily fair-use cap are
--                             COUNTED from it. Own-row read; service-role write
--                             only (every row stands for money spent).
--   2. exam_practice_results  the Prüfungsstand evidence (SCHEMA §14). Own-row
--                             read; the learner may insert only DETERMINISTIC
--                             rows (no AI range, no model, no rubric) — AI-graded
--                             rows are written by the functions with the service
--                             role, so a client cannot forge an AI result.
--                             Append-only (no UPDATE policy); delete own.
--   3. learner_goals          lane, exam date, pace, reminder — one row per
--                             (user, band) (SCHEMA §14). Own rows, all four
--                             verbs — nothing here is privileged.
--   3b. course_events         the course instrumentation (BLUEPRINT §7.8).
--                             Own-row read; the learner inserts only the
--                             client event names; append-only.
--   4. review_cards.kind      += 'teil', 'repair' (SCHEMA §2 card keys).
--   5. lesson_progress.status += 'tested_out' („Ich kann das schon", BLUEPRINT §3.5).
--
-- Deliberately NOT here: the writing_submissions / exam_attempts exam-key
-- CHECKs. The lean launch uses one lane per band (sd1 → goethe_a1, ga2 →
-- goethe_a2, tb1 → telc_b1, tb2 → telc_b2), and all four keys are already
-- admitted by 2026-09-05-goethe-a1-exam-key.sql / 2026-09-06-goethe-a2-track.sql
-- (writing_submissions) and the Abschlusstest migrations (exam_attempts). The
-- secondary lanes (telc_a2, goethe_b2, …) widen them when they ship.
--
-- Rollback (only while the tables are empty or disposable):
--   DROP TABLE IF EXISTS public.course_ai_usage;
--   DROP TABLE IF EXISTS public.exam_practice_results;
--   DROP TABLE IF EXISTS public.learner_goals;
--   DROP TABLE IF EXISTS public.course_events;
--   and re-add the previous review_cards / lesson_progress CHECKs if no row
--   carries a new kind/status.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. course_ai_usage — the purchase-aware course AI allowance ledger
-- ---------------------------------------------------------------------------
-- Written by netlify/functions/_shared/entitlement.mjs recordCourseAiUse(),
-- read by checkCourseAiAllowance(): COUNT(*) per (user_id, slot_key) for the
-- lifetime per-slot allowance, COUNT(*) per user since 00:00 UTC for the daily
-- cap. slot_key = bank_key without its lane suffix, so a lane switch never
-- doubles an allowance. The bank_key CHECK is SCHEMA §2's BANK_KEY_RE (the
-- test pins the two equal).
CREATE TABLE IF NOT EXISTS public.course_ai_usage (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level ~ '^(a1|a2|b1|b2)\.[12]$'),
  bank_key text NOT NULL
    CHECK (bank_key ~ '^(a1[12]|a2[12]|b1[12]|b2[12])-(u(?:0[1-9]|1[0-2])|p[1-3]|ht|dx|m[abc])-(w|s|mo)([1-8])?(?:-(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2))?$'),
  slot_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('writing', 'speaking', 'micro')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_ai_usage_user_slot_idx ON public.course_ai_usage (user_id, slot_key);
CREATE INDEX IF NOT EXISTS course_ai_usage_user_created_idx ON public.course_ai_usage (user_id, created_at DESC);

ALTER TABLE public.course_ai_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_ai_usage_select_own ON public.course_ai_usage;
CREATE POLICY course_ai_usage_select_own ON public.course_ai_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- NO client INSERT/UPDATE/DELETE policies on purpose — service-role writes only
-- (the writing_submissions / purchases doctrine: a learner who could delete
-- their own rows could reset their own allowance).

-- ---------------------------------------------------------------------------
-- 2. exam_practice_results — the Prüfungsstand evidence (SCHEMA §14, §5.6)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_practice_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level ~ '^(a1|a2|b1|b2)\.[12]$'),
  lane text NOT NULL,
  teil text NOT NULL,                         -- Teil template id, e.g. 'tb1.lv3'
  source text NOT NULL CHECK (source IN ('ls4', 'aufgabe', 'plateau', 'halbtest', 'diagnose', 'modelltest')),
  source_id text NOT NULL,                    -- block / task / form id
  form text CHECK (form IN ('a', 'b', 'c')),
  mode text NOT NULL CHECK (mode IN ('lern', 'pruefung')),
  full_length boolean NOT NULL,
  raw_score numeric NOT NULL,
  raw_max numeric NOT NULL,
  scaled_score numeric,
  scaled_max numeric,
  ai_range numeric[] CHECK (ai_range IS NULL OR array_length(ai_range, 1) = 2),
  rubric_profile text,
  model_id text,
  before_course_end boolean NOT NULL DEFAULT false,
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS epr_user_lane_idx
  ON public.exam_practice_results (user_id, lane, teil, created_at DESC);

ALTER TABLE public.exam_practice_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exam_practice_results_select_own ON public.exam_practice_results;
CREATE POLICY exam_practice_results_select_own ON public.exam_practice_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Deterministic Teile are scored on the client (the per-lane scorers); an
-- AI-graded row carries ai_range / model_id / rubric_profile and is written by
-- the grading function with the service role only.
DROP POLICY IF EXISTS exam_practice_results_insert_own_deterministic ON public.exam_practice_results;
CREATE POLICY exam_practice_results_insert_own_deterministic ON public.exam_practice_results
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND ai_range IS NULL AND model_id IS NULL AND rubric_profile IS NULL);
DROP POLICY IF EXISTS exam_practice_results_delete_own ON public.exam_practice_results;
CREATE POLICY exam_practice_results_delete_own ON public.exam_practice_results
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- No UPDATE policy: append-only.

-- ---------------------------------------------------------------------------
-- 3. learner_goals — lane, exam date, pace, reminder (SCHEMA §14)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learner_goals (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  band text NOT NULL CHECK (band IN ('a1', 'a2', 'b1', 'b2')),  -- one row per band: A1.2 (sd1) and B1.2 (tb1) coexist
  lane text,
  exam_date date,
  purpose text,
  pace text CHECK (pace IN ('leicht', 'standard', 'intensiv')),
  learning_days_per_week smallint CHECK (learning_days_per_week BETWEEN 1 AND 7),
  reminder_time time,
  reminder_channel text NOT NULL DEFAULT 'email',
  integrationskurs boolean,                   -- the DTZ gate question
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, band)
);

ALTER TABLE public.learner_goals ENABLE ROW LEVEL SECURITY;
-- Own row on all four verbs, WITH CHECK on every write path (a missing WITH
-- CHECK on an UPDATE policy is a documented past bug in this schema).
DROP POLICY IF EXISTS learner_goals_select_own ON public.learner_goals;
CREATE POLICY learner_goals_select_own ON public.learner_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS learner_goals_insert_own ON public.learner_goals;
CREATE POLICY learner_goals_insert_own ON public.learner_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS learner_goals_update_own ON public.learner_goals;
CREATE POLICY learner_goals_update_own ON public.learner_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS learner_goals_delete_own ON public.learner_goals;
CREATE POLICY learner_goals_delete_own ON public.learner_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3b. course_events — the course instrumentation (SCHEMA §14, BLUEPRINT §7.8)
-- ---------------------------------------------------------------------------
-- Written by src/lib/course-v2/progress.js logCourseEvent() for the learner's
-- own events; the AI-derived names are written by the functions with the
-- service role, so the client INSERT policy admits only the client names.
-- props never carries learner text or audio. Not a lesson source: every
-- lernschritt_completed also writes lesson_progress, which is the counted one.
CREATE TABLE IF NOT EXISTS public.course_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name IN ('lernschritt_completed', 'micro_output_submitted', 'aufgabe_submitted',
    'revision_submitted', 'ai_grade_shown', 'teil_attempt', 'modelltest_completed', 'plan_set',
    'retake_plan_created', 'mic_denied', 'ai_latency_ms', 'speaking_minutes', 'ai_cost_estimate',
    'consent_given', 'consent_withdrawn')),
  level text,
  unit_id text,
  step_id text,
  lane text,
  teil text,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ce_name_created_idx ON public.course_events (name, created_at);
CREATE INDEX IF NOT EXISTS ce_user_created_idx ON public.course_events (user_id, created_at);

ALTER TABLE public.course_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_events_select_own ON public.course_events;
CREATE POLICY course_events_select_own ON public.course_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS course_events_insert_own ON public.course_events;
CREATE POLICY course_events_insert_own ON public.course_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id
    AND name NOT IN ('ai_grade_shown', 'ai_latency_ms', 'speaking_minutes', 'ai_cost_estimate'));
-- No UPDATE / DELETE policy: an event log is append-only.

-- ---------------------------------------------------------------------------
-- 4 + 5. Widen two CHECKs of the lesson-engine tables
-- ---------------------------------------------------------------------------
-- The inline CHECKs of migrations/2026-09-12-lesson-engine.sql carry
-- auto-generated names. Rather than trusting the name, drop every CHECK on the
-- table that mentions the column, then add the widened one under a fixed name.
-- Guarded, so a database without the lesson-engine tables is left alone.
DO $$
DECLARE c record;
BEGIN
  IF to_regclass('public.review_cards') IS NOT NULL THEN
    FOR c IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.review_cards'::regclass AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%kind%'
    LOOP
      EXECUTE format('ALTER TABLE public.review_cards DROP CONSTRAINT %I', c.conname);
    END LOOP;
    ALTER TABLE public.review_cards ADD CONSTRAINT review_cards_kind_check
      CHECK (kind IN ('word', 'pattern', 'sentence', 'teil', 'repair'));
  END IF;

  IF to_regclass('public.lesson_progress') IS NOT NULL THEN
    FOR c IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.lesson_progress'::regclass AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
      EXECUTE format('ALTER TABLE public.lesson_progress DROP CONSTRAINT %I', c.conname);
    END LOOP;
    ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_status_check
      CHECK (status IN ('started', 'complete', 'gold', 'tested_out'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT tablename, policyname, cmd FROM pg_policies
--     WHERE tablename IN ('course_ai_usage', 'exam_practice_results', 'learner_goals', 'course_events')
--     ORDER BY 1, 2;
--     -- course_ai_usage: exactly 1 (SELECT) · exam_practice_results: 3 (SELECT, INSERT, DELETE)
--     -- learner_goals: 4 · course_events: 2 (SELECT, INSERT)
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conname IN ('review_cards_kind_check', 'lesson_progress_status_check');
--     -- lists 'teil', 'repair' and 'tested_out'
--   As an authenticated learner: INSERT INTO public.course_ai_usage (…) → RLS error.
--   As an authenticated learner: INSERT an exam_practice_results row with
--     model_id = 'x' → RLS error; the same row with model_id NULL → ok.
-- ---------------------------------------------------------------------------
