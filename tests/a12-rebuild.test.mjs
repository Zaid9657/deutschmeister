// The A1.2 rebuild on the A1.1 standard (owner: "start now", 2026-10-15). One file for the rules the
// rebuild adds, so each finding class it closes keeps a test that fails on the old code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { exclusionReason, isUsableItem, REASON } from '../src/data/lessonPools/quality.js';
import { pickPracticeItems, planPractice, poolItems } from '../src/lib/lesson/buildLesson.js';
import { requeueFor } from '../src/lib/lesson/requeue.js';

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
  assert.deepEqual(report('Ich gehe durch das Kaufhaus und frage.'), [], 'a first-person verb the table lacks: no report, never half a one');
  assert.deepEqual(report('Ich lese, frage und schlafe.'), [], 'a verb after a comma counts too');
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
  assert.ok(firstPerson.has('bezahle') && firstPerson.has('frage'), 'the harvest is not vacuous');
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
