-- Lesson engine persistence (docs/course-standard-2026-09-12.md §3,
-- docs/course-factory/a11-rebuild/CONTRACT.md "Persistence").
--
-- What it enables: the in-app Lektion player at /course/:level/l/:nr. Two
-- tables, both own-rows under RLS, both written by the CLIENT with the user's
-- own JWT — nothing on this path uses the service role, because nothing here is
-- privileged (no entitlement, no money, no trial dates).
--
--   lesson_progress  one row per user per Lektion: started → complete → gold
--   lesson_attempts  one row per answered item, for error tags and review
--
-- Course-level completion keeps using program_progress with
-- program_key = '<level without the dot>_course' (e.g. 'a11_course') and
-- item_id = the Lektion id, so the existing CourseHome percent and the
-- certificate keep working untouched.
--
-- How to test after applying:
--   1. As the learner: INSERT a lesson_progress row for auth.uid() → ok;
--      for another user_id → RLS error.
--   2. SELECT own rows → visible; another user's → empty.
--   3. UPDATE own row status 'started' → 'gold' → ok.
--   4. INSERT a lesson_attempts row with a bad status/kind → CHECK error.
--
-- Rollback: DROP TABLE public.lesson_attempts; DROP TABLE public.lesson_progress;
-- (and public.review_cards, if the section at the foot of this file is applied).

-- 1. Per-Lektion progress and mastery.
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL,
  lektion_id text NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'complete', 'gold')),
  -- First-attempt accuracy, 0…1. 'gold' is >= 0.80 (standard §3).
  accuracy numeric,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lektion_id)
);
CREATE INDEX IF NOT EXISTS lesson_progress_user_level_idx ON public.lesson_progress (user_id, level);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
-- Own rows, all four paths. WITH CHECK on EVERY write path, including UPDATE —
-- a missing WITH CHECK on an UPDATE policy is a documented past bug here.
DROP POLICY IF EXISTS "Users can read own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can read own lesson progress" ON public.lesson_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can insert own lesson progress" ON public.lesson_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can update own lesson progress" ON public.lesson_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can delete own lesson progress" ON public.lesson_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. One row per answered item — the error-tag record the remediation sets and
--    the review queue read. Append-only in practice; no UPDATE policy is
--    granted, so a learner cannot rewrite their own history.
CREATE TABLE IF NOT EXISTS public.lesson_attempts (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL,
  lektion_id text NOT NULL,
  item_id text NOT NULL,
  stage text,
  correct boolean NOT NULL DEFAULT false,
  -- One of ERROR_TAGS in src/lib/lesson/check.js; NULL when correct.
  error_tag text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_attempts_user_lektion_idx ON public.lesson_attempts (user_id, lektion_id);
CREATE INDEX IF NOT EXISTS lesson_attempts_user_created_idx ON public.lesson_attempts (user_id, created_at DESC);

ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own lesson attempts" ON public.lesson_attempts;
CREATE POLICY "Users can read own lesson attempts" ON public.lesson_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own lesson attempts" ON public.lesson_attempts;
CREATE POLICY "Users can insert own lesson attempts" ON public.lesson_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own lesson attempts" ON public.lesson_attempts;
CREATE POLICY "Users can delete own lesson attempts" ON public.lesson_attempts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- review_cards: appended by the checkpoint/review agent
-- ---------------------------------------------------------------------------
-- (CONTRACT.md: review_cards(user_id, card_key, kind check in
--  ('word','pattern','sentence'), level, step smallint default 0, due_at,
--  lapses int default 0, last_result, primary key (user_id, card_key)) with
--  own-rows RLS on all four paths. Ladder days [1, 4, 7, 14, 60, 180],
--  lapse → step 0. Leave this marker in place; append below it.)

-- ============================================================================
-- >>> checkpoint agent section: review_cards <<<
-- Spaced review over words, grammar patterns and production sentences
-- (standard §3, "Spaced review"). The scheduler is the Babbel ladder
-- [1, 4, 7, 14, 60, 180] days with lapse → step 0 — src/lib/review/ladder.js is
-- the only place those numbers are computed; this table only stores the state.
--
-- Why a second table next to `vocab_srs_cards`: that deck is user-curated from
-- the word lists and runs SM-2-lite; this one is seeded automatically by the
-- lesson engine (reviewService.seedCardsForLektion) and covers three kinds, not
-- just words. Keeping them apart means the rebuild cannot regress the existing
-- vocabulary SRS.
--
-- Content deliberately lives in the curriculum module, not here: a card row is
-- only a key (`word:<wordId|de>`, `pattern:<slug>`, `sentence:<lektionId>:<idx>`),
-- so correcting a dialogue line corrects every review of it at once.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_cards (
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_key    text        NOT NULL,
  kind        text        NOT NULL CHECK (kind IN ('word', 'pattern', 'sentence')),
  level       text        NOT NULL,
  step        smallint    NOT NULL DEFAULT 0,
  due_at      timestamptz NOT NULL DEFAULT now(),
  lapses      integer     NOT NULL DEFAULT 0,
  last_result text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, card_key)
);

-- The only query the review screen makes: my cards, this level, due first.
CREATE INDEX IF NOT EXISTS review_cards_due_idx ON public.review_cards (user_id, level, due_at);

ALTER TABLE public.review_cards ENABLE ROW LEVEL SECURITY;

-- Own rows on all four verbs — the program_progress / vocab_srs_cards posture.
-- A review card carries no entitlement and no money, so the client owns it.
DROP POLICY IF EXISTS review_cards_select_own ON public.review_cards;
CREATE POLICY review_cards_select_own ON public.review_cards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS review_cards_insert_own ON public.review_cards;
CREATE POLICY review_cards_insert_own ON public.review_cards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS review_cards_update_own ON public.review_cards;
CREATE POLICY review_cards_update_own ON public.review_cards
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS review_cards_delete_own ON public.review_cards;
CREATE POLICY review_cards_delete_own ON public.review_cards
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Verify after applying:
--   SELECT policyname FROM pg_policies WHERE tablename = 'review_cards';  -- 4 rows
