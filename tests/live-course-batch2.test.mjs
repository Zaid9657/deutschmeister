import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { anyCurriculumFor } from '../src/data/curricula/index.js';
import { buildCheckpoint, paperSeed } from '../src/lib/checkpoint/buildCheckpoint.js';
import { checkpointFeedback, sectionComplete } from '../src/lib/checkpoint/feedback.js';
import { derivedItems, ATTEMPT_CYCLE } from '../src/lib/lesson/buildLesson.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { wordOrderAnswers } from '../src/lib/lesson/wordOrder.js';
import { t } from '../src/lib/lesson/strings.js';

const grade = (item, answer) => checkAnswer(answer, item.accepted, checkOptionsFor(item)).result;
const norm = (s) => s.toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
// The strategy sees only printed options and feedback already released, never the key.
function sequentialChoices(items, release) {
  const seen = new Set(); const releasedKeys = new Set(); const answers = {};
  return items.map((item) => {
    const candidates = item.options.filter((o) => seen.has(o) && !releasedKeys.has(o));
    const choices = candidates.length ? candidates : item.options;
    answers[item.id] = choices[0];
    const feedback = release(item, answers[item.id], sectionComplete(items, answers, 'hoeren'));
    item.options.forEach((o) => seen.add(o));
    if (feedback.key) releasedKeys.add(feedback.key);
    return choices;
  });
}

test('both levels: disjoint Hören options and deferred feedback stop sequential elimination on all 32 papers', () => {
  for (const lang of ['en', 'de']) {
    assert.match(t('checkpoint.listeningAnswerRecorded', lang), /Hören/);
    assert.doesNotMatch(t('checkpoint.listeningAnswerRecorded', lang), /Lesen/);
  }
  for (const level of ['a1.1', 'a1.2']) {
    const curriculum = anyCurriculumFor(level);
    const pool = JSON.parse(readFileSync(new URL(`../src/data/lessonPools/${level.replace('.', '')}.json`, import.meta.url), 'utf8'));
    let certain = 0; let expected = 0;
    for (const checkpoint of curriculum.checkpoints) for (let round = 0; round < 4; round += 1) {
      const items = buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) }).filter((it) => it.section === 'hoeren');
      const words = items.filter((it) => it.kind === 'wordChoice');
      assert.equal(words.length, 2);
      assert.equal(new Set(words.flatMap((it) => it.options)).size, 8);
      const release = (it, answer, complete) => checkpointFeedback(it, answer, { graded: true, complete });
      const choices = sequentialChoices(words, release);
      const chance = words.reduce((sum, it) => sum + 1 / it.options.length, 0);
      const score = choices.reduce((sum, candidates, i) => sum + (candidates.includes(words[i].answer) ? 1 / candidates.length : 0), 0);
      assert.ok(score <= chance + 1, `${checkpoint.id}/${round}: sequential score ${score}, chance ${chance}`);
      assert.equal(score, chance, 'uniform tie credit: no candidate eliminated by another item');
      certain += choices.filter((c) => c.length === 1).length;
      expected += score;
      const answers = {};
      for (const it of items) {
        assert.deepEqual(release(it, it.answer, false), { answer: it.answer });
        answers[it.id] = it.answer;
        const complete = sectionComplete(items, answers, 'hoeren');
        for (const prior of items.filter((p) => Object.hasOwn(answers, p.id))) {
          const feedback = release(prior, answers[prior.id], complete);
          if (!complete) assert.deepEqual(feedback, { answer: prior.answer });
          else assert.equal(feedback.key, prior.answer);
        }
      }
    }
    assert.equal(certain, 0);
    assert.equal(expected, 8);
    console.log(`PASS: ${level} Hören — 16/16 disjoint papers; inference 0/16; sequential expected 8/32 (chance 8/32)`);
  }
  const planted = [{ id: 'a', section: 'hoeren', options: ['a', 'b', 'c', 'd'], answer: 'a' },
    { id: 'b', section: 'hoeren', options: ['d', 'e', 'f', 'g'], answer: 'd' }];
  assert.deepEqual(sequentialChoices(planted, () => ({}))[1], ['d'], 'planted shared-list inference is caught');
  assert.notDeepEqual(checkpointFeedback(planted[0], 'a', { graded: true, complete: true }), { answer: 'a' }, 'early feedback mutation releases the key');
});

test('each A1.1/A1.2 lesson supplies a derived tile task on every attempt and grades every licensed alternative', () => {
  for (const level of ['a1.1', 'a1.2']) {
    let count = 0;
    for (const lesson of anyCurriculumFor(level).lektionen) for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
      const tiles = derivedItems(lesson, attempt).filter((it) => it.type === 'word_order');
      assert.ok(tiles.length >= 1, `${level} L${lesson.nr}/${attempt}`);
      for (const item of tiles) {
        count += 1;
        const line = lesson.dialog.lines[item.lineIndex].de;
        const source = item.sentenceIndex == null ? line : line.split(/(?<=[.!?])\s+/)[item.sentenceIndex];
        assert.equal(item.answer, source, 'no dialogue or audio text rewritten');
        assert.deepEqual(item.tokens.map(norm).sort(), source.split(/\s+/).map(norm).sort());
        for (const alternative of wordOrderAnswers(item.answer)) {
          assert.deepEqual(alternative.split(/\s+/).map(norm).sort(), item.tokens.map(norm).sort());
          assert.equal(grade(item, alternative), RESULT.CORRECT, alternative);
        }
        assert.equal(grade(item, `${item.answer} extra`), RESULT.WRONG);
      }
    }
    assert.equal(count, 36);
    console.log(`PASS: ${level} tiles — 12/12 Lektionen × 3 attempts = 36/36 tasks`);
  }
});

// Independent hand-enumerated minimal pairs. Exhaustive tile permutations are
// graded through the production checker, not just compared to the frame helper.
test('new tile frames accept all annotated orders and reject every other permutation', () => {
  const cases = [
    ['Guten Tag.', ['Guten Tag.']],
    ['Er ist zwanzig.', ['Er ist zwanzig.', 'Zwanzig ist er.']],
    ['Der Tisch kostet fünfzehn Euro.', ['Der Tisch kostet fünfzehn Euro.', 'Fünfzehn Euro kostet der Tisch.']],
    ['Die Pause ist um eins.', ['Die Pause ist um eins.', 'Um eins ist die Pause.']],
    ['Ich habe Durst.', ['Ich habe Durst.', 'Durst habe ich.']],
    ['Hat er Hunger?', ['Hat er Hunger?', 'Er hat Hunger?', 'Hunger hat er?']],
    ['Hat der Zug Verspätung?', ['Hat der Zug Verspätung?', 'Hat Verspätung der Zug?', 'Der Zug hat Verspätung?', 'Verspätung hat der Zug?']],
    ['Ist der Weg weit?', ['Ist der Weg weit?', 'Ist weit der Weg?', 'Der Weg ist weit?', 'Weit ist der Weg?']],
    ['Ist es rot?', ['Ist es rot?', 'Es ist rot?', 'Rot ist es?']],
    ['Die Quittung ist hier.', ['Die Quittung ist hier.', 'Hier ist die Quittung.']],
    ['Ihr Auge ist gesund.', ['Ihr Auge ist gesund.', 'Gesund ist ihr Auge.']],
    ['Ich komme jetzt.', ['Ich komme jetzt.', 'Jetzt komme ich.']],
    ['Der Rock ist zu kurz.', ['Der Rock ist zu kurz.', 'Zu kurz ist der Rock.']],
    ['Es ist wolkig.', ['Es ist wolkig.', 'Wolkig ist es.']],
    ['Der Käse war lecker.', ['Der Käse war lecker.', 'Lecker war der Käse.']],
  ];
  const permutations = (xs) => xs.length < 2 ? [xs] : xs.flatMap((x, i) => permutations(xs.filter((_, n) => n !== i)).map((rest) => [x, ...rest]));
  for (const [source, licensed] of cases) {
    const item = { type: 'word_order', answer: source, accepted: wordOrderAnswers(source) };
    const gold = new Set(licensed.map(norm));
    assert.deepEqual(new Set(item.accepted.map(norm)), gold, source);
    for (const p of permutations(source.split(/\s+/))) {
      const response = p.join(' ');
      assert.equal(grade(item, response), gold.has(norm(response)) ? RESULT.CORRECT : RESULT.WRONG, response);
    }
  }
});
