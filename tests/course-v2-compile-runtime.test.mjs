// scripts/course-v2/lib/compiler.mjs — what the compiler carries for the course-v2 runtime
// (2026-09-28, the A1.1 unit reviews and the SCHEMA amendments of that day):
//
//   1. a speaking Teil the unit's Prüfungsfokus shortens ('reduced' | 'mini') carries `length`
//      into the bank, so the grader scores only what the shortened Teil elicits (appliesIf 'full',
//      a1.1-u01 r1–r3 F01); a full Teil carries none;
//   2. the manifest's can-do texts are the registry's learner line `learnerDe`, else `de`
//      (StartView „Lernziele", CheckView „Das kann ich"; a1.1-u06 r2/r3 F01, u11 r3 F02);
//   3. every plural of a noun with `pluralVariants` is accepted where a typed item's key types
//      one (SCHEMA §6: „Balkons" beside „Balkone");
//   4. a WritingTask's `textType` reaches the writing bank with its registry label, so the grader
//      names the genre (SCHEMA §8, 2026-09-28).
//
// Runs on a temp copy of the SCHEMA §15 fixture tree, edited in memory; nothing is written to the repo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileLevel } from '../scripts/course-v2/lib/compiler.mjs';
import { buildWritingUserPrompt } from '../netlify/functions/_shared/rubrics/grade.mjs';
import { FIXTURES_ROOT } from '../scripts/course-v2/lib/tree.mjs';

function compileEdited(edit) {
  const tmp = mkdtempSync(join(tmpdir(), 'cv2-rt-'));
  try {
    const root = join(tmp, 'content');
    cpSync(FIXTURES_ROOT, root, { recursive: true });
    const rw = (rel, fn) => {
      const file = join(root, rel);
      const doc = JSON.parse(readFileSync(file, 'utf8'));
      fn(doc);
      writeFileSync(file, JSON.stringify(doc, null, 2));
    };
    edit(rw);
    const r = compileLevel('a2.1', { contentRoot: root, outRoot: join(tmp, 'out'), banksRoot: join(tmp, 'banks') });
    assert.deepEqual(r.errors, [], 'the edited fixture compiles');
    const file = (end) => JSON.parse(r.outputs.find((o) => o.file.endsWith(end)).text);
    return { banks: file('a2.1.banks.json'), unit: file('u07.json'), manifest: file('manifest.json') };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

test('a speaking Teil the Prüfungsfokus shortens carries its length into the bank; a full Teil none', () => {
  const plain = compileEdited(() => {});
  assert.equal('length' in plain.banks.speaking['a21-u07-s'], false, 'full: no length');
  const reduced = compileEdited((rw) => rw('a2.1-u07.json', (u) => {
    const pf = u.spec.lanes.pruefungsfokus.find((p) => p.slot === 'sprechen');
    pf.length = 'reduced';
  }));
  assert.equal(reduced.banks.speaking['a21-u07-s'].length, 'reduced');
  assert.equal(reduced.banks.speaking['a21-u07-s'].profile, 'ga2-sp1', 'the part keeps its own profile');
});

test('the manifest shows a can-do\'s learner line (learnerDe) where the registry has one, else its descriptor', () => {
  const out = compileEdited((rw) => rw('registries/cando/a2.json', (c) => {
    c.items.find((i) => i.id === 'cd.a2.mailbox-verstehen').learnerDe = 'eine Nachricht auf der Mailbox verstehen: Wer ruft an? Warum?';
  }));
  const row = out.manifest.units.find((r) => r.unit === 'a2.1-u07');
  const i = row.canDoIds.indexOf('cd.a2.mailbox-verstehen');
  assert.equal(row.canDos[i], 'eine Nachricht auf der Mailbox verstehen: Wer ruft an? Warum?');
  const j = row.canDoIds.indexOf('cd.a2.rueckruf-weitergeben');
  assert.match(row.canDos[j], /^Ich kann /, 'no learner line: the descriptor wording');
});

test('every plural of a noun with pluralVariants is accepted where a typed key types one (SCHEMA §6)', () => {
  const out = compileEdited((rw) => {
    rw('registries/a2.1/lexicon.json', (lex) => { lex.entries.find((e) => e.id === 'lx.anruf').pluralVariants = ['Anrufs']; });
    rw('a2.1-u07.json', (u) => {
      const it = u.steps[0].pool.items.find((x) => x.id === 'a2.1-u07-ls1-p01');
      it.answer = 'Anrufe';
      it.accepted = ['Anrufe', 'die Anrufe'];
    });
  });
  const inChunk = out.unit.steps[0].pool.items.find((x) => x.id === 'a2.1-u07-ls1-p01');
  assert.deepEqual(inChunk.accepted, ['Anrufe', 'die Anrufe', 'Anrufs', 'die Anrufs']);
  const inPool = out.unit.poolItems.find((x) => x.id === 'a2.1-u07-ls1-p01');
  assert.deepEqual(inPool.accepted, inChunk.accepted, 'the pool shape carries them too');
  const tiles = out.unit.steps[0].pool.items.find((x) => x.type === 'sentence_building');
  assert.ok(tiles.accepted.every((a) => !/Anrufs/.test(a)), 'a tile item is never widened');
});

test('a WritingTask\'s text type reaches the writing bank, and the grader names the genre', () => {
  const plain = compileEdited(() => {});
  assert.equal('textType' in plain.banks.writing['a21-u07-w'], false, 'no text type: nothing carried');
  const typed = compileEdited((rw) => rw('a2.1-u07.json', (u) => {
    const step = u.steps.find((st) => st.kind === 'schreiben');
    step.task.textType = 'tt.email-halbformell';
  }));
  assert.equal(typed.banks.writing['a21-u07-w'].textType, 'tt.email-halbformell');
  const prompt = buildWritingUserPrompt({ task: { ...typed.banks.writing['a21-u07-w'], textTypeLabel: 'Beitrag in sozialen Medien' }, text: 'Hallo ihr!', attemptNr: 1 });
  assert.match(prompt, /^AUFGABE \(Textsorte: Beitrag in sozialen Medien, /);
});
