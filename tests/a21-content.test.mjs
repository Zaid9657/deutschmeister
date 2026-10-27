import test from 'node:test';
import assert from 'node:assert/strict';
import { formsOfA21, FUNCTION_WORDS_A21_ADDED } from '../src/data/curricula/a21-language.js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CURRICULUM_A21 as c } from '../src/data/curricula/a21.js';
import { WRITING_TASKS, writingTaskByKey } from '../src/data/writingTasks.js';
import { courseMetaFor, courseMetaErrors } from '../src/lib/course/meta.js';
import { deferredConstructionHits } from '../src/data/curricula/constructions.js';
import { loadPoolItems, loadExtraItems, canDoRehearsal } from '../scripts/validate-curriculum.mjs';
import { planPractice, practiceReport } from '../src/lib/lesson/buildLesson.js';
import { buildCheckpoint, paperSeed } from '../src/lib/checkpoint/buildCheckpoint.js';
import { examSurfaceErrors } from '../src/lib/lesson/exam.js';
import { a21BankAudit } from './helpers/a21-bank-audit.mjs';
import { abschlusstestA21Course as final } from '../src/data/courseTests/abschlusstestA21Course.js';
import { scoreObjectiveSections } from '../src/services/examScoring.js';

const words = text => text.trim().split(/\s+/).length;
const pool = loadPoolItems('a2.1');
const unitText = u => [u.text, u.audioText, u.question, ...(u.options || [])].filter(Boolean).join(' ');
const norm = text => String(text).toLowerCase().replace(/[.!?]/g, '').trim();
const assertPictures = u => {
  for (const p of u.pictures || []) {
    assert.ok(p.alt && p.src.startsWith('/images/course/a21/'));
    const path = fileURLToPath(new URL(`../public${p.src}`, import.meta.url));
    assert.ok(existsSync(path), p.src);
    assert.match(readFileSync(path, 'utf8'), /<svg\b/);
  }
};

test('D2/D5: every lesson has bounded input, provenance and framed informal dialogue', () => {
  assert.equal(c.lektionen.length, 12);
  for (const l of c.lektionen) {
    assert.ok(l.situation && l.dialog.setting && l.boundedPoints);
    assert.equal(l.canDo.length, l.canDoSources.length);
    assert.ok(l.canDoSources.every(s => /[A-Z]+\d/.test(s)));
    assert.ok(l.wortfeld.length <= 30);
    assert.ok(words(l.notice.bodyDe) <= 70, `${l.id}: notice`);
    assert.ok(l.notice.bodyEn);
    for (const u of l.hoeren?.units || []) assertPictures(u);
    if (l.hoeren?.teil === 'Hören Teil 3') assert.equal(new Set(l.hoeren.units.map(u => u.audioText)).size, l.hoeren.units.length);
    for (const line of l.dialog.lines) {
      assert.ok(words(line.de) <= 14, `${l.id}: ${line.de}`);
      assert.ok(line.en);
      if (/\b(?:du|dein\w*|dir|dich|euch|euer|eure\w*)\b/i.test(line.de)) assert.match(l.dialog.setting, /Freund|Familie|Eltern/i);
    }
    for (const surname of l.dialog.setting.matchAll(/Lena ([A-ZÄÖÜ][a-zäöüß]+)/g)) assert.equal(surname[1], 'Brandt');
    for (const prompt of [l.pretest.promptDe, l.sprechen.open.promptDe, l.schreiben.taskDe]) {
      assert.doesNotMatch(prompt, /\b(?:du|dein\w*|dir|dich|euch)\b/i, `${l.id}: learner register`);
    }
  }
});

test('18 grammar points have taught input and at least two eligible exercises', () => {
  // Predicates inspect the teaching and answers, not exercise IDs.
  const points = [
    [1, /\b(?:unser|euer|eur)\w*/i], [1, /\b(?:Omas|Lenas)\b/],
    [2, /\b(?:eingepackt|aufgeräumt|abgeholt|mitgebracht)\b/i],
    [3, /\b(?:stell|leg|häng)\w*\b/i], [4, /\b(?:frische|frischen|rote|roten|kleine|kleinen|grüne|grünen)\b/i],
    [5, /\b(?:schenk|helf|hilf|gefall|gefäll|gratulier)\w*/i],
    [6, /\b(?:musste|konnte|wollte|durfte)\w*/i], [6, /\bdass\b/i],
    [7, /\b(?:Trink|Trinkt|Nimm|Nehmt|Geht|Macht|Machen Sie|Trainiert|Spielt)\b/], [7, /\b(?:solltest|könnten)\b/i],
    [8, /\b(?:gefahren|gefallen|gegangen|gekommen|geblieben)\b/i], [8, /\bweil\b/i],
    [9, /\b(?:ihm|ihnen|Ihnen)\b/], [10, /\b(?:zwischen|über|für|ab|bis|seit)\b/i],
    [11, /\b(?:gegenüber|bei|mit|nach|zu)\b/i], [11, /\b(?:alten|neuen|ersten|zweiten)\b/i],
    [12, /\b(?:getroffen|gemacht|gekocht|erzählt|gezeigt)\b/i], [12, /\bwenn\b/i],
  ];
  assert.equal(points.length, 18);
  for (const [nr, re] of points) {
    const l = c.lektionen[nr - 1];
    assert.match([l.notice.bodyDe, ...l.dialog.lines.map(x => x.de)].join(' '), re, `L${nr}: taught input`);
    const eligible = pool.filter(i => i.topic === l.primarySlug && i.minLektion !== null && i.minLektion <= nr && re.test(`${i.questionDe} ${i.answer}`));
    assert.ok(eligible.length >= 2, `L${nr} ${re}: ${eligible.length} eligible exercises`);
  }
});

test('first and second practice attempts are complete, situated and cover bounded forms', () => {
  for (const attempt of [1, 2]) {
    const plan = planPractice(c, pool, attempt);
    for (const l of c.lektionen) {
      const items = plan.get(l.nr), r = practiceReport(plan).get(l.nr);
      assert.equal(items.length, 7, `${l.id}/${attempt}`);
      assert.equal(r.complete, true, `${l.id}/${attempt}: complete`);
      assert.equal(r.situationComplete, true, `${l.id}/${attempt}: situation`);
      for (const required of l.practiceRule.mustCover || []) assert.ok(items.some(i => norm(i.answer) === norm(required)), `${l.id}/${attempt}: ${required}`);
      assert.ok(items.every(i => i.minLektion !== null && i.minLektion <= l.nr));
    }
  }
});

test('receptive exam texts and dialogue obey construction horizons too', () => {
  const surfaces = c.lektionen.flatMap(l => [
    ...l.dialog.lines.map(x => [l.nr, `${l.id} dialogue`, x.de]),
    [l.nr, `${l.id} model`, l.schreiben.sample],
    ...['lesen', 'hoeren'].flatMap(s => (l[s]?.units || []).map(u => [l.nr, u.id, unitText(u)])),
  ]).concat(c.checkpoints.flatMap(cp => ['lesen', 'hoeren'].flatMap(s => cp[s].papers.flat().map(u => [cp.afterLektion, u.id, unitText(u)]))));
  for (const [nr, label, text] of surfaces) {
    assert.deepEqual(deferredConstructionHits(c, nr, text), [], label);
    assert.doesNotMatch(text, /\bsich\b/, `${label}: reflexive verbs belong to A2.2`);
    if (nr < 7) assert.doesNotMatch(text, /(?<!\p{L})(?:leg|stell|nimm|gib|komm|mach|ruf|trink|geh|bring|hol|esst|sei|hör|schreib|lies|zeig)(?!\p{L})/iu, `${label}: informal imperative before L7`);
  }
});

test('sixteen writing tasks agree with the course and Goethe A2 ranges', () => {
  const tasks = WRITING_TASKS.filter(t => t.course === 'a2.1');
  assert.equal(tasks.length, 16);
  assert.equal(new Set(tasks.map(t => t.taskKey)).size, 16);
  assert.deepEqual(c.lektionen.map(l => l.schreiben.textsorte), ['sms','email','sms','sms','email','sms','email','sms','email','email','sms','email']);
  for (const t of tasks) {
    assert.equal(t.examKey, 'goethe_a2');
    assert.deepEqual([t.minWords, t.maxWords], t.textsorte === 'sms' ? [20,30] : [30,40]);
    assert.ok(words(t.sample) >= t.minWords && words(t.sample) <= t.maxWords, t.taskKey);
    assert.equal(t.leitpunkte.length, 3);
    assert.match(t.task, /\bSie\b/);
    assert.doesNotMatch(t.task, /\b(?:du|dein\w*|dir|dich)\b/i);
    assert.ok(t.taskEn && t.sample);
  }
  for (const l of c.lektionen) {
    const t = writingTaskByKey('goethe_a2', l.schreiben.taskKey);
    assert.equal(t.task, l.schreiben.taskDe);
    assert.equal(t.sample, l.schreiben.sample);
    assert.deepEqual(t.leitpunkte, l.schreiben.leitpunkte);
  }
  for (const t of WRITING_TASKS.filter(t => t.examKey === 'goethe_a2')) assert.doesNotMatch(t.pointsNote || '', /\b(?:du|dein\w*|dir|dich)\b/i);
});

test('four checkpoint rounds serve the authored papers, with balanced choices and local pictures', () => {
  assert.deepEqual(c.checkpoints.map(cp => cp.afterLektion), [3,6,9,12]);
  assert.deepEqual(examSurfaceErrors(c), []);
  const ids = new Set();
  for (const cp of c.checkpoints) for (const section of ['lesen', 'hoeren']) {
    assert.equal(cp[section].papers.length, 4);
    const signatures = new Set();
    for (const [round, paper] of cp[section].papers.entries()) {
      assert.equal(paper.length, section === 'lesen' ? 4 : 5);
      signatures.add(paper.map(unitText).join('\n'));
      const built = buildCheckpoint({ curriculum:c, checkpoint:cp, pool, seed:paperSeed(cp,round) });
      const served = built.filter(i => i.section === section);
      const writing = built.find(i => i.kind === 'gradedWriting').task;
      const bank = writingTaskByKey(c.examKey, cp.writingTaskKey);
      assert.equal(writing.taskKey, bank.taskKey);
      assert.equal(writing.taskDe, bank.task);
      assert.deepEqual([writing.minWords, writing.maxWords], [bank.minWords, bank.maxWords]);
      assert.deepEqual(served.map(i => i.answer), paper.map(i => i.answer));
      for (const u of paper) {
        assert.ok(!ids.has(u.id), u.id); ids.add(u.id);
        assertPictures(u);
      }
      if (paper.every(u => u.kind === 'match')) assert.equal(new Set(paper.map(u => u.answer)).size, paper.length);
    }
    assert.equal(signatures.size, 4);
  }
  const audit = a21BankAudit(c);
  for (const bank of audit.banks) {
    // Four papers have an unavoidable slot-guess floor: 2/4 for three choices,
    // 1/4 for six. A text cue must not exceed that floor by more than one item.
    const floor = bank.positions.length === 3 ? 0.5 : bank.positions.length === 6 ? 0.25 : 0.5;
    assert.ok(bank.orderBest <= floor, `${bank.checkpoint}/${bank.section}: round-slot balance`);
    assert.ok(bank.worst.rate <= floor + 1 / bank.count, `${bank.checkpoint}/${bank.section}: ${JSON.stringify(bank.worst)}`);
  }
  for (const group of audit.kinds) {
    assert.ok(Math.max(...group.positions) - Math.min(...group.positions) <= 2, `${group.kind}: key balance`);
    assert.ok(group.worst.rate <= group.chance + 0.10, `${group.kind}: ${JSON.stringify(group.worst)}`);
    assert.ok(group.orderBest <= group.chance + 0.10, `${group.kind}: slot strategy`);
  }
});

test('course metadata covers the real lessons and speakers', () => {
  assert.deepEqual(courseMetaErrors(c), []);
  const m = courseMetaFor(c);
  assert.ok(m.aboutEn && m.outcomesEn.length >= 4);
  for (const character of m.characters) assert.deepEqual(character.appearsIn, c.lektionen.filter(l => l.dialog.lines.some(x => x.speaker === character.name)).map(l => l.nr));
  for (const l of c.lektionen) assert.equal(m.lektionIntro[l.id].canDoEn.length, l.canDo.length);
});

test('A2 rehearsal includes exam units and speaking cards, but excludes model answers', () => {
  const base = {level:'a2.1', lektionen:[{nr:1,id:'a2.1-l01',canDo:['Ich kann über Volleyball sprechen.']}]};
  assert.equal(canDoRehearsal(base, []).length, 1);
  for (const extra of [{lesen:{units:[{text:'Volleyball'}]}}, {hoeren:{units:[{audioText:'Volleyball'}]}}, {sprechen:{open:{cards:['Volleyball']}}}]) {
    const copy = structuredClone(base); Object.assign(copy.lektionen[0], extra);
    assert.deepEqual(canDoRehearsal(copy, []), []);
  }
  base.lektionen[0].schreiben = {sample:'Volleyball'};
  base.lektionen[0].notice = {bodyDe:'Volleyball'};
  assert.equal(canDoRehearsal(base, []).length, 1);
  assert.ok(loadExtraItems('a2.1').length >= 144);
});

test('final test has 40 scored responses, two writing tasks and three usable speaking parts', () => {
  const answers = {};
  for (const section of final.sections.filter(s => ['hoeren','lesen'].includes(s.key))) {
    assert.equal(section.parts.flatMap(p => p.items || []).length, 20);
    for (const p of section.parts) {
      if (section.key === 'hoeren') { assert.ok(p.audioText); assert.ok([1,2].includes(p.playsAllowed)); }
      for (const i of p.items) { assert.ok(i.options.some(o => o.key === i.answer)); answers[i.id] = i.answer; }
    }
  }
  assert.equal(Object.keys(answers).length, 40);
  assert.equal(scoreObjectiveSections(final, answers).score, 40);
  assert.equal(scoreObjectiveSections(final, {}).maxScore, 40);
  assert.equal(scoreObjectiveSections(final, {}).score, 0);
  const writing = final.sections.find(s => s.key === 'schreiben').parts;
  assert.equal(writing.length, 2);
  const speaking = final.sections.find(s => s.key === 'sprechen').parts;
  assert.equal(speaking.length, 3);
  assert.equal(speaking[0].cards.length, 4);
  assert.equal(speaking[1].prompts.length, 4);
  assert.equal(speaking[2].calendar.length, 2);
  const free = speaking[2].calendar.map(cal => cal.slots.filter(s => s.activity === 'frei').map(s => s.time.match(/\d+/g).map(Number)));
  assert.ok(free[0].some(([a,b]) => free[1].some(([x,y]) => Math.min(b,y)-Math.max(a,x) >= 2)));
  assert.ok(speaking.every(p => p.task && p.criteria.length >= 2));
});

test('A2 morphology handles silent h before n without an extra e', () => {
  for (const [inf, expected, wrong] of [['wohnen', 'wohnt', 'wohnet'], ['wohnen', 'gewohnt', 'gewohnet'], ['atmen', 'atmet', 'atmt']]) {
    const forms = formsOfA21({ word: inf, de: inf }, {});
    assert.ok(forms.has(expected), expected);
    assert.ok(!forms.has(wrong), wrong);
  }
  for (const form of ['unserer', 'unserem', 'eurer', 'eurem']) assert.ok(FUNCTION_WORDS_A21_ADDED.includes(form));
});
