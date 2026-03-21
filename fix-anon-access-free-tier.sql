-- ============================================================
-- Allow anonymous (anon) users to read content for free tier
-- ============================================================
-- Currently all content tables have RLS policies restricted to
-- 'authenticated' role. Anonymous users on A1.1 free tier get
-- empty results. These policies allow public SELECT access.
-- ============================================================

-- Grammar Topics (needed for topic list + lesson loading)
CREATE POLICY "Grammar topics are viewable by everyone"
    ON grammar_topics
    FOR SELECT
    TO anon
    USING (true);

-- Grammar Examples (Stage 2 content)
CREATE POLICY "Grammar examples are viewable by everyone"
    ON grammar_examples
    FOR SELECT
    TO anon
    USING (true);

-- Grammar Rules (Stage 3 content)
CREATE POLICY "Grammar rules are viewable by everyone"
    ON grammar_rules
    FOR SELECT
    TO anon
    USING (true);

-- Grammar Exercises (Stages 4-5 content)
CREATE POLICY "Grammar exercises are viewable by everyone"
    ON grammar_exercises
    FOR SELECT
    TO anon
    USING (true);

-- Reading Lessons
CREATE POLICY "Reading lessons are viewable by everyone"
    ON reading_lessons
    FOR SELECT
    TO anon
    USING (true);

-- Listening Exercises
CREATE POLICY "Listening exercises are viewable by everyone"
    ON listening_exercises
    FOR SELECT
    TO anon
    USING (true);

-- Listening Questions
CREATE POLICY "Listening questions are viewable by everyone"
    ON listening_questions
    FOR SELECT
    TO anon
    USING (true);

-- Listening Dialogues
CREATE POLICY "Listening dialogues are viewable by everyone"
    ON listening_dialogues
    FOR SELECT
    TO anon
    USING (true);

-- ============================================================
-- NOTE: This makes all content readable by anonymous users.
-- The level-gating is handled by the frontend (LevelSubscriptionGuard).
-- If you want to restrict anon access to only A1.1 data at the
-- database level, replace USING (true) with:
--   USING (level = 'a1.1' OR level = 'A1.1')
-- for level-bearing tables, or join through topic_id → grammar_topics.
-- ============================================================
