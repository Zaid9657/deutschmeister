import { useState, useEffect } from 'react';
import { Mic, Loader2, AlertCircle, Phone, Sparkles, Hand } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthHeaders } from '../../utils/supabase';
import SpeakingSession from '../speaking/SpeakingSession';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Reveal from '../ui/Reveal.jsx';

// Placement speaking test — turn-based cascade, quota-exempt (mode 'placement').
// The system prompt lives server-side in speaking-session.mjs; this component
// only starts the session and hands the conversation to the shared engine.
//
// Only the intro/connecting/error screens are dressed here: the live
// conversation, its mic permission flow and its record button all belong to
// SpeakingSession, which already carries the Playful Depth treatment.
const LevelTestSpeaking = ({ onComplete, onSkip }) => {
  const { user, loading: authLoading } = useAuth();
  const [stage, setStage] = useState('intro'); // intro | connecting | session | error
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  // No authenticated session → the speaking step can't run (backend is
  // JWT-required). Proceed silently as if the user pressed skip.
  useEffect(() => {
    if (!authLoading && !user && stage === 'intro') onSkip();
  }, [authLoading, user, stage, onSkip]);

  const startSession = async () => {
    if (!user) { setError('Please log in to take the speaking test.'); return; }
    setStage('connecting');
    setError(null);
    try {
      const res = await fetch('/api/speaking/speaking-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ action: 'start', mode: 'placement' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create speaking session');
      if (!data.session_token) throw new Error('Failed to create speaking session');
      setSession({
        sessionToken: data.session_token,
        plannedMinutes: data.planned_minutes || 5,
        opening: { text: data.replyText, audioBase64: data.replyAudioBase64 },
      });
      setStage('session');
    } catch (err) {
      console.error('Placement speaking error:', err);
      setError(err.message || 'Failed to start speaking session');
      setStage('error');
    }
  };

  // Live conversation — shared turn-based engine, placement evaluation.
  if (stage === 'session' && session) {
    return (
      <SpeakingSession
        level="placement"
        evalMode="placement"
        sessionToken={session.sessionToken}
        plannedMinutes={session.plannedMinutes}
        opening={session.opening}
        onComplete={onComplete}
        onCancel={onSkip}
      />
    );
  }

  if (stage === 'connecting') {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-16">
        <Card raised className="p-10 text-center">
          <Loader2 size={44} className="mx-auto mb-4 animate-spin text-siegel" aria-hidden="true" />
          <h2 className="font-display text-[1.25rem] font-semibold text-ink">Wird gestartet…</h2>
          <p className="mt-2 text-[0.9375rem] text-graphite">Frau Schmidt bereitet sich vor</p>
        </Card>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-16">
        <Card tone="himbeer" className="p-6 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-accent-himbeer-ink" aria-hidden="true" />
          <h2 className="font-display text-[1.25rem] font-semibold text-ink">Connection Error</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-accent-himbeer-ink">{error}</p>
          <div className="mt-5 flex flex-col-reverse justify-center gap-3 sm:flex-row">
            <Button variant="secondary" onClick={onSkip}>Skip Speaking</Button>
            <Button onClick={startSession}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Intro
  if (!user) return null;
  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-16">
      <Reveal>
        <Card raised className="p-5 sm:p-8">
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill bg-siegel-wash text-siegel">
              <Mic size={36} />
            </span>
            <h2 className="mt-4 font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink">
              Speaking Test
            </h2>
            <Chip tone="label" className="mt-3">
              <Sparkles size={14} aria-hidden="true" /> Adaptive A1–B2
            </Chip>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 border-y border-rule py-4 sm:flex-row sm:gap-8">
            <span className="inline-flex items-center gap-2 font-data text-[0.8125rem] text-graphite">
              <Phone size={18} className="text-siegel" aria-hidden="true" />
              2–3 minute conversation
            </span>
            <span className="inline-flex items-center gap-2 font-data text-[0.8125rem] text-graphite">
              <Sparkles size={18} className="text-siegel" aria-hidden="true" />
              Adapts to your level
            </span>
          </div>

          <div className="mt-6">
            <h3 className="font-display text-[1.0625rem] font-semibold text-ink">How it works</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed text-graphite marker:text-siegel">
              <li>You'll talk with Frau Schmidt, an AI German teacher</li>
              <li><strong className="text-ink">Tap the button to record</strong> your answer, then tap again to send</li>
              <li>She replies out loud and adapts to your level</li>
              <li>Speak at whatever level feels comfortable — simple or advanced</li>
            </ul>
          </div>

          <Card tone="limette" className="mt-6 flex items-start gap-3 p-4">
            <Hand size={18} className="mt-0.5 flex-shrink-0 text-accent-limette-ink" aria-hidden="true" />
            <span className="text-[0.9375rem] leading-relaxed text-accent-limette-ink">
              Tip: Speak naturally! It's better to make mistakes than to stay silent.
            </span>
          </Card>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="secondary" onClick={onSkip}>Skip Speaking</Button>
            <Button className="flex-1" onClick={startSession} disabled={!user}>Start Speaking Test</Button>
          </div>
        </Card>
      </Reveal>
    </div>
  );
};

export default LevelTestSpeaking;
