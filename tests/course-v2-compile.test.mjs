// Course v2 compiler — partial levels (RAILS §4). A level compiles from the units that exist:
//   1. a level with 1 of 12 units compiles, although course.json (and the other registries) name
//      all 12 — references to planned-but-missing units resolve in compile mode only; the checker
//      keeps reporting them (REF-01 stays as it is);
//   2. a missing unit is a manifest row with status 'coming', its title, can-dos, Prüfungsfokus and
//      planned minutes taken from the level's specs.json bundle, and no chunk;
//   3. a unit that fails its own check is skipped with its errors (never half-written): no chunk,
//      no bank entry, no audio line, no reserve item — and its ids stay live in the ledger;
//   4. deterministic and idempotent; the CLI prints the skip and exits 0.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { compileLevel, writeOutputs, unitOfId } from '../scripts/course-v2/lib/compiler.mjs';
import { checkFiles } from '../scripts/course-v2/lib/checker.mjs';
import { listJsonFiles, FIXTURES_ROOT, REPO_ROOT } from '../scripts/course-v2/lib/tree.mjs';

const TMP = [];
const tmp = (name) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `cv2-compile-${name}-`));
  TMP.push(d);
  return d;
};
after(() => {
  for (const d of TMP) fs.rmSync(d, { recursive: true, force: true });
});
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, x) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(x, null, 2)}\n`);
};

/**
 * The SCHEMA §15 fixture as a PARTIAL level: A2.1 with only U07 authored. The fixture's stubs
 * list the eleven other units as existing; here they are removed, so course.json points at eleven
 * units no file holds — the state of every real level on 2026-09-27.
 */
function partialLevel({ specs = true } = {}) {
  const root = tmp('content');
  fs.cpSync(FIXTURES_ROOT, root, { recursive: true });
  const stubsPath = path.join(root, 'registries/stubs.json');
  const stubs = readJson(stubsPath);
  delete stubs.ids.unit;
  writeJson(stubsPath, stubs);
  if (specs) {
    writeJson(path.join(root, 'a2.1/specs.json'), [
      {
        id: 'a2.1-u08', nr: 8, etappe: 3,
        title: { de: 'Beim Arzt', canDo: 'Sie können einen Termin beim Arzt vereinbaren.' },
        spec: {
          handlungsfeld: ['4'],
          canDos: ['cd.a2.telefon-termin', 'cd.a2.gibt-es-nicht-im-register'],
          grammar: { new: ['g.reflexiv-akk'], chunk: [], review: [] },
          lanes: { primary: 'ga2', pruefungsfokus: [{ template: 'ga2.h1', slot: 'ls4' }, { template: 'ga2.s2', slot: 'schreiben' }], spur: {} },
        },
      },
      'not an entry',
      { id: 'a2.1-u08', title: { de: 'a second entry for the same id is ignored' } },
    ]);
  }
  return root;
}

function compile(root, out = tmp('out')) {
  const result = compileLevel('a2.1', { contentRoot: root, outRoot: path.join(out, 'src'), banksRoot: path.join(out, 'banks') });
  return { result, out };
}

test('a level with 1 of 12 units compiles; the checker still reports the eleven missing units (REF-01 unchanged)', () => {
  const root = partialLevel();
  const check = checkFiles(listJsonFiles(root));
  const courseErrors = check.files.find((f) => f.file.endsWith(path.join('a2.1', 'course.json'))).errors;
  assert.ok(courseErrors.some((e) => e.rule === 'REF-01' && /ref\(unit\) "a2\.1-u01" does not resolve/.test(e.message)), 'the checker keeps REF-01');
  assert.ok(check.files.some((f) => f.file.endsWith('specs.json') && f.errors.length), 'the checker keeps rejecting the spec bundle');

  const { result, out } = compile(root);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.skipped, []);
  assert.deepEqual(result.summary.compiled, ['a2.1-u07']);
  assert.equal(result.summary.coming.length, 11);
  writeOutputs(result);
  const manifest = readJson(path.join(out, 'src/a2.1/manifest.json'));
  assert.equal(manifest.units.length, 12);
  assert.deepEqual(manifest.units.map((r) => r.unit), readJson(path.join(root, 'registries/a2.1/course.json')).units);
  assert.equal(manifest.units[6].chunk, 'units/u07.json');
  assert.equal(manifest.counts.unitsComing, 11);
  assert.equal(manifest.counts.unitsAuthored, 1);
  assert.ok(fs.existsSync(path.join(out, 'src/a2.1/units/u07.json')));
  assert.deepEqual(fs.readdirSync(path.join(out, 'src/a2.1/units')), ['u07.json'], 'no chunk for a missing unit');
});

test('a missing unit is a „coming" row: title, can-dos, Prüfungsfokus and minutes from specs.json, no chunk', () => {
  const { result, out } = compile(partialLevel());
  writeOutputs(result);
  const manifest = readJson(path.join(out, 'src/a2.1/manifest.json'));
  const row = manifest.units.find((r) => r.unit === 'a2.1-u08');
  assert.equal(row.status, 'coming');
  assert.equal(row.chunk, null);
  assert.equal(row.counts, null);
  assert.equal(row.nr, 8);
  assert.equal(row.etappe, 3, 'the Etappe comes from course.json');
  assert.equal(row.title, 'Beim Arzt');
  assert.equal(row.canDoTitle, 'Sie können einen Termin beim Arzt vereinbaren.');
  assert.deepEqual(row.handlungsfeld, ['4']);
  assert.deepEqual(row.canDoIds, ['cd.a2.telefon-termin', 'cd.a2.gibt-es-nicht-im-register']);
  assert.notEqual(row.canDos[0], 'cd.a2.telefon-termin', 'a registry can-do is shown in its wording');
  assert.equal(row.canDos[1], 'cd.a2.gibt-es-nicht-im-register', 'an unknown can-do falls back to its id…');
  assert.ok(result.warnings.some((w) => /a2\.1-u08: can-do cd\.a2\.gibt-es-nicht-im-register has no registry text/.test(w)), '…with a warning');
  assert.deepEqual(row.pruefungsfokus, { ga2: ['Hören Teil 1', 'Schreiben Teil 2'] });
  assert.equal(row.minutesPlanned, manifest.units[6].minutesPlanned, 'design minutes of the level profile, like an authored unit');
  assert.equal(typeof row.minutesPlanned, 'number');
  assert.deepEqual(Object.keys(row), Object.keys(manifest.units[6]), 'the same row shape as an authored unit');
  // a unit the bundle does not describe is listed with what course.json knows
  const bare = manifest.units.find((r) => r.unit === 'a2.1-u01');
  assert.deepEqual([bare.status, bare.title, bare.minutesPlanned, bare.chunk, bare.etappe], ['coming', null, null, null, 1]);
});

test('a unit that fails its own check is skipped with its errors, never half-written, and keeps its ledger ids', () => {
  const root = partialLevel();
  const out = tmp('skip');
  const first = compile(root, out);
  writeOutputs(first.result);
  const ledger1 = readJson(path.join(out, 'src/a2.1/ids.ledger.json'));
  assert.ok(Object.keys(ledger1.ids).length > 100);

  const unitPath = path.join(root, 'a2.1-u07.json');
  const u = readJson(unitPath);
  delete u.steps[0].endLine;
  writeJson(unitPath, u);
  const second = compile(root, out);
  assert.deepEqual(second.result.errors, [], 'a broken unit does not refuse the level');
  assert.equal(second.result.skipped.length, 1);
  const s = second.result.skipped[0];
  assert.equal(s.unit, 'a2.1-u07');
  assert.equal(s.file, path.relative(REPO_ROOT, unitPath).startsWith('..') ? unitPath : path.relative(REPO_ROOT, unitPath));
  assert.ok(s.errors.some((e) => /\$\.steps\[0\]: SCH-01 missing required field "endLine"/.test(e)), s.errors.join('\n'));
  writeOutputs(second.result);
  const manifest = readJson(path.join(out, 'src/a2.1/manifest.json'));
  const row = manifest.units.find((r) => r.unit === 'a2.1-u07');
  assert.deepEqual([row.status, row.chunk], ['coming', null]);
  assert.ok(!fs.existsSync(path.join(out, 'src/a2.1/units/u07.json')), 'the stale chunk is removed, not half-written');
  const banks = readJson(path.join(out, 'banks/a2.1.banks.json'));
  assert.deepEqual([Object.keys(banks.writing), Object.keys(banks.speaking), Object.keys(banks.micro)], [[], [], []]);
  assert.deepEqual(readJson(path.join(out, 'src/a2.1/lines.json')), []);
  assert.deepEqual(readJson(path.join(out, 'src/a2.1/reserve.json')).items, []);
  const ledger2 = readJson(path.join(out, 'src/a2.1/ids.ledger.json'));
  assert.deepEqual(ledger2.ids, ledger1.ids, 'a skipped unit loses no id');
  assert.deepEqual(ledger2.tombstones, {}, 'and nothing is tombstoned');

  // repaired, it compiles again with the same ids (none was tombstoned, so none is „reused")
  u.steps[0].endLine = readJson(path.join(FIXTURES_ROOT, 'a2.1-u07.json')).steps[0].endLine;
  writeJson(unitPath, u);
  const third = compile(root, out);
  assert.deepEqual(third.result.errors, []);
  assert.deepEqual(third.result.skipped, []);
  writeOutputs(third.result);
  assert.ok(fs.existsSync(path.join(out, 'src/a2.1/units/u07.json')));
});

test('a unit file that is not even JSON is skipped by its path; another level\'s broken file is not this level\'s business', () => {
  const root = partialLevel();
  fs.mkdirSync(path.join(root, 'a2.1/units'), { recursive: true });
  fs.writeFileSync(path.join(root, 'a2.1/units/u05.json'), '{ "id": "a2.1-u05", ');
  fs.mkdirSync(path.join(root, 'b1.1/units'), { recursive: true });
  fs.writeFileSync(path.join(root, 'b1.1/units/u02.json'), 'not json');
  const { result } = compile(root);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.skipped.map((s) => s.unit), ['a2.1-u05']);
  assert.match(result.skipped[0].errors[0], /SCH-01 invalid JSON/);
  assert.deepEqual(result.summary.compiled, ['a2.1-u07']);
});

test('an error outside the units still refuses the whole level', () => {
  const root = partialLevel();
  const lanePath = path.join(root, 'registries/lanes/ga2.json');
  const lane = readJson(lanePath);
  delete lane.delivery;
  writeJson(lanePath, lane);
  const { result } = compile(root);
  assert.ok(result.errors.some((e) => /ga2\.json:\$: SCH-01 missing required field "delivery"/.test(e)), result.errors.join('\n'));
  assert.deepEqual(result.outputs, []);
});

test('partial compile is deterministic and idempotent', () => {
  const root = partialLevel();
  const a = compile(root);
  const b = compile(root);
  const strip = (r, dir) => r.outputs.map((o) => [path.relative(dir, o.file), o.text]);
  assert.deepEqual(strip(a.result, a.out), strip(b.result, b.out));
  assert.equal(writeOutputs(a.result).length, a.result.outputs.length);
  assert.deepEqual(writeOutputs(compile(root, a.out).result), [], 'a second compile changes nothing');
});

test('unitOfId: every id and bank key is owned by its unit', () => {
  assert.equal(unitOfId('a2.1-u07'), 'a2.1-u07');
  assert.equal(unitOfId('a2.1-u07-ls1-p06'), 'a2.1-u07');
  assert.equal(unitOfId('a2.1-u07-ls1-g01'), 'a2.1-u07');
  assert.equal(unitOfId('a21-u07-w'), 'a2.1-u07');
  assert.equal(unitOfId('b22-u12-mo3-tb2'), 'b2.2-u12');
  assert.equal(unitOfId('a2.1-p1-lm-01'), null);
  assert.equal(unitOfId('a21-p1-w'), null);
  assert.equal(unitOfId('lx.anruf'), null);
});

test('compile.mjs prints a skipped unit and exits 0; the level is still written', () => {
  const root = partialLevel({ specs: false });
  const unitPath = path.join(root, 'a2.1-u07.json');
  const u = readJson(unitPath);
  u.spec.canDos[0] = 'cd.a2.gibt-es-nicht';
  writeJson(unitPath, u);
  const out = tmp('cli');
  const run = spawnSync(process.execPath, ['scripts/course-v2/compile.mjs', 'a2.1', '--content', root, '--out', path.join(out, 'src'), '--banks-out', path.join(out, 'banks')], { cwd: REPO_ROOT, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /skipped a2\.1-u07 \(.*a2\.1-u07\.json\): 1 check error\(s\)/);
  assert.match(run.stdout, /REF-01 ref\(cando\) "cd\.a2\.gibt-es-nicht" does not resolve/);
  assert.match(run.stdout, /course-v2 compile a2\.1: 12 units: compiled —; 12 coming \(1 skipped\)/);
  assert.ok(fs.existsSync(path.join(out, 'src/a2.1/manifest.json')));
});
