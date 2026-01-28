-- ===============================================
-- DeutschMeister Grammar Section Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ===============================================

-- Grammar Topics Table
-- Stores metadata for all 64 grammar topics (8 per sub-level)
CREATE TABLE IF NOT EXISTS grammar_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_level TEXT NOT NULL,                    -- e.g., 'a1.1', 'a1.2', etc.
    topic_order INTEGER NOT NULL,               -- 1-8 within each sub-level
    title_en TEXT NOT NULL,                     -- English title
    title_de TEXT NOT NULL,                     -- German title
    slug TEXT UNIQUE NOT NULL,                  -- URL-friendly identifier
    description_en TEXT,                        -- English description
    description_de TEXT,                        -- German description
    estimated_time INTEGER DEFAULT 20,          -- Estimated completion time in minutes
    icon TEXT,                                  -- Icon identifier
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sub_level, topic_order)
);

-- User Grammar Progress Table
-- Tracks individual user progress through grammar topics
CREATE TABLE IF NOT EXISTS user_grammar_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES grammar_topics(id) ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 1 CHECK (current_stage >= 1 AND current_stage <= 5),
    -- Stage 1: Introduction
    -- Stage 2: Guided Practice
    -- Stage 3: Free Practice
    -- Stage 4: Quiz
    -- Stage 5: Mastery
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- Enable Row Level Security
ALTER TABLE grammar_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_grammar_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grammar_topics (read-only for all authenticated users)
CREATE POLICY "Grammar topics are viewable by all authenticated users"
    ON grammar_topics
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for user_grammar_progress (users can only access their own progress)
CREATE POLICY "Users can view their own grammar progress"
    ON user_grammar_progress
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grammar progress"
    ON user_grammar_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grammar progress"
    ON user_grammar_progress
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_grammar_topics_sub_level ON grammar_topics(sub_level);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_slug ON grammar_topics(slug);
CREATE INDEX IF NOT EXISTS idx_user_grammar_progress_user_id ON user_grammar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_grammar_progress_topic_id ON user_grammar_progress(topic_id);

-- ===============================================
-- Insert Grammar Topics Data
-- ===============================================

-- A1.1 Topics
INSERT INTO grammar_topics (sub_level, topic_order, title_en, title_de, slug, description_en, description_de, icon, estimated_time) VALUES
('a1.1', 1, 'Alphabet & Pronunciation', 'Alphabet und Aussprache', 'alphabet-pronunciation', 'Learn the German alphabet and basic pronunciation rules', 'Das deutsche Alphabet und grundlegende Ausspracheregeln lernen', 'abc', 15),
('a1.1', 2, 'Nouns & Gender', 'Nomen und Genus', 'nouns-gender', 'Understanding masculine, feminine, and neuter nouns', 'Maskuline, feminine und neutrale Nomen verstehen', 'shapes', 20),
('a1.1', 3, 'Definite Articles', 'Bestimmte Artikel', 'definite-articles', 'Using der, die, das correctly', 'Der, die, das richtig verwenden', 'tag', 20),
('a1.1', 4, 'Indefinite Articles', 'Unbestimmte Artikel', 'indefinite-articles', 'Using ein, eine correctly', 'Ein, eine richtig verwenden', 'tag', 15),
('a1.1', 5, 'Personal Pronouns', 'Personalpronomen', 'personal-pronouns', 'ich, du, er, sie, es, wir, ihr, sie, Sie', 'ich, du, er, sie, es, wir, ihr, sie, Sie', 'users', 20),
('a1.1', 6, 'Verb "sein"', 'Das Verb "sein"', 'verb-sein', 'Conjugating and using the verb "to be"', 'Das Verb "sein" konjugieren und verwenden', 'check', 20),
('a1.1', 7, 'Verb "haben"', 'Das Verb "haben"', 'verb-haben', 'Conjugating and using the verb "to have"', 'Das Verb "haben" konjugieren und verwenden', 'package', 20),
('a1.1', 8, 'Present Tense (Regular)', 'Präsens (regelmäßig)', 'present-tense-regular', 'Regular verb conjugation in present tense', 'Regelmäßige Verbkonjugation im Präsens', 'clock', 25)
ON CONFLICT (slug) DO NOTHING;

-- A1.2 Topics
INSERT INTO grammar_topics (sub_level, topic_order, title_en, title_de, slug, description_en, description_de, icon, estimated_time) VALUES
('a1.2', 1, 'Plural Formation', 'Pluralbildung', 'plural-formation', 'Rules for forming plural nouns', 'Regeln zur Bildung von Pluralnomen', 'layers', 25),
('a1.2', 2, 'Accusative Case', 'Akkusativ', 'accusative-case', 'Understanding and using the accusative case', 'Den Akkusativ verstehen und verwenden', 'target', 25),
('a1.2', 3, 'Negation', 'Verneinung', 'negation', 'Using nicht and kein', 'Nicht und kein verwenden', 'x', 20),
('a1.2', 4, 'Yes/No Questions', 'Ja/Nein-Fragen', 'yes-no-questions', 'Forming basic questions', 'Grundlegende Fragen bilden', 'help-circle', 20),
('a1.2', 5, 'W-Questions', 'W-Fragen', 'w-questions', 'Using question words (wer, was, wo, etc.)', 'Fragewörter verwenden (wer, was, wo, usw.)', 'message-circle', 20),
('a1.2', 6, 'Numbers 1-100', 'Zahlen 1-100', 'numbers-1-100', 'Counting and using numbers', 'Zählen und Zahlen verwenden', 'hash', 20),
('a1.2', 7, 'Time Expressions', 'Zeitangaben', 'time-expressions', 'Telling time and time phrases', 'Die Uhrzeit und Zeitausdrücke', 'clock', 25),
('a1.2', 8, 'Separable Verbs', 'Trennbare Verben', 'separable-verbs', 'Understanding verbs that split apart', 'Verben verstehen, die sich trennen', 'scissors', 25)
ON CONFLICT (slug) DO NOTHING;

-- A2.1 Topics
INSERT INTO grammar_topics (sub_level, topic_order, title_en, title_de, slug, description_en, description_de, icon, estimated_time) VALUES
('a2.1', 1, 'Dative Case', 'Dativ', 'dative-case', 'Understanding and using the dative case', 'Den Dativ verstehen und verwenden', 'gift', 30),
('a2.1', 2, 'Dative Prepositions', 'Präpositionen mit Dativ', 'dative-prepositions', 'aus, bei, mit, nach, seit, von, zu', 'aus, bei, mit, nach, seit, von, zu', 'map-pin', 25),
('a2.1', 3, 'Accusative Prepositions', 'Präpositionen mit Akkusativ', 'accusative-prepositions', 'durch, für, gegen, ohne, um', 'durch, für, gegen, ohne, um', 'navigation', 25),
('a2.1', 4, 'Modal Verbs', 'Modalverben', 'modal-verbs', 'können, müssen, wollen, dürfen, sollen, mögen', 'können, müssen, wollen, dürfen, sollen, mögen', 'key', 30),
('a2.1', 5, 'Perfect Tense (haben)', 'Perfekt (mit haben)', 'perfect-tense-haben', 'Past tense with haben', 'Vergangenheit mit haben', 'check-circle', 30),
('a2.1', 6, 'Perfect Tense (sein)', 'Perfekt (mit sein)', 'perfect-tense-sein', 'Past tense with sein for movement/change verbs', 'Vergangenheit mit sein für Bewegungs-/Veränderungsverben', 'arrow-right', 25),
('a2.1', 7, 'Possessive Articles', 'Possessivartikel', 'possessive-articles', 'mein, dein, sein, ihr, unser, euer, ihr', 'mein, dein, sein, ihr, unser, euer, ihr', 'heart', 25),
('a2.1', 8, 'Comparative', 'Komparativ', 'comparative', 'Comparing things: bigger, better, faster', 'Dinge vergleichen: größer, besser, schneller', 'trending-up', 25)
ON CONFLICT (slug) DO NOTHING;

-- A2.2 Topics
INSERT INTO grammar_topics (sub_level, topic_order, title_en, title_de, slug, description_en, description_de, icon, estimated_time) VALUES
('a2.2', 1, 'Superlative', 'Superlativ', 'superlative', 'The biggest, best, fastest forms', 'Die größten, besten, schnellsten Formen', 'award', 25),
('a2.2', 2, 'Two-Way Prepositions', 'Wechselpräpositionen', 'two-way-prepositions', 'an, auf, hinter, in, neben, über, unter, vor, zwischen', 'an, auf, hinter, in, neben, über, unter, vor, zwischen', 'repeat', 30),
('a2.2', 3, 'Reflexive Verbs', 'Reflexive Verben', 'reflexive-verbs', 'Verbs with sich', 'Verben mit sich', 'refresh-cw', 25),
('a2.2', 4, 'Imperative', 'Imperativ', 'imperative', 'Giving commands and instructions', 'Befehle und Anweisungen geben', 'alert-circle', 25),
('a2.2', 5, 'Coordinating Conjunctions', 'Koordinierende Konjunktionen', 'coordinating-conjunctions', 'und, aber, oder, denn, sondern', 'und, aber, oder, denn, sondern', 'link', 20),
('a2.2', 6, 'Subordinating Conjunctions', 'Subordinierende Konjunktionen', 'subordinating-conjunctions', 'weil, dass, wenn, obwohl, als, bevor', 'weil, dass, wenn, obwohl, als, bevor', 'git-branch', 30),
('a2.2', 7, 'Word Order in Subclauses', 'Wortstellung in Nebensätzen', 'word-order-subclauses', 'Verb placement in dependent clauses', 'Verbstellung in Nebensätzen', 'list', 25),
('a2.2', 8, 'Preterite (sein/haben)', 'Präteritum (sein/haben)', 'preterite-sein-haben', 'Simple past of sein and haben', 'Einfache Vergangenheit von sein und haben', 'book-open', 25)
ON CONFLICT (slug) DO NOTHING;

-- B1.1 Topics
INSERT INTO grammar_topics (sub_level, topic_order, title_en, title_de, slug, description_en, description_de, icon, estimated_time) VALUES
('b1.1', 1, 'Genitive Case', 'Genitiv', 'genitive-case', 'Showing possession and relationships', 'Besitz und Beziehungen zeigen', 'briefcase', 30),
('b1.1', 2, 'Genitive Prepositions', 'Präpositionen mit Genitiv', 'genitive-prepositions', 'während, wegen, trotz, anstatt', 'während, wegen, trotz, anstatt', 'folder', 25),
('b1.1', 3, 'Relative Clauses', 'Relativsätze', 'relative-clauses', 'Using der, die, das as relative pronouns', 'der, die, das als Relativpronomen verwenden', 'message-square', 30),
('b1.1', 4, 'Passive Voice (Present)', 'Passiv (Präsens)', 'passive-voice-present', 'werden + past participle', 'werden + Partizip II', 'shuffle', 30),
('b1.1', 5, 'Passive Voice (Past)', 'Passiv (Vergangenheit)', 'passive-voice-past', 'wurde/worden constructions', 'wurde/worden Konstruktionen', 'rewind', 30),
('b1.1', 6, 'Infinitive with zu', 'Infinitiv mit zu', 'infinitive-with-zu', 'When and how to use zu with infinitives', 'Wann und wie man zu mit Infinitiven verwendet', 'plus', 25),
('b1.1', 7, 'Preterite (Regular)', 'Präteritum (regelmäßig)', 'preterite-regular', 'Simple past tense for regular verbs', 'Einfache Vergangenheit für regelmäßige Verben', 'file-text', 25),
('b1.1', 8, 'Preterite (Irregular)', 'Präteritum (unregelmäßig)', 'preterite-irregular', 'Simple past tense for irregular verbs', 'Einfache Vergangenheit für unregelmäßige Verben', 'file', 30)
ON CONFLICT (slug) DO NOTHING;

-- B1.2 Topics
INSERT INTO grammar_topics (sub_level, topic_order, title_en, title_de, slug, description_en, description_de, icon, estimated_time) VALUES
('b1.2', 1, 'Konjunktiv II (würde)', 'Konjunktiv II (würde)', 'konjunktiv-ii-wurde', 'Conditional mood with würde', 'Konjunktiv II mit würde', 'cloud', 30),
('b1.2', 2, 'Konjunktiv II (Modal Verbs)', 'Konjunktiv II (Modalverben)', 'konjunktiv-ii-modal', 'könnte, müsste, sollte, etc.', 'könnte, müsste, sollte, usw.', 'settings', 30),
('b1.2', 3, 'Indirect Speech', 'Indirekte Rede', 'indirect-speech', 'Reporting what others said', 'Berichten, was andere gesagt haben', 'message-circle', 30),
('b1.2', 4, 'Adjective Declension', 'Adjektivdeklination', 'adjective-declension', 'Strong, weak, and mixed endings', 'Starke, schwache und gemischte Endungen', 'type', 35),
('b1.2', 5, 'N-Declension', 'N-Deklination', 'n-declension', 'Weak masculine nouns', 'Schwache maskuline Nomen', 'edit', 25),
('b1.2', 6, 'Future Tense', 'Futur I', 'future-tense', 'werden + infinitive', 'werden + Infinitiv', 'fast-forward', 25),
('b1.2', 7, 'Double Infinitive', 'Doppelter Infinitiv', 'double-infinitive', 'Perfect tense with modal verbs', 'Perfekt mit Modalverben', 'layers', 30),
('b1.2', 8, 'Participial Adjectives', 'Partizipien als Adjektive', 'participial-adjectives', 'Using participles as adjectives', 'Partizipien als Adjektive verwenden', 'edit-2', 25)
ON CONFLICT (slug) DO NOTHING;

-- B2.1 Topics
INSERT INTO grammar_topics (sub_level, topic_order, title_en, title_de, slug, description_en, description_de, icon, estimated_time) VALUES
('b2.1', 1, 'Konjunktiv I', 'Konjunktiv I', 'konjunktiv-i', 'Formal indirect speech', 'Formelle indirekte Rede', 'quote', 35),
('b2.1', 2, 'Extended Attributes', 'Erweiterte Attribute', 'extended-attributes', 'Complex noun phrases', 'Komplexe Nominalphrasen', 'maximize-2', 35),
('b2.1', 3, 'Nominal Style', 'Nominalstil', 'nominal-style', 'Academic and formal writing style', 'Akademischer und formeller Schreibstil', 'file-plus', 30),
('b2.1', 4, 'Advanced Passive', 'Passiv (erweitert)', 'advanced-passive', 'sein-Passive and alternatives', 'sein-Passiv und Alternativen', 'rotate-cw', 30),
('b2.1', 5, 'Conditional Sentences', 'Konditionalsätze', 'conditional-sentences', 'Real and unreal conditions', 'Reale und irreale Bedingungen', 'git-merge', 35),
('b2.1', 6, 'Modal Particles', 'Modalpartikeln', 'modal-particles', 'doch, ja, mal, eben, halt, etc.', 'doch, ja, mal, eben, halt, usw.', 'message-circle', 30),
('b2.1', 7, 'Verb-Preposition Combinations', 'Verb-Präposition-Verbindungen', 'verb-preposition-combinations', 'sich freuen auf, warten auf, etc.', 'sich freuen auf, warten auf, usw.', 'link-2', 30),
('b2.1', 8, 'Pronominal Adverbs', 'Pronominaladverbien', 'pronominal-adverbs', 'darauf, dafür, damit, etc.', 'darauf, dafür, damit, usw.', 'corner-down-right', 30)
ON CONFLICT (slug) DO NOTHING;

-- B2.2 Topics
INSERT INTO grammar_topics (sub_level, topic_order, title_en, title_de, slug, description_en, description_de, icon, estimated_time) VALUES
('b2.2', 1, 'Future Perfect', 'Futur II', 'future-perfect', 'Expressing completed future actions', 'Abgeschlossene zukünftige Handlungen ausdrücken', 'check-square', 30),
('b2.2', 2, 'Advanced Conjunctions', 'Erweiterte Konjunktionen', 'advanced-conjunctions', 'sodass, damit, um...zu, etc.', 'sodass, damit, um...zu, usw.', 'git-branch', 30),
('b2.2', 3, 'Subjunctive in Fixed Expressions', 'Konjunktiv in festen Ausdrücken', 'subjunctive-expressions', 'Common fixed phrases with Konjunktiv', 'Häufige feste Ausdrücke mit Konjunktiv', 'bookmark', 25),
('b2.2', 4, 'Gerundive', 'Gerundivum', 'gerundive', 'zu + participle constructions', 'zu + Partizip Konstruktionen', 'chevrons-right', 30),
('b2.2', 5, 'Text Connectors', 'Konnektoren', 'text-connectors', 'Advanced linking words for coherent texts', 'Fortgeschrittene Verbindungswörter für zusammenhängende Texte', 'link', 30),
('b2.2', 6, 'Register and Style', 'Register und Stil', 'register-and-style', 'Formal vs. informal German', 'Formelles vs. informelles Deutsch', 'sliders', 30),
('b2.2', 7, 'Idiomatic Expressions', 'Idiomatische Ausdrücke', 'idiomatic-expressions', 'Common German idioms and their usage', 'Häufige deutsche Redewendungen und ihre Verwendung', 'message-square', 30),
('b2.2', 8, 'Complex Sentence Structures', 'Komplexe Satzstrukturen', 'complex-sentence-structures', 'Mastering sophisticated German sentences', 'Anspruchsvolle deutsche Sätze meistern', 'code', 35)
ON CONFLICT (slug) DO NOTHING;

-- ===============================================
-- Verification Query (optional - run to verify)
-- ===============================================
-- SELECT sub_level, COUNT(*) as topic_count FROM grammar_topics GROUP BY sub_level ORDER BY sub_level;
-- Should show 8 topics for each of the 8 sub-levels (64 total)
