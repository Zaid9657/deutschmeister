import test from 'node:test';
import assert from 'node:assert/strict';
import { personaConsistency, PERSONAS_A11 } from '../scripts/validate-curriculum.mjs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { LESEN_A11 } from '../src/data/curricula/a11.lesen.js';
import { LESEN_A12 } from '../src/data/curricula/a12.lesen.js';
import { WRITING_TASKS } from '../src/data/writingTasks.js';

const levels = [[CURRICULUM_A11, LESEN_A11], [CURRICULUM_A12, LESEN_A12]];

test('RULE 14 includes the served reading and checkpoint writing sources', () => {
  assert.equal(PERSONAS_A11.Ana.stadt, 'Bremen');
  assert.equal(PERSONAS_A11.Tim.herkunft, 'Österreich');
  for (const [curriculum] of levels) assert.deepEqual(personaConsistency(curriculum), [], curriculum.level);
});

test('every reading paper of both levels detects planted cast contradictions', () => {
  for (const [curriculum, source] of levels) {
    assert.equal(Object.values(source).flatMap((bank) => bank.papers).length, 16);
    for (const [cpId, bank] of Object.entries(source)) {
      for (let round = 0; round < bank.papers.length; round++) {
        for (const text of ['Ana wohnt in Berlin.', 'Tim kommt aus Polen.', 'Ana: Ich komme aus Polen.', 'Hallo Tim! Ich wohne in Berlin.\nAna']) {
          const readingBank = structuredClone(source);
          const unit = readingBank[cpId].papers[round][0];
          unit.text = text;
          const hits = personaConsistency(curriculum, { readingBank });
          assert.ok(hits.some((hit) => hit.where === `lesen ${unit.id}`), `${curriculum.level} round ${round}: ${text}`);
        }
      }
    }
  }
});

test('checkpoint task text, signed models and form fields are checked in both levels', () => {
  for (const [curriculum] of levels) {
    const source = WRITING_TASKS.filter((task) => task.course === curriculum.level && task.checkpoint);
    assert.equal(source.length, 4);
    for (const task of source) {
      for (const field of ['task', 'sample']) {
        const changed = { ...task, [field]: `${task[field]}. Ana kommt aus Polen.` };
        assert.ok(personaConsistency(curriculum, { writingTasks: [changed] }).some((hit) => hit.where.includes(task.taskKey) && hit.found === 'Polen'), `${task.taskKey} ${field}`);
      }
      const signed = { ...task, register: 'formell', sample: 'Ich komme aus Polen. Viele Grüße, Ana' };
      assert.ok(personaConsistency(curriculum, { writingTasks: [signed] }).some((hit) => hit.name === 'Ana' && hit.found === 'Polen'));
    }
    const form = { course: curriculum.level, checkpoint: 1, taskKey: 'planted-form', register: 'formular', task: 'Tim Berger kommt aus Österreich. Füllen Sie das Formular aus.', sample: 'Vorname: Tim / Familienname: Wolf / Land: Polen' };
    const hits = personaConsistency(curriculum, { writingTasks: [form] });
    assert.ok(hits.some((hit) => hit.fact === 'herkunft' && hit.found === 'Polen'));
    assert.ok(hits.some((hit) => hit.fact === 'nachname' && hit.found === 'Wolf'));
  }
});

test('fact attribution distinguishes recipients, relatives, false statements and travel destinations', () => {
  for (const [curriculum, source] of levels) {
    const readingBank = structuredClone(source);
    const unit = Object.values(readingBank)[0].papers[0][0];
    unit.text = 'Hallo Ana, Paul wohnt in Berlin. Ana wohnt in Bremen. Ihre Eltern wohnen in Berlin. Die Familie von Tim kommt aus Polen. Grüße, Lena';
    unit.statement = 'Ana wohnt in Berlin.';
    unit.question = 'Ana wohnt in Berlin?';
    unit.answer = 'Falsch';
    unit.explanationDe = 'Ana wohnt in Bremen.';
    assert.deepEqual(personaConsistency(curriculum, { readingBank }), []);
    unit.text = 'Ana wohnt in Bremen. Sie kommt aus Polen.';
    assert.ok(personaConsistency(curriculum, { readingBank }).some((hit) => hit.name === 'Ana' && hit.found === 'Polen'));
    unit.text = 'Ana wohnt in Bremen.';
    unit.explanationDe = 'Hier steht: „Ana wohnt in Berlin.“';
    assert.ok(personaConsistency(curriculum, { readingBank }).some((hit) => hit.where.endsWith('explanation') && hit.found === 'Berlin'));
    const trip = { course: curriculum.level, checkpoint: 3, taskKey: 'travel-control', register: 'formular', task: 'Tim Berger fliegt nach Spanien.', sample: 'Vorname: Tim / Familienname: Berger / Land: Spanien' };
    assert.deepEqual(personaConsistency(curriculum, { writingTasks: [trip] }), []);
    const form = { ...trip, task: 'Tim Berger kommt aus Österreich.', sample: 'Vorname: Tim / Familienname: Berger / Land: Österreich. Ana kommt aus Marokko.' };
    assert.deepEqual(personaConsistency(curriculum, { writingTasks: [form] }), [], 'a form does not assign another named person\'s country to its owner');
  }
});
