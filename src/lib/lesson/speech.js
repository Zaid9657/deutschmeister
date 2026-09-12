// Dialogue audio, v1. The Wortfeld words have real recordings (words.audio_url);
// the dialogue lines do not yet, so they are spoken by the browser with a de-DE
// voice until the Azure TTS run lands (standard §6 phase 5). Sound is NEVER the
// only channel: every caller shows the text as well.

export const speechAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** A German voice if the platform has one; undefined lets the engine choose. */
export function germanVoice() {
  if (!speechAvailable()) return undefined;
  const voices = window.speechSynthesis.getVoices() || [];
  return voices.find((v) => /^de[-_]DE/i.test(v.lang)) || voices.find((v) => /^de/i.test(v.lang));
}

/** Speak one German line. Returns false when the browser cannot. */
export function speakGerman(text, { rate = 0.92 } = {}) {
  if (!speechAvailable() || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = 'de-DE';
    utterance.rate = rate;
    const voice = germanVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/** Prefer a real recording, fall back to the synthesiser. */
export function playWord(audioUrl, text) {
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speakGerman(text));
      return true;
    } catch {
      /* fall through to synthesis */
    }
  }
  return speakGerman(text);
}

// ---------------------------------------------------------------------------
// Recorded course audio (plan P1). scripts/generate-course-audio.mjs renders
// every dialogue line, pretest model, phonetics item and checkpoint dictation
// with Azure Neural TTS, uploads to Supabase Storage (bucket `audio`,
// `course/<level>/<lektion>/<key>.mp3`) and writes the public URLs into the
// committed manifest src/data/curricula/<level>.audio.js. Callers ask
// `audioFor(lektionId, key)` and fall back to the synthesiser when null.
// Keys: `line-<i>` (dialog.lines index), `pretest`, `phonetik-<i>`,
// `word-<wordId>` is NOT here (words carry their own audio_url).
import a11Audio from '../../data/curricula/a11.audio.js';

const MANIFESTS = { 'a1.1': a11Audio };

export function audioFor(lektionId, key) {
  const level = String(lektionId || '').split('-')[0];
  const m = MANIFESTS[level];
  const entry = m?.lektionen?.[lektionId]?.[key];
  return entry?.url || null;
}

/** True when the level has at least one recorded line (drives the "Aufnahme" badge). */
export const hasRecordings = (level) => Object.keys(MANIFESTS[String(level || '').toLowerCase()]?.lektionen || {}).length > 0;

/** Play a recorded line if the manifest has it, else synthesise. Returns 'recording' | 'tts' | false. */
export function playLine(lektionId, key, text, opts) {
  const url = audioFor(lektionId, key);
  if (url) {
    try {
      const audio = new Audio(url);
      audio.play().catch(() => speakGerman(text, opts));
      return 'recording';
    } catch {
      /* fall through */
    }
  }
  return speakGerman(text, opts) ? 'tts' : false;
}
