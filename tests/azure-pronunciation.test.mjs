// Azure Speech pronunciation adapter — plan:
// docs/superpowers/plans/2026-09-15-speaking-guided-city-map.md Task 3.
//
// Pure request-builder and response-normalizer tests (no network). The one
// non-negotiable: pronunciation scores exist ONLY when Azure returned them —
// the adapter can never fabricate them from a transcript.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPronunciationRequest,
  normalizeAzureResponse,
} from '../netlify/functions/_shared/azurePronunciation.mjs';

test('the request carries the documented WAV content type, locale and assessment header', () => {
  const req = buildPronunciationRequest({
    referenceText: 'Ich möchte einen Kaffee, bitte.',
    locale: 'de-DE',
    region: 'westeurope',
    key: 'test-key',
  });
  assert.equal(req.url, 'https://westeurope.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=de-DE&format=detailed');
  assert.equal(req.headers['Content-Type'], 'audio/wav; codecs=audio/pcm; samplerate=16000');
  assert.equal(req.headers['Ocp-Apim-Subscription-Key'], 'test-key');

  const params = JSON.parse(Buffer.from(req.headers['Pronunciation-Assessment'], 'base64').toString('utf8'));
  assert.deepEqual(params, {
    ReferenceText: 'Ich möchte einen Kaffee, bitte.',
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: 'True',
  });
});

test('a successful Azure response normalizes to provider-stamped scores', () => {
  const azure = {
    RecognitionStatus: 'Success',
    NBest: [{
      PronunciationAssessment: { AccuracyScore: 84.2, FluencyScore: 78.4, CompletenessScore: 100 },
      Words: [{
        Word: 'Kaffee',
        PronunciationAssessment: { AccuracyScore: 72.1, ErrorType: 'None' },
        Phonemes: [{ Phoneme: 'a', PronunciationAssessment: { AccuracyScore: 68 } }],
      }],
    }],
  };
  const result = normalizeAzureResponse(azure);
  assert.equal(result.provider, 'azure-speech');
  assert.equal(result.accuracy, 84);
  assert.equal(result.fluency, 78);
  assert.equal(result.completeness, 100);
  assert.deepEqual(result.words, [{ word: 'Kaffee', accuracy: 72, errorType: 'None', phonemes: [{ phoneme: 'a', accuracy: 68 }] }]);
});

test('a provider error or empty recognition yields null, never invented scores', () => {
  assert.equal(normalizeAzureResponse({ RecognitionStatus: 'InitialSilenceTimeout' }), null);
  assert.equal(normalizeAzureResponse({ RecognitionStatus: 'Success', NBest: [] }), null);
  assert.equal(normalizeAzureResponse(null), null);
  assert.equal(normalizeAzureResponse({ RecognitionStatus: 'Success', NBest: [{ Words: [] }] }), null, 'no assessment block → no scores');
});

test('missing per-word data survives without fabrication', () => {
  const azure = {
    RecognitionStatus: 'Success',
    NBest: [{
      PronunciationAssessment: { AccuracyScore: 60, FluencyScore: 55, CompletenessScore: 80 },
      Words: [{ Word: 'bitte' }],
    }],
  };
  const result = normalizeAzureResponse(azure);
  assert.equal(result.accuracy, 60);
  assert.deepEqual(result.words, [], 'a word without an assessment block is dropped, not scored 0');
});

test('the adapter module never derives pronunciation from transcript text', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../netlify/functions/_shared/azurePronunciation.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /transcript/i, 'the adapter must not even see a transcript');
  const turn = readFileSync(new URL('../netlify/functions/speaking-turn.mjs', import.meta.url), 'utf8');
  assert.match(turn, /assessPronunciation\(/, 'the turn function must use the acoustic adapter');
  assert.doesNotMatch(turn, /pronunciation[^\n]*userTranscript|userTranscript[^\n]*pronunciation/i,
    'pronunciation must never be computed from the transcript');
});
