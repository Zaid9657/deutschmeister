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
const synth = {
  speaking: false,
  pending: false,
  paused: false,
  speak: (u) => log.push(['speak', u.text]),
  cancel: () => log.push(['cancel']),
  getVoices: () => [],
};
globalThis.window = { speechSynthesis: synth };
globalThis.SpeechSynthesisUtterance = class {
  constructor(text) { this.text = text; }
};
// an <audio> element as a phone has it: play() returns a promise per call, a pause() or a new src
// rejects the pending one (AbortError), and `ended`/`error` arrive as events
const audios = [];
globalThis.Audio = class {
  constructor(url) {
    this.src = url || '';
    this.paused = true;
    this.listeners = {};
    this.played = [];
    this.pendingPlay = null;
    audios.push(this);
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn); }
  fire(type) { for (const fn of [...(this.listeners[type] || [])]) fn({ type }); }
  play() {
    if (this.pendingPlay) this.pendingPlay.reject(new Error('AbortError: interrupted by a new load request'));
    this.paused = false;
    this.played.push({ src: this.src, rate: this.playbackRate });
    let settle;
    const promise = new Promise((resolve, reject) => { settle = { resolve, reject }; });
    promise.catch(() => {});
    this.pendingPlay = settle;
    this.lastPlay = promise;
    return promise;
  }
  pause() {
    this.paused = true;
    if (this.pendingPlay) this.pendingPlay.reject(new Error('AbortError: play() interrupted by pause()'));
    this.pendingPlay = null;
  }
};
const tick = () => new Promise((r) => setTimeout(r, 0));

const { speakGerman, speakGermanLines, stopSpeech, speechTurn, playWord, playClips, clipRate } = await import('../src/lib/lesson/speech.js');
const { playV2Lines, serverAudioUrl, levelOfUnitId, warmV2Lines, __setServerAudioForTests } = await import('../src/components/course-v2/content.js');
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
  const el = audios.at(-1);
  assert.equal(el.src, 'https://example.test/deutsch.mp3');
  stopSpeech(speechTurn());
  assert.equal(el.paused, true, 'the recording is paused');
  await tick();
  assert.equal(count('speak'), 0, 'the rejected play() of a stopped screen stays silent');
  // a recording the browser refuses while it is still the turn falls back as before
  playWord('https://example.test/englisch.mp3', 'Englisch');
  el.pendingPlay.reject(new Error('NotAllowedError'));
  await tick();
  assert.deepEqual(log.filter((e) => e[0] === 'speak').map((e) => e[1]), ['Englisch']);
});

test('every recording plays on ONE shared element (iOS lets only a tapped element play)', () => {
  const before = audios.length;
  playClips([{ url: 'https://example.test/a.mp3', text: 'A' }]);
  playClips([{ url: 'https://example.test/b.mp3', text: 'B' }]);
  playWord('https://example.test/c.mp3', 'C');
  assert.equal(audios.length, before, 'no new Audio() per clip');
  stopSpeech();
});

test('a dialogue of clips plays back to back as one turn, at the asked rate', async () => {
  log.length = 0;
  const clips = [1, 2, 3].map((n) => ({ url: `https://example.test/${n}.mp3`, text: `Zeile ${n}` }));
  assert.equal(playClips(clips, { rate: 0.8 }), true);
  const el = audios.at(-1);
  const mine = speechTurn();
  assert.equal(el.src, 'https://example.test/1.mp3');
  assert.equal(el.playbackRate, clipRate(0.8));
  el.pendingPlay.resolve();
  el.fire('ended');
  assert.equal(el.src, 'https://example.test/2.mp3', 'the next clip follows on `ended`');
  assert.equal(speechTurn(), mine, 'still the same turn');
  // the owner leaves mid-dialogue: nothing more plays, nothing falls back
  stopSpeech(mine);
  el.fire('ended');
  await tick();
  assert.equal(el.src, 'https://example.test/2.mp3');
  assert.equal(count('speak'), 0);
});

test('a clip that cannot play hands itself and the rest to the browser voice — once', async () => {
  log.length = 0;
  const clips = [1, 2, 3].map((n) => ({ url: `https://example.test/x${n}.mp3`, text: `Satz ${n}` }));
  playClips(clips);
  const el = audios.at(-1);
  el.pendingPlay.resolve();
  el.fire('ended');
  // clip 2 fails twice over (an error event AND the rejected play), as a 502 does in a browser
  el.fire('error');
  el.pendingPlay.reject(new Error('NotSupportedError'));
  await tick();
  assert.deepEqual(log.filter((e) => e[0] === 'speak').map((e) => e[1]), ['Satz 2', 'Satz 3']);
  stopSpeech();
});

test('a new start does not cancel an idle synthesiser (Safari drops speech queued after cancel)', () => {
  log.length = 0;
  synth.speaking = false;
  synth.pending = false;
  speakGerman('Hallo');
  assert.deepEqual(log, [['speak', 'Hallo']], 'idle queue: speak only');
  log.length = 0;
  synth.speaking = true;
  speakGerman('Tschüss');
  assert.deepEqual(log, [['cancel'], ['speak', 'Tschüss']], 'busy queue: cancel, then speak');
  synth.speaking = false;
  log.length = 0;
  stopSpeech();
  assert.deepEqual(log, [['cancel']], 'an explicit stop always cancels');
});

test('the course plays server voices for A1.1 and warms them before the tap', async () => {
  __setServerAudioForTests(true);
  try {
    assert.equal(serverAudioUrl('a1.1-u01', 'a1.1-u01-start-l01'), '/.netlify/functions/course-audio?level=a1.1&id=a1.1-u01-start-l01');
    assert.equal(serverAudioUrl('a1.1-p2', 'lx.hallo'), '/.netlify/functions/course-audio?level=a1.1&id=lx.hallo');
    assert.equal(serverAudioUrl('a2.1-u04', 'a2.1-u04-ls1-l01'), null, 'a held level is not rendered');
    assert.equal(levelOfUnitId('a1.1-ht-sd1'), 'a1.1');
    const lines = [1, 2].map((n) => ({ id: `a1.1-u01-ls1-l0${n}`, de: `Zeile ${n}` }));
    assert.equal(playV2Lines('a1.1-u01', lines), 'server');
    const el = audios.at(-1);
    assert.equal(el.src, '/.netlify/functions/course-audio?level=a1.1&id=a1.1-u01-ls1-l01');
    stopSpeech();
    const fetched = [];
    globalThis.fetch = (url) => { fetched.push(url); return Promise.resolve({ ok: true }); };
    warmV2Lines('a1.1-u01', lines);
    warmV2Lines('a1.1-u01', lines);
    assert.deepEqual(fetched, lines.map((l) => serverAudioUrl('a1.1-u01', l.id)), 'each clip is asked for once');
  } finally {
    __setServerAudioForTests(null);
    delete globalThis.fetch;
  }
  // off (the Vite dev server has no functions): the browser voice, as before
  assert.equal(serverAudioUrl('a1.1-u01', 'a1.1-u01-start-l01'), null);
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
