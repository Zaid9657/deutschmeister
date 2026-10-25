// „Ihr Name" is answered by a name, not by the verb „heißen" (2026-10-25 review, X-047).
//
// The Formcheck's name shape accepted any heiß-/nenn- token, so a guest who wrote „Sehr geehrte
// Damen und Herren, ich heiße. …" on the A1.1 L2 Mitteilung saw all six requirements green —
// and for a guest that checklist is the only writing feedback there is (GradedWriting.jsx). The
// named field („Mein Name ist.") already asked for its value; the verb now asks too: a name in the
// same clause after it, read case-folded like a form field. „ich bin <Name>" stays as it was.
import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreWriting, leitpunktSatisfied } from '../src/lib/lesson/writing.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const L2 = CURRICULUM_A11.lektionen.find((l) => l.nr === 2).schreiben;

test('the L2 Mitteilung without a name is not complete', () => {
  assert.equal(L2.kind, 'mitteilung');
  assert.match(L2.leitpunkte[0], /Ihr Name/);
  const noName = 'Sehr geehrte Damen und Herren, ich heiße. Ich bin am 3. Mai 1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich bin ledig. Viele Grüße';
  const res = scoreWriting(L2, noName);
  assert.equal(res.ok, false, 'the measured text is not „all green"');
  assert.equal(res.checks.find((c) => c.key === 'lp0').ok, false, '„Ihr Name und Ihr Geburtsdatum" is red');
  const named = noName.replace('ich heiße.', 'ich heiße Ana Chakiri.');
  assert.equal(scoreWriting(L2, named).checks.find((c) => c.key === 'lp0').ok, true, 'with the name it is green');
});

test('a name after heißen/nennen, in its clause', () => {
  const name = (text) => leitpunktSatisfied('Ihr Name', text);
  assert.equal(name('ich heiße.'), false);
  assert.equal(name('Ich heiße Ana Chakiri.'), true);
  assert.equal(name('ich heiße ana.'), true, 'a lower-case name is a name, as on the form');
  assert.equal(name('Ich heiße nicht.'), false, 'a function word names nobody');
  assert.equal(name('Ich heiße, und ich komme aus Marokko.'), false, 'the next clause is not the name');
  assert.equal(name('Das heißt, ich komme später.'), false);
  assert.equal(name('Ich nenne mich Ana.'), true);
  assert.equal(name('Mein Name ist Ana Ruiz.'), true, 'the named field, as before');
  assert.equal(name('Mein Name ist.'), false, 'and without its value, as before');
  assert.equal(name('Hallo, ich bin Ana.'), true, '„ich bin <Name>" stays');
  // A country in a named FIELD is another field's value, and stays red there (the verb slot: below).
  assert.equal(name('Mein Name ist Marokko.'), false, 'a country fills no name field');
});

test('a learner\'s own name is a name — in her letters, and when it is also a German function word (batch B4 review)', () => {
  // The first repair read the slot with the German-only letter class and dropped every function word:
  // „Ich heiße José.", „Chloé" and „Nur" — green before it — turned red on the real L2 task.
  const body = (who) => `Sehr geehrte Damen und Herren, ich heiße ${who}. Ich bin am 3. Mai 1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich bin ledig. Viele Grüße`;
  for (const who of ['José', 'Chloé', 'Nur', 'Will', 'An', 'Łukasz', 'Zoë', "O'Neill", 'Anne-Marie', 'José García']) {
    const lp0 = scoreWriting(L2, body(who)).checks.find((c) => c.key === 'lp0');
    assert.equal(lp0.ok, true, `„ich heiße ${who}." answers „${L2.leitpunkte[0]}"`);
  }
  const name = (text) => leitpunktSatisfied('Ihr Name', text);
  assert.equal(name('Ich heiße Nur.'), true, 'capitalised in the name slot: the name');
  assert.equal(name('Ich heiße nur.'), false, 'lower case: the particle');
  assert.equal(name('Ich heiße Sie.'), false, 'the polite pronoun is capitalised by grammar, not a name');
  assert.equal(name('ich heiße élodie.'), true, 'a lower-case name in its own letters');
  assert.equal(name('Hallo, ich bin Élodie.'), true, '„ich bin <Name>" reads the same letters');
  // The form reads the one name shape too.
  assert.equal(scoreWriting({ kind: 'formular', fields: ['Vorname', 'Familienname'] }, { Vorname: 'José', Familienname: 'García' }).ok, true);
  assert.equal(scoreWriting({ kind: 'formular', fields: ['Vorname'] }, { Vorname: 'Marokko' }).ok, false, 'a country is still no name');
});

test('after „ich heiße" a name that is also a country or a language is still the name (batch B4 review)', () => {
  // India is a given name, Deutsch a surname, Jordan and Paris both — and „ich heiße India." flipped
  // lp0 to red on the real L2 task, because the verb slot borrowed the form field's country and
  // language exclusions. What follows the verb is the name by construction; the exclusions stay
  // where a FIELD is filled with another field's kind of value.
  const body = (who) => `Sehr geehrte Damen und Herren, ich heiße ${who}. Ich bin am 3. Mai 1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich bin ledig. Viele Grüße`;
  for (const who of ['India', 'Deutsch', 'Jordan', 'Paris', 'India Deutsch', 'india']) {
    const lp0 = scoreWriting(L2, body(who)).checks.find((c) => c.key === 'lp0');
    assert.equal(lp0.ok, true, `„ich heiße ${who}." answers „${L2.leitpunkte[0]}"`);
  }
  const name = (text) => leitpunktSatisfied('Ihr Name', text);
  assert.equal(name('Ich nenne mich Jordan.'), true);
  // …while a missing value and the polite pronoun stay red in the slot,
  assert.equal(name('ich heiße.'), false);
  assert.equal(name('ich heiße nicht.'), false);
  assert.equal(name('Ich heiße Sie.'), false);
  // …and the field exclusions are exactly what they were.
  assert.equal(name('Mein Name ist Marokko.'), false);
  const form = (field, value) => scoreWriting({ kind: 'formular', fields: [field] }, { [field]: value }).ok;
  assert.equal(form('Familienname', 'Marokko'), false);
  assert.equal(form('Vorname', 'Arabisch'), false);
  assert.equal(form('Vorname', 'India'), false, 'a country name in a name FIELD stays red');
});
