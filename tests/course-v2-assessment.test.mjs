// Course v2 — the Plateaus and the closing block (BLUEPRINT §5.2, §5.3, §7.3 S8/S10; SCHEMA §2,
// §10, §13), end to end on the real A1.1 content:
//   1. the compiler DRAWS each Plateau's review set from the unit reserves (banks: ['plateau']),
//      seeded by the Plateau id — currentShare from the units since the previous Plateau, the rest
//      from the earlier ones, spread over the Lernschritte, an earlier Plateau's items last;
//   2. a .1 Halbtest learns where each Teil comes next in the .2 level (the Teil-Karte), from
//      that level's unit files or its specs.json;
//   3. the manifest counts the Plateau and closing Teile apart from the units' (inPlateaus,
//      inClosing, inCourse) and leaves the unit sums as they were;
//   4. a speaking part's own `length` reaches the bank (Plateau/closing parts have no Prüfungsfokus);
//   5. the player's assessment model (src/lib/course-v2/assessment.js): sections, results, the
//      repair list, the Teil-Karte, submission, and completion.js counting it for the course;
//   6. the course home links the Plateaus and the closing block in their slots, soft-locked;
//   7. the routes and the pages (App.jsx, brand tokens, Sie).
// Everything is compiled in memory; nothing is written to the repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compileLevel, drawPlateauReview, speakingPart } from '../scripts/course-v2/lib/compiler.mjs';
import { CONTENT_ROOT, FIXTURES_ROOT } from '../scripts/course-v2/lib/tree.mjs';
import {
  assessmentSections, assessmentKind, assessmentLines, assessmentProgress, assessmentStatus, resumeSection,
  sectionResult, reviewRepairs, teilKarte, closingIdFor, answersFromRows, partKind, unitPractising, ASSESSMENT_STAGE,
} from '../src/lib/course-v2/assessment.js';
import { courseCompletion } from '../src/lib/course-v2/completion.js';
import { courseHomeModel } from '../src/lib/course-v2/homeModel.js';
import { localAnswers, localStepDone, localUnitState, localUnitStatus, localLevelState } from '../src/lib/course-v2/localState.js';
import { fetchAssessmentState, recordStepDone, STEP_MARKER_STAGE } from '../src/lib/course-v2/progress.js';
import { v2Paths } from '../src/lib/course-v2/ids.js';
import { teilLabel } from '../src/components/course-v2/content.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const compileA11 = () => compileLevel('a1.1', { contentRoot: CONTENT_ROOT, exclude: [FIXTURES_ROOT], outRoot: '/nonexistent/out', banksRoot: '/nonexistent/banks' });
const compiled = compileA11();
assert.deepEqual(compiled.errors, [], 'A1.1 must compile');
const out = (suffix) => {
  const o = compiled.outputs.find((x) => x.file.endsWith(suffix));
  assert.ok(o, `compiler output ${suffix} missing`);
  return JSON.parse(o.text);
};
const manifest = out('/a1.1/manifest.json');
const plateaus = [1, 2, 3].map((n) => out(`/a1.1/plateaus/p${n}.json`));
const halbtest = out('/a1.1/closing/a1.1-ht-sd1.json');
const reserve = out('/a1.1/reserve.json');
const unitNr = (id) => Number(String(id).slice(-2));

const fakeStore = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
};

// ---------------------------------------------------------------------------
// 1. The review draw
// ---------------------------------------------------------------------------

test('drawPlateauReview: seeded, the shares by unit group, spread over the Lernschritte', () => {
  const cands = [];
  for (const u of [1, 2, 3, 4, 5, 6]) for (const ls of [1, 2, 3]) for (const r of [1, 2, 3]) cands.push({ id: `x-u0${u}-ls${ls}-r0${r}`, unit: `x-u0${u}`, step: `x-u0${u}-ls${ls}` });
  const opts = { id: 'x-p2', draw: 20, currentShare: 0.65, current: ['x-u04', 'x-u05', 'x-u06'], earlier: ['x-u01', 'x-u02', 'x-u03'] };
  const a = drawPlateauReview(cands, opts);
  const b = drawPlateauReview(cands, opts);
  assert.deepEqual(a.items.map((c) => c.id), b.items.map((c) => c.id), 'the same input gives the same draw');
  assert.notDeepEqual(drawPlateauReview(cands, { ...opts, id: 'x-p3' }).items.map((c) => c.id), a.items.map((c) => c.id), 'another Plateau id, another draw');
  assert.equal(a.items.length, 20);
  assert.equal(a.current.length, 13, 'round(20 × 0.65) from the units since the previous Plateau');
  assert.equal(a.earlier.length, 7);
  assert.ok(a.current.every((c) => opts.current.includes(c.unit)) && a.earlier.every((c) => opts.earlier.includes(c.unit)));
  assert.equal(new Set(a.items.map((c) => c.id)).size, 20, 'no item twice');
  assert.equal(new Set(a.current.map((c) => c.step)).size, 9, 'the 13 cover every Lernschritt of the three units');
  const perUnit = (list) => Object.values(list.reduce((m, c) => ({ ...m, [c.unit]: (m[c.unit] || 0) + 1 }), {}));
  assert.ok(Math.max(...perUnit(a.current)) - Math.min(...perUnit(a.current)) <= 1, 'the share is spread evenly over its units');
});

test('drawPlateauReview: a share without candidates hands its rest to the other; an earlier Plateau\'s items come last', () => {
  const cands = [];
  for (const u of [1, 2, 3]) for (const r of [1, 2, 3, 4, 5, 6, 7, 8, 9]) cands.push({ id: `x-u0${u}-ls1-r0${r}`, unit: `x-u0${u}`, step: `x-u0${u}-ls1` });
  const p1 = drawPlateauReview(cands, { id: 'x-p1', current: ['x-u01', 'x-u02', 'x-u03'], earlier: [] });
  assert.equal(p1.items.length, 20, 'P1 has no earlier units: all 20 from U1–U3');
  assert.equal(p1.earlier.length, 0);
  const few = drawPlateauReview(cands.slice(0, 4), { id: 'x-p1', current: ['x-u01'], earlier: [] });
  assert.equal(few.items.length, 4, 'fewer candidates than the draw: the set is simply shorter');
  const more = [...cands, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((r) => ({ id: `x-u04-ls1-r${r}`, unit: 'x-u04', step: 'x-u04-ls1' }))];
  const p2 = drawPlateauReview(more, { id: 'x-p2', current: ['x-u04'], earlier: ['x-u01', 'x-u02', 'x-u03'], exclude: new Set(p1.items.map((c) => c.id)) });
  const fresh = cands.filter((c) => !p1.items.some((d) => d.id === c.id));
  assert.equal(fresh.length, 7);
  assert.deepEqual(p2.earlier.map((c) => c.id).sort(), fresh.map((c) => c.id).sort(), 'P2 draws the items P1 did not before any it did');
});

test('the compiled Plateaus carry their drawn review sets: 20 reserve items each, by the Etappen', () => {
  const byId = new Map(reserve.items.map((r) => [r.id, r]));
  const seen = new Set();
  for (const p of plateaus) {
    const after = unitNr(p.after);
    const r = p.review;
    assert.equal(r.draw, 20);
    assert.equal(r.from, 'reserve');
    assert.deepEqual(r.units.current, manifest.units.map((u) => u.unit).filter((id) => unitNr(id) > after - 3 && unitNr(id) <= after));
    assert.deepEqual(r.units.earlier, manifest.units.map((u) => u.unit).filter((id) => unitNr(id) <= after - 3));
    assert.equal(r.items.length, r.drawn.current + r.drawn.earlier);
    assert.ok(r.items.length <= 20 && r.items.length >= 12, `${p.id}: ${r.items.length} review items`);
    if (after > 3 && r.items.length === 20) assert.equal(r.drawn.current, 13, `${p.id}: 65 % from the last three units`);
    assert.equal(new Set(r.items.map((i) => i.id)).size, r.items.length, `${p.id}: no item twice`);
    for (const it of r.items) {
      const entry = byId.get(it.id);
      assert.ok(entry, `${it.id} is a reserve item of the level`);
      assert.ok(entry.banks.includes('plateau'), `${it.id} carries banks: ['plateau']`);
      assert.ok([...r.units.current, ...r.units.earlier].includes(it.unit), `${it.id} comes from a unit the Plateau reviews`);
      assert.equal(it.step, entry.step, `${it.id} maps back to its Lernschritt`);
      assert.equal(typeof it.promptDe, 'string', `${it.id} is in the learner's Item shape`);
      assert.ok(it.explanation && typeof it.explanation.de === 'string');
      assert.equal(it.origin, undefined, 'learner-invisible fields are stripped');
    }
    const steps = new Set(r.items.map((i) => i.step));
    assert.ok(steps.size >= Math.min(9, r.items.length), `${p.id}: the set is spread over the Lernschritte (${steps.size})`);
    for (const it of r.items) seen.add(it.id);
  }
  assert.equal(compileA11().outputs.find((o) => o.file.endsWith('/plateaus/p2.json')).text, compiled.outputs.find((o) => o.file.endsWith('/plateaus/p2.json')).text, 'deterministic');
});

// ---------------------------------------------------------------------------
// 2. The Teil-Karte's „comes next"
// ---------------------------------------------------------------------------

test('the Halbtest knows where each Teil comes next in A1.2: the first unit whose Prüfungsfokus names it', () => {
  const cn = halbtest.comesNext;
  assert.equal(cn.level, 'a1.2');
  // the expectation, read independently: A1.2 unit files win over its specs.json entries
  const rows = new Map();
  const specs = existsSync(join(CONTENT_ROOT, 'a1.2/specs.json')) ? readJson('content/course-v2/a1.2/specs.json') : [];
  for (const e of specs) if (e && typeof e.id === 'string') rows.set(e.id, e);
  for (let n = 1; n <= 12; n += 1) {
    const f = `content/course-v2/a1.2/units/u${String(n).padStart(2, '0')}.json`;
    if (existsSync(join(ROOT, f))) {
      try { const u = readJson(f); rows.set(u.id, u); } catch { /* an unreadable draft is not syllabus input */ }
    }
  }
  const ordered = [...rows.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const templates = [...new Set(halbtest.parts.map((p) => p.template))];
  assert.equal(templates.length, 11, 'every sd1 Teil is in the Halbtest');
  for (const tpl of templates) {
    const hit = ordered.find((r) => (r.spec?.lanes?.pruefungsfokus || []).some((p) => p.template === tpl));
    if (!hit) { assert.equal(cn.byTemplate[tpl], undefined); continue; }
    assert.deepEqual(cn.byTemplate[tpl], { unit: hit.id, nr: unitNr(hit.id), title: hit.title.de }, tpl);
  }
});

// ---------------------------------------------------------------------------
// 3. Manifest counts
// ---------------------------------------------------------------------------

test('the manifest counts the Plateau and closing Teile apart; the unit sums keep their meaning', () => {
  const c = manifest.counts;
  const rowSum = (k) => manifest.units.reduce((n, r) => n + ((r.counts && r.counts[k]) || 0), 0);
  for (const k of ['examBlocks', 'writingTasks', 'speakingTasks', 'microOutputs']) {
    assert.equal(c[k], rowSum(k), `counts.${k} is still the units' sum`);
    assert.equal(c.inCourse[k], c[k] + c.inPlateaus[k] + c.inClosing[k], `inCourse.${k}`);
  }
  const blocks = (list) => list.filter((p) => partKind(p) === 'block').length;
  assert.equal(c.inPlateaus.examBlocks, plateaus.reduce((n, p) => n + blocks(p.examTeile), 0));
  assert.equal(c.inClosing.examBlocks, blocks(halbtest.parts));
  const tasks = (p, k) => [...p.examTeile, p.productive].filter((x) => partKind(x) === k).length;
  assert.equal(c.inPlateaus.writingTasks, plateaus.reduce((n, p) => n + tasks(p, 'writing'), 0));
  assert.equal(c.inPlateaus.speakingTasks, plateaus.reduce((n, p) => n + tasks(p, 'speaking'), 0));
  assert.equal(c.inClosing.writingTasks, halbtest.parts.filter((p) => partKind(p) === 'writing').length);
  assert.equal(c.inClosing.speakingTasks, halbtest.parts.filter((p) => partKind(p) === 'speaking').length);
  assert.equal(c.inPlateaus.reviewItems, plateaus.reduce((n, p) => n + p.review.items.length, 0));
  assert.equal(c.plateaus, 3);
  assert.equal(c.closingBlocks, 1);
});

// ---------------------------------------------------------------------------
// 4. A speaking part's own length
// ---------------------------------------------------------------------------

test('a speaking part\'s own length reaches the bank and wins over the Prüfungsfokus; full carries none', () => {
  const part = { template: 'sd1.sp1', mode: 'monologue', profile: 'sd1-sp1', prepMinutes: 0, instructionsDe: 'x' };
  assert.equal('length' in speakingPart(part, null), false);
  assert.equal(speakingPart({ ...part, length: 'full' }, null).length, undefined);
  assert.equal(speakingPart({ ...part, length: 'reduced' }, null).length, 'reduced');
  assert.equal(speakingPart({ ...part, length: 'mini' }, new Map([['sd1.sp1', 'reduced']])).length, 'mini', 'the part\'s own length wins');
  assert.equal(speakingPart(part, new Map([['sd1.sp1', 'reduced']])).length, 'reduced', 'else the unit\'s Prüfungsfokus');
});

// ---------------------------------------------------------------------------
// 5. The player's model
// ---------------------------------------------------------------------------

test('a Plateau is walked as review → one section per exam Teil → productive → reward (optional)', () => {
  for (const p of plateaus) {
    assert.equal(assessmentKind(p), 'plateau');
    const sections = assessmentSections(p);
    assert.deepEqual(sections.map((s) => s.role), ['review', ...p.examTeile.map(() => 'teil'), 'productive', 'reward']);
    assert.equal(sections[0].id, `${p.id}-review`);
    assert.equal(sections[0].items.length, p.review.items.length);
    for (const [i, part] of p.examTeile.entries()) {
      const s = sections[i + 1];
      assert.equal(s.kind, partKind(part));
      assert.equal(s.id, s.kind === 'block' ? part.id : part.bankKey, 'a block by its id, a task by its bank key (SCHEMA §2 learner-state ids)');
      assert.equal(s.template, part.template);
    }
    assert.equal(sections.at(-2).id, p.productive.bankKey);
    assert.equal(sections.at(-1).required, false, 'the reward is never required');
    assert.ok(sections.every((s) => s.kind === 'reward' || s.required));
    assert.equal(new Set(sections.map((s) => s.id)).size, sections.length);
    const lines = assessmentLines(p);
    for (const tx of p.texts) for (const l of tx.lines || []) assert.ok(lines.has(l.id), `${l.id} is playable`);
  }
  const hm = assessmentLines(plateaus[1]);
  for (const l of plateaus[1].reward.hoermagazin.lines) assert.ok(hm.has(l.id), 'the Hörmagazin lines too');
});

test('results, submission and resume: items answered right or wrong finish a section; a task only when submitted', () => {
  const p = plateaus[0];
  const sections = assessmentSections(p);
  const review = sections[0];
  const answers = new Map(review.items.map((it, i) => [it.id, i % 4 !== 0]));
  const r = sectionResult(review, { answers, finished: new Set([review.id]) });
  assert.equal(r.total, review.items.length);
  assert.equal(r.answered, review.items.length);
  assert.equal(r.correct, review.items.filter((_, i) => i % 4 !== 0).length);
  const repairs = reviewRepairs(review, answers);
  assert.equal(repairs.reduce((n, x) => n + x.missed, 0), review.items.length - r.correct, 'every miss maps back to its Lernschritt');
  for (const x of repairs) assert.match(x.step, /^a1\.1-u0[1-3]-ls\d$/);
  const required = sections.filter((s) => s.required).map((s) => s.id);
  const task = sections.find((s) => s.kind === 'speaking');
  assert.equal(sectionResult(task, { finished: new Set() }).submitted, false);
  const allButOne = new Set(required.filter((id) => id !== task.id));
  assert.equal(assessmentProgress(sections, allButOne).complete, false, 'a speaking Teil left without submitting keeps it open');
  assert.deepEqual(assessmentProgress(sections, allButOne).open.map((s) => s.id), [task.id]);
  assert.equal(assessmentStatus(sections, allButOne), 'started');
  const all = new Set(required);
  assert.equal(assessmentProgress(sections, all).complete, true, 'the reward is not needed');
  assert.equal(assessmentStatus(sections, all), 'complete');
  assert.equal(assessmentStatus(sections, new Set(), 'complete'), 'complete', 'never taken back');
  assert.equal(resumeSection(sections, new Set([review.id])), 1);
  assert.equal(resumeSection(sections, new Set(sections.map((s) => s.id))), sections.length);
  // the Teil with misses links to the unit that practised it
  const block = sections.find((s) => s.kind === 'block');
  const hit = unitPractising(manifest, 'sd1', teilLabel(block.template), unitNr(p.after));
  if (hit) assert.ok(hit.nr <= unitNr(p.after) && hit.pruefungsfokus.sd1.includes(teilLabel(block.template)));
});

test('the Teil-Karte: one row per Teil, practised or open, and where it comes next — never a total', () => {
  const sections = assessmentSections(halbtest);
  assert.equal(assessmentKind(halbtest), 'closing');
  assert.deepEqual(sections.map((s) => s.id), halbtest.parts.map((p) => p.id || p.bankKey));
  const h1 = sections.find((s) => s.template === 'sd1.h1');
  const answers = new Map(h1.items.map((it, i) => [it.id, i === 0]));
  const rows = teilKarte(halbtest, sections, { answers, finished: new Set([h1.id]) });
  assert.equal(rows.length, 11);
  const row = rows.find((x) => x.template === 'sd1.h1');
  assert.equal(row.practised, 'miniature', 'a shortened Halbtest block is „im Kleinen geübt"');
  assert.equal(row.correct, 1);
  assert.equal(row.total, h1.items.length);
  assert.equal(row.next.level, 'a1.2');
  assert.equal(row.next.unit, halbtest.comesNext.byTemplate['sd1.h1']?.unit ?? null);
  assert.ok(rows.filter((x) => x.id !== h1.id).every((x) => x.practised === null), 'the rest is still open');
  assert.ok(rows.every((x) => !('score' in x) && !('pass' in x)));
  const noNext = teilKarte({ ...halbtest, comesNext: { level: 'a1.2', byTemplate: {} } }, sections, {});
  assert.ok(noNext.every((x) => x.next && x.next.unit === null && x.next.level === 'a1.2'), 'no specs yet: „kommt in A1.2"');
});

test('completion.js counts submitted Plateaus and the Halbtest of the learner\'s lane toward the course', () => {
  assert.equal(closingIdFor(manifest), 'a1.1-ht-sd1');
  assert.equal(closingIdFor(manifest, 'ga2'), 'a1.1-ht-sd1', 'a lane without a Halbtest falls back to the primary lane');
  const progress = new Map(manifest.units.map((u) => [u.unit, 'complete']));
  let c = courseCompletion(manifest, { progress });
  assert.equal(c.complete, false);
  for (const p of plateaus) progress.set(p.id, assessmentStatus(assessmentSections(p), new Set(assessmentSections(p).filter((s) => s.required).map((s) => s.id))));
  c = courseCompletion(manifest, { progress });
  assert.equal(c.parts.find((x) => x.kind === 'plateau').done, 3);
  assert.equal(c.complete, false, 'the Halbtest is still open');
  progress.set(halbtest.id, 'complete');
  assert.equal(courseCompletion(manifest, { progress }).complete, true);
});

test('learner state: section markers and the latest answers, in Supabase and in this browser', async () => {
  const store = fakeStore();
  localStepDone('a1.1-p1', 'a1.1', 'a1.1-p1-review', store);
  localAnswers('a1.1-p1', 'a1.1', { 'a1.1-u01-ls1-r01': false }, store);
  localAnswers('a1.1-p1', 'a1.1', { 'a1.1-u01-ls1-r01': true, 'a1.1-u02-ls1-r02': false }, store);
  localUnitStatus('a1.1-p1', 'a1.1', 'complete', store);
  const st = localUnitState('a1.1-p1', store);
  assert.deepEqual([...st.finishedSteps], ['a1.1-p1-review']);
  assert.equal(st.answers.get('a1.1-u01-ls1-r01'), true, 'the latest answer wins');
  assert.equal(st.answers.get('a1.1-u02-ls1-r02'), false);
  assert.equal(localLevelState('a1.1', store).progress.get('a1.1-p1').status, 'complete', 'the course home sees the Plateau');

  const rows = [
    { lektion_id: 'a1.1-p1', item_id: 'a1.1-u01-ls1-r01', stage: ASSESSMENT_STAGE.plateau, correct: false },
    { lektion_id: 'a1.1-p1', item_id: 'a1.1-u01-ls1-r01', stage: ASSESSMENT_STAGE.plateau, correct: true },
    { lektion_id: 'a1.1-p1', item_id: 'a1.1-p1-review', stage: STEP_MARKER_STAGE, correct: true },
  ];
  assert.deepEqual([...answersFromRows(rows, [STEP_MARKER_STAGE])], [['a1.1-u01-ls1-r01', true]]);
  const q = (data) => {
    const chain = { select: () => chain, eq: () => chain, in: () => chain, order: async () => ({ data, error: null }), maybeSingle: async () => ({ data: { lektion_id: 'a1.1-p1', status: 'started' }, error: null }) };
    return chain;
  };
  const client = { from: (tbl) => (tbl === 'lesson_progress' ? q(null) : q(rows)) };
  const remote = await fetchAssessmentState('u1', 'a1.1', 'a1.1-p1', client);
  assert.equal(remote.row.status, 'started');
  assert.deepEqual([...remote.finishedSteps], ['a1.1-p1-review']);
  assert.equal(remote.answers.get('a1.1-u01-ls1-r01'), true);
  assert.equal(remote.answers.has('a1.1-p1-review'), false, 'a marker is not an answer');

  const inserts = [];
  const writer = { from: (t) => ({ insert: async (r) => { inserts.push({ t, r }); return { error: null }; } }) };
  await recordStepDone('u1', { level: 'a1.1', unitId: 'a1.1-p1', step: { id: 'a1.1-p1-sd1-h1', kind: ASSESSMENT_STAGE.plateau } }, [
    { itemId: 'a1.1-p1-sd1-h1-01', correct: true },
  ], writer);
  assert.deepEqual(inserts[0].r.map((x) => [x.lektion_id, x.item_id, x.stage]), [
    ['a1.1-p1', 'a1.1-p1-sd1-h1-01', 'plateau'],
    ['a1.1-p1', 'a1.1-p1-sd1-h1', STEP_MARKER_STAGE],
  ], 'the unit\'s one-batch rule, under the Plateau id');
});

// ---------------------------------------------------------------------------
// 6. The course home
// ---------------------------------------------------------------------------

test('course home: the Plateaus after U3/U6/U9 and the closing block after U12, soft-locked like the units', () => {
  const opts = { plateaus: new Set([1, 2, 3]), closings: new Set(['a1.1-ht-sd1']) };
  const empty = courseHomeModel(manifest, {}, opts);
  assert.deepEqual(empty.etappen.map((e) => (e.plateau ? e.plateau.id : e.closing && e.closing.id)), ['a1.1-p1', 'a1.1-p2', 'a1.1-p3', 'a1.1-ht-sd1']);
  assert.deepEqual(empty.etappen.map((e) => e.units.at(-1).nr), [3, 6, 9, 12]);
  const p1 = empty.etappen[0].plateau;
  assert.equal(p1.available, true);
  assert.equal(p1.ready, false, 'U1–U3 not finished → „Trotzdem öffnen"');
  assert.equal(p1.href, v2Paths.plateau('a1.1', 1));
  const closing = empty.etappen[3].closing;
  assert.equal(closing.available, true);
  assert.equal(closing.href, '/course/a1.1/abschluss');
  assert.equal(empty.next.id, 'a1.1-u01');

  const unitsDone = (n) => new Map(manifest.units.filter((u) => unitNr(u.unit) <= n).map((u) => [u.unit, { status: 'complete' }]));
  const after3 = courseHomeModel(manifest, { progress: unitsDone(3) }, opts);
  assert.equal(after3.etappen[0].plateau.ready, true);
  assert.equal(after3.next.kind, 'plateau', 'the Plateau is the next stop after U3');
  assert.equal(after3.next.href, '/course/a1.1/p/1');
  const p1Done = unitsDone(3).set('a1.1-p1', { status: 'complete' });
  const next = courseHomeModel(manifest, { progress: p1Done }, opts);
  assert.equal(next.etappen[0].plateau.done, true);
  assert.equal(next.next.id, 'a1.1-u04');
  const all = unitsDone(12);
  for (const p of plateaus) all.set(p.id, { status: 'complete' });
  const end = courseHomeModel(manifest, { progress: all }, opts);
  assert.equal(end.next.kind, 'closing');
  assert.equal(end.etappen[3].closing.ready, true);
  all.set('a1.1-ht-sd1', { status: 'complete' });
  const finished = courseHomeModel(manifest, { progress: all }, opts);
  assert.equal(finished.next, null);
  assert.equal(finished.completion.complete, true);
  const unavailable = courseHomeModel(manifest, { progress: unitsDone(3) }, {});
  assert.equal(unavailable.etappen[0].plateau.available, false, 'without a compiled file: „kommt bald"');
  assert.equal(unavailable.next.id, 'a1.1-u04', 'an uncompiled Plateau is never the primary action');
});

// ---------------------------------------------------------------------------
// 7. Routes and pages
// ---------------------------------------------------------------------------

test('the closing route sits next to the Plateau route, above the catch-all, behind the v2 guard', () => {
  const app = read('src/App.jsx');
  const at = app.indexOf('path="/course/:level/abschluss"');
  assert.ok(at > 0, 'missing route /course/:level/abschluss');
  assert.ok(at > app.indexOf('path="/course/:level/p/:nr"') && at < app.indexOf('path="/course/:level/:itemId"'));
  const line = app.slice(at, app.indexOf('\n', at));
  assert.match(line, /<LevelSubscriptionGuard courseV2><EmailVerificationGate><ClosingPage \/><\/EmailVerificationGate><\/LevelSubscriptionGuard>/);
  assert.match(app, /const ClosingPage = lazy\(\(\) => import\('\.\/pages\/course-v2\/ClosingPage\.jsx'\)\);/);
  assert.equal(v2Paths.closing('A1.1'), '/course/a1.1/abschluss');
});

test('the Plateau and closing pages play the runner, write only brand tokens and speak Sie', () => {
  const plateauPage = read('src/pages/course-v2/PlateauPage.jsx');
  assert.doesNotMatch(plateauPage, /kommt bald/, 'no hard-coded placeholder: the soon state comes from strings.js');
  assert.match(plateauPage, /<AssessmentPlayer key=\{info\.plateau\.id\}/);
  assert.match(read('src/pages/course-v2/ClosingPage.jsx'), /<AssessmentPlayer key=\{info\.doc\.id\}/);
  const runner = read('src/pages/course-v2/AssessmentPlayer.jsx');
  for (const c of ['<ItemRun', '<ExamBlockView', '<WritingTaskView', '<SpeakingTaskView', '<RewardView']) assert.ok(runner.includes(c), `the runner reuses ${c}`);
  assert.match(runner, /saveUnitStatus\(user\.id, \{ level, unitId: docId, status \}\)/, 'submission is stored like a unit\'s status');
  assert.match(runner, /if \(r && r\.submitted\) \{ finishSection\(section, null\); return; \}/, 'a task counts only when submitted');
  assert.doesNotMatch(read('src/pages/course-v2/CourseHomeV2Page.jsx'), /Abschluss des Kurses – kommt bald/);
  for (const f of ['src/pages/course-v2/AssessmentPlayer.jsx', 'src/pages/course-v2/PlateauPage.jsx', 'src/pages/course-v2/ClosingPage.jsx', 'src/pages/course-v2/CourseHomeV2Page.jsx', 'src/components/course-v2/RewardView.jsx']) {
    const src = read(f);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour outside design-tokens.js`);
    assert.doesNotMatch(src, /\b(?:bg|text|border)-(?:amber|rose|red|green|blue|gray|slate)-\d/, `${f}: a raw Tailwind palette class`);
    assert.doesNotMatch(src, /\bdu\b|\bdein/i, `${f}: the course speaks Sie`);
  }
  // every as.* / kk.* key the pages use exists in both chrome languages
  const strings = read('src/components/course-v2/strings.js');
  const en = strings.slice(strings.indexOf('const EN = {'), strings.indexOf('const DE = {'));
  const de = strings.slice(strings.indexOf('const DE = {'), strings.indexOf('export const V2_STRINGS'));
  const used = new Set();
  for (const f of ['src/pages/course-v2/AssessmentPlayer.jsx', 'src/pages/course-v2/PlateauPage.jsx', 'src/pages/course-v2/ClosingPage.jsx', 'src/components/course-v2/RewardView.jsx', 'src/pages/course-v2/UnitPlayerPage.jsx']) {
    for (const m of read(f).matchAll(/t\('((?:as|kk)\.[A-Za-z]+)'/g)) used.add(m[1]);
  }
  assert.ok(used.size > 20);
  for (const k of used) {
    assert.ok(en.includes(`'${k}':`), `EN lacks ${k}`);
    assert.ok(de.includes(`'${k}':`), `DE lacks ${k}`);
  }
  assert.doesNotMatch(de, /'(?:as|kk)\.[A-Za-z]+': '[^']*\b(?:bestanden|Note \d|Punkte gesamt)/, 'no pass verdict, no total');
});

// ---------------------------------------------------------------------------
// 8. The progress bar moves per task in EVERY section (ASSESS-04, 2026-09-30)
// ---------------------------------------------------------------------------
// The bar over a Plateau is the sections finished plus the open section's own fraction (`inner`),
// so each section's view must report into setInner — the review's ItemRun and the reward's pieces
// used to be left out, and the bar stood at 0 through all 20 review tasks, then jumped.

test('every section view of the runner reports its progress into the bar: review, exam block, reward', () => {
  const runner = read('src/pages/course-v2/AssessmentPlayer.jsx');
  for (const tag of ['<ItemRun', '<ExamBlockView', '<RewardView']) {
    const uses = [...runner.matchAll(new RegExp(`${tag}\\b[\\s\\S]*?/>`, 'g'))];
    assert.ok(uses.length >= 1, `the runner renders ${tag}`);
    for (const m of uses) assert.match(m[0], /\bonProgress=\{setInner\}/, `${tag} in the runner must carry onProgress={setInner}`);
  }
  // the bar: finished sections, plus the open one's inner fraction — never counted twice once it is finished
  assert.match(runner, /const sectionProgress = sections\.length \? Math\.min\(1, \(doneCount \+ \(finished\.has\(s\.id\) \? 0 : inner\)\) \/ sections\.length\) : 0;/);
  assert.match(runner, /const goTo = useCallback\(\(i\) => \{\s*setIndex\(i\);\s*setInner\(0\);/, 'a section opens with its fraction at 0');
  assert.match(runner, /<GameTopBar[^>]*progress=\{progress\}/, 'the top bar shows the fraction');

  // what the views report: ItemRun pos / queue.length on every advance (the review passes no
  // `requeue`, so its queue stays at the 20 drawn items)
  const itemRun = read('src/components/course-v2/ItemRun.jsx');
  assert.match(itemRun, /onProgress = null \}\)/, 'ItemRun: onProgress is optional');
  assert.match(itemRun, /useEffect\(\(\) => \{\s*if \(typeof progressSink\.current === 'function'\) progressSink\.current\(queue\.length \? Math\.min\(1, pos \/ queue\.length\) : 1\);\s*\}, \[pos, queue\.length\]\);/);
  const review = runner.match(/<ItemRun\b[\s\S]*?\/>/)[0];
  assert.doesNotMatch(review, /requeue/, 'the review never grows its queue: 20 tasks are 20 bar steps');

  // the reward: pieces share the bar equally; a read screen (or the Projekt) stands at its piece's
  // start, the piece's items move it the way ItemRun reports
  const reward = read('src/components/course-v2/RewardView.jsx');
  assert.match(reward, /onDone, onProgress = null \}\)/, 'RewardView: onProgress is optional');
  assert.match(reward, /const sink = useRef\(onProgress\);\s*sink\.current = onProgress;/, 'held in a ref, like ItemRun and ExamBlockView');
  assert.match(reward, /useEffect\(\(\) => \{\s*if \(phase !== 'items' && typeof sink\.current === 'function'\) sink\.current\(total \? Math\.min\(1, idx \/ total\) : 0\);\s*\}, \[idx, phase, total\]\);/);
  assert.match(reward, /<ItemRun\b[\s\S]*?onProgress=\{\(f\) => report\(idx \+ f\)\}[\s\S]*?onFinish=\{nextPiece\}/);
  assert.match(reward, /const report = \(f\) => \{ if \(typeof sink\.current === 'function'\) sink\.current\(total \? Math\.min\(1, f \/ total\) : 0\); \};/);
  // ... and the model of it, as the bar will show it over a 7-section Plateau whose review has 20 items
  // and whose reward is one Lesemagazin of 4 items: the review moves on every task, the reward on
  // every question — no flat stretch longer than one screen anywhere.
  const sections = 7;
  const bar = (done, inner) => Math.round(Math.min(1, (done + inner) / sections) * 100);
  const reviewTrail = Array.from({ length: 20 }, (_, pos) => bar(0, pos / 20));
  assert.equal(reviewTrail[0], 0);
  assert.equal(reviewTrail[19], 14, 'task 20 of the review stands just under the first finished section');
  assert.ok(reviewTrail.every((v, i) => i === 0 || v >= reviewTrail[i - 1]), 'monotone');
  assert.ok(new Set(reviewTrail).size >= 10, `the review bar takes distinct values (${new Set(reviewTrail).size}), not one`);
  const rewardTrail = [bar(6, 0 / 1), ...Array.from({ length: 4 }, (_, pos) => bar(6, (0 + pos / 4) / 1))];
  assert.deepEqual(rewardTrail, [86, 86, 89, 93, 96], 'read screen, then question 1..4 of the Lesemagazin');
});
