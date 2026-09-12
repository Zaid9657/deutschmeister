-- A1.1 course Wortfeld: the 18 words the curriculum names but `words` does not
-- carry yet (plan P1, "Recorded audio everywhere").
--
-- WHY. src/data/curricula/a11.js lists every Lektion's Wortfeld with the id of
-- the live `words` row (`wordId`), so the lesson player can show the real
-- article/plural and play the recording. Eighteen entries across the twelve
-- Lektionen have `wordId: null` — the table simply has no row for them at any
-- level. Without a row they have no audio and no review card face beyond the
-- curriculum text. This migration seeds them; scripts/generate-course-audio.mjs
-- then renders each one with Azure Neural TTS, uploads it to
-- audio/course/a1.1/words/<slug>.mp3 and fills `audio_url` with an UPDATE keyed
-- on (german, level) using the service role. Afterwards the ids can be pasted
-- back into a11.js's `wordId` fields (and `node scripts/sync-curricula.mjs`
-- run) — that backfill is a separate, optional step; nothing breaks without it.
--
-- THE EXACT LIST (Lektion · entry · English):
--   L01  heißen — to be called
--   L01  buchstabieren — to spell
--   L01  der Buchstabe (Pl. Buchstaben) — letter
--   L02  die Zahlen 0–10 — the numbers 0–10 (null, eins … zehn)
--   L02  der Familienstand — marital status
--   L03  sprechen — to speak
--   L04  machen — to do, to make
--   L05  das Bild (Pl. Bilder) — picture
--   L06  das Telefon (Pl. Telefone) — telephone
--   L08  Viertel nach — quarter past
--   L08  Viertel vor — quarter to
--   L09  das Frühstück (Pl. Frühstücke) — breakfast
--   L09  sofort — right away
--   L11  nach Hause — home (direction)
--   L11  mitkommen — to come along
--   L12  die Monate: Januar bis Dezember (Pl. Monate) — the months: January to December
--   L12  die Gäste (Pl. Gäste) — guests
--   L12  das Fest (Pl. Feste) — celebration, festival
--
-- CONVENTIONS (CLAUDE.md, migrations/README.md):
--   * `level` is LOWERCASE 'a1.1' — `words.level` is the lowercase side.
--   * `german` holds the BARE form; the article lives in `article`
--     (the 2026-09-05 Wortliste migration stripped baked-in articles, and
--     src/utils/wordDisplay.js prepends the article itself).
--   * `plural` is SQL NULL when there is none — never the string 'null' and
--     never the em dash the curriculum uses for display.
--   * `category` is 'Course A1.1 · L<nr>', so these rows are identifiable as
--     course-seeded and can be listed per Lektion.
--   * `audio_url` is deliberately left NULL here: the audio script sets it.
--
-- RE-RUN CONTRACT: every INSERT is guarded by
--   WHERE NOT EXISTS (SELECT 1 FROM public.words WHERE german = ... AND level = 'a1.1')
-- so applying this file twice is a no-op, and a word that later turns up at
-- a1.1 under another category is never duplicated. The guard is on
-- (german, level) rather than the table's UNIQUE (german, level, category)
-- ON PURPOSE: the audio script looks the row up by (german, level) and must
-- find exactly one. `id` is left to the table's gen_random_uuid() default.
--
-- How to apply: paste into the Supabase SQL editor (service role), then run the
-- verification SELECTs at the bottom.
--
-- Rollback: DELETE FROM public.words WHERE level = 'a1.1' AND category LIKE 'Course A1.1 · L%';
-- (safe only before the ids are pasted into a11.js).

BEGIN;

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'heißen', 'to be called', NULL, NULL, 'Course A1.1 · L01'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'heißen' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'buchstabieren', 'to spell', NULL, NULL, 'Course A1.1 · L01'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'buchstabieren' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Buchstabe', 'letter', 'der', 'Buchstaben', 'Course A1.1 · L01'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Buchstabe' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Zahlen 0–10', 'the numbers 0–10 (null, eins … zehn)', 'die', NULL, 'Course A1.1 · L02'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Zahlen 0–10' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Familienstand', 'marital status', 'der', NULL, 'Course A1.1 · L02'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Familienstand' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'sprechen', 'to speak', NULL, NULL, 'Course A1.1 · L03'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'sprechen' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'machen', 'to do, to make', NULL, NULL, 'Course A1.1 · L04'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'machen' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Bild', 'picture', 'das', 'Bilder', 'Course A1.1 · L05'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Bild' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Telefon', 'telephone', 'das', 'Telefone', 'Course A1.1 · L06'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Telefon' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Viertel nach', 'quarter past', NULL, NULL, 'Course A1.1 · L08'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Viertel nach' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Viertel vor', 'quarter to', NULL, NULL, 'Course A1.1 · L08'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Viertel vor' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Frühstück', 'breakfast', 'das', 'Frühstücke', 'Course A1.1 · L09'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Frühstück' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'sofort', 'right away', NULL, NULL, 'Course A1.1 · L09'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'sofort' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'nach Hause', 'home (direction)', NULL, NULL, 'Course A1.1 · L11'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'nach Hause' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'mitkommen', 'to come along', NULL, NULL, 'Course A1.1 · L11'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'mitkommen' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Monate: Januar bis Dezember', 'the months: January to December', 'die', 'Monate', 'Course A1.1 · L12'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Monate: Januar bis Dezember' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Gäste', 'guests', 'die', 'Gäste', 'Course A1.1 · L12'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Gäste' AND level = 'a1.1'
);

INSERT INTO public.words (level, german, english, article, plural, category)
SELECT 'a1.1', 'Fest', 'celebration, festival', 'das', 'Feste', 'Course A1.1 · L12'
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = 'Fest' AND level = 'a1.1'
);
COMMIT;

-- Verification (run after applying):
--   SELECT count(*) FROM public.words WHERE level = 'a1.1' AND category LIKE 'Course A1.1 · L%';  -- expect 18
--   SELECT count(*) FROM public.words WHERE level = 'a1.1' AND plural = 'null';                   -- expect 0
--   SELECT count(*) FROM public.words
--    WHERE level = 'a1.1' AND (german LIKE 'der %' OR german LIKE 'die %' OR german LIKE 'das %'); -- expect 0
-- After `node scripts/generate-course-audio.mjs a1.1` has run:
--   SELECT count(*) FROM public.words
--    WHERE level = 'a1.1' AND category LIKE 'Course A1.1 · L%' AND audio_url IS NULL;              -- expect 0
