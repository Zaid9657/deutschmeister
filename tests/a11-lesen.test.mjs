import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LESEN_A11 } from '../src/data/curricula/a11.lesen.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { buildCheckpoint, paperSeed, guessCeiling, scoreCheckpoint } from '../src/lib/checkpoint/buildCheckpoint.js';
import { checkLesenA11, auditDeclaredStrategies, auditTemplates, textSkeleton, auditContactNumbers, paperCeiling, TF_LIMIT, CHOICE_LIMIT, PAPERS_LIMIT } from '../scripts/a11-lesen-check.mjs';

const papers = Object.values(LESEN_A11).flatMap((b) => b.papers);
const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
// Read outside the pending test: deleting the fixture is a hard file-level failure.
const review = JSON.parse(readFileSync(new URL('./fixtures/a11-lesen-review.json', import.meta.url), 'utf8'));

test('A1.1 authored Lesen: taught independent texts pass the declared strategies and template gate', () => {
  const result = checkLesenA11();
  assert.deepEqual(result.findings, []);
  assert.equal(papers.length, 16);
  assert.equal(new Set(papers.flat().map((u) => u.id)).size, 64);
  assert.deepEqual([TF_LIMIT, CHOICE_LIMIT, PAPERS_LIMIT], [18, 16, 5], 'a limit only goes down');
  for (const [name, score] of result.surface.totals) assert.ok(score <= 18, `${name}: ${score}/32`);
  assert.ok(result.surface.pairs[0].passed <= 5, result.surface.pairs[0].name);
  // Both scores of 2026-11-25: „every word of the statement stands in the text → Richtig“ took 51 of 64 and
  // passed eleven papers of sixteen; every paper was two Richtig and two Falsch.
  assert.ok(result.surface.totals.get('all statement words in text → Richtig') <= 18);
  assert.equal(result.surface.patterns.size, 4, 'the number of Richtig in a paper is no rule of its own');
  assert.ok(papers.every((p) => p.some((u) => u.type === 'message') && p.some((u) => u.type === 'ad') && p.some((u) => ['notice', 'sign'].includes(u.type))));
  assert.ok(result.templates.maxRepeat <= 2);
});

test('one answer, or one place, tapped throughout never passes the reading of an A1.1 checkpoint', () => {
  for (const paper of papers) assert.ok(paperCeiling(paper) <= 2);
  for (const checkpoint of CURRICULUM_A11.checkpoints) for (let round = 0; round < 4; round += 1) {
    const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint, pool, seed: paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen');
    assert.equal(guessCeiling(items), paperCeiling(checkpoint.lesen.papers[round]));
    for (let place = 0; place < 3; place += 1) {
      const answers = Object.fromEntries(items.map((it) => [it.id, it.options[place] ?? '']));
      const s = scoreCheckpoint(items, answers).sections.lesen;
      assert.ok(s.correct <= s.guessCeiling, `${checkpoint.id}/${round}: place ${place} takes ${s.correct}`);
    }
  }
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
  for (const u of papers.flat()) for (const field of ['text', 'statement', 'question', 'explanationDe']) {
    if (u[field] === undefined) continue;
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
        assert.equal(it.kind, authored[i].format === 'trueFalse' ? 'trueFalse' : 'choice');
        assert.equal(it.changed, undefined, 'no generated falsifier');
      }
    }
    for (const bad of [{}, { papers: [] }, { papers: checkpoint.lesen.papers.slice(0, 3) }, { papers: [[], [], [], []] }]) {
      assert.throws(() => buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: { ...checkpoint, lesen: bad }, pool }), /authored Lesen bank/);
    }
  }
});

test('the declared gate catches a planted leak of every kind, and passes the bank', () => {
  assert.ok(auditDeclaredStrategies(papers).passes, 'real independent positive control');
  const say = (fn) => papers.map((p) => p.map((u) => (u.format === 'trueFalse' ? { ...u, ...fn(u) } : u)));
  const ask = (fn) => papers.map((p) => p.map((u) => (u.format === 'choice' ? { ...u, ...fn(u) } : u)));
  const right = (u) => u.answer === 'Richtig';
  const planted = {
    'constant answer': say(() => ({ answer: 'Richtig' })),
    number: say((u) => ({ statement: right(u) ? 'Ben ist Student.' : 'Ben ist acht.' })),
    negation: say((u) => ({ statement: right(u) ? 'Ben ist hier.' : 'Ben ist nicht hier.' })),
    literal: say((u) => ({ text: right(u) ? u.statement : 'Unbekannt.' })),
    'one sentence': say((u) => ({ text: right(u) ? `${u.statement} Ja!` : 'Unbekannt.' })),
    length: papers.map((p) => { let n = 0; return p.map((u) => { if (u.format !== 'trueFalse') return u; n += 1; const long = n === 1; return { ...u, statement: long ? 'a b c d e f' : 'a b', text: 'a b c d e f', answer: long ? 'Richtig' : 'Falsch' }; }); }),
    'negation in text': say((u) => ({ text: right(u) ? 'Ben ist hier.' : 'Ben ist nicht hier.' })),
    place: ask((u) => ({ options: [u.answer, ...u.options.filter((o) => o !== u.answer)] })),
    'named first': ask((u) => ({ text: u.answer + ' ' + u.options.filter((o) => o !== u.answer).join(' ') })),
    'named last': ask((u) => ({ text: u.options.filter((o) => o !== u.answer).join(' ') + ' ' + u.answer })),
    'named most often': ask((u) => ({ text: u.options.join(' ') + ' ' + u.answer })),
    longest: ask((u) => ({ options: u.options.map((o) => (o === u.answer ? 'Sehr sehr lang und klar.' : o.slice(0, 6))), answer: 'Sehr sehr lang und klar.' })),
    'like the question': ask((u) => ({ question: 'Was kostet der Tisch?', text: `Der Tisch kostet ${u.answer} Das Regal, ${u.options.filter((o) => o !== u.answer).join(' ')}` })),
  };
  for (const [name, bank] of Object.entries(planted)) assert.equal(auditDeclaredStrategies(bank).passes, false, name);
  const ceiling = [papers[2].map((u) => ({ ...u, ...(u.format === 'choice' ? { answer: u.options[1] } : {}) }))];
  assert.ok(auditDeclaredStrategies(ceiling).findings.some((x) => /one answer or place throughout/.test(x)), 'a paper one place passes');
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
    // A statement printed word for word is found by looking; an answer the text never names is no competitor.
    ['verbatim', (u, i) => { if (i === 1) u.text += ` ${u.statement}`; }, /statement stands word for word/],
    ['no competitor', (u, i) => { if (i === 0) u.options = [...u.options.slice(0, 1), 'In Italien.', u.answer].slice(-3); }, /answer not named in the text/],
    // A cast name names only the cast (the independent score, 2026-11-20).
    ['cast', (u) => { u.text += ' Lena ist schon zehn.'; }, /cast name Lena/],
  ]) {
    const bank = structuredClone(LESEN_A11);
    if (name === 'genre') bank['a1.1-cp1'].papers[0].forEach(edit);
    else bank['a1.1-cp1'].papers[0].forEach((u, i) => (['verbatim', 'no competitor'].includes(name) ? edit(u, i) : i === 0 && edit(u, i)));
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

// One number, one person (Claude score of c6918f2d, round 4 of the loop): paper 3 of checkpoint 1 gave Frau Novak and Frau Becker
// the same 0176 3582604. A number printed in two texts of the bank belongs to the same person in both.
test('a phone number of the reading bank belongs to one person', () => {
  const owners = new Map();
  for (const u of papers.flat()) {
    for (const [number] of String(u.text).matchAll(/0\d{2,4}[ /]\d{5,8}/g)) {
      const names = new Set([...String(u.text).matchAll(/(?:Frau|Herr|Familie)\s+(\p{Lu}\p{L}+)/gu)].map((m) => m[1]));
      if (!owners.has(number)) owners.set(number, []);
      owners.get(number).push({ id: u.id, names });
    }
  }
  for (const [number, uses] of owners) {
    if (uses.length < 2) continue;
    const shared = [...uses[0].names].filter((n) => uses.every((x) => x.names.has(n)));
    assert.ok(shared.length > 0, `${number}: ${uses.map((x) => `${x.id} (${[...x.names].join(', ')})`).join(' / ')}`);
  }
});
