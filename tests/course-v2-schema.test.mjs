// Course v2 schema checker + compiler (E0-1): SCH-01, REF-01 resolution, KEY-01, the SCHEMA §15
// fixture, and the compiler's determinism and outputs (SCHEMA §13, §15.5).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { BANK_KEY_RE, LEGACY_COURSE_TASK_KEY_RE, bankKeyScope, parseBankKey, LANES, PATTERNS } from '../scripts/course-v2/lib/ids.mjs';
import { check, assertTypesResolve, parse, describe } from '../scripts/course-v2/lib/schema.mjs';
import { KINDS, kindOf } from '../scripts/course-v2/lib/schemas/index.mjs';
import { checkDocument, checkFiles } from '../scripts/course-v2/lib/checker.mjs';
import { loadTree, listJsonFiles, FIXTURES_ROOT, REPO_ROOT } from '../scripts/course-v2/lib/tree.mjs';
import { buildIndex } from '../scripts/course-v2/lib/refindex.mjs';
import { schemaExamples, fixtureFiles } from '../scripts/course-v2/lib/fixture.mjs';
import { compileLevel, writeOutputs } from '../scripts/course-v2/lib/compiler.mjs';
import { contentHash, canonicalJson } from '../scripts/course-v2/lib/hash.mjs';

const EX = schemaExamples();
const UNIT_FILE = path.join(FIXTURES_ROOT, 'a2.1-u07.json');
const TREE = loadTree(FIXTURES_ROOT);
const INDEX = buildIndex(TREE);
const TMP_DIRS = [];
const tmp = (name) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `cv2-${name}-`));
  TMP_DIRS.push(d);
  return d;
};
after(() => {
  for (const d of TMP_DIRS) fs.rmSync(d, { recursive: true, force: true });
});
const unit = () => structuredClone(EX.unit.json);
const node = (args) => spawnSync(process.execPath, args, { cwd: REPO_ROOT, encoding: 'utf8' });

// ── the fixture ─────────────────────────────────────────────────────────────────────────
test('fixture files are the SCHEMA §15 examples, verbatim', () => {
  for (const f of fixtureFiles(EX)) {
    const abs = path.join(FIXTURES_ROOT, f.path);
    assert.ok(fs.existsSync(abs), `${f.path} missing — run node scripts/course-v2/lib/fixture.mjs --write`);
    assert.equal(fs.readFileSync(abs, 'utf8'), f.text, `${f.path} drifted from SCHEMA.md §15`);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(UNIT_FILE, 'utf8')), EX.unit.json);
  // nothing else lives in the fixtures tree
  const expected = fixtureFiles(EX).map((f) => path.join(FIXTURES_ROOT, f.path)).sort();
  assert.deepEqual(listJsonFiles(FIXTURES_ROOT), expected);
});

test('every schema type resolves and every notation string parses', () => {
  assert.doesNotThrow(() => assertTypesResolve());
  assert.equal(describe(parse('[[str, str]]{3..6}')), '[[str, str]]{3..6}');
  assert.equal(describe(parse('[Step]{7} | [Step]{8}')), '[Step]{7} | [Step]{8}');
  assert.equal(describe(parse('ref(spine) | ref(lexicon) | enum(hoeren|lesen)')), 'ref(spine) | ref(lexicon) | enum(hoeren|lesen)');
  assert.throws(() => parse('ref(nonsense)'), /unknown ref kind/);
  assert.throws(() => parse('re(NOPE)'), /unknown pattern/);
});

test('the SCHEMA fixture passes SCH-01 / REF-01 / KEY-01 with every reference resolved', () => {
  const result = checkFiles(listJsonFiles(FIXTURES_ROOT));
  assert.equal(result.files.length, 13);
  const lines = result.files.flatMap((r) => r.errors.map((e) => `${r.file}:${e.path}: ${e.message}`));
  assert.deepEqual(lines, []);
  // resolution really ran: every ref kind the fixture uses has a loaded source
  for (const kind of ['cando', 'spine', 'lexicon', 'template', 'lane', 'rubric', 'rulecard', 'cast', 'texttype', 'detector', 'family', 'unit', 'item', 'line', 'fact', 'plateau']) {
    assert.ok(INDEX.loaded.has(kind), `ref kind ${kind} not loaded`);
  }
  assert.equal(INDEX.has('lexicon', 'lx.besetzt'), true);
  assert.equal(INDEX.has('lexicon', 'lx.gibt-es-nicht'), false);
});

test('§15.4 lane pack and the ta2 Teil excerpt validate against their schemas (in memory; lane packs are deferred)', () => {
  assert.deepEqual(check(KINDS.lanepack.schema, EX.lanePack.json), []);
  assert.deepEqual(check('TeilTemplate', EX.ta2Teile.json.h1), []);
});

// ── mutations: each must fail with the right path, rule and message ─────────────────────
function errorsOf(doc) {
  const k = kindOf(doc, UNIT_FILE);
  if (k.error) return [{ path: '$', rule: 'SCH-01', message: k.error }];
  return checkDocument(doc, { kind: k.kind, index: INDEX });
}
function expectError(mutate, { path: p, rule = 'SCH-01', message }) {
  const doc = unit();
  mutate(doc);
  const errors = errorsOf(doc);
  const hit = errors.find((e) => (p === undefined || e.path === p) && e.rule === rule && message.test(e.message));
  assert.ok(hit, `expected ${rule} ${message} at ${p}; got:\n${errors.map((e) => `  ${e.path}: ${e.rule} ${e.message}`).join('\n') || '  (no errors)'}`);
}

const MUTATIONS = [
  ['a missing required field', (u) => delete u.steps[0].endLine, { path: '$.steps[0]', message: /^missing required field "endLine"$/ }],
  ['an unknown key', (u) => { u.steps[0].pool.items[0].foo = 1; }, { path: '$.steps[0].pool.items[0].foo', message: /^unknown key "foo"$/ }],
  ['a generated field in an authored unit', (u) => { u.contentHash = 'sha256:x'; }, { path: '$.contentHash', message: /generated by the compiler/ }],
  ['authored line seconds (generated)', (u) => { u.check.lines[0].seconds = 3; }, { path: '$.check.lines[0].seconds', message: /generated by the compiler/ }],
  ['nr out of range', (u) => { u.nr = 13; }, { path: '$.nr', message: /expected int\[1\.\.12\], got 13/ }],
  ['a status outside the enum', (u) => { u.status = 'final'; }, { path: '$.status', message: /expected one of draft\|review\|approved/ }],
  ['four input items instead of five', (u) => u.steps[0].inputItems.pop(), { path: '$.steps[0].inputItems', message: /expected 5 items/ }],
  ['four MC options', (u) => u.steps[0].structuredInput[0].options.push('x'), { path: '$.steps[0].structuredInput[0].options', message: /expected 2\.\.3 items/ }],
  ['nine hint words', (u) => u.steps[4].task.hintWords.push('x'), { path: '$.steps[4].task.hintWords', message: /expected 0\.\.8 items/ }],
  ['a bank key with slot 9', (u) => { u.steps[0].microOutput.bankKey = 'a21-u07-mo9'; }, { path: '$.steps[0].microOutput.bankKey', rule: 'KEY-01', message: /does not match re\(BANK_KEY\)/ }],
  ['an unresolvable can-do', (u) => { u.spec.canDos[0] = 'cd.a2.gibt-es-nicht'; }, { path: '$.spec.canDos[0]', rule: 'REF-01', message: /ref\(cando\) "cd\.a2\.gibt-es-nicht" does not resolve/ }],
  ['a malformed can-do id', (u) => { u.spec.canDos[0] = 'mailbox-verstehen'; }, { path: '$.spec.canDos[0]', message: /is not a well-formed ref\(cando\)/ }],
  ['a typo in an item topic (ref inside a union with an enum)', (u) => { u.check.items[3].topic = 'lx.besezt'; }, { path: '$.check.items[3].topic', rule: 'REF-01', message: /ref\(lexicon\) "lx\.besezt" does not resolve/ }],
  ['a typo in a generator source (ref inside a union with str)', (u) => { u.steps[0].pool.generators[3].source[0] = 'lx.anrfu'; }, { path: '$.steps[0].pool.generators[3].source[0]', rule: 'REF-01', message: /does not resolve/ }],
  ['an earlier-unit item that does not exist', (u) => { u.check.earlier[0].ref = 'a2.1-u06-ls2-p99'; }, { path: '$.check.earlier[0].ref', rule: 'REF-01', message: /ref\(item\)/ }],
  ['a rule card that does not exist', (u) => { u.steps[1].ruleCard = 'rc.gibt-es-nicht'; }, { path: '$.steps[1].ruleCard', rule: 'REF-01', message: /ref\(rulecard\)/ }],
  ['an http source', (u) => { u.facts[0].sources[0] = 'http://dejure.org/gesetze/ArbZG/4.html'; }, { path: '$.facts[0].sources[0]', message: /expected url \(https/ }],
  ['an impossible date', (u) => { u.facts[0].factsCheckedOn = '2026-02-30'; }, { path: '$.facts[0].factsCheckedOn', message: /expected date/ }],
  ['an unknown step kind', (u) => { u.steps[3].kind = 'exam'; }, { path: '$.steps[3].kind', message: /kind must be one of situation\|text\|sprache/ }],
  ['six steps', (u) => u.steps.pop(), { path: '$.steps', message: /expected \[Step\]\{7\} \| \[Step\]\{8\}, got array of 6/ }],
  ['an empty German title', (u) => { u.title.de = ' '; }, { path: '$.title.de', message: /expected de \(non-empty German string\)/ }],
  ['a missing English explanation', (u) => delete u.steps[0].pool.items[0].explanation.en, { path: '$.steps[0].pool.items[0].explanation', message: /missing required field "en"/ }],
  ['a unit id from another level', (u) => { u.level = 'a2.2'; }, { path: '$.id', message: /does not belong to level "a2\.2"/ }],
  ['a wrong $schema', (u) => { u.$schema = 'course-v2/unit@2'; }, { path: '$', message: /unknown \$schema "course-v2\/unit@2"/ }],
  ['a step answer that is not a string', (u) => { u.steps[0].pool.items[2].answer = 7; }, { path: '$.steps[0].pool.items[2].answer', message: /expected str/ }],
];
for (const [name, mutate, want] of MUTATIONS) {
  test(`mutated fixture fails: ${name}`, () => expectError(mutate, want));
}

test('the notation accepts what it should: optional reviewerConfirmed, a perception GeneratorSpec, 8 steps', () => {
  const u = unit();
  u.steps[0].pool.items[0].reviewerConfirmed = [];
  assert.deepEqual(errorsOf(u), []);
  const v = unit();
  v.steps.splice(6, 0, { id: 'a2.1-u07-ls8', kind: 'check', endLine: 'Fertig.' });
  assert.equal(errorsOf(v).filter((e) => e.path === '$.steps').length, 0);
});

test('a draft unit may be spec-only; a unit in review may not', () => {
  const draft = unit();
  draft.status = 'draft';
  for (const k of ['start', 'steps', 'check', 'redemittel', 'story', 'fokus', 'facts']) delete draft[k];
  assert.deepEqual(errorsOf(draft), []);
  const review = unit();
  delete review.steps;
  assert.ok(errorsOf(review).some((e) => e.path === '$' && /missing required field "steps"/.test(e.message)));
  // a draft section that IS present is checked in full
  const partial = unit();
  partial.status = 'draft';
  delete partial.check;
  partial.steps[0].inputItems.pop();
  assert.ok(errorsOf(partial).some((e) => e.path === '$.steps[0].inputItems'));
});

test('registry mutations fail with the right message', () => {
  const course = structuredClone(EX.course.json);
  delete course.honestyLineDe;
  assert.ok(check(KINDS.course.schema, course).some((e) => /honestyLineDe.*\.1 courses/.test(e.message)));
  course.honestyLineDe = 'x';
  course.completion.unit.testOutThreshold = 0.7;
  assert.ok(check(KINDS.course.schema, course).some((e) => e.path === '$.completion.unit.testOutThreshold' && /expected 0\.8/.test(e.message)));

  const lane = structuredClone(EX.ga2Lane.json);
  delete lane.teile.h1.textWordsSource;
  assert.ok(check(KINDS.lane.schema, lane).some((e) => e.path === '$.teile.h1' && /textWordsSource/.test(e.message)));
  lane.teile.h1.textWordsSource = 'design';
  lane.teile.h1.id = 'ga2.h2';
  assert.ok(check(KINDS.lane.schema, lane).some((e) => /must be "ga2\.h1"/.test(e.message)));

  const lex = { $schema: 'course-v2/lexicon@1', level: 'a2.1', entries: structuredClone(EX.lexiconEntries.json) };
  lex.entries[0].wordId = 17;
  lex.entries[1].list_ref = 'C1';
  const lexErrors = check(KINDS.lexicon.schema, lex);
  assert.ok(lexErrors.some((e) => e.path === '$.entries[0].wordId' && /expected null/.test(e.message)));
  assert.ok(lexErrors.some((e) => e.path === '$.entries[1].list_ref' && /re\(LIST_REF\)/.test(e.message)));

  const cando = structuredClone(EX.cando.json);
  cando.items[0].id = 'cd.b1.mailbox-verstehen';
  assert.ok(check(KINDS.cando.schema, cando).some((e) => /not in band "a2"/.test(e.message)));

  assert.match(kindOf({ types: [] }, '/x/text-types.json').kind, /texttypes/);
  assert.match(kindOf({ members: {}, relations: [] }, '/x/casts/b1.json').kind, /casts/);
  assert.match(kindOf({ foo: 1 }, '/x/y.json').error, /missing \$schema/);
});

// ── KEY-01: BANK_KEY_RE ─────────────────────────────────────────────────────────────────
test('BANK_KEY_RE and the legacy pattern are character-identical to SCHEMA §2', () => {
  const m = EX.bankKeyJs.match(/export const BANK_KEY_RE =\s*(\/\^.*\$\/);/);
  assert.ok(m, 'BANK_KEY_RE not found in SCHEMA §2');
  assert.equal(BANK_KEY_RE.toString(), m[1]);
  const legacy = EX.bankKeyJs.match(/LEGACY_COURSE_TASK_KEY_RE = (\/\^.*\$\/);/);
  assert.equal(LEGACY_COURSE_TASK_KEY_RE.toString(), legacy[1]);
});

const PREFIXES = ['a11', 'a12', 'a21', 'a22', 'b11', 'b12', 'b21', 'b22'];
const SLOTS = [...Array.from({ length: 12 }, (_, i) => `u${String(i + 1).padStart(2, '0')}`), 'p1', 'p2', 'p3', 'ht', 'dx', 'ma', 'mb', 'mc'];
const SLOT_KINDS = ['w', 's', 'mo'];

test('KEY-01: BANK_KEY_RE accepts all 8 prefixes × every slot × every slot kind (± number, ± lane)', () => {
  let n = 0;
  for (const p of PREFIXES) {
    for (const slot of SLOTS) {
      for (const kind of SLOT_KINDS) {
        for (const nr of ['', '1', '2', '3', '4', '5', '6', '7', '8']) {
          for (const lane of ['', ...LANES]) {
            const key = `${p}-${slot}-${kind}${nr}${lane ? `-${lane}` : ''}`;
            assert.ok(BANK_KEY_RE.test(key), key);
            assert.equal(bankKeyScope(key), `${p}-`, key);
            n++;
          }
        }
      }
    }
  }
  assert.equal(n, 8 * 20 * 3 * 9 * 11);
  for (const ex of ['a21-u07-w', 'a21-u07-w-ta2', 'a21-u07-s', 'a21-u07-mo1', 'b12-p2-w-dtz', 'a22-ma-w1-ga2']) {
    assert.ok(BANK_KEY_RE.test(ex), ex);
  }
  assert.deepEqual(parseBankKey('a22-ma-w1-ga2'), { prefix: 'a22', slot: 'ma', kind: 'w', nr: 1, lane: 'ga2' });
});

test('KEY-01: BANK_KEY_RE rejects garbage; legacy live-course keys keep their own pattern', () => {
  const garbage = [
    '', 'a21', 'a21-u07', 'a21-u07-', 'a21-u07-w-', 'A21-u07-w', 'a21-U07-w', ' a21-u07-w', 'a21-u07-w ',
    'a13-u07-w', 'c11-u01-w', 'a2.1-u07-w', 'a21-u00-w', 'a21-u13-w', 'a21-u7-w', 'a21-u007-w',
    'a21-p0-w', 'a21-p4-w', 'a21-md-w', 'a21-m-w', 'a21-hx-w', 'a21-u07-x', 'a21-u07-ws', 'a21-u07-w0',
    'a21-u07-w9', 'a21-u07-mo10', 'a21-u07-w-xx', 'a21-u07-w-ga2-ta2', 'a21-u07-w_ga2', 'a21-u07-w-GA2',
    'a21-l03', 'a11-l03', 'a21-u07-w\n', 'a21u07w',
  ];
  for (const g of garbage) {
    assert.equal(BANK_KEY_RE.test(g), false, JSON.stringify(g));
    assert.equal(PATTERNS.BANK_KEY.test(g), false, JSON.stringify(g));
  }
  assert.ok(LEGACY_COURSE_TASK_KEY_RE.test('a11-l03'));
  assert.equal(bankKeyScope('a11-l03'), 'a11-');
  assert.equal(bankKeyScope('a12-l07'), 'a12-');
  assert.equal(bankKeyScope('formular-hotel-anmeldung'), null);
  assert.equal(bankKeyScope(undefined), null);
});

// ── the compiler ────────────────────────────────────────────────────────────────────────
function compileFixture(contentRoot = FIXTURES_ROOT, outDir = tmp('out')) {
  const result = compileLevel('a2.1', { contentRoot, outRoot: path.join(outDir, 'src'), banksRoot: path.join(outDir, 'banks') });
  return { result, outDir };
}
const readOut = (outDir, rel) => JSON.parse(fs.readFileSync(path.join(outDir, rel), 'utf8'));

test('compile is deterministic and idempotent', () => {
  const a = compileFixture();
  const b = compileFixture();
  assert.deepEqual(a.result.errors, []);
  const strip = (r, root) => r.outputs.map((o) => [path.relative(root, o.file), o.text]);
  assert.deepEqual(strip(a.result, a.outDir), strip(b.result, b.outDir));
  const first = writeOutputs(a.result);
  assert.deepEqual(first.map((f) => path.relative(a.outDir, f)).sort(), [
    'banks/a2.1.banks.json', 'src/a2.1/ids.ledger.json', 'src/a2.1/lines.json', 'src/a2.1/manifest.json', 'src/a2.1/rule-cards.json', 'src/a2.1/units/u07.json',
  ]);
  const again = compileFixture(FIXTURES_ROOT, a.outDir);
  assert.deepEqual(writeOutputs(again.result), [], 'a second compile changes nothing');
  assert.deepEqual(writeOutputs(again.result, { check: true }), []);
});

test('compiled pool item, syllabus row and review cards match SCHEMA §15.5', () => {
  const { result, outDir } = compileFixture();
  writeOutputs(result);
  const chunk = readOut(outDir, 'src/a2.1/units/u07.json');
  assert.deepEqual(chunk.poolItems.find((p) => p.id === 'a2.1-u07-ls1-p06'), EX.poolItem.json);
  const manifest = readOut(outDir, 'src/a2.1/manifest.json');
  const row = manifest.units.find((r) => r.unit === 'a2.1-u07');
  for (const [k, v] of Object.entries(EX.syllabusRow.json)) assert.deepEqual(row[k], v, `syllabus row field ${k}`);
  assert.equal(manifest.units.length, 12);
  assert.equal(manifest.units[0].chunk, null);

  const cards = chunk.reviewCards;
  assert.equal(cards.filter((c) => c.startsWith('word:')).length, 28);
  assert.deepEqual(cards.filter((c) => c.startsWith('pattern:')), ['pattern:g.reflexiv-akk:a2.1-u07']);
  assert.deepEqual(cards.filter((c) => c.startsWith('sentence:')), ['rm01', 'rm02', 'rm03', 'rm04', 'rm05'].map((r) => `sentence:a2.1-u07-${r}`));
  assert.equal(cards[0], 'word:lx.anruf');
  assert.equal(cards[27], 'word:lx.beschaeftigt');
  assert.equal(chunk.minutesPlanned.total, 150);
  assert.equal(chunk.contentHash, contentHash(EX.unit.json));
  assert.match(manifest.contentHash, /^sha256:[0-9a-f]{64}$/);
});

test('the audio line list matches SCHEMA §15.5 (voice from the cast bible, text from say, else de)', () => {
  const { result, outDir } = compileFixture();
  writeOutputs(result);
  const lines = readOut(outDir, 'src/a2.1/lines.json');
  for (const want of EX.audioLines.json) assert.deepEqual(lines.find((l) => l.id === want.id), want);
  assert.equal(lines.length, 39);
  assert.ok(lines.filter((l) => l.speaker.startsWith('cast.')).every((l) => l.voice && l.rate));
  const cards = readOut(outDir, 'src/a2.1/rule-cards.json');
  assert.deepEqual(cards.cards, [EX.ruleCard.json]);
});

test('each situation step fills its pool to 16 with compiler-assigned generated ids', () => {
  const { result, outDir } = compileFixture();
  writeOutputs(result);
  const chunk = readOut(outDir, 'src/a2.1/units/u07.json');
  for (const s of chunk.steps.filter((x) => x.kind === 'situation')) {
    const gen = s.pool.generators.flatMap((g) => g.ids);
    assert.equal(s.pool.items.length + gen.length, 16, s.id);
    gen.forEach((id) => assert.match(id, new RegExp(`^${s.id.replace(/\./g, '\\.')}-g\\d{2}$`)));
    assert.ok(gen.every((id) => PATTERNS.item.test(id)));
  }
  assert.deepEqual(chunk.steps[0].aussprache.perception.ids, ['a2.1-u07-ls1-g06', 'a2.1-u07-ls1-g07', 'a2.1-u07-ls1-g08']);
});

test('the unit chunk strips learner-invisible fields and adds line seconds', () => {
  const { result, outDir } = compileFixture();
  writeOutputs(result);
  const chunk = readOut(outDir, 'src/a2.1/units/u07.json');
  const text = JSON.stringify(chunk);
  for (const k of ['"origin"', '"acceptedWhy"', '"intentionalError"', '"reviewerConfirmed"', '"lehrwerk"', '"$schema"', '"reviewedIn"']) {
    assert.ok(!text.includes(k), `${k} leaked into the chunk`);
  }
  assert.equal(chunk.facts[0].notes, undefined);
  assert.equal(chunk.spec.source, undefined);
  assert.ok(chunk.check.lines.every((l) => typeof l.seconds === 'number' && l.seconds > 0));
  // cues and the model text stay in the chunk (learner-facing), and out of the grader bank
  assert.ok(chunk.steps[5].task.leitpunkte[0].cues.length > 0);
  assert.ok(chunk.steps[5].task.modelText);
});

test('the writing bank matches SCHEMA §15.5; the speaking bank holds the speaking task and spoken micro-outputs', () => {
  const { result, outDir } = compileFixture();
  writeOutputs(result);
  const banks = readOut(outDir, 'banks/a2.1.banks.json');
  assert.equal(banks.scope, 'a21-');
  const src = EX.writingBankJs.replace(/^\/\/.*$/gm, '').replace('export const WRITING_TASKS =', 'WRITING_TASKS =');
  const ctx = {};
  vm.runInNewContext(src, ctx);
  const expected = ctx.WRITING_TASKS;
  assert.deepEqual(Object.keys(banks.writing).sort(), Object.keys(expected).sort());
  for (const [key, want] of Object.entries(expected)) {
    const got = banks.writing[key];
    assert.match(got.contentHash, /^sha256:[0-9a-f]{64}$/);
    const { contentHash: _h, ...rest } = got;
    const { contentHash: _w, ...wantRest } = want;
    assert.deepEqual(rest, JSON.parse(JSON.stringify(wantRest)), key);
    assert.deepEqual(Object.keys(got), Object.keys(want), `${key} key order`);
    assert.equal(got.contentHash, contentHash(rest));
  }
  assert.deepEqual(Object.keys(banks.speaking), ['a21-u07-mo1', 'a21-u07-mo3', 'a21-u07-s']);
  assert.deepEqual(Object.keys(banks.micro), ['a21-u07-mo1', 'a21-u07-mo2', 'a21-u07-mo3']);
  assert.deepEqual(Object.values(banks.micro).map((m) => m.mode), ['spoken', 'written', 'spoken']);
  assert.deepEqual(banks.micro['a21-u07-mo2'], banks.writing['a21-u07-mo2']);
  assert.deepEqual(banks.micro['a21-u07-mo1'], banks.speaking['a21-u07-mo1']);
  const s = banks.speaking['a21-u07-s'];
  assert.equal(s.examKey, 'goethe_a2');
  assert.equal(s.mode, 'cards-ask');
  assert.equal(s.prepMinutes, 0);
  assert.equal(s.modelTurns, undefined, 'model turns are shown after the attempt, never grader input');
  for (const key of [...Object.keys(banks.writing), ...Object.keys(banks.speaking)]) assert.ok(BANK_KEY_RE.test(key), key);
});

test('the ids ledger tombstones a removed id and refuses its reuse (ID-01)', () => {
  const content = tmp('content');
  fs.cpSync(FIXTURES_ROOT, content, { recursive: true });
  const out = tmp('ledger');
  const first = compileFixture(content, out);
  writeOutputs(first.result);
  const ledger1 = readOut(out, 'src/a2.1/ids.ledger.json');
  assert.equal(ledger1.ids['a2.1-u07-ls1-p11'], 'item');
  assert.equal(ledger1.ids['a2.1-u07-ls1-g01'], 'item-generated');
  assert.equal(ledger1.ids['a21-u07-w'], 'bank');
  assert.deepEqual(ledger1.tombstones, {});

  const unitPath = path.join(content, 'a2.1-u07.json');
  const u = JSON.parse(fs.readFileSync(unitPath, 'utf8'));
  const removed = u.steps[0].pool.items.pop();
  fs.writeFileSync(unitPath, JSON.stringify(u, null, 2));
  const second = compileFixture(content, out);
  assert.deepEqual(second.result.errors, []);
  writeOutputs(second.result);
  const ledger2 = readOut(out, 'src/a2.1/ids.ledger.json');
  assert.equal(ledger2.ids[removed.id], undefined);
  assert.equal(ledger2.tombstones[removed.id].kind, 'item');

  u.steps[0].pool.items.push(removed);
  fs.writeFileSync(unitPath, JSON.stringify(u, null, 2));
  const third = compileFixture(content, out);
  assert.ok(third.result.errors.some((e) => /ID-01 id "a2\.1-u07-ls1-p11" was removed earlier/.test(e)), third.result.errors.join('\n'));
  assert.deepEqual(third.result.outputs, [], 'nothing is written on error');
});

test('compile refuses content that fails the schema check, and writes nothing', () => {
  const content = tmp('bad');
  fs.cpSync(FIXTURES_ROOT, content, { recursive: true });
  const unitPath = path.join(content, 'a2.1-u07.json');
  const u = JSON.parse(fs.readFileSync(unitPath, 'utf8'));
  u.steps[0].microOutput.bankKey = 'a22-u07-mo1'; // well-formed, but another course's prefix
  fs.writeFileSync(unitPath, JSON.stringify(u, null, 2));
  const { result } = compileFixture(content);
  assert.ok(result.errors.some((e) => /KEY-01 bank key "a22-u07-mo1" does not belong to course prefix "a21"/.test(e)), result.errors.join('\n'));
  assert.deepEqual(result.outputs, []);
});

test('canonical JSON sorts keys, so the content hash ignores key order', () => {
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] }), '{"a":[2,{"c":4,"d":3}],"b":1}');
  assert.equal(contentHash({ a: 1, b: 2 }), contentHash({ b: 2, a: 1 }));
});

// ── the CLIs ────────────────────────────────────────────────────────────────────────────
test('check.mjs: exit 0 on the fixture; exit 1 with file:path: message on a mutated copy', () => {
  const ok = node(['scripts/course-v2/check.mjs', 'content/course-v2/fixtures']);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /13 file\(s\), 0 error\(s\)/);

  const dir = tmp('cli');
  fs.cpSync(FIXTURES_ROOT, dir, { recursive: true });
  const unitPath = path.join(dir, 'a2.1-u07.json');
  const u = JSON.parse(fs.readFileSync(unitPath, 'utf8'));
  delete u.steps[0].endLine;
  u.spec.canDos[1] = 'cd.a2.gibt-es-nicht';
  fs.writeFileSync(unitPath, JSON.stringify(u, null, 2));
  const bad = node(['scripts/course-v2/check.mjs', dir]);
  assert.equal(bad.status, 1, bad.stdout + bad.stderr);
  const lines = bad.stdout.trim().split('\n');
  assert.ok(lines.some((l) => l === `${unitPath}:$.steps[0]: SCH-01 missing required field "endLine" (near a2.1-u07-ls1)`), bad.stdout);
  assert.ok(lines.some((l) => l.startsWith(`${unitPath}:$.spec.canDos[1]: REF-01 ref(cando) "cd.a2.gibt-es-nicht" does not resolve`)), bad.stdout);
});

test('compile.mjs: fixture compile via the CLI, --check clean on a second run, --fixture needs explicit outputs', () => {
  const dir = tmp('clic');
  const args = ['scripts/course-v2/compile.mjs', 'a2.1', '--fixture', '--out', path.join(dir, 'out'), '--banks-out', path.join(dir, 'banks')];
  const first = node(args);
  assert.equal(first.status, 0, first.stdout + first.stderr);
  const second = node([...args, '--check']);
  assert.equal(second.status, 0, second.stdout + second.stderr);
  assert.match(second.stdout, /0 out of date/);
  const refused = node(['scripts/course-v2/compile.mjs', 'a2.1', '--fixture']);
  assert.equal(refused.status, 2);
  const badLevel = node(['scripts/course-v2/compile.mjs', 'c1.1']);
  assert.equal(badLevel.status, 2);
});
