// Guard suite for the hand-authored situational practice items
// (src/data/lessonPools/a11.extra.json, plan P5).
//
// WHY IT EXISTS. The DaF review of 2026-09-12 measured the drawn practice of the
// A1.1 course and found the legacy grammar bank had nothing situational for two
// Lektionen at all: Lektion 10 (Am Bahnhof) drew ZERO of 7 items containing a
// word from its own Wortfeld, Lektion 12 (Feste feiern) 2, Lektion 6 3 and
// Lektion 5 4. The extra file closes that gap by hand. Two things can go wrong
// quietly afterwards: an item that trips the quality rules (then the build drops
// it and the Lektion silently thins out), and an item that mentions no Wortfeld
// word (then `relevanceScore` ranks it with the legacy drill and it is never
// drawn). Both are checked here, per item, plus the draw the learner actually
// gets — the number that the review was about.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { exclusionReason, answerInPrompt, isMetaPrompt } from '../src/data/lessonPools/quality.js';
import { planPractice, relevanceScore, wortfeldTerms, isTypedItem } from '../src/lib/lesson/buildLesson.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const EXTRA = read('src/data/lessonPools/a11.extra.json').items;
const POOL = read('src/data/lessonPools/a11.json');

/**
 * The id names the Lektion (`extra-a11-l09-02` → Lektion 9) and the Lektion names
 * its own topic, so the mapping is derived rather than restated: the first batch
 * covered four Lektionen, the second all twelve, and a hand-written table would
 * have to be edited in step with every batch.
 */
const lektion = (nr) => CURRICULUM_A11.lektionen.find((l) => l.nr === nr);
const target = (item) => {
  const m = /^extra-a11-l(\d\d)-\d\d$/.exec(String(item.id));
  const l = m && lektion(Number(m[1]));
  return l ? { nr: l.nr, topic: l.primarySlug } : null;
};

test('every extra item is addressed to one of the four Lektionen, with a unique id', () => {
  assert.ok(EXTRA.length >= 52, `only ${EXTRA.length} extra items`);
  assert.equal(new Set(EXTRA.map((i) => i.id)).size, EXTRA.length, 'duplicate id');
  for (const item of EXTRA) {
    assert.ok(target(item), `${item.id} does not name a Lektion`);
    assert.match(item.id, /^extra-a11-l\d\d-\d\d$/);
  }
  const perLektion = new Map();
  for (const item of EXTRA) perLektion.set(target(item).nr, (perLektion.get(target(item).nr) || 0) + 1);
  assert.ok(perLektion.get(10) >= 16, `L10 has only ${perLektion.get(10)} extra items`);
  assert.ok(perLektion.get(12) >= 16, `L12 has only ${perLektion.get(12)} extra items`);
  assert.ok(perLektion.get(5) >= 10, `L5 has only ${perLektion.get(5)} extra items`);
  assert.ok(perLektion.get(6) >= 10, `L6 has only ${perLektion.get(6)} extra items`);
});

test('every extra item passes the pool quality rules', () => {
  for (const item of EXTRA) {
    assert.equal(exclusionReason(item), null, `${item.id} is excluded: ${exclusionReason(item)}`);
  }
});

test('no extra item gives its answer away or hides its task in the English gloss', () => {
  // REVIEW #2 fixes 2 and 3, applied to the file the next hand-authored batch
  // lands in: the class the second review found alive three times is "the item
  // punishes a correct answer", and its two mechanical shapes are the answer
  // standing in its own prompt and a prompt whose content is only in questionEn.
  for (const item of EXTRA) {
    assert.equal(answerInPrompt(item), false, `${item.id}: the answer stands in its own prompt`);
    assert.equal(isMetaPrompt(item), false, `${item.id}: the German prompt carries no task`);
  }
});

test('every extra item has the Lektion topic, the pool shape and typed production', () => {
  for (const item of EXTRA) {
    assert.equal(item.topic, target(item).topic, `${item.id} is on the wrong topic`);
    assert.ok(['fill_blank', 'sentence_building', 'error_correction'].includes(item.type), `${item.id}: ${item.type}`);
    assert.equal(item.options, null, `${item.id} carries options — that would make it recognition`);
    assert.ok(isTypedItem(item), `${item.id} is not typed production`);
    assert.ok([4, 5].includes(item.stage), `${item.id} stage ${item.stage}`);
    assert.ok(item.difficulty >= 1 && item.difficulty <= 2, `${item.id} difficulty ${item.difficulty}`);
    assert.ok(item.questionDe && item.questionEn, `${item.id} misses a prompt`);
    assert.ok(item.answer && Array.isArray(item.accepted) && item.accepted.includes(item.answer), `${item.id} answer/accepted`);
    assert.ok(item.explanationDe, `${item.id} has no explanation`);
    const words = item.explanationDe.trim().split(/\s+/).length;
    assert.ok(words <= 15, `${item.id} explanation is ${words} words`);
    // German only where the engine shows German: the prompt and the answer.
    assert.doesNotMatch(`${item.questionDe} ${item.answer}`, /\b(the|you|your|is|are|does|do|have)\b/i, `${item.id} has English in a German field`);
  }
});

test('every extra item mentions a Wortfeld word of its Lektion — or it would never be drawn', () => {
  for (const item of EXTRA) {
    const terms = wortfeldTerms(lektion(target(item).nr));
    const score = relevanceScore(item, terms, new Set());
    assert.ok(score > 0, `${item.id} scores 0 relevance for L${target(item).nr}`);
  }
});

test('the shipped pool contains them — scripts/build-lesson-pool.mjs has been re-run', () => {
  const ids = new Set(POOL.items.map((i) => i.id));
  const missing = EXTRA.filter((i) => !ids.has(i.id)).map((i) => i.id);
  assert.deepEqual(missing, [], 'a11.json is stale — run `node scripts/build-lesson-pool.mjs a1.1`');
});

test('THE DRAW — the four Lektionen now practise their own situation', () => {
  const plan = planPractice(CURRICULUM_A11, POOL, 1);
  const situational = {};
  const lines = [];
  for (const nr of [5, 6, 10, 12]) {
    const l = lektion(nr);
    const terms = wortfeldTerms(l);
    const items = plan.get(nr);
    const hits = items.filter((it) => relevanceScore(it, terms, new Set()) > 0);
    situational[nr] = hits.length;
    lines.push(`L${String(nr).padStart(2)} ${l.primarySlug} — ${hits.length}/${items.length} situational, ${items.filter(isTypedItem).length} typed`);
    for (const it of items) {
      const hit = relevanceScore(it, terms, new Set()) > 0 ? '✓' : ' ';
      lines.push(`   ${hit} ${it.questionDe.replace(/\s+/g, ' ').slice(0, 72)} → ${it.answer}`);
    }
  }
  console.log(`\n${lines.join('\n')}\n`);

  // Floors, not the measured values: the draw is seeded, and a later pool change
  // may move an item without being a regression. The review's numbers were
  // L5 4, L6 3, L10 0, L12 2 — every floor below is above its baseline.
  assert.ok(situational[10] >= 3, `L10 draws only ${situational[10]} situational items (was 0)`);
  assert.ok(situational[12] >= 3, `L12 draws only ${situational[12]} situational items (was 2)`);
  assert.ok(situational[5] >= 5, `L5 draws only ${situational[5]} situational items (was 4)`);
  assert.ok(situational[6] >= 4, `L6 draws only ${situational[6]} situational items (was 3)`);
});
