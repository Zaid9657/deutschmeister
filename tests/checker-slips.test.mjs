// Three slip classes of the shared checker (src/lib/lesson/check.js), found by the Lektion 2–3 rollout's
// blind corpus and closed 2026-11-19: Arabic-Indic and Persian digits, two neighbouring letters swapped,
// and a slip in a short content word. A TYPO counts as correct in the lesson, the checkpoint and the
// review (it only adds the offer to type it again), so each rule is also pinned on what must stay WRONG.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkAnswer, checkOptionsFor, RESULT, westernDigits } from '../src/lib/lesson/check.js';
import { CURRICULA } from '../src/data/curricula/index.js';

const pool = (lv) => JSON.parse(readFileSync(new URL(`../src/data/lessonPools/${lv}.json`, import.meta.url), 'utf8')).items.filter((i) => i.minLektion != null);
const items = [...pool('a11'), ...pool('a12')];
const keysOf = (it) => (it.accepted?.length ? it.accepted : [it.answer]);
const grade = (it, answer) => checkAnswer(answer, keysOf(it), checkOptionsFor(it)).result;
const dictations = Object.values(CURRICULA).flatMap((c) => c.lektionen.flatMap((l) => (l.hoeren?.kind === 'dictation' ? l.hoeren.lines : [])
  .map((i) => l.dialog.lines[i]?.de).filter(Boolean).map((de) => ({ id: `${l.id}-d`, topic: 'hoeren', kind: 'dictation', stage: 'dictation', type: 'dictation', answer: de, accepted: [de] }))));
const ARABIC = (s) => s.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
const PERSIAN = (s) => s.replace(/\d/g, (d) => String.fromCharCode(0x06F0 + Number(d)));

test('Arabic-Indic and Persian digits are the same digits, for every item kind that takes digits', () => {
  assert.equal(westernDigits('٠١٧٦ ۲۳۴'), '0176 234');
  let seen = 0;
  for (const it of [...items, ...dictations]) {
    for (const key of keysOf(it).filter((k) => /\d/.test(k))) {
      const right = grade(it, key);
      if (right === RESULT.WRONG) continue;
      seen += 1;
      assert.equal(grade(it, ARABIC(key)), right, `${it.id}: ${ARABIC(key)}`);
      assert.equal(grade(it, PERSIAN(key)), right, `${it.id}: ${PERSIAN(key)}`);
      // Another number in Arabic-Indic digits is still another number.
      const other = key.replace(/\d/, (d) => String((Number(d) + 1) % 10));
      if (!keysOf(it).some((k) => westernDigits(k) === other)) assert.equal(grade(it, ARABIC(other)), RESULT.WRONG, `${it.id}: ${ARABIC(other)}`);
    }
  }
  assert.ok(seen >= 5, `items with digits: ${seen}`);
  // The dictated phone number of A1.1 Lektion 6, typed on an Arabic keyboard.
  const phone = dictations.find((d) => /Null vier zwei/.test(d.answer));
  assert.notEqual(grade(phone, '٠٤٢ ٣٣٨١'), RESULT.WRONG);
});

/** Every swap of two neighbouring letters inside a word of five letters or more, not two vowels, not the last letter. */
function interiorSwaps(sentence) {
  const out = [];
  const words = sentence.split(' ');
  words.forEach((w, wi) => {
    const letters = w.replace(/[^\p{L}]/gu, '');
    // A negation is never a typo at any slip (Codex score review, 2026-10-08): „nciht“ stays wrong.
    if (letters.length < 5 || letters !== w.replace(/[.,!?;:]$/u, '') || /^(nicht|keine[nmrs]?)$/i.test(letters)) return;
    for (let i = 1; i < letters.length - 2; i += 1) {
      const [a, b] = [letters[i], letters[i + 1]];
      if (a === b || (/[aeiouyäöü]/i.test(a) && /[aeiouyäöü]/i.test(b))) continue;
      const swapped = letters.slice(0, i) + b + a + letters.slice(i + 2);
      out.push(words.map((x, j) => (j === wi ? x.replace(letters, swapped) : x)).join(' '));
    }
  });
  return out;
}

test('two neighbouring letters swapped inside a word is a typo, on every served sentence', () => {
  let seen = 0;
  for (const it of items) {
    const key = keysOf(it)[0];
    if (!key.includes(' ') || grade(it, key) !== RESULT.CORRECT) continue;
    const opts = checkOptionsFor(it);
    if (opts.choice || opts.spelling || opts.wordOrder) continue;
    for (const slip of interiorSwaps(key)) {
      const r = grade(it, slip);
      if (r === RESULT.CORRECT) continue; // the slip happens to be another accepted form
      seen += 1;
      assert.equal(r, RESULT.TYPO, `${it.id}: «${slip}» for «${key}»`);
    }
  }
  assert.ok(seen > 500, `swaps checked: ${seen}`);
});

test('a swap stays wrong where the letters are the answer: two vowels, an ending, a short grammar word, a spelled word', () => {
  const sentence = (answer, extra = {}) => ({ id: 'x', type: 'sentence_building', topic: 'verbs', answer, accepted: [answer], ...extra });
  assert.equal(grade(sentence('Ich spiele Fußball.'), 'Ich speile Fußball.'), RESULT.WRONG, 'ie/ei');
  assert.equal(grade(sentence('Wir schreiben heute.'), 'Wir schrieben heute.'), RESULT.WRONG, 'another tense');
  assert.equal(grade(sentence('Er lernte Deutsch.'), 'Er lernet Deutsch.'), RESULT.WRONG, 'another ending');
  assert.equal(grade(sentence('Wir spielen heute.'), 'Wir spielne heute.'), RESULT.WRONG, 'a verb’s last letters');
  assert.equal(grade(sentence('Sie kommt heute.'), 'Sei kommt heute.'), RESULT.WRONG, 'sie/sei');
  assert.equal(grade(sentence('Er holt dich ab.'), 'Er holt dcih ab.'), RESULT.WRONG, 'a short pronoun');
  assert.equal(grade(sentence('Ich kann heute nicht arbeiten.'), 'Ich kann heute nciht arbeiten.'), RESULT.WRONG, 'a negation');
  assert.equal(grade({ id: 's', type: 'fill_blank', answer: 'H-A-L-L-O', accepted: ['H-A-L-L-O'] }, 'H-A-L-O-L'), RESULT.WRONG, 'spelled');
  // A noun’s last two letters swapped inside a sentence are a slip: a swap changes no letter.
  assert.equal(grade(sentence('Der Rucksack ist gut.'), 'Der Rucksakc ist gut.'), RESULT.TYPO);
  assert.equal(grade(sentence('Die Tasche ist teuer.'), 'Die Tasceh ist teuer.'), RESULT.TYPO);
  // The rollout corpus’s own examples.
  assert.equal(grade(sentence('Meine Eltern wohnen in Bremen.'), 'Meine Eltren wohnen in Bremen.'), RESULT.TYPO);
  assert.equal(grade(sentence('Mein Bruder ist hier.'), 'Mein Brduer ist hier.'), RESULT.TYPO);
  assert.equal(grade(sentence('Ich bin in Bremen geboren.'), 'Ich bin in Bremen gebroen.'), RESULT.TYPO);
  // On a case task the capital is a letter of its own.
  const polite = { ...sentence('Wie geht es Ihnen heute?'), caseSensitive: true };
  assert.equal(grade(polite, 'Wie geht es Ihnen hetue?'), RESULT.TYPO);
  assert.equal(grade(polite, 'Wie geht es ihnen hetue?'), RESULT.WRONG);
});

test('a short content word takes two slip shapes; grammar words, nouns, vowels and last letters never', () => {
  const s = (answer) => ({ id: 'x', type: 'sentence_building', topic: 'adjectives', answer, accepted: [answer] });
  const gap = (answer) => ({ id: 'g', type: 'fill_blank', topic: 'verbs', questionDe: 'Tim, ___ jetzt!', answer, accepted: [answer] });
  assert.equal(grade(s('Ich bin alt.'), 'Ich bin at.'), RESULT.TYPO, 'a consonant dropped inside');
  assert.equal(grade(s('Er geht nach Hause.'), 'Er get nach Hause.'), RESULT.TYPO);
  assert.equal(grade(s('Er ist jung.'), 'Er ist jnug.'), RESULT.TYPO, 'two letters inside swapped');
  assert.equal(grade(gap('komm'), 'kom'), RESULT.TYPO);
  assert.equal(grade(s('Das Kind ist klein.'), 'Das Kid ist klein.'), RESULT.WRONG, 'a noun');
  assert.equal(grade(s('Es ist acht Uhr.'), 'Es ist acht Ur.'), RESULT.WRONG, 'a noun');
  assert.equal(grade(s('Der Mann ist hier.'), 'Der man ist hier.'), RESULT.WRONG);
  assert.equal(grade(s('Der Bus kommt.'), 'Der Bs kommt.'), RESULT.WRONG, 'a vowel');
  assert.equal(grade(s('Das ist gut.'), 'Das ist gu.'), RESULT.WRONG, 'the last letter');
  assert.equal(grade(s('Er ist arm.'), 'Er ist am.'), RESULT.WRONG, 'arm → am');
  assert.equal(grade(s('Ihr habt Zeit.'), 'Ihr hat Zeit.'), RESULT.WRONG, 'habt → hat');
  for (const [right, slip] of [['Das ist die Tasche.', 'Das ist di Tasche.'], ['Er ist hier.', 'Er is hier.'], ['Ich bin hier.', 'Ich bi hier.'], ['Wir sind hier.', 'Wr sind hier.'], ['Er kommt um acht.', 'Er kommt un acht.'], ['Er isst Brot.', 'Er ist Brot.']]) {
    assert.equal(grade(s(right), slip), RESULT.WRONG, `${slip} — a grammar word`);
  }
  assert.equal(grade({ id: 'z', type: 'fill_blank', answer: 'Zett', accepted: ['Zett'] }, 'Zet'), RESULT.WRONG, 'a letter name is a noun');
});

test('no short-word slip the checker forgives is itself a grammar word or another word the course shows', () => {
  const wordsOf = (t) => String(t).normalize('NFC').toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
  const lexicon = new Set([
    ...items.flatMap((i) => [i.questionDe, i.answer, ...(i.accepted || []), i.explanationDe].flatMap(wordsOf)),
    ...Object.values(CURRICULA).flatMap((c) => c.lektionen.flatMap((l) => [...l.dialog.lines.map((x) => x.de), ...l.wortfeld.map((w) => `${w.de} ${w.exampleDe || ''}`)].flatMap(wordsOf))),
  ]);
  const vowel = /[aeiouyäöüß]/;
  let forgiven = 0;
  for (const it of items) {
    for (const word of keysOf(it)[0].split(' ').map((w) => w.replace(/[.,!?;:„“"]/gu, ''))) {
      if (!/^\p{Ll}{3,4}$/u.test(word)) continue;
      const slips = [];
      for (let i = 1; i < word.length - 1; i += 1) if (!vowel.test(word[i])) slips.push(word.slice(0, i) + word.slice(i + 1));
      for (let i = 1; i < word.length - 2; i += 1) slips.push(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
      for (const slip of slips) {
        if (slip === word) continue;
        const r = checkAnswer(`Das ist ${slip} heute.`, [`Das ist ${word} heute.`], {}).result;
        if (r !== RESULT.TYPO) continue;
        forgiven += 1;
        assert.ok(!lexicon.has(slip), `«${slip}» for «${word}» is a word the course shows`);
      }
    }
  }
  assert.ok(forgiven > 0, 'the rule forgives some short slips');
});
