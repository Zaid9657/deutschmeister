-- AI cost ledger (controller c1): one metadata-only row per provider call.
-- PENDING APPLY — not yet applied. Additive only; no production data changed.
-- No prompt, answer, audio, email, IP, or anonymous identifier is stored.
-- Tokens are provider totals; thinking_tokens is a reported subset, not extra output.
-- retries is the zero-based attempt number (0 first call, 1 first retry).
-- Test: node --test tests/ai-usage.test.mjs tests/migration-advisors.test.mjs
-- After applying by hand: verify service_role INSERT/SELECT and permission denied
-- for anon/authenticated. Update the README and schema fixture only after applying.
-- Rollback: commented block at the end; deploys tolerate a missing table.

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  anon boolean NOT NULL,
  feature text NOT NULL,
  provider text,
  model text,
  input_tokens integer,
  output_tokens integer,
  thinking_tokens integer,
  audio_seconds numeric,
  retries integer NOT NULL DEFAULT 0,
  failed boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created_at ON public.ai_usage (user_id, created_at);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role may read or write this ledger.
REVOKE ALL ON TABLE public.ai_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.ai_usage TO service_role;

DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.ai_usage'::regclass)
     OR EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_usage') THEN
    RAISE EXCEPTION 'ai_usage must have RLS enabled and no policies';
  END IF;
  IF has_table_privilege('anon', 'public.ai_usage', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
     OR has_table_privilege('authenticated', 'public.ai_usage', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
    RAISE EXCEPTION 'ai_usage must be service-role only';
  END IF;
END
$$;

COMMIT;

-- ROLLBACK (run by hand; permanently removes ledger data):
--   DROP TABLE IF EXISTS public.ai_usage;
