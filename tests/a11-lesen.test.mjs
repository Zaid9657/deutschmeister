import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LESEN_A11 } from '../src/data/curricula/a11.lesen.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { buildCheckpoint, paperSeed } from '../src/lib/checkpoint/buildCheckpoint.js';
import { auditBankFeatures } from './helpers/lesenGate.mjs';
import { checkLesenA11, auditDeclaredStrategies, auditTemplates, textSkeleton, auditContactNumbers } from '../scripts/a11-lesen-check.mjs';

const papers = Object.values(LESEN_A11).flatMap((b) => b.papers);
const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
// Read outside the pending test: deleting the fixture is a hard file-level failure.
const review = JSON.parse(readFileSync(new URL('./fixtures/a11-lesen-review.json', import.meta.url), 'utf8'));

test('A1.1 authored Lesen: taught independent texts pass the declared strategies and template gate', () => {
  const result = checkLesenA11();
  assert.deepEqual(result.findings, []);
  assert.equal(papers.length, 16);
  assert.equal(new Set(papers.flat().map((u) => u.id)).size, 64);
  assert.ok(result.surface.papers.every((p) => p.passes));
  assert.equal(result.surface.totals.size, 14, 'only the declared strategies and explicit inverses');
  assert.ok([...result.surface.totals.values()].every((score) => score <= 36));
  assert.ok(papers.every((p) => p.filter((u) => u.answer === 'Richtig').length === 2));
  assert.ok(papers.every((p) => p.some((u) => u.type === 'message') && p.some((u) => u.type === 'ad') && p.some((u) => ['notice', 'sign'].includes(u.type))));
  assert.ok(result.templates.maxRepeat <= 2);
  // Supervisor replaced the batch-2-only combination limits; these are diagnostics,
  // not ratchets. Keep reporting even when they exceed the declared strategy ceiling.
  assert.ok(result.features.pairs.families.length > 0);
  console.log(`PASS: A1.1 declared strategies ≤2/4 and ≤36/64; templates ≤2; REPORT ONLY pairs ${result.features.pairs.worst[0].score}/64; whole papers ${result.features.pairs.worstPerfect[0].perfect}/16`);
});

test('Public phone contacts require plausible complete numbers; named contacts and internal office numbers remain valid', () => {
  assert.deepEqual(auditContactNumbers(papers).findings, []);
  const sample = papers[0][3];
  for (const printed of ['null eins sieben drei', 'drei fünf zwei', 'fünf drei zwei', 'null vier zwei eins', 'fünf zwei drei', 'drei zwei fünf', '0173 123', '0421']) {
    const result = auditContactNumbers([[{ ...sample, text: `Telefonnummer: ${printed}.` }]]);
    assert.equal(result.findings.length, 1, printed);
  }
  for (const text of [
    'Telefonnummer: null eins sieben drei zwei vier sechs acht fünf null eins.',
    'Telefonnummer 0173 2468501.',
    'Telefon: 0421 5826349.',
    'Handynummer ist null eins fünf eins zwei drei vier fünf sechs sieben acht neun.',
    'Bitte Mail an Frau Brandt.',
    'Bitte sprechen Sie mit Lena.',
    'Frau Schmidt hat die Nummer drei zwei fünf. Frau Schmidt ist hier im Büro.',
    'Ich brauche ihre Telefonnummer für das Formular.',
  ]) assert.deepEqual(auditContactNumbers([[{ ...sample, text }]]).findings, [], text);
  const broken = structuredClone(LESEN_A11);
  broken['a1.1-cp1'].papers[0][3].text = 'Telefonnummer: null eins sieben drei.';
  assert.ok(checkLesenA11(broken).findings.some((f) => /incomplete\/implausible phone contact/.test(f)), 'contact check is wired into the authoring gate');
});

test('Reading texts, statements and explanations avoid the untaught meanings identified in blind review', () => {
  // Narrow regression checks for the reviewed senses, not a semantic vocabulary proof.
  // The supervisor still reviews meaning in context via the pending blind fixture.
  for (const u of papers.flat()) for (const field of ['text', 'statement', 'explanationDe']) {
    assert.doesNotMatch(u[field], /\bPost\s+für\b/iu, `${u.id} ${field}: Post is taught as post office, not letters`);
    assert.doesNotMatch(u[field], /\b(?:ist|sind)\b[^.!?]*\b(?:auf|zu)\s*(?=[.!?“”]|$)/iu, `${u.id} ${field}: auf/zu as open/closed is untaught`);
  }
});

test('A1.1 serves exactly the authored paper by round; malformed banks cannot fall back', () => {
  for (const checkpoint of CURRICULUM_A11.checkpoints) {
    for (let round = 0; round < 8; round += 1) {
      const built = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint, pool, seed: paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen');
      const authored = checkpoint.lesen.papers[round % 4];
      assert.equal(built.length, 4);
      for (const [i, it] of built.entries()) {
        assert.equal(it.source, 'authored');
        assert.equal(it.unitId, authored[i].id);
        assert.equal(it.text, authored[i].text);
        assert.equal(it.promptDe, authored[i].question);
        assert.equal(it.answer, authored[i].answer);
        assert.deepEqual(it.options, authored[i].options);
        assert.equal(it.statement, authored[i].statement);
        assert.equal(it.changed, undefined, 'no generated falsifier');
      }
    }
    for (const bad of [{}, { papers: [] }, { papers: checkpoint.lesen.papers.slice(0, 3) }, { papers: [[], [], [], []] }]) {
      assert.throws(() => buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: { ...checkpoint, lesen: bad }, pool }), /authored Lesen bank/);
    }
  }
});

test('Declared gate catches planted numeric, negation, literal, missing-token, overlap and length leaks; control passes', () => {
  assert.ok(auditDeclaredStrategies(papers).passes, 'real independent positive control');
  const mutations = {
    'constant answer': (p) => p.map((u) => ({ ...u, answer: 'Richtig' })),
    numeric: (p) => p.map((u) => ({ ...u, statement: u.answer === 'Falsch' ? 'Paul ist acht.' : 'Paul ist Student.' })),
    negation: (p) => p.map((u) => ({ ...u, statement: u.answer === 'Falsch' ? 'Paul ist nicht hier.' : 'Paul ist hier.' })),
    literal: (p) => p.map((u) => ({ ...u, text: u.answer === 'Richtig' ? u.statement : 'Paul ist Lehrer.' })),
    missing: (p) => p.map((u) => ({ ...u, text: u.answer === 'Richtig' ? u.statement.split(' ').reverse().join(' ') : 'Unbekannt.' })),
    overlap: (p) => p.map((u) => ({ ...u, statement: 'a b c d', text: u.answer === 'Richtig' ? 'a b c' : 'a b' })),
    length: (p) => p.map((u) => ({ ...u, statement: u.answer === 'Richtig' ? 'a b c d' : 'a b', text: 'a b c d' })),
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    const planted = mutate(papers[0]);
    assert.equal(auditDeclaredStrategies([planted]).passes, false, name);
    const inverse = planted.map((u) => ({ ...u, answer: u.answer === 'Richtig' ? 'Falsch' : 'Richtig' }));
    assert.equal(auditDeclaredStrategies([inverse]).passes, false, `${name} inverse`);
  }
});

test('Planted order and feature-pair leaks remain visible as report-only diagnostics', () => {
  const ordered = papers.map((p) => [...p].sort((a, b) => a.answer.localeCompare(b.answer)));
  const bank = auditBankFeatures(ordered);
  assert.ok(bank.findings.length, 'legacy diagnostic still detects position leak');
  assert.ok(auditDeclaredStrategies(ordered).passes, 'ordering alone is not a declared gate');
  assert.equal(bank.pairs.worst[0].score, 64);
  assert.equal(bank.pairs.worstPerfect[0].perfect, 16);
  // A crossed pair of visible features can leak while each feature alone balances.
  const paired = structuredClone(papers);
  paired.forEach((paper, p) => paper.forEach((u, i) => {
    const number = p % 2 === 0;
    const long = (i % 2 === 0) !== number;
    u.statement = `${number ? 'acht' : 'hier'} ${long ? 'a b c d e f g' : 'a'}`;
    u.answer = (number !== long) ? 'Richtig' : 'Falsch';
  }));
  const pairLeak = auditBankFeatures(paired);
  assert.equal(pairLeak.pairs.worst[0].score, 64, 'feature-pair leak detected');
});

test('Template gate rejects repeated content-word skeletons, including changes of names and numbers', () => {
  assert.equal(textSkeleton('Hallo Ana, Paul wohnt in Berlin. Tim ist acht. Grüße, Lena'),
    textSkeleton('Hallo Ali, Thomas wohnt in Bremen. Lena ist zehn. Grüße, Paul'));
  const repeated = structuredClone(LESEN_A11);
  let serial = 0;
  for (const u of Object.values(repeated).flatMap((b) => b.papers.flat())) {
    u.text = `Hallo Ana, Herr Weber wohnt in Berlin. Frau Wolf wohnt in Bremen. Telefonnummer: ${++serial}. Grüße, Tim`;
    u.evidence = 'Herr Weber wohnt in Berlin.';
    u.explanationDe = u.evidence;
  }
  const result = checkLesenA11(repeated);
  assert.ok(result.findings.some((f) => /template occurs 64 times/.test(f)));
  assert.ok(result.findings.some((f) => /template repeated within paper/.test(f)));
  // Two across different papers are allowed; two in one paper are not.
  const sample = papers[0][0];
  assert.deepEqual(auditTemplates([[sample], [sample]]).findings, []);
  assert.ok(auditTemplates([[sample, sample]]).findings.some((f) => /within paper/.test(f)));
  assert.ok(auditTemplates([[sample], [sample], [sample]]).findings.some((f) => /3 times/.test(f)));
});

test('Template guard rejects sentence-initial nur + numeral or adjective', () => {
  for (const opening of ['Nur acht', 'Nur 12', 'Nur weiß', 'Nur schwarz']) {
    assert.ok(auditTemplates([[{ ...papers[0][0], text: `${opening} ist Paul. Die Tasche ist blau.` }]]).findings.some((f) => /nur \+ number\/adjective/.test(f)), opening);
  }
  assert.deepEqual(auditTemplates([[{ ...papers[0][0], text: 'Das Büro ist nur bis zwölf Uhr auf.' }]]).findings, []);
});

test('Authoring gate rejects short texts, missing genres, practised sentences and deferred constructions', () => {
  for (const [name, edit, finding] of [
    ['short', (u) => { u.text = 'Hallo Ana.'; }, /15–45 words/],
    ['genre', (u) => { u.type = 'message'; }, /must mix/],
    ['practised', (u) => { u.text += '. Wie geht es Ihnen?'; }, /practised sentence/],
    ['construction', (u) => { u.text += ' Meine Schwester wohnt in Berlin.'; }, /deferred possessive-articles/],
  ]) {
    const bank = structuredClone(LESEN_A11);
    if (name === 'genre') bank['a1.1-cp1'].papers[0].forEach(edit);
    else edit(bank['a1.1-cp1'].papers[0][0]);
    assert.ok(checkLesenA11(bank).findings.some((f) => finding.test(f)), name);
  }
});

test('A1.1 each authored unit passes independent blind semantic review', {
  todo: review.status === 'pending' ? 'Supervisor blind review pending; fixture exists but no results are invented' : false,
}, () => {
  const byId = new Map(review.units.map((r) => [r.id, r]));
  const problems = [];
  for (const unit of papers.flat()) {
    const r = byId.get(unit.id);
    if (!r) { problems.push(`${unit.id}: not reviewed`); continue; }
    if (r.verdict !== 'ok') problems.push(`${unit.id}: ${r.verdict} — ${r.note}`);
    if (r.solved !== unit.answer) problems.push(`${unit.id}: solved blind as ${r.solved}, keyed ${unit.answer}`);
    if (r.text !== unit.text || r.question !== unit.question) problems.push(`${unit.id}: changed since review`);
    if (!r.evidence || !unit.text.includes(r.evidence)) problems.push(`${unit.id}: missing review evidence`);
  }
  assert.deepEqual(problems, []);
  assert.equal(byId.size, 64);
});
