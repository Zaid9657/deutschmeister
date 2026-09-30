-- Agent incidents: the ledger of the hourly sentinel (netlify/functions/sentinel.mjs).
--
-- What it enables: every problem the sentinel finds (a key page not answering
-- 200, a Lemon Squeezy webhook that failed and was not recovered, a signup
-- drop, a scheduled job that left no evidence, a support ticket past its SLA,
-- a broken speaking flow) becomes ONE row here, owned by one area agent.
-- `key` is the claim: the sentinel inserts with ON CONFLICT (key) DO NOTHING
-- RETURNING, and only rows it inserted may be mailed — so a problem is mailed
-- once (once per day while a state-like problem persists; keys carry the UTC
-- day), never once per hourly run. Repeats bump last_seen_at/seen_count; a
-- check that runs and passes sets resolved_at. mailed_elsewhere marks rows
-- another job already emails (renewal payment failures, lemonsqueezy-webhook):
-- recorded, never mailed again.
--
-- Security: RLS on, NO policies, every privilege revoked from PUBLIC, anon and
-- authenticated — service role only (the sentinel, the area agents via the
-- Supabase connector). No function is created, so no EXECUTE lockdown applies.
--
-- Idempotent: CREATE … IF NOT EXISTS, named CHECK constraints dropped and
-- re-added, REVOKE/GRANT restated. Safe to re-run.
--
-- How to test after applying:
--   SELECT count(*) FROM public.agent_incidents;            -- 0, as the service role
--   SET ROLE authenticated; SELECT * FROM public.agent_incidents;  -- permission denied
--   RESET ROLE;
-- Then, with SENTINEL_ENABLED=true in the Netlify functions env, a manual dry run:
--   /.netlify/functions/sentinel?secret=<CAMPAIGN_SECRET>&dry=1  (writes nothing)
-- After applying: refresh tests/fixtures/db-schema.json from the live schema and
-- remove agent_incidents from its "pendingApply" block (tests/db-columns.test.mjs).
--
-- Rollback: DROP TABLE public.agent_incidents;  (the sentinel then fails its
-- claim and sends no digest — only its hourly "Supabase unreachable" fallback,
-- which SENTINEL_MUTE=db-down or SENTINEL_ENABLED=false silences).

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  check_id text,
  owner_agent text NOT NULL,
  severity text NOT NULL,
  title text,
  detail jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  seen_count integer NOT NULL DEFAULT 1,
  notified_at timestamptz,
  resolved_at timestamptz,
  mailed_elsewhere boolean NOT NULL DEFAULT false
);

-- The claim. UNIQUE (not just an index) so ON CONFLICT (key) can target it.
ALTER TABLE public.agent_incidents DROP CONSTRAINT IF EXISTS agent_incidents_key_key;
ALTER TABLE public.agent_incidents ADD CONSTRAINT agent_incidents_key_key UNIQUE (key);

-- Mirrors OWNER_AGENTS / SEVERITIES in netlify/functions/_shared/sentinelLib.mjs (tests/sentinel.test.mjs pins both).
ALTER TABLE public.agent_incidents DROP CONSTRAINT IF EXISTS agent_incidents_owner_agent_check;
ALTER TABLE public.agent_incidents ADD CONSTRAINT agent_incidents_owner_agent_check CHECK (owner_agent IN (
  'revenue', 'conversion', 'product', 'acquisition', 'seo', 'content',
  'retention', 'support', 'website', 'webperf', 'security', 'supervisor'
));
ALTER TABLE public.agent_incidents DROP CONSTRAINT IF EXISTS agent_incidents_severity_check;
ALTER TABLE public.agent_incidents ADD CONSTRAINT agent_incidents_severity_check CHECK (severity IN ('critical', 'high', 'medium', 'low'));
ALTER TABLE public.agent_incidents DROP CONSTRAINT IF EXISTS agent_incidents_seen_count_check;
ALTER TABLE public.agent_incidents ADD CONSTRAINT agent_incidents_seen_count_check CHECK (seen_count >= 1);

-- The sentinel's reads: open incidents (resolve pass) and an agent's queue.
CREATE INDEX IF NOT EXISTS idx_agent_incidents_open ON public.agent_incidents (check_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_incidents_owner_seen ON public.agent_incidents (owner_agent, last_seen_at DESC);

ALTER TABLE public.agent_incidents ENABLE ROW LEVEL SECURITY;
-- no policies on purpose: service role only
REVOKE ALL ON TABLE public.agent_incidents FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.agent_incidents TO service_role;

-- Guard: abort the whole file if the table ended up readable by a client.
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.agent_incidents'::regclass) THEN
    RAISE EXCEPTION 'agent_incidents: row level security is off';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_incidents') THEN
    RAISE EXCEPTION 'agent_incidents: a policy exists — this table is service-role only';
  END IF;
  IF has_table_privilege('anon', 'public.agent_incidents', 'SELECT')
     OR has_table_privilege('authenticated', 'public.agent_incidents', 'SELECT') THEN
    RAISE EXCEPTION 'agent_incidents: a client role can still SELECT';
  END IF;
END
$$;

COMMIT;
