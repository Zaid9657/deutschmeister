import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { abschlusstestA21 } from '../src/data/courseTests/abschlusstestA21.js';
import { abschlusstestA21Course as final } from '../src/data/courseTests/abschlusstestA21Course.js';
import { A21_PROMOTED } from '../src/data/curricula/a21-release.js';
import { CURRICULA, DRAFT_CURRICULA } from '../src/data/curricula/index.js';
import { COURSE_TESTS, DRAFT_COURSE_TESTS, courseTestsForPromotion } from '../src/data/courseTests/index.js';
import { scoreObjectiveSections } from '../src/services/examScoring.js';

test('legacy A2.1 final test is byte-identical to the reviewed origin/main blob', () => {
  const bytes = readFileSync(new URL('../src/data/courseTests/abschlusstestA21.js', import.meta.url));
  const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(hash, '2e2e5c2869287123d7fb16e58a9011d564557fa8');
});

test('one promotion switch selects the new course and final test, preserving legacy attempts', () => {
  assert.equal(Boolean(CURRICULA['a2.1']), A21_PROMOTED);
  assert.equal(Boolean(DRAFT_CURRICULA['a2.1']), !A21_PROMOTED);
  assert.equal(DRAFT_COURSE_TESTS.length, A21_PROMOTED ? 0 : 1);
  for (const promoted of [false, true]) {
    const tests = courseTestsForPromotion(promoted);
    const row = tests.find(t => t.level === 'a2.1');
    assert.equal(row.mock, promoted ? final : abschlusstestA21);
    assert.equal(row.key, row.mock.examKey);
    assert.equal(row.slug, 'abschlusstest-a2-1');
    assert.deepEqual(tests.filter(t => t.level !== 'a2.1'), COURSE_TESTS.filter(t => t.level !== 'a2.1'));
  }
  assert.notEqual(final.examKey, abschlusstestA21.examKey);
  const sql = readFileSync(new URL('../migrations/2026-10-26-a21-course-abschlusstest.sql', import.meta.url), 'utf8');
  for (const row of [...courseTestsForPromotion(false), ...courseTestsForPromotion(true)]) assert.ok(sql.includes(`'${row.key}'`));
});

test('D4 has 40 uniquely keyed objective responses and separately disclosed writing and speaking', () => {
  const answers = {};
  for (const section of final.sections.filter(s => ['hoeren', 'lesen'].includes(s.key))) {
    assert.equal(section.parts.flatMap(p => p.items).length, 20);
    for (const part of section.parts) {
      if (section.key === 'hoeren') { assert.ok(part.audioText); assert.ok([1, 2].includes(part.playsAllowed)); }
      for (const item of part.items) {
        assert.equal(new Set(item.options.map(o => o.key)).size, item.options.length);
        assert.equal(item.options.filter(o => o.key === item.answer).length, 1);
        assert.ok(!Object.hasOwn(answers, item.id));
        answers[item.id] = item.answer;
      }
    }
  }
  assert.equal(Object.keys(answers).length, 40);
  assert.equal(scoreObjectiveSections(final, answers).score, 40);
  assert.equal(scoreObjectiveSections(final, {}).score, 0);
  assert.equal(scoreObjectiveSections(final, {}).maxScore, 40);
  assert.equal(final.sections.find(s => s.key === 'schreiben').parts.length, 2);
  assert.equal(final.sections.find(s => s.key === 'sprechen').parts.length, 3);
  assert.equal(final.sections.reduce((n, s) => n + s.minutes, 0), 105);
  assert.match(final.intro, /kein offizielles Prüfungsmaterial/);
  assert.match(final.sections.find(s => s.key === 'sprechen').instructions, /nicht automatisch bewertet/);
});
