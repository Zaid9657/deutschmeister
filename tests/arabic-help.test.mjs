// The "Explain in Arabic" help (notice.bodyAr, NoticeStage.jsx), 2026-11-19: Lektionen 1–3; 4–6 and 7–9 in the rollout batches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { latinMatches, latinRuns } from '../src/lib/lesson/bidi.js';

const withArabic = CURRICULUM_A11.lektionen.filter((l) => l.notice.bodyAr);
// The German of the English notice: every **bold** span, one sentence at a time, without its closing full stop.
const germanOf = (en) => [...en.matchAll(/\*\*([^*]+)\*\*/g)].flatMap((m) => m[1].split(/(?<=[.!?])\s+/)).map((s) => s.replace(/[.]$/, '').trim());

test('Lektionen 1–12 explain their rule in Arabic, with every German form of the English kept in Latin letters', () => {
  assert.deepEqual(withArabic.map((l) => l.nr), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  for (const l of withArabic) {
    const ar = l.notice.bodyAr;
    assert.match(ar, /[؀-ۿ]/, `L${l.nr}: Arabic`);
    assert.doesNotMatch(ar, /\*/, `L${l.nr}: no markdown marks`);
    // A character lost in encoding came back once as U+001A where an arrow belonged (2026-11-19).
    assert.ok([...ar].every((ch) => ch.codePointAt(0) >= 0x20), `L${l.nr}: no control characters`);
    // A form that opens an English sentence („**Gemacht** and …“) has its capital from the English only.
    for (const de of germanOf(l.notice.bodyEn)) assert.ok(ar.includes(de) || ar.includes(de.charAt(0).toLowerCase() + de.slice(1)), `L${l.nr}: "${de}"`);
  }
});

test('each German run inside the Arabic stays one left-to-right piece, digits, slashes and arrows included', () => {
  const [, l2, l3] = withArabic;
  const runs2 = latinRuns(l2.notice.bodyAr);
  assert.ok(runs2.includes('er/sie/es ist'), 'not „es/sie/er" in a right-to-left line');
  assert.ok(runs2.includes('sie/Sie sind'));
  assert.ok(runs2.includes('Ich bin am 3.5.1998 geboren'), 'a date sentence is one piece, not three in reverse order');
  assert.ok(runs2.includes('Staatsangehörigkeit: marokkanisch'));
  assert.ok(runs2.every((r) => !/^[[(]$/.test(r)), 'a bracket around Arabic stays in the Arabic flow');
  const runs3 = latinRuns(l3.notice.bodyAr);
  for (const pair of ['der Bruder → er', 'die Schwester → sie', 'das Kind → es']) assert.ok(runs3.includes(pair), pair);
  assert.ok(runs3.some((r) => r.endsWith('Lektion 7')));
  const [, , , l4, l5, l6] = withArabic;
  assert.ok(latinRuns(l4.notice.bodyAr).includes('Ich kaufe den Stuhl'));
  assert.ok(latinRuns(l5.notice.bodyAr).includes('Wo ist …?'), 'a gap inside German keeps its question mark in place');
  assert.ok(latinRuns(l6.notice.bodyAr).some((r) => r.includes('A1.2')));
});

test('a separable verb, an ending and a bracket around Arabic keep their direction (browser walk 2026-11-25)', () => {
  const runs = (nr) => latinRuns(withArabic[nr - 1].notice.bodyAr);
  for (const verb of ['ein|kaufen', 'auf|stehen', 'an|rufen', 'mit|bringen']) {
    assert.ok(withArabic[10].notice.bodyAr.includes(verb) && runs(11).includes(verb), `L11: „${verb}", not „${verb.split('|').reverse().join('|')}"`);
  }
  assert.equal(runs(7).filter((r) => r === '-t').length, 2, 'L7: „-t", not „t-"');
  assert.ok(runs(12).includes('-e: meine Mama'), 'L12: the hyphen stays before its ending');
  // „unser Fest (حفلتنا، wir)": the bracket opens in Arabic, so it closes in Arabic.
  for (const run of ['unser Fest', 'wir', 'euer Fest', 'ihr']) assert.ok(runs(12).includes(run), `L12: ${run}`);
  // By class, all twelve: no run holds a bracket without its partner, starts or ends with a space, or ends on a hyphen or „|".
  for (const l of withArabic) for (const run of latinRuns(l.notice.bodyAr)) {
    const count = (re) => (run.match(re) || []).length;
    assert.equal(count(/[([]/g), count(/[)\]]/g), `L${l.nr}: ${run}`);
    assert.match(run, /^\S(?:.*\S)?$/s);
    assert.doesNotMatch(run, /[-|]$/, `L${l.nr}: ${run}`);
  }
  // Every „|" and every ending hyphen of the Arabic texts stands inside a run.
  for (const l of withArabic) {
    const marks = (s) => (s.match(/\|(?=[A-Za-zÄÖÜäöüß])|(?<![A-Za-zÄÖÜäöüß])-(?=[A-Za-zÄÖÜäöüß])/g) || []).length;
    assert.equal(latinMatches(l.notice.bodyAr).reduce((n, m) => n + marks(m.run), 0), marks(l.notice.bodyAr), `L${l.nr}`);
    for (const m of latinMatches(l.notice.bodyAr)) assert.equal(l.notice.bodyAr.slice(m.index, m.index + m.run.length), m.run, `L${l.nr}: the place of the run`);
  }
});

test('Lektion 1’s Arabic is split into the same German runs as before the pattern widened', () => {
  const OLD = /[A-Za-zÄÖÜäöüß[(](?:[A-Za-zÄÖÜäöüßː[\]()\s?]*[A-Za-zÄÖÜäöüßː\])?])?/g;
  const ar = withArabic[0].notice.bodyAr;
  assert.deepEqual(latinRuns(ar), [...ar.matchAll(OLD)].map((m) => m[0]));
});

test('Phase 2b: every final-check turn and checkpoint task has complete optional Arabic help', async () => {
  const { checkTurns } = await import('../src/lib/lesson/finalCheck.js');
  const { buildCheckpoint, paperSeed } = await import('../src/lib/checkpoint/buildCheckpoint.js');
  const { taskArabic } = await import('../src/lib/lesson/arabicHelp.js');
  const { readFileSync } = await import('node:fs');
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  const check = (en) => { assert.ok(en, 'English source task'); assert.match(taskArabic(en) || '', /[\u0600-\u06ff]/, en); };
  for (const lesson of CURRICULUM_A11.lektionen) for (let round = 0; round < 6; round++) {
    for (const turn of checkTurns(lesson.guided.check, round)) check(turn.taskEn);
  }
  for (const checkpoint of CURRICULUM_A11.checkpoints) for (let round = 0; round < 8; round++) {
    for (const item of buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint, pool, seed: paperSeed(checkpoint, round) })) check(item.task?.taskEn || item.promptEn);
  }
});

test('Phase 2b: every visible final-check correction and recovery key has Arabic, without a third interface mode', async () => {
  const { STRINGS } = await import('../src/lib/lesson/strings.js');
  const { FEEDBACK_AR, feedbackArabic } = await import('../src/lib/lesson/arabicHelp.js');
  const { LESSON_LANGS } = await import('../src/lib/lesson/lessonLang.js');
  const { readFileSync } = await import('node:fs');
  const keys = [...Object.keys(STRINGS.en).filter((k) => /^check\.(fault\.|beyond|unchecked)/.test(k)),
    'feedback.typo', 'feedback.typo.case', 'otter.retry', 'otter.check.missed', 'feedback.correctIs', 'check.example', 'check.letters', 'check.practised'];
  for (const key of keys) assert.match(FEEDBACK_AR[key] || '', /[\u0600-\u06ff]/, key);
  assert.ok(feedbackArabic('check.unchecked', { word: 'Ticket' }).includes('Ticket'));
  assert.deepEqual(LESSON_LANGS, ['en', 'de']);
  const source = readFileSync(new URL('../src/components/lesson/ArabicHelp.jsx', import.meta.url), 'utf8');
  assert.match(source, /<details lang="ar" dir="rtl"/);
  assert.doesNotMatch(source, /<details[^>]*\bopen[= >]/);
  assert.match(source, /isolateLatin\(text\)/);
  const stage = readFileSync(new URL('../src/components/lesson/CheckStage.jsx', import.meta.url), 'utf8');
  for (const key of keys.filter((key) => !key.startsWith('check.fault.'))) assert.ok(stage.includes(key), key + ' is wired into the final-check help');
});
