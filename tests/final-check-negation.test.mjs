import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 as curriculum } from '../src/data/curricula/a11.js';
import { asked } from '../src/lib/lesson/taskMeaning.js';
import { checkTurns, courseLexicon, typedResult, faultHintKey, canDoShown, modelAnswer, readSentences, spokenShown } from '../src/lib/lesson/finalCheck.js';
import { verbReadings, fold } from '../src/lib/lesson/germanForms.js';

const lexicon = courseLexicon(curriculum);
const turns = curriculum.lektionen.flatMap(lesson => checkTurns({ ...lesson.guided.check, lexicon }, 0));
const turnOf = kind => {
  const turn = turns.find(t => asked(t)?.kind === kind);
  assert.ok(turn, kind);
  return turn;
};
const verified = result => ['correct', 'typo'].includes(result);

test('all factual turn kinds and retakes distinguish an asserted model from its denial', () => {
  const factual = new Set(['name', 'origin', 'live', 'job', 'phone', 'language', 'photo', 'thing', 'here', 'colour', 'hobby', 'routine', 'clock', 'getUp', 'freeTime', 'travel', 'birthday', 'guests']);
  const covered = new Set();
  for (const lesson of curriculum.lektionen) for (let round = 0; round < 3; round++) {
    for (const turn of checkTurns({ ...lesson.guided.check, lexicon }, round)) {
      const kind = asked(turn)?.kind, answer = modelAnswer(turn);
      if (!factual.has(kind) || /…|\.\.\./u.test(answer) || /[.!?].+\p{L}/u.test(answer)) continue;
      if (readSentences(turn, answer)?.flatMap(s => s.clauses).filter(c => !c.around && !c.frag).length !== 1) continue;
      if (!verified(typedResult(turn, answer))) continue; // A model can name an unverified own word.
      let inserted = false;
      const denial = answer.replace(/\p{L}+/gu, word => {
        if (inserted || !verbReadings(fold(word)).some(r => r.mood === 'fin')) return word;
        inserted = true;
        return word + ' nicht';
      });
      if (!inserted) continue;
      assert.equal(verified(typedResult(turn, denial)), false, kind + ': ' + denial);
      covered.add(kind);
    }
  }
  assert.ok(covered.size >= 15, [...covered].join(', '));
});

test('a denied factual value supplies no answer; affirmative values still do', () => {
  const pairs = [
    ['name', 'Ich heiße Ahmed.', 'Ich heiße nicht Ahmed.'],
    ['name', 'Ich bin Ahmed.', 'Ich bin nicht Ahmed.'],
    ['name', 'Mein Name ist Ahmed.', 'Mein Name ist nicht Ahmed.'],
    ['name', 'Ich heiße Ahmed.', 'Ich heiße keineswegs Ahmed.'],
    ['name', 'Ich heiße Ahmed.', 'Ich heiße keinesfalls Ahmed.'],
    ['origin', 'Ich komme aus Syrien.', 'Ich komme nicht aus Syrien.'],
    ['origin', 'Ich komme aus Syrien.', 'Ich komme aus keinem Land.'],
    ['live', 'Ich wohne in Berlin.', 'Ich wohne nicht in Berlin.'],
    ['live', 'Ich wohne in Berlin.', 'Ich wohne in keiner Stadt.'],
    ['live', 'Ich wohne in Berlin.', 'Ich wohne in keinem Haus.'],
    ['job', 'Ich bin Lehrer.', 'Ich bin kein Lehrer.'],
    ['job', 'Ich arbeite als Lehrer.', 'Ich arbeite nicht als Lehrer.'],
    ['job', 'Ich arbeite als Lehrer.', 'Ich arbeite bei keiner Firma.'],
    ['phone', 'Meine Nummer ist 0176 43218965.', 'Meine Nummer ist nicht 0176 43218965.'],
    ['language', 'Sie spricht Arabisch.', 'Sie spricht kein Arabisch.'],
    ['age', 'Sie ist 20 Jahre alt.', 'Sie ist nicht 20 Jahre alt.'],
    ['photo', 'Das ist meine Mutter.', 'Das ist nicht meine Mutter.'],
    ['thing', 'Das ist ein Heft.', 'Das ist kein Heft.'],
    ['here', 'Es ist hier.', 'Es ist nicht hier.'],
    ['colour', 'Es ist rot.', 'Es ist nicht rot.'],
    ['hobby', 'Ich lese gern Bücher.', 'Ich lese nicht gern Bücher.'],
    ['routine', 'Ich mache morgens Sport.', 'Ich mache morgens keinen Sport.'],
    ['clock', 'Es ist halb neun.', 'Es ist nicht halb neun.'],
    ['getUp', 'Ich stehe um sieben Uhr auf.', 'Ich stehe nicht um sieben Uhr auf.'],
    ['freeTime', 'Am Montag habe ich frei.', 'Am Montag habe ich nicht frei.'],
    ['workWhen', 'Ich arbeite am Montag.', 'Ich arbeite nicht am Montag.'],
    ['travel', 'Ich fahre nach Berlin.', 'Ich fahre nicht nach Berlin.'],
    ['birthday', 'Ich habe im Mai Geburtstag.', 'Ich habe nicht im Mai Geburtstag.'],
  ];
  for (const [kind, right, denial] of pairs) {
    const turn = turnOf(kind);
    assert.ok(verified(typedResult(turn, right)), kind + ': ' + right);
    assert.equal(verified(typedResult(turn, denial)), false, kind + ': ' + denial);
  }
});

test('meaningful negative answers, contrast and negative modifiers remain answers', () => {
  for (const [kind, answer] of [
    ['name', 'Ich heiße nicht Ahmed, sondern Ali.'],
    ['name', 'Ich heiße nicht Ahmed. Ich heiße Ali.'],
    ['name', 'Ich heiße nicht nur Ahmed.'],
    ['live', 'Ich wohne nicht allein in Berlin.'],
    ['origin', 'Ich komme nicht aus Syrien, sondern aus dem Irak.'],
    ['live', 'Ich wohne nicht in Berlin, sondern in Bonn.'],
    ['language', 'Sie spricht nicht Arabisch, sondern Deutsch.'],
    ['age', 'Sie ist nicht alt.'],
    ['here', 'Es ist nicht hier, sondern dort.'],
    ['colour', 'Es ist nicht rot, sondern blau.'],
    ['job', 'Ich arbeite nicht.'],
    ['job', 'Ich arbeite als Lehrer bei keiner Schule.'],
    ['workWhen', 'Ich arbeite nicht.'],
    ['workWhen', 'Ich bin Rentner.'],
    ['did', 'Ich habe gestern nicht gearbeitet.'],
    ['did', 'Ich habe gestern nichts gemacht.'],
    ['routine', 'Ich dusche nicht und frühstücke.'],
    ['hobby', 'Ich habe keine Hobbys.'],
    ['hobby', 'Ich habe keine Hobbys. Und du?'],
    ['decline', 'Nein, danke.'],
  ]) assert.ok(verified(typedResult(turnOf(kind), answer)), kind + ': ' + answer);
  for (const kind of ['buy', 'need', 'wish']) {
    const turn = { ...turnOf(kind), taskDe: 'Sagen Sie, ob Sie etwas möchten.', taskEn: 'Say whether you want anything.' };
    const verb = { buy: 'kaufe', need: 'brauche', wish: 'wünsche mir' }[kind];
    assert.ok(verified(typedResult(turn, `Ich ${verb} nichts.`)), kind);
  }
  // A response to availability may honestly be negative; it must not become a name/origin value.
  const refusal = turnOf('decline');
  assert.ok(verified(typedResult(refusal, 'Ich habe keine Zeit.')));
  assert.equal(verified(typedResult(turnOf('colour'), 'Es ist nicht rot und blau.')), false);
  assert.equal(verified(typedResult(turnOf('colour'), 'Es ist nicht rot, sondern nicht blau.')), false);
});

test('negated names never produce a shown can-do, with the same typed and spoken grader', () => {
  const turn = turnOf('name');
  for (const answer of ['Ich heisse nicht Ahmed.', 'Ich bin nicht Ahmed.', 'Mein Name ist nicht Ahmed.']) {
    const outcome = verified(typedResult(turn, answer)) ? 'shown' : 'missed';
    assert.equal(spokenShown({ pct: 1, transcript: answer }, turn), false);
    assert.equal(canDoShown([{ ...turn, canDo: 0 }], [outcome], 1)[0], false);
    assert.equal(faultHintKey(turn, answer), 'check.fault.task');
  }
});

test('message parts require their requested name and birth date to be asserted', () => {
  const turn = turnOf('message');
  assert.ok(verified(typedResult(turn, 'Ich heiße Ahmed. Ich bin am 3.5.1998 geboren.')));
  assert.equal(verified(typedResult(turn, 'Mein Name ist nicht Ahmed. Ich bin am 3.5.1998 geboren.')), false);
  assert.equal(verified(typedResult(turn, 'Ich heiße Ahmed. Ich bin nicht am 3.5.1998 geboren.')), false);
});

test('time proposals and short agreements are read by function, with wrong times and denials excluded', () => {
  const propose = turnOf('askFree'), agree = turnOf('agree');
  for (const answer of ['Ist Freitag um zehn für dich okay?', 'Ist Freitag um zehn fuer dich okay?', 'Ist Freitag um zehn gut für dich?']) {
    assert.ok(verified(typedResult(propose, answer)), answer);
  }
  for (const answer of ['Passt!', 'Ja, passt.', 'Klappt!', 'Ja, geht.', 'Ja passt', 'Okay, passt.', 'Passt gut.']) assert.ok(verified(typedResult(agree, answer)), answer);
  for (const answer of ['Passt nicht.', 'Ja, passt nicht.', 'Isst!', 'Du passt.', 'Samstag um zehn passt.', 'Nein, passt.', 'Passt am Samstag.']) assert.equal(verified(typedResult(agree, answer)), false, answer);
  assert.equal(verified(typedResult(propose, 'Ist Samstag um zehn für dich okay?')), false);
});
