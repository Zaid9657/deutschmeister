import { checkAnswer, checkOptionsFor, RESULT, normalizeSpelling, spellingApplies } from './check.js';
import { spellWithSet } from './taughtSet.js';
import { introductionHit } from './pretest.js';
import { nameFromIntroduction, sayText } from './scene.js';
import { READALOUD_PASS_PCT } from './readaloud.js';
import { CURRICULUM_A11 } from '../../data/curricula/a11.js';
import { expandProofPart } from './proofFrames.js';
import { normalizeAnswer } from '../../utils/answerMatch.js';
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
    return { de: lesson.notice.bodyDe.replace(/\*\*/g, ''), en: lesson.notice.bodyEn.replace(/\*\*/g, ''), audioKey: 'notice' };
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

const bare = (text) => String(text || '').replace(/[.!?]+$/u, '').trim();

/** Use the current lesson in preference to its registry row (also supports draft validation). */
export function proofTasks(lesson, curriculum = CURRICULUM_A11) {
  const earlier = (curriculum.lektionen || []).filter((l) => l.nr < lesson.nr && l.id?.split('-')[0] === lesson.id?.split('-')[0]);
  const words = [...earlier, lesson].flatMap((l) => l.wortfeld || []);
  const courtesies = words.filter((w) => /^(?:thank you|please|excuse me)/i.test(w.en || '')).map((w) => bare(w.de));
  const greetings = words.filter((w) => /^(?:good morning|good day|good evening|hello)/i.test(w.en || '')).map((w) => bare(w.de));
  // The learner's own-name role is replaced, so it is not an address to the interlocutor.
  const ownSpeakers = (lesson.guided?.chunks || []).filter((c) => c.say?.ownName).map((c) => lesson.dialog?.lines?.[c.say.line]?.speaker);
  const addresses = [...new Set((lesson.dialog?.lines || []).map((l) => l.speaker).filter((s) => s && (/^(?:Frau|Herr)\s/u.test(s) || !ownSpeakers.includes(s))))];
  const turns = words.flatMap((w) => [w.de, w.exampleDe]).filter(Boolean).join(' ') + ' ' + [...earlier, lesson].flatMap((l) => [...(l.dialog?.lines || []).map((line) => line.de), l.guided?.read?.text, l.notice?.bodyDe, ...(l.proof?.tasks || []).map((t) => t?.promptDe)]).filter(Boolean).join(' ');
  const returns = /Und (?:Sie|du|Ihnen)\?/u.test(turns) ? [...new Set((turns.match(/\b(?:Sie|du|Ihnen)\b/g) || []).map((p) => `Und ${p}`))] : [];
  return (lesson.proof?.tasks || []).map((task, i) => ({ ...task,
    parts: task.parts?.map((part) => expandProofPart(part, task.sets)),
    ...(task.listenSpelling ? { listening: proofSpelling(lesson, task.listenFrom) } : {}),
    id: `proof-${lesson.id}-${i}`, model: proofModel(lesson, task.reteach),
    context: [...(task.context || []), ...(task.allowModelContext ? sentencesOf(proofModel(lesson, task.reteach)?.de) : [])], addresses, courtesies, greetings, returns,
  }));
}

/** Exact comma-delimited speaker addresses, at either edge; never fuzzy names. */
function withoutAddress(sentence, addresses = []) {
  let text = bare(sentence);
  for (const address of addresses) {
    const low = text.normalize('NFC').toLowerCase(), name = address.normalize('NFC').toLowerCase();
    if (low.startsWith(`${name},`)) text = text.slice(address.length + 1).trim();
    if (text.toLowerCase().endsWith(`, ${name}`)) text = text.slice(0, -address.length - 1).trim();
  }
  return text;
}

const sentencesOf = (value) => String(value || '').normalize('NFC').replace(/[“”„‟«»‹›"]/g, '')
  // Dots inside written dates/times are data, not sentence boundaries.
  .split(/(?<!\d)[.!?\n]+|[!?\n]+|\.(?!\d)/u).map((s) => s.trim()).filter(Boolean);
const checkPart = (text, task, part) => {
  text = text.replace(/\b(\d{1,2})[.:]00(?=\s+Uhr\b)/gu, '$1');
  const options = checkOptionsFor({ ...task, ...part, accepted: part.forms, answer: part.forms[0] });
  const checked = checkAnswer(text, part.forms, options);
  if (checked.result !== RESULT.WRONG) return checked;
  for (const courtesy of task.courtesies || []) if (text.toLowerCase().startsWith(`${courtesy.toLowerCase()},`) || text.toLowerCase().startsWith(`${courtesy.toLowerCase()} `)) {
    const rest = text.slice(courtesy.length).replace(/^,/, '').trim();
    const result = checkAnswer(rest, part.forms, options);
    if (result.result !== RESULT.WRONG) return result;
  }
  return checked;
};
const exact = (text, forms) => checkAnswer(text, forms || [], { choice: true }).result !== RESULT.WRONG;

/** Backtracking consumes every required part once and every non-courtesy word exactly once. */
export function judgeProof(task, value, names = {}) {
  if (task.instances?.length && !task.audioText) task = proofTaskFor(task);
  let sentences = sentencesOf(value).map((s) => withoutAddress(s, task.addresses));
  if (task.firstContact && sentences.length > 1 && exact(sentences[0], task.greetings)) sentences.shift();
  if (task.firstContact && sentences.length) for (const greeting of task.greetings || []) {
    if (sentences[0].toLowerCase().startsWith(`${greeting.toLowerCase()},`)) sentences[0] = sentences[0].slice(greeting.length + 1).trim();
  }
  if (task.ownName === 'full') sentences = sentences.filter((s) => !exact(s, task.courtesies) && !exact(s, task.returns));
  const item = proofItem(task, names, sentences.join('. '));
  if (task.listenSpelling || task.ownName || task.type === 'multiple_choice' || (task.type === 'listening' && task.mode !== 'parts')) {
    const checked = checkAnswer(task.ownName === 'full' ? sentences.join('. ') : value, item.accepted || [], checkOptionsFor(item));
    return { ...checked, part: checked.result === RESULT.WRONG ? 0 : null };
  }
  const parts = task.parts || [];
  let reached = 0;
  const walk = (at, remaining, result, actions = []) => {
    reached = Math.max(reached, parts.length - remaining.length);
    if (at === sentences.length) return remaining.length ? null : { result, part: null };
    // Try required content before free courtesies: a required Danke must still be demonstrated.
    const candidates = task.order === 'any' ? remaining : remaining.slice(0, 1);
    for (const p of candidates) {
      const part = parts[p];
      for (let end = at + 1; end <= Math.min(sentences.length, at + (part.maxSentences || 1)); end++) {
        const checked = checkPart(sentences.slice(at, end).join('. '), task, part);
        if (checked.result === RESULT.WRONG) continue;
        const action = actionOf(sentences.slice(at, end).join(' '));
        if (task.distinctActions && actions.includes(action)) continue;
        const rest = walk(end, remaining.filter((i) => i !== p), checked.result === RESULT.TYPO ? RESULT.TYPO : result, [...actions, action]);
        if (rest) return rest;
      }
    }
    if (exact(sentences[at], task.courtesies) || exact(sentences[at], task.returns) || (exact(sentences[at], task.context) && !remaining.some((i) => checkPart(sentences[at], task, parts[i]).result !== RESULT.WRONG))) return walk(at + 1, remaining, result, actions);
    return null;
  };
  const indices = parts.map((_, i) => i);
  const actionOf = (text) => {
    const words = normalizeAnswer(text).match(/\p{L}+/gu) || [];
    const ich = words.indexOf('ich');
    return ich === 0 || (ich === 1 && words[0] === 'und') ? words[ich + 1] : ich > 0 ? words[ich - 1] : words[0] === 'und' ? words[1] : words[0];
  };
  let judged = walk(0, indices, RESULT.CORRECT);
  // Phone typing often omits every mark. Word runs still go through the very same checker.
  if (!judged && sentences.length === 1 && parts.length > 1) {
    const words = sentences[0].split(/\s+/u);
    const split = (from, remaining, result, prior = [], actions = []) => {
      reached = Math.max(reached, parts.length - remaining.length);
      if (!remaining.length) return from === words.length ? { result, part: null } : null;
      for (const p of task.order === 'any' ? remaining : remaining.slice(0, 1)) for (let to = from + 1; to <= words.length; to++) {
        if (task.order === 'any' && from > 0 && to - from === 1 && words.length > parts.length && !/[,;]$/.test(words[from - 1])) continue;
        const raw = withoutAddress(words.slice(from, to).join(' ').replace(/[,;:]+$/u, ''), task.addresses);
        let text = raw;
        const opening = parts[p].ellipsisOpening;
        if (opening && /^und\s/iu.test(text) && prior.some((s) => normalizeAnswer(s).includes(normalizeAnswer(opening)))) text = `${opening} ${text.replace(/^und\s+/iu, '')}`;
        let checked = checkPart(text, task, parts[p]);
        if (checked.result === RESULT.WRONG && task.sharedTail && p === 0 && new RegExp(`\\b${task.sharedTail}e?$`, 'iu').test(sentences[0])) checked = checkPart(`${text} ${task.sharedTail}`, task, parts[p]);
        if (checked.result !== RESULT.WRONG) {
          const action = actionOf(text);
          if (task.distinctActions && actions.includes(action)) continue;
          const rest = split(to, remaining.filter((i) => i !== p), checked.result === RESULT.TYPO ? RESULT.TYPO : result, [...prior, text], [...actions, action]);
          if (rest) return rest;
        }
      }
      for (let to = from + 1; to <= words.length; to++) if (exact(withoutAddress(words.slice(from, to).join(' '), task.addresses), task.courtesies)) {
        const rest = split(to, remaining, result, prior, actions);
        if (rest) return rest;
      }
      return null;
    };
    judged = split(0, indices, RESULT.CORRECT);
  }
  return judged || { result: RESULT.WRONG, part: Math.min(reached, parts.length - 1), registerMiss: registerMiss(task, value) };
}

function registerMiss(task, value) {
  const text = normalizeAnswer(value);
  return task.register === 'formal' ? /\b(?:du|dir|dich|dein|deine|euch)\b/.test(text)
    : task.register === 'informal' && /\b(?:sie|ihnen|ihr|ihre)\b/.test(text);
}

/** Labels are authored, answers are not. A resumed hint can name all parts without saving text. */
export function proofHint(task, part, registerError = false) {
  if (!task.parts?.length) return hintFor(task);
  const labels = Number.isInteger(part) ? [task.parts[part]] : task.parts;
  const de = labels.filter(Boolean).map((p) => p.label.de).join(' / ');
  const en = labels.filter(Boolean).map((p) => p.label.en).join(' / ');
  return {
    de: `${de.charAt(0).toUpperCase() + de.slice(1)}: Das stimmt noch nicht. ${registerError ? (task.register === 'informal' ? 'Sagen Sie es mit du.' : 'Sagen Sie es höflich.') : 'Prüfen Sie diesen Teil noch einmal.'}`,
    en: `${en.charAt(0).toUpperCase() + en.slice(1)}: this is not right yet. ${registerError ? (task.register === 'informal' ? 'Use the informal form.' : 'Say it formally.') : 'Check this part again.'}`,
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
    own = introductionHit(value, openings) ? nameFromIntroduction(String(value).replace(/heisse/iu, 'heiße'), openings) : '';
  }
  if (task.ownName === 'full' && own && (!/^[\p{L}\p{M}'’ -]+$/u.test(own) || /^(?:nicht|kein|keine|ja|nein)$/iu.test(own))) own = '';
  const answer = task.ownName ? sayText({ ...task, de: task.answer }, own) : task.answer;
  return { ...task, answer, accepted: task.ownName ? (answer ? [answer] : []) : task.accepted };
}

/** Retries keep content out of snapshots: instance and order derive only from the try count. */
export function proofTaskFor(task, goal = {}) {
  const tries = goal?.tries || 0;
  const instances = task.instances;
  const selected = instances?.length ? instances[Math.floor(tries / 2) % instances.length] : {};
  const item = { ...task, ...selected };
  if (item.options?.length) {
    item.mode = 'options';
    const shift = tries % item.options.length;
    item.options = [...item.options.slice(shift), ...item.options.slice(0, shift)];
  }
  return item;
}

/**
 * How a listening goal was shown. `read-*` is the fallback for a device that cannot play German
 * (no voice in the browser, common in in-app browsers): the learner reads the stimulus instead.
 * The path is locked on the proof, so a missing voice must never lock a learner out of the course;
 * the flag keeps the record honest about what was actually shown.
 */
export const PROOF_EVIDENCE = ['heard-spelling', 'spoken-spelling', 'heard-listening', 'read-spelling', 'read-listening'];
/** Only flags and counts, never a name, typed answer, audio or transcript. */
export function packProof(raw = {}) {
  const goals = Array.isArray(raw?.goals) ? raw.goals.map((g) => {
    const tries = Number.isInteger(g?.tries) && g.tries > 0 ? g.tries : 0;
    return { tries, passed: tries > 0 && g?.passed === true, firstTry: tries === 1 && g?.passed === true && g?.firstTry === true,
      ...(PROOF_EVIDENCE.includes(g?.evidence) ? { evidence: g.evidence } : {}) };
  }) : [];
  return { goals, phase: ['hint', 'reteach'].includes(raw?.phase) ? raw.phase : 'ask' };
}
const goalPassed = (task, goal) => goal?.passed === true && (!task.listenSpelling || ['heard-spelling', 'spoken-spelling', 'read-spelling'].includes(goal.evidence)) && (task.type !== 'listening' || ['heard-listening', 'read-listening'].includes(goal.evidence));
export const proofPassed = (tasks, state) => tasks.length > 0 && tasks.every((task, i) => goalPassed(task, packProof(state).goals[i]));
export const proofPosition = (tasks, state) => tasks.findIndex((task, i) => !goalPassed(task, packProof(state).goals[i]));
export const canCompleteProofLesson = (lesson, state) => !lesson.proof || proofPassed(lesson.proof.tasks || [], state);

/** Wrong → answer-free hint → second try → model → hidden model and same task. No skip event. */
export function answerProof(tasks, raw, response, names = {}) {
  const state = packProof(raw);
  const at = proofPosition(tasks, state);
  if (at < 0 || state.phase === 'reteach') return state;
  const current = proofTaskFor(tasks[at], state.goals[at]);
  const task = proofItem(current, names, response?.value);
  let right = false;
  if (response?.kind === 'typed') {
    // Heard, or read because this device could not play it. Neither: not an answer, no try spent.
    if ((task.listenSpelling || task.type === 'listening') && response.listened !== true && response.readInstead !== true) return state;
    right = judgeProof(current, response.value, names).result !== RESULT.WRONG;
  } else if (response?.kind === 'mic' && task.type !== 'listening' && !task.micOff && (task.listenSpelling ? task.spokenAnswer : task.answer) && !tasks[at].options) {
    const r = response.result;
    right = !!r && r.usedMic === true && r.selfConfirmed !== true && Number.isFinite(r.pct) && r.pct >= READALOUD_PASS_PCT && r.pct <= 1;
    // An unavailable/unsure scorer is not an answer: type instead, without spending a try.
    if (!r || r.selfConfirmed || r.unsure === true || !r.usedMic || !Number.isFinite(r.pct)) return state;
  } else return state;
  // A pre-change typed-name pass is not evidence for the new spelling task.
  const prev = (task.listenSpelling || task.type === 'listening') && !state.goals[at]?.evidence ? { tries: 0 } : state.goals[at] || { tries: 0 };
  const tries = prev.tries + 1;
  state.goals[at] = { tries, passed: right, firstTry: right && tries === 1,
    ...(task.listenSpelling ? { evidence: response.kind !== 'typed' ? 'spoken-spelling' : response.listened === true ? 'heard-spelling' : 'read-spelling' }
      : task.type === 'listening' ? { evidence: response.listened === true ? 'heard-listening' : 'read-listening' } : {}) };
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
