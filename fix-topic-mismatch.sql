-- ===============================================
-- Fix Topic Mismatch - Reassign Rules to Correct Topics
-- ===============================================
--
-- INSTRUCTIONS:
-- 1. First run diagnose-topic-mismatch.sql to identify the problem
-- 2. Find the correct topic UUIDs
-- 3. Update the UUIDs below
-- 4. Run this script to fix the associations
--
-- ===============================================

-- Get UUIDs (for reference - replace with actual values)
-- Run these first to get the UUIDs you need:

SELECT id, slug, title_en FROM grammar_topics WHERE slug = 'genitive-case';
-- Result: Copy the UUID for genitive-case

SELECT id, slug, title_en FROM grammar_topics WHERE title_en ILIKE '%konjunktiv%';
-- Result: Copy the UUID for the Konjunktiv topic

-- ===============================================
-- EXAMPLE FIX (update with your actual UUIDs):
-- ===============================================

-- Move Konjunktiv rules FROM genitive-case TO correct konjunktiv topic
/*
UPDATE grammar_rules
SET topic_id = 'PASTE_KONJUNKTIV_TOPIC_UUID_HERE'
WHERE topic_id = 'PASTE_GENITIVE_CASE_UUID_HERE'
  AND (title_en ILIKE '%konjunktiv%' OR title_de ILIKE '%konjunktiv%');
*/

-- Verify the fix
/*
SELECT
  r.title_en,
  t.slug as topic_slug,
  t.title_en as topic_title
FROM grammar_rules r
JOIN grammar_topics t ON r.topic_id = t.id
WHERE r.title_en ILIKE '%konjunktiv%';
*/

-- ===============================================
-- Alternative: Delete and re-insert with correct topic_id
-- ===============================================

-- If the rules need to be deleted and recreated:
/*
-- 1. Delete wrong rules
DELETE FROM grammar_rules
WHERE topic_id = 'PASTE_GENITIVE_CASE_UUID_HERE'
  AND (title_en ILIKE '%konjunktiv%' OR title_de ILIKE '%konjunktiv%');

-- 2. Insert correct rules for Genitive Case
INSERT INTO grammar_rules (topic_id, order_index, rule_type, title_en, title_de, content)
SELECT
  id as topic_id,
  1 as order_index,
  'table' as rule_type,
  'Genitive Articles' as title_en,
  'Genitivartikel' as title_de,
  '{
    "headers": ["Case", "Masculine", "Feminine", "Neuter", "Plural"],
    "rows": [
      ["Genitive", "des", "der", "des", "der"]
    ]
  }'::jsonb as content
FROM grammar_topics
WHERE slug = 'genitive-case';
*/
