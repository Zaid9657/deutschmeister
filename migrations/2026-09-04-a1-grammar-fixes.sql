-- A1 grammar content fixes (audit 2026-09-04).
--
-- What: fixes 7 defects found in an A1 grammar-content audit:
--   1. present-tense-regular taught the regular endings but omitted three
--      exceptions learners hit immediately (-t/-d stem -e- insertion,
--      -s/-ss/-z stems taking only -t in du-form, and the existence of
--      stem-changing verbs) -- wrong by omission. Adds one new rule row
--      (fixed id 6deb9f11-6a63-4a50-8af1-6e0a29346a0a) right after the endings table and
--      patches the Quick Reference rule to mention the -e- insertion.
--   2. personal-pronouns rule 5d686c4b-eee7-4610-a158-e290f566a3ff: garbled claim that
--      "German has no word for it for people" -- German has es; the
--      rule conflated the person/thing distinction. Corrected.
--   3. Job-article contradiction: indefinite-articles correctly teaches
--      "Sie ist Lehrerin" (no article for a bare profession after sein),
--      but nominative-case used "Er ist ein Lehrer" as a correct example
--      in two rules and one exercise, plus a matching example row.
--      Reworded to "Das ist ein Lehrer" (a demonstrative, which DOES take
--      the article) so the teaching point about ein-forms survives intact.
--      Exercise 2c8d8ee0-d7af-4841-9f98-eb9692e74f16 ("Sie wird ___ Ingenieurin" -> "eine")
--      is also wrong (bare profession after werden takes no article); it now
--      drills an adjective-modified profession ("Sie ist ___ gute Ärztin."),
--      which correctly takes "eine". NOTE: rule f6597a70-4fd2-422c-a872-c2eda93c8565,
--      named by the audit alongside the two above, was checked and does NOT
--      contain "Er ist ein Lehrer" (it uses the definite "Das ist der Lehrer",
--      which is correct) -- left untouched, no statement below touches it.
--   4. nouns-gender: "der Bmw" -> "der BMW"; the Ge- prefix rule overclaimed
--      ~90% neuter -- softened to "often neuter" with counterexamples
--      (der Gedanke, die Gefahr, die Geschichte); exercise
--      14894fb2-78ed-4aa5-a68f-6d17b9f1fbfa was an English meta-quiz ("What is the best
--      way to learn gender?") -- replaced with a German fill_blank production
--      item (die Zeitung, -ung ending) drilling der/die/das from this lesson.
--   5. basic-sentence-structure exercise acffc729-ecd1-4b60-892b-61d910c97821 drilled
--      Präteritum ("Gestern ___ wir ins Kino." -> gingen), which is out of
--      level for A1 -- replaced with the present-tense V2 item
--      "Heute ___ wir ins Kino." -> gehen.
--   6. nominative-case exercise b0f26ae2-fc72-471b-a52a-b4be8b9f1490 mixed English
--      words ("Both", "Neither") into an otherwise German multiple-choice
--      list -- replaced with "Beide" / "Keins".
--   7. personal-pronouns exercise d44e8128-05d8-4556-b7b2-2eaa8cc2da97 used
--      "Du sprichst mit deinem Freund." -- a stem-changing verb and a
--      dative possessive, neither taught yet at A1.1 -- replaced with the
--      A1.1-safe "Du redest mit Anna." (same du/Sie/ihr drilling intent).
--
-- All content strings here are generated from the same edit-list
-- (scratch: edits.mjs) used to patch grammar-content-cache.json, so the
-- cache and this migration make byte-identical string changes.
--
-- How to test: apply by hand in the Supabase SQL editor, then re-run the
-- 3 SELECTs at the bottom -- they should return the new strings, zero rows
-- for the old ones. Also spot-check the app: A1.1 Present Tense (Regular)
-- shows a new "Drei kleine Ausnahmen" step between the endings table and
-- "How to Conjugate Any Regular Verb"; A1.1 Nouns & Gender shows "der BMW";
-- A1.1 Nominative Case no longer shows "Er ist ein Lehrer" anywhere.
-- Rollback: re-apply migrations/2026-08-16-content-cleanup.sql-era snapshot
-- is not available; instead see the inverse UPDATE/DELETE statements in the
-- "ROLLBACK" block commented out at the end of this file.
-- Idempotent: every UPDATE is guarded by a WHERE clause on the OLD value
-- (a no-op once already applied); the INSERT is guarded by WHERE NOT EXISTS.

BEGIN;

-- ===========================================================================
-- Defect 1: present-tense-regular
-- ===========================================================================

-- Make room at order_index 2: shift the two rules after the endings table
-- up by one. Done highest-first so the UNIQUE(topic_id, order_index)
-- constraint is never violated mid-statement, and each guard makes the
-- statement a no-op on re-run.
UPDATE public.grammar_rules
SET order_index = 4
WHERE id = '66ac6feb-47c0-42f9-bc0d-5cbf7e0afa4b' AND order_index = 3;

UPDATE public.grammar_rules
SET order_index = 3
WHERE id = 'a8fa0d0d-4698-4a83-aafe-a915cd3b4e13' AND order_index = 2;

INSERT INTO public.grammar_rules (id, topic_id, order_index, rule_type, title_en, title_de, content)
SELECT
  '6deb9f11-6a63-4a50-8af1-6e0a29346a0a'::uuid,
  'c1af3357-5fe4-4226-9a2a-1f6c98df13f2'::uuid,
  2,
  'warning',
  'Three Small Exceptions',
  'Drei kleine Ausnahmen',
  '{"type":"steps","description_de":"Drei kleine Ausnahmen, die du beim Sprechen brauchst.","description_en":"Three small exceptions you''ll run into right away. The pattern from this lesson still applies — these just adjust it slightly.","steps":[{"step":1,"title_de":"Stamm endet auf -t oder -d: extra -e-","title_en":"Stem ends in -t or -d: add an extra -e-","detail_de":"arbeiten → du arbeitest, er arbeitet (nicht ''du arbeitst''). Das -e- macht die Endung aussprechbar.","detail_en":"arbeiten (stem arbeit-) → du arbeitest, er arbeitet — not ''du arbeitst''. An extra -e- goes in before -st and -t so the ending stays pronounceable. Same for reden → du redest, er redet."},{"step":2,"title_de":"Stamm endet auf -s, -ß, -z: du bekommt nur -t","title_en":"Stem ends in -s, -ß, -z: du takes just -t","detail_de":"heißen → du heißt (nicht ''du heißst''); reisen → du reist (nicht ''du reisst'').","detail_en":"heißen (stem heiß-) → du heißt, not ''du heißst''; reisen (stem reis-) → du reist, not ''du reisst''. The stem''s own -s/-ß/-z and the -st ending would collide, so du drops to just -t."},{"step":3,"title_de":"Manche Verben ändern den Stammvokal (kommt in einer späteren Lektion)","title_en":"Some verbs change their stem vowel (a later lesson covers this properly)","detail_de":"sprechen → du sprichst, er spricht; essen → du isst; fahren → du fährst; lesen → du liest; schlafen → du schläfst; nehmen → du nimmst.","detail_en":"A group of common verbs change their vowel, but only in the du and er/sie/es forms: sprechen → du sprichst, er spricht; essen → du isst, er isst; fahren → du fährst, er fährt; lesen → du liest, er liest; schlafen → du schläfst, er schläft; nehmen → du nimmst, er nimmt. ich, wir, ihr and sie/Sie still use the regular pattern from this lesson. You will drill this group properly in a later lesson — for now just recognize that these du/er forms look different."}]}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.grammar_rules
  WHERE topic_id = 'c1af3357-5fe4-4226-9a2a-1f6c98df13f2'::uuid AND title_en = 'Three Small Exceptions'
);

UPDATE public.grammar_rules
SET content = jsonb_set(content, '{points}', '["Most German verbs are regular and follow the same pattern","Step 1: Remove -en from infinitive → stem. Step 2: Add ending.","Endings: ich=-e, du=-st, er/sie/es=-t, wir=-en, ihr=-t, sie/Sie=-en","Stems ending in -t/-d insert an extra -e- before -st/-t: arbeiten → du arbeitest, er arbeitet","wir and sie/Sie forms always look like the infinitive (spielen → wir spielen)","er/sie/es and ihr both use -t (er spielt, ihr spielt)"]'::jsonb)
WHERE id = 'c6fd72b0-c07e-44fc-8829-58228144df68'::uuid
  AND content->'points' = '["Most German verbs are regular and follow the same pattern","Step 1: Remove -en from infinitive → stem. Step 2: Add ending.","Endings: ich=-e, du=-st, er/sie/es=-t, wir=-en, ihr=-t, sie/Sie=-en","wir and sie/Sie forms always look like the infinitive (spielen → wir spielen)","er/sie/es and ihr both use -t (er spielt, ihr spielt)"]'::jsonb;

-- ===========================================================================
-- Defect 2: personal-pronouns garbled sentence
-- ===========================================================================

UPDATE public.grammar_rules
SET content = jsonb_set(
  content,
  '{german_difference_en}',
  to_jsonb(replace(content->>'german_difference_en', 'Also: German has no word for it for people. He (er) and she (sie) are used based on the grammatical gender of the noun.', 'Also: German does have a word for it — es. For people, you choose er (he) or sie (she) based on the person. For things, though, the pronoun follows the noun''s grammatical gender: der Tisch (the table) → er, die Tür (the door) → sie, das Buch (the book) → es.'))
)
WHERE id = '5d686c4b-eee7-4610-a158-e290f566a3ff'::uuid
  AND content->>'german_difference_en' LIKE '%' || 'Also: German has no word for it for people. He (er) and she (sie) are used based on the grammatical gender of the noun.' || '%';

-- ===========================================================================
-- Defect 3: job-article contradiction ("Er ist ein Lehrer")
-- ===========================================================================

UPDATE public.grammar_rules
SET content = jsonb_set(
  content,
  '{paragraphs_en}',
  (
    SELECT jsonb_agg(CASE WHEN elem = '"The nominative is also used after ''sein'' (to be), ''werden'' (to become), and ''bleiben'' (to stay/remain). These verbs link the subject to another noun that describes it: ''Er ist ein Lehrer'' (He is a teacher) — both ''er'' and ''ein Lehrer'' are nominative."'::jsonb THEN '"The nominative is also used after ''sein'' (to be), ''werden'' (to become), and ''bleiben'' (to stay/remain). These verbs link the subject to another noun that describes it: ''Das ist ein Lehrer'' (That is a teacher) — both ''das'' and ''ein Lehrer'' are nominative."'::jsonb ELSE elem END)
    FROM jsonb_array_elements(content->'paragraphs_en') AS elem
  )
)
WHERE id = '91af8602-b9c4-4325-9f94-49aa9ee47198'::uuid
  AND content->'paragraphs_en' @> '["The nominative is also used after ''sein'' (to be), ''werden'' (to become), and ''bleiben'' (to stay/remain). These verbs link the subject to another noun that describes it: ''Er ist ein Lehrer'' (He is a teacher) — both ''er'' and ''ein Lehrer'' are nominative."]'::jsonb;

UPDATE public.grammar_rules
SET content = jsonb_set(
  content,
  '{top_rules}',
  (
    SELECT jsonb_agg(CASE WHEN elem = '"After sein, werden, bleiben = nominative (Er ist ein Lehrer)"'::jsonb THEN '"After sein, werden, bleiben = nominative (Das ist ein Lehrer)"'::jsonb ELSE elem END)
    FROM jsonb_array_elements(content->'top_rules') AS elem
  )
)
WHERE id = 'a743322b-586e-41f3-90a6-c749b8a80d22'::uuid
  AND content->'top_rules' @> '["After sein, werden, bleiben = nominative (Er ist ein Lehrer)"]'::jsonb;

UPDATE public.grammar_examples
SET sentence_de = 'Das ist ein Lehrer.',
    sentence_en = 'That is a teacher.',
    word_breakdown = '{"Das":"that (nominative)","ist":"is","ein Lehrer":"a teacher (nominative)"}'::jsonb
WHERE id = 'd1e9ef93-29ed-4b40-a034-cb011bdd7670'::uuid
  AND sentence_de = 'Er ist ein Lehrer.';

UPDATE public.grammar_exercises
SET why_correct_en = 'Sein, werden, bleiben are linking verbs. "Das ist ein Lehrer" — both "das" and "ein Lehrer" are nominative.'
WHERE id = '7223f412-88d2-4a15-8761-237083762edd'::uuid
  AND why_correct_en = 'Sein, werden, bleiben are linking verbs. "Er ist ein Lehrer" — both "er" and "ein Lehrer" are nominative.';

UPDATE public.grammar_exercises
SET question_de = 'Sie ist ___ gute Ärztin.',
    question_en = 'She is ___ good doctor.',
    explanation_en = 'A profession described with an adjective (gute Ärztin) needs the article: eine gute Ärztin.',
    explanation_de = 'Ein Beruf mit Adjektiv (gute Ärztin) braucht den Artikel: eine gute Ärztin.',
    why_correct_en = 'Unlike a bare profession (Sie ist Ärztin), a profession modified by an adjective takes the indefinite article: Sie ist eine gute Ärztin.',
    why_correct_de = 'Anders als ein reiner Beruf (Sie ist Ärztin) braucht ein Beruf mit Adjektiv den unbestimmten Artikel: Sie ist eine gute Ärztin.'
WHERE id = '2c8d8ee0-d7af-4841-9f98-eb9692e74f16'::uuid
  AND question_de = 'Sie wird ___ Ingenieurin.';

-- ===========================================================================
-- Defect 4: nouns-gender
-- ===========================================================================

UPDATE public.grammar_rules
SET content = jsonb_set(
  content,
  '{masculine_meanings,categories}',
  (
    SELECT jsonb_agg(
      CASE WHEN elem->>'examples' = 'der Bmw, der Mercedes, der Volkswagen'
        THEN jsonb_set(elem, '{examples}', '"der BMW, der Mercedes, der Volkswagen"'::jsonb)
        ELSE elem
      END
    )
    FROM jsonb_array_elements(content->'masculine_meanings'->'categories') AS elem
  )
)
WHERE id = 'ba8de15c-e455-4108-934b-88555c24222e'::uuid
  AND content->'masculine_meanings'->'categories' @> '[{"examples":"der Bmw, der Mercedes, der Volkswagen"}]'::jsonb;

UPDATE public.grammar_rules
SET content = jsonb_set(
  content,
  '{neuter_endings,patterns}',
  (
    SELECT jsonb_agg(
      CASE WHEN elem->>'ending' = 'Ge- prefix'
        THEN elem || '{"accuracy":"often neuter","examples":"das Gebäude, das Gebirge, das Gespräch — but not always: der Gedanke, die Gefahr, die Geschichte"}'::jsonb
        ELSE elem
      END
    )
    FROM jsonb_array_elements(content->'neuter_endings'->'patterns') AS elem
  )
)
WHERE id = '3285308c-bced-4739-b2ba-cdd2ebaf3021'::uuid
  AND content->'neuter_endings'->'patterns' @> '[{"ending":"Ge- prefix","accuracy":"~90%","examples":"das Gebäude, das Gebirge, das Gespräch"}]'::jsonb;

UPDATE public.grammar_exercises
SET exercise_type = 'fill_blank',
    question_de = '___ Zeitung ist interessant.',
    question_en = '___ (newspaper) is interesting.',
    options = '["Der","Die","Das"]'::jsonb,
    correct_answer = 'Die',
    acceptable_answers = '["Die","die"]'::jsonb,
    explanation_en = '-ung ending is always feminine: die Zeitung.',
    explanation_de = 'Endung -ung ist immer feminin: die Zeitung.',
    why_correct_en = '-ung is a 100% reliable feminine ending — die Zeitung, die Wohnung, die Übung.',
    why_correct_de = '-ung ist eine 100% zuverlässige feminine Endung — die Zeitung, die Wohnung, die Übung.'
WHERE id = '14894fb2-78ed-4aa5-a68f-6d17b9f1fbfa'::uuid
  AND question_de = 'Was ist der beste Weg, Genus zu lernen?';

-- ===========================================================================
-- Defect 5: basic-sentence-structure Präteritum item
-- ===========================================================================

UPDATE public.grammar_exercises
SET question_de = 'Heute ___ wir ins Kino.',
    question_en = 'Today ___ we to the cinema.',
    options = '["gehen","geht","gehst","ging"]'::jsonb,
    correct_answer = 'gehen',
    acceptable_answers = '["gehen"]'::jsonb,
    explanation_en = 'Time first → verb second. "Heute gehen wir..."',
    explanation_de = 'Zeit zuerst → Verb zweitens. "Heute gehen wir..."',
    why_correct_en = 'With "Heute" in position 1, the verb "gehen" must come in position 2, followed by subject "wir".',
    why_correct_de = 'Mit "Heute" an Position 1 muss das Verb an Position 2 kommen, gefolgt vom Subjekt "wir".'
WHERE id = 'acffc729-ecd1-4b60-892b-61d910c97821'::uuid
  AND question_de = 'Gestern ___ wir ins Kino.';

-- ===========================================================================
-- Defect 6: nominative-case English options mixed into a German exercise
-- ===========================================================================

UPDATE public.grammar_exercises
SET options = '["Der Hund","Beide","den Mann","Keins"]'::jsonb
WHERE id = 'b0f26ae2-fc72-471b-a52a-b4be8b9f1490'::uuid
  AND options = '["Der Hund","Both","den Mann","Neither"]'::jsonb;

-- ===========================================================================
-- Defect 7: personal-pronouns exercise context too advanced for A1.1
-- ===========================================================================

UPDATE public.grammar_exercises
SET question_de = 'Du redest mit Anna.',
    question_en = 'You talk to Anna, your friend. Which do you use?',
    explanation_en = 'Anna is a friend = du.',
    explanation_de = 'Anna ist eine Freundin = du.'
WHERE id = 'd44e8128-05d8-4556-b7b2-2eaa8cc2da97'::uuid
  AND question_de = 'Du sprichst mit deinem Freund.';

COMMIT;

-- Verification (run after applying):
-- SELECT title_en, order_index FROM public.grammar_rules
--   WHERE topic_id = 'c1af3357-5fe4-4226-9a2a-1f6c98df13f2' ORDER BY order_index;
-- SELECT id, question_de, correct_answer FROM public.grammar_exercises
--   WHERE id IN ('2c8d8ee0-d7af-4841-9f98-eb9692e74f16', 'acffc729-ecd1-4b60-892b-61d910c97821', '14894fb2-78ed-4aa5-a68f-6d17b9f1fbfa', 'd44e8128-05d8-4556-b7b2-2eaa8cc2da97');
-- SELECT count(*) FROM public.grammar_rules WHERE content::text LIKE '%Er ist ein Lehrer%';
--   -- expect 0 among the three named rules (a different, out-of-scope rule
--   -- in the accusative-case topic also uses this phrase to contrast
--   -- nominative vs. accusative "ein/einen Lehrer" -- untouched, not part
--   -- of this audit's named ids).

-- ROLLBACK (manual, if ever needed): re-run every UPDATE above with its SET
-- and WHERE values swapped (new value in WHERE, old value in SET) -- the old
-- strings are quoted verbatim in the header comment for each defect above --
-- then undo the INSERT and the two order_index shifts:
-- DELETE FROM public.grammar_rules WHERE id = '6deb9f11-6a63-4a50-8af1-6e0a29346a0a';
-- UPDATE public.grammar_rules SET order_index = 2 WHERE id = 'a8fa0d0d-4698-4a83-aafe-a915cd3b4e13' AND order_index = 3;
-- UPDATE public.grammar_rules SET order_index = 3 WHERE id = '66ac6feb-47c0-42f9-bc0d-5cbf7e0afa4b' AND order_index = 4;

