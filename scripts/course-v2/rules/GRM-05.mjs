// GRM-05 — rule cards ≤ 60 words (A1) / ≤ 80 (A2+), model sentence first, English twin
// (BLUEPRINT §9.1, §2.5 rule 4). Kasus colours only where a case is named (design tokens rule).
// The "no unconditioned claim" half is quality.js `unconditionedRule` on items (ITM-01).
// A card must not deny a form the ending its own text or table shows: „du wirst und er wird – ohne d"
// beside a table row „er/sie/es | wird" (claims.mjs; reviews a2.2-u04 r1 F02, r2 F02, r3 F03 — three
// rounds on rc.werden-vollverb, BLUEPRINT §9.4). The same check runs on item explanations (ITM-11).

import { walkSteps } from '../lib-validate/walk.mjs';
import { wordCount } from '../lib-validate/text.mjs';
import { levelNumbers, arr, blocker, advisory } from '../lib-validate/helpers.mjs';
import { endingContradictions } from '../lib-validate/claims.mjs';

export const id = 'GRM-05';
export const title = 'Rule cards: word limit, model sentence, English twin';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

const CASE_RE = /Nominativ|Akkusativ|Dativ|Genitiv/;

export function run({ ctx, docs, levels, mode }) {
  const findings = [];
  const cards = []; // { card, index, file, level }
  const want = new Set();
  if (mode === 'file') {
    for (const doc of docs) for (const { step } of walkSteps(doc)) if (step?.ruleCard) want.add(step.ruleCard);
    for (const slot of ctx.levels.values()) {
      arr(slot.ruleCards?.cards).forEach((card, index) => { if (want.has(card?.id)) cards.push({ card, index, file: slot.ruleCards.file, level: slot.level }); });
    }
  } else {
    for (const slot of levels) arr(slot.ruleCards?.cards).forEach((card, index) => cards.push({ card, index, file: slot.ruleCards.file, level: slot.level }));
  }
  if (!cards.length) return { findings, skipped: 'no rule cards for the target yet (rule-cards.json)' };
  for (const { card, index, file, level } of cards) {
    const doc = { file };
    const p = `cards[${index}]`;
    const max = levelNumbers(ctx, level).ruleCardMaxWords;
    const n = wordCount(card?.de);
    if (n > max) findings.push(blocker(doc, `${p}.de`, `${n} words (max ${max} at ${level})`, card?.id));
    if (!String(card?.modelSentence || '').trim()) findings.push(blocker(doc, `${p}.modelSentence`, 'rule card without its model sentence', card?.id));
    if (!String(card?.en || '').trim()) findings.push(blocker(doc, `${p}.en`, 'rule card without its English twin', card?.id));
    for (const lang of ['de', 'en']) {
      for (const c of endingContradictions(card?.[lang], card?.table)) {
        findings.push(blocker(doc, `${p}.${lang}`, `„${c.form}" is paired with „${c.claim}", but „${c.form}" ends in -${c.letters} (the card's own paradigm)`, card?.id));
      }
    }
    if (arr(card?.caseMarks).length && !CASE_RE.test(`${card?.de || ''} ${JSON.stringify(card?.table || [])}`)) {
      findings.push(advisory(doc, `${p}.caseMarks`, 'Kasus colours on a card that names no case (colour means grammatical case only where a case is named)', card?.id));
    }
  }
  return { findings };
}
