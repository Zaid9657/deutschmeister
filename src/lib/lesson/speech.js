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

// ---------------------------------------------------------------------------
// Who is talking (CRITIC-01). There is one voice at a time: every start stops whatever was
// playing (synthesiser queue AND a recording) and takes a new `turn`. A screen that started sound
// remembers its turn (speechTurn() right after the play call) and, when it goes away — the learner
// taps X, „Weiter", the next card — calls stopSpeech(thatTurn): the sound stops only if it is still
// that screen's, so a screen that unmounts late never silences the next screen's voice. The course
// player's hook for this is useV2Playback (src/components/course-v2/content.js).
// ---------------------------------------------------------------------------

let turn = 0;
let currentAudio = null;

/** The turn of the sound playing now (or of the last one started). */
export const speechTurn = () => turn;

function halt() {
  try {
    if (speechAvailable()) window.speechSynthesis.cancel();
  } catch {
    /* nothing to stop */
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* already gone */
    }
    currentAudio = null;
  }
}

/** A new sound starts: whatever played stops, and the new one owns the next turn. */
function begin() {
  halt();
  turn += 1;
  return turn;
}

/**
 * Stop the sound. With `onlyTurn`, only when that turn is still the one playing (the owner
 * leaving); without it, whatever plays. Returns true when it stopped something it owned.
 */
export function stopSpeech(onlyTurn) {
  if (onlyTurn !== undefined && onlyTurn !== null && onlyTurn !== turn) return false;
  halt();
  turn += 1;
  return true;
}

function utter(text, rate) {
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = 'de-DE';
  utterance.rate = rate;
  const voice = germanVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

/** Speak one German line. Returns false when the browser cannot. */
export function speakGerman(text, { rate = 0.92 } = {}) {
  if (!speechAvailable() || !text) return false;
  try {
    begin();
    utter(text, rate);
    return true;
  } catch {
    return false;
  }
}

/** Speak several German lines one after the other (the synthesiser queues them) as ONE turn. */
export function speakGermanLines(texts, { rate = 0.92 } = {}) {
  const list = (Array.isArray(texts) ? texts : []).map((x) => String(x || '')).filter(Boolean);
  if (!speechAvailable() || !list.length) return false;
  try {
    begin();
    for (const text of list) utter(text, rate);
    return true;
  } catch {
    return false;
  }
}

/**
 * Play a recording as the new turn; if the browser refuses it, synthesise `text` instead — but only
 * while the turn is still this one (a pause() from stopSpeech rejects play() too, and a stopped
 * screen must stay silent). Returns false when there is no recording to try.
 */
function playRecording(url, text, opts) {
  try {
    const mine = begin();
    const audio = new Audio(url);
    currentAudio = audio;
    const fallback = () => {
      if (turn !== mine) return;
      currentAudio = null;
      try {
        if (speechAvailable() && text) utter(text, (opts && opts.rate) || 0.92);
      } catch {
        /* no voice either */
      }
    };
    const started = audio.play();
    if (started && typeof started.catch === 'function') started.catch(fallback);
    return true;
  } catch {
    return false;
  }
}

/** Prefer a real recording, fall back to the synthesiser. */
export function playWord(audioUrl, text) {
  if (audioUrl && playRecording(audioUrl, text)) return true;
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
  if (url && playRecording(url, text, opts)) return 'recording';
  return speakGerman(text, opts) ? 'tts' : false;
}
