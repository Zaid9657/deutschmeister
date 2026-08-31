-- ============================================================================
-- Vocabulary spaced repetition — renovation Phase 6
--   (docs/renovation-plan-2026-08-31.md; scheduler in src/services/srsScheduler.js)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- One card per (user, word). Before this, the 1,935-word vocabulary had no
-- practice mode at all and the "Mark learned" checkbox was never persisted for
-- logged-in users — anonymous visitors kept their marks, paying users lost
-- them on refresh. Cards ARE the persisted replacement.
--
-- words.id verified live as uuid (SELECT pg_typeof(id) FROM words, 2026-08-31).
--
-- RLS posture: own-row on all four verbs WITH CHECK on every write path — the
-- program_progress pattern verbatim (user preferences, no money involved;
-- DELETE allowed so a learner can remove a card from their deck).
--
-- Rollback: DROP TABLE IF EXISTS public.vocab_srs_cards;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vocab_srs_cards (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  ease numeric NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL DEFAULT now(),
  reps integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  last_grade smallint,
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, word_id)
);

CREATE INDEX IF NOT EXISTS vocab_srs_cards_due_idx
  ON public.vocab_srs_cards (user_id, due_at);

ALTER TABLE public.vocab_srs_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocab_srs_select_own" ON public.vocab_srs_cards;
CREATE POLICY "vocab_srs_select_own" ON public.vocab_srs_cards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vocab_srs_insert_own" ON public.vocab_srs_cards;
CREATE POLICY "vocab_srs_insert_own" ON public.vocab_srs_cards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vocab_srs_update_own" ON public.vocab_srs_cards;
CREATE POLICY "vocab_srs_update_own" ON public.vocab_srs_cards
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vocab_srs_delete_own" ON public.vocab_srs_cards;
CREATE POLICY "vocab_srs_delete_own" ON public.vocab_srs_cards
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT polname, polcmd FROM pg_policy
--     WHERE polrelid = 'public.vocab_srs_cards'::regclass;  -- 4 rows: r, a, w, d
-- ---------------------------------------------------------------------------
