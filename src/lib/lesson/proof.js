import { checkAnswer, checkOptionsFor, RESULT, normalizeSpelling, spellingApplies } from './check.js';
import { spellWithSet } from './taughtSet.js';
import { introductionHit } from './pretest.js';
import { nameFromIntroduction, sayText } from './scene.js';
import { READALOUD_PASS_PCT } from './readaloud.js';
import { hintFor } from './guidedFeedback.js';

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

/** Only a spelled name from taught dialogue/cast, never a second handwritten answer key. */
export function proofSpelling(lesson, pointer) {
  if (pointer?.kind !== 'dialog' || !Number.isInteger(pointer.index)) return null;
  const line = lesson.dialog?.lines?.[pointer.index]?.de;
  const alphabet = lesson.guided?.sets?.find((set) => set.kind === 'letters');
  if (!line || !alphabet || !spellingApplies([line])) return null;
  const answer = normalizeSpelling(line.replace(/[.!?]+$/, ''));
  const known = [...(lesson.dialog?.lines || []).map((l) => l.de), ...(lesson.dialog?.lines || []).map((l) => l.speaker)];
  if (!known.some((text) => text.toLocaleLowerCase('de').includes(answer.toLocaleLowerCase('de')))) return null;
  return { answer, accepted: [answer], text: spellWithSet(answer, alphabet), alphabet, audioKey: `proof-spelling-${pointer.index}` };
}

export const proofTasks = (lesson) => (lesson.proof?.tasks || []).map((task, i) => ({ ...task, ...(task.listenSpelling ? { listening: proofSpelling(lesson, task.listenFrom) } : {}), id: `proof-${lesson.id}-${i}`, model: proofModel(lesson, task.reteach),
  addresses: [...new Set((lesson.dialog?.lines || []).map((l) => l.speaker).filter((s) => /^(?:Frau|Herr)\s+\p{L}/u.test(s || '')))],
  courtesies: (lesson.wortfeld || []).map((w) => w.de).filter((s) => ['Danke', 'Bitte', 'Entschuldigung'].includes(s)),
}));

/** Only a complete, comma-delimited titled speaker address can be removed. No fuzzy name match. */
function withoutAddress(sentence, addresses = []) {
  const text = sentence.trim().replace(/[.!?]+$/, '').trim();
  const comma = text.lastIndexOf(',');
  if (comma < 0) return text;
  const address = text.slice(comma + 1).trim().normalize('NFC').toLowerCase();
  return addresses.some((s) => s.normalize('NFC').toLowerCase() === address) ? text.slice(0, comma).trim() : text;
}

/**
 * Phone typing and speech transcripts often carry no sentence marks („Guten Tag auf Wiedersehen“).
 * Then consecutive runs of words may fulfil the parts in order, with every word used; each run is
 * still judged by the common checker, so register and spelling count exactly as with marks.
 */
function runsForParts(text, parts, fulfils) {
  const words = text.split(/\s+/u).filter(Boolean);
  let reached = 0;
  const walk = (from, at) => {
    reached = Math.max(reached, at);
    if (at === parts.length) return from === words.length ? [] : null;
    for (let to = from + 1; to <= words.length; to++) {
      const run = words.slice(from, to).join(' ').replace(/[,;:]+$/u, '');
      if (!fulfils(run, parts[at])) continue;
      const rest = walk(to, at + 1);
      if (rest) return [run, ...rest];
    }
    return null;
  };
  return { runs: walk(0, 0), reached: Math.min(reached, parts.length - 1) };
}

/** Sentences consume parts in order. Only taught courtesy sentences may consume no part. */
export function judgeProof(task, value, names = {}) {
  const item = proofItem(task, names, value);
  if (task.listenSpelling || task.ownName || task.type === 'multiple_choice') {
    const checked = checkAnswer(value, item.accepted || [], checkOptionsFor(item));
    return { ...checked, part: checked.result === RESULT.WRONG ? 0 : null };
  }
  const parts = task.parts || [];
  // The common checker folds quotation marks; they must not become an extra sentence here.
  let sentences = String(value || '').normalize('NFC').replace(/[“”„‟«»‹›"]/g, '').split(/[.!?\n]+/u).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1 && sentences.length === 1) {
    const fulfils = (run, part) => checkAnswer(withoutAddress(run, task.addresses), part.forms, checkOptionsFor({ ...task, ...part, accepted: part.forms, answer: part.forms[0] })).result !== RESULT.WRONG;
    const { runs, reached } = runsForParts(sentences[0], parts, fulfils);
    // No full reading: name the first part the words did not reach, so the hint points at it.
    if (!runs) return { result: RESULT.WRONG, part: reached };
    sentences = runs;
  }
  let at = 0, result = RESULT.CORRECT;
  for (const sentence of sentences) {
    const text = withoutAddress(sentence, task.addresses);
    const part = parts[at];
    const checked = part && checkAnswer(text, part.forms, checkOptionsFor({ ...task, ...part, accepted: part.forms, answer: part.forms[0] }));
    if (checked && checked.result !== RESULT.WRONG) {
      at++;
      if (checked.result === RESULT.TYPO) result = RESULT.TYPO;
    } else if (checkAnswer(text, task.courtesies || [], { choice: true }).result === RESULT.WRONG) {
      return { result: RESULT.WRONG, part: Math.min(at, parts.length - 1) };
    }
  }
  return at === parts.length && at > 0 ? { result, part: null } : { result: RESULT.WRONG, part: at };
}

/** Labels are authored, answers are not. A resumed hint can name all parts without saving text. */
export function proofHint(task, part) {
  if (!task.parts?.length) return hintFor(task);
  const labels = Number.isInteger(part) ? [task.parts[part]] : task.parts;
  const de = labels.filter(Boolean).map((p) => p.label.de).join(' / ');
  const en = labels.filter(Boolean).map((p) => p.label.en).join(' / ');
  return {
    de: `${de.charAt(0).toUpperCase() + de.slice(1)}: Das stimmt noch nicht. ${task.register === 'formal' ? 'Sagen Sie es höflich.' : 'Prüfen Sie diesen Teil noch einmal.'}`,
    en: `${en.charAt(0).toUpperCase() + en.slice(1)}: this is not right yet. ${task.register === 'formal' ? 'Say it formally.' : 'Check this part again.'}`,
  };
}

/** Names are adapted exactly as in the scene; an introduction also reuses the pretest helper. */
export function proofItem(task, names = {}, value) {
  if (task.listenSpelling) {
    const own = String(names.surname || '').trim();
    const alphabet = task.listening?.alphabet;
    const letters = [...own.normalize('NFC')].filter((c) => /\p{L}/u.test(c));
    const supported = alphabet && letters.length && letters.every((c) => alphabet.members.some((m) => m.written.toLocaleLowerCase('de') === c.toLocaleLowerCase('de')));
    return { ...task, answer: task.listening?.answer, accepted: task.listening?.accepted || [],
      spokenAnswer: supported ? spellWithSet(own, alphabet) : null };
  }
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
    return { tries, passed: tries > 0 && g?.passed === true, firstTry: tries === 1 && g?.passed === true && g?.firstTry === true,
      ...(['heard-spelling', 'spoken-spelling'].includes(g?.evidence) ? { evidence: g.evidence } : {}) };
  }) : [];
  return { goals, phase: ['hint', 'reteach'].includes(raw?.phase) ? raw.phase : 'ask' };
}
const goalPassed = (task, goal) => goal?.passed === true && (!task.listenSpelling || ['heard-spelling', 'spoken-spelling'].includes(goal.evidence));
export const proofPassed = (tasks, state) => tasks.length > 0 && tasks.every((task, i) => goalPassed(task, packProof(state).goals[i]));
export const proofPosition = (tasks, state) => tasks.findIndex((task, i) => !goalPassed(task, packProof(state).goals[i]));
export const canCompleteProofLesson = (lesson, state) => !lesson.proof || proofPassed(lesson.proof.tasks || [], state);

/** Wrong → answer-free hint → second try → model → hidden model and same task. No skip event. */
export function answerProof(tasks, raw, response, names = {}) {
  const state = packProof(raw);
  const at = proofPosition(tasks, state);
  if (at < 0 || state.phase === 'reteach') return state;
  const task = proofItem(tasks[at], names, response?.value);
  let right = false;
  if (response?.kind === 'typed') {
    if (task.listenSpelling && response.listened !== true) return state;
    right = judgeProof(tasks[at], response.value, names).result !== RESULT.WRONG;
  } else if (response?.kind === 'mic' && (task.listenSpelling ? task.spokenAnswer : task.answer) && !tasks[at].options) {
    const r = response.result;
    right = !!r && r.usedMic === true && r.selfConfirmed !== true && Number.isFinite(r.pct) && r.pct >= READALOUD_PASS_PCT && r.pct <= 1;
    // An unavailable/unsure scorer is not an answer: type instead, without spending a try.
    if (!r || r.selfConfirmed || r.unsure === true || !r.usedMic || !Number.isFinite(r.pct)) return state;
  } else return state;
  // A pre-change typed-name pass is not evidence for the new spelling task.
  const prev = task.listenSpelling && !state.goals[at]?.evidence ? { tries: 0 } : state.goals[at] || { tries: 0 };
  const tries = prev.tries + 1;
  state.goals[at] = { tries, passed: right, firstTry: right && tries === 1,
    ...(task.listenSpelling ? { evidence: response.kind === 'typed' ? 'heard-spelling' : 'spoken-spelling' } : {}) };
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
