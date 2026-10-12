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

// ---------------------------------------------------------------------------
// PLAYBACK THAT KNOWS WHETHER ANYTHING WAS HEARD (2026-10 review).
//
// `speakGerman` returned true as soon as an utterance was QUEUED, and `playLine` returned
// 'recording' before the clip had loaded — so a browser without a German voice, a muted engine
// or a 404 clip looked exactly like success, and the learner pressed Play on silence. These
// resolve only once sound has actually STARTED (the audio element's `playing` event, the
// utterance's `start` event) and otherwise report why not:
//
//   { ok: true,  source: 'recording' | 'tts' }
//   { ok: false, reason: 'no-speech' }        — no speechSynthesis in this browser
//   { ok: false, reason: 'no-german-voice' }  — speechSynthesis, but no de* voice installed
//   { ok: false, reason: 'did-not-start' }    — the engine accepted the line and never spoke
//   { ok: false, reason: 'error' }
//
// A browser that speaks German through an unnamed default voice is NOT accepted: the existence
// of speechSynthesis is no proof that German comes out of it.

const VOICE_WAIT_MS = 1500;
const START_TIMEOUT_MS = 3000;

/** The voice list, waiting once for `voiceschanged` — the first call often sees an empty list. */
function voicesReady() {
  const synth = window.speechSynthesis;
  const now = synth.getVoices() || [];
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => { synth.removeEventListener?.('voiceschanged', done); resolve(synth.getVoices() || []); };
    synth.addEventListener?.('voiceschanged', done);
    setTimeout(done, VOICE_WAIT_MS);
  });
}

/** Speak German and resolve when speech has started (or why it has not). */
export async function speakGermanChecked(text, { rate = 0.92 } = {}) {
  if (!speechAvailable()) return { ok: false, reason: 'no-speech' };
  if (!text) return { ok: false, reason: 'error' };
  const voices = await voicesReady();
  const voice = voices.find((v) => /^de[-_]DE/i.test(v.lang)) || voices.find((v) => /^de/i.test(v.lang));
  if (!voice) return { ok: false, reason: 'no-german-voice' };
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result) => { if (!settled) { settled = true; resolve(result); } };
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = voice.lang || 'de-DE';
      u.voice = voice;
      u.rate = rate;
      u.onstart = () => settle({ ok: true, source: 'tts' });
      u.onerror = () => settle({ ok: false, reason: 'error' });
      window.speechSynthesis.speak(u);
      setTimeout(() => {
        if (settled) return;
        window.speechSynthesis.cancel();
        settle({ ok: false, reason: 'did-not-start' });
      }, START_TIMEOUT_MS);
    } catch {
      settle({ ok: false, reason: 'error' });
    }
  });
}

/** Play a recording and resolve on `playing`; any failure falls back to checked synthesis. */
export function playRecordingChecked(url, text, { rate = 1 } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const fallback = () => { if (!settled) { settled = true; speakGermanChecked(text, { rate: rate < 1 ? 0.75 : 0.92 }).then(resolve); } };
    try {
      const audio = new Audio(url);
      audio.playbackRate = rate;
      if ('preservesPitch' in audio) audio.preservesPitch = true;
      audio.addEventListener('playing', () => { if (!settled) { settled = true; resolve({ ok: true, source: 'recording' }); } });
      audio.addEventListener('error', fallback);
      audio.play().catch(fallback);
      setTimeout(() => { if (!settled) { audio.pause(); fallback(); } }, START_TIMEOUT_MS + 2000);
    } catch {
      fallback();
    }
  });
}

/**
 * Play a lesson clip — the recording when the manifest has one, else the synthesiser — and
 * resolve once sound has started (or why not). `slow` plays at a beginner pace.
 */
export function playChecked(lektionId, key, text, { rate = 0.92, slow = false } = {}) {
  const url = audioFor(lektionId, key);
  if (url) return playRecordingChecked(url, text, { rate: slow ? 0.75 : 1 });
  return speakGermanChecked(text, { rate: slow ? 0.75 : rate });
}
