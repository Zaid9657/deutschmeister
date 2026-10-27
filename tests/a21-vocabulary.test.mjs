import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { CURRICULUM_A21 as course } from '../src/data/curricula/a21.js';
import { VOCABULARY_A21_ADDITIONS } from '../src/data/curricula/a21.vocabulary.js';
import { reviewVocabularyErrors, wortfeldInputCoverage } from '../scripts/validate-curriculum.mjs';
import { a21VocabularyPresentation } from '../src/lib/lesson/a21Vocabulary.js';

const earlier = new Set([CURRICULUM_A11, CURRICULUM_A12].flatMap(c => c.lektionen.flatMap(l => l.wortfeld.map(w => w.word.toLowerCase()))));
const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a21.json', import.meta.url))).items;

test('inherited entries are review and every lesson has 15–25 genuinely new words', () => {
  assert.deepEqual(reviewVocabularyErrors(course), []);
  for (const lesson of course.lektionen) {
    for (const w of lesson.wortfeld) assert.equal(w.review, earlier.has(w.word.toLowerCase()), w.de);
    assert.ok(lesson.wortfeld.filter(w => !w.review).length >= 15);
    assert.ok(lesson.wortfeld.filter(w => !w.review).length <= 25);
    assert.ok(lesson.wortfeld.length <= 30);
  }
  const mutated = structuredClone(course);
  const inherited = mutated.lektionen[0].wortfeld.find(w => w.review);
  inherited.review = false;
  assert.ok(reviewVocabularyErrors(mutated).some(e => e.includes(inherited.de) && e.includes('must be marked review')));
  mutated.lektionen[0].wortfeld = mutated.lektionen[0].wortfeld.filter(w => w.review);
  assert.ok(reviewVocabularyErrors(mutated).some(e => e.includes('expected 15–25')));
  assert.deepEqual(reviewVocabularyErrors(CURRICULUM_A11), []);
  assert.deepEqual(reviewVocabularyErrors(CURRICULUM_A12), []);
});

test('every added word has displayed bilingual input, pool retrieval and an attested existing UUID', () => {
  assert.deepEqual(wortfeldInputCoverage(course), []);
  for (const [index, additions] of VOCABULARY_A21_ADDITIONS.entries()) {
    for (const word of additions) {
      assert.ok(word.exampleDe.includes(word.word), word.de);
      assert.ok(word.exampleEn.trim(), word.de);
      assert.ok(!earlier.has(word.word.toLowerCase()), word.de);
      assert.ok(pool.some(i => i.topic === course.lektionen[index].primarySlug && i.answer === word.word && i.questionDe.includes('(Anfang:') && i.minLektion <= index + 1), `retrieval: ${word.de}`);
      const sql = readFileSync(new URL(`../${word.wordIdSource}`, import.meta.url), 'utf8');
      assert.ok(sql.includes(`SET german = '${word.word}'\nWHERE id = '${word.wordId}'`) || sql.includes(`SET german = '${word.word}'\r\nWHERE id = '${word.wordId}'`), `UUID provenance: ${word.de}`);
    }
  }
});

test('A2 pages separate review from new vocabulary, retain all entries and preserve flip indices', () => {
  for (const l of course.lektionen) {
    for (const lang of ['de', 'en']) {
      const view = a21VocabularyPresentation(l.wortfeld, lang);
      assert.equal(view.groups.flat().length, l.wortfeld.length);
      assert.equal(new Set(view.groups.flat().map(x => x.i)).size, l.wortfeld.length);
      for (const [i, group] of view.groups.entries()) {
        assert.ok(group.length <= 6);
        assert.equal(new Set(group.map(x => x.w.review)).size, 1);
        assert.equal(view.groupLabels[i], group[0].w.review ? view.labels.review : view.labels.fresh);
        for (const { w, i: original } of group) assert.equal(w, l.wortfeld[original]);
      }
      assert.ok(view.title.includes(String(l.wortfeld.filter(w => !w.review).length)));
      assert.ok(view.title.includes(String(l.wortfeld.filter(w => w.review).length)));
    }
  }
});
