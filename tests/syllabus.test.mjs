// Guard suite for the public syllabus page's pure counters
// (astro-site/src/lib/syllabus.js) and the curriculum registry twin
// (docs/course-factory/a11-rebuild/CONTRACT.md).
//
// The curriculum module is authored in parallel and may still be a
// placeholder (lektionen: []) when this runs — every check below must pass
// against both the placeholder and a populated fixture, since the syllabus
// page has to render nothing for the former and the full section for the
// latter.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { curriculumFor, curriculumPath, CURRICULA } from '../astro-site/src/data/curricula/index.js';
import {
  hasSyllabus,
  wortfeldRunningTotals,
  wortlisteTotalFor,
  lektionenMinutes,
  totalHoursFrom,
  goetheRichtwertFor,
  kannBeschreibungenCount,
  pruefungsteileCoverage,
  checkpointAfter,
  primaryGrammarTitle,
  LEKTION_ANATOMY,
  GOETHE_SD1_TEILE_COUNT,
} from '../astro-site/src/lib/syllabus.js';

// A tiny fixture matching the CONTRACT shape — inline, no dependency on the
// real (in-progress) a11.js content.
const FIXTURE = {
  level: 'a1.1', code: 'A1.1', hoursTotal: 3,
  provenance: { canDo: 'x', wortliste: 'y', themen: 'z' },
  lektionen: [
    { nr: 1, title: 'Hallo', canDo: ['a', 'b', 'c'], examTeile: ['Sprechen Teil 1'], wortfeld: Array(20).fill({}), primarySlug: 'verb-sein' },
    { nr: 2, title: 'Zahlen', canDo: ['a', 'b'], examTeile: ['Schreiben Teil 1'], wortfeld: Array(15).fill({}), primarySlug: 'personal-pronouns' },
    { nr: 3, title: 'Familie', canDo: ['a', 'b', 'c', 'd'], examTeile: ['Sprechen Teil 1'], wortfeld: Array(18).fill({}), primarySlug: 'nouns-gender' },
  ],
  checkpoints: [{ nr: 1, id: 'a1.1-cp1', afterLektion: 3, title: 'Checkpoint 1: Lektion 1–3' }],
};

test('curriculumFor: returns null for an unregistered level, and is case-insensitive', () => {
  assert.equal(curriculumFor('z9.9'), null);
  assert.equal(curriculumFor('A1.1'), curriculumFor('a1.1'));
});

test('hasSyllabus: false for the placeholder shape, true once lektionen is populated', () => {
  assert.equal(hasSyllabus({ lektionen: [] }), false);
  assert.equal(hasSyllabus({}), false);
  assert.equal(hasSyllabus(null), false);
  assert.equal(hasSyllabus(FIXTURE), true);
});

test('the registered a11 curriculum is either the empty placeholder or a real 12-Lektion syllabus', () => {
  const a11 = CURRICULA['a1.1'];
  assert.ok(a11, 'a1.1 must be registered');
  if (hasSyllabus(a11)) {
    assert.equal(a11.lektionen.length, 12, 'a populated curriculum must have exactly 12 Lektionen');
    assert.equal(a11.checkpoints.length, 4);
  } else {
    assert.deepEqual(a11.lektionen, []);
  }
});

test('wortfeldRunningTotals: running total accumulates in order', () => {
  const rows = wortfeldRunningTotals(FIXTURE.lektionen);
  assert.deepEqual(rows, [
    { nr: 1, count: 20, running: 20 },
    { nr: 2, count: 15, running: 35 },
    { nr: 3, count: 18, running: 53 },
  ]);
});

test('wortfeldRunningTotals: empty input gives an empty array, never throws', () => {
  assert.deepEqual(wortfeldRunningTotals([]), []);
  assert.deepEqual(wortfeldRunningTotals(undefined), []);
});

test('wortlisteTotalFor: 650 for A1 levels, 1300 for A2, null otherwise', () => {
  assert.equal(wortlisteTotalFor('a1.1'), 650);
  assert.equal(wortlisteTotalFor('a1.2'), 650);
  assert.equal(wortlisteTotalFor('a2.1'), 1300);
  assert.equal(wortlisteTotalFor('a2.2'), 1300);
  assert.equal(wortlisteTotalFor('b1.1'), null);
  assert.equal(wortlisteTotalFor(''), null);
});

test('lektionenMinutes and totalHoursFrom sum correctly', () => {
  const withMinutes = { lektionen: [{ minutes: 15 }, { minutes: 20 }, { minutes: 25 }], checkpoints: [{}] };
  assert.equal(lektionenMinutes(withMinutes.lektionen), 60);
  // 60 min of lektionen + 12 min checkpoint = 72 min -> 1.2h -> rounds to 1
  assert.equal(totalHoursFrom(withMinutes), 1);
});

test('goetheRichtwertFor: the 80-200 UE band for A1/A2, null elsewhere', () => {
  assert.deepEqual(goetheRichtwertFor('a1.1'), [80, 200]);
  assert.deepEqual(goetheRichtwertFor('a2.2'), [80, 200]);
  assert.equal(goetheRichtwertFor('b1.1'), null);
});

test('kannBeschreibungenCount sums canDo across Lektionen', () => {
  assert.equal(kannBeschreibungenCount(FIXTURE.lektionen), 3 + 2 + 4);
  assert.equal(kannBeschreibungenCount([]), 0);
});

test('pruefungsteileCoverage: counts distinct Teile against the 11-Teil SD1 total', () => {
  const cov = pruefungsteileCoverage(FIXTURE.lektionen);
  assert.equal(cov.of, GOETHE_SD1_TEILE_COUNT);
  assert.equal(cov.covered, 2); // 'Sprechen Teil 1' + 'Schreiben Teil 1', deduped
});

test('checkpointAfter: finds the checkpoint keyed to a given Lektion nr, else null', () => {
  assert.equal(checkpointAfter(FIXTURE, 3)?.id, 'a1.1-cp1');
  assert.equal(checkpointAfter(FIXTURE, 1), null);
  assert.equal(checkpointAfter({ checkpoints: [] }, 3), null);
});

test('primaryGrammarTitle: resolves via the title map, falls back to the raw slug', () => {
  const titles = { 'verb-sein': 'Das Verb "sein"' };
  assert.equal(primaryGrammarTitle(FIXTURE.lektionen[0], titles), 'Das Verb "sein"');
  assert.equal(primaryGrammarTitle(FIXTURE.lektionen[1], titles), 'personal-pronouns'); // no entry -> slug
  assert.equal(primaryGrammarTitle({}, titles), null);
});

test('LEKTION_ANATOMY: exactly 9 stages (§3), minutes sum to the ~12-15 min lesson target', () => {
  assert.equal(LEKTION_ANATOMY.length, 9);
  const total = LEKTION_ANATOMY.reduce((s, step) => s + step.minutes, 0);
  assert.ok(total >= 12 && total <= 16, `anatomy minutes sum to ${total}, expected 12-16`);
  LEKTION_ANATOMY.forEach((step, i) => assert.equal(step.nr, i));
});

test('curriculumPath: still builds a valid path for the placeholder (just the level test)', () => {
  const path = curriculumPath({ level: 'a1.1', code: 'A1.1', testSlug: 'abschlusstest-a1-1', lektionen: [], checkpoints: [] });
  assert.equal(path.length, 1);
  assert.equal(path[0].kind, 'leveltest');
});
