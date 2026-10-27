import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A21 } from '../src/data/curricula/a21.js';
import { ALL_CURRICULA, curriculumPath } from '../src/data/curricula/index.js';
import { examFormat } from '../src/data/curricula/examFormats.js';
import { abschlusstestA21Course } from '../src/data/courseTests/abschlusstestA21Course.js';
import { pruefungsteileCoverage } from '../astro-site/src/lib/syllabus.js';
import { anyCurriculumFor as astroCurriculum, curriculumPath as astroPath } from '../astro-site/src/data/curricula/index.js';

test('coverage uses the selected exam inventory, including when parts are missing or duplicated', () => {
  const course = CURRICULUM_A21;
  const parts = examFormat(course.examKey).teile;
  assert.equal(parts.length, 13);
  assert.deepEqual(pruefungsteileCoverage(course.lektionen), { covered: 13, of: 13 });
  const partial = structuredClone(course.lektionen);
  for (const lesson of partial) lesson.examTeile = lesson.examTeile.filter(p => !p.endsWith('4'));
  partial[0].examTeile.push(partial[0].examTeile[0], 'Sprechen Teil 99');
  assert.deepEqual(pruefungsteileCoverage(partial), { covered: 11, of: 13 });
  for (const level of ['a1.1', 'a1.2']) {
    const c = ALL_CURRICULA[level];
    assert.deepEqual(pruefungsteileCoverage(c.lektionen), {
      covered: new Set(c.lektionen.flatMap(l => l.examTeile)).size, of: 11,
    });
  }
});

test('A2.1 final-test path time follows the actual paper sections, preserving A1 time budgets', () => {
  const duration = () => abschlusstestA21Course.sections.reduce((sum, section) => sum + section.minutes, 0);
  assert.equal(duration(), 105);
  assert.equal(curriculumPath(CURRICULUM_A21).at(-1).minutes, duration());
  assert.equal(astroPath(astroCurriculum('a2.1')).at(-1).minutes, duration());
  assert.deepEqual(pruefungsteileCoverage(astroCurriculum('a2.1').lektionen), { covered: 13, of: 13 });
  const first = abschlusstestA21Course.sections[0];
  const original = first.minutes;
  try {
    first.minutes += 7;
    assert.equal(curriculumPath(CURRICULUM_A21).at(-1).minutes, duration());
  } finally { first.minutes = original; }
  for (const level of ['a1.1', 'a1.2']) assert.equal(curriculumPath(ALL_CURRICULA[level]).at(-1).minutes, 65);
});
