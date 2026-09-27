-- ============================================================================
-- Sentence X-Ray: where each analysis came from (2026-09-27)
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- Anonymous analyses jumped from 5-13/day to 150-350/day on 2026-09-14. Only
-- a manual forensic pass could tell what they were (98% our own grammar
-- examples, fetched by a crawler through the /analyze/?s= links added that
-- day). This column makes the next one a query:
--
--   select source->>'ref' ref, source->>'entry' entry, source->>'ua' ua, count(*)
--   from xray_usage where used_at > now() - interval '7 days' group by 1,2,3;
--
-- Shape (netlify/functions/_shared/xraySource.mjs, every field a short label
-- or null): { ref, first, last, entry, ua }
--   ref    document.referrer, coarse: 'none' | external host | 'site:/<section>'
--   first  / last  the first- and last-touch source from dm_attribution
--   entry  'link' (arrived with ?s=) | 'example' (a chip) | 'typed'
--   ua     'browser' | 'script' | 'none'   ('crawler' is refused, never stored)
-- No URL, no query string, no user agent string, no IP — nothing personal.
--
-- analyze-sentence.mjs writes the column when it exists and retries the insert
-- without it when it does not, so the function is safe on both sides of this
-- migration. Existing rows stay NULL = "before source tracking".
-- ============================================================================

ALTER TABLE public.xray_usage
  ADD COLUMN IF NOT EXISTS source jsonb;

COMMENT ON COLUMN public.xray_usage.source IS
  'Coarse, PII-free provenance of the analysis: {ref, first, last, entry, ua} (netlify/functions/_shared/xraySource.mjs). NULL = before 2026-09-27.';
