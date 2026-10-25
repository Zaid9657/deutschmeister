-- Cross-check 2026-10-25, AI-21: shared Sentence X-Ray analyses of the fixed
-- sentences. Most X-Ray traffic is the grammar-example links (/analyze/?s=…)
-- and the page's own examples: the same sentences analysed again and again,
-- each a slow model call. analyze-sentence.mjs keys a validated analysis by
-- sha256(normalised sentence | model | system-prompt hash) — so a new model or
-- prompt is a new key — and answers later requests for that sentence from
-- here. Only analyses that arrived with entry 'link' or 'example' are stored,
-- never a sentence a learner typed. Metering is unchanged: each visit still
-- reserves its analysis in xray_usage first.
--
-- Service role only: RLS on with no policy, every client privilege revoked.
-- Writes go through store_xray_cache(), which validates the key and the shape
-- the results screen renders (a non-empty `words` array) and inserts with
-- ON CONFLICT DO NOTHING, so nothing can overwrite a stored analysis.
--
-- Idempotent; owner applies. Until it is applied the function's lookup and
-- store fail open ("[migration pending] xray_cache" logged once per cold start)
-- and every request is answered by the model exactly as before.
-- Verify: anon/authenticated cannot SELECT public.xray_cache; calling
-- store_xray_cache twice with one hash keeps the first row; a non-hex hash or
-- an analysis without a words array raises.
-- Rollback: DROP FUNCTION public.store_xray_cache(text, text, jsonb);
--           DROP TABLE public.xray_cache;

BEGIN;

CREATE TABLE IF NOT EXISTS public.xray_cache (
  sentence_hash text PRIMARY KEY CHECK (sentence_hash ~ '^[0-9a-f]{64}$'),
  model text NOT NULL,
  analysis jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.xray_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.xray_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.xray_cache TO service_role;

CREATE OR REPLACE FUNCTION public.store_xray_cache(
  p_sentence_hash text, p_model text, p_analysis jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_sentence_hash IS NULL OR p_sentence_hash !~ '^[0-9a-f]{64}$'
     OR p_model IS NULL OR length(p_model) NOT BETWEEN 1 AND 100
     OR p_analysis IS NULL OR jsonb_typeof(p_analysis) <> 'object'
     OR octet_length(p_analysis::text) > 65536 THEN
    RAISE EXCEPTION 'Invalid X-Ray cache entry';
  END IF;
  IF jsonb_typeof(p_analysis -> 'words') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid X-Ray cache entry: words must be an array';
  END IF;
  IF jsonb_array_length(p_analysis -> 'words') = 0 THEN
    RAISE EXCEPTION 'Invalid X-Ray cache entry: no words';
  END IF;
  INSERT INTO public.xray_cache(sentence_hash, model, analysis)
    VALUES (p_sentence_hash, p_model, p_analysis)
    ON CONFLICT (sentence_hash) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.store_xray_cache(text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_xray_cache(text,text,jsonb) TO service_role;

COMMIT;
