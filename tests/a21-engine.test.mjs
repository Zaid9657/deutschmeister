import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as v from '../scripts/validate-curriculum.mjs';
import { a1EngineSnapshot } from './helpers/a21-engine-baseline.mjs';
import { CURRICULUM_A21 } from '../src/data/curricula/a21.js';

test('A1 engine behaviour is byte-for-byte identical to the pre-Step-1 baseline', () => {
  const before = JSON.parse(readFileSync(new URL('./fixtures/a21-engine-a1-baseline.json', import.meta.url), 'utf8'));
  assert.deepEqual(a1EngineSnapshot(), before);
});

test('G2: a third level inherits A1.1-only Wortfeld entries', () => {
  const level = 'test-chain';
  v.LEVELS[level] = { ...v.levelSpec('a1.2'), level, seedFrom: 'a1.2', curriculum: { level, lektionen: [] } };
  try {
    const lex = v.levelLexicon(level);
    const a12Words = new Set(v.levelSpec('a1.2').curriculum.lektionen.flatMap((l) => l.wortfeld.map((w) => w.word)));
    const inherited = v.levelSpec('a1.1').curriculum.lektionen.flatMap((l) => l.wortfeld)
      .filter((w) => w.article && !a12Words.has(w.word));
    assert.ok(inherited.length > 0);
    for (const w of inherited) for (const form of v.formsOf(w, v.levelSpec('a1.2').irregularForms)) assert.ok(lex.has(form), `${w.word}: ${form}`);
  } finally { delete v.LEVELS[level]; }
});

test('G5: A2.1 has a complete draft engine row with its curriculum module', () => {
  const spec = v.levelSpec('a2.1');
  assert.ok(spec);
  assert.equal(spec.curriculum, CURRICULUM_A21);
  assert.equal(spec.examKey, 'goethe_a2');
  assert.equal(v.LEVELS['a2.1'], spec, 'complete draft engine policy is explicit and queryable');
  assert.deepEqual(Object.keys(v.LEVELS), ['a1.1', 'a1.2', 'a2.1'], 'complete-curriculum registry includes the authored draft');
});
