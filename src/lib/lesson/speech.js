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

/** The turn of the sound playing now (or of the last one started). */
export const speechTurn = () => turn;

// ---------------------------------------------------------------------------
// ONE <audio> element plays every recording (owner 2026-10-01: "the voices are not working").
// iOS Safari and in-app browsers let a page play sound only from an element a tap has already
// started; a fresh `new Audio()` per line is refused as soon as it is not inside the tap (the
// next line of a dialogue, a word card that speaks when it appears). So the element is shared,
// re-pointed for every clip, and unlocked by the learner's first tap anywhere (primeAudio).
// ---------------------------------------------------------------------------

let player = null;
let detachPlayer = null; // removes the current turn's ended/error listeners
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

function sharedPlayer() {
  if (typeof Audio === 'undefined') return null;
  if (!player) {
    try {
      player = new Audio();
      player.preload = 'auto';
      if ('preservesPitch' in player) player.preservesPitch = true;
    } catch {
      player = null;
    }
  }
  return player;
}

function halt({ hard = true } = {}) {
  // The synthesiser: an explicit stop always cancels; a new start cancels only what is actually
  // queued — Safari drops (and Chrome on some phones swallows) an utterance spoken right after a
  // cancel() of an idle queue, which is how a tap could stay silent.
  try {
    if (speechAvailable()) {
      const ss = window.speechSynthesis;
      if (hard || ss.speaking || ss.pending) ss.cancel();
    }
  } catch {
    /* nothing to stop */
  }
  if (detachPlayer) {
    detachPlayer();
    detachPlayer = null;
  }
  if (player) {
    try {
      player.pause();
    } catch {
      /* already stopped */
    }
  }
}

/** A new sound starts: whatever played stops, and the new one owns the next turn. */
function begin() {
  halt({ hard: false });
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
  const ss = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = 'de-DE';
  utterance.rate = rate;
  const voice = germanVoice();
  if (voice) utterance.voice = voice;
  // Chrome on Android can leave the queue paused after a page change; a paused queue never speaks.
  if (ss.paused && typeof ss.resume === 'function') ss.resume();
  ss.speak(utterance);
}

/** The synthesiser's rate (0.92 = normal course pace) as a playback rate for a recording. */
export const clipRate = (rate) => {
  const r = Number(rate);
  if (!Number.isFinite(r) || r <= 0) return 1;
  return Math.round(Math.min(1.25, Math.max(0.6, r / 0.92)) * 100) / 100;
};

/**
 * Play recordings one after the other as ONE turn — `clips` = [{ url, text }]. A clip the browser
 * cannot fetch or play hands that clip and the rest to the synthesiser (still this turn only), so a
 * failing server is never worse than the browser voice alone. Returns false when nothing can play.
 */
export function playClips(clips, { rate = 0.92 } = {}) {
  const list = (Array.isArray(clips) ? clips : []).filter((c) => c && (c.url || c.text));
  if (!list.length) return false;
  const el = sharedPlayer();
  if (!el) return speakGermanLines(list.map((c) => c.text), { rate });
  const mine = begin();
  const speed = clipRate(rate);
  let at = 0;
  let fellBack = false;
  const fallback = () => {
    if (turn !== mine || fellBack) return;
    fellBack = true;
    if (detachPlayer) {
      detachPlayer();
      detachPlayer = null;
    }
    const rest = list.slice(Math.max(0, at - 1)).map((c) => c.text).filter(Boolean);
    if (!speechAvailable() || !rest.length) return;
    try {
      for (const text of rest) utter(text, rate);
    } catch {
      /* no voice either */
    }
  };
  const next = () => {
    if (turn !== mine || fellBack) return;
    if (at >= list.length) {
      if (detachPlayer) {
        detachPlayer();
        detachPlayer = null;
      }
      return;
    }
    const clip = list[at];
    at += 1;
    if (!clip.url) {
      fallback();
      return;
    }
    try {
      el.defaultPlaybackRate = speed;
      el.src = clip.url;
      el.playbackRate = speed;
      const started = el.play();
      if (started && typeof started.catch === 'function') started.catch(fallback);
    } catch {
      fallback();
    }
  };
  const onEnded = () => next();
  const onError = () => fallback();
  el.addEventListener('ended', onEnded);
  el.addEventListener('error', onError);
  detachPlayer = () => {
    el.removeEventListener('ended', onEnded);
    el.removeEventListener('error', onError);
  };
  next();
  return true;
}

let primed = false;
/** Unlock the shared element with a silent clip on the learner's first tap (iOS, in-app browsers). */
export function primeAudio() {
  if (primed) return;
  const el = sharedPlayer();
  if (!el) return;
  primed = true;
  if (!el.paused || (el.src && el.src !== SILENT_WAV)) return;
  try {
    el.src = SILENT_WAV;
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    /* nothing to unlock */
  }
}

if (typeof document !== 'undefined' && document.addEventListener) {
  const once = () => {
    document.removeEventListener('pointerdown', once, true);
    document.removeEventListener('keydown', once, true);
    primeAudio();
  };
  document.addEventListener('pointerdown', once, true);
  document.addEventListener('keydown', once, true);
}
// Voices load late on Chrome and Android; ask once so germanVoice() finds one on the first tap.
try {
  if (speechAvailable() && typeof window.speechSynthesis.getVoices === 'function') window.speechSynthesis.getVoices();
} catch {
  /* no voices to warm */
}

const warmed = new Set();
/**
 * Ask for clips before they are tapped, so a recording the server renders on first request is
 * ready by the time the learner presses play. Fire-and-forget, deduplicated, capped per page.
 */
export function warmClips(urls) {
  if (typeof fetch !== 'function') return;
  for (const url of Array.isArray(urls) ? urls : []) {
    if (!url || warmed.has(url) || warmed.size >= 600) continue;
    warmed.add(url);
    try {
      const p = fetch(url, { mode: 'no-cors', credentials: 'omit', priority: 'low' });
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      /* warming is best effort */
    }
  }
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
  if (!url) return false;
  return playClips([{ url, text }], { rate: (opts && opts.rate) || 0.92 });
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
