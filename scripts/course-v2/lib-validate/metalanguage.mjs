// The learner-read German instruction surfaces of a document, and the one allowlist of instruction
// metalanguage (rule-smith 2026-09-27, reviews a1.1-u04 r3 F05 / r4 F04 / r5 F03 and r4 F08 / r5 F05).
//
// Two rules read these surfaces, and both read them through `walkReadSurfaces` so the scope is decided
// once, here:
//   LEX-01 — every surface below except strategy cards (they carry an English twin): a content word
//            allocated to a later unit, or to none, is glossed on that screen or is instruction
//            metalanguage (the allowlist below);
//   GRM-04 — the INSTRUCTION scope only (`instruction: true`): block and speaking-part instructionsDe,
//            every situationDe, strategy cards and title.canDo. All four are read the same way, as
//            ADVISORY metalanguage (r5 F05: „either all … or none").
//
// Surfaces (`kind`):
//   canDo          title.canDo                                  (start screen: folge.glosses count)
//   stepTitle      steps[].title                                (the step's input glosses count)
//   endLine        steps[].endLine
//   prompt         items' promptDe, micro-outputs' promptDe, writing taskDe
//   option         items' options[]
//   explanation    items' explanation.de
//   instructions   exam blocks' and speaking parts' instructionsDe (a block's text glosses count)
//   situation      speaking parts', writing tasks' and micro-outputs' situationDe
//   leitpunkt      writing tasks' leitpunkte[].de
//   checklist      writing tasks' checklist[]
//   strategyCard   strategy cards' de (GRM-04 only)
// An exam item's stem and options count its block's text glosses as glossed on that screen.

import { walkItems, walkBlocks, walkTasks, walkMicroOutputs, walkSteps, speakingParts } from './walk.mjs';

const arr = (x) => (Array.isArray(x) ? x : []);
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = (x) => (typeof x === 'string' ? x : '');

/**
 * Instruction metalanguage: words the course's German instructions, task lines and explanations need
 * before any unit allocates them — the task verbs of the Sie-imperative, the names of the exam's own
 * modules and parts, the grammar and pronunciation terms the explanations name, and the Goethe/telc
 * Sprechen topic labels. Lower-case surface forms; the inflected forms the course uses are listed. SMALL
 * on purpose (a test pins ≤ 130 entries and bans ordinary content words): a word a learner must
 * understand to answer is a lexicon word (allocate it) or a gloss on its screen, never an entry here.
 */
export const INSTRUCTION_METALANGUAGE = Object.freeze([
  // task verbs of the instructions („Korrigieren Sie …", „Was passt?", „Wählen Sie …")
  'korrigieren', 'ergänzen', 'markieren', 'ordnen', 'notieren', 'ankreuzen', 'wiederholen', 'wählen', 'nennen',
  'reagieren', 'passt', 'passen', 'passende', 'passenden',
  // the exam's modules, parts and task words
  'prüfung', 'prüfungen', 'teil', 'hören', 'lesen', 'schreiben', 'sprechen', 'gespräch', 'gespräche',
  'durchsage', 'durchsagen', 'aussage', 'aussagen', 'frage', 'fragen', 'antwort', 'antworten', 'thema', 'themen',
  'karte', 'karten', 'wortkarte', 'wortkarten', 'schild', 'schilder', 'anrede', 'gruß', 'text', 'texte', 'punkt',
  'punkte', 'punkten', 'stichwort', 'stichwörter', 'stichwörtern', 'angaben', 'ki', 'gesprächsleitung',
  // grammar and pronunciation terms the explanations name
  'plural', 'singular', 'position', 'aussagesatz', 'fragesatz', 'w-frage', 'w-fragen', 'w-wort', 'w-wörter',
  'nein-frage', 'ja-nein-frage', 'nomen', 'verb', 'verben', 'verbform', 'form', 'formen', 'infinitiv',
  'partizip', 'adjektiv', 'artikel', 'bestimmt', 'bestimmte', 'bestimmter', 'unbestimmt', 'unbestimmte',
  'unbestimmter', 'endung', 'endungen', 'wortstellung', 'satzende', 'subjekt', 'pronomen', 'verneinung',
  'trennbar', 'trennbare', 'trennbaren', 'maskulin', 'feminin', 'neutral', 'nominativ', 'akkusativ', 'dativ',
  'perfekt', 'formell', 'informell', 'umlaut', 'akzent', 'melodie', 'satzmelodie', 'buchstabe', 'buchstaben',
  'satz', 'sätze', 'sätzen', 'lücke', 'wort', 'wörter',
  // Sprechen topic labels (Goethe A1/A2, telc A1: „Thema: Einkaufen")
  'einkaufen', 'essen', 'trinken', 'wohnen', 'freizeit', 'reisen', 'arbeit', 'wochenende', 'gesundheit',
]);
const META = new Set(INSTRUCTION_METALANGUAGE);

/** Is this lower-case token instruction metalanguage? */
export const isMetalanguage = (lower) => META.has(String(lower || '').toLowerCase());

/** Quoted sentences („…", "…") of a prompt — an error-correction item quotes its wrong sentence. */
export const stripQuoted = (text) => String(text || '').replace(/[„“"‚][^„“”"‚‘]*[“”"‘]/g, ' ');

/**
 * An explanation's morpheme notation is no word: an ending („-st", „-en", „/-innen") and a stem cut
 * before its ending („möcht-") are dropped; a segmented form („komm-st", „heiß-e") is read joined
 * („kommst", „heiße").
 */
export function stripFragments(text) {
  return String(text || '')
    .replace(/(^|[^\p{L}])-\p{L}+/gu, '$1 ')
    .replace(/\p{L}+-(?!\p{L})/gu, ' ')
    .replace(/(\p{Ll}+)-(\p{Ll}{1,3})(?!\p{L})/gu, '$1$2');
}

const readWords = (text) => (String(text || '').match(/[\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*/gu) || []).map((w) => w.toLowerCase());
const glossTokens = (list) => arr(list).map((g) => String(g?.token ?? '').toLowerCase()).filter(Boolean);

/**
 * Every learner-read German surface of a doc that is neither an input nor an exam text (those are LEX-01's
 * coverage and GRM-04's text walk). Yields { kind, de, path, id, glosses: [lower tokens], instruction,
 * twin, item? }. `instruction` marks GRM-04's scope; `twin` marks a surface whose screen also shows its
 * English twin (an item's promptEn and explanation.en, a micro-output's promptEn — the player shows them
 * outside the German UI), which LEX-01 reports as an advisory only.
 */
export function* walkReadSurfaces(doc) {
  const d = doc.data || {};
  const s = (kind, de, path, id, glosses = [], extra = {}) => ({ kind, de: str(de), path, id: id ?? null, glosses, instruction: false, twin: false, ...extra });
  if (doc.kind === 'unit') {
    if (str(d.title?.canDo)) yield s('canDo', d.title.canDo, 'title.canDo', d.id, glossTokens(d.start?.folge?.glosses), { instruction: true });
    for (const { step, path } of walkSteps(doc)) {
      if (!isObj(step)) continue;
      if (str(step.title)) yield s('stepTitle', step.title, `${path}.title`, step.id, glossTokens(step.input?.glosses));
      if (str(step.endLine)) yield s('endLine', step.endLine, `${path}.endLine`, step.id);
      for (const [i, c] of arr(step.strategyCards).entries()) {
        if (str(c?.de)) yield s('strategyCard', c.de, `${path}.strategyCards[${i}].de`, step.id, [], { instruction: true });
      }
    }
  } else if (doc.kind === 'lanepack') {
    for (const [i, c] of arr(d.slots?.ls4?.strategyCards).entries()) {
      if (str(c?.de)) yield s('strategyCard', c.de, `slots.ls4.strategyCards[${i}].de`, d.unit, [], { instruction: true });
    }
  }
  // an exam block's screen holds its texts: their glosses, and the words they show, count on it
  const blockScreen = new Map();
  for (const { block, path, texts } of walkBlocks(doc)) {
    const g = arr(texts).flatMap((t) => glossTokens(t.text?.glosses));
    const shown = arr(texts).flatMap((t) => [...arr(t.text?.lines).map((l) => str(l?.de)), str(t.text?.text)]).join(' ');
    const screen = [...new Set([...g, ...readWords(shown)])];
    blockScreen.set(block, screen);
    if (str(block?.instructionsDe)) yield s('instructions', block.instructionsDe, `${path}.instructionsDe`, block.id, screen, { instruction: true });
  }
  for (const { item, path, where, block } of walkItems(doc)) {
    if (!isObj(item)) continue;
    const g = where === 'exam' ? blockScreen.get(block) || [] : [];
    // an error-correction item quotes its wrong sentence (prompt) and its wrong form (explanation)
    const planted = item.intentionalError || item.type === 'error_correction';
    const prompt = planted ? stripQuoted(item.promptDe) : item.promptDe;
    if (str(prompt)) yield s('prompt', prompt, `${path}.promptDe`, item.id, g, { item, twin: Boolean(str(item.promptEn)) });
    for (const [i, o] of arr(item.options).entries()) if (str(o)) yield s('option', o, `${path}.options[${i}]`, item.id, g, { item });
    const expl = planted ? stripQuoted(item.explanation?.de) : item.explanation?.de;
    if (str(expl)) yield s('explanation', expl, `${path}.explanation.de`, item.id, g, { item, twin: Boolean(str(item.explanation?.en)) });
  }
  for (const { task, kind, path } of walkTasks(doc)) {
    if (kind === 'speaking') {
      for (const { part, path: pp } of speakingParts(task)) {
        if (str(part?.situationDe)) yield s('situation', part.situationDe, `${path}${pp}.situationDe`, task.bankKey, [], { instruction: true, task });
        if (str(part?.instructionsDe)) yield s('instructions', part.instructionsDe, `${path}${pp}.instructionsDe`, task.bankKey, [], { instruction: true, task });
      }
    } else {
      if (str(task.situationDe)) yield s('situation', task.situationDe, `${path}.situationDe`, task.bankKey, [], { instruction: true, task });
      if (str(task.taskDe)) yield s('prompt', task.taskDe, `${path}.taskDe`, task.bankKey, [], { task });
      for (const [i, lp] of arr(task.leitpunkte).entries()) if (str(lp?.de)) yield s('leitpunkt', lp.de, `${path}.leitpunkte[${i}].de`, task.bankKey, [], { task });
      for (const [i, c] of arr(task.checklist).entries()) if (str(c)) yield s('checklist', c, `${path}.checklist[${i}]`, task.bankKey, [], { task });
    }
  }
  for (const { mo, path } of walkMicroOutputs(doc)) {
    if (str(mo.situationDe)) yield s('situation', mo.situationDe, `${path}.situationDe`, mo.id, [], { instruction: true });
    if (str(mo.promptDe)) yield s('prompt', mo.promptDe, `${path}.promptDe`, mo.id, [], { twin: Boolean(str(mo.promptEn)) });
  }
}

/** Levenshtein distance, capped: returns cap + 1 as soon as the distance exceeds `cap`. */
export function editDistance(a, b, cap = 2) {
  const x = String(a);
  const y = String(b);
  if (Math.abs(x.length - y.length) > cap) return cap + 1;
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i += 1) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= y.length; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > cap) return cap + 1;
    prev = cur;
  }
  return prev[y.length];
}

/**
 * A distractor option's planted wrong form („Busfahrin" beside the key „Busfahrerin", „Hoffman" beside
 * „Hofmann"): a token of ≥ 5 letters within two edits of a word of the item's key, accepted forms or other
 * options. It is wrong on purpose, not a word to learn.
 */
export function plantedForm(lower, item) {
  if (!item || lower.length < 5) return false;
  const near = new Set(readWords([item.answer, ...arr(item.accepted), ...arr(item.options)].map(str).join(' ')));
  near.delete(lower);
  for (const n of near) if (n.length >= 4 && editDistance(lower, n) <= 2) return true;
  return false;
}

/** The names a doc's speaking tasks give their AI partner (aiRole.name): known words on its surfaces. */
export function taskNames(doc) {
  const out = [];
  for (const { task, kind } of walkTasks(doc)) if (kind === 'speaking' && str(task?.aiRole?.name)) out.push(task.aiRole.name);
  return out;
}
