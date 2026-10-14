// Wave 1 of the A1.1 value plan (approved 2026-10-09; Codex learner-value review, research in
// the plan file): every session should end with something the learner can now do themselves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11, LEARNER_CAST } from '../src/data/curricula/a11.js';

test('every scored read-aloud line is the learner\'s own role, never the staff they talk to', () => {
  // L1 scored „Guten Tag und willkommen!" and „Gut. Wie geht es Ihnen?" — the receptionist's lines —
  // so a beginner finished the first Lektion without saying their own part (Codex review). L2, L4,
  // L9 and L10 did the same with the clerk, the seller, the waiter and the station staff.
  assert.deepEqual(LEARNER_CAST, ['Ana', 'Tim', 'Lena']);
  for (const l of CURRICULUM_A11.lektionen) {
    for (const i of l.sprechen.readAloud) {
      const line = l.dialog.lines[i];
      assert.ok(LEARNER_CAST.includes(line.speaker), `L${l.nr} read-aloud line ${i} is ${line.speaker}'s: „${line.de}"`);
    }
  }
});

test('L1 starts model-first: the learner sees and hears „Ich heiße Ana.", writes it with their own name, then again unaided', async () => {
  // Codex review: L1 asked an A0 beginner to answer before anything was taught. On the very first
  // encounter there is nothing to retrieve, so the model comes first; later Lektionen keep the
  // retrieval-first pretest.
  const l1 = CURRICULUM_A11.lektionen[0];
  assert.ok(l1.pretest.modelFirst, 'L1 is model-first');
  assert.ok(CURRICULUM_A11.lektionen.slice(1).every((l) => !l.pretest.modelFirst), 'only the first encounter');
  const { introductionHit } = await import('../src/lib/lesson/pretest.js');
  const openings = l1.pretest.modelFirst.openings;
  for (const ok of ['Ich heiße Sam.', 'ich heisse Maria', 'Guten Tag, ich heiße Ömer Yılmaz!', 'Ich bin Li.', 'Mein Name ist Ana.']) {
    assert.equal(introductionHit(ok, openings), true, ok);
  }
  for (const no of ['', 'Hallo', 'Ich heiße', 'Guten Tag', 'Sam']) assert.equal(introductionHit(no, openings), false, no);
  const { readFileSync } = await import('node:fs');
  const stage = readFileSync(new URL('../src/components/lesson/PretestStage.jsx', import.meta.url), 'utf8');
  assert.match(stage, /if \(pretest\.modelFirst\) return <ModelFirstPretest/);
  assert.match(stage, /trackFirstSentence\(/, 'the unaided attempt is the signal');
});
