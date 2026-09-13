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
  assert.ok(EXTRA.length >= 116, `only ${EXTRA.length} extra items`);
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
    assert.equal(item.topic, target(item).topic, `${item.id} is on the wrong topic`);
    assert.ok(['fill_blank', 'sentence_building', 'error_correction'].includes(item.type), `${item.id}: ${item.type}`);
    assert.equal(item.options, null, `${item.id} carries options — that would make it recognition`);
    assert.ok(isTypedItem(item), `${item.id} is not typed production`);
    assert.ok([4, 5].includes(item.stage), `${item.id} stage ${item.stage}`);
    assert.ok(item.difficulty >= 1 && item.difficulty <= 2, `${item.id} difficulty ${item.difficulty}`);
    assert.ok(item.questionDe && item.questionEn, `${item.id} misses a prompt`);
    assert.ok(item.answer && Array.isArray(item.accepted) && item.accepted.includes(item.answer), `${item.id} answer/accepted`);
    assert.ok(item.explanationDe, `${item.id} has no explanation`);
    // REVIEW #4 BLOCKER 3. The one optional field: an item whose TASK is the
    // capitalisation (the höfliche „Ihr“) carries `caseSensitive: true`, and
    // `check.js` then refuses the lowercase form its own explanation forbids.
    if ('caseSensitive' in item) {
      assert.equal(typeof item.caseSensitive, 'boolean', `${item.id}: caseSensitive must be a boolean`);
      assert.ok(item.accepted.every((a) => a === item.answer || a !== String(a).toLowerCase()),
        `${item.id} is caseSensitive but still accepts a lowercase variant`);
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

  // REVIEW #4 MAJOR: the gap-at-position-1 clause is GONE. "___ du eine
  // Fahrkarte für morgen? (haben)" gives the inversion away and asks only for a
  // verb form; five of Lektion 10's seven drawn items were that shape, so the
  // slug measured 7/7 while the learner produced the word order twice. What
  // counts now: the learner writes the whole question, or chooses Ja/Nein.
  'yes-no-questions': ({ q, expected, options }) =>
    expected.some((a) => /\?\s*$/.test(String(a).trim())) ||
    options.some((o) => isOneOf(o, set('ja', 'nein'))) ||
    /(bilden sie|bilde|schreiben sie|schreib)\s+(sie\s+)?(die\s+)?(höfliche\s+|richtige\s+)?frage/i.test(q),

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
    const sets = list.map((i) => [i.id, [...lemmasOf([i.answer, ...(i.accepted || [])])].sort()]);
    const [, first] = sets[0];
    for (const [id, lemmas] of sets) {
      assert.deepEqual(lemmas, first,
        `L${nr}: ${id} accepts ${lemmas.join('/')} where ${sets[0][0]} accepts ${first.join('/')}`);
    }
  }
});
