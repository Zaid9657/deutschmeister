// Turn-based cascade helpers shared by the two speaking functions:
//   ears  → OpenAI STT   (gpt-4o-mini-transcribe)
//   brain → Anthropic    (Claude Haiku — same client shape as evaluate-speaking)
//   voice → OpenAI TTS   (gpt-4o-mini-tts)
// Plus the shared teacher system-prompt scaffolding (CONVERSATION_RULES etc.).

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const STT_MODEL = 'gpt-4o-mini-transcribe';
const TTS_MODEL = 'gpt-4o-mini-tts';

// Warm, teacher-suited OpenAI voice.
export const TEACHER_VOICE = 'coral';

// A provider (STT / LLM / TTS) failure. Callers turn this into a structured
// JSON error the UI can show — never a silent 500.
export class AIError extends Error {
  constructor(stage, message, status = 502, detail) {
    super(message);
    this.name = 'AIError';
    this.stage = stage; // 'stt' | 'llm' | 'tts'
    this.status = status;
    this.detail = detail;
  }
}

// Shared conversational scaffolding: ask ONE question, then yield and wait.
export const CONVERSATION_RULES = `WICHTIG — WIE DU SPRICHST:
- Du sprichst IMMER nur in deiner Rolle. Verwende NIEMALS Rollenbezeichnungen wie "LEHRER:", "SCHÜLER:" in deinen Antworten.
- Du stellst EINE Frage, dann bist du STILL. Du wartest auf die Antwort.
- Du beantwortest deine eigenen Fragen NICHT.
- Halte deine Antworten KURZ: maximal 2 kurze Sätze.
- Sprich NUR Deutsch. Nur wenn dein Gegenüber einen KOMPLETTEN englischen Satz spricht (mehrere englische Wörter, ein echter Satz — nicht nur ein einzelnes Wort), sage freundlich: "Auf Deutsch bitte!" Bei einem einzelnen unklaren Wort oder akzentbehaftetem Deutsch gehe IMMER davon aus, dass es Deutsch war, und führe das Gespräch normal weiter.
- Dein Gegenüber spricht Deutsch mit fremdsprachigem Akzent: interpretiere unklare Äußerungen IMMER als Deutsch und wechsle NIEMALS ins Englische.`;

// Server-owned placement-test prompt (level test). Selected via the validated
// `mode: 'placement'` flag — clients can never supply free-text prompts here.
export const PLACEMENT_PROMPT = `Du bist Frau Schmidt, eine erfahrene und freundliche Deutschlehrerin, die einen mündlichen Einstufungstest durchführt. Du sprichst JETZT, LIVE, per Sprachanruf mit einer einzelnen Person.

DEIN ZIEL:
Ermittle das CEFR-Sprachniveau (A1, A2, B1 oder B2) deines Gegenübers durch ein natürliches Gespräch.

WIE DU SPRICHST:
- Du sprichst IMMER nur als Frau Schmidt. Verwende NIEMALS Rollenbezeichnungen wie "LEHRERIN:" in deinen Antworten.
- Du stellst EINE Frage, dann bist du STILL und wartest auf die Antwort.
- Halte deine Antworten KURZ (1-2 Sätze), dann stelle die nächste Frage.

ADAPTIVE STRATEGIE:
1. STARTE BEI A2 (Mitte) - nicht zu leicht, nicht zu schwer
2. BEOBACHTE die Antwort und passe das Niveau an (flüssig → schwerer, zögerlich → leichter)
3. WECHSLE THEMEN um verschiedene Fähigkeiten zu testen

WICHTIGE REGELN:
- Sprich NUR Deutsch. Bei akzentbehaftetem oder unklarem Deutsch gehe IMMER davon aus, dass es Deutsch war.
- KORRIGIERE NICHT - dies ist ein Test, keine Unterrichtsstunde.
- Sei warm, freundlich und ermutigend.`;

// Build the teacher system prompt for a turn or the opening greeting.
// - placement → the server-owned placement prompt
// - mission   → ai_role + target_structures + system_prompt_extra + rules
// - free      → a warm level-appropriate teacher + rules
export function buildTeacherSystemPrompt({ level, mission = null, isPlacement = false }) {
  if (isPlacement) return PLACEMENT_PROMPT;

  const lvl = String(level || '').toUpperCase();
  const parts = [];

  if (mission) {
    parts.push(`DEINE ROLLE:\n${mission.ai_role}`);
  } else {
    parts.push(`Du bist eine warme, geduldige Deutschlehrerin und führst ein lockeres Gespräch mit einer Person, die Deutsch auf Niveau ${lvl} lernt.`);
  }

  parts.push(CONVERSATION_RULES);
  parts.push(`Antworte auf Deutsch, passend zum Niveau ${lvl}. Maximal 2 kurze Sätze.`);

  if (mission) {
    const structures = Array.isArray(mission.target_structures)
      ? mission.target_structures.filter(Boolean).join(', ')
      : (typeof mission.target_structures === 'string' ? mission.target_structures : '');
    if (structures) {
      parts.push(`ZIELSTRUKTUREN — lenke das Gespräch so, dass dein Gegenüber diese Strukturen benutzt:\n${structures}`);
    }
    if (mission.system_prompt_extra) parts.push(mission.system_prompt_extra);
  }

  return parts.join('\n\n');
}

function mimeToExt(mimeType) {
  const m = (mimeType || '').toLowerCase();
  if (m.includes('webm')) return 'webm';
  if (m.includes('mp4') || m.includes('m4a')) return 'mp4';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('wav')) return 'wav';
  if (m.includes('ogg')) return 'ogg';
  return 'webm';
}

// STT — transcribe the user's audio as German. Throws AIError('stt') on failure.
export async function transcribeAudio({ audioBase64, mimeType }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AIError('stt', 'OPENAI_API_KEY is not set', 500);
  if (!audioBase64) throw new AIError('stt', 'no audio provided', 400);

  let buffer;
  try {
    buffer = Buffer.from(audioBase64, 'base64');
  } catch {
    throw new AIError('stt', 'invalid audio encoding', 400);
  }

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), `audio.${mimeToExt(mimeType)}`);
  form.append('model', STT_MODEL);
  form.append('language', 'de');

  let res;
  try {
    res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch (e) {
    throw new AIError('stt', 'Spracherkennung nicht erreichbar', 502, e.message);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('STT error:', res.status, detail);
    throw new AIError('stt', 'Deine Aufnahme konnte nicht verarbeitet werden.', 502, detail);
  }
  const data = await res.json().catch(() => ({}));
  return (data.text || '').trim();
}

// TTS — synthesize the teacher's reply. Throws AIError('tts') on failure.
export async function synthesizeSpeech({ text, voice = TEACHER_VOICE }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AIError('tts', 'OPENAI_API_KEY is not set', 500);

  let res;
  try {
    res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: TTS_MODEL, voice, input: text, response_format: 'mp3' }),
    });
  } catch (e) {
    throw new AIError('tts', 'Sprachausgabe nicht erreichbar', 502, e.message);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('TTS error:', res.status, detail);
    throw new AIError('tts', 'Die Sprachausgabe ist fehlgeschlagen.', 502, detail);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf).toString('base64');
}

// Cap history to the last 20 messages and coerce to a valid Anthropic sequence
// (only user/assistant, non-empty, starting with a user turn).
function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const cleaned = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.trim() }));
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  return cleaned;
}

// LLM — the teacher's brain. Returns the reply text. Throws AIError('llm').
export async function teacherReply({ system, history = [], userText = '', maxTokens = 120 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AIError('llm', 'ANTHROPIC_API_KEY is not set', 500);

  const messages = normalizeHistory(history);
  const clean = (userText || '').trim();
  if (clean) {
    if (messages.length && messages[messages.length - 1].role === 'user') {
      messages[messages.length - 1] = { role: 'user', content: `${messages[messages.length - 1].content}\n${clean}` };
    } else {
      messages.push({ role: 'user', content: clean });
    }
  }
  // Anthropic requires a leading user turn — seed one for the opening greeting.
  if (!messages.length) messages.push({ role: 'user', content: 'Los geht’s.' });

  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: HAIKU_MODEL, max_tokens: maxTokens, system, messages }),
    });
  } catch (e) {
    throw new AIError('llm', 'Der Sprachpartner ist nicht erreichbar', 502, e.message);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Claude API error:', res.status, detail);
    throw new AIError('llm', 'Der Sprachpartner konnte nicht antworten.', 502, detail);
  }
  const data = await res.json().catch(() => ({}));
  return (data.content?.[0]?.text || '').trim();
}
