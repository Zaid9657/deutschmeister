// evaluate-writing, course v2 branch: a written Aufgabe (`a21-u07-w`) or a
// written micro-output (`a21-u07-mo2`), resolved by bank key from the compiled
// banks, graded against its rubric profile, the deterministic rules applied last.
//
// Called by netlify/functions/evaluate-writing.mjs AFTER the JWT check; the
// legacy exam bank and the live A1.1/A1.2 course keys never reach this module.
// Every dependency with a side effect (Supabase, the model, the allowance) is a
// parameter, so tests/course-v2-ai.test.mjs drives the whole branch with stubs.

import { parseBankKey, levelOfPrefix, examKeyFor } from './keys.mjs';
import { bankEntry, rubricProfile, spineLabel } from './data.mjs';
import { unknownRuleIds, countWords } from './rules.mjs';
import { modelFor } from './defaults.mjs';
import { gradeSubmission, callAnthropic } from './grade.mjs';
import { checkCourseAi, recordCourseAi, useKindFor } from './courseAi.mjs';

export const V2_MAX_CHARS = 6000;
export const V2_MIN_WORDS = 2; // "did anything arrive"; the exam length rules are the rubric's, not this floor's

async function priorAttempts(supabase, userId, bankKey) {
  try {
    const { count, error } = await supabase
      .from('writing_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('task_key', bankKey);
    if (error) throw new Error(error.message);
    return count ?? 0;
  } catch (e) {
    console.error('[evaluate-writing v2] attempt count failed:', e.message);
    return 0;
  }
}

/**
 * @param {object} p
 * @param {object} p.supabase  service-role client (or a stub)
 * @param {string} p.userId    from the verified JWT
 * @param {object} p.body      { taskKey | task_key, text, exam_attempt_id? }
 * @param {object} p.headers   CORS headers
 * @param {object} [p.deps]    { callModel, checkAllowance, recordUse }
 */
export async function handleWritingV2({ supabase, userId, body, headers, deps = {} }) {
  const respond = (statusCode, payload) => ({ statusCode, headers, body: JSON.stringify(payload) });
  const bankKey = body?.taskKey ?? body?.task_key;
  const parsed = parseBankKey(bankKey);
  if (!parsed) return respond(400, { error: 'unknown task' });
  if (parsed.kind === 's') {
    return respond(400, { error: 'speaking_task', message: 'Sprechaufgaben werden über die Sprech-Funktionen ausgewertet.' });
  }

  const level = levelOfPrefix(parsed.prefix);
  const section = parsed.kind === 'w' ? 'writing' : 'micro';
  const task = bankEntry(level, section, bankKey);
  if (!task) return respond(400, { error: 'unknown task' });
  if (section === 'micro' && task.mode && task.mode !== 'written') {
    return respond(400, { error: 'spoken_micro_output', message: 'Diese Mini-Aufgabe ist mündlich.' });
  }

  const profileId = task.profile || (section === 'micro' ? 'course-micro' : null);
  const profile = rubricProfile(profileId);
  if (!profile || profile.kind !== 'writing' || unknownRuleIds(profile).length) {
    console.error('[evaluate-writing v2] rubric profile unavailable:', profileId, bankKey);
    return respond(503, { error: 'rubric_unavailable', profile: profileId || null });
  }
  if (!modelFor(profile)) {
    return respond(400, { error: 'deterministic_task', message: 'Diese Aufgabe wird direkt im Kurs geprüft.' });
  }

  const text = body?.text;
  if (typeof text !== 'string' || countWords(text) < V2_MIN_WORDS) {
    return respond(400, { error: 'text too short' });
  }
  if (text.length > V2_MAX_CHARS) return respond(400, { error: 'text too long' });

  // The allowance (access + per-slot attempts + daily cap) is the entitlement module's.
  const gate = await (deps.checkAllowance || checkCourseAi)(supabase, userId, bankKey, level);
  if (!gate.allowed) {
    return respond(gate.status || 429, {
      error: gate.error || 'limit_reached',
      reason: gate.reason || null,
      remaining: gate.remaining ?? 0,
      scope: 'course-v2',
      taskKey: bankKey,
    });
  }

  const attemptNr = (await priorAttempts(supabase, userId, bankKey)) + 1;
  const targetLabels = (Array.isArray(task.targets) ? task.targets : []).map(spineLabel).filter(Boolean);
  const graded = await gradeSubmission({
    kind: 'writing',
    profile,
    task,
    level,
    text,
    attemptNr,
    targetLabels,
    callModel: deps.callModel || callAnthropic,
  });
  if (!graded.ok) {
    return respond(200, {
      evaluation_failed: true,
      message: 'Die Auswertung konnte nicht erstellt werden. Bitte versuchen Sie es noch einmal.',
    });
  }
  const result = graded.result;
  const wordCount = countWords(text);

  // writing_submissions.total_score/max_score are integers; the exact exam-scale
  // values (7,5 of 10) live in `feedback`, which stores the whole result.
  let saved = null;
  let saveError = null;
  try {
    const res = await supabase
      .from('writing_submissions')
      .insert({
        user_id: userId,
        exam_key: examKeyFor(task, level),
        task_key: bankKey,
        exam_attempt_id: body?.exam_attempt_id || null,
        submission_text: text,
        word_count: wordCount,
        feedback: result,
        total_score: Math.round(result.total_score),
        max_score: Math.round(result.max_score),
        model: result.model,
      })
      .select('id')
      .single();
    saved = res?.data || null;
    saveError = res?.error || null;
  } catch (e) {
    saveError = e;
  }
  if (saveError) console.error('[evaluate-writing v2] save failed:', JSON.stringify(saveError.message || saveError));

  if (graded.modelCalled) {
    await (deps.recordUse || recordCourseAi)(supabase, userId, bankKey, useKindFor(parsed));
  }

  const remaining = Number.isFinite(gate.remaining) ? Math.max(0, gate.remaining - (graded.modelCalled ? 1 : 0)) : null;
  return respond(200, {
    ...result,
    word_count: wordCount,
    submission_id: saved?.id || null,
    saved: !saveError,
    scope: 'course-v2',
    taskKey: bankKey,
    level,
    remaining,
  });
}
