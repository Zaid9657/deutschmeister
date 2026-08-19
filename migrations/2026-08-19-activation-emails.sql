-- Activation email: widen the lifecycle_emails ledger
--
-- Verification queries at the end:
--   activation_kind_allowed_2026_08_19
--   activation_index_2026_08_19
-- Idempotent; safe to re-run.
--
-- Why
-- ---
-- 136 of the 152 accounts created in the last 30 days (89%) have never
-- completed a single grammar topic, and 1,305 accounts have never started one
-- at all. The three existing lifecycle emails are keyed on trial dates and go
-- out regardless of what the learner has done, so nothing in the system reacts
-- to "signed up and never came back" — which is the funnel's actual failure.
--
-- `netlify/functions/trial-lifecycle.mjs` gains an `activation_day1` message
-- for exactly that population. The ledger's CHECK constraint has to allow the
-- new kind or every insert fails, and the insert is what claims the send.

-- 1. Allow the new kind ------------------------------------------------------
-- Dropping and recreating is the only way to widen a CHECK; the constraint name
-- is the one Postgres generated for the original inline CHECK.
ALTER TABLE public.lifecycle_emails
  DROP CONSTRAINT IF EXISTS lifecycle_emails_kind_check;

ALTER TABLE public.lifecycle_emails
  ADD CONSTRAINT lifecycle_emails_kind_check
  CHECK (kind IN ('trial_day3', 'trial_day6', 'trial_ended', 'activation_day1'));

-- 2. Index the lookup the job performs every run -----------------------------
-- selectRecipients() filters `kind` then `user_id IN (...)`; with only the
-- UNIQUE(user_id, kind) index available, that leading-column mismatch made it a
-- scan. Cheap to add, and the table grows by one row per user per kind forever.
CREATE INDEX IF NOT EXISTS lifecycle_emails_kind_user_idx
  ON public.lifecycle_emails (kind, user_id);

-- ── verification ────────────────────────────────────────────────────────────
-- activation_kind_allowed_2026_08_19 — expect the 4-value list
--   SELECT pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'public.lifecycle_emails'::regclass
--     AND conname = 'lifecycle_emails_kind_check';
--
-- activation_index_2026_08_19 — expect 1 row
--   SELECT indexname FROM pg_indexes
--   WHERE tablename = 'lifecycle_emails'
--     AND indexname = 'lifecycle_emails_kind_user_idx';
--
-- Population the new message will address (expect a non-zero count):
--   SELECT count(*) FROM profiles p
--   WHERE p.created_at > now() - interval '2 days'
--     AND p.created_at <= now() - interval '1 day'
--     AND p.is_subscribed IS NOT TRUE
--     AND p.email_daily_sentence IS NOT FALSE
--     AND NOT EXISTS (SELECT 1 FROM user_grammar_progress g WHERE g.user_id = p.id);
