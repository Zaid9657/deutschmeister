// The "Explain in Arabic" help (notice.bodyAr, NoticeStage.jsx), 2026-11-19: Lektionen 1–3; 4–6 and 7–9 in the rollout batches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { latinRuns } from '../src/lib/lesson/bidi.js';

const withArabic = CURRICULUM_A11.lektionen.filter((l) => l.notice.bodyAr);
// The German of the English notice: every **bold** span, one sentence at a time, without its closing full stop.
const germanOf = (en) => [...en.matchAll(/\*\*([^*]+)\*\*/g)].flatMap((m) => m[1].split(/(?<=[.!?])\s+/)).map((s) => s.replace(/[.]$/, '').trim());

test('Lektionen 1–9 explain their rule in Arabic, with every German form of the English kept in Latin letters', () => {
  assert.deepEqual(withArabic.map((l) => l.nr), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const l of withArabic) {
    const ar = l.notice.bodyAr;
    assert.match(ar, /[؀-ۿ]/, `L${l.nr}: Arabic`);
    assert.doesNotMatch(ar, /\*/, `L${l.nr}: no markdown marks`);
    // A character lost in encoding came back once as U+001A where an arrow belonged (2026-11-19).
    assert.ok([...ar].every((ch) => ch.codePointAt(0) >= 0x20), `L${l.nr}: no control characters`);
    for (const de of germanOf(l.notice.bodyEn)) assert.ok(ar.includes(de), `L${l.nr}: "${de}"`);
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

test('Lektion 1’s Arabic is split into the same German runs as before the pattern widened', () => {
  const OLD = /[A-Za-zÄÖÜäöüß[(](?:[A-Za-zÄÖÜäöüßː[\]()\s?]*[A-Za-zÄÖÜäöüßː\])?])?/g;
  const ar = withArabic[0].notice.bodyAr;
  assert.deepEqual(latinRuns(ar), [...ar.matchAll(OLD)].map((m) => m[0]));
});
