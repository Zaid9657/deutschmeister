// One closed-class word typed for another is grammar, never a typo (2026-10-25 review, C-051 / C-061).
//
// „Er bist Lehrer.", „dein Markt" for „den Markt", „Das ist deine Party." for the possessive
// correction „meine Party", „Ich wohne ein Berlin." — each came back as TYPO („Almost — just a
// typo"), which the lesson (PracticeItem: correct = result !== WRONG), the checkpoint
// (isItemCorrect) and the review (gradeTypedReview) all count as correct. The learner got credit
// for exactly the grammar the item tests and the error never reached remediation. Three gaps in
// src/lib/lesson/check.js: `oneKeyAdded` took ANY added letter („m" + „ein", „b" + „ist"), the
// ending check needs a three-letter stem, and a changed first letter („meine"/„deine") keeps the
// last one. The rule closes the CLASS, so this file walks every typed answer of both live pools
// and of every checkpoint paper a learner can sit, swaps each closed-class word for every
// closed-class word one letter away (only those could ever pass as a typo), and asks the real
// checker. The class is written out here on purpose rather than imported: the test names the
// class the checker has to close.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkAnswer, checkOptionsFor, isChoiceItem, levenshtein, RESULT } from '../src/lib/lesson/check.js';
import { buildCheckpoint, paperSeed, isItemCorrect } from '../src/lib/checkpoint/buildCheckpoint.js';
import { gradeTypedReview } from '../src/lib/checkpoint/reviewGrading.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';

const POOLS = {
  a11: JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8')),
  a12: JSON.parse(readFileSync(new URL('../src/data/lessonPools/a12.json', import.meta.url), 'utf8')),
};

const declined = (stems) => stems.flatMap((s) => ['', 'e', 'en', 'em', 'er', 'es'].map((e) => `${s}${e}`));
const CLOSED = [...new Set([
  // articles, kein- and the possessives in every declension
  'der', 'die', 'das', 'den', 'dem', 'des', ...declined(['ein', 'kein', 'mein', 'dein', 'sein', 'ihr', 'unser']),
  'euer', 'eure', 'euren', 'eurem', 'eurer', 'eures',
  // personal and reflexive pronouns
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'mich', 'dich', 'sich', 'uns', 'euch', 'mir', 'dir', 'ihm', 'ihn', 'ihnen',
  // the finite forms of sein, haben and the modals
  'bin', 'bist', 'ist', 'sind', 'seid', 'habe', 'hast', 'hat', 'haben', 'habt',
  'kann', 'kannst', 'können', 'könnt', 'muss', 'musst', 'müssen', 'müsst', 'darf', 'darfst', 'dürfen', 'dürft',
  'soll', 'sollst', 'sollen', 'sollt', 'will', 'willst', 'wollen', 'wollt', 'mag', 'magst', 'möchte', 'möchtest', 'möchten',
  // the short prepositions and their contractions
  'in', 'im', 'ins', 'an', 'am', 'ans', 'um', 'zu', 'zum', 'zur', 'von', 'vom', 'bei', 'beim',
  'denn', 'dass',
])];
const fold = (w) => String(w).normalize('NFC').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
/** folded closed word → the closed words one letter away (the only swaps a typo allowance could take). */
const NEIGHBOURS = new Map(CLOSED.map((w) => [fold(w), CLOSED.filter((c) => c !== w && levenshtein(fold(c), fold(w)) === 1)]));

/** Every accepted answer with ONE closed-class word swapped for a closed-class neighbour, case kept. */
function swaps(accepted) {
  const out = [];
  for (const answer of accepted) {
    const tokens = String(answer).split(' ');
    tokens.forEach((token, i) => {
      const m = token.match(/^([„"“(]*)(\p{L}+)([^\p{L}]*)$/u);
      if (!m) return;
      const [, before, word, after] = m;
      for (const other of NEIGHBOURS.get(fold(word)) || []) {
        const written = /^\p{Lu}/u.test(word) ? other.charAt(0).toUpperCase() + other.slice(1) : other;
        out.push({ typed: [...tokens.slice(0, i), `${before}${written}${after}`, ...tokens.slice(i + 1)].join(' '), from: word, to: written });
      }
    });
  }
  return out;
}

/** A swap may be another accepted answer (CORRECT) or only differ from one in case (TYPO 'case'); it is never a typo. */
function assertNoTypo(where, item, accepted) {
  let n = 0;
  for (const s of swaps(accepted)) {
    const r = checkAnswer(s.typed, accepted, checkOptionsFor(item));
    n += 1;
    assert.ok(r.result !== RESULT.TYPO || r.reason === 'case',
      `${where} ${item.id}: „${s.typed}" (${s.from} → ${s.to}) for „${accepted[0]}" graded ${r.result} — a closed-class swap is grammar`);
  }
  return n;
}

test('both live pools: a closed-class word swapped for another one in any typed answer is never a typo', () => {
  let checked = 0;
  for (const [file, pool] of Object.entries(POOLS)) {
    for (const item of pool.items) {
      if (isChoiceItem(item)) continue;
      const accepted = item.accepted && item.accepted.length ? item.accepted : [item.answer];
      checked += assertNoTypo(file, item, accepted);
    }
  }
  assert.ok(checked > 1000, `the rule reads the answers it was written for (${checked} swaps)`);
});

test('every checkpoint paper (A1.1 and A1.2, three rounds): the same swap is never a typo in a graded test', () => {
  let checked = 0;
  for (const [curriculum, pool] of [[CURRICULUM_A11, POOLS.a11], [CURRICULUM_A12, POOLS.a12]]) {
    for (const checkpoint of curriculum.checkpoints) {
      for (let round = 0; round < 3; round += 1) {
        for (const item of buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) })) {
          if (item.mode !== 'typed' || !item.accepted?.length) continue;
          checked += assertNoTypo(`${checkpoint.id}/${round}`, item, item.accepted);
        }
      }
    }
  }
  assert.ok(checked > 100, `the papers carry typed closed-class words (${checked} swaps)`);
});

test('the measured pairs are wrong in the lesson, the checkpoint and the review', () => {
  const pairs = [
    ['Er bist Lehrer.', 'Er ist Lehrer.'],
    ['Sie hast ein Auto.', 'Sie hat ein Auto.'],
    ['Er habt ein Auto.', 'Er hat ein Auto.'],
    ['Ich habe mein Auto.', 'Ich habe ein Auto.'],
    ['Das ist meine Lampe.', 'Das ist eine Lampe.'],
    ['Ich brauche meinen Stift.', 'Ich brauche einen Stift.'],
    ['Tim bezahlt dein Kuchen.', 'Tim bezahlt den Kuchen.'],
    ['Ich wohne ein Berlin.', 'Ich wohne in Berlin.'],
    ['Ich bin ihm Büro.', 'Ich bin im Büro.'],
    ['Der Film beginnt zum acht Uhr.', 'Der Film beginnt um acht Uhr.'],
    ['Der wohnt in Berlin.', 'Er wohnt in Berlin.'],
    ['dein Markt', 'den Markt'],
    ['meinen Supermarkt', 'einen Supermarkt'],
    ['Das ist deine Party.', 'Das ist meine Party.'],
    ['Wer bist die Tante?', 'Wer ist die Tante?'],
    ['Mich heiße Ana.', 'Ich heiße Ana.'],
    ['Die Kellnerin hast Kuchen.', 'Die Kellnerin hat Kuchen.'],
    ['Heute kocht eine Mutter das Essen.', 'Heute kocht meine Mutter das Essen.'],
  ];
  for (const [typed, key] of pairs) {
    assert.equal(checkAnswer(typed, [key]).result, RESULT.WRONG, `„${typed}" for „${key}"`);
    assert.equal(isItemCorrect({ mode: 'typed', accepted: [key] }, typed), false, `checkpoint: „${typed}" for „${key}"`);
    assert.equal(gradeTypedReview('pattern:verb-sein', [key], typed).ok, false, `review: „${typed}" for „${key}"`);
  }
  // The served items the review named, through the item's own options.
  const a12 = POOLS.a12.items.find((i) => (i.accepted || [i.answer]).includes('den Markt') && !isChoiceItem(i));
  assert.ok(a12, 'the A1.2 accusative item that asks for „den Markt"');
  assert.equal(checkAnswer('dein Markt', a12.accepted || [a12.answer], checkOptionsFor(a12)).result, RESULT.WRONG);
  const party = POOLS.a11.items.find((i) => (i.accepted || [i.answer]).includes('Das ist meine Party.') && !isChoiceItem(i));
  assert.ok(party, 'the A1.1 possessive correction „Das ist meine Party."');
  assert.equal(checkAnswer('Das ist deine Party.', party.accepted || [party.answer], checkOptionsFor(party)).result, RESULT.WRONG);
});

test('a slip that is no word of the class keeps its one allowance', () => {
  // a key that bounced — the one exemption a short word still has
  assert.equal(checkAnswer('Du bistt hier.', ['Du bist hier.']).result, RESULT.TYPO);
  assert.equal(checkAnswer('Er hatt ein Auto.', ['Er hat ein Auto.']).result, RESULT.TYPO);
  // a misspelt possessive is no other possessive
  assert.equal(checkAnswer('Das ist mene Party.', ['Das ist meine Party.'], { strict: true }).result, RESULT.TYPO);
  assert.equal(checkAnswer('mene', ['meine']).result, RESULT.TYPO);
  // …while a letter added in front of a short word is another word, not a bounce
  assert.equal(checkAnswer('Er ist imm Büro.', ['Er ist im Büro.']).result, RESULT.TYPO, 'a doubled letter');
  assert.equal(checkAnswer('Er ist ihm Büro.', ['Er ist im Büro.']).result, RESULT.WRONG, 'an added letter');
});
