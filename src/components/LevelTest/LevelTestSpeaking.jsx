import { useState, useEffect } from 'react';
import { Mic, Loader2, AlertCircle, Phone, Sparkles, Hand } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthHeaders } from '../../utils/supabase';
import SpeakingSession from '../speaking/SpeakingSession';

// Placement speaking test — turn-based cascade, quota-exempt (mode 'placement').
// The system prompt lives server-side in speaking-session.mjs; this component
// only starts the session and hands the conversation to the shared engine.
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
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={48} className="spin" style={{ color: '#1D9E75', marginBottom: '1rem' }} />
          <h2>Wird gestartet…</h2>
          <p style={{ color: '#666' }}>Frau Schmidt bereitet sich vor</p>
        </div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2>Connection Error</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="skip-btn" onClick={onSkip}>Skip Speaking</button>
            <button className="start-test-btn" onClick={startSession} style={{ maxWidth: '200px' }}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  // Intro
  if (!user) return null;
  return (
    <div className="level-test-container">
      <div className="question-card speaking-intro">
        <div className="speaking-intro-header">
          <div className="speaking-icon"><Mic size={40} /></div>
          <h2>Speaking Test</h2>
          <div className="adaptive-badge"><Sparkles size={14} /> Adaptive A1–B2</div>
        </div>

        <div className="speaking-info">
          <div className="info-item"><Phone size={20} /><span>2–3 minute conversation</span></div>
          <div className="info-item"><Sparkles size={20} /><span>Adapts to your level</span></div>
        </div>

        <div className="speaking-instructions">
          <h3>How it works</h3>
          <ul>
            <li>You'll talk with Frau Schmidt, an AI German teacher</li>
            <li><strong>Tap the button to record</strong> your answer, then tap again to send</li>
            <li>She replies out loud and adapts to your level</li>
            <li>Speak at whatever level feels comfortable — simple or advanced</li>
          </ul>
        </div>

        <div className="speaking-tip">
          <Hand size={18} />
          <span>Tip: Speak naturally! It's better to make mistakes than to stay silent.</span>
        </div>

        <div className="speaking-actions">
          <button className="skip-btn" onClick={onSkip}>Skip Speaking</button>
          <button className="start-test-btn" onClick={startSession} disabled={!user}>Start Speaking Test</button>
        </div>
      </div>
    </div>
  );
};

export default LevelTestSpeaking;
