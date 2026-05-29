import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

function buildEvaluationPrompt(level, messages) {
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`)
    .join('\n');

  return `Du bist ein erfahrener Deutschlehrer, der die Sprechfähigkeiten eines Schülers auf dem Niveau ${level.toUpperCase()} bewertet.

Analysiere das folgende Gespräch und bewerte den Schüler in 5 Kategorien (jeweils 0–20 Punkte):

1. **Verständlichkeit** (intelligibility) – Wie klar hat der Schüler kommuniziert? Bewerte anhand des Transkripts: Kohärenz, ob die Bedeutung klar rüberkam, Wortwahl. Du hast KEIN Audio – beurteile NICHT die akustische Aussprache.
2. **Grammatik** (grammar) – Wie korrekt sind Satzstruktur, Konjugation, Kasus?
3. **Wortschatz** (vocabulary) – Wie angemessen und vielfältig ist der Wortschatz für das Niveau?
4. **Flüssigkeit** (fluency) – Wie flüssig und natürlich spricht der Schüler?
5. **Verständnis** (comprehension) – Wie gut versteht und reagiert der Schüler auf Fragen?

Berücksichtige dabei das erwartete Niveau ${level.toUpperCase()}. Ein A1-Schüler wird anders bewertet als ein B2-Schüler.

Gespräch:
${conversationText}

Antworte NUR mit einem JSON-Objekt in diesem Format (keine Erklärung davor oder danach):
{
  "scores": {
    "intelligibility": <0-20>,
    "grammar": <0-20>,
    "vocabulary": <0-20>,
    "fluency": <0-20>,
    "comprehension": <0-20>
  },
  "total_score": <0-100>,
  "feedback": "<2-3 Sätze Feedback auf Deutsch>",
  "strengths": ["<Stärke 1>", "<Stärke 2>"],
  "improvements": ["<Verbesserung 1>", "<Verbesserung 2>"],
  "recommendation": "<GLEICH|HÖHER|WIEDERHOLEN>"
}

Empfehlung:
- HÖHER: total_score >= 70 → Schüler kann zum nächsten Niveau aufsteigen
- GLEICH: total_score 40-69 → Schüler sollte auf diesem Niveau weiterüben
- WIEDERHOLEN: total_score < 40 → Schüler sollte diese Lektion wiederholen`;
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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  if (!supabaseKey || !supabase) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    const { user_id, session_token, level, messages, customPrompt } = JSON.parse(event.body || '{}');

    if (!user_id || !session_token || !level || !messages || messages.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'user_id, session_token, level, and messages are required' }),
      };
    }

    const evaluationPrompt = customPrompt || buildEvaluationPrompt(level, messages);

    async function callClaude(prompt) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Claude API error:', res.status, errorText);
        return null;
      }
      const data = await res.json();
      return data.content?.[0]?.text || '';
    }

    function tryParseEvaluation(text) {
      if (!text) return null;
      try { return JSON.parse(text); } catch {}
      const match = text.match(/\{[\s\S]*\}/);
      if (match) { try { return JSON.parse(match[0]); } catch {} }
      return null;
    }

    const responseText = await callClaude(evaluationPrompt);
    let evaluation = tryParseEvaluation(responseText);

    if (!evaluation) {
      console.warn('First parse failed, retrying with stricter prompt');
      const retryPrompt = evaluationPrompt + '\n\nWICHTIG: Antworte NUR mit validem JSON. Kein Text davor oder danach. Nur das JSON-Objekt.';
      const retryText = await callClaude(retryPrompt);
      evaluation = tryParseEvaluation(retryText);
    }

    if (!evaluation) {
      console.error('Evaluation JSON parse failed after retry');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          evaluation_failed: true,
          message: 'Auswertung konnte nicht erstellt werden, bitte versuche es erneut.',
        }),
      };
    }

    // Save evaluation to Supabase.
    // Table schema requires: session_id (NOT NULL) and score (NOT NULL).
    // session_id maps to the session_token string sent from the frontend.
    // score is the 0-100 total; individual breakdown goes in *_score columns.
    const { data: savedEval, error: saveError } = await supabase
      .from('speaking_evaluations')
      .insert({
        user_id,
        session_id:           session_token,
        session_token,
        level,
        score:                evaluation.total_score ?? 0,
        total_score:          evaluation.total_score ?? 0,
        // DB column still named pronunciation_score; maps to intelligibility score from eval
        pronunciation_score:  evaluation.scores?.intelligibility ?? null,
        grammar_score:        evaluation.scores?.grammar       ?? null,
        vocabulary_score:     evaluation.scores?.vocabulary    ?? null,
        fluency_score:        evaluation.scores?.fluency       ?? null,
        comprehension_score:  evaluation.scores?.comprehension ?? null,
        scores:               evaluation.scores,
        feedback:             evaluation.feedback,
        strengths:            evaluation.strengths,
        improvements:         evaluation.improvements,
        recommendation:       evaluation.recommendation,
        message_count:        messages.length,
        created_at:           new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving evaluation:', JSON.stringify(saveError));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...evaluation,
        evaluation_id: savedEval?.id || null,
        saved: !saveError,
      }),
    };
  } catch (error) {
    console.error('evaluate-speaking error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
