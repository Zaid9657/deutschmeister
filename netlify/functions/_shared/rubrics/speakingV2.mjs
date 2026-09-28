// evaluate-speaking, course v2 branch: grade a stored speaking session that was
// started from a bank key, against the task's speaking rubric profile — for a
// multi-Teil round, each part against its own profile, summed, with the score per
// Teil under `parts` — with the deterministic zero/cap rules applied after the
// model (EXM-08).
//
// Called by netlify/functions/evaluate-speaking.mjs after the JWT check, the
// daily evaluation cap and the load of the SERVER-STORED transcript. The session
// start was the attempt (speaking-session records the allowance use), so this
// branch spends no further allowance — but it grades a session only once, so
// re-evaluating is not a way around the per-slot attempts.

import { rubricProfile, spineLabel } from './data.mjs';
import { unknownRuleIds } from './rules.mjs';
import { gradeSpeakingTask, callAnthropic } from './grade.mjs';
import { loadV2SpeakingTask, speakingProfileIds } from '../speakingAI.mjs';
import { dbLevel } from './keys.mjs';

/**
 * @param {object} p
 * @param {object} p.supabase       service-role client (or a stub)
 * @param {string} p.userId         from the verified JWT
 * @param {string} p.sessionToken
 * @param {object} p.sessionRow     { level, evaluated, scenario, … } of that session
 * @param {string} p.courseTaskKey  the key read from the session row
 * @param {string} [p.requestedKey] a key the client sent — must match the session's
 * @param {Array}  p.transcript     stored speaking_messages [{ role, content }]
 * @param {object} p.headers
 * @param {object} [p.deps]         { callModel }
 */
export async function evaluateSpeakingV2({ supabase, userId, sessionToken, sessionRow, courseTaskKey, requestedKey, transcript, headers, deps = {} }) {
  const respond = (statusCode, payload) => ({ statusCode, headers, body: JSON.stringify(payload) });

  if (requestedKey && requestedKey !== courseTaskKey) return respond(409, { error: 'task_mismatch' });
  if (sessionRow?.evaluated === true) return respond(409, { error: 'already_evaluated' });

  const loaded = loadV2SpeakingTask(courseTaskKey);
  if (!loaded) return respond(410, { error: 'task_unavailable' });
  const { level, task } = loaded;
  // Every part of a round is graded on its OWN profile (sd1.sp1 on sd1-sp1, sd1.sp2 on
  // sd1-sp2 …); one missing or broken profile refuses the whole evaluation.
  const profileIds = speakingProfileIds(task);
  const profiles = profileIds.map((id) => rubricProfile(id));
  const bad = profiles.findIndex((p) => !p || p.kind !== 'speaking' || unknownRuleIds(p).length);
  if (bad >= 0) {
    console.error('[evaluate-speaking v2] rubric profile unavailable:', profileIds[bad], courseTaskKey);
    return respond(503, { error: 'rubric_unavailable', profile: profileIds[bad] || null });
  }

  const turns = transcript.filter((m) => m.role === 'user' && typeof m.content === 'string' && m.content.trim());
  if (!turns.length) return respond(400, { error: 'no_learner_turns' });

  const graded = await gradeSpeakingTask({
    task,
    profiles,
    level,
    text: turns.map((m) => m.content).join('\n'),
    transcript,
    targetLabels: task.targets.map(spineLabel).filter(Boolean),
    callModel: deps.callModel || callAnthropic,
  });
  if (!graded.ok) {
    return respond(200, {
      evaluation_failed: true,
      message: 'Die Auswertung konnte nicht erstellt werden. Bitte versuchen Sie es noch einmal.',
    });
  }
  const result = graded.result;

  // speaking_evaluations keeps its 0–100 columns for the existing dashboards
  // (a share of the exam-scale maximum, never shown to the learner as a bare
  // percentage); the exam-scale result lives whole in `scores`.
  const pct = result.max_score > 0 ? Math.round((result.total_score / result.max_score) * 100) : 0;
  let savedEval = null;
  let saveError = null;
  try {
    const res = await supabase
      .from('speaking_evaluations')
      .insert({
        user_id: userId,
        session_id: sessionToken,
        session_token: sessionToken,
        level: sessionRow?.level || dbLevel(level),
        score: pct,
        total_score: pct,
        pronunciation_score: null,
        grammar_score: null,
        vocabulary_score: null,
        fluency_score: null,
        comprehension_score: null,
        scores: result,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
        recommendation: null,
        message_count: transcript.length,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    savedEval = res?.data || null;
    saveError = res?.error || null;
  } catch (e) {
    saveError = e;
  }
  if (saveError) console.error('[evaluate-speaking v2] save failed:', JSON.stringify(saveError.message || saveError));

  try {
    const { error } = await supabase
      .from('speaking_sessions')
      .update({ evaluated: true, passed: null })
      .eq('session_token', sessionToken)
      .eq('user_id', userId);
    if (error) console.error('[evaluate-speaking v2] session update failed:', JSON.stringify(error));
  } catch (e) {
    console.error('[evaluate-speaking v2] session update threw:', e.message);
  }

  return respond(200, {
    ...result,
    passed: null, // practice results never say "bestanden" (BLUEPRINT §1.6 rule 9)
    evaluation_id: savedEval?.id || null,
    saved: !saveError,
    scope: 'course-v2',
    courseTaskKey,
    level,
  });
}
