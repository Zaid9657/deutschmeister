import { checkAnswer, checkOptionsFor, RESULT } from './check.js';
import { introductionHit } from './pretest.js';
import { nameFromIntroduction, sayText } from './scene.js';
import { READALOUD_PASS_PCT } from './readaloud.js';

/** One resolver for rendering and validation. No copied model text in proof data. */
export function proofModel(lesson, pointer) {
  if (pointer?.kind === 'dialog' && Array.isArray(pointer.indices) && pointer.indices.length) {
    const lines = pointer.indices.map((i) => Number.isInteger(i) ? lesson.dialog?.lines?.[i] : null);
    return lines.every((l) => l?.de && l?.en) ? { de: lines.map((l) => l.de).join(' '), en: lines.map((l) => l.en).join(' '), lines: lines.map((l, i) => ({ ...l, audioKey: `line-${pointer.indices[i]}` })) } : null;
  }
  if (pointer?.kind === 'wortfeld' && Number.isInteger(pointer.index)) {
    const w = lesson.wortfeld?.[pointer.index];
    return w?.de && w?.en ? { de: w.de, en: w.en, audioKey: `word-${pointer.index}` } : null;
  }
  if (pointer?.kind === 'notice' && lesson.notice?.bodyDe && lesson.notice?.bodyEn) {
    return { de: lesson.notice.bodyDe, en: lesson.notice.bodyEn, audioKey: 'notice' };
  }
  return null;
}

export const proofTasks = (lesson) => (lesson.proof?.tasks || []).map((task, i) => ({ ...task, id: `proof-${lesson.id}-${i}`, model: proofModel(lesson, task.reteach) }));

/** Names are adapted exactly as in the scene; an introduction also reuses the pretest helper. */
export function proofItem(task, names = {}, value) {
  let own = names[task.ownName];
  if (task.ownName === 'full' && value !== undefined) {
    const openings = task.openings || ['Ich heiße'];
    own = introductionHit(value, openings) ? nameFromIntroduction(value, openings) : '';
  }
  const answer = task.ownName ? sayText({ ...task, de: task.answer }, own) : task.answer;
  return { ...task, answer, accepted: task.ownName ? (answer ? [answer] : []) : task.accepted };
}

/** Only flags and counts, never a name, typed answer, audio or transcript. */
export function packProof(raw = {}) {
  const goals = Array.isArray(raw?.goals) ? raw.goals.map((g) => {
    const tries = Number.isInteger(g?.tries) && g.tries > 0 ? g.tries : 0;
    return { tries, passed: tries > 0 && g?.passed === true, firstTry: tries === 1 && g?.passed === true && g?.firstTry === true };
  }) : [];
  return { goals, phase: ['hint', 'reteach'].includes(raw?.phase) ? raw.phase : 'ask' };
}
export const proofPassed = (tasks, state) => tasks.length > 0 && tasks.every((_, i) => packProof(state).goals[i]?.passed === true);
export const proofPosition = (tasks, state) => tasks.findIndex((_, i) => !packProof(state).goals[i]?.passed);
export const canCompleteProofLesson = (lesson, state) => !lesson.proof || proofPassed(lesson.proof.tasks || [], state);

/** Wrong → answer-free hint → second try → model → hidden model and same task. No skip event. */
export function answerProof(tasks, raw, response, names = {}) {
  const state = packProof(raw);
  const at = proofPosition(tasks, state);
  if (at < 0 || state.phase === 'reteach') return state;
  const task = proofItem(tasks[at], names, response?.value);
  let right = false;
  if (response?.kind === 'typed') {
    right = !!task.accepted?.length && checkAnswer(response.value, task.accepted, checkOptionsFor(task)).result !== RESULT.WRONG;
  } else if (response?.kind === 'mic' && task.answer && !tasks[at].options) {
    const r = response.result;
    right = !!r && r.usedMic === true && r.selfConfirmed !== true && Number.isFinite(r.pct) && r.pct >= READALOUD_PASS_PCT && r.pct <= 1;
    // An unavailable/unsure scorer is not an answer: type instead, without spending a try.
    if (!r || r.selfConfirmed || r.unsure === true || !r.usedMic || !Number.isFinite(r.pct)) return state;
  } else return state;
  const prev = state.goals[at] || { tries: 0 };
  const tries = prev.tries + 1;
  state.goals[at] = { tries, passed: right, firstTry: right && tries === 1 };
  state.phase = right ? 'ask' : state.phase === 'hint' ? 'reteach' : 'hint';
  return state;
}
export const hideProofModel = (state) => ({ ...packProof(state), phase: 'ask' });

/** A saved index never skips an unpassed proof; an already passed proof stays passed on Back. */
export function proofResumeIndex(stages, index, state) {
  const at = stages.findIndex((s) => s.kind === 'proof');
  return at >= 0 && index > at && !proofPassed(stages[at].tasks, state) ? at : index;
}
export const proofAttempts = (tasks, state) => tasks.map((task, i) => ({ itemId: task.id, stage: 'proof', correct: state.goals[i]?.firstTry === true, errorTag: state.goals[i]?.firstTry ? null : 'proof-help' }));
