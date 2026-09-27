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
// ceiling is GRM-04/LEX-03, so they are not applied. An item that answers from its block's choice
// set (zuordnen, insert, word-bank cloze: the answer is a KEY, SCHEMA §3.6) has no German answer
// form, and its promptDe is a situation or „Lücke N" whose task is the block instruction; only the
// language-of-prompt reasons apply to it (the fit of each key is SOL-02's, not a string rule).
//
// Rail extensions (rule-smith 2026-09-27; every one a class the u04 reviews found on ≥ 2 rounds or
// levels — the German prompt, not promptEn, must decide the key):
//   - a practice, Check or proof choice item whose key (or its digits) stands verbatim in the stem
//     while no distractor does gives itself away (a1.1-u04 r1 F06; input and structured-input items
//     quote their line on purpose);
//   - a cue promptEn names — „the polite form of können", „(können)", „as a word", „starts with …" —
//     stands in promptDe too (a1.2-u04 r1 F08, b2.2-u04 r1 F12);
//   - a typed gap whose key is an ordinal word says „Wort" in promptDe, accepts the digit form, or
//     carries exact: "number" (the checker then accepts „4." for „vierte") (a1.2-u04 r1 F10);
//   - a typed gap without options whose key is a noun, an adjective, or a sentence adverb at the
//     start of the sentence carries a German cue — a bracketed base form or choice, „= …", „→", the
//     first letters — because another word of the same class fits the frame (b1.1-u04 r1 F05 / r2 F01,
//     b1.2-u04 r1 F12, b2.2-u04 r1 F12, a2.1-u04 r1). A sentence adverb at the start blocks („___ habe
//     ich keine Antwort bekommen." → Trotzdem, Leider, Noch …); an open noun or adjective gap is an
//     ADVISORY — the sentence around it may decide it („Die Leitung ist ___. Bitte rufen Sie später
//     an." → besetzt, SCHEMA §15), which only a reader or the solver gate can judge;
//   - a first-letter cue with underscores shows exactly the missing letters (b2.2-u04 r1 F12);
//   - a typed gap whose key begins with a preposition has that preposition in promptDe
//     (a2.2-u04 r2 F04: „Emre wartet ___ Brücke" → „an der", „auf der", „vor der" all fit).

import { walkItems } from '../lib-validate/walk.mjs';
import { norm, tokens } from '../lib-validate/text.mjs';
import { compiledItem, CHOICE_TYPES, arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';
import { cumulativeLexicon } from '../lib-validate/context.mjs';
import { entryForms } from '../lib-validate/lexicon.mjs';
import { SENTENCE_ADVERBS } from '../lib-validate/orders.mjs';

const { ordinalValue } = await import('../../../src/lib/lesson/check.js');

export const id = 'ITM-01';
export const title = 'The answer follows from the German prompt (quality.js reasons + v2 task shape)';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

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

const PREPOSITIONS = new Set('an am ans auf aufs aus bei beim bis durch für gegen gegenüber hinter in im ins mit nach neben ohne seit über um unter von vom vor zu zum zur zwischen trotz wegen während'.split(' '));
/** A German cue in a prompt: a bracket, „= …", an arrow, first letters („B…", „Re___"), a word-class name. */
const CUE_RE = /[(=→]|\p{L}(?:…|\.{3}|_{2,})|\b(?:Nomen|Verb|Adjektiv|Gegenteil|beginnt mit|Anfang)\b/u;
const WORD_CUE_RE = /\bWort\b|\bWörter|\bausgeschrieben|\bBuchstaben/i;
const hasWord = (text, word) => new RegExp(`(?:^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^\\p{L}])`, 'iu').test(text);

/** Lower-case form → the POS its lexicon entries give it, over the cumulative lexicon of a level. */
function posIndex(ctx, level, cache) {
  if (cache.has(level)) return cache.get(level);
  const m = new Map();
  for (const e of cumulativeLexicon(ctx, level)) {
    if (!isObj(e) || !e.pos) continue;
    for (const f of entryForms(e).forms) {
      if (!m.has(f)) m.set(f, new Set());
      m.get(f).add(e.pos);
    }
  }
  cache.set(level, m);
  return m;
}

/** The rail-extension findings of one item (see the header). */
function cueFindings(doc, item, path, where, pos) {
  const out = [];
  const id = item.id;
  const de = String(item.promptDe || '');
  const en = String(item.promptEn || '');
  const key = String(item.answer ?? '').trim();
  const accepted = [key, ...arr(item.accepted).map(String)];
  const typed = item.type === 'fill_blank' && !arr(item.options).length;
  // the key given away by the stem
  if (['pool', 'reserve', 'check', 'proof'].includes(where) && arr(item.options).length >= 3 && key) {
    const distractors = arr(item.options).map(String).filter((o) => norm(o) !== norm(key));
    const digits = (x) => x.replace(/\D+/g, '');
    const stemNumbers = new Set((de.match(/\d+(?:[.,:]\d+)*/g) || []).map(digits));
    const inStem = (x) => (digits(x).length >= 2 ? stemNumbers.has(digits(x)) : norm(x).length >= 3 && hasWord(norm(de), norm(x)));
    // a1.1-u04 r1 F06: „the digits 1,19 appear in the stem and in exactly one option" — a flyer with the
    // other prices as options is fine, the key alone copied from the stem is not
    if (inStem(key) && !distractors.some(inStem)) out.push(blocker(doc, `${path}.promptDe`, `the key „${key}" stands in the stem and no distractor does — the item answers itself`, id));
  }
  // a cue only promptEn gives
  // „the polite form of können": the RELATION is the cue — promptDe carries it as a cue (in brackets,
  // after „von/zu/aus", before an arrow), not merely the word in its sentence („Können Sie …? ___")
  const relCues = [...en.matchAll(/\b(?:polite form|form|plural|past|participle|noun|verb|opposite|comparative|superlative) (?:of|from) (?:the |a |an )?["„“']?(\p{L}+)(?=["“”']?\s*(?:$|[.,;:)!?]))/giu)].map((m) => m[1]);
  // a quoted or bracketed word in promptEn only points at a word: promptDe must contain it
  const wordCues = [...en.matchAll(/\(([\p{L}-]+)\)|[„“"]([\p{L}-]+)[“”"]/gu)].map((m) => m[1] || m[2]);
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cued = (w) => new RegExp(`\\([^)]*${esc(w)}[^)]*\\)|(?:von|zu|aus)\\s+[„"]?${esc(w)}|${esc(w)}[“"]?\\s*→`, 'iu').test(de);
  const german = (w) => w.length >= 3 && (pos.has(w.toLowerCase()) || /[äöüß]/i.test(w));
  for (const w of new Set(relCues)) {
    if (german(w) && !cued(w)) out.push(blocker(doc, `${path}.promptDe`, `promptEn names „${w}" as the cue, promptDe does not („(${w})") — the German prompt must carry the cue`, id));
  }
  for (const w of new Set(wordCues)) {
    if (german(w) && !hasWord(de, w)) out.push(blocker(doc, `${path}.promptDe`, `promptEn names „${w}", promptDe does not — the German prompt must carry the cue`, id));
  }
  if (/\b(?:as an? (?:ordinal )?word|in words|written out|spell(?:ed)? out)\b/i.test(en) && !WORD_CUE_RE.test(de)) out.push(blocker(doc, `${path}.promptDe`, 'promptEn asks for a word, promptDe does not („in Wörtern", „als Wort")', id));
  const starts = en.match(/\bstarts? with ["„“']?(\p{L}+)/iu);
  if (starts && !de.toLowerCase().includes(starts[1].toLowerCase())) out.push(blocker(doc, `${path}.promptDe`, `promptEn gives the first letters „${starts[1]}", promptDe does not`, id));
  if (!typed || !key) return out;
  // comprehension items (input, structured, exam) are decided by their text; the rest by the prompt
  const lexicalSlot = where === 'pool' || where === 'reserve' || where === 'check';
  // an ordinal word as the key
  if (key.split(/\s+/).some((w) => ordinalValue(w.replace(/[^\p{L}]/gu, '')) !== null) && !accepted.some((a) => /\d/.test(a)) && item.exact !== 'number' && !WORD_CUE_RE.test(de)) {
    out.push(blocker(doc, `${path}.accepted`, `the key „${key}" is an ordinal word: say „Wort" in promptDe, accept the digit form, or set exact: "number" (the checker then takes „4." for „vierte")`, id));
  }
  // first letters with underscores: exactly the missing letters
  for (const m of de.matchAll(/(\p{L}+)(_{2,})/gu)) {
    const [, head, gaps] = m;
    const target = accepted.find((a) => !/\s/.test(a.trim()) && a.toLowerCase().startsWith(head.toLowerCase()));
    if (target && head.length + gaps.length !== target.replace(/[^\p{L}]/gu, '').length) out.push(blocker(doc, `${path}.promptDe`, `„${head}${gaps}" shows ${head.length + gaps.length} letters, the key „${target}" has ${target.replace(/[^\p{L}]/gu, '').length}`, id));
  }
  if (CUE_RE.test(de.replace(/_{2,}/g, (g, i) => (i > 0 && /\p{L}/u.test(de[i - 1]) ? g : ' ')))) return out;
  const words = key.replace(/[.,!?;:„“"]/g, '').split(/\s+/).filter(Boolean);
  // a preposition the prompt does not give (a phrase „an der" or a contraction „zum"; a bare „auf" is a
  // verb's rection, which the verb decides; a gap right after a preposition „gegenüber ___" is framed)
  const gapAt = de.search(/_{2,}/);
  const wordBefore = (gapAt > 0 ? de.slice(0, gapAt).trim().split(/\s+/).pop() : '') || '';
  const phrase = words.length >= 2 || /^(?:zum|zur|am|im|ins|ans|beim|vom|aufs)$/i.test(words[0] || '');
  if (lexicalSlot && phrase && PREPOSITIONS.has(words[0].toLowerCase()) && !PREPOSITIONS.has(wordBefore.toLowerCase()) && !hasWord(de, words[0]) && !/Präposition/i.test(de)) {
    out.push(blocker(doc, `${path}.promptDe`, `the key „${key}" begins with the preposition „${words[0]}", which promptDe does not give — another preposition fits the frame; cue it („(${words[0]})")`, id));
    return out;
  }
  if (words.length !== 1 || !lexicalSlot) return out;
  // synonyms already accepted, or a prompt that defines the word („…: Das ist eine ___.") decide it
  if (new Set(accepted.map((a) => norm(a))).size >= 2) return out;
  if (/:\s*[^:]*_{2,}|\bheißt\b|\bnennt man\b/.test(de)) return out;
  // an open lexical gap: noun, adjective, or sentence adverb at the start
  const w = words[0];
  const before = gapAt > 0 ? de.slice(0, gapAt) : '';
  const initial = !before.trim() || /[.!?:„“"]\s*$/.test(before.trim());
  const cls = pos.get(w.toLowerCase()) || new Set();
  const noun = (cls.has('NOUN') || (/^\p{Lu}/u.test(w) && !initial)) && !/^\p{Lu}/u.test(w) === false;
  const adj = cls.has('ADJ') && !cls.has('VERB');
  const sadv = initial && SENTENCE_ADVERBS.has(w.toLowerCase());
  if (sadv) out.push(blocker(doc, `${path}.promptDe`, `open sentence-adverb gap at the start („${key}") without a German cue — another connector fits; add the choice in brackets („(trotzdem / deshalb)") or the first letters`, id));
  else if (noun || adj) out.push(advisory(doc, `${path}.promptDe`, `open ${noun ? 'noun' : 'adjective'} gap („${key}") without a German cue — if another word of its class fits the frame, add a bracketed base form, „= …", or the first letters`, id));
  return out;
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  if (!Q) notes.push(`quality.js not importable (${qError}); only the v2 task-shape checks ran`);
  const preds = predicates();
  const posCache = new Map();
  let n = 0;
  for (const doc of docs) {
    const pos = posIndex(ctx, doc.level, posCache);
    for (const { item, path, where, block, texts } of walkItems(doc)) {
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
      const blockTexts = arr(texts).map((x) => x.text);
      const choiceBlock = arr(block?.choices).length > 0;
      if (where === 'exam' && !item.textRef && !choiceBlock && blockTexts.length > 1) findings.push(blocker(doc, `${path}.textRef`, 'exam item of a multi-text block without textRef', id));
      if (where === 'exam' && item.textRef && !blockTexts.some((t) => t?.id === item.textRef)) findings.push(blocker(doc, `${path}.textRef`, `textRef "${item.textRef}" is not a text of its block`, id));
      if (CHOICE_TYPES.has(item.type) && !arr(item.options).length && item.type !== 'zuordnen' && item.type !== 'match') {
        findings.push(blocker(doc, `${path}.options`, `${item.type} item without options`, id));
      }
      if (!item.intentionalError || item.type !== 'error_correction') findings.push(...cueFindings(doc, item, path, where, pos));
      // quality.js
      const c = compiledItem(item);
      const keyAnswer = choiceBlock && where === 'exam';
      for (const [reason, applies] of preds) {
        if (keyAnswer && reason !== Q.REASON.ENGLISH_PROMPT && reason !== Q.REASON.ENGLISH_RESPELLING) continue;
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
