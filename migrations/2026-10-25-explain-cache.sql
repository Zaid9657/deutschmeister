-- Cross-check 2026-10-25, AI-22: shared "Erklär mir das" explanations. Every
-- learner who misses the same practice item with the same answer, in the same
-- chrome language, gets the same grounded explanation; explain-answer.mjs
-- writes it once and reads it from here afterwards, with no model call and no
-- reservation. The key is sha256 of everything the model sees — item id,
-- model, the whole system prompt (so a rebuilt rule card is a new key) and the
-- user turn (question, correct answer, the learner's answer as typed, level).
-- Only explanations grounded in a course rule card are stored. Rows hold no
-- user id; an explanation may quote the wrong answer it explains, which only a
-- learner who typed that same answer can be served.
--
-- Service role only: RLS on with no policy, every client privilege revoked.
-- Writes go through store_explain_cache(), which validates the key and the
-- text and inserts with ON CONFLICT DO NOTHING.
--
-- Idempotent; owner applies. Until it is applied the function's lookup and
-- store fail open ("[migration pending] explain_cache" logged once per cold
-- start) and every request is reserved and answered by the model as before.
-- Verify: anon/authenticated cannot SELECT public.explain_cache; calling
-- store_explain_cache twice with one key keeps the first row; a non-hex key or
-- an empty text raises.
-- Rollback: DROP FUNCTION public.store_explain_cache(text, jsonb);
--           DROP TABLE public.explain_cache;

BEGIN;

CREATE TABLE IF NOT EXISTS public.explain_cache (
  cache_key text PRIMARY KEY CHECK (cache_key ~ '^[0-9a-f]{64}$'),
  explanation jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.explain_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.explain_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.explain_cache TO service_role;

CREATE OR REPLACE FUNCTION public.store_explain_cache(
  p_cache_key text, p_explanation jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_cache_key IS NULL OR p_cache_key !~ '^[0-9a-f]{64}$'
     OR p_explanation IS NULL OR jsonb_typeof(p_explanation) <> 'object'
     OR jsonb_typeof(p_explanation -> 'text') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'Invalid explanation cache entry';
  END IF;
  IF length(btrim(p_explanation ->> 'text')) = 0 OR length(p_explanation ->> 'text') > 4000 THEN
    RAISE EXCEPTION 'Invalid explanation cache entry: text length';
  END IF;
  INSERT INTO public.explain_cache(cache_key, explanation)
    VALUES (p_cache_key, p_explanation)
    ON CONFLICT (cache_key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.store_explain_cache(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_explain_cache(text,jsonb) TO service_role;

COMMIT;
