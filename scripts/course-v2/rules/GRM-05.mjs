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
//
// Fourth round (the a1.1 u07–u12 reviews, rule-smith 2026-09-28, RAILS §3.1c), at the card's first unit:
//   - a claim „Wörter/Nomen auf -X sind der|die|das" is checked against every lexicon noun in -X known there;
//     a counterexample the card does not name (an „Achtung:" line) is a RATCHET — the card teaches a false
//     rule (a1.1-u10 r1 F08 / r2 F02 / r3 F02: rc.wortbildung-er-in, die Mutter, das Wasser). A claim that
//     scopes itself („Nicht alle …", „meist", „Berufe auf -in") is not a claim of this form;
//   - an exhaustive Perfekt claim („die anderen Verben haben haben") is checked against verb_forms.perfekt of
//     every verb known there; an unnamed „ist …" verb is a RATCHET (a1.1-u12 r2 F10 / r3 F06: rc.perfekt-sein
//     with lx.aufstehen, lx.schwimmen); „die meisten anderen" qualifies it;
//   - a table header „Position N" (N ≥ 2) has a „Position N−1" column to its left, and no body cell under it
//     opens with a subject pronoun followed by a finite verb — RATCHET (a1.1-u11 r2 F01 / r3 F01:
//     rc.perfekt-haben);
//   - „Was spricht …?" as a question about languages is a calque on a card too (ITM-01's list, a1.1-u12 r2 F03:
//     rc.verbposition-2 table[4]) — ADVISORY;
//   - a card that places a word without condition („steht nach dem Verb") while an item of its point accepts
//     another order with acceptedWhy should qualify the rule („meist", „oft") — ADVISORY (a1.1-u08 r2 F07).

import { walkSteps, walkItems } from '../lib-validate/walk.mjs';
import { stripQuoted } from '../lib-validate/metalanguage.mjs';
import { wordCount, tokens, sentences, FUNCTION_WORDS, AUX_MODAL_FORMS } from '../lib-validate/text.mjs';
import { levelNumbers, arr, blocker, advisory, ratchet } from '../lib-validate/helpers.mjs';
import { endingContradictions } from '../lib-validate/claims.mjs';
import { entriesKnownAt } from '../lib-validate/lexicon.mjs';
import { calqueWasSprechen } from './ITM-01.mjs';

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

const GENDER_WORD = { der: 'der', die: 'die', das: 'das', maskulin: 'der', feminin: 'die', neutral: 'das', neutrum: 'das' };
const QUALIFIED_RE = /\b(?:nicht alle|nicht immer|meist|meistens|oft|häufig|viele|fast alle|die meisten|normalerweise|in der Regel)\b/iu;

/** „Wörter/Nomen auf -er sind der" claims in a card's prose: [{ suffix, article, sentence }]. */
export function suffixClaims(de) {
  const out = [];
  for (const s of sentences(String(de || ''))) {
    if (QUALIFIED_RE.test(s)) continue;
    for (const m of s.matchAll(/(?:Wörter|Nomen|Substantive)\s+(?:mit\s+der\s+Endung\s+|auf\s+)[„"‚]?-(\p{Ll}+)[“"‘]?\s+(?:sind|haben)\s+(?:immer\s+)?(?:den\s+Artikel\s+)?[„"‚]?(der|die|das|maskulin|feminin|neutral|neutrum)\b/giu)) {
      out.push({ suffix: m[1].toLowerCase(), article: GENDER_WORD[m[2].toLowerCase()], sentence: s });
    }
  }
  return out;
}

/** Nouns in -suffix known at the card's first unit whose article is not the claimed one, and the card does not name. */
export function suffixCounterexamples(claim, entries, card) {
  const named = new Set(tokens([card?.de, card?.en].join(' ')).map((t) => t.lower));
  const out = [];
  for (const e of entries) {
    if (e?.pos !== 'NOUN' || !e.article || !e.lemma) continue;
    const lemma = String(e.lemma).replace(/^(?:der|die|das)\s+/i, '');
    if (!lemma.toLowerCase().endsWith(claim.suffix) || lemma.length <= claim.suffix.length + 1) continue;
    if (e.article === claim.article || named.has(lemma.toLowerCase())) continue;
    out.push(`${e.article} ${lemma}`);
  }
  return [...new Set(out)];
}

/** An exhaustive „die anderen Verben haben haben" claim: its sentence, or null. */
export function exhaustivePerfektClaim(de) {
  for (const s of sentences(String(de || ''))) {
    if (/\b(?:alle\s+)?(?:die\s+)?anderen\s+Verben\b[^.]*\bhaben\b/iu.test(s) && !QUALIFIED_RE.test(s)) return s;
    if (/\balle\s+Verben\b[^.]*\bPerfekt\s+mit\s+haben\b/iu.test(s) && !QUALIFIED_RE.test(s)) return s;
  }
  return null;
}

/** Verbs known at the card's first unit whose Perfekt takes sein and whose infinitive or participle the card does not name. */
export function unnamedSeinVerbs(entries, card) {
  const named = new Set(tokens([card?.de, card?.modelSentence, ...arr(card?.table).flat()].join(' ')).map((t) => t.lower));
  const out = [];
  for (const e of entries) {
    const perf = String(e?.verb_forms?.perfekt || '');
    if (e?.pos !== 'VERB' || !/^(?:ist|sind)\s/.test(perf)) continue;
    const part = perf.split(/\s+/).pop().toLowerCase();
    if (named.has(String(e.lemma).toLowerCase()) || named.has(part)) continue;
    out.push(e.lemma);
  }
  return [...new Set(out)];
}

const SUBJECT_PRONOUNS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr']);
/** Problems of a card table's „Position N" header: a missing N−1 column, a body cell „ich habe" under Position N ≥ 2. */
export function positionColumnProblems(table) {
  const head = arr(table?.[0]).map((h) => String(h ?? ''));
  const out = [];
  head.forEach((h, i) => {
    // a column header that IS a position („Position 2", „Position 2: Verb"), not one that mentions one
    const m = h.match(/^\s*Position\s*(\d+)/i);
    if (!m || Number(m[1]) < 2) return;
    const nn = Number(m[1]);
    if (!head.slice(0, i).some((x) => new RegExp(`Position\\s*${nn - 1}(?!\\d)`, 'i').test(x))) out.push(`the column „${h}" has no „Position ${nn - 1}" column to its left`);
    for (const [r, row] of arr(table).slice(1).entries()) {
      const toks = tokens(String(arr(row)[i] ?? ''));
      if (toks.length >= 2 && SUBJECT_PRONOUNS.has(toks[0].lower) && (AUX_MODAL_FORMS.has(toks[1].lower) || (/^\p{Ll}+(?:e|st|t|en)$/u.test(toks[1].text) && !/^ge/.test(toks[1].lower) && !FUNCTION_WORDS.has(toks[1].lower)))) {
        out.push(`row ${r + 1} puts „${toks[0].text} ${toks[1].text}" (subject and verb) under „${h}"`);
      }
    }
  });
  return out;
}

// „nicht steht nach dem Verb", „„gern" steht am Ende": a small word placed without condition (a verb, a
// participle or an infinitive placed at the end is the sentence bracket, which no Vorfeld order moves)
const PLACEMENT_RE = /(?:^|[:;]\s*|\bWort\s+)[„"‚]?(\p{Ll}+)[“"‘]?\s+steht\s+(?:immer\s+)?(?:direkt\s+)?(?:(?:nach|vor|hinter)\s+dem\s+(?:Verb|Subjekt|Objekt)|am\s+(?:Satzende|Ende))/u;
/** An unconditioned placement of a card („nicht steht nach dem Verb"): { word, sentence }, or null. */
export function unconditionedPlacement(de) {
  for (const s of sentences(String(de || ''))) {
    const m = s.match(PLACEMENT_RE);
    if (m && !QUALIFIED_RE.test(s)) return { word: m[1], sentence: s };
  }
  return null;
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
    // fourth round: claims checked at the card's first unit
    if (!uses.has(level)) uses.set(level, firstUses(ctx.levels.get(level)));
    const firstDoc = uses.get(level).get(card?.id);
    const firstNr = Number(String(firstDoc?.id || '').match(/-u(\d+)$/)?.[1]) || null;
    if (firstNr) {
      const known = entriesKnownAt(ctx, level, firstNr);
      for (const claim of suffixClaims(card?.de)) {
        const counter = suffixCounterexamples(claim, known, card);
        if (counter.length) findings.push(ratchet(doc, `${p}.de`, `„${claim.sentence.slice(0, 70)}" — but ${counter.slice(0, 4).join(', ')}${counter.length > 4 ? ` (+${counter.length - 4})` : ''} ${counter.length > 1 ? 'are' : 'is'} known at ${firstDoc.id}, the card's first use; scope the claim or name the exceptions in an „Achtung:" line`, card.id));
      }
      const exhaustive = exhaustivePerfektClaim(card?.de);
      if (exhaustive) {
        const sein = unnamedSeinVerbs(known, card);
        if (sein.length) findings.push(ratchet(doc, `${p}.de`, `„${exhaustive.slice(0, 70)}" — but ${sein.slice(0, 5).map((v) => `„${v}"`).join(', ')}${sein.length > 5 ? ` (+${sein.length - 5})` : ''} (known at ${firstDoc.id}) ${sein.length > 1 ? 'form' : 'forms'} the Perfekt with sein; name them or qualify the claim („die meisten anderen")`, card.id));
      }
    }
    for (const problem of positionColumnProblems(card?.table)) findings.push(ratchet(doc, `${p}.table`, `${problem} — the table teaches a position the sentence does not have`, card?.id));
    const calque = [card?.de, card?.modelSentence, ...arr(card?.table).map((r) => arr(r).join(' '))].find((x) => calqueWasSprechen(x));
    if (calque) findings.push(advisory(doc, p, `„${String(calque).slice(0, 60)}" — „Was spricht …?" is a calque; ask „Welche Sprache(n) spricht …?"`, card?.id));
    const placement = unconditionedPlacement(card?.de);
    if (placement && card?.spine) {
      const slot = ctx.levels.get(level);
      const alt = [];
      const word = placement.word.toLowerCase();
      for (const u of slot?.units?.values() || []) {
        for (const { item, path: ip } of walkItems(u)) {
          if (item?.topic !== card.spine || !item.acceptedWhy) continue;
          if (Object.keys(item.acceptedWhy).some((form) => tokens(form).some((t) => t.lower === word))) alt.push(`${u.data?.id} ${ip}`);
        }
      }
      if (alt.length) findings.push(advisory(doc, `${p}.de`, `„${placement.sentence.slice(0, 70)}" places „${placement.word}" without condition, but ${alt.length} item(s) of ${card.spine} accept another place for it with acceptedWhy (${alt[0]}) — qualify the rule („meist", „oft")`, card.id));
    }
    // the chunk of the card's first unit, where the spine contrasts it with the card's point (r5 F04)
    if (spine && card?.id) {
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
