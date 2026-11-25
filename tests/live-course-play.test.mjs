// What a browser play of the re-landed course showed (2026-11-19, 375 px, guest, English and German:
// Checkpoint 1 start to result, A1.1 practice runs in Lektionen 4, 5, 7 and 10). Each finding class is
// a rule over every item, unit or surface it can occur on, never a list of ids.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { checkLesenA11 } from '../scripts/a11-lesen-check.mjs';
import { LESEN_A11 } from '../src/data/curricula/a11.lesen.js';
import { LESEN_A12 } from '../src/data/curricula/a12.lesen.js';
import { CURRICULA } from '../src/data/curricula/index.js';
import { LANDESKUNDE } from '../src/data/curricula/a11.meta.js';
import { derivedItems, ATTEMPT_CYCLE } from '../src/lib/lesson/buildLesson.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { feedbackReason, hintFor } from '../src/lib/lesson/guidedFeedback.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pool = (lv) => JSON.parse(read(`src/data/lessonPools/${lv}.json`)).items.filter((i) => i.minLektion != null);
const words = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

test('a false reading statement never stands word for word in its own text (both banks)', () => {
  // „Steht das im Text? „Tim wohnt in Bremen.““ was keyed Falsch over „Die Familie von Tim wohnt in Bremen.“
  for (const bank of [LESEN_A11, LESEN_A12]) {
    for (const u of Object.values(bank).flatMap((c) => c.papers.flat())) {
      if (u.answer !== 'Falsch' || !u.statement) continue;
      assert.ok(!` ${words(u.text)} `.includes(` ${words(u.statement)} `), `${u.id}: „${u.statement}“ stands in its text`);
    }
  }
});

test('the reading gate catches both play findings when they come back', () => {
  const bank = structuredClone(LESEN_A11);
  const [p1] = bank['a1.1-cp1'].papers;
  const falseUnit = p1.find((u) => u.format === 'trueFalse' && u.answer === 'Falsch');
  falseUnit.text = `${falseUnit.text} Die Leute sagen: ${falseUnit.statement}`;
  // The worked ad of Lektion 3 is practised German like a dialogue line.
  const shown = CURRICULA['a1.1'].lektionen[2].notice.readingExample.text.split(/(?<=[.!?])\s+/).find((s) => s.split(' ').length >= 4);
  const other = p1.find((u) => u !== falseUnit);
  other.text = `${other.text} ${shown}`;
  const { findings } = checkLesenA11(bank);
  assert.ok(findings.some((f) => f.startsWith(`${falseUnit.id}: statement stands word for word`)), findings.join('\n'));
  assert.ok(findings.some((f) => f.startsWith(`${other.id}: practised sentence`)), findings.join('\n'));
});

test('no Lektion shows a sentence that a checkpoint reading text reprints (worked notices included)', () => {
  // Lektion 2's worked notice said „Herr Weber ist hier.“ and Checkpoint 1 asked exactly that.
  const shown = CURRICULA['a1.1'].lektionen.flatMap((l) => [l.notice?.readingExample?.text, ...(l.notice?.examples || [])])
    .filter(Boolean).flatMap((t) => t.split(/(?<=[.!?])\s+/)).map(words).filter((s) => s.split(' ').length >= 4);
  for (const u of Object.values(LESEN_A11).flatMap((c) => c.papers.flat())) {
    for (const s of shown) assert.ok(!` ${words(u.text)} `.includes(` ${s} `), `${u.id} reprints „${s}“`);
  }
});

test('explanations with **bold** marks are rendered, never printed raw, on every lesson and checkpoint screen', () => {
  // The checkpoint printed „The number 10 is written as the word **zehn**“ with the asterisks.
  const files = ['src/pages/lesson', 'src/components/lesson'].flatMap((dir) => readdirSync(new URL(`../${dir}`, import.meta.url))
    .filter((f) => f.endsWith('.jsx')).map((f) => `${dir}/${f}`));
  const raw = [];
  for (const file of files) {
    read(file).split('\n').forEach((line, i) => {
      if (/>\{[^{}]*explanation(En|De)\b[^{}]*\}</.test(line) && !/inline\(/.test(line)) raw.push(`${file}:${i + 1}`);
    });
  }
  assert.deepEqual(raw, []);
  assert.ok(pool('a11').some((i) => /\*\*/.test(i.explanationEn || '')), 'the pools do carry bold marks');
});

test('the reason under a correct tile order never calls another order the dialogue line’s', () => {
  // „Frei bin ich.“ was told „So stehen die Wörter in der ursprünglichen Dialogzeile.“
  let alternatives = 0;
  for (const c of Object.values(CURRICULA)) for (const l of c.lektionen) for (let a = 1; a <= ATTEMPT_CYCLE; a += 1) {
    for (const it of derivedItems(l, a).filter((x) => x.type === 'word_order')) {
      for (const order of it.accepted) {
        const { result, expected } = checkAnswer(order, it.accepted, checkOptionsFor(it));
        assert.notEqual(result, RESULT.WRONG, order);
        for (const lang of ['de', 'en']) {
          const reason = feedbackReason(it, lang, expected);
          if (words(order) === words(it.answer)) { assert.match(reason, /Dialogzeile|dialogue line/); continue; }
          alternatives += 1;
          assert.doesNotMatch(reason, /So stehen die Wörter|This is the word order/, `${it.id}: ${order}`);
          assert.ok(reason.includes(it.answer) && reason.includes(expected), `${it.id}: ${reason}`);
        }
      }
    }
  }
  assert.ok(alternatives > 0, 'some tile sets take another order');
});

test('a correction’s hint never points to a repair its task does not ask for', () => {
  // „Korrigieren Sie das Verb:“ was told „Prüfen Sie die Schreibweise und die Satzzeichen.“
  for (const lv of ['a11', 'a12']) {
    for (const it of pool(lv).filter((i) => i.type === 'error_correction')) {
      const hint = hintFor(it);
      const asks = /Schreibweise|Rechtschreibung|Satzzeichen|Komma|spelling|punctuation/i.test(`${it.questionDe} ${it.questionEn || ''}`);
      if (!asks) assert.doesNotMatch(`${hint.de} ${hint.en}`, /Schreibweise|Satzzeichen|spelling|punctuation/i, `${it.id}: ${hint.de}`);
    }
  }
});

test('a gap that shows its number in digits and wants the word says so, in both languages', () => {
  // „Mein Vorname hat ___ Buchstaben. (10)“ took only „zehn“ and never said so; „10“ was marked wrong.
  const NUMBER_WORD = /(?<!\p{L})(null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|\p{L}*zehn|\p{L}*zig|\p{L}*hundert\p{L}*)(?!\p{L})/iu;
  let seen = 0;
  for (const lv of ['a11', 'a12']) {
    for (const it of pool(lv)) {
      const keys = it.accepted?.length ? it.accepted : [it.answer];
      if (!/\(\s*\d+\s*[;)]/.test(it.questionDe) || keys.some((k) => /\d/.test(k)) || !keys.every((k) => NUMBER_WORD.test(k))) continue;
      seen += 1;
      assert.match(it.questionDe, /in Worten/, it.id);
      assert.match(it.questionEn || '', /as a word|in words|number word/i, it.id);
    }
  }
  assert.ok(seen >= 10, `number-word gaps found: ${seen}`);
});

test('the German culture notes call Sie and du the two forms of address, not two forms of „Sie“', () => {
  for (const note of Object.values(LANDESKUNDE).flat()) assert.doesNotMatch(note.bodyDe, /Formen von „Sie“/);
});
