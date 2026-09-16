// Azure Speech Pronunciation Assessment adapter — plan Task 3
// (speaking-guided-city-map). The ONLY source a pronunciation score may come
// from (spec §8.2: never inferred from text). Pure request builder and
// response normalizer are exported for tests; assessPronunciation does the
// network call.
//
// Privacy: audio is streamed to Azure and discarded; this module never logs
// headers, audio bytes or recognized text (tests/privacy.test.mjs pins the
// counts-not-content rule; tests/azure-pronunciation.test.mjs pins the rest).

const PROVIDER_TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 10 * 1024 * 1024;

/** Pure: the exact request Azure documents for pronunciation assessment. */
export function buildPronunciationRequest({ referenceText, locale = 'de-DE', region, key }) {
  const params = {
    ReferenceText: referenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: 'True',
  };
  return {
    url: `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}&format=detailed`,
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Pronunciation-Assessment': Buffer.from(JSON.stringify(params), 'utf8').toString('base64'),
      Accept: 'application/json',
    },
  };
}

const round = (n) => (Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null);

/**
 * Pure: normalize Azure's detailed response to the feedback contract's
 * pronunciation shape, or null when Azure produced no usable assessment —
 * null is the honest "unavailable", never a fabricated score.
 */
export function normalizeAzureResponse(json) {
  if (!json || json.RecognitionStatus !== 'Success') return null;
  const best = Array.isArray(json.NBest) ? json.NBest[0] : null;
  const pa = best?.PronunciationAssessment;
  if (!pa) return null;
  const accuracy = round(pa.AccuracyScore);
  const fluency = round(pa.FluencyScore);
  const completeness = round(pa.CompletenessScore);
  if (accuracy == null || fluency == null || completeness == null) return null;
  return {
    provider: 'azure-speech',
    accuracy,
    fluency,
    completeness,
    words: (Array.isArray(best.Words) ? best.Words : [])
      .filter((w) => w?.PronunciationAssessment && Number.isFinite(w.PronunciationAssessment.AccuracyScore))
      .map((w) => ({
        word: String(w.Word || ''),
        accuracy: round(w.PronunciationAssessment.AccuracyScore),
        errorType: w.PronunciationAssessment.ErrorType || 'None',
        phonemes: (Array.isArray(w.Phonemes) ? w.Phonemes : [])
          .filter((p) => p?.PronunciationAssessment && Number.isFinite(p.PronunciationAssessment.AccuracyScore))
          .map((p) => ({ phoneme: String(p.Phoneme || ''), accuracy: round(p.PronunciationAssessment.AccuracyScore) })),
      })),
  };
}

/**
 * Assess one WAV clip against a reference text. Returns the normalized shape
 * or null on any provider/config failure — the caller keeps task/language
 * feedback flowing and renders pronunciation as unavailable.
 */
export async function assessPronunciation({ wavBuffer, referenceText, locale = 'de-DE' }) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return null;
  if (!wavBuffer || wavBuffer.length === 0 || wavBuffer.length > MAX_BODY_BYTES) return null;
  if (!referenceText || typeof referenceText !== 'string' || referenceText.length > 500) return null;

  const { url, headers } = buildPronunciationRequest({ referenceText, locale, region, key });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'POST', headers, body: wavBuffer, signal: controller.signal });
    if (!res.ok) {
      console.warn('[azure-pronunciation] provider status', res.status);
      return null;
    }
    return normalizeAzureResponse(await res.json());
  } catch (err) {
    console.warn('[azure-pronunciation] provider unavailable:', err.name);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
