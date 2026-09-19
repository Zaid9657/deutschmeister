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
/**
 * The Phonetik items are written for the EYE — syllable hyphens and a
 * capitalised stressed syllable ("HAL-lo", "Te-le-FON"), plus the melody arrows
 * of the question items ("Hast du ZEIT?↗"). Spoken back literally, a TTS engine
 * says "H-A-L dash lo". So the display text stays exactly as authored and only
 * the SPEECH text is normalised: arrows dropped, syllable hyphens closed up,
 * the shouted syllable returned to ordinary case.
 *
 * Moved here from scripts/generate-course-audio.mjs (which now imports it)
 * because PhonetikStage.jsx needs it at runtime for the "play" button's
 * `playLine(lektionId, 'phonetik-<i>', speechText)` call, and the script must
 * stay a read-only reference per the lesson-engine agent's file ownership.
 *
 * German TTS is effectively case-insensitive for pronunciation, so the
 * capitalisation this produces ("Der Bruder", "Ich bin") is cosmetic — what
 * matters is that no hyphen and no arrow survives into the SSML / utterance.
 */
export function phonetikSpeechText(display) {
  const cleaned = String(display || '')
    .replace(/[↗↘➚➘]/g, ' ')
    .replace(/(\p{L})-(\p{L})/gu, '$1$2') // HAL-lo → HALlo, Te-le-FON → TeleFON
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').map((w) => {
    if (!w) return w;
    if (w === w.toUpperCase() && w !== w.toLowerCase()) return w.toLowerCase(); // BIN → bin
    return w[0] + w.slice(1).toLowerCase(); // HALlo → Hallo, TeleFON → Telefon
  });
  const out = words.join(' ');
  return out ? out[0].toUpperCase() + out.slice(1) : out;
}

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
