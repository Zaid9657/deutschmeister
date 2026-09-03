-- Confirmation nudge — one-time "finish creating your account" email for
-- signups that never confirmed their address (netlify/functions/
-- confirmation-nudge.mjs). Ships OFF: the function no-ops unless
-- CONFIRM_NUDGE_ENABLED='true', and until this migration is applied the
-- ledger's CHECK rejects the new kind, so claim-before-send means no claim →
-- no send (the same double lock as the activation lifecycle).
--
-- Why it exists: measured 2026-09-02, 496 of 1,551 signups have no
-- email_confirmed_at — invisible to every lifecycle mailer, unable to log in.
-- The auth logs show real users hitting the "Email not confirmed" wall and
-- leaving. This ledger kind lets the nudge mail each of them at most ONCE,
-- ever (UNIQUE(user_id, kind) is the claim lock, unchanged).
--
-- Apply by hand in the Supabase SQL editor (see migrations/README.md).

ALTER TABLE public.lifecycle_emails
  DROP CONSTRAINT IF EXISTS lifecycle_emails_kind_check;
ALTER TABLE public.lifecycle_emails
  ADD CONSTRAINT lifecycle_emails_kind_check
  CHECK (kind IN (
    'trial_day3', 'trial_day6', 'trial_ended',
    'activation_d1', 'activation_d4',
    'confirm_nudge'
  ));

-- Rollback:
--   ALTER TABLE public.lifecycle_emails DROP CONSTRAINT lifecycle_emails_kind_check;
--   ALTER TABLE public.lifecycle_emails ADD CONSTRAINT lifecycle_emails_kind_check
--     CHECK (kind IN ('trial_day3','trial_day6','trial_ended','activation_d1','activation_d4'));
--   DELETE FROM public.lifecycle_emails WHERE kind = 'confirm_nudge';
