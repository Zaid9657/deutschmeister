import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';

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
4. **Flüssigkeit** (fluency) – Wie flüssig wirkt der Ausdruck im Transkript: vollständige Sätze, Verknüpfungen (und, aber, weil...), natürlicher Gesprächsfluss statt abgehackter Einzelwörter. Du hast KEIN Audio – beurteile NICHT Sprechtempo, Pausen oder Zögern.
5. **Verständnis** (comprehension) – Wie gut versteht und reagiert der Schüler auf Fragen?

Berücksichtige dabei das erwartete Niveau ${level.toUpperCase()}. Ein A1-Schüler wird anders bewertet als ein B2-Schüler.

WICHTIG: Das Transkript stammt aus automatischer Spracherkennung und kann Erkennungsfehler enthalten. Sei nachsichtig bei einzelnen seltsamen oder unpassenden Wörtern, die wahrscheinlich Transkriptionsfehler sind – werte sie NICHT als Fehler des Schülers. Bewerte nur Muster, die sich über mehrere Äußerungen hinweg zeigen.

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

// Placement-test evaluation (level test). Server-owned, selected via the
// validated `mode: 'placement'` flag — never client-supplied prompt text.
// Output keys (scores.pronunciation etc.) are kept for UI compatibility with
// LevelTestResults, but every criterion is defined from transcript evidence
// only — Claude has no audio.
function buildPlacementPrompt(messages) {
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'Schüler' : 'Lehrerin'}: ${m.content}`)
    .join('\n');

  return `Du bist ein erfahrener CEFR-Prüfer. Analysiere dieses Einstufungsgespräch und BESTIMME das Sprachniveau des Schülers.

WICHTIG: Du siehst nur das TRANSKRIPT, kein Audio. Bewerte ausschließlich, was im Text erkennbar ist. Das Transkript stammt aus automatischer Spracherkennung und kann Erkennungsfehler enthalten — sei nachsichtig bei einzelnen seltsamen Wörtern und bewerte nur Muster, die sich über mehrere Äußerungen zeigen.

GESPRÄCH:
${conversationText}

BEWERTE JEDE KATEGORIE (0-20 Punkte) BASIEREND AUF DEM GEZEIGTEN NIVEAU:

1. VERSTÄNDLICHKEIT (pronunciation): Wie klar kam die Bedeutung im Transkript rüber? Kohärenz, nachvollziehbare Aussagen, passende Wortwahl. NICHT die akustische Aussprache — die kannst du nicht hören.
2. GRAMMATIK (grammar): Satzbau, Konjugation, Kasus. 16-20: komplexe Strukturen, Nebensätze, Konjunktiv (B2) / 12-15: gute Grundstruktur (B1) / 8-11: einfache Sätze meist korrekt (A2) / 4-7: häufige Fehler (A1).
3. WORTSCHATZ (vocabulary): 16-20: reich, nuanciert, idiomatisch (B2) / 12-15: guter Alltagswortschatz, Meinungen (B1) / 8-11: Grundwortschatz (A2) / 4-7: nur Grundbegriffe (A1).
4. AUSDRUCKSFLUSS (fluency): Wie flüssig wirkt der Ausdruck im Transkript: vollständige Sätze, Verknüpfungen (und, aber, weil...), zusammenhängende Gedanken statt abgehackter Einzelwörter. NICHT Sprechtempo oder Pausen — die kannst du nicht hören.
5. VERSTÄNDNIS (comprehension): Wie gut versteht und beantwortet der Schüler die Fragen? Reagiert er passend auch auf schwierigere Fragen?

BESTIMME DAS GESAMTNIVEAU:
- 80-100 Punkte = B2
- 60-79 Punkte = B1
- 40-59 Punkte = A2
- 0-39 Punkte = A1

KONFIDENZ: Bei weniger als 4 Schüler-Antworten oder sehr kurzen Antworten ist die Einstufung unsicher — setze confidence auf "low". Bei 4-6 substanziellen Antworten "medium", bei mehr "high".

Antworte NUR mit diesem JSON (keine Erklärung davor oder danach):
{
  "scores": {
    "pronunciation": <0-20>,
    "grammar": <0-20>,
    "vocabulary": <0-20>,
    "fluency": <0-20>,
    "comprehension": <0-20>
  },
  "total_score": <0-100>,
  "determined_level": "<A1|A2|B1|B2>",
  "determined_sublevel": "<A1.1|A1.2|A2.1|A2.2|B1.1|B1.2|B2.1|B2.2>",
  "confidence": "<low|medium|high>",
  "feedback": "<2-3 Sätze auf Deutsch über die Stärken und Verbesserungsmöglichkeiten>",
  "strengths": ["<Stärke 1>", "<Stärke 2>"],
  "improvements": ["<Verbesserung 1>", "<Verbesserung 2>"],
  "recommendation": "<GLEICH>"
}`;
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
    // Identity comes from the verified JWT, never from the request body.
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) {
      return unauthorizedResponse(headers);
    }

    const { session_token, level: requestedLevel, messages, mode } = JSON.parse(event.body || '{}');

    const isPlacement = mode === 'placement';
    const level = isPlacement ? 'placement' : requestedLevel;

    if (!session_token || !level || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'session_token, level, and messages are required' }),
      };
    }

    // Bound the input — a real session never exceeds this, but an abusive
    // caller could otherwise feed arbitrarily large prompts to Claude.
    if (messages.length > 200 || messages.some(m => typeof m?.content !== 'string' || m.content.length > 5000)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'messages payload too large' }) };
    }

    const evaluationPrompt = isPlacement
      ? buildPlacementPrompt(messages)
      : buildEvaluationPrompt(level, messages);

    async function callClaude(prompt) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
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

    // A level-up recommendation needs enough evidence: short sessions with few
    // student turns can score high without demonstrating sustained ability.
    const MIN_USER_TURNS_FOR_LEVEL_UP = 5;
    const userTurns = messages.filter(m => m.role === 'user').length;
    if (evaluation.recommendation === 'HÖHER' && userTurns < MIN_USER_TURNS_FOR_LEVEL_UP) {
      console.log(`Downgrading HÖHER to GLEICH: only ${userTurns} user turns`);
      evaluation.recommendation = 'GLEICH';
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
        // DB column still named pronunciation_score; maps to intelligibility score
        // from the standard eval, or the legacy pronunciation key in placement mode
        pronunciation_score:  evaluation.scores?.intelligibility ?? evaluation.scores?.pronunciation ?? null,
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
