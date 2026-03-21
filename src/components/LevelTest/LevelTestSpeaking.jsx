import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Volume2, Phone, PhoneOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const getAssessmentPrompt = (level, sublevel) => {
  const levelDescriptions = {
    'A1': 'complete beginner - use very simple words, speak slowly, ask about basic topics like name, age, family, hobbies',
    'A2': 'elementary - use simple sentences, everyday topics like daily routine, shopping, travel plans',
    'B1': 'intermediate - use more complex sentences, discuss opinions, experiences, future plans',
    'B2': 'upper intermediate - use sophisticated vocabulary, discuss abstract topics, current events, hypotheticals'
  };

  const levelExamples = {
    'A1': 'Wie heißt du? Woher kommst du? Was machst du gern?',
    'A2': 'Was hast du gestern gemacht? Beschreibe deine Familie. Was möchtest du am Wochenende machen?',
    'B1': 'Was denkst du über soziale Medien? Erzähle von einer interessanten Reise. Was würdest du anders machen?',
    'B2': 'Wie beurteilst du die aktuelle Klimapolitik? Was wäre passiert, wenn du einen anderen Beruf gewählt hättest?'
  };

  const systemPrompt = `Du bist ein erfahrener Deutschlehrer, der einen kurzen Einstufungstest durchführt.

LEVEL DES SCHÜLERS (basierend auf dem schriftlichen Test): ${sublevel} (${levelDescriptions[level] || levelDescriptions['A1']})

DEINE AUFGABE:
1. Beginne auf dem angegebenen Level mit einer freundlichen Begrüßung
2. Stelle 3-4 kurze Fragen, um das Sprachniveau zu überprüfen
3. PASSE DICH AN: Wenn der Schüler gut antwortet, stelle eine etwas schwierigere Frage. Wenn er Schwierigkeiten hat, vereinfache.
4. Sei ermutigend aber notiere mental Grammatikfehler, Wortschatzprobleme und Aussprache

BEISPIELFRAGEN FÜR DIESES LEVEL:
${levelExamples[level] || levelExamples['A1']}

WICHTIGE REGELN:
- Sprich NUR Deutsch (keine englischen Erklärungen)
- Halte deine Antworten kurz (1-2 Sätze)
- Korrigiere NICHT während des Tests - das ist eine Bewertung
- Nach 3-4 Fragen, beende höflich: "Vielen Dank! Das war der Sprechtest."
- Sprich langsam und deutlich für niedrigere Levels, natürlicher für höhere

SPRECHGESCHWINDIGKEIT:
${level === 'A1' ? 'Sehr langsam und deutlich' : level === 'A2' ? 'Langsam und klar' : level === 'B1' ? 'Normale Geschwindigkeit' : 'Natürliche, flüssige Geschwindigkeit'}

Beginne jetzt mit einer kurzen Begrüßung und deiner ersten Frage.`;

  const voices = {
    'A1': 'coral',
    'A2': 'shimmer',
    'B1': 'echo',
    'B2': 'alloy'
  };

  return {
    systemPrompt,
    voice: voices[level] || 'coral'
  };
};

const LevelTestSpeaking = ({ level, sublevel, onComplete, onSkip }) => {
  const { user } = useAuth();
  const [stage, setStage] = useState('intro'); // intro, connecting, active, evaluating, error
  const [error, setError] = useState(null);
  const [speakingState, setSpeakingState] = useState('idle'); // idle, user_speaking, ai_speaking
  const [messages, setMessages] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);
  const transcriptRef = useRef('');

  // Keep messagesRef in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const saveMessage = useCallback((role, content) => {
    if (!content?.trim()) return;
    setMessages(prev => [...prev, { role, content: content.trim() }]);
  }, []);

  const handleDataChannelMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'input_audio_buffer.speech_started':
          setSpeakingState('user_speaking'); break;
        case 'input_audio_buffer.speech_stopped':
          setSpeakingState('idle'); break;
        case 'response.audio_transcript.delta':
          if (msg.delta) transcriptRef.current += msg.delta;
          break;
        case 'response.audio_transcript.done':
          if (transcriptRef.current.trim()) saveMessage('assistant', transcriptRef.current);
          transcriptRef.current = '';
          break;
        case 'response.audio.started':
          setSpeakingState('ai_speaking'); break;
        case 'response.done':
          setSpeakingState('idle'); break;
        case 'conversation.item.input_audio_transcription.completed':
          if (msg.transcript?.trim()) saveMessage('user', msg.transcript);
          break;
        default: break;
      }
    } catch { /* ignore non-JSON */ }
  }, [saveMessage]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dcRef.current) { dcRef.current.close(); dcRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  // Cleanup on unmount
  useEffect(() => { return () => cleanup(); }, [cleanup]);

  const startSession = async () => {
    if (!user) {
      setError('Please log in to take the speaking test.');
      return;
    }

    setStage('connecting');
    setError(null);

    try {
      // 1. Get microphone
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        setError('Microphone access denied. Please allow microphone access and try again.');
        setStage('error');
        return;
      }
      streamRef.current = stream;

      // 2. Create session via backend (level test — no usage tracking)
      const config = getAssessmentPrompt(level, sublevel);

      const sessionRes = await fetch('/api/speaking/speaking-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: config.systemPrompt,
          level: sublevel,
          voice: config.voice,
        }),
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}));
        throw new Error(err.error || `Failed to create session (${sessionRes.status})`);
      }

      const { client_secret } = await sessionRes.json();

      // 3. Set up WebRTC
      const RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection;
      const pc = new RTCPeer();
      pcRef.current = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.setAttribute('playsinline', '');
      pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      dc.onopen = () => {
        setStage('active');
        startTimer();
      };
      dc.onmessage = handleDataChannelMessage;
      dc.onclose = () => {
        if (stage === 'active') endSession();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4. Exchange SDP with OpenAI Realtime
      const sdpRes = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client_secret}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        throw new Error(`Voice server connection failed (${sdpRes.status})`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      console.error('Speaking session error:', err);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setError(err.message || 'Failed to start speaking session');
      setStage('error');
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endSession = useCallback(async () => {
    cleanup();
    const currentMessages = messagesRef.current;

    if (currentMessages.length === 0) {
      onComplete(null);
      return;
    }

    setStage('evaluating');

    try {
      const evalRes = await fetch('/api/speaking/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          session_token: `level-test-${Date.now()}`,
          level: sublevel,
          messages: currentMessages,
        }),
      });

      if (evalRes.ok) {
        const evaluation = await evalRes.json();
        onComplete(evaluation);
      } else {
        console.error('Evaluation failed:', await evalRes.text());
        onComplete(null);
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      onComplete(null);
    }
  }, [cleanup, user, sublevel, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUserSpeaking = speakingState === 'user_speaking';
  const isAiSpeaking = speakingState === 'ai_speaking';

  // Intro screen
  if (stage === 'intro') {
    return (
      <div className="level-test-container">
        <div className="question-card speaking-intro">
          <div className="speaking-intro-header">
            <div className="speaking-icon">
              <Mic size={40} />
            </div>
            <h2>Speaking Test</h2>
            <span className={`level-badge level-${level.toLowerCase()}`}>{sublevel}</span>
          </div>

          <div className="speaking-info">
            <div className="info-item">
              <Phone size={20} />
              <span>3 minute conversation</span>
            </div>
            <div className="info-item">
              <Volume2 size={20} />
              <span>AI evaluates your speaking</span>
            </div>
          </div>

          <div className="speaking-instructions">
            <h3>How it works</h3>
            <ul>
              <li>You'll have a short conversation with an AI German teacher</li>
              <li>Speak naturally — the AI will ask you simple questions</li>
              <li>Your pronunciation, grammar, and vocabulary will be assessed</li>
              <li>The conversation lasts about 3 minutes</li>
            </ul>
          </div>

          {!user && (
            <div className="speaking-login-notice">
              <AlertCircle size={18} />
              <span>Please log in to take the speaking test</span>
            </div>
          )}

          <div className="speaking-actions">
            <button className="skip-btn" onClick={onSkip}>
              Skip Speaking
            </button>
            <button
              className="start-test-btn"
              onClick={startSession}
              disabled={!user}
            >
              Start Speaking Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connecting screen
  if (stage === 'connecting') {
    return (
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={48} className="spin" style={{ color: '#1D9E75', marginBottom: '1rem' }} />
          <h2>Connecting...</h2>
          <p style={{ color: '#666' }}>Setting up your speaking session</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (stage === 'error') {
    return (
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2>Connection Error</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="skip-btn" onClick={onSkip}>Skip Speaking</button>
            <button className="start-test-btn" onClick={startSession} style={{ maxWidth: '150px' }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Evaluating screen
  if (stage === 'evaluating') {
    return (
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={48} className="spin" style={{ color: '#1D9E75', marginBottom: '1rem' }} />
          <h2>Evaluating...</h2>
          <p style={{ color: '#666' }}>Analyzing your speaking performance</p>
        </div>
      </div>
    );
  }

  // Active conversation screen
  if (stage === 'active') {
    return (
      <div className="level-test-container">
        <div className="question-card speaking-active">
          {/* Header */}
          <div className="question-header">
            <div className="question-header-left">
              <span className="header-title">Speaking Test</span>
              <span className={`level-badge level-${level.toLowerCase()}`}>{sublevel}</span>
            </div>
            <span className={`timer ${timeRemaining < 30 ? 'timer-warning' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Avatar / Status */}
          <div className="speaking-avatar-area">
            <div className={`speaking-avatar ${isUserSpeaking ? 'user-speaking' : ''} ${isAiSpeaking ? 'ai-speaking' : ''}`}>
              {isAiSpeaking ? <Volume2 size={40} /> : <Mic size={40} />}
            </div>
            <p className="speaking-status">
              {isUserSpeaking && 'Du sprichst...'}
              {isAiSpeaking && 'Lehrer spricht...'}
              {!isUserSpeaking && !isAiSpeaking && 'Bereit zum Sprechen'}
            </p>
          </div>

          {/* Recent Messages */}
          <div className="speaking-transcript">
            {messages.slice(-4).map((msg, i) => (
              <div key={i} className={`transcript-message ${msg.role}`}>
                <span className="transcript-role">{msg.role === 'user' ? 'Du' : 'Lehrer'}:</span>
                <span className="transcript-text">{msg.content}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="transcript-empty">Die Konversation beginnt...</p>
            )}
          </div>

          {/* End Button */}
          <div className="speaking-footer">
            <button className="end-call-btn" onClick={endSession}>
              <PhoneOff size={20} />
              Beenden & Auswerten
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LevelTestSpeaking;
