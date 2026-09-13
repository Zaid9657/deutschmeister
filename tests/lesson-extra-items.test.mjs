// Guard suite for the hand-authored situational practice items
// (src/data/lessonPools/a11.extra.json, plan P5).
//
// WHY IT EXISTS. The DaF review of 2026-09-12 measured the drawn practice of the
// A1.1 course and found the legacy grammar bank had nothing situational for two
// Lektionen at all: Lektion 10 (Am Bahnhof) drew ZERO of 7 items containing a
// word from its own Wortfeld, Lektion 12 (Feste feiern) 2, Lektion 6 3 and
// Lektion 5 4. The extra file closes that gap by hand. Two things can go wrong
// quietly afterwards: an item that trips the quality rules (then the build drops
// it and the Lektion silently thins out), and an item that mentions no Wortfeld
// word (then `relevanceScore` ranks it with the legacy drill and it is never
// drawn). Both are checked here, per item, plus the draw the learner actually
// gets — the number that the review was about.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { exclusionReason, answerInPrompt, isMetaPrompt } from '../src/data/lessonPools/quality.js';
import { planPractice, relevanceScore, wortfeldTerms, isTypedItem } from '../src/lib/lesson/buildLesson.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const EXTRA = read('src/data/lessonPools/a11.extra.json').items;
const POOL = read('src/data/lessonPools/a11.json');

/**
 * A gap that OPENS a sentence: the prompt starts with it, or it follows a full
 * stop, a question mark, an exclamation mark, a colon or a dash. There the
 * initial capital is orthography, not the taught distinction — see the
 * caseSensitive rule below.
 */
const SENTENCE_INITIAL_GAP_RE = /(^|[.!?:—]\s*[„"]?\s*)___/;

/**
 * REVIEW #5 BLOCKER 2, mirrored from `cueAnswerMismatch` in quality.js: the
 * three task formulas that ask for a BARE article, and the answers that are
 * one. `extra-a11-l05-08` asked "(bestimmter Artikel)" and accepted only
 * „das Heft“, so the learner who obeyed the formula was marked wrong and got a
 * Wortschatz tag. The rule reads the formula and the answer key together.
 */
const ARTICLE_TASK_CUE_RE =
  /\(\s*(?:un)?bestimmter\s+artikel\s*\)|\(\s*der,\s*die\s+oder\s+das\s*\?\s*\)/i;
const BARE_ARTICLES = new Set(['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen']);
/**
 * The one separable prefix spelled like an article, and the cue that marks a
 * VERB task: "Kaufst du heute ___? (einkaufen)" → `ein` is a Satzklammer item,
 * not an article item. `quality.js` carries the same exception, for the same
 * reason — without it the reverse direction of the rule has two false positives.
 */
const ARTICLE_SHAPED_PREFIXES = new Set(['ein']);
const VERB_TASK_CUE_RE = /\([^)]*[a-zäöüß]{2}en\b[^)]*\)/i;

/**
 * REVIEW #5 MAJOR 7: an A1.1 explanation may not make an absolute or numerical
 * claim. „-ung ist 100% feminin ohne Ausnahmen“ is false for words ENDING in
 * -ung (der Ursprung, der Sprung), and `tests/rule-card-overrides.test.mjs`
 * already forbids a percentage on every rule card — the pool had the double
 * standard. Plain rules only.
 */
const ABSOLUTE_CLAIM_RE = /%|\b100\b|\bimmer\b|ohne\s+Ausnahme/i;

/**
 * REVIEW #6 MAJOR 9. The second routing label the batch uses. The four number
 * items of Lektion 2 used to carry `topic: 'verb-sein'` because that was the
 * only slug `practiceRule` routes into L2 — and `tagError` reads the topic, so
 * a learner who typed `sieber` for „sieben“ was told he had conjugated wrongly
 * and was served more `sein` drills. A number word is a spelling, not a verb.
 * The label only reaches Lektion 2 once `practiceRule.topics` of L2 lists it;
 * that half lives in src/data/curricula/a11.js, this half is the item's.
 */
const NUMBERS_TOPIC = 'numbers';

/**
 * The id names the Lektion (`extra-a11-l09-02` → Lektion 9) and the Lektion names
 * its own topic, so the mapping is derived rather than restated: the first batch
 * covered four Lektionen, the second all twelve, and a hand-written table would
 * have to be edited in step with every batch.
 */
const lektion = (nr) => CURRICULUM_A11.lektionen.find((l) => l.nr === nr);
const target = (item) => {
  const m = /^extra-a11-l(\d\d)-\d\d$/.exec(String(item.id));
  const l = m && lektion(Number(m[1]));
  return l ? { nr: l.nr, topic: l.primarySlug } : null;
};

test('every extra item is addressed to one of the four Lektionen, with a unique id', () => {
  assert.ok(EXTRA.length >= 128, `only ${EXTRA.length} extra items`);
  assert.equal(new Set(EXTRA.map((i) => i.id)).size, EXTRA.length, 'duplicate id');
  for (const item of EXTRA) {
    assert.ok(target(item), `${item.id} does not name a Lektion`);
    assert.match(item.id, /^extra-a11-l\d\d-\d\d$/);
  }
  const perLektion = new Map();
  for (const item of EXTRA) perLektion.set(target(item).nr, (perLektion.get(target(item).nr) || 0) + 1);
  assert.ok(perLektion.get(10) >= 16, `L10 has only ${perLektion.get(10)} extra items`);
  assert.ok(perLektion.get(12) >= 16, `L12 has only ${perLektion.get(12)} extra items`);
  assert.ok(perLektion.get(5) >= 10, `L5 has only ${perLektion.get(5)} extra items`);
  assert.ok(perLektion.get(6) >= 10, `L6 has only ${perLektion.get(6)} extra items`);
  // REVIEW #6 MAJOR 4. Lektion 4 had eight items and therefore filled three to
  // four of its seven drawn places from the legacy bank, which practises Genus
  // at Instrument, Freiheit, Zeitung, Sonne and Kaffee — none of them a word the
  // course teaches before L4 (Kaffee is L9). Twelve is the number at which the
  // Lektion covers its own draw out of its own Wortfeld.
  assert.ok(perLektion.get(4) >= 12, `L4 has only ${perLektion.get(4)} extra items`);
});

test('every extra item passes the pool quality rules', () => {
  for (const item of EXTRA) {
    assert.equal(exclusionReason(item), null, `${item.id} is excluded: ${exclusionReason(item)}`);
  }
});

test('no extra item gives its answer away or hides its task in the English gloss', () => {
  // REVIEW #2 fixes 2 and 3, applied to the file the next hand-authored batch
  // lands in: the class the second review found alive three times is "the item
  // punishes a correct answer", and its two mechanical shapes are the answer
  // standing in its own prompt and a prompt whose content is only in questionEn.
  for (const item of EXTRA) {
    assert.equal(answerInPrompt(item), false, `${item.id}: the answer stands in its own prompt`);
    assert.equal(isMetaPrompt(item), false, `${item.id}: the German prompt carries no task`);
  }
});

test('every extra item has the Lektion topic, the pool shape and typed production', () => {
  for (const item of EXTRA) {
    assert.ok(item.topic === target(item).topic || item.topic === NUMBERS_TOPIC,
      `${item.id} is on the wrong topic`);
    assert.ok(['fill_blank', 'sentence_building', 'error_correction'].includes(item.type), `${item.id}: ${item.type}`);
    assert.equal(item.options, null, `${item.id} carries options — that would make it recognition`);
    assert.ok(isTypedItem(item), `${item.id} is not typed production`);
    assert.ok([4, 5].includes(item.stage), `${item.id} stage ${item.stage}`);
    assert.ok(item.difficulty >= 1 && item.difficulty <= 2, `${item.id} difficulty ${item.difficulty}`);
    assert.ok(item.questionDe && item.questionEn, `${item.id} misses a prompt`);
    assert.ok(item.answer && Array.isArray(item.accepted) && item.accepted.includes(item.answer), `${item.id} answer/accepted`);
    assert.ok(item.explanationDe, `${item.id} has no explanation`);
    // REVIEW #4 BLOCKER 3, re-cut by REVIEW #5 BLOCKER 3. The one optional
    // field: an item whose TASK is the capitalisation (the höfliche „Sie/Ihnen/
    // Ihr“) carries `caseSensitive: true`, and `check.js` then refuses the
    // lowercase form its own explanation forbids. Round 5 measured the flag on
    // the wrong item — `extra-a11-l12-10` („sie, Plural“ → ihre) was marked
    // case-strict although its own explanation names the LOWERCASE form, so the
    // learner who copied the explanation got a red cross. Hence the semantics
    // pinned here, in both directions: a flagged item may not accept a
    // case-variant of its own answer, and an unflagged gap that stands at the
    // start of a sentence MUST accept the lowercase variant, because there the
    // capital is only the sentence opening and nothing is being taught by it.
    if ('caseSensitive' in item) {
      assert.equal(typeof item.caseSensitive, 'boolean', `${item.id}: caseSensitive must be a boolean`);
      assert.ok(
        item.accepted.every((a) => a === item.answer || String(a).toLowerCase() !== String(item.answer).toLowerCase()),
        `${item.id} is caseSensitive but still accepts a case-variant of its own answer`,
      );
    } else if (item.type === 'fill_blank' && SENTENCE_INITIAL_GAP_RE.test(item.questionDe)
               && item.answer !== String(item.answer).toLowerCase()) {
      assert.ok(item.accepted.includes(String(item.answer).toLowerCase()),
        `${item.id}: the gap opens the sentence, so the lowercase form is not a mistake — accept it or set caseSensitive`);
    }
    const words = item.explanationDe.trim().split(/\s+/).length;
    assert.ok(words <= 15, `${item.id} explanation is ${words} words`);
    // German only where the engine shows German: the prompt and the answer.
    assert.doesNotMatch(`${item.questionDe} ${item.answer}`, /\b(the|you|your|is|are|does|do|have)\b/i, `${item.id} has English in a German field`);
  }
});

test('every extra item mentions a Wortfeld word of its Lektion — or it would never be drawn', () => {
  for (const item of EXTRA) {
    const terms = wortfeldTerms(lektion(target(item).nr));
    const score = relevanceScore(item, terms, new Set());
    assert.ok(score > 0, `${item.id} scores 0 relevance for L${target(item).nr}`);
  }
});

test('the shipped pool contains them — scripts/build-lesson-pool.mjs has been re-run', () => {
  const ids = new Set(POOL.items.map((i) => i.id));
  const missing = EXTRA.filter((i) => !ids.has(i.id)).map((i) => i.id);
  assert.deepEqual(missing, [], 'a11.json is stale — run `node scripts/build-lesson-pool.mjs a1.1`');
});

test('THE DRAW — the four Lektionen now practise their own situation', () => {
  const plan = planPractice(CURRICULUM_A11, POOL, 1);
  const situational = {};
  const lines = [];
  for (const nr of [5, 6, 10, 12]) {
    const l = lektion(nr);
    const terms = wortfeldTerms(l);
    const items = plan.get(nr);
    const hits = items.filter((it) => relevanceScore(it, terms, new Set()) > 0);
    situational[nr] = hits.length;
    lines.push(`L${String(nr).padStart(2)} ${l.primarySlug} — ${hits.length}/${items.length} situational, ${items.filter(isTypedItem).length} typed`);
    for (const it of items) {
      const hit = relevanceScore(it, terms, new Set()) > 0 ? '✓' : ' ';
      lines.push(`   ${hit} ${it.questionDe.replace(/\s+/g, ' ').slice(0, 72)} → ${it.answer}`);
    }
  }
  console.log(`\n${lines.join('\n')}\n`);

  // Floors, not the measured values: the draw is seeded, and a later pool change
  // may move an item without being a regression. The review's numbers were
  // L5 4, L6 3, L10 0, L12 2 — every floor below is above its baseline.
  assert.ok(situational[10] >= 3, `L10 draws only ${situational[10]} situational items (was 0)`);
  assert.ok(situational[12] >= 3, `L12 draws only ${situational[12]} situational items (was 2)`);
  assert.ok(situational[5] >= 5, `L5 draws only ${situational[5]} situational items (was 4)`);
  assert.ok(situational[6] >= 4, `L6 draws only ${situational[6]} situational items (was 3)`);
});

/**
 * R4 — "really drills the primary slug". The `topic` a pool item carries is a
 * ROUTING label, not a content description (REVIEW #3, MAJOR: „die topic-Marken
 * sind Routing-Labels“), so the guarantee "≥4 of the drawn 7 sit on the
 * Lektion's own grammar point" was only nominally met in L3, L4 and L11 — the
 * test that measured it read the same label the item had written about itself.
 * `drillsSlug` reads the ANSWER instead: what the learner actually has to
 * produce. It is implemented here rather than imported because the same
 * predicate is landing in src/data/lessonPools/quality.js in a parallel change;
 * the integrator reconciles the two, and until then this file is the one that
 * measures the hand-authored batch.
 */
/** ä/ae-blind lowercase and punctuation-free, the way the pool compares answers. */
const flat = (text) =>
  String(text || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const bare = (text) => String(text || '').replace(/[.,!?;:"“”„'’]/g, '').trim();
const wordsFlat = (text) => flat(text).split(/[^a-z0-9]+/).filter(Boolean);
const set = (...list) => new Set(list.map((w) => flat(w)));
/** The whole string is one of these words (punctuation and case ignored). */
const isOneOf = (text, allowed) => allowed.has(flat(bare(text)));
/** One of these words stands in the string. */
const containsOneOf = (text, allowed) => wordsFlat(text).some((w) => allowed.has(w));

const DEF_NOM = set('der', 'die', 'das');
const DEF_ALL = set('der', 'die', 'das', 'den', 'dem');
const INDEF = set('ein', 'eine', 'einen', 'einem', 'einer', 'kein', 'keine', 'keinen', 'keinem', 'keiner');
const PRONOUNS = set('ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr');
const SEIN = set('bin', 'bist', 'ist', 'sind', 'seid');
const HABEN = set('habe', 'hast', 'hat', 'haben', 'habt');
const PREFIXES = set('auf', 'an', 'ein', 'mit', 'um', 'ab', 'zu', 'aus', 'zurück', 'los', 'weg');
const POSSESSIVE_RE = /^(mein|dein|sein|ihr|unser|euer)(e|en|em|er|es)?$/;
const containsPossessive = (text) => wordsFlat(text).some((w) => POSSESSIVE_RE.test(w));
const TIME_WORD_RE =
  /^(um|am|im|uhr|halb|viertel|nach|vor|morgens|mittags|nachmittags|abends|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|eins|zwei|drei|vier|fuenf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwanzig|dreissig|vierzig|fuenfzig)$/;
const FINITE_RE = /^[a-zäöüß]+(e|st|t|en|et)$/i;
/** "(arbeiten)", "(aufstehen, nur die Vorsilbe)" — an infinitive cue in the prompt. */
const INFINITIVE_CUE_RE = /\([^)]*[a-zäöüß]{2}en\b[^)]*\)/i;
/** The cue that makes a whole-sentence answer a definite-article task. */
const DEF_ARTICLE_CUE_RE = /bestimmter artikel|welche[rs]?\s+artikel|ist das (?:ein|eine)\b/i;
/** The prompt's last word before the final punctuation is a separable prefix. */
const endsOnPrefix = (q) => {
  const toks = wordsFlat(String(q).replace(/\([^)]*\)\s*$/, ''));
  const tail = toks[toks.length - 1];
  return Boolean(tail) && PREFIXES.has(tail);
};

const DRILLS = {
  // REVIEW #4 MAJOR: only what SHOWS the gender — a bare nominative article the
  // learner produces, or chips that are nothing but der/die/das. The old
  // answer-prefix clause counted every correction whose sentence opens with
  // "Das", which is how `extra-a11-l04-07` — an ein/eine item — used to lift
  // Lektion 4 over the floor.
  'nouns-gender': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, DEF_NOM)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, DEF_NOM))),

  'definite-articles': ({ q, expected, options }) =>
    expected.some((a) => isOneOf(a, DEF_ALL)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, DEF_ALL))) ||
    (DEF_ARTICLE_CUE_RE.test(q) && expected.some((a) => containsOneOf(a, DEF_ALL))),

  'indefinite-articles': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, INDEF) || containsOneOf(a, INDEF)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, INDEF))),

  'personal-pronouns': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, PRONOUNS)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, PRONOUNS))),

  'verb-sein': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, SEIN) || containsOneOf(a, SEIN)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, SEIN))),

  'verb-haben': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, HABEN) || containsOneOf(a, HABEN)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, HABEN))),

  'alphabet-pronunciation': ({ q }) => /Buchstab|Schreibweise/i.test(q),

  'present-tense-regular': ({ q, answer, options }) =>
    (!/\s/.test(bare(answer)) && FINITE_RE.test(bare(answer)) && INFINITIVE_CUE_RE.test(q)) ||
    (options.length >= 2 && options.every((o) => FINITE_RE.test(bare(o)))),

  // REVIEW #4 MAJOR, the other direction: a whole-sentence answer counts when
  // one of its words is a possessive ("Wir feiern unser Fest."), a one-word
  // answer still has to BE one.
  'possessive-articles': ({ expected, options }) =>
    expected.some((a) => POSSESSIVE_RE.test(flat(bare(a)))) ||
    expected.some((a) => /\s/.test(bare(a)) && containsPossessive(a)) ||
    (options.length > 0 && options.every((o) => POSSESSIVE_RE.test(flat(bare(o))))),

  'separable-verbs-intro': ({ q, expected }) =>
    expected.some((a) => {
      const plain = bare(a);
      if (isOneOf(plain, PREFIXES)) return true;
      const tail = wordsFlat(plain).slice(-1)[0];
      return Boolean(tail) && /\s/.test(plain) && PREFIXES.has(tail);
    }) ||
    endsOnPrefix(q),

  // REVIEW #5 MAJOR 4 tightened it twice more. Round 4 dropped the
  // gap-at-position-1 clause; round 5 measured that two of the three remaining
  // clauses still counted items that hand the learner the word order:
  //   * the answer-ends-in-"?" clause counted every error-correction item that
  //     QUOTES a finished question and asks only for the verb form
  //     ("Korrigieren Sie: „Sind der Bahnhof weit?“" → "Ist der Bahnhof weit?"),
  //     so it is now bound to the origin of the question mark — the prompt must
  //     not already contain one, i.e. the learner is the one who makes it a
  //     question;
  //   * the task-formula clause counted the WORDING rather than the work, so it
  //     is gone: an item counts when the learner writes the whole question, or
  //     chooses Ja/Nein.
  // Measured on the batch after the round-6 rewrite: L10 8 of 16 items, 6 of the
  // 7 drawn on attempt 1 and on attempt 2 (it was 2 of 7).
  'yes-no-questions': ({ q, expected, options }) =>
    (expected.some((a) => /\?\s*$/.test(String(a).trim())) && !/\?/.test(q)) ||
    options.some((o) => isOneOf(o, set('ja', 'nein'))),

  'time-and-dates': ({ expected }) =>
    expected.some((a) => /uhr/i.test(String(a)) || wordsFlat(a).some((w) => TIME_WORD_RE.test(w))),
};

export function drillsSlug(item, slug) {
  const rule = DRILLS[String(slug || '')];
  if (!rule) return true;
  if (!item) return false;
  const answer = String(item.answer || '');
  const expected = [answer, ...(item.accepted || [])].filter((a) => String(a).trim());
  const options = (item.options || []).filter((o) => String(o).trim());
  return Boolean(rule({ q: String(item.questionDe || ''), answer, expected, options }));
}

test('R4 — each Lektion drills its own grammar point, measured on the answer', () => {
  const per = new Map();
  for (const item of EXTRA) {
    const t = target(item);
    if (!per.has(t.nr)) per.set(t.nr, []);
    per.get(t.nr).push(item);
  }
  const lines = [];
  let drilled = 0;
  for (const nr of [...per.keys()].sort((a, b) => a - b)) {
    const list = per.get(nr);
    const slug = lektion(nr).primarySlug;
    const hits = list.filter((i) => drillsSlug(i, slug));
    lines.push(`L${String(nr).padStart(2)} ${slug} — ${hits.length}/${list.length}`);
    // The review's guarantee is "≥4 of the drawn 7 on the Lektion's own point";
    // the extra items are what the draw prefers, so the batch has to carry it.
    assert.ok(hits.length >= 4, `L${nr} has only ${hits.length} items that drill ${slug}`);
    drilled += hits.length;
  }
  console.log(`\n${lines.join('\n')}\n`);
  // A floor on the batch as a whole, deliberately well under the measured value
  // (the predicate above is the tightened one of REVIEW #4, so the number is
  // lower than the 111/116 the loose one reported): the per-Lektion floor above
  // is the guarantee, this one catches a wholesale drift of the batch away from
  // its own grammar points.
  assert.ok(drilled * 10 >= EXTRA.length * 7, `only ${drilled}/${EXTRA.length} extra items drill their slug`);
});

test('no extra item uses a word its Lektion has not taught yet', () => {
  // Three lexical pre-empts the third DaF review measured, as a rule rather than
  // three corrections: `der Samstag`/`der Sonntag` are taught in Lektion 8 (L7
  // demanded them for a form field and an item); `der Vormittag`/`der Nachmittag`
  // were dropped from every Wortfeld and belong to no Lektion at all; `sprichst`
  // is deferred to Lektion 7 by the notice of Lektion 3 in writing.
  for (const item of EXTRA) {
    const { nr } = target(item);
    const text = `${item.questionDe} ${item.answer} ${(item.accepted || []).join(' ')}`;
    assert.doesNotMatch(text, /Vormittag|Nachmittag/i, `${item.id} uses a word no Lektion teaches`);
    if (nr < 8) assert.doesNotMatch(text, /Samstag|Sonntag/i, `${item.id} (L${nr}) uses a weekday taught in L8`);
    if (nr <= 6) assert.doesNotMatch(text, /sprichst/i, `${item.id} (L${nr}) uses sprichst — L3 defers it to L7`);
  }
});

/**
 * REVIEW #4 MAJOR — `accepted` is the one part of the data layer without a rule,
 * and it contradicted itself inside a single Lektion: `extra-a11-l10-01`
 * ("___ der Zug nach Österreich?") accepted Fährt/Geht/Kommt while
 * `extra-a11-l10-06` ("___ du morgen mit dem Bus?") accepted only Fährst/Kommst,
 * so `Gehst` — which the Lektion's own pretest lists — was wrong two items
 * later. The rule, stated on the shape rather than on the two ids: where the gap
 * is a finite form of the fahren/gehen/kommen family and the German prompt names
 * NO infinitive (a prompt that carries "(fahren)" has fixed the lemma itself),
 * every such item of the Lektion must offer the same set of lemmas.
 */
const MOTION_LEMMAS = { fahren: /^f(ä|a)hr/i, gehen: /^geh/i, kommen: /^komm/i };
const lemmasOf = (strings) => new Set(
  strings.flatMap((s) => Object.entries(MOTION_LEMMAS)
    .filter(([, re]) => re.test(String(s).trim()))
    .map(([lemma]) => lemma)),
);

/**
 * REVIEW #6 MAJOR 10 narrowed the rule above from the LEMMA to the FRAME. The
 * equality held, and it made `extra-a11-l10-06` („___ du morgen mit dem Bus?“)
 * accept `Gehst` — and „Gehst du morgen mit dem Bus?“ is not German: one travels
 * BY bus (fahren) or comes WITH it (kommen), but `gehen` excludes the vehicle.
 * That is precisely the contrast A1 learners with a Romance or Slavic first
 * language miss, and the item handed it a green tick. So a lemma is blocked in
 * the frames that exclude it, and two items of one Lektion have to agree on the
 * lemmas that are not blocked.
 */
const FRAME_BLOCKS = { gehen: /\bmit (dem|der) \w+/i };
const blockedIn = (q) => new Set(
  Object.entries(FRAME_BLOCKS).filter(([, re]) => re.test(String(q))).map(([lemma]) => lemma),
);

test('within one Lektion, the same verb family offers the same alternatives', () => {
  const byLektion = new Map();
  for (const item of EXTRA) {
    if (item.type !== 'fill_blank') continue;
    if (/\([^)]*[a-zäöüß]{2}en\b[^)]*\)/i.test(item.questionDe)) continue;  // the prompt names the verb
    if (!lemmasOf([item.answer]).size) continue;
    const { nr } = target(item);
    byLektion.set(nr, [...(byLektion.get(nr) || []), item]);
  }
  assert.ok((byLektion.get(10) || []).length >= 2, 'L10 no longer has the two motion-verb items the rule is about');
  for (const [nr, list] of byLektion) {
    const sets = list.map((i) => {
      const blocked = blockedIn(i.questionDe);
      return [
        i.id,
        [...lemmasOf([i.answer, ...(i.accepted || [])])].sort(),
        [...blocked],
      ];
    });
    // The reference set is the union of what the Lektion's items offer; every
    // item must offer all of it except the lemmas its own frame excludes.
    const union = [...new Set(sets.flatMap(([, lemmas]) => lemmas))].sort();
    for (const [id, lemmas, blocked] of sets) {
      const expected = union.filter((l) => !blocked.includes(l));
      assert.deepEqual(lemmas, expected,
        `L${nr}: ${id} accepts ${lemmas.join('/')} where the Lektion offers ${expected.join('/')}`);
    }
  }
});

test('no item accepts a form of gehen in a frame that excludes it', () => {
  // REVIEW #6 MAJOR 10, as the rule rather than as the one id: `mit dem Bus`,
  // `mit der Bahn` — a prepositional object naming the vehicle — rules `gehen`
  // out, whatever else the answer key holds.
  for (const item of EXTRA) {
    if (!FRAME_BLOCKS.gehen.test(String(item.questionDe))) continue;
    for (const a of [item.answer, ...(item.accepted || [])]) {
      assert.doesNotMatch(String(a), /^geh/i,
        `${item.id}: „${a} …“ with a vehicle — one goes BY bus, not WITH it`);
    }
  }
});

test('no explanation makes a percentage or an absolute claim', () => {
  // REVIEW #5 MAJOR 7, as a pool-wide rule rather than the two ids it named:
  // the drawn item „Welche Endung ist IMMER feminin?“ answered itself with
  // „-ung ist 100% feminin ohne Ausnahmen“, and two hand-written L12 items said
  // the höfliche „Ihr“ is „immer“ capitalised. An A1.1 learner cannot check any
  // of it, and the first one is simply untrue.
  for (const item of EXTRA) {
    assert.doesNotMatch(item.explanationDe, ABSOLUTE_CLAIM_RE,
      `${item.id} claims an absolute or a percentage: ${item.explanationDe}`);
  }
});

test('an article task formula and the answer key agree', () => {
  // The mirror of `cueAnswerMismatch` (quality.js, REVIEW #5 BLOCKER 2), in both
  // directions: a prompt that says „(bestimmter Artikel)“ / „(unbestimmter
  // Artikel)“ / „(der, die oder das?)“ must accept a bare article, and an item
  // whose whole answer key is bare articles must carry such a formula — an
  // article gap with no formula is the class REVIEW #4 closed.
  for (const item of EXTRA) {
    const expected = [item.answer, ...(item.accepted || [])]
      .map((a) => String(a).replace(/[.,!?;:"“”„'’]/g, '').trim().toLowerCase());
    const cued = ARTICLE_TASK_CUE_RE.test(item.questionDe);
    if (cued) {
      assert.ok(expected.some((a) => BARE_ARTICLES.has(a)),
        `${item.id} asks for an article by formula but accepts only ${expected.join('/')}`);
    }
    const verbTask = expected.some((a) => ARTICLE_SHAPED_PREFIXES.has(a)) && VERB_TASK_CUE_RE.test(item.questionDe);
    if (expected.every((a) => BARE_ARTICLES.has(a)) && !verbTask) {
      assert.ok(cued, `${item.id} wants a bare article and its German prompt never says so`);
    }
  }
});

test('Lektion 10 makes the learner PRODUCE the question, not fill a gap in one', () => {
  // REVIEW #5 MAJOR 4. The Lektion is called „Ja/Nein-Fragen“ and its rule card
  // promises the inversion; under the tightened predicate above the learner used
  // to produce it in 2 of the 7 drawn items, because five prompts already
  // carried the finished question and asked only for a verb form. The floor is
  // on the BATCH (so the draw has something to reach for) and on the DRAW
  // itself, on both attempts — a Lektion that only passes on attempt 1 is not
  // fixed.
  const l10 = EXTRA.filter((i) => target(i).nr === 10);
  const produces = (it) => drillsSlug(it, 'yes-no-questions');
  assert.ok(l10.filter(produces).length >= 6,
    `L10 has only ${l10.filter(produces).length} items whose answer is the whole question`);
  for (const attempt of [1, 2]) {
    const drawn = planPractice(CURRICULUM_A11, POOL, attempt).get(10) || [];
    assert.ok(drawn.filter(produces).length >= 4,
      `attempt ${attempt}: L10 draws only ${drawn.filter(produces).length} items that produce the question`);
  }
});

test('the four number items of Lektion 2 derive the number from the German prompt', () => {
  // REVIEW #5 MAJOR 13 for the items themselves, REVIEW #6 MAJOR 9 for the label
  // they carry. The can-do „Ich kann Zahlen von null bis zehn verstehen und
  // sagen“ had no practice at all; these four carry the digit as a cue in the
  // GERMAN prompt and want the word back. Round 5 filed them under `verb-sein`
  // because that is the slug `practiceRule` routes into Lektion 2 — and round 6
  // measured what that label does downstream: `tagError` matches
  // /verb|sein|haben|present|separable|conjug/ on the topic, so every misspelled
  // number word („sieber“, „sechs“, „seven“, „siben“) was reported to the
  // learner as a CONJUGATION error and answered with more sein items out of
  // `remediationSet`. The label is now `numbers`, which is what the item drills.
  const NUMBERS = /^(null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)$/;
  const numberItems = EXTRA.filter((i) => target(i).nr === 2 && NUMBERS.test(i.answer));
  assert.ok(numberItems.length >= 4, `L2 has only ${numberItems.length} number items`);
  for (const item of numberItems) {
    assert.match(item.questionDe, /\(\s*\d{1,2}\s*\)/, `${item.id}: the digit must stand in the German prompt`);
    assert.equal(item.topic, NUMBERS_TOPIC, `${item.id}: a number item is not a sein item`);
    assert.equal(drillsSlug(item, 'verb-sein'), false, `${item.id} claims to drill sein — it drills numbers`);
  }
  // The reverse direction: no item outside that group wears the label, so the
  // Lektion-2 draw cannot be flooded by it.
  for (const item of EXTRA) {
    if (item.topic !== NUMBERS_TOPIC) continue;
    assert.ok(numberItems.includes(item), `${item.id} is filed under ${NUMBERS_TOPIC} but is not a number item`);
  }
});

/**
 * REVIEW #6 BLOCKER 2, mirrored from `ambiguousCorrection` in quality.js rather
 * than imported, for the same reason `drillsSlug` is: a mirror fails when the
 * rule in the pool is weakened, an import does not.
 *
 * An error correction quotes a sentence and asks for it back, repaired. The
 * model answer may therefore differ from the quote only in the way the GERMAN
 * prompt names. `extra-a11-l05-09` („Ein Schere ist hier.“ → `Die Schere ist
 * hier.`, prompt „Korrigieren Sie:“, English gloss „Fix the article.“) broke
 * that: the quote holds exactly one error — the genus of the INDEFINITE article
 * — so `Eine Schere ist hier.` is the minimal and complete repair and faultless
 * German, and the item returned `wrong` with an Artikel tag. The intent („known,
 * therefore definite“) stood only in the explanation, which the learner reads
 * AFTER answering.
 */
const ARTICLE_FAMILY_OF = (word) => {
  const w = flat(bare(word));
  if (['der', 'die', 'das', 'den', 'dem'].includes(w)) return 'definite';
  if (['ein', 'eine', 'einen', 'einem', 'einer'].includes(w)) return 'indefinite';
  return null;
};
/** The quoted sentence of a „Korrigieren Sie: „…““ prompt. */
const QUOTED_SPAN_RE = /[„"“]([^„"“]+)[“"]/;
/** „(mit bestimmtem Artikel)“ / „(mit unbestimmtem Artikel)“ — the task, named. */
const SENTENCE_ARTICLE_CUE_RE = /\(\s*mit\s+(?:un)?bestimmtem\s+artikel\s*\)/i;

/** [from, to] when `answer` changes the quote in one word and crosses the family. */
function articleFamilySwap(quoted, answer) {
  const src = bare(quoted).split(/\s+/).filter(Boolean);
  const tgt = bare(answer).split(/\s+/).filter(Boolean);
  if (!src.length || src.length !== tgt.length) return null;
  const diff = src.map((w, i) => [w, tgt[i]]).filter(([a, b]) => flat(a) !== flat(b));
  if (diff.length !== 1) return null;
  const [from, to] = diff[0];
  const fromFam = ARTICLE_FAMILY_OF(from);
  const toFam = ARTICLE_FAMILY_OF(to);
  if (!fromFam || !toFam || fromFam === toFam) return null;
  return [from, to];
}

function ambiguousCorrectionMirror(item) {
  if (String(item?.type) !== 'error_correction') return false;
  const q = String(item.questionDe || '');
  if (ARTICLE_TASK_CUE_RE.test(q) || SENTENCE_ARTICLE_CUE_RE.test(q)) return false;
  const quote = QUOTED_SPAN_RE.exec(q);
  if (!quote) return false;
  const answers = [item.answer, ...(item.accepted || [])]
    .map((a) => String(a ?? '').trim()).filter(Boolean);
  if (!answers.length) return false;
  // Ambiguous only when EVERY accepted answer crosses the family: an item that
  // takes both readings is one the learner cannot get wrong by obeying it.
  return answers.every((a) => articleFamilySwap(quote[1], a) !== null);
}

test('an error correction differs from its quote only in the way the prompt names', () => {
  // The predicate above is the rule; these two lines are the measurement that
  // made it one, kept so a later rewrite of the predicate has to keep answering
  // the same two questions.
  assert.equal(ambiguousCorrectionMirror({
    type: 'error_correction',
    questionDe: 'Korrigieren Sie: „Ein Schere ist hier.“',
    answer: 'Die Schere ist hier.',
    accepted: ['Die Schere ist hier.', 'Die Schere ist hier'],
  }), true, 'the round-6 blocker no longer trips its own rule');
  assert.equal(ambiguousCorrectionMirror({
    type: 'error_correction',
    questionDe: 'Korrigieren Sie: „Das ist ein Kollegin im Büro.“',
    answer: 'Das ist eine Kollegin im Büro.',
    accepted: ['Das ist eine Kollegin im Büro.'],
  }), false, 'a genus fix inside one article family has exactly one solution');

  const corrections = EXTRA.filter((i) => i.type === 'error_correction');
  assert.ok(corrections.length >= 12, `only ${corrections.length} error corrections to measure`);
  for (const item of corrections) {
    const quote = QUOTED_SPAN_RE.exec(String(item.questionDe));
    assert.ok(quote, `${item.id}: a correction must quote the sentence it is about`);
    assert.equal(ambiguousCorrectionMirror(item), false,
      `${item.id}: the model answer crosses the article family and the German prompt never says so`);
  }
});

test('every polite-form item is case-strict — the flag is the class, not a list', () => {
  // REVIEW #6 BLOCKER 1. Round 5 closed this as a LIST of three ids, and round 6
  // measured the list from both ends: items of exactly the same shape never got
  // the flag, so `checkAnswer` returned `typo` for the lowercase form — and a
  // typo counts as CORRECT in `PracticeItem`, in `isItemCorrect` and in
  // `gradeTypedReview`. The course then graded the same rule two ways depending
  // on which review had found which item. The predicate below is the one landing
  // in quality.js as `politeCaseItem`, mirrored here; the hand-set flag stays a
  // valid override (extra-a11-l12-16 carries it although the predicate, narrowed
  // to a non-initial possessive, does not reach it).
  const POLITE_FORM_RE = /^(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)$/;
  const politeCaseItem = (item) => {
    const acc = [item?.answer, ...(item?.accepted || [])].map((a) => String(a ?? '').trim()).filter(Boolean);
    if (!acc.length) return false;
    if (acc.every((a) => !a.includes(' '))) return acc.every((a) => POLITE_FORM_RE.test(a));
    return acc.every((a) => a.split(/\s+/).slice(1).some((w) => /^Ihr(e|en|em|er|es)?$/.test(w.replace(/[.,!?]/g, ''))));
  };
  const derived = EXTRA.filter(politeCaseItem);
  assert.ok(derived.length >= 4, `only ${derived.length} polite-form items found — the predicate stopped matching`);
  for (const item of derived) {
    assert.equal(item.caseSensitive, true,
      `${item.id} teaches the polite capital and is not case-strict: ${JSON.stringify(item.accepted)}`);
  }
  // The two shapes the predicate must NOT reach, measured rather than asserted
  // in prose: an item that accepts both spellings is not teaching the capital,
  // and a word-order item must not become wholly wrong over one letter.
  for (const id of ['extra-a11-l03-02', 'extra-a11-l12-10', 'extra-a11-l10-08']) {
    const item = EXTRA.find((i) => i.id === id);
    assert.ok(item, `${id} is gone — re-measure the polite-form rule against the batch`);
    assert.equal(politeCaseItem(item), false, `${id} must stay outside the polite-form class`);
    assert.notEqual(item.caseSensitive, true, `${id} must not be case-strict`);
  }
});
