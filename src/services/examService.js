import { supabase } from '../utils/supabase.js';

// exam_attempts data access (renovation Phase 5a) — the programProgress.js
// pattern: thin, fail-soft, every result inspected (the documented supabase-js
// gotcha: errors come back on the result, they are not thrown).
//
// The table ships behind migrations/2026-08-31-exam-attempts.sql (applied).
// If it were ever missing, every call here returns its safe default and the
// UI shows the empty/error state instead of crashing.

/** Start a new attempt. Returns the row (with id + section_deadline anchors) or null. */
export async function createAttempt(userId, examKey, firstSectionMinutes) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({
      user_id: userId,
      exam_key: examKey,
      section: 'full',
      status: 'in_progress',
      section_deadline: new Date(Date.now() + firstSectionMinutes * 60000).toISOString(),
    })
    .select()
    .single();
  if (error) {
    console.error('[examService] createAttempt:', error.message);
    return null;
  }
  return data;
}

/** The user's most recent in-progress attempt for an exam (resume target). */
export async function findResumableAttempt(userId, examKey) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('exam_key', examKey)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[examService] findResumableAttempt:', error.message);
    return null;
  }
  return data;
}

/** Load one attempt by id (RLS scopes to the owner). */
export async function loadAttempt(attemptId) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('id', attemptId)
    .maybeSingle();
  if (error) {
    console.error('[examService] loadAttempt:', error.message);
    return null;
  }
  return data;
}

/** Persist the answers map (merged server-side state is the whole map). */
export async function saveAnswers(attemptId, answers) {
  const { error } = await supabase
    .from('exam_attempts')
    .update({ answers })
    .eq('id', attemptId);
  if (error) console.error('[examService] saveAnswers:', error.message);
  return !error;
}

/** Move the timer anchor to the next section. */
export async function advanceSectionDeadline(attemptId, minutes) {
  const deadline = new Date(Date.now() + minutes * 60000).toISOString();
  const { error } = await supabase
    .from('exam_attempts')
    .update({ section_deadline: deadline })
    .eq('id', attemptId);
  if (error) console.error('[examService] advanceSectionDeadline:', error.message);
  return error ? null : deadline;
}

/** Finish an attempt with its computed result. */
export async function completeAttempt(attemptId, { answers, score, maxScore, sectionScores }) {
  const { error } = await supabase
    .from('exam_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      answers,
      score,
      max_score: maxScore,
      section_scores: sectionScores,
    })
    .eq('id', attemptId);
  if (error) console.error('[examService] completeAttempt:', error.message);
  return !error;
}

/** Completed attempts for an exam, newest first (the history list). */
export async function listAttempts(userId, examKey) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('id, started_at, completed_at, score, max_score, status')
    .eq('user_id', userId)
    .eq('exam_key', examKey)
    .order('started_at', { ascending: false })
    .limit(20);
  if (error) {
    console.error('[examService] listAttempts:', error.message);
    return [];
  }
  return data || [];
}
