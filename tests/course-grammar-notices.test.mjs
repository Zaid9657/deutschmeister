import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CURRICULA } from '../src/data/curricula/index.js';
import cards from '../scripts/rule-card-overrides.mjs';
import { RULE_CARDS } from '../netlify/functions/_shared/ruleCards.mjs';

const courses = ['a1.1', 'a1.2'].map((level) => CURRICULA[level]);
const notices = courses.flatMap((c) => c.lektionen.map((l) => ({ ...l.notice, at: `${c.level} L${l.nr}` })));
const plain = (text) => text.replaceAll('*', '');

// Semantic contracts for the reviewed rule/exception classes, applied to every
// notice rather than a list of affected lesson ids. Presence alone (bold words)
// cannot catch an exception missing from one language or a reversed claim.
const bilingualRules = [
  { name: 'alternative letter name', de: /Eszett oder scharfes S/, en: /Eszett or scharfes S/ },
  { name: 'gender cannot safely be inferred from meaning', de: /Bedeutung.*Genus nicht sicher/, en: /gender.*cannot be guessed from its meaning/ },
  { name: 'personal reference exception', de: /Bei bekannten Personen ist auch er oder sie möglich\./, en: /A known person can also be referred to with er\/sie\./ },
  { name: 'sibilant stem exception', de: /Stamm auf s\/ß\/x\/z: du-Form nur -t/, en: /stem ends in s\/ß\/x\/z.*du-form adds only -t/ },
  { name: 'sentence negation before the right bracket', de: /Satznegation.*vor dem letzten Verbteil des Satzes \(Vorsilbe\/Infinitiv\/Partizip\)/, en: /Sentence negation.*before the final verb part \(prefix\/infinitive\/participle\)/ },
  { name: 'sentence negation without a right bracket', de: /Ohne Verbteil auch am Satzende/, en: /Without a final verb part it can end the sentence/ },
  { name: 'contrastive word negation', de: /Wortnegation.*vor dem Wort: nicht heute, sondern morgen/, en: /Contrastive word negation.*precedes the contrast: nicht heute, sondern morgen/ },
  { name: 'emphatic imperative pronouns', de: /normalerweise ohne Pronomen; zur Betonung möglich/, en: /normally omit the pronoun; it is possible for emphasis/ },
  { name: 'imperative vowel exception', de: /Aus ä wird a/, en: /An ä becomes a/ },
  { name: 'imperative s stem', de: /Stamm auf s, fällt nur -t weg/, en: /stem ends in s, drop only -t/ },
  { name: 'participle prefix exception', de: /Ohne ge- bei be-, ver- und -ieren/, en: /No ge- with be-, ver- and -ieren/ },
];
const parityProblems = (ns) => ns.flatMap((n) => bilingualRules.flatMap((r) =>
  r.de.test(plain(n.bodyDe)) === r.en.test(plain(n.bodyEn)) ? [] : [`${n.at}: ${r.name}`],
));

test('every reviewed notice rule and exception has the same meaning in both languages', () => {
  assert.equal(notices.length, 24);
  assert.deepEqual(parityProblems(notices), []);
  for (const rule of bilingualRules) {
    const witnesses = notices.filter((n) => rule.de.test(plain(n.bodyDe)));
    assert.ok(witnesses.length, `${rule.name}: non-vacuous coverage`);
    for (const n of witnesses) {
      for (const [field, pattern] of [['bodyDe', rule.de], ['bodyEn', rule.en]]) {
        const mutant = { ...n, [field]: plain(n[field]).replace(pattern, '') };
        assert.ok(parityProblems([mutant]).some((p) => p.endsWith(rule.name)), `${rule.name}: deleting ${field} must fail`);
      }
    }
  }
  const person = notices.find((n) => n.ruleSlug === 'personal-pronouns');
  assert.ok(parityProblems([{ ...person, bodyDe: person.bodyDe.replace('ist auch er oder sie möglich', 'ist er oder sie nicht möglich') }]).length);
  assert.ok(parityProblems([{ ...person, bodyEn: person.bodyEn.replace('can also be referred to', 'cannot be referred to') }]).length);
});

test('pronoun defaults allow a known person; a grammatical er is never labelled a mistake', () => {
  const n = notices.find((x) => x.ruleSlug === 'personal-pronouns');
  for (const text of [n.bodyDe, n.bodyEn, cards['personal-pronouns'].content]) {
    assert.match(plain(text), /[Nn]ormal/);
    assert.match(plain(text), /Das Kind heißt Paul\. Er ist zwei\./);
  }
  for (const source of [cards, RULE_CARDS]) {
    const card = source['personal-pronouns'];
    assert.match(card.content, /bekannten Personen.*er oder sie/);
    assert.match(card.content, /English:.*known person.*er\/sie/);
    assert.doesNotMatch(JSON.stringify(card), /Der Artikel entscheidet, nicht die Person/);
    assert.ok(!card.commonMistakes.some((m) => m.wrong === 'Das Kind ist jung. Er ist zwei.'));
  }
});

test('negation notices and generated cards teach the verb bracket and contrast separately', () => {
  const n = notices.find((x) => x.ruleSlug === 'negation');
  for (const text of [n.bodyDe, n.bodyEn, cards.negation.content, RULE_CARDS.negation.content]) {
    assert.match(text, /Ich kaufe heute nicht ein\./);
    assert.match(text, /nicht heute, sondern morgen/);
    assert.match(text, /(?:Vorsilbe\/Infinitiv\/Partizip|prefix\/infinitive\/participle)/);
    assert.doesNotMatch(plain(text), /nicht steht am Satzende oder direkt vor dem Wort/);
  }
  for (const slug of ['personal-pronouns', 'negation']) assert.deepEqual(RULE_CARDS[slug], cards[slug]);
  for (const n of notices.filter((x) => x.ruleSlug === 'present-tense-regular')) {
    for (const text of [n.bodyDe, n.bodyEn]) assert.match(plain(text), /du tanzt/);
  }
});

const numeral = /^(?:null|eins?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(?:zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)|(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)hundert|erste|zweite|dritte|vierte|fünfte|sechste|siebte|achte|neunte|zehnte)$/;
const numeralCues = (items) => items.flatMap((item) => item.split(/\s+/).filter((w) => numeral.test(w.replaceAll('-', '').toLowerCase())));
const correctStress = (cue) => /^[A-ZÄÖÜ]+(?:-[a-zäöüß]+)*$/.test(cue);

test('every stress-marked numeral in both courses has neutral initial primary stress', () => {
  let count = 0;
  for (const course of courses) {
    const cues = numeralCues(course.lektionen.flatMap((l) => l.phonetik.items));
    assert.ok(cues.length >= 3, `${course.level}: numeral scan must not be empty`);
    for (const cue of cues) {
      assert.ok(correctStress(cue), `${course.level}: ${cue}`);
      count += 1;
    }
  }
  assert.ok(count >= 6);
  assert.deepEqual(numeralCues(['ein-und-ZWAN-zig']), ['ein-und-ZWAN-zig']);
  assert.equal(correctStress('ein-und-ZWAN-zig'), false);
  assert.equal(correctStress('EIN-und-zwan-zig'), true);
  assert.equal(correctStress('vier-HUN-dert'), false);
});

const informal = /\b(?:du|dir|dich|dein\w*|beantworte|schreib|lies|tippe|klicke|wähle|höre|prüfe|nutze)\b/i;
const runnerRoot = new URL('../src/pages/Modelltest/', import.meta.url);

test('all shared mock-test screens and checkpoint UI strings address Sie', () => {
  const files = readdirSync(runnerRoot).filter((f) => /\.jsx$/.test(f));
  assert.ok(files.includes('ModelltestRun.jsx'));
  for (const file of files) {
    const source = readFileSync(new URL(file, runnerRoot), 'utf8');
    // Comments are not UI copy. Every remaining line is covered, including
    // exhausted-playback messages and failure/retry paths.
    assert.doesNotMatch(source.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''), informal, file);
  }
  const strings = readFileSync(new URL('../src/lib/lesson/strings.js', import.meta.url), 'utf8');
  const assessment = strings.split('\n').filter((line) => /^\s*['"](?:checkpoint|test|exam)\.[\w.]+['"]\s*:/.test(line));
  assert.ok(assessment.length > 10, 'test UI string scan must not be vacuous');
  for (const line of assessment) assert.doesNotMatch(line, informal);
  assert.match('Keine Wiedergabe mehr — beantworte die Fragen', informal);
  const runner = readFileSync(new URL('ModelltestRun.jsx', runnerRoot), 'utf8');
  assert.match(runner, /beantworten Sie die Fragen\./);
});
