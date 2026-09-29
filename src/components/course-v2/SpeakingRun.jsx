import { useEffect, useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import GameButton from './GameButton.jsx';
import Card from '../ui/Card.jsx';
import SpeakingSession from '../speaking/SpeakingSession.jsx';
import { checkSpeakingSupport } from '../speaking/mediaSupport.js';
import { useAuth } from '../../contexts/AuthContext';
import ResultCard from './ResultCard.jsx';
import { startSpeakingSession } from './ai.js';
import { useV2Strings } from './strings.js';

/**
 * One graded speaking attempt for a v2 bank key (a SpeakingTask or a spoken micro-output).
 * The existing speaking coach does the conversation (SpeakingSession: tap → record →
 * speaking-turn → reply), started with `{ courseTaskKey }` so the server loads the task
 * from the compiled bank and gates it by the course allowance; evaluate-speaking grades
 * the stored session with the task's rubric profile. The result is the v2 shape and is
 * shown with the fixed label (ResultCard).
 *
 * No dead ends (BLUEPRINT §4.7): signed out, no microphone, no access, no allowance or a
 * server error each say why in one line, and `onSkip` (when given) is always offered.
 *
 * onResult(result | null) fires once per attempt: the graded result, or null when the
 * learner ended without speaking.
 */
export default function SpeakingRun({ bankKey, level, title = null, hintWords = [], startLabel = null, onResult, onSkip, skipLabel = null }) {
  const { user } = useAuth();
  const [, t] = useV2Strings();
  const [support] = useState(() => checkSpeakingSupport());
  const [phase, setPhase] = useState('idle'); // idle | starting | session | result
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (phase !== 'starting') return undefined;
    const id = window.setTimeout(() => setSlow(true), 10000);
    return () => window.clearTimeout(id);
  }, [phase]);

  const start = async () => {
    if (!user) { setError('ai.signIn'); return; }
    setError(null);
    setSlow(false);
    setPhase('starting');
    const r = await startSpeakingSession({ bankKey, minutes: 10 });
    if (!r.ok) { setError(r.errorKey); setPhase('idle'); return; }
    setSession({
      token: r.data.session_token,
      minutes: r.data.planned_minutes || 10,
      opening: { text: r.data.replyText, audioBase64: r.data.replyAudioBase64 },
    });
    setPhase('session');
  };

  const complete = (res) => {
    setSession(null);
    if (res && !res.evaluation_failed) {
      setResult(res);
      setPhase('result');
    } else {
      setError(res && res.evaluation_failed ? 'ai.failed' : null);
      setPhase('idle');
    }
    if (typeof onResult === 'function') onResult(res && !res.evaluation_failed ? res : null);
  };

  if (phase === 'session' && session) {
    return (
      <SpeakingSession
        level={String(level || '').toUpperCase()}
        mission={{ title_de: title || '', hint_words: hintWords }}
        sessionToken={session.token}
        plannedMinutes={session.minutes}
        opening={session.opening}
        onComplete={complete}
        onCancel={() => { setSession(null); setPhase('idle'); }}
      />
    );
  }

  return (
    <div>
      {phase === 'result' && result && <ResultCard result={result} />}
      {phase !== 'result' && (
        <Card tone="wash" className="p-4">
          {!support.supported ? (
            <p className="text-[0.9375rem] text-ink">{support.message || t('sp.noMicLead')}</p>
          ) : (
            <GameButton onClick={start} size="lg" disabled={phase === 'starting'} className="w-full sm:w-auto">
              {phase === 'starting' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
              {phase === 'starting' ? t('sp.starting') : (startLabel || t('sp.start'))}
            </GameButton>
          )}
          {slow && phase === 'starting' && <p className="mt-2 text-[0.875rem] text-graphite">{t('ai.slow')}</p>}
          {error && <p className="mt-3 text-[0.9375rem] text-ink" role="status">{t(error)}</p>}
        </Card>
      )}
      {phase === 'result' && (
        <div className="mt-3">
          <GameButton size="md" variant="secondary" onClick={() => { setResult(null); setPhase('idle'); }}>
            <Mic className="h-4 w-4" aria-hidden="true" /> {t('sp.again')}
          </GameButton>
        </div>
      )}
      {typeof onSkip === 'function' && phase !== 'result' && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-1.5 text-[0.8125rem] font-bold text-graphite hover:border-course hover:text-course-ink"
        >
          {skipLabel || t('sp.noMic')}
        </button>
      )}
    </div>
  );
}
