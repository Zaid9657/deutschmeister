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

test('placement uses all selected questions in level and skill denominators', () => {
  const result = calculatePlacement({ answers: questions.map(correctAnswer), questions });
  assert.equal(result.sublevel, 'B2.2');
  assert.equal(result.writtenPercentage, 100);
  assert.deepEqual(result.weakTopics, []);
  assert.equal(result.typeScores.grammar.correct, result.typeScores.grammar.total);
  assert.equal(calculatePlacement({ answers: [], questions: [] }).sublevel, 'A1.1');
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
