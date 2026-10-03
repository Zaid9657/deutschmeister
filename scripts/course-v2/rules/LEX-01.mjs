// LEX-01 — known-token coverage ≥ 95 % per input and exam text (≥ 98 % for the extensive strand);
// known = earlier units + this unit's lexicon (every inflected form, lexicon.mjs) + the closed A1 core
// and number words (core-lexicon.mjs) + forms the unit's grammar licenses (its spine points' rule-card
// examples, lexicon.mjs licensedForms) + cast names + the file's `extras` names (one-off speakers,
// SCHEMA §3.5) + glossed extras; a one-letter token is an option key, never a word
// (BLUEPRINT §9.1, §2.6). Hard once the cumulative lexicon exists up to the unit (every earlier
// level and every earlier unit of this level); before that the measurement is advisory — the SCHEMA
// §15.6 fixture row „LEX-01 … unknown tokens are reported as advisory".
//
// Rail extensions (rule-smith 2026-09-27): the unit's story.cliffhanger — the line a learner reads at the
// end of the unit, without an English twin — is measured like an input, as an ADVISORY (review a1.1-u04
// r2 F07, minor; it teases the next unit's words, and the other fix, an `en` twin or glosses, is the
// SCHEMA owner's); a
// compound of two known forms (compounds.mjs: „Radtour", „Möbelstücke") counts as known (reviews
// b1.2-u04 r1 F01, b2.2-u04 r1 F05); its allocation is LEX-03's advisory. The Folge's optional
// `glosses` (SCHEMA §8 Start) gloss the Folge like an input's.
//
// The surface walk (reviews a1.1-u04 r3 F05, r4 F04, r5 F03 — the class in its third round, BLUEPRINT
// §9.4): besides the inputs and exam texts, every German surface the learner must read to answer —
// items' promptDe, options and explanation.de; exam blocks' and speaking parts' instructionsDe; every
// situationDe; writing tasks' taskDe, Leitpunkte and checklist; micro-outputs' promptDe; title.canDo;
// step titles and endLines (lib-validate/metalanguage.mjs walkReadSurfaces). A content word there that is
// not known at the unit's position (allocated to a later unit, or to none) is glossed on that screen
// (the Folge's glosses for title.canDo, the step input's for its title, the block's text glosses for an
// exam block and its items) or is instruction metalanguage (metalanguage.mjs INSTRUCTION_METALANGUAGE).
// An error-correction prompt's quoted sentence is wrong on purpose and is not read. Severity follows
// the coverage rule: a blocker once the cumulative lexicon exists up to the unit, an advisory before —
// so the SCHEMA §15 worked example (a stub cumulative lexicon) reports advisories only and §15.6 holds.

import { walkTexts, walkSteps } from '../lib-validate/walk.mjs';
import { knownForms, lexiconComplete, readTokens, licensedForms, isKnown, entryForms, namesOf } from '../lib-validate/lexicon.mjs';
import { levelNumbers, arr, finding, pct, list } from '../lib-validate/helpers.mjs';

const str = (x) => (typeof x === 'string' ? x : '');
import { parseUnitId, describePosition, unitPosition } from '../lib-validate/ids.mjs';
import { unitDoc, allLexicon } from '../lib-validate/context.mjs';
import { knownCompound } from '../lib-validate/compounds.mjs';
import { walkReadSurfaces, isMetalanguage, taskNames, stripFragments, plantedForm } from '../lib-validate/metalanguage.mjs';

export const id = 'LEX-01';
export const title = 'Known-token coverage of inputs and exam texts (≥ 95 %; extensive ≥ 98 %); read surfaces use known words';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'S';

/** Gloss tokens, lower-cased; a multi-word token („Willkommen im Haus") glosses each of its words (a1.1-u05 r2 F08). */
export const glossSet = (glosses) => new Set(arr(glosses).flatMap((g) => {
  const w = String(g).toLowerCase().trim();
  return w.includes(' ') ? [w, ...w.split(/\s+/)] : [w];
}));

export function coverage(text, known, glosses = []) {
  const toks = readTokens(text);
  const gl = glossSet(glosses);
  const unknown = [];
  const knownForm = (w) => isKnown(w, known);
  for (const t of toks) if (!isKnown(t.lower, known) && !gl.has(t.lower) && !knownCompound(t.lower, knownForm)) unknown.push(t.text);
  return { total: toks.length, unknown, share: toks.length ? 1 - unknown.length / toks.length : 1 };
}

/**
 * The words of one read surface that are neither known, glossed on its screen, a compound of known parts
 * nor instruction metalanguage.
 */
export function unknownOnSurface(text, known, glosses = [], planted = null) {
  const gl = glossSet(glosses);
  const knownForm = (w) => isKnown(w, known);
  const out = [];
  for (const t of readTokens(stripFragments(text))) {
    if (isKnown(t.lower, known) || gl.has(t.lower) || isMetalanguage(t.lower) || knownCompound(t.lower, knownForm)) continue;
    if (planted && planted(t.lower)) continue;
    // a hyphenated word of known parts (Sie-Form, du-Form)
    if (t.lower.includes('-') && t.lower.split('-').every((w) => isKnown(w, known) || isMetalanguage(w) || gl.has(w))) continue;
    if (!out.includes(t.text)) out.push(t.text);
  }
  return out;
}

const allocCache = new WeakMap();
/** lower-case form → { id, unit } of the earliest lexicon entry that has it (for the message). */
function allocationIndex(ctx) {
  if (allocCache.has(ctx)) return allocCache.get(ctx);
  const m = new Map();
  for (const e of allLexicon(ctx)) {
    const p = unitPosition(e?.unit);
    if (p === null) continue;
    for (const f of entryForms(e).forms) {
      const prev = m.get(f);
      if (!prev || unitPosition(prev.unit) > p) m.set(f, { id: e.id, unit: e.unit });
    }
  }
  allocCache.set(ctx, m);
  return m;
}

/** Academic titles that stand in a person's name („Frau Doktor Sommer", „Dr. Klein"). */
const NAME_TITLES = new Set(['doktor', 'dr', 'professor', 'professorin', 'prof']);
/**
 * The title words of `text` that stand in a person's name — after the Anrede („Frau Doktor …", „Herrn Dr. …") or
 * before a name token (`names`: cast, extras, the names registry): part of the name, not a word to learn
 * (final code pass 2026-09-28: „Hier arbeitet Frau Doktor Sommer." in the hint of a1.1-u07 ls3-s01).
 */
export function nameTitles(text, names = new Set()) {
  const toks = readTokens(String(text || ''));
  const out = [];
  toks.forEach((t, i) => {
    if (!NAME_TITLES.has(t.lower) || !/^\p{Lu}/u.test(t.text)) return;
    const prev = toks[i - 1]?.lower;
    const next = toks[i + 1];
    if (['frau', 'herr', 'herrn'].includes(prev) || (next && /^\p{Lu}/u.test(next.text) && names.has(next.lower))) out.push(t.lower);
  });
  return out;
}

/** The unit position of a doc (a lane pack: its unit's). */
const here0 = (doc, unitData) => unitPosition(unitData?.id ?? doc.data?.unit ?? doc.data?.id);

const sepCache = new WeakMap();
/** Separable VERB entries allocated after `here`: [{ e, prefix, finite: Set }] (the split-form check). */
function laterSeparables(ctx, here) {
  if (here === null) return [];
  if (!sepCache.has(ctx)) {
    const all = [];
    for (const e of allLexicon(ctx)) {
      if (e?.pos !== 'VERB' || !e.separable) continue;
      const { forms, prefix } = entryForms(e);
      if (!prefix) continue;
      const finite = new Set([...forms].filter((f) => !f.startsWith(prefix) && !f.startsWith('ge') && f.length > 2));
      all.push({ e, prefix, finite, at: unitPosition(e.unit) });
    }
    sepCache.set(ctx, all);
  }
  return sepCache.get(ctx).filter((v) => v.at !== null && v.at > here);
}

const SURFACE_LABEL = {
  canDo: 'the can-do title', stepTitle: 'a step title', endLine: 'an endLine', prompt: 'a prompt', option: 'an option',
  explanation: 'an explanation', instructions: 'an instruction', situation: 'a situation', leitpunkt: 'a Leitpunkt', checklist: 'a checklist line',
  strategyCard: 'a strategy card', recap: 'the recap line', folgeTitle: 'the Folge title', lernziel: 'a Lernziele line',
  openingLine: 'the AI partner\'s opening line', rmFunction: 'a Redemittel label', ruleCard: 'a rule card',
  hint: 'a hint', inputTitle: 'an input title', ausspracheFocus: 'the Aussprache focus', blockTitle: 'a Wortschatz block title', fokus: 'a Fokus card',
};

/**
 * The rule cards a unit is the FIRST of its level to show (steps[].ruleCard), with their index in the
 * level's rule-cards.json: [{ card, index, file }]. A card shown first by another unit is that unit's.
 */
export function cardsFirstShownBy(ctx, doc) {
  const slot = ctx.levels.get(doc.level);
  const cards = arr(slot?.ruleCards?.cards);
  if (!cards.length || doc.kind !== 'unit') return [];
  const first = new Map();
  for (const u of slot.units.values()) {
    for (const { step } of walkSteps(u)) {
      if (!step?.ruleCard) continue;
      if (!first.has(step.ruleCard) || first.get(step.ruleCard) > u.nr) first.set(step.ruleCard, u.nr);
    }
  }
  return cards.map((card, index) => ({ card, index, file: slot.ruleCards.file })).filter((x) => first.get(x.card?.id) === doc.nr);
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let texts = 0;
  const cache = new Map();
  let surfaceHits = 0;
  const ownerSeen = new Set();
  for (const doc of docs) {
    const nr = doc.kind === 'unit' ? doc.nr : doc.kind === 'lanepack' ? parseUnitId(doc.data.unit)?.nr : 12;
    if (!ctx.levels.get(doc.level)?.lexicon) continue;
    const key = `${doc.level}|${nr}`;
    if (!cache.has(key)) cache.set(key, { known: knownForms(ctx, doc.level, nr), state: lexiconComplete(ctx, doc.level, nr) });
    const { known: base, state } = cache.get(key);
    const known = new Set(base);
    const unitData = doc.kind === 'unit' ? doc.data : doc.kind === 'lanepack' ? unitDoc(ctx, doc.data.unit)?.data : null;
    if (unitData) for (const f of licensedForms(ctx, unitData).forms) known.add(f);
    for (const [slug, x] of Object.entries(doc.data?.extras && typeof doc.data.extras === 'object' ? doc.data.extras : {})) {
      for (const t of readTokens(`${x?.name || ''} ${x?.nameDe || ''} ${slug.replace(/^x\./, '').replace(/-/g, ' ')}`)) known.add(t.lower);
    }
    const min = levelNumbers(ctx, doc.level).coverageMin;
    const surfaces = [...walkTexts(doc)];
    // story.glosses (SCHEMA §8, 2026-09-28) gloss the cliffhanger as the Folge's glosses gloss the Folge
    if (doc.kind === 'unit' && doc.data?.story?.cliffhanger) surfaces.push({ kind: 'story', de: String(doc.data.story.cliffhanger), path: 'story.cliffhanger', glosses: arr(doc.data.story.glosses).map((g) => String(g?.token ?? '')).filter(Boolean), step: null });
    for (const t of surfaces) {
      if (!t.de.trim()) continue;
      texts += 1;
      const need = t.kind === 'reward' ? 0.98 : min;
      const c = coverage(t.de, known, t.glosses);
      if (c.share + 1e-9 < need) {
        const severity = state.complete && t.kind !== 'story' ? 'blocker' : 'advisory';
        findings.push(finding(severity, doc, t.path, `known-token coverage ${pct(c.share)} (need ≥ ${pct(need)}); unknown: ${list([...new Set(c.unknown)], 12)}${state.complete ? '' : ` — advisory until the cumulative lexicon exists (${state.why})`}`, t.step?.id || t.block?.id || null));
      } else if (state.complete && (t.kind === 'input' || t.kind === 'folge') && c.unknown.length) {
        // a word no lexicon of any level allocates, unglossed, even where the text passes its threshold
        // (a1.1-u09 r3 F05: „Beides ist höflich …" in the Folge) — ADVISORY
        const nowhere = [...new Set(c.unknown)].filter((w) => !allocationIndex(ctx).has(w.toLowerCase()));
        if (nowhere.length) findings.push(finding('advisory', doc, t.path, `${list(nowhere.map((w) => `„${w}"`), 6)}: no lexicon of any level allocates it and nothing glosses it — gloss it, or ask the lexicon owner to allocate it (the text passes its coverage threshold)`, t.step?.id || null));
      }
      // a separable verb in split form („Olena macht auch mit.") that the lexicon allocates to a later unit:
      // its finite stem and its particle are each known, the verb is not (a1.1-u12 r1 F15 / r2 F11) — ADVISORY
      if (t.kind === 'input' || t.kind === 'folge' || t.kind === 'story') {
        for (const v of laterSeparables(ctx, here0(doc, unitData))) {
          for (const sent of String(t.de).split(/(?<=[.!?])\s+|\n/)) {
            const toks = readTokens(sent).map((x) => x.lower);
            if (toks[toks.length - 1] === v.prefix && toks.slice(0, -1).some((w) => v.finite.has(w))) {
              findings.push(finding('advisory', doc, t.path, `„${sent.trim().slice(0, 60)}" uses ${v.e.lemma} (${v.e.id}: ${v.e.unit}) in split form before its unit — the stem and the particle are known, the verb is not; gloss it or reword`, v.e.id));
              break;
            }
          }
        }
      }
    }
    // the surface walk: prompts, options, explanations, instructions, situations, Leitpunkte, checklist,
    // can-do title, step titles, endLines (r3 F05 / r4 F04 / r5 F03)
    const named = new Set(known);
    for (const n of taskNames(doc)) for (const t of readTokens(n)) named.add(t.lower);
    // person-name tokens (cast, the file's extras, the names registry, the AI partners): a title before one is the name's
    const personNames = new Set();
    for (const [, { member }] of ctx.registries.casts?.members || []) for (const t of readTokens(member?.name || '')) personNames.add(t.lower);
    for (const x of Object.values(doc.data?.extras && typeof doc.data.extras === 'object' ? doc.data.extras : {})) for (const t of readTokens(`${x?.name || ''} ${x?.nameDe || ''}`)) personNames.add(t.lower);
    for (const n of namesOf(ctx)) for (const t of readTokens(n.form)) personNames.add(t.lower);
    for (const n of taskNames(doc)) for (const t of readTokens(n)) personNames.add(t.lower);
    const alloc = allocationIndex(ctx);
    const here = unitPosition(unitData?.id ?? doc.data?.unit);
    const surfaces2 = [...walkReadSurfaces(doc, { cando: ctx.registries.cando })];
    // a rule card at its first use (a1.1-u02 r3 F07, u05 r2 F09 / r3 F06): its model sentence and the
    // table cells below the header are what the learner reads as German; its prose too — all advisory
    for (const { card, index, file } of cardsFirstShownBy(ctx, doc)) {
      const cdoc = { file };
      const at = `cards[${index}]`;
      if (str(card?.modelSentence)) surfaces2.push({ kind: 'ruleCard', de: card.modelSentence, path: `${at}.modelSentence`, id: card.id, glosses: [], extra: true, doc: cdoc });
      arr(card?.table).slice(1).forEach((row, r) => arr(row).forEach((cell, c) => {
        if (str(cell)) surfaces2.push({ kind: 'ruleCard', de: cell, path: `${at}.table[${r + 1}][${c}]`, id: card.id, glosses: [], extra: true, doc: cdoc });
      }));
      if (str(card?.de)) surfaces2.push({ kind: 'ruleCard', de: card.de, path: `${at}.de`, id: card.id, glosses: [], extra: true, doc: cdoc });
    }
    for (const sf of surfaces2) {
      if (!sf.de.trim()) continue;
      // a registry-owned line (the Lernziele text of a can-do) is reported once, at its registry
      if (sf.owner) {
        const k = `${sf.owner.file}|${sf.owner.path}`;
        if (ownerSeen.has(k)) continue;
        ownerSeen.add(k);
      }
      texts += 1;
      // a planted wrong form is no word to learn: a distractor option („Busfahrin", „Hoffman"), and the
      // explanation that names it („Busfahrin" → „Busfahrerin", a1.1-u10 ls3-p10)
      const plantedOk = sf.item && ((sf.kind === 'option' && String(sf.de).trim() !== String(sf.item.answer ?? '').trim()) || sf.kind === 'explanation');
      const planted = plantedOk ? (w) => !alloc.has(w) && plantedForm(w, sf.item) : null;
      const unknown = unknownOnSurface(sf.de, named, [...arr(sf.glosses), ...nameTitles(sf.de, personNames)], planted);
      if (!unknown.length) continue;
      surfaceHits += 1;
      const where = unknown.map((w) => {
        const a = alloc.get(w.toLowerCase());
        if (!a) return `„${w}" (no lexicon entry)`;
        const at = unitPosition(a.unit);
        return `„${w}" (${a.id}: ${at !== null && here !== null && at > here ? a.unit : `${a.unit}, not licensed here`})`;
      });
      // a surface whose screen shows its English twin (promptEn, explanation.en, a strategy card's en) is an
      // advisory; so is every surface the 2026-09-28 round added (`extra`, RAILS §3.1c)
      const twin = sf.twin || sf.kind === 'strategyCard';
      const severity = state.complete && !twin && !sf.extra ? 'blocker' : 'advisory';
      const tail = !state.complete ? ` — advisory until the cumulative lexicon exists (${state.why})` : twin ? ' — advisory: the screen shows its English twin' : sf.extra ? ' — advisory (a surface added by RAILS §3.1c)' : '';
      findings.push(finding(severity, sf.owner ? { file: sf.owner.file } : sf.doc || doc, sf.owner ? sf.owner.path : sf.path, `${SURFACE_LABEL[sf.kind] || sf.kind} uses a word not known at ${describePosition(here)}: ${list(where, 6)} — gloss it on that screen, reword with known words, or allocate it to this unit or earlier${tail}`, sf.id));
    }
  }
  if (surfaceHits) notes.push(`${surfaceHits} read surface(s) with an unknown word (metalanguage allowlist: lib-validate/metalanguage.mjs)`);
  return texts ? { findings, notes } : { findings, skipped: 'no lexicon.json for the target level yet, or no input text' };
}
