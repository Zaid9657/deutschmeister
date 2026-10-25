import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculatePlacement } from '../src/components/LevelTest/placementResult.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const questions = ['A1', 'A2', 'B1', 'B2'].flatMap(level => Array.from({ length: 10 }, (_, index) => ({
  id: `${level}-${index}`,
  level,
  sublevel: `${level}.${index < 5 ? 1 : 2}`,
  type: ['grammar', 'vocabulary', 'reading'][index % 3],
  topicDisplayName: `${level} topic`,
  relatedTopicUrl: `/grammar/${level.toLowerCase()}.1/topic/`,
})));
const correctAnswer = question => ({ questionId: question.id, isCorrect: true });

test('skipping 39 written placement questions cannot turn one B2.2 answer into B2.2', () => {
  const result = calculatePlacement({ answers: [correctAnswer(questions.at(-1))], questions });
  assert.equal(result.sublevel, 'A1.1');
  assert.equal(result.writtenPercentage, 3);
  assert.equal(result.totalCorrect, 1);
  assert.equal(result.totalQuestions, 40);
  assert.equal(result.typeScores.grammar.correct, 1);
  assert.equal(result.typeScores.grammar.total, 16);
  assert.equal(result.weakTopics.reduce((count, topic) => count + topic.wrong, 0), 39);
  assert.equal(calculatePlacement({ answers: [], questions }).writtenPercentage, 0);
});

// C-162: the band loop had no stop, so each later band that reached 60%
// overwrote the result even after a lower band failed.
test('a band counts only when every band below it passed', () => {
  const correct = (ids) => questions.filter((q) => ids(q)).map(correctAnswer);
  const sixB2 = correct((q) => q.level === 'B2' && Number(q.id.split('-')[1]) < 6);
  const onlyB2 = calculatePlacement({ answers: sixB2, questions });
  assert.equal(onlyB2.sublevel, 'A1.1', '6 B2 answers + 34 skips');
  assert.equal(onlyB2.writtenPercentage, 15);

  const threeEach = correct((q) => q.level !== 'B2' && Number(q.id.split('-')[1]) < 3);
  const gappy = calculatePlacement({ answers: [...threeEach, ...sixB2], questions });
  assert.equal(gappy.sublevel, 'A1.1', 'A1, A2 and B1 at 3/10 with B2 at 6/10');

  const a2Gap = correct((q) => q.level === 'A1' || q.level === 'B1' || q.level === 'B2');
  assert.equal(calculatePlacement({ answers: a2Gap, questions }).sublevel, 'A1.2', 'a failed A2 band stops the climb at A1');

  // An honest B1 profile still reaches B1: every band up to B1 passed, B2 failed.
  const b1 = correct((q) => q.level !== 'B2');
  assert.equal(calculatePlacement({ answers: b1, questions }).sublevel, 'B1.2');
  const b1Lower = correct((q) => q.level !== 'B2' && !(q.level === 'B1' && q.sublevel === 'B1.2' && q.id !== 'B1-5'));
  assert.equal(calculatePlacement({ answers: b1Lower, questions }).sublevel, 'B1.1', 'B1 passed at 6/10, B1.2 below 70%');
});

test('placement uses all selected questions in level and skill denominators', () => {
  const result = calculatePlacement({ answers: questions.map(correctAnswer), questions });
  assert.equal(result.sublevel, 'B2.2');
  assert.equal(result.writtenPercentage, 100);
  assert.deepEqual(result.weakTopics, []);
  assert.equal(result.typeScores.grammar.correct, result.typeScores.grammar.total);
  assert.equal(calculatePlacement({ answers: [], questions: [] }).sublevel, 'A1.1');
});

test('a valid zero speaking score demotes placement just like every other score below 50', () => {
  const answers = questions.map(correctAnswer);
  for (const speakingScore of [{ total_score: 0 }, { score: 0 }, { score: 0, total_score: 80 }, { score: null, total_score: 0 }, { score: NaN, total_score: 0 }, { total_score: 1 }, { total_score: 49 }]) {
    const result = calculatePlacement({ answers, questions, speakingScore });
    assert.equal(result.sublevel, 'B2.1', JSON.stringify(speakingScore));
    assert.deepEqual(result.demotions, ['speaking']);
  }
  assert.equal(calculatePlacement({ answers, questions, speakingScore: { total_score: 0 } }).speakingPercentage, 0);
  assert.equal(calculatePlacement({ answers, questions, speakingScore: { total_score: 50 } }).sublevel, 'B2.2');
  const both = calculatePlacement({ answers, questions, listeningScore: 0, speakingScore: { total_score: 0 } });
  assert.equal(both.sublevel, 'B1.2');
  assert.deepEqual(both.demotions, ['listening', 'speaking']);
});

test('missing or invalid speaking evaluations do not count as a zero score', () => {
  const answers = questions.map(correctAnswer);
  for (const speakingScore of [undefined, null, {}, { total_score: null }, { total_score: '0' }, { total_score: NaN }, { total_score: -1 }, { total_score: 101 }]) {
    const result = calculatePlacement({ answers, questions, speakingScore });
    assert.equal(result.sublevel, 'B2.2');
    assert.equal(result.speakingPercentage, null);
    assert.deepEqual(result.demotions, []);
  }
  const result = read('src/components/LevelTest/LevelTestResults.jsx');
  assert.match(result, /completed: speakingPercentage != null/);
  assert.match(result, /\{speakingPercentage != null && \(/);
  assert.match(result, /\{speakingPercentage != null && speakingPercentage < 70 && \(/);
  assert.doesNotMatch(result, /\{speakingScore &&/);
});

test('displayed and persisted placement share the adjusted result across a band boundary', async () => {
  // 8/10 in B2 qualifies for B2.1, but not .2; weak listening moves it to B1.2.
  const answers = questions.filter(question => question.id !== 'B2-8' && question.id !== 'B2-9').map(correctAnswer);
  const placement = calculatePlacement({ answers, questions, listeningScore: 20 });
  assert.equal(placement.writtenSublevel, 'B2.1');
  assert.equal(placement.sublevel, 'B1.2');
  assert.deepEqual(placement.demotions, ['listening']);

  const page = read('src/pages/LevelTest.jsx');
  const effect = page.slice(page.indexOf('  // Persist the placement result.'), page.indexOf('\n  return ('));
  const writes = [];
  const refreshes = [];
  const supabase = { from: () => ({ update: payload => ({ eq: async (column, id) => {
    writes.push({ payload, column, id });
    return { error: null };
  } }) }) };
  const run = new Function('useEffect', 'testState', 'userId', 'finalSublevel', 'supabase', 'refreshSubscriptionRef', effect);
  run(callback => callback(), 'results', 'learner', placement.sublevel, supabase, { current: async () => refreshes.push(writes.length) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes.length, 1);
  assert.equal(writes[0].payload.current_level, placement.sublevel);
  assert.equal(writes[0].id, 'learner');
  assert.deepEqual(refreshes, [1], 'the shared profile refresh runs after persistence succeeds');

  assert.match(page, /<LevelTestResults\s+placement=\{placement\}/);
  const result = read('src/components/LevelTest/LevelTestResults.jsx');
  assert.match(result, /sublevel: finalSublevel, demotions \} = placement;/);
  assert.match(result, /if \(!user\) rememberPlacement\(finalSublevel\);/);
  assert.match(result, /\$\{totalCorrect\}\/\$\{totalQuestions\} correct/);
});
