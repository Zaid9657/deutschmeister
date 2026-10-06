// What the lesson's "first try" figure counts, and what a matching exercise
// records — the two scoring defects of the 2026-10 review (findings A and B).
//
// B: 11/12 on the first pass showed as 11/13 = 85 % after one revealed retry,
// because requeueFor() hands out a NEW item id and the figure de-duplicated by
// id alone. A: a wrong pair in the matching exercise was recorded as
// `{ correct: true, result: 'typo' }` and shown as "Almost — just a typo".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { practiceScore, firstAttemptAccuracy, isFirstPass, masteryStatus, betterRun, accuracyPercent } from '../src/lib/lesson/mastery.js';
import { matchOutcome, RESULT } from '../src/lib/lesson/check.js';
import { requeueFor, REQUEUE_CAP } from '../src/lib/lesson/requeue.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const POOL = JSON.parse(read('src/data/lessonPools/a11.json'));

// Twelve first-pass answers the way the player logs them: 7 practice, 3 derived, 2 dictation; one wrong.
const FIRST_PASS = [
  ...Array.from({ length: 7 }, (_, i) => ({ itemId: `p${i}`, stage: 'practice', pass: 'first', correct: i !== 3 })),
  ...['match', 'word_order', 'listen_select'].map((t) => ({ itemId: `derived-x-${t}-1`, stage: 'derived', pass: 'first', correct: true })),
  { itemId: 'dictation-2', stage: 'dictation', pass: 'first', correct: true },
  { itemId: 'dictation-5', stage: 'dictation', pass: 'first', correct: true },
];

test('B: 11/12 stays 11/12 whatever the retry does — correct, wrong or revealed', () => {
  assert.deepEqual(practiceScore(FIRST_PASS), { correct: 11, total: 12, accuracy: 11 / 12 });
  assert.equal(accuracyPercent(practiceScore(FIRST_PASS).accuracy), 92);
  const variant = { itemId: 'a-different-pool-id', stage: 'requeue', pass: 'retry' };
  for (const retry of [{ correct: true }, { correct: false }, { correct: false, revealed: true }]) {
    const s = practiceScore([...FIRST_PASS, { ...variant, ...retry }]);
    assert.equal(s.total, 12, `retry ${JSON.stringify(retry)} must not join the denominator`);
    assert.equal(s.correct, 11);
  }
});

test('B: a repeated answer to the same item (reload, double submit) is counted once — the first one', () => {
  const dup = [...FIRST_PASS, { itemId: 'p3', stage: 'practice', pass: 'first', correct: true }, { itemId: 'p0', stage: 'practice', pass: 'first', correct: false }];
  assert.deepEqual(practiceScore(dup), practiceScore(FIRST_PASS));
});

test('B: warm-up, writing, speaking and retries never touch the figure', () => {
  for (const stage of ['warmup', 'writing', 'readaloud', 'requeue', 'pretest']) {
    assert.equal(isFirstPass({ itemId: 'x', stage, correct: false }), false, stage);
  }
  const noise = [
    { itemId: 'schreiben-l1', stage: 'writing', pass: 'first', correct: false },
    { itemId: 'card-1', stage: 'warmup', pass: 'first', correct: false },
  ];
  assert.equal(practiceScore([...FIRST_PASS, ...noise]).total, 12);
});

test('B: attempts logged before stages were tagged still read as first-pass practice', () => {
  // A resumed v1 snapshot: `{ itemId, correct }` and `stage: 'requeue'` on retries.
  const legacy = [
    { itemId: 'a', correct: false },
    { itemId: 'b', correct: true },
    { itemId: 'c', stage: 'practice', correct: true },
    { itemId: 'v', stage: 'requeue', correct: true },
  ];
  assert.deepEqual(practiceScore(legacy), { correct: 2, total: 3, accuracy: 2 / 3 });
  assert.equal(firstAttemptAccuracy([]), 0);
});

test('Gold is the first-pass practice figure at >= 80 %, and a weaker repeat run never takes it away', () => {
  assert.equal(masteryStatus(11 / 12), 'gold');
  assert.equal(masteryStatus(0.79), 'complete');
  const gold = { accuracy: 0.92, status: 'gold' };
  const weaker = { accuracy: 0.6, status: 'complete' };
  assert.equal(betterRun(gold, weaker), gold);
  assert.equal(betterRun(weaker, gold), gold);
  assert.equal(betterRun(null, weaker), weaker);
  assert.equal(betterRun(gold, { accuracy: 0.92, status: 'gold' }), gold, 'a tie keeps the stored run');
});

test('A: a match with a wrong pair is complete but NOT first-try correct, and never a typo', () => {
  const clean = matchOutcome([]);
  assert.deepEqual(clean, { result: RESULT.CORRECT, correct: true, errorTag: null, confused: [] });
  const confused = [{ de: 'Hallo', en: 'hello' }];
  const fixed = matchOutcome(confused);
  assert.equal(fixed.result, RESULT.CORRECTED);
  assert.notEqual(fixed.result, RESULT.TYPO);
  assert.equal(fixed.correct, false);
  assert.equal(fixed.errorTag, 'Wortschatz');
  assert.deepEqual(fixed.confused, confused);
  // and the figure sees it as a first-pass miss
  const s = practiceScore([{ itemId: 'derived-l1-match-1', stage: 'derived', pass: 'first', correct: fixed.correct }]);
  assert.deepEqual([s.correct, s.total], [0, 1]);
});

test('A: MatchItem records through matchOutcome, once, and names tiles by their word (no pair numbers)', () => {
  const src = read('src/components/lesson/MatchItem.jsx');
  assert.match(src, /matchOutcome\(/);
  assert.doesNotMatch(src, /RESULT\.TYPO/, 'a wrong pair is not a typo');
  assert.doesNotMatch(src, /\{\s*n:\s*pairIndex/, 'an accessible name numbered by pair gives the answer away');
  assert.doesNotMatch(src, /aria-label=\{t\('match\.(german|english)Label'/);
  assert.match(src, /aria-live="polite"/);
  assert.equal((src.match(/onResult\(/g) || []).length, 1, 'one result per exercise');
  const strings = read('src/lib/lesson/strings.js');
  assert.doesNotMatch(strings, /match\.(german|english)Label/);
  assert.equal((strings.match(/'feedback\.corrected':/g) || []).length, 2, 'en + de');
});

test('retries come back as the same kind of exercise — a vocabulary miss is not requeued as grammar', () => {
  const match = { id: 'derived-l1-match-1', type: 'match', topic: 'personal-pronouns', pairs: [
    { de: 'Hallo', en: 'hello' }, { de: 'tschüs', en: 'bye' }, { de: 'heißen', en: 'to be called' }, { de: 'woher', en: 'where from' }, { de: 'Name', en: 'name' },
  ], confused: [{ de: 'woher', en: 'where from' }] };
  const dictation = { id: 'dictation-3', type: 'dictation', stage: 'dictation', topic: 'hoeren', lineIndex: 3, answer: 'Ich heiße Tim.' };
  const writing = { id: 'schreiben-l1', stage: 'writing' };
  const out = requeueFor([match, dictation, writing], POOL, []);
  assert.equal(out.length, 2, 'writing is never requeued');
  const [m, d] = out;
  assert.equal(m.type, 'match');
  assert.equal(m.id, 'derived-l1-match-1~retry');
  assert.equal(m.pairs[0].de, 'woher', 'the confused pair comes first');
  assert.equal(m.pairs.length, 3, 'topped up so a choice is still a choice');
  assert.equal(d.type, 'dictation');
  assert.equal(d.lineIndex, 3);
  assert.equal(d.answer, 'Ich heiße Tim.');
  assert.ok(out.length <= REQUEUE_CAP);
});

test('the player logs the stage it is IN and renders a retry by its exercise type', () => {
  const src = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(src, /pass: stageKind === 'requeue' \? 'retry' : 'first'/);
  assert.match(src, /practiceScore\(attempts\)/);
  assert.match(src, /item\.type === 'dictation'/);
  assert.doesNotMatch(src, /onResult=\{recordResult\}/, 'every site passes its stage kind');
});

// --- C: what the recap says about each skill --------------------------------
import { speakingSummary, writingSummary, listeningSummary, skillLines } from '../src/lib/lesson/skillStatus.js';

test('C: speaking is skipped, self-confirmed or recognised — never a pronunciation grade', () => {
  assert.deepEqual(speakingSummary(2, {}), { state: 'skipped', lines: 2 });
  assert.deepEqual(speakingSummary(2, { 5: { pct: null, usedMic: false } }), { state: 'self-confirmed', lines: 2 });
  const rec = speakingSummary(2, { 5: { pct: 0.5, usedMic: true }, 6: { pct: 1, usedMic: true } });
  assert.equal(rec.state, 'recognised');
  assert.equal(rec.pct, 0.75);
  const en = read('src/lib/lesson/strings.js');
  assert.match(en, /'recap\.skill\.speaking\.recognised': '[^']*not a pronunciation grade/);
  assert.match(en, /'recap\.skill\.speaking\.recognised': '[^']*keine Aussprachenote/);
});

test('C: writing the checklist looked at is "self-checked", not assessed — and never a fail', () => {
  assert.deepEqual(writingSummary({ scored: true, pct: 0.7 }), { state: 'assessed', pct: 0.7 });
  assert.deepEqual(writingSummary({ scored: false, pct: null, usedFallback: true }), { state: 'self-checked', limitReached: false });
  assert.deepEqual(writingSummary(null), { state: 'skipped' });
});

test('C: a dictation read as text is not listening evidence', () => {
  const a = [
    { itemId: 'dictation-1', stage: 'dictation', pass: 'first', correct: true },
    { itemId: 'dictation-2', stage: 'dictation', pass: 'first', correct: true, listened: false },
    { itemId: 'dictation-2', stage: 'requeue', pass: 'retry', correct: true },
  ];
  assert.deepEqual(listeningSummary(a), { state: 'partly-read', heard: 1, read: 1 });
  assert.equal(listeningSummary([]).state, 'none');
});

test('C: the recap lists practice, listening, speaking and writing on their own lines; Gold is labelled a practice achievement', () => {
  const lines = skillLines({ score: { correct: 11, total: 12 }, attempts: [], skills: {} });
  assert.deepEqual(lines.map((l) => [l.skill, l.state]), [['practice', 'scored'], ['listening', 'none'], ['speaking', 'skipped'], ['writing', 'skipped']]);
  const strings = read('src/lib/lesson/strings.js');
  assert.match(strings, /'recap\.mastery\.gold': 'Practice gold'/);
  assert.match(strings, /'recap\.mastery\.gold': 'Übungs-Gold'/);
  const recap = read('src/components/lesson/RecapStage.jsx');
  assert.match(recap, /recap\.skills\.title/);
  for (const stage of ['SpeakingStage', 'WritingStage']) {
    assert.match(read(`src/components/lesson/${stage}.jsx`), /onReport\(/, `${stage} reports what it measured`);
  }
});
