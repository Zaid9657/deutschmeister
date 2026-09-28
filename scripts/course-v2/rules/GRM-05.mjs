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
//
// Third round (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c):
//   - a German form the card cites in its prose is quoted („du", „ist"), as ITM-11 asks of explanations: a
//     form of the card's own table (below its header) standing unquoted in the prose is an ADVISORY
//     (a1.1-u01 r1 F06 / r2 F04, u03 r2 F07 / r3 F08 — rc.praesens, rc.possessiv-mein-dein);
//   - a form a unit drills in ≥ 2 typed items under a spine point appears in that point's label or on its
//     rule card (text, table, model sentence) — the learner is drilled on a form nobody showed: ADVISORY
//     (a1.1-u06 r2 F06 / r3 F07: meinen/deinen under g.akkusativ).

import { walkSteps, walkItems } from '../lib-validate/walk.mjs';
import { stripQuoted } from '../lib-validate/metalanguage.mjs';
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

/** Forms of the card's table (below the header) that its prose cites without quotes. */
export function unquotedForms(card) {
  const forms = new Set();
  for (const row of arr(card?.table).slice(1)) {
    for (const cell of arr(row)) for (const t of tokens(cell)) if (t.text.length >= 2 && /^\p{Ll}/u.test(t.text) && !/\d/.test(t.text)) forms.add(t.lower);
  }
  const prose = stripQuoted(String(card?.de || '')).replace(/\([^)]*\)/g, ' ');
  const out = [];
  for (const t of tokens(prose)) {
    // a pronoun or article in running prose is prose („Nach du …" is a citation, „Sie lernen …" is not):
    // only a form whose token is no function word of the prose sentence counts, or a form after „nach/mit/bei"
    if (!forms.has(t.text) || out.includes(t.text)) continue;
    if (FUNCTION_WORDS.has(t.lower) && !/(?:nach|mit|bei|vor|zu|für)\s+$/i.test(prose.slice(Math.max(0, t.index - 6), t.index))) continue;
    out.push(t.text);
  }
  return out;
}

/** Forms a unit drills in ≥ 2 typed one-word items per spine point: Map(point → Map(form → count)). */
export function drilledForms(doc) {
  const m = new Map();
  for (const { item } of walkItems(doc)) {
    if (!item || item.type !== 'fill_blank' || arr(item.options).length || !String(item.topic || '').startsWith('g.')) continue;
    const key = String(item.answer || '').trim().toLowerCase();
    if (!key || /\s/.test(key)) continue;
    if (!m.has(item.topic)) m.set(item.topic, new Map());
    const f = m.get(item.topic);
    f.set(key, (f.get(key) || 0) + 1);
  }
  return m;
}

export function run({ ctx, docs, levels, mode }) {
  const findings = [];
  // drilled forms shown on the label or a card of their point (u06 r2 F06 / r3 F07)
  const spineById = ctx.registries.spine?.byId || null;
  if (spineById) {
    const allCards = [];
    for (const slot of ctx.levels.values()) for (const c of arr(slot.ruleCards?.cards)) allCards.push(c);
    for (const doc of docs) {
      if (doc.kind !== 'unit') continue;
      for (const [pid, forms] of drilledForms(doc)) {
        const point = spineById.get(pid)?.point;
        if (!point) continue;
        const cardIds = new Set(arr(point.ruleCards));
        const shown = [point.label, ...allCards.filter((c) => c?.spine === pid || cardIds.has(c?.id)).flatMap((c) => [c.de, c.modelSentence, ...arr(c.table).flat()])].map((x) => String(x ?? '')).join(' ');
        const seen = new Set(tokens(shown).map((t) => t.lower));
        const missing = [...forms].filter(([f, k]) => k >= 2 && !seen.has(f)).map(([f]) => f);
        if (missing.length) findings.push(advisory(doc, 'spec.grammar', `${missing.map((f) => `„${f}"`).join(', ')} ${missing.length > 1 ? 'are' : 'is'} drilled in ≥ 2 typed items under ${pid}, but neither its label nor its rule card shows ${missing.length > 1 ? 'them' : 'it'} — add the form to the card (owner: the rule-cards file) or drill a form the card shows`, pid));
      }
    }
  }
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
  if (!cards.length) return findings.length ? { findings } : { findings, skipped: 'no rule cards for the target yet (rule-cards.json)' };
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
    const unquoted = unquotedForms(card);
    if (unquoted.length) findings.push(advisory(doc, `${p}.de`, `the prose cites ${unquoted.slice(0, 5).map((f) => `„${f}"`).join(', ')} from the card's own table without quotes — quote a cited form („du", „ist"), as explanations do`, card?.id));
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
