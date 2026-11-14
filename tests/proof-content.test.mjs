import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { proofFindings, guidedReadVocabulary, validateCurriculum } from '../scripts/validate-curriculum.mjs';
import { guidedDraftFindings } from '../scripts/check-guided-draft.mjs';
import { spawnWithFiles } from './helpers/spawnWithFiles.mjs';
const clone = () => structuredClone(CURRICULUM_A11);
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const mutate = (fn) => { const c = clone(); fn(c.lektionen[0]); return proofFindings(c); };

test('model proof and draft agree; absent proof preserves L2–12 and A1.2', () => {
  assert.deepEqual(proofFindings(CURRICULUM_A11), []);
  assert.deepEqual(proofFindings(CURRICULUM_A12), []);
  const draft = JSON.parse(read('docs/course-factory/a11-guided/content/l01.json'));
  assert.deepEqual(draft.proof, CURRICULUM_A11.lektionen[0].proof);
  assert.deepEqual(guidedDraftFindings(1, draft), []);
  delete draft.proof;
  assert.deepEqual(guidedDraftFindings(1, draft), []);
  const result = spawnWithFiles(process.execPath, ['scripts/check-guided-draft.mjs', ...Array.from({ length: 12 }, (_, i) => String(i + 1))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.match(/✓ L\d+:/g)?.length, 12);
});

test('RULE 35 rejects shape, goal count/order, language, register and unresolved models by class', () => {
  for (const [fn, expected] of [
    [(l) => { l.proof = null; }, /tasks array/],
    [(l) => { l.proof.tasks = []; }, /tasks array/],
    [(l) => l.proof.tasks.pop(), /one task per can-do/],
    [(l) => { l.proof.tasks[1].canDo = 0; }, /can-do order/],
    [(l) => { l.proof.tasks[0] = null; }, /object/],
    [(l) => { l.proof.tasks[0].type = 'self-confirm'; }, /type/],
    [(l) => { l.proof.tasks[0].promptEn = ''; }, /bilingual prompts/],
    [(l) => { l.proof.tasks[0].promptDe = 'Was sagst du?'; }, /Sie/],
    [(l) => { l.proof.tasks[0].parts[0].forms = []; }, /forms/],
    [(l) => { l.proof.tasks[0].reteach.indices = [999]; }, /pointer/],
    [(l) => { l.proof.tasks[0].reteach.indices = [0, 0]; }, /distinct/],
    [(l) => { l.proof.tasks[2].ownName = 'nickname'; }, /ownName/],
    [(l) => { l.proof.tasks[2].answer = 'Hallo'; }, /spelled/],
    [(l) => { l.proof.tasks[1].openings = ['Whatever']; }, /introduction/],
  ]) assert.ok(mutate(fn).some((f) => expected.test(f)), String(expected));
  const c = clone(); c.lektionen[0].proof.tasks[0].canDo = 9;
  assert.ok(validateCurriculum(c).some((f) => /^RULE 35:/.test(f)), 'main validator invokes this rule');
});

test('choice tasks have exactly one checked right answer, without typo credit for distractors', () => {
  const c = clone();
  const task = c.lektionen[0].proof.tasks[0];
  Object.assign(task, { type: 'multiple_choice', answer: 'Guten Tag', accepted: ['Guten Tag'], options: ['Hallo', 'Guten Tag', 'Tschüss'] });
  assert.deepEqual(proofFindings(c), []);
  task.accepted.push('Hallo');
  assert.ok(proofFindings(c).some((f) => /exactly one right/.test(f)));
  task.accepted = ['Guten Tag']; task.options = ['Guten Tag', 'Guten Tag'];
  assert.ok(proofFindings(c).some((f) => /distinct options/.test(f)));
});

test('pointers resolve dialogue, Wortfeld and notice; all displayed/accepted German binds the read lexicon', () => {
  assert.deepEqual(mutate((l) => { l.proof.tasks[0].reteach = { kind: 'wortfeld', index: 2 }; }), []);
  // Notice is a valid pointer; its additional metalanguage still has to satisfy the taught-word rule.
  assert.ok(!mutate((l) => { l.proof.tasks[0].reteach = { kind: 'notice' }; }).some((f) => /pointer/.test(f)));
  for (const field of ['promptDe', 'answer', 'forms', 'options']) {
    assert.ok(mutate((l) => {
      const t = l.proof.tasks[0];
      if (field === 'forms') t.parts[0].forms.push('Quantencomputer');
      else if (field === 'options') t[field] = [...(t[field] || []), 'Quantencomputer'];
      else t[field] += ' Quantencomputer';
    }).some((f) => /untaught word "Quantencomputer"/.test(f)), field);
  }
  const c = clone(); c.lektionen[0].guided.read.text += '\nQuantencomputer'; c.lektionen[0].proof.tasks[0].promptDe += ' Quantencomputer';
  assert.ok(guidedReadVocabulary(c).some((f) => /Quantencomputer/.test(f)));
  assert.ok(proofFindings(c).some((f) => /Quantencomputer/.test(f)));
});

test('hints cannot contain any accepted form in either language; draft checker runs the identical rule', () => {
  const draft = JSON.parse(read('docs/course-factory/a11-guided/content/l01.json'));
  for (const lang of ['de', 'en']) {
    const d = structuredClone(draft);
    d.proof.tasks[0].hint = { de: 'Noch einmal.', en: 'Try again.' };
    d.proof.tasks[0].hint[lang] = `Try: ${d.proof.tasks[0].answer}`;
    assert.ok(guidedDraftFindings(1, d).some((f) => /hint.*accepted answer/.test(f)));
  }
  draft.proof.tasks[0].reteach = { kind: 'dialog', indices: [-1] };
  assert.ok(guidedDraftFindings(1, draft).some((f) => /pointer/.test(f)));
});

test('RULE 35 validates spelled-name source and keeps the draft task form in step', () => {
  const mutations = [
    (t) => { delete t.listenFrom; },
    (t) => { t.listenFrom.index = 1; },
    (t) => { t.listenFrom.index = 999; },
    (t) => { t.type = 'production'; },
    (t) => { t.listenSpelling = false; },
    (t) => { t.accepted = ['Noor']; },
    (t) => { t.answer = 'N-O-O-R.'; t.parts[0].forms = ['N-O-O-R.']; },
  ];
  for (const mutate of mutations) {
    const c = structuredClone(CURRICULUM_A11); mutate(c.lektionen[0].proof.tasks[2]);
    assert.ok(proofFindings(c).length, String(mutate));
  }
});
