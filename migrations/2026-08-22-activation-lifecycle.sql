-- ============================================================================
-- Activation lifecycle: widen the email ledger + one funnel-state view
--   2026-08-22 · Batch E of docs/medmeister-parity-roadmap.md
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- HAND-APPLY REQUIRED BEFORE THE FEATURE CAN SEND ANYTHING. The code ships
-- fail-closed twice over: netlify/functions/activation-lifecycle.mjs no-ops
-- unless LIFECYCLE_ACTIVATION_ENABLED=true, and even switched on it cannot
-- send without this migration — selection reads the view created below, and
-- the claim insert is rejected by the old CHECK constraint. A claim that
-- fails means no send (claim-before-send), so an unmigrated database fails
-- in the safe direction.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. lifecycle_emails.kind — admit the two activation kinds
-- ---------------------------------------------------------------------------
-- The ledger's CHECK currently lists only the three trial kinds. Widen it;
-- the UNIQUE(user_id, kind) claim lock is unchanged and keeps doing the work.
ALTER TABLE public.lifecycle_emails
  DROP CONSTRAINT IF EXISTS lifecycle_emails_kind_check;
ALTER TABLE public.lifecycle_emails
  ADD CONSTRAINT lifecycle_emails_kind_check
  CHECK (kind IN (
    'trial_day3', 'trial_day6', 'trial_ended',
    'activation_d1', 'activation_d4'
  ));

-- ---------------------------------------------------------------------------
-- 2. lifecycle_customer_state — ONE definition of where a user is in the funnel
-- ---------------------------------------------------------------------------
-- The per-feature facts already exist server-side (user_grammar_progress,
-- user_listening_progress, user_reading_progress, profiles.is_subscribed).
-- What was missing is one place that joins them into a funnel status, so the
-- mailer, a dashboard, and an ad-hoc query all read the SAME definition and
-- the queue shown can never diverge from the queue mailed.
--
-- Column notes, because the live schema has bitten before:
--   - registered_at = profiles.trial_started_at. The trial starts at signup
--     (signup grants 7 days of Pro), and trial-lifecycle.mjs already selects
--     on this column in production, so it is verified live.
--   - Lesson activity is EXISTS over the three progress tables — deliberately
--     not a first_lesson_at timestamp. user_grammar_progress's timestamp
--     columns could not be verified from the repo (the client selects *), and
--     a view naming an absent column fails for every caller. Existence is
--     what the activation journey gates on; it needs nothing more.
--   - security_invoker so the view adds no privilege; access is then service
--     role only, like lifecycle_emails.
CREATE OR REPLACE VIEW public.lifecycle_customer_state
  WITH (security_invoker = true) AS
SELECT
  p.id                                            AS user_id,
  p.trial_started_at                              AS registered_at,
  COALESCE(p.is_subscribed, false)                AS is_subscribed,
  (p.email_daily_sentence IS NOT DISTINCT FROM false) AS email_opted_out,
  EXISTS (SELECT 1 FROM public.user_grammar_progress   g WHERE g.user_id = p.id) AS has_grammar_activity,
  EXISTS (SELECT 1 FROM public.user_listening_progress l WHERE l.user_id = p.id) AS has_listening_activity,
  EXISTS (SELECT 1 FROM public.user_reading_progress   r WHERE r.user_id = p.id) AS has_reading_activity,
  CASE
    WHEN COALESCE(p.is_subscribed, false) THEN 'subscribed'
    WHEN EXISTS (SELECT 1 FROM public.user_grammar_progress   g WHERE g.user_id = p.id)
      OR EXISTS (SELECT 1 FROM public.user_listening_progress l WHERE l.user_id = p.id)
      OR EXISTS (SELECT 1 FROM public.user_reading_progress   r WHERE r.user_id = p.id)
      THEN 'activated'
    ELSE 'new'
  END AS status
FROM public.profiles p;

-- Service-role only, same posture as lifecycle_emails: the view carries every
-- user's funnel position and no client has any business reading it.
REVOKE ALL ON public.lifecycle_customer_state FROM anon, authenticated;
GRANT SELECT ON public.lifecycle_customer_state TO service_role;

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT status, count(*) FROM public.lifecycle_customer_state GROUP BY 1;
--     -- expect the audit's shape: most users 'new', ~150 'activated', few 'subscribed'
--   INSERT INTO public.lifecycle_emails (user_id, kind)
--     SELECT user_id, 'activation_d1' FROM public.lifecycle_customer_state LIMIT 1;
--   DELETE FROM public.lifecycle_emails WHERE kind = 'activation_d1';
--     -- the insert must succeed (constraint widened) and the delete cleans up
-- ---------------------------------------------------------------------------
