import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { anyCurriculumFor } from '../src/data/curricula/index.js';
import { buildCheckpoint, paperSeed } from '../src/lib/checkpoint/buildCheckpoint.js';
import { checkpointFeedback, sectionComplete } from '../src/lib/checkpoint/feedback.js';
import { derivedItems, ATTEMPT_CYCLE } from '../src/lib/lesson/buildLesson.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { wordOrderAnswers, hasOrderToBuild, LICENSED_ORDERS } from '../src/lib/lesson/wordOrder.js';
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
  // Main's #252 receipt names no section, so a Hören answer never reads "after Lesen".
  for (const lang of ['en', 'de']) {
    assert.match(t('checkpoint.answerRecorded', lang), /after this section|nach diesem Teil/);
    assert.doesNotMatch(t('checkpoint.answerRecorded', lang), /Lesen/);
  }
  for (const level of ['a1.1', 'a1.2']) {
    const curriculum = anyCurriculumFor(level);
    const pool = JSON.parse(readFileSync(new URL(`../src/data/lessonPools/${level.replace('.', '')}.json`, import.meta.url), 'utf8'));
    let certain = 0; let expected = 0;
    for (const checkpoint of curriculum.checkpoints) for (let round = 0; round < 4; round += 1) {
      const items = buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) }).filter((it) => it.section === 'hoeren');
      // A1.1: three questions about heard texts, three answers each (a11.hoeren.js, 2026-11-25). A1.2: two word choices.
      const words = items.filter((it) => it.kind === (level === 'a1.1' ? 'listenChoice' : 'wordChoice'));
      assert.equal(words.length, level === 'a1.1' ? 3 : 2);
      assert.equal(new Set(words.flatMap((it) => it.options)).size, words.reduce((n, it) => n + it.options.length, 0));
      const release = (it, answer, complete) => checkpointFeedback(it, answer, { graded: true, complete });
      const choices = sequentialChoices(words, release);
      const chance = words.reduce((sum, it) => sum + 1 / it.options.length, 0);
      const score = choices.reduce((sum, candidates, i) => sum + (candidates.includes(words[i].answer) ? 1 / candidates.length : 0), 0);
      assert.ok(score <= chance + 1, `${checkpoint.id}/${round}: sequential score ${score}, chance ${chance}`);
      assert.ok(Math.abs(score - chance) < 1e-9, 'uniform tie credit: no candidate eliminated by another item');
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
    // Chance itself: two in four options on 16 papers (A1.2), three in three on 16 (A1.1).
    const chance = level === 'a1.1' ? 16 : 8;
    assert.ok(Math.abs(expected - chance) < 1e-9, `${level}: ${expected}`);
    console.log(`PASS: ${level} Hören — 16/16 disjoint papers; inference 0; sequential expected ${chance} (chance ${chance})`);
  }
  const planted = [{ id: 'a', section: 'hoeren', options: ['a', 'b', 'c', 'd'], answer: 'a' },
    { id: 'b', section: 'hoeren', options: ['d', 'e', 'f', 'g'], answer: 'd' }];
  assert.deepEqual(sequentialChoices(planted, () => ({}))[1], ['d'], 'planted shared-list inference is caught');
  assert.notDeepEqual(checkpointFeedback(planted[0], 'a', { graded: true, complete: true }), { answer: 'a' }, 'early feedback mutation releases the key');
});

// Since 2026-11-23 a tile task needs something to order: four words or more (`WORD_ORDER_MIN_WORDS`; the
// screen walk met „Guten Tag!“ and „Ich bin frei.“ as tiles). These Lektionen have no supported dialogue
// sentence that long, so their slot is a second matching task. MEASURED debt: it may only shrink, by a
// licensed frame in src/lib/lesson/wordOrder.js for one of their own four-word lines. 2026-11-24:
// `LICENSED_ORDERS` brought tiles back to A1.1 L1, L2, L3, L7, L9 and A1.2 L8, L11; the debt is 0.
const NO_TILES = { 'a1.1': [], 'a1.2': [] };

test('each A1.1/A1.2 lesson supplies a derived tile task on every attempt and grades every licensed alternative', () => {
  for (const level of ['a1.1', 'a1.2']) {
    let count = 0;
    const without = new Set();
    for (const lesson of anyCurriculumFor(level).lektionen) for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
      const derived = derivedItems(lesson, attempt);
      assert.equal(derived.length, 3, `${level} L${lesson.nr}/${attempt}: the derived stage keeps three tasks`);
      const tiles = derived.filter((it) => it.type === 'word_order');
      if (NO_TILES[level].includes(lesson.nr)) {
        without.add(lesson.nr);
        assert.equal(tiles.length, 0, `${level} L${lesson.nr}/${attempt} now offers tiles — take it off NO_TILES`);
        continue;
      }
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
    assert.deepEqual([...without], NO_TILES[level]);
    const withTiles = anyCurriculumFor(level).lektionen.length - NO_TILES[level].length;
    assert.equal(count, withTiles * ATTEMPT_CYCLE);
    console.log(`PASS: ${level} tiles — ${withTiles}/12 Lektionen × 3 attempts = ${count} tasks`);
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
    // Licensed lines (2026-11-24): the two blind readings, written out again here as the gold.
    ['Ich heiße Ana Chakiri.', ['Ich heiße Ana Chakiri.', 'Ana Chakiri heiße ich.']],
    ['Mein Nachname ist Chakiri.', ['Mein Nachname ist Chakiri.', 'Chakiri ist mein Nachname.']],
    ['Sie ist noch jung.', ['Sie ist noch jung.', 'Noch jung ist sie.', 'Noch ist sie jung.', 'Jung ist sie noch.']],
    ['Der Mann von meiner Schwester kommt aus Marokko.', ['Der Mann von meiner Schwester kommt aus Marokko.', 'Aus Marokko kommt der Mann von meiner Schwester.']],
    ['Ich schwimme jede Woche.', ['Ich schwimme jede Woche.', 'Jede Woche schwimme ich.']],
    ['Ich spiele am Wochenende Fußball.', ['Ich spiele am Wochenende Fußball.', 'Am Wochenende spiele ich Fußball.', 'Fußball spiele ich am Wochenende.', 'Ich spiele Fußball am Wochenende.']],
    ['Mein Hobby ist Sport.', ['Mein Hobby ist Sport.', 'Sport ist mein Hobby.']],
    ['Das Café ist gut.', ['Das Café ist gut.', 'Gut ist das Café.']], // Codex's reading agrees (2026-11-25)
    ['Ich sehe zehn Minuten fern.', ['Ich sehe zehn Minuten fern.', 'Zehn Minuten sehe ich fern.']],
    ['Der Kühlschrank hat kein Brot.', ['Der Kühlschrank hat kein Brot.', 'Kein Brot hat der Kühlschrank.']],
    ['Ich frage die Nachbarin.', ['Ich frage die Nachbarin.', 'Die Nachbarin frage ich.']],
    ['Der Teppich ist auf der Terrasse.', ['Der Teppich ist auf der Terrasse.', 'Auf der Terrasse ist der Teppich.']],
    ['Seit einer Woche regnet es.', ['Seit einer Woche regnet es.', 'Es regnet seit einer Woche.']],
    ['Am Abend kommt ein Gewitter.', ['Am Abend kommt ein Gewitter.', 'Ein Gewitter kommt am Abend.']],
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

test('every licensed tile line is a sentence of a live dialogue, and each of its orders uses exactly its tiles', () => {
  const sentences = new Set();
  for (const level of ['a1.1', 'a1.2']) for (const lesson of anyCurriculumFor(level).lektionen) {
    for (const line of lesson.dialog.lines) for (const s of String(line.de).split(/(?<=[.!?])\s+/)) sentences.add(s.trim());
  }
  const tiles = (s) => s.split(/\s+/).map(norm).sort();
  for (const [sentence, orders] of Object.entries(LICENSED_ORDERS)) {
    assert.ok(sentences.has(sentence), `${sentence} is in no A1.1/A1.2 dialogue — drop the entry`);
    assert.ok(hasOrderToBuild(sentence), sentence);
    assert.equal(orders[0], sentence, 'the dialogue’s own order comes first');
    assert.equal(new Set(orders.map(norm)).size, orders.length, `${sentence}: an order listed twice`);
    for (const order of orders) assert.deepEqual(tiles(order), tiles(sentence), order);
  }
});
