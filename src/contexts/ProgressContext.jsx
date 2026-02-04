import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';
import { vocabulary, sentences, grammar, levels } from '../data/content';
import { getTopicsForLevel } from '../data/grammarTopics';
import {
  loadUserGrammarProgress,
  saveUserGrammarProgress,
  lookupTopicUUID,
} from '../services/grammarService';

const ProgressContext = createContext({});

export const useProgress = () => useContext(ProgressContext);

// Initialize empty progress for all 8 sub-levels
const getInitialProgress = () => ({
  'a1.1': { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} },
  'a1.2': { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} },
  'a2.1': { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} },
  'a2.2': { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} },
  'b1.1': { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} },
  'b1.2': { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} },
  'b2.1': { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} },
  'b2.2': { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} },
});

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(getInitialProgress());
  const [loading, setLoading] = useState(true);
  // Actual item counts per level from Supabase (overrides static content.js counts)
  const [levelItemCounts, setLevelItemCounts] = useState({});

  // Load progress from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      // Load from localStorage for non-authenticated users
      const stored = localStorage.getItem('deutschmeister_progress');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Merge with initial progress to ensure all levels exist
          setProgress({ ...getInitialProgress(), ...parsed });
        } catch {
          setProgress(getInitialProgress());
        }
      }
      setLoading(false);
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      // Load JSON blob progress (existing system)
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
      }

      let baseProgress = getInitialProgress();
      if (data) {
        baseProgress = { ...baseProgress, ...data.progress };
      }

      // Also load from user_grammar_progress table (new system)
      const supabaseGrammarProgress = await loadUserGrammarProgress(user.id);

      // Merge: Supabase grammar progress takes precedence over JSON blob
      if (Object.keys(supabaseGrammarProgress).length > 0) {
        levels.forEach(level => {
          if (!baseProgress[level]) {
            baseProgress[level] = { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} };
          }
          if (!baseProgress[level].grammarTopics) {
            baseProgress[level].grammarTopics = {};
          }
        });

        // supabaseGrammarProgress keys are like "a1.1-gt1"
        // We need to figure out which level they belong to and merge
        Object.entries(supabaseGrammarProgress).forEach(([topicId, topicProgress]) => {
          // topicId format: "a1.1-gt1" → level is everything before the last "-gt"
          const levelMatch = topicId.match(/^(.+)-gt\d+$/);
          if (levelMatch) {
            const level = levelMatch[1];
            if (baseProgress[level]) {
              // Supabase data takes precedence
              baseProgress[level].grammarTopics[topicId] = {
                ...baseProgress[level].grammarTopics[topicId],
                ...topicProgress,
              };
            }
          }
        });
      }

      setProgress(baseProgress);

      if (!data) {
        // Initialize progress in database
        await saveProgressToDb(baseProgress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgressToDb = async (newProgress) => {
    if (!user) {
      localStorage.setItem('deutschmeister_progress', JSON.stringify(newProgress));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          progress: newProgress,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving progress:', error);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Helper: resolve topic slug from topicId (e.g. "a1.1-gt1" → slug)
  const resolveSlugFromTopicId = (level, topicId) => {
    const topics = getTopicsForLevel(level);
    const topic = topics.find(t => t.id === topicId);
    return topic?.slug || null;
  };

  // Helper: save progress to user_grammar_progress table (fire-and-forget)
  const saveToGrammarProgressTable = async (level, topicId, progressData) => {
    if (!user) return;

    const slug = resolveSlugFromTopicId(level, topicId);
    if (!slug) return;

    const topicUUID = await lookupTopicUUID(level, slug);
    if (!topicUUID) return; // grammar_topics table is empty, skip

    await saveUserGrammarProgress(user.id, topicUUID, progressData);
  };

  // Mark an item as learned
  const markAsLearned = async (level, category, itemId) => {
    const newProgress = { ...progress };
    if (!newProgress[level]) {
      newProgress[level] = { vocabulary: [], sentences: [], grammar: [], paragraphs: [] };
    }
    if (!newProgress[level][category]) {
      newProgress[level][category] = [];
    }
    if (!newProgress[level][category].includes(itemId)) {
      newProgress[level][category] = [...newProgress[level][category], itemId];
      setProgress(newProgress);
      await saveProgressToDb(newProgress);
    }
  };

  // Unmark an item as learned
  const unmarkAsLearned = async (level, category, itemId) => {
    const newProgress = { ...progress };
    if (newProgress[level] && newProgress[level][category]) {
      newProgress[level][category] = newProgress[level][category].filter(
        (id) => id !== itemId
      );
      setProgress(newProgress);
      await saveProgressToDb(newProgress);
    }
  };

  // Check if an item is learned
  const isItemLearned = (level, category, itemId) => {
    return progress[level]?.[category]?.includes(itemId) || false;
  };

  // Register actual item counts fetched from Supabase for a level
  const registerLevelItemCounts = (level, vocabCount, sentenceCount, paragraphCount = 0) => {
    setLevelItemCounts(prev => {
      const existing = prev[level];
      if (existing && existing.vocabulary === vocabCount && existing.sentences === sentenceCount && existing.paragraphs === paragraphCount) {
        return prev;
      }
      return { ...prev, [level]: { vocabulary: vocabCount, sentences: sentenceCount, paragraphs: paragraphCount } };
    });
  };

  // Calculate progress percentage for a level
  const getLevelProgress = (level) => {
    const levelProgress = progress[level];
    if (!levelProgress) return 0;

    // Prefer actual Supabase counts over static content.js counts
    const counts = levelItemCounts[level];
    const totalVocab = counts?.vocabulary ?? (vocabulary[level]?.length || 0);
    const totalSentences = counts?.sentences ?? (sentences[level]?.length || 0);
    const totalGrammar = grammar[level]?.length || 0;
    const totalParagraphs = counts?.paragraphs ?? 0;
    const total = totalVocab + totalSentences + totalGrammar + totalParagraphs;

    if (total === 0) return 0;

    const learnedVocab = levelProgress.vocabulary?.length || 0;
    const learnedSentences = levelProgress.sentences?.length || 0;
    const learnedGrammar = levelProgress.grammar?.length || 0;
    const learnedParagraphs = levelProgress.paragraphs?.length || 0;
    const learned = learnedVocab + learnedSentences + learnedGrammar + learnedParagraphs;

    return Math.round((learned / total) * 100);
  };

  // Get total stats across all levels
  const getTotalStats = () => {
    let totalVocab = 0;
    let totalSentences = 0;
    let totalGrammar = 0;
    let totalParagraphs = 0;

    levels.forEach((level) => {
      totalVocab += progress[level]?.vocabulary?.length || 0;
      totalSentences += progress[level]?.sentences?.length || 0;
      totalGrammar += progress[level]?.grammar?.length || 0;
      totalParagraphs += progress[level]?.paragraphs?.length || 0;
    });

    return {
      vocabulary: totalVocab,
      sentences: totalSentences,
      grammar: totalGrammar,
      paragraphs: totalParagraphs,
      total: totalVocab + totalSentences + totalGrammar + totalParagraphs,
    };
  };

  // Get overall progress across all levels
  const getOverallProgress = () => {
    let totalItems = 0;
    let learnedItems = 0;

    levels.forEach((level) => {
      const counts = levelItemCounts[level];
      totalItems += counts?.vocabulary ?? (vocabulary[level]?.length || 0);
      totalItems += counts?.sentences ?? (sentences[level]?.length || 0);
      totalItems += (grammar[level]?.length || 0);
      totalItems += counts?.paragraphs ?? 0;

      learnedItems += progress[level]?.vocabulary?.length || 0;
      learnedItems += progress[level]?.sentences?.length || 0;
      learnedItems += progress[level]?.grammar?.length || 0;
      learnedItems += progress[level]?.paragraphs?.length || 0;
    });

    if (totalItems === 0) return 0;
    return Math.round((learnedItems / totalItems) * 100);
  };

  // ==========================================
  // Grammar Topics Progress Methods
  // ==========================================

  // Get progress for a specific grammar topic
  const getGrammarTopicProgress = (level, topicId) => {
    const topicProgress = progress[level]?.grammarTopics?.[topicId];
    if (!topicProgress) {
      return { completed: false, progress: 0, currentStage: 1, score: 0 };
    }
    return topicProgress;
  };

  // Get overall progress for grammar section of a level
  const getGrammarSectionProgress = (level) => {
    const topics = getTopicsForLevel(level);
    if (topics.length === 0) return 0;

    let completedCount = 0;
    topics.forEach(topic => {
      const topicProgress = getGrammarTopicProgress(level, topic.id);
      if (topicProgress.completed) completedCount++;
    });

    return Math.round((completedCount / topics.length) * 100);
  };

  // Update grammar topic progress (dual-save: JSON blob + user_grammar_progress table)
  const updateGrammarTopicProgress = async (level, topicId, progressData) => {
    const newProgress = { ...progress };
    if (!newProgress[level]) {
      newProgress[level] = { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} };
    }
    if (!newProgress[level].grammarTopics) {
      newProgress[level].grammarTopics = {};
    }

    const mergedData = {
      ...newProgress[level].grammarTopics[topicId],
      ...progressData,
    };

    newProgress[level].grammarTopics[topicId] = mergedData;

    setProgress(newProgress);
    await saveProgressToDb(newProgress);

    // Also save to user_grammar_progress table (fire-and-forget)
    saveToGrammarProgressTable(level, topicId, mergedData);
  };

  // Mark grammar topic as completed (dual-save)
  const completeGrammarTopic = async (level, topicId, score = 100) => {
    await updateGrammarTopicProgress(level, topicId, {
      completed: true,
      progress: 100,
      currentStage: 5,
      score,
      completedAt: new Date().toISOString(),
    });
  };

  const value = {
    progress,
    loading,
    markAsLearned,
    unmarkAsLearned,
    isItemLearned,
    getLevelProgress,
    registerLevelItemCounts,
    getTotalStats,
    getOverallProgress,
    // Grammar topics
    getGrammarTopicProgress,
    getGrammarSectionProgress,
    updateGrammarTopicProgress,
    completeGrammarTopic,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
