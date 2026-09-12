// Guard suite for scripts/rule-card-overrides.mjs.
//
// The override file replaces generated rule cards WHOLE: the builder merges each
// entry over the card of the same slug, so a missing key does not fall through to
// the generated value, it disappears from the text
// `netlify/functions/explain-answer.mjs` puts in the prompt. That is the failure
// this suite exists for — it compares the shape of every override against the
// COMMITTED netlify/functions/_shared/ruleCards.mjs, which is the generated
// artefact the override has to stand in for.
//
// The content rules come from the second DaF review
// (docs/course-factory/a11-rebuild/REVIEW-daf-2-2026-09-12.md §D):
//   * no sound comparison to English ("sounds like", "like English") — that
//     framing is what the review rejected on `alphabet-pronunciation`, and the
//     item pool was already cleaned of it;
//   * no percentage sign — the unsourced genus split on `nouns-gender` is a
//     measure-before-you-claim violation, so the character is banned outright;
//   * no ordinal number anywhere on `time-and-dates` — the course defers the
//     date with ordinals to A1.2 in writing, and the generated card was the only
//     place in the repo that taught it anyway. Naming the deferral ("Das Datum
//     mit Ordnungszahlen kommt erst in A1.2") is allowed; an ordinal FORM is not;
//   * at most 120 German words in the main rule, because the card is read by a
//     learner who has just failed an item. The English support line is excluded
//     from that count — it is deliberately English, one line per card, and
//     required to exist so the L1 support is consistent rather than accidental.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import OVERRIDES, { RULE_CARD_OVERRIDE_SLUGS } from '../scripts/rule-card-overrides.mjs';
import { RULE_CARDS } from '../netlify/functions/_shared/ruleCards.mjs';

const MAX_GERMAN_WORDS = 120;
const ENGLISH_LINE = /^English:/;

const germanWords = (content) =>
  content
    .split('\n')
    .filter((line) => !ENGLISH_LINE.test(line.trim()))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean);

const sortedKeys = (obj) => Object.keys(obj).sort();

test('the exported slug list matches the override map', () => {
  assert.deepEqual(RULE_CARD_OVERRIDE_SLUGS, Object.keys(OVERRIDES));
  assert.ok(RULE_CARD_OVERRIDE_SLUGS.length > 0, 'no overrides declared');
});

test('every override replaces a slug that the generated cards actually carry', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(RULE_CARDS, slug),
      `${slug} is not a generated rule card — an override for it would never be merged`,
    );
    assert.equal(slug, slug.toLowerCase(), `${slug} must be lowercase: ruleCard() lowercases the lookup`);
  }
});

test('every override has exactly the keys of the generated card it replaces', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    assert.deepEqual(
      sortedKeys(OVERRIDES[slug]),
      sortedKeys(RULE_CARDS[slug]),
      `${slug}: override keys diverge from the generated card`,
    );
  }
});

test('commonMistakes entries have the generated mistake shape', () => {
  const shape = ['correct', 'explanationDe', 'wrong'];
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const mistakes = OVERRIDES[slug].commonMistakes;
    assert.ok(Array.isArray(mistakes), `${slug}: commonMistakes must be an array`);
    for (const [i, mistake] of mistakes.entries()) {
      assert.deepEqual(sortedKeys(mistake), shape, `${slug}: commonMistakes[${i}] has the wrong keys`);
      for (const key of shape) {
        assert.ok(mistake[key].trim().length > 0, `${slug}: commonMistakes[${i}].${key} is empty`);
      }
    }
  }
});

test('titleDe and content are non-empty German strings', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const card = OVERRIDES[slug];
    assert.equal(typeof card.titleDe, 'string');
    assert.equal(typeof card.content, 'string');
    assert.ok(card.titleDe.trim().length > 0, `${slug}: titleDe is empty`);
    assert.ok(card.content.trim().length > 0, `${slug}: content is empty`);
  }
});

test('the main rule stays under the German word budget', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const words = germanWords(OVERRIDES[slug].content);
    assert.ok(
      words.length <= MAX_GERMAN_WORDS,
      `${slug}: ${words.length} German words in content, budget is ${MAX_GERMAN_WORDS}`,
    );
  }
});

test('each card carries exactly one short English support line', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const lines = OVERRIDES[slug].content.split('\n').map((l) => l.trim());
    const english = lines.filter((l) => ENGLISH_LINE.test(l));
    assert.equal(english.length, 1, `${slug}: expected one "English:" support line, found ${english.length}`);
    assert.ok(
      english[0].split(/\s+/).length <= 25,
      `${slug}: the English support line is a line, not a paragraph`,
    );
  }
});

test('no card compares German sounds to English', () => {
  const banned = [/sounds?\s+like/i, /like\s+English/i, /English\s+(Example|Sound)/i, /klingt\s+wie/i];
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const card = OVERRIDES[slug];
    const haystack = [
      card.titleDe,
      card.content,
      ...card.commonMistakes.flatMap((m) => [m.wrong, m.correct, m.explanationDe]),
    ].join('\n');
    for (const pattern of banned) {
      assert.ok(!pattern.test(haystack), `${slug}: banned sound comparison ${pattern}`);
    }
  }
});

test('no card states a percentage', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const card = OVERRIDES[slug];
    const haystack = [
      card.titleDe,
      card.content,
      ...card.commonMistakes.flatMap((m) => [m.wrong, m.correct, m.explanationDe]),
    ].join('\n');
    assert.ok(!haystack.includes('%'), `${slug}: a percentage has no source on an A1 rule card`);
    assert.ok(!/\bProzent\b/i.test(haystack), `${slug}: a percentage has no source on an A1 rule card`);
  }
});

test('nouns-gender teaches the gender-predicting endings instead of a share table', () => {
  const card = OVERRIDES['nouns-gender'];
  for (const ending of ['-ung', '-heit', '-keit', '-schaft', '-chen', '-lein', '-er']) {
    assert.ok(card.content.includes(ending), `nouns-gender: the ${ending} rule is missing`);
  }
});

test('time-and-dates carries the clock but no ordinal form', () => {
  const card = OVERRIDES['time-and-dates'];
  const haystack = [
    card.titleDe,
    card.content,
    ...card.commonMistakes.flatMap((m) => [m.wrong, m.correct, m.explanationDe]),
  ].join('\n');

  // Ordinal WORD forms (am fünften Mai) and ordinal DIGIT forms (am 5. Mai).
  const ordinalWord =
    /\b(erst|zweit|dritt|viert|fünft|sechst|siebt|acht|neunt|zehnt|elft|zwölft|zwanzigst|dreißigst)(e|en|er|es|em)\b/i;
  // A standalone "5." — the leading (^|\s) keeps clock times like 9:30. out of it.
  const ordinalDigit = /(?:^|\s)\d{1,2}\.(?=\s|$)/m;
  assert.ok(!ordinalWord.test(haystack), 'time-and-dates must not teach an ordinal form (A1.2)');
  assert.ok(!ordinalDigit.test(haystack), 'time-and-dates must not teach an ordinal date (A1.2)');

  // …but it must say the deferral out loud, and it must be about the clock.
  assert.match(card.content, /A1\.2/, 'time-and-dates must name the A1.2 deferral');
  assert.match(card.content, /acht Uhr dreißig/, 'time-and-dates must carry the official time');
  assert.match(card.content, /halb neun/, 'time-and-dates must carry the everyday time');
  assert.match(card.content, /Viertel nach/, 'time-and-dates must carry Viertel nach');
  assert.match(card.content, /Viertel vor/, 'time-and-dates must carry Viertel vor');
  for (const preposition of [/\bum\b/, /\bam\b/, /\bim\b/]) {
    assert.match(card.content, preposition, `time-and-dates must explain ${preposition}`);
  }

  const mistakes = card.commonMistakes.map((m) => `${m.wrong} ${m.correct} ${m.explanationDe}`).join('\n');
  assert.match(mistakes, /halb neun = 8:30, nicht 9:30/, 'the halb-neun mistake is pinned by the review');
  assert.match(mistakes, /um Montag → am Montag/, 'the um/am mistake is pinned by the review');
});

test('alphabet-pronunciation names the German letters', () => {
  const card = OVERRIDES['alphabet-pronunciation'];
  for (const name of ['A a', 'B be', 'C tse', 'Z tset', 'Ä a-Umlaut', 'Ö o-Umlaut', 'Ü u-Umlaut', 'ß Eszett']) {
    assert.ok(card.content.includes(name), `alphabet-pronunciation: letter name "${name}" is missing`);
  }
  assert.match(card.content, /Wie schreibt man das\?/, 'the card must show how to ask for a spelling');
  assert.match(card.content, /A-N-A/, 'the card must show a spelled-out name');

  // 4–6 spelling examples drawn from the Lektion 1/2 Wortfeld.
  const examples = ['Chakiri', 'Ana', 'Tschüss', 'Entschuldigung', 'Vorname'];
  const present = examples.filter((word) => card.content.includes(word));
  assert.ok(present.length >= 4, `alphabet-pronunciation: only ${present.length} Lektion examples`);
  assert.ok(present.length <= 6, 'alphabet-pronunciation: keep the example list short');
});

test('yes-no-questions names the written-question rule and admits the spoken form', () => {
  const first = OVERRIDES['yes-no-questions'].commonMistakes[0];
  assert.match(
    first.explanationDe,
    /In der geschriebenen Frage steht das Verb auf Platz 1/,
    'commonMistakes[0] must state the written rule in those words',
  );
  assert.match(
    first.explanationDe,
    /[Gg]esprochen/,
    'commonMistakes[0] must acknowledge the spoken intonation question',
  );
});
