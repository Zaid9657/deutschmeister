// The end screen's first and latest recording stay on this device only (src/lib/lesson/voiceKeep.js,
// founder 2026-11-18 "Yes, phone only"): one key per owner, the first take kept, the latest replaced,
// nothing for a guest, and every take gone 7 days after the first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RUN_MAX_AGE_MS } from '../src/lib/lesson/runState.js';
import { VOICE_KEY_PREFIX, clearVoices, keepTake, readVoices, sweepVoices, voiceKey } from '../src/lib/lesson/voiceKeep.js';

function fakeStorage() {
  const map = new Map();
  return {
    map,
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}
function withStorage(fn) {
  const store = fakeStorage();
  const prev = globalThis.window;
  globalThis.window = { localStorage: store };
  try { return fn(store); } finally { if (prev === undefined) delete globalThis.window; else globalThis.window = prev; }
}

const T0 = Date.UTC(2026, 10, 18, 8, 0, 0);
const take = (n) => ({ text: `Satz ${n}`, src: `data:audio/webm;codecs=opus;base64,AAA${n}` });

test('the first take stays, later takes replace the latest, per owner', () => withStorage(() => {
  assert.equal(keepTake('a1.1-l01', 'u1', take(1), T0), true);
  assert.deepEqual(readVoices('a1.1-l01', 'u1', T0).latest, null, 'one take is no pair yet');
  keepTake('a1.1-l01', 'u1', take(2), T0 + 1000);
  keepTake('a1.1-l01', 'u1', take(3), T0 + 2000);
  const v = readVoices('a1.1-l01', 'u1', T0 + 3000);
  assert.equal(v.first.text, 'Satz 1');
  assert.equal(v.latest.text, 'Satz 3');
  assert.deepEqual(readVoices('a1.1-l01', 'u2', T0 + 3000), { first: null, latest: null }, 'another account hears nothing');
}));

test('a guest keeps nothing and non-audio is refused', () => withStorage((store) => {
  assert.equal(keepTake('a1.1-l01', null, take(1), T0), false);
  assert.equal(keepTake('a1.1-l01', 'u1', { text: 'x', src: 'javascript:alert(1)' }, T0), false);
  assert.equal(store.map.size, 0);
}));

test('takes expire 7 days after the first, are not shown, and the sweep deletes them', () => withStorage((store) => {
  keepTake('a1.1-l01', 'u1', take(1), T0);
  keepTake('a1.1-l01', 'u1', take(2), T0 + 1000);
  keepTake('a1.1-l02', 'u1', take(3), T0 + RUN_MAX_AGE_MS);
  const later = T0 + RUN_MAX_AGE_MS + 1;
  assert.equal(readVoices('a1.1-l01', 'u1', later).first, null);
  store.setItem(`${VOICE_KEY_PREFIX}broken:u1`, '{not json');
  store.setItem('dm_lesson_run:a1.1:a1.1-l01', '{}');
  sweepVoices(later, store);
  assert.deepEqual([...store.map.keys()].sort(), ['dm_lesson_run:a1.1:a1.1-l01', voiceKey('a1.1-l02', 'u1')]);
}));

test('delete now removes the pair', () => withStorage((store) => {
  keepTake('a1.1-l01', 'u1', take(1), T0);
  assert.equal(clearVoices('a1.1-l01', 'u1'), true);
  assert.equal(store.map.size, 0);
}));

test('only a Lektion\'s own stages keep takes; the checkpoint does not, and the app sweeps on load', () => {
  const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  for (const stage of ['SceneStage', 'SoundStage', 'FluencyStage', 'SpeakingStage', 'CheckStage']) {
    assert.match(src(`src/components/lesson/${stage}.jsx`), /<ReadAloudLine[^>]*\bkeepVoice\b/s, stage);
  }
  assert.doesNotMatch(src('src/pages/lesson/CheckpointPage.jsx'), /keepVoice/);
  assert.match(src('src/main.jsx'), /sweepVoices\(\)/);
});
