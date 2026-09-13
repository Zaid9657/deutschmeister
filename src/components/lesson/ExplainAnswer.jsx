import { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../utils/supabase';

/**
 * The "Erklär mir das" answer under a missed practice item (plan P5).
 *
 * Mounted only after the learner asks for it, so the model is never called for
 * an item nobody wondered about. `netlify/functions/explain-answer` grounds the
 * answer in the course's own rule card for the item's topic and caps the calls
 * per user per day; everything this component can be told (signed out, cap
 * reached, outage) is said in one German line, in the same paragraph box the
 * text would appear in — the box is the only thing that appears, so nothing
 * below it moves twice.
 */
const BOX = 'mt-3 rounded-clay bg-paper-sunk p-3 text-[0.875rem] leading-relaxed text-graphite';

export default function ExplainAnswer({ item, expected, userAnswer, level, lektionId }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const auth = await getAuthHeaders();
      if (!alive) return;
      if (!auth.Authorization) {
        setState({ status: 'anon' });
        return;
      }
      try {
        const res = await fetch('/.netlify/functions/explain-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...auth },
          body: JSON.stringify({
            itemId: item.id,
            topic: item.topic,
            questionDe: item.questionDe,
            expected: expected || item.answer,
            userAnswer: userAnswer || '',
            level: level || 'a1.1',
            lektionId: lektionId || '',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.status === 401) { setState({ status: 'anon' }); return; }
        if (res.status === 429) { setState({ status: 'limit', limit: data.limit }); return; }
        if (!res.ok || !data.explanation) { setState({ status: 'error' }); return; }
        setState({ status: 'ok', explanation: data.explanation, used: data.used, limit: data.limit });
      } catch (e) {
        console.error('explain-answer call failed:', e);
        if (alive) setState({ status: 'error' });
      }
    };
    run();
    return () => { alive = false; };
  }, [item.id, item.topic, item.questionDe, item.answer, expected, userAnswer, level, lektionId]);

  if (state.status === 'loading') {
    return <p className={BOX} role="status" aria-live="polite">Erklärung wird geschrieben …</p>;
  }
  if (state.status === 'anon') {
    return <p className={BOX} role="status" aria-live="polite">Melden Sie sich an für Erklärungen.</p>;
  }
  if (state.status === 'limit') {
    return (
      <p className={BOX} role="status" aria-live="polite">
        Sie haben heute alle Erklärungen{state.limit ? ` (${state.limit})` : ''} genutzt. Morgen gibt es neue.
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <p className={BOX} role="status" aria-live="polite">
        Die Erklärung klappt gerade nicht. Die Regel steht auf der Grammatikkarte dieser Lektion.
      </p>
    );
  }
  return <p className={BOX} role="status" aria-live="polite">{state.explanation}</p>;
}
