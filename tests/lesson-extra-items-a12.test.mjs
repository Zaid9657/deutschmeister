// Guard suite for the hand-written situational practice items of A1.2
// (src/data/lessonPools/a12.extra.json).
//
// WHY IT EXISTS. The A1.2 hand-over (docs/course-factory/a12-rebuild/CONTRACT.md
// §5) measured what the legacy grammar bank can supply per Lektion after
// quality.js filtering, and one Lektion cannot be staffed from it at all:
// `negation` keeps 4 of 21 items — 13 fail NEGATION_WITHOUT_CUE, the very first
// BLOCKER of DaF review #1 — and 4 is exactly PRIMARY_MIN, so L4 would repeat
// the same four items on every attempt. The other eleven Lektionen can fill
// their seven, but out of drill items that mention nothing from their own
// situation, which is the finding the A1.1 reviews spent four rounds on.
// This file closes both gaps by hand, and this suite pins what can go wrong
// quietly afterwards: an item that trips a quality rule (the build drops it and
// the Lektion silently thins out), an item that uses a word A1.1 and the earlier
// A1.2 Lektionen have not taught (RULE 11, whose A1.2 ratchet is 0), an item
// that mentions no Wortfeld word (`relevanceScore` ranks it with the legacy
// drill and it is never drawn), and an item that carries a Lektion's topic
// label without practising its grammar point (`drillsSlug`, below).
//
// THE POOL IS NOW BUILT. `node scripts/build-lesson-pool.mjs a1.2` writes
// `src/data/lessonPools/a12.json` (238 kept legacy items + these 116), and the
// two tests this file used to defer — "the shipped pool contains them" and
// "THE DRAW" — stand at the bottom. They are the ones that measure what the
// learner is actually served: the draw is seeded, so an item that fails a
// quality rule, loses its id or stops drilling its slug changes the drawn seven
// of a Lektion without changing anything visible in this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { exclusionReason, answerInPrompt, isMetaPrompt } from '../src/data/lessonPools/quality.js';
import {
  planPractice, relevanceScore, wortfeldTerms, isTypedItem, isMultipleChoice,
  PRACTICE_SIZE, MAX_MULTIPLE_CHOICE, PRIMARY_MIN,
} from '../src/lib/lesson/buildLesson.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { itemLexis } from '../scripts/validate-curriculum.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const EXTRA = read('src/data/lessonPools/a12.extra.json').items;
const POOL = read('src/data/lessonPools/a12.json');

/** The level every rule below is measured at — three of quality.js's rules are level-scoped. */
const LEVEL = { level: 'a1.2' };

/**
 * How many hand-written items each Lektion carries. Seven is the practice size,
 * so eight is "one more than a full draw"; the three Lektionen at ten are the
 * ones the contract singles out — L4 because the legacy bank supplies four
 * usable `negation` items, L3 and L12 because `accusative-intro` and
 * `perfekt-intro` are the two points every later Lektion builds on.
 */
const MIN_PER_LEKTION = 8;
const MIN_PER_LEKTION_THIN = { 3: 10, 4: 10, 12: 10 };
const MIN_TOTAL = 100;
/** Per Lektion, how many items must really drill its primary slug (see drillsSlug). */
const MIN_DRILLING = 6;

const SENTENCE_INITIAL_GAP_RE = /(^|[.!?:—]\s*[„"]?\s*)___/;
const ARTICLE_TASK_CUE_RE =
  /\(\s*(?:un)?bestimmter\s+artikel\s*\)|\(\s*der,\s*die\s+oder\s+das\s*\?\s*\)/i;
const BARE_ARTICLES = new Set(['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen']);
const ABSOLUTE_CLAIM_RE = /%|\b100\b|\bimmer\b|ohne\s+Ausnahme/i;

const lektion = (nr) => CURRICULUM_A12.lektionen.find((l) => l.nr === nr);
const target = (item) => {
  const m = /^extra-a12-l(\d\d)-\d\d$/.exec(String(item.id));
  const l = m && lektion(Number(m[1]));
  return l ? { nr: l.nr, topic: l.primarySlug } : null;
};
const byLektion = () => {
  const per = new Map();
  for (const item of EXTRA) {
    const nr = target(item).nr;
    per.set(nr, [...(per.get(nr) || []), item]);
  }
  return per;
};

test('every extra item is addressed to a Lektion of A1.2, with a unique id', () => {
  assert.ok(EXTRA.length >= MIN_TOTAL, `only ${EXTRA.length} extra items`);
  assert.equal(new Set(EXTRA.map((i) => i.id)).size, EXTRA.length, 'duplicate id');
  for (const item of EXTRA) {
    assert.match(item.id, /^extra-a12-l\d\d-\d\d$/, `${item.id} is not an extra-a12 id`);
    assert.ok(target(item), `${item.id} does not name a Lektion`);
  }
  for (const l of CURRICULUM_A12.lektionen) {
    const count = (byLektion().get(l.nr) || []).length;
    const floor = MIN_PER_LEKTION_THIN[l.nr] || MIN_PER_LEKTION;
    assert.ok(count >= floor, `L${l.nr} (${l.primarySlug}) has only ${count} extra items, needs ${floor}`);
  }
});

test('every extra item passes the pool quality rules at level a1.2', () => {
  for (const item of EXTRA) {
    assert.equal(exclusionReason(item, LEVEL), null,
      `${item.id} is excluded: ${exclusionReason(item, LEVEL)}`);
  }
});

test('no extra item gives its answer away or hides its task in the English gloss', () => {
  for (const item of EXTRA) {
    assert.equal(answerInPrompt(item), false, `${item.id}: the answer stands in its own prompt`);
    assert.equal(isMetaPrompt(item), false, `${item.id}: the German prompt carries no task`);
  }
});

test('every extra item has the Lektion topic, the pool shape and typed production', () => {
  for (const item of EXTRA) {
    assert.equal(item.topic, target(item).topic, `${item.id} is on the wrong topic`);
    assert.ok(['fill_blank', 'sentence_building', 'error_correction'].includes(item.type), `${item.id}: ${item.type}`);
    assert.equal(item.options, null, `${item.id} carries options — that would make it recognition`);
    assert.ok(isTypedItem(item), `${item.id} is not typed production`);
    assert.ok([4, 5].includes(item.stage), `${item.id} stage ${item.stage}`);
    assert.ok(item.difficulty >= 1 && item.difficulty <= 2, `${item.id} difficulty ${item.difficulty}`);
    assert.ok(item.questionDe && item.questionEn, `${item.id} misses a prompt`);
    assert.ok(item.answer && Array.isArray(item.accepted) && item.accepted.includes(item.answer), `${item.id} answer/accepted`);
    assert.ok(item.explanationDe, `${item.id} has no explanation`);
    // The A1.1 rule (REVIEW #4 BLOCKER 3, re-cut by REVIEW #5 BLOCKER 3), in
    // both directions: an item whose TASK is the capital letter — the höfliche
    // „Sie/Ihnen“ — is caseSensitive and may not accept a case-variant of its
    // own answer; an unflagged gap that OPENS a sentence must accept the
    // lowercase form, because there the capital is only the sentence opening.
    if ('caseSensitive' in item) {
      assert.equal(typeof item.caseSensitive, 'boolean', `${item.id}: caseSensitive must be a boolean`);
      assert.ok(
        item.accepted.every((a) => a === item.answer || String(a).toLowerCase() !== String(item.answer).toLowerCase()),
        `${item.id} is caseSensitive but still accepts a case-variant of its own answer`,
      );
      assert.match(item.explanationDe, /groß|Groß/,
        `${item.id} is caseSensitive but its explanation does not name the capital letter`);
    } else if (item.type === 'fill_blank' && SENTENCE_INITIAL_GAP_RE.test(item.questionDe)
               && item.answer !== String(item.answer).toLowerCase()) {
      assert.ok(item.accepted.includes(String(item.answer).toLowerCase()),
        `${item.id}: the gap opens the sentence, so the lowercase form is not a mistake — accept it or set caseSensitive`);
    }
    const words = item.explanationDe.trim().split(/\s+/).length;
    assert.ok(words <= 15, `${item.id} explanation is ${words} words`);
    assert.doesNotMatch(`${item.questionDe} ${item.answer}`, /\b(the|you|your|is|are|does|do|have)\b/i,
      `${item.id} has English in a German field`);
  }
});

test('no explanation makes a percentage or an absolute claim', () => {
  for (const item of EXTRA) {
    assert.doesNotMatch(item.explanationDe, ABSOLUTE_CLAIM_RE,
      `${item.id} claims an absolute or a percentage: ${item.explanationDe}`);
  }
});

test('an article task formula and the answer key agree', () => {
  for (const item of EXTRA) {
    const expected = [item.answer, ...(item.accepted || [])]
      .map((a) => String(a).replace(/[.,!?;:"“”„'’]/g, '').trim().toLowerCase());
    const cued = ARTICLE_TASK_CUE_RE.test(item.questionDe);
    if (cued) {
      assert.ok(expected.some((a) => BARE_ARTICLES.has(a)),
        `${item.id} asks for an article by formula but accepts only ${expected.join('/')}`);
    }
    if (expected.every((a) => BARE_ARTICLES.has(a))) {
      assert.ok(cued, `${item.id} wants a bare article and its German prompt never says so`);
    }
  }
});

test('every extra item mentions a Wortfeld word of its Lektion — or it would never be drawn', () => {
  for (const item of EXTRA) {
    const terms = wortfeldTerms(lektion(target(item).nr));
    const score = relevanceScore(item, terms, new Set());
    assert.ok(score > 0, `${item.id} scores 0 relevance for L${target(item).nr}`);
  }
});

test('RULE 11 — no extra item uses a word A1.1 or an earlier A1.2 Lektion has not taught', () => {
  // The same machinery `node scripts/validate-curriculum.mjs a1.2` runs, so the
  // ratchet (0, and it may only ever stay 0) and this suite cannot disagree: an
  // item's prompt, answer and accepted forms are tokenised and checked against
  // the cumulative Wortfeld A1.1 ∪ A1.2≤N, the notice cards, the closed
  // FUNCTION_WORDS list of a12.js and the dialogue names. Bracketed cues and the
  // Sie-Aufgabenformeln are stripped first — a cue is a task, not lexis — which
  // is why a new task formula has to be one of the strings ITEM_FORMULA_RE
  // knows, or its own words start counting as vocabulary the learner must have
  // been taught.
  //
  // The third argument is the POOL half of `itemLexis`, and it is passed EMPTY on
  // purpose: since `src/data/lessonPools/a12.json` exists, the default would load
  // it and measure the 238 legacy bank items too. Those are a different finding
  // with a different owner — RULE 11 over the built pool is what A1.1's ratchet of
  // 187 counts, and A1.2 measures 156 the day its pool lands (run
  // `node scripts/validate-curriculum.mjs a1.2`). This suite is about the 116
  // items written by hand, and for those the bar is zero, not a ratchet.
  const offenders = itemLexis(CURRICULUM_A12, EXTRA, []);
  assert.deepEqual(offenders.map((o) => `${o.id}:${o.token}`), [],
    'untaught tokens in the hand-written A1.2 items');
});

/**
 * R4 — "really drills the primary slug", the measurement DaF review #3 asked
 * for: a `topic` mark is a ROUTING label, not a description of the item, so the
 * guarantee "the Lektion practises its own grammar point" has to be read off
 * the ANSWER — what the learner actually has to produce.
 *
 * The twelve predicates below are A1.2's. `drillsSlug` in
 * src/data/lessonPools/quality.js carries the A1.1 table and answers `true` for
 * every slug it does not know, i.e. for all twelve of these — a vacuous pass is
 * not a measurement, so the predicates live here until that table grows an A1.2
 * half. When it does, delete this block and import it; the semantics per slug
 * are named in the comment on each entry so the two cannot drift silently.
 */
const flat = (text) =>
  String(text || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const bare = (text) => String(text || '').replace(/[.,!?;:"“”„'’]/g, '').trim();
const wordsFlat = (text) => flat(text).split(/[^a-z0-9]+/).filter(Boolean);
const set = (...list) => new Set(list.map((w) => flat(w)));
const isOneOf = (text, allowed) => allowed.has(flat(bare(text)));
const containsOneOf = (text, allowed) => wordsFlat(text).some((w) => allowed.has(w));
/** The learner writes the whole sentence, so its word order is his. */
const PRODUCTION_TYPES = new Set(['sentence_building', 'error_correction']);
const INFINITIVE_CUE_RE = /\([^)]*[a-zäöüß]{2}en\b[^)]*\)/i;

/** Finite verb forms an A1.2 Wegbeschreibung puts on position 2. */
const FINITE_V2 = set(
  'gehe', 'gehst', 'geht', 'gehen', 'komme', 'kommst', 'kommt', 'kommen',
  'fahre', 'fährst', 'fährt', 'fahren', 'bin', 'bist', 'ist', 'sind', 'habe', 'hast', 'hat', 'haben',
);
const NUMBER_WORD_RE =
  /^(null|eins|ein|zwei|drei|vier|fuenf|sechs|sieben|acht|neun|zehn|elf|zwoelf|(?:drei|vier|fuenf|sech|sieb|acht|neun)zehn|(?:zwan|drei|vier|fuenf|sech|sieb|acht|neun)zig|dreissig|hundert)/;
const COMPOUND_NUMBER_RE = /^[a-z]*(?:und(?:zwanzig|dreissig|vierzig|fuenfzig|sechzig|siebzig|achtzig|neunzig)|hundert[a-z]*)$/;
const ORDINAL_WORD_RE =
  /^(erste|zweite|dritte|vierte|fuenfte|sechste|siebte|achte|neunte|zehnte|elfte|zwoelfte|zwanzigste)[nrms]?$/;
const AKKUSATIV = set('den', 'einen', 'keinen', 'meinen', 'deinen', 'ihren', 'seinen');
const NEGATION = set('nicht', 'kein', 'keine', 'keinen', 'keinem', 'keiner');
const W_WORDS = set('wer', 'was', 'wo', 'wohin', 'woher', 'wann', 'warum', 'wie');
const STEM_CHANGED = set(
  'nimmst', 'nimmt', 'hilfst', 'hilft', 'siehst', 'sieht', 'isst', 'schlaefst', 'schlaeft',
  'sprichst', 'spricht', 'faehrst', 'faehrt', 'traegst', 'traegt', 'laeufst', 'laeuft', 'liest', 'gibt',
);
const NOM_DETERMINER = set('der', 'die', 'das', 'ein', 'eine', 'mein', 'meine', 'dein', 'deine', 'sein', 'seine', 'ihr', 'ihre');
const SEIN_FINITE = set('ist', 'sind', 'bin', 'bist');
const DU_IMPERATIVE_RE =
  /^(komm|warte|hilf|mach|hol|geh|nimm|sei|gib|kauf|frag|lies|steh|zieh|sieh|iss|bezahl|trag|lauf|flieg|trink|koch|feier)e?$/;
const MODALS = set(
  'kann', 'kannst', 'koennen', 'koennt', 'muss', 'musst', 'muessen', 'muesst',
  'darf', 'darfst', 'duerfen', 'duerft', 'will', 'willst', 'wollen', 'wollt',
  'soll', 'sollst', 'sollen', 'sollt', 'moechte', 'moechtest', 'moechten',
);
const AKK_PREPOSITIONS = set('fuer', 'ohne', 'gegen', 'um', 'durch');
const DAT_PREPOSITIONS = set('mit', 'nach', 'bei', 'seit', 'von', 'zu', 'aus');
const DAT_ARTICLES = set('dem', 'der', 'den', 'einem', 'einer');
const VERSCHMELZUNG = set('im', 'am', 'beim', 'zum', 'zur', 'vom');
const PARTICIPLE_RE = /^ge[a-z]+(t|en)$/;

const DRILLS_A12 = {
  // L1 — the Satzrahmen: the learner writes the whole sentence and puts the
  // finite verb on position 2 (which is token 1 after a one-word Angabe, token 2
  // after a two-word one). A gap in a printed frame cannot drill word order, so
  // the production types are required.
  'basic-sentence-structure': ({ type, expected }) =>
    PRODUCTION_TYPES.has(type) && expected.some((a) => {
      const toks = wordsFlat(bare(a));
      const at = toks.findIndex((t) => FINITE_V2.has(t));
      return at === 1 || at === 2;
    }),

  // L2 — the number word, derived from a digit that stands in the GERMAN prompt
  // (the A1.1 lesson of REVIEW #5 MAJOR 13: a digit in the English gloss is not
  // a cue). Ordinals count: the notice teaches -te/-ste in the same card.
  'numbers-counting': ({ q, expected }) =>
    /\d/.test(q) && expected.some((a) => {
      const w = flat(bare(a));
      return COMPOUND_NUMBER_RE.test(w) || ORDINAL_WORD_RE.test(w) || NUMBER_WORD_RE.test(w);
    }),

  // L3 — the Akkusativ is visible only on the masculine: den/einen/keinen, as a
  // bare form, as an article+noun chunk or inside a whole sentence.
  'accusative-intro': ({ expected }) =>
    expected.some((a) => isOneOf(a, AKKUSATIV) || containsOneOf(a, AKKUSATIV)),

  // L4 — the learner produces the negation itself: nicht, or a kein- form.
  'negation': ({ expected }) =>
    expected.some((a) => isOneOf(a, NEGATION) || containsOneOf(a, NEGATION)),

  // L5 — the W-word, or the whole question that opens with one.
  'question-words': ({ expected }) =>
    expected.some((a) => {
      const toks = wordsFlat(bare(a));
      return toks.length > 0 && W_WORDS.has(toks[0]);
    }),

  // L6 — the CHANGED form (nimmt, hilft, sieht …). The Sie-form shows no change,
  // so it does not count; and the prompt has to name the infinitive, or several
  // verbs fit the gap.
  'stem-changing-verbs': ({ q, type, expected }) =>
    (INFINITIVE_CUE_RE.test(q) || PRODUCTION_TYPES.has(type)) &&
    expected.some((a) => isOneOf(a, STEM_CHANGED) || containsOneOf(a, STEM_CHANGED)),

  // L7 — the question after the subject (wer), a bare nominative article, or the
  // Gleichsetzung with sein, where the second noun keeps the nominative.
  'nominative-case': ({ expected }) =>
    expected.some((a) => {
      const toks = wordsFlat(bare(a));
      if (!toks.length) return false;
      if (toks[0] === 'wer') return true;
      if (isOneOf(a, set('der', 'die', 'das'))) return true;
      return toks.some((t) => SEIN_FINITE.has(t)) && toks.some((t) => NOM_DETERMINER.has(t));
    }),

  // L8 — the imperative form: the bare du-form, or the Sie-form (verb on -en
  // followed by Sie), at the start of what the learner writes. The third clause
  // is the gap version of the second — „___ Sie mir bitte! (helfen)“ → `Helfen`:
  // the `Sie` stands in the PROMPT, so the answer is one word and the two-token
  // test would call the Lektion's own höfliche Bitte a non-instance.
  'imperative': ({ q, expected }) =>
    expected.some((a) => {
      const plain = bare(a);
      const toks = wordsFlat(plain);
      if (!toks.length) return false;
      if (DU_IMPERATIVE_RE.test(toks[0])) return true;
      if (/en$/.test(toks[0]) && toks[1] === 'sie') return true;
      return toks.length === 1 && /en$/.test(toks[0]) && /___\s+Sie\b/.test(q);
    }),

  // L9 — the Satzklammer: a finite modal, alone in a gap, or on position 2 of a
  // sentence whose last word is the infinitive.
  'modal-verbs-intro': ({ expected }) =>
    expected.some((a) => {
      const toks = wordsFlat(bare(a));
      if (!toks.length) return false;
      if (toks.length === 1) return MODALS.has(toks[0]);
      const last = toks[toks.length - 1];
      return toks.some((t) => MODALS.has(t)) && /en$/.test(last);
    }),

  // L10 — the preposition itself, or a sentence carrying one with its Akkusativ.
  'prepositions-accusative': ({ expected }) =>
    expected.some((a) => isOneOf(a, AKK_PREPOSITIONS) || containsOneOf(a, AKK_PREPOSITIONS)),

  // L11 — the Dativ chunk the notice teaches: a verschmolzene form (im, am, zum,
  // zur, vom, beim) or preposition + Dativ article.
  'dative-prepositions-intro': ({ expected }) =>
    expected.some((a) => {
      const toks = wordsFlat(bare(a));
      if (toks.some((t) => VERSCHMELZUNG.has(t))) return true;
      return toks.some((t, i) => DAT_PREPOSITIONS.has(t) && toks[i + 1] && DAT_ARTICLES.has(toks[i + 1]));
    }),

  // L12 — the Partizip II, alone or at the end of the sentence.
  'perfekt-intro': ({ expected }) =>
    expected.some((a) => wordsFlat(bare(a)).some((t) => PARTICIPLE_RE.test(t))),
};

export function drillsSlugA12(item, slug) {
  const rule = DRILLS_A12[String(slug || '')];
  assert.ok(rule, `no A1.2 predicate for slug ${slug}`);
  if (!item) return false;
  const answer = String(item.answer || '');
  const expected = [answer, ...(item.accepted || [])].filter((a) => String(a).trim());
  return Boolean(rule({
    q: String(item.questionDe || ''), type: String(item.type || ''), answer, expected,
  }));
}

test('R4 — each Lektion drills its own grammar point, measured on the answer', () => {
  const per = byLektion();
  const lines = [];
  let drilled = 0;
  for (const nr of [...per.keys()].sort((a, b) => a - b)) {
    const list = per.get(nr);
    const slug = lektion(nr).primarySlug;
    const hits = list.filter((i) => drillsSlugA12(i, slug));
    lines.push(`L${String(nr).padStart(2)} ${slug} — ${hits.length}/${list.length}`);
    assert.ok(hits.length >= MIN_DRILLING,
      `L${nr} has only ${hits.length} items that drill ${slug}, needs ${MIN_DRILLING}`);
    drilled += hits.length;
  }
  console.log(`\n${lines.join('\n')}\n`);
  // A floor on the batch as a whole: the per-Lektion floor above is the
  // guarantee, this one catches a wholesale drift away from the grammar points.
  assert.ok(drilled * 10 >= EXTRA.length * 7,
    `only ${drilled}/${EXTRA.length} extra items drill their slug`);
});

/**
 * REVIEW #4 MAJOR, carried over from the A1.1 batch as a rule rather than as the
 * two ids it was found on: `accepted` is the one part of the data layer without
 * a rule, and it contradicted itself inside a single Lektion — one gap accepted
 * Fährt/Geht/Kommt while the next accepted only Fährst/Kommst, so `Gehst` was
 * right in one item and wrong two items later. Where a gap wants a finite form
 * of the fahren/gehen/kommen family and the German prompt names NO infinitive (a
 * prompt carrying "(fahren)" has fixed the lemma itself), every such item of the
 * Lektion has to offer the same set of lemmas. The A1.2 batch has no instance
 * today; the guard travels with the file so the next batch cannot introduce one.
 */
const MOTION_LEMMAS = { fahren: /^f(ä|a)hr/i, gehen: /^geh/i, kommen: /^komm/i };
const lemmasOf = (strings) => new Set(
  strings.flatMap((s) => Object.entries(MOTION_LEMMAS)
    .filter(([, re]) => re.test(String(s).trim()))
    .map(([lemma]) => lemma)),
);

test('within one Lektion, the same verb family offers the same alternatives', () => {
  const per = new Map();
  for (const item of EXTRA) {
    if (item.type !== 'fill_blank') continue;
    if (INFINITIVE_CUE_RE.test(item.questionDe)) continue;     // the prompt names the verb
    if (!lemmasOf([item.answer]).size) continue;
    const nr = target(item).nr;
    per.set(nr, [...(per.get(nr) || []), item]);
  }
  for (const [nr, list] of per) {
    const sets = list.map((i) => [i.id, [...lemmasOf([i.answer, ...(i.accepted || [])])].sort()]);
    const [, first] = sets[0];
    for (const [id, lemmas] of sets) {
      assert.deepEqual(lemmas, first,
        `L${nr}: ${id} accepts ${lemmas.join('/')} where ${sets[0][0]} accepts ${first.join('/')}`);
    }
  }
});

test('the Lektionen the contract calls thin carry real production, not repeats', () => {
  // CONTRACT §5: `negation` supplies 4 usable legacy items and 4 is PRIMARY_MIN,
  // so L4 draws the same four on every attempt unless the hand-written batch can
  // staff it alone; L3 and L12 are the two points the later Lektionen build on.
  // Each of the three therefore has to be able to fill a whole draw (7) out of
  // items that really drill the slug, and no two of them may be the same task.
  for (const nr of [3, 4, 12]) {
    const list = byLektion().get(nr) || [];
    const slug = lektion(nr).primarySlug;
    const hits = list.filter((i) => drillsSlugA12(i, slug));
    assert.ok(hits.length >= 7, `L${nr} (${slug}) has only ${hits.length} drilling items, a draw is 7`);
    const prompts = new Set(list.map((i) => i.questionDe.replace(/\s+/g, ' ').trim().toLowerCase()));
    assert.equal(prompts.size, list.length, `L${nr} repeats a prompt`);
  }
});

// --- the shipped pool ------------------------------------------------------

test('the shipped pool contains them — scripts/build-lesson-pool.mjs a1.2 has been re-run', () => {
  assert.equal(POOL.level, 'a1.2');
  const ids = new Set(POOL.items.map((i) => i.id));
  const missing = EXTRA.filter((i) => !ids.has(i.id)).map((i) => i.id);
  assert.deepEqual(missing, [], 'a12.json is stale — run `node scripts/build-lesson-pool.mjs a1.2`');
});

test('THE DRAW — every A1.2 Lektion gets a full, typed, on-topic seven that drills its own slug', () => {
  // Both attempts, because attempt 2 draws from what attempt 1 left: a Lektion
  // whose slug has barely enough drilling items passes the first draw and
  // repeats itself on the second, and the repeat is the failure a learner sees.
  for (const attempt of [1, 2]) {
    const plan = planPractice(CURRICULUM_A12, POOL, attempt);
    const lines = [`attempt ${attempt}`];
    for (const l of CURRICULUM_A12.lektionen) {
      const items = plan.get(l.nr) || [];
      const typed = items.filter(isTypedItem).length;
      const mc = items.filter(isMultipleChoice).length;
      const drilling = items.filter((i) => drillsSlugA12(i, l.primarySlug));
      const situational = items.filter((i) => relevanceScore(i, wortfeldTerms(l), new Set()) > 0).length;
      lines.push(
        `L${String(l.nr).padStart(2)} ${l.primarySlug.padEnd(26)} ${items.length} items · ` +
        `${typed} typed (min ${l.practiceRule.typedMin}) · ${mc} MC · ` +
        `${drilling.length} drilling (min ${PRIMARY_MIN}) · ${situational} situational`,
      );
      assert.equal(items.length, PRACTICE_SIZE, `L${l.nr} draws ${items.length} items on attempt ${attempt}`);
      assert.ok(typed >= l.practiceRule.typedMin,
        `L${l.nr} draws ${typed} typed items on attempt ${attempt}, needs ${l.practiceRule.typedMin}`);
      assert.ok(mc <= MAX_MULTIPLE_CHOICE, `L${l.nr} draws ${mc} multiple-choice items on attempt ${attempt}`);
      assert.equal(new Set(items.map((i) => i.id)).size, items.length, `L${l.nr} draws an item twice`);
      for (const it of items) {
        assert.ok(l.practiceRule.topics.includes(it.topic),
          `L${l.nr} draws an off-topic item on attempt ${attempt}: ${it.id} (${it.topic})`);
      }
      assert.ok(drilling.length >= PRIMARY_MIN,
        `L${l.nr} (${l.primarySlug}) draws only ${drilling.length} items that really drill its slug on attempt ${attempt}, needs ${PRIMARY_MIN}:\n` +
        items.filter((i) => !drillsSlugA12(i, l.primarySlug))
          .map((i) => `   ${i.id} ${i.questionDe.replace(/\s+/g, ' ').slice(0, 72)} → ${i.answer}`).join('\n'));
    }
    console.log(`\n${lines.join('\n')}\n`);
  }
});
