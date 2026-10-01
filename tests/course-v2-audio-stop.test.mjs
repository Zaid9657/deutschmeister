// Course v2 — sound belongs to the screen that started it (CRITIC-01), and a surface says
// „Computerstimme" once (CT-09). The nine-line Folge used to keep talking over the course home after
// X: speechSynthesis.cancel() ran only before the NEXT play. Now every start takes a turn in
// src/lib/lesson/speech.js, and useV2Playback (AudioButton.jsx) stops its own turn when its
// component unmounts or moves on — never a later screen's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// a browser voice that records what it is told
const log = [];
globalThis.window = {
  speechSynthesis: {
    speak: (u) => log.push(['speak', u.text]),
    cancel: () => log.push(['cancel']),
    getVoices: () => [],
  },
};
globalThis.SpeechSynthesisUtterance = class {
  constructor(text) { this.text = text; }
};
const audios = [];
globalThis.Audio = class {
  constructor(url) {
    this.url = url;
    this.paused = false;
    audios.push(this);
    this.started = new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
  }
  play() { return this.started; }
  pause() { this.paused = true; this.reject(new Error('AbortError: play() interrupted by pause()')); }
};

const { speakGerman, speakGermanLines, stopSpeech, speechTurn, playWord } = await import('../src/lib/lesson/speech.js');
const { playV2Lines } = await import('../src/components/course-v2/content.js');
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const count = (kind) => log.filter((e) => e[0] === kind).length;

test('a queued dialogue is one turn, and its owner stops the whole queue', () => {
  log.length = 0;
  const lines = [1, 2, 3].map((n) => ({ id: `a1.1-u01-ls1-l0${n}`, de: `Zeile ${n}` }));
  assert.equal(playV2Lines('a1.1-u01', lines), 'tts');
  const mine = speechTurn();
  assert.deepEqual(log.filter((e) => e[0] === 'speak').map((e) => e[1]), ['Zeile 1', 'Zeile 2', 'Zeile 3']);
  const before = count('cancel');
  assert.equal(stopSpeech(mine), true, 'the screen that started it stops it');
  assert.equal(count('cancel'), before + 1);
});

test('a screen that leaves late never silences the next screen', () => {
  log.length = 0;
  speakGermanLines(['Guten Morgen!', 'Wie heißen Sie?']);
  const folge = speechTurn();
  speakGerman('Deutsch'); // the next card has taken the voice
  const card = speechTurn();
  assert.notEqual(folge, card);
  const before = count('cancel');
  assert.equal(stopSpeech(folge), false, 'the Folge unmounting after the card started is a no-op');
  assert.equal(count('cancel'), before);
  assert.equal(stopSpeech(card), true);
  assert.equal(count('cancel'), before + 1);
});

test('a stopped recording does not fall back to the synthesiser', async () => {
  log.length = 0;
  assert.equal(playWord('https://example.test/deutsch.mp3', 'Deutsch'), true);
  const rec = audios.at(-1);
  stopSpeech(speechTurn());
  assert.equal(rec.paused, true, 'the recording is paused');
  await rec.started.catch(() => {});
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(count('speak'), 0, 'the rejected play() of a stopped screen stays silent');
  // a recording the browser refuses while it is still the turn falls back as before
  playWord('https://example.test/englisch.mp3', 'Englisch');
  audios.at(-1).reject(new Error('NotAllowedError'));
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(log.filter((e) => e[0] === 'speak').map((e) => e[1]), ['Englisch']);
});

test('every course-v2 screen that makes sound goes through useV2Playback', () => {
  const ab = read('src/components/course-v2/AudioButton.jsx');
  assert.match(ab, /export function useV2Playback\(scope = null\)/);
  assert.match(ab, /if \(mine\.current !== null\) stopSpeech\(mine\.current\);/, 'the cleanup stops its own turn');
  assert.match(ab, /\}, \[scope\]\);/, 'on unmount and when the component moves on');
  assert.match(ab, /const playback = useV2Playback\(/);
  for (const f of ['AudioButton.jsx', 'StoryInput.jsx', 'WordCards.jsx']) {
    const src = read(`src/components/course-v2/${f}`);
    const direct = src.replace(/export function useV2Playback[\s\S]*?\n\}\n/, '');
    assert.doesNotMatch(direct, /\bplayV2Lines?\(/, `${f}: no raw playV2Line(s) call outside the hook`);
  }
  assert.doesNotMatch(read('src/components/course-v2/content.js'), /speechSynthesis/, 'content.js speaks only through speech.js');
});

test('„Computerstimme" once per surface, calmly (CT-09)', () => {
  const ab = read('src/components/course-v2/AudioButton.jsx');
  assert.match(ab, /badge = size !== 'sm' \}\) \{/, 'the small „Langsamer" twin carries no badge by default');
  assert.match(ab, /\{badge && first && <SourceBadge/);
  assert.doesNotMatch(ab.match(/export function SourceBadge[\s\S]*?\n\}/)[0], /uppercase/, 'sentence case, not a shouted label');
  // the Start's Folge: „Anhören" (md, with the badge) and „Langsamer" (sm, without)
  const iv = read('src/components/course-v2/InputView.jsx');
  assert.match(iv, /label=\{t\('audio\.slow'\)\} rate=\{0\.8\} size="sm"/);
  // an exercise's bubble: the speaker key is icon-only, so ItemView says it once itself
  const item = read('src/components/course-v2/ItemView.jsx');
  assert.equal((item.match(/<SourceBadge /g) || []).length, 1);
});

test('the exercise audio row wraps instead of widening the bubble (A11Y-03)', () => {
  const item = read('src/components/course-v2/ItemView.jsx');
  assert.match(item, /<div className="mb-3 flex flex-wrap items-center gap-3">/);
  assert.match(item, /<div className="flex min-w-min flex-1 flex-wrap items-center gap-x-3 gap-y-1">\s*<AudioButton unitId=\{uid\} line=\{audioLine\} label=\{t\('audio\.slow'\)\}/);
});

test('the word list speaker key plays through the stop-on-leave hook, never playV2Line directly', () => {
  const src = readFileSync(new URL('../src/components/course-v2/WordList.jsx', import.meta.url), 'utf8');
  assert.match(src, /useV2Playback\(/);
  assert.doesNotMatch(src, /playV2Line\(/);
});
