-- ===============================================
-- Grammar Content Tables (Stages 2-5)
-- Add these tables to support grammar lesson content
-- ===============================================

-- Grammar Examples Table (Stage 2)
CREATE TABLE IF NOT EXISTS grammar_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES grammar_topics(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,              -- Display order
    sentence_de TEXT NOT NULL,                 -- German sentence
    sentence_en TEXT NOT NULL,                 -- English translation
    grammar_highlight TEXT,                    -- Which part to emphasize
    audio_url TEXT,                            -- Optional audio file URL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(topic_id, order_index)
);

-- Grammar Rules Table (Stage 3)
CREATE TABLE IF NOT EXISTS grammar_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES grammar_topics(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,              -- Display order
    rule_type TEXT NOT NULL,                   -- 'table', 'pattern', 'tip', 'warning', 'note'
    title_en TEXT,                             -- English title
    title_de TEXT,                             -- German title
    content JSONB,                             -- Flexible content structure
    -- For rule_type='table': { headers: [], rows: [[]] }
    -- For rule_type='tip'/'warning': { text_en: '', text_de: '' }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(topic_id, order_index)
);

-- Grammar Exercises Table (Stages 4 & 5)
CREATE TABLE IF NOT EXISTS grammar_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES grammar_topics(id) ON DELETE CASCADE,
    stage INTEGER NOT NULL CHECK (stage IN (4, 5)),  -- 4=Practice, 5=Mastery
    order_index INTEGER NOT NULL,              -- Display order within stage
    exercise_type TEXT NOT NULL,               -- 'fill_blank', 'multiple_choice', 'matching', 'reorder', etc.
    question_en TEXT NOT NULL,                 -- English question
    question_de TEXT NOT NULL,                 -- German question
    options JSONB,                             -- Array of options (for multiple choice, etc.)
    correct_answer TEXT NOT NULL,              -- Correct answer or answer index
    acceptable_answers JSONB,                  -- Array of acceptable answers
    explanation_en TEXT,                       -- English explanation
    explanation_de TEXT,                       -- German explanation
    hint TEXT,                                 -- Optional hint
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(topic_id, stage, order_index)
);

-- Enable Row Level Security
ALTER TABLE grammar_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for authenticated users)
CREATE POLICY "Grammar examples are viewable by all authenticated users"
    ON grammar_examples
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Grammar rules are viewable by all authenticated users"
    ON grammar_rules
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Grammar exercises are viewable by all authenticated users"
    ON grammar_exercises
    FOR SELECT
    TO authenticated
    USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_grammar_examples_topic_id ON grammar_examples(topic_id);
CREATE INDEX IF NOT EXISTS idx_grammar_rules_topic_id ON grammar_rules(topic_id);
CREATE INDEX IF NOT EXISTS idx_grammar_exercises_topic_id ON grammar_exercises(topic_id);
CREATE INDEX IF NOT EXISTS idx_grammar_exercises_stage ON grammar_exercises(topic_id, stage);

-- ===============================================
-- Optional: Add introduction fields to grammar_topics
-- ===============================================

-- Add introduction content fields to grammar_topics table
ALTER TABLE grammar_topics
ADD COLUMN IF NOT EXISTS introduction_en TEXT,
ADD COLUMN IF NOT EXISTS introduction_de TEXT,
ADD COLUMN IF NOT EXISTS key_points JSONB;  -- Array of { en: '', de: '' }

-- Example key_points structure:
-- [
--   { "en": "Learn how to use the dative case", "de": "Lerne, wie man den Dativ benutzt" },
--   { "en": "Understand dative prepositions", "de": "Verstehe Präpositionen mit Dativ" }
-- ]
