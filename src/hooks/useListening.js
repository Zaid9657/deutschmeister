import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { withTimeout } from '../utils/withTimeout';
import { LEVEL_ORDER } from '../config/levels';


export function useListeningLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const { user } = useAuth();
  const retry = useCallback(() => { setLoading(true); setError(null); setAttempt((a) => a + 1); }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchLevels() {
      try {
        const { data: exercises, error: exError } = await withTimeout(
          supabase
            .from('listening_exercises')
            .select('id, level, exercise_number')
            .order('level')
            .order('exercise_number')
        );
        if (exError) throw exError;

        let progressMap = {};
        if (user) {
          const { data: progress } = await supabase
            .from('user_listening_progress')
            .select('exercise_id, completed, score')
            .eq('user_id', user.id);
          progress?.forEach((p) => { progressMap[p.exercise_id] = p; });
        }

        const levelData = {};
        LEVEL_ORDER.forEach((level) => {
          levelData[level] = { level, totalExercises: 0, completedExercises: 0 };
        });

        exercises?.forEach((ex) => {
          if (levelData[ex.level]) {
            levelData[ex.level].totalExercises++;
            if (progressMap[ex.id]?.completed) levelData[ex.level].completedExercises++;
          }
        });

        if (!cancelled) setLevels(Object.values(levelData));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLevels();
    return () => { cancelled = true; };
  }, [user, attempt]);

  return { levels, loading, error, retry };
}

export function useLevelExercises(level) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const { user } = useAuth();
  const retry = useCallback(() => { setLoading(true); setError(null); setAttempt((a) => a + 1); }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchExercises() {
      try {
        const { data: exerciseData, error: exError } = await withTimeout(
          supabase
            .from('listening_exercises')
            .select('*')
            .ilike('level', level)
            .order('exercise_number')
        );
        if (exError) throw exError;

        let progressMap = {};
        if (user && exerciseData?.length) {
          const { data: progress } = await supabase
            .from('user_listening_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('exercise_id', exerciseData.map((e) => e.id));
          progress?.forEach((p) => { progressMap[p.exercise_id] = p; });
        }

        if (!cancelled) {
          setExercises(
            (exerciseData || []).map((ex) => ({ ...ex, progress: progressMap[ex.id] || null }))
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (level) fetchExercises();
    return () => { cancelled = true; };
  }, [level, user, attempt]);

  return { exercises, loading, error, retry };
}

export function useExerciseDetails(level, exerciseNumber) {
  const [exercise, setExercise] = useState(null);
  const [dialogues, setDialogues] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { setLoading(true); setError(null); setAttempt((a) => a + 1); }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchDetails() {
      try {
        const { data: exerciseData, error: exError } = await withTimeout(
          supabase
            .from('listening_exercises')
            .select('*')
            .ilike('level', level)
            .eq('exercise_number', parseInt(exerciseNumber))
            .single()
        );
        if (exError) throw exError;

        const [dialogueRes, questionRes] = await Promise.all([
          supabase.from('listening_dialogues').select('*').eq('exercise_id', exerciseData.id).order('dialogue_number'),
          supabase.from('listening_questions').select('*').eq('exercise_id', exerciseData.id).order('question_number'),
        ]);

        if (!cancelled) {
          setExercise(exerciseData);
          setDialogues(dialogueRes.data || []);
          setQuestions(questionRes.data || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (level && exerciseNumber) fetchDetails();
    return () => { cancelled = true; };
  }, [level, exerciseNumber, attempt]);

  return { exercise, dialogues, questions, loading, error, retry };
}

export function useSaveProgress() {
  const { user } = useAuth();

  const saveProgress = async (exerciseId, score, answers, playsUsed) => {
    if (!user) return { success: false };
    const { error } = await supabase
      .from('user_listening_progress')
      .upsert(
        {
          user_id: user.id,
          exercise_id: exerciseId,
          completed: true,
          score,
          answers,
          plays_used: playsUsed,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,exercise_id' }
      );
    return { success: !error, error };
  };

  return { saveProgress };
}
