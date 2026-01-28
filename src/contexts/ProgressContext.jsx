import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';
import { vocabulary, sentences, grammar, levels, levelOrder } from '../data/content';
import { getTopicsForLevel } from '../data/grammarTopics';

const ProgressContext = createContext({});

export const useProgress = () => useContext(ProgressContext);

const UNLOCK_THRESHOLD = 70; // 70% required to unlock next level

// Initialize empty progress for all 8 sub-levels
const getInitialProgress = () => ({
  'a1.1': { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} },
  'a1.2': { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} },
  'a2.1': { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} },
  'a2.2': { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} },
  'b1.1': { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} },
  'b1.2': { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} },
  'b2.1': { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} },
  'b2.2': { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} },
});

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(getInitialProgress());
  const [loading, setLoading] = useState(true);

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
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
      }

      if (data) {
        // Merge with initial progress to ensure all levels exist
        setProgress({ ...getInitialProgress(), ...data.progress });
      } else {
        // Initialize progress in database
        await saveProgressToDb(progress);
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

  // Mark an item as learned
  const markAsLearned = async (level, category, itemId) => {
    const newProgress = { ...progress };
    if (!newProgress[level]) {
      newProgress[level] = { vocabulary: [], sentences: [], grammar: [] };
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

  // Calculate progress percentage for a level
  const getLevelProgress = (level) => {
    const levelProgress = progress[level];
    if (!levelProgress) return 0;

    const totalVocab = vocabulary[level]?.length || 0;
    const totalSentences = sentences[level]?.length || 0;
    const totalGrammar = grammar[level]?.length || 0;
    const total = totalVocab + totalSentences + totalGrammar;

    if (total === 0) return 0;

    const learnedVocab = levelProgress.vocabulary?.length || 0;
    const learnedSentences = levelProgress.sentences?.length || 0;
    const learnedGrammar = levelProgress.grammar?.length || 0;
    const learned = learnedVocab + learnedSentences + learnedGrammar;

    return Math.round((learned / total) * 100);
  };

  // Check if a level is unlocked
  const isLevelUnlocked = (level) => {
    const levelIndex = levelOrder.indexOf(level);
    if (levelIndex === 0) return true; // a1.1 is always unlocked

    const previousLevel = levelOrder[levelIndex - 1];
    return getLevelProgress(previousLevel) >= UNLOCK_THRESHOLD;
  };

  // Get total stats across all levels
  const getTotalStats = () => {
    let totalVocab = 0;
    let totalSentences = 0;
    let totalGrammar = 0;

    levels.forEach((level) => {
      totalVocab += progress[level]?.vocabulary?.length || 0;
      totalSentences += progress[level]?.sentences?.length || 0;
      totalGrammar += progress[level]?.grammar?.length || 0;
    });

    return {
      vocabulary: totalVocab,
      sentences: totalSentences,
      grammar: totalGrammar,
      total: totalVocab + totalSentences + totalGrammar,
    };
  };

  // Get overall progress across all levels
  const getOverallProgress = () => {
    let totalItems = 0;
    let learnedItems = 0;

    levels.forEach((level) => {
      totalItems += (vocabulary[level]?.length || 0);
      totalItems += (sentences[level]?.length || 0);
      totalItems += (grammar[level]?.length || 0);

      learnedItems += progress[level]?.vocabulary?.length || 0;
      learnedItems += progress[level]?.sentences?.length || 0;
      learnedItems += progress[level]?.grammar?.length || 0;
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

  // Check if a grammar topic is unlocked (sequential unlocking)
  const isGrammarTopicUnlocked = (level, topicIndex) => {
    // First topic is always unlocked if the level is unlocked
    if (topicIndex === 0) return isLevelUnlocked(level);

    // Check if previous topic is completed
    const topics = getTopicsForLevel(level);
    if (topicIndex >= topics.length) return false;

    const previousTopic = topics[topicIndex - 1];
    const previousProgress = getGrammarTopicProgress(level, previousTopic.id);
    return previousProgress.completed;
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

  // Update grammar topic progress
  const updateGrammarTopicProgress = async (level, topicId, progressData) => {
    const newProgress = { ...progress };
    if (!newProgress[level]) {
      newProgress[level] = { vocabulary: [], sentences: [], grammar: [], grammarTopics: {} };
    }
    if (!newProgress[level].grammarTopics) {
      newProgress[level].grammarTopics = {};
    }

    newProgress[level].grammarTopics[topicId] = {
      ...newProgress[level].grammarTopics[topicId],
      ...progressData,
    };

    setProgress(newProgress);
    await saveProgressToDb(newProgress);
  };

  // Mark grammar topic as completed
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
    isLevelUnlocked,
    getTotalStats,
    getOverallProgress,
    UNLOCK_THRESHOLD,
    // Grammar topics
    getGrammarTopicProgress,
    isGrammarTopicUnlocked,
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
