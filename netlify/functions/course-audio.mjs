import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { AUDIO_BUCKET, audioPath, publicUrl, speakable, synthesize } from './_shared/courseAudio.mjs';

// GET /.netlify/functions/course-audio?level=a1.1&id=<speakable id>
// → 302 to the speakable's mp3 in Supabase Storage, rendering it first when this is the first
//   request for it (netlify/functions/_shared/courseAudio.mjs says why and what can be spoken).
// 404 unknown id or level · 503 not configured · 502 rendering or upload failed — the player
// then falls back to the browser's own voice, so a failure here is never worse than before.
//
// No auth on purpose: the A1.1 course is open to signed-out learners, and nothing here costs
// more than the course's own finite list of texts, each rendered once.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';

// Requests for the same file on one warm instance share one render.
const inFlight = new Map();

let deps = null;
/** Test seam: { storage: { upload(path, buf) → {error} } | null, apiKey, fetch }. Pass null to reset. */
export function __setCourseAudioDepsForTests(d) {
  deps = d || null;
  inFlight.clear();
}

const fetchImpl = (...args) => ((deps && deps.fetch) || fetch)(...args);
const apiKey = () => (deps ? deps.apiKey : process.env.OPENAI_API_KEY);
function storage() {
  if (deps) return deps.storage || null;
  if (!supabase || !supabaseKey) return null;
  return {
    upload: (path, buf) => supabase.storage.from(AUDIO_BUCKET).upload(path, buf, { contentType: 'audio/mpeg', upsert: true, cacheControl: '31536000' }),
  };
}

async function exists(url) {
  try {
    const res = await fetchImpl(url, { method: 'HEAD' });
    return !!(res && res.ok);
  } catch {
    return false;
  }
}

async function render(entry, path, store) {
  const mp3 = await synthesize(entry, { apiKey: apiKey(), fetchImpl });
  const { error } = (await store.upload(path, mp3)) || {};
  if (error) throw new Error(`upload: ${error.message || error}`);
}

export const handler = async (event) => {
  const allowedOrigins = [
    'https://deutsch-meister.de',
    'https://www.deutsch-meister.de',
  ];
  const origin = event.headers?.origin || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
  const json = (statusCode, body) => ({ statusCode, headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const q = event.queryStringParameters || {};
  const level = String(q.level || '').toLowerCase();
  const id = String(q.id || '');
  const entry = speakable(level, id);
  if (!entry) return json(404, { error: 'unknown speakable' });

  const path = audioPath(level, id, entry);
  const url = publicUrl(SUPABASE_URL, path);
  const redirect = {
    statusCode: 302,
    headers: {
      ...headers,
      Location: url,
      'Cache-Control': 'public, max-age=86400',
      'Netlify-CDN-Cache-Control': 'public, max-age=86400',
    },
    body: '',
  };

  if (await exists(url)) return redirect;

  const store = storage();
  if (!store || !apiKey()) {
    console.error('[course-audio] not configured: needs SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY');
    return json(503, { error: 'audio not configured' });
  }

  try {
    let job = inFlight.get(path);
    if (!job) {
      job = render(entry, path, store).finally(() => inFlight.delete(path));
      inFlight.set(path, job);
    }
    await job;
    return redirect;
  } catch (e) {
    console.error('[course-audio] render failed for', level, id, e && e.message);
    return json(502, { error: 'audio render failed' });
  }
};
