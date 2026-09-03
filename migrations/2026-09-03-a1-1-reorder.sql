-- A1.1 first-lesson hook (owner decision 2026-09-03; docs/HANDOFF-2026-09-03.md §5).
--
-- Measured: of 69 learners who ever did exactly one grammar topic and never
-- returned, 35 did "Alphabet & Pronunciation" — lesson 1. Lesson 1 is now
-- Nouns & Gender (der/die/das, an immediate payoff); the alphabet moves to
-- lesson 5. Applied 2026-09-03 via the Supabase connector. The same order is
-- mirrored in src/data/grammarTopics.js and grammar-content-cache.json, and
-- tests/topic-order.test.mjs pins the three against each other.
--
-- topic_order carries UNIQUE (sub_level, topic_order) and CHECK 1..8, so a
-- permutation cannot be applied row by row: the unique key is dropped for the
-- statement and re-added. Rollback: the inverse VALUES list.

ALTER TABLE public.grammar_topics DROP CONSTRAINT grammar_topics_sub_level_topic_order_key;
UPDATE public.grammar_topics g SET topic_order = v.o, updated_at = now()
FROM (VALUES
  ('nouns-gender', 1), ('definite-articles', 2), ('personal-pronouns', 3), ('verb-sein', 4),
  ('alphabet-pronunciation', 5), ('verb-haben', 6), ('indefinite-articles', 7), ('present-tense-regular', 8)
) AS v(slug, o)
WHERE g.slug = v.slug AND g.sub_level = 'A1.1';
-- Lesson 1 cannot have a prerequisite.
UPDATE public.grammar_topics SET prerequisite_slugs = NULL, updated_at = now()
WHERE slug = 'nouns-gender' AND sub_level = 'A1.1';
ALTER TABLE public.grammar_topics ADD CONSTRAINT grammar_topics_sub_level_topic_order_key UNIQUE (sub_level, topic_order);
