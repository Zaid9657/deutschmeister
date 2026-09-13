// Answer checking: the two comparison rules that REVIEW #4 called BLOCKERs.
//
// BLOCKER 1 — a spelled-out word ("H-A-L-L-O") made the task writer's choice of
// separator part of the exam: HALLO and H A L L O came back wrong, tagged
// Wortschatz, in the free first Lektion.
// BLOCKER 3 — the course teaches "Ihr, immer groß", and the engine could not see
// case at all: 'ihr' against ['Ihr'] was correct, under an explanation saying the
// opposite. Standard §3 binds the rest: capitalisation is a typo-class error with
// ONE retry, while an article or an ending is never a typo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAnswer, tagError, isCaseTask, isDictationTask, checkOptionsFor,
  normalizeSpelling, spellingApplies, STRICT_TOPIC,
  RESULT, ERROR_TAGS,
} from '../src/lib/lesson/check.js';

// --- BLOCKER 1: spelled-out words ------------------------------------------

test('a spelled-out word is one answer however the learner separates it', () => {
  const spelled = ['H-A-L-L-O'];
  for (const typed of ['H-A-L-L-O', 'HALLO', 'Hallo', 'H A L L O', 'h-a-l-l-o', 'hallo', 'H–A–L–L–O']) {
    assert.equal(
      checkAnswer(typed, spelled).result, RESULT.CORRECT,
      `${typed} should be accepted for H-A-L-L-O`,
    );
  }
});

test('spelling mode forgives the separator, not the letters', () => {
  assert.notEqual(checkAnswer('HALO', ['H-A-L-L-O']).result, RESULT.CORRECT);
  assert.notEqual(checkAnswer('H-A-L-O', ['H-A-L-L-O']).result, RESULT.CORRECT);
  assert.equal(checkAnswer('TSCHÜSS', ['T-S-C-H-Ü-S-S']).result, RESULT.CORRECT);
  assert.equal(checkAnswer('tschuess', ['T-S-C-H-Ü-S-S']).result, RESULT.CORRECT);
});

test('spelling is detected from the expected answer, and can be forced', () => {
  assert.equal(spellingApplies(['H-A-L-L-O']), true);
  assert.equal(spellingApplies(['Ich bin Lehrer.']), false);
  assert.equal(spellingApplies(['Viertel vor']), false);
  assert.equal(normalizeSpelling('H - A - L - L - O'), 'HALLO');
  assert.equal(checkAnswer('H A L L O', ['HALLO'], { spelling: true }).result, RESULT.CORRECT);
});

// --- BLOCKER 3: capitalisation ---------------------------------------------

test('on a case task a case-only miss is wrong and tagged Rechtschreibung', () => {
  const res = checkAnswer('ihr', ['Ihr'], { caseSensitive: true });
  assert.equal(res.result, RESULT.WRONG);
  assert.equal(res.expected, 'Ihr');
  assert.equal(res.reason, 'case');
  const tag = tagError({ caseSensitive: true, topic: 'polite-forms', type: 'fill_blank' }, 'ihr', 'Ihr');
  assert.equal(tag, 'Rechtschreibung');
  assert.ok(ERROR_TAGS.includes('Rechtschreibung'));
  assert.equal(checkAnswer('Ihr', ['Ihr'], { caseSensitive: true }).result, RESULT.CORRECT);
});

test('elsewhere a case-only miss costs one retry, not the item (standard §3)', () => {
  const short = checkAnswer('ihr', ['Ihr']);
  assert.equal(short.result, RESULT.TYPO, 'the short-function-word guard must not swallow case');
  assert.equal(short.expected, 'Ihr');
  assert.equal(short.reason, 'case');

  const sentence = checkAnswer('ich bin lehrer.', ['Ich bin Lehrer.']);
  assert.equal(sentence.result, RESULT.TYPO);
  assert.equal(sentence.expected, 'Ich bin Lehrer.');
  assert.equal(sentence.reason, 'case');

  assert.equal(checkAnswer('die schere ist hier.', ['Die Schere ist hier.']).result, RESULT.TYPO);
  assert.equal(checkAnswer('Ich bin Lehrer.', ['Ich bin Lehrer.']).result, RESULT.CORRECT);
});

test('a lower-case form that is explicitly accepted stays correct', () => {
  assert.equal(checkAnswer('ihr', ['Ihr', 'ihr'], { caseSensitive: true }).result, RESULT.CORRECT);
});

// --- everything that was already true ---------------------------------------

test('existing behaviours are unchanged', () => {
  assert.equal(checkAnswer('Ich bin müde.', ['Ich bin müde.']).result, RESULT.CORRECT);
  // an article is never a typo, and an umlaut respelling is never an error
  assert.equal(checkAnswer('das', ['ein'], { strict: true }).result, RESULT.WRONG);
  assert.equal(checkAnswer('Dere', ['Der'], { strict: true }).result, RESULT.WRONG);
  assert.equal(checkAnswer('waere', ['wäre']).result, RESULT.CORRECT, 'ae/ä are the same answer');
  assert.equal(
    checkAnswer('Meine Karte ist schoen', ['Meine Karte ist schön'], { strict: true }).result,
    RESULT.CORRECT,
  );
  assert.equal(checkAnswer('Das ist mene Party.', ['Das ist meine Party.'], { strict: true }).result, RESULT.TYPO);
  assert.equal(checkAnswer('', ['bin']).result, RESULT.WRONG);
});

test('dictation is unchanged', () => {
  const same = (a, b) => checkAnswer(a, [b], { dictation: true }).result;
  assert.equal(same('0176 234567', '0176-2345 67'), RESULT.CORRECT);
  assert.equal(same('Meine Nummer ist 0176-23 45 67.', 'Meine Nummer ist 0176 234567.'), RESULT.CORRECT);
  assert.equal(same('Null eins sieben sechs - drei', 'Null eins sieben sechs – drei'), RESULT.CORRECT);
  assert.equal(same('Er sagt "Hallo".', 'Er sagt „Hallo“.'), RESULT.CORRECT);
  assert.equal(same('0176 234568', '0176 234567'), RESULT.WRONG);
  assert.equal(tagError({ kind: 'dictation' }, 'x', 'y'), 'Hören');
});

// --- REVIEW #5 BLOCKER 3: the case flag comes from the task ------------------
//
// The old isCaseTask read a regex over the ANSWER FORM (/^Ihr(e|en)?$/ on
// possessive-article items). It fired on extra-a11-l12-10 ('___ Geschenke sind
// hier. (sie, Plural)', accepted 'Ihre'), whose own explanation says the answer
// is *ihre* — a capital that is only the sentence opener — and it missed the
// real politeness items (extra-a11-l03-08 'Sie', extra-a11-l01-06 'Ihnen'),
// which are not possessive-article items at all. The items now carry the flag.

test('isCaseTask is the item flag and nothing else', () => {
  assert.equal(isCaseTask({ caseSensitive: true, topic: 'anything' }), true);
  assert.equal(isCaseTask({ caseSensitive: true, topic: 'polite-forms', answer: 'Ihnen' }), true);
  // extra-a11-l12-10: 'ihre' is the taught answer, the capital is the opener
  assert.equal(isCaseTask({ topic: 'possessive-articles', answer: 'Ihre' }), false);
  assert.equal(isCaseTask({ topic: 'possessive-articles', answer: 'Ihr' }), false);
  assert.equal(isCaseTask({ topic: 'definite-articles', answer: 'Die' }), false);
  assert.equal(isCaseTask({ caseSensitive: false, answer: 'Ihr' }), false);
  assert.equal(isCaseTask(null), false);
});

test('an unflagged sentence-opener answer is not graded on its capital', () => {
  // extra-a11-l12-10: 'ihre' vs ['Ihre'], no flag → correct, no red X
  assert.equal(checkAnswer('ihre', ['ihre']).result, RESULT.CORRECT);
  assert.equal(checkAnswer('ihre', ['Ihre']).result, RESULT.TYPO);
  // the polite item (flagged by the items agent) still grades the capital
  assert.equal(checkAnswer('ihr', ['Ihr'], { caseSensitive: true }).result, RESULT.WRONG);
  assert.equal(checkAnswer('ihr', ['Ihr'], { caseSensitive: false }).result, RESULT.TYPO);
  assert.equal(
    tagError({ caseSensitive: true, topic: 'polite-forms', type: 'fill_blank' }, 'ihr', 'Ihr'),
    'Rechtschreibung',
  );
});

// --- REVIEW #5 MAJOR 14: a sentence miss is tagged by WHERE it differs -------

test('a sentence miss is tagged by what differs, not by the item type', () => {
  const sb = { type: 'sentence_building', topic: 'definite-articles' };
  // missing article — was booked as Verbstellung for every sentence item
  assert.equal(tagError(sb, 'Honig ist gut.', 'Der Honig ist gut.'), 'Artikel');
  assert.equal(
    tagError({ type: 'sentence_building', topic: 'indefinite-articles' }, 'Ich möchte einen Glas Wasser.', 'Ich möchte ein Glas Wasser.'),
    'Kasus',
  );
  // same words, different order — this is what Verbstellung means
  assert.equal(
    tagError({ type: 'sentence_building', topic: 'yes-no-questions' }, 'Kommst am Freitag du mit?', 'Kommst du am Freitag mit?'),
    'Verbstellung',
  );
  // a wrong separable prefix is a word, not a word order
  assert.equal(
    tagError({ type: 'sentence_building', topic: 'separable-verbs' }, 'Ich rufe meine Mutter ab.', 'Ich rufe meine Mutter an.'),
    'Wortschatz',
  );
  // another finite form of the same verb
  assert.equal(
    tagError({ type: 'sentence_building', topic: 'present-tense' }, 'Er spreche Deutsch.', 'Er spricht Deutsch.'),
    'Konjugation',
  );
  // one misspelt long word stays spelling
  assert.equal(
    tagError({ type: 'sentence_building', topic: 'numbers' }, 'Der Stuhl kostet zwöllf Euro.', 'Der Stuhl kostet zwölf Euro.'),
    'Rechtschreibung',
  );
  // a case-only miss is spelling before any of this
  assert.equal(tagError(sb, 'der honig ist gut.', 'Der Honig ist gut.'), 'Rechtschreibung');
});

test('the yes-no-question rules still hold, and single words are unchanged', () => {
  const yn = { type: 'sentence_building', topic: 'yes-no-questions' };
  // the question mark is missing
  assert.equal(tagError(yn, 'Kommst du am Freitag mit', 'Kommst du am Freitag mit?'), 'Verbstellung');
  // the finite verb is not first
  assert.equal(tagError(yn, 'Du kommst am Freitag mit?', 'Kommst du am Freitag mit?'), 'Verbstellung');
  // too many differences to locate → the item's topic decides, as before
  assert.equal(tagError(yn, 'Ich weiß es nicht.', 'Kommst du am Freitag mit?'), 'Verbstellung');
  // single-word behaviour: untouched
  assert.equal(tagError({ topic: 'definite-articles', type: 'fill_blank' }, 'die', 'der'), 'Artikel');
  assert.equal(tagError({ topic: 'possessive-articles', type: 'fill_blank' }, 'mein', 'meine'), 'Kasus');
  assert.equal(tagError({ topic: 'verb-sein', type: 'fill_blank' }, 'bist', 'bin'), 'Konjugation');
  assert.equal(tagError({ topic: 'plural-nouns', type: 'fill_blank' }, 'Buchs', 'Bücher'), 'Plural');
  assert.equal(tagError({ kind: 'dictation' }, 'x', 'y'), 'Hören');
});

// --- REVIEW #6 BLOCKER 3 (second half): dictation is an item flag ---------

test('isDictationTask reads the item, not the call site', () => {
  assert.equal(isDictationTask({ kind: 'dictation' }), true);
  assert.equal(isDictationTask({ type: 'dictation' }), true);
  assert.equal(isDictationTask({ stage: 'listening' }), true);
  assert.equal(isDictationTask({ stage: 'listening', kind: 'other' }), true);
  assert.equal(isDictationTask({ type: 'fill_blank' }), false);
  assert.equal(isDictationTask({}), false);
  assert.equal(isDictationTask(null), false);
});

test('a checkpoint dictation with a separator grades the same as the lesson', () => {
  // a1.1-cp2-hoeren-1: the phone number that disagreed between the lesson
  // (dictation: true passed by hand) and the checkpoint (dropped it).
  const item = { stage: 'listening', accepted: ['Null vier zwei – drei drei acht eins.'] };
  const opts = checkOptionsFor(item);
  assert.equal(opts.dictation, true);
  assert.equal(
    checkAnswer('Null vier zwei - drei drei acht eins.', item.accepted, opts).result,
    RESULT.CORRECT,
    'a normal hyphen instead of an en dash is still correct once dictation is on',
  );
  assert.equal(
    checkAnswer('Null vier zwei drei drei acht eins.', item.accepted, opts).result,
    RESULT.CORRECT,
    'no separator at all is still correct once dictation is on',
  );
});

// --- REVIEW #6 BLOCKER 3: one options-builder, so every grading site agrees

test('checkOptionsFor derives every option from the item alone', () => {
  const politeItem = { caseSensitive: true, topic: 'polite-forms', answer: 'Ihr' };
  assert.deepEqual(checkOptionsFor(politeItem), {
    strict: STRICT_TOPIC.test('polite-forms'),
    caseSensitive: true,
    dictation: false,
    spelling: false,
  });

  const spelledItem = { topic: 'alphabet-pronunciation', accepted: ['H-A-L-L-O'] };
  assert.equal(checkOptionsFor(spelledItem).spelling, true);

  const dictationItem = { kind: 'dictation', answer: 'Ich bin Lehrer.' };
  assert.equal(checkOptionsFor(dictationItem).dictation, true);

  const articleItem = { topic: 'definite-articles', answer: 'der' };
  assert.equal(checkOptionsFor(articleItem).strict, true);
  assert.equal(checkOptionsFor(articleItem).caseSensitive, false);

  // falls back to `answer` when `accepted` is absent, same as the call sites do
  assert.equal(checkOptionsFor({ answer: 'bin' }).spelling, false);

  // and the whole thing is a drop-in replacement for the hand-built options
  const item = { caseSensitive: true, topic: 'polite-forms', answer: 'Ihr', accepted: ['Ihr'] };
  assert.deepEqual(
    checkAnswer('ihr', item.accepted, checkOptionsFor(item)),
    checkAnswer('ihr', item.accepted, { strict: STRICT_TOPIC.test(item.topic), caseSensitive: isCaseTask(item), dictation: isDictationTask(item), spelling: spellingApplies(item.accepted) }),
  );
});

// --- REVIEW #6 MAJOR 9: a number word is never Konjugation -----------------

test('a misspelt number word is Wortschatz, whatever the item topic says', () => {
  // the four L2 items: topic 'verb-sein' (the lesson has no topic of its own
  // for numbers), answer a number word — a slip must not read as conjugation
  const item = { topic: 'verb-sein', type: 'fill_blank' };
  assert.equal(tagError(item, 'sieber', 'sieben'), 'Wortschatz');
  assert.equal(tagError(item, 'sechs', 'sieben'), 'Wortschatz');
  assert.equal(tagError(item, 'seven', 'sieben'), 'Wortschatz');
  assert.equal(tagError(item, 'siben', 'sieben'), 'Wortschatz');
  assert.equal(tagError(item, 'zehn', 'zwölf'), 'Wortschatz');
  // a bare digit string, same rule
  assert.equal(tagError(item, '13', '12'), 'Wortschatz');
  // a real verb-sein miss on the same topic is untouched
  assert.equal(tagError(item, 'bist', 'bin'), 'Konjugation');
});
