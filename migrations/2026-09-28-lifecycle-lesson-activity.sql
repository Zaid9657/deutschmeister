-- ============================================================================
-- lifecycle_customer_state counts EVERY kind of lesson activity
--   2026-09-28 · docs/SCORECARD.md §3 #8c (Activation)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- WHY. The view is the ONE definition of funnel status. activation-lifecycle.mjs
-- mails only status = 'new', and its copy assumes the reader has not started a
-- lesson. The 2026-08-22 definition counted three progress tables (grammar,
-- listening, reading). Everything built since then writes somewhere else: the
-- A1.1 course player (lesson_progress, lesson_attempts, review_cards,
-- program_progress), AI-graded writing, mock exams, the vocabulary trainer and
-- AI speaking. So a learner working through A1.1 stayed 'new' and was mailed.
--
-- Measured 2026-09-28 09:31 UTC (read-only, counts only): of 160 activation
-- mails in the last 30 days (87 users), 6 mails to 3 users went to learners
-- who had opened an A1.1 Lektion before the send (lesson_progress 'started',
-- on average 34 h before the d1 mail; each got d1 AND d4). Counting every
-- source below, 30 mails to 17 users had lesson activity before the send.
-- 20 of the 1,505 'new' users move to 'activated': 2 course, 4 mock exam,
-- 1 vocabulary, 14 speaking (they overlap).
--
-- WHAT. One boolean, has_lesson_activity, an OR over every lesson-activity
-- source, and status reads it. A source is a table where a row means the
-- learner opened or answered teaching content. tests/lifecycle.test.mjs holds
-- the list (LESSON_ACTIVITY_SOURCES) and fails when:
--   - a listed source is missing between the markers below, or an unlisted
--     table appears there;
--   - the app or a function writes a table nobody has classified as a source
--     or as not-a-lesson (so the next progress table cannot be forgotten);
--   - the mailer queries an activity table itself instead of this view.
--
-- Placement speaking sessions are left out on purpose: a placement
-- conversation is a level check, like the level test, not a lesson.
--
-- Column order: CREATE OR REPLACE VIEW may only append columns, so the eight
-- existing columns keep their names, order and types, and has_lesson_activity
-- is added at the end. has_grammar/listening/reading_activity stay for any
-- existing reader; status no longer reads them.
--
-- ORDER OF OPERATIONS. Apply this BEFORE deploying the matching
-- activation-lifecycle.mjs. That function selects has_lesson_activity, so on
-- an unmigrated database its query errors and the run sends nothing. It fails
-- closed, never on the old definition.
-- ============================================================================

CREATE OR REPLACE VIEW public.lifecycle_customer_state
  WITH (security_invoker = true) AS
SELECT
  p.id                                                AS user_id,
  p.trial_started_at                                  AS registered_at,
  COALESCE(p.is_subscribed, false)                    AS is_subscribed,
  (p.email_daily_sentence IS NOT DISTINCT FROM false) AS email_opted_out,
  EXISTS (SELECT 1 FROM public.user_grammar_progress   g WHERE g.user_id = p.id) AS has_grammar_activity,
  EXISTS (SELECT 1 FROM public.user_listening_progress l WHERE l.user_id = p.id) AS has_listening_activity,
  EXISTS (SELECT 1 FROM public.user_reading_progress   r WHERE r.user_id = p.id) AS has_reading_activity,
  CASE
    WHEN COALESCE(p.is_subscribed, false) THEN 'subscribed'
    WHEN a.has_lesson_activity THEN 'activated'
    ELSE 'new'
  END                                                 AS status,
  a.has_lesson_activity                               AS has_lesson_activity
FROM public.profiles p
CROSS JOIN LATERAL (
  SELECT (
    -- lesson-activity sources: begin
    -- (one line per table; tests/lifecycle.test.mjs LESSON_ACTIVITY_SOURCES must match)
       EXISTS (SELECT 1 FROM public.user_grammar_progress   x WHERE x.user_id = p.id)  -- grammar lesson
    OR EXISTS (SELECT 1 FROM public.user_listening_progress x WHERE x.user_id = p.id)  -- listening lesson
    OR EXISTS (SELECT 1 FROM public.user_reading_progress   x WHERE x.user_id = p.id)  -- reading lesson
    OR EXISTS (SELECT 1 FROM public.lesson_progress         x WHERE x.user_id = p.id)  -- course player: Lektion opened or finished
    OR EXISTS (SELECT 1 FROM public.lesson_attempts         x WHERE x.user_id = p.id)  -- course player / checkpoint: an answered item
    OR EXISTS (SELECT 1 FROM public.review_cards            x WHERE x.user_id = p.id)  -- course spaced review
    OR EXISTS (SELECT 1 FROM public.program_progress        x WHERE x.user_id = p.id)  -- course/program item ticked done
    OR EXISTS (SELECT 1 FROM public.writing_submissions     x WHERE x.user_id = p.id)  -- AI-graded writing task
    OR EXISTS (SELECT 1 FROM public.exam_attempts           x WHERE x.user_id = p.id)  -- mock exam / Abschlusstest section
    OR EXISTS (SELECT 1 FROM public.vocab_srs_cards         x WHERE x.user_id = p.id)  -- vocabulary trainer
    OR EXISTS (SELECT 1 FROM public.speaking_sessions       x WHERE x.user_id = p.id
                 AND COALESCE(x.mode, '') <> 'placement')                             -- AI speaking (not the placement check)
    -- lesson-activity sources: end
  ) AS has_lesson_activity
) a;

-- Same posture as 2026-08-22: service role only. CREATE OR REPLACE keeps the
-- grants, but restating them keeps this file correct on its own.
REVOKE ALL ON public.lifecycle_customer_state FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lifecycle_customer_state TO service_role;

-- ---------------------------------------------------------------------------
-- Preview (run BEFORE applying; read-only): how many 'new' users move.
--   Measured 2026-09-28: 1,505 'new', 20 of them with lesson activity.
--
--   SELECT count(*) FILTER (WHERE v.status = 'new') AS new_now,
--          count(*) FILTER (WHERE v.status = 'new' AND (
--               EXISTS (SELECT 1 FROM public.lesson_progress     x WHERE x.user_id = v.user_id)
--            OR EXISTS (SELECT 1 FROM public.lesson_attempts     x WHERE x.user_id = v.user_id)
--            OR EXISTS (SELECT 1 FROM public.review_cards        x WHERE x.user_id = v.user_id)
--            OR EXISTS (SELECT 1 FROM public.program_progress    x WHERE x.user_id = v.user_id)
--            OR EXISTS (SELECT 1 FROM public.writing_submissions x WHERE x.user_id = v.user_id)
--            OR EXISTS (SELECT 1 FROM public.exam_attempts       x WHERE x.user_id = v.user_id)
--            OR EXISTS (SELECT 1 FROM public.vocab_srs_cards     x WHERE x.user_id = v.user_id)
--            OR EXISTS (SELECT 1 FROM public.speaking_sessions   x WHERE x.user_id = v.user_id
--                         AND COALESCE(x.mode, '') <> 'placement'))) AS new_to_activated
--   FROM public.lifecycle_customer_state v;
--
-- Verification (run AFTER applying):
--   SELECT status, count(*) FROM public.lifecycle_customer_state GROUP BY 1;
--     -- 'new' drops by the preview's new_to_activated; 'subscribed' unchanged
--   SELECT count(*) FROM public.lifecycle_customer_state
--    WHERE status = 'new' AND has_lesson_activity;
--     -- must be 0
--   SELECT count(*) FROM public.lifecycle_customer_state v
--    WHERE v.status = 'new'
--      AND EXISTS (SELECT 1 FROM public.lesson_progress x WHERE x.user_id = v.user_id);
--     -- must be 0: no A1.1 learner is left in the activation audience
--
-- Rollback: re-run the CREATE OR REPLACE VIEW from
-- migrations/2026-08-22-activation-lifecycle.sql, after first dropping
-- has_lesson_activity with DROP VIEW + CREATE, since a replace cannot remove a
-- column. Do that only together with reverting activation-lifecycle.mjs,
-- which reads the column.
-- ---------------------------------------------------------------------------
