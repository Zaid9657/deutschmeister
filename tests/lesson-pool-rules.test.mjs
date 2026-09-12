// Guard suite for the pool rules the SECOND DaF review asked for
// (docs/course-factory/a11-rebuild/REVIEW-daf-2-2026-09-12.md, fixes 1–3).
//
// WHY IT EXISTS. The first review's worst finding was an item that marks a
// correct German answer wrong; the second review measured the drawn seven again
// and found the class alive in four more shapes, three of them in the Lektion
// the course sells as `Hören Teil 1`:
//
//   * ORDINALS — "Heute ist der ___ Juni. (20.)" → `zwanzigste`, with `accepted`
//     holding exactly one string. No notice and no rule card of this level
//     teaches the formation, and the curriculum defers it to A1.2 in writing.
//     Two of Lektion 8's seven items were guaranteed errors WITH a requeue that
//     served the other one. That was the whole blocker of the second round.
//   * MONTH NAMES on the time topic — introduced in Lektion 12, drawn in 8.
//   * `in der Nacht` — a Dativ exception on a noun in no Wortfeld.
//   * THE ANSWER IN ITS OWN PROMPT — "Das Kind ___ Deutsch. Es lernt schnell."
//   * A PROMPT WITH NO TASK — "Wie sagt man das?", where the sentence to produce
//     exists only in the English gloss, and "Schreib den Satz: [spielen /
//     Fußball]", where the subject does (so `Ich spiele Fußball.` is marked
//     wrong). A course for Integrationskurs learners may not put its content in
//     an English field.
//
// The point of this file is that the rules are checked, not the artefact: the
// tests apply `exclusionReason` to a11.json + a11.extra.json themselves, so they
// still hold between a rule change and the next `node scripts/build-lesson-pool.mjs
// a1.1`. The one test that IS about the artefact says so in its message.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  exclusionReason, isUsableItem, filterPool, REASON, REASONS, EXCLUDE_IDS,
  MONTH_NAMES, ORDINAL_CUE_RE, ORDINAL_WORD_RE, MIN_BRACKET_CUES,
  answerInPrompt, isMetaPrompt,
} from '../src/data/lessonPools/quality.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const POOL = read('src/data/lessonPools/a11.json');
const EXTRA = read('src/data/lessonPools/a11.extra.json').items;

/** Everything that can reach a Lektion of A1.1, whether the pool is fresh or not. */
const ALL = [...POOL.items, ...EXTRA.filter((e) => !POOL.items.some((p) => p.id === e.id))];
/** What survives the rules — the set a learner can actually be shown. */
const USABLE = ALL.filter((item) => isUsableItem(item));

const MONTH_RE = new RegExp(`(^|[^a-zäöüß])(${MONTH_NAMES.join('|')})([^a-zäöüß]|$)`, 'i');
const label = (item) => `${item.id} (${item.topic}) — ${item.questionDe} → ${item.answer}`;

test('whatever the rules drop carries a stable reason, and they are not broad', () => {
  // a11.json is generated: right after a build nothing here is dropped, and
  // before one the 17 items of the second review are. Both are fine — what may
  // never happen is an unnamed reason, or a filter wide enough to thin a Lektion.
  const { excluded, counts } = filterPool(ALL, { level: 'a1.1' });
  for (const ex of excluded) {
    assert.ok(REASONS.includes(ex.reason), `${ex.id}: ${ex.reason}`);
    assert.ok(ex.id && 'questionDe' in ex, `${ex.id}: the drop list must be printable`);
  }
  assert.ok(excluded.length < ALL.length * 0.25, `${excluded.length} of ${ALL.length} dropped — too broad`);
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), excluded.length);
});

test('no item a learner can be shown asks for an ordinal number', () => {
  for (const item of USABLE) {
    assert.doesNotMatch(item.questionDe, ORDINAL_CUE_RE, `ordinal cue: ${label(item)}`);
    for (const a of [item.answer, ...(item.accepted || [])]) {
      assert.doesNotMatch(String(a).trim(), ORDINAL_WORD_RE, `ordinal answer: ${label(item)}`);
    }
  }
  // and the two items the review names by quotation are gone
  for (const gone of ['Heute ist der ___ Juni. (20.)', 'Heute ist der ___ August. (8.)']) {
    assert.ok(!USABLE.some((i) => i.questionDe === gone), `"${gone}" survives the filter`);
  }
});

test('no time item names a month — the months are Lektion 12, the time topic is Lektion 8', () => {
  for (const item of USABLE.filter((i) => /time|date/i.test(i.topic))) {
    const all = [item.questionDe, item.answer, ...(item.accepted || [])].join(' · ');
    assert.doesNotMatch(all, MONTH_RE, `month on a time item: ${label(item)}`);
  }
  // Lektion 12 teaches them, so its own topic may say "Im Januar" — the rule is
  // scoped, not blanket, or fix 6 of the review could not be written.
  assert.equal(
    exclusionReason({ id: 'x', topic: 'possessive-articles', questionDe: 'Im Januar ist ___ Geburtstag. (er)', answer: 'sein' }),
    null,
  );
});

test('no item gives its own answer away in the German prompt', () => {
  for (const item of USABLE) assert.equal(answerInPrompt(item), false, `answer in prompt: ${label(item)}`);
  // the L11 item the review names, and the shape the rule must NOT touch
  assert.equal(
    exclusionReason({ id: 'x', topic: 'present-tense-regular', questionDe: 'Das Kind ___ Deutsch. Es lernt schnell.', answer: 'lernt' }),
    REASON.ANSWER_IN_PROMPT,
  );
  assert.equal(
    exclusionReason({ id: 'y', topic: 'present-tense-regular', questionDe: 'Du ___ Deutsch. (lernen)', answer: 'lernst' }),
    null,
    'an infinitive hint is not the answer',
  );
  assert.equal(
    exclusionReason({ id: 'z', topic: 'definite-articles', questionDe: 'Korrigiere: „Das Schere ist hier.“', answer: 'Die Schere ist hier.' }),
    null,
    'an error-correction item quotes the sentence on purpose',
  );
});

test('no prompt is a bare meta question or a cue list too thin to determine the sentence', () => {
  for (const item of USABLE) assert.equal(isMetaPrompt(item), false, `meta prompt: ${label(item)}`);
  assert.equal(MIN_BRACKET_CUES, 3);
  assert.equal(
    exclusionReason({ id: 'a', topic: 'indefinite-articles', questionDe: 'Wie sagt man das?', answer: 'Ich bin Lehrer.' }),
    REASON.META_PROMPT,
  );
  assert.equal(
    exclusionReason({ id: 'b', topic: 'personal-pronouns', questionDe: 'Schreib den Satz: [spielen / Fußball]', answer: 'Wir spielen Fußball.' }),
    REASON.META_PROMPT,
    'the subject lives only in the English gloss',
  );
  assert.equal(
    exclusionReason({ id: 'c', topic: 'personal-pronouns', questionDe: 'Schreib den Satz: [wir / kommen / aus Marokko]', answer: 'Wir kommen aus Marokko.' }),
    null,
    'three cues determine the sentence',
  );
});

test('the items the review names by id are excluded, whatever the rules do next', () => {
  const named = {
    '75a1cec4-0090-4675-852f-abb4d51dabb1': 'Sie ___ drei Kinder (ambiguous Sie, L9)',
    '160867f8-dbb5-41ec-87ba-d9408124308b': 'Du sprichst mit deinem Lehrer (meta, L7)',
    'bb0ead84-4c69-547b-b8aa-b791b1c0e375': 'Das ist ___ Uhr → keine (round 1 blocker)',
  };
  for (const [id, why] of Object.entries(named)) {
    assert.ok(Object.prototype.hasOwnProperty.call(EXCLUDE_IDS, id), `${id} is not hand-flagged: ${why}`);
    assert.equal(exclusionReason({ id, questionDe: 'harmlos', answer: 'gut' }), REASON.HAND_FLAGGED, why);
    assert.ok(!USABLE.some((i) => i.id === id), `${id} survives the filter: ${why}`);
  }
  // The five the RULES catch: named here so a weakened rule fails loudly.
  const byRule = {
    'bb176cf1-73d2-5960-8b19-737bd928712b': REASON.ANSWER_IN_PROMPT,
    'ee6118f0-a72e-4434-9d28-4f30ffdc242b': REASON.META_PROMPT,
    '758c6589-bbd9-5fdd-8ce0-7d738039033c': REASON.META_PROMPT,
    '2f9bf1dc-0221-5f9e-bfdc-17037f97d80a': REASON.ORDINAL_NUMBER,
    'f0532751-96db-5cb5-bde4-198903f34ed1': REASON.ORDINAL_NUMBER,
    'ba0f5667-a00d-57a4-9a76-5571224696a4': REASON.UNTAUGHT_TIME_EXCEPTION,
  };
  for (const [id, reason] of Object.entries(byRule)) {
    const item = ALL.find((i) => i.id === id);
    if (!item) continue; // already gone from the artefact — the rule still stands
    assert.equal(exclusionReason(item), reason, `${id} should be dropped as ${reason}`);
  }
});

test('the level-scoped rules are scoped: an ordinal or a month is fine above A1.1', () => {
  const ordinal = { id: 'o', topic: 'time-and-dates', questionDe: 'Heute ist der ___ Mai. (3.)', answer: 'dritte' };
  assert.equal(exclusionReason(ordinal), REASON.ORDINAL_NUMBER, 'no level named → the strict default');
  assert.equal(exclusionReason(ordinal, { level: 'a1.1' }), REASON.ORDINAL_NUMBER);
  assert.equal(exclusionReason(ordinal, { level: 'a1.2' }), null);
  assert.equal(exclusionReason(ordinal, { level: 'a2.1' }), null);
});

test('enough survives for every topic Lektion 8 and Lektion 11 draw', () => {
  // The review's instruction was to filter, "es bleiben genug (26 Items im Topic)".
  // Seven is a Lektion; a topic under that would thin a Lektion out silently.
  for (const topic of ['time-and-dates', 'separable-verbs-intro', 'present-tense-regular', 'verb-haben']) {
    const n = USABLE.filter((i) => i.topic === topic).length;
    assert.ok(n >= 7, `only ${n} usable items left on ${topic}`);
  }
});
