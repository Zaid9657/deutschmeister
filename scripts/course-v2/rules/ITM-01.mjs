// ITM-01 — the answer follows from the German prompt: every quality.js exclusion reason and
// repair predicate (src/data/lessonPools/quality.js), applied to the item in its compiled pool
// shape (SCHEMA §3.1), plus the v2 shape checks that make a task answerable at all.
//
// quality.js was written for the live A1.1 pool (typed gaps and MC practice). Two predicates are
// about TYPED answers and are not applied to choice items, whose options carry the answer space
// (a key visible among options is SOL-03's text-blind probe, not a deterministic rule): answer
// in prompt, negation without cue. A sentence-building item whose tiles are exactly the words of
// its answer is determined by its tiles, so the thin-cue-list reason (meta-prompt) does not apply.
// The level-scoped reasons (ordinal, month, untaught form) encode the LIVE A1.1 syllabus; the v2
// ceiling is GRM-04/LEX-03, so they are not applied.

import { walkItems } from '../lib-validate/walk.mjs';
import { norm, tokens } from '../lib-validate/text.mjs';
import { compiledItem, CHOICE_TYPES, arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'ITM-01';
export const title = 'The answer follows from the German prompt (quality.js reasons + v2 task shape)';
export const type = 'hard';
export const scope = 'unit';

let Q = null;
let qError = null;
try {
  Q = await import('../../../src/data/lessonPools/quality.js');
} catch (e) {
  qError = e.message;
}

const tileWords = (item) => arr(item.tiles).flatMap((t) => tokens(t).map((x) => x.lower)).sort().join(' ');
const answerWords = (s) => tokens(s).map((x) => x.lower).sort().join(' ');
const EXACTNESS_RE = /\b(?:jede|jeder|jedes)\s+(?:Ziffer|Buchstabe|Zahl|Zeichen|Stelle)\b/i;

/** The quality.js predicates in exclusionReason's order: [reason, applies(item, compiled) → bool]. */
function predicates() {
  if (!Q) return [];
  const R = Q.REASON || {};
  const list = [];
  const add = (reason, fn) => { if (reason && typeof fn === 'function') list.push([reason, fn]); };
  add(R.ENGLISH_RESPELLING, (it, c) => {
    const all = [c.questionDe, c.answer, ...arr(c.accepted), ...arr(c.options)].join(' · ');
    return (Q.SOUNDS_LIKE_RE && Q.SOUNDS_LIKE_RE.test(c.questionDe)) || (Q.RESPELLING_RE && Q.RESPELLING_RE.test(all));
  });
  add(R.ENGLISH_PROMPT, (it, c) => Q.hasEnglish && Q.hasEnglish(c.questionDe));
  add(R.ENGLISH_ANSWER, (it, c) => Q.hasEnglish && [c.answer, ...arr(c.accepted), ...arr(c.options)].some((x) => Q.hasEnglish(x)));
  add(R.NEGATION_WITHOUT_CUE, (it, c) => !CHOICE_TYPES.has(it.type) && Q.NEGATION_ANSWER_RE && Q.NEGATION_CUE_RE
    && Q.NEGATION_ANSWER_RE.test([c.answer, ...arr(c.accepted)].join(' ')) && !Q.NEGATION_CUE_RE.test(c.questionDe));
  add(R.ANSWER_IN_PROMPT, (it, c) => !CHOICE_TYPES.has(it.type) && Q.answerInPrompt && Q.answerInPrompt(c));
  add(R.META_PROMPT, (it, c) => {
    if (it.type === 'sentence_building' && arr(it.tiles).length && tileWords(it) === answerWords(it.answer)) return false;
    return Q.isMetaPrompt && Q.isMetaPrompt(c);
  });
  add(R.VERB_CUE_ONLY_IN_GLOSS, (it, c) => Q.verbCueOnlyInGloss && Q.verbCueOnlyInGloss(c));
  add(R.STATEMENT_NO_TASK, (it, c) => Q.statementNoTask && Q.statementNoTask(c));
  add(R.ARTICLE_CUE_ONLY_IN_GLOSS, (it, c) => Q.articleCueOnlyInGloss && Q.articleCueOnlyInGloss(c));
  add(R.CUE_ANSWER_MISMATCH, (it, c) => Q.cueAnswerMismatch && Q.cueAnswerMismatch(c));
  add(R.METALINGUISTIC_PROMPT, (it, c) => Q.metalinguisticPrompt && Q.metalinguisticPrompt(c));
  add(R.AMBIGUOUS_CORRECTION, (it, c) => Q.ambiguousCorrection && Q.ambiguousCorrection(c));
  add(R.UNCONDITIONED_RULE, (it, c) => Q.unconditionedRule && Q.unconditionedRule(c));
  add(R.AMBIGUOUS_AGREEMENT, (it, c) => Q.agreementAmbiguity && Q.agreementAmbiguity(c));
  add(R.AMBIGUOUS_GENDER_PAIR, (it, c) => Q.genderPairAmbiguity && Q.genderPairAmbiguity(c, {}));
  return list;
}

export function run({ docs }) {
  const findings = [];
  const notes = [];
  if (!Q) notes.push(`quality.js not importable (${qError}); only the v2 task-shape checks ran`);
  const preds = predicates();
  let n = 0;
  for (const doc of docs) {
    for (const { item, path, where, block } of walkItems(doc)) {
      if (!isObj(item)) continue;
      n += 1;
      const id = item.id;
      const prompt = String(item.promptDe || '');
      // v2 task shape: the German prompt carries the task
      if (!prompt.trim()) findings.push(blocker(doc, `${path}.promptDe`, 'no German prompt', id));
      else if (item.promptEn && norm(item.promptEn) === norm(prompt)) findings.push(blocker(doc, `${path}.promptDe`, 'the German prompt repeats the English gloss', id));
      if (item.type === 'fill_blank' && !/_{2,}|…/.test(prompt)) findings.push(blocker(doc, `${path}.promptDe`, 'typed gap item without a gap (___) in its German prompt', id));
      if (item.type === 'error_correction') {
        if (!/[„"“‚].+[“"”‘]/.test(prompt)) findings.push(blocker(doc, `${path}.promptDe`, 'error correction without the quoted sentence to correct', id));
        if (!item.intentionalError) findings.push(blocker(doc, `${path}.intentionalError`, 'error-correction source sentence not marked intentionalError', id));
      }
      if (item.type === 'sentence_building' && arr(item.tiles).length < 2) findings.push(blocker(doc, `${path}.tiles`, 'sentence building without its tiles', id));
      if (item.type === 'dictation' && !item.audioLineRef) findings.push(blocker(doc, `${path}.audioLineRef`, 'dictation without the line it dictates (audioLineRef)', id));
      if (where === 'exam' && !item.textRef && arr(block?.texts).length > 1) findings.push(blocker(doc, `${path}.textRef`, 'exam item of a multi-text block without textRef', id));
      if (where === 'exam' && item.textRef && !arr(block?.texts).some((t) => t?.id === item.textRef)) findings.push(blocker(doc, `${path}.textRef`, `textRef "${item.textRef}" is not a text of its block`, id));
      if (CHOICE_TYPES.has(item.type) && !arr(item.options).length && item.type !== 'zuordnen' && item.type !== 'match') {
        findings.push(blocker(doc, `${path}.options`, `${item.type} item without options`, id));
      }
      // quality.js
      const c = compiledItem(item);
      for (const [reason, applies] of preds) {
        let hit = false;
        try {
          hit = Boolean(applies(item, c));
        } catch {
          hit = false;
        }
        if (!hit) continue;
        if (reason === Q.REASON.UNCONDITIONED_RULE) {
          const s = Q.unconditionedRuleSentence ? Q.unconditionedRuleSentence(c) : null;
          if (s && EXACTNESS_RE.test(s.sentence)) {
            findings.push(advisory(doc, `${path}.explanation`, `quality.js unconditioned-rule on an exactness statement („${s.sentence}") — a statement about the checker, not a grammar rule`, id));
            continue;
          }
          findings.push(blocker(doc, `${path}.explanation`, `quality.js ${reason}${s ? `: „${s.sentence}"` : ''}`, id));
          continue;
        }
        findings.push(blocker(doc, path, `quality.js ${reason}`, id));
      }
    }
  }
  return n ? { findings, notes } : { findings, skipped: 'no authored items in the target yet' };
}
