import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { reserveUsage } from './_shared/aiReservation.mjs';
import { SPEAKING_LEVELS } from './_shared/speakingAI.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Each evaluation is a large Sonnet call that retries once on a bad response.
// Well above any genuine day's practice, low enough to bound abuse.
const MAX_EVALUATIONS_PER_DAY = 20;
const EVALUATION_LEASE_MS = 10 * 60 * 1000;

const RECOMMENDATIONS = new Set(['GLEICH', 'HÖHER', 'WIEDERHOLEN']);
const SUBLEVELS = new Set(SPEAKING_LEVELS.filter((l) => l !== 'placement'));

/**
 * Is the model's answer a complete evaluation? Five category scores 0–20, a
 * total 0–100, written feedback and a known recommendation — plus the placed
 * sub-level for the level test and a real pass/fail for a mission. Anything
 * less is an unusable answer (retried once, then marked `_failed` so the
 * session can be graded again), never a stored zero-score result that every
 * retry would return. The first category is `intelligibility` in the practice
 * rubric and `pronunciation` in the placement rubric; either name is read.
 */
export function validSpeakingEvaluation(evaluation, { isPlacement = false, isMission = false } = {}) {
  if (!evaluation || typeof evaluation !== 'object' || Array.isArray(evaluation)) return false;
  const inRange = (n, max) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;
  const s = evaluation.scores;
  if (!s || typeof s !== 'object') return false;
  const clarity = s.intelligibility ?? s.pronunciation;
  if (![clarity, s.grammar, s.vocabulary, s.fluency, s.comprehension].every((n) => inRange(n, 20))) return false;
  if (!inRange(evaluation.total_score, 100)) return false;
  if (typeof evaluation.feedback !== 'string' || !evaluation.feedback.trim()) return false;
  if (!RECOMMENDATIONS.has(evaluation.recommendation)) return false;
  for (const list of [evaluation.strengths, evaluation.improvements]) {
    if (list !== undefined && !Array.isArray(list)) return false;
  }
  if (isPlacement && !SUBLEVELS.has(evaluation.determined_sublevel)) return false;
  if (isMission && typeof evaluation.passed !== 'boolean') return false;
  return true;
}

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

function storedEvaluation(row) {
  if (!row || row.scores?._pending) return null;
  const evaluation = row.scores?._evaluation || {
    scores: row.scores,
    total_score: row.total_score ?? row.score,
    feedback: row.feedback,
    strengths: row.strengths,
    improvements: row.improvements,
    recommendation: row.recommendation,
    passed: null,
  };
  return { ...evaluation, evaluation_id: row.id, saved: true };
}

function reservationExpired(row) {
  const started = Date.parse(row?.scores?._lease_started_at || row?.created_at);
  return Number.isFinite(started) && Date.now() - started >= EVALUATION_LEASE_MS;
}

function buildEvaluationPrompt(level, messages, passCriteria = null) {
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`)
    .join('\n');

  // Mission sessions add the mission's pass criteria and require a boolean
  // `passed` in the output. Free/level sessions leave both empty.
  const missionSection = passCriteria
    ? `\n\nMISSIONSZIEL — BESTEHENSKRITERIEN:\n${passCriteria}\n\nBeurteile zusätzlich, ob der Schüler diese Kriterien in diesem Gespräch erfüllt hat, und setze das Feld "passed" entsprechend (true = erfüllt, false = nicht erfüllt).`
    : '';
  const passedLine = passCriteria ? '\n  "passed": <true|false>,' : '';

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
${conversationText}${missionSection}

Antworte NUR mit einem JSON-Objekt in diesem Format (keine Erklärung davor oder danach):
{
  "scores": {
    "intelligibility": <0-20>,
    "grammar": <0-20>,
    "vocabulary": <0-20>,
    "fluency": <0-20>,
    "comprehension": <0-20>
  },
  "total_score": <0-100>,${passedLine}
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

    // THE SESSION ROW IS THE AUTHORITY. The token names the caller's own
    // session; its level, mode and mission come from the row speaking-session
    // stored, never from the body — a body `level` went into the grading
    // prompt unbounded, and a body `mode` could grade a mission as the level
    // test. Older clients still send level/mode/messages; all three are ignored.
    const { session_token } = JSON.parse(event.body || '{}');
    if (typeof session_token !== 'string' || !session_token || session_token.length > 100) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'session_token is required' }) };
    }

    const { data: sessionRow, error: sessionLookupError } = await supabase
      .from('speaking_sessions')
      .select('level, mode, mission_id')
      .eq('session_token', session_token)
      .eq('user_id', user_id)
      .maybeSingle();
    if (sessionLookupError) {
      console.error('Error looking up speaking session:', JSON.stringify(sessionLookupError));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
    }
    if (!sessionRow) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Session not found' }) };
    }
    const isPlacement = sessionRow.mode === 'placement';
    const level = isPlacement ? 'placement' : sessionRow.level;
    if (!SPEAKING_LEVELS.includes(level)) {
      console.error(`evaluate-speaking: session ${session_token} carries an unsupported level`);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unsupported level' }) };
    }

    // A completed session is graded once, including when today's allowance
    // has since been consumed. Only an expired pending reservation can restart.
    const { data: existingEvaluation, error: existingError } = await supabase
      .from('speaking_evaluations')
      .select('*')
      .eq('user_id', user_id)
      .eq('session_id', session_token)
      .or('scores->>_failed.is.null,scores->>_failed.neq.true')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw new Error('Evaluation could not be loaded');
    if (existingEvaluation && !existingEvaluation.scores?._failed) {
      const evaluation = storedEvaluation(existingEvaluation);
      if (evaluation || !reservationExpired(existingEvaluation)) {
        return {
          statusCode: evaluation ? 200 : 409,
          headers,
          body: JSON.stringify(evaluation || { error: 'evaluation_in_progress' }),
        };
      }
    }

    // Grade only the transcript stored server-side by the speaking functions.
    // The client-supplied `messages` array is never graded: it is attacker
    // controlled, so accepting it let anyone invent a session_token, submit a
    // fabricated conversation, and both mint arbitrary scores and inject
    // instructions into the grading prompt. No stored transcript means there is
    // nothing legitimate to grade.
    const { data: storedMessages, error: transcriptError } = await supabase
      .from('speaking_messages')
      .select('role, content')
      .eq('session_token', session_token)
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })
      .limit(200);
    if (transcriptError) {
      console.error('Error loading stored transcript:', JSON.stringify(transcriptError));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
    }
    if (!storedMessages || storedMessages.length === 0) {
      console.warn(`evaluate-speaking: no stored transcript for session ${session_token} (user ${user_id})`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No transcript found for this session' }),
      };
    }
    // The teacher's opening line alone is not a conversation to grade: with no
    // learner line stored there is nothing to assess, so nothing is reserved,
    // nothing is sent to the model and nothing is stored for later retries.
    if (!storedMessages.some((m) => m.role === 'user')) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'no_learner_turns' }) };
    }
    const transcript = storedMessages;

    // Mission sessions carry a mission_id in speaking_sessions; when present we
    // fold the mission's pass_criteria into the evaluation and record pass/fail.
    let missionPassCriteria = null;
    let missionSessionToken = null;
    if (!isPlacement && sessionRow.mission_id) {
      const { data: missionRow, error: missionError } = await supabase
        .from('speaking_missions')
        .select('pass_criteria')
        .eq('id', sessionRow.mission_id)
        .single();
      if (missionError) {
        console.error('Error fetching mission pass_criteria:', JSON.stringify(missionError));
      } else {
        missionPassCriteria = missionRow?.pass_criteria || null;
        missionSessionToken = session_token;
      }
    }
    // The prompt asks for a `passed` verdict only when it carries criteria.
    const isMission = !!missionPassCriteria;

    const evaluationPrompt = isPlacement
      ? buildPlacementPrompt(transcript)
      : buildEvaluationPrompt(level, transcript, missionPassCriteria);

    let evaluationId;
    let evaluationLease;
    try {
      const reservation = existingEvaluation?.scores?._pending
        ? { allowed: true, id: existingEvaluation.id, existing: true, evaluation: existingEvaluation }
        : await reserveUsage(supabase, 'reserve_speaking_evaluation', {
        p_user_id: user_id, p_session_token: session_token, p_level: level,
        p_limit: MAX_EVALUATIONS_PER_DAY,
      }, async () => {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const { count, error: countError } = await supabase
          .from('speaking_evaluations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .gte('created_at', startOfDay.toISOString());
        if (countError || !Number.isSafeInteger(count) || count < 0) throw new Error('Evaluation usage could not be checked');
        if (count >= MAX_EVALUATIONS_PER_DAY) return { allowed: false, used: count };
        // The existing session flag is a conditional claim even before the
        // quota RPC is installed, so concurrent retries cannot grade it twice.
        const { data: claimed, error: claimError } = await supabase
          .from('speaking_sessions')
          .update({ evaluated: true })
          .eq('session_token', session_token)
          .eq('user_id', user_id)
          .or('evaluated.is.null,evaluated.eq.false')
          .select('id')
          .maybeSingle();
        if (claimError) throw new Error('Evaluation session could not be claimed');
        if (!claimed) {
          const { data: existing, error } = await supabase.from('speaking_evaluations')
            .select('*').eq('user_id', user_id).eq('session_id', session_token)
            .or('scores->>_failed.is.null,scores->>_failed.neq.true')
            .order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (error) throw new Error('Evaluation could not be loaded');
          return existing && !existing.scores?._failed ? { allowed: true, used: count, id: existing.id, existing: true, evaluation: existing }
            : { allowed: false, used: count, pending: true };
        }
        const { data: saved, error: insertError } = await supabase
          .from('speaking_evaluations')
          .insert({ user_id, session_id: session_token, session_token, level,
            score: 0, total_score: null, scores: { _pending: true } })
          .select('id')
          .single();
        if (insertError || !saved?.id) {
          await supabase.from('speaking_sessions').update({ evaluated: false })
            .eq('session_token', session_token).eq('user_id', user_id);
          throw new Error(insertError?.message || 'Evaluation usage could not be reserved');
        }
        return { allowed: true, used: count, id: saved.id };
      });
      if (reservation.existing) {
        const evaluation = storedEvaluation(reservation.evaluation);
        if (evaluation || !reservationExpired(reservation.evaluation)) {
          return { statusCode: evaluation ? 200 : 409, headers,
            body: JSON.stringify(evaluation || { error: 'evaluation_in_progress' }) };
        }
      }
      if (!reservation.allowed) {
        return { statusCode: reservation.pending ? 409 : 429, headers,
          body: JSON.stringify(reservation.pending ? { error: 'evaluation_in_progress' }
            : { error: 'limit_reached', limit: MAX_EVALUATIONS_PER_DAY }) };
      }
      evaluationId = reservation.id;
      // Compare the old lease so concurrent recoveries share the reserved row.
      // JSON metadata exists before the quota migration is installed too.
      evaluationLease = new Date().toISOString();
      let claim = supabase.from('speaking_evaluations')
        .update({ scores: { _pending: true, _lease_started_at: evaluationLease } })
        .eq('id', evaluationId).eq('user_id', user_id)
        .eq('scores->>_pending', 'true');
      const previousLease = reservation.evaluation?.scores?._lease_started_at;
      claim = previousLease == null ? claim.is('scores->>_lease_started_at', null)
        : claim.eq('scores->>_lease_started_at', previousLease);
      const { data: claimed, error: claimError } = await claim.select('id').maybeSingle();
      if (claimError) throw new Error('Evaluation lease could not be claimed');
      if (!claimed) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'evaluation_in_progress' }) };
      }
    } catch (error) {
      console.error('evaluate-speaking: reservation failed:', error.message);
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Usage could not be reserved' }) };
    }

    async function callClaude(prompt) {
      try {
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
      } catch (error) {
        console.error('Claude API error:', error.message);
        return null;
      }
    }

    function tryParseEvaluation(text) {
      if (!text) return null;
      try { return JSON.parse(text); } catch {}
      const match = text.match(/\{[\s\S]*\}/);
      if (match) { try { return JSON.parse(match[0]); } catch {} }
      return null;
    }

    const usable = (candidate) => validSpeakingEvaluation(candidate, { isPlacement, isMission });
    const responseText = await callClaude(evaluationPrompt);
    let evaluation = tryParseEvaluation(responseText);

    if (!usable(evaluation)) {
      console.warn('First evaluation unusable, retrying with stricter prompt');
      const retryPrompt = evaluationPrompt + '\n\nWICHTIG: Antworte NUR mit validem JSON im verlangten Format. Kein Text davor oder danach. Nur das JSON-Objekt.';
      const retryText = await callClaude(retryPrompt);
      evaluation = tryParseEvaluation(retryText);
    }

    if (!usable(evaluation)) {
      console.error('Evaluation unusable after retry');
      const failed = {
        evaluation_failed: true,
        message: 'Auswertung konnte nicht erstellt werden.',
      };
      const { data: failedEval, error } = await supabase.from('speaking_evaluations')
        .update({ scores: { _failed: true } })
        .eq('id', evaluationId).eq('user_id', user_id)
        .eq('scores->>_lease_started_at', evaluationLease)
        .select('id').maybeSingle();
      if (error) console.error('Error saving failed evaluation:', JSON.stringify(error));
      else if (failedEval) {
        const { error: releaseError } = await supabase.from('speaking_sessions')
          .update({ evaluated: false }).eq('session_token', session_token).eq('user_id', user_id);
        if (releaseError) console.error('Error releasing failed evaluation:', JSON.stringify(releaseError));
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ...failed, evaluation_id: evaluationId, saved: false }),
      };
    }

    // A level-up recommendation needs enough evidence: short sessions with few
    // student turns can score high without demonstrating sustained ability.
    const MIN_USER_TURNS_FOR_LEVEL_UP = 5;
    const userTurns = transcript.filter(m => m.role === 'user').length;
    if (evaluation.recommendation === 'HÖHER' && userTurns < MIN_USER_TURNS_FOR_LEVEL_UP) {
      console.log(`Downgrading HÖHER to GLEICH: only ${userTurns} user turns`);
      evaluation.recommendation = 'GLEICH';
    }

    // Save into the usage reservation rather than adding another daily row.
    // Table schema requires: session_id (NOT NULL) and score (NOT NULL).
    // session_id maps to the session_token string sent from the frontend.
    // score is the 0-100 total; individual breakdown goes in *_score columns.
    const evaluationRow = {
      score:                evaluation.total_score ?? 0,
      total_score:          evaluation.total_score ?? 0,
      // DB column still named pronunciation_score; maps to intelligibility score
      // from the standard eval, or the legacy pronunciation key in placement mode
      pronunciation_score:  evaluation.scores?.intelligibility ?? evaluation.scores?.pronunciation ?? null,
      grammar_score:        evaluation.scores?.grammar       ?? null,
      vocabulary_score:     evaluation.scores?.vocabulary    ?? null,
      fluency_score:        evaluation.scores?.fluency       ?? null,
      comprehension_score:  evaluation.scores?.comprehension ?? null,
      scores:               { ...evaluation.scores, _evaluation: { ...evaluation, passed: missionSessionToken ? evaluation.passed === true : null } },
      feedback:             evaluation.feedback,
      strengths:            evaluation.strengths,
      improvements:         evaluation.improvements,
      recommendation:       evaluation.recommendation,
      message_count:        transcript.length,
    };
    let savedEval = null;
    let saveError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const saved = await supabase.from('speaking_evaluations')
          .update(evaluationRow)
          .eq('id', evaluationId).eq('user_id', user_id)
          .eq('scores->>_lease_started_at', evaluationLease)
          .select('id').maybeSingle();
        savedEval = saved.data;
        saveError = saved.error;
      } catch (error) {
        saveError = error;
      }
      if (!saveError) break;
    }

    if (saveError) {
      console.error('Error saving evaluation:', JSON.stringify(saveError));
    }

    // Mission sessions: record pass/fail on the session row.
    let passed = null;
    if (missionSessionToken) {
      passed = evaluation.passed === true;
    }
    if (missionSessionToken && savedEval) {
      const { error: sessionUpdateError } = await supabase
        .from('speaking_sessions')
        .update({ evaluated: true, passed })
        .eq('session_token', missionSessionToken)
        .eq('user_id', user_id);
      if (sessionUpdateError) {
        console.error('Error updating speaking session pass status:', JSON.stringify(sessionUpdateError));
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...evaluation,
        passed,
        evaluation_id: savedEval?.id || null,
        saved: !!savedEval && !saveError,
      }),
    };
  } catch (error) {
    console.error('evaluate-speaking error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
