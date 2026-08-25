-- ============================================================================
-- ALREADY APPLIED to project omqyueddktqeyrrqvnyq on 2026-08-19 as
-- `unpublish_podcasts_missing_audio_2026_08_19`. Idempotent; safe to re-run.
-- ============================================================================
--
-- Ten of the 24 published podcasts have no object behind their `audio_url`:
-- Supabase Storage answers {"error":"not_found","code":"NoSuchKey"}. Verified
-- by probing all 24 rows with a `Range: bytes=0-0` request (cheap — one byte
-- per file — after an initial pass that downloaded whole files and burned
-- ~360 MB of egress before the method was corrected).
--
-- The uploads stop partway through B1.1, so entire levels have nothing:
--
--   A1.1  3/3 ok      B1.1  2/3   (#3 "Living in Germany" missing)
--   A1.2  3/3 ok      B1.2  0/3
--   A2.1  3/3 ok      B2.1  0/3
--   A2.2  3/3 ok      B2.2  0/3
--
-- All ten were `is_published = true`, so they appeared on the site AND in the
-- public RSS feed — netlify/functions/podcast-feed.js filters on is_published
-- only, so podcast directories were being handed episodes that 404.
--
-- Unpublishing hides them until the audio is re-uploaded. Flip the flag back
-- per row as files land.

UPDATE public.podcasts
SET is_published = false
WHERE (sub_level, podcast_order) IN (
  ('B1.1', 3),
  ('B1.2', 1), ('B1.2', 2), ('B1.2', 3),
  ('B2.1', 1), ('B2.1', 2), ('B2.1', 3),
  ('B2.2', 1), ('B2.2', 2), ('B2.2', 3)
);

-- ---------------------------------------------------------------------------
-- STILL OPEN — the 14 episodes that DO exist are video, not audio
-- ---------------------------------------------------------------------------
-- They are video/mp4 at 117 MB (A1.1) up to 420 MB ("Expressing Opinions",
-- B1.1 #2) — 2.8 GB in total. Every play streams the whole video: punishing on
-- mobile data and billed as Storage egress, to deliver something the product
-- calls a podcast.
--
-- `duration_seconds` is placeholder data too (18 of 24 rows were exactly 180),
-- which is why a card read "3:00" while the player reported 5:03.
--
-- scripts/reencode-podcast-audio.mjs fixes both: strips the video stream to
-- ~64 kbps mono mp3 (roughly a 99% size cut) and writes the real duration it
-- measures while encoding. It needs ffmpeg and network access to Storage, so
-- it is deliberately not part of the build — run it by hand.
--
-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- SELECT is_published, count(*) FROM podcasts GROUP BY 1;   -- 14 true / 10 false
-- SELECT count(*) FROM podcasts WHERE is_published AND audio_url NOT LIKE '%.mp3';  -- 14 until re-encoded
