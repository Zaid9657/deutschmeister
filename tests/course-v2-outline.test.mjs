// Course v2 — the chapter outline and word list the compiler derives for the Lehrwerk-style
// Kapitel view (owner decision 2026-09-29: every Kapitel shows its Wortschatz, Hören/Lesen,
// Grammatik, Übungen, Sprechen/Schreiben, Aussprache, Prüfungstraining and Test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { outlineOf, shortGrammarLabel } from '../scripts/course-v2/lib/compiler.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

test('shortGrammarLabel keeps the name and drops examples and details', () => {
  assert.equal(shortGrammarLabel('Präsens: regelmäßige Verben, sein und haben; du und Sie (ich wohne)'), 'Präsens');
  assert.equal(shortGrammarLabel('Verneinung mit nicht (Ich bin nicht Lehrerin.)'), 'Verneinung mit nicht');
  assert.equal(shortGrammarLabel('ein und kein im Nominativ und Akkusativ; nicht oder kein?'), 'ein und kein im Nominativ und Akkusativ');
  assert.equal(shortGrammarLabel('Trennbare Verben'), 'Trennbare Verben');
  assert.equal(shortGrammarLabel(null), '');
});

test('outlineOf names every step and the skills it trains, from the step itself', () => {
  const unit = {
    steps: [
      { id: 'x-ls1', kind: 'situation', title: 'A', structure: 'g.p', input: { kind: 'dialog', title: 'Im Kurs' }, pool: { items: [{}, {}] }, microOutput: { mode: 'spoken' }, aussprache: {} },
      { id: 'x-ls2', kind: 'situation', title: 'B', input: { kind: 'text' }, microOutput: { mode: 'written' } },
      { id: 'x-ls3', kind: 'pruefung', blocks: [{ template: 'sd1.h1' }, { template: 'sd1.h1' }] },
      { id: 'x-ls4', kind: 'sprechen', task: { parts: [{ template: 'sd1.sp1' }, { template: 'sd1.sp2' }] } },
      { id: 'x-ls5', kind: 'schreiben', task: { template: 'sd1.s1' } },
      { id: 'x-ls6', kind: 'check' },
    ],
  };
  const o = outlineOf(unit, new Map([['g.p', 'Präsens: regelmäßig (ich wohne)']]));
  assert.deepEqual(o.map((s) => s.nr), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(o[0].skills, ['wortschatz', 'hoeren', 'grammatik', 'ueben', 'sprechen', 'aussprache']);
  assert.deepEqual(o[0].grammar, { id: 'g.p', short: 'Präsens', label: 'Präsens: regelmäßig (ich wohne)' });
  assert.deepEqual(o[0].input, { kind: 'dialog', title: 'Im Kurs' });
  assert.equal(o[0].items, 2);
  assert.deepEqual(o[1].skills, ['wortschatz', 'lesen', 'schreiben']);
  assert.equal(o[1].grammar, null);
  assert.deepEqual(o[2].skills, ['pruefung']);
  assert.deepEqual(o[2].teile, ['sd1.h1'], 'a Teil is named once');
  assert.deepEqual(o[3].teile, ['sd1.sp1', 'sd1.sp2']);
  assert.deepEqual(o[4].skills, ['schreiben']);
  assert.deepEqual(o[5].skills, ['test']);
});

test('the compiled A1.1 manifest carries an outline per unit, and every Kapitel teaches grammar, listening and practice', () => {
  const m = read('src/data/course-v2/a1.1/manifest.json');
  for (const row of m.units) {
    assert.ok(Array.isArray(row.outline) && row.outline.length === row.counts.lernschritte, `${row.unit}: one outline entry per step`);
    const skills = new Set(row.outline.flatMap((s) => s.skills));
    for (const k of ['wortschatz', 'grammatik', 'ueben', 'pruefung', 'sprechen', 'schreiben', 'test']) assert.ok(skills.has(k), `${row.unit} teaches ${k}`);
    assert.ok(skills.has('hoeren') || skills.has('lesen'), `${row.unit} has a listening or reading text`);
  }
});

test('the compiled A1.1 word list is the lexicon, with article and plural for nouns', () => {
  const { words } = read('src/data/course-v2/a1.1/words.json');
  assert.equal(words.length, read('src/data/course-v2/a1.1/manifest.json').counts.newWords);
  for (const w of words.filter((x) => x.pos === 'NOUN')) {
    assert.ok(w.article || w.plural_kind === 'plural-only', `${w.id} has its article (or is plural-only: die Eltern)`);
  }
  assert.ok(words.every((w) => w.unit && w.lemma), 'every word names its Kapitel');
});
