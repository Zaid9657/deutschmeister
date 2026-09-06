-- ============================================================================
-- Abschlusstest A2.2 exam key + two A2.2 speaking-mission fixes
--   Course Factory Wave 5, PR D2 (docs/course-factory-tracker.md; course test
--   registered in src/data/courseTests/index.js as 'a2_2_abschluss',
--   formatOf 'goethe_a2')
-- Idempotent; safe to re-run. Apply by hand (see migrations/README.md).
--
-- 1. exam_attempts.exam_key is guarded by a CHECK that hardcodes the admitted
--    keys. Every course test re-creates it with the FULL current list —
--    tests/exams.test.mjs reads the newest *abschlusstest*.sql and requires
--    every COURSE_TESTS key and every mock-bearing EXAM_TRACKS key in it, so a
--    later file can never silently narrow an earlier test out. This one adds
--    'a2_2_abschluss' (the tenth key).
-- 2. Two guarded content fixes on live A2.2 speaking_missions rows: the 28-day
--    A2.2 plan derives mission titles from these rows, and the adversarial
--    review of the plan found "Der Urlaub, der schiefging" (a relative clause +
--    the Präteritum of a full verb) and "seitdem" (a B1 subordinator) in
--    mission 5's target_structures — both on the A2.2 ban list
--    (docs/course-factory/wave5/level-a2.2.md). Each UPDATE is keyed on the
--    OLD value and is a no-op once applied.
--
-- Test (after applying):
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conname = 'exam_attempts_exam_key_check';
--   -- must list all ten keys below.
--   SELECT id, title_de, target_structures FROM public.speaking_missions
--     WHERE id IN ('e119b89f-732c-433a-9fc7-888532541f70', '39e64773-7390-4611-9e4a-34e5f48efb02');
--
-- Rollback (only safe if no exam_attempts row uses the new key yet):
--   ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
--   ALTER TABLE public.exam_attempts ADD CONSTRAINT exam_attempts_exam_key_check
--     CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'a1_1_abschluss', 'a1_2_abschluss', 'goethe_a2', 'a2_1_abschluss'));
-- ============================================================================

ALTER TABLE public.exam_attempts
  DROP CONSTRAINT IF EXISTS exam_attempts_exam_key_check;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_exam_key_check
  CHECK (exam_key IN ('telc_b1', 'goethe_b1', 'dtz', 'telc_b2', 'goethe_a1', 'a1_1_abschluss', 'a1_2_abschluss', 'goethe_a2', 'a2_1_abschluss', 'a2_2_abschluss'));

UPDATE public.speaking_missions
SET title_de = 'Ein Urlaub mit Problemen', title_en = 'A holiday with problems'
WHERE id = 'e119b89f-732c-433a-9fc7-888532541f70' AND title_de = 'Der Urlaub, der schiefging';

UPDATE public.speaking_missions
SET target_structures = '["word order in subordinate clauses","subordinate clause in first position","combining weil, dass, wenn"]'::jsonb
WHERE id = '39e64773-7390-4611-9e4a-34e5f48efb02' AND target_structures = '["word order in subordinate clauses","subordinate clause in first position","combining weil, dass, seitdem"]'::jsonb;
