// The Wortfeld no longer arrives as one screen of 18–25 cards (2026-10 pacing review).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { GROUP_MAX, groupWords, lineFor, metIn } from '../src/lib/lesson/wortfeldPacing.js';
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

test('an example line holds its word: never another word that only contains it (browser walk 2026-11-25)', () => {
  assert.equal(lineFor('das Buch', ['Tim, wo ist das Wörterbuch?']), null);
  assert.equal(lineFor('die Woche', ['Ich spiele am Wochenende Fußball.', 'Ich schwimme jede Woche.']), 'Ich schwimme jede Woche.');
  assert.equal(lineFor('der Tag', ['Ja, ich kaufe am Freitag ein.']), null);
  assert.equal(lineFor('wohnen', ['Vorname, Nachname und Wohnort, bitte.', 'Ich wohne in Bremen.']), 'Ich wohne in Bremen.');
  assert.equal(lineFor('fahren', ['Kostet die Fahrkarte zwanzig Euro?']), null);
  assert.equal(lineFor('die Sprache', ['Welche Sprachen sprechen deine Eltern?']), 'Welche Sprachen sprechen deine Eltern?', 'a plural is the word');
  assert.equal(lineFor('schön', ['Mai ist ein schöner Monat!']), 'Mai ist ein schöner Monat!', 'an ending is the word');
  assert.equal(lineFor('Wie geht es Ihnen?', ['Guten Tag! Wie geht es Ihnen?']), 'Guten Tag! Wie geht es Ihnen?', 'a phrase');
  // By class, every card of every A1.1 Lektion: some word of its line is the word itself, alone or with a short ending.
  for (const l of CURRICULUM_A11.lektionen) {
    const lines = l.dialog.lines.map((x) => x.de);
    for (const w of l.wortfeld) {
      const line = lineFor(w.de || w.word, lines);
      if (!line) continue;
      const bare = String(w.de || w.word).replace(/^(der|die|das)\s+/i, '').toLowerCase();
      if (/\s/.test(bare)) { assert.ok(line.toLowerCase().includes(bare), `L${l.nr} ${w.de}`); continue; }
      const stem = bare.length > 5 && bare.endsWith('en') ? bare.slice(0, -2) : bare;
      const near = line.toLowerCase().split(/[^\p{L}\p{N}-]+/u).filter((token) => token.startsWith(stem));
      assert.ok(near.some((token) => token.length - stem.length <= 3), `L${l.nr} ${w.de}: „${line}"`);
    }
    // Where a word is taught (the scene's words or the reading text) is decided as before: the word in the scene, whole or inside another.
    for (const w of l.wortfeld) if (lineFor(w.de || w.word, lines)) assert.ok(metIn(w.de || w.word, lines), `L${l.nr} ${w.de}`);
  }
  assert.equal(metIn('das Buch', ['Tim, wo ist das Wörterbuch?']), true);
});

test('the page of words is the player’s saved position, and the picture is cut where the heads are', () => {
  const src = readFileSync(new URL('../src/components/lesson/WortfeldStage.jsx', import.meta.url), 'utf8');
  const player = readFileSync(new URL('../src/pages/lesson/LessonPlayerPage.jsx', import.meta.url), 'utf8');
  // Browser walk 2026-11-25: a refresh on the second page of words went back to the first one.
  assert.match(player, /<WortfeldStage [^>]*group=\{itemIndex\} onGroup=\{setItemIndex\}/);
  assert.match(src, /const group = Math\.min\(savedGroup, Math\.max\(groups\.length - 1, 0\)\);/, 'a saved page past the end is the last page');
  assert.match(src, /onGroup\?\.\(n\)/);
  assert.match(player, /\(INPUT\|TEXTAREA\|H3\)/, 'the group heading keeps the focus the stage gave it');
  assert.match(src, /object-\[center_20%\]/, 'Lektion 9: Paul keeps his head');
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
  assert.match(src, /line=\{w\.exampleDe \|\| lineFor\(spoken, stage\.lines\)\}/);
  assert.doesNotMatch(src, /wortfeld.optional|<details/, 'no word is presented as optional — every one can be asked in match, checkpoint and review');
});
