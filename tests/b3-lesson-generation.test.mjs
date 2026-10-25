import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { derivedItems } from '../src/lib/lesson/buildLesson.js';
import { scoreWriting, leitpunktSatisfied, foldWord } from '../src/lib/lesson/writing.js';
import { planFor } from '../src/lib/course/plan.js';

test('derived tiles explicitly request the original dialogue order in both instruction languages', () => {
  for (const [nr, attempt] of [[11, 1], [12, 3]]) {
    const lektion = CURRICULUM_A11.lektionen.find((l) => l.nr === nr);
    const item = derivedItems(lektion, attempt).find((i) => i.type === 'word_order');
    assert.equal(item.answer, lektion.dialog.lines[item.lineIndex].de);
    assert.match(item.promptEn || '', /dialogue line.*original word order/i);
    assert.match(item.promptDe || '', /Dialogzeile.*ursprünglichen Wortfolge/);
    assert.deepEqual([...item.tokens].sort(), item.answer.split(/\s+/).sort());
  }
  const view = readFileSync(new URL('../src/components/lesson/WordOrderItem.jsx', import.meta.url), 'utf8');
  assert.match(view, /lang === 'de' \? item\.promptDe : item\.promptEn/);
});

test('Formcheck requires supplied details in statements and keeps requested questions', () => {
  const task = CURRICULUM_A11.lektionen.find((l) => l.nr === 2).schreiben;
  const questions = 'Sehr geehrte Damen und Herren, wie heißen Sie? Haben Sie im Mai Geburtstag? Kommen Sie aus Marokko? Ist die Marokkanerin ledig oder verheiratet? Viele Grüße, Ana';
  const result = scoreWriting(task, questions);
  assert.equal(result.ok, false);
  assert.deepEqual(result.checks.filter((c) => /^lp/.test(c.key)).map((c) => c.ok), [false, false, false]);

  const supplied = 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich bin am 3. Mai 1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich bin ledig. Viele Grüße, Ana Chakiri';
  assert.equal(scoreWriting(task, supplied).ok, true);
  assert.equal(leitpunktSatisfied('Ihre Telefonnummer und eine Frage an Lena', 'Meine Telefonnummer ist 0176123456. Lena, hast du Zeit?'), true);
  assert.equal(leitpunktSatisfied('Ihre Telefonnummer und eine Frage an Lena', 'Ist deine Telefonnummer 0176123456? Lena, hast du Zeit?'), false);
  assert.equal(leitpunktSatisfied('Ihre Sprache', 'Sprechen Sie Türkisch?'), false);
  assert.equal(leitpunktSatisfied('Neuer Tag und neue Uhrzeit', 'Geht es am Dienstag um halb neun?'), true);
  assert.equal(leitpunktSatisfied('Ihre Telefonnummer', 'Meine Telefonnummer ist 0176123456. Ist Dienstag gut?'), true);
  assert.equal(leitpunktSatisfied('Ihre Telefonnummer', 'Ist deine Telefonnummer 0176123456? Ich komme um zehn Uhr.'), false);
});

test('quoted questions remain questions beside supplied details and ordinal dates', () => {
  for (const [open, close] of [['„', '“'], ['“', '”'], ['»', '«'], ['"', '"'], ['(', ')'], ['[', ']']]) {
    const question = `${open}Sind Sie verheiratet?${close}`;
    assert.equal(leitpunktSatisfied('Ihr Familienstand', question), false, question);
    assert.equal(leitpunktSatisfied('Ihr Familienstand', `${question} Ich heiße Ana.`), false, question);
    assert.equal(leitpunktSatisfied('Ihr Name', `${question} Ich heiße Ana.`), true, question);
    assert.equal(leitpunktSatisfied('Ihr Familienstand', `${open}Ich bin ledig.${close} Heißen Sie Ana?`), true, close);
  }
  assert.equal(leitpunktSatisfied('Ihr Familienstand', '„Sind Sie verheiratet?!“ Ich heiße Ana.'), false);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', '„Haben Sie Geburtstag?“ Ich bin am 3. Mai 1998 geboren.'), true);
  assert.equal(leitpunktSatisfied('Ihr Geburtsdatum', '„Haben Sie im Mai Geburtstag?“ Ich heiße Ana.'), false);
  assert.equal(leitpunktSatisfied('Eine Frage an Lena', '„Hast du Zeit?“'), true);
});

test('Formcheck compares composed and decomposed German answers identically', () => {
  const task = {
    kind: 'mitteilung', minWords: 0, maxWords: 100,
    leitpunkte: ['Ihre Sprache', 'Wann Sie kommen'],
  };
  const answer = 'Grüß dich Lena, ich spreche Türkisch. Ich komme früh um fünf Uhr. Viele Grüße, Ana';
  assert.equal(scoreWriting(task, answer).ok, true);
  assert.deepEqual(scoreWriting(task, answer.normalize('NFD')), scoreWriting(task, answer));
  const form = { kind: 'formular', fields: ['Sprache', 'Farbe'] };
  assert.deepEqual(scoreWriting(form, { Sprache: 'Türkisch'.normalize('NFD'), Farbe: 'grün'.normalize('NFD') }), scoreWriting(form, { Sprache: 'Türkisch', Farbe: 'grün' }));
  assert.equal(foldWord('Grüße'.normalize('NFD')), foldWord('Grüße'));
});

test('exam pace counts calendar days across autumn and spring DST changes', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'Europe/London';
    const path = Array.from({ length: 17 }, (_, id) => ({ id }));
    for (const [today, examDate] of [
      [new Date(2026, 9, 22, 12), '2026-10-29'],
      [new Date(2026, 2, 26, 12), '2026-04-02'],
    ]) {
      const plan = planFor({ today, examDate, path });
      assert.equal(plan.daysLeft, 7);
      assert.equal(plan.weeksLeft, 1);
      assert.equal(plan.perWeekTarget, 17);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
