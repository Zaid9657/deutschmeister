// The A1.2 rebuild on the A1.1 standard (owner: "start now", 2026-10-15). One file for the rules the
// rebuild adds, so each finding class it closes keeps a test that fails on the old code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { exclusionReason, isUsableItem, REASON } from '../src/data/lessonPools/quality.js';
import { pickPracticeItems, planPractice, poolItems } from '../src/lib/lesson/buildLesson.js';
import { requeueFor } from '../src/lib/lesson/requeue.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const POOL_A12 = JSON.parse(read('src/data/lessonPools/a12.json'));

test('a course draws its practice by its OWN level\'s rules, not A1.1\'s', () => {
  // The quality filter's syllabus rules (no accusative, no ordinals, no month names …) are A1.1's and
  // apply when no level is named. The draw named none, so 57 of A1.2's 254 pool items never reached a
  // learner — „Ich sehe ___ Mann." → den, in the very Lektion that teaches the accusative — and L3
  // drew 3 of its 7 items, L10 two (measured 2026-10-15).
  const items = poolItems(POOL_A12);
  const a12Only = items.filter((it) => isUsableItem(it, { level: 'a1.2' }) && !isUsableItem(it));
  assert.ok(a12Only.length >= 50, `the class this guards: ${a12Only.length} A1.2 items fail A1.1's rules`);
  assert.ok(a12Only.some((it) => exclusionReason(it) === REASON.UNTAUGHT_FORM));

  for (const attempt of [1, 2]) {
    const plan = planPractice(CURRICULUM_A12, POOL_A12, attempt);
    for (const l of CURRICULUM_A12.lektionen) {
      assert.equal(plan.get(l.nr).length, 7, `A1.2 L${l.nr}, attempt ${attempt}: a full seven`);
    }
  }

  // The same item, drawn standalone and requeued: kept at A1.2, dropped by the A1.1 default.
  const item = a12Only.find((it) => it.topic === 'accusative-intro') || a12Only[0];
  const rule = { topics: [item.topic], typedMin: 0 };
  const drawn = (level) => pickPracticeItems([item], rule, 1, { level }).map((it) => it.id);
  assert.deepEqual(drawn('a1.2'), [item.id]);
  assert.deepEqual(drawn(undefined), [], 'no level = the strict A1.1 rules, never a loophole');
  const missed = [{ ...item, id: 'missed-1' }];
  assert.deepEqual(requeueFor(missed, [item], [], { level: 'a1.2' }).map((it) => it.id), [item.id], 'a fresh item of the same topic');
  assert.deepEqual(requeueFor(missed, [item], []).map((it) => it.id), ['missed-1'], 'under A1.1 rules the fresh item is filtered out and the missed one comes back');

  // Every caller names the level.
  assert.match(read('src/lib/lesson/buildLesson.js'), /isUsableItem\(it, \{ level: options\.level \}\)/);
  assert.match(read('src/lib/lesson/requeue.js'), /isUsableItem\(it, \{ level \}\)/);
  assert.match(read('src/pages/lesson/LessonPlayerPage.jsx'), /requeueFor\(misses, pool, used, \{ level: curriculum\.level \}\)/);
});

test('DaF review #3 BLOCKER 1: the answer key never rejects correct German the German prompt allows', async () => {
  // Measured on the pool before the fix: 13 correct answers rejected across both attempts and the four
  // checkpoints — a cue that spells out „(an + dem)" while the key is „Am", „Sie ___ den Bus.
  // (nehmen, sie)" refusing the plural, „Mache den Fernseher aus!", four modal verbs with no meaning
  // named, and the other, equally correct word order. Each family is repaired as a class in
  // scripts/build-lesson-pool.mjs (repairDeterminacy) or in the hand-written item, never by id.
  const { alternatives, rejectedAlternatives } = await import('../scripts/a12-determinacy.mjs');
  // The generator knows every family (the shapes of the items before the fix):
  const fam = (item) => alternatives({ accepted: [], ...item }).map((a) => a.why);
  assert.deepEqual(fam({ topic: 'imperative', answer: 'Mach den Fernseher aus!' }), ['du-imperative ±e']);
  assert.deepEqual(fam({ topic: 'imperative', answer: 'Iss!' }), [], 'no -e for an e→i verb');
  assert.deepEqual(fam({ topic: 'imperative', answer: 'Holen Sie das Sofa!' }), [], 'not the formal imperative');
  assert.deepEqual(fam({ questionDe: '___ Abend kommt ein Gewitter. (an + dem)', answer: 'Am' }), ['the cue says the two words']);
  assert.deepEqual(fam({ questionDe: '___ Abend kommt ein Gewitter. (an + dem → Kurzform)', answer: 'Am' }), []);
  assert.deepEqual(fam({ questionDe: 'Sie ___ den Bus. (nehmen, sie)', answer: 'nimmt' }), ['sie = they / Sie formal']);
  assert.equal(fam({ type: 'multiple_choice', questionDe: 'Ich ___ nach Hause.', options: ['kann', 'soll', 'darf', 'muss'], answer: 'muss' }).length, 3);
  assert.deepEqual(fam({ type: 'multiple_choice', questionDe: 'Er ___ heute arbeiten.', options: ['muss', 'müssen', 'musst', 'müsst'], answer: 'muss' }), [], 'person forms of one verb are not alternatives');
  assert.deepEqual(fam({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [am Platz / sein / die Haltestelle]', answer: 'Am Platz ist die Haltestelle.' }), ['subject-first order']);
  assert.deepEqual(fam({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [ich / kaufen / die Jacke / für / meine Oma]', answer: 'Ich kaufe die Jacke für meine Oma.' }), ['für-phrase first']);
  // DaF review #4: the families review #3's generator did not know. Every statement's other orders,
  // an imperative gap with and without -e, and „bitte" first; and what stays wrong stays wrong.
  const wide = (item) => alternatives({ accepted: [], ...item }, { wide: true }).map((a) => a.text);
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [dann / gehen / Sie / an der Ecke / links]', answer: 'Dann gehen Sie an der Ecke links.' }), ['Sie gehen dann an der Ecke links.']);
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [wir / fahren / bei Regen / mit / Bus]', answer: 'Wir fahren bei Regen mit dem Bus.' }), ['Bei Regen fahren wir mit dem Bus.', 'Mit dem Bus fahren wir bei Regen.']);
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [ich / haben / die Kartoffel / kaufen]', answer: 'Ich habe die Kartoffel gekauft.' }), ['Die Kartoffel habe ich gekauft.']);
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [dann / gehen / Sie / links] (Beginnen Sie mit „Dann“)', answer: 'Dann gehen Sie links.' }), [], 'a named opening fixes the order');
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie die Frage: [wo / sein / die Haltestelle]', answer: 'Wo ist die Haltestelle?' }), [], 'a question has no free opening');
  assert.deepEqual(wide({ type: 'fill_blank', topic: 'imperative', questionDe: 'Der Teppich ist da. ___ ihn bitte! (holen, du)', answer: 'Hol' }), ['Hole']);
  assert.deepEqual(wide({ type: 'fill_blank', topic: 'imperative', questionDe: 'Tim, ___ mir bitte! (helfen, du)', answer: 'hilf' }), [], 'no -e on a changed stem');
  assert.ok(wide({ type: 'sentence_building', questionDe: 'Schreiben Sie die Bitte: [Sie / bitte / Platz / nehmen]', answer: 'Nehmen Sie bitte Platz!' }).includes('Bitte nehmen Sie Platz!'));
  // The repairs make the build accept what is German and nothing else.
  const pool = JSON.parse(read('src/data/lessonPools/a12.json'));
  const byId = new Map(pool.items.map((it) => [it.id, it]));
  const verdict = (id, text) => {
    const it = byId.get(id);
    return checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result;
  };
  assert.equal(verdict('extra-a12-l08-07', 'Hole'), RESULT.CORRECT);
  assert.notEqual(verdict('extra-a12-l08-07', 'Holst'), RESULT.CORRECT, 'the du-form is not the imperative');
  assert.equal(verdict('extra-a12-l08-04', 'komme'), RESULT.CORRECT);
  assert.notEqual(verdict('extra-a12-l08-04', 'kommst'), RESULT.CORRECT);
  assert.match(byId.get('extra-a12-l01-02').questionDe, /\(Beginnen Sie mit „Dann“\)/);
  // A preposition gap names its choices or its meaning: „Ana geht ___ das Kaufhaus" took only durch
  // while in is German too.
  const PREP = /^(?:in|an|auf|mit|bei|nach|zu|zum|zur|im|am|ins|um|für|ohne|durch|aus|von|vom|seit|vor|hinter|neben|über|unter|gegen|bis)$/i;
  const unnamed = pool.items.filter((it) => it.type === 'fill_blank' && PREP.test(String(it.answer).trim()) && !/\([^)]+\)\s*$/.test(it.questionDe));
  assert.deepEqual(unnamed.map((it) => it.id), []);
  // …and on what is served today, at both levels, nothing is rejected.
  assert.deepEqual(rejectedAlternatives('a1.2'), []);
  assert.deepEqual(rejectedAlternatives('a1.1'), []);
});

test('DaF review #3 BLOCKER 1: a negation answer is asked for by the prompt itself', async () => {
  // „Das Hotel hat kein Angebot. Und eine Toilette im Flur? — Das Hotel hat ___ Toilette." took only
  // „keine": the prompt's „kein" belonged to another sentence, and „eine" is the correct reading. A
  // cue counts when it asks: Nein, „verneinen", or a parenthesised kein/nicht. Dictation and
  // read-aloud lines are the line itself, not a negation task.
  const { servedItems } = await import('../scripts/a12-determinacy.mjs');
  const NEG = /(^|[^a-zäöüß])(kein|keine|keinen|keinem|keiner|keines|nicht)([^a-zäöüß]|$)/i;
  // A cue asks: Nein, „verneinen", a parenthesised kein/nicht, or the negation given as a brick.
  const ASKS = /\bnein\b|verneinen|verneint|verneinung|\([^)]*\b(?:kein\w*|nicht)\b[^)]*\)|\[[^\]]*\b(?:kein\w*|nicht)\b[^\]]*\]|korrigieren sie/i;
  for (const level of ['a1.2', 'a1.1']) {
    const offenders = servedItems(level).items
      .filter((it) => typeof it.questionDe === 'string' && NEG.test([it.answer, ...(it.accepted || [])].join(' ')))
      .filter((it) => !ASKS.test(it.questionDe))
      .map((it) => `${it.where} ${it.id}`);
    assert.deepEqual(offenders, [], `${level}: a negation the prompt does not ask for`);
  }
  for (const old of [
    'Das Hotel hat kein Angebot. Und eine Toilette im Flur? — Das Hotel hat ___ Toilette im Flur.',
    'Die Steckdose funktioniert nicht. Und das Kissen? — Im Hotel ist ___ Kissen.',
    'Im Flur ist keine Lampe. Und der Boden? — Der Boden ist ___ schön.',
  ]) assert.ok(!ASKS.test(old), `the old prompt fails: ${old}`);
});

test('DaF review #3 BLOCKER 2: no item is served before the Lektion that teaches its grammar — practice, requeue or checkpoint', async () => {
  // Measured before (2026-10-15): L3 drew „keinen" though its notice says keinen comes in L4; L7 drew
  // „Wer ist die Frau mit dem kurzen Haar?" (Adjektivdeklination, taught in no Lektion); checkpoint 3
  // asked for „Holen Sie das Sofa aus der Garage!" (dative, L11); L12 graded „ist … gefahren" while
  // its card said „immer mit haben"; checkpoint 1 dictated „Die Anzeige ist von Ihnen?". The word
  // stamp `minLektion` saw none of it. The build now folds the grammar horizon into minLektion and
  // stamps every dialogue line, and the checkpoint pickers read the line stamp.
  const v = await import('../scripts/validate-curriculum.mjs');
  const { buildCheckpoint } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const horizon = v.constructionHorizonIndex('a1.2');
  const at = (answer, questionDe = '') => horizon({ questionDe, answer });
  // At each introduction threshold, the before/after pairs:
  assert.equal(at('Ich habe keinen Bruder.'), 4, 'keinen: L4, as the L3 notice says');
  assert.equal(at('Ich sehe den Mann.'), 3, 'the accusative den: L3');
  assert.equal(at('Holen Sie das Sofa aus der Garage!'), 11, 'a dative preposition: L11');
  assert.equal(at('Wer ist die Frau mit dem kurzen Haar?'), null, 'Adjektivdeklination: never at A1.2');
  assert.equal(at('Er ist nach Berlin gefahren.'), null, 'the sein-Perfekt: not taught at A1.2');
  assert.equal(at('Wir haben gestern gefeiert.'), 12, 'the haben-Perfekt: L12');
  assert.ok(at('Die erste Wohnung ist frei.') <= 2, 'an ordinal is A1.2 grammar, not the untaught declension');
  assert.equal(at('Ich wohne in Bremen.', 'Schreiben Sie den Satz: [ich / wohnen / in Bremen]'), 0, 'the task formula is not the item (else den → L3, „Schreiben Sie" → L8)');
  assert.equal(v.constructionHorizonIndex('a1.1')({ answer: 'Er ist nach Berlin gefahren.' }), 0, 'A1.1 keeps its own gate');

  // Every item a learner is served, both attempts and four seeds of every checkpoint:
  const pool = JSON.parse(read('src/data/lessonPools/a12.json'));
  assert.deepEqual(pool.lineHorizon, v.lineHorizons('a1.2'), 'the pool carries the line stamp the build computes');
  const late = [];
  for (const attempt of [1, 2]) {
    for (const [nr, items] of planPractice(CURRICULUM_A12, POOL_A12, attempt)) {
      for (const it of items) { const h = horizon(it); if (h === null || h > nr) late.push(`L${nr} ${it.id}`); }
    }
  }
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (const seed of [undefined, 1, 2, 3]) {
      const items = buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool, seed });
      assert.equal(items.length, 20, `${checkpoint.id} seed ${seed}: a full paper`);
      for (const it of items) {
        if (!it.answer) continue;
        const h = horizon({ questionDe: it.questionDe || '', answer: it.audioText || it.answer });
        if (h === null || h > checkpoint.afterLektion) late.push(`${checkpoint.id}/${seed} ${it.id}`);
      }
    }
  }
  assert.deepEqual(late, []);
  // The card no longer denies a construction the language has.
  const cards = read('netlify/functions/_shared/ruleCards.mjs');
  assert.doesNotMatch(cards, /Das Perfekt steht in diesem Kurs immer mit haben/);
  assert.match(cards, /Bei gehen und fahren steht sein, nicht haben\./);
});

test('DaF review #3 MAJOR 2: a Lesen statement is a report that changes every finite verb with its subject', async () => {
  // CP4 printed „Lena geht durch das Kaufhaus und bezahle.": the person change reached the first verb
  // and a verb missing from the conjugation table passed through unchanged. And where no line reported,
  // the papers fell back to quoting the text — 8 of the 64 Lesen items over four seeds (12 once the
  // half-changed reports were refused), the rung A1.1's papers are pinned away from.
  const { buildCheckpoint, windowReports, reportSpecFor, normaliseStatement } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const cp4 = CURRICULUM_A12.checkpoints[CURRICULUM_A12.checkpoints.length - 1];
  const spec = { ...reportSpecFor(CURRICULUM_A12, cp4), known: null };
  const report = (de) => windowReports([{ speaker: 'Lena', de }], spec).map((r) => r.statement);
  assert.deepEqual(report('Gut. Ich gehe durch das Kaufhaus und bezahle.'), ['Lena geht durch das Kaufhaus und bezahlt.'], 'the measured case');
  assert.deepEqual(report('Ich gehe durch das Kaufhaus und wechsle.'), [], 'a first-person verb the table lacks: no report, never half a one');
  assert.deepEqual(report('Ich lese, wechsle und schlafe.'), [], 'a verb after a comma counts too');
  assert.deepEqual(report('Ich dusche und frühstücke jeden Tag.'), ['Lena duscht und frühstückt jeden Tag.']);
  assert.deepEqual(report('Ich koche nicht und esse im Restaurant.'), ['Lena kocht nicht und isst im Restaurant.'], 'negation');
  assert.deepEqual(report('Ich habe Brot gekauft und hole jetzt Milch.'), ['Lena hat Brot gekauft und holt jetzt Milch.'], 'Satzklammer');
  assert.deepEqual(report('Ich möchte einen Kaffee und eine Cola.'), ['Lena möchte einen Kaffee und eine Cola.'], 'an article after „und" is not a verb');
  // The verb before „ich": the opening stays, verb and subject change in place.
  assert.deepEqual(report('Danach brauche ich Geld für das Museum.'), ['Danach braucht Lena Geld für das Museum.']);
  assert.deepEqual(report('Das Obst und die Kartoffeln habe ich gekauft.'), ['Das Obst und die Kartoffeln hat Lena gekauft.']);
  assert.deepEqual(report('Mit meiner Mutter gehe ich ins Kino.'), [], 'the speaker\'s own world in the opening');
  assert.deepEqual(report('Wo darf ich parken?'), [], 'a question reports nothing');

  // Every Lesen item the four A1.2 papers print, over four seeds.
  const pool = JSON.parse(read('src/data/lessonPools/a12.json'));
  const firstPerson = new Set();
  for (const l of CURRICULUM_A12.lektionen) {
    for (const line of l.dialog?.lines || []) {
      for (const m of String(line.de).matchAll(/(?:^|[\s,.!?])[Ii]ch\s+([a-zäöüß]+e)(?=[\s,.!?]|$)/g)) firstPerson.add(m[1]);
    }
  }
  assert.ok(firstPerson.has('bezahle') && firstPerson.has('frage') && firstPerson.has('hole'), 'the harvest is not vacuous');
  const problems = [];
  let items = 0;
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (const seed of [undefined, 1, 2, 3]) {
      for (const it of buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool, seed })) {
        if (it.section !== 'lesen') continue;
        items += 1;
        const at = `${checkpoint.id}/${seed} „${it.statement}"`;
        if (!it.transform) problems.push(`${at}: quotes its text (the verbatim rung)`);
        if (normaliseStatement(it.text).includes(normaliseStatement(it.statement))) problems.push(`${at}: stands in its own text`);
        for (const s of [it.statement, it.trueStatement]) {
          const left = s.split(/\s+/).map((w) => w.replace(/[.,!?]/g, '')).filter((w) => firstPerson.has(w) && w !== 'möchte');
          if (left.length) problems.push(`${at}: keeps the first person ${left.join(', ')}`);
        }
      }
    }
  }
  assert.equal(items, 64, 'four Lesen items on each of the four papers, four seeds');
  assert.deepEqual(problems, []);
});

test('DaF review #3 MAJOR 3: each A1.2 checkpoint writes its own task — new facts, taught words, a sample the Formcheck passes', async () => {
  // All four checkpoints wrote a12-l03/06/09/12 again: the task the learner had just written, with
  // its feedback, and a key whose draft and revision the allowance had already spent.
  const { writingTaskByKey, courseWritingTasks } = await import('../src/data/writingTasks.js');
  const { buildCheckpoint, chapterLektionen, chapterWritingTask } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { scoreWriting } = await import('../src/lib/lesson/writing.js');
  const { courseSubmissionAllowed } = await import('../netlify/functions/evaluate-writing.mjs');
  const v = await import('../scripts/validate-curriculum.mjs');
  const spec = v.levelSpec('a1.2');
  const taught = v.taughtUpTo(spec.curriculum, spec);
  const lessonTasks = courseWritingTasks('a1.2');
  const pool = JSON.parse(read('src/data/lessonPools/a12.json'));
  for (const cp of CURRICULUM_A12.checkpoints) {
    const task = writingTaskByKey('goethe_a1', cp.writingTaskKey);
    assert.ok(task, `${cp.id}: ${cp.writingTaskKey} is in the bank`);
    assert.equal(task.course, 'a1.2');
    assert.equal(task.checkpoint, cp.nr);
    assert.ok(!lessonTasks.some((t) => t.taskKey === task.taskKey || t.task === task.task), `${cp.id}: not a Lektion's task`);
    const known = taught.get(cp.afterLektion);
    if (task.register === 'formular') {
      const values = v.formularSampleValues(task.sample, task.leitpunkte);
      const res = scoreWriting({ kind: 'formular', fields: task.leitpunkte }, values);
      assert.equal(res.ok, true, `${cp.id}: ${JSON.stringify(res.checks.filter((c) => !c.ok))}`);
      assert.deepEqual(v.untaughtTokens({ questionDe: Object.values(values).join(' / ') }, known, spec), [], `${cp.id} sample values`);
    } else {
      const res = scoreWriting({ kind: 'mitteilung', minWords: task.minWords, maxWords: task.maxWords, leitpunkte: task.leitpunkte }, task.sample);
      assert.deepEqual(res.checks.filter((c) => !c.ok).map((c) => c.key), [], `${cp.id}: the Formcheck calls the sample incomplete`);
      assert.deepEqual(v.untaughtTokens({ questionDe: task.sample }, known, spec), [], `${cp.id} sample`);
    }
    // The paper mounts it, in the chapter's Textsorte.
    const chapter = chapterLektionen(CURRICULUM_A12, cp);
    const item = buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint: cp, pool }).find((i) => i.kind === 'gradedWriting');
    assert.equal(item?.task?.taskKey, cp.writingTaskKey, `${cp.id}: the checkpoint's own task`);
    assert.equal(item.task.kind, chapterWritingTask(chapter, 'a1.2').schreiben.kind, `${cp.id}: the chapter's Textsorte`);
    // Draft and revision of the lesson task do not spend the checkpoint's submission.
    const lessonKey = chapterWritingTask(chapter, 'a1.2').bank.taskKey;
    assert.equal(courseSubmissionAllowed([lessonKey, lessonKey], lessonKey, 16).allowed, false, 'the lesson task is spent');
    assert.equal(courseSubmissionAllowed([lessonKey, lessonKey], cp.writingTaskKey, 16).allowed, true, `${cp.id}: its own first draft`);
    assert.equal(courseSubmissionAllowed([lessonKey, lessonKey, cp.writingTaskKey], cp.writingTaskKey, 16).allowed, true, `${cp.id}: and its revision`);
  }
});

test('DaF review #3 MAJOR 3: no pool item in two checkpoints, whichever papers the learner sat', async () => {
  // poolIdsBefore rebuilt only each earlier checkpoint's DEFAULT paper, so a retake (a round-1 paper)
  // could hand a later checkpoint the same items: measured 3 shared items on A1.2 and 7 on A1.1 over
  // the three papers a window allows. Every paper an earlier checkpoint can serve is excluded now.
  const { buildCheckpoint, paperSeed, PAPERS_PER_WINDOW } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  assert.match(read('src/services/checkpointService.js'), new RegExp(`ATTEMPT_LIMIT = ${PAPERS_PER_WINDOW};`), 'the papers a window allows');
  assert.match(read('src/pages/lesson/CheckpointPage.jsx'), /seed: paperSeed\(checkpoint, round\)/, 'the page draws with the same seeds');
  for (const [curriculum, file] of [[CURRICULUM_A12, 'a12'], [CURRICULUM_A11, 'a11']]) {
    const pool = JSON.parse(read(`src/data/lessonPools/${file}.json`));
    const seenIn = new Map();
    for (const checkpoint of curriculum.checkpoints) {
      for (let round = 0; round < PAPERS_PER_WINDOW; round += 1) {
        const items = buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) });
        assert.equal(items.length, 20, `${checkpoint.id} round ${round}: a full paper`);
        for (const it of items) {
          if (!it.poolItemId) continue;
          const other = seenIn.get(it.poolItemId);
          assert.ok(!other || other === checkpoint.id, `${it.poolItemId} in ${other} and ${checkpoint.id} (round ${round})`);
          seenIn.set(it.poolItemId, checkpoint.id);
        }
      }
    }
  }
});

test('DaF review #3 MAJOR 4: a Lektion\'s share is measured on what the learner produces, with A1.2\'s own predicates', async () => {
  // drillsSlug answered `true` for every A1.2 slug, so "four of seven drill the Lektion's point" was
  // vacuous and L4 drew three negation items of seven. The predicates moved into quality.js; the
  // review named two to correct, and L1's read only five verbs. Each pair is before/after.
  const { drillsSlug } = await import('../src/data/lessonPools/quality.js');
  const drills = (slug, questionDe, answer, type = 'fill_blank') => drillsSlug({ questionDe, answer, type }, slug);
  // An article after a printed preposition IS that preposition's case.
  assert.equal(drills('prepositions-accusative', 'Ich kaufe die Mütze für ___ Oma.', 'meine'), true);
  assert.equal(drills('dative-prepositions-intro', 'Ich fahre mit ___ Bus.', 'dem'), true);
  assert.equal(drills('dative-prepositions-intro', 'Ich sehe ___ Bus.', 'den'), false, 'no preposition, no Dativ');
  // A haben-gap in front of a printed Partizip is the Perfekt.
  assert.equal(drills('perfekt-intro', 'Ich ___ Kuchen gegessen.', 'habe'), true);
  assert.equal(drills('perfekt-intro', 'Ich ___ Kuchen.', 'habe'), false, 'haben alone is no Perfekt');
  // Word order: any verb of the brick list, and the inversion gap; a gap whose subject is printed only conjugates.
  assert.equal(drills('basic-sentence-structure', 'Schreiben Sie den Satz: [morgen / ich / aufstehen / früh]', 'Morgen stehe ich früh auf.', 'sentence_building'), true);
  assert.equal(drills('basic-sentence-structure', 'Heute ___ müde.', 'bin ich'), true);
  assert.equal(drills('basic-sentence-structure', 'Am Abend ___ ich Musik. (hören)', 'höre'), false);
  // The ordinal from twenty on is A1.2 grammar (L2 notice: „der zwanzigste Mai"), not the declension.
  const v = await import('../scripts/validate-curriculum.mjs');
  assert.ok(v.constructionHorizonIndex('a1.2')({ answer: 'Heute ist der zwanzigste Mai.' }) <= 2);
  // THE DRAW (tests/lesson-extra-items-a12.test.mjs) holds every Lektion, both attempts, to PRIMARY_MIN
  // drilling items; here the share the review measured on L4.
  for (const attempt of [1, 2]) {
    const l4 = planPractice(CURRICULUM_A12, POOL_A12, attempt).get(4);
    assert.ok(l4.filter((it) => drillsSlug(it, 'negation')).length >= 4, `L4 attempt ${attempt}: four negation items`);
  }
});

test('DaF review #3 MAJOR 5: the L8 imperative rule produces every du-imperative the course checks', async () => {
  // The notice taught „drop -st" and the course then checked Fahr! (checkpoint 3) and Iss! (the
  // draw), which that rule cannot produce: fährst → fähr, isst → is. The rule now has its two
  // clauses, and it is held against every surface that grades an imperative.
  const notice = CURRICULUM_A12.lektionen.find((l) => l.nr === 8).notice.bodyDe;
  assert.match(notice, /Aus ä wird a/);
  assert.match(notice, /Endet der Stamm auf s, fällt nur -t weg/);
  // The notice's rule as a function of the infinitive and the du-form.
  const imperativeOf = (inf, du) => (/[sß]en$/.test(inf) ? du.replace(/t$/, '') : du.replace(/st$/, '')).replace(/ä/g, 'a');
  // The course's imperative verbs, with their du-form (facts of German, not item ids).
  const VERBS = {
    kommen: 'kommst', helfen: 'hilfst', warten: 'wartest', machen: 'machst', holen: 'holst', gehen: 'gehst',
    nehmen: 'nimmst', geben: 'gibst', kaufen: 'kaufst', fragen: 'fragst', lesen: 'liest', stehen: 'stehst',
    ziehen: 'ziehst', sehen: 'siehst', essen: 'isst', bezahlen: 'bezahlst', tragen: 'trägst', laufen: 'läufst',
    fliegen: 'fliegst', trinken: 'trinkst', kochen: 'kochst', fahren: 'fährst', schlafen: 'schläfst',
  };
  const produced = new Map(Object.entries(VERBS).map(([inf, du]) => [imperativeOf(inf, du), inf]));
  for (const [form, inf] of [['fahr', 'fahren'], ['iss', 'essen'], ['lies', 'lesen'], ['hilf', 'helfen'], ['warte', 'warten'], ['nimm', 'nehmen']]) {
    assert.equal(produced.get(form), inf, `the rule gives ${form}! for ${inf}`);
  }
  // Every imperative a pool item or a checkpoint answer opens with: the rule's form, or that form
  // with the optional -e (Hole!, Mache!) the checker accepts.
  const IMPERATIVE_HEAD = /^(komm|warte|hilf|mach|hol|geh|nimm|sei|gib|kauf|frag|lies|steh|zieh|sieh|iss|bezahl|trag|lauf|flieg|trink|koch|feier|fahr|schlaf)e?$/i;
  const { buildCheckpoint, paperSeed } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const answers = POOL_A12.items.flatMap((it) => [it.answer, ...(it.accepted || [])].map((a) => [it.id, a]));
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (let round = 0; round < 3; round += 1) {
      for (const it of buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: paperSeed(checkpoint, round) })) {
        for (const a of [it.answer, ...(it.accepted || [])]) answers.push([it.id, a]);
      }
    }
  }
  const unexplained = new Set();
  let seen = 0;
  for (const [id, a] of answers) {
    const head = String(a || '').trim().split(/[\s!.,?]+/)[0];
    if (!IMPERATIVE_HEAD.test(head) || /^Sie$/i.test(String(a).trim().split(/\s+/)[1] || '')) continue;
    seen += 1;
    const low = head.toLowerCase();
    if (!produced.has(low) && !produced.has(low.replace(/e$/, ''))) unexplained.add(`${id}: ${head}`);
  }
  assert.ok(seen >= 10, `the harvest is not vacuous (${seen})`);
  assert.deepEqual([...unexplained], [], 'imperatives the L8 notice cannot produce');
  // The three „mistakes" the review confirmed as correct German stay off every card. No predicate
  // decides that a sentence is correct German; a DaF review does, and its verdicts stay pinned.
  const cards = read('netlify/functions/_shared/ruleCards.mjs');
  for (const correct of ['Haben Sie nicht einen Rabatt?', 'Wo fahren wir im Urlaub?', 'Zu dem Bahnhof gehe ich nicht.',
    // DaF review #4: „nicht eine Lampe" can be emphatic, „Was ist die Frau?" can ask for her job.
    'Im Flur ist nicht eine Lampe.', 'Was ist die Frau da?']) {
    assert.ok(!cards.includes(`"wrong": "${correct}"`), `„${correct}" is German, not a mistake`);
  }
  // DaF review #4 MAJOR 5: the draw also checks ihr- and Sie-imperatives (Kommt! Seid! Nehmt!,
  // Helfen Sie!), so the notice explains every person it grades, and every graded form follows it.
  assert.match(notice, /Bei ihr fällt nur das ihr weg/);
  assert.match(notice, /Bei Sie bleibt das Pronomen/);
  const IHR_FORM = { kommen: 'Kommt', sein: 'Seid', nehmen: 'Nehmt' };
  let ihrItems = 0;
  for (const it of POOL_A12.items.filter((x) => x.topic === 'imperative')) {
    const ihr = String(it.questionDe).match(/\(([a-zäöüß]+en|sein), ihr\)|ihr-Imperativ von '([a-zäöüß]+)'/);
    if (ihr) {
      ihrItems += 1;
      const verb = ihr[1] || ihr[2];
      assert.ok(IHR_FORM[verb], `${it.id}: an ihr-imperative of ${verb} the table does not carry`);
      assert.ok(String(it.answer).startsWith(IHR_FORM[verb]), `${it.id}: ${it.answer} is not ${IHR_FORM[verb]}`);
    }
    const sie = String(it.answer).match(/^([A-ZÄÖÜ][a-zäöüß]+) Sie\b/);
    if (sie) assert.match(sie[1], /en$/, `${it.id}: the Sie-imperative is the infinitive form („${sie[1]} Sie")`);
  }
  assert.ok(ihrItems >= 3, 'the ihr-imperatives the review found are still measured');
  // …and the bank row that said sein has no Perfekt says what the course practises instead.
  assert.ok(!POOL_A12.items.some((it) => /nicht das Perfekt/.test(it.explanationDe || '')), 'ist gewesen exists');
});

// What a W-question asks for, and the form its answer takes (DaF reviews #3 and #4, MAJOR 6).
const W_ANSWER_FORMS = [
  ['wie oft', 'frequenz', /\b(jede[nrs]?|immer|oft|manchmal|nie|selten|[a-zäöü]*mal|täglich)\b/i],
  ['wie lange', 'dauer', /\b(\d+|ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|zwanzig|dreißig|halbe?)\s+(minuten?|stunden?|tage?|wochen?|monate?|jahre?)\b|\bbis\b/i],
  ['wie viele', 'menge', /\b(\d+|eins|ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|[a-zäöüß]+zig|hundert|kein\w*)\b/i],
  ['um wie viel uhr', 'zeit', /\b(uhr|um)\b/i],
  ['wohin', 'richtung', /\b(nach|zu|zum|zur|ins|in|auf|an)\b/i],
  ['wo', 'ort', /\b(hier|da|dort|am|im|in|an|auf|bei|beim|neben|hinter|vor|unter|über|zwischen)\b/i],
  ['wann', 'zeit', /\b(um|am|im|heute|morgen|jetzt|bald|früh|spät|abends|morgens|uhr|später|danach|dann|nach)\b/i],
];

test('DaF review #3 MAJOR 6: an answer answers its question — the type a W-word asks for, Doch or Nein after a negative one', async () => {
  // Measured before: L9 „Und wo muss ich aussteigen?" → „Ja. Das Flugzeug fliegt um 9 Uhr."; L5
  // „Um wie viel Uhr?" → „Früh."; L4 „Haben Sie keinen Rabatt?" → „Ja."; „Wo und wohin fahren wir?"
  // answered with another question. The rule reads what a W-word asks for, not shared keywords.
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const TYPES = W_ANSWER_FORMS.map(([w, , form]) => [w, form]);
  const typeOf = (question) => {
    const q = question.replace(/^(?:und|aber|entschuldigung,?)\s+/i, '');
    return TYPES.find(([w]) => new RegExp(`^${w}\\b`, 'i').test(q)) || null;
  };
  const isNegativeYesNo = (q) => /\b(nicht|kein\w*)\b/i.test(q) && !/^(?:und\s+|aber\s+)?(wer|was|wo|wohin|woher|wann|wie|warum|welche\w*)\b/i.test(q);
  const sentences = (de) => String(de).split(/(?<=[.!?])\s+/).filter(Boolean);
  // An announcement („Durchsage: …“) interrupts the exchange; it is not the partner's answer.
  const isAnnouncement = (de) => /^Durchsage:/.test(String(de));
  const offenders = [];
  for (const c of [CURRICULUM_A11, CURRICULUM_A12]) {
    for (const l of c.lektionen) {
      const lines = l.dialog?.lines || [];
      for (let i = 0; i < lines.length - 1; i += 1) {
        const [ask, reply] = [lines[i], lines[i + 1]];
        if (ask.speaker === reply.speaker || isAnnouncement(reply.de)) continue;
        const questions = sentences(ask.de).filter((x) => x.endsWith('?'));
        if (!questions.length) continue;
        const q = questions[questions.length - 1];
        const type = typeOf(q);
        if (type && !type[1].test(reply.de)) offenders.push(`${c.level} L${l.nr}[${i}] „${q}" (${type[0]}) → „${reply.de}"`);
        if (!type && isNegativeYesNo(q) && !/^(doch|nein)\b/i.test(reply.de)) offenders.push(`${c.level} L${l.nr}[${i}] „${q}" → „${reply.de}" (Doch or Nein)`);
      }
    }
  }
  // The completed W-question of a pool item („___ fährt der Bus? — Jede Stunde.") answers the same way.
  for (const it of POOL_A12.items) {
    const m = /^(.*\?)\s+—\s+(.+)$/.exec(String(it.questionDe || '').trim());
    if (!m || !/___/.test(m[1])) continue;
    const type = typeOf(m[1].replace('___', it.answer));
    if (type && !type[1].test(m[2])) offenders.push(`${it.id} „${m[1].replace('___', it.answer)}" → „${m[2]}"`);
  }
  assert.deepEqual(offenders, []);
  // The two the review named that no type rule reads: the child is named, and the idiom is idiomatic.
  const l7 = CURRICULUM_A12.lektionen.find((l) => l.nr === 7).dialog.lines;
  assert.match(l7[5].de, /^Das ist meine Schwester\./, 'asked about the child, the answer names the child');
  assert.ok(!POOL_A12.items.some((it) => /Wie lange ist der Ausflug/.test(String(it.questionDe).replace('___', it.answer))), '„Wie lange ist der Ausflug?" is not the idiom');
});

test('DaF review #4 MAJOR 6: every A1.2 dialogue question names the sentence that answers it, in the form the question asks for', () => {
  // Measured before: L2 „Ist die Treppe da?" → „Die erste Wohnung ist frei."; L3 „Und die Quittung?" →
  // „Gut. Ich hole ein Stück Kuchen für dich!"; L5 „Wer kommt mit?" named nobody; L6 „Und wann isst man?"
  // and L9's closing „Wann kommt er an?" had no answer at all. The rule: every question gets an answer
  // or a recognisable deferral. Each question is annotated [question, answering line, answering
  // sentence, function, reading]. The function is derived from the question's own form, so an
  // annotation cannot claim an answer the question does not ask for, and the answering sentence must
  // have that function's form — a shared word never passes on its own. A verbless question („Und die
  // Quittung?") carries the question it stands for, or opens a topic that the next question in its
  // own turn asks about („Und die Wohnung? Wie viele Zimmer hat sie?"). A question without an
  // annotation fails, and so does an annotation whose question is gone.
  const ANSWERS = {
    1: [
      ['Entschuldigung, wie komme ich zum Rathaus?', 1, 'Zuerst gehen Sie geradeaus bis zur Kirche.', 'art'],
      ['Und dann?', 3, 'Dann gehen Sie an der Ecke links.', 'art', 'Wie gehe ich dann?'],
      ['Ist der Weg weit?', 3, 'Nein.', 'ja'],
      ['Ist die Apotheke auch da?', 5, 'Ja.', 'ja'],
      ['Wo ist die Haltestelle für die Straßenbahn in der Stadt?', 7, 'Am Platz.', 'ort'],
      ['Und die U-Bahn?', null, null, 'thema'],
      ['Fährt sie ins Zentrum?', 9, 'Ja.', 'ja'],
    ],
    2: [
      ['Die Anzeige ist von Ihnen?', 1, 'Ja.', 'ja'],
      ['Was kostet die Wohnung?', 3, 'Die Miete ist vierhundertachtzig Euro.', 'menge'],
      ['Wie ist die Miete?', 3, 'Die Miete ist vierhundertachtzig Euro.', 'art'],
      ['Und die Wohnung?', null, null, 'thema'],
      ['Wie viele Zimmer hat sie?', 5, 'Vier: Küche, Badezimmer, Wohnzimmer und Schlafzimmer.', 'menge'],
      ['Hat die Wohnung auch einen Balkon?', 7, 'Ja, der Balkon ist da.', 'ja'],
      ['Ist die Treppe da?', 9, 'Ja, die Treppe ist da.', 'ja'],
    ],
    3: [
      ['Ana, was machst du heute in der Stadt?', 1, 'Ich brauche einen Supermarkt und einen Markt.', 'sache'],
      ['Gehst du?', 3, 'Ja.', 'ja'],
      ['Und die Kasse?', null, null, 'thema'],
      ['Bezahlst du ein Kilo Brot?', 5, 'Ja.', 'ja'],
      ['Und danach?', null, null, 'thema'],
      ['Gehst du in das Museum oder das Restaurant?', 7, 'Zuerst das Museum, dann das Restaurant.', 'auswahl'],
      ['Und die Quittung?', 9, 'Die Quittung ist hier.', 'ort', 'Wo ist die Quittung?'],
    ],
    4: [
      ['Und das Kissen?', null, null, 'thema'],
      ['Ist es da?', 2, 'Ja, das Kissen ist da, aber die Steckdose funktioniert nicht.', 'ja'],
      ['Der Flur hat keine Lampe?', 4, 'Nein.', 'ja'],
      ['Und der Vorhang?', null, null, 'thema'],
      ['Ist der Vorhang am Fenster?', 6, 'Nein.', 'ja'],
      ['Und die Rechnung?', null, null, 'thema'],
      ['Haben Sie keinen Rabatt?', 9, 'Doch.', 'ja'],
    ],
    5: [
      ['Tim, was machst du am Wochenende?', 1, 'Der Ausflug geht nach Köln.', 'sache'],
      ['Hast du Zeit?', 1, 'Ja.', 'ja'],
      ['Wann fährt der Zug?', 3, 'Um acht Uhr.', 'zeit'],
      ['Um wie viel Uhr?', 3, 'Um acht Uhr.', 'zeit'],
      ['Wer kommt mit?', 4, 'Ich komme mit.', 'person'],
      ['Warum so früh?', 5, 'Der Weg ist weit.', 'grund'],
      ['Wie oft fährt der Bus?', 6, 'Jede Stunde.', 'frequenz'],
      ['Aber wo ist die Haltestelle?', 7, 'Am Bahnhof.', 'ort'],
      ['Und die Ferien?', null, null, 'thema'],
      ['Wohin fahren wir im Urlaub?', 9, 'Bald nach Italien.', 'richtung'],
    ],
    6: [
      ['Was tut Ihnen weh?', 1, 'Mein Hals tut weh, der Kopf und der Bauch auch.', 'sache'],
      ['Haben Sie Fieber oder eine Erkältung?', 3, 'Nein, ich habe kein Fieber.', 'ja'],
      ['Isst man zuerst?', 6, 'Ja.', 'ja'],
      ['Und wie oft nimmt man die Tablette?', 6, 'Jeden Morgen und jeden Abend.', 'frequenz'],
      ['Und mein Auge?', 8, 'Ihr Auge ist gesund.', 'art', 'Wie ist mein Auge?'],
    ],
    7: [
      ['Wer ist die Frau da?', 1, 'Das ist meine Tante.', 'person'],
      ['Und der Mann?', null, null, 'thema'],
      ['Wer ist das?', 3, 'Mein Onkel ist groß und immer glücklich.', 'person'],
      ['Dein Onkel?', 3, 'Ja.', 'ja', 'Ist das dein Onkel?'],
      ['Und das Kind da?', 5, 'Das ist meine Schwester.', 'person', 'Wer ist das Kind da?'],
      ['Deine Oma ist traurig?', 7, 'Nein, meine Oma ist nicht traurig.', 'ja'],
      ['Und der Mann da?', 9, 'Das ist mein Bruder.', 'person', 'Wer ist der Mann da?'],
    ],
    8: [
      ['Wo hast du die Möbel für das Kinderzimmer?', 4, 'Das Sofa und der Schrank sind in der Garage.', 'ort'],
      ['Und das Bett?', 5, 'Ich frage die Nachbarin.', 'aufschub', 'Wo ist das Bett?'],
      ['Und der Herd?', 7, 'Der Herd ist neu, das Dach ist alt.', 'art', 'Wie ist der Herd?'],
    ],
    9: [
      ['Wo darf ich langsam fahren?', 2, 'Am Platz.', 'ort'],
      ['Wo soll ich einsteigen?', 6, 'Hier.', 'ort'],
      ['Und wo muss ich aussteigen?', 8, 'Am Flughafen.', 'ort'],
      ['Wann fährt der Bus ab?', 8, 'Der Bus fährt jetzt ab.', 'zeit'],
    ],
    10: [
      ['Welche Größe hat der Mantel für meinen Bruder?', 2, 'Größe 50.', 'auswahl'],
    ],
    11: [
      ['Wie ist das Wetter im Sommer bei dir?', 1, 'Im Sommer ist es sonnig, bei dreißig Grad.', 'art'],
      ['Und im Winter?', 3, 'Bei uns kommt der Schnee nie.', 'art', 'Wie ist das Wetter im Winter?'],
      ['Welche Jahreszeit ist bei dir schön?', 9, 'Der Sommer.', 'auswahl'],
    ],
    12: [
      ['Und das Getränk?', null, null, 'thema'],
      ['Hast du den Saft getrunken?', 3, 'Nein, ich habe Milch getrunken.', 'ja'],
      ['Und den Fisch?', 5, 'Tim hat ihn gekocht.', 'person', 'Wer hat den Fisch gekocht?'],
      ['Gut, oder?', 7, 'Ja!', 'ja'],
    ],
  };
  const sentences = (de) => String(de).split(/(?<=[.!?])\s+/).filter(Boolean);
  const core = (q) => q.replace(/^(?:(?:und|aber)\s+|entschuldigung,\s*|(?:ana|lena|tim),\s*)+/i, '');
  const VERBLESS = /^(?:(?:der|die|das|den|dem|mein\w*|dein\w*|ihr\w*|sein\w*|im|am)\s+)?[\wäöüßÄÖÜ-]+(?:\s+da)?\?$/i;
  const W_FUNCTION = [
    [/^wie oft\b/i, 'frequenz'], [/^wie lange\b/i, 'dauer'], [/^(?:wie viele?|was kostet)\b/i, 'menge'],
    [/^(?:um wie viel uhr|wann)\b/i, 'zeit'], [/^wohin\b/i, 'richtung'], [/^woher\b/i, 'herkunft'], [/^wo\b/i, 'ort'],
    [/^wer\b/i, 'person'], [/^warum\b/i, 'grund'], [/^was\b/i, 'sache'], [/^welche\w*\b/i, 'auswahl'], [/^wie\b/i, 'art'],
  ];
  // What a question asks for, read off its form: the W-word, no verb at all, or a decision (an
  // „oder" question may also ask to choose).
  const asks = (q) => {
    const c = core(q);
    const w = W_FUNCTION.find(([re]) => re.test(c));
    if (w) return [w[1]];
    if (VERBLESS.test(c)) return ['verbless'];
    return / oder /.test(c) ? ['ja', 'auswahl'] : ['ja'];
  };
  const STATEMENT = (s) => /[.!]$/.test(s);
  const FORM = {
    ...Object.fromEntries(W_ANSWER_FORMS.map(([, fn, form]) => [fn, (s) => form.test(s)])),
    ja: (s, q) => (/\b(nicht|kein\w*)\b/i.test(q) ? /^(Doch|Nein)\b/ : /^(Ja|Nein|Doch)\b/).test(s),
    person: (s) => /^(?:Ich|Wir|Er|Das ist|(?:Mein|Dein|Ihr|Sein)e?\s|Ana\b|Lena\b|Tim\b)/.test(s),
    grund: STATEMENT, sache: STATEMENT, art: STATEMENT, auswahl: STATEMENT,
    aufschub: (s) => /\b(?:Warte|Moment|frage)\b/.test(s),
  };
  const problems = [];
  for (const l of CURRICULUM_A12.lektionen) {
    const lines = l.dialog.lines;
    const found = [];
    lines.forEach((line, i) => sentences(line.de).forEach((q, k) => { if (q.endsWith('?')) found.push({ q, i, k }); }));
    const rows = ANSWERS[l.nr] || [];
    for (const { q, i, k } of found) {
      const where = `L${l.nr}[${i}] „${q}"`;
      const row = rows.find(([text]) => text === q);
      if (!row) { problems.push(`${where} has no annotation`); continue; }
      const [, at, answer, fn, reading] = row;
      const asked = asks(q);
      if (fn === 'thema') {
        const opens = asked[0] === 'verbless' && sentences(lines[i].de).slice(k + 1).some((x) => x.endsWith('?'));
        if (!opens) problems.push(`${where} opens no topic that a question in its turn asks about`);
        continue;
      }
      let wants = asked;
      if (asked[0] === 'verbless') {
        if (!reading || !reading.toLowerCase().includes(core(q).slice(0, -1).toLowerCase())) { problems.push(`${where} needs the question it stands for`); continue; }
        wants = asks(reading);
      }
      if (fn !== 'aufschub' && !wants.includes(fn)) problems.push(`${where} asks for ${wants.join('/')}, annotated ${fn}`);
      // The answer is a later sentence of the asker's own turn, or a sentence of the partner's next turn.
      const own = at === i && sentences(lines[i].de).indexOf(answer) > k;
      const partner = at === i + 1 && lines[at]?.speaker !== lines[i].speaker && sentences(lines[at].de).includes(answer);
      if (!own && !partner) problems.push(`${where}: „${answer}" is not a later sentence of its turn or of the partner's next turn`);
      else if (!FORM[fn](answer, reading || q)) problems.push(`${where} → „${answer}" does not have the form of ${fn}`);
    }
    for (const [text] of rows) if (!found.some(({ q }) => q === text)) problems.push(`L${l.nr}: the annotated question „${text}" is gone`);
  }
  assert.deepEqual(problems, []);
});

test('DaF review #3 MAJOR 1: every model text meets its own task — each Leitpunkt answered, inside the word limits', async () => {
  // Measured before: L4 named no day, L8 asked for three requests and showed one, L12 named neither
  // drink nor guest, and four models ran 21–24 words against a floor of 25. The Formcheck (RULE 17)
  // reads form; which sentence answers which Leitpunkt is a reviewer's reading, so it is written
  // down here and every entry must stand verbatim in the model. A changed Leitpunkt fails until its
  // answer is confirmed again.
  const { writingTaskByKey } = await import('../src/data/writingTasks.js');
  const { countWords } = await import('../src/lib/lesson/writing.js');
  const ANSWERED_BY = {
    2: { 'Warum Sie schreiben': 'ich möchte die Wohnung besichtigen', 'Wann Sie kommen möchten': 'Geht es am Montag um 17 Uhr?', 'Ihre Frage zur Miete': 'Und wie ist die Miete?' },
    4: { 'Ihre Zimmernummer und der Tag': 'ich bin bis Freitag in Zimmer 12', 'Was im Zimmer nicht funktioniert': 'Die Steckdose funktioniert nicht.', 'Ihre Frage zur Toilette im Flur': 'Ist die Toilette im Flur frei?' },
    6: { 'Warum Sie schreiben': 'ich bin krank', 'Was Ihnen wehtut': 'Mein Hals tut weh', 'Ihre Frage nach einem neuen Termin': 'Wann ist ein Termin frei?' },
    8: { 'Was in der Küche zu tun ist': 'Mach bitte in der Küche den Herd aus.', 'Wohin der Teppich soll': 'Bring bitte den Teppich ins Kinderzimmer.', 'Wann Sie nach Hause kommen': 'Ich komme um sechs Uhr nach Hause.' },
    10: { 'Was Sie kaufen': 'ich kaufe eine Jacke und einen Pullover für dich', 'Welche Größe die Jacke hat': 'Die Jacke hat Größe 38.', 'Wann Sie die Sachen bringen': 'Ich bringe alles am Montag.' },
    12: { 'Wann Sie gefeiert haben': 'ich habe am Samstag mit Tim und Paul gefeiert', 'Was Sie gegessen und getrunken haben': 'Wir haben Fisch und Kartoffeln gegessen und Saft getrunken.', 'Mit wem Sie gefeiert haben': 'mit Tim und Paul gefeiert' },
  };
  const mitteilungen = CURRICULUM_A12.lektionen.filter((l) => l.schreiben?.kind === 'mitteilung');
  assert.deepEqual(mitteilungen.map((l) => l.nr), Object.keys(ANSWERED_BY).map(Number), 'every Mitteilung has its confirmed answers');
  for (const l of mitteilungen) {
    const bank = writingTaskByKey('goethe_a1', l.schreiben.taskKey);
    const sample = l.schreiben.sample;
    const words = countWords(sample);
    assert.ok(words >= bank.minWords && words <= bank.maxWords, `L${l.nr}: ${words} words, the task asks ${bank.minWords}–${bank.maxWords}`);
    assert.deepEqual(Object.keys(ANSWERED_BY[l.nr]), bank.leitpunkte, `L${l.nr}: the confirmed answers name the task's Leitpunkte`);
    for (const [lp, answer] of Object.entries(ANSWERED_BY[l.nr])) assert.ok(sample.includes(answer), `L${l.nr} „${lp}“: „${answer}“ is not in the model`);
  }
  // A task that counts its requests gets that many: L8 asks for two Bitten.
  const l8 = CURRICULUM_A12.lektionen.find((l) => l.nr === 8).schreiben;
  assert.match(l8.taskDe, /mit zwei Bitten/);
  assert.equal((l8.sample.match(/\bbitte\b/gi) || []).length, 2, 'two requests in the model');
  // The Formcheck reads these answers as answers (the review's Minor on RULE 17/21): a separated
  // wehtun, a room number, and the modal infinitive as an Auftrag the KI decides.
  const { leitpunktSatisfied } = await import('../src/lib/lesson/writing.js');
  assert.equal(leitpunktSatisfied('Was Ihnen wehtut', 'Mein Hals tut weh.'), true);
  assert.equal(leitpunktSatisfied('Was Ihnen wehtut', 'Ich bin müde.'), false);
  assert.equal(leitpunktSatisfied('Ihre Zimmernummer und der Tag', 'Ich bin bis Freitag in Zimmer 12.'), true);
  assert.equal(leitpunktSatisfied('Ihre Zimmernummer und der Tag', 'Ich bin bis Freitag hier.'), false);
  assert.equal(leitpunktSatisfied('Was in der Küche zu tun ist', 'Mach bitte den Herd aus.'), null);
});

test('DaF review #3 Minor: the can-do lines say what they are — written for the course, not quoted', () => {
  // The public course page prints „Quelle: <provenance.canDo>"; naming the Prüfungsziele alone read as
  // a quotation nobody had checked line by line.
  assert.match(CURRICULUM_A12.provenance.canDo, /^Eigene Kann-Beschreibungen nach /);
  assert.match(CURRICULUM_A12.provenance.canDo, /keine wörtlichen Zitate/);
});

test('DaF review #4 minor (register): a du in an A1.2 prompt is framed — partner speech, a person cue or a Sie instruction', () => {
  // The course speaks Sie; only its dialogues duzen. „___ wohnst du?" printed bare reads as the course
  // addressing the learner with du (six prompts, measured 2026-10-15). A du-form in a prompt is framed
  // when the prompt says who is spoken to: a person cue („(sprechen, du)", „du-Imperativ"), a Sie
  // instruction it stands under („Fragen Sie eine Freundin: …", „Korrigieren Sie: …"), a named
  // addressee („Tim, ___ …"), or a question-and-answer frame („Antwort: … Frage: …", „…? — Der Weg ist weit.").
  const DU = /\b(du|dein\w*|dir|dich)\b/i;
  const FRAMED = [
    /\((?:[^)]*,\s*)?du\)|\bdu-(?:Imperativ|Form)\b/,
    /^[A-ZÄÖÜ][a-zäöüß]+en Sie\b[^:]*:/,
    /^(?:Ana|Lena|Tim|Paul|Herr \w+|Frau \w+),\s/,
    /\bAntwort:.*\bFrage:/,
    /\?\s+—\s+\S/,
  ];
  const bare = POOL_A12.items.filter((it) => DU.test(it.questionDe || '') && !FRAMED.some((re) => re.test(it.questionDe)));
  assert.deepEqual(bare.map((it) => `${it.id}: ${it.questionDe}`), []);
  const duItems = POOL_A12.items.filter((it) => DU.test(it.questionDe || ''));
  assert.ok(duItems.length >= 25, 'the rule still reads the du-prompts it was written for');
  // The frame is a task formula, not item lexis: before it was listed, the build stamped all six
  // framed items minLektion null, and an unservable item is a fix that removed the item.
  assert.deepEqual(duItems.filter((it) => it.minLektion == null).map((it) => it.id), [], 'a frame never costs an item its Lektion');
});

test('DaF review #5 MAJOR 5: an explanation that calls what follows sein a nominative has a noun there', () => {
  // „Meine Tante ___ glücklich. (sein)" was explained with „Nach sein steht das Subjekt im Nominativ."
  // and „sein links two things in the nominative" — glücklich is a predicative adjective, not a second
  // nominative, and the subject is not nominative because it stands after sein. The nominative rule
  // after sein (and bleiben) is for a NOUN predicate: „Das ist meine Tante.", „Er ist ein guter Lehrer."
  const CLAIM = /(?:nach|after)\s+(?:ist\s*\()?sein\b|sein links|wie sein|like sein/i;
  const NOMINATIVE = /Nominativ|nominative/i;
  const DETERMINER = /^(?:der|die|das|ein|eine|kein|keine|mein|meine|dein|deine|sein|seine|ihr|ihre|unser|unsere|euer|eure)$/i;
  const offenders = [];
  let claims = 0;
  for (const it of POOL_A12.items) {
    const text = `${it.explanationDe || ''} ${it.explanationEn || ''}`;
    if (!CLAIM.test(text) || !NOMINATIVE.test(text)) continue;
    claims += 1;
    const sentence = String(it.questionDe).replace(/\([^)]*\)/g, '').replace('___', it.answer).split(/[—:]/).pop().trim();
    const after = sentence.match(/\b(?:ist|sind|bin|bist|seid|bleibt|bleiben)\s+(\S+)/i);
    if (!after || !DETERMINER.test(after[1])) offenders.push(`${it.id}: „${sentence}" — ${text.trim()}`);
  }
  assert.deepEqual(offenders, []);
  assert.ok(claims >= 3, 'the rule still reads the noun-predicate explanations it was written for');
  // The item the review measured now names the form it tests.
  const tante = POOL_A12.items.find((it) => it.id === 'extra-a12-l07-05');
  assert.match(tante.explanationDe, /steht für sie, deshalb die Form ist/);
  assert.doesNotMatch(`${tante.explanationDe} ${tante.explanationEn}`, NOMINATIVE);
});

test('DaF review #5 minor: every form a notice teaches in bold stands in its English twin, and a can-do quotes only taught forms', () => {
  // The L8 notice explained „Kommt!" in German while its English twin still explained the separable
  // prefix, and L10 promised „billiger oder teurer" where the Lektion teaches „billiger als".
  for (const l of CURRICULUM_A12.lektionen) {
    const forms = [...l.notice.bodyDe.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]).filter((f) => f.replace(/[^A-Za-zÄÖÜäöüß]/g, '').length >= 3);
    const en = l.notice.bodyEn.replace(/\*\*/g, '');
    assert.deepEqual(forms.filter((f) => !en.includes(f)), [], `L${l.nr}: the English twin leaves out a taught form`);
    const input = [...l.dialog.lines.map((x) => x.de), l.notice.bodyDe, ...(l.notice.examples || [])].join(' ').replace(/\*\*/g, '').toLowerCase();
    for (const canDo of l.canDo) {
      const example = canDo.includes(':') ? canDo.split(':').pop() : '';
      const words = example.toLowerCase().match(/[a-zäöüß]+/g) || [];
      assert.deepEqual(words.filter((w) => !new RegExp(`\\b${w}\\b`).test(input)), [], `L${l.nr}: „${canDo}" quotes a form the Lektion does not teach`);
    }
  }
});

test('DaF review #4 minor: every checkpoint writing task reaches the page with its English twin, on both levels', async () => {
  // The checkpoint's graded task carried promptEn: null, and the page reads task.taskEn, which no
  // item set — the twin RULE 25 asks of every Lektion task never reached a checkpoint, on either level.
  const { buildCheckpoint } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  for (const [curriculum, file] of [[CURRICULUM_A12, 'a12'], [CURRICULUM_A11, 'a11']]) {
    const pool = JSON.parse(read(`src/data/lessonPools/${file}.json`));
    for (const checkpoint of curriculum.checkpoints) {
      const graded = buildCheckpoint({ curriculum, checkpoint, pool }).find((it) => it.kind === 'gradedWriting');
      assert.ok(graded, `${checkpoint.id}: a graded writing task`);
      assert.ok(graded.promptEn && graded.task.taskEn === graded.promptEn, `${checkpoint.id}: the English twin reaches the page`);
    }
  }
});

test('DaF review #4 MAJOR 8: Richtig follows from the text, Falsch contradicts it — on every paper of both levels', async () => {
  // CP3 printed „Die Oma ist müde." keyed Falsch (the engine had resolved „Sie ist müde." to the last
  // feminine noun, die Nase) and CP2 keyed „Der Kopf von Ana tut weh und der Kopf auch." Falsch, which
  // the text says.
  const { buildCheckpoint, paperSeed, windowReports, reportSpecFor, normaliseStatement } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const cp3 = CURRICULUM_A12.checkpoints[2];
  const spec = { ...reportSpecFor(CURRICULUM_A12, cp3), known: null };
  const reports = (lines) => windowReports(lines, spec).map((r) => r.statement);
  // A pronoun is reported only when one noun of its gender can be meant.
  assert.deepEqual(reports([
    { speaker: 'Lena', de: 'Deine Oma ist traurig? Ihre Nase ist wie deine.' },
    { speaker: 'Ana', de: 'Sie ist müde.' },
  ]), [], 'Oma or Nase: no report');
  assert.deepEqual(reports([
    { speaker: 'Lena', de: 'Wo ist die Oma?' },
    { speaker: 'Ana', de: 'Sie ist müde.' },
  ]), ['Die Oma ist müde.'], 'one candidate: a report');
  // A coordinated verb the table cannot change refuses the report, whatever the lexicon knows.
  assert.deepEqual(reports([{ speaker: 'Ana', de: 'Ich koche und wechsle das Zimmer.' }]), []);
  assert.deepEqual(reports([{ speaker: 'Ana', de: 'Ich gehe und kaufe ein.' }]), ['Ana geht und kauft ein.']);

  const windowOf = (curriculum, item) => {
    const lines = curriculum.lektionen.find((l) => l.nr === item.lektionNr).dialog.lines;
    for (const span of [2, 3]) {
      for (let start = 0; start + span <= lines.length; start += 1) {
        const w = lines.slice(start, start + span);
        if (w.map((l) => `${l.speaker}: ${l.de}`).join(' ') === item.text) return w;
      }
    }
    return null;
  };
  const problems = [];
  let checked = 0;
  for (const [curriculum, file] of [[CURRICULUM_A12, 'a12'], [CURRICULUM_A11, 'a11']]) {
    const pool = JSON.parse(read(`src/data/lessonPools/${file}.json`));
    for (const checkpoint of curriculum.checkpoints) {
      const cpSpec = reportSpecFor(curriculum, checkpoint);
      for (let round = 0; round < 3; round += 1) {
        for (const it of buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) })) {
          if (it.section !== 'lesen' || !it.transform) continue;
          checked += 1;
          const at = `${checkpoint.id}/${round} „${it.statement}"`;
          const window = windowOf(curriculum, it);
          if (!window) { problems.push(`${at}: its text is no window of L${it.lektionNr}`); continue; }
          const truths = new Set(windowReports(window, cpSpec).map((r) => normaliseStatement(r.statement)));
          if (it.answer === 'Richtig' && !truths.has(normaliseStatement(it.statement))) problems.push(`${at}: Richtig, but no line of the text says it`);
          if (it.answer === 'Falsch') {
            if (truths.has(normaliseStatement(it.statement))) problems.push(`${at}: Falsch, but a line of the text says it`);
            const source = new Set(String(it.sourceSentence).split(/\s+/).map((w) => w.replace(/[.,!?]/g, '').toLowerCase()));
            if (source.has(String(it.changed?.to).toLowerCase())) problems.push(`${at}: the swapped-in „${it.changed?.to}" stands in the sentence it reports`);
          }
        }
      }
    }
  }
  assert.equal(checked, 96, 'four Lesen reports on each of the twelve papers of both levels');
  assert.deepEqual(problems, []);
});

test('DaF review #4 BLOCKER 2: an article-less adjective and a Wechselpräposition the input has not shown are outside the horizon', async () => {
  // Review #4: „Sie hat lange Haare." got horizon 0 because the declension pattern wants an article,
  // and „Warte kurz vor der Garage!" because the Dativ table holds only the seven Dativ prepositions.
  const v = await import('../scripts/validate-curriculum.mjs');
  const horizon = v.constructionHorizonIndex('a1.2');
  const at = (answer) => horizon({ answer });
  // Contrast pairs: with and without article, singular and plural, attributive and predicative.
  assert.equal(at('Sie hat lange Haare.'), null);
  assert.equal(at('Sie hat einen langen Arm.'), null);
  assert.equal(at('Mein großer Bruder ist da.'), null);
  assert.ok(at('Ihr Haar ist lang.') !== null, 'predicative: taught');
  assert.ok(at('Guten Tag, Frau Kaya.') !== null && at('Gute Reise!') !== null, 'the greeting formulas are wholes');
  // Several location prepositions: produced only once the input has shown the combination.
  assert.equal(at('Warte kurz vor der Garage!'), null, '„vor der" stands in no input');
  assert.equal(at('Bring den Teppich auf die Terrasse.'), null, 'nor „auf die"');
  assert.equal(at('Das Sofa ist in der Garage.'), 0, '„in der": A1.1 input');
  assert.equal(at('Der Teppich ist auf der Terrasse.'), 8, '„auf der": L8 input');
  // The inventory is the input, written down here independently of the matcher that reads it.
  const inventory = v.wechselInventory('a1.2');
  for (const [combination, lektion] of [['im', 0], ['am', 0], ['ins', 0], ['in der', 0], ['an der', 1], ['vor dem', 4], ['auf der', 8]]) {
    assert.equal(inventory.get(combination), lektion, `„${combination}" first shown in input at ${lektion}`);
  }
  for (const combination of ['vor der', 'auf die', 'neben dem', 'unter der']) assert.equal(inventory.has(combination), false, `„${combination}" is in no input`);
  // RULE 15b reads the same two classes on every production text, the checkpoints included.
  assert.deepEqual(v.constructionsBeforeTaught(CURRICULUM_A12, POOL_A12).map((o) => `L${o.nr} ${o.where}: ${o.hit}`), []);
});

test('A1.2: every ratchet equals its measurement — a ratchet with slack is not a rule', async () => {
  // DaF review #2 MAJOR 7 measured four A1.2 ratchets above their measurement while the tests asked
  // only „measurement ≤ ratchet"; review #3 found the new ones with slack too. Same walk as A1.1's.
  const v = await import('../scripts/validate-curriculum.mjs');
  const spec = v.levelSpec('a1.2');
  const c = spec.curriculum;
  const r = spec.ratchets;
  const extra = v.loadExtraItems('a1.2');
  const pool = v.loadPoolItems('a1.2');
  const twins = v.englishTwins(c, spec, { poolItems: pool });
  const checks = [
    ['10', v.wortfeldCoverage(c, extra).length, r.uncoveredWortfeld],
    ['11', v.itemLexis(c, extra, pool).length, r.untaughtItemTokens],
    ['11b', v.drawnLexis(c, extra, pool).length, r.untaughtDrawnTokens],
    ['13', v.missionlessLektionen(c).length, r.missionlessLektionen],
    ['6b', v.noticeFormCoverage(c).length, r.unexemplifiedNoticeForms],
    ['15', v.producedBeforeTaught(c).length, r.untaughtInProduction],
    ['15b', v.constructionsBeforeTaught(c, pool).length, r.deferredConstructions],
    ['16', v.examTeileBacked(c).length, r.unbackedExamTeile],
    ['17', v.modelTextsPassOwnChecklist(c).length, r.modelChecklistBreaks],
    ['18', v.sharedProductionLines(c).length, r.sharedProductionLines],
    ['20', v.modelTextLexis(c, spec).length, r.untaughtInModelTexts],
    ['21', v.writingTasksAreAnswerable(c, spec).length, r.unanswerableLeitpunkte],
    ['22', v.formSpeakInModelTexts(c, spec).length, r.formSpeakSentences],
    ['23', v.wortfeldInputCoverage(c, spec).length, r.wortfeldWithoutInput],
    ['23b', v.gradedTaskWordsWithoutInput(c, spec).length, r.gradedTaskWordsWithoutInput],
    ['25', twins.lektionen.length + twins.pool.length, r.missingEnglishTwins],
  ];
  for (const [rule, measured, ratchet] of checks) {
    assert.equal(measured, ratchet, `A1.2 RULE ${rule} measures ${measured}, ratchet is ${ratchet} — lower it in the same commit`);
  }
});
