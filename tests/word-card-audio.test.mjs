// The example-sentence speaker on a vocabulary card (X-083).
//
// words.audio_url is a recording of the HEADWORD (scripts/generate-example-audio.mjs:
// words.german + article). WordCard's one speak handler played that recording
// whenever a word had one and ignored the text it was given, so the speaker next
// to the example sentence played the single word — 230 of the 263 A1.1 Wortfeld
// words have a recording, so that was most cards. The headword button may play the
// recording; the example is always spoken by the synthesiser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/components/WordCard.jsx', import.meta.url), 'utf8');

/** WordCard's speak handlers, run against stand-ins for Audio and speechSynthesis. */
function speakers(word) {
  const start = source.indexOf('  const speakWord = ');
  const end = source.indexOf('  const toggleLearned = ');
  assert.ok(start > 0 && end > start, 'the speak handlers sit together before toggleLearned');
  const log = { recordings: [], spoken: [] };
  const context = {
    word,
    Audio: function Audio(url) { log.recordings.push(url); this.play = () => Promise.resolve(); },
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance(text) { this.text = text; },
    speechSynthesis: { speak: (u) => log.spoken.push(u.text) },
  };
  context.window = context;
  const handlers = runInNewContext(`(() => { ${source.slice(start, end)} return { speakWord, speakExample }; })()`, context);
  return { ...handlers, log };
}

test('the example speaker speaks the sentence, even for a word with a recording', () => {
  const word = { word: 'Tisch', example: 'Der Tisch ist neu.', audioUrl: 'https://cdn.example/audio/words/tisch.mp3' };
  const { speakExample, log } = speakers(word);
  speakExample();
  assert.deepEqual(log.recordings, [], 'the headword recording is not played for the example');
  assert.deepEqual(log.spoken, ['Der Tisch ist neu.']);
});

test('the headword speaker still prefers the recording, and synthesises the word without one', async () => {
  const recorded = speakers({ word: 'Tisch', example: 'Der Tisch ist neu.', audioUrl: 'https://cdn.example/audio/words/tisch.mp3' });
  recorded.speakWord();
  assert.deepEqual(recorded.log.recordings, ['https://cdn.example/audio/words/tisch.mp3']);
  assert.deepEqual(recorded.log.spoken, []);
  const synthetic = speakers({ word: 'Stuhl', example: 'Der Stuhl ist alt.', audioUrl: '' });
  synthetic.speakWord();
  assert.deepEqual(synthetic.log.spoken, ['Stuhl']);
  assert.match(source, /onClick=\{speakWord\}/);
  assert.match(source, /onClick=\{speakExample\}/);
});
