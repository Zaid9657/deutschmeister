-- ===============================================
-- Diagnose Grammar Topic Mismatch Issues
-- Run this in Supabase SQL Editor to find problems
-- ===============================================

-- 1. Check what topic_id is stored for Genitive Case rules
SELECT
  'Genitive Case Topic' as check_type,
  t.id as topic_uuid,
  t.slug,
  t.title_en,
  t.sub_level
FROM grammar_topics t
WHERE t.slug = 'genitive-case';

-- 2. Check what rules are linked to Genitive Case topic_id
SELECT
  'Rules for Genitive Case' as check_type,
  r.id as rule_id,
  r.title_en,
  r.title_de,
  r.rule_type,
  r.topic_id,
  t.slug as linked_topic_slug,
  t.title_en as linked_topic_title
FROM grammar_rules r
LEFT JOIN grammar_topics t ON r.topic_id = t.id
WHERE r.topic_id = (SELECT id FROM grammar_topics WHERE slug = 'genitive-case');

-- 3. Find orphaned rules (topic_id doesn't match expected slug)
SELECT
  'Mismatched Rules' as issue_type,
  r.id as rule_id,
  r.title_en as rule_title,
  r.title_de,
  t.slug as actual_topic,
  t.title_en as actual_topic_title,
  t.sub_level
FROM grammar_rules r
JOIN grammar_topics t ON r.topic_id = t.id
WHERE r.title_en ILIKE '%konjunktiv%'
   OR r.title_de ILIKE '%konjunktiv%';

-- 4. Check all B1.1 topics and their rule counts
SELECT
  t.slug,
  t.title_en,
  t.topic_order,
  COUNT(r.id) as rule_count,
  STRING_AGG(r.title_en, ' | ' ORDER BY r.order_index) as rule_titles
FROM grammar_topics t
LEFT JOIN grammar_rules r ON r.topic_id = t.id
WHERE t.sub_level = 'B1.1'
GROUP BY t.id, t.slug, t.title_en, t.topic_order
ORDER BY t.topic_order;

-- 5. Find which topic SHOULD have the Konjunktiv rules
SELECT
  t.slug,
  t.title_en,
  t.sub_level,
  t.topic_order
FROM grammar_topics t
WHERE t.title_en ILIKE '%konjunktiv%'
   OR t.title_de ILIKE '%konjunktiv%';
