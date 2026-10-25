// The listening transcript under every result (src/components/listening/DialogueTranscript.jsx).
//
// The live public.listening_dialogues has no per-line columns: id, exercise_id, dialogue_number,
// title, transcript (jsonb), audio_url, duration_seconds, created_at — and `transcript` is an array
// of lines like { "text": "Entschuldigung, was kostet das Brot?", "speaker": "male" } (checked
// against the live database on 2026-10-25; tests/fixtures/db-schema.json lists the same columns).
// The component read german_text / english_text / speaker, which do not exist, so "Transkript
// anzeigen" opened rows of "Speaker N:" with no text.
//
// The rule: the lines come from `transcript` — each with a label for its voice and its text —
// under the dialogue's title; a missing or malformed transcript renders no empty lines; the old
// one-line fields are only a fallback when a row really carries them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/components/listening/DialogueTranscript.jsx', import.meta.url), 'utf8');
const helper = source.match(/function transcriptLines\([\s\S]*?\n\}\n/)?.[0];
const schema = JSON.parse(readFileSync(new URL('./fixtures/db-schema.json', import.meta.url), 'utf8'));

/** The component's own transcriptLines(), results copied out of the VM realm. */
function linesOf(dialogue, isGerman = true) {
  assert.ok(helper, 'DialogueTranscript derives each dialogue\'s lines in transcriptLines()');
  const fn = runInNewContext(`(${helper.trim()})`);
  return JSON.parse(JSON.stringify(fn(dialogue, isGerman)));
}

const liveRow = {
  id: 'd2',
  exercise_id: '523edbeb-4eb4-4dad-a5f4-d432569085e8',
  dialogue_number: 2,
  title: 'Im Supermarkt',
  transcript: [
    { text: 'Entschuldigung, was kostet das Brot?', speaker: 'male' },
    { text: 'Das Brot kostet zwei Euro fünfzig.', speaker: 'female' },
    { text: 'Danke schön.', speaker: 'male' },
  ],
  audio_url: null,
  duration_seconds: 21,
};

test('a live row renders its transcript lines, each labelled with its voice', () => {
  assert.deepEqual(linesOf(liveRow), [
    { label: 'Sprecher A', text: 'Entschuldigung, was kostet das Brot?', translation: null },
    { label: 'Sprecherin B', text: 'Das Brot kostet zwei Euro fünfzig.', translation: null },
    { label: 'Sprecher A', text: 'Danke schön.', translation: null },
  ]);
  // Letters follow the order the voices first speak in, per dialogue.
  const herFirst = { transcript: [{ text: 'Guten Tag!', speaker: 'female' }, { text: 'Hallo!', speaker: 'Male' }] };
  assert.deepEqual(linesOf(herFirst).map((l) => l.label), ['Sprecherin A', 'Sprecher B']);
  assert.deepEqual(linesOf(liveRow, false).map((l) => l.label), ['Speaker A', 'Speaker B', 'Speaker A']);
  // An unknown voice value never shows a raw code.
  assert.deepEqual(linesOf({ transcript: [{ text: 'Achtung, bitte.', speaker: 'narrator' }] }).map((l) => l.label), ['Person A']);
});

test('a missing or malformed transcript renders no empty lines', () => {
  for (const transcript of [null, undefined, {}, 42, '', '   ', [], [{}], [{ speaker: 'male' }], [{ text: '  ', speaker: 'female' }], [null]]) {
    assert.deepEqual(linesOf({ dialogue_number: 1, transcript }), [], `transcript ${JSON.stringify(transcript)}`);
  }
  // A JSON string is read like the jsonb array; plain text becomes one unlabelled line.
  assert.deepEqual(linesOf({ transcript: JSON.stringify(liveRow.transcript) }).map((l) => l.text), liveRow.transcript.map((l) => l.text));
  assert.deepEqual(linesOf({ transcript: 'Hallo, wie geht es Ihnen?' }), [{ label: null, text: 'Hallo, wie geht es Ihnen?', translation: null }]);
  // Bare strings in the array are lines without a voice.
  assert.deepEqual(linesOf({ transcript: ['Erste Zeile', { text: 'Zweite Zeile', speaker: 'male' }] }).map((l) => [l.label, l.text]), [[null, 'Erste Zeile'], ['Sprecher A', 'Zweite Zeile']]);
});

test('the old one-line fields are only a fallback, used when a row really carries them', () => {
  assert.deepEqual(linesOf({ dialogue_number: 3, speaker: 'Anna', german_text: 'Ich heiße Anna.', english_text: 'My name is Anna.' }), [
    { label: 'Anna', text: 'Ich heiße Anna.', translation: 'My name is Anna.' },
  ]);
  // The live transcript wins over stray legacy fields.
  assert.equal(linesOf({ ...liveRow, german_text: 'veraltet' })[0].text, 'Entschuldigung, was kostet das Brot?');
});

test('the component renders titles and lines from transcriptLines, never the missing columns directly', () => {
  // The schema the rule is written against: the live table has `transcript`, and none of the old columns.
  const columns = schema.tables.listening_dialogues;
  assert.ok(columns.includes('transcript') && columns.includes('title'));
  for (const gone of ['german_text', 'english_text', 'speaker']) assert.ok(!columns.includes(gone), `${gone} is not a live column`);

  const component = source.slice(source.indexOf('const DialogueTranscript = '));
  assert.match(component, /transcriptLines\(dialogue, isGerman\)/);
  assert.match(component, /dialogue\.title/);
  assert.match(component, /\{line\.text\}/);
  assert.match(component, /\{line\.label\}:/);
  assert.doesNotMatch(component, /german_text|english_text|dialogue\.speaker/, 'the legacy fields are read only inside transcriptLines');
  assert.match(component, /if \(scenes\.length === 0\) return null;/, 'no toggle that opens onto an empty card');
});
