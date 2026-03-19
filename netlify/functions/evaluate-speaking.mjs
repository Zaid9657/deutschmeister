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

1. **Aussprache** (pronunciation) – Wie klar und korrekt ist die Aussprache?
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
    "pronunciation": <0-20>,
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
    const { user_id, session_token, level, messages } = JSON.parse(event.body || '{}');

    if (!user_id || !session_token || !level || !messages || messages.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'user_id, session_token, level, and messages are required' }),
      };
    }

    // Call Claude API for evaluation
    const evaluationPrompt = buildEvaluationPrompt(level, messages);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: evaluationPrompt },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      return {
        statusCode: claudeResponse.status,
        headers,
        body: JSON.stringify({ error: 'Failed to evaluate conversation', details: errorText }),
      };
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content?.[0]?.text || '';

    // Parse JSON from Claude's response
    let evaluation;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      evaluation = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse evaluation response' }),
      };
    }

    // Save evaluation to Supabase
    const { data: savedEval, error: saveError } = await supabase
      .from('speaking_evaluations')
      .insert({
        user_id,
        session_token,
        level,
        scores: evaluation.scores,
        total_score: evaluation.total_score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        recommendation: evaluation.recommendation,
        message_count: messages.length,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving evaluation:', JSON.stringify(saveError));
      // Still return the evaluation even if save fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...evaluation,
        evaluation_id: savedEval?.id || null,
      }),
    };
  } catch (error) {
    console.error('evaluate-speaking error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
