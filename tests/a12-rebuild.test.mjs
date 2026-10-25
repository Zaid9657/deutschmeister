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

test('DaF review #14: every servable ihr-imperative accepts emphasis, including all four checkpoint rounds', async () => {
  const { servedItems, alternatives } = await import('../scripts/a12-determinacy.mjs');
  const served = servedItems('a1.2').items;
  for (const cp of CURRICULUM_A12.checkpoints) for (const round of [0, 1, 2, 3]) {
    assert.ok(served.some((it) => it.where === `${cp.id}/${round}`), `${cp.id}/${round} is probed`);
  }
  const all = [...POOL_A12.items.filter((it) => isUsableItem(it, { level: 'a1.2' })), ...served];
  let gaps = 0; let sentences = 0;
  for (const it of all) {
    const q = String(it.questionDe || it.promptDe || '');
    if (!/\([^()]*,\s*ihr\)|\[[^\]]*\bihr\b|\bihr-Imperativ\b|[„"']Ihr\s/.test(q)
        || !['fill_blank', 'sentence_building', 'error_correction'].includes(it.type)) continue;
    if (it.type === 'fill_blank' ? !/___[^.!?]*!/.test(q) : !/Imperativ|\bBitte\b|\bbitten\b/i.test(q)) continue;
    if (it.type === 'fill_blank') gaps += 1; else sentences += 1;
    const m = String(it.answer).match(/^((?:Bitte )?\S+)(?: ihr\b)?(.*)$/);
    assert.ok(m, it.id);
    const bare = `${m[1]}${m[2]}`;
    const emphatic = `${m[1]} ihr${m[2]}`;
    for (const answer of [bare, emphatic]) {
      assert.equal(checkAnswer(answer, [it.answer, ...(it.accepted || [])], checkOptionsFor(it)).result, RESULT.CORRECT, `${it.where || 'pool'} ${it.id}: ${answer}`);
    }
    for (const wrong of [`${m[1]} du${m[2]}`, `${m[1]} ihr ihr${m[2]}`]) {
      assert.notEqual(checkAnswer(wrong, [it.answer, ...(it.accepted || [])], checkOptionsFor(it)).result, RESULT.CORRECT, wrong);
    }
    assert.ok(alternatives(it, { wide: true }).some((a) => a.text === emphatic), `${it.id}: harness covers ihr`);
    assert.doesNotMatch(it.explanationDe || '', /ohne ihr\b/);
  }
  assert.ok(gaps >= 2 && sentences >= 1, `nonvacuous coverage: ${gaps} gaps, ${sentences} sentences`);
  const notice = CURRICULUM_A12.lektionen.find((l) => l.nr === 8).notice;
  assert.match(notice.bodyDe, /normalerweise ohne Pronomen; zur Betonung möglich/);
  assert.match(notice.bodyEn, /normally omit the pronoun; it is possible for emphasis/);
});

test('DaF review #14: imperative person × task-mode matrix, regular/sein, existing pronouns and novel Holt probe', async () => {
  const { imperativePronounVariants } = await import('../scripts/imperative-variants.mjs');
  const { alternatives } = await import('../scripts/a12-determinacy.mjs');
  // Independent annotations; neither forms nor expected persons come from the expansion routine.
  for (const [person, inf, verb] of [['du', 'holen', 'Hol'], ['ihr', 'holen', 'Holt'], ['Sie', 'holen', 'Holen'],
    ['du', 'sein', 'Sei'], ['ihr', 'sein', 'Seid'], ['Sie', 'sein', 'Seien']]) {
    for (const type of ['fill_blank', 'sentence_building', 'error_correction']) {
      const gap = type === 'fill_blank';
      const rest = inf === 'sein' ? ' pünktlich!' : ' den Brief!';
      const q = gap ? `___${person === 'Sie' ? ' Sie' : ''}${rest} (${inf}, ${person})`
        : `Bilden Sie den ${person}-Imperativ: [${inf} / ${person}${inf === 'sein' ? ' / pünktlich' : ' / den Brief'}]`;
      const answer = gap ? verb : `${verb}${person === 'Sie' ? ' Sie' : ''}${rest}`;
      const item = { type, topic: 'imperative', questionDe: q, answer, accepted: [answer] };
      const variants = imperativePronounVariants(item);
      const accepted = [answer, ...variants];
      const verdict = (text) => checkAnswer(text, accepted, checkOptionsFor(item)).result;
      const emphatic = `${verb} ${person}${gap ? '' : rest}`;
      if (person === 'Sie') {
        assert.deepEqual(variants, [], 'formal Sie is required, not optional emphasis');
      } else {
        assert.equal(verdict(emphatic), RESULT.CORRECT, `${type}: ${emphatic}`);
        assert.equal(verdict(answer), RESULT.CORRECT);
        assert.ok(imperativePronounVariants({ ...item, answer: emphatic, accepted: [emphatic] }).includes(answer), 'also expands from an emphatic key back to the bare form');
        assert.notEqual(verdict(`${verb} ${person} ${person}${gap ? '' : rest}`), RESULT.CORRECT);
        assert.notEqual(verdict(`${verb} ${person === 'du' ? 'ihr' : 'du'}${gap ? '' : rest}`), RESULT.CORRECT);
        assert.notEqual(verdict(`${inf === 'sein' ? 'Sind' : 'Holen'} ${person}${gap ? '' : rest}`), RESULT.CORRECT);
        assert.deepEqual(imperativePronounVariants({ ...item, questionDe: `${q} (ohne Pronomen)` }), []);
      }
    }
  }
  for (const q of ['___ ihr den Brief? (holen, ihr)', '___ ihr den Brief! (holen, ihr)', 'Ihr ___ den Brief. (holen, ihr)']) {
    assert.deepEqual(imperativePronounVariants({ type: 'fill_blank', questionDe: q, answer: 'Holt' }), [], q);
  }
  const probe = { type: 'sentence_building', topic: 'imperative', questionDe: 'Bilden Sie den Imperativ: [holen / ihr / den Brief]', answer: 'Holt den Brief!' };
  assert.ok(imperativePronounVariants(probe).includes('Holt ihr den Brief!'));
  assert.ok(alternatives(probe, { wide: true }).some((a) => a.text === 'Holt ihr den Brief!'));
  assert.deepEqual(imperativePronounVariants({ ...probe, type: 'multiple_choice', options: ['Holt den Brief!', 'Holen den Brief!'] }), []);
  assert.ok(imperativePronounVariants({ ...probe, answer: 'Bitte holt den Brief!' }).includes('Bitte holt ihr den Brief!'));
  const vocative = { ...probe, questionDe: 'Bilden Sie den Imperativ: [holen / du / den Brief]', answer: 'Hol den Brief!', accepted: ['Du, hol den Brief!'] };
  assert.ok(imperativePronounVariants(vocative).includes('Hol du den Brief!'));
  assert.ok(imperativePronounVariants(vocative).every((s) => !/^Du du/.test(s)), 'a vocative is not the imperative verb');
  const sein = { ...probe, questionDe: 'Bilden Sie den ihr-Imperativ: [sein / ihr / pünktlich]', answer: 'Seid pünktlich!' };
  assert.ok(alternatives(sein, { wide: true }).some((a) => a.text === 'Seid ihr pünktlich!'));
  assert.ok(alternatives(sein, { wide: true }).every((a) => !/^Seide? du|^Seide\b/.test(a.text)), 'ihr-sein must not inherit du or optional -e');
  const bareGap = { type: 'fill_blank', topic: 'imperative', questionDe: 'Ergänzen Sie den Imperativ für ihr: ___ (holen)', answer: 'Holt' };
  assert.ok(imperativePronounVariants(bareGap).includes('Holt ihr'));
  assert.ok(alternatives(bareGap, { wide: true }).some((a) => a.text === 'Holt ihr'));
});
// The generated Lesen statements: A1.1 prints one and asks Richtig or Falsch; round 11b's two-option items
// printed a key and its Falsch. Since round 12 A1.2 reads AUTHORED units (src/data/curricula/a12.lesen.js),
// which are no falsification at all — they have no Falsch statement, and these return null for them.
const falschOf = (it) => (it.source === 'authored' ? null : it.kind === 'choice' ? it.distractor : it.answer === 'Falsch' ? it.statement : null);
const richtigOf = (it) => (it.source === 'authored' ? null : it.kind === 'choice' ? it.answer : it.answer === 'Richtig' ? it.statement : null);
// What each A1.2 paper's Lesen section is since round 12: four authored units, never the generator.
const assertAuthoredA12 = (buildCheckpoint) => {
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (const it of buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12 }).filter((x) => x.section === 'lesen')) {
      assert.equal(it.source, 'authored', `${checkpoint.id}: A1.2 reads authored units`);
    }
  }
};

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
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [dann / gehen / Sie / an der Ecke / links]', answer: 'Dann gehen Sie an der Ecke links.' }), ['Sie gehen dann an der Ecke links.', 'Dann gehen Sie links an der Ecke.']);
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [wir / fahren / bei Regen / mit / Bus]', answer: 'Wir fahren bei Regen mit dem Bus.' }), ['Bei Regen fahren wir mit dem Bus.', 'Mit dem Bus fahren wir bei Regen.', 'Wir fahren mit dem Bus bei Regen.']);
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [ich / haben / die Kartoffel / kaufen]', answer: 'Ich habe die Kartoffel gekauft.' }), ['Die Kartoffel habe ich gekauft.']);
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [dann / gehen / Sie / links] (Beginnen Sie mit „Dann“)', answer: 'Dann gehen Sie links.' }), [], 'a named opening fixes the order');
  assert.deepEqual(wide({ type: 'sentence_building', questionDe: 'Bilden Sie die Frage: [wo / sein / die Haltestelle]', answer: 'Wo ist die Haltestelle?' }), [], 'a question has no free opening');
  assert.deepEqual(wide({ type: 'fill_blank', topic: 'imperative', questionDe: 'Der Teppich ist da. ___ ihn bitte! (holen, du)', answer: 'Hol' }), ['Hole', 'Hol du']);
  // no -e on a changed stem („hilfe"), but its emphatic pronoun, like any du-imperative (review #9)
  assert.deepEqual(wide({ type: 'fill_blank', topic: 'imperative', questionDe: 'Tim, ___ mir bitte! (helfen, du)', answer: 'hilf' }), ['hilf du'], 'no -e on a changed stem');
  assert.deepEqual(wide({ type: 'fill_blank', topic: 'stem-changing-verbs', questionDe: '___ du gern? (helfen, du)', answer: 'Hilfst' }), [], 'a question gap with its own du takes no second one');
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
  // A cue asks: an instruction („Antworten Sie mit Nein", „verneinen", a parenthesised kein/nicht, the
  // negation given as a brick, a correction) — or a „Nein" in the TURN that holds the gap. A „Nein" or
  // a „kein" about another thing in an earlier sentence decides nothing (DaF review #8, B1: „Im Flur ist
  // keine Lampe. Und ein Spiegel? — Im Flur ist ___ Spiegel." took only „kein").
  const INSTRUCTION = /antworten sie mit nein|verneinen|verneint|verneinung|\([^)]*\b(?:kein\w*|nicht)\b[^)]*\)|\[[^\]]*\b(?:kein\w*|nicht)\b[^\]]*\]|korrigieren sie/i;
  const turnOf = (q) => (q.includes(' — ') ? q.slice(q.lastIndexOf(' — ')) : q);
  const asks = (q) => INSTRUCTION.test(q) || /\bnein\b/i.test(turnOf(q));
  // One accessor for a lesson item (questionDe) and a checkpoint item (promptDe): the old filter read
  // questionDe only, so every checkpoint item went unchecked (review #8). Dictation and read-aloud lines
  // are the line itself, not a negation task.
  const promptOf = (it) => [it.questionDe, it.promptDe].find((q) => typeof q === 'string') ?? null;
  for (const level of ['a1.2', 'a1.1']) {
    // A Lesen item is a choice between printed statements about a printed text (A1.2 since round 11b; the
    // A1.1 answers are Richtig/Falsch): the learner produces no negation, and the text decides.
    const items = servedItems(level).items.filter((it) => promptOf(it) !== null && it.section !== 'hoeren' && it.section !== 'sprechen' && it.section !== 'lesen');
    assert.ok(items.some((it) => it.section === 'bausteine'), `${level}: the checkpoint items are read`);
    const offenders = items
      .filter((it) => NEG.test([it.answer, ...(it.accepted || [])].join(' ')))
      .filter((it) => !asks(promptOf(it)))
      .map((it) => `${it.where} ${it.id}`);
    assert.deepEqual(offenders, [], `${level}: a negation the prompt does not ask for`);
  }
  for (const old of [
    'Das Hotel hat kein Angebot. Und eine Toilette im Flur? — Das Hotel hat ___ Toilette im Flur.',
    'Die Steckdose funktioniert nicht. Und das Kissen? — Im Hotel ist ___ Kissen.',
    'Im Flur ist keine Lampe. Und der Boden? — Der Boden ist ___ schön.',
    'Im Flur ist keine Lampe. Und ein Spiegel? — Im Flur ist ___ Spiegel.',
  ]) assert.ok(!asks(old), `the old prompt fails: ${old}`);
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
  assert.equal(at('Er ist nach Berlin gefahren.'), 12, 'the sein-Perfekt: L12 since the M7 decision (Goethe A1 lists fahren, bleiben, passieren)');
  assert.equal(at('Ich habe die Getränke bezahlt.'), 12, 'a participle without ge-: L12');
  assert.equal(at('Tim bezahlt den Kuchen.'), 3, 'the same form in the present tense is not a participle (den: L3)');
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

  // Every Lesen item the four papers print, over four seeds — on A1.1, because the report engine writes
  // only A1.1's statements since round 12; A1.2 reads authored units (the round-12 tests below).
  assertAuthoredA12(buildCheckpoint);
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
  const firstPerson = new Set();
  for (const l of CURRICULUM_A11.lektionen) {
    for (const line of l.dialog?.lines || []) {
      for (const m of String(line.de).matchAll(/(?:^|[\s,.!?])[Ii]ch\s+([a-zäöüß]+e)(?=[\s,.!?]|$)/g)) firstPerson.add(m[1]);
    }
  }
  // („hole" left with „Ich hole ein Stück Kuchen für dich!" when L3 gained a stated value, M8.)
  assert.ok(firstPerson.has('kaufe') && firstPerson.has('koche') && firstPerson.has('brauche'), 'the harvest is not vacuous');
  const problems = [];
  let items = 0;
  for (const checkpoint of CURRICULUM_A11.checkpoints) {
    for (const seed of [undefined, 1, 2, 3]) {
      for (const it of buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint, pool, seed })) {
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
      ['Wie komme ich zum Rathaus?', 1, 'Zuerst gehen Sie geradeaus bis zur Kirche.', 'art'],
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
      ['Wie viele Zimmer hat sie?', 5, 'Zwei Zimmer: Wohnzimmer und Schlafzimmer.', 'menge'],
      ['Hat die Wohnung auch einen Balkon?', 7, 'Ja, der Balkon ist da.', 'ja'],
      ['Ist die Treppe da?', 9, 'Ja, die Treppe ist da.', 'ja'],
    ],
    3: [
      ['Ana, was machst du heute in der Stadt?', 1, 'Ich brauche einen Supermarkt und einen Markt.', 'sache'],
      ['Gehst du?', 3, 'Ja.', 'ja'],
      ['Und die Kasse?', null, null, 'thema'],
      ['Bezahlst du ein Kilo Brot?', 5, 'Ja.', 'ja'],
      ['Und danach?', null, null, 'thema'],
      ['Gehst du lieber in das Museum oder das Restaurant?', 7, 'Lieber das Museum.', 'auswahl'],
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
      ['Gehst du ins Konzert?', 1, 'Ja.', 'ja'],
      ['Wann fährt der Zug?', 3, 'Um acht Uhr.', 'zeit'],
      ['Um wie viel Uhr?', 3, 'Um acht Uhr.', 'zeit'],
      ['Wer kommt mit?', 4, 'Ich würde gern mitkommen.', 'person'],
      ['Warum so früh?', 5, 'Der Weg ist weit.', 'grund'],
      ['Wie oft fährt der Bus?', 6, 'Jede Stunde.', 'frequenz'],
      ['Aber wo ist die Haltestelle?', 7, 'Am Bahnhof.', 'ort'],
      ['Und die Ferien?', null, null, 'thema'],
      ['Wohin fahren wir im Urlaub?', 9, 'Bald nach Italien.', 'richtung'],
    ],
    6: [
      ['Was tut Ihnen weh?', 1, 'Mein Hals tut weh, der Kopf und der Bauch auch.', 'sache'],
      ['Haben Sie Fieber oder eine Erkältung?', 3, 'Nein.', 'ja'],
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
      ['Deine Oma ist traurig?', 7, 'Nein, sie war nur müde.', 'ja'],
      ['Und der Mann da?', 9, 'Das ist mein Bruder.', 'person', 'Wer ist der Mann da?'],
    ],
    8: [
      ['Wo hast du die Möbel für das Kinderzimmer?', 4, 'Das Sofa und der Schrank sind in der Garage.', 'ort'],
      ['Und das Bett?', 5, 'Ich frage die Nachbarin.', 'aufschub', 'Wo ist das Bett?'],
      ['Und der Herd?', 7, 'Der Herd ist neu, das Dach ist alt.', 'art', 'Wie ist der Herd?'],
    ],
    9: [
      ['Wo darf ich langsam fahren?', 2, 'Am Platz.', 'ort'],
      ['Wo soll ich einsteigen?', 6, 'Hier, ab acht Uhr.', 'ort'],
      ['Und wo muss ich aussteigen?', 8, 'Am Flughafen.', 'ort'],
      ['Wann fährt der Bus ab?', 8, 'Der Bus fährt jetzt ab.', 'zeit'],
    ],
    10: [
      ['Gehört die Jacke dir?', 1, 'Ja.', 'ja'],
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
  // addressee („Tim, ___ …"), an answer frame („Antwort: … Frage: …"), or a dialogue whose turns are NAMED
  // („Lena: ___ stehst du so früh auf? — Tim: Der Weg ist weit."). A bare „…? — …" pair was counted as framed
  // until review #11: it says that two people speak, not who — and the course is the only speaker in sight.
  const DU = /\b(du|dein\w*|dir|dich)\b/i;
  const FRAMED = [
    /\((?:[^)]*,\s*)?du\)|\bdu-(?:Imperativ|Form)\b/,
    /^[A-ZÄÖÜ][a-zäöüß]+en Sie\b[^:]*:/,
    /^(?:Ana|Lena|Tim|Paul|Herr \w+|Frau \w+),\s/,
    /\bAntwort:.*\bFrage:/,
    /^(?:Ana|Lena|Tim|Paul|Herr \w+|Frau \w+):\s.*\s—\s(?:Ana|Lena|Tim|Paul|Herr \w+|Frau \w+):\s/,
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

test('M7, decided 2026-10-16 (DaF review #6 MAJOR 7): every decided point has its own notice, input and practice — in both real plans, and every surface carries weight', () => {
  // The Goethe-Zertifikat A1 inventory (Prüfungsziele/Testbeschreibung, 2022, pp. 100–106) lists
  // these points for Start Deutsch 1, and the decision placed each in the Lektion whose situation
  // carries it. ONE ROW PER POINT: review #6 found rows bundled with „or" — `war` stood in for
  // `hatte`, one `mir` item for three dative verbs — and ran the old body green with a point's notice
  // and practice deleted. Each row: the form the notice puts in bold, a dialogue line that uses it
  // (temporal `ab`, not the prefix of `abfahren`), and the items whose TARGET is the point: two
  // servable items of the Lektion's own, and one served in EACH of the Lektion's two real practice
  // plans (planPractice, attempts 1 and 2). Written here, not read off the course.
  const TIME = String.raw`(?:\w+ Uhr|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|heute|morgen)`;
  const DAT = /\b(?:mir|dir|Ihnen|ihm|ihr|uns)\b/;
  const SEIN_PARTICIPLE = String.raw`\b(?:gegangen|gefahren|geblieben|passiert|gekommen|geflogen)\b`;
  const POINTS = [
    { point: 'lieber', nr: 3, bold: /^lieber$/, input: /\blieber\b/, target: (q, a) => /\blieber\b/.test(a) },
    { point: 'besser', nr: 3, bold: /^besser$/, input: /\bbesser\b/, target: (q, a) => /\bbesser\b/.test(a) },
    { point: 'Ich würde gern (chunk)', nr: 5, bold: /^Ich würde gern$/, input: /\bwürde gern\b/, target: (q, a) => /\bwürde\b/.test(a) },
    { point: 'denn (Konjunktion)', nr: 6, bold: /^denn$/, input: /, denn\b/, target: (q, a) => /, denn\b/.test(a) || /^denn$/i.test(a) },
    { point: 'war', nr: 7, bold: /^war$/, input: /\bwar\b/, target: (q, a) => /\bwar\b/.test(a) },
    { point: 'hatte', nr: 7, bold: /^hatte$/, input: /\bhatte\b/, target: (q, a) => /\bhatte\b/.test(a) },
    { point: 'von … bis', nr: 9, bold: /\bvon \w+ bis \w+ Uhr\b/, input: /\bvon \w+ bis \w+ Uhr\b/,
      target: (q, a) => /\bbis\b/.test(a) && /\bvon\b/.test(`${q} ${a}`) },
    { point: 'ab + Zeitangabe', nr: 9, bold: /^ab \w+ Uhr$/, input: new RegExp(String.raw`\b[Aa]b ${TIME}\b`),
      target: (q, a) => new RegExp(String.raw`\b[Aa]b ${TIME}\b`).test(a) || (/^ab$/i.test(a) && new RegExp(String.raw`___ ${TIME}\b`).test(q)) },
    { point: 'gefallen + Dativ', nr: 10, bold: /\bgefällt\b/, input: /\bgefällt (?:mir|dir|Ihnen|ihm|ihr)\b/,
      target: (q, a) => /\bgefäll(?:t|st)\b|\bgefallen\b/i.test(`${q} ${a}`) && (DAT.test(a) || /\bgefäll/i.test(a)) },
    { point: 'passen + Dativ', nr: 10, bold: /\bpasst\b/, input: /\bpasst (?:mir|dir|Ihnen|ihm|ihr)\b/,
      target: (q, a) => /\bpass(?:t|en)\b/i.test(`${q} ${a}`) && (DAT.test(a) || /\bpass(?:t|en)\b/i.test(a)) },
    { point: 'gehören + Dativ', nr: 10, bold: /\bgehört\b/, input: /\b[Gg]ehört\b.*\b(?:mir|dir|Ihnen|ihm|ihr)\b/,
      target: (q, a) => /\bgehör(?:t|en)\b/i.test(`${q} ${a}`) && (DAT.test(a) || /\bgehör(?:t|en)\b/i.test(a)) },
    { point: 'vor + Zeitangabe', nr: 11, bold: /^vor einer$/, input: /\b[Vv]or einer Woche\b/,
      target: (q, a) => /^[Vv]or$/.test(a) || /\b[Vv]or (?:einer|einem|zwei|drei) /.test(a) },
    { point: 'Perfekt mit sein', nr: 12, bold: /^gegangen$/, input: /\b(?:ist|bin|bist|sind)\b.*\b(?:gegangen|gefahren|geblieben|passiert)\b/,
      target: (q, a) => new RegExp(String.raw`\b(?:ist|sind|bin|bist|seid)\b.*${SEIN_PARTICIPLE}`).test(a)
        || (/^(?:ist|sind|bin|bist|seid)$/.test(a) && new RegExp(SEIN_PARTICIPLE).test(q)) },
    { point: 'Partizip ohne ge-', nr: 12, bold: /^bezahlt$/, input: /\b(?:bezahlt|verstanden|telefoniert|besucht|bekommen|vergessen)\b/,
      // …as a participle: a Perfekt auxiliary stands in the task, not the present „Tim bezahlt den Kuchen".
      target: (q, a) => /\b(?:bezahlt|verstanden|telefoniert|besucht|bekommen|vergessen|erzählt)\b/.test(a)
        && /\b(?:habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b/.test(`${q} ${a}`) },
  ];
  const targets = (p) => (it) => p.target(String(it.questionDe), String(it.answer));
  const failures = (curriculum, pool, plans) => POINTS.flatMap((p) => {
    const out = [];
    const l = curriculum.lektionen.find((x) => x.nr === p.nr);
    const bold = [...l.notice.bodyDe.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]);
    if (!bold.some((b) => p.bold.test(b))) out.push(`${p.point}: L${p.nr}'s notice puts no form of it in bold`);
    if (!l.dialog.lines.some((x) => p.input.test(x.de))) out.push(`${p.point}: no dialogue line of L${p.nr} uses it`);
    const own = `extra-a12-l${String(p.nr).padStart(2, '0')}-`;
    const supply = pool.items.filter((it) => it.id.startsWith(own) && it.minLektion != null && it.minLektion <= p.nr && targets(p)(it));
    if (supply.length < 2) out.push(`${p.point}: ${supply.length} servable L${p.nr} items practise it`);
    plans.forEach((plan, k) => {
      if (!(plan.get(p.nr) || []).some(targets(p))) out.push(`${p.point}: L${p.nr} attempt ${k + 1} does not practise it`);
    });
    return out;
  });
  const realPlans = [1, 2].map((attempt) => planPractice(CURRICULUM_A12, POOL_A12, attempt));
  assert.deepEqual(failures(CURRICULUM_A12, POOL_A12, realPlans), []);

  // DELETION MUTATIONS. Every surface of every point is taken away once, and its row must say so.
  // A practice plan reads the Wortfeld, the practice rule and the pool, never the notice or the
  // dialogue, so those two mutations keep the real plans; deleting the practice draws new ones.
  for (const p of POINTS) {
    const named = (list) => list.some((f) => f.startsWith(`${p.point}:`));
    const noBold = structuredClone(CURRICULUM_A12);
    const notice = noBold.lektionen.find((x) => x.nr === p.nr).notice;
    notice.bodyDe = notice.bodyDe.replace(/\*\*([^*]+)\*\*/g, (m, form) => (p.bold.test(form) ? form : m));
    assert.ok(named(failures(noBold, POOL_A12, realPlans)), `${p.point}: deleting its bold form goes unnoticed`);
    const noInput = structuredClone(CURRICULUM_A12);
    for (const line of noInput.lektionen.find((x) => x.nr === p.nr).dialog.lines) if (p.input.test(line.de)) line.de = '…';
    assert.ok(named(failures(noInput, POOL_A12, realPlans)), `${p.point}: deleting its input goes unnoticed`);
    const noPractice = { ...POOL_A12, items: POOL_A12.items.filter((it) => !targets(p)(it)) };
    const plans = [1, 2].map((attempt) => planPractice(CURRICULUM_A12, noPractice, attempt));
    assert.ok(named(failures(CURRICULUM_A12, noPractice, plans)), `${p.point}: deleting its practice goes unnoticed`);
  }
  // What moved to A2.1 is not promised: no can-do or notice of A1.2 teaches teurer/größer or a würde paradigm.
  const shown = CURRICULUM_A12.lektionen.flatMap((l) => [...l.canDo, l.notice.bodyDe]).join(' ');
  assert.doesNotMatch(shown, /\b(?:teurer|größer|am größten|würdest|würden)\b/);
});

test('DaF review #5 BLOCKER 1: a named opening fixes only the Vorfeld — middle-field orders, price questions, and a named sentence type', async () => {
  const { middleFieldOrders, rejectedAlternatives } = await import('../scripts/a12-determinacy.mjs');
  // Variants a German teacher accepts, written here by hand — independent of the generator — for the
  // cases the review measured as wrong (L1, L3, L8, L10, the CP4 key, the price question).
  const cp4 = POOL_A12.items.find((x) => /ein Geschenk für meine Mutter/.test(String(x.answer)));
  const VARIANTS = [
    ['extra-a12-l01-02', 'Dann gehen Sie links an der Ecke.'],
    ['extra-a12-l03-09', 'Ana kauft im Geschäft den Kuchen.'],
    ['e1716cd7-ccbe-544a-a65d-796cda3e0fe7', 'Machen Sie das Fenster bitte zu!'],
    ['extra-a12-l10-05', 'Ich kaufe für meine Oma die Jacke.'],
    ...(cp4 ? [[cp4.id, 'Ich kaufe für meine Mutter ein Geschenk.']] : []),
  ];
  assert.ok(cp4, 'the CP4 key the review measured is still in the pool');
  for (const [id, text] of VARIANTS) {
    const it = POOL_A12.items.find((x) => x.id === id);
    assert.ok(it, id);
    const r = checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it));
    assert.equal(r.result, RESULT.CORRECT, `${id}: „${text}"`);
  }
  // „Was kostet das?" is German too: a printed „Was" beside the key „Wie viel" made two options right.
  const price = POOL_A12.items.find((x) => x.id === 'ba9eb248-a125-483e-a452-1883fe389de3');
  assert.ok(price && !price.options.includes('Was'), 'no second correct option is printed');
  // … and the controls stay wrong: the verb leaves its place.
  for (const [id, text] of [['extra-a12-l03-09', 'Ana den Kuchen kauft im Geschäft.'], ['extra-a12-l01-02', 'Dann Sie gehen links an der Ecke.']]) {
    const it = POOL_A12.items.find((x) => x.id === id);
    assert.equal(checkAnswer(text, it.accepted, checkOptionsFor(it)).result, RESULT.WRONG, `${id}: „${text}"`);
  }
  // The generator keeps a pronoun first and leaves negation and a second clause alone.
  assert.deepEqual(middleFieldOrders('Hilf mir bitte mit der Waschmaschine!'), ['Hilf mir mit der Waschmaschine bitte!']);
  assert.deepEqual(middleFieldOrders('Ich kaufe die Jacke nicht für meine Oma.'), []);
  assert.deepEqual(middleFieldOrders('Ich nehme eine Tablette, denn mein Kopf tut weh.'), []);
  assert.deepEqual(middleFieldOrders('Gestern war mein Onkel glücklich.'), [], 'the subject stays where it is');
  // A request or a question is named in the German prompt: a brick list alone also builds the statement.
  for (const it of POOL_A12.items.filter((x) => x.type === 'sentence_building')) {
    if (/!$/.test(String(it.answer).trim())) assert.match(it.questionDe, /Imperativ|Bitte\b|bitten/i, `${it.id}: a request`);
    if (/\?$/.test(String(it.answer).trim())) assert.match(it.questionDe, /Frage/i, `${it.id}: a question`);
  }
  // And over every served item and paper, with the opening cues in place, nothing correct is rejected.
  assert.deepEqual(rejectedAlternatives('a1.2'), []);
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
  // Since round 12 the generator writes A1.1's papers only; A1.2's are authored (assertAuthoredA12).
  assertAuthoredA12(buildCheckpoint);
  for (const [curriculum, file] of [[CURRICULUM_A11, 'a11']]) {
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
          // A two-option item (A1.2) carries both: its key is checked as a Richtig, its distractor as a Falsch.
          const richtig = richtigOf(it);
          const falsch = falschOf(it);
          if (richtig !== null && !truths.has(normaliseStatement(richtig))) problems.push(`${at}: Richtig, but no line of the text says it`);
          if (falsch !== null) {
            if (truths.has(normaliseStatement(falsch))) problems.push(`${at}: Falsch, but a line of the text says it`);
            const source = new Set(String(it.sourceSentence).split(/\s+/).map((w) => w.replace(/[.,!?]/g, '').toLowerCase()));
            if (source.has(String(it.changed?.to).toLowerCase())) problems.push(`${at}: the swapped-in „${it.changed?.to}" stands in the sentence it reports`);
          }
        }
      }
    }
  }
  assert.equal(checked, 48, 'four Lesen reports on each of the twelve A1.1 papers');
  assert.deepEqual(problems, []);
});

test('DaF review #5 minor: a report never keeps a first-person verb, not even with an adverb after „und"', async () => {
  // „und dann improvisiere" passed the coordinated-verb guard unchanged: the guard looked at the
  // word right after „und" only. The lexis filter caught it on the real papers; the rule must not
  // need it, so the filter is off here on purpose.
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const spec = { ...B.reportSpecFor(CURRICULUM_A12, CURRICULUM_A12.checkpoints[3]), known: null };
  const reports = (de) => B.windowReports([{ speaker: 'Ana', de }], spec).map((r) => r.statement);
  assert.deepEqual(reports('Ich koche und dann improvisiere.'), [], 'the review\'s probe');
  assert.deepEqual(reports('Ich koche und auch improvisiere.'), []);
  assert.deepEqual(reports('Ich koche und improvisiere.'), [], 'the case the guard always caught');
  // …and a verb the table does change still reports, adverb or not.
  assert.deepEqual(reports('Ich koche und dann esse.'), ['Ana kocht und dann isst.']);
  assert.deepEqual(reports('Ich koche und danach frühstücke.'), ['Ana kocht und danach frühstückt.']);
});

test('DaF review #5 MAJOR 8: Falsch is refuted by the text, never merely not stated — annotated cases, both levels, every paper', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const spec = { ...B.reportSpecFor(CURRICULUM_A12, CURRICULUM_A12.checkpoints[3]), known: null };
  const reportOf = (speaker, de) => B.windowReports([{ speaker, de }], spec).map((r) => r.statement);
  const candidates = (statement, nouns = spec.nouns) => new Set([1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
    B.contradictions(statement, nouns, B.mulberry32(seed)).map((c) => c.de)));

  // ANNOTATED BY HAND, not by the builder: a sentence, its true report, statements about it, and
  // what the text does with each. widerspricht = refuted (and the builder makes it); offen = not
  // stated, so never a Falsch — the reasons are the review's.
  const CASES = [
    ['Ana', 'Ich habe kein Fieber.', 'Ana hat kein Fieber.',
      [['Ana hat Fieber.', 'widerspricht'], ['Ana hat kein Angebot.', 'offen']]],
    ['Ana', 'Ich möchte ein Ticket.', 'Ana möchte ein Ticket.',
      [['Ana möchte kein Ticket.', 'widerspricht'], ['Ana möchte ein Taxi.', 'offen' /* a wish excludes no other */]]],
    ['Tim', 'Ich habe den Fahrplan.', 'Tim hat den Fahrplan.',
      [['Tim hat den Fahrplan nicht.', 'widerspricht'], ['Lena hat den Fahrplan.', 'offen' /* another person */]]],
    ['Lena', 'Ich stehe nie früh auf.', 'Lena steht nie früh auf.',
      [['Lena steht früh auf.', 'widerspricht'], ['Tim steht nie früh auf.', 'offen']]],
    ['Ana', 'Ich trage gern eine Hose.', 'Ana trägt gern eine Hose.',
      [['Ana trägt gern keine Hose.', 'offen' /* „gern" takes the scope of the negation */]]],
    ['Tim', 'Ich bin manchmal zehn Minuten zu spät.', 'Tim ist manchmal zehn Minuten zu spät.',
      [['Tim ist manchmal drei Minuten zu spät.', 'offen' /* one value of several */]]],
    ['Ana', 'Ich arbeite heute.', 'Ana arbeitet heute.',
      [['Ana arbeitet morgen.', 'offen' /* another day is no opposite */]]],
  ];
  for (const [speaker, sentence, report, statements] of CASES) {
    assert.deepEqual(reportOf(speaker, sentence), [report], `„${sentence}" (${speaker}) — the report follows from it`);
    const made = candidates(report);
    for (const [statement, label] of statements) {
      if (label === 'widerspricht') assert.ok(made.has(statement), `„${statement}" contradicts „${sentence}" and is a Falsch the builder makes`);
      else assert.ok(!made.has(statement), `„${statement}" is ${label} — never a Falsch`);
    }
  }
  // A stated value changes within its magnitude: a clock time stays a clock time.
  const times = [...candidates('Ana kommt um acht Uhr an.')];
  assert.ok(times.length && times.every((de) => /^Ana kommt um (?:zwei|drei|vier|fünf|sechs|sieben|neun|zehn|elf|zwölf) Uhr an\.$/.test(de)), times.join(' | '));

  // Codex's probes (2026-10-17): German the first polarity rules would have produced wrongly.
  const probeNouns = new Map([
    ['Frauen', { article: 'plural', number: 'pl', plural: null }],
    ['Schnee', { article: 'der', number: 'sg', plural: '—' }],
    ['Lehrer', { article: 'der', number: 'sg', plural: 'Lehrer', isPluralOfSelf: true }],
    ['Kaffee', { article: 'der', number: 'sg', plural: '—' }],
    ['Milch', { article: 'die', number: 'sg', plural: '—' }],
  ]);
  for (const [statement, expected] of [
    ['Ana ist es.', []], // not „Ana ist nicht es."
    ['Tim hört Frauen zu.', []], // zuhören takes the dative
    ['Morgen kommt Schnee.', []], // Schnee is the subject
    ['Morgen bleibt Tim Lehrer.', []], // a predicate, not an object
    ['Ana braucht nicht zu arbeiten.', []], // brauchen needs its negation
    ['Tim möchte Kaffee oder Milch.', []], // „oder" does not deny both
    ['Hier sind Lehrer.', ['Hier sind keine Lehrer.']], // plural after „sind"
    ['Tim ist Lehrer.', ['Tim ist kein Lehrer.']], // nominative after „ist"
  ]) assert.deepEqual([...candidates(statement, probeNouns)], expected, statement);

  // REFERENTS, not noun strings: Lena's and Ana's „Meine Oma" are two grandmothers.
  const reports = (lines) => B.windowReports(lines, spec).map((r) => r.statement);
  assert.ok(!reports([
    { speaker: 'Lena', de: 'Meine Oma ist hier.' }, { speaker: 'Ana', de: 'Meine Oma ist dort.' }, { speaker: 'Lena', de: 'Sie ist müde.' },
  ]).includes('Die Oma ist müde.'), 'two grandmothers: no report about „die Oma"');
  assert.ok(!reports([
    { speaker: 'Lena', de: 'Meine Oma ist hier. Deine Oma ist dort.' }, { speaker: 'Ana', de: 'Sie ist müde.' },
  ]).includes('Die Oma ist müde.'), 'the review\'s own probe');
  assert.ok(reports([
    { speaker: 'Lena', de: 'Meine Oma ist krank.' }, { speaker: 'Ana', de: 'Sie ist müde.' },
  ]).includes('Die Oma ist müde.'), 'one grandmother: a report');

  // EVERY PAPER OF BOTH LEVELS: each Falsch is its own report contradicted (the kind
  // tests/checkpoint.test.mjs reads off the two sentences), never a copy of the text — and a
  // negation is no answer key: the Falsch and the Richtig statements of a paper carry the same
  // number of them (Codex, 2026-10-17: „negation → Falsch" had scored 34 of the 48 A1.2 keys).
  const NEGATION = /\b(?:nicht|nie|kein|keine|keinen|keinem|keiner|keines)\b/i;
  const unbalanced = { a11: [] };
  let falsch = 0;
  // A1.2 reads authored units since round 12 — no Falsch to check; a negation tells nothing about their key by
  // the round-12 gate („Negation±" and the „Text verneint" switch, tests below).
  assertAuthoredA12(B.buildCheckpoint);
  for (const [curriculum, file] of [[CURRICULUM_A11, 'a11']]) {
    const pool = JSON.parse(read(`src/data/lessonPools/${file}.json`));
    for (const checkpoint of curriculum.checkpoints) {
      for (let round = 0; round < 3; round += 1) {
        const lesen = B.buildCheckpoint({ curriculum, checkpoint, pool, seed: B.paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen');
        const negated = { Richtig: 0, Falsch: 0 };
        for (const it of lesen) {
          // A two-option item (A1.2, round 11b) prints its Richtig and its Falsch side by side.
          const sides = it.kind === 'choice' ? [['Richtig', it.answer], ['Falsch', it.distractor]] : [[it.answer, it.statement]];
          for (const [side, statement] of sides) if (NEGATION.test(statement)) negated[side] += 1;
          const statement = falschOf(it);
          if (statement === null) continue;
          falsch += 1;
          assert.ok(['value', 'contrary', 'polarity'].includes(it.changed?.kind), `${checkpoint.id}/${round} „${statement}": no swap of a person or a thing`);
          assert.ok(it.transform, `${checkpoint.id}/${round} „${statement}": a report, not a copy of the text`);
        }
        if (negated.Falsch !== negated.Richtig) unbalanced[file].push(`${checkpoint.id}/${round}`);
      }
    }
  }
  assert.equal(falsch, 24, 'two Falsch statements on each of the twelve A1.1 papers');
  // A1.1 is live and recorded: its checkpoint 2 chapter (L4–L6) has one stated value and no
  // negative first-person line, so its second Falsch has to add a negation. Measured 2026-10-17;
  // balancing it takes a new dialogue line and its recording — the follow-up in the handoff.
  // A ratchet: it only goes down.
  assert.ok(unbalanced.a11.length <= 3, `A1.1: ${unbalanced.a11.length} papers carry the negation cue (ratchet 3): ${unbalanced.a11}`);
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
  assert.equal(at('Das Sofa ist in der Garage.'), 1, '„in der": first in L1\'s dialogue — A1.1 had it only in a notice\'s prose („in der Ja/Nein-Frage")');
  assert.equal(at('Der Teppich ist auf der Terrasse.'), 8, '„auf der": L8 input');
  // The inventory is the input, written down here independently of the matcher that reads it.
  const inventory = v.wechselInventory('a1.2');
  for (const [combination, lektion] of [['im', 0], ['am', 0], ['ins', 0], ['in der', 1], ['an der', 1], ['auf der', 8]]) {
    assert.equal(inventory.get(combination), lektion, `„${combination}" first shown in input at ${lektion}`);
  }
  // „vor dem" stood only in L4's metalanguage („nicht steht … direkt vor dem Wort", DaF review #5, B2).
  for (const combination of ['vor der', 'vor dem', 'vor meiner', 'auf die', 'neben dem', 'unter der']) assert.equal(inventory.has(combination), false, `„${combination}" is in no input`);
  // RULE 15b reads the same two classes on every production text, the checkpoints included.
  assert.deepEqual(v.constructionsBeforeTaught(CURRICULUM_A12, POOL_A12).map((o) => `L${o.nr} ${o.where}: ${o.hit}`), []);

  // DaF review #5, B2: each taught form against its untaught neighbour. The introductions are fixed
  // here, not read off the matcher: L12 teaches the ge- participle of a simple verb, no Lektion the
  // separable one; L2 teaches „das dritte", no Lektion „im dritten"; a possessive and a determiner the
  // input never shows with a Wechselpräposition are not taught by its article; -el/-er adjectives
  // drop their e and are still adjectives.
  assert.equal(at('Wir haben heute gekauft.'), 12, 'gekauft: L12');
  assert.equal(at('Wir haben heute eingekauft.'), null, 'eingekauft: no Lektion');
  assert.ok(at('Das dritte Stockwerk ist frei.') <= 2, 'das dritte: L2');
  assert.equal(at('Die Küche ist im dritten Stockwerk.'), null, 'im dritten: no Lektion');
  assert.equal(at('Warte vor meiner Garage!'), null, 'vor meiner: in no input');
  assert.equal(at('Warte vor dem Kühlschrank!'), null, 'vor dem: only in metalanguage');
  assert.equal(at('Wir kaufen billige Milch.'), null, 'billige: Adjektivdeklination');
  assert.equal(at('Wir kaufen teure Milch.'), null, 'teure: the e of teuer drops, the adjective stays');
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

test('A1.2 transfer: what a default paper draws that the learner already answered in a lesson equals its measurement', async () => {
  // A1.1's transfer ratchet (tests/checkpoint.test.mjs), walked on A1.2 and held as an equality like
  // every A1.2 ratchet. Measured 2026-10-17, once the Schreiben drills were drawn before the
  // Sprachbausteine — before that the count depended on where the shuffle happened to land (A1.2
  // checkpoint 2 moved between 1.3 and 2.3 per paper over thirty seeds with nothing but the random
  // stream shifted). What is left is the supply, not luck: checkpoint 1's accusative Lektion has no
  // sentence-building item the lessons leave unanswered; checkpoint 2's only earlier topic is
  // numbers-counting, whose unanswered items checkpoint 1's three papers draw; checkpoint 3 takes one
  // more numbers item and one of modal-verbs-intro, which has one unanswered item in fourteen.
  // 2026-10-17 (round 8): 1 / 2 / 1 / 0. The earlier-chapter interleave now visits the topics that
  // still have unanswered items first, instead of Lektion 2's numbers on every paper; checkpoint 2
  // keeps two, because numbers-counting is its ONLY earlier topic.
  const { default: buildLesson } = await import('../src/lib/lesson/buildLesson.js');
  const { buildCheckpoint } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const measured = CURRICULUM_A12.checkpoints.map((checkpoint) => {
    const seen = new Set();
    for (const lektion of CURRICULUM_A12.lektionen.filter((l) => l.nr <= checkpoint.afterLektion)) {
      for (const attempt of [1, 2]) {
        for (const stage of buildLesson({ curriculum: CURRICULUM_A12, lektion, pool: POOL_A12, attempt }).stages) {
          for (const it of stage.items || []) seen.add(it.id);
        }
      }
    }
    return buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12 })
      .filter((it) => it.poolItemId && seen.has(it.poolItemId)).length;
  });
  // 2026-10-19 (round 11b): 1 / 1 / 0 / 0. The two-option Lesen selector takes its draws from the paper's one
  // random stream in another order, and the Sprachbausteine drawn after it moved; the supply is unchanged.
  // 2026-10-19 (round 12): 1 / 2 / 0 / 0, raised at checkpoint 2 by OWNER DECISION (option 1, 2026-10-19). The
  // authored Lesen draws nothing from the paper's random stream, so checkpoint 1's three papers spend six of the
  // seven numbers-counting items no lesson asks instead of five, and checkpoint 2 — whose ONLY earlier topic that
  // is — falls back on a second seen one: round 8's structural value; round 11b's 1 was the stream's luck.
  // Lower is the only direction this ratchet takes; any further raise needs the owner again.
  assert.deepEqual(measured, [1, 2, 0, 0], `A1.2 default papers draw ${measured.join(' / ')} lesson items — lower the ratchet in the same commit, never raise it`);
});

test('DaF review #6 BLOCKER 1: a correct answer a task rejects is excluded by a German task condition — annotated variants, both ways', () => {
  // Written by hand, apart from the repair generator (scripts/a12-determinacy.mjs, which shares the
  // build's blind spots): the variants the review measured, the condition that now excludes each,
  // and controls — wrong agreement, wrong verb position, the uncorrected form — that stay wrong.
  const item = (id) => {
    const it = POOL_A12.items.find((x) => x.id === id);
    assert.ok(it, `${id} is in the pool`);
    return it;
  };
  const verdict = (it, text) => checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result;
  const expect = (it, right, wrong) => {
    for (const text of right) assert.equal(verdict(it, text), RESULT.CORRECT, `${it.id}: „${text}" is right`);
    for (const text of wrong) assert.equal(verdict(it, text), RESULT.WRONG, `${it.id}: „${text}" is wrong`);
  };
  // L12: an article-less object may open the sentence („Milch hat Ana getrunken.") — the task names the opening.
  const milch = item('extra-a12-l12-10');
  assert.match(milch.questionDe, /\(Beginnen Sie mit „Ana“\)/);
  expect(milch, ['Ana hat Milch getrunken.'], ['Ana hat Milch getrinkt.']);
  // CP2: the first clause of a „denn" pair has a free Vorfeld — the task names the opening.
  const tablette = item('extra-a12-l06-13');
  assert.match(tablette.questionDe, /\(Beginnen Sie mit „Ich“(?:;[^)]*)?\)/);
  assert.match(tablette.questionDe, /; nach „denn“ mit „mein Kopf“\)/, 'the second main clause names its opening too (review #9)');
  expect(tablette, ['Ich nehme eine Tablette, denn mein Kopf tut weh.'], ['Ich nehme eine Tablette, denn mein Kopf wehtut.']);
  // L11: with no anchor „Seit einer Woche war es warm." was possible; a present anchor leaves „vor".
  const woche = item('extra-a12-l11-10');
  assert.match(woche.questionDe, /^Heute ist es kalt\. ___ einer Woche/);
  expect(woche, ['Vor'], ['Seit']);
  // L8: the source is a grammatical statement, so the task names the operation — and the
  // du-imperative may carry its pronoun.
  const fernseher = item('extra-a12-l08-08');
  assert.match(fernseher.questionDe, /^Bilden Sie den Imperativ:/);
  expect(fernseher, ['Mach den Fernseher aus!', 'Mache den Fernseher aus!', 'Mach du den Fernseher aus!', 'Mache du den Fernseher aus!'],
    ['Du machst den Fernseher aus!', 'Macht den Fernseher aus!', 'Mach aus den Fernseher!']);
  // The positives the review listed: Hol/Hole, „bitte" in each of its places.
  expect(item('extra-a12-l08-07'), ['Hol', 'Hole'], ['Holt']);
  expect(item('e1716cd7-ccbe-544a-a65d-796cda3e0fe7'),
    ['Machen Sie bitte das Fenster zu!', 'Bitte machen Sie das Fenster zu!', 'Machen Sie das Fenster bitte zu!', 'Machen Sie das Fenster zu, bitte!'],
    ['Sie machen bitte das Fenster zu!']);
  expect(item('extra-a12-l08-01'), ['Hilf mir bitte mit der Waschmaschine!', 'Hilf du mir bitte mit der Waschmaschine!'], ['Hilfst du mir bitte mit der Waschmaschine?']);
  // THE CLASS: the INSTRUCTION names a request or a question — a „bitte" among the bricks or inside
  // the quoted source is no task condition. „Bilden Sie den Satz: [helfen / du / mir / bitte / …]"
  // also builds „Hilfst du mir bitte …?", and „Korrigieren Sie: „Sie helfen mir bitte …!"" corrected
  // a grammatical sentence; both passed the old check on the „bitte" they print.
  const instruction = (q) => String(q).replace(/„[^“]*“/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  for (const it of POOL_A12.items.filter((x) => x.type === 'sentence_building' || x.type === 'error_correction')) {
    const key = String(it.answer).trim();
    if (/!$/.test(key)) assert.match(instruction(it.questionDe), /Imperativ|\bBitte\b|bitten/i, `${it.id}: „${it.questionDe}" names no request`);
    if (/\?$/.test(key)) assert.match(instruction(it.questionDe), /Frage/i, `${it.id}: „${it.questionDe}" names no question`);
  }
  // (Over every served item and paper, the generator side of the same rule is the review #5 test above.)
});

test('DaF review #6 BLOCKER 2: the dative ordinals are one family and spatial „um" is taught nowhere — outside the horizon and out of every draw', async () => {
  const v = await import('../scripts/validate-curriculum.mjs');
  const { buildCheckpoint, paperSeed } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const horizon = v.constructionHorizonIndex('a1.2');
  const at = (answer) => horizon({ questionDe: '', answer });
  // The review's probes: „im dritten" was caught, „im dreizehnten/siebzehnten" were not.
  for (const s of ['Ich wohne im dritten Stockwerk.', 'Ich wohne im dreizehnten Stockwerk.', 'Ich wohne im siebzehnten Stockwerk.', 'Ich wohne im hundertsten Stockwerk.']) {
    assert.equal(at(s), null, s);
  }
  // L10 teaches für, ohne, durch; „um" is a clock time and nothing else.
  for (const s of ['Wir laufen um den Stuhl.', 'Wir gehen um die Schule.']) assert.equal(at(s), null, s);
  // …and the contrasts stay inside: a clock time, the nominative ordinal L2 teaches.
  assert.notEqual(at('Der Bus fährt um acht Uhr.'), null);
  assert.notEqual(at('Das dritte Stockwerk ist frei.'), null);
  // THE DRAWS, not the stamps: the items that ask for spatial „um" are never servable, and nothing a
  // paper (rounds 0–3) or a practice plan serves is past the horizon of where it is served.
  const filled = (it) => String(it.questionDe).replace('___', String(it.answer));
  const spatialUm = POOL_A12.items.filter((it) => /\bum (?:den|die|das|einen|eine|ein|meinen|meine|mein) [A-ZÄÖÜ]/.test(filled(it)));
  assert.ok(spatialUm.length >= 2, 'the CP4 items the review measured are still in the pool');
  for (const it of spatialUm) assert.equal(it.minLektion, null, `${it.id}: „${filled(it)}"`);
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (let round = 0; round < 4; round += 1) {
      for (const it of buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: paperSeed(checkpoint, round) })) {
        if (!it.poolItemId) continue;
        const row = POOL_A12.items.find((x) => x.id === it.poolItemId);
        assert.ok(row.minLektion != null && row.minLektion <= checkpoint.afterLektion, `${checkpoint.id}/${round} ${it.id}: „${row.questionDe}" (minLektion ${row.minLektion})`);
      }
    }
  }
  for (const attempt of [1, 2]) {
    for (const [nr, items] of planPractice(CURRICULUM_A12, POOL_A12, attempt)) {
      for (const it of items) assert.ok(it.minLektion != null && it.minLektion <= nr, `L${nr}/${attempt} ${it.id} (minLektion ${it.minLektion})`);
    }
  }
});

test('DaF review #6 MAJOR 5: a simplified participle rule claims no more than it covers — German and English, notice and card', async () => {
  // „Unregelmäßig endet es auf -en" is false: bringen → gebracht, denken → gedacht, wissen → gewusst.
  // Wherever the rule is printed — the notice, its twin, the card and the card the functions serve —
  // a claim about irregular participles in -en is scoped (viele/oft/meist; many/often/most).
  const { default: CARDS } = await import('../scripts/rule-card-overrides.mjs');
  const strings = (value) => (typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : []);
  const sentences = (text) => String(text).split(/(?<=[.!?])\s+|\n/);
  const sources = [
    ...CURRICULUM_A12.lektionen.flatMap((l) => [['de', l.notice.bodyDe, `L${l.nr} notice`], ['en', l.notice.bodyEn, `L${l.nr} notice (en)`]]),
    ...Object.entries(CARDS).flatMap(([slug, card]) => strings(card).map((text) => ['de', text, `card ${slug}`])),
    // The generated module keeps each card as a JSON string: its line breaks are written „\n".
    ['de', read('netlify/functions/_shared/ruleCards.mjs').replace(/\\n/g, '\n'), 'the generated cards'],
  ];
  const CLAIM = { de: /unregelmäßig\w*[^.]*-en\b/i, en: /irregular[^.]*-en\b/i };
  const SCOPE = { de: /\b(?:viele|oft|meist|meistens|manche)\b/i, en: /\b(?:many|often|most|mostly|some)\b/i };
  let claims = 0;
  for (const [lang, text, where] of sources) {
    for (const sentence of sentences(text)) {
      if (!CLAIM[lang].test(sentence)) continue;
      claims += 1;
      assert.match(sentence, SCOPE[lang], `${where}: „${sentence.trim()}" claims it of every irregular verb`);
    }
  }
  assert.ok(claims >= 3, `the rule stands in the L12 notice, its twin and the card (${claims} found)`);
  // The contrasts, annotated by hand: each sentence of the L12 notice lists only forms of its class.
  const CLASS = {
    gekauft: 'regelmäßig', gefeiert: 'regelmäßig', gemacht: 'regelmäßig',
    gegessen: 'unregelmäßig', getrunken: 'unregelmäßig', gegangen: 'unregelmäßig',
    gebracht: 'gemischt', gedacht: 'gemischt', gewusst: 'gemischt',
    bezahlt: 'ohne ge-', verstanden: 'ohne ge-', telefoniert: 'ohne ge-',
  };
  const notice = CURRICULUM_A12.lektionen.find((l) => l.nr === 12).notice.bodyDe;
  const listed = (lead) => {
    const sentence = sentences(notice).find((x) => lead.test(x)) || '';
    return Object.keys(CLASS).filter((form) => new RegExp(`\\b${form}\\b`).test(sentence));
  };
  for (const [lead, cls] of [[/^Regelmäßig/, 'regelmäßig'], [/unregelmäßige/, 'unregelmäßig'], [/^Ohne ge-/, 'ohne ge-']]) {
    const forms = listed(lead);
    assert.ok(forms.length, `the L12 notice has a sentence for „${cls}"`);
    for (const form of forms) assert.equal(CLASS[form], cls, `„${form}" stands under „${cls}"`);
  }
});

test('DaF review #6 MAJOR 8: no Falsch from a bound, two referents for two „von" owners, and no negation cue in a statement or its text', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const spec = { ...B.reportSpecFor(CURRICULUM_A12, CURRICULUM_A12.checkpoints[3]), known: null };
  const candidates = (statement) => new Set([1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
    B.contradictions(statement, spec.nouns, B.mulberry32(seed)).map((c) => c.de)));
  const reports = (lines) => B.windowReports(lines, spec).map((r) => r.statement);
  // ANNOTATED BY HAND (widerspricht / offen), not derived from the generator. „mindestens zwei" is
  // not refuted by twelve or by three: a bound gives no Falsch at all; an exact value still does.
  assert.deepEqual([...candidates('Ana hat mindestens zwei Koffer.')], [], 'the review\'s probe: „mindestens zwölf" is offen');
  assert.ok(candidates('Ana hat zwei Koffer.').has('Ana hat drei Koffer.'), 'an exact value: „drei" widerspricht');
  // Two grandmothers told apart by „von" are two referents; one is one.
  assert.deepEqual(reports([
    { speaker: 'Lena', de: 'Die Oma von Tim ist hier.' }, { speaker: 'Ana', de: 'Die Oma von Lena ist dort.' }, { speaker: 'Lena', de: 'Sie ist müde.' },
  ]).filter((x) => /müde/.test(x)), [], 'the review\'s probe: no report about „die Oma"');
  assert.ok(reports([{ speaker: 'Lena', de: 'Die Oma von Tim ist krank.' }, { speaker: 'Ana', de: 'Sie ist müde.' }]).includes('Die Oma ist müde.'), 'one grandmother: a report');
  // The isolated transformer refuses a coordinated first person it does not convert, whatever
  // stands between „und" and the verb (review #6 Minor: anschließend, plötzlich, zu Hause).
  const one = (de) => reports([{ speaker: 'Ana', de }]);
  for (const de of ['Ich koche und anschließend improvisiere.', 'Ich koche und plötzlich improvisiere.', 'Ich koche und zu Hause improvisiere.']) assert.deepEqual(one(de), [], de);
  assert.deepEqual(one('Ich koche und bin müde.'), ['Ana kocht und ist müde.'], 'a verb the table converts still reports');
  // NO ANSWER KEY IN THE NEGATIONS. „Negation in the text → Falsch, otherwise Richtig" scored 49 of
  // 64 keys and solved seven papers. Run that strategy — and the same one on the statements — on every
  // regular paper of both levels: it solves none, and on A1.2 it scores chance, which is what a paper
  // whose Richtig and Falsch texts carry the same number of negations leaves it (measured 24 of 48).
  // A1.1's checkpoint 2 papers keep a one-statement imbalance (the review #5 test's ratchet) that no
  // whole-paper strategy turns into a solved paper.
  const NEG = /\b(?:nicht|nie|kein|keine|keinen|keinem|keiner|keines)\b/i;
  const solved = { a11: [] };
  // A1.2 reads authored units since round 12: its negation shortcuts („Negation±", the „Text verneint" switch)
  // are part of the frozen gate the round-12 test runs on every A1.2 paper.
  assertAuthoredA12(B.buildCheckpoint);
  for (const [curriculum, file] of [[CURRICULUM_A11, 'a11']]) {
    const pool = JSON.parse(read(`src/data/lessonPools/${file}.json`));
    for (const checkpoint of curriculum.checkpoints) {
      for (let round = 0; round < 3; round += 1) {
        const lesen = B.buildCheckpoint({ curriculum, checkpoint, pool, seed: B.paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen');
        for (const field of ['text', 'statement']) {
          if (lesen.every((it) => (NEG.test(it[field]) ? 'Falsch' : 'Richtig') === it.answer)) solved.a11.push(`${checkpoint.id}/${round}/${field}`);
        }
      }
    }
  }
  assert.deepEqual(solved.a11, [], 'A1.1: no regular paper is solved by spotting a negation');
});

test('DaF review #7 MAJOR 8: Richtig and Falsch carry the same negation pairs on every A1.2 paper, and a time bound gives no Falsch', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  // Balancing the statement count and the text count APART left Falsch {text only, statement only}
  // against Richtig {both, neither}, and „statement and text agree → Richtig" solved six regular
  // papers (review #7). The pairs are read off the printed fields here, not from the builder: on
  // every A1.2 paper, rounds 0–3, both sides carry the same multiset of (statement negated, text
  // negated), so each of the sixteen functions of those two features scores exactly half a paper.
  const NEG = /\b(?:nicht|nie|kein|keine|keinen|keinem|keiner|keines)\b/i;
  const pair = (it) => `${NEG.test(it.statement) ? 1 : 0}${NEG.test(it.text) ? 1 : 0}`;
  const papers = (curriculum, pool, rounds) => curriculum.checkpoints.flatMap((checkpoint) => Array.from({ length: rounds }, (_, round) => ({
    id: `${checkpoint.id}/${round}`,
    lesen: B.buildCheckpoint({ curriculum, checkpoint, pool, seed: B.paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen'),
  })));
  const unbalanced = (list) => list.filter(({ lesen }) => {
    const side = (key) => lesen.filter((it) => it.answer === key).map(pair).sort().join(',');
    return side('Richtig') !== side('Falsch');
  }).map((p) => p.id);
  // Since round 11b A1.2 prints two options, and what a reader sees is (option A negated, option B negated,
  // text negated). The best function of that triple takes, per triple, the place where more keys stand; on
  // every paper, the stress round included, it scores exactly half.
  const triple = (it) => `${NEG.test(it.options[0]) ? 1 : 0}${NEG.test(it.options[1]) ? 1 : 0}${NEG.test(it.text) ? 1 : 0}`;
  const bestPlace = (lesen) => {
    const keysAt = new Map();
    for (const it of lesen) {
      const at = keysAt.get(triple(it)) || [0, 0];
      at[it.options[0] === it.answer ? 0 : 1] += 1;
      keysAt.set(triple(it), at);
    }
    return [...keysAt.values()].reduce((sum, [a, b]) => sum + Math.max(a, b), 0);
  };
  const a12 = papers(CURRICULUM_A12, POOL_A12, 4);
  for (const { id, lesen } of a12) {
    assert.ok(lesen.length === 4 && lesen.every((it) => it.kind === 'choice'), `${id}: four two-option items`);
    assert.equal(bestPlace(lesen), 2, `${id}: a negation strategy scores ${bestPlace(lesen)} of 4`);
  }
  // A1.1 is live and recorded: its checkpoint 2 chapter has no negative first-person line, so three
  // papers keep one added negation (the follow-up in the handoff). A ratchet: it only goes down.
  const a11 = papers(CURRICULUM_A11, JSON.parse(read('src/data/lessonPools/a11.json')), 3);
  assert.ok(unbalanced(a11).length <= 3, `A1.1: ${unbalanced(a11)}`);

  // ANNOTATED BY HAND: a time a preposition makes a bound or the end of an interval is not refuted by
  // another number — an arrival at seven makes „vor zehn" and „vor acht" both true (review #7).
  const spec = { ...B.reportSpecFor(CURRICULUM_A12, CURRICULUM_A12.checkpoints[3]), known: null };
  const values = (statement) => [...new Set([1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
    B.contradictions(statement, spec.nouns, B.mulberry32(seed)).filter((c) => c.kind === 'value').map((c) => c.de)))];
  for (const statement of ['Ana kommt vor zehn Uhr.', 'Ana kommt nach acht Uhr.', 'Ana arbeitet zwischen acht und zehn Uhr.',
    'Ana arbeitet bis zehn Uhr.', 'Ana arbeitet ab acht Uhr.', 'Ana wartet seit zehn Minuten.', 'Ana kommt gegen acht Uhr.',
    'Der Bus fährt von sieben bis zehn Uhr.']) assert.deepEqual(values(statement), [], `„${statement}" — offen`);
  // …while a stated one-off event is one value: „um neun" widerspricht „um acht" (the arrival, „kommt … an";
  // review #10: without its particle the clause states no one-off event, see the review #9 test).
  assert.ok(values('Ana kommt um acht Uhr an.').includes('Ana kommt um neun Uhr an.'), 'um acht → um neun widerspricht');
});

test('DaF review #7 BLOCKER 2: a word the course knows does not license a meaning or a form it never taught — annotated, then every real draw', async () => {
  const v = await import('../scripts/validate-curriculum.mjs');
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const horizon = v.constructionHorizonIndex('a1.2');
  const at = (answer) => horizon({ questionDe: '', answer });
  // ANNOTATED BY HAND: what A1.2 teaches (true) and what it teaches nowhere (false). „gegen" is
  // „against" from L6 („gegen Kopfschmerzen"); the approximate time is a second meaning. „um" is a
  // clock time; around-a-thing is never taught, whatever determines the noun. An ordinal is taught in
  // its -e form after the article (L2); declined, simple or compound, it is not.
  const TAUGHT = [
    ['Die Tablette hilft gegen Kopfschmerzen.', true],
    ['Ich komme gegen fünf Uhr.', false], ['Ich komme gegen 5 Uhr.', false], ['Wir essen gegen Abend.', false],
    ['Der Bus fährt um acht Uhr.', true], ['Um acht Uhr fährt der Bus.', true],
    ['Wir laufen um den Stuhl.', false], ['Wir laufen um diesen Tisch.', false], ['Wir laufen um drei Häuser.', false],
    ['Wir laufen ums Haus.', false], ['Um den Tisch laufen wir.', false],
    ['Das dritte Stockwerk ist frei.', true],
    ['Ich wohne im dritten Stockwerk.', false], ['Ich wohne im dreizehnten Stockwerk.', false],
    ['Ich wohne im zweihundertsten Stockwerk.', false], ['Er wohnt im hundertersten Stockwerk.', false],
  ];
  for (const [sentence, taught] of TAUGHT) {
    if (taught) assert.notEqual(at(sentence), null, `„${sentence}" — taught`);
    else assert.equal(at(sentence), null, `„${sentence}" — taught nowhere`);
  }
  // THE DRAWS, with this test's own detectors rather than the validator's patterns: nothing a
  // practice plan or a paper (rounds 0–3) serves asks for a sense or a form the course never taught.
  // Review #8: those detectors stopped at zwölf like the patterns they checked. Now by MEANING, with
  // this test's own number words and a walk over the tokens: „um" is taught only before a clock time
  // or as a clause-final particle; „gegen" before a time is a meaning the course never taught.
  const NUMBER_WORDS = ['ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf',
    'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig', 'einundzwanzig',
    'zweiundzwanzig', 'dreiundzwanzig', 'vierundzwanzig', 'eins', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'hundert'];
  const isNumber = (w) => NUMBER_WORDS.includes(String(w).toLowerCase()) || /^\d{1,2}(?:[.:]\d{2})?$/.test(String(w));
  const walk = (t) => String(t).split(/\s+/).filter(Boolean).map((raw) => ({ raw, w: raw.replace(/^[„“"(]+|[.,!?;:„“")]+$/g, '') }));
  const afterTimeWords = (tok, k) => {
    // „halb …", „kurz nach …", „Viertel vor …" lead into the number
    if (/^halb$/i.test(tok[k]?.w)) return k + 1;
    if (/^(?:kurz|viertel)$/i.test(tok[k]?.w) && /^(?:nach|vor)$/i.test(tok[k + 1]?.w)) return k + 2;
    return k;
  };
  const spatialUm = (t) => {
    const tok = walk(t);
    return tok.some(({ raw, w }, k) => {
      if (!/^ums?$/i.test(w)) return false;
      if (/[.!?,;:]$/.test(raw) || k === tok.length - 1 || /^(?:und|oder|aber|denn|sondern)$/i.test(tok[k + 1]?.w)) return false;
      const n = afterTimeWords(tok, k + 1);
      const clock = isNumber(tok[n]?.w) && !(tok[n + 1] && /^[A-ZÄÖÜ]/.test(tok[n + 1].w) && tok[n + 1].w !== 'Uhr');
      return /^ums$/i.test(w) || !clock;
    });
  };
  const TIME_NOUNS = /^(?:Uhr|Mittag|Abend|Morgen|Nacht|Mitternacht|Wochenende)$/;
  const temporalGegen = (t) => {
    const tok = walk(t);
    return tok.some(({ w }, k) => /^gegen$/i.test(w) && (isNumber(tok[afterTimeWords(tok, k + 1)]?.w) || TIME_NOUNS.test(tok[k + 1]?.w || '')));
  };
  // Systematic: across zwölf/dreizehn and word/digit, every clock number before „Uhr" is taught after
  // „um" and never after „gegen", and never as a count after „um".
  NUMBER_WORDS.slice(0, 24).forEach((word, n) => {
    for (const num of [word, String(n + 1)]) {
      assert.equal(at(`Ich komme gegen ${num} Uhr.`), null, `gegen ${num} Uhr`);
      assert.equal(at(`Wir laufen um ${num} Häuser.`), null, `um ${num} Häuser`);
      assert.notEqual(at(`Der Bus fährt um ${num} Uhr.`), null, `um ${num} Uhr`);
      assert.ok(temporalGegen(`Ich komme gegen ${num} Uhr.`) && spatialUm(`Wir laufen um ${num} Häuser.`) && !spatialUm(`Der Bus fährt um ${num} Uhr.`), `the detectors on ${num}`);
    }
  });
  for (const sentence of ['Ich komme gegen Viertel vor acht.', 'Ich komme gegen halb neun.', 'Wir essen gegen Abend.', 'Wir laufen um dreißig Häuser.', 'Ich lerne, um zu arbeiten.']) {
    assert.equal(at(sentence), null, sentence);
  }
  for (const sentence of ['Der Bus fährt um halb neun.', 'Wo steige ich um?', 'Ich steige in Köln um.', 'Um acht Uhr fährt der Bus.']) {
    assert.notEqual(at(sentence), null, sentence);
    assert.ok(!spatialUm(sentence), `the detector on „${sentence}"`);
  }
  const declinedOrdinal = (t) => /\b(?:im|am|zum|vom|beim|dem|den|der|des|einem|einen|einer|eines)\s+[a-zäöüß]*(?:erst|zweit|dritt|viert|fünft|sechst|siebt|acht|neunt|zehnt|elft|zwölft|igst|hundertst|tausendst)(?:en|er|es|em)\b/i.test(t);
  for (const [sentence, taught] of TAUGHT) {
    assert.equal(!(temporalGegen(sentence) || spatialUm(sentence) || declinedOrdinal(sentence)), taught, `the detectors agree on „${sentence}"`);
  }
  const filled = (it) => `${String(it.questionDe).replace('___', String(it.answer))} ${it.answer}`;
  const check = (it, where) => {
    const t = filled(it);
    assert.ok(!temporalGegen(t) && !spatialUm(t) && !declinedOrdinal(t), `${where} ${it.id}: „${t}"`);
  };
  for (const attempt of [1, 2]) {
    for (const [nr, items] of planPractice(CURRICULUM_A12, POOL_A12, attempt)) for (const it of items) check(it, `L${nr}/${attempt}`);
  }
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (let round = 0; round < 4; round += 1) {
      for (const it of B.buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: B.paperSeed(checkpoint, round) })) {
        if (it.poolItemId) check(POOL_A12.items.find((x) => x.id === it.poolItemId), `${checkpoint.id}/${round}`);
      }
    }
  }
});

test('DaF review #7 BLOCKER 1: a rejected correct answer is excluded by a German task condition — corrections, du with bitte, preposition gaps, German cues', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const verdict = (it, text) => checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result;
  // Every item a learner can meet: both real plans and every paper, rounds 0–3.
  const served = new Map();
  for (const attempt of [1, 2]) for (const [, items] of planPractice(CURRICULUM_A12, POOL_A12, attempt)) for (const it of items) served.set(it.id, it);
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (let round = 0; round < 4; round += 1) {
      for (const it of B.buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: B.paperSeed(checkpoint, round) })) {
        if (it.poolItemId) served.set(it.poolItemId, POOL_A12.items.find((x) => x.id === it.poolItemId));
      }
    }
  }
  const items = [...served.values()];
  // 1. A correction says what it corrects. „Korrigieren Sie: „Das Taxi fährt von sieben zu zehn
  //    Uhr.““ refused „Von sieben bis zehn Uhr fährt das Taxi."; the task now mends only the error.
  for (const it of items.filter((x) => x.type === 'error_correction')) {
    assert.doesNotMatch(it.questionDe, /^Korrigieren Sie:/, `${it.id}: „${it.questionDe}" names no operation`);
  }
  for (const [id, mended] of [['extra-a12-l09-12', 'Das Taxi fährt von sieben bis zehn Uhr.'], ['extra-a12-l12-17', 'Der Fisch war lecker, aber Tim ist früh gegangen.']]) {
    const it = POOL_A12.items.find((x) => x.id === id);
    assert.match(it.questionDe, /^Korrigieren Sie nur den Fehler:/, id);
    assert.equal(verdict(it, mended), RESULT.CORRECT, `${id}: „${mended}"`);
  }
  // 2. A du-imperative takes its emphatic pronoun wherever „bitte" may stand — generated HERE, not by
  //    the build (review #7: „Bitte hilf du mir mit der Waschmaschine!" was refused).
  let imperatives = 0;
  for (const it of items.filter((x) => x.type === 'sentence_building' || x.type === 'error_correction')) {
    const m = String(it.answer).trim().match(/^([A-ZÄÖÜ][a-zäöüß]+) (.+)!$/);
    if (it.topic !== 'imperative' || !m || /t$/.test(m[1]) || /^(?:Sie|ihr|wir)\b/.test(m[2])) continue;
    imperatives += 1;
    const [, verb, rest] = m;
    const plain = rest.replace(/\bbitte\b\s*/, '').trim();
    const forms = [`${verb} du ${rest}!`];
    if (/\bbitte\b/.test(rest)) forms.push(`Bitte ${verb.toLowerCase()} du ${plain}!`, `${verb} du ${plain} bitte!`);
    for (const form of forms) assert.equal(verdict(it, form), RESULT.CORRECT, `${it.id}: „${form}"`);
    assert.notEqual(verdict(it, `Bitte du ${verb.toLowerCase()} ${plain}!`), RESULT.CORRECT, `${it.id}: the pronoun before the verb`);
  }
  assert.ok(imperatives >= 3, `the rule reads the served du-imperatives (${imperatives})`);
  // 3. Every preposition gap that can be served is annotated here BY HAND: the prepositions its
  //    German context or cue rules out (review #7: a birthday did not rule out „ohne"). A new gap
  //    fails until someone has judged it.
  const GAPS = {
    'extra-a12-l11-01': ['Am', 'In dem'],
    'extra-a12-l11-02': ['Im', 'An dem'],
    'extra-a12-l11-03': ['zur', 'zu dem'],
    '96034fda-42dc-5e3d-8c8d-3c7c82591baf': ['zur', 'zu dem'],
    'extra-a12-l11-04': ['zum', 'zu der'],
    '49d0d7b5-dbe0-560a-bce0-266b040e5851': ['zum', 'zu der'],
    'extra-a12-l11-10': ['Seit'],
    'extra-a12-l11-11': ['vor'],
    'extra-a12-l11-12': ['seit'],
    '8058bf54-3a86-5ed4-8a24-55630a3efbce': ['nach', 'von'], // (Heimat, Land)
    'fe97d1bc-1569-5fa8-a988-5ab810e33a1c': ['nach', 'zu'], // (Startort, kein Land)
    'f7aa6e9b-0c37-5874-b2b0-2e311896881a': ['zu', 'mit'],
    'eec3bcc5-32be-5e44-915e-c9c810980456': ['zu', 'in'], // (Richtung, Land)
    '7227417e-2b9e-549e-bfcb-6932043bf3d2': ['nach', 'aus', 'von'], // (Richtung, Person)
    'extra-a12-l09-10': ['ab', 'um'],
    'extra-a12-l09-11': ['um', 'bis'],
    'extra-a12-l09-13': ['bis', 'um'],
    'extra-a12-l10-01': ['ohne', 'durch'], // Oma is in the shop with Ana
    'extra-a12-l10-02': ['für', 'durch'],
    'extra-a12-l10-03': ['für', 'ohne'],
    'extra-a12-l10-04': ['ohne', 'durch'],
  };
  const PREPOSITION = /^(?:für|ohne|durch|um|gegen|mit|bei|nach|von|zu|zur|zum|aus|seit|vor|ab|bis|in|im|ins|an|am|auf|unter|über|neben|zwischen|hinter)$/i;
  const gaps = POOL_A12.items.filter((x) => x.minLektion != null && PREPOSITION.test(String(x.answer).trim())).map((x) => x.id).sort();
  assert.deepEqual(gaps, Object.keys(GAPS).sort(), 'a new preposition gap is judged here before it can be served');
  for (const [id, ruledOut] of Object.entries(GAPS)) {
    const it = POOL_A12.items.find((x) => x.id === id);
    assert.equal(verdict(it, it.answer), RESULT.CORRECT, id);
    for (const other of ruledOut) assert.notEqual(verdict(it, other), RESULT.CORRECT, `${id}: „${other}"`);
  }
  // 4. A cue in brackets is German. „(approximately)" alone decided „gegen" over „um", and a list of
  //    English words missed „(= Where?)" (review #8) — so every word of a cue is either German the
  //    course has taught by L12 or one of the task words below, each judged once; a new word fails here.
  const { knownUpTo } = await import('../src/lib/checkpoint/lexis.js');
  const known = knownUpTo(CURRICULUM_A12, 12);
  const TASK_WORDS = new Set(['Beginnen', 'Kurzform', 'Startort', 'Bewegung', 'Heimat', 'verstehen', 'aufmachen', 'U']);
  for (const it of POOL_A12.items.filter((x) => x.minLektion != null)) {
    for (const [, cue] of String(it.questionDe).matchAll(/\(([^)]*)\)/g)) {
      for (const word of cue.split(/[^A-Za-zÄÖÜäöüß]+/).filter(Boolean)) {
        // a verb in -ieren is known when its -iert participle is taught: that is the L12 rule itself
        // („Ohne ge- bei … -ieren: telefoniert"), and „(telefonieren, Perfekt)" asks for exactly that form
        const ierenKnown = /ieren$/.test(word) && known.has(word.replace(/ieren$/, 'iert'));
        assert.ok(known.has(word) || known.has(word.toLowerCase()) || TASK_WORDS.has(word) || ierenKnown, `${it.id}: „${word}" in „(${cue})" is not German the course knows`);
      }
    }
  }
});

test('DaF review #7 B1: the task formulas are one list — the checkpoint draw and the validator read the same one', async () => {
  // Two copies had drifted by nine formulas: every „Korrigieren Sie nur den Fehler" item read as
  // untaught lexis to the checkpoint draw while the validator stamped it servable.
  const { ITEM_FORMULAS } = await import('../src/lib/checkpoint/lexis.js');
  const src = read('scripts/validate-curriculum.mjs');
  assert.match(src, /import \{ ITEM_FORMULAS \} from '\.\.\/src\/lib\/checkpoint\/lexis\.js';/);
  assert.doesNotMatch(src, /const ITEM_FORMULA_RE = new RegExp\(\[/, 'no second copy of the list');
  // Longest first: a shorter formula listed earlier would match and leave the rest counted as lexis.
  ITEM_FORMULAS.forEach((formula, i) => {
    const shadow = ITEM_FORMULAS.slice(0, i).find((earlier) => formula.startsWith(earlier));
    assert.equal(shadow, undefined, `„${formula}" comes after „${shadow}", which matches first`);
  });
});

test('DaF review #8 BLOCKER 1: a sentence-building statement names its opening, a kein gap asks for its own negation, a meaning cue is German', async () => {
  const { servedItems } = await import('../scripts/a12-determinacy.mjs');
  const verdict = (it, text) => checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result;
  const item = (id) => POOL_A12.items.find((x) => x.id === id);
  // A predicate may open a statement too („Nicht schön ist der Eingang.", „Schön ist der Eingang
  // nicht."), more fronting than any generator models — so every served sentence-building statement
  // names its opening, and the order it grades is the order it asked for.
  const served = servedItems('a1.2').items;
  const statements = served.filter((it) => it.type === 'sentence_building' && /\.$/.test(String(it.answer).trim()));
  assert.ok(statements.length >= 20, `the rule reads the served statements (${statements.length})`);
  for (const it of statements) {
    assert.match(String(it.questionDe ?? it.promptDe), /\(Beginnen Sie mit „[^“]+“(?:;[^)]*)?\)/, `${it.where} ${it.id}: „${it.questionDe ?? it.promptDe}" names no opening`);
  }
  const eingang = item('extra-a12-l04-12');
  assert.match(eingang.questionDe, /\(Beginnen Sie mit „Der Eingang“\)/);
  assert.equal(verdict(eingang, 'Der Eingang ist nicht schön.'), RESULT.CORRECT);
  assert.notEqual(verdict(eingang, 'Nicht schön ist der Eingang.'), RESULT.CORRECT, 'excluded by the named opening');
  // The kein gap asks about ITS object.
  const spiegel = item('extra-a12-l04-02');
  assert.match(spiegel.questionDe, /^Antworten Sie mit Nein: Ist im Flur ein Spiegel\?/);
  assert.equal(verdict(spiegel, 'kein'), RESULT.CORRECT);
  // „(= Where?)" decided the answer in English; a German answer frame decides it now.
  const wo = item('3558a177-5f22-4700-9512-ff7dc3ac7d9d');
  assert.match(wo.questionDe, /— In Berlin\.$/);
  assert.doesNotMatch(wo.questionDe, /Where/);
  for (const other of ['Wann', 'Woher', 'Wohin']) assert.notEqual(verdict(wo, other), RESULT.CORRECT, other);
});

test('DaF review #8 MAJOR 8: a clock time is a Falsch only for a once-only event after „um" — never for a state, a bound or an alternative', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const spec = { ...B.reportSpecFor(CURRICULUM_A12, CURRICULUM_A12.checkpoints[3]), known: null };
  const values = (statement) => [...new Set([1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
    B.contradictions(statement, spec.nouns, B.mulberry32(seed)).filter((c) => c.kind === 'value').map((c) => c.de)))];
  // ANNOTATED BY HAND (widerspricht / offen). „Tim ist um elf in Köln" is a state: at four he may still
  // be there. Getting up and arriving happen once: another time refutes them.
  for (const [statement, label] of [
    ['Tim ist um elf in Köln.', 'offen'], ['Tim kocht um acht.', 'offen'], ['Ana kommt vor halb zehn.', 'offen'],
    ['Ana kommt um acht oder neun Uhr.', 'offen'], ['Ana arbeitet bis um zehn.', 'offen'],
    ['Tim steht um sechs auf.', 'widerspricht'], ['Der Zug fährt um acht Uhr.', 'offen'], ['Ana kommt um neun Uhr an.', 'widerspricht'],
  ]) {
    if (label === 'offen') assert.deepEqual(values(statement), [], `„${statement}" — offen`);
    else assert.ok(values(statement).length > 0, `„${statement}" — widerspricht`);
  }
  // …and on every paper of both levels: each clock-time Falsch comes from an event verb after „um",
  // read with this test's own verb list (review #8 found three from „Ich bin um elf in Köln.").
  const EVENT = /\b(?:kommt|kommen|fährt|fahren|fliegt|fliegen|beginnt|beginnen|fängt|fangen|öffnet|schließt|landet|startet)\b|\bsteh\w*\b.*\bauf[.!?]?$/;
  for (const [curriculum, file, rounds] of [[CURRICULUM_A12, 'a12', 4], [CURRICULUM_A11, 'a11', 3]]) {
    const pool = JSON.parse(read(`src/data/lessonPools/${file}.json`));
    for (const checkpoint of curriculum.checkpoints) {
      for (let round = 0; round < rounds; round += 1) {
        const lesen = B.buildCheckpoint({ curriculum, checkpoint, pool, seed: B.paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen');
        for (const it of lesen.filter((x) => falschOf(x) !== null && x.changed?.kind === 'value')) {
          const statement = falschOf(it);
          const clock = /\bUhr\b/.test(statement) || new RegExp(`\\bum ${it.changed.to}\\b`).test(statement);
          if (!clock) continue;
          assert.match(statement, EVENT, `${checkpoint.id}/${round} „${statement}": a clock time on a state or an activity`);
          assert.match(statement, new RegExp(`\\bum ${it.changed.to}\\b`), `${checkpoint.id}/${round} „${statement}": not governed by „um"`);
          assert.doesNotMatch(statement, /\boder\b/, `${checkpoint.id}/${round} „${statement}"`);
        }
      }
    }
  }
});

test('DaF review #9 B1: the German task and the accepted set agree both ways — opening, the place of „nicht", a later clause, the emphatic pronoun in a gap', async () => {
  const H = await import('../scripts/a12-determinacy.mjs');
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const verdict = (it, text) => checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result;
  // ANNOTATED BY HAND: the place of „nicht" is named exactly where a second place or reading exists.
  for (const [key, cue] of [
    ['Wir kaufen das Auto nicht.', '„nicht“ steht am Satzende'], // „Wir kaufen nicht das Auto." is contrastive
    ['Ich fahre nicht ohne meinen Bruder.', '„nicht“ steht vor „ohne“'], // „… ohne meinen Bruder nicht." is German too
    ['Heute kommt Tim nicht.', '„nicht“ steht am Satzende'],
    ['Ich kann heute nicht kommen.', '„nicht“ steht vor „kommen“'],
    ['Der Eingang ist nicht schön.', null], ['Mein Mann schläft nicht gut, sein Rücken tut weh.', null],
    ['Ich komme nie.', null], ['Nimm das nicht!', null],
  ]) assert.equal(H.negationPlaceCue(key), cue, key);
  assert.deepEqual(H.laterOpenings('Der Fisch war lecker, aber Tim ist früh gegangen.'), [{ after: 'aber', opening: 'Tim' }]);
  assert.deepEqual(H.laterOpenings('Mein Mann schläft nicht gut, sein Rücken tut weh.'), [{ after: null, opening: 'sein Rücken' }]);
  assert.deepEqual(H.laterOpenings('Ich kaufe Brot, Milch und Käse.'), [], 'a list is no clause');
  // The two items review #9 measured, both ways.
  const pool = poolItems(POOL_A12);
  const auto = pool.find((i) => i.id === '1b0e08fd-2629-52c8-881a-287913fb41a7');
  assert.match(auto.questionDe, /\(Beginnen Sie mit „Wir“; „nicht“ steht am Satzende\)/);
  assert.equal(verdict(auto, 'Wir kaufen das Auto nicht.'), RESULT.CORRECT);
  for (const out of ['Wir kaufen nicht das Auto.', 'Das Auto kaufen wir nicht.']) assert.notEqual(verdict(auto, out), RESULT.CORRECT, `„${out}" is excluded by the German task`);
  const bruder = pool.find((i) => i.id === '91763b6e-9511-54a0-b044-ff13b01990ac');
  assert.match(bruder.questionDe, /\(Beginnen Sie mit „Ich“; „nicht“ steht vor „ohne“\)/);
  assert.equal(verdict(bruder, 'Ich fahre nicht ohne meinen Bruder.'), RESULT.CORRECT);
  for (const out of ['Ich fahre ohne meinen Bruder nicht.', 'Ohne meinen Bruder fahre ich nicht.']) assert.notEqual(verdict(bruder, out), RESULT.CORRECT, `„${out}" is excluded by the German task`);
  // THE CLASS, over everything a learner is served: both practice attempts and every paper of all four
  // rounds (the 17 measured contradictions were all on papers).
  const served = [];
  for (const attempt of [1, 2]) for (const [nr, list] of planPractice(CURRICULUM_A12, POOL_A12, attempt)) for (const it of list) served.push({ ...it, where: `L${nr}` });
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (let round = 0; round < 4; round += 1) {
      for (const it of B.buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: B.paperSeed(checkpoint, round) })) {
        if (it.answer) served.push({ ...it, where: `${checkpoint.id}/${round}` });
      }
    }
  }
  const STATEMENT = new Set(['sentence_building', 'error_correction']);
  let cued = 0;
  for (const it of served) {
    const q = String(it.questionDe ?? it.promptDe ?? '');
    const key = String(it.answer || '');
    const accepted = it.accepted?.length ? it.accepted : [key];
    const opening = q.match(/\(Beginnen Sie mit „([^“]+)“/)?.[1];
    if (opening && STATEMENT.has(it.type)) {
      cued += 1;
      for (const a of accepted) assert.ok(H.opensWith(a, opening), `${it.where} ${it.id}: the task names „${opening}" but accepts „${a}"`);
    }
    if (it.type === 'sentence_building') {
      const place = H.negationPlaceCue(key);
      if (place) {
        assert.ok(q.includes(place), `${it.where} ${it.id}: „${key}" has a second place for „nicht"; the task must name it`);
        const [, word, next] = place.match(/^„(\w+)“ steht (?:am Satzende|vor „([^“]+)“)$/);
        for (const a of accepted) {
          const t = String(a).replace(/[.!?]+$/, '').split(/\s+/);
          const n = t.findIndex((w) => w === word);
          assert.ok(next ? t[n + 1] === next : n === t.length - 1, `${it.where} ${it.id}: „${a}" puts „${word}" where the task excludes it`);
        }
      }
      for (const { after, opening: later } of H.laterOpenings(key)) {
        assert.ok(q.includes(`${after ? `nach „${after}“` : 'der zweite Teil'} mit „${later}“`), `${it.where} ${it.id}: the clause after „${after || ','}" opens freely in „${key}"`);
      }
    }
    if (it.type === 'fill_blank' && /\([a-zäöüß]+en, du\)/.test(q) && /^[A-Za-zäöüß]+$/.test(key) && H.GAP_IMPERATIVE_RE.test(q)) {
      assert.equal(verdict(it, `${key} du`), RESULT.CORRECT, `${it.where} ${it.id}: „${key} du" is the same imperative with its emphatic pronoun`);
    }
  }
  assert.ok(cued >= 40, `the class is reached: ${cued} cued statements served`);
  // A question gap that already carries its „du" takes no second one.
  const hilfst = pool.find((i) => i.id === '7e299b81-ed13-5094-8027-426571eeed01');
  assert.ok(!(hilfst.accepted || []).some((a) => / du$/.test(a)), 'no „Hilfst du du"');
});

test('DaF review #9 B2: „um" and „gegen" are read to the END of their expression and fail closed — annotated families', async () => {
  const v = await import('../scripts/validate-curriculum.mjs');
  const h = v.constructionHorizonIndex('a1.2');
  const blocked = (s) => h({ questionDe: '', answer: s }) === null;
  const W = ['ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig', 'einundzwanzig', 'zweiundzwanzig', 'dreiundzwanzig', 'vierundzwanzig'];
  // ANNOTATED: true = a meaning no surface teaches (spatial „um", temporal „gegen"); false = taught.
  const cases = [];
  for (let n = 1; n <= 24; n += 1) {
    for (const [num, next] of [[W[n - 1], W[n % 24]], [String(n), String((n % 24) + 1)]]) {
      cases.push([`Der Bus fährt um ${num} Uhr.`, false], [`Der Bus fährt um ${num}.`, false], [`Ich komme um ${num} oder ${next} Uhr.`, false]);
      cases.push([`Wir laufen um ${num} Häuser.`, true], [`Wir laufen um ${num} oder ${next} Häuser.`, true], [`Wir laufen um ${num}, ${next} Häuser.`, true]);
      cases.push([`Ich komme gegen ${num} Uhr.`, true], [`Ich komme gegen ${num}.`, true]);
    }
  }
  cases.push(
    ['Ich komme gegen den Abend.', true], ['Ich komme gegen Abend.', true], ['Die Tablette nehme ich gegen acht Uhr.', true],
    ['Wir spielen gegen die Kinder.', true], ['Wir laufen um die Ecke.', true], ['Wir laufen ums Haus.', true], ['Ich lerne, um zu arbeiten.', true],
    ['Die Tablette hilft gegen Kopfschmerzen.', false], ['Das hilft gegen Fieber.', false], ['Die Tablette hilft gegen meinen Husten.', false],
    ['Der Bus fährt um halb neun.', false], ['Um wie viel Uhr fährt der Bus?', false], ['Wo steige ich um?', false],
    ['Ich steige in Köln um und fahre nach Bonn.', false], ['Ich komme um acht, dann koche ich.', false], ['Ich komme um 8.30 Uhr.', false],
    // review #10: a lower-case word does not end a clock time — partitives and adjectives count things
    ['Wir laufen um zwei der Häuser.', true], ['Wir laufen um zwei große Häuser.', true], ['Wir laufen um zwei von den Häusern.', true],
    // FAIL CLOSED: no taught surface lets a verb follow the time, so this stays shut until one does
    ['Um zwei kommen wir.', true], ['Ich stehe um sechs auf.', false], ['Ich komme um neun Uhr an.', false],
  );
  const wrong = cases.filter(([s, want]) => blocked(s) !== want).map(([s, want]) => `${want ? 'open' : 'blocked'}: ${s}`);
  assert.deepEqual(wrong, [], 'every annotated case');
  // The meanings the course TEACHES — its dialogue lines and notices, the surfaces that introduce a
  // construction — stay open; the round-9 rule had blocked „Um wie viel Uhr?", an L5 dialogue line.
  // (Task instructions are no such surface: „Bitten Sie … um den Weg" stays a never-form for items.)
  const taught = CURRICULUM_A12.lektionen.flatMap((l) => [...(l.dialog?.lines || []).map((x) => x.de), l.notice?.bodyDe])
    .filter((s) => s && /\b(?:[Uu]ms?|[Gg]egen)\b/.test(s));
  assert.ok(taught.length >= 4, 'the course teaches um/gegen');
  for (const s of taught) assert.equal(blocked(s), false, `a taught surface is blocked: ${s.slice(0, 80)}`);
});

test('DaF review #9 MAJOR 8: a clock time is one value only for a one-off EVENT — the verb alone is not the event', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const spec = { ...B.reportSpecFor(CURRICULUM_A12, CURRICULUM_A12.checkpoints[3]), known: null };
  const values = (statement) => [...new Set([1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
    B.contradictions(statement, spec.nouns, B.mulberry32(seed)).filter((c) => c.kind === 'value').map((c) => c.de)))];
  // ANNOTATED BY HAND, minimal pairs with the same verb: widerspricht (another time refutes it) / offen.
  for (const [statement, label] of [
    ['Der Zug fährt um acht ab.', 'widerspricht'], ['Tim fährt um acht ab.', 'widerspricht'], ['Das Flugzeug fliegt um zehn ab.', 'widerspricht'],
    ['Tim steht um sechs auf.', 'widerspricht'], ['Ana kommt um neun Uhr an.', 'widerspricht'], ['Der Film fängt um acht an.', 'widerspricht'],
    // review #10: a vehicle word is no event — subject, object or prepositional
    ['Der Bus fährt um acht.', 'offen'], ['Um acht fährt der Zug.', 'offen'], ['Tim fährt den Bus um acht.', 'offen'],
    ['Tim fährt um acht mit dem Bus.', 'offen'], ['Tim fährt um acht noch mit dem Fahrrad.', 'offen'],
    ['Das Flugzeug fliegt um zehn.', 'offen'], ['Ana fliegt um zehn nach Marokko.', 'offen'],
    ['Tim steht gern um sechs auf.', 'offen'], ['Tim steht um sechs auf und frühstückt.', 'offen'],
    ['Ana kommt um acht.', 'offen'], ['Ana kommt um acht, dann kocht sie.', 'offen'], ['Die Apotheke öffnet um acht.', 'offen'],
  ]) {
    if (label === 'offen') assert.deepEqual(values(statement), [], `„${statement}" — offen`);
    else assert.ok(values(statement).length > 0, `„${statement}" — widerspricht`);
  }
  // …and on every paper of both levels (all four rounds), each clock-time Falsch comes from a report a
  // person has judged an event — not from this test's own rule. A new source fails until it is annotated.
  const EVENTS = new Set(['Tim steht um sechs auf.', 'Ana kommt um neun Uhr an.', 'Lena steht um sechs Uhr auf.']);
  for (const [curriculum, file] of [[CURRICULUM_A12, 'a12'], [CURRICULUM_A11, 'a11']]) {
    const pool = JSON.parse(read(`src/data/lessonPools/${file}.json`));
    for (const checkpoint of curriculum.checkpoints) {
      for (let round = 0; round < 4; round += 1) {
        const lesen = B.buildCheckpoint({ curriculum, checkpoint, pool, seed: B.paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen');
        for (const it of lesen.filter((x) => falschOf(x) !== null && x.changed?.kind === 'value')) {
          const statement = falschOf(it);
          if (!(/\bUhr\b/.test(statement) || new RegExp(`\\bum ${it.changed.to}\\b`).test(statement))) continue;
          const source = statement.replace(it.changed.to, it.changed.from);
          assert.ok(EVENTS.has(source), `${checkpoint.id}/${round}: „${statement}" is cut from „${source}" — annotate it as an event or it is no Falsch`);
        }
      }
    }
  }
});

test('DaF review #9 (A2.1 planner): a recurring person keeps ONE surname at every level — Lena Brandt', async () => {
  const v = await import('../scripts/validate-curriculum.mjs');
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  assert.equal(v.PERSONAS_A11.Lena.nachname, 'Brandt');
  assert.equal(v.PERSONAS_A12.Lena.nachname, 'Brandt', 'A1.2 spreads A1.1');
  for (const c of [CURRICULUM_A11, CURRICULUM_A12]) assert.deepEqual(v.personaConsistency(c).filter((o) => o.fact === 'nachname'), [], c.level);
  // the rule reaches a planted contradiction
  const planted = { ...CURRICULUM_A12, lektionen: CURRICULUM_A12.lektionen.map((l, i) => (i ? l : { ...l, dialog: { ...l.dialog, lines: [{ speaker: 'Ana', de: 'Das ist Lena Berg aus Köln.', en: '' }, ...l.dialog.lines] } })) };
  assert.ok(v.personaConsistency(planted).some((o) => o.fact === 'nachname' && o.found === 'Berg'));
  // …and a Formular model, field by field: the task names Lena Brandt, so „Familienname:" and the
  // initialled „Unterschrift:" say Brandt; each mutation alone is caught (review #10, new MAJOR).
  const forms = CURRICULUM_A12.lektionen.filter((l) => /Vorname: Lena/.test(l.schreiben?.sample || ''));
  assert.ok(forms.length >= 2, 'the two Lena forms');
  for (const l of forms) assert.match(l.schreiben.sample, /Familienname: Brandt\b.*Unterschrift: L\. Brandt\b/, `L${l.nr}`);
  const withSample = (nr, fix) => ({ ...CURRICULUM_A12, lektionen: CURRICULUM_A12.lektionen.map((l) => (l.nr === nr ? { ...l, schreiben: { ...l.schreiben, sample: fix(l.schreiben.sample) } } : l)) });
  for (const l of forms) {
    const familyOnly = withSample(l.nr, (s) => s.replace('Familienname: Brandt', 'Familienname: Berg'));
    const signatureOnly = withSample(l.nr, (s) => s.replace('Unterschrift: L. Brandt', 'Unterschrift: L. Berg'));
    assert.ok(v.personaConsistency(familyOnly).some((o) => o.fact === 'nachname' && o.found === 'Berg'), `L${l.nr}: the Familienname field alone`);
    assert.ok(v.personaConsistency(signatureOnly).some((o) => o.fact === 'nachname' && o.found === 'L. Berg'), `L${l.nr}: the signature alone`);
  }
  // …and the writing tasks the grader reads, in both twins
  for (const file of ['src/data/writingTasks.js', 'netlify/functions/_shared/writingTasks.mjs']) {
    assert.deepEqual([...read(file).matchAll(/\bLena ([A-ZÄÖÜ][a-zäöüß]+)\b/g)].map((m) => m[1]).filter((s) => s !== 'Brandt'), [], file);
  }
});

test('DaF review #10 B1: a correction keeps every minimal repair its task allows, and question words that ask the same are one answer', () => {
  const verdict = (it, text) => checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result;
  const pool = poolItems(POOL_A12);
  const gerner = pool.find((i) => i.id === 'extra-a12-l03-14');
  assert.match(gerner.questionDe, /^Korrigieren Sie nur den Fehler: „Ich gehe gerner in das Museum.“/);
  for (const fix of ['Ich gehe lieber in das Museum.', 'Ich gehe gern in das Museum.', 'Ich gehe gerne in das Museum.']) {
    assert.equal(verdict(gerner, fix), RESULT.CORRECT, `„${fix}" removes the error and nothing else`);
  }
  assert.notEqual(verdict(gerner, 'Ich gehe mehr in das Museum.'), RESULT.CORRECT);
  // Warum, Wieso and Weshalb ask for a reason: the checker takes each for each (src/lib/lesson/check.js
  // SAME_ANSWER), so an untaught synonym never stamps an item unservable.
  for (const id of ['extra-a12-l05-04', 'cb094e7e-51c8-49e1-ac2e-60d1413cc7c5']) {
    const it = pool.find((i) => i.id === id);
    assert.ok(it.minLektion != null, `${id} stays servable`);
    // a typed gap takes every synonym; a choice item takes the printed key and no other printed option
    const typed = !(it.options || []).length;
    for (const w of typed ? ['Warum', 'Wieso', 'Weshalb', 'wieso'] : ['Warum']) assert.equal(verdict(it, w), RESULT.CORRECT, `${id}: ${w}`);
    for (const w of typed ? ['Wo', 'Wann', 'Was'] : (it.options || []).filter((o) => o !== it.answer)) assert.notEqual(verdict(it, w), RESULT.CORRECT, `${id}: ${w}`);
  }
  assert.doesNotMatch(pool.find((i) => i.id === 'cb094e7e-51c8-49e1-ac2e-60d1413cc7c5').questionDe, /Why|\(=/);
});

test('DaF review #10 B1: an independent annotation of every servable correction and question-word gap — each correct alternative is accepted, each excluded one refused', () => {
  // tests/fixtures/a12-b1-alternatives.json: Codex's annotation of all 48 servable A1.2 corrections and
  // question-word gaps (every other answer it judged correct German), each judged by the reading the
  // fixture states — a correction repairs what is wrong and keeps meaning, tense and mood.
  const fx = JSON.parse(read('tests/fixtures/a12-b1-alternatives.json'));
  const pool = new Map(poolItems(POOL_A12).map((i) => [i.id, i]));
  const verdict = (it, text) => checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result;
  assert.ok(fx.alternatives.length >= 200 && fx.alternatives.some((a) => a.verdict === 'accept'), 'the annotation is the whole class');
  const wrong = [];
  for (const a of fx.alternatives) {
    const it = pool.get(a.id);
    assert.ok(it?.minLektion != null, `${a.id} is no longer servable`);
    const r = verdict(it, a.answer);
    if (a.verdict === 'accept' && r !== RESULT.CORRECT) wrong.push(`${a.id}: „${a.answer}" is correct (${a.why}) but ${r}`);
    if (a.verdict === 'exclude' && r === RESULT.CORRECT) wrong.push(`${a.id}: „${a.answer}" is excluded (${a.why}) but accepted`);
  }
  assert.deepEqual(wrong, []);
});

test('DaF review #11 M8 (round 12): A1.2 reads authored units — four disjoint papers per checkpoint, served by round, checked by the authoring check', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { LESEN_A12 } = await import('../src/data/curricula/a12.lesen.js');
  const { spawnSync } = await import('node:child_process');
  // Review #11 measured a sentence-overlap strategy solving 64/64 generated two-option items; Codex's design
  // verdicts (docs/course-factory/a12-rebuild/DESIGN-m8-lesen-2026-10-19.md) replaced them with new texts
  // written for each checkpoint. The authoring check is the bank's own gate — taught words and constructions
  // in the meaning the course used, no practised sentence, the mirrored pairs, the surface gate per paper —
  // and it runs on the committed bank, not on a copy.
  // Inherit output so the authoring check also runs where Windows blocks child-process pipes (EPERM).
  const run = spawnSync(process.execPath, ['scripts/a12-lesen-check.mjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8', stdio: 'inherit' });
  assert.equal(run.status, 0, `scripts/a12-lesen-check.mjs:\n${String(run.stdout).slice(-2500)}`);
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    const bank = LESEN_A12[checkpoint.id];
    assert.equal(checkpoint.lesen, bank, `${checkpoint.id} carries its bank`);
    const units = bank.papers.flat();
    assert.equal(new Set(units.map((u) => u.id)).size, 16, `${checkpoint.id}: sixteen distinct units`);
    assert.equal(new Set(units.map((u) => u.text)).size, 16, `${checkpoint.id}: sixteen distinct texts`);
    // Paper r serves round r as it was approved — the first four attempts read texts they have not seen,
    // a fifth reads paper 1 again.
    for (let round = 0; round < 5; round += 1) {
      const lesen = B.buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: B.paperSeed(checkpoint, round) })
        .filter((it) => it.section === 'lesen');
      assert.deepEqual(lesen.map((it) => it.unitId), bank.papers[round % 4].map((u) => u.id), `${checkpoint.id}/${round}: paper ${(round % 4) + 1} as approved`);
      for (const it of lesen) {
        assert.equal(it.source, 'authored');
        assert.equal(it.kind, 'choice');
        assert.ok(it.options.length === 2 && it.options.includes(it.answer), `${it.unitId}: the key is one of two options`);
      }
    }
  }
  // No silent fallback: a bank that cannot serve a whole paper is an error, never the old generator.
  const broken = structuredClone(CURRICULUM_A12);
  broken.checkpoints[0].lesen = { papers: [LESEN_A12['a1.2-cp1'].papers[0].slice(0, 3)] };
  assert.throws(() => B.buildCheckpoint({ curriculum: broken, checkpoint: broken.checkpoints[0], pool: POOL_A12 }), /authored Lesen bank/);
});

test('DaF review #11 M8 (round 12): no declared surface strategy beats half of any A1.2 paper — the frozen gate, on the papers as delivered', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { auditPapers } = await import('./helpers/lesenGate.mjs');
  // The gate Codex froze before a unit was written (DESIGN-m8-lesen-2026-10-19.md, verdicts 1 and 2), read
  // off what the learner SEES — the delivered items in their delivered order, not the bank — so a builder
  // that reordered the options would fail here. Per paper no strategy and no one-condition switch above 2 of
  // 4 (a tie ½, ties also broken to A and to B); over the 16 papers no strategy above 32 of 64.
  const papers = CURRICULUM_A12.checkpoints.flatMap((checkpoint) => [0, 1, 2, 3].map((round) =>
    B.buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: B.paperSeed(checkpoint, round) })
      .filter((it) => it.section === 'lesen')
      .map((it) => ({ at: `${checkpoint.id}/${round}`, text: it.text, question: it.promptDe, options: it.options, answer: it.answer }))));
  assert.equal(papers.length, 16);
  assert.ok(papers.every((p) => p.length === 4));
  const { papers: report, worstTotal } = auditPapers(papers);
  report.forEach((r, i) => {
    assert.ok(r.worst.score <= 2, `${papers[i][0].at}: „${r.worst.name}" scores ${r.worst.score} of 4`);
    assert.ok(r.worstSwitch.score <= 2, `${papers[i][0].at}: the switch ${r.worstSwitch.name} scores ${r.worstSwitch.score} of 4`);
  });
  assert.ok(worstTotal.score <= 32, `over the sixteen papers „${worstTotal.name}" scores ${worstTotal.score} of 64`);
});

test('DaF review #11 M8 (round 12): the gate sees every planted leak family, and passes a balanced control', async () => {
  const { auditPapers } = await import('./helpers/lesenGate.mjs');
  const u = (text, question, options, answer) => ({ text, question, options, answer });
  // A detector that rejects everything is no safeguard (verdict 1): first a paper of two mirrored pairs that
  // must pass, then one paper per leak family Codex listed, each of which must fail.
  const CONTROL = [
    u('Ana: Ich kaufe heute das Brot. Gehst du in den Park?\nTim: Ja, ich gehe in den Park.', 'Wer kauft heute das Brot?', ['Ana', 'Tim'], 'Ana'),
    u('Ana: Kaufst du heute den Kuchen?\nTim: Ja, das mache ich.', 'Wer kauft heute den Kuchen?', ['Ana', 'Tim'], 'Tim'),
    u('Lena: Ich koche heute die Suppe. Gehst du in den Park?\nPaul: Ja, ich gehe in den Park.', 'Wer kocht heute die Suppe?', ['Lena', 'Paul'], 'Lena'),
    u('Lena: Kochst du heute den Tee?\nPaul: Ja, das mache ich.', 'Wer kocht heute den Tee?', ['Lena', 'Paul'], 'Paul'),
  ];
  const control = auditPapers([CONTROL]).papers[0];
  assert.equal(control.passes, true, `the balanced control fails: ${control.worst.name} ${control.worst.score}`);
  const LEAKS = {
    'all keys at A': CONTROL.map((x) => ({ ...x, options: [x.answer, x.options.find((o) => o !== x.answer)] })),
    'always Ana': [
      u('Ana: Ich kaufe das Brot.\nTim: Gut.', 'Wer kauft das Brot?', ['Ana', 'Tim'], 'Ana'),
      u('Tim: Wer kocht heute?\nAna: Ich koche.', 'Wer kocht heute?', ['Tim', 'Ana'], 'Ana'),
      u('Lena: Ich wohne in Köln.\nAna: Ich wohne in Bremen.', 'Wer wohnt in Bremen?', ['Lena', 'Ana'], 'Ana'),
      u('Ana: Ich habe zwei Koffer.\nPaul: Ich habe einen.', 'Wer hat zwei Koffer?', ['Ana', 'Paul'], 'Ana'),
    ],
    'first speaker': [
      u('Ana: Ich kaufe das Brot.\nTim: Ich kaufe den Kuchen.', 'Wer kauft das Brot?', ['Tim', 'Ana'], 'Ana'),
      u('Tim: Ich koche heute.\nAna: Ich koche morgen.', 'Wer kocht heute?', ['Ana', 'Tim'], 'Tim'),
      u('Lena: Ich wohne in Bremen.\nPaul: Ich wohne in Köln.', 'Wer wohnt in Bremen?', ['Paul', 'Lena'], 'Lena'),
      u('Paul: Ich habe zwei Koffer.\nLena: Ich habe drei Koffer.', 'Wer hat zwei Koffer?', ['Lena', 'Paul'], 'Paul'),
    ],
    'name in the body': [
      u('Hallo Ana,\nTim kauft das Brot. Ich koche.\nLena', 'Wer kauft das Brot?', ['Tim', 'Ana'], 'Tim'),
      u('Hallo Tim,\nAna kocht heute. Ich kaufe ein.\nPaul', 'Wer kocht heute?', ['Tim', 'Ana'], 'Ana'),
      u('Hallo Lena,\nPaul wohnt in Bremen. Ich wohne in Köln.\nAna', 'Wer wohnt in Bremen?', ['Lena', 'Paul'], 'Paul'),
      u('Hallo Paul,\nLena hat zwei Koffer. Ich habe einen.\nTim', 'Wer hat zwei Koffer?', ['Lena', 'Paul'], 'Lena'),
    ],
    'literal key overlap': [
      u('Ana kauft heute das Brot. Tim geht in den Park.', 'Wer kauft heute das Brot?', ['Tim', 'Ana'], 'Ana'),
      u('Tim kocht heute die Suppe. Ana liest.', 'Wer kocht heute die Suppe?', ['Tim', 'Ana'], 'Tim'),
      u('Lena wohnt in Bremen am Markt. Paul wohnt in Köln.', 'Wer wohnt in Bremen am Markt?', ['Paul', 'Lena'], 'Lena'),
      u('Paul hat zwei Koffer und eine Tasche. Lena hat einen Koffer.', 'Wer hat zwei Koffer und eine Tasche?', ['Paul', 'Lena'], 'Paul'),
    ],
    'inverse paraphrase': [
      u('Tim: Kaufst du heute das Brot?\nAna: Ja, das mache ich.', 'Wer kauft heute das Brot?', ['Tim', 'Ana'], 'Ana'),
      u('Ana: Kochst du heute?\nTim: Ja, das mache ich.', 'Wer kocht heute?', ['Tim', 'Ana'], 'Tim'),
      u('Paul: Wohnst du in Bremen?\nLena: Ja, seit Mai.', 'Wer wohnt in Bremen?', ['Paul', 'Lena'], 'Lena'),
      u('Lena: Hast du zwei Koffer?\nPaul: Ja, zwei.', 'Wer hat zwei Koffer?', ['Lena', 'Paul'], 'Paul'),
    ],
    'question to speaker': [
      u('Ana: Ich kaufe das Brot.\nTim: Und ich den Kuchen.', 'Wer kauft das Brot?', ['Tim', 'Ana'], 'Ana'),
      u('Tim: Ich koche die Suppe.\nAna: Und ich den Tee.', 'Wer kocht die Suppe?', ['Ana', 'Tim'], 'Tim'),
      u('Lena: Ich wohne in Bremen.\nPaul: Und ich in Köln.', 'Wer wohnt in Bremen?', ['Lena', 'Paul'], 'Lena'),
      u('Paul: Ich habe zwei Koffer.\nLena: Und ich drei.', 'Wer hat zwei Koffer?', ['Paul', 'Lena'], 'Paul'),
    ],
    // half of the paper for the plain rule, all of it for a switch on a printed mark
    'conditional leak': [
      u('Ana: Ich kaufe das Brot nicht.\nTim: Ich kaufe es.', 'Wer kauft das Brot?', ['Ana', 'Tim'], 'Tim'),
      u('Tim: Ich koche nicht.\nAna: Ich koche.', 'Wer kocht?', ['Tim', 'Ana'], 'Ana'),
      u('Lena: Ich wohne in Bremen.\nPaul: Ich wohne in Köln.', 'Wer wohnt in Bremen?', ['Paul', 'Lena'], 'Lena'),
      u('Paul: Ich habe zwei Koffer.\nLena: Ich habe drei.', 'Wer hat zwei Koffer?', ['Lena', 'Paul'], 'Paul'),
    ],
  };
  for (const [leak, paper] of Object.entries(LEAKS)) {
    const r = auditPapers([paper]).papers[0];
    assert.equal(r.passes, false, `the gate misses a planted „${leak}" leak (worst ${r.worst.name} ${r.worst.score})`);
  }
});

test('DaF review #11 M8 (round 12): every authored unit passed the independent semantic review, solved blind before the key', async () => {
  const { LESEN_A12 } = await import('../src/data/curricula/a12.lesen.js');
  // Verdict 2: the reviewer solves each unit BEFORE seeing the key, then records the evidence and whether the
  // unit has one supported answer, natural German, taught meanings and a plausible competitor. The fixture
  // keeps what was reviewed, so a unit changed afterwards fails here until it is reviewed again.
  const review = JSON.parse(read('tests/fixtures/a12-lesen-review.json'));
  const byId = new Map(review.units.map((r) => [r.id, r]));
  const problems = [];
  for (const unit of Object.values(LESEN_A12).flatMap((b) => b.papers.flat())) {
    const r = byId.get(unit.id);
    if (!r) { problems.push(`${unit.id}: not reviewed`); continue; }
    if (r.verdict !== 'ok') problems.push(`${unit.id}: ${r.verdict} — ${r.note}`);
    if (r.solved !== unit.answer) problems.push(`${unit.id}: solved blind as „${r.solved}", keyed „${unit.answer}"`);
    if (r.text !== unit.text || r.question !== unit.question) problems.push(`${unit.id}: changed since its review`);
  }
  assert.deepEqual(problems, []);
  assert.equal(byId.size, 64, 'the review covers the whole bank');
});

test('round 11b: a constant place is a constant answer — „always the first option" never passes a section', async () => {
  const { guessCeiling, sectionPasses, buildCheckpoint, scoreCheckpoint, paperSeed } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  // The text constant („Richtig" throughout) and the place constant (the first chip throughout) are both
  // strategies a learner has, because CheckpointPage prints the options in their stored order.
  const two = (answer, other, answerFirst) => ({ section: 'lesen', answer, options: answerFirst ? [answer, other] : [other, answer] });
  assert.equal(guessCeiling([two('Ana hat drei Äpfel.', 'x', true), two('Tim hat acht Euro.', 'y', true), two('a', 'b', false), two('c', 'd', false)]), 2,
    'four different answers, two of them first: the first chip scores 2');
  assert.equal(guessCeiling([two('Richtig', 'Falsch', true), two('Richtig', 'Falsch', true), two('Falsch', 'Richtig', false)]), 2, 'Richtig/Falsch as before');
  // Every A1.2 paper (rounds 0–3): a learner who taps the first option of every closed item passes no
  // section, the two-option Lesen included.
  for (const checkpoint of CURRICULUM_A12.checkpoints) {
    for (let round = 0; round < 4; round += 1) {
      const items = buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: paperSeed(checkpoint, round) });
      const first = Object.fromEntries(items.map((it) => [it.id, Array.isArray(it.options) && it.options.length ? it.options[0] : it.answer]));
      const result = scoreCheckpoint(items, first);
      for (const section of ['hoeren', 'lesen', 'bausteine']) {
        const s = result.sections[section];
        if (!s) continue;
        const closed = items.filter((it) => it.section === section);
        if (!closed.every((it) => Array.isArray(it.options) && it.options.length)) continue;
        assert.equal(sectionPasses(s), false, `${checkpoint.id}/${round} ${section}: the first chip throughout passes (${s.correct}/${s.total}, ceiling ${s.guessCeiling})`);
      }
    }
  }
});

test('DaF review #11 B1: a correction that names its element accepts only the repair of that element — contrast matrix, then every servable item', async () => {
  const { namedRepairAccepts } = await import('../src/data/lessonPools/quality.js');
  const ec = (questionDe) => ({ type: 'error_correction', questionDe });
  // ANNOTATED BY HAND: one faulty sentence under an open task and under a named one. „Das sind meine
  // Onkel." is correct German and was accepted (review #11) — but it repairs the verb and the number,
  // and the task names the possessive article.
  const open = ec('Korrigieren Sie nur den Fehler: „Das ist meine Onkel.“');
  const named = ec('Korrigieren Sie den Possessivartikel: „Das ist meine Onkel.“ (Beginnen Sie mit „Das“)');
  for (const answer of ['Das ist mein Onkel.', 'Das sind meine Onkel.']) {
    assert.equal(namedRepairAccepts(open, answer), true, `an open task decides „${answer}" elsewhere`);
  }
  assert.equal(namedRepairAccepts(named, 'Das ist mein Onkel.'), true, 'the repair the task names');
  assert.equal(namedRepairAccepts(named, 'Das ist mein Onkel'), true, 'without the full stop');
  assert.equal(namedRepairAccepts(named, 'Das sind meine Onkel.'), false, 'the verb repaired instead (review #11)');
  const article = ec('Korrigieren Sie den Artikel: „Ich brauche ein Markt im Zentrum.“ (Beginnen Sie mit „Ich“)');
  assert.equal(namedRepairAccepts(article, 'Ich brauche einen Markt im Zentrum.'), true);
  assert.equal(namedRepairAccepts(article, 'Ich brauche im Zentrum einen Markt.'), true, 'a middle field the task allows is the same repair');
  assert.equal(namedRepairAccepts(article, 'Ich brauche einen Supermarkt im Zentrum.'), false, 'the noun changed as well');
  assert.equal(namedRepairAccepts(article, 'Ich brauche meinen Markt im Zentrum.'), false, 'an article task takes an article');
  // „ohne Artikel" asks for a deletion, not for the repair of an article: not this rule's case.
  assert.equal(namedRepairAccepts(ec('Schreiben Sie den Satz ohne Artikel: „Ich bin eine Lehrerin.“'), 'Ich bin Lehrerin.'), true);
  // EVERY ITEM of both pools: what a named task takes repairs what it names, the model answer included.
  for (const [file, pool] of [['a12', POOL_A12], ['a11', JSON.parse(read('src/data/lessonPools/a11.json'))]]) {
    const offenders = poolItems(pool).filter((it) => it.type === 'error_correction')
      .flatMap((it) => [it.answer, ...(it.accepted || [])].filter((a) => !namedRepairAccepts(it, a)).map((a) => `${it.id}: „${a}"`));
    assert.deepEqual(offenders, [], `${file}: a named repair accepts another repair`);
  }
});

test('DaF review #11 B1: every servable preposition gap is read in German alone — annotated by hand, both ways', () => {
  // „Das Flugzeug fliegt ___ Montag wieder. (ab, um oder bis?)" took ab and refused bis, though „bis
  // Montag fliegt es wieder" (by Monday) is a reading of the German; only the English said „from
  // Monday". A gap may rest on its German cue or its context, never on the English. ANNOTATED BY HAND,
  // not by the build: every servable A1.2 gap whose answer is one preposition, the answers its German
  // allows, and the competing preposition its German rules out — with the reason.
  const ANNOTATION = {
    'extra-a12-l11-01': [['im'], ['am'], 'the cue gives in + dem'],
    'extra-a12-l11-02': [['am'], ['im'], 'the cue gives an + dem'],
    'extra-a12-l11-03': [['zum'], ['zur'], 'the cue gives zu + dem'],
    '96034fda-42dc-5e3d-8c8d-3c7c82591baf': [['zum'], ['zur'], 'the cue gives zu + dem'],
    'extra-a12-l11-04': [['zur'], ['zum'], 'the cue gives zu + der'],
    '49d0d7b5-dbe0-560a-bce0-266b040e5851': [['zur'], ['zum'], 'the cue gives zu + der'],
    'extra-a12-l11-10': [['vor'], ['seit'], 'the German selector „Zeit: eine Woche früher, keine Dauer" requests a past point, expressly excluding duration'],
    'extra-a12-l11-11': [['seit'], ['vor'], 'the German selector „Dauer bis heute" requests duration up to today'],
    'extra-a12-l11-12': [['vor'], ['seit'], 'the German selector „Zeit: eine Woche früher, keine Dauer" requests a past point, expressly excluding duration'],
    '8058bf54-3a86-5ed4-8a24-55630a3efbce': [['aus'], ['von', 'nach'], 'the cue „Heimat, Land": origin'],
    'fe97d1bc-1569-5fa8-a988-5ab810e33a1c': [['von'], ['aus', 'nach'], 'the cue „Startort, kein Land"'],
    'f7aa6e9b-0c37-5874-b2b0-2e311896881a': [['bei'], ['mit', 'zu'], 'the cue gives bei + Dativ'],
    'eec3bcc5-32be-5e44-915e-c9c810980456': [['nach'], ['in', 'zu'], 'the cue „Richtung, Land"'],
    'extra-a12-l09-10': [['bis'], ['ab', 'um'], '„von sieben ___ zehn" and the cue „Ende"'],
    'extra-a12-l09-11': [['ab'], ['bis', 'um'], '„Montag ist der erste Tag": the beginning, so ab; bis would make Monday the last day'],
    'extra-a12-l09-13': [['ab'], ['bis'], 'the German cue „erste Uhrzeit zum Einsteigen“ explicitly asks for the start of boarding'],
    'extra-a12-l10-01': [['für'], ['ohne', 'durch'], 'Ana and her grandmother are in the shop together, and it is her birthday'],
    'extra-a12-l10-02': [['ohne'], ['für', 'durch'], 'only „ohne" makes sense of a cheap coat and a scarf'],
    'extra-a12-l10-03': [['durch'], ['für', 'ohne'], 'the prompt offers für, ohne, durch: only „durch das Kaufhaus" is a way'],
    'extra-a12-l10-04': [['für'], ['ohne', 'durch'], 'a pullover for a person'],
  };
  const PREP = new Set(['ab', 'am', 'an', 'auf', 'aus', 'bei', 'bis', 'durch', 'für', 'gegen', 'hinter', 'im', 'in', 'ins', 'mit', 'nach',
    'neben', 'ohne', 'seit', 'um', 'unter', 'über', 'von', 'vom', 'vor', 'zu', 'zum', 'zur', 'zwischen']);
  const servable = poolItems(POOL_A12).filter((it) => it.type === 'fill_blank' && it.minLektion != null && PREP.has(String(it.answer).toLowerCase().trim()));
  assert.deepEqual(servable.map((it) => it.id).sort(), Object.keys(ANNOTATION).sort(), 'every servable preposition gap is annotated — a new one fails until it is');
  const verdict = (it, text) => checkAnswer(text, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result;
  for (const it of servable) {
    const [allowed, excluded, why] = ANNOTATION[it.id];
    for (const a of allowed) assert.equal(verdict(it, a), RESULT.CORRECT, `${it.id}: „${a}" is what the German allows (${why})`);
    for (const a of excluded) assert.notEqual(verdict(it, a), RESULT.CORRECT, `${it.id}: „${a}" is ruled out (${why})`);
  }
  // The old Flugzeug prompt, without its reference point, would allow both: the cue is load-bearing.
  assert.match(poolItems(POOL_A12).find((it) => it.id === 'extra-a12-l09-11').questionDe, /Montag ist der erste Tag/);
});

// Explicit German meaning selectors only. Tense, contrast, adverbs and a present/past reference
// point NEVER choose the requested meaning. The lexical validator separately checks selectors at
// the item's teaching horizon. Spatial von/nach/etc. are outside the temporal contrast.
function undecidedTimePrepositionGaps(items) {
  const cues = {
    ab: /\b(?:Beginn|Anfang|der erste Tag|erste Uhrzeit)\b/iu,
    von: /\b(?:Beginn|Anfang|erste Uhrzeit)\b/iu,
    bis: /\b(?:Ende|Schluss|der letzte Tag|letzte Uhrzeit)\b/iu,
    seit: /\bDauer bis (?:heute|jetzt|damals)\b/iu,
    vor: /\bZeitpunkt\b(?!\s+in der Zukunft)|\bZeit: [^;()!?]*früher, keine Dauer\b/iu,
    um: /\b(?:genaue Uhrzeit|genauer Zeitpunkt)\b/iu,
    gegen: /\b(?:ungefähre Uhrzeit|ungefährer Zeitpunkt)\b/iu,
    nach: /\b(?:nach diesem Zeitpunkt|späterer Zeitpunkt)\b/iu,
    in: /\b(?:Zeitpunkt in der Zukunft|Zeit ab heute)\b/iu,
  };
  return items.filter((it) => it.minLektion != null && (it.type === 'fill_blank' || /_{2,}/u.test(it.questionDe || ''))).flatMap((it) => {
    const accepted = new Set((it.accepted?.length ? it.accepted : [it.answer]).map((a) => String(a).trim().toLowerCase()));
    const q = it.questionDe || '';
    const temporal = /\b(?:Uhr|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Tag|Tagen|Woche|Wochen|Monat|Monaten|Jahr|Jahren|heute|morgen|gestern)\b/iu.test(q);
    const pairs = [['ab', 'bis'], ['seit', 'vor'], ['um', 'gegen'], ['von', 'bis'], ['vor', 'nach'], ['vor', 'in']];
    const offeredPairs = pairs.filter((pair) => pair.every((p) => new RegExp(`\\b${p}\\b`, 'iu').test(q)));
    const defaults = { ab: ['ab', 'bis'], bis: ['ab', 'bis'], vor: ['seit', 'vor'], seit: ['seit', 'vor'],
      um: ['um', 'gegen'], gegen: ['um', 'gegen'], von: ['von', 'bis'], nach: ['vor', 'nach'], in: ['vor', 'in'] };
    const relevant = offeredPairs.length ? offeredPairs : [...new Set([...accepted].map((p) => defaults[p]).filter(Boolean))];
    return relevant.flatMap((pair) => {
      // ab/bis and vor/seit are the course's standard temporal contrasts; other families require
      // time language or both alternatives explicitly printed, so spatial „von der Arbeit" is safe.
      const offered = pair.every((p) => new RegExp(`\\b${p}\\b`, 'iu').test(q));
      if (!temporal && !offered && !['ab', 'seit'].includes(pair[0])) return [];
      const only = pair.filter((p) => accepted.has(p));
      if (only.length !== 1) return [];
      const chosen = only[0];
      const other = pair.find((p) => p !== chosen);
      return cues[chosen].test(q) && !cues[other].test(q)
        ? [] : [`${it.id}: only „${chosen}“ accepted without a deciding German cue`];
    });
  });
}

test('DaF review #13 B1: every single-key time-preposition gap has an explicit German meaning selector, with open/cued contrasts', async () => {
  const gap = (questionDe, accepted) => ({ id: 'contrast', type: 'fill_blank', minLektion: 9, questionDe, accepted });
  const open = 'Sie können ___ acht Uhr einsteigen. (ab oder bis?)';
  assert.deepEqual(undecidedTimePrepositionGaps([gap(open, ['ab', 'bis'])]), []);
  for (const [cue, chosen, other] of [['Beginn', 'ab', 'bis'], ['Anfang', 'ab', 'bis'], ['erste Uhrzeit zum Einsteigen', 'ab', 'bis'], ['Ende', 'bis', 'ab'], ['Schluss', 'bis', 'ab'],
    ['Zeitpunkt', 'vor', 'seit'], ['Zeit: eine Woche früher, keine Dauer', 'vor', 'seit'], ['Dauer bis jetzt', 'seit', 'vor'],
    ['Dauer bis heute', 'seit', 'vor'], ['Dauer bis damals', 'seit', 'vor']]) {
    const question = ['ab', 'bis'].includes(chosen) ? open : 'Der Regen war ___ einer Woche da. (vor oder seit?)';
    assert.equal(undecidedTimePrepositionGaps([gap(question, [chosen])]).length, 1, `${chosen}: open context`);
    assert.deepEqual(undecidedTimePrepositionGaps([gap(`${question} (${cue})`, [chosen])]), [], cue);
    assert.equal(undecidedTimePrepositionGaps([gap(`${question} (${cue})`, [other])]).length, 1, `${cue}: wrong key`);
  }
  for (const question of [
    'Heute ist es kalt. ___ einer Woche war es warm. (vor oder seit?)',
    'Heute ist er gesund. ___ einer Woche war er krank. (vor oder seit?)',
    'Der Regen ist ___ einer Woche da. (vor oder seit?)',
    'Das Gewitter war ___ einer Woche. (vor oder seit?)',
  ]) {
    for (const key of ['vor', 'seit']) assert.equal(undecidedTimePrepositionGaps([gap(question, [key])]).length, 1, question);
    assert.deepEqual(undecidedTimePrepositionGaps([gap(question, ['vor', 'seit'])]), []);
  }
  const choice = { ...gap('Heute ist er gesund. ___ einer Woche war er krank. (vor oder seit?)', ['vor']),
    type: 'multiple_choice', options: ['vor', 'seit'] };
  assert.equal(undecidedTimePrepositionGaps([choice]).length, 1, 'the gap rule also reaches choice items');
  for (const [question, cue, key, rival] of [
    ['Der Zug fährt ___ acht Uhr. (um oder gegen?)', 'genaue Uhrzeit', 'um', 'gegen'],
    ['Der Zug fährt ___ acht Uhr. (um oder gegen?)', 'ungefähre Uhrzeit', 'gegen', 'um'],
    ['Das Büro ist ___ acht Uhr offen. (von oder bis?)', 'erste Uhrzeit', 'von', 'bis'],
    ['Das Büro ist ___ acht Uhr offen. (von oder bis?)', 'Ende', 'bis', 'von'],
    ['Der Kurs ist ___ einer Woche. (vor oder in?)', 'Zeitpunkt in der Zukunft', 'in', 'vor'],
  ]) {
    assert.ok(undecidedTimePrepositionGaps([gap(question, [key])]).length > 0);
    assert.deepEqual(undecidedTimePrepositionGaps([gap(`${question} (${cue})`, [key])]), []);
    assert.ok(undecidedTimePrepositionGaps([gap(`${question} (${cue})`, [rival])]).length > 0);
    assert.deepEqual(undecidedTimePrepositionGaps([gap(question, [key, rival])]), []);
  }
  const all = poolItems(POOL_A12);
  assert.deepEqual(undecidedTimePrepositionGaps(all), [], 'every servable item, including future additions');
  const { levelSpec, taughtUpTo, untaughtTokens } = await import('../scripts/validate-curriculum.mjs');
  const spec = levelSpec('a1.2');
  const known = taughtUpTo(CURRICULUM_A12, spec);
  for (const it of all.filter((it) => it.type === 'fill_blank' && it.minLektion != null)) {
    assert.deepEqual(untaughtTokens(it, known.get(it.minLektion), spec), [], `${it.id}: the selector must already be taught`);
  }
  // Planted mutation on a real passing item; English and explanations still contain the start cue.
  const original = all.find((it) => it.type === 'fill_blank' && it.minLektion != null && /\(erste Uhrzeit zum Einsteigen; ab oder bis\?\)/u.test(it.questionDe));
  assert.ok(original, 'a servable beginning-cued gap exists');
  const stripped = { ...original, questionDe: original.questionDe.replace('erste Uhrzeit zum Einsteigen; ', '') };
  assert.equal(undecidedTimePrepositionGaps(all.map((it) => it === original ? stripped : it)).length, 1);
  // Strip every selector family from every passing temporal gap; tense and contrasts are left intact.
  const selector = /Zeit: [^;()!?]*früher, keine Dauer|Dauer bis (?:heute|jetzt)|Montag ist der erste Tag\.|erste Uhrzeit zum Einsteigen|\(Ende\)/gu;
  const cued = all.filter((it) => it.minLektion != null && it.type === 'fill_blank' && ['ab', 'bis', 'vor', 'seit'].includes(it.answer.toLowerCase()));
  assert.ok(cued.length >= 6, 'the complete current temporal contrast class is exercised');
  for (const it of cued) {
    const questionDe = it.questionDe.replace(selector, '');
    assert.notEqual(questionDe, it.questionDe, `${it.id}: an explicit selector must be removable`);
    assert.ok(undecidedTimePrepositionGaps([{ ...it, questionDe }]).length > 0, `${it.id}: context cannot replace its selector`);
  }
});

test('DaF review #12 M8: delivered positions and question-type ranks balance; every order strategy scores at most half', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { auditBankOrder } = await import('./helpers/lesenGate.mjs');
  const papers = CURRICULUM_A12.checkpoints.flatMap((checkpoint) => [0, 1, 2, 3].map((round) =>
    B.buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: B.paperSeed(checkpoint, round) })
      .filter((it) => it.section === 'lesen').map((it) => ({ question: it.promptDe, options: it.options, answer: it.answer }))));
  const bank = auditBankOrder(papers);
  assert.equal(bank.total, 64);
  assert.deepEqual(bank.findings, []);
  assert.equal(bank.passes, true);
  assert.deepEqual(bank.positions, Array.from({ length: 4 }, () => [8, 8]));
  assert.deepEqual(Object.values(bank.typeRanks), Array.from({ length: 4 }, () => [8, 8]));
  for (const family of [bank.fixed, bank.typeRank]) {
    assert.equal(family.size, 16, 'all binary rules, including each counter-strategy');
    for (const [name, score] of family) assert.equal(score, 32, `${name}: exactly half`);
  }
});

test('DaF review #12 M8: key-A-first mirrored pairs fail the bank gate; an independent counterbalanced control passes', async () => {
  const { LESEN_A12 } = await import('../src/data/curricula/a12.lesen.js');
  const { auditPapers, auditBankOrder } = await import('./helpers/lesenGate.mjs');
  const aligned = structuredClone(Object.values(LESEN_A12).flatMap((b) => b.papers));
  for (const paper of aligned) for (const pair of [1, 2]) {
    const two = paper.filter((u) => u.pair === pair);
    if (two[0].options.indexOf(two[0].answer) === 1) for (const u of two) u.options.reverse();
    assert.deepEqual(two.map((u) => u.options.indexOf(u.answer)), [0, 1]);
  }
  const failed = auditPapers(aligned);
  assert.ok(failed.papers.every((p) => p.passes), 'the old per-paper family cannot see this leak');
  assert.equal(failed.bankOrder.passes, false);
  assert.equal(failed.bankOrder.typeRank.get('ABAB'), 64, 'first A / second B for each type');
  assert.ok(failed.bankOrder.worstFixed.score > 32);
  // No bank texts or IDs: the second paper reverses BOTH option arrays of each independent pair.
  const control = [
    { question: 'Wer holt den Brief?', options: ['Ada', 'Ben'], answer: 'Ada' },
    { question: 'Wann öffnet das Büro?', options: ['acht', 'neun'], answer: 'acht' },
    { question: 'Wer kauft die Zeitung?', options: ['Ada', 'Ben'], answer: 'Ben' },
    { question: 'Wann fährt der Zug?', options: ['acht', 'neun'], answer: 'neun' },
  ];
  const balanced = auditBankOrder([control, control.map((u) => ({ ...u, options: [...u.options].reverse() }))]);
  assert.equal(balanced.passes, true, balanced.findings.join('\n'));
  assert.deepEqual(balanced.positions, Array.from({ length: 4 }, () => [1, 1]));
  assert.deepEqual(Object.values(balanced.typeRanks), Array.from({ length: 4 }, () => [1, 1]));
  assert.ok([...balanced.fixed.values(), ...balanced.typeRank.values()].every((score) => score === 4));
});

test('DaF review #13 M8: every delivered surface feature × order rule and its inverse score at most 36/64', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { auditBankFeatures } = await import('./helpers/lesenGate.mjs');
  const papers = CURRICULUM_A12.checkpoints.flatMap((checkpoint) => [0, 1, 2, 3].map((round) =>
    B.buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: B.paperSeed(checkpoint, round) })
      .filter((it) => it.section === 'lesen')
      .map((it) => ({ text: it.text, question: it.promptDe, options: it.options, answer: it.answer }))));
  const bank = auditBankFeatures(papers);
  assert.equal(bank.total, 64);
  assert.equal(bank.limit, 36);
  assert.equal(bank.passes, true, bank.findings.slice(0, 10).join('\n'));
  for (const [name, score] of bank.rules) assert.ok(score <= 36, `${name}: ${score}/64`);
  for (const feature of ['Alphabet (de)', 'Länge Zeichen+', 'Länge Wörter+', 'Zahlwert+', 'zuerst im Text+',
    'zuletzt im Text+', 'identical option set within pair', 'pair role']) {
    for (const context of ['position', 'type-rank', 'pair member', 'option-set occurrence']) {
      const family = [...bank.rules].filter(([name]) => name.startsWith(`${feature} × ${context} [`));
      assert.ok(family.length >= 4, `${feature} × ${context}: both preferences in every cell`);
      assert.ok(family.some(([name]) => name.includes('inverse')), `${feature} × ${context}: counter-strategies`);
    }
  }
});

test('DaF review #14 M8: delivered feature-pair maxima equal the measured ratchet', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { auditBankFeaturePairs } = await import('./helpers/lesenGate.mjs');
  const papers = CURRICULUM_A12.checkpoints.flatMap((checkpoint) => [0, 1, 2, 3].map((round) =>
    B.buildCheckpoint({ curriculum: CURRICULUM_A12, checkpoint, pool: POOL_A12, seed: B.paperSeed(checkpoint, round) })
      .filter((it) => it.section === 'lesen')
      .map((it) => ({ text: it.text, question: it.promptDe, options: it.options, answer: it.answer }))));
  const bank = auditBankFeaturePairs(papers);
  // Owner decision 2026-10-20: a known issue recorded in docs/course-factory/a12-rebuild/HANDOFF-2026-10-16.md.
  // The review's alphabet × length × type-rank rule scores 42/64; the mirrored-pair proof sets a floor of 4/16.
  assert.deepEqual({ score: [bank.worst[0].score, bank.total], wholePapers: [bank.worstPerfect[0].perfect, papers.length] },
    { score: [46, 64], wholePapers: [10, 16] }, 'lower the ratchet in the same commit, never raise it');
});

test('DaF review #14 M8: audit measures the planted rule at 42/64; all sixteen independent answer patterns counterbalance the control', async () => {
  const { auditBankFeaturePairs } = await import('./helpers/lesenGate.mjs');
  const units = [
    { text: 'Ada und Ben holen den Brief.', question: 'Wer holt den Brief?', options: ['Ada', 'Ben'] },
    { text: 'Das Büro öffnet um acht oder elf.', question: 'Wann öffnet das Büro?', options: ['acht', 'elf'] },
    { text: 'Ada und Ben kaufen die Zeitung.', question: 'Wer kauft die Zeitung?', options: ['Ada', 'Ben'] },
    { text: 'Der Zug fährt um acht oder elf.', question: 'Wann fährt der Zug?', options: ['acht', 'elf'] },
  ];
  const reviewPicks = [0, 1, 1, 0]; // Equal names: early/late; unequal times: late/early.
  const mutant = Array.from({ length: 16 }, (_, pi) => units.map((u, i) => {
    // Balance partial hits across positions so the planted 42/64 is also this family's maximum.
    const right = pi < 7 || (pi < 14 && i % 2 === pi % 2);
    return { ...u, answer: u.options[reviewPicks[i] ^ Number(!right)] };
  }));
  const hits = mutant.map((p) => p.reduce((n, u, i) => n + Number(u.options[reviewPicks[i]] === u.answer), 0));
  assert.equal(hits.reduce((a, b) => a + b, 0), 42);
  assert.equal(hits.filter((n) => n === 4).length, 7);
  const measured = auditBankFeaturePairs(mutant);
  const planted = measured.families.find((f) => f.name === 'Länge Zeichen+ + Alphabet (de) × type-rank');
  assert.equal(planted?.score, 42, 'the audit detects the planted rule at exactly 42/64');
  assert.equal(planted.perfect, 7);
  const control = Array.from({ length: 16 }, (_, mask) => units.map((u, i) => ({ ...u, answer: u.options[(mask >> i) & 1] })));
  const balanced = auditBankFeaturePairs(control);
  assert.ok(balanced.families.every((f) => f.score === 32 && f.inverseScore === 32 && f.perfect === 1));
});

test('DaF review #14 M8 feasibility proof: the allowed moves cannot reach a three-whole-paper ceiling', async () => {
  const { LESEN_A12 } = await import('../src/data/curricula/a12.lesen.js');
  const papers = Object.values(LESEN_A12).flatMap((b) => b.papers);
  const permutations = (a) => a.length ? a.flatMap((v, i) => permutations(a.filter((_, j) => j !== i)).map((p) => [v, ...p])) : [[]];
  const whole = [0, 0, 0, 0];
  const scores = (paper) => {
    const seen = { Wer: 0, W: 0 }; const hits = [0, 0, 0, 0];
    for (const u of paper) {
      const type = u.question.startsWith('Wer ') ? 'Wer' : 'W';
      const rank = ++seen[type];
      const earlier = u.options[0].localeCompare(u.options[1], 'de') < 0 ? 0 : 1;
      const equal = u.options[0].length === u.options[1].length;
      const base = equal === (rank === 1) ? earlier : 1 - earlier;
      // Original review rule plus independently inverting its Wer and other-W preferences.
      for (let mask = 0; mask < 4; mask += 1) hits[mask] += Number(u.options[base ^ ((mask >> (type === 'Wer' ? 0 : 1)) & 1)] === u.answer);
    }
    return hits;
  };
  let variants = 0;
  for (const paper of papers) {
    scores(paper).forEach((n, i) => { whole[i] += Number(n === 4); });
    for (const order of permutations([0, 1, 2, 3])) for (let flip = 0; flip < 4; flip += 1) {
      const variant = order.map((i) => ({ ...paper[i], options: flip & (1 << (paper[i].pair - 1)) ? [...paper[i].options].reverse() : paper[i].options }));
      assert.equal(scores(variant).filter((n) => n === 4).length, 1, 'exactly one of the same four visible rules solves each allowed variant');
      variants += 1;
    }
  }
  assert.equal(variants, 1536, 'all 96 allowed variants of each paper, with no semantic edits');
  assert.equal(whole.reduce((a, b) => a + b, 0), 16);
  assert.ok(Math.max(...whole) >= 4, 'pigeonhole lower bound: 16 papers / four rules = at least four whole papers');
});

test('DaF review #13 M8: alphabetical type-rank and aligned-pair mutations fail, even with unchanged semantic content', async () => {
  const { LESEN_A12 } = await import('../src/data/curricula/a12.lesen.js');
  const { auditBankFeatures, auditBankOrder, auditPapers } = await import('./helpers/lesenGate.mjs');
  const papers = Object.values(LESEN_A12).flatMap((b) => b.papers);
  const alphabetical = papers.map((paper, pi) => {
    const pairs = [1, 2].map((pair) => paper.filter((u) => u.pair === pair)
      .map((u) => ({ ...u, options: [...u.options].sort((a, b) => a.localeCompare(b, 'de')) }))
      .sort((a, b) => a.options.indexOf(a.answer) - b.options.indexOf(b.answer)));
    if (pi % 2) for (const u of pairs.flat()) u.options.reverse();
    return [pairs[0][0], pairs[1][0], pairs[0][1], pairs[1][1]];
  });
  assert.equal(auditBankOrder(alphabetical).passes, true, 'the planted code keeps the round-13 A/B balances');
  assert.ok(auditPapers(alphabetical).papers.every((p) => p.passes), 'the per-paper gates still pass');
  const failed = auditBankFeatures(alphabetical);
  assert.equal(failed.passes, false);
  assert.ok([...failed.rules].some(([name, score]) => name.startsWith('Alphabet (de) × type-rank') && score === 64));
  const aligned = structuredClone(papers);
  for (const paper of aligned) for (const pair of [1, 2]) {
    const two = paper.filter((u) => u.pair === pair);
    if (two[0].answer !== two[0].options[0]) for (const u of two) u.options.reverse();
  }
  const pairFailed = auditBankFeatures(aligned);
  assert.equal(pairFailed.passes, false);
  assert.ok([...pairFailed.rules].some(([name, score]) => name.startsWith('A × pair member') && score === 64));
});

test('DaF review #13 M8: an independent counterbalanced bank passes the generic feature × order audit', async () => {
  const { auditBankFeatures, auditBankOrder } = await import('./helpers/lesenGate.mjs');
  const control = [
    { pair: 1, text: 'Ada und Ben holen den Brief.', question: 'Wer holt den Brief?', options: ['Ada', 'Ben'], answer: 'Ada' },
    { pair: 2, text: 'Das Büro öffnet um acht und schließt um neun.', question: 'Wann öffnet das Büro?', options: ['acht', 'neun'], answer: 'acht' },
    { pair: 1, text: 'Ada und Ben kaufen die Zeitung.', question: 'Wer kauft die Zeitung?', options: ['Ada', 'Ben'], answer: 'Ben' },
    { pair: 2, text: 'Der Zug fährt um acht oder neun.', question: 'Wann fährt der Zug?', options: ['acht', 'neun'], answer: 'neun' },
  ];
  // All independent pair-member swaps × both pair option reversals: sixteen papers / 64 units,
  // no bank ids or texts. Reversing only the options would leave the alphabet×rank code untouched.
  const papers = [0, 1, 2, 3].flatMap((swap) => [0, 1, 2, 3].map((flip) => {
    const order = [swap & 1 ? 2 : 0, swap & 2 ? 3 : 1, swap & 1 ? 0 : 2, swap & 2 ? 1 : 3];
    return order.map((i) => ({ ...control[i], options: flip & (1 << (control[i].pair - 1))
      ? [...control[i].options].reverse() : [...control[i].options] }));
  }));
  assert.equal(auditBankOrder(papers).passes, true);
  const bank = auditBankFeatures(papers);
  assert.equal(bank.total, 64);
  assert.equal(bank.passes, true, bank.findings.slice(0, 10).join('\n'));
  assert.ok([...bank.rules.values()].every((score) => score === 32));
});

test('DaF review #11 M8: a negated event states no exclusive time — minimal pairs, then the builder with every clock-time event line negated', async () => {
  const B = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const spec = { ...B.reportSpecFor(CURRICULUM_A12, CURRICULUM_A12.checkpoints[3]), known: null };
  const values = (statement) => [...new Set([1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
    B.contradictions(statement, spec.nouns, B.mulberry32(seed)).filter((c) => c.kind === 'value').map((c) => c.de)))];
  // ANNOTATED BY HAND: affirmed and negated minimal pairs. Who does not get up at six may not get up at
  // nine either — „um neun nicht" is open, not refuted.
  for (const [statement, label] of [
    ['Tim steht um sechs auf.', 'widerspricht'], ['Tim steht um sechs nicht auf.', 'offen'],
    ['Ana kommt um neun Uhr an.', 'widerspricht'], ['Ana kommt um neun Uhr nicht an.', 'offen'],
    ['Der Zug fährt um acht ab.', 'widerspricht'], ['Der Zug fährt um acht nicht ab.', 'offen'],
    ['Tim kocht um acht.', 'offen'], ['Tim kocht um acht nicht.', 'offen'],
  ]) {
    if (label === 'offen') assert.deepEqual(values(statement), [], `„${statement}" — offen`);
    else assert.ok(values(statement).length > 0, `„${statement}" — widerspricht`);
  }
  // THE WHOLE BUILDER, the pool and its stamps unchanged: every first-person clock-time event line of the
  // dialogues negated in memory, then all sixteen papers. No Falsch changes the time of a negated line. On
  // A1.1 — since round 12 the generator writes no A1.2 Lesen item (A1.2 reads authored units).
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const POOL_A11 = JSON.parse(read('src/data/lessonPools/a11.json'));
  const curriculum = structuredClone(CURRICULUM_A11);
  const negated = [];
  for (const lektion of curriculum.lektionen) {
    for (const line of lektion.dialog?.lines || []) {
      const m = /^(.*\b[Ii]ch\b.*\bum [^.!?]*?\s)(auf|an|ab)([.!?].*)$/.exec(line.de);
      if (!m) continue;
      line.de = `${m[1]}nicht ${m[2]}${m[3]}`;
      negated.push(line.de);
    }
  }
  assert.ok(negated.length >= 2, `the mutation needs lines to negate: ${negated.join(' | ')}`);
  for (const checkpoint of curriculum.checkpoints) {
    for (let round = 0; round < 4; round += 1) {
      const lesen = B.buildCheckpoint({ curriculum, checkpoint, pool: POOL_A11, seed: B.paperSeed(checkpoint, round) }).filter((it) => it.section === 'lesen');
      for (const it of lesen) {
        if (it.changed?.kind !== 'value' || !/\bnicht\b/.test(String(it.sourceSentence))) continue;
        assert.fail(`${checkpoint.id}/${round}: „${falschOf(it)}" changes the time of a negated line („${it.sourceSentence}")`);
      }
    }
  }
});
