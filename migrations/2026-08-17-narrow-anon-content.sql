-- ============================================================================
-- ALREADY APPLIED to project omqyueddktqeyrrqvnyq on 2026-08-17 as
-- `narrow_anon_paid_content_2026_08_17`. Idempotent; safe to re-run.
-- ============================================================================
--
-- Audit A-09: `words`, `sentences` and `paragraphs` were fully readable by
-- anyone holding the anon key — which ships inside the SPA bundle. Every
-- level's vocabulary and sentence bank could be dumped with a single request,
-- while the gating that hides them from non-payers was purely client-side
-- (LevelSubscriptionGuard / LockedContentOverlay).
--
-- Same shape as the reading/listening fix in 2026-08-16-fix-rls-security.sql.
-- Permissive policies are OR'd, so EVERY pre-existing read policy has to be
-- dropped first — otherwise the widest one keeps winning. The tables carried
-- 2-4 overlapping ones each (`Anon can read …`, `Anyone can read …`,
-- `dm_read_anon_…`, `dm_read_auth_…`).
--
-- Checked before applying: the Astro build reads only `grammar_*` tables
-- (grep over astro-site/src and scripts/dump-grammar-cache.mjs), so narrowing
-- these cannot starve the static build.

-- words -----------------------------------------------------------------
DROP POLICY IF EXISTS "Anon can read words"    ON public.words;
DROP POLICY IF EXISTS "Anyone can read words"  ON public.words;
DROP POLICY IF EXISTS dm_read_anon_words       ON public.words;
DROP POLICY IF EXISTS dm_read_auth_words       ON public.words;
CREATE POLICY "Words readable by authenticated" ON public.words
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Words free tier for anon" ON public.words
  FOR SELECT TO anon USING (lower(level) = 'a1.1');

-- sentences -------------------------------------------------------------
DROP POLICY IF EXISTS "Anon can read sentences"   ON public.sentences;
DROP POLICY IF EXISTS "Anyone can read sentences" ON public.sentences;
DROP POLICY IF EXISTS dm_read_anon_sentences      ON public.sentences;
DROP POLICY IF EXISTS dm_read_auth_sentences      ON public.sentences;
CREATE POLICY "Sentences readable by authenticated" ON public.sentences
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sentences free tier for anon" ON public.sentences
  FOR SELECT TO anon USING (lower(level) = 'a1.1');

-- paragraphs ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to paragraphs" ON public.paragraphs;
DROP POLICY IF EXISTS "Anon can read paragraphs"               ON public.paragraphs;
CREATE POLICY "Paragraphs readable by authenticated" ON public.paragraphs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Paragraphs free tier for anon" ON public.paragraphs
  FOR SELECT TO anon USING (lower(level) = 'a1.1');

-- DELIBERATELY NOT NARROWED: `podcasts`.
-- netlify/functions/podcast-feed.js builds the public RSS feed with the ANON
-- key, and the podcasts are marketed as free. Restricting them to a1.1 would
-- silently truncate the feed to a handful of episodes. If they should ever be
-- gated, switch that function to the service role in the same change.
--
-- STILL OPEN for all of these: the `authenticated` side remains USING (true),
-- so any free account can still read every level directly. Making it
-- subscription-aware needs a paid-access predicate shared with the client
-- guards and deserves its own pass — same call as the 2026-08-16 migration.

-- ---------------------------------------------------------------------------
-- Verify (run as the anon role to prove the gate, not just read the policy)
-- ---------------------------------------------------------------------------
-- BEGIN;
--   SET LOCAL ROLE anon;
--   SELECT count(*) FROM words WHERE level = 'a1.1';   -- 225
--   SELECT count(*) FROM words WHERE level = 'b2.2';   -- 0
--   SELECT count(*) FROM podcasts;                     -- 24 (unchanged)
--   SELECT count(*) FROM grammar_topics;               -- 64 (Astro build)
-- ROLLBACK;
