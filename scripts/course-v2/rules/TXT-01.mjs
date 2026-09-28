// TXT-01 — sentence metrics per level (BLUEPRINT §9.1; level-profiles.json `sentence`: maxWords,
// meanWordsMax, subordinateClausesMax).
//
// Built by the a1.1 unit reviews (rule-smith 2026-09-28, RAILS §3.1c): u02 r1 F07 / r2 F08 / r3 F07 (a
// subordinate clause in rule-card prose and item explanations at A1.1, whose limit is 0 — „vor dem Wort, das
// nicht stimmt"), u06 r3 F05 (the whole sentence block). Two surface classes:
//   - the course's German texts — Folge lines, input lines, the check lines, model turns, model texts and
//     micro-output models: a sentence over maxWords, a text whose mean is over meanWordsMax, or a subordinate
//     clause over the limit is a RATCHET (the count may only go down; the fixture a1.1-u03 ls3-l10);
//   - the metalanguage the learner reads to work — instructions, situations, title.canDo, the Lernziele
//     lines (the registry's, reported once), endLines, strategy cards, item explanations and rule-card prose
//     at the card's first use: a subordinate clause over the limit is a RATCHET (three rounds asked for it);
//     a long sentence is an ADVISORY until the limits are calibrated against the level's own frames (u06: a
//     23-word title.canDo, a 19-word situationDe).
// Exam texts follow their Teil template (TXT-02); a sentence of theirs over maxWords is an ADVISORY here
// (a1.1-u11 r2 F06).

import { walkTexts, walkProduction, walkSteps } from '../lib-validate/walk.mjs';
import { walkReadSurfaces } from '../lib-validate/metalanguage.mjs';
import { sentences, wordCount, tokens, endsVerbFinal, AUX_MODAL_FORMS, FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { levelNumbers, arr, advisory, ratchet } from '../lib-validate/helpers.mjs';

export const id = 'TXT-01';
export const title = 'Sentence metrics per level: words per sentence, mean, subordinate clauses';
export const type = 'mixed';
export const scope = 'unit';
export const stage = 'S';

// „bis", „als", „während", „seit" are prepositions far more often than conjunctions at A/B levels: not counted
const SUBORDINATORS = new Set(['dass', 'weil', 'wenn', 'ob', 'obwohl', 'damit', 'bevor', 'nachdem', 'falls', 'sodass', 'seitdem', 'indem', 'sobald', 'solange']);
const RELATIVES = new Set(['der', 'die', 'das', 'den', 'dem', 'dessen', 'deren', 'denen', 'was', 'wo', 'wer']);
const W_WORDS = new Set(['wer', 'was', 'wo', 'wohin', 'woher', 'wann', 'wie', 'warum', 'welche', 'welcher', 'welches']);

/**
 * Subordinate clauses of one sentence: a clause that opens with a subordinator, a relative pronoun or (after
 * a comma) a W-word and ends in its finite verb („…, das nicht stimmt", „Wenn Sie Zeit haben, …").
 */
export function subordinateClauses(sentence) {
  let n = 0;
  // a colon opens a new main clause (direct speech, a list); a comma between digits is a decimal comma
  for (const segment of String(sentence || '').split(/:/)) {
    const parts = segment.split(/(?<!\d),(?!\d)|;|–/);
    parts.forEach((part, i) => {
      if (clauseCounts(part, i)) n += 1;
    });
  }
  return n;
}

/** Does one comma-part of a sentence open a subordinate clause (see subordinateClauses)? */
function clauseCounts(part, i) {
  const toks = tokens(part);
  if (toks.length < 3) return false;
  const w = toks[0].lower;
  const opens = SUBORDINATORS.has(w) || (i > 0 && (RELATIVES.has(w) || W_WORDS.has(w)));
  if (!opens) return false;
  // „wie „er liest“": a W-word or pronoun before a quotation compares or cites, it opens no clause
  if (/^\s*\p{L}+\s*[„“"‚]/u.test(part)) return false;
  // „…, das ist schön", „…, was haben Sie gemacht?": the finite verb second — a main clause
  if (!SUBORDINATORS.has(w) && toks[1] && AUX_MODAL_FORMS.has(toks[1].lower)) return false;
  if (!SUBORDINATORS.has(w) && toks[1] && /^\p{Ll}+(?:t|st)$/u.test(toks[1].text) && !FUNCTION_WORDS.has(toks[1].lower)) return false;
  // no clause without a verb at the end
  if (!endsVerbFinal(part.trim().replace(/[.!?…“”"]+$/, ''))) return false;
  // a relative pronoun directly before a noun is an article („…, die Kollegin kommt")
  if (RELATIVES.has(w) && toks[1] && /^\p{Lu}/u.test(toks[1].text)) return false;
  return true;
}

export function run({ ctx, docs, levels, mode }) {
  const findings = [];
  let n = 0;
  const reported = new Set();
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const lim = levelNumbers(ctx, doc.level).sentence;
    if (!lim) continue;
    const { maxWords, meanWordsMax, subordinateClausesMax } = lim;
    const measureText = (text, path, id, texts = true) => {
      const ss = sentences(text).filter((s) => wordCount(s) > 0);
      if (!ss.length) return;
      n += 1;
      const long = ss.filter((s) => typeof maxWords === 'number' && wordCount(s) > maxWords);
      const sub = ss.reduce((a, s) => a + subordinateClauses(s), 0);
      if (texts) {
        if (long.length) findings.push(ratchet(doc, path, `${long.length} sentence(s) over ${maxWords} words at ${doc.level}: „${long[0].slice(0, 80)}" (${wordCount(long[0])})`, id));
        const mean = ss.reduce((a, s) => a + wordCount(s), 0) / ss.length;
        if (typeof meanWordsMax === 'number' && ss.length >= 3 && mean > meanWordsMax + 1e-9) findings.push(ratchet(doc, path, `mean ${Math.round(mean * 10) / 10} words per sentence (max ${meanWordsMax} at ${doc.level})`, id));
      } else {
        // metalanguage: only the outliers (> 1.5 × maxWords) until the limit is calibrated for instructions
        const outliers = ss.filter((x) => typeof maxWords === 'number' && wordCount(x) > 1.5 * maxWords);
        if (outliers.length) findings.push(advisory(doc, path, `a ${wordCount(outliers[0])}-word sentence (${maxWords} at ${doc.level}): „${outliers[0].slice(0, 80)}" — advisory until the limit is calibrated for instructions`, id));
      }
      if (typeof subordinateClausesMax === 'number' && sub > subordinateClausesMax) findings.push(ratchet(doc, path, `${sub} subordinate clause(s) (max ${subordinateClausesMax} at ${doc.level})`, id));
    };
    // the course's German texts
    for (const t of walkTexts(doc)) {
      if (t.kind === 'exam') {
        // an exam text follows its Teil template (TXT-02), but a sentence over the level's maxWords is still
        // read by an A1 learner under time — ADVISORY (a1.1-u11 r2 F06: the LS3 postcard, 14 words)
        const parts = t.lines.length ? t.lines.map((l, i) => [String(l?.de || ''), `${t.path}.lines[${i}]`, l?.id]) : [[String(t.writtenText || ''), `${t.path}.text`, t.step?.id]];
        for (const [txt, path, lid] of parts) {
          const long = sentences(txt).filter((x) => typeof maxWords === 'number' && wordCount(x) > maxWords);
          if (long.length) findings.push(advisory(doc, path, `exam text: ${long.length} sentence(s) over ${maxWords} words at ${doc.level}: „${long[0].slice(0, 80)}" (${wordCount(long[0])})`, lid));
        }
        continue;
      }
      if (t.lines.length) t.lines.forEach((l, i) => measureText(String(l?.de || ''), `${t.path}.lines[${i}]`, l?.id));
      if (t.writtenText) measureText(t.writtenText, `${t.path}.text`, t.step?.id);
    }
    arr(doc.data.check?.lines).forEach((l, i) => measureText(String(l?.de || ''), `check.lines[${i}]`, l?.id));
    for (const p of walkProduction(doc)) {
      if (p.kind === 'model-turn' || p.kind === 'model-text' || p.kind === 'model-micro') measureText(p.de, p.path, null);
    }
    // the metalanguage: instruction scope, endLines, explanations
    for (const sf of walkReadSurfaces(doc, { cando: ctx.registries.cando })) {
      if (!(sf.instruction || sf.kind === 'endLine' || sf.kind === 'explanation')) continue;
      if (sf.owner) {
        const k = `${sf.owner.file}|${sf.owner.path}`;
        if (reported.has(k)) continue;
        reported.add(k);
        const before = findings.length;
        measureText(sf.de, sf.path, sf.id, false);
        for (const f of findings.slice(before)) {
          f.file = sf.owner.file;
          f.path = sf.owner.path;
        }
        continue;
      }
      measureText(sf.de, sf.path, sf.id, false);
    }
    // rule-card prose at the card's first use, in the unit's own run
    if (mode === 'file') {
      const slot = ctx.levels.get(doc.level);
      const first = new Map();
      for (const u of slot?.units?.values() || []) for (const { step } of walkSteps(u)) if (step?.ruleCard && (!first.has(step.ruleCard) || first.get(step.ruleCard) > u.nr)) first.set(step.ruleCard, u.nr);
      arr(slot?.ruleCards?.cards).forEach((card, i) => {
        if (first.get(card?.id) !== doc.nr || !card?.de) return;
        const before = findings.length;
        measureText(String(card.de), `cards[${i}].de`, card.id, false);
        for (const f of findings.slice(before)) f.file = slot.ruleCards.file;
      });
    }
  }
  // rule-card prose in a level run, at the card's first use
  if (mode !== 'file') {
    for (const slot of levels) {
      const lim = levelNumbers(ctx, slot.level).sentence;
      if (!lim) continue;
      const first = new Map();
      for (const u of slot.units.values()) for (const { step } of walkSteps(u)) if (step?.ruleCard && (!first.has(step.ruleCard) || first.get(step.ruleCard) > u.nr)) first.set(step.ruleCard, u.nr);
      arr(slot.ruleCards?.cards).forEach((card, i) => {
        if (!first.has(card?.id) || !card?.de) return;
        n += 1;
        const sub = sentences(String(card.de)).reduce((a, s) => a + subordinateClauses(s), 0);
        if (typeof lim.subordinateClausesMax === 'number' && sub > lim.subordinateClausesMax) findings.push(ratchet({ file: slot.ruleCards.file }, `cards[${i}].de`, `${sub} subordinate clause(s) in the prose of ${card.id} (max ${lim.subordinateClausesMax} at ${slot.level}, first shown in u${String(first.get(card.id)).padStart(2, '0')})`, card.id));
      });
    }
  }
  return n ? { findings } : { findings, skipped: 'no level profile with a sentence block, or no text in the target yet' };
}
