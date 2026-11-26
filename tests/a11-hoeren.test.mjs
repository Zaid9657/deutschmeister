// The A1.1 checkpoints' own bank: what they say aloud (src/data/curricula/a11.hoeren.js) and the tasks kept
// for them alone (src/data/lessonPools/a11.assessment.js). Both blind scores of 2026-11-25 said the
// checkpoints measured memory: 36 of 36 dictations and 24 of 24 read-alouds were scene lines, no listening
// item had a new text, and a retake repeated two to eight of its twenty tasks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { HOEREN_A11 } from '../src/data/curricula/a11.hoeren.js';
import { ASSESSMENT_A11 } from '../src/data/lessonPools/a11.assessment.js';
import { checkHoerenA11, listeningShortcuts, SHORTCUT_LIMIT } from '../scripts/a11-hoeren-check.mjs';
import { reservedAssessmentFindings } from '../scripts/lib/assessment-content.mjs';
import { levelSpec, taughtUpTo, untaughtTokens } from '../scripts/validate-curriculum.mjs';
import { buildCheckpoint, paperSeed, checkpointLeaks, checkpointReport, remediationSet, leaksAcross, isItemCorrect } from '../src/lib/checkpoint/buildCheckpoint.js';
import { planPractice, default as buildLesson } from '../src/lib/lesson/buildLesson.js';
import { seriesWords } from '../src/lib/checkpoint/lexis.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const review = JSON.parse(read('tests/fixtures/a11-hoeren-review.json'));
const papers = CURRICULUM_A11.checkpoints.flatMap((cp) => [0, 1, 2, 3].map((round) => ({
  cp, round, items: buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool, seed: paperSeed(cp, round) }),
})));
const clone = () => structuredClone(HOEREN_A11);

test('the listening bank says new sentences in taught words, and no shortcut answers its questions', () => {
  const { findings, shortcuts, units } = checkHoerenA11();
  assert.deepEqual(findings, []);
  assert.equal(units, 48);
  assert.equal(SHORTCUT_LIMIT, 24, 'a limit only goes down');
  for (const [name, score] of Object.entries(shortcuts)) assert.ok(score <= 24, `${name}: ${score}/48`);
});

test('the gate bites: a scene line, an untaught word or form, a cast name, a lone answer, a fixed place', () => {
  const cases = [
    [/practised/, (b) => { b['a1.1-cp1'].papers[0].say[0].de = 'Auf Wiedersehen, Frau Chakiri. Buchstabieren Sie bitte Chakiri.'; }],
    [/practised/, (b) => { b['a1.1-cp4'].papers[0].read[0].de = 'Kaufst du morgen ein?'; }],
    [/untaught/, (b) => { b['a1.1-cp1'].papers[0].read[0].de = 'Der Zug hat heute Verspätung.'; }],
    [/deferred|construction/, (b) => { b['a1.1-cp2'].papers[0].read[0].de = 'Meine Tasche ist rot und teuer.'; }],
    [/cast name/, (b) => { b['a1.1-cp1'].papers[1].hear[2].text += ' Lena ist auch hier.'; }],
    [/never names/, (b) => { b['a1.1-cp1'].papers[0].hear[0].options[0] = 'In Italien.'; }],
    [/one place throughout/, (b) => { for (const u of b['a1.1-cp1'].papers[0].hear) u.options = [u.answer, ...u.options.filter((o) => o !== u.answer)]; }],
    [/a dictation has 5 to/, (b) => { b['a1.1-cp2'].papers[0].say[0].de = 'Das Regal kostet vierzig Euro, der Tisch kostet dreißig Euro und der Stuhl kostet noch einmal zwanzig Euro.'; }],
    [/evidence/, (b) => { b['a1.1-cp1'].papers[0].hear[0].evidence = 'Ich wohne in Köln.'; }],
    [/twice in the bank/, (b) => { b['a1.1-cp1'].papers[1].read[0].de = b['a1.1-cp1'].papers[0].read[0].de; }],
    [/exactly four papers/, (b) => { b['a1.1-cp3'].papers.pop(); }],
  ];
  for (const [finding, edit] of cases) {
    const bank = clone();
    edit(bank);
    assert.ok(checkHoerenA11(bank).findings.some((f) => finding.test(f)), String(finding));
  }
  const first = Object.values(HOEREN_A11).flatMap((b) => b.papers.flatMap((p) => p.hear)).map((u) => ({ ...u, options: [u.answer, ...u.options.filter((o) => o !== u.answer)] }));
  assert.equal(listeningShortcuts(first)['first answer'], 48);
});

test('every heard text, sentence and reserved task passed an independent blind review', () => {
  const byId = new Map(review.units.map((r) => [r.id, r]));
  const problems = [];
  for (const u of Object.values(HOEREN_A11).flatMap((b) => b.papers.flatMap((p) => p.hear))) {
    const r = byId.get(u.id);
    if (!r) { problems.push(`${u.id}: not reviewed`); continue; }
    if (r.verdict !== 'ok') problems.push(`${u.id}: ${r.verdict} — ${r.note}`);
    if (r.solved !== u.answer) problems.push(`${u.id}: solved blind as ${r.solved}, keyed ${u.answer}`);
    if (r.text !== u.text || r.question !== u.question) problems.push(`${u.id}: changed since review`);
  }
  for (const u of Object.values(HOEREN_A11).flatMap((b) => b.papers.flatMap((p) => [...p.say, ...p.read]))) {
    const r = byId.get(u.id);
    if (!r || r.verdict !== 'ok' || r.text !== u.de) problems.push(`${u.id}: ${r ? `${r.verdict} ${r.note}` : 'not reviewed'}`);
  }
  for (const it of ASSESSMENT_A11) {
    const r = byId.get(it.id);
    if (!r || r.verdict !== 'ok' || r.text !== it.questionDe) problems.push(`${it.id}: ${r ? `${r.verdict} ${r.note}` : 'not reviewed'}`);
    // The reviewer worked it out without the key, and the checkpoint's own checker takes that answer.
    else if (!isItemCorrect({ ...it, mode: 'typed', promptDe: it.questionDe }, r.solved)) problems.push(`${it.id}: solved blind as ${r.solved}, keyed ${it.answer}`);
  }
  assert.deepEqual(problems, []);
  assert.equal(byId.size, 48 + 64 + 128);
});

test('the reserved tasks are complete and taught, and no practice, retry or remediation draw serves one', () => {
  assert.equal(ASSESSMENT_A11.length, 128);
  assert.deepEqual(reservedAssessmentFindings(CURRICULUM_A11, pool.items), []);
  const reserved = new Set(pool.items.filter((i) => i.assessment).map((i) => i.id));
  assert.equal(reserved.size, 128);
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    for (const [, items] of planPractice(CURRICULUM_A11, pool, attempt)) for (const i of items) assert.equal(reserved.has(i.id), false, i.id);
  }
  for (const lektion of CURRICULUM_A11.lektionen) {
    for (const stage of buildLesson({ curriculum: CURRICULUM_A11, lektion, pool, attempt: 1 }).stages) {
      for (const i of stage.items || []) assert.equal(reserved.has(i.id), false, `${stage.kind}: ${i.id}`);
    }
  }
  const spec = levelSpec('a1.1');
  const known = taughtUpTo(CURRICULUM_A11, spec);
  const used = new Set();
  for (const { cp, items } of papers) {
    const rows = items.filter((i) => i.poolItemId);
    assert.equal(rows.length, 8);
    for (const i of rows) {
      assert.ok(reserved.has(i.poolItemId));
      assert.equal(used.has(i.poolItemId), false, i.poolItemId);
      used.add(i.poolItemId);
      assert.deepEqual(untaughtTokens({ questionDe: i.promptDe, answer: i.answer }, known.get(cp.afterLektion), spec), [], i.poolItemId);
    }
    for (const i of remediationSet(items, {}, pool, { afterLektion: cp.afterLektion })) assert.equal(reserved.has(i.poolItemId), false);
  }
  assert.equal(used.size, 128, 'all sixteen papers are disjoint');
  const missing = { ...pool, items: pool.items.filter((i) => !i.assessment) };
  const late = { ...pool, items: pool.items.map((i) => (i.assessment ? { ...i, minLektion: 12 } : i)) };
  for (const bad of [missing, late]) assert.throws(() => buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: CURRICULUM_A11.checkpoints[0], pool: bad }), /reserved/);
});

test('a cue never gives the tested form, and a colloquial time is one the notice teaches', () => {
  // Both scores, 2026-11-25: „Beginnen Sie mit ‚Kommst'" answers the item; „18:20, umgangssprachlich" asked for
  // „zwanzig nach sechs", which no Lektion teaches.
  const notice = CURRICULUM_A11.lektionen.find((l) => l.nr === 8).notice.bodyDe.toLowerCase();
  for (const it of ASSESSMENT_A11) {
    const opening = it.questionDe.match(/Beginnen Sie mit „([^“]+)“/)?.[1];
    const bricks = it.questionDe.match(/\[([^\]]+)\]/)?.[1].toLowerCase().split(' / ');
    if (opening) assert.ok(bricks.includes(opening.toLowerCase()), `${it.id}: „${opening}“ is not one of its bricks`);
    const clock = it.questionDe.match(/\((\d{1,2})\.(\d{2})\)/);
    if (clock) assert.ok(['00', '15', '30', '45'].includes(clock[2]) && /viertel|halb/.test(notice), `${it.id}: ${clock[0]}`);
  }
});

test('a reserved gap is given away only by its word in its place', () => {
  const gap = (promptDe, answer) => ({ section: 'bausteine', kind: 'typed', mode: 'typed', promptDe, answer, accepted: [answer], reservedGap: true });
  const prints = (text) => ({ section: 'sprechen', kind: 'readAloud', type: 'read_aloud', promptDe: 'Lesen Sie den Satz laut vor.', text, answer: text, accepted: [text] });
  const party = gap('Ergänzen Sie mit einem Wort: Sara feiert. ___ Party ist am Freitag. (sie)', 'Ihre');
  assert.equal(leaksAcross(party, prints('Ihre Party ist im September.')), true);
  assert.equal(leaksAcross(party, prints('Ihre Eltern sind hier.')), false, 'the word is printed, the gap is not answered');
  const haben = gap('Ergänzen Sie mit einem Wort: Ihr ___ heute Zeit. (haben)', 'habt');
  assert.equal(leaksAcross(haben, prints('Und wann habt ihr frei?')), true, 'in either order');
  const article = gap('Ergänzen Sie mit einem Wort: Wo ist ___ Bild? (bestimmter Artikel)', 'das');
  assert.equal(leaksAcross(article, prints('Wo ist das Regal?')), false, 'an article belongs to its noun');
  assert.equal(leaksAcross(article, prints('Das Bild ist blau.')), true);
});

test('every A1.1 paper is 20 tasks, free of leaks, and passable', () => {
  for (const { cp, round, items } of papers) {
    assert.deepEqual(['hoeren', 'lesen', 'bausteine', 'schreiben', 'sprechen'].map((s) => items.filter((i) => i.section === s).length), [5, 4, 6, 3, 2]);
    assert.deepEqual(checkpointLeaks(items), [], `${cp.id}/${round}`);
    assert.deepEqual(checkpointReport(items).leakFallbacks, [], `${cp.id}/${round}`);
  }
});

test('a closed series is taught from the Lektion that shows it, with the compounds its rule gives', () => {
  const l4 = CURRICULUM_A11.lektionen.find((l) => l.nr === 4);
  assert.ok(seriesWords(l4).includes('sechsunddreißig') && seriesWords(l4).includes('fünfundvierzig'));
  assert.equal(seriesWords(l4).filter((w) => /und/.test(w)).length >= 72, true);
  assert.ok(!seriesWords(CURRICULUM_A11.lektionen.find((l) => l.nr === 2)).some((w) => /und/.test(w)), 'Lektion 2 stops at ten');
  assert.ok(seriesWords(CURRICULUM_A11.lektionen.find((l) => l.nr === 12)).includes('oktober'));
});
