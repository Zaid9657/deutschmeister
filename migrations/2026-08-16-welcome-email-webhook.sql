-- ============================================================================
-- Welcome-email webhook — ALREADY APPLIED to project omqyueddktqeyrrqvnyq on
-- 2026-08-16 (as Supabase migration "welcome_email_webhook").
--
-- Finding: netlify/functions/send-welcome-email.mjs existed since launch but
-- NOTHING ever called it — no Supabase database webhook, no pg_net, and the
-- only auth.users trigger just created profile rows. 1,449 signups, zero
-- welcome emails sent.
--
-- Fix: pg_net (async HTTP from Postgres) + an AFTER INSERT trigger on
-- auth.users that POSTs the Supabase-webhook-style envelope the function
-- already parses, authenticated with the Bearer WEBHOOK_SECRET (created in
-- Netlify env the same day — the function previously 500'd on it missing).
--
-- The literal secret is embedded in the live function body; this record file
-- redacts it. To rotate: update WEBHOOK_SECRET in Netlify env AND re-run this
-- with the new value.
--
-- Verify: after the next signup,
--   SELECT status_code, content::text FROM net._http_response
--   ORDER BY id DESC LIMIT 5;   -- expect 200 from the Netlify function
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, pg_temp
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://deutsch-meister.de/.netlify/functions/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <WEBHOOK_SECRET from Netlify env>'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'users',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'raw_user_meta_data', NEW.raw_user_meta_data
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block a signup because the email call failed.
  RAISE WARNING 'notify_welcome_email failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_welcome_email();
