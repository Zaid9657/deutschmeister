import { useEffect, useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import GameButton, { QuietButton } from './GameButton.jsx';
import SpeakingSession from '../speaking/SpeakingSession.jsx';
import { checkSpeakingSupport } from '../speaking/mediaSupport.js';
import { useAuth } from '../../contexts/AuthContext';
import ResultCard from './ResultCard.jsx';
import SignInPrompt, { SignInButton } from './SignInPrompt.jsx';
import { startSpeakingSession } from './ai.js';
import { useV2Strings } from './strings.js';

const PANEL = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-5';

/**
 * One graded speaking attempt for a v2 bank key (a SpeakingTask or a spoken micro-output).
 * The existing speaking coach does the conversation (SpeakingSession: tap → record →
 * speaking-turn → reply), started with `{ courseTaskKey }` so the server loads the task
 * from the compiled bank and gates it by the course allowance; evaluate-speaking grades
 * the stored session with the task's rubric profile. The result is the v2 shape and is
 * shown with the fixed label (ResultCard).
 *
 * No dead ends (BLUEPRINT §4.7): no microphone, no access, no allowance or a server error each
 * say why in one line, and `onSkip` (when given) is always offered. Signed out, the start is
 * replaced by the account prompt and its door (SignInPrompt: /login and back to this step).
 *
 * `renderAction({ primary, skip, retry, busy })` (optional): the caller renders the actions in its
 * own bottom bar (SpeakingTaskView's StickyAction) — `primary` the start or the sign-in door,
 * `skip` the quiet skip, `retry` a new attempt, `busy` while starting. Without it the actions
 * stay in flow (MicroOutputView).
 *
 * onResult(result | null) fires once per attempt: the graded result, or null when the
 * learner ended without speaking.
 */
export default function SpeakingRun({ bankKey, level, title = null, hintWords = [], startLabel = null, onResult, onSkip, skipLabel = null, renderAction = null }) {
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

  // Signed out, the start would only refuse: the account prompt and its door stand in its place.
  const signedOut = !user;
  const canStart = !signedOut && support.supported;
  const startButton = (
    <GameButton onClick={start} disabled={phase === 'starting'} caps={false}>
      {phase === 'starting' ? <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
      {phase === 'starting' ? t('sp.starting') : (startLabel || t('sp.start'))}
    </GameButton>
  );
  const notice = (
    <>
      {slow && phase === 'starting' && <p className="mt-2 text-[0.875rem] font-semibold text-game-muted">{t('ai.slow')}</p>}
      {error === 'ai.signIn'
        ? <SignInPrompt className="mt-3" withButton={!renderAction} />
        : error && <p className="mt-3 text-[0.9375rem] font-semibold text-game-text" role="status">{t(error)}</p>}
    </>
  );

  // The step's bottom bar (SpeakingTaskView): the actions go to the caller, which composes ONE bar
  // with its own „Weiter" — the start (or the sign-in door) as the primary, the rest quiet.
  if (typeof renderAction === 'function') {
    return (
      <div>
        {phase === 'result' && result && <ResultCard result={result} />}
        {phase !== 'result' && signedOut && error !== 'ai.signIn' && <SignInPrompt />}
        {phase !== 'result' && !signedOut && !support.supported && (
          <p className={`${PANEL} text-[0.9375rem] font-semibold text-game-text`}>{support.message || t('sp.noMicLead')}</p>
        )}
        {notice}
        {renderAction({
          primary: phase === 'result' ? null : signedOut ? <SignInButton /> : canStart ? startButton : null,
          skip: typeof onSkip === 'function' && phase !== 'result' ? <QuietButton onClick={onSkip}>{skipLabel || t('sp.noMic')}</QuietButton> : null,
          retry: canStart && phase !== 'starting' ? () => { setResult(null); start(); } : null,
          busy: phase === 'starting',
        })}
      </div>
    );
  }

  return (
    <div>
      {phase === 'result' && result && <ResultCard result={result} />}
      {phase !== 'result' && (
        signedOut && error !== 'ai.signIn' ? <SignInPrompt withButton /> : (
          <div className="rounded-[1.25rem] border-2 border-course-soft bg-course-wash p-4">
            {!support.supported ? (
              <p className="text-[0.9375rem] font-semibold text-game-text">{support.message || t('sp.noMicLead')}</p>
            ) : (
              <GameButton onClick={start} size="lg" disabled={phase === 'starting'} className="w-full sm:w-auto">
                {phase === 'starting' ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
                {phase === 'starting' ? t('sp.starting') : (startLabel || t('sp.start'))}
              </GameButton>
            )}
            {notice}
          </div>
        )
      )}
      {phase === 'result' && (
        <div className="mt-3">
          <GameButton size="md" variant="secondary" onClick={() => { setResult(null); setPhase('idle'); }}>
            <Mic className="h-4 w-4" aria-hidden="true" /> {t('sp.again')}
          </GameButton>
        </div>
      )}
      {typeof onSkip === 'function' && phase !== 'result' && (
        <QuietButton onClick={onSkip} className="mt-3">{skipLabel || t('sp.noMic')}</QuietButton>
      )}
    </div>
  );
}
