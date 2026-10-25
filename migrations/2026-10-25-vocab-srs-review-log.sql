-- Cross-check 2026-10-25, AI-25 (C-188): keep every vocabulary-trainer review.
-- A vocab_srs_cards row holds only its LATEST review (last_reviewed_at), so a
-- day whose only activity was a trainer session vanished from both streaks
-- (the dashboard's strict one and the course home's Flame) as soon as those
-- cards were reviewed again: Monday's 20 reviews were overwritten on Tuesday.
--
-- public.vocab_srs_reviews is an append-only log, one row per review, filled
-- by an AFTER trigger on vocab_srs_cards whenever last_reviewed_at changes —
-- the app's write path (src/services/srsService.js recordReview) is unchanged.
-- src/services/dashboardStats.js reads it next to the card stamps and counts a
-- review both hold once; until this file is applied that read fails soft and
-- the card stamps count alone, exactly as before.
--
-- Learners SELECT their own rows (RLS) and cannot write any: the trigger
-- function is SECURITY DEFINER with a pinned search_path, revoked from every
-- client role, and swallows its own failure (RAISE WARNING) so logging can
-- never cost a learner the review itself. The backfill records each card's
-- current last_reviewed_at once (the reviews before it are already lost).
--
-- Idempotent (IF NOT EXISTS, DROP … IF EXISTS before CREATE, ON CONFLICT /
-- NOT EXISTS guards); owner applies.
-- Verify: grading a card in the vocabulary trainer adds one vocab_srs_reviews row
-- with reviewed_at = the card's new last_reviewed_at; another learner's rows
-- are invisible; re-running the file adds no rows.
-- Rollback: DROP TRIGGER IF EXISTS vocab_srs_review_log ON public.vocab_srs_cards;
--           DROP FUNCTION IF EXISTS public.log_vocab_srs_review();
--           DROP TABLE IF EXISTS public.vocab_srs_reviews;

BEGIN;

CREATE TABLE IF NOT EXISTS public.vocab_srs_reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  reviewed_at timestamptz NOT NULL
);

-- One row per review, and the dashboard's read (own rows, newest first).
CREATE UNIQUE INDEX IF NOT EXISTS vocab_srs_reviews_user_time_word_idx
  ON public.vocab_srs_reviews (user_id, reviewed_at, word_id);

ALTER TABLE public.vocab_srs_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocab_srs_reviews_select_own" ON public.vocab_srs_reviews;
CREATE POLICY "vocab_srs_reviews_select_own" ON public.vocab_srs_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.vocab_srs_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.vocab_srs_reviews TO authenticated;
GRANT ALL ON TABLE public.vocab_srs_reviews TO service_role;

CREATE OR REPLACE FUNCTION public.log_vocab_srs_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.last_reviewed_at IS NULL THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.last_reviewed_at IS NOT DISTINCT FROM OLD.last_reviewed_at THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.vocab_srs_reviews(user_id, word_id, reviewed_at)
      VALUES (NEW.user_id, NEW.word_id, NEW.last_reviewed_at)
      ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'vocab_srs_reviews: review not logged: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_vocab_srs_review() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS vocab_srs_review_log ON public.vocab_srs_cards;
CREATE TRIGGER vocab_srs_review_log
  AFTER INSERT OR UPDATE OF last_reviewed_at ON public.vocab_srs_cards
  FOR EACH ROW EXECUTE FUNCTION public.log_vocab_srs_review();

INSERT INTO public.vocab_srs_reviews(user_id, word_id, reviewed_at)
SELECT c.user_id, c.word_id, c.last_reviewed_at
FROM public.vocab_srs_cards c
WHERE c.last_reviewed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.vocab_srs_reviews r
    WHERE r.user_id = c.user_id AND r.word_id = c.word_id AND r.reviewed_at = c.last_reviewed_at
  )
ON CONFLICT DO NOTHING;

COMMIT;
