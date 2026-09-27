// GRM-05 — rule cards ≤ 60 words (A1) / ≤ 80 (A2+), model sentence first, English twin
// (BLUEPRINT §9.1, §2.5 rule 4). Kasus colours only where a case is named (design tokens rule).
// The "no unconditioned claim" half is quality.js `unconditionedRule` on items (ITM-01).
// A card must not deny a form the ending its own text or table shows: „du wirst und er wird – ohne d"
// beside a table row „er/sie/es | wird" (claims.mjs; reviews a2.2-u04 r1 F02, r2 F02, r3 F03 — three
// rounds on rc.werden-vollverb, BLUEPRINT §9.4). The same check runs on item explanations (ITM-11).
//
// A card shows the chunk its first unit declares (review a1.1-u04 r5 F04, the r2-F09/r3-F06/r4-F07 class
// in its fourth round, BLUEPRINT §9.4): when the first unit of the level that uses a card lists a point
// under spec.grammar.chunk, and the spine makes that chunk point the CONTRAST of the card's own point
// (g.akkusativ.contrast = g.artikel-genus-plural), the card's de, table or model sentence shows one of the
// chunk's label forms („Akkusativ: den, einen, keinen" → den/einen/keinen). Otherwise the card teaches a
// rule („ein (der, das)") that the unit's own chunk („Ich möchte einen Apfel") contradicts on the same
// screen. Scoped to the spine's contrast pairs: a card of an unrelated point (rc.praesens in the unit whose
// chunk is the Sie-imperative) owes the chunk nothing. Blocker. The card-prose half of the finding
// (rc.moechte previewing „Ich möchte bezahlen.") is GRM-04's: det.moechte-infinitiv reads the card's prose
// at its first use, as metalanguage (advisory).

import { walkSteps } from '../lib-validate/walk.mjs';
import { wordCount, tokens, FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { levelNumbers, arr, blocker, advisory } from '../lib-validate/helpers.mjs';
import { endingContradictions } from '../lib-validate/claims.mjs';

export const id = 'GRM-05';
export const title = 'Rule cards: word limit, model sentence, English twin';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

const CASE_RE = /Nominativ|Akkusativ|Dativ|Genitiv/;
const CONNECTORS = new Set(['und', 'oder', 'sowie']);

/**
 * The forms a chunk point's label lists: after its first colon (else the label's head), before the first
 * bracket — „Akkusativ: den, einen, keinen (Ich brauche …)" → den, einen, keinen; „müssen und dürfen; man
 * (…)" → müssen, dürfen, man. Capitalised metalanguage („Dativ") is dropped, pronouns („Ihnen") are kept;
 * a content form also counts with a person ending (war → waren, hatte → hatten).
 */
export function chunkLabelForms(point) {
  const label = String(point?.label || '');
  const colon = label.indexOf(':');
  const head = (colon >= 0 ? label.slice(colon + 1) : label).split('(')[0];
  const out = new Set();
  for (const t of tokens(head)) {
    if (/^\d/.test(t.text) || CONNECTORS.has(t.lower)) continue;
    const fw = FUNCTION_WORDS.has(t.lower);
    if (/^\p{Lu}/u.test(t.text) && !fw) continue;
    out.add(t.lower);
  }
  return out;
}

/** A label form with the person endings of a content form (war → waren, hatte → hatten). */
function withEndings(forms) {
  const out = new Set(forms);
  for (const f of forms) if (!FUNCTION_WORDS.has(f)) for (const e of ['n', 'en', 'st', 't']) out.add(`${f}${e}`);
  return out;
}

/** The first unit of `slot` whose step names each card: Map(cardId → unit data). */
function firstUses(slot) {
  const out = new Map();
  const units = [...(slot?.units?.values() || [])].sort((a, b) => a.nr - b.nr);
  for (const doc of units) {
    for (const { step } of walkSteps(doc)) {
      const rc = step?.ruleCard;
      if (rc && !out.has(rc)) out.set(rc, doc.data);
    }
  }
  return out;
}

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
  const spine = ctx.registries.spine?.byId || null;
  const uses = new Map();
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
    // the chunk of the card's first unit, where the spine contrasts it with the card's point (r5 F04)
    if (spine && card?.id) {
      if (!uses.has(level)) uses.set(level, firstUses(ctx.levels.get(level)));
      const first = uses.get(level).get(card.id);
      for (const cid of arr(first?.spec?.grammar?.chunk)) {
        const chunk = spine.get(cid)?.point;
        if (!chunk || chunk.contrast !== card.spine) continue;
        const base = chunkLabelForms(chunk);
        if (!base.size) continue;
        const forms = withEndings(base);
        const shown = [card.de, card.modelSentence, ...arr(card.table).flat()].map((x) => String(x ?? '')).join(' ');
        if (tokens(shown).some((t) => forms.has(t.lower))) continue;
        const from = chunk.intro?.productive || chunk.intro?.receptive || '?';
        findings.push(blocker(doc, p, `${card.id} is first used at ${first.id}, which declares the chunk ${cid}; the spine contrasts ${cid} with the card's point ${card.spine}, but neither the card's text, table nor model sentence shows a chunk form (${[...base].slice(0, 8).map((f) => `„${f}"`).join(' / ')}) — add one, e.g. an „Achtung:" line with the unit's own chunk (the point itself comes at ${from}); owner: the rule-cards file`, card.id));
      }
    }
  }
  return { findings };
}
