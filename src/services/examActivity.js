// Has this learner done exam work yet — a writing submission, or a finished
// practice exam? The dashboard's first-run card reads it (src/lib/firstRun.js):
// the exam-first "Start here" card is a FIRST task, and that work writes no
// lesson row, so without this read the card offered the same writing task on
// every visit after the letter had been written and marked.
//
// Explicit .js extension so node --test can import the pure half.
import { supabase } from '../utils/supabase.js';

/**
 * The two reads ({ data, error }, as supabase-js returns them) → true as soon
 * as either holds a row; null (unknown) when a read failed and the other found
 * nothing, so a network error never decides; false only when both answered.
 */
export function examActivityFrom(writingResult, examResult) {
  const rows = (r) => (Array.isArray(r?.data) ? r.data.length : 0);
  if (rows(writingResult) + rows(examResult) > 0) return true;
  if (!writingResult || !examResult || writingResult.error || examResult.error) return null;
  return false;
}

/** One row of each is enough. Never throws: a failure is null (unknown). */
export async function fetchExamActivity(userId) {
  if (!userId) return null;
  try {
    const [writing, exams] = await Promise.all([
      supabase.from('writing_submissions').select('id').eq('user_id', userId).limit(1),
      supabase.from('exam_attempts').select('id').eq('user_id', userId).eq('status', 'completed').limit(1),
    ]);
    return examActivityFrom(writing, exams);
  } catch (err) {
    console.error('[examActivity] read failed:', err);
    return null;
  }
}
