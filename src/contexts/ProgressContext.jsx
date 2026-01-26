import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';
import { vocabulary, sentences, grammar, levels, levelOrder } from '../data/content';

const ProgressContext = createContext({});

export const useProgress = () => useContext(ProgressContext);

const UNLOCK_THRESHOLD = 70; // 70% required to unlock next level

// Initialize empty progress for all 8 sub-levels
const getInitialProgress = () => ({
  'a1.1': { vocabulary: [], sentences: [], grammar: [] },
  'a1.2': { vocabulary: [], sentences: [], grammar: [] },
  'a2.1': { vocabulary: [], sentences: [], grammar: [] },
  'a2.2': { vocabulary: [], sentences: [], grammar: [] },
  'b1.1': { vocabulary: [], sentences: [], grammar: [] },
  'b1.2': { vocabulary: [], sentences: [], grammar: [] },
  'b2.1': { vocabulary: [], sentences: [], grammar: [] },
  'b2.2': { vocabulary: [], sentences: [], grammar: [] },
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
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
