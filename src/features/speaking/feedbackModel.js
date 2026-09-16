// Guided feedback contract — the ONLY door server feedback passes through on
// its way to the UI. Three separate signals (task / language / acoustic
// pronunciation) stay separate; a composite score does not exist here.
//
// Hard rules (tests/speaking-feedback-contract.test.mjs):
//   * unknown properties are DROPPED — nothing unvalidated can reach a
//     renderer (React escapes text, but the contract does not rely on it);
//   * scores are integers 0–100 or the payload throws;
//   * pronunciation must carry provider evidence ('azure-speech') or be
//     null (honestly unavailable) — a transcript-derived estimate can never
//     wear the pronunciation label.

const MAX_TRANSCRIPT_CHARS = 5000;
const MAX_TEXT_CHARS = 2000;
const ACOUSTIC_PROVIDERS = new Set(['azure-speech']);

export class FeedbackContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FeedbackContractError';
  }
}

const fail = (msg) => { throw new FeedbackContractError(msg); };

const asBoundedString = (value, field, max = MAX_TEXT_CHARS, { optional = false } = {}) => {
  if (value == null) {
    if (optional) return null;
    fail(`${field} missing`);
  }
  if (typeof value !== 'string') fail(`${field} must be a string`);
  if (value.length > max) fail(`${field} exceeds ${max} characters`);
  return value;
};

const asScore = (value, field) => {
  if (!Number.isFinite(value) || value < 0 || value > 100) fail(`${field} out of range: ${value}`);
  return Math.round(value);
};

function normalizePronunciation(p) {
  if (p == null) return null; // honestly unavailable — the UI says so
  if (typeof p !== 'object' || Array.isArray(p)) fail('pronunciation must be an object or null');
  if (!ACOUSTIC_PROVIDERS.has(p.provider)) {
    fail(`pronunciation without acoustic provider evidence (got: ${p.provider ?? 'none'})`);
  }
  return {
    provider: p.provider,
    accuracy: asScore(p.accuracy, 'pronunciation.accuracy'),
    fluency: asScore(p.fluency, 'pronunciation.fluency'),
    completeness: asScore(p.completeness, 'pronunciation.completeness'),
    words: (Array.isArray(p.words) ? p.words : []).map((w, i) => ({
      word: asBoundedString(w?.word, `pronunciation.words[${i}].word`, 100),
      accuracy: asScore(w?.accuracy, `pronunciation.words[${i}].accuracy`),
      phonemes: (Array.isArray(w?.phonemes) ? w.phonemes : []).map((ph, j) => ({
        phoneme: asBoundedString(ph?.phoneme, `…words[${i}].phonemes[${j}].phoneme`, 20),
        accuracy: asScore(ph?.accuracy, `…words[${i}].phonemes[${j}].accuracy`),
      })),
    })),
  };
}

export function normalizeGuidedFeedback(payload) {
  if (!payload || typeof payload !== 'object') fail('feedback payload missing');
  const task = payload.task;
  if (!task || typeof task !== 'object') fail('task missing');
  if (typeof task.passed !== 'boolean') fail('task.passed missing');

  return {
    transcript: asBoundedString(payload.transcript, 'transcript', MAX_TRANSCRIPT_CHARS, { optional: true }),
    reply: {
      text: asBoundedString(payload.reply?.text, 'reply.text'),
      audioBase64: asBoundedString(payload.reply?.audioBase64, 'reply.audioBase64', 10 * 1024 * 1024, { optional: true }),
    },
    task: {
      passed: task.passed,
      completedCriteria: (Array.isArray(task.completedCriteria) ? task.completedCriteria : [])
        .map((c, i) => asBoundedString(c, `task.completedCriteria[${i}]`, 200)),
      nextGoal: asBoundedString(task.nextGoal, 'task.nextGoal', 500, { optional: true }),
    },
    language: {
      bestVersion: asBoundedString(payload.language?.bestVersion, 'language.bestVersion', MAX_TRANSCRIPT_CHARS, { optional: true }),
      tip: asBoundedString(payload.language?.tip, 'language.tip', 1000, { optional: true }),
    },
    pronunciation: normalizePronunciation(payload.pronunciation),
  };
}
