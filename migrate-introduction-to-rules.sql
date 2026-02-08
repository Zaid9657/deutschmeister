-- Migrate Introduction from grammar_introductions to grammar_rules
-- This works around the 406 error by using grammar_rules table instead

-- Insert introduction as a special rule with rule_type = 'introduction' and order_index = 0
INSERT INTO grammar_rules (
    topic_id,
    order_index,
    rule_type,
    title_en,
    title_de,
    content
)
SELECT
    '2e4ad310-cda8-4076-a9ca-13baca1a5f20' as topic_id,  -- Basic Sentence Structure
    0 as order_index,
    'introduction' as rule_type,
    'Introduction' as title_en,
    'Einführung' as title_de,
    jsonb_build_object(
        'hook_en', 'Have you ever ordered a coffee in German and said "Ich möchte ein Kaffee"? Almost right — but it should be "einen Kaffee"! That tiny change is the accusative case, and it''s one of the first things that makes you sound like you really know German.',
        'hook_de', NULL,
        'english_comparison_en', 'In English, we show who does what by WORD ORDER: "The dog bites the man" means something completely different from "The man bites the dog." The words themselves don''t change — only their position tells you who is doing the biting. German works differently. In German, the ARTICLE changes to show who is doing what. This means you could rearrange a German sentence and it would still make sense, because the articles tell you the roles — not the word order.',
        'english_comparison_de', NULL,
        'german_difference_en', 'German uses CASE ENDINGS on articles (der/den/dem/des) to show grammatical roles. The accusative case marks the DIRECT OBJECT — the thing receiving the action.',
        'german_difference_de', NULL,
        'preview_example_de', NULL,
        'preview_example_en', NULL,
        'preview_highlight', NULL,
        'scenario_en', 'You need the accusative case every single day in German: ordering food ("Ich möchte einen Kaffee"), saying what you have ("Ich habe einen Hund"), describing what you see ("Ich sehe die Berge"), and talking about what you like ("Ich mag das Buch").',
        'scenario_de', NULL,
        'why_it_matters_en', 'Mastering the accusative case is one of the first major steps to sounding fluent. It''s the difference between "I a coffee want" and "I want a coffee" — except in German, the grammar marker is on the article, not the word order. Get this right, and you instantly sound more natural and confident.',
        'why_it_matters_de', NULL
    ) as content
ON CONFLICT (topic_id, order_index) DO UPDATE
SET
    rule_type = EXCLUDED.rule_type,
    content = EXCLUDED.content;

-- Verify it was inserted
SELECT
    topic_id,
    order_index,
    rule_type,
    title_en,
    content->>'hook_en' as hook_preview
FROM grammar_rules
WHERE rule_type = 'introduction'
ORDER BY order_index;
