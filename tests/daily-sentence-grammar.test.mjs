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
//      article allows;
//   5. sentence_de is also the email subject, so it never addresses the learner with
//      du/dich/dir/dein/euch/euer (the product speaks Sie; 2026-10-03, old entry #9).
// DaF review round 2 (2026-10-03) added four more, one per class it found:
//   6. a je … desto hint shows the word order of both halves;
//   7. a sentence with the passive participle "worden" says it is not "geworden";
//   8. a zu-infinitive that hangs on a form of sein is named sein + zu, not left
//      as a plain "infinitive phrase";
//   9. a possessive in front of its noun is a possessive article, never a
//      "possessive pronoun".
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

// ── Rule 5: the sentence is the subject line, so it never says "du" ───────────
// Added 2026-10-03. daily-sentence.mjs mails `🇩🇪 ${sentence_de}` as the subject
// and prints the same sentence as the headline, so in the inbox the sentence is
// read as the product talking to the learner. The product speaks Sie (CLAUDE.md).
// Until 2026-10-03 one entry read "Das Buch, das ich dir empfohlen habe, ist
// ausverkauft.": "dir" to the reader, and what looks like a sold-out notice.
// The rule bans the informal second-person pronouns and possessives (du, ihr-plural
// forms) in every sentence_de. It reads whole words, not verb endings, so an
// imperative ("Komm mit!") still needs the DaF reviewer. "ihr" itself is left out
// because it is also "her" (ihr Buch) and "to her" (mit ihr); the formal "Sie" is
// allowed.
const INFORMAL_ADDRESS = /^(?:du|dich|dir|dein(?:e|en|em|er|es|s)?|euch|eu(?:er|re|ren|rem|rer|res))$/;

function informalAddressProblems({ sentence_de }) {
  const hits = words(sentence_de).filter((w) => INFORMAL_ADDRESS.test(w));
  return hits.length ? [`the email subject addresses the reader informally ("${hits.join('", "')}"); the product speaks Sie`] : [];
}

test('informalAddressProblems: no entry in the rotation breaks it', () => {
  const found = SENTENCES.flatMap((s) => informalAddressProblems(s).map((p) => `"${s.sentence_de}": ${p}`));
  assert.deepEqual(found, []);
});

test('informalAddressProblems rejects the pre-fix subject and reads only whole pronoun words', () => {
  assert.ok(informalAddressProblems({ sentence_de: 'Das Buch, das ich dir empfohlen habe, ist ausverkauft.' }).length > 0, 'the pre-fix #9');
  for (const s of ['Hast du Zeit?', 'Kommst Du mit?', 'Ich rufe dich morgen an.', 'Ist das dein Fahrrad?', 'Das ist deins.', 'Wir sehen euch morgen.', 'Ist das eure Wohnung?']) {
    assert.ok(informalAddressProblems({ sentence_de: s }).length > 0, `misses "${s}"`);
  }
  // Not informal address: the formal Sie, "ihr" as "her", third person, and words
  // that only begin like a pronoun (Dirigent, Dutzend, deutlich, Europa).
  for (const s of ['Können Sie mir helfen?', 'Sie hat ihr Buch vergessen.', 'Der Roman, den Anna empfohlen hat, ist sehr spannend.', 'Der Dirigent kauft ein Dutzend Eier.', 'Er spricht deutlich über Europa.']) {
    assert.deepEqual(informalAddressProblems({ sentence_de: s }), [], s);
  }
});

// ── Rules 6-9: DaF review round 2 (2026-10-03) ────────────────────────────────
// The second DaF review of the rotation found four more classes of loose or
// incomplete teaching, each mailed since 21c4503 (2026-04-11):
//   - "Je mehr er lernt, desto besser wird sein Deutsch." called je … desto a
//     "comparative intensifier" (not a standard term) and never said where the
//     verbs go, which is the whole difficulty of the construction;
//   - "Das Fenster ist geöffnet worden." listed "ist + participle + worden" but
//     never said the point: the passive participle is "worden", not "geworden";
//   - "Obwohl das Buch schwer zu verstehen ist, ..." called "zu verstehen" an
//     infinitive phrase; it is sein + zu + infinitive, a passive with a modal
//     meaning (= kann nur schwer verstanden werden);
//   - "Das Mädchen schreibt ihrem Freund einen Brief." called "ihrem" a possessive
//     pronoun; before a noun it is a possessive article (Possessivartikel), the
//     term the site's own A1.1 lesson uses.
// The level fixes in the same round (je … desto and trotz, B2 -> B1) have no rule:
// levels follow the DaF reviewer, not a parser.

// Rule 6. Only a full desto-clause is checked: "Je früher, desto besser." has no
// verb to place.
function jeDestoProblems({ sentence_de, hint }) {
  if (!/\bje\b/i.test(sentence_de) || !/\b(?:desto|umso)\s+\p{L}+\s+\p{L}+/iu.test(sentence_de)) return [];
  const problems = [];
  if (!/\bverb\b[^.]*\bend\b/i.test(hint)) problems.push('does not say that the verb of the je-clause goes to the end');
  if (!/'(?:desto|umso) [^']+'/i.test(hint)) problems.push('does not show the start of the desto-clause, where the finite verb follows desto + comparative');
  return problems;
}

// Rule 7. words() reads whole words, so "geworden" (Er ist Arzt geworden) is not "worden".
function wordenProblems({ sentence_de, hint }) {
  if (!words(sentence_de).includes('worden')) return [];
  return /\bgeworden\b/i.test(hint) ? [] : ["has the passive participle 'worden', but the hint never says it is 'worden', not 'geworden'"];
}

// Rule 8. Reads a claim "'… zu <infinitive>' is an infinitive phrase/clause" and
// checks the clause it sits in for a finite form of sein. A clause with "es" is
// skipped: there the zu-infinitive is usually an extraposed subject (Es ist wichtig
// zu üben), and that call stays with the DaF reviewer.
const SEIN_FINITE = new Set(['bin', 'bist', 'ist', 'sind', 'seid', 'war', 'warst', 'waren', 'wart', 'sei', 'seien', 'wäre', 'wären']);
const ZU_INFINITIVE_CLAIM = /'((?:\p{L}+\s+)*zu\s+\p{L}+)' is (?:a |an |the )?infinitive (?:phrase|clause|construction)/giu;

function seinZuProblems({ sentence_de, hint }) {
  const problems = [];
  for (const [, fragment] of hint.matchAll(ZU_INFINITIVE_CLAIM)) {
    const clause = sentence_de.split(',').find((c) => c.toLowerCase().includes(fragment.toLowerCase()));
    if (!clause) continue;
    const ws = words(clause);
    if (ws.includes('es') || !ws.some((w) => SEIN_FINITE.has(w))) continue;
    if (!/\bsein\s*\+\s*zu\b/i.test(hint)) {
      problems.push(`calls "${fragment}" an infinitive phrase, but it hangs on a form of sein: name sein + zu + infinitive (a passive with a modal meaning)`);
    }
  }
  return problems;
}

// Rule 9. A possessive followed by a capitalised word stands before its noun. The
// rule only fires when no possessive in the sentence stands alone (Das ist meins.),
// since then "possessive pronoun" may be the right term.
const POSSESSIVE = /^(?:mein|dein|sein|ihr|unser|euer|eur)(?:e|en|em|er|es|s)?$/;

function possessiveTermProblems({ sentence_de, hint, grammar_focus }) {
  if (!/possessive pronoun/i.test(`${grammar_focus} ${hint}`)) return [];
  const tokens = sentence_de.match(/\p{L}+/gu) ?? [];
  const possessives = tokens.flatMap((t, i) => (POSSESSIVE.test(t.toLowerCase()) ? [{ word: t, next: tokens[i + 1] ?? '' }] : []));
  if (!possessives.length || possessives.some(({ next }) => !/^\p{Lu}/u.test(next))) return [];
  return [`calls "${possessives.map(({ word }) => word).join('", "')}" a possessive pronoun, but it stands before its noun: a possessive article (Possessivartikel)`];
}

const RULES_ROUND_2 = { jeDestoProblems, wordenProblems, seinZuProblems, possessiveTermProblems };

// The four entries as they were mailed until this change.
const PRE_FIX_ROUND_2 = [
  { rule: 'jeDestoProblems', sentence_de: 'Je mehr er lernt, desto besser wird sein Deutsch.', hint: "'Je…desto' is a comparative intensifier — both parts need a comparative adjective or adverb.", grammar_focus: 'Je…desto comparative' },
  { rule: 'wordenProblems', sentence_de: 'Das Fenster ist geöffnet worden.', hint: 'Passive perfect tense: three verbs in a row — ist + past participle + worden.', grammar_focus: 'Passive Perfekt (worden)' },
  { rule: 'seinZuProblems', sentence_de: 'Obwohl das Buch schwer zu verstehen ist, liest sie es gern.', hint: "'Obwohl' sends its verb to the end — and 'zu verstehen' is an infinitive phrase within that clause.", grammar_focus: 'Obwohl + embedded infinitive phrase' },
  { rule: 'possessiveTermProblems', sentence_de: 'Das Mädchen schreibt ihrem Freund einen Brief.', hint: 'Three cases again — but this time with a possessive pronoun doing the heavy lifting.', grammar_focus: 'Possessive pronouns in dative' },
];

for (const [name, rule] of Object.entries(RULES_ROUND_2)) {
  test(`${name}: no entry in the rotation breaks it`, () => {
    const found = SENTENCES.flatMap((s) => rule(s).map((p) => `"${s.sentence_de}": ${p}`));
    assert.deepEqual(found, []);
  });
}

test('each round-2 rule rejects the mistake it was written for (the pre-fix texts)', () => {
  for (const { rule, ...entry } of PRE_FIX_ROUND_2) {
    assert.ok(RULES_ROUND_2[rule](entry).length > 0, `${rule} accepts the pre-fix "${entry.sentence_de}"`);
  }
});

test('the round-2 rules accept the correct German they must not fail', () => {
  // Rule 6: umso, another comparative, and the verbless short form.
  assert.deepEqual(jeDestoProblems({ sentence_de: 'Je älter man wird, umso weniger schläft man.', hint: "The verb of the je-clause goes to the end ('wird'); in 'umso weniger schläft' the finite verb follows the comparative." }), []);
  assert.deepEqual(jeDestoProblems({ sentence_de: 'Je früher, desto besser.', hint: 'A fixed short form with no verb.' }), []);
  // Rule 7: the full verb werden (geworden) is not the passive participle.
  assert.deepEqual(wordenProblems({ sentence_de: 'Er ist Arzt geworden.', hint: "Perfekt of 'werden' with 'sein'." }), []);
  assert.ok(wordenProblems({ sentence_de: 'Das Haus war 1920 gebaut worden.', hint: 'Passive Plusquamperfekt.' }).length > 0, 'misses a Plusquamperfekt passive');
  // Rule 8: a zu-infinitive with no sein in its clause, an extraposed subject after
  // "es", and the claim made correctly.
  assert.deepEqual(seinZuProblems({ sentence_de: 'Er behauptet, keine Zeit zu haben.', hint: "'keine Zeit zu haben' is an infinitive clause." }), []);
  assert.deepEqual(seinZuProblems({ sentence_de: 'Das Ziel ist, jeden Tag zu üben.', hint: "'jeden Tag zu üben' is an infinitive clause." }), []);
  assert.deepEqual(seinZuProblems({ sentence_de: 'Es ist wichtig zu üben.', hint: "'zu üben' is an infinitive clause, the real subject." }), []);
  assert.deepEqual(seinZuProblems({ sentence_de: 'Die Tür ist nicht zu öffnen.', hint: "'nicht zu öffnen' is an infinitive construction: sein + zu + infinitive." }), []);
  assert.ok(seinZuProblems({ sentence_de: 'Die Tür ist nicht zu öffnen.', hint: "'zu öffnen' is an infinitive phrase." }).length > 0, 'misses sein + zu in a main clause');
  // Rule 9: a possessive that stands alone, and the right term before a noun.
  assert.deepEqual(possessiveTermProblems({ sentence_de: 'Das ist nicht sein Buch, das ist meins.', hint: "'meins' is a possessive pronoun.", grammar_focus: 'Possessive pronouns' }), []);
  assert.deepEqual(possessiveTermProblems({ sentence_de: 'Die Frau schreibt ihrem Freund einen Brief.', hint: "'ihrem' is a possessive article.", grammar_focus: 'Possessive articles in the dative' }), []);
  assert.ok(possessiveTermProblems({ sentence_de: 'Wir besuchen unsere Großeltern.', hint: '', grammar_focus: 'Possessive pronouns (accusative)' }).length > 0, 'misses "unsere" before a noun');
});
