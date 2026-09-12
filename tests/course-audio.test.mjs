// Guard suite for the recorded course audio (plan P1, "Recorded audio
// everywhere"). The owner runs scripts/generate-course-audio.mjs once, locally,
// with the Azure + service-role secrets — which means CI can never watch the
// run. What CI CAN pin is everything the run derives from: the plan it will
// execute, the manifest shape it writes, the stability of the sha1 that makes
// it idempotent, and that the engine reads an empty manifest without throwing.
//
// The last one is the one that would actually break a learner: a committed
// manifest with no entries is the normal state until the owner runs the script,
// so `audioFor` must return null and every caller must fall back to speech.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  planRenders, sha1, slugify, voiceForSpeaker, phonetikSpeechText, wordSpeechText,
  estimateCents, renderManifest, SPEAKER_VOICES, VOICE_FEMALE, VOICE_MALE, VOICE_DEFAULT,
  RATE, BUCKET, ssml,
} from '../scripts/generate-course-audio.mjs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import manifest from '../src/data/curricula/a11.audio.js';
import { audioFor, hasRecordings } from '../src/lib/lesson/speech.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const plan = planRenders(CURRICULUM_A11);
const byKind = (kind) => plan.filter((e) => e.kind === kind);

// ── the plan covers the curriculum ──────────────────────────────────────────

test('planRenders covers every dialogue line of all 12 Lektionen', () => {
  assert.equal(CURRICULUM_A11.lektionen.length, 12, 'A1.1 is a 12-Lektion level');
  for (const lektion of CURRICULUM_A11.lektionen) {
    const lines = lektion.dialog.lines;
    for (let i = 0; i < lines.length; i += 1) {
      const entry = plan.find((e) => e.lektionId === lektion.id && e.key === `line-${i}`);
      assert.ok(entry, `${lektion.id} line-${i} is missing from the plan`);
      assert.equal(entry.text, lines[i].de, `${lektion.id} line-${i} renders the German verbatim`);
      assert.equal(entry.path, `course/a1.1/${lektion.id}/line-${i}.mp3`);
    }
  }
  assert.equal(byKind('line').length, CURRICULUM_A11.lektionen.reduce((n, l) => n + l.dialog.lines.length, 0));
});

test('the checkpoint dictation lines need no separate render — they ARE dialogue lines', () => {
  // buildCheckpoint.dialogLines() flattens lektion.dialog.lines with their index,
  // so the `line-<i>` keys above already cover every checkpoint Hören item.
  for (const lektion of CURRICULUM_A11.lektionen) {
    for (const idx of lektion.hoeren?.lines || []) {
      assert.ok(
        plan.some((e) => e.lektionId === lektion.id && e.key === `line-${idx}`),
        `${lektion.id} dictates line ${idx} but nothing renders it`,
      );
    }
    for (const idx of lektion.sprechen?.readAloud || []) {
      assert.ok(plan.some((e) => e.lektionId === lektion.id && e.key === `line-${idx}`));
    }
  }
});

test('planRenders covers every pretest model answer', () => {
  assert.equal(byKind('pretest').length, 12);
  for (const lektion of CURRICULUM_A11.lektionen) {
    const entry = plan.find((e) => e.lektionId === lektion.id && e.key === 'pretest');
    assert.ok(entry, `${lektion.id} has no pretest render`);
    assert.equal(entry.text, lektion.pretest.model);
  }
});

test('planRenders covers every Phonetik item, with the syllable markup removed for speech', () => {
  assert.equal(byKind('phonetik').length, CURRICULUM_A11.lektionen.reduce((n, l) => n + l.phonetik.items.length, 0));
  for (const lektion of CURRICULUM_A11.lektionen) {
    lektion.phonetik.items.forEach((item, i) => {
      const entry = plan.find((e) => e.lektionId === lektion.id && e.key === `phonetik-${i}`);
      assert.ok(entry, `${lektion.id} phonetik-${i} is missing`);
      assert.equal(entry.display, item, 'the DISPLAY text stays exactly as authored');
      assert.ok(!/-/.test(entry.text), `syllable hyphen survived into speech: ${entry.text}`);
      assert.ok(!/[↗↘]/.test(entry.text), `melody arrow survived into speech: ${entry.text}`);
    });
  }
});

test('planRenders covers every Wortfeld entry the words table does not carry (wordId null)', () => {
  const missing = CURRICULUM_A11.lektionen.flatMap((l) => (l.wortfeld || []).filter((w) => !w.wordId));
  assert.ok(missing.length > 0, 'if this ever hits 0 the migration is fully backfilled — delete the word step');
  const words = byKind('word');
  assert.equal(words.length, missing.length, 'one render per wordId-null entry');
  for (const w of missing) {
    const german = (w.word || w.de).trim();
    const entry = words.find((e) => e.german === german);
    assert.ok(entry, `${german} has no audio render`);
    assert.equal(entry.path, `course/a1.1/words/${slugify(german)}.mp3`);
    assert.equal(entry.lektionId, null, 'word audio lives on the words row, not in the manifest');
  }
});

test('every wordId-null entry is in migrations/2026-09-13-a1-1-course-words.sql', () => {
  const sql = read('migrations/2026-09-13-a1-1-course-words.sql');
  for (const entry of byKind('word')) {
    const escaped = entry.german.replace(/'/g, "''");
    assert.ok(
      sql.includes(`'${escaped}'`),
      `${entry.german} is rendered but never seeded — the audio script's UPDATE by (german, level) would find no row`,
    );
  }
  assert.match(sql, /level = 'a1\.1'/, 'words.level is lowercase (CLAUDE.md)');
  const inserts = (sql.split('BEGIN;')[1] || '').split('COMMIT;')[0];
  assert.ok(inserts.includes('INSERT INTO public.words'), 'the migration inserts words');
  assert.ok(!/audio_url/.test(inserts), 'audio_url is left NULL for the script to fill');
  assert.ok(!/'null'/.test(inserts), "plural must be SQL NULL, never the string 'null'");
});

test('every planned clip has a text, a voice, a unique path and a storage path under course/<level>/', () => {
  const paths = new Set();
  for (const e of plan) {
    assert.ok(e.text && e.text.trim(), `empty text for ${e.path}`);
    assert.ok([VOICE_FEMALE, VOICE_MALE].includes(e.voice), `unknown voice ${e.voice}`);
    assert.match(e.path, /^course\/a1\.1\/[^/]+\/[a-z0-9-]+\.mp3$/);
    assert.ok(!paths.has(e.path), `duplicate path ${e.path}`);
    paths.add(e.path);
  }
});

// ── voices ──────────────────────────────────────────────────────────────────

test('both voices are used and every speaker in the curriculum is mapped', () => {
  const speakers = new Set(CURRICULUM_A11.lektionen.flatMap((l) => l.dialog.lines.map((x) => x.speaker)));
  for (const s of speakers) {
    assert.ok(SPEAKER_VOICES[s], `speaker "${s}" is not in SPEAKER_VOICES — it would fall back to ${VOICE_DEFAULT}`);
  }
  const used = new Set(byKind('line').map((e) => e.voice));
  assert.equal(used.size, 2, 'a dialogue must not be one voice talking to itself');
});

test('voiceForSpeaker splits female/male and defaults rather than throwing', () => {
  assert.equal(voiceForSpeaker('Ana'), VOICE_FEMALE);
  assert.equal(voiceForSpeaker('Frau Kaya'), VOICE_FEMALE);
  assert.equal(voiceForSpeaker('Herr Weber'), VOICE_MALE);
  assert.equal(voiceForSpeaker('Tim'), VOICE_MALE);
  assert.equal(voiceForSpeaker('Niemand'), VOICE_DEFAULT);
  assert.equal(voiceForSpeaker(undefined), VOICE_DEFAULT);
});

test('the SSML carries the voice and the -10% rate', () => {
  const xml = ssml('Guten Tag & tschüss', VOICE_MALE);
  assert.ok(xml.includes(`name="${VOICE_MALE}"`));
  assert.ok(xml.includes(`rate="${RATE}"`));
  assert.ok(xml.includes('&amp;'), 'text is XML-escaped');
  assert.equal(RATE, '-10%', 'same rate as scripts/generate-example-audio.mjs');
  assert.equal(BUCKET, 'audio', 'same Supabase Storage bucket as the example-audio pipeline');
});

// ── pure helpers ────────────────────────────────────────────────────────────

test('phonetikSpeechText closes syllables, drops arrows and de-shouts the stress', () => {
  assert.equal(phonetikSpeechText('HAL-lo'), 'Hallo');
  assert.equal(phonetikSpeechText('Te-le-FON'), 'Telefon');
  assert.equal(phonetikSpeechText('ich BIN'), 'Ich bin');
  assert.equal(phonetikSpeechText('um ACHT Uhr'), 'Um acht Uhr');
  assert.equal(phonetikSpeechText('Hast du ZEIT?↗'), 'Hast du zeit?');
  assert.equal(phonetikSpeechText('die MÜT-ter'), 'Die Mütter');
  assert.equal(phonetikSpeechText(''), '');
});

test('wordSpeechText keeps the article and says a digit range out loud', () => {
  assert.equal(wordSpeechText({ de: 'der Buchstabe' }), 'der Buchstabe');
  assert.equal(wordSpeechText({ de: 'die Zahlen 0–10' }), 'die Zahlen 0 bis 10');
  assert.equal(wordSpeechText({ word: 'sofort' }), 'sofort');
});

test('slugify is storage-safe and transliterates the umlauts', () => {
  assert.equal(slugify('heißen'), 'heissen');
  assert.equal(slugify('das Frühstück'), 'das-fruehstueck');
  assert.equal(slugify('die Gäste'), 'die-gaeste');
  assert.equal(slugify('Zahlen 0–10'), 'zahlen-0-10');
});

test('sha1 is stable — it is the whole idempotency contract', () => {
  // Pinned literals: if these ever change, a re-run would re-render and re-upload
  // every clip in the level for nothing.
  assert.equal(sha1('Guten Tag und willkommen!'), '4a3ab545b353748a9134c9529bad66ad89883844');
  assert.equal(sha1('Ich heiße Ana.'), '4f0e765aff33667c3b712883769bd74b8ba0359d');
  assert.equal(sha1('a'), '86f7e437faa5a7fce15d1ddcb9eaeaea377667b8');
  assert.equal(sha1(plan[0].text), sha1(plan[0].text), 'same text, same hash');
  assert.notEqual(sha1('Ana'), sha1('Ana '), 'whitespace counts, so a trailing space re-renders');
});

test('the cost estimate follows from the characters, not from a retyped number', () => {
  const chars = plan.reduce((n, e) => n + e.text.length, 0);
  assert.equal(estimateCents(plan), Math.round(chars * 16e-6 * 100 * 100) / 100);
  assert.ok(estimateCents(plan) < 100, 'the whole level must cost cents, not dollars');
});

// ── the manifest ────────────────────────────────────────────────────────────

test('the committed manifest has the exact exported shape', () => {
  assert.equal(manifest.level, 'a1.1');
  assert.ok(manifest.generatedAt === null || !Number.isNaN(Date.parse(manifest.generatedAt)), 'generatedAt is null or an ISO date');
  assert.equal(typeof manifest.voices, 'object');
  assert.ok(manifest.voices && !Array.isArray(manifest.voices));
  assert.equal(typeof manifest.lektionen, 'object');
  assert.ok(manifest.lektionen && !Array.isArray(manifest.lektionen));
  assert.deepEqual(Object.keys(manifest).sort(), ['generatedAt', 'lektionen', 'level', 'voices']);
});

test('every manifest entry that exists is {url, sha1, voice} on a real curriculum key', () => {
  const keys = new Set(plan.filter((e) => e.lektionId).map((e) => `${e.lektionId}|${e.key}`));
  for (const [lektionId, entries] of Object.entries(manifest.lektionen)) {
    for (const [key, value] of Object.entries(entries)) {
      assert.ok(keys.has(`${lektionId}|${key}`), `manifest has ${lektionId}/${key}, the curriculum does not`);
      assert.deepEqual(Object.keys(value).sort(), ['sha1', 'url', 'voice']);
      assert.match(value.url, /^https?:\/\//);
      assert.match(value.sha1, /^[0-9a-f]{40}$/);
      assert.ok([VOICE_FEMALE, VOICE_MALE].includes(value.voice));
    }
  }
});

test('renderManifest round-trips through the module loader and stays generated-file-shaped', async () => {
  const src = renderManifest({
    level: 'a1.1',
    generatedAt: '2026-09-13T10:00:00.000Z',
    voices: { [VOICE_FEMALE]: 2 },
    lektionen: { 'a1.1-l01': { 'line-0': { url: 'https://x/y.mp3', sha1: sha1('x'), voice: VOICE_FEMALE } } },
  });
  assert.match(src, /GENERATED by scripts\/generate-course-audio\.mjs — do not hand-edit/);
  const mod = await import(`data:text/javascript,${encodeURIComponent(src)}`);
  assert.equal(mod.default.lektionen['a1.1-l01']['line-0'].url, 'https://x/y.mp3');
  assert.equal(mod.default.generatedAt, '2026-09-13T10:00:00.000Z');

  const empty = renderManifest({ level: 'a1.1', generatedAt: null, voices: {}, lektionen: {} });
  const emptyMod = await import(`data:text/javascript,${encodeURIComponent(empty)}`);
  assert.deepEqual(emptyMod.default.lektionen, {});
  assert.equal(emptyMod.default.generatedAt, null);
});

// ── the engine survives the empty manifest ──────────────────────────────────

test('audioFor returns null on the empty manifest and never throws', () => {
  const empty = Object.keys(manifest.lektionen).length === 0;
  if (empty) assert.equal(audioFor('a1.1-l01', 'line-0'), null, 'no manifest entries yet → no URL');
  assert.equal(audioFor('a1.1-l99', 'line-0'), null, 'unknown Lektion');
  assert.equal(audioFor('a1.1-l01', 'nope'), null, 'unknown key');
  assert.equal(audioFor(undefined, 'line-0'), null, 'no Lektion id — the player may not pass one yet');
  assert.equal(audioFor(null, null), null);
  assert.equal(audioFor('b2.2-l01', 'line-0'), null, 'a level with no manifest at all');
  assert.equal(hasRecordings('a1.1'), !empty);
  assert.equal(hasRecordings('A1.1'), !empty, 'levels are matched case-insensitively');
  assert.equal(hasRecordings('b1.1'), false);
  assert.equal(hasRecordings(undefined), false);
});

test('the three playback screens ask the manifest before they synthesise', () => {
  const dialog = read('src/components/lesson/DialogStage.jsx');
  assert.match(dialog, /playLine\(id, `line-\$\{i\}`/, 'DialogStage plays line-<i>');
  assert.match(dialog, /Aufnahme/);
  assert.match(dialog, /Computerstimme/);

  const dictation = read('src/components/lesson/DictationItem.jsx');
  assert.match(dictation, /line-\$\{line\.index\}/, 'the dictation reuses the dialogue line key');
  assert.match(dictation, /playLine\(/);
  assert.match(dictation, /AudioSourceBadge/);

  const pretest = read('src/components/lesson/PretestStage.jsx');
  assert.match(pretest, /playLine\(id, 'pretest'/, 'PretestStage plays the model answer');

  const review = read('src/pages/lesson/ReviewPage.jsx');
  assert.match(review, /line-\$\{parsed\.lineIdx\}/, 'sentence:<lektionId>:<idx> → line-<idx>');
  assert.match(review, /playWord\(/, 'word cards use the words row recording');
  assert.ok(!/new SpeechSynthesisUtterance/.test(review), 'ReviewPage speaks through lib/lesson/speech.js, not its own utterance');
});

test('nothing preloads audio: the badge is text, and no <audio preload> is introduced', () => {
  for (const p of [
    'src/components/lesson/DialogStage.jsx',
    'src/components/lesson/DictationItem.jsx',
    'src/components/lesson/PretestStage.jsx',
    'src/pages/lesson/ReviewPage.jsx',
  ]) {
    const src = read(p);
    assert.ok(!/<audio/.test(src), `${p} must not mount an <audio> element (new Audio(), metadata only)`);
    assert.ok(!/preload=/.test(src), `${p} must not preload audio`);
  }
});

test('the owner instructions name the four env vars and the two runs', () => {
  const doc = read('docs/owner-prompts.md');
  assert.match(doc, /Run the A1\.1 course audio/);
  for (const v of ['AZURE_SPEECH_KEY', 'AZURE_SPEECH_REGION', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    assert.ok(doc.includes(v), `${v} is missing from docs/owner-prompts.md`);
  }
  assert.match(doc, /generate-course-audio\.mjs a1\.1 --dry/);
  assert.match(doc, /sync-curricula\.mjs/);
});
