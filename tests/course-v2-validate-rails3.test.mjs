// course-v2 validator — the rails of the a1.1 unit reviews (rule-smith 2026-09-28, RAILS §3.1c).
//
// One passing and one failing fixture per rail. The fixtures are synthetic (a unit of a few lines built here),
// so a concurrent content edit cannot move them; where a rail was cut from a review finding, the failing
// fixture is the review's own quote, the passing one the fix. Run: node --test tests/course-v2-validate-rails3.test.mjs

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runRules, loadRules } from '../scripts/course-v2/lib-validate/runner.mjs';
import { emptyContext, ingest, addDoc, addDetectors } from '../scripts/course-v2/lib-validate/context.mjs';
import { detectInText, buildLexEnv, IHR_ONLY_VERBS, DETECTOR_OVERLAYS } from '../scripts/course-v2/lib-validate/detectors.mjs';
import { constituents, missingOrders, tilesBuildKey } from '../scripts/course-v2/lib-validate/orders.mjs';
import { knownCompound, FINITE_FIRST_PARTS } from '../scripts/course-v2/lib-validate/compounds.mjs';
import { stripFragments, INSTRUCTION_METALANGUAGE } from '../scripts/course-v2/lib-validate/metalanguage.mjs';
import { entriesKnownAt, knownForms } from '../scripts/course-v2/lib-validate/lexicon.mjs';
import { glossSet } from '../scripts/course-v2/rules/LEX-01.mjs';
import { answerClassCue, calqueWasSprechen } from '../scripts/course-v2/rules/ITM-01.mjs';
import { baselineSolver } from '../scripts/course-v2/rules/ITM-02.mjs';
import { DOUBLE_PLURALS } from '../scripts/course-v2/rules/ITM-06.mjs';
import { IDENTIFIER_RE } from '../scripts/course-v2/rules/ITM-07.mjs';
import { namesV1 } from '../scripts/course-v2/rules/ITM-09.mjs';
import { framePrintsPronoun, asksNegation } from '../scripts/course-v2/rules/ITM-12.mjs';
import { knownWrongForms, doubletTwins } from '../scripts/course-v2/rules/ITM-13.mjs';
import { phones, streets } from '../scripts/course-v2/rules/CON-01.mjs';
import { subordinateClauses } from '../scripts/course-v2/rules/TXT-01.mjs';
import { perAd, adsOf } from '../scripts/course-v2/rules/TXT-02.mjs';
import { quotedLine, SIE_FORM_RE } from '../scripts/course-v2/rules/TXT-04.mjs';
import { criterionCues, elicits, isPerformance, REQUEST_RE } from '../scripts/course-v2/rules/EXM-04.mjs';
import { suffixClaims, exhaustivePerfektClaim, positionColumnProblems, unconditionedPlacement, unquotedForms } from '../scripts/course-v2/rules/GRM-05.mjs';
import { cueHead, SPELLED_CHAIN_RE } from '../scripts/course-v2/rules/LEX-03.mjs';
import { learnerTurnGaps } from '../scripts/course-v2/rules/ALL-02.mjs';
import { teilName } from '../scripts/course-v2/rules/ALL-03.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const REG = join(REPO, 'content', 'course-v2', 'registries');
const REAL_DETECTORS = JSON.parse(readFileSync(join(REG, 'detectors.json'), 'utf8')).detectors;
const REAL_SPINE = JSON.parse(readFileSync(join(REG, 'grammar-spine.json'), 'utf8'));
const SD1 = JSON.parse(readFileSync(join(REG, 'lanes', 'sd1.json'), 'utf8'));
const RULES = await loadRules();

// ── harness ──────────────────────────────────────────────────────────────────────────────────

async function rule(id, bundle, { mode = 'file' } = {}) {
  const rep = await runRules({ ctx: bundle.ctx, docs: bundle.docs, levels: bundle.levels || [], mode, label: 'test', notes: [] }, { rules: RULES, only: [id] });
  const r = rep.results.find((x) => x.id === id);
  assert.ok(r, `rule ${id} did not run`);
  return r;
}
const messages = (r) => r.findings.map((f) => `${f.severity}: ${f.path} ${f.message}`).join('\n');
/** The findings of `r` whose message matches `re` (and severity, when given). */
const find = (r, re, severity = null) => r.findings.filter((f) => re.test(f.message) && (!severity || f.severity === severity));
function has(r, re, severity) {
  assert.ok(find(r, re, severity).length > 0, `${r.id}: no ${severity || ''} finding matching ${re}:\n${messages(r)}`);
}
function hasNot(r, re) {
  assert.equal(find(r, re).length, 0, `${r.id}: unexpected finding matching ${re}:\n${messages(r)}`);
}

const lx = (id, lemma, pos, unit, extra = {}) => ({ id, lemma, pos, role: 'productive', unit, block: 1, list_ref: 'A1', gloss: { en: lemma }, example: lemma, wordId: null, ...extra });
const PROFILE = { level: 'a1.1', band: 'a1', sentence: { meanWordsMax: 7, maxWords: 12, subordinateClausesMax: 0 }, microOutput: { seconds: [20, 30], words: [3, 16] } };
const CAST = {
  $schema: 'course-v2/casts@1',
  members: {
    'cast.priya': { name: 'Priya Nair', age: 28, from: 'Kochi, Indien', languages: ['Malayalam', 'Englisch', 'Deutsch'], contact: { phone: '0176 38 29 41 06', addresses: [{ de: 'Berliner Straße 21, 04105 Leipzig', from: 'a1.1-u01', until: null }] }, voice: { azure: 'de-DE-AmalaNeural' } },
    'cast.sophie': { name: 'Sophie Wagner', age: 24, from: 'Leipzig', languages: ['Deutsch'], voice: { azure: 'de-DE-KatjaNeural' } },
  },
};

/**
 * A context with the real spine, detectors and sd1 lane, an optional lexicon, cast, rule cards, curriculum and
 * level profile, and the given unit(s) — the first one is the target.
 */
function bundle({ units, lexicon = [], cards = null, cast = false, profile = true, curriculum = null, names = null }) {
  const ctx = emptyContext({ root: null, today: '2026-09-28' });
  ingest(ctx, REAL_SPINE, 'registries/grammar-spine.json');
  addDetectors(ctx, REAL_DETECTORS, 'registries/detectors.json');
  ingest(ctx, SD1, 'registries/lanes/sd1.json');
  if (profile) ingest(ctx, { $schema: 'course-v2/levels@1', levels: [PROFILE] }, 'fixture:level-profiles.json');
  if (lexicon.length) ingest(ctx, { $schema: 'course-v2/lexicon@1', level: 'a1.1', entries: lexicon }, 'fixture:a1.1/lexicon.json');
  if (cards) ingest(ctx, { $schema: 'course-v2/rulecards@1', level: 'a1.1', cards }, 'fixture:a1.1/rule-cards.json');
  if (cast) ingest(ctx, CAST, 'fixture:casts/series.json');
  if (curriculum) ctx.registries.curriculum = new Map([['a1.1', curriculum]]);
  if (names) ctx.registries.names = names;
  const docs = units.map((u, i) => addDoc(ctx, 'unit', { $schema: 'course-v2/unit@1', level: 'a1.1', status: 'draft', stage: 'T', spec: { grammar: { new: [], chunk: [], review: [] } }, ...u }, `fixture:a1.1/units/u${String(u.nr).padStart(2, '0')}.json`, { target: i === 0 }));
  return { ctx, docs: [docs[0]], levels: [ctx.levels.get('a1.1')] };
}
const unit = (nr, extra = {}) => ({ id: `a1.1-u${String(nr).padStart(2, '0')}`, nr, ...extra });
const expl = { de: 'So ist es richtig.', en: 'That is right.' };
const item = (id, extra) => ({ id, role: 'practice', topic: 'g.praesens', promptEn: 'Answer.', explanation: expl, origin: 'agent', ...extra });
const situation = (id, extra) => ({ id, kind: 'situation', ...extra });
const lines = (prefix, ...de) => de.map((x, i) => ({ id: `${prefix}-l${String(i + 1).padStart(2, '0')}`, speaker: 'cast.priya', de: x }));

// ── lib-validate: detectors, orders, compounds, metalanguage, lexicon ─────────────────────────

describe('detectors: notAfterIhrVerb reads only 2nd-person-plural forms (registry handoff, detectors.json final)', () => {
  const det = REAL_DETECTORS.find((d) => d.id === 'det.possessiv-sein-ihr-unser-euer');
  const hits = (s) => detectInText(det, s, buildLexEnv([])).length;
  test('fail (a hit): „Sie sucht ihr Handy.", „Sie backt ihr Brot." — a form shared with the 3rd person is no ihr-verb', () => {
    assert.ok(hits('Sie sucht ihr Handy.'));
    assert.ok(hits('Sie backt ihr Brot.'));
    assert.ok(!IHR_ONLY_VERBS.has('sucht') && !IHR_ONLY_VERBS.has('kommt'));
  });
  test('pass (no hit): „Habt ihr Zeit?", „Esst ihr Pizza?", „Mögt auch ihr Kuchen?"', () => {
    for (const s of ['Habt ihr Zeit?', 'Esst ihr Pizza?', 'Mögt auch ihr Kuchen?', 'Fahrt ihr Bus?']) assert.equal(hits(s), 0, s);
  });
  test('the overlays keep only scalar fields the registry does not carry', () => {
    for (const [idx, o] of Object.entries(DETECTOR_OVERLAYS)) {
      for (const [k, v] of Object.entries(o)) assert.ok(!Array.isArray(v) || k === 'lexicalNouns', `${idx}.${k} is a list — fold it into detectors.json`);
    }
  });
});

describe('orders: constituents and authored tiles (a1.1-u02 r2 F01, u06 r1 F10; SCHEMA §3.1 tiles on error_correction)', () => {
  test('the chunker keeps „um elf Uhr" and „zwei Kilo Äpfel" whole', () => {
    assert.deepEqual(constituents('Ich kaufe um elf Uhr zwei Kilo Äpfel.'), ['Ich', 'kaufe', 'um elf Uhr', 'zwei Kilo Äpfel']);
  });
  test('fail: a clause-final indefinite object after a time adverb owes the fronted order', () => {
    const owed = missingOrders({ tiles: ['ich', 'brauche', 'heute', 'einen Kuli'], answer: 'Ich brauche heute einen Kuli.', accepted: ['Ich brauche heute einen Kuli.'] });
    assert.ok(owed.some((o) => o.order === 'Heute brauche ich einen Kuli.'), JSON.stringify(owed));
  });
  test('pass: tiles that build the key; fail: tiles that do not', () => {
    assert.equal(tilesBuildKey({ tiles: ['heute', 'ich', 'arbeite'], answer: 'Heute arbeite ich.' }), true);
    assert.equal(tilesBuildKey({ tiles: ['heute', 'ich'], answer: 'Heute arbeite ich.' }), false);
  });
});

describe('compounds, metalanguage, glosses (a1.1-u01 r2, u05 r2 F08)', () => {
  test('fail→pass: „willkommen" is no will+kommen; „Radtour" is Rad+Tour', () => {
    assert.ok(FINITE_FIRST_PARTS.has('will'));
    assert.equal(knownCompound('willkommen', (w) => ['will', 'kommen'].includes(w)), null);
    assert.deepEqual(knownCompound('radtour', (w) => ['rad', 'tour'].includes(w)), ['rad', 'tour']);
  });
  test('a first-letter cue („H…") is stripped; the metalanguage list stays closed', () => {
    assert.ok(!/H…/.test(stripFragments('Schreiben Sie: H… ___ Tag')));
    assert.ok(INSTRUCTION_METALANGUAGE.length <= 140, `${INSTRUCTION_METALANGUAGE.length} metalanguage words`);
    assert.ok(INSTRUCTION_METALANGUAGE.includes('situation'));
  });
  test('a multi-word gloss glosses each word', () => {
    const g = glossSet(['Willkommen im Haus']);
    assert.ok(g.has('willkommen') && g.has('haus'));
  });
});

describe('lexicon: the lexicon outranks the floor; entriesKnownAt', () => {
  const lex = [lx('lx.erste', 'erste', 'ADJ', 'a1.1-u09'), lx('lx.frueher', 'früher', 'ADV', 'a1.1-u11'), lx('lx.mutter', 'Mutter', 'NOUN', 'a1.1-u03', { article: 'die', plural: 'Mütter', plural_kind: 'regular' })];
  test('fail: „erste" and „früher" are not known before their allocation; pass: after it', () => {
    const b = bundle({ units: [unit(4)], lexicon: lex });
    const early = knownForms(b.ctx, 'a1.1', 4);
    assert.ok(!early.has('erste') && !early.has('früher'));
    const late = knownForms(b.ctx, 'a1.1', 11);
    assert.ok(late.has('erste') && late.has('früher'));
  });
  test('entriesKnownAt: entries of later units are left out', () => {
    const b = bundle({ units: [unit(4)], lexicon: lex });
    assert.deepEqual(entriesKnownAt(b.ctx, 'a1.1', 4).map((e) => e.id), ['lx.mutter']);
  });
});

// ── ITM rules ────────────────────────────────────────────────────────────────────────────────

describe('ITM-01 third and fourth round (a1.1-u01 r1 F04, u11 r2 F02 / r3 F03, u12 r1 F02)', () => {
  const fb = (extra) => item('a1.1-u01-ls1-p01', { type: 'fill_blank', ...extra });
  test('answer class: fail „Write the city." with a German frame that fits any class; pass when promptDe says „Stadt"', async () => {
    assert.deepEqual(answerClassCue('Write the city.')?.phrase, 'city');
    assert.equal(answerClassCue('Complete the sentence.'), null);
    const bad = await rule('ITM-01', bundle({ units: [unit(1, { steps: [situation('a1.1-u01-ls1', { pool: { items: [fb({ promptDe: 'Priya wohnt in ___.', promptEn: 'Write the city.', answer: 'Leipzig', accepted: ['Leipzig'] })] } })] })] }));
    has(bad, /promptEn|city|Stadt/, 'blocker');
    const ok = await rule('ITM-01', bundle({ units: [unit(1, { steps: [situation('a1.1-u01-ls1', { pool: { items: [fb({ promptDe: 'Priya wohnt in ___. (Stadt)', promptEn: 'Write the city.', answer: 'Leipzig', accepted: ['Leipzig'] })] } })] })] }));
    hasNot(ok, /city/);
  });
  test('a bracketed cue that is the key: fail „(kommen)" → „kommen"; pass „(kommen)" → „kommt"', async () => {
    const run = (answer) => rule('ITM-01', bundle({ units: [unit(1, { steps: [situation('a1.1-u01-ls1', { pool: { items: [fb({ promptDe: `Woher ___ Sie? (kommen)`, answer, accepted: [answer] })] } })] })] }));
    has(await run('kommen'), /bracketed cue „kommen" is the key itself/, 'advisory');
    hasNot(await run('kommt'), /is the key itself/);
  });
  test('structured polarity: fail when the key alone opens with „Nein"; pass when the polarity is mixed', async () => {
    const run = (options) => rule('ITM-01', bundle({ units: [unit(11, { steps: [situation('a1.1-u11-ls1', { structuredInput: [item('a1.1-u11-ls1-s02', { type: 'multiple_choice', role: 'structured', promptDe: 'Sophie: „Ich war nicht in Berlin.“ Was stimmt?', options, answer: options[0], accepted: [options[0]] })] })] })] }));
    has(await run(['Nein, sie war nicht in Berlin.', 'Ja, sie war in Berlin.', 'Ja, sie war in Dresden.']), /odd one out/, 'advisory');
    hasNot(await run(['Nein, sie war nicht in Berlin.', 'Ja, sie war in Berlin.', 'Nein, sie war in Dresden.']), /odd one out/);
  });
  test('tense stimulus and question share the time word: fail „Heute … Gestern" in both; pass when only the stimulus has it', async () => {
    const run = (promptDe) => rule('ITM-01', bundle({ units: [unit(11, { steps: [situation('a1.1-u11-ls3', { structuredInput: [item('a1.1-u11-ls3-s03', { type: 'multiple_choice', role: 'structured', topic: 'g.perfekt-haben', promptDe, options: ['Sie hat gelesen.', 'Sie liest.', 'Sie las.'], answer: 'Sie hat gelesen.', accepted: ['Sie hat gelesen.'] })] })] })] }));
    has(await run('Sophie: „Gestern habe ich gelesen.“ Was hat Sophie gestern gemacht?'), /share the time word/, 'advisory');
    hasNot(await run('Sophie: „Gestern habe ich gelesen.“ Was hat Sophie gemacht?'), /share the time word/);
  });
  test('perfekt-aux-participle correction: fail the bare „Korrigieren Sie:"; pass „haben oder sein?"', async () => {
    const run = (promptDe) => rule('ITM-01', bundle({ units: [unit(12, { steps: [situation('a1.1-u12-ls1', { pool: { items: [item('a1.1-u12-ls1-p10', { type: 'error_correction', topic: 'g.perfekt-sein', promptDe, answer: 'Ich bin nach Leipzig geflogen.', accepted: ['Ich bin nach Leipzig geflogen.'], intentionalError: true, errorTag: 'perfekt-aux-participle' })] } })] })] }));
    has(await run('Korrigieren Sie: „Ich habe nach Leipzig geflogen.“'), /perfekt-aux-participle\) with a bare prompt/, 'blocker');
    hasNot(await run('haben oder sein? Korrigieren Sie: „Ich habe nach Leipzig geflogen.“'), /bare prompt/);
  });
  test('calque „Was spricht …?"', () => {
    assert.equal(calqueWasSprechen('Was spricht Priya?'), true);
    assert.equal(calqueWasSprechen('Welche Sprachen spricht Priya?'), false);
  });
});

describe('ITM-02 key echo and input distractors (a1.1-u08 r3 F05, u12 r2 F05)', () => {
  test('baseline solver: fail when the key alone repeats the quoted stem; pass without the echo', () => {
    assert.ok(baselineSolver({ type: 'multiple_choice', promptDe: 'Emre: „Ich kaufe Brot.“ Was kauft Emre?', options: ['Brot', 'Käse', 'Milch'], answer: 'Brot' }).length);
    assert.equal(baselineSolver({ type: 'multiple_choice', promptDe: 'Was kauft Emre?', options: ['Brot', 'Käse', 'Milch'], answer: 'Brot' }).length, 0);
  });
  test('a gist distractor the input never says: fail „Fotos aus Leipzig"; pass when the input names it', async () => {
    const run = (lineDe) => rule('ITM-02', bundle({ units: [unit(3, { steps: [situation('a1.1-u03-ls1', { input: { kind: 'dialog', lines: lines('a1.1-u03-ls1', 'Hier sind Fotos aus Charkiw.', lineDe) }, inputItems: [item('a1.1-u03-ls1-i01', { type: 'multiple_choice', role: 'gist', topic: 'hoeren', promptDe: 'Was zeigt Olena?', options: ['Fotos aus Charkiw', 'Fotos aus Leipzig', 'ein Formular'], answer: 'Fotos aus Charkiw', accepted: ['Fotos aus Charkiw'] })] })] })] }));
    has(await run('Das ist meine Familie.'), /never in the step's input/, 'advisory');
    hasNot(await run('Nicht aus Leipzig, und kein Formular!'), /never in the step's input/);
  });
});

describe('ITM-04 a name in an exam statement occurs in its text (a1.1-u11 r3 F04)', () => {
  const run = (statement) => rule('ITM-04', bundle({
    cast: true,
    names: [{ form: 'Leipzig', kind: 'place', level: 'a1.1' }],
    units: [unit(11, { steps: [{ id: 'a1.1-u11-ls4', kind: 'pruefung', texts: [{ id: 'a1.1-u11-ls4-t1', kind: 'audio', title: 'Nachricht', lines: lines('a1.1-u11-ls4-t1', 'Hallo, hier ist Sophie. Ich bin ab Mittwoch wieder da.') }], blocks: [{ id: 'a1.1-u11-ls4-sd1-h2', template: 'sd1.h2', textRefs: ['a1.1-u11-ls4-t1'], items: [item('a1.1-u11-ls4-sd1-h2-01', { type: 'richtig_falsch', role: 'exam', topic: 'hoeren', textRef: 'a1.1-u11-ls4-t1', promptDe: statement, options: ['richtig', 'falsch'], answer: 'richtig', accepted: ['richtig'] })] }] }] })],
  }));
  test('fail: „Sophie ist am Mittwoch wieder in Leipzig." (the text never names Leipzig)', async () => {
    has(await run('Sophie ist am Mittwoch wieder in Leipzig.'), /„Leipzig", which its text never names/, 'advisory');
  });
  test('pass: „Sophie ist am Mittwoch wieder da."', async () => {
    hasNot(await run('Sophie ist am Mittwoch wieder da.'), /never names/);
  });
});

describe('ITM-06 a double-plural noun (a1.1-u05 r3)', () => {
  const lex = [lx('lx.balkon', 'Balkon', 'NOUN', 'a1.1-u05', { article: 'der', plural: 'Balkone', plural_kind: 'regular' })];
  const run = (accepted) => rule('ITM-06', bundle({ lexicon: lex, units: [unit(5, { steps: [situation('a1.1-u05-ls1', { pool: { items: [item('a1.1-u05-ls1-p01', { type: 'fill_blank', topic: 'g.artikel-genus-plural', promptDe: 'Ein Balkon, zwei ___.', answer: 'Balkone', accepted })] } })] })] }));
  test('the registry lists both standard plurals', () => assert.deepEqual(DOUBLE_PLURALS.balkon, ['Balkone', 'Balkons']));
  test('fail: „Balkone" keyed, „Balkons" not accepted', async () => has(await run(['Balkone']), /Balkons/, 'blocker'));
  test('pass: both plurals accepted', async () => hasNot(await run(['Balkone', 'Balkons']), /Balkons/));
});

describe('ITM-07 identifiers and clock hours (a1.1-u01 r1 F05, u07 r1 F03)', () => {
  const run = (it, input = null) => rule('ITM-07', bundle({ units: [unit(7, { steps: [situation('a1.1-u07-ls1', { ...(input ? { input } : {}), pool: { items: [it] } })] })] }));
  test('identifier: fail „B 204" under exact number; pass under exact name', async () => {
    assert.ok(IDENTIFIER_RE.test('Raum B 204') && !IDENTIFIER_RE.test('204'));
    has(await run(item('a1.1-u01-ls1-p01', { type: 'fill_blank', promptDe: 'Der Kurs ist in Raum ___.', answer: 'B 204', accepted: ['B 204'], exact: 'number' })), /name/i, 'blocker');
    hasNot(await run(item('a1.1-u01-ls1-p01', { type: 'fill_blank', promptDe: 'Der Kurs ist in Raum ___.', answer: 'B 204', accepted: ['B 204'], exact: 'name' })), /exact/);
  });
  const hour = (extra) => item('a1.1-u07-ls1-i05', { type: 'fill_blank', role: 'detail', topic: 'hoeren', promptDe: 'Emre arbeitet bis ___ Uhr.', answer: '8', accepted: ['8', 'acht'], exact: 'number', ...extra });
  test('clock hour: blocker when the item says evening and „20" is not accepted', async () => {
    has(await run(hour({ explanation: { de: 'Emre arbeitet bis acht Uhr am Abend.', en: 'Until 8 pm.' } })), /evening hour/, 'blocker');
  });
  test('clock hour: ratchet when undecided; pass with „20" accepted, or when the text writes the time in digits', async () => {
    has(await run(hour()), /clock hour 1–12/, 'ratchet');
    hasNot(await run(hour({ accepted: ['8', 'acht', '20', 'zwanzig'], acceptedWhy: { 20: '24-Stunden-Uhr', zwanzig: '24-Stunden-Uhr' } })), /clock hour|evening/);
    hasNot(await run(hour(), { kind: 'dialog', lines: lines('a1.1-u07-ls1', 'Ich arbeite heute bis 8 Uhr.') }), /clock hour|evening/);
  });
});

describe('ITM-09 an error correction carries its tiles (SCHEMA §3.1, registry handoff)', () => {
  const ec = (extra) => item('a1.1-u06-ls1-p10', { type: 'error_correction', topic: 'g.verbposition-2', promptDe: 'Korrigieren Sie die Wortstellung: „Ich einen Kuli brauche heute.“', answer: 'Ich brauche heute einen Kuli.', intentionalError: true, errorTag: 'v2-inv', ...extra });
  const run = (it) => rule('ITM-09', bundle({ units: [unit(6, { steps: [situation('a1.1-u06-ls1', { pool: { items: [it] } })] })] }));
  test('fail: the tiles build „Heute brauche ich einen Kuli.", which is not accepted', async () => {
    has(await run(ec({ tiles: ['ich', 'brauche', 'heute', 'einen Kuli'], accepted: ['Ich brauche heute einen Kuli.'] })), /its tiles also build „Heute brauche ich einen Kuli\."/, 'blocker');
  });
  test('pass: the fronted order accepted', async () => {
    hasNot(await run(ec({ tiles: ['ich', 'brauche', 'heute', 'einen Kuli'], accepted: ['Ich brauche heute einen Kuli.', 'Heute brauche ich einen Kuli.'], acceptedWhy: { 'Heute brauche ich einen Kuli.': 'grammatisch: heute auf Position 1' } })), /tiles also build/);
  });
  test('advisory: tiles that do not build the key', async () => {
    has(await run(ec({ tiles: ['ich', 'brauche', 'einen Kuli'], accepted: ['Ich brauche heute einen Kuli.'] })), /do not build the key/, 'advisory');
  });
  test('a Ja/Nein-Frage prompt names the verb position', () => {
    assert.equal(namesV1('Bilden Sie eine Ja/Nein-Frage: Verb auf Position 1.'), true);
    assert.equal(namesV1('Bilden Sie die Frage.'), false);
  });
});

describe('ITM-11 a quotation in an explanation is exact (a1.1-u11 r2 F07)', () => {
  const run = (quote) => rule('ITM-11', bundle({ units: [unit(11, { steps: [situation('a1.1-u11-ls1', { input: { kind: 'dialog', lines: lines('a1.1-u11-ls1', 'Wir waren im Museum. Es war toll!') }, inputItems: [item('a1.1-u11-ls1-i03', { type: 'multiple_choice', role: 'detail', topic: 'hoeren', promptDe: 'Wo waren sie?', options: ['im Museum', 'im Kino', 'im Park'], answer: 'im Museum', accepted: ['im Museum'], explanation: { de: `Sophie sagt: „${quote}“`, en: 'She says so.' } })] })] })] }));
  test('fail: „Wir waren gestern im Museum." is not what the line says', async () => has(await run('Wir waren gestern im Museum.'), /as said or written/, 'advisory'));
  test('pass: an exact quotation, a cut marked „…"', async () => hasNot(await run('Wir waren im Museum. … toll!'), /as said or written/));
});

describe('ITM-12 error tags and repair pools (a1.1-u01 r1 F15, u03 r3 F04)', () => {
  const pid = 'g.negation-nicht';
  const point = REAL_SPINE.points.find((p) => p.id === pid);
  const nr = Number(String(point.intro.productive).slice(-2));
  const run = (reserve) => rule('ITM-12', bundle({ units: [unit(nr, { spec: { grammar: { new: [pid], chunk: [], review: [] } }, steps: [situation(`a1.1-u${String(nr).padStart(2, '0')}-ls1`, { reserve })] })] }));
  const r1 = (extra) => item('x-r01', { type: 'fill_blank', topic: pid, promptDe: 'Ich wohne ___ in Kochi.', answer: 'nicht', accepted: ['nicht'], ...extra });
  test('the helpers: a frame that prints the pronoun; the nicht-oder-kein question', () => {
    assert.equal(framePrintsPronoun('Kommst du ___ Indien?'), true);
    assert.equal(framePrintsPronoun('Kommst ___ aus Indien?'), false);
    assert.equal(asksNegation({ promptDe: 'nicht oder kein? Ich habe ___ Zeit.' }), true);
  });
  test('fail: an untagged reserve item, no repair pool', async () => {
    const r = await run([r1()]);
    has(r, /reserve item without an error tag/, 'ratchet');
    has(r, /no reserve item on it carries one of its error tags/, 'ratchet');
  });
  test('pass: a reserve item tagged with the point\'s error tag', async () => {
    const r = await run([r1({ errorTags: [point.errorTags[0]] })]);
    hasNot(r, /without an error tag|nothing to draw/);
  });
});

describe('ITM-13 known wrong forms and doublets (a1.1-u03 r2 F01, u08 r1 F03 / r2 F03)', () => {
  test('the wrong forms a learner would type', () => {
    assert.deepEqual(knownWrongForms('kommst', new Map([['kommst', 'komm']])).map((w) => w.form), ['kommt']);
    assert.deepEqual(knownWrongForms('meine').map((w) => w.form), ['deine', 'seine']);
  });
  test('doublets: „gerne" → „gern", „OK" → „Okay"', () => {
    assert.deepEqual(doubletTwins('Ich tanze gerne.'), ['Ich tanze gern.']);
    assert.ok(doubletTwins('OK, dann gehen wir!').includes('Okay, dann gehen wir!'));
    assert.deepEqual(doubletTwins('Ich komme.'), []);
  });
  const run = (it) => rule('ITM-13', bundle({ units: [unit(8, { steps: [situation('a1.1-u08-ls1', { pool: { items: [it] } })] })] }));
  test('fail: an unchanged error-correction source is graded CORRECT', async () => {
    has(await run(item('a1.1-u08-ls1-p10', { type: 'error_correction', promptDe: 'Korrigieren Sie: „Ich tanze gern.“', answer: 'Ich tanze gern.', accepted: ['Ich tanze gern.'], intentionalError: true, errorTag: 'word-order' })), /uncorrected sentence/, 'blocker');
  });
  test('pass: the doublet of a typed key is graded CORRECT (check.js foldDoublets)', async () => {
    hasNot(await run(item('a1.1-u08-c05', { type: 'fill_blank', promptDe: 'Ich tanze ___.', answer: 'gerne', accepted: ['gerne'] })), /doublet/);
  });
});

// ── CON / TXT ────────────────────────────────────────────────────────────────────────────────

describe('CON-01 cast consistency (a1.1-u02 r1 F16, u08 r1 F02, u09 r1 F08)', () => {
  const speaking = (turn) => ({ id: 'a1.1-u12-ls5', kind: 'sprechen', task: { bankKey: 'a11-u12-s', modelTurns: [{ speaker: 'learner', de: turn }], parts: [{ template: 'sd1.sp1', mode: 'monologue', situationDe: 'Priya stellt sich vor.' }] } });
  test('phones and streets', () => {
    assert.deepEqual(phones('Meine Nummer ist 0176 38 29 41 06.'), ['0176 38 29 41 06']);
    assert.deepEqual(phones('Das kostet 12,50 Euro.'), []);
    assert.equal(streets('Ich wohne in der Berliner Straße 21.')[0].nr, '21');
  });
  test('fail: Priya gives another number than the cast bible', async () => {
    has(await rule('CON-01', bundle({ cast: true, units: [unit(12, { steps: [speaking('Ich heiße Priya. Meine Nummer ist 0176 12 34 56 78.')] })] })), /cast bible/, 'ratchet');
  });
  test('pass: the bible\'s number', async () => {
    hasNot(await rule('CON-01', bundle({ cast: true, units: [unit(12, { steps: [speaking('Ich heiße Priya. Meine Nummer ist 0176 38 29 41 06.')] })] })), /cast bible/);
  });
  test('spec.cast: fail when a speaker is missing; pass when listed', async () => {
    const u = (cast) => unit(9, { spec: { cast, grammar: { new: [], chunk: [], review: [] } }, steps: [situation('a1.1-u09-ls1', { input: { kind: 'dialog', lines: lines('a1.1-u09-ls1', 'Hallo!') } })] });
    has(await rule('CON-01', bundle({ cast: true, units: [u([])] })), /not in spec\.cast/, 'advisory');
    hasNot(await rule('CON-01', bundle({ cast: true, units: [u(['cast.priya'])] })), /not in spec\.cast/);
  });
});

describe('TXT-01 sentence metrics (a1.1-u02 r1 F07, u06 r3 F05, u11 r2 F06)', () => {
  test('subordinate clauses: „…, das nicht stimmt" counts; a W-word before a quotation does not', () => {
    assert.equal(subordinateClauses('Klicken Sie vor dem Wort, das nicht stimmt.'), 1);
    assert.equal(subordinateClauses('Das ist Priya, sie kommt aus Indien.'), 0);
    assert.equal(subordinateClauses('Wie „er liest“.'), 0);
  });
  const run = (instructionsDe) => rule('TXT-01', bundle({ units: [unit(2, { steps: [{ id: 'a1.1-u02-ls4', kind: 'pruefung', blocks: [{ id: 'a1.1-u02-ls4-sd1-h1', template: 'sd1.h1', instructionsDe, textRefs: [], items: [] }] }] })] }));
  test('fail: a subordinate clause in an instruction at A1.1', async () => has(await run('Klicken Sie auf das Wort, das nicht stimmt.'), /subordinate clause/, 'ratchet'));
  test('pass: the same instruction without it', async () => hasNot(await run('Welches Wort ist falsch? Klicken Sie darauf.'), /subordinate clause/));
  test('an exam-text sentence over maxWords is an advisory', async () => {
    const r = await rule('TXT-01', bundle({ units: [unit(11, { steps: [{ id: 'a1.1-u11-ls4', kind: 'pruefung', texts: [{ id: 'a1.1-u11-ls4-t1', kind: 'text', title: 'Karte', text: 'Liebe Sophie, wir waren am Samstag mit Freunden und Kindern lange im großen Park in Leipzig.' }], blocks: [] }] })] }));
    has(r, /exam text: 1 sentence/, 'advisory');
  });
});

describe('TXT-02 / TXT-04 helpers (a1.1-u04 r1, u05 r2)', () => {
  test('per-ad measurement', () => {
    assert.equal(perAd({ source: 'textWords per ad' }), true);
    assert.equal(perAd({ source: 'textWords' }), false);
    assert.equal(adsOf('a) Zimmer frei.\nb) Sofa zu verkaufen.').length, 2);
  });
  test('a Sie form in a du line', () => {
    assert.equal(quotedLine('Fragen Sie Olena: Haben Sie einen Laptop?'), 'Haben Sie einen Laptop?');
    assert.equal(SIE_FORM_RE.test('Haben Sie einen Laptop?'), true);
    assert.equal(SIE_FORM_RE.test('Hast du einen Laptop?'), false);
  });
});

// ── EXM ──────────────────────────────────────────────────────────────────────────────────────

describe('EXM-03 Leitpunkt cues (a1.1-u11 r2 F05, u10 r1 F17)', () => {
  const lex = [lx('lx.kommen', 'kommen', 'VERB', 'a1.1-u01', { verb_forms: { '3sg': 'kommt', perfekt: 'ist gekommen' } })];
  const task = (cues) => ({ id: 'a1.1-u11-ls6', kind: 'schreiben', task: { bankKey: 'a11-u11-w', template: 'sd1.s2', register: 'informell', address: 'ihr', title: 'Nachricht', situationDe: 'Schreiben Sie.', taskDe: 'Schreiben Sie eine Nachricht.', leitpunkte: [{ id: 'lp2', de: 'Mit wem waren Sie dort?', cues }], checklist: ['Anrede: Hallo zusammen,', 'Punkt 1: Mit wem?', 'Gruß mit Ihrem Namen'], modelText: 'Hallo zusammen,\nich war mit Freunden dort.\nViele Grüße\nPriya', wordBand: [25, 35] } });
  test('fail: „zusammen" stands in the Anrede; „komme" misses „kommt"', async () => {
    const r = await rule('EXM-03', bundle({ lexicon: lex, units: [unit(11, { steps: [task(['zusammen', 'komme'])] })] }));
    has(r, /stands in the Anrede or Gruß/, 'advisory');
    has(r, /list the 3rd person „kommt"/, 'advisory');
  });
  test('pass: content cues', async () => {
    const r = await rule('EXM-03', bundle({ lexicon: lex, units: [unit(11, { steps: [task(['Freunden', 'Familie', 'komme', 'kommt'])] })] }));
    hasNot(r, /Anrede or Gruß|3rd person/);
  });
});

describe('EXM-04 criteria and requests (a1.1-u01 r1, u10 r2 F05)', () => {
  test('a performance criterion and its cues', () => {
    assert.equal(isPerformance({ label: 'Eine Nummer nennen' }), true);
    assert.equal(isPerformance({ label: 'Aussprache' }), false);
    assert.ok(elicits('Nennen Sie Ihre Telefonnummer.', criterionCues({ id: 'nummer', label: 'Eine Nummer nennen' })));
    assert.equal(elicits('keine Nummer', ['nummer']), false);
  });
  const task = (turn) => ({ id: 'a1.1-u10-ls5', kind: 'sprechen', task: { bankKey: 'a11-u10-s', hintWords: [], modelTurns: [{ speaker: 'partner', de: turn }], parts: [{ template: 'sd1.sp3', mode: 'cards-request', situationDe: 'Bitten Sie um etwas.', instructionsDe: 'Bitten Sie.' }] } });
  test('fail: „Haben Sie Wasser für mich?" offered for the cards-request Teil', async () => {
    assert.equal(REQUEST_RE.test('Haben Sie Wasser für mich?'), false);
    has(await rule('EXM-04', bundle({ units: [unit(10, { steps: [task('Haben Sie Wasser für mich?')] })] })), /bare question/, 'advisory');
  });
  test('pass: „Haben Sie bitte Wasser für mich?"', async () => {
    hasNot(await rule('EXM-04', bundle({ units: [unit(10, { steps: [task('Haben Sie bitte Wasser für mich?')] })] })), /bare question/);
  });
});

describe('EXM-01 a pictorial Teil in its text variant (a1.1-u09 r2 F04)', () => {
  const run = (lineDe) => rule('EXM-01', bundle({ units: [unit(9, { steps: [{ id: 'a1.1-u09-ls4', kind: 'pruefung', texts: [{ id: 'a1.1-u09-ls4-t6', kind: 'audio', title: 'Gespräch 6', lines: [{ id: 'a1.1-u09-ls4-t6-l01', speaker: 'cast.priya', de: lineDe }, { id: 'a1.1-u09-ls4-t6-l02', speaker: 'cast.sophie', de: 'Gern.' }] }], blocks: [{ id: 'a1.1-u09-ls4-sd1-h1', template: 'sd1.h1', length: 'reduced', instructionsDe: 'Sie hören die Texte zweimal.', textRefs: ['a1.1-u09-ls4-t6'], items: [item('a1.1-u09-ls4-sd1-h1-06', { type: 'abc', role: 'exam', topic: 'hoeren', textRef: 'a1.1-u09-ls4-t6', promptDe: 'Was isst der Mann?', options: ['Kuchen', 'Suppe', 'Salat'], answer: 'Salat', accepted: ['Salat'] })] }] }] })] }));
  test('fail: „Suppe" never heard', async () => has(await run('Ich bezahle den Salat und den Kuchen.'), /never occur in a1\.1-u09-ls4-t6/, 'advisory'));
  test('pass: every option heard', async () => hasNot(await run('Ich bezahle den Salat, meine Frau die Suppe und den Kuchen.'), /never occur in/));
});

// ── GRM ──────────────────────────────────────────────────────────────────────────────────────

describe('GRM-05 claims on a rule card (a1.1-u10 r1 F08, u11 r2 F01, u12 r2 F10, u08 r2 F07)', () => {
  const lex = [
    lx('lx.lehrer', 'Lehrer', 'NOUN', 'a1.1-u02', { article: 'der', plural: 'Lehrer', plural_kind: 'regular', feminine: 'die Lehrerin' }),
    lx('lx.mutter', 'Mutter', 'NOUN', 'a1.1-u03', { article: 'die', plural: 'Mütter', plural_kind: 'regular' }),
    lx('lx.aufstehen', 'aufstehen', 'VERB', 'a1.1-u07', { separable: true, verb_forms: { '3sg': 'steht auf', perfekt: 'ist aufgestanden' } }),
  ];
  const card = (extra) => ({ id: 'rc.test', spine: 'g.wortbildung-er-in', depth: 1, modelSentence: 'Er ist Lehrer.', de: 'Beruf und Person.', en: 'Jobs.', table: [['der', 'die'], ['Lehrer', 'Lehrerin']], caseMarks: [], ...extra });
  const run = (c) => rule('GRM-05', bundle({ lexicon: lex, cards: [c], units: [unit(10, { steps: [situation('a1.1-u10-ls3', { ruleCard: 'rc.test' })] })] }));
  test('the helpers', () => {
    assert.equal(suffixClaims('Wörter auf -er sind der.').length, 1);
    assert.equal(suffixClaims('Achtung: Nicht alle Wörter auf -er sind der.').length, 0);
    assert.ok(exhaustivePerfektClaim('Die anderen Verben haben haben.'));
    assert.equal(exhaustivePerfektClaim('Die meisten anderen Verben haben haben.'), null);
    assert.equal(positionColumnProblems([['Position 2', 'Ende'], ['Ich habe', 'gemacht.']]).length, 2);
    assert.deepEqual(positionColumnProblems([['Position 1', 'Position 2'], ['Ich', 'habe']]), []);
    assert.equal(unconditionedPlacement('nicht steht nach dem Verb.').word, 'nicht');
    assert.equal(unconditionedPlacement('Das Verb steht am Ende.'), null);
  });
  test('fail: „Wörter auf -er sind der." with „die Mutter" known', async () => has(await run(card({ de: 'Wörter auf -er sind der: der Lehrer.' })), /die Mutter/, 'ratchet'));
  test('pass: the exception named in an Achtung line', async () => hasNot(await run(card({ de: 'Wörter auf -er sind der: der Lehrer. Achtung: die Mutter.' })), /Achtung:" line/));
  test('fail: „Die anderen Verben haben haben." with „aufstehen" known; pass when named', async () => {
    has(await run(card({ de: 'Die anderen Verben haben haben: ich habe gemacht.' })), /aufstehen/, 'ratchet');
    hasNot(await run(card({ de: 'Die anderen Verben haben haben: ich habe gemacht. Aber: aufstehen.' })), /Perfekt with sein/);
  });
  test('fail: a „Position 2" column without „Position 1"; pass with it', async () => {
    has(await run(card({ table: [['Position 2', 'Ende'], ['Ich habe', 'gemacht.']] })), /no „Position 1" column/, 'ratchet');
    hasNot(await run(card({ table: [['Position 1', 'Position 2', 'Ende'], ['Ich', 'habe', 'gemacht.']] })), /Position/);
  });
  test('advisory: the calque on a card', async () => {
    has(await run(card({ table: [['Position 1', 'Position 2'], ['Was', 'sprechen Sie?']] })), /calque/, 'advisory');
  });
});

describe('GRM-02 a productive point is recycled in the band (a1.1-u08 r1 F08)', () => {
  const pid = 'g.nicht-position-gern';
  const point = REAL_SPINE.points.find((p) => p.id === pid);
  const nr = Number(String(point.intro.productive).slice(-2));
  const run = (review) => rule('GRM-02', bundle({ units: [unit(nr, { spec: { grammar: { new: [pid], chunk: [], review: [] } } }), unit(nr + 1, { spec: { grammar: { new: [], chunk: [], review } } })] }));
  test('fail: no later unit reviews it', async () => has(await run([]), /plan its recycling/, 'advisory'));
  test('pass: a later unit lists it under review', async () => hasNot(await run([pid]), /plan its recycling/));
});

// ── LEX / ALL ────────────────────────────────────────────────────────────────────────────────

describe('LEX-03 bracketed cues and spelled chains (a1.1-u07 r2 F05, u10 r2 F03, u02 r3)', () => {
  test('the head of a cue', () => {
    assert.equal(cueHead('der Kellner → die …'), 'Kellner');
    assert.equal(cueHead('die Teilnehmerin, Plural'), 'Teilnehmerin');
    assert.equal(cueHead('aufmachen'), 'aufmachen');
    assert.equal(cueHead('wohn-'), 'wohn-');
    assert.ok(SPELLED_CHAIN_RE.test('b-e-r-i-s-h-a') && !SPELLED_CHAIN_RE.test('e-mail'));
  });
  const lex = [
    lx('lx.kellner', 'Kellner', 'NOUN', 'a1.1-u02', { article: 'der', plural: 'Kellner', plural_kind: 'regular', feminine: 'die Kellnerin', role: 'receptive' }),
    lx('lx.aufmachen', 'aufmachen', 'VERB', 'a1.1-u09', { separable: true, verb_forms: { '3sg': 'macht auf', perfekt: 'hat aufgemacht' } }),
  ];
  const run = (promptDe, answer) => rule('LEX-03', bundle({ lexicon: lex, units: [unit(7, { steps: [situation('a1.1-u07-ls3', { pool: { items: [item('a1.1-u07-ls3-p02', { type: 'fill_blank', topic: 'g.trennbare-verben', promptDe, answer, accepted: [answer] })] } })] })] }));
  test('fail: „(aufmachen)" allocated only later', async () => has(await run('Das Geschäft ___ um acht auf. (aufmachen)', 'macht'), /allocated only at a1\.1-u09/, 'advisory'));
  test('fail: „(der Kellner → die …)" resolves to a receptive lemma', async () => has(await run('Sie ist ___. (der Kellner → die …)', 'Kellnerin'), /bracketed lemma/, 'advisory'));
  test('pass: a stem cue of a known verb', async () => hasNot(await run('Ich ___ in Leipzig. (wohn-)', 'wohne'), /bracketed/));
});

describe('ALL-02 the learner\'s model turns perform the can-do (a1.1-u10 r1 F07, u07 r1 F02)', () => {
  test('fail: an answer can-do whose learner turns only ask; pass when one answers', () => {
    assert.deepEqual(learnerTurnGaps('Ich kann fragen, ob ein Platz frei ist, und antworten.', ['Ist hier noch frei?']), ['answer (every learner turn is a question)']);
    assert.deepEqual(learnerTurnGaps('Ich kann fragen, ob ein Platz frei ist, und antworten.', ['Ist hier noch frei?', 'Ja, bitte.']), []);
  });
  test('fail: „fragen, wie spät es ist" and no „Wie spät …?"; pass with it', () => {
    assert.equal(learnerTurnGaps('Ich kann fragen, wie spät es ist.', ['Wann kommt der Bus?']).length, 1);
    assert.deepEqual(learnerTurnGaps('Ich kann fragen, wie spät es ist.', ['Entschuldigung, wie spät ist es?']), []);
  });
});

describe('ALL-03 a Prüfungsfokus Teil the plan does not list is named (a1.1-u09 r1 F07)', () => {
  const plan = [{ nr: 8, id: 'a1.1-u08', examTeile: ['Goethe A1 Hören Teil 1', 'Goethe A1 Sprechen Teil 2'] }];
  const u = (reason) => unit(8, { spec: { grammar: { new: [], chunk: [], review: [] }, lehrwerk: ['M A1 L7', 'S1 L6'], deviation: reason ? { reason } : null, lanes: { primary: 'sd1', pruefungsfokus: [{ template: 'sd1.h3', length: 'full', slot: 'ls4' }] } } });
  test('teilName', () => assert.equal(teilName('sd1.h3', { module: 'hoeren' }), 'Hören Teil 3'));
  test('fail: sd1.h3 and no reason', async () => has(await rule('ALL-03', bundle({ curriculum: plan, units: [u(null)] })), /not in the plan's examTeile/, 'advisory'));
  test('pass: the reason names „Hören Teil 3"', async () => hasNot(await rule('ALL-03', bundle({ curriculum: plan, units: [u('Statt Hören Teil 1 übt LS4 Hören Teil 3.')] })), /examTeile/));
});

describe('LEX-07 a person an example names (a1.1-u08 r1 F05)', () => {
  const run = (example) => rule('LEX-07', bundle({ cast: true, lexicon: [lx('lx.absagen', 'absagen', 'VERB', 'a1.1-u08', { separable: true, verb_forms: { '3sg': 'sagt ab', perfekt: 'hat abgesagt' }, example, exampleEn: 'x' })], units: [unit(8)] }), { mode: 'level' });
  test('fail: „Frau Kowalski sagt den Termin ab."', async () => has(await run('Frau Kowalski sagt den Termin ab.'), /„Frau Kowalski", who is neither/, 'advisory'));
  test('pass: a cast member („Frau Nair")', async () => hasNot(await run('Frau Nair sagt den Termin ab.'), /who is neither/));
});

// ── the third round's rails (u01–u06), pinned here with the fourth's ─────────────────────────

describe('GRM-04 metalanguage: the can-do frame is not a modal (a1.1-u01 r1/r2, u03 r2)', () => {
  test('fail: „Sie können hier warten." in an input line before g.koennen', async () => {
    const r = await rule('GRM-04', bundle({ units: [unit(1, { steps: [situation('a1.1-u01-ls1', { input: { kind: 'dialog', lines: lines('a1.1-u01-ls1', 'Sie können hier warten.') } })] })] }));
    assert.ok(r.findings.some((f) => f.id === 'det.modal-koennen'), messages(r));
  });
  test('pass: „Sie können sich vorstellen." as title.canDo', async () => {
    const r = await rule('GRM-04', bundle({ units: [unit(1, { title: { de: 'Hallo!', canDo: 'Sie können sich vorstellen.' } })] }));
    assert.ok(!r.findings.some((f) => f.id === 'det.modal-koennen'), messages(r));
  });
});

describe('ALL-02 a proof may name a micro-output (SCHEMA §8 Check.proofs[].microOutput)', () => {
  const u = (microOutput) => unit(1, { spec: { canDos: [], grammar: { new: [], chunk: [], review: [] } }, steps: [situation('a1.1-u01-ls1', { microOutput: { id: 'a1.1-u01-ls1-mo', kind: 'speak', promptDe: 'Stellen Sie sich vor.', words: [5, 12], seconds: [20, 30] } })], check: { items: [], proofs: [{ canDo: 'cd.a1.sich-vorstellen', microOutput }] } });
  test('fail: a micro-output the unit does not have', async () => has(await rule('ALL-02', bundle({ units: [u('a1.1-u01-ls9-mo')] })), /not a micro-output of the unit/, 'blocker'));
  test('pass: the unit\'s own micro-output', async () => hasNot(await rule('ALL-02', bundle({ units: [u('a1.1-u01-ls1-mo')] })), /not a micro-output|names neither/));
});

describe('ITM-10 form fields: acceptedWhy names accepted forms (SCHEMA §8 WritingTask.form)', () => {
  const task = (acceptedWhy) => ({ id: 'a1.1-u02-ls6', kind: 'schreiben', task: { bankKey: 'a11-u02-w', template: 'sd1.s1', form: { fields: [{ id: 'f1', labelDe: 'Postleitzahl', answer: '04105', accepted: ['04105'], acceptedWhy, exact: 'number' }] } } });
  test('fail: acceptedWhy explains a form that is not accepted', async () => has(await rule('ITM-10', bundle({ units: [unit(2, { steps: [task({ '4105': 'ohne Null' })] })] })), /not an accepted form of field f1/, 'blocker'));
  test('pass: acceptedWhy explains an accepted form', async () => hasNot(await rule('ITM-10', bundle({ units: [unit(2, { steps: [task({ '04105': 'die Postleitzahl' })] })] })), /field f1/));
});

describe('TXT-03 a micro-output inside the level band (a1.1-u03 r2)', () => {
  const run = (words) => rule('TXT-03', bundle({ units: [unit(3, { steps: [situation('a1.1-u03-ls1', { microOutput: { id: 'a1.1-u03-ls1-mo', kind: 'speak', promptDe: 'Sprechen Sie.', words, seconds: [20, 30] } })] })] }));
  test('fail: words [3, 30] at a1.1 (band [3, 16])', async () => has(await run([3, 30]), /outside the a1\.1 micro-output band/, 'advisory'));
  test('pass: words [5, 12]', async () => hasNot(await run([5, 12]), /micro-output band/));
});

describe('EXM-01 speakers per text (TeilTemplate speakers, SCHEMA §4.3)', () => {
  const run = (speakers) => rule('EXM-01', bundle({ units: [unit(9, { steps: [{ id: 'a1.1-u09-ls4', kind: 'pruefung', texts: [{ id: 'a1.1-u09-ls4-t1', kind: 'audio', title: 'Gespräch', lines: speakers.map((sp, i) => ({ id: `a1.1-u09-ls4-t1-l0${i + 1}`, speaker: sp, de: 'Was kostet der Kuchen?' })) }], blocks: [{ id: 'a1.1-u09-ls4-sd1-h1', template: 'sd1.h1', length: 'reduced', instructionsDe: 'Sie hören die Texte zweimal.', textRefs: ['a1.1-u09-ls4-t1'], items: [item('a1.1-u09-ls4-sd1-h1-01', { type: 'abc', role: 'exam', topic: 'hoeren', textRef: 'a1.1-u09-ls4-t1', promptDe: 'Was kostet?', options: ['der Kuchen', 'der Kuchen und', 'Kuchen'], answer: 'der Kuchen', accepted: ['der Kuchen'] })] }] }] })] }));
  test('fail: one voice in an sd1.h1 text', async () => has(await run(['cast.priya', 'cast.priya']), /1 speaker\(s\)/, 'advisory'));
  test('pass: two voices', async () => hasNot(await run(['cast.priya', 'cast.sophie']), /speaker\(s\)/));
});

describe('EXM-03 a form answer that mixes words and a number is not a name (a1.1-u02 r2)', () => {
  const run = (exact) => rule('EXM-03', bundle({ units: [unit(2, { steps: [{ id: 'a1.1-u02-ls6', kind: 'schreiben', task: { bankKey: 'a11-u02-w', template: 'sd1.s1', form: { fields: [{ id: 'f1', labelDe: 'Straße', answer: 'Berliner Straße 21', accepted: ['Berliner Straße 21'], exact }] } } }] })] }));
  test('fail: exact „name" on „Berliner Straße 21"', async () => has(await run('name'), /mixes words and a number/, 'advisory'));
  test('pass: exact „number"', async () => hasNot(await run('number'), /mixes words and a number/));
});

describe('GRM-05 a cited form is quoted (a1.1-u01 r1 F06, u03 r2 F07)', () => {
  const card = (de) => ({ id: 'rc.praesens', de, table: [['Person', 'Verb'], ['ich', 'komme'], ['du', 'kommst']] });
  test('fail: „Nach du steht kommst."', () => assert.ok(unquotedForms(card('Nach du steht kommst.')).length));
  test('pass: „Nach „du" steht „kommst"."', () => assert.deepEqual(unquotedForms(card('Nach „du“ steht „kommst“.')), []));
});

describe('LEX-01 / LEX-03 pluralVariants are known forms (SCHEMA §6, 2026-09-28)', () => {
  // (a genitive -s makes „Balkons" a form anyway; „Kommata" comes only from the variant)
  const lex = (extra) => [lx('lx.komma', 'Komma', 'NOUN', 'a1.1-u05', { article: 'das', plural: 'Kommas', plural_kind: 'regular', ...extra })];
  test('fail: without pluralVariants „Kommata" is unknown', () => assert.equal(knownForms(bundle({ units: [unit(5)], lexicon: lex({}) }).ctx, 'a1.1', 5).has('kommata'), false));
  test('pass: with pluralVariants', () => assert.equal(knownForms(bundle({ units: [unit(5)], lexicon: lex({ pluralVariants: ['Kommata'] }) }).ctx, 'a1.1', 5).has('kommata'), true));
});

describe('ITM-01 a same-form plural behind a plural-capable cue (a1.1-u04 r2 F03)', () => {
  const lex = [lx('lx.lehrer', 'Lehrer', 'NOUN', 'a1.1-u02', { article: 'der', plural: 'Lehrer', plural_kind: 'regular', feminine: 'die Lehrerin' })];
  const run = (accepted, acceptedWhy) => rule('ITM-01', bundle({ lexicon: lex, units: [unit(6, { steps: [situation('a1.1-u06-ls1', { pool: { items: [item('a1.1-u06-ls1-p03', { type: 'fill_blank', topic: 'g.possessiv-mein-dein', promptDe: 'Ich suche ___ Lehrer. (mein)', answer: 'meinen', accepted, ...(acceptedWhy ? { acceptedWhy } : {}) })] } })] })] }));
  test('fail: „meinen Lehrer" keyed, „meine Lehrer" not accepted', async () => has(await run(['meinen']), /same form in the plural/, 'blocker'));
  test('pass: the plural accepted', async () => hasNot(await run(['meinen', 'meine'], { meine: 'grammatisch: Plural' }), /same form in the plural/));
});

describe('EXM-04 a performance the rubric scores is asked for (a1.1-u01 r1/r2)', () => {
  const RUBRIC = JSON.parse(readFileSync(join(REG, 'rubrics', 'speaking', 'sd1-sp1.json'), 'utf8'));
  const run = (instructionsDe) => {
    const b = bundle({ units: [unit(1, { spec: { grammar: { new: [], chunk: [], review: [] }, lanes: { primary: 'sd1', pruefungsfokus: [{ template: 'sd1.sp1', length: 'full', slot: 'sprechen' }] } }, steps: [{ id: 'a1.1-u01-ls5', kind: 'sprechen', task: { bankKey: 'a11-u01-s', lane: 'sd1', parts: [{ template: 'sd1.sp1', mode: 'monologue', profile: 'sd1-sp1', situationDe: 'Im Kurs.', instructionsDe }] } }] })] });
    ingest(b.ctx, RUBRIC, 'registries/rubrics/speaking/sd1-sp1.json');
    return rule('EXM-04', b);
  };
  test('fail: only „Stellen Sie sich vor." — buchstabieren and nummer are scored, never asked', async () => has(await run('Stellen Sie sich vor.'), /performance nobody requested/, 'blocker'));
  test('pass: all three asked', async () => hasNot(await run('Stellen Sie sich vor. Buchstabieren Sie Ihren Namen und nennen Sie Ihre Telefonnummer.'), /performance nobody requested/));
});

describe('LEX-03 a produced lemma is productive (the class of eight a1.1 units)', () => {
  const lex = (role) => [lx('lx.birne', 'Birne', 'NOUN', 'a1.1-u04', { article: 'die', plural: 'Birnen', plural_kind: 'regular', role }), lx('lx.moechten', 'möchten', 'VERB', 'a1.1-u04', { verb_forms: { '3sg': 'möchte' } })];
  const run = (role) => rule('LEX-03', bundle({ lexicon: lex(role), units: [unit(4, { redemittel: [{ id: 'a1.1-u04-rm01', de: 'Ich möchte eine Birne.', en: 'I would like a pear.', function: 'etwas kaufen' }] })] }));
  test('fail: a receptive lemma in a Redemittel', async () => has(await run('receptive'), /asked to produce „Birne"/, 'ratchet'));
  test('pass: productive', async () => hasNot(await run('productive'), /asked to produce/));
});

describe('LEX-03 a productive phrase covers its words (a1.1-u01: „Guten Tag!" before lx.tag)', () => {
  const lex = [lx('lx.guten-tag', 'guten Tag', 'PHRASE', 'a1.1-u01'), lx('lx.tag', 'Tag', 'NOUN', 'a1.1-u07', { article: 'der', plural: 'Tage', plural_kind: 'regular' })];
  const run = (de) => rule('LEX-03', bundle({ lexicon: lex, units: [unit(1, { redemittel: [{ id: 'a1.1-u01-rm01', de, en: 'x', function: 'begrüßen' }] })] }));
  test('fail: „Der Tag ist schön." — Tag is allocated at u07', async () => has(await run('Der Tag ist schön.'), /asked to produce „Tag"/, 'ratchet'));
  test('pass: „Guten Tag!" — the phrase is productive at u01', async () => hasNot(await run('Guten Tag!'), /asked to produce „Tag"/));
});
