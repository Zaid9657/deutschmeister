import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { prerequisiteForms, taughtOrderFindings } from '../scripts/lib/taught-order.mjs';
import { guidedDraftFindings } from '../scripts/check-guided-draft.mjs';
import buildLesson from '../src/lib/lesson/buildLesson.js';
const pool = JSON.parse(readFileSync('src/data/lessonPools/a11.json'));
const clone = () => structuredClone(CURRICULUM_A11);

test('RULE 36 walks all built lessons and all seeded draws, without licensing FUNCTION_WORDS', () => {
  assert.deepEqual(taughtOrderFindings(CURRICULUM_A11, pool), []);
  assert.deepEqual(taughtOrderFindings(CURRICULUM_A12, []), [], 'legacy A1.2 remains unchanged');
  const c = clone(); delete c.lektionen[0].guided.sets;
  const findings = taughtOrderFindings(c, pool);
  for (const draw of [1, 2, 3]) assert.ok(findings.some((s) => s.includes(`draw ${draw}: scene scene-a1.1-l01-2 before teaching letter:A`)));
  const d = clone(); delete d.lektionen[1].guided.sets;
  const numbers = taughtOrderFindings(d, pool);
  assert.ok(numbers.some((s) => s.includes('meta heading')));
  for (const draw of [1, 2, 3]) assert.ok(numbers.some((s) => s.includes(`draw ${draw}: scene scene-a1.1-l02-5`) && s.includes('number:0')));
});

test('meta references, missing individual members, compound rules, ages, and clock teaching are enforced by class', () => {
  const mutations = [
    [2, (l) => { delete l.wortfeld.find((w) => w.meta).set; }, /meta heading/],
    [2, (l) => { l.guided.sets[0].members = l.guided.sets[0].members.filter((m) => m.written !== '0'); }, /number:0/],
    [3, (l) => { delete l.guided.sets; }, /scene.*number:20/],
    [4, (l) => { delete l.guided.sets[0].rule; l.guided.read.text += ' Der Preis ist vierunddreißig Euro.'; }, /read.*number:compounds/],
    [6, (l) => { delete l.guided.sets; }, /clock:full-hour/],
    [8, (l) => { l.guided.noticeBeforeScene = false; }, /read.*clock:half-hour/],
  ];
  for (const [nr, mutate, pattern] of mutations) { const c = clone(); mutate(c.lektionen[nr - 1]); assert.ok(taughtOrderFindings(c, pool).some((s) => pattern.test(s)), String(pattern)); }
  const bad = clone(); bad.lektionen[0].guided.sets[0].contrasts.push(['A', 'missing']);
  assert.ok(taughtOrderFindings(bad, pool).some((s) => /invalid contrast/.test(s)));
});

test('scene/read/sound/proof targets are scanned; test text itself does not teach', () => {
  for (const kind of ['scene', 'read', 'sound', 'proof']) {
    const c = clone(), l = c.lektionen[0];
    if (kind === 'scene') l.dialog.lines[0].de += ' fünfzig';
    if (kind === 'read') l.guided.read.text += ' fünfzig';
    if (kind === 'sound') l.phonetik.items[0] = 'FÜNF-zig';
    if (kind === 'proof') l.proof.tasks[0].answer += ' fünfzig';
    assert.ok(taughtOrderFindings(c, pool).some((s) => s.includes(`${kind} `) && s.includes('number:50')), kind);
  }
  assert.ok(prerequisiteForms('um halb zehn').has('clock:half-hour'));
  assert.ok(prerequisiteForms('einundsechzig').has('number:compounds'));
  assert.ok(prerequisiteForms('Jot').has('letter:J'));
});

test('real placements precede first uses with both pauses and unchanged diagnostic/recap ordering', () => {
  for (const [nr, id] of [[1, 'alphabet'], [2, 'numbers-0-10'], [3, 'age-twenty'], [4, 'numbers-11-100'], [6, 'full-hour']]) {
    const l = CURRICULUM_A11.lektionen[nr - 1];
    const { stages } = buildLesson({ curriculum: CURRICULUM_A11, lektion: l, pool });
    assert.equal(stages[0].kind, 'pretest');
    assert.ok(stages.findIndex((s) => s.key === `set:${id}`) < stages.findIndex((s) => s.kind === 'scene'));
    assert.deepEqual(stages.slice(-2).map((s) => s.kind), ['requeue', 'recap']);
  }
  const { stages } = buildLesson({ curriculum: CURRICULUM_A11, lektion: CURRICULUM_A11.lektionen[7], pool });
  assert.ok(stages.findIndex((s) => s.kind === 'notice') < stages.findIndex((s) => s.kind === 'scene'));
});

test('draft checker uses the same order rule, not only the live curriculum', () => {
  const draft = JSON.parse(readFileSync('docs/course-factory/a11-guided/content/l08.json'));
  draft.guided.noticeBeforeScene = false;
  assert.ok(guidedDraftFindings(8, draft).some((s) => s.includes('clock:half-hour')));
});

test('a notice that only mentions or defers a clock form never licenses later checked work', () => {
  const c = clone();
  delete c.lektionen[5].guided.sets;
  c.lektionen[5].notice.bodyDe = 'Die Uhrzeit um eins folgt in Lektion 8.';
  c.lektionen[5].notice.bodyEn = 'The time phrase um eins comes in lesson 8.';
  c.lektionen[6].guided.read.text += ' Um neun Uhr ist Tim frei.';
  const findings = taughtOrderFindings(c, pool);
  for (const draw of [1, 2, 3]) assert.ok(findings.some((s) => s.startsWith(`L7: draw ${draw}: read`) && s.includes('clock:full-hour')));
});

test('number facts come from the independent shared number reader, including clock minutes', () => {
  const c = clone(); c.lektionen[1].guided.sets[0].members[0].said = 'fünfzig';
  assert.ok(taughtOrderFindings(c, pool).some((s) => s.includes('incorrect number mapping')));
  assert.ok(prerequisiteForms('neun Uhr dreißig').has('clock:official-minutes'));
  assert.ok(prerequisiteForms('einundzwanzig Uhr').has('clock:full-hour'));
  assert.ok(prerequisiteForms('zweiundzwanzig Uhr').has('clock:full-hour'));
});
