import { randomUUID } from 'node:crypto';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { checkUsage, incrementUsage } from './_shared/speakingUsage.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';

// Warm, teacher-suited OpenAI Realtime voices (coral/shimmer are the softest).
const VOICE_MAP = {
  'a1.1': 'coral', 'a1.2': 'coral',
  'a2.1': 'coral', 'a2.2': 'coral',
  'b1.1': 'shimmer', 'b1.2': 'shimmer',
  'b2.1': 'shimmer', 'b2.2': 'shimmer',
};

// Valid GA Realtime voices — used to reject stale client-sent values (e.g. the
// old Gemini "Zephyr"/"Charon") so we never forward an invalid voice to OpenAI.
const OPENAI_VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar']);

const OPENAI_MODEL = 'gpt-realtime-2.1-mini';
const TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';

// Server-owned placement-test prompt (level test). Selected via the validated
// `mode: 'placement'` flag — clients can never supply free-text prompts here.
const PLACEMENT_PROMPT = `Du bist Frau Schmidt, eine erfahrene und freundliche Deutschlehrerin, die einen mündlichen Einstufungstest durchführt. Du sprichst JETZT, LIVE, per Sprachanruf mit einer einzelnen Person.

DEIN ZIEL:
Ermittle das CEFR-Sprachniveau (A1, A2, B1 oder B2) deines Gegenübers durch ein natürliches Gespräch.

WIE DU SPRICHST:
- Du sprichst IMMER nur als Frau Schmidt. Verwende NIEMALS Rollenbezeichnungen wie "LEHRERIN:" in deinen Antworten.
- Du stellst EINE Frage, dann bist du STILL und wartest auf die Antwort.
- Halte deine Antworten KURZ (1-2 Sätze), dann stelle die nächste Frage.

ADAPTIVE STRATEGIE:
1. STARTE BEI A2 (Mitte) - nicht zu leicht, nicht zu schwer
2. BEOBACHTE die Antwort:
   - Flüssig, korrekte Grammatik, guter Wortschatz? → SCHWIERIGER (B1/B2)
   - Zögern, viele Fehler, Grundwortschatz? → LEICHTER (A1)
   - Angemessen für das Level? → BLEIB auf diesem Level
3. WECHSLE THEMEN um verschiedene Fähigkeiten zu testen

FRAGEN-BEISPIELE PRO LEVEL:
A1: Wie heißt du? Woher kommst du? Was machst du gern?
A2: Was hast du gestern gemacht? Beschreibe deine Familie. Was möchtest du am Wochenende machen?
B1: Was denkst du über soziale Medien? Erzähle von einer interessanten Reise. Was würdest du ändern?
B2: Wie beurteilst du die Work-Life-Balance? Diskutiere die Auswirkungen von KI. Was wäre passiert, wenn...?

GESPRÄCHSABLAUF (2-3 Minuten):
1. Begrüßung: "Hallo! Ich bin Frau Schmidt. Schön, dich kennenzulernen!"
2. Erste Frage (A2): z.B. "Erzähl mir ein bisschen von dir."
3. 3-4 weitere Fragen - PASSE DAS NIVEAU AN
4. Abschluss: "Vielen Dank für das nette Gespräch! Das war's für heute."

WICHTIGE REGELN:
- Sprich NUR Deutsch. Nur wenn dein Gegenüber einen KOMPLETTEN englischen Satz spricht (mehrere englische Wörter, ein echter Satz — nicht nur ein einzelnes Wort), sage freundlich: "Auf Deutsch bitte!" Bei einem einzelnen unklaren Wort oder akzentbehaftetem Deutsch gehe IMMER davon aus, dass es Deutsch war, und führe das Gespräch normal weiter.
- KORRIGIERE NICHT - dies ist ein Test, keine Unterrichtsstunde
- Sei warm, freundlich und ermutigend
- Wenn dein Gegenüber nicht versteht, formuliere einfacher um
- Passe deine SPRECHGESCHWINDIGKEIT an das erkannte Level an

Beginne JETZT mit der Begrüßung und deiner ersten Frage.`;

// Shared conversational scaffolding common to every level prompt: ask ONE
// question, then yield and wait. Mission prompts reuse these rules so the
// yield/wait behavior is identical to free conversation.
const CONVERSATION_RULES = `WICHTIG — WIE DU SPRICHST:
- Du sprichst IMMER nur in deiner Rolle. Verwende NIEMALS Rollenbezeichnungen wie "LEHRER:", "SCHÜLER:" in deinen Antworten.
- Du stellst EINE Frage, dann bist du STILL. Du wartest auf die Antwort.
- Du beantwortest deine eigenen Fragen NICHT.
- Bei Stille länger als 10 Sekunden sagst du nur: "Kein Problem. Nimm dir Zeit." — und bist wieder still.
- Halte deine Antworten KURZ (1–2 Sätze).
- Sprich NUR Deutsch. Nur wenn dein Gegenüber einen KOMPLETTEN englischen Satz spricht (mehrere englische Wörter, ein echter Satz — nicht nur ein einzelnes Wort), sage freundlich: "Auf Deutsch bitte!" Bei einem einzelnen unklaren Wort oder akzentbehaftetem Deutsch gehe IMMER davon aus, dass es Deutsch war, und führe das Gespräch normal weiter.
- Dein Gegenüber spricht Deutsch mit fremdsprachigem Akzent: interpretiere unklare Äußerungen IMMER als Deutsch und wechsle NIEMALS ins Englische.`;

// Build the mission system prompt from a speaking_missions row: the
// mission-specific role, target structures and extra instructions, combined
// with the shared yield/wait conversation rules.
function buildMissionPrompt(mission) {
  const structures = Array.isArray(mission.target_structures)
    ? mission.target_structures.filter(Boolean).join(', ')
    : (typeof mission.target_structures === 'string'
        ? mission.target_structures
        : JSON.stringify(mission.target_structures ?? ''));

  const sections = [`DEINE ROLLE:\n${mission.ai_role}`, CONVERSATION_RULES];

  if (structures) {
    sections.push(`ZIELSTRUKTUREN — lenke das Gespräch so, dass dein Gegenüber diese Strukturen benutzt:\n${structures}`);
  }
  if (mission.system_prompt_extra) {
    sections.push(mission.system_prompt_extra);
  }
  sections.push(`DEINE ERSTE ÄUSSERUNG:\nSag genau: "${mission.ai_opening_line}"\n\nDann bist du still. Du wartest auf die Antwort.`);

  return sections.join('\n\n');
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server nicht konfiguriert (fehlender API-Schlüssel)' }) };
  }

  if (!supabaseKey || !supabase) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    // Identity comes from the verified JWT — sessions cost real OpenAI quota,
    // so unauthenticated or unmetered session minting is not allowed.
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) {
      return unauthorizedResponse(headers);
    }

    const {
      systemPrompt,
      level,
      voice: requestedVoice,
      mode,
      missionId,
      session_token: providedToken,
      action,
      duration_seconds,
      user_turns,
      status: endStatus,
    } = JSON.parse(event.body || '{}');

    // Session-end logging: the client reports final metrics for a session it
    // previously started. No OpenAI session is minted on this path.
    if (action === 'end') {
      if (!providedToken) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'session_token is required to end a session' }) };
      }
      try {
        const { error: endError } = await supabase
          .from('speaking_sessions')
          .update({
            duration_seconds: Number.isFinite(duration_seconds) ? duration_seconds : 0,
            user_turns: Number.isFinite(user_turns) ? user_turns : 0,
            completed_at: new Date().toISOString(),
            status: endStatus || 'completed',
          })
          .eq('session_token', providedToken)
          .eq('user_id', user_id);
        if (endError) {
          console.error('[speaking-session] Failed to log session end:', JSON.stringify(endError));
        }
      } catch (err) {
        console.error('[speaking-session] Session end update threw:', err.message);
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // Placement mode uses the server-owned prompt — clients only send a flag.
    const isPlacement = mode === 'placement';

    // Mission mode: when a missionId is present the system prompt is built
    // server-side from the mission row. Free conversation (no missionId) keeps
    // using the client-supplied systemPrompt exactly as before.
    let mission = null;
    if (!isPlacement && missionId) {
      const { data: missionRow, error: missionError } = await supabase
        .from('speaking_missions')
        .select('*')
        .eq('id', missionId)
        .single();
      if (missionError || !missionRow) {
        console.error('[speaking-session] Mission not found:', missionId, missionError && JSON.stringify(missionError));
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Mission not found' }) };
      }
      mission = missionRow;
    }
    const isMission = !!mission;

    let effectivePrompt;
    let effectiveLevel;
    if (isPlacement) {
      effectivePrompt = PLACEMENT_PROMPT;
      effectiveLevel = 'placement';
    } else if (isMission) {
      effectivePrompt = buildMissionPrompt(mission);
      effectiveLevel = level || mission.level;
    } else {
      effectivePrompt = systemPrompt;
      effectiveLevel = level;
    }

    if (!effectivePrompt || !effectiveLevel) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'systemPrompt and level are required' }) };
    }

    // Placement sessions (level test) are exempt from the speaking quota —
    // still JWT-gated, but they don't consume or block on practice sessions.
    if (!isPlacement) {
      console.log('[speaking-session] Checking usage for user:', user_id);
      const usage = await checkUsage(user_id);
      console.log('[speaking-session] Usage check result:', JSON.stringify(usage));
      if (!usage.allowed) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'Speaking limit reached',
            ...usage,
          }),
        };
      }
    }

    const normalizedLevel = effectiveLevel.toLowerCase();
    // Never trust a client-sent voice unless it is a real GA voice — the frontend
    // still carries legacy Gemini names. Fall back to the warm level default.
    const voice = (requestedVoice && OPENAI_VOICES.has(requestedVoice))
      ? requestedVoice
      : (VOICE_MAP[normalizedLevel] || 'coral');

    // Session token ties the start row to later save/evaluate calls. Reuse the
    // client-provided token when present, otherwise mint one and return it.
    const sessionToken = providedToken || `sp_${randomUUID()}`;

    // Mint an OpenAI Realtime ephemeral session (client_secret) for the WebRTC
    // handshake. Input transcription is pinned to German so accented speech is
    // recognised as German rather than mis-detected as English/Arabic.
    const buildSession = (withTranscription) => ({
      session: {
        type: 'realtime',
        model: OPENAI_MODEL,
        instructions: effectivePrompt,
        audio: {
          input: {
            ...(withTranscription
              ? { transcription: { model: TRANSCRIBE_MODEL, language: 'de' } }
              : {}),
            turn_detection: {
              type: 'semantic_vad',
              eagerness: 'low',
              create_response: true,
              interrupt_response: true,
            },
          },
          output: { voice },
        },
      },
    });

    const mintSession = (withTranscription) =>
      fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSession(withTranscription)),
      });

    let response = await mintSession(true);

    // Defensive: an earlier GA revision rejected the transcription block at
    // creation time. If it 4xxs, retry without it and rely on the client's
    // session.update over the data channel to enable German transcription.
    if (!response.ok) {
      const rejectText = await response.text();
      console.warn('[speaking-session] client_secrets rejected (retrying without transcription block):', response.status, rejectText);
      response = await mintSession(false);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Sprachsitzung konnte nicht erstellt werden', details: errorText }),
      };
    }

    const data = await response.json();
    // GA returns { value: "ek_...", expires_at, session } at top level.
    const clientSecret = data.value || data.client_secret?.value || data.client_secret;

    if (!clientSecret) {
      console.error('No client_secret in OpenAI response:', JSON.stringify(data));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Ungültige Token-Antwort vom Server' }),
      };
    }

    if (!isPlacement) {
      try {
        await incrementUsage(user_id);
        console.log('[speaking-session] Usage incremented for user:', user_id);
      } catch (err) {
        console.error('[speaking-session] Failed to increment usage:', err.message);
      }

      // Log session start. Failure to log must not block the session.
      try {
        const { error: logError } = await supabase
          .from('speaking_sessions')
          .insert({
            user_id,
            session_token: sessionToken,
            level: effectiveLevel,
            mission_id: isMission ? missionId : null,
            mode: isMission ? 'mission' : 'free',
            status: 'active',
            started_at: new Date().toISOString(),
          });
        if (logError) {
          console.error('[speaking-session] Failed to log session start:', JSON.stringify(logError));
        }
      } catch (err) {
        console.error('[speaking-session] Session start insert threw:', err.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        client_secret: clientSecret,
        model: OPENAI_MODEL,
        voice,
        language_code: 'de',
        expires_at: data.expires_at || data.client_secret?.expires_at || null,
        session_token: sessionToken,
      }),
    };
  } catch (error) {
    console.error('speaking-session error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
