-- ============================================================================
-- ALREADY APPLIED to project omqyueddktqeyrrqvnyq on 2026-08-17, as:
--   lifecycle_emails_2026_08_17
--   user_listening_progress_2026_08_17
--   user_listening_progress_columns_2026_08_17
--   (plus a data-only restore of grammar_topics titles — see the note at the end)
-- Idempotent; safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. lifecycle_emails — ledger for the trial lifecycle job
-- ---------------------------------------------------------------------------
-- netlify/functions/trial-lifecycle.mjs sends three one-off emails per user
-- (day 3, day 6, the day after the trial ends). The UNIQUE key is what makes a
-- daily cron safe: the row is claimed BEFORE the send, so a crash mid-run can
-- drop a message but can never duplicate one, and a re-run the same day is a
-- no-op.
CREATE TABLE IF NOT EXISTS public.lifecycle_emails (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind    text NOT NULL CHECK (kind IN ('trial_day3', 'trial_day6', 'trial_ended')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

CREATE INDEX IF NOT EXISTS lifecycle_emails_sent_at_idx ON public.lifecycle_emails (sent_at);

-- Service-role only: RLS on, no policies (same shape as webhook_logs).
ALTER TABLE public.lifecycle_emails ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. user_listening_progress — the table the SPA was already writing to
-- ---------------------------------------------------------------------------
-- CORRECTION to an earlier assumption: this table already existed — with zero
-- rows — and already had a policy. What it did NOT have were the `answers` and
-- `plays_used` columns that src/hooks/useListening.js:162 has always upserted,
-- so those writes failed. supabase-js resolves rather than throws on a REST
-- error and the caller only logs on throw, so completions were discarded
-- silently either way: no progress, no dashboard signal, nothing for the streak
-- to count. CREATE TABLE IF NOT EXISTS below is therefore a no-op in
-- production and documents the intended shape; the ALTERs are the real fix.
CREATE TABLE IF NOT EXISTS public.user_listening_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id  uuid NOT NULL REFERENCES public.listening_exercises(id) ON DELETE CASCADE,
  completed    boolean NOT NULL DEFAULT true,
  score        integer,
  answers      jsonb,
  plays_used   integer,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);

-- The two columns the client writes, missing from the live table.
ALTER TABLE public.user_listening_progress ADD COLUMN IF NOT EXISTS answers jsonb;
ALTER TABLE public.user_listening_progress ADD COLUMN IF NOT EXISTS plays_used integer;

-- Pre-existing catch-all (cmd=ALL, role PUBLIC, USING auth.uid() = user_id).
-- Own-rows-scoped, so not a hole — but redundant with the three explicit
-- policies below, and every extra permissive policy is evaluated per row.
DROP POLICY IF EXISTS "Users manage own progress" ON public.user_listening_progress;

CREATE INDEX IF NOT EXISTS user_listening_progress_user_idx
  ON public.user_listening_progress (user_id, completed_at);

ALTER TABLE public.user_listening_progress ENABLE ROW LEVEL SECURITY;

-- Own rows only. WITH CHECK is present on BOTH write paths — its absence on
-- speaking_sessions is what let clients forge and mutate rows there.
DROP POLICY IF EXISTS "Users can view own listening progress" ON public.user_listening_progress;
CREATE POLICY "Users can view own listening progress"
  ON public.user_listening_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own listening progress" ON public.user_listening_progress;
CREATE POLICY "Users can insert own listening progress"
  ON public.user_listening_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own listening progress" ON public.user_listening_progress;
CREATE POLICY "Users can update own listening progress"
  ON public.user_listening_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. grammar_topics titles (data-only, applied as 64 UPDATEs)
-- ---------------------------------------------------------------------------
-- Titles were punctuation-stripped in the DB exactly as the descriptions were:
-- "Adjective Declension Weak Mixed" instead of "Adjective Declension
-- (Weak/Mixed)", "Alphabet Pronunciation" instead of "Alphabet &
-- Pronunciation". Restored from src/data/grammarTopics.js, using the same
-- eight slug remappings verified for the descriptions. This changes 64 H1s and
-- page titles; to roll back, re-run with the previous values.
--
-- Reproduce with:
--   node scripts/… (see migrations/2026-08-17-content-backfill.md for the
--   generate-then-apply pattern), or dump current values first:
--   SELECT slug, title_en, title_de FROM grammar_topics ORDER BY slug;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- SELECT count(*) FILTER (WHERE title_en ~ '[(&/]') FROM grammar_topics;  -- 23
-- SELECT count(*) FROM pg_policy
--   WHERE polrelid = 'public.user_listening_progress'::regclass;          -- 3
-- SELECT count(*) FROM pg_policy
--   WHERE polrelid = 'public.lifecycle_emails'::regclass;                 -- 0
