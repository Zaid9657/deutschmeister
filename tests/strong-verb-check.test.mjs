import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkAnswer, checkOptionsFor, isChoiceItem, tagError, RESULT } from '../src/lib/lesson/check.js';
import { gradeTypedReview } from '../src/lib/checkpoint/reviewGrading.js';
import { firstAttemptAccuracy } from '../src/lib/lesson/mastery.js';

const A12 = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a12.json', import.meta.url), 'utf8'));

test('strong-verb stem changes are grammatical errors in dictation and typed review', () => {
  const pairs = [
    ['spricht', 'sprecht'], ['liest', 'lest'], ['fährt', 'fahrt'], ['isst', 'esst'],
    ['sieht', 'seht'], ['nimmt', 'nehmt'], ['gibt', 'gebt'], ['hilft', 'helft'],
    ['trifft', 'trefft'], ['läuft', 'lauft'], ['schläft', 'schlaft'], ['trägt', 'tragt'],
    ['wäscht', 'wascht'], ['hält', 'haltet'], ['fällt', 'fallt'], ['lässt', 'lasst'],
    ['fängt', 'fangt'], ['stößt', 'stoßt'], ['wirft', 'werft'], ['bricht', 'brecht'],
    ['stirbt', 'sterbt'], ['tritt', 'tretet'], ['vergisst', 'vergesst'],
    ['empfiehlt', 'empfehlt'], ['widerspricht', 'widersprecht'], ['vorliest', 'vorlest'],
    ['schlägt', 'schlagt'], ['wächst', 'wachst'], ['säuft', 'sauft'],
    ['schmilzt', 'schmelzt'], ['schwillt', 'schwellt'], ['quillt', 'quellt'],
    ['erschrickt', 'erschreckt'],
  ];
  for (const [singular, plural] of pairs) {
    for (const [expected, given] of [[singular, plural], [plural, singular]]) {
      const subject = expected === singular ? 'er' : 'ihr';
      const answer = `Ja, ${subject} ${expected} heute.`;
      const typed = `Ja, ${subject} ${given} heute.`;
      const item = { kind: 'dictation', answer, accepted: [answer] };
      const { result } = checkAnswer(typed, item.accepted, checkOptionsFor(item));
      assert.equal(result, RESULT.WRONG, `${given} for ${expected}`);
      assert.equal(firstAttemptAccuracy([{ itemId: 'dictation', stage: 'dictation', correct: result !== RESULT.WRONG, listened: true }]), 0);
      assert.deepEqual(gradeTypedReview('pattern:present-tense', [answer], typed), { result: RESULT.WRONG, ok: false });
    }
  }
  assert.equal(tagError({}, 'Er lest heute.', 'Er liest heute.'), 'Konjugation');
});

test('strong-verb checking keeps genuine misspellings as TYPO and accepted forms correct', () => {
  for (const [answer, typed] of [
    ['Er spricht Deutsch.', 'Er sprichht Deutsch.'],
    ['Sie liest heute.', 'Sie liestt heute.'],
    ['Er hilft heute.', 'Er hielft heute.'],
    ['Er fehlt heute.', 'Er fiehlt heute.'],
    ['Sie trägt eine Tasche.', 'Sie träggt eine Tasche.'],
    ['Er kommt aus Marokko.', 'Er kommt aus Marocko.'],
    ['Ich wohne in der Hauptstraße.', 'Ich wohne in der Hauptstrase.'],
  ]) {
    const options = checkOptionsFor({ kind: 'dictation', answer });
    assert.equal(checkAnswer(typed, answer, options).result, RESULT.TYPO, typed);
    assert.equal(checkAnswer(answer, answer, options).result, RESULT.CORRECT);
  }
  assert.equal(checkAnswer('Sie fährt heute.', 'Sie faehrt heute.').result, RESULT.CORRECT);
  assert.equal(checkAnswer('Ihr lest heute.', ['Er liest heute.', 'Ihr lest heute.']).result, RESULT.CORRECT);
});

// ── 2026-10-25 review, C-053 / C-062: the stem vowel an A1.2 item teaches is not a typo ──────────
// The present-tense fix above (STRONG_STEMS) never reached the three other places a stem changes:
// the strong Perfekt participle („getrinken", „gegingen", „gesprechen", „geessen"), the bare
// du-imperative („Sprech" for „Sprich" — no ending at all) and the modal singular („Ich müss …").
// Each came back TYPO, i.e. a correct first try, on the very form the Lektion teaches.

const grade = (item, typed) => checkAnswer(typed, item.accepted && item.accepted.length ? item.accepted : [item.answer], checkOptionsFor(item)).result;
const byId = (id) => {
  const item = A12.items.find((i) => i.id === id);
  assert.ok(item, id);
  return item;
};

test('the served A1.2 items: a participle, an imperative or a modal on the wrong stem is wrong', () => {
  assert.equal(grade(byId('extra-a12-l12-02'), 'getrinken'), RESULT.WRONG, 'Tim hat den Saft ___. (trinken)');
  assert.equal(grade(byId('extra-a12-l12-01'), 'geessen'), RESULT.WRONG, 'Ana hat Kuchen und Schokolade ___. (essen)');
  assert.equal(grade(byId('35ba0d3e-e83a-5a72-92bc-3e77f769ad95'), 'gegingen'), RESULT.WRONG, 'Ich bin nach Hause ___. (gehen, Perfekt)');
  assert.equal(grade(byId('extra-a12-l12-10'), 'Ana hat Milch getrinken.'), RESULT.WRONG, 'the correction whose point is getrunken');
  assert.equal(grade(byId('extra-a12-l12-17'), 'Der Fisch war lecker, aber Tim ist früh gegingen.'), RESULT.WRONG);
  assert.equal(grade(byId('cfaf34e4-e9b5-5f1b-a551-6da2b642d3c6'), 'Sprech'), RESULT.WRONG, '___ bitte langsam! (sprechen, du)');
  assert.equal(grade(byId('extra-a12-l09-06'), 'Ich müss den Müll nach Hause nehmen.'), RESULT.WRONG, 'the modal singular');
  assert.equal(checkAnswer('Er hat Deutsch gesprechen.', ['Er hat Deutsch gesprochen.']).result, RESULT.WRONG);
  assert.equal(checkAnswer('Du wisst das.', ['Du weißt das.']).result, RESULT.WRONG, 'wissen conjugates like a modal');
  assert.equal(checkAnswer('Du wollst kommen.', ['Du willst kommen.']).result, RESULT.WRONG);
  assert.equal(checkAnswer('Vergess das nicht!', ['Vergiss das nicht!']).result, RESULT.WRONG);
  // The review grades the same way.
  assert.equal(gradeTypedReview('pattern:perfekt-intro', ['getrunken'], 'getrinken').ok, false);
});

const STRONG_PARTICIPLE_RE = /^(?:ab|an|auf|aus|bei|ein|fern|mit|nach|vor|weg|zu|zurück)?ge\p{Ll}{2,}en$/u;
const MODAL_SINGULAR = new Set(['muss', 'musst', 'kann', 'kannst', 'darf', 'darfst', 'will', 'willst', 'soll', 'sollst', 'mag', 'magst', 'weiß', 'weißt']);
const IMPERATIVE_STEMS = new Map([['sprich', 'sprech'], ['lies', 'les'], ['iss', 'ess'], ['sieh', 'seh'], ['nimm', 'nehm'], ['gib', 'geb'],
  ['hilf', 'helf'], ['triff', 'treff'], ['wirf', 'werf'], ['brich', 'brech'], ['vergiss', 'vergess'], ['empfiehl', 'empfehl']]);
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü'];

/** The wrong-stem forms of one word: another stem vowel or a stem letter dropped (participle), the
 *  other vowel of a modal singular, the unchanged stem of a strong imperative. */
function wrongStems(word) {
  const lower = word.toLowerCase();
  const out = new Set();
  if (word === lower && STRONG_PARTICIPLE_RE.test(word)) {
    const start = word.indexOf('ge') + 2; const end = word.length - 2;
    for (let i = start; i < end; i += 1) {
      if (VOWELS.includes(word[i])) for (const v of VOWELS) if (v !== word[i]) out.add(word.slice(0, i) + v + word.slice(i + 1));
      if (word[i] !== word[i - 1] && word[i] !== word[i + 1]) out.add(word.slice(0, i) + word.slice(i + 1));
    }
  }
  if (MODAL_SINGULAR.has(lower)) {
    for (let i = 0; i < word.length; i += 1) {
      if (!VOWELS.includes(word[i])) continue;
      for (const v of VOWELS) if (v !== word[i]) out.add(word.slice(0, i) + v + word.slice(i + 1));
    }
  }
  if (IMPERATIVE_STEMS.has(lower)) {
    const base = IMPERATIVE_STEMS.get(lower);
    out.add(word[0] === word[0].toUpperCase() ? base.charAt(0).toUpperCase() + base.slice(1) : base);
  }
  return [...out];
}

test('the rule over every A1.2 Perfekt, imperative, stem-changing and modal item', () => {
  // The checkpoint papers draw their typed items from these same pool rows.
  const items = A12.items.filter((i) => /perfekt|imperativ|stem-chang|modal/.test(i.topic || ''));
  let measured = 0;
  for (const item of items) {
    if (isChoiceItem(item)) continue;
    const accepted = item.accepted && item.accepted.length ? item.accepted : [item.answer];
    if (!accepted[0]) continue;
    const taken = new Set(accepted.map((a) => a.toLowerCase().replace(/[.!?]+$/, '')));
    for (const answer of accepted) {
      const tokens = String(answer).split(' ');
      tokens.forEach((token, i) => {
        const [, word, tail] = token.match(/^(\p{L}+)(.*)$/u) || [];
        if (!word) return;
        for (const wrong of wrongStems(word)) {
          const typed = [...tokens.slice(0, i), `${wrong}${tail}`, ...tokens.slice(i + 1)].join(' ');
          if (taken.has(typed.toLowerCase().replace(/[.!?]+$/, ''))) continue;
          measured += 1;
          const { result } = checkAnswer(typed, accepted, checkOptionsFor(item));
          assert.equal(result, RESULT.WRONG, `${item.id}: „${typed}" for „${answer}" — the stem is the form`);
        }
      });
    }
  }
  assert.ok(measured > 200, `the rule reads the forms it was written for (${measured})`);
});

test('a slip inside a participle that changes no form keeps its allowance', () => {
  for (const [typed, key] of [
    ['getrunkken', 'getrunken'], // a key that bounced
    ['genomen', 'genommen'], // one of a doubled pair dropped
    ['Ich habe Wasser getrumken.', 'Ich habe Wasser getrunken.'], // a neighbouring consonant
    ['Tim ist nach Hause gegangenn.', 'Tim ist nach Hause gegangen.'],
  ]) {
    assert.equal(checkAnswer(typed, [key]).result, RESULT.TYPO, `${typed} for ${key}`);
  }
  // A plural noun that looks like a participle is not one.
  assert.equal(checkAnswer('Ich habe viele Gedanken.', ['Ich habe viele Gedanken.']).result, RESULT.CORRECT);
  assert.equal(checkAnswer('Ich habe viele Gedenken.', ['Ich habe viele Gedanken.']).result, RESULT.TYPO, 'a capitalised word is no participle');
  // Present-tense forms keep the rules of the first test.
  assert.equal(checkAnswer('Er hielft heute.', ['Er hilft heute.']).result, RESULT.TYPO);
});
