// Guard suite for the A1.1 speaking route
// (docs/superpowers/plans/2026-09-15-speaking-guided-city-map.md, Task 1):
// migrations/2026-09-17-a11-speaking-route.sql + src/data/curricula/a11.js.
//
// The experience contract: twelve stations correspond one-to-one with the
// twelve A1.1 Lektionen — mission_order N belongs to Lektion N's situation
// (the plan's own station table disagreed with the real Lektion sequence;
// per the approved deviation the REAL LESSONS win).
//
// What each pin defends:
//
//   1. THE BINDING — every Lektion's sprechen.open.missionOrder equals its own
//      nr, i.e. exactly [1..12], each order used once.
//   2. VOLUME — live rows (8, read 2026-09-16) + migration inserts (4) cover
//      exactly the 12 distinct orders 1–12 with 12 distinct ids; the migration
//      realigns every live row and inserts the rest.
//   3. GUARDS AND IDEMPOTENCY — every UPDATE fires only where the row still
//      carries its 2026-09-16 values (id + old mission_order + old title_de +
//      old ai_opening_line), so an admin-edited row is never overwritten
//      silently and a re-run is a no-op; every INSERT has a fixed UUID and a
//      WHERE NOT EXISTS guard on that id; the reorder goes through the +100
//      temp range inside one BEGIN/COMMIT, with the two DO-block sanity gates.
//   4. REQUIRED FIELDS — each of the four inserts supplies title_de/en,
//      scenario_de/en, ai_role, ai_opening_line, jsonb target_structures and
//      hint_words, pass_criteria and system_prompt_extra, is_free=false,
//      is_published=true. speaking_missions has NO learner_goal_de and NO
//      estimated_minutes column (information_schema, read 2026-09-16), so the
//      learner goal is the „Ihr Ziel: …“ sentence of scenario_de — pinned on
//      every scenario_de the migration writes.
//   5. THE ABSCHLUSSMISSION — mission 12's criteria carry the introduce /
//      respond-to-follow-ups / invite trio, matching the sprechen handoff in
//      src/data/courseTests/abschlusstestA11.js (missionOrder 12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { abschlusstestA11 } from '../src/data/courseTests/abschlusstestA11.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(ROOT, 'migrations', '2026-09-17-a11-speaking-route.sql'), 'utf8');
const sqlNoComments = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

// The live A1.1 rows as read from speaking_missions on 2026-09-16 — the known
// previous values every guarded UPDATE must anchor on.
const LIVE = [
  { id: 'eaae3db2-1dbf-4af3-b5c0-d5d256d319ab', order: 1, title: 'Ankunft im Hostel' },
  { id: 'dbf25892-27d8-42fb-8dbc-0f50d8481885', order: 2, title: 'Auf dem Flohmarkt' },
  { id: 'e309e3bb-2bd8-4c8b-b3f6-42aad186d1e6', order: 3, title: 'Im Klassenzimmer' },
  { id: 'fcc21770-299a-442d-a743-fe703cb9d555', order: 4, title: 'Einkaufen für die Wohnung' },
  { id: '06af3bdb-1571-4e5e-a6e4-75a57e890c94', order: 5, title: 'Über Leute sprechen' },
  { id: '612568b9-d2b9-4cb4-93fa-83a7a51dcc1d', order: 6, title: 'Neue Nachbarn' },
  { id: 'f825d8b9-d000-43e0-a148-466a18da0366', order: 7, title: 'Im Café' },
  { id: '6d53ebe9-ab26-4ea8-8021-f7735f620d5d', order: 8, title: 'Ein ganz normaler Tag' },
];

// Statement bodies contain literal ';' inside German text, so — as in
// tests/a1-1-course-linked-practice.test.mjs — statements are cut at the NEXT
// statement's start, never at the first ';' found.
const STARTS_RE = /^(UPDATE public\.speaking_missions SET|INSERT INTO public\.speaking_missions|DO \$\$)/gm;
function statements() {
  const starts = [...sqlNoComments.matchAll(STARTS_RE)].map((m) => ({ index: m.index, kind: m[1] }));
  const commitAt = sqlNoComments.indexOf('\nCOMMIT;');
  const boundaries = [...starts.map((s) => s.index), commitAt === -1 ? sqlNoComments.length : commitAt];
  return starts.map((s) => ({
    kind: s.kind.startsWith('UPDATE') ? 'update' : s.kind.startsWith('INSERT') ? 'insert' : 'do',
    text: sqlNoComments.slice(s.index, boundaries.find((b) => b > s.index) ?? sqlNoComments.length),
  }));
}
const updates = () => statements().filter((s) => s.kind === 'update').map((s) => s.text)
  // The +100→final shift is an UPDATE too; it has no id guard and is checked separately.
  .filter((t) => t.includes('WHERE id ='));
const inserts = () => statements().filter((s) => s.kind === 'insert').map((s) => s.text);

function jsonbLiterals(stmtText) {
  const out = [];
  const re = /'((?:[^']|'')*)'::jsonb/g;
  let m;
  while ((m = re.exec(stmtText))) out.push(JSON.parse(m[1].replace(/''/g, "'")));
  return out;
}

// ---------------------------------------------------------------------------
// 1. The binding: every Lektion owns its own station, in order.
// ---------------------------------------------------------------------------

test('every A1.1 lesson owns one unique station in order', () => {
  const orders = CURRICULUM_A11.lektionen.map((lesson) => lesson.sprechen.open.missionOrder);
  assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test('missionOrder N is Lektion N — not merely some permutation of 1..12', () => {
  for (const lesson of CURRICULUM_A11.lektionen) {
    assert.equal(
      lesson.sprechen.open.missionOrder, lesson.nr,
      `Lektion ${lesson.nr} must link speaking mission ${lesson.nr}, not ${lesson.sprechen.open.missionOrder}`,
    );
  }
});

// ---------------------------------------------------------------------------
// 2. Volume: live + migration = exactly 12 guarded rows at orders 1–12.
// ---------------------------------------------------------------------------

test('the migration realigns all 8 live rows and inserts exactly 4 new ones — 12 ids, orders 1–12', () => {
  const ups = updates();
  const ins = inserts();
  assert.equal(ups.length, LIVE.length, 'one guarded UPDATE per live row');
  assert.equal(ins.length, 4, 'exactly four INSERTs');

  // Each UPDATE parks its row at final order + 100; the shift statement drops
  // the whole range back down.
  const finalOrders = [];
  const updatedIds = new Set();
  for (const stmt of ups) {
    const idM = stmt.match(/WHERE id = '([0-9a-f-]{36})'/);
    assert.ok(idM, `UPDATE without an id guard:\n${stmt.slice(0, 120)}`);
    updatedIds.add(idM[1]);
    const setM = stmt.match(/mission_order = (\d+),/);
    assert.ok(setM, 'UPDATE must set a parked mission_order');
    const parked = Number(setM[1]);
    assert.ok(parked > 100 && parked <= 112, `parked order ${parked} outside the temp range`);
    finalOrders.push(parked - 100);
  }
  assert.deepEqual([...updatedIds].sort(), LIVE.map((r) => r.id).sort(), 'the UPDATEs cover exactly the 8 live ids');
  assert.match(sqlNoComments, /SET mission_order = mission_order - 100\s*\r?\nWHERE level = 'A1\.1' AND mission_order BETWEEN 101 AND 112/, 'the temp range must be shifted back to final orders');

  const insertIds = new Set();
  for (const stmt of ins) {
    const m = stmt.match(/SELECT '([0-9a-f-]{36})', 'A1\.1', (\d+), (?:'([0-9a-f-]{36})'|NULL),/);
    assert.ok(m, `INSERT not at level 'A1.1' or malformed:\n${stmt.slice(0, 200)}`);
    insertIds.add(m[1]);
    finalOrders.push(Number(m[2]));
    assert.ok(!LIVE.some((r) => r.id === m[1]), `INSERT reuses a live id: ${m[1]}`);
  }
  assert.equal(insertIds.size, 4, 'the four INSERT ids are distinct');
  assert.deepEqual(finalOrders.sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

// ---------------------------------------------------------------------------
// 3. Guards and idempotency.
// ---------------------------------------------------------------------------

test('every UPDATE is guarded on the known 2026-09-16 values, never a blind overwrite', () => {
  for (const live of LIVE) {
    const stmt = updates().find((t) => t.includes(`WHERE id = '${live.id}'`));
    assert.ok(stmt, `no UPDATE for live row ${live.id} (${live.title})`);
    const guard = stmt.slice(stmt.indexOf('WHERE id ='));
    assert.ok(guard.includes("level = 'A1.1'"), `${live.title}: guard must pin the level`);
    assert.ok(guard.includes(`mission_order = ${live.order}`), `${live.title}: guard must pin the old order ${live.order}`);
    assert.ok(guard.includes(`title_de = '${live.title.replace(/'/g, "''")}'`), `${live.title}: guard must pin the old title`);
    assert.ok(/AND ai_opening_line = '/.test(guard), `${live.title}: guard must pin the old opening line`);
  }
});

test('every INSERT is idempotent: fixed UUID + WHERE NOT EXISTS on that same id', () => {
  for (const stmt of inserts()) {
    const idM = stmt.match(/SELECT '([0-9a-f-]{36})',/);
    assert.ok(idM, 'INSERT must carry a fixed UUID');
    const guard = stmt.match(/WHERE NOT EXISTS \(\s*\r?\n\s*SELECT 1 FROM public\.speaking_missions WHERE id = '([0-9a-f-]{36})'/);
    assert.ok(guard, `INSERT ${idM[1]} has no WHERE NOT EXISTS guard`);
    assert.equal(guard[1], idM[1], 'the NOT EXISTS guard must check the inserted id itself');
  }
});

test('one transaction, and the two DO-block sanity gates', () => {
  assert.ok(sqlNoComments.trimStart().startsWith('BEGIN;'), 'the migration runs in one transaction');
  assert.ok(sqlNoComments.includes('\nCOMMIT;'), 'the transaction commits at the end');
  // Partial-realignment gate: 0 moved (already applied) or 8 moved, never in between.
  assert.match(sqlNoComments, /IF moved NOT IN \(0, 8\) THEN/, 'the all-or-none realignment gate is missing');
  // Final-state gate: exactly 12 published rows at 1–12, exactly one free.
  assert.match(sqlNoComments, /IF total <> 12 THEN/, 'the 12-row final assertion is missing');
  assert.match(sqlNoComments, /IF freies <> 1 THEN/, 'the one-free-mission assertion is missing');
});

// ---------------------------------------------------------------------------
// 4. Required fields on every row the migration writes.
// ---------------------------------------------------------------------------

test('each INSERT supplies every required field, is_free=false and is_published=true', () => {
  const COLUMNS = [
    'id', 'level', 'mission_order', 'grammar_topic_id',
    'title_en', 'title_de', 'scenario_en', 'scenario_de',
    'ai_role', 'ai_opening_line', 'target_structures', 'hint_words',
    'pass_criteria', 'system_prompt_extra', 'is_free', 'is_published',
  ];
  for (const stmt of inserts()) {
    for (const col of COLUMNS) assert.ok(stmt.includes(col), `INSERT is missing column ${col}`);
    const arrays = jsonbLiterals(stmt);
    assert.equal(arrays.length, 2, 'target_structures and hint_words must both be jsonb literals');
    for (const arr of arrays) {
      assert.ok(Array.isArray(arr) && arr.length >= 3, 'each jsonb field carries at least three entries');
      for (const entry of arr) assert.ok(typeof entry === 'string' && entry.trim(), 'jsonb entries are non-empty strings');
    }
    // is_free false, is_published true — mission 1 stays the level's only free one.
    assert.match(stmt, /false, true\s*\r?\nWHERE NOT EXISTS/, 'every new mission is paid (is_free=false) and published');
  }
  // No UPDATE may touch the free flag or unpublish a row.
  for (const stmt of updates()) {
    assert.ok(!/is_free\s*=/.test(stmt), 'an UPDATE must not change is_free');
    assert.ok(!/is_published\s*=/.test(stmt), 'an UPDATE must not change is_published');
  }
});

test('the learner goal lives in scenario_de (no learner_goal_de column exists): every written scenario says „Ihr Ziel:“', () => {
  const scenarios = [...sqlNoComments.matchAll(/scenario_de = '((?:[^']|'')*)'/g)].map((m) => m[1]);
  const inserted = inserts().map((stmt) => {
    // In the fixed column order, scenario_de is the literal right after scenario_en —
    // the 4th single-quoted string of the SELECT row (id and level excluded by position).
    const literals = [...stmt.matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1]);
    const goal = literals.find((s) => s.includes('Ihr Ziel:'));
    return goal || '';
  });
  const all = [...scenarios, ...inserted];
  assert.equal(all.length, LIVE.length + 4, 'every row the migration writes carries a scenario_de');
  for (const s of all) assert.ok(s.includes('Ihr Ziel:'), `scenario_de without a goal sentence: ${s.slice(0, 80)}`);
});

// ---------------------------------------------------------------------------
// 5. Mission 12 is the integrated final encounter the Abschlusstest hands off to.
// ---------------------------------------------------------------------------

test('mission 12 criteria carry the introduce / follow-ups / invite trio of the Abschlusstest handoff', () => {
  const stmt = inserts().find((t) => /SELECT '[0-9a-f-]{36}', 'A1\.1', 12,/.test(t));
  assert.ok(stmt, 'no INSERT at mission_order 12');
  const criteria = stmt.match(/,\s*\r?\n\s*'((?:[^']|'')*)',\s*\r?\n\s*'This is the course/)?.[1]
    ?? stmt.match(/'(Three parts(?:[^']|'')*)'/)?.[1];
  assert.ok(criteria, 'mission 12 pass_criteria not found in the migration source');
  assert.ok(/introduces themselves/.test(criteria), 'criterion 1: introduces self');
  assert.ok(/follow-up/.test(criteria), 'criterion 2: answers follow-up questions');
  assert.ok(/invit/.test(criteria), 'criterion 3: makes an invitation');

  // The final test hands off to exactly this station, with the same trio in its
  // instruction text (src/data/courseTests/abschlusstestA11.js).
  const sprechen = abschlusstestA11.sections.find((s) => s.key === 'sprechen');
  assert.ok(sprechen, 'the Abschlusstest has a sprechen section');
  assert.deepEqual(
    sprechen.parts.map((p) => [p.type, p.level, p.missionOrder]),
    [['speaking-mission', 'A1.1', 12]],
  );
  for (const needle of ['stellst dich vor', 'Rückfragen', 'lädst']) {
    assert.ok(sprechen.instructions.includes(needle), `Abschlusstest instructions lost „${needle}“`);
  }
});
