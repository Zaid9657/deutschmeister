// A near miss that is another word is another answer (src/lib/lesson/check.js, realWordSlip;
// 2026-11-20). A typo counts as correct in the lesson, the checkpoint and the review, so „Er isst
// Lehrer.“ for „ist“ and „Das ist der Stahl.“ for „Stuhl“ passed as correct. Closed as a class over
// every served sentence, with the slips that must stay typos pinned beside it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkAnswer, checkOptionsFor, RESULT, tagError, ERROR_TAGS } from '../src/lib/lesson/check.js';
import { COURSE_WORDS } from '../src/data/courseWords.js';
import { courseWords, render } from '../scripts/build-course-words.mjs';
import { normalizeAnswer } from '../src/utils/answerMatch.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pool = (lv) => JSON.parse(read(`src/data/lessonPools/${lv}.json`)).items.filter((i) => i.minLektion != null);
const items = [...pool('a11'), ...pool('a12')];
const keysOf = (it) => (it.accepted?.length ? it.accepted : [it.answer]);
const grade = (it, answer) => checkAnswer(answer, keysOf(it), checkOptionsFor(it)).result;
const VOWELS = 'aeiou';

test('the course word list is generated from today’s courses (run node scripts/build-course-words.mjs)', () => {
  assert.equal(read('src/data/courseWords.js').replace(/\r\n/g, '\n'), render(courseWords()));
  for (const w of ['isst', 'ist', 'stuhl', 'mitte', 'miete', 'laufen', 'kaufen']) assert.ok(COURSE_WORDS.has(w), w);
  // English answers of the guided meaning questions and practice options are not German words.
  for (const w of ['get', 'the', 'you', 'arbeitst']) assert.ok(!COURSE_WORDS.has(w), w);
});

test('the reported cases: another word is wrong, a slip that is no word stays a typo', () => {
  const s = (answer) => ({ id: 'x', type: 'sentence_building', topic: 'verbs', answer, accepted: [answer] });
  assert.equal(grade(s('Er ist Lehrer.'), 'Er isst Lehrer.'), RESULT.WRONG, 'isst is essen');
  assert.equal(grade(s('Das ist der Stuhl.'), 'Das ist der Stahl.'), RESULT.WRONG, 'a vowel for a vowel');
  assert.equal(grade(s('Die Miete kostet hundert Euro.'), 'Die Mitte kostet hundert Euro.'), RESULT.WRONG, 'Mitte is a course word');
  assert.equal(grade({ id: 'g', type: 'fill_blank', topic: 'imperative', answer: 'Sprich', accepted: ['Sprich'] }, 'Spruch'), RESULT.WRONG);
  assert.equal(grade({ id: 'k', type: 'fill_blank', topic: 'separable', answer: 'kaufen', accepted: ['kaufen'] }, 'laufen'), RESULT.WRONG);
  assert.equal(grade(s('Ich bin Lehrerin.'), 'Ich bin Lehrerinn.'), RESULT.TYPO, 'a key pressed twice');
  assert.equal(grade(s('Ich wohne in Berlin.'), 'Ich wohne in Brelin.'), RESULT.TYPO, 'two letters swapped');
  assert.equal(grade(s('Meine Eltern wohnen hier.'), 'Meine Elten wohnen hier.'), RESULT.TYPO, 'a letter dropped');
  // A missing umlaut is the keyboard, not another word, even where the plain spelling is a course
  // word („Bruder“). („schon“ for „schön“ was already wrong before this rule: the ending rule reads
  // „schoen“/„schon“ as -en/-n; a separate follow-up.)
  assert.ok(COURSE_WORDS.has('bruder'));
  assert.equal(grade(s('Meine Brüder wohnen hier.'), 'Meine Bruder wohnen hier.'), RESULT.TYPO);
});

test('on every served sentence, a one-letter slip that is another course word or another vowel is wrong', () => {
  let otherWords = 0; let vowels = 0;
  for (const it of items) {
    const key = keysOf(it)[0];
    if (!key.includes(' ') || grade(it, key) !== RESULT.CORRECT) continue;
    const opts = checkOptionsFor(it);
    if (opts.choice || opts.spelling || opts.wordOrder) continue;
    const words = key.split(' ');
    words.forEach((raw, wi) => {
      const word = raw.replace(/[.,!?;:„“"]/gu, '');
      if (!/^\p{L}{5,}$/u.test(word) || /[äöüß]/i.test(word)) return;
      const lower = word.toLowerCase();
      for (let i = 0; i < word.length; i += 1) {
        for (const c of 'abcdefghijklmnopqrstuvwxyz') {
          if (c === lower[i]) continue;
          const slip = word.slice(0, i) + (word[i] === word[i].toUpperCase() ? c.toUpperCase() : c) + word.slice(i + 1);
          const folded = normalizeAnswer(slip);
          const isWord = COURSE_WORDS.has(folded);
          const isVowel = VOWELS.includes(c) && VOWELS.includes(lower[i]);
          if (!isWord && !isVowel) continue;
          const answer = words.map((w, j) => (j === wi ? w.replace(word, slip) : w)).join(' ');
          const r = grade(it, answer);
          if (r === RESULT.CORRECT) continue; // another accepted form
          if (isWord) otherWords += 1; else vowels += 1;
          assert.equal(r, RESULT.WRONG, `${it.id}: «${answer}» for «${key}»`);
        }
      }
    });
  }
  assert.ok(otherWords > 20 && vowels > 200, `checked ${otherWords} other words, ${vowels} vowel swaps`);
});

test('a missed reading task is tagged Lesen, on every checkpoint grading path', () => {
  assert.ok(ERROR_TAGS.includes('Lesen'));
  assert.equal(tagError({ stage: 'checkpoint', section: 'lesen', kind: 'trueFalse' }, 'Richtig', 'Falsch'), 'Lesen');
  assert.equal(tagError({ stage: 'listening', section: 'hoeren', kind: 'choice' }, 'Danke', 'Bitte'), 'Hören');
  const sites = [...read('src/lib/checkpoint/buildCheckpoint.js').matchAll(/tagError\(\s*\{[^}]*\}/g), ...read('src/services/checkpointService.js').matchAll(/tagError\(\s*\{[^}]*\}/g)];
  assert.equal(sites.length, 3);
  for (const [site] of sites) assert.match(site, /section/, site);
});
