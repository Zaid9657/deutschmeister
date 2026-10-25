import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';
import { safeGetJSON, safeSetJSON } from '../utils/safeStorage';
import { levels } from '../data/content';
import { getTopicsForLevel } from '../data/grammarTopics';
import { loadUserGrammarProgress } from '../services/grammarService';
import { loadUserReadingProgress } from '../services/readingService';

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
        // completed_at, not `completed`: the live table has no flag column
        // (src/lib/listeningProgress.js). The flag made this a 400 on every load.
        .not('completed_at', 'is', null),
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

// Every reading lesson's id and level in one light query, the way the
// listening summary is loaded. It used to be eight select('*') calls (whole
// lesson bodies, only to count them), made only once the first reading lesson
// was done — so that first completion grew the denominator and the level
// percentage dropped. reading_lessons.level is lowercase (CLAUDE.md); it is
// lower-cased here anyway, at the boundary.
const loadReadingLessons = async () => {
  try {
    const { data, error } = await supabase.from('reading_lessons').select('id, level');
    if (error) throw error;
    return (data || [])
      .map((row) => ({ id: row.id, level: String(row.level || '').toLowerCase() }))
      .filter((row) => levels.includes(row.level));
  } catch (error) {
    console.error('Error loading reading lessons:', error);
    return [];
  }
};

// One signed-in learner's persisted progress. Pure data: the provider decides
// whether the answer still belongs to whoever is signed in when it arrives.
const fetchProgress = async (userId) => {
  const progress = getInitialProgress();
  const [supabaseGrammarProgress, completedLessonIds, listeningSummary, readingLessons] = await Promise.all([
    loadUserGrammarProgress(userId),
    loadUserReadingProgress(userId),
    loadListeningSummary(userId),
    loadReadingLessons(),
  ]);

  // supabaseGrammarProgress keys are like "a1.1-gt1"
  Object.entries(supabaseGrammarProgress).forEach(([topicId, topicProgress]) => {
    // topicId format: "a1.1-gt1" → level is everything before the last "-gt"
    const levelMatch = topicId.match(/^(.+)-gt\d+$/);
    if (levelMatch && progress[levelMatch[1]]) {
      progress[levelMatch[1]].grammarTopics[topicId] = { ...topicProgress };
    }
  });

  // Totals give getLevelProgress a real denominator from the first load;
  // completed ids map to their level from the same rows.
  const readingTotals = {};
  readingLessons.forEach(({ id, level }) => {
    readingTotals[level] = (readingTotals[level] || 0) + 1;
    if (completedLessonIds.has(id) && !progress[level].readingLessons.includes(id)) {
      progress[level].readingLessons.push(id);
    }
  });

  return { progress, readingTotals, listeningSummary };
};

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth();
  // WHO is signed in, not the user object: AuthContext hands out a new object
  // at every tab focus and token refresh, and each one refetched everything.
  const userId = user?.id ?? null;
  const [progress, setProgress] = useState(getInitialProgress());
  const [loading, setLoading] = useState(true);
  // Per-level totals for the persisted signals.
  // { 'b1.1': n } — reading lessons that exist per level
  const [readingTotals, setReadingTotals] = useState({});
  // { 'b1.1': { total, completed } } — listening exercises per level
  const [listeningSummary, setListeningSummary] = useState({});

  // A change of account, sign-out included, drops the previous account's
  // numbers in the same render (React's "adjust state while rendering"
  // pattern), so no screen shows account A's progress under account B or
  // after signing out. It used to reset only when a guest blob existed.
  const [shownFor, setShownFor] = useState(userId);
  if (shownFor !== userId) {
    setShownFor(userId);
    setProgress(getInitialProgress());
    setReadingTotals({});
    setListeningSummary({});
    setLoading(true);
  }

  useEffect(() => {
    // An answer that arrives after the account changed again is discarded:
    // a slow load for A must never land under B.
    let current = true;
    if (userId) {
      fetchProgress(userId)
        .then((loaded) => {
          if (!current) return;
          setListeningSummary(loaded.listeningSummary);
          setReadingTotals(loaded.readingTotals);
          setProgress(loaded.progress);
        })
        .catch((error) => console.error('Error loading progress:', error))
        .finally(() => { if (current) setLoading(false); });
    } else {
      // Load from localStorage for non-authenticated users
      const parsed = safeGetJSON('deutschmeister_progress', null);
      if (parsed) {
        // Merge with initial progress to ensure all levels exist
        setProgress({ ...getInitialProgress(), ...parsed });
      }
      setLoading(false);
    }
    return () => { current = false; };
  }, [userId]);

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
