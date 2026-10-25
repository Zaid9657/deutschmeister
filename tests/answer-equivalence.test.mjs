// One rule for whole answers that are the same answer, read by the course AND the grammar pages
// (round-2 review, 2026-10-25).
//
// The lesson checker (src/lib/lesson/check.js) has accepted „Wieso" where a key says „Warum" since
// DaF review #10 — a rule in the checker, deliberately not a widened answer key. The grammar pages'
// fill-in island (astro-site/src/components/ExercisePlayer.jsx) never had the rule, so on
// /grammar/a1.2/question-words/ „Antwort: Ich bin krank. Frage: ___ bleibst du zu Hause?" marked
// „Wieso" wrong while the course took it. CLAUDE.md: grammar comparison behaviour must agree. The
// groups now live in src/data/sameAnswer.js, copied byte-identical to astro-site/src/data/ by
// scripts/sync-shared.mjs, and this file runs BOTH comparators over the same cases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { SAME_ANSWER } from '../src/data/sameAnswer.js';
import { sameAnswer as astroSameAnswer } from '../astro-site/src/data/sameAnswer.js';
import { SHARED_FILES } from '../scripts/shared-files.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const island = read('astro-site/src/components/ExercisePlayer.jsx');

/** The island's graders, run in Node with the import they use (its own copy of the shared rule). */
function islandGrader() {
  const code = ['normalizeAnswer', 'answerMatches', 'acceptsAnswer'].map((name) => {
    const fn = island.match(new RegExp(`^function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`, 'm'));
    assert.ok(fn, `ExercisePlayer.jsx has no top-level function ${name}`);
    return fn[0];
  });
  return vm.runInNewContext(`${code.join('\n')}\n({ acceptsAnswer });`, { sameAnswer: astroSameAnswer }).acceptsAnswer;
}

/** Both verdicts for one typed answer to one key. The course counts a TYPO as correct (PracticeItem). */
function verdicts(typed, key, acceptable = []) {
  const accepts = islandGrader();
  const accepted = [key, ...acceptable];
  const item = { type: 'fill_blank', topic: 'question-words', answer: key, accepted };
  return {
    grammar: accepts(typed, { correct_answer: key, acceptable_answers: acceptable }),
    course: checkAnswer(typed, accepted, checkOptionsFor(item)).result !== RESULT.WRONG,
  };
}

test('the grammar pages and the course give the same verdict over the same cases', () => {
  const cases = [
    // the reason question words — every member, both directions, written any way
    ['Wieso', 'Warum', true], ['Weshalb', 'Warum', true], ['Weswegen', 'Warum', true],
    ['Aus welchem Grund', 'Warum', true], ['aus  welchem   Grund', 'Warum', true],
    ['Warum', 'Wieso', true], ['wieso', 'Warum', true], ['WESHALB', 'Wieso', true],
    // the folds both comparators share: case, ASCII umlauts, a decomposed umlaut
    ['warum', 'Warum', true], ['Gruesse', 'Grüße', true], ['fuer', 'für', true], ['für'.normalize('NFD'), 'für', true],
    // …and what no rule makes the same
    ['Wann', 'Warum', false], ['Woher', 'Wieso', false], ['Wohin', 'Wo', false], ['Wieso nicht', 'Warum', false],
    ['Wieso', 'ich', false], ['Wie', 'Warum', false],
  ];
  for (const [typed, key, same] of cases) {
    const v = verdicts(typed, key);
    assert.equal(v.grammar, same, `grammar page: „${typed}" for „${key}"`);
    assert.equal(v.course, same, `course: „${typed}" for „${key}"`);
  }
});

test('every fill-in of the live grammar bank whose key is in a group takes every other member, on both surfaces', () => {
  const accepts = islandGrader();
  const bank = JSON.parse(read('grammar-content-cache.json')).exercises.filter((e) => e.exercise_type === 'fill_blank');
  let measured = 0;
  for (const exercise of bank) {
    const keys = [exercise.correct_answer, ...(exercise.acceptable_answers ?? [])];
    for (const group of SAME_ANSWER) {
      if (!keys.some((k) => group.includes(String(k).toLowerCase()))) continue;
      // Written the way the key is („Warum" opens a question, „warum" an indirect one), so the
      // course's own case rule is not what is measured here.
      const opensCapital = /^\p{Lu}/u.test(String(exercise.correct_answer));
      for (const member of group) {
        const typed = opensCapital ? member.charAt(0).toUpperCase() + member.slice(1) : member;
        measured += 1;
        assert.equal(accepts(typed, exercise), true, `${exercise.id} „${exercise.question_de}": „${typed}" on the grammar page`);
        const item = { type: 'fill_blank', answer: exercise.correct_answer, accepted: keys };
        assert.equal(checkAnswer(typed, keys, checkOptionsFor(item)).result, RESULT.CORRECT, `${exercise.id}: „${typed}" in the course`);
      }
    }
  }
  assert.ok(measured >= 10, `the rule reaches the bank's „Warum" items (${measured})`);
});

test('the rule is one module, shared byte-identical, and nobody keeps a list of their own', () => {
  assert.ok(SHARED_FILES.some(([from, to]) => from === 'src/data/sameAnswer.js' && to === 'astro-site/src/data/sameAnswer.js'), 'registered in the shared manifest');
  assert.equal(read('astro-site/src/data/sameAnswer.js'), read('src/data/sameAnswer.js'), 'the Astro copy is byte-identical');
  assert.match(island, /^import \{ sameAnswer \} from '\.\.\/data\/sameAnswer\.js';$/m);
  assert.match(island, /onAnswer\(acceptsAnswer\(value, exercise\)\);/, 'the fill-in grades through the shared rule');
  assert.match(island, /const isCorrect = acceptsAnswer\(value, exercise\);/, '…and shows the verdict it graded');
  const checker = read('src/lib/lesson/check.js');
  assert.match(checker, /^import \{ sameAnswer \} from '\.\.\/\.\.\/data\/sameAnswer\.js';$/m);
  assert.doesNotMatch(checker, /\['warum', 'wieso'/, 'the checker keeps no group of its own');
});
