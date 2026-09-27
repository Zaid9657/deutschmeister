// Course v2 player core (E1-1; docs/course-v2/BLUEPRINT.md §3.1–§3.5, §7.1, §7.6;
// SCHEMA §2, §8, §13, §14). Pins the pure player modules against the SCHEMA §15
// fixture unit as the compiler emits it:
//   - the unit builder's seeded 12 + 3 draw, the earlier-attempt exclusion, requeue
//     alternates, the Check's runtime earlierDraw and step-level resume;
//   - the item check wrapper (exact number / name, choice keys, typed via check.js);
//   - learner state: step markers → finished steps, status never downgraded,
//     review-card keys in the SCHEMA §2 form, one lesson_attempts batch per step;
//   - the course home model (Etappen + Plateaus, soft gate) and the plan line;
//   - the three v2 routes sit above the legacy catch-all in App.jsx.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compileLevel } from '../scripts/course-v2/lib/compiler.mjs';
import { FIXTURES_ROOT } from '../scripts/course-v2/lib/tree.mjs';
import { unitIdFor, plateauIdFor, normalizeLevel, nrOfId, stepIdOfItem, v2Paths, bandOf } from '../src/lib/course-v2/ids.js';
import {
  drawCounts, drawStep, planStep, planCheck, alternateFor, buildUnitPlan, resumeIndex, earlierSourceNrs, reservesOf,
  itemFromReserve, reserveItemsFor, withReserves,
} from '../src/lib/course-v2/unitPlan.js';
import { checkItem, attemptPayload, RESULT } from '../src/lib/course-v2/checkItem.js';
import {
  foldMarkers, statusToStore, reviewCardKeys, recordStepDone, STEP_MARKER_STAGE, TESTOUT_MARKER_STAGE,
} from '../src/lib/course-v2/progress.js';
import { courseHomeModel, lernschrittIds, unitRules } from '../src/lib/course-v2/homeModel.js';
import { planSummary } from '../src/lib/course-v2/pacePlan.js';
import { localStepDone, localUnitState, localLevelState, localTestOut, LOCAL_KEY } from '../src/lib/course-v2/localState.js';
import { unitCompletion } from '../src/lib/course-v2/completion.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// The fixture, compiled in memory exactly as `compile.mjs --fixture` would write it.
const compiled = compileLevel('a2.1', { contentRoot: FIXTURES_ROOT, outRoot: '/nonexistent/out', banksRoot: '/nonexistent/banks' });
assert.deepEqual(compiled.errors, [], 'the SCHEMA §15 fixture must compile');
const outputOf = (suffix) => {
  const o = compiled.outputs.find((x) => x.file.endsWith(suffix));
  assert.ok(o, `compiler output ${suffix} missing`);
  return JSON.parse(o.text);
};
const unit = outputOf('/a2.1/units/u07.json');
const manifest = outputOf('/a2.1/manifest.json');

const fakeStore = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
};

test('ids: URL ↔ content ids normalise at the boundary', () => {
  assert.equal(normalizeLevel('A2.1'), 'a2.1');
  assert.equal(normalizeLevel('c1.1'), null);
  assert.equal(unitIdFor('a2.1', 7), 'a2.1-u07');
  assert.equal(unitIdFor('a2.1', 13), null);
  assert.equal(plateauIdFor('b1.2', 2), 'b1.2-p2');
  assert.equal(nrOfId('a2.1-u07'), 7);
  assert.equal(stepIdOfItem('a2.1-u07-ls3-p06'), 'a2.1-u07-ls3');
  assert.equal(bandOf('b2.2'), 'b2');
  assert.equal(v2Paths.unit('A2.1', 7), '/course/a2.1/u/7');
  assert.equal(v2Paths.home('a2.1'), '/course/a2.1/v2');
});

test('draw counts follow the 16 = 12 + 3 + 1 arithmetic, shorter pools stay proportionate', () => {
  assert.deepEqual(drawCounts(16), { practice: 12, exit: 3, spare: 1 });
  assert.deepEqual(drawCounts(11), { practice: 9, exit: 2, spare: 0 });
  assert.deepEqual(drawCounts(0), { practice: 0, exit: 0, spare: 0 });
});

test('the practice draw is seeded, complete and disjoint', () => {
  const step = unit.steps.find((s) => s.kind === 'situation');
  const a = drawStep(step, { unitId: unit.id, attempt: 1 });
  const b = drawStep(step, { unitId: unit.id, attempt: 1 });
  assert.deepEqual(a.practice.map((x) => x.id), b.practice.map((x) => x.id), 'same attempt → same draw (a resumed session serves what it left)');
  const all = [...a.practice, ...a.exit, ...a.spare].map((x) => x.id);
  assert.equal(new Set(all).size, all.length, 'no item served twice');
  assert.equal(all.length, step.pool.items.length, 'every pool item lands in exactly one bucket');
});

test('a repeat serves the items the previous attempt did not serve first (earlier-attempt exclusion)', () => {
  const pool = Array.from({ length: 16 }, (_, i) => ({ id: `a2.1-u07-ls1-p${String(i + 1).padStart(2, '0')}`, topic: i % 2 ? 'g.a' : 'g.b' }));
  const step = { id: 'a2.1-u07-ls1', kind: 'situation', pool: { items: pool } };
  const first = drawStep(step, { unitId: 'a2.1-u07', attempt: 1 });
  const second = drawStep(step, { unitId: 'a2.1-u07', attempt: 2 });
  const servedBefore = new Set([...first.practice, ...first.exit].map((x) => x.id));
  const unseen = pool.filter((x) => !servedBefore.has(x.id)).map((x) => x.id);
  assert.equal(unseen.length, 1);
  assert.ok(second.practice.slice(0, unseen.length).every((x) => unseen.includes(x.id)), 'the one unserved item comes first on the repeat');
  assert.notDeepEqual(first.practice.map((x) => x.id), second.practice.map((x) => x.id));
});

test('a missed item returns as a different item of its topic: spare first, then reserve, never itself', () => {
  const plan = {
    spare: [{ id: 's1', topic: 'g.b' }, { id: 's2', topic: 'g.a' }],
    reserve: [{ id: 'r1', topic: 'g.a' }],
  };
  assert.equal(alternateFor({ id: 'x', topic: 'g.a' }, plan).id, 's2');
  assert.equal(alternateFor({ id: 'x', topic: 'g.a' }, plan, ['s2']).id, 'r1');
  assert.equal(alternateFor({ id: 'x', topic: 'g.c' }, plan).id, 's1', 'no topic match → any unserved spare');
  assert.equal(alternateFor({ id: 's1', topic: 'g.b' }, { spare: [{ id: 's1', topic: 'g.b' }], reserve: [] }), null);
});

test('the Check adds earlierDraw.count items drawn by rule from earlier reserves', () => {
  const withDraw = { ...unit, check: { ...unit.check, earlierDraw: { count: 4, from: 'previous-3', pool: 'reserve' } } };
  assert.deepEqual(earlierSourceNrs(withDraw), [4, 5, 6]);
  assert.deepEqual(earlierSourceNrs({ ...withDraw, check: { earlierDraw: { from: 'etappe' } } }, manifest.etappen), [], 'U7 opens Etappe 3');
  const earlier = reservesOf([
    { steps: [{ reserve: [{ id: 'a2.1-u04-ls1-r01' }, { id: 'a2.1-u04-ls1-r02' }] }] },
    { steps: [{ reserve: [{ id: 'a2.1-u05-ls2-r01' }, { id: 'a2.1-u05-ls2-r02' }, { id: 'a2.1-u05-ls2-r03' }] }] },
  ]);
  const plan = planCheck(withDraw, { earlierItems: earlier });
  assert.equal(plan.items.length, unit.check.items.length + 4);
  assert.equal(plan.earlierIds.length, 4);
  assert.ok(plan.earlierIds.every((id) => !id.startsWith('a2.1-u07')), 'never an item of this unit twice');
  const short = planCheck(withDraw, { earlierItems: earlier.slice(0, 1) });
  assert.equal(short.earlierMissing, 3, 'fewer reserves → a shorter check, said out loud');
});

test('the planned unit keeps every SCHEMA step and adds only `plan`', () => {
  const plan = buildUnitPlan(unit, { attempts: {} });
  assert.deepEqual(plan.steps.map((s) => s.id), unit.steps.map((s) => s.id));
  for (const [i, s] of plan.steps.entries()) {
    const extra = Object.keys(s).filter((k) => !(k in unit.steps[i]));
    assert.deepEqual(extra, ['plan'], `${s.id}: only the additive plan key`);
  }
  assert.ok(plan.steps.find((s) => s.kind === 'situation').plan.practice.length > 0);
  assert.equal(plan.steps.find((s) => s.kind === 'sprechen').plan, null);
  assert.ok(Array.isArray(plan.steps.find((s) => s.kind === 'check').plan.items));
  assert.deepEqual(planStep(unit.steps[0], { unit }).plan.practice.map((x) => x.id), plan.steps[0].plan.practice.map((x) => x.id));
});

test('resume is at the first unfinished step; all finished → recap', () => {
  const ids = unit.steps.map((s) => s.id);
  assert.equal(resumeIndex(unit.steps, new Set()), 0);
  assert.equal(resumeIndex(unit.steps, new Set(ids.slice(0, 3))), 3);
  assert.equal(resumeIndex(unit.steps, new Set([ids[0], ids[2]])), 1, 'a gap is resumed first');
  assert.equal(resumeIndex(unit.steps, new Set(ids)), ids.length);
});

test('checkItem: exact numbers, exact names, choice keys, typed answers through check.js', () => {
  const phone = { id: 'x-i01', type: 'fill_blank', exact: 'number', answer: '0341 90 12 33', accepted: ['0341 90 12 33'] };
  assert.equal(checkItem(phone, '0341901233').result, RESULT.CORRECT);
  assert.equal(checkItem(phone, '0341 90 12 34').result, RESULT.WRONG, 'a wrong digit is never a typo');
  const time = { id: 'x-i02', type: 'fill_blank', exact: 'number', answer: '8.30 Uhr', accepted: ['8.30 Uhr'] };
  assert.equal(checkItem(time, '8:30').result, RESULT.CORRECT);
  assert.equal(checkItem(time, '8.30 Uhr').result, RESULT.CORRECT);
  const name = { id: 'x-i03', type: 'fill_blank', exact: 'name', answer: 'Kowalski', accepted: ['Kowalski'] };
  assert.equal(checkItem(name, 'Kowalski').result, RESULT.CORRECT);
  assert.equal(checkItem(name, 'Kowalsky').result, RESULT.WRONG, 'a letter slip is another name');
  assert.equal(checkItem(name, 'kowalski').result, RESULT.TYPO, 'case-only stays the checker’s one retry');
  const spelled = { id: 'x-i04', type: 'fill_blank', exact: 'name', answer: 'N-A-I-R', accepted: ['N-A-I-R'] };
  assert.equal(checkItem(spelled, 'N A I R').result, RESULT.CORRECT);
  const mc = { id: 'x-i05', type: 'multiple_choice', options: ['a', 'b', 'c'], answer: 'b', accepted: ['b'] };
  assert.equal(checkItem(mc, 'b').correct, true);
  assert.equal(checkItem(mc, 'c').correct, false);
  const typed = { id: 'x-i06', type: 'fill_blank', topic: 'g.reflexiv-akk', answer: 'sich', accepted: ['sich'], errorTags: ['reflexive'] };
  assert.equal(checkItem(typed, 'sich').correct, true);
  const miss = checkItem(typed, 'mich');
  assert.equal(miss.correct, false);
  assert.equal(miss.errorTag, 'reflexive', 'the SCHEMA tag of the item wins');
  const p = attemptPayload(typed, 'a2.1-u07-ls1', 'mich');
  assert.deepEqual(p, { itemId: 'x-i06', stepId: 'a2.1-u07-ls1', correct: false, answer: 'mich', errorTag: 'reflexive', typo: false });
});

test('every fixture item grades its own answer as correct', () => {
  const items = [];
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (typeof x.id === 'string' && typeof x.answer === 'string' && x.type) items.push(x);
    Object.values(x).forEach(walk);
  };
  walk(unit.steps);
  walk(unit.check);
  walk(unit.start);
  assert.ok(items.length > 30);
  for (const it of items) {
    if (['zuordnen', 'insert'].includes(it.type)) continue; // answer is a block choice key
    assert.equal(checkItem(it, it.answer).correct, true, `${it.id}: its own answer`);
  }
});

test('step markers fold into finished steps and run counts', () => {
  const rows = [
    { lektion_id: 'a2.1-u07', item_id: 'a2.1-u07-ls1', stage: STEP_MARKER_STAGE },
    { lektion_id: 'a2.1-u07', item_id: 'a2.1-u07-ls1', stage: STEP_MARKER_STAGE },
    { lektion_id: 'a2.1-u07', item_id: 'a2.1-u07-ls2', stage: TESTOUT_MARKER_STAGE },
    { lektion_id: 'a2.1-u07', item_id: 'a2.1-u07-ls1-p01', stage: 'situation' },
  ];
  const { finishedSteps, stepRuns } = foldMarkers(rows);
  assert.deepEqual([...finishedSteps.get('a2.1-u07')].sort(), ['a2.1-u07-ls1', 'a2.1-u07-ls2']);
  assert.equal(stepRuns.get('a2.1-u07-ls1'), 2, 'the next draw of LS1 is attempt 3');
  assert.equal(stepRuns.get('a2.1-u07-ls2'), undefined, 'a test-out credit is not a run');
});

test('a finished step is ONE lesson_attempts batch: its items plus its marker', async () => {
  const inserts = [];
  const client = { from: (t) => ({ insert: async (rows) => { inserts.push({ t, rows }); return { error: null }; } }) };
  const step = unit.steps[0];
  await recordStepDone('u1', { level: 'a2.1', unitId: unit.id, step }, [
    { itemId: 'a2.1-u07-ls1-p01', stepId: step.id, correct: true, answer: 'sich', errorTag: null, typo: false },
    { itemId: 'a2.1-u07-ls1-p02', stepId: step.id, correct: false, answer: 'mich', errorTag: 'reflexive', typo: false },
  ], client);
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].t, 'lesson_attempts');
  const rows = inserts[0].rows;
  assert.deepEqual(rows.map((r) => [r.item_id, r.stage, r.correct, r.error_tag, r.lektion_id]), [
    ['a2.1-u07-ls1-p01', 'situation', true, null, 'a2.1-u07'],
    ['a2.1-u07-ls1-p02', 'situation', false, 'reflexive', 'a2.1-u07'],
    ['a2.1-u07-ls1', STEP_MARKER_STAGE, true, null, 'a2.1-u07'],
  ]);
});

test('a stored status is never taken back', () => {
  assert.equal(statusToStore('gold', 'started'), 'gold');
  assert.equal(statusToStore('complete', 'started'), 'complete');
  assert.equal(statusToStore(null, 'complete', { accuracy: 0.9 }), 'gold');
  assert.equal(statusToStore(null, 'complete', { accuracy: 0.5 }), 'complete');
  assert.equal(statusToStore('started', 'tested_out'), 'tested_out');
});

test('review-card keys are the SCHEMA §2 forms and within the live kind check', () => {
  const keys = reviewCardKeys(unit);
  assert.ok(keys.length > 0);
  for (const k of keys) assert.match(k, /^(word:lx\.[a-z0-9-]+|pattern:g\.[a-z0-9-]+:a2\.1-u07|sentence:a2\.1-u07-rm\d{2})$/, k);
  const derived = reviewCardKeys({ ...unit, reviewCards: undefined });
  assert.ok(derived.includes('pattern:g.reflexiv-akk:a2.1-u07'));
  assert.ok(derived.some((k) => k.startsWith('word:lx.')));
});

test('completion.js decides the unit from the player’s finished steps and submitted Aufgaben', () => {
  const ids = unit.steps.map((s) => s.id);
  const aufgaben = unit.steps.filter((s) => s.kind === 'sprechen' || s.kind === 'schreiben').map((s) => s.task.bankKey);
  const all = unitCompletion(unit, { finishedSteps: ids, submitted: aufgaben }, unitRules(manifest.completion));
  assert.equal(all.complete, true);
  const noAufgaben = unitCompletion(unit, { finishedSteps: ids, submitted: [] }, unitRules(manifest.completion));
  assert.equal(noAufgaben.complete, false, 'the two Aufgaben are required');
});

test('the signed-out store resumes the same way and survives a broken store', () => {
  const store = fakeStore();
  localStepDone('a1.1-u01', 'a1.1', 'a1.1-u01-ls1', store);
  localStepDone('a1.1-u01', 'a1.1', 'a1.1-u01-ls1', store);
  localTestOut('a1.1-u01', 'a1.1', ['a1.1-u01-ls2'], store);
  const st = localUnitState('a1.1-u01', store);
  assert.deepEqual([...st.finishedSteps].sort(), ['a1.1-u01-ls1', 'a1.1-u01-ls2']);
  assert.equal(Number(st.stepRuns.get('a1.1-u01-ls1')), 2);
  assert.equal(st.row.status, 'tested_out');
  assert.equal(localLevelState('a1.1', store).progress.get('a1.1-u01').status, 'tested_out');
  store.setItem(LOCAL_KEY, '{not json');
  assert.equal(localUnitState('a1.1-u01', store).finishedSteps.size, 0);
  const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(localStepDone('x', 'a1.1', 'x-ls1', throwing), false);
});

test('course home: Etappen with Plateaus, soft gate, one next unit', () => {
  const empty = courseHomeModel(manifest, {});
  assert.equal(empty.etappen.length, 4);
  assert.deepEqual(empty.etappen.map((e) => e.units.length), [3, 3, 3, 3]);
  assert.deepEqual(empty.etappen.map((e) => (e.plateau ? e.plateau.id : 'closing')), ['a2.1-p1', 'a2.1-p2', 'a2.1-p3', 'closing']);
  const u7 = empty.units.find((u) => u.id === 'a2.1-u07');
  assert.equal(u7.available, true);
  assert.equal(u7.status, 'new');
  assert.equal(u7.ready, false, 'U6 is not finished → „Trotzdem öffnen"');
  assert.equal(u7.href, '/course/a2.1/u/7');
  assert.deepEqual(u7.pruefungsfokus, ['Hören Teil 1', 'Schreiben Teil 2', 'Sprechen Teil 1']);
  assert.equal(empty.units.find((u) => u.id === 'a2.1-u01').status, 'missing');
  assert.equal(empty.next.id, 'a2.1-u07', 'the only compiled unit is next');
  const started = courseHomeModel(manifest, { finishedSteps: new Map([['a2.1-u07', new Set(['a2.1-u07-ls1', 'a2.1-u07-ls2'])]]) });
  const s7 = started.units.find((u) => u.id === 'a2.1-u07');
  assert.equal(s7.status, 'started');
  assert.equal(s7.stepsDone, 2);
  const done = courseHomeModel(manifest, { progress: new Map([['a2.1-u07', { status: 'gold' }]]) });
  assert.equal(done.next, null);
  assert.equal(done.units.find((u) => u.id === 'a2.1-u08').ready, true);
  assert.equal(done.completion.parts.find((p) => p.kind === 'unit').done, 1);
  assert.deepEqual(lernschrittIds('b1.1-u01', 8), ['b1.1-u01-ls1', 'b1.1-u01-ls2', 'b1.1-u01-ls3', 'b1.1-u01-ls4', 'b1.1-u01-ls8']);
});

test('plan line: pace presets in Lernschritte, forward phrasing, no "behind"', () => {
  const today = new Date('2026-10-01T00:00:00Z');
  const noDate = planSummary({ manifest, remainingSteps: 14, today });
  assert.equal(noDate.status, 'no-date');
  assert.equal(noDate.stepsPerWeek, 7);
  assert.equal(noDate.weeks, 2);
  const ok = planSummary({ manifest, remainingSteps: 14, examDate: '2026-12-01', today });
  assert.equal(ok.status, 'on-track');
  const tight = planSummary({ manifest, remainingSteps: 84, examDate: '2026-10-29', today });
  assert.equal(tight.status, 'needs-more-days');
  assert.ok(tight.neededPerWeek > tight.stepsPerWeek);
  const intensiv = planSummary({ manifest, pace: 'intensiv', remainingSteps: 14, today });
  assert.equal(intensiv.stepsPerWeek, 14);
  for (const p of [noDate, ok, tight, intensiv]) assert.doesNotMatch(p.lineDe, /hinter|behind|Rückstand/i);
});

test('the three v2 routes are registered above the legacy catch-all, wrapped like their neighbours', () => {
  const app = read('src/App.jsx');
  const catchAll = app.indexOf('path="/course/:level/:itemId"');
  assert.ok(catchAll > 0);
  for (const [path, page] of [['/course/:level/v2', 'CourseHomeV2Page'], ['/course/:level/u/:nr', 'UnitPlayerPage'], ['/course/:level/p/:nr', 'PlateauPage']]) {
    const at = app.indexOf(`path="${path}"`);
    assert.ok(at > 0, `missing route ${path}`);
    assert.ok(at < catchAll, `${path} must sit above /course/:level/:itemId`);
    const line = app.slice(at, app.indexOf('\n', at));
    assert.match(line, new RegExp(`<LevelSubscriptionGuard><EmailVerificationGate><${page} /></EmailVerificationGate></LevelSubscriptionGuard>`));
  }
  assert.ok(read('netlify.toml').includes('from = "/course/*"'), 'the v2 routes live inside the /course/* rewrite');
});

test('the player reaches the renderers only through the optional slots and writes only brand tokens', () => {
  const slots = read('src/pages/course-v2/rendererSlots.jsx');
  assert.match(slots, /import\.meta\.glob\('\.\.\/\.\.\/components\/course-v2\/StepView\.jsx'\)/);
  for (const f of ['src/pages/course-v2/ActionBar.jsx', 'src/pages/course-v2/UnitPlayerPage.jsx', 'src/pages/course-v2/CourseHomeV2Page.jsx', 'src/pages/course-v2/PlateauPage.jsx', 'src/pages/course-v2/rendererSlots.jsx']) {
    const src = read(f);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour outside design-tokens.js`);
    assert.doesNotMatch(src, /\b(?:bg|text|border)-(?:amber|rose|red|green|blue|gray|slate)-\d/, `${f}: a raw Tailwind palette class`);
    assert.doesNotMatch(src, /\bdu\b|\bdein/i, `${f}: the course speaks Sie`);
  }
});

// ---------------------------------------------------------------------------
// Integration seams (E1 client verify, docs/course-v2/E1-client.md §3)
// ---------------------------------------------------------------------------

test('reserves come back from reserve.json: ids → Items in the SCHEMA shape, re-attached to their steps', () => {
  const index = outputOf('/a2.1/reserve.json');
  assert.ok(unit.steps.every((st) => st.reserve === undefined), 'the compiler strips reserves from the chunk');
  assert.ok(Array.isArray(index.byUnit[unit.id]) && typeof index.byUnit[unit.id][0] === 'string', 'byUnit lists ids');
  const items = reserveItemsFor(index, [unit.id]);
  assert.equal(items.length, index.byUnit[unit.id].length);
  for (const it of items) {
    assert.equal(typeof it.promptDe, 'string', `${it.id}: promptDe`);
    assert.ok(it.explanation && typeof it.explanation.de === 'string', `${it.id}: explanation {de,en}`);
    assert.equal(checkItem(it, Array.isArray(it.accepted) ? it.accepted[0] : it.answer).result, RESULT.CORRECT, `${it.id} grades its own answer`);
  }
  const playable = withReserves(unit, index);
  const ls1 = playable.steps.find((st) => st.id === `${unit.id}-ls1`);
  assert.ok(ls1.reserve.length > 0 && ls1.reserve.every((it) => it.id.startsWith(`${ls1.id}-r`)));
  const plan = planStep(ls1, { unit: playable, attempt: 1 }).plan;
  assert.equal(plan.reserve.length, ls1.reserve.length, 'the requeue reaches the reserve');
  assert.equal(reserveItemsFor(index, ['a2.1-u06']).length, 0);
});

test('itemFromReserve restores sentence-building tiles and keeps an Item that is already in shape', () => {
  const back = itemFromReserve({ id: 'x-ls1-r01', type: 'sentence_building', topic: 't', questionDe: 'Bilden Sie den Satz: [mich / ich / melde]', answer: 'Ich melde mich.', accepted: ['Ich melde mich.'], explanationDe: 'd', explanationEn: 'e', hint: 'h', errorTags: ['v2-inv'] });
  assert.equal(back.promptDe, 'Bilden Sie den Satz.');
  assert.deepEqual(back.tiles, ['mich', 'ich', 'melde']);
  assert.deepEqual(back.hint, { de: 'h' });
  assert.equal(back.errorTag, 'v2-inv');
  const already = { id: 'y', promptDe: 'p' };
  assert.equal(itemFromReserve(already), already);
});

test('the renderers read the player core: StepView serves step.plan and unit.ruleCards, the slots pass the extras', () => {
  const sv = read('src/components/course-v2/StepView.jsx');
  assert.match(sv, /const plan = step\?\.plan;/, 'StepView must serve the seeded draw of unitPlan.js');
  assert.match(sv, /ruleCards \?\? unit\?\.ruleCards/, 'StepView must read the rule cards the player puts on the unit');
  const slots = read('src/pages/course-v2/rendererSlots.jsx');
  assert.match(slots, /<LazyStepView key=\{step && step\.id\} \{\.\.\.\(extra \|\| \{\}\)\} unit=/, 'extras spread BEFORE the contract props');
  const page = read('src/pages/course-v2/UnitPlayerPage.jsx');
  assert.match(page, /loadPlayableUnit\(level, nr\)/);
  assert.match(page, /extra=\{\{ course: manifest, onAttempt \}\}/, 'StartView gets the manifest (can-do wording) and the attempt sink');
});

test('the Start’s answers are stored under their own stage, never as a unit step’s items', () => {
  const page = read('src/pages/course-v2/UnitPlayerPage.jsx');
  assert.match(page, /const startStage = \(stepId\) => \(String\(stepId\)\.endsWith\('-testout'\) \? 'testout' : 'start'\);/);
  const at = page.indexOf('const onStartDone = useCallback(');
  const body = page.slice(at, page.indexOf('}, [', at));
  assert.ok(body.indexOf('flushAttempts(user.id, { level, unitId, stepKind: startStage(stepId) }, list)') > 0, 'the gist/test-out answers are written when the Start is done');
  assert.ok(body.indexOf('flushAttempts(') < body.indexOf('testOutPassed('), 'written before the test-out decision moves on');
});

test('a step finished in this visit re-draws itself for a repeat, and a weak Check offers the step list', () => {
  const page = read('src/pages/course-v2/UnitPlayerPage.jsx');
  assert.match(page, /\(Number\(learner\.stepRuns\.get\(s\.id\)\) \|\| 0\) \+ \(sessionRuns\.get\(s\.id\) \|\| 0\) \+ 1/, 'attempt = stored runs + runs in this visit + 1');
  const at = page.indexOf('const onDone = useCallback(');
  const body = page.slice(at, page.indexOf('}, [', at));
  assert.ok(body.indexOf('setSessionRuns(') > body.indexOf('AUFGABE_KINDS.includes(step.kind) && result && result.submitted === false'), 'only a finished step counts as a run');
  // the same unit: attempt 2 of a pool step serves the other items first
  const s1 = unit.steps.find((s) => s.pool);
  const a1 = drawStep(s1, { unitId: unit.id, attempt: 1 });
  const a2 = drawStep(s1, { unitId: unit.id, attempt: 2 });
  assert.notDeepEqual(a2.practice.map((x) => x.id), a1.practice.map((x) => x.id));
  assert.match(page, /accuracy !== null && accuracy < 0\.6 && \([\s\S]{0,400}<StepList /, 'the repeat tip comes with the step list');
});

test('the recap ticks exactly what the Check proved, and the Check says „Sie können jetzt" only when all is proven', () => {
  const cv = read('src/components/course-v2/CheckView.jsx');
  assert.match(cv, /onDone\(\{ stepId, correct: score\.correct, total: score\.total, proofs \}\)/, 'the Check reports its proofs');
  assert.match(cv, /\{endLine && allProven && /, 'the closing line waits for every proof');
  assert.match(read('src/components/course-v2/StepView.jsx'), /finishStep\(r && r\.proofs \? \{ proofs: r\.proofs \} : \{\}\)/, 'StepView passes the proofs on');
  const page = read('src/pages/course-v2/UnitPlayerPage.jsx');
  assert.match(page, /proofs: result\.proofs \|\| null/);
  assert.match(page, /\{allProven \? t\('player\.canNow'\) : t\('player\.goalsUnit'\)\}/);
  assert.match(page, /\{proven\(i\)\s*\n?\s*\? <Check /, 'a tick per proven can-do');
  // the fixture's proof rules are the ones the recap reads: two by item, two by Aufgabe
  const kinds = unit.check.proofs.map((p) => (p.item ? 'item' : p.aufgabe));
  assert.deepEqual(kinds.sort(), ['item', 'item', 'schreiben', 'sprechen']);
  const row = manifest.units.find((r) => r.unit === unit.id);
  assert.deepEqual([...row.canDoIds].sort(), unit.check.proofs.map((p) => p.canDo).sort(), 'every manifest can-do has a proof rule');
});

test('the Check announces the number of items it will actually ask', () => {
  const strings = read('src/components/course-v2/strings.js');
  for (const line of strings.split('\n').filter((l) => l.includes("'check.lead'"))) {
    assert.match(line, /'\{n\} /, `the check lead must not hard-code a count: ${line.trim()}`);
  }
  assert.match(read('src/components/course-v2/CheckView.jsx'), /t\('check\.lead', \{ n: items\.length \}\)/);
});

test('an Aufgabe left without submitting leaves no step marker', () => {
  const page = read('src/pages/course-v2/UnitPlayerPage.jsx');
  const at = page.indexOf('const onDone = useCallback(');
  const body = page.slice(at, page.indexOf('}, [', at));
  const guard = body.indexOf('AUFGABE_KINDS.includes(step.kind) && result && result.submitted === false');
  assert.ok(guard > 0, 'the unsubmitted-Aufgabe guard is missing');
  assert.ok(guard < body.indexOf('recordStepDone('), 'the guard must return before the marker is written');
});

test('the dev fixture and the ?preview bypass exist only on the Vite dev server', () => {
  const loaders = read('src/lib/course-v2/loaders.js');
  assert.match(loaders, /const DEV_FIXTURE = import\.meta\.env\.DEV \? import\.meta\.glob\('\.\.\/\.\.\/\.\.\/\.cache\/course-v2-fixture\//);
  const guard = read('src/components/LevelSubscriptionGuard.jsx');
  assert.match(guard, /if \(import\.meta\.env\.DEV && COURSE_V2_PATH_RE\.test\(location\.pathname \|\| ''\) && new URLSearchParams\(location\.search\)\.has\('preview'\)\)/);
  assert.ok(read('.gitignore').split('\n').includes('/.cache'), 'the compiled fixture lives in the gitignored .cache/');
});
