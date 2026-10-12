// The Wortfeld no longer arrives as one screen of 18–25 cards (2026-10 pacing review).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { GROUP_MAX, groupWords, lineFor } from '../src/lib/lesson/wortfeldPacing.js';
import buildLesson from '../src/lib/lesson/buildLesson.js';

test('every A1.1 Lektion pages its words in groups of at most six, each word once, in order', () => {
  for (const l of CURRICULUM_A11.lektionen) {
    const groups = groupWords(l.wortfeld);
    assert.ok(groups.every((g) => g.length >= 1 && g.length <= GROUP_MAX), `L${l.nr}: ${groups.map((g) => g.length)}`);
    assert.deepEqual(groups.flat(), l.wortfeld, `L${l.nr}: no word lost, none repeated`);
    const sizes = groups.map((g) => g.length);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `L${l.nr}: no stub group (${sizes})`);
  }
  assert.deepEqual(groupWords(Array.from({ length: 20 }, (_, i) => i)).map((g) => g.length), [5, 5, 5, 5]);
  assert.deepEqual(groupWords(Array.from({ length: 21 }, (_, i) => i)).map((g) => g.length), [6, 5, 5, 5]);
  for (let n = 1; n <= 60; n += 1) {
    const g = groupWords(Array.from({ length: n }, (_, i) => i));
    assert.equal(g.flat().length, n);
    assert.ok(g.every((x) => x.length && x.length <= GROUP_MAX), `n=${n}`);
    assert.ok(Math.max(...g.map((x) => x.length)) - Math.min(...g.map((x) => x.length)) <= 1, `n=${n} balanced`);
  }
  assert.deepEqual(groupWords([]), []);
});

test('a word card shows the dialogue line the word was met in — and nothing when there is none', () => {
  const lines = ['Wo ist der Bahnhof?', 'Ich kaufe heute ein.'];
  assert.equal(lineFor('der Bahnhof', lines), 'Wo ist der Bahnhof?', 'the article is not part of the match');
  assert.equal(lineFor('kaufen', lines), 'Ich kaufe heute ein.', 'a verb is found by its stem');
  assert.equal(lineFor('das Fenster', lines), null);
  assert.equal(lineFor('da', lines), null, 'too short to match safely');
  const stage = buildLesson({ curriculum: CURRICULUM_A11, lektion: CURRICULUM_A11.lektionen[0], pool: { items: [] } }).stages.find((s) => s.kind === 'wortfeld');
  assert.ok(stage.lines.length > 0 && stage.lines.every((x) => typeof x === 'string'), 'the stage carries the dialogue lines');
  const src = readFileSync(new URL('../src/components/lesson/WortfeldStage.jsx', import.meta.url), 'utf8');
  assert.match(src, /groupWords\(words\.map/, 'the stage pages through groupWords');
  assert.match(src, /line=\{lineFor\(spoken, stage\.lines\)\}/);
  assert.doesNotMatch(src, /wortfeld.optional|<details/, 'no word is presented as optional — every one can be asked in match, checkpoint and review');
});
