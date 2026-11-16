-- ============================================================================
-- DRAFT / NOT APPLIED. OWNER-APPLIED (plan "Stop the leaks", step 2).
--
-- Admits the 'welcome' kind into the lifecycle_emails CHECK, so the welcome
-- mail can be claimed BEFORE it is sent (UNIQUE(user_id, kind): one welcome
-- per account, ever).
--
-- Why: the welcome mail went out at account creation (database trigger,
-- 2026-08-16-welcome-email-webhook.sql) and raced the confirmation mail; its
-- button opened Lektion 1 without an account, so learners clicked it instead
-- of the confirmation link. netlify/functions/send-welcome-email.mjs now skips
-- unconfirmed accounts, and netlify/functions/confirmation-nudge.mjs (hourly)
-- sends their welcome within the hour after they confirm. Both claim this kind.
--
-- Until this is applied: a Google sign-up (confirmed at creation) still gets
-- the welcome from the webhook, unclaimed, as before; an email sign-up gets
-- NO welcome, because the hourly job's claim fails and it sends nothing.
-- Apply it when the PR merges.
--
-- No trigger, function, policy or data change. The trigger is untouched.
--
-- The CHECK below is the live one (read 2026-11-15:
-- pg_get_constraintdef on lifecycle_emails_kind_check) plus 'welcome'. The
-- draft 2026-11-01-retryable-lifecycle-mail.sql rewrites the same CHECK; it
-- now includes 'welcome' too, so applying it later does not drop the kind.
--
-- Verify after applying:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conname = 'lifecycle_emails_kind_check';   -- lists 'welcome'
-- ============================================================================

BEGIN;

ALTER TABLE public.lifecycle_emails
  DROP CONSTRAINT IF EXISTS lifecycle_emails_kind_check;
ALTER TABLE public.lifecycle_emails
  ADD CONSTRAINT lifecycle_emails_kind_check
  CHECK (
    kind IN (
      'trial_day3', 'trial_day6', 'trial_ended',
      'activation_d1', 'activation_d4',
      'confirm_nudge',
      'welcome'
    )
    OR kind ~ '^course_reminder_[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  );

COMMIT;

-- Rollback (the welcome rows must go first, or the old CHECK fails):
--   DELETE FROM public.lifecycle_emails WHERE kind = 'welcome';
--   ALTER TABLE public.lifecycle_emails DROP CONSTRAINT lifecycle_emails_kind_check;
--   ALTER TABLE public.lifecycle_emails ADD CONSTRAINT lifecycle_emails_kind_check
--     CHECK (kind IN ('trial_day3','trial_day6','trial_ended','activation_d1','activation_d4','confirm_nudge')
--       OR kind ~ '^course_reminder_[0-9]{4}-[0-9]{2}-[0-9]{2}$');
