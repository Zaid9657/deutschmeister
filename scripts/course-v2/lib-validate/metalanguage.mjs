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
//   instructions   exam blocks' and speaking parts' instructionsDe
//   situation      speaking parts', writing tasks' and micro-outputs' situationDe
//   leitpunkt      writing tasks' leitpunkte[].de
//   checklist      writing tasks' checklist[]
//   strategyCard   strategy cards' de (GRM-04; LEX-01 as an advisory — the card shows its English twin)
// Surfaces added by the a1.1 unit reviews (rule-smith 2026-09-28, RAILS §3.1c), all `extra: true` — LEX-01
// reports an unknown word on them as an ADVISORY (a word the learner may not know is not wrong German):
//   recap          start.recapDe                                (U01's stand-alone recap line, StartView)
//   folgeTitle     start.folge.title                            (the Folge's glosses count)
//   lernziel       the learner text of every start.lernziele can-do (the registry's learnerDe, else de) —
//                  also GRM-04's instruction scope, like title.canDo (a1.1-u06 r2 F01 / r3 F01)
//   openingLine    speaking tasks' openingLine                  (the AI partner's first line, heard)
//   rmFunction     redemittel[].function                        (StepView shows it in the German UI; en twin)
// story.beat is authoring text the player never renders (grep src/components/course-v2) and is not walked.
// An exam block's screen holds its texts: their glosses and the words they show count as known on the
// block's instruction and on its items' stems, options and explanations.

import { walkItems, walkBlocks, walkTasks, walkMicroOutputs, walkSteps, speakingParts } from './walk.mjs';

const arr = (x) => (Array.isArray(x) ? x : []);
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = (x) => (typeof x === 'string' ? x : '');

/**
 * Instruction metalanguage: words the course's German instructions, task lines and explanations need
 * before any unit allocates them — the task verbs of the Sie-imperative, the names of the exam's own
 * modules and parts, the grammar and pronunciation terms the explanations name, and the Goethe/telc
 * Sprechen topic labels. Lower-case surface forms; the inflected forms the course uses are listed. SMALL
 * on purpose (a test pins ≤ 140 entries and bans ordinary content words): a word a learner must
 * understand to answer is a lexicon word (allocate it) or a gloss on its screen, never an entry here.
 */
export const INSTRUCTION_METALANGUAGE = Object.freeze([
  // task verbs of the instructions („Korrigieren Sie …", „Was passt?", „Bitten Sie um …", „Wählen Sie …")
  'korrigieren', 'ergänzen', 'markieren', 'ordnen', 'notieren', 'ankreuzen', 'wiederholen', 'wählen', 'nennen',
  'reagieren', 'bitten', 'passt', 'passen', 'passende', 'passenden',
  // the exam's modules, parts and task words
  'prüfung', 'prüfungen', 'teil', 'hören', 'lesen', 'schreiben', 'sprechen', 'gespräch', 'gespräche',
  'durchsage', 'durchsagen', 'aussage', 'aussagen', 'frage', 'fragen', 'antwort', 'antworten', 'thema', 'themen',
  'karte', 'karten', 'wortkarte', 'wortkarten', 'schild', 'schilder', 'anrede', 'gruß', 'text', 'texte', 'punkt',
  'punkte', 'punkten', 'stichwort', 'stichwörter', 'stichwörtern', 'angaben', 'ki', 'gesprächsleitung',
  // the sd1.l2 template's own task word („Lesen Sie die Situationen …"; the level decision a1.1-u05 r1 F01 /
  // u06 r1 F02 asked for — lx.situation is a b1.1 lemma, the exam names its items with it from A1 on)
  'situation', 'situationen',
  // grammar and pronunciation terms the explanations name
  'plural', 'singular', 'position', 'aussagesatz', 'fragesatz', 'w-frage', 'w-fragen', 'w-wort', 'w-wörter',
  'nein-frage', 'ja-nein-frage', 'nomen', 'verb', 'verben', 'verbform', 'form', 'formen', 'infinitiv',
  'partizip', 'adjektiv', 'artikel', 'bestimmt', 'bestimmte', 'bestimmter', 'unbestimmt', 'unbestimmte',
  'unbestimmter', 'endung', 'endungen', 'wortstellung', 'satzende', 'subjekt', 'pronomen', 'verneinung',
  'trennbar', 'trennbare', 'trennbaren', 'maskulin', 'feminin', 'neutral', 'nominativ', 'akkusativ', 'dativ',
  'perfekt', 'präsens', 'genus', 'vokal', 'adjektive', 'formell', 'informell', 'umlaut', 'akzent', 'melodie', 'satzmelodie', 'buchstabe', 'buchstaben',
  'satz', 'sätze', 'sätzen', 'nebensatz', 'relativsatz', 'relativsätze', 'lücke', 'lücken', 'wort', 'wörter',
  // the course's own screens and modes (Mustertext, Lernmodus, Planungsrunde)
  'mustertext', 'lernmodus', 'prüfungsmodus', 'planungsrunde',
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
    // a first-letter cue is a truncated word, not a word: „(St…)", „B...", „Re___" (a1.1-u01 r2 F10)
    .replace(/\p{L}+(?:…|\.{3}|_{2,})/gu, ' ')
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
export function* walkReadSurfaces(doc, { cando = null } = {}) {
  const d = doc.data || {};
  // the can-do registry (ctx.registries.cando) gives the Lernziele box its text; without it the lines are skipped
  const registryCando = cando ? (id) => cando.get(id)?.item || null : null;
  const s = (kind, de, path, id, glosses = [], more = {}) => ({ kind, de: str(de), path, id: id ?? null, glosses, instruction: false, twin: false, extra: false, ...more });
  if (doc.kind === 'unit') {
    const folgeGlosses = glossTokens(d.start?.folge?.glosses);
    if (str(d.title?.canDo)) yield s('canDo', d.title.canDo, 'title.canDo', d.id, folgeGlosses, { instruction: true });
    if (str(d.start?.recapDe)) yield s('recap', d.start.recapDe, 'start.recapDe', d.id, folgeGlosses, { extra: true });
    if (str(d.start?.folge?.title)) yield s('folgeTitle', d.start.folge.title, 'start.folge.title', d.id, folgeGlosses, { extra: true });
    for (const [i, c] of arr(d.start?.lernziele).entries()) {
      const e = registryCando?.(c);
      const text = str(e?.learnerDe) || str(e?.de);
      // the text is the can-do registry's, not the unit's: `owner` routes a finding to the registry file
      if (text) yield s('lernziel', text, `start.lernziele[${i}]`, c, folgeGlosses, { instruction: true, extra: true, owner: { file: cando.get(c)?.file ?? null, path: `items[${c}].${str(e?.learnerDe) ? 'learnerDe' : 'de'}` } });
    }
    for (const [i, r] of arr(d.redemittel).entries()) {
      if (str(r?.function)) yield s('rmFunction', r.function, `redemittel[${i}].function`, r.id, [], { extra: true, twin: Boolean(str(r?.en)) });
    }
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
      if (str(task.openingLine)) yield s('openingLine', task.openingLine, `${path}.openingLine`, task.bankKey, [], { extra: true, task });
      for (const { part, path: pp } of speakingParts(task)) {
        // SpeakingPart.situationEn (SCHEMA §8, 2026-09-28) is the situation's English twin on the same screen
        if (str(part?.situationDe)) yield s('situation', part.situationDe, `${path}${pp}.situationDe`, task.bankKey, [], { instruction: true, task, twin: Boolean(str(part?.situationEn)) });
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
 * options. It is wrong on purpose, not a word to learn. LEX-01 asks this only of a token no lexicon
 * allocates at all (a real word beside its derivation — „Verkäufer" / „Verkäuferin" — is never planted).
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
