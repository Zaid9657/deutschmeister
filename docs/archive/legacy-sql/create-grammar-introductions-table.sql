-- ===============================================
-- Grammar Introductions Table (Stage 1)
-- Rich introduction content for grammar topics
-- ===============================================

-- Create the table
CREATE TABLE IF NOT EXISTS grammar_introductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID UNIQUE NOT NULL REFERENCES grammar_topics(id) ON DELETE CASCADE,

    -- Hook - Engaging opening statement
    hook_en TEXT NOT NULL,
    hook_de TEXT,

    -- English vs German comparison
    english_comparison_en TEXT NOT NULL,
    english_comparison_de TEXT,

    german_difference_en TEXT NOT NULL,
    german_difference_de TEXT,

    -- Preview example
    preview_example_de TEXT,
    preview_example_en TEXT,
    preview_highlight TEXT,  -- Which word(s) to highlight

    -- Practical application
    scenario_en TEXT NOT NULL,
    scenario_de TEXT,

    -- Motivation
    why_it_matters_en TEXT NOT NULL,
    why_it_matters_de TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grammar_introductions_topic_id
ON grammar_introductions(topic_id);

-- Enable RLS
ALTER TABLE grammar_introductions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Grammar introductions viewable by authenticated" ON grammar_introductions;
DROP POLICY IF EXISTS "Grammar introductions viewable by public" ON grammar_introductions;

-- Create RLS policy for authenticated users
CREATE POLICY "Grammar introductions viewable by authenticated"
ON grammar_introductions
FOR SELECT
TO authenticated
USING (true);

-- Create RLS policy for anonymous/public users
CREATE POLICY "Grammar introductions viewable by public"
ON grammar_introductions
FOR SELECT
TO anon
USING (true);

-- Verify the table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grammar_introductions'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'grammar_introductions';

-- Check if there's existing data
SELECT
    gi.topic_id,
    gt.title_en,
    gt.slug,
    CASE WHEN gi.hook_en IS NOT NULL THEN '✓' ELSE '✗' END as has_hook,
    CASE WHEN gi.english_comparison_en IS NOT NULL THEN '✓' ELSE '✗' END as has_comparison,
    CASE WHEN gi.scenario_en IS NOT NULL THEN '✓' ELSE '✗' END as has_scenario
FROM grammar_introductions gi
JOIN grammar_topics gt ON gt.id = gi.topic_id
ORDER BY gt.sub_level, gt.topic_order;
