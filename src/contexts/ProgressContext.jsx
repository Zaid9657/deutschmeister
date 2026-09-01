import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';
import { safeGetJSON, safeSetJSON } from '../utils/safeStorage';
import { levels } from '../data/content';
import { getTopicsForLevel } from '../data/grammarTopics';
import { loadUserGrammarProgress } from '../services/grammarService';
import {
  loadUserReadingProgress,
  getReadingLessonsByLevel,
} from '../services/readingService';

// ──────────────────────────────────────────────────────────────
// Progress = persisted signals only. Every percentage this context
// hands out is computed from rows that exist in Supabase
// (user_grammar_progress, user_reading_progress,
// user_listening_progress) — never from the in-memory
// vocabulary/sentences arrays, which were never written to the
// database for logged-in users and pinned the LevelPage ring, the
// ProfilePage totals and the dashboard hero bar at a permanent 0%.
// The localStorage marking survives for anonymous visitors only
// (their A1.1 browsing UX), and is excluded from all percentages.
// ──────────────────────────────────────────────────────────────

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
  // Per-level totals for the persisted signals, filled as they are fetched.
  // { 'b1.1': n } — reading lessons that exist per level
  const [readingTotals, setReadingTotals] = useState({});
  // { 'b1.1': { total, completed } } — listening exercises per level
  const [listeningSummary, setListeningSummary] = useState({});

  // Load progress from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      // Load from localStorage for non-authenticated users
      const parsed = safeGetJSON('deutschmeister_progress', null);
      if (parsed) {
        // Merge with initial progress to ensure all levels exist
        setProgress({ ...getInitialProgress(), ...parsed });
      }
      setLoading(false);
    }
    // loadProgress is intentionally not a dependency: it is re-created every
    // render (not memoised) and closes only over `user`, which IS the
    // dependency — adding the function would re-run the fetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProgress = async () => {
    try {
      const baseProgress = getInitialProgress();

      const [supabaseGrammarProgress, completedLessonIds, listening] = await Promise.all([
        loadUserGrammarProgress(user.id),
        loadUserReadingProgress(user.id),
        loadListeningSummary(user.id),
      ]);

      setListeningSummary(listening);

      // supabaseGrammarProgress keys are like "a1.1-gt1"
      Object.entries(supabaseGrammarProgress).forEach(([topicId, topicProgress]) => {
        // topicId format: "a1.1-gt1" → level is everything before the last "-gt"
        const levelMatch = topicId.match(/^(.+)-gt\d+$/);
        if (levelMatch && baseProgress[levelMatch[1]]) {
          baseProgress[levelMatch[1]].grammarTopics[topicId] = { ...topicProgress };
        }
      });

      // Map completed reading lesson ids to their levels, and keep the totals
      // so getLevelProgress has a real denominator.
      if (completedLessonIds.size > 0) {
        const allLevelLessons = await Promise.all(
          levels.map(async (level) => ({ level, lessons: await getReadingLessonsByLevel(level) }))
        );
        const totals = {};
        allLevelLessons.forEach(({ level, lessons }) => {
          totals[level] = lessons.length;
          lessons.forEach((lesson) => {
            if (completedLessonIds.has(lesson.id) && !baseProgress[level].readingLessons.includes(lesson.id)) {
              baseProgress[level].readingLessons.push(lesson.id);
            }
          });
        });
        setReadingTotals(totals);
      }

      setProgress(baseProgress);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Per-level listening totals + completions in two small queries.
  // listening_exercises.level is UPPERCASE in the DB; keys here are lowercase
  // (the URL/progress form) — normalize at this boundary.
  const loadListeningSummary = async (userId) => {
    try {
      const [exercises, done] = await Promise.all([
        supabase.from('listening_exercises').select('id, level'),
        supabase
          .from('user_listening_progress')
          .select('exercise_id')
          .eq('user_id', userId)
          .eq('completed', true),
      ]);
      const doneIds = new Set((done.data || []).map((r) => r.exercise_id));
      const summary = {};
      (exercises.data || []).forEach((ex) => {
        const level = String(ex.level || '').toLowerCase();
        if (!summary[level]) summary[level] = { total: 0, completed: 0 };
        summary[level].total += 1;
        if (doneIds.has(ex.id)) summary[level].completed += 1;
      });
      return summary;
    } catch (error) {
      console.error('Error loading listening summary:', error);
      return {};
    }
  };

  // Anonymous visitors keep their marks across reloads via localStorage;
  // logged-in users' real progress lives in the per-feature tables.
  const persistLocalProgress = (newProgress) => {
    if (!user) safeSetJSON('deutschmeister_progress', newProgress);
  };

  // Mark an item as learned (in-memory + localStorage for anon)
  const markAsLearned = async (level, category, itemId) => {
    const newProgress = { ...progress };
    if (!newProgress[level]) {
      newProgress[level] = { vocabulary: [], sentences: [], grammar: [], paragraphs: [], readingLessons: [], grammarTopics: {} };
    }
    if (!newProgress[level][category]) {
      newProgress[level][category] = [];
    }
    if (!newProgress[level][category].includes(itemId)) {
      newProgress[level][category] = [...newProgress[level][category], itemId];
      setProgress(newProgress);
      persistLocalProgress(newProgress);
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
      persistLocalProgress(newProgress);
    }
  };

  // Check if an item is learned
  const isItemLearned = (level, category, itemId) => {
    return progress[level]?.[category]?.includes(itemId) || false;
  };

  // The persisted parts of a level: [{ done, total }] for each signal that
  // has a known denominator. Grammar always has one (the topic registry);
  // reading/listening join in once their totals have been fetched.
  const levelParts = (level) => {
    const parts = [];
    const topics = getTopicsForLevel(level) || [];
    if (topics.length > 0) {
      const done = topics.filter(
        (t) => progress[level]?.grammarTopics?.[t.id]?.completed
      ).length;
      parts.push({ done, total: topics.length });
    }
    const readingTotal = readingTotals[level] || 0;
    if (readingTotal > 0) {
      parts.push({ done: progress[level]?.readingLessons?.length || 0, total: readingTotal });
    }
    const listening = listeningSummary[level];
    if (listening?.total > 0) {
      parts.push({ done: listening.completed, total: listening.total });
    }
    return parts;
  };

  // Calculate progress percentage for a level — persisted signals only.
  const getLevelProgress = (level) => {
    const parts = levelParts(level);
    const total = parts.reduce((sum, p) => sum + p.total, 0);
    if (total === 0) return 0;
    const done = parts.reduce((sum, p) => sum + p.done, 0);
    return Math.round((done / total) * 100);
  };

  // Persisted completion counts across all levels (for the profile stats).
  const getTotalStats = () => {
    let grammarTopics = 0;
    let readingLessons = 0;
    let listening = 0;

    levels.forEach((level) => {
      const topics = getTopicsForLevel(level) || [];
      grammarTopics += topics.filter(
        (t) => progress[level]?.grammarTopics?.[t.id]?.completed
      ).length;
      readingLessons += progress[level]?.readingLessons?.length || 0;
      listening += listeningSummary[level]?.completed || 0;
    });

    return {
      grammarTopics,
      readingLessons,
      listening,
      total: grammarTopics + readingLessons + listening,
    };
  };

  // Get overall progress across all levels — persisted signals only.
  const getOverallProgress = () => {
    let totalItems = 0;
    let doneItems = 0;
    levels.forEach((level) => {
      levelParts(level).forEach((p) => {
        totalItems += p.total;
        doneItems += p.done;
      });
    });
    if (totalItems === 0) return 0;
    return Math.round((doneItems / totalItems) * 100);
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

  const value = {
    progress,
    loading,
    markAsLearned,
    unmarkAsLearned,
    isItemLearned,
    getLevelProgress,
    getTotalStats,
    getOverallProgress,
    // Grammar topics
    getGrammarTopicProgress,
    getGrammarSectionProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
