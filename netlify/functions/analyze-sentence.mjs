const SYSTEM_PROMPT = `You are a German grammar analyzer. Given a German sentence, break it down into its grammatical components.

For each meaningful unit (words that belong together like "dem Kind", "die Mutter"):
- Identify its grammatical role (subject, direct_object, indirect_object, verb, adverb, adjective, preposition_phrase, conjunction, particle, or other)
- Identify its case if applicable (nominative, accusative, dative, genitive, or null)
- Provide a brief English translation
- Explain WHY it has that role/case in 1-2 sentences
- Suggest a relevant grammar topic slug from this list: [nominative-case, accusative-case, dative-case, genitive-case, word-order, articles, verb-conjugation, prepositions-accusative, prepositions-dative, two-way-prepositions, modal-verbs, separable-verbs, negation, adjective-endings]

Also provide:
- One key insight about the sentence (something interesting about word order, emphasis, or grammar)
- A natural English translation of the full sentence

Respond ONLY with valid JSON, no markdown, no explanation outside the JSON.

JSON format:
{
  "words": [
    {
      "text": "string — the word or phrase",
      "role": "string — grammatical role",
      "case": "string or null",
      "translation": "string — English translation of this unit",
      "explanation": "string — why this role/case",
      "grammarTopic": "string — slug from the list above"
    }
  ],
  "insight": {
    "title": "string — short title for the insight",
    "explanation": "string — 2-3 sentence explanation"
  },
  "fullTranslation": "string — natural English translation of the whole sentence"
}`;

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

  try {
    const { sentence } = JSON.parse(event.body || '{}');

    if (!sentence || typeof sentence !== 'string' || sentence.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'sentence is required' }),
      };
    }

    if (sentence.trim().length > 500) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Sentence too long (max 500 characters)' }),
      };
    }

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
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Analyze this German sentence: "${sentence.trim()}"` },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Failed to analyze sentence' }),
      };
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content?.[0]?.text || '';

    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse analysis response' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analysis),
    };
  } catch (error) {
    console.error('analyze-sentence error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
