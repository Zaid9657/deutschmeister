// Guard suite for read-aloud scoring (plan P3, "Scored speaking").
//
// What each pin defends:
//
//   1. THE ALIGNMENT IS ABOUT THE EXPECTED LINE. The learner sees their own
//      sentence marked word by word, so `words` must carry the expected line's
//      spelling, in its order, one entry per word — never the transcript's.
//   2. NORMALISATION. Umlauts and ß arrive from the STT in either spelling, and
//      a learner reads "25" aloud as a word. A learner must not lose a word
//      because of a transcription convention.
//   3. THE TYPO ALLOWANCE IS BOUNDED. One edit is forgiven on words of five
//      letters or more only; on a short function word a one-letter difference
//      is a different word ("dir" / "der"), and forgiving it would inflate
//      every score.
//   4. PARTIAL READS. Stopping halfway must mark exactly what was said, and an
//      empty transcript must score 0 — not crash, and not credit anything.
//   5. THE TWO COPIES AGREE. The function scores with a byte-identical copy of
//      this module; two copies of the arithmetic that drift would mark the same
//      clip differently on the same screen.
//   6. THE DAILY CAP IS THE ONE THE CLAIMS TEST PARSES, and it is counted from
//      lesson_attempts — the table the row is written to, so there is no second
//      counter to fall out of step.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  alignTranscript,
  germanNumberWord,
  normalizeToken,
  tokenize,
  tokensMatch,
  READALOUD_PASS_PCT,
} from '../src/lib/lesson/readaloud.js';

const hits = (r) => r.words.filter((w) => w.hit).map((w) => w.word);
const misses = (r) => r.words.filter((w) => !w.hit).map((w) => w.word);

// ── 1. the shape ────────────────────────────────────────────────────────────

test('a perfect read marks every word and scores 1', () => {
  const r = alignTranscript('Guten Tag, ich heiße Ana.', 'Guten Tag ich heiße Ana');
  assert.deepEqual(r.words.map((w) => w.word), ['Guten', 'Tag,', 'ich', 'heiße', 'Ana.']);
  assert.ok(r.words.every((w) => w.hit));
  assert.equal(r.pct, 1);
});

test('words keep the expected line, not the transcript', () => {
  const r = alignTranscript('Ich komme aus Marokko', 'ich komme aus marokko und wohne in berlin');
  assert.equal(r.words.length, 4, 'extra words the learner said add no entries');
  assert.equal(r.pct, 1);
});

test('punctuation is never a miss and never its own word', () => {
  const r = alignTranscript('Wie geht es dir?', 'Wie geht es dir');
  assert.equal(r.words.length, 4);
  assert.equal(r.pct, 1);
});

// ── 2. normalisation ────────────────────────────────────────────────────────

test('umlauts and ß count in either spelling', () => {
  assert.equal(normalizeToken('heiße'), 'heisse');
  assert.equal(normalizeToken('Müller,'), 'mueller');
  const r = alignTranscript('Ich heiße Jürgen Müller', 'ich heisse Juergen Mueller');
  assert.equal(r.pct, 1);
});

test('a number written as digits matches the number spoken as a word', () => {
  assert.equal(germanNumberWord(25), 'fuenfundzwanzig');
  assert.equal(germanNumberWord(1), 'eins');
  assert.equal(germanNumberWord(21), 'einundzwanzig');
  assert.equal(germanNumberWord(30), 'dreissig');
  assert.equal(germanNumberWord(100), 'hundert');
  assert.equal(germanNumberWord(101), null, 'outside 0–100 there is no word form');

  const r = alignTranscript('Ich bin 25 Jahre alt', 'Ich bin fünfundzwanzig Jahre alt');
  assert.equal(r.pct, 1);
  assert.deepEqual(misses(r), []);
});

test('tokenize drops empty tokens and keeps the raw spelling', () => {
  assert.deepEqual(tokenize('  Guten   Tag!  ').map((t) => t.raw), ['Guten', 'Tag!']);
  assert.deepEqual(tokenize('— …').map((t) => t.raw), [], 'punctuation-only tokens are not words');
  assert.deepEqual(tokenize(''), []);
});

// ── 3. the bounded typo allowance ───────────────────────────────────────────

test('one edit is forgiven from five letters up, never below', () => {
  assert.equal(tokensMatch('marokko', 'marokke'), true);
  assert.equal(tokensMatch('heisse', 'heissa'), true);
  assert.equal(tokensMatch('der', 'dir'), false, 'a short function word has no tolerance');
  assert.equal(tokensMatch('aus', 'auf'), false);
  assert.equal(tokensMatch('marokko', 'marotte'), false, 'two edits is a different word');
});

// ── 4. partial reads and nothing at all ─────────────────────────────────────

test('a partial read marks exactly the words that were said', () => {
  const r = alignTranscript('Ich wohne in Berlin und arbeite hier', 'ich wohne in Berlin');
  assert.deepEqual(hits(r), ['Ich', 'wohne', 'in', 'Berlin']);
  assert.deepEqual(misses(r), ['und', 'arbeite', 'hier']);
  assert.equal(r.pct, 0.57);
});

test('a word swapped in the middle is the only miss', () => {
  const r = alignTranscript('Ich komme aus Spanien', 'ich komme aus Italien');
  assert.deepEqual(misses(r), ['Spanien']);
  assert.equal(r.pct, 0.75);
});

test('an empty or unintelligible transcript scores 0 and still lists the words', () => {
  for (const heard of ['', '   ', null, undefined]) {
    const r = alignTranscript('Guten Morgen', heard);
    assert.equal(r.pct, 0);
    assert.equal(r.words.length, 2);
    assert.ok(r.words.every((w) => !w.hit));
  }
});

test('an empty expected line is not a division by zero', () => {
  const r = alignTranscript('', 'irgendwas');
  assert.deepEqual(r, { words: [], pct: 0 });
});

test('the pass threshold is a fraction, not a percentage', () => {
  assert.ok(READALOUD_PASS_PCT > 0 && READALOUD_PASS_PCT <= 1);
  assert.equal(READALOUD_PASS_PCT, 0.8);
});

// ── 5. the two copies ───────────────────────────────────────────────────────

test('the function scores with a byte-identical copy of this module', () => {
  const client = readFileSync(new URL('../src/lib/lesson/readaloud.js', import.meta.url), 'utf8');
  const server = readFileSync(new URL('../netlify/functions/_shared/readaloud.mjs', import.meta.url), 'utf8');
  assert.equal(client, server, 'run scripts/check-duplicates.mjs — these two must not drift');
  assert.ok(!/^import /m.test(client), 'the pair stays dependency-free so it can be copied verbatim');
});

// ── 6. the function's contract ──────────────────────────────────────────────

const FN = readFileSync(new URL('../netlify/functions/score-readaloud.mjs', import.meta.url), 'utf8');

test('the daily clip cap is 60, named so the claims test can parse it', () => {
  const match = FN.match(/const READALOUD_DAILY_LIMIT = (\d+);/);
  assert.ok(match, 'the constant must be a plain literal, not computed');
  assert.equal(Number(match[1]), 60);
});

test('the cap is counted from the same lesson_attempts rows the function writes', () => {
  assert.match(FN, /from\('lesson_attempts'\)/);
  assert.match(FN, /\.eq\('stage', 'readaloud'\)/, 'counted by stage');
  assert.match(FN, /stage: 'readaloud'/, 'and written with the same stage');
  assert.match(FN, /setUTCHours\(0, 0, 0, 0\)/, 'the window is today, from midnight UTC');
  assert.match(FN, /statusCode: 429/);
});

test('identity comes from the JWT, never from the body, and secrets fail closed', () => {
  assert.match(FN, /getAuthenticatedUserId\(event\)/);
  assert.match(FN, /unauthorizedResponse\(headers\)/);
  assert.ok(!/body\.user_id|\buser_id\s*[,}]\s*=\s*JSON/.test(FN), 'no user id is read from the request body');
  assert.match(FN, /if \(!process\.env\.OPENAI_API_KEY\)/, 'no key → 500, never a fake score');
  assert.match(FN, /Access-Control-Allow-Origin/, 'CORS preamble per file');
});

test('the function transcribes only — no LLM and no TTS on this path', () => {
  assert.match(FN, /transcribeAudio/);
  assert.ok(!/teacherReply|synthesizeSpeech/.test(FN));
});

test('oversized input is rejected before it reaches the provider', () => {
  assert.match(FN, /MAX_EXPECTED_CHARS = 200/);
  assert.match(FN, /MAX_AUDIO_BYTES = 1_500_000/);
  assert.match(FN, /statusCode: 413/);
});

test('a miss is logged with the Aussprache tag', () => {
  assert.match(FN, /error_tag: correct \? null : 'Aussprache'/);
});
