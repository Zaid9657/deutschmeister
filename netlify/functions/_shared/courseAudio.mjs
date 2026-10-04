// Course v2 audio, rendered on the server (owner 2026-10-01: "the voices are not working").
//
// WHY: until now every course-v2 speaker button used the browser's own speech synthesiser. On
// many phones that voice is missing, silent after a cancel(), or absent in in-app browsers
// (Telegram, Instagram), so learners heard nothing. A recording plays everywhere a web page can
// play an <audio>, so each speakable is rendered ONCE with OpenAI TTS, stored in the public
// Supabase Storage bucket `audio`, and served from there to every later learner.
//
// WHAT CAN BE SPOKEN: only a text from netlify/functions/_shared/course-v2/<level>.speak.json
// (scripts/course-v2/build-speakables.mjs), looked up by the id the player already uses. The
// client never sends text, so the endpoint is not a free TTS proxy and the bill is bounded by
// the course's own content (A1.1: 1,594 texts, rendered once).
//
// WHERE IT IS STORED: audio/course-v2/<level>/<id>.<hash>.mp3, the hash covering model, voice,
// instructions and text — an edited line or a new voice gets a new file instead of a stale one,
// which is also why the object can be cached for a year.
import { createHash } from 'node:crypto';
import { readCourseV2Json } from './rubrics/data.mjs';

export const TTS_MODEL = 'gpt-4o-mini-tts';
export const AUDIO_BUCKET = 'audio';
export const AUDIO_PREFIX = 'course-v2';
/** The levels the endpoint renders. A1.1 is the course under evaluation; the held drafts stay off. */
export const COURSE_AUDIO_LEVELS = Object.freeze(['a1.1']);

/**
 * The cast's Azure voices (registries/cast) → the nearest OpenAI voice, female to female and male
 * to male. Priya (Amala) keeps coral, the voice of the AI speaking teacher, so the course's narrator
 * sounds the same everywhere. Announcements get their own voices.
 */
export const VOICE_FOR_AZURE = Object.freeze({
  'de-DE-AmalaNeural': 'coral',
  'de-DE-KatjaNeural': 'nova',
  'de-DE-LouisaNeural': 'shimmer',
  'de-DE-ElkeNeural': 'sage',
  'de-DE-SeraphinaMultilingualNeural': 'alloy',
  'de-DE-TanjaNeural': 'nova',
  'de-DE-KlarissaNeural': 'shimmer',
  'de-DE-MajaNeural': 'sage',
  'de-DE-GiselaNeural': 'alloy',
  'de-DE-KasperNeural': 'echo',
  'de-DE-RalfNeural': 'ash',
  'de-DE-KlausNeural': 'onyx',
  'de-DE-BerndNeural': 'ballad',
  'de-DE-KillianNeural': 'verse',
  'de-DE-ChristophNeural': 'fable',
  'de-DE-FlorianMultilingualNeural': 'echo',
  'de-DE-ConradNeural': 'onyx',
  'de-AT-JonasNeural': 'ash',
});
const ANNOUNCER_VOICE = Object.freeze({ durchsage: 'onyx', ansage: 'alloy', radio: 'verse' });
/** Words, example sentences and Redemittel: the course's teacher voice. */
export const TEACHER_VOICE = 'coral';

const BASE =
  'Sprich klares, natürliches Hochdeutsch wie eine Person aus Deutschland, ohne fremden Akzent. ' +
  'Lies genau diesen Text vor, ohne etwas hinzuzufügen oder wegzulassen.';
const PACE_SLOW = 'Sprich etwas langsamer als normal und deutlich, für Deutschlernende.';
const PACE_NORMAL = 'Sprich in natürlichem, ruhigem Tempo.';
const AS_WORD = 'Es ist ein einzelnes Wort oder eine kurze Wendung für eine Vokabelkarte: einmal deutlich und natürlich aussprechen.';
const AS_ANNOUNCEMENT = 'Sprich wie eine Lautsprecherdurchsage oder Ansage am Telefon: sachlich und deutlich.';
const AS_RADIO = 'Sprich wie eine Sprecherin oder ein Sprecher im Radio.';

const slowRate = (r) => {
  const m = /^-(\d+)%$/.exec(String(r || '').trim());
  return m ? Number(m[1]) >= 5 : false;
};

/** How one speakable is rendered → { voice, instructions }. Pure. */
export function renderSpec(entry) {
  const e = entry || {};
  if (e.k === 'word' || e.k === 'example' || e.k === 'phrase') {
    const style = e.k === 'word' ? AS_WORD : PACE_SLOW;
    return { voice: TEACHER_VOICE, instructions: `${BASE} ${style}` };
  }
  const speaker = String(e.s || '').toLowerCase();
  if (!e.az && ANNOUNCER_VOICE[speaker]) {
    return { voice: ANNOUNCER_VOICE[speaker], instructions: `${BASE} ${speaker === 'radio' ? AS_RADIO : AS_ANNOUNCEMENT}` };
  }
  const voice = VOICE_FOR_AZURE[e.az] || TEACHER_VOICE;
  return { voice, instructions: `${BASE} ${slowRate(e.r) ? PACE_SLOW : PACE_NORMAL}` };
}

/** The storage path of a speakable's mp3. The hash changes whenever what is heard would change. */
export function audioPath(level, id, entry) {
  const spec = renderSpec(entry);
  const hash = createHash('sha256')
    .update([TTS_MODEL, spec.voice, spec.instructions, entry.t].join('\n'))
    .digest('hex')
    .slice(0, 12);
  const safeId = String(id).replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${AUDIO_PREFIX}/${level}/${safeId}.${hash}.mp3`;
}

export const publicUrl = (supabaseUrl, path) => `${String(supabaseUrl).replace(/\/+$/, '')}/storage/v1/object/public/${AUDIO_BUCKET}/${path}`;

// Per-instance cache of the speakables files. `undefined` = not read yet; `null` = absent.
const speakCache = new Map();
let overrides = null;

/** Test seam: serve speakables from memory ({ [level]: { entries } }). Pass null to reset. */
export function __setSpeakablesForTests(data) {
  overrides = data || null;
  speakCache.clear();
}

/** The speakable `id` of `level`, or null when the level is off or the id unknown. */
export function speakable(level, id) {
  const lv = String(level || '').toLowerCase();
  if (!COURSE_AUDIO_LEVELS.includes(lv)) return null;
  if (typeof id !== 'string' || !id || id.length > 120) return null;
  let file;
  if (overrides) file = overrides[lv] || null;
  else {
    if (!speakCache.has(lv)) {
      const raw = readCourseV2Json(`${lv}.speak.json`);
      speakCache.set(lv, raw && raw.entries ? raw : null);
    }
    file = speakCache.get(lv);
  }
  const entry = file && file.entries && Object.prototype.hasOwnProperty.call(file.entries, id) ? file.entries[id] : null;
  return entry && typeof entry.t === 'string' && entry.t ? entry : null;
}

/** Render one speakable with OpenAI TTS → mp3 Buffer. Throws on any failure. */
export async function synthesize(entry, { apiKey, fetchImpl = fetch } = {}) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  const spec = renderSpec(entry);
  const res = await fetchImpl('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: TTS_MODEL, voice: spec.voice, input: entry.t, instructions: spec.instructions, response_format: 'mp3' }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`TTS ${res.status}: ${detail.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error(`TTS returned ${buf.length} bytes`);
  return buf;
}
