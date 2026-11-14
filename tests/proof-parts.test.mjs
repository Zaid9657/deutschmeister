import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { answerProof, judgeProof, packProof, proofHint, proofTasks } from '../src/lib/lesson/proof.js';
import { hintContainsAnswer } from '../src/lib/lesson/guidedFeedback.js';
import { proofFindings } from '../scripts/validate-curriculum.mjs';
import { guidedDraftFindings } from '../scripts/check-guided-draft.mjs';
import { readFileSync } from 'node:fs';
import { proofCases } from './helpers/proofCases.mjs';
const lesson = CURRICULUM_A11.lektionen[0];
const tasks = proofTasks(lesson);

test('proof sentences pass and fail by class, including formal register and exact speaker address', () => {
  for (const [goal, value, expected] of proofCases) {
    assert.equal(judgeProof(tasks[goal], value).result, expected, `goal ${goal + 1}: ${value}`);
    const before = packProof({ goals: tasks.slice(0, goal).map(() => ({ tries: 1, passed: true, firstTry: true })) });
    const after = answerProof(tasks, before, { kind: 'typed', value });
    assert.equal(after.goals[goal].passed, expected !== RESULT.WRONG, value);
  }
});

test('every production part has bilingual guidance and forms; no hint leaks any part answer', () => {
  for (const curriculum of [CURRICULUM_A11, CURRICULUM_A12]) for (const l of curriculum.lektionen) {
    for (const task of proofTasks(l).filter((t) => t.type === 'production')) {
      assert.ok(task.parts.length);
      const accepted = task.parts.flatMap((p) => p.forms);
      for (const [index, part] of task.parts.entries()) {
        assert.ok(part.label.de.trim() && part.label.en.trim());
        assert.ok(part.forms.length && part.forms.every((f) => f.trim()));
        for (const hint of [proofHint(task, index), proofHint(task)]) {
          assert.equal(hintContainsAnswer(hint.de, { accepted }), false);
          assert.equal(hintContainsAnswer(hint.en, { accepted }), false);
        }
      }
    }
  }
  const missing = judgeProof(tasks[0], 'Guten Tag. Tschüss.');
  assert.equal(missing.part, 1);
  assert.match(proofHint(tasks[0], missing.part).de, /Der Abschied/);
  assert.match(proofHint(tasks[0], missing.part).en, /The goodbye/);
  assert.equal(judgeProof(tasks[3], 'Wie geht es dir? Gut, danke.').part, 0);
});

test('each part delegates typo and case decisions to the common checker; names keep separator folding', () => {
  for (const [value, part] of [['guten tag', tasks[0].parts[0]], ['Guten Taag', tasks[0].parts[0]], ['wie geht es ihnen', tasks[3].parts[0]]]) {
    const checked = checkAnswer(value, part.forms, checkOptionsFor({ ...part, accepted: part.forms }));
    const task = { ...tasks[0], parts: [part] };
    assert.equal(judgeProof(task, value).result, checked.result);
  }
  assert.equal(judgeProof({ ...tasks[0], parts: [{ ...tasks[0].parts[0], caseSensitive: true }] }, 'guten tag').result, RESULT.WRONG);
  for (const value of ['L-E-E.', 'L E E', 'LEE', 'L.E.E.', 'L/E/E']) {
    assert.equal(judgeProof(tasks[2], value, { surname: 'Lee' }).result, RESULT.CORRECT, value);
  }
});

test('address and courtesy allowances come only from this lesson, never from task variants or another lesson', () => {
  for (const task of tasks) assert.deepEqual(task.addresses, ['Frau Kaya']);
  const other = structuredClone(lesson);
  other.dialog.lines = other.dialog.lines.map((l) => ({ ...l, speaker: 'Herr Weber' }));
  const task = proofTasks(other)[0];
  assert.equal(judgeProof(task, 'Guten Tag, Herr Weber. Auf Wiedersehen.').result, RESULT.CORRECT);
  assert.equal(judgeProof(task, 'Guten Tag, Frau Kaya. Auf Wiedersehen.').result, RESULT.WRONG);
  other.wortfeld = other.wortfeld.filter((w) => w.de !== 'Danke');
  assert.equal(judgeProof(proofTasks(other)[0], 'Danke. Guten Tag. Auf Wiedersehen.').result, RESULT.WRONG);
});

test('RULE 35 and draft checking reject broken parts, leaking labels/hints and informal formal-task forms', () => {
  const draft = JSON.parse(readFileSync(new URL('../docs/course-factory/a11-guided/content/l01.json', import.meta.url), 'utf8'));
  for (const mutate of [
    (t) => { delete t.parts; },
    (t) => { t.parts = []; },
    (t) => { t.parts[0] = null; },
    (t) => { t.parts[0].label.en = ''; },
    (t) => { t.parts[0].label.de = ''; },
    (t) => { t.parts[0].forms = []; },
    (t) => { t.parts[0].forms = [null]; },
    (t) => { t.parts[0].forms.push('Quantencomputer.'); },
    (t) => { t.parts[0].forms.push('Hallo.'); },
    (t) => { t.parts[0].forms.push('Guten Tag. Auf Wiedersehen.'); },
    (t) => { t.parts[0].label.en = 'Auf Wiedersehen'; },
    (t) => { t.parts[0].hint = { de: 'Auf Wiedersehen', en: 'Try again' }; },
    (t) => { t.parts.reverse(); },
  ]) {
    const c = structuredClone(CURRICULUM_A11), d = structuredClone(draft);
    mutate(c.lektionen[0].proof.tasks[0]); mutate(d.proof.tasks[0]);
    assert.ok(proofFindings(c).length, String(mutate));
    assert.ok(guidedDraftFindings(1, d).length, String(mutate));
  }
  const c = structuredClone(CURRICULUM_A11);
  c.lektionen[0].proof.tasks[3].parts[1].forms.push('Wie geht es dir?');
  assert.ok(proofFindings(c).some((f) => /formal/.test(f)));
});
