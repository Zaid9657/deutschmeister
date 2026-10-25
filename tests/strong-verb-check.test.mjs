import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, checkOptionsFor, tagError, RESULT } from '../src/lib/lesson/check.js';
import { gradeTypedReview } from '../src/lib/checkpoint/reviewGrading.js';
import { firstAttemptAccuracy } from '../src/lib/lesson/mastery.js';

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
