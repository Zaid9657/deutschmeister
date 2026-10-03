// Guard suite for the grammar the daily-sentence email teaches. Run with `npm test`.
//
// netlify/functions/data/daily-sentences.json is mailed to about 1,100 learners a
// day, one entry per day in a 30-day rotation (day of year mod 30), so every entry
// reaches the whole list once a month. Until 2026-10-03 five of the 30 hints taught
// wrong grammar, unchanged since 21c4503 (2026-04-11):
//   - "Das Paket wird morgen geliefert." was called Futur I passive. It is the
//     present-tense Vorgangspassiv; the Futur would be "wird geliefert werden".
//   - "seiner" in "Trotz seiner Müdigkeit" was called genitive masculine. It is
//     genitive feminine (die Müdigkeit); the masculine form is "seines".
//   - "Er behauptet, keine Zeit zu haben." was called accusative-and-infinitive.
//     An AcI takes a bare infinitive (Ich höre ihn singen); this is a zu-infinitive.
//   - "in dem" in "Das Haus, in dem wir wohnen" was called dative masculine.
//     Haus is neuter, so it is dative neuter.
//   - "Er fragte, ob sie Zeit hätte." was labelled Konjunktiv I. "hätte" is
//     Konjunktiv II; the Konjunktiv I is "habe".
//
// Each mistake is a class, so each is closed with a rule that runs over every entry,
// not with a list of entry numbers:
//   1. a text that names the Futur must show one: werden + an infinitive at the end;
//   2. a Konjunktiv I or II label must match a form of that Konjunktiv in the sentence;
//   3. "accusative-and-infinitive" (AcI) never labels a zu-infinitive;
//   4. "'<word>' is <case> <gender>" must name a cell of the paradigm in which that
//      word exists, and a relative pronoun's gender must be one its antecedent's
//      article allows.
// The pre-fix texts are kept below as fixtures, so each rule is shown to reject the
// mistake it was written for. The rules check the claims they can parse; a DaF
// reviewer still reads every new hint.
//
// The rules are deliberately narrow (closed word lists, a light parser). If one
// fails on German that is correct, the rule is too narrow: widen the rule here,
// with a case below, and never reword correct content to satisfy it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SENTENCES = JSON.parse(readFileSync(join(ROOT, 'netlify/functions/data/daily-sentences.json'), 'utf8'));

const words = (s) => s.toLowerCase().match(/\p{L}+/gu) ?? [];
const lastWord = (s) => words(s).at(-1) ?? '';

// ── Rule 1: Futur ─────────────────────────────────────────────────────────────
const WERDEN = new Set(['werde', 'wirst', 'wird', 'werden', 'werdet']);
// An infinitive ends in -en, -ern or -eln. A weak participle (geliefert,
// repariert) ends in -t, which is the confusion this rule exists for.
const INFINITIVE_END = /(?:en|ern|eln)$/;
// The two infinitives that do not end in -n after a vowel+e: sein, tun.
const SHORT_INFINITIVES = new Set(['sein', 'tun']);
const isInfinitive = (w) => INFINITIVE_END.test(w) || SHORT_INFINITIVES.has(w);
// The verb bracket closes at the end of a clause, so check each comma-separated
// clause (Ich werde kommen, wenn ich Zeit habe. / Wenn ..., werde ich kommen.).
const clauseEndsWithInfinitive = (s) => s.split(',').some((c) => isInfinitive(lastWord(c)));

function futurProblems({ sentence_de, hint, grammar_focus }) {
  if (!/\bFutur\b/i.test(`${grammar_focus} ${hint}`)) return [];
  const problems = [];
  if (!words(sentence_de).some((w) => WERDEN.has(w))) problems.push('names the Futur, but the sentence has no form of werden');
  if (!clauseEndsWithInfinitive(sentence_de)) {
    problems.push(`names the Futur, but the sentence ends in "${lastWord(sentence_de)}", not an infinitive (werden + participle is the Vorgangspassiv)`);
  }
  return problems;
}

// ── Rule 2: Konjunktiv ────────────────────────────────────────────────────────
// Forms that are Konjunktiv I in the third person and differ from the indicative.
const KONJ1 = new Set([
  'sei', 'seiest', 'seien', 'seiet', 'habe', 'habest', 'werde', 'werdest',
  'könne', 'müsse', 'dürfe', 'solle', 'wolle', 'möge', 'wisse',
  'gebe', 'komme', 'gehe', 'nehme', 'sehe', 'lese', 'fahre', 'finde', 'arbeite',
]);
// Konjunktiv II forms that differ from the Präteritum (so not sollte or wollte).
const KONJ2 = new Set([
  'hätte', 'hättest', 'hätten', 'hättet', 'wäre', 'wärest', 'wärst', 'wären', 'wäret', 'wärt',
  'würde', 'würdest', 'würden', 'würdet', 'könnte', 'könntest', 'könnten', 'könntet',
  'müsste', 'müsstest', 'müssten', 'dürfte', 'dürften', 'möchte', 'möchten',
  'käme', 'kämen', 'ginge', 'gingen', 'gäbe', 'gäben', 'wüsste', 'wüssten', 'ließe', 'bliebe', 'täte',
]);

function konjunktivProblems({ sentence_de, grammar_focus }) {
  const problems = [];
  const ws = words(sentence_de);
  if (/Konjunktiv I(?!I)\b/.test(grammar_focus)) {
    if (!ws.some((w) => KONJ1.has(w))) problems.push('labelled Konjunktiv I, but the sentence has no Konjunktiv I form');
    const k2 = ws.filter((w) => KONJ2.has(w));
    if (k2.length) problems.push(`labelled Konjunktiv I, but "${k2.join('", "')}" is Konjunktiv II`);
  }
  if (/Konjunktiv II\b/.test(grammar_focus) && !ws.some((w) => KONJ2.has(w))) {
    problems.push('labelled Konjunktiv II, but the sentence has no Konjunktiv II form');
  }
  return problems;
}

// ── Rule 3: accusative-and-infinitive ─────────────────────────────────────────
const ZU_PREPOSITION_DETERMINERS = new Set([
  'den', 'denen', 'einen', 'keinen', 'meinen', 'deinen', 'seinen', 'ihren', 'unseren', 'euren',
  'diesen', 'jenen', 'allen', 'welchen', 'beiden', 'vielen', 'manchen',
]);
function aciProblems({ sentence_de, hint, grammar_focus }) {
  if (!/accusative[\s-]+and[\s-]+infinitive|\bAcI\b|accusativus cum infinitivo/i.test(`${grammar_focus} ${hint}`)) return [];
  // zu + a dative determiner (zu den Eltern, zu meinen Freunden) is the preposition.
  const zu = [...sentence_de.matchAll(/\bzu\s+(\p{L}+(?:en|ern|eln))\b/gu)].find(([, w]) => !ZU_PREPOSITION_DETERMINERS.has(w.toLowerCase()));
  return zu ? [`calls a zu-infinitive ("${zu[0]}") an accusative-and-infinitive, which takes a bare infinitive`] : [];
}

// ── Rule 4: case and gender claims ────────────────────────────────────────────
const CASES = ['nominative', 'accusative', 'dative', 'genitive'];
const GENDERS = ['masculine', 'feminine', 'neuter', 'plural'];
// Definite article and relative pronoun, per case and gender.
const DER = {
  nominative: { masculine: ['der'], feminine: ['die'], neuter: ['das'], plural: ['die'] },
  accusative: { masculine: ['den'], feminine: ['die'], neuter: ['das'], plural: ['die'] },
  dative: { masculine: ['dem'], feminine: ['der'], neuter: ['dem'], plural: ['den', 'denen'] },
  genitive: { masculine: ['des', 'dessen'], feminine: ['der', 'deren'], neuter: ['des', 'dessen'], plural: ['der', 'deren'] },
};
const RELATIVE = new Set(['der', 'die', 'das', 'den', 'dem', 'denen', 'dessen', 'deren']);
// ein-words: the indefinite article, kein and the possessives, as stem + ending.
const EIN_STEMS = ['ein', 'kein', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'eur'];
const EIN = {
  nominative: { masculine: [''], feminine: ['e'], neuter: [''], plural: ['e'] },
  accusative: { masculine: ['en'], feminine: ['e'], neuter: [''], plural: ['e'] },
  dative: { masculine: ['em'], feminine: ['er'], neuter: ['em'], plural: ['en'] },
  genitive: { masculine: ['es'], feminine: ['er'], neuter: ['es'], plural: ['er'] },
};
// Which genders a noun can have, read from the article in front of it.
const ARTICLE_GENDERS = {
  der: ['masculine', 'feminine', 'plural'],
  die: ['feminine', 'plural'],
  das: ['neuter'],
  den: ['masculine', 'plural'],
  dem: ['masculine', 'neuter'],
  des: ['masculine', 'neuter'],
};

function fitsParadigm(word, kasus, gender) {
  const w = word.toLowerCase();
  if (DER[kasus][gender].includes(w)) return true;
  return EIN_STEMS.some((stem) => w.startsWith(stem) && EIN[kasus][gender].includes(w.slice(stem.length)));
}

const CLAIM = new RegExp(`'(\\p{L}+)' is (?:a |an |the )?(${CASES.join('|')}) (${GENDERS.join('|')})\\b`, 'giu');

function caseClaims(hint) {
  return [...hint.matchAll(CLAIM)].map(([, word, kasus, gender]) => ({ word, kasus: kasus.toLowerCase(), gender: gender.toLowerCase() }));
}

function caseClaimProblems({ sentence_de, hint, grammar_focus }) {
  const problems = [];
  // The antecedent of a relative clause: the noun right before the first comma.
  // No `i` flag: under /iu, \p{Lu} would also match lowercase words.
  const ante = sentence_de.match(/\b([Dd](?:er|ie|as|en|em|es))\s+\p{Lu}\p{L}*\s*,/u);
  for (const { word, kasus, gender } of caseClaims(hint)) {
    if (!fitsParadigm(word, kasus, gender)) {
      problems.push(`"${word}" is not a ${kasus} ${gender} form`);
    }
    if (/relative/i.test(grammar_focus) && RELATIVE.has(word.toLowerCase()) && ante) {
      const allowed = ARTICLE_GENDERS[ante[1].toLowerCase()];
      if (!allowed.includes(gender)) {
        problems.push(`the relative pronoun "${word}" is called ${gender}, but its antecedent "${ante[0].replace(/\s*,$/, '')}" is ${allowed.join(' or ')}`);
      }
    }
  }
  return problems;
}

const RULES = { futurProblems, konjunktivProblems, aciProblems, caseClaimProblems };

// The five entries as they were mailed until 2026-10-03.
const PRE_FIX = [
  { rule: 'futurProblems', sentence_de: 'Das Paket wird morgen geliefert.', hint: "Passive voice in Futur I — 'werden' does double duty for both future and passive here.", grammar_focus: 'Passive voice (Vorgangspassiv)' },
  { rule: 'caseClaimProblems', sentence_de: 'Trotz seiner Müdigkeit arbeitete er weiter.', hint: "'Trotz' takes the genitive — and 'seiner' is a genitive masculine possessive pronoun.", grammar_focus: 'Genitive preposition: trotz' },
  { rule: 'aciProblems', sentence_de: 'Er behauptet, keine Zeit zu haben.', hint: "Accusative-and-infinitive — 'keine Zeit zu haben' is the whole object of 'behauptet'.", grammar_focus: 'Infinitive clauses as objects' },
  { rule: 'caseClaimProblems', sentence_de: 'Das Haus, in dem wir wohnen, wurde 1920 gebaut.', hint: "A dative relative clause with a preposition — 'dem' is dative masculine because 'in' + dative = location.", grammar_focus: 'Relative clauses with prepositions (dative)' },
  { rule: 'konjunktivProblems', sentence_de: 'Er fragte, ob sie Zeit hätte.', hint: "Indirect speech with 'ob' shifts the verb to Konjunktiv I — the grammar of reported speech.", grammar_focus: 'Konjunktiv I in indirect speech' },
];

test('every entry has the four fields the mailer reads, and nothing the HTML would parse', () => {
  assert.ok(SENTENCES.length >= 30, 'the rotation has at least 30 entries');
  const seen = new Set();
  for (const s of SENTENCES) {
    for (const key of ['sentence_de', 'hint', 'level', 'grammar_focus']) {
      assert.equal(typeof s[key], 'string', `${key} on "${s.sentence_de}"`);
      assert.ok(s[key].trim(), `${key} is empty on "${s.sentence_de}"`);
      // daily-sentence.mjs interpolates these into the email HTML unescaped.
      assert.doesNotMatch(s[key], /[<>&]/, `${key} on "${s.sentence_de}" carries an HTML character`);
    }
    assert.match(s.level, /^(A1|A2|B1|B2)$/, `level on "${s.sentence_de}"`);
    assert.ok(!seen.has(s.sentence_de), `"${s.sentence_de}" appears twice`);
    seen.add(s.sentence_de);
  }
});

for (const [name, rule] of Object.entries(RULES)) {
  test(`${name}: no entry in the rotation breaks it`, () => {
    const found = SENTENCES.flatMap((s) => rule(s).map((p) => `"${s.sentence_de}": ${p}`));
    assert.deepEqual(found, []);
  });
}

test('each rule rejects the mistake it was written for (the pre-fix texts)', () => {
  for (const { rule, ...entry } of PRE_FIX) {
    assert.ok(RULES[rule](entry).length > 0, `${rule} accepts the pre-fix "${entry.sentence_de}"`);
  }
});

test('the case-claim parser reads the claims in the rotation (it is not silently vacuous)', () => {
  const claims = SENTENCES.flatMap((s) => caseClaims(s.hint));
  // At least one, so the rule is not vacuous; not an exact count, so rewording a
  // hint does not fail the suite.
  assert.ok(claims.length >= 1, `parsed ${claims.length} case/gender claims`);
  assert.deepEqual(caseClaims("'dem' is dative neuter"), [{ word: 'dem', kasus: 'dative', gender: 'neuter' }]);
  assert.equal(fitsParadigm('seines', 'genitive', 'masculine'), true);
  assert.equal(fitsParadigm('seiner', 'genitive', 'masculine'), false);
  assert.equal(fitsParadigm('Deren', 'genitive', 'feminine'), true);
});

test('the Futur and Konjunktiv rules accept the correct forms they guard', () => {
  assert.deepEqual(futurProblems({ sentence_de: 'Das Paket wird morgen geliefert werden.', hint: 'Futur I passive.', grammar_focus: 'Futur' }), []);
  assert.deepEqual(futurProblems({ sentence_de: 'Ich werde morgen früher aufstehen.', hint: '', grammar_focus: 'Futur I (werden + infinitive)' }), []);
  assert.deepEqual(konjunktivProblems({ sentence_de: 'Er fragte, ob sie Zeit habe.', grammar_focus: 'Konjunktiv I in indirect speech' }), []);
  assert.deepEqual(konjunktivProblems({ sentence_de: 'Wenn ich mehr Zeit hätte, würde ich lernen.', grammar_focus: 'Konjunktiv II' }), []);
  // Review of 9d1948c: correct German the first draft of these rules rejected.
  assert.deepEqual(futurProblems({ sentence_de: 'Er wird wohl krank sein.', hint: '', grammar_focus: 'Futur I (Vermutung)' }), []);
  assert.deepEqual(futurProblems({ sentence_de: 'Was wirst du morgen tun?', hint: '', grammar_focus: 'Futur I' }), []);
  assert.deepEqual(futurProblems({ sentence_de: 'Ich werde kommen, wenn ich Zeit habe.', hint: '', grammar_focus: 'Futur I' }), []);
  assert.deepEqual(aciProblems({ sentence_de: 'Ich sehe ihn zu den Kindern laufen.', hint: '', grammar_focus: 'AcI with sehen' }), []);
});
