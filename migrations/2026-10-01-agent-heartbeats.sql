-- Agent heartbeats: the team's dead-man switch (roadmap r17, step 1 of 3).
--
-- PENDING APPLY — written 2026-10-01, not yet applied. Apply by hand (or via
-- the Supabase connector) before the sentinel check `team:heartbeat` ships.
--
-- What it enables: the orchestrating session (docs/agents/PROTOCOL.md,
-- "Staying alive") writes ONE row here at the end of every wake: which agent
-- or wave woke (`agent`), the wake label (`wake`, e.g. "16:10 build wave") and
-- a short free-text `note`. The hourly sentinel, which runs on Netlify
-- independent of the session, will read the newest `created_at` and mail the
-- owner when no heartbeat has arrived for 8 hours — the alarm for "the team
-- has stopped". This file is the table only: no writer and no reader ship
-- with it, so applying it changes nothing a user or the owner can see.
--
-- Rule for the reader (step 2, sentinelLib.mjs): an EMPTY table means "not
-- started", and must be skipped exactly like a missing table. Only a newest
-- row older than 8 hours is an incident. Otherwise the first sentinel run
-- after this is applied, before the orchestrator's first write, would send
-- the owner a false critical.
--
-- Security: RLS on, NO policies, every privilege revoked from PUBLIC, anon and
-- authenticated on the table and its id sequence — service role only (the
-- orchestrator via the Supabase connector, the sentinel). No GRANT is needed:
-- this project's default privileges for schema public give service_role ALL on
-- every new table and sequence (pg_default_acl for creators postgres and
-- supabase_admin, read 2026-10-01). The closing guard asserts that, and that
-- no client role can touch the table, and aborts the whole file otherwise.
-- No function, trigger, policy or pg_net call is created.
--
-- Additive only: one new table, one index. No existing object is altered and
-- no row is written.
--
-- Idempotent: CREATE … IF NOT EXISTS, RLS enable and REVOKE restated. Safe to
-- re-run.
--
-- How to test after applying:
--   SELECT count(*) FROM public.agent_heartbeats;            -- 0, as the service role
--   SET ROLE authenticated; SELECT * FROM public.agent_heartbeats;  -- permission denied
--   RESET ROLE;
-- After applying: mark this file applied in migrations/README.md and refresh
-- tests/fixtures/db-schema.json from the live schema (its "refresh" query), so
-- the sentinel check in step 2 can query the table under
-- tests/db-columns.test.mjs.
--
-- Rollback: see the commented block at the end of this file. Nothing reads or
-- writes the table until step 2 ships, so dropping it is safe before then;
-- after step 2, the sentinel treats a missing table as "not started".

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_heartbeats (
  id bigserial PRIMARY KEY,
  agent text NOT NULL,
  wake text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The sentinel's one read: the newest heartbeat.
CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_created_at ON public.agent_heartbeats (created_at DESC);

ALTER TABLE public.agent_heartbeats ENABLE ROW LEVEL SECURITY;
-- no policies on purpose: service role only
REVOKE ALL ON TABLE public.agent_heartbeats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.agent_heartbeats_id_seq FROM PUBLIC, anon, authenticated;

-- Guard: abort the whole file if a client role can touch the table, or if the
-- service role (the only writer) cannot.
DO $$
BEGIN
  -- The REVOKE above names the sequence; make sure it is the column's real one
  -- (a pre-existing relation of that name would make Postgres pick `_seq1`).
  IF pg_get_serial_sequence('public.agent_heartbeats', 'id') IS DISTINCT FROM 'public.agent_heartbeats_id_seq' THEN
    RAISE EXCEPTION 'agent_heartbeats: the id sequence is not public.agent_heartbeats_id_seq — the REVOKE missed it';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.agent_heartbeats'::regclass) THEN
    RAISE EXCEPTION 'agent_heartbeats: row level security is off';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_heartbeats') THEN
    RAISE EXCEPTION 'agent_heartbeats: a policy exists — this table is service-role only';
  END IF;
  -- The seven privileges every supported Postgres knows. PG17's MAINTAIN is
  -- left out on purpose (PG15/16 reject the word); REVOKE ALL above removes it.
  IF has_table_privilege('anon', 'public.agent_heartbeats', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
     OR has_table_privilege('authenticated', 'public.agent_heartbeats', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
    RAISE EXCEPTION 'agent_heartbeats: a client role still holds a table privilege';
  END IF;
  IF has_sequence_privilege('anon', 'public.agent_heartbeats_id_seq', 'USAGE, SELECT, UPDATE')
     OR has_sequence_privilege('authenticated', 'public.agent_heartbeats_id_seq', 'USAGE, SELECT, UPDATE') THEN
    RAISE EXCEPTION 'agent_heartbeats: a client role still holds a sequence privilege';
  END IF;
  IF NOT (has_table_privilege('service_role', 'public.agent_heartbeats', 'SELECT')
          AND has_table_privilege('service_role', 'public.agent_heartbeats', 'INSERT')
          AND has_sequence_privilege('service_role', 'public.agent_heartbeats_id_seq', 'USAGE')) THEN
    RAISE EXCEPTION 'agent_heartbeats: service_role cannot SELECT/INSERT — the default privileges for schema public changed';
  END IF;
END
$$;

COMMIT;

-- ROLLBACK (run by hand; nothing else depends on this table until the
-- sentinel check `team:heartbeat` ships, which treats a missing table as
-- "not started"):
--
--   drop table if exists public.agent_heartbeats;
