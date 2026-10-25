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
  assert.equal(name('Ich heiße Marokko.'), false, 'a country is no name');
});
