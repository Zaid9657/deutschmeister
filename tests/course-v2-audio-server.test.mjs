// Course v2 — server-rendered voices (owner 2026-10-01: "the voices are not working").
// The browser's own voice was the only one and it is silent on many phones and in in-app
// browsers. Now netlify/functions/course-audio.mjs renders each speakable once (OpenAI TTS),
// stores it in Supabase Storage and redirects there. These tests pin what may be spoken (only
// the course's own texts, by id), that every speaker button's id is covered, that the cache path
// changes whenever the sound would, and the endpoint's answers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { buildSpeakables } from '../scripts/course-v2/build-speakables.mjs';
import { nounParts } from '../src/components/course-v2/kapitel.js';
import { COURSE_AUDIO_LEVELS, VOICE_FOR_AZURE, TEACHER_VOICE, audioPath, renderSpec, speakable, __setSpeakablesForTests } from '../netlify/functions/_shared/courseAudio.mjs';
import { V2_SERVER_AUDIO_LEVELS } from '../src/config/courseV2.js';
import { handler, __setCourseAudioDepsForTests } from '../netlify/functions/course-audio.mjs';

const ROOT = new URL('../', import.meta.url);
const readJson = (p) => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));

test('the committed speakables match the compiled course (re-run build-speakables after a compile)', () => {
  execFileSync(process.execPath, ['scripts/course-v2/build-speakables.mjs', '--check'], { cwd: new URL('.', ROOT).pathname, stdio: 'pipe' });
});

test('every id an A1.1 speaker button sends has a text on the server, and it is the text the browser would speak', () => {
  const { entries, collisions } = buildSpeakables('a1.1');
  assert.deepEqual(collisions, []);
  const lines = readJson('src/data/course-v2/a1.1/lines.json');
  for (const l of lines) assert.equal(entries[l.id]?.t, l.text.trim(), l.id);
  for (const w of readJson('src/data/course-v2/a1.1/words.json').words) {
    assert.equal(entries[w.id]?.t, nounParts(w).say.trim(), w.id);
    if (w.example) assert.equal(entries[`${w.id}-ex`]?.t, w.example.trim(), `${w.id}-ex`);
  }
  // the lines a unit plays carry the same text as lines.json (say || de)
  const byId = new Map(lines.map((l) => [l.id, l.text.trim()]));
  let unitLines = 0;
  for (const f of readdirSync(new URL('src/data/course-v2/a1.1/units/', ROOT))) {
    const unit = readJson(`src/data/course-v2/a1.1/units/${f}`);
    for (const r of unit.redemittel || []) assert.equal(entries[r.id]?.t, r.de.trim(), r.id);
    const walk = (o) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== 'object') return;
      if (typeof o.id === 'string' && byId.has(o.id) && (o.say || o.de)) {
        unitLines += 1;
        assert.equal(String(o.say || o.de).trim(), byId.get(o.id), `${f}: ${o.id}`);
      }
      Object.values(o).forEach(walk);
    };
    walk(unit);
  }
  assert.ok(unitLines > 500, `the units' dialogue lines were found (${unitLines})`);
});

test('every cast voice has a voice of its own; only words, examples and Redemittel use the teacher voice', () => {
  const azure = new Set();
  for (const level of readdirSync(new URL('src/data/course-v2/', ROOT))) {
    let lines;
    try { lines = readJson(`src/data/course-v2/${level}/lines.json`); } catch { continue; }
    for (const l of lines) if (l.voice) azure.add(l.voice);
  }
  for (const v of azure) assert.ok(VOICE_FOR_AZURE[v], `${v} is mapped`);
  assert.equal(renderSpec({ k: 'line', az: 'de-DE-AmalaNeural', r: '-10%' }).voice, 'coral', 'Priya keeps the teacher voice');
  assert.match(renderSpec({ k: 'line', az: 'de-DE-KlausNeural', r: '-10%' }).instructions, /langsamer/);
  assert.match(renderSpec({ k: 'line', az: null, s: 'durchsage' }).instructions, /durchsage/i);
  assert.equal(renderSpec({ k: 'word', t: 'der Kuli' }).voice, TEACHER_VOICE);
});

test('the stored file changes name whenever what is heard would change', () => {
  const e = { t: 'Hallo!', k: 'line', az: 'de-DE-AmalaNeural', r: '-10%' };
  const a = audioPath('a1.1', 'a1.1-u01-start-l01', e);
  assert.match(a, /^course-v2\/a1\.1\/a1\.1-u01-start-l01\.[0-9a-f]{12}\.mp3$/);
  assert.equal(audioPath('a1.1', 'a1.1-u01-start-l01', { ...e }), a, 'deterministic');
  assert.notEqual(audioPath('a1.1', 'a1.1-u01-start-l01', { ...e, t: 'Hallo, Olena!' }), a, 'an edited line');
  assert.notEqual(audioPath('a1.1', 'a1.1-u01-start-l01', { ...e, az: 'de-DE-KlausNeural' }), a, 'another voice');
});

test('the server renders only the levels the client asks for, and only known ids', () => {
  assert.deepEqual([...COURSE_AUDIO_LEVELS], [...V2_SERVER_AUDIO_LEVELS], 'client and server list the same levels');
  assert.ok(speakable('a1.1', 'a1.1-u01-start-l01'));
  assert.equal(speakable('a1.1', 'no-such-id'), null);
  assert.equal(speakable('a2.1', 'a2.1-u04-start-l01'), null, 'a held level is refused');
  assert.equal(speakable('a1.1', 'x'.repeat(200)), null);
  assert.equal(speakable('a1.1', '__proto__'), null);
});

// --- the endpoint -------------------------------------------------------------------------------

const ENTRY = { t: 'Hallo, ich bin Priya.', k: 'line', az: 'de-DE-AmalaNeural', r: '-10%' };
const get = (q, method = 'GET') => handler({ httpMethod: method, headers: {}, queryStringParameters: q });

function fakeWorld({ exists = false, ttsOk = true, uploadError = null } = {}) {
  const calls = { head: 0, tts: [], uploads: [] };
  const fetchFake = async (url, init = {}) => {
    if (init.method === 'HEAD') {
      calls.head += 1;
      return { ok: exists };
    }
    calls.tts.push({ url, body: JSON.parse(init.body) });
    if (!ttsOk) return { ok: false, status: 500, text: async () => 'boom' };
    return { ok: true, arrayBuffer: async () => new Uint8Array(2048).buffer };
  };
  const storage = { upload: async (path, buf) => { calls.uploads.push({ path, bytes: buf.length }); return { error: uploadError } ; } };
  return { calls, deps: { fetch: fetchFake, storage, apiKey: 'sk-test' } };
}

test('course-audio: unknown id 404, wrong method 405, a stored clip is a cached redirect without rendering', async () => {
  __setSpeakablesForTests({ 'a1.1': { entries: { 'a1.1-u01-start-l03': ENTRY } } });
  try {
    const w = fakeWorld({ exists: true });
    __setCourseAudioDepsForTests(w.deps);
    assert.equal((await get({ level: 'a1.1', id: 'nope' })).statusCode, 404);
    assert.equal((await get({ level: 'a1.1', id: 'a1.1-u01-start-l03' }, 'POST')).statusCode, 405);
    const res = await get({ level: 'a1.1', id: 'a1.1-u01-start-l03', text: 'ignored — the client never chooses the text' });
    assert.equal(res.statusCode, 302);
    assert.match(res.headers.Location, /\/storage\/v1\/object\/public\/audio\/course-v2\/a1\.1\/a1\.1-u01-start-l03\.[0-9a-f]{12}\.mp3$/);
    assert.match(res.headers['Cache-Control'], /max-age=86400/);
    assert.equal(w.calls.tts.length, 0, 'nothing rendered');
  } finally {
    __setCourseAudioDepsForTests(null);
    __setSpeakablesForTests(null);
  }
});

test('course-audio: the first request renders the course text once, stores it, then redirects', async () => {
  __setSpeakablesForTests({ 'a1.1': { entries: { 'a1.1-u01-start-l03': ENTRY } } });
  try {
    const w = fakeWorld({ exists: false });
    __setCourseAudioDepsForTests(w.deps);
    const [a, b] = await Promise.all([
      get({ level: 'a1.1', id: 'a1.1-u01-start-l03' }),
      get({ level: 'a1.1', id: 'a1.1-u01-start-l03' }),
    ]);
    assert.equal(a.statusCode, 302);
    assert.equal(b.statusCode, 302);
    assert.equal(w.calls.tts.length, 1, 'two requests at once share one render');
    assert.equal(w.calls.tts[0].body.input, ENTRY.t, 'the text comes from the course, never the request');
    assert.equal(w.calls.tts[0].body.voice, 'coral');
    assert.equal(w.calls.tts[0].body.model, 'gpt-4o-mini-tts');
    assert.equal(w.calls.uploads.length, 1);
    assert.ok(a.headers.Location.endsWith(w.calls.uploads[0].path));
  } finally {
    __setCourseAudioDepsForTests(null);
    __setSpeakablesForTests(null);
  }
});

test('course-audio: unconfigured 503, a failed render or upload 502 — the player then uses the browser voice', async () => {
  __setSpeakablesForTests({ 'a1.1': { entries: { 'a1.1-u01-start-l03': ENTRY } } });
  try {
    const q = { level: 'a1.1', id: 'a1.1-u01-start-l03' };
    __setCourseAudioDepsForTests({ ...fakeWorld().deps, apiKey: '' });
    assert.equal((await get(q)).statusCode, 503);
    __setCourseAudioDepsForTests({ ...fakeWorld().deps, storage: null });
    assert.equal((await get(q)).statusCode, 503);
    __setCourseAudioDepsForTests(fakeWorld({ ttsOk: false }).deps);
    assert.equal((await get(q)).statusCode, 502);
    __setCourseAudioDepsForTests(fakeWorld({ uploadError: { message: 'denied' } }).deps);
    assert.equal((await get(q)).statusCode, 502);
  } finally {
    __setCourseAudioDepsForTests(null);
    __setSpeakablesForTests(null);
  }
});
