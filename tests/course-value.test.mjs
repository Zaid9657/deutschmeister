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

test('review never asks to type a sentence from a rule paragraph, picks the mode from the card\'s own history, and never ends a batch on „done" with cards still due', async () => {
  // Codex review: a pattern card's typed face showed the German rule text and accepted only the
  // notice's example sentences, so „Ich bin Lehrer." was wrong on the `sein` card; the mode came
  // from the card's position in today's batch; and 25 seeded cards ended at 12 with „Done for today".
  const { readFileSync } = await import('node:fs');
  const cardSrc = readFileSync(new URL('../src/components/lesson/ReviewCard.jsx', import.meta.url), 'utf8');
  const patternModes = cardSrc.match(/^\s*pattern: \[([^\]]*)\]/m)[1];
  assert.doesNotMatch(patternModes, /typed/, 'a pattern card is never typed until it has an authored prompt');
  assert.match(cardSrc, /^\s*word: \['flashcard', 'listening', 'typed'\]/m, 'word cards keep their three faces');
  const page = readFileSync(new URL('../src/pages/lesson/ReviewPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /modeForCard\(card\.kind, card\.step \?\? index\)/, 'the mode follows the card, not the batch');
  assert.match(page, /t\('review\.moreDue', lang, \{ n: stillDue \}\)/, 'the batch end says how many are still due');
  const player = readFileSync(new URL('../src/pages/lesson/LessonPlayerPage.jsx', import.meta.url), 'utf8');
  assert.match(player, /modeForCard\(warmupCard\.kind, warmupCard\.step \?\? itemIndex\)/);
  const home = readFileSync(new URL('../src/pages/CurriculumHomePage.jsx', import.meta.url), 'utf8');
  assert.match(home, /fetchReviewCounts\(user\.id, level\)/, 'the home knows what is due');
  assert.match(home, /reviewDue > 0 &&/, 'and leads with it');
});

test('a Lektion runs in three short parts — meet it, use it, say and write it — with a saved place to stop between them', async () => {
  // Codex review: one Lektion was a single 20–40-minute sitting whose own output came last. Learners
  // return more often for short sessions (frequency beats minutes — research in the plan file).
  const { sessionOf, sessionCompleted, SESSION_COUNT } = await import('../src/lib/lesson/sessions.js');
  const { buildLesson } = await import('../src/lib/lesson/buildLesson.js');
  const { readFileSync } = await import('node:fs');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  assert.equal(SESSION_COUNT, 3);
  for (const lektion of CURRICULUM_A11.lektionen) {
    const { stages } = buildLesson({ curriculum: CURRICULUM_A11, lektion, pool });
    const parts = stages.map(sessionOf);
    assert.ok(parts.every((p) => p >= 1 && p <= 3), `L${lektion.nr}: every stage belongs to a part (${stages.map((s) => s.kind)})`);
    assert.deepEqual([...new Set(parts)], [1, 2, 3], `L${lektion.nr}: three parts, in order`);
    const breaks = stages.slice(1).map((s, i) => sessionCompleted(stages[i], s)).filter(Boolean);
    assert.deepEqual(breaks, [1, 2], `L${lektion.nr}: one pause after part 1 and one after part 2`);
  }
  const player = readFileSync(new URL('../src/pages/lesson/LessonPlayerPage.jsx', import.meta.url), 'utf8');
  assert.match(player, /sessionCompleted\(stage, stages\[landing\]\)/, 'advance() pauses at a part boundary');
  assert.match(player, /<SessionBreak /);
});

test('help an A0 learner can read: L1 translations start open, every sound focus has English, writing feedback can be explained in English', async () => {
  // Codex review: L1 dialogue translations started hidden; the phonetics focus was German only; the
  // grader always answered in German, even to a learner using the English interface.
  const { buildLesson } = await import('../src/lib/lesson/buildLesson.js');
  const { readFileSync } = await import('node:fs');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  const dialogOf = (nr) => buildLesson({ curriculum: CURRICULUM_A11, lektion: CURRICULUM_A11.lektionen[nr - 1], pool }).stages.find((s) => s.kind === 'dialog');
  assert.equal(dialogOf(1).glossOpen, true, 'L1 opens with translations shown');
  assert.equal(dialogOf(2).glossOpen, false, 'later Lektionen start with German only; the toggle stays');
  const stage = readFileSync(new URL('../src/components/lesson/DialogStage.jsx', import.meta.url), 'utf8');
  assert.match(stage, /useState\(\(\) => stage\.glossOpen === true\)/);
  for (const l of CURRICULUM_A11.lektionen) assert.ok(l.phonetik.focusEn && l.phonetik.focusEn.length > 8, `L${l.nr} has an English sound focus`);
  const { buildWritingPrompt } = await import('../netlify/functions/evaluate-writing.mjs');
  const { writingTaskByKey } = await import('../src/data/writingTasks.js');
  const task = writingTaskByKey('goethe_a1', 'a11-l02');
  assert.match(buildWritingPrompt(task, 'Text', 'en'), /in short, simple English/);
  assert.match(buildWritingPrompt(task, 'Text'), /in kurzem, einfachem Deutsch/, 'German stays the default');
  assert.match(buildWritingPrompt(task, 'Text', 'fr'), /in kurzem, einfachem Deutsch/, 'only allow-listed languages');
  const gw = readFileSync(new URL('../src/components/lesson/GradedWriting.jsx', import.meta.url), 'utf8');
  assert.match(gw, /feedback_lang: lang/);
});
