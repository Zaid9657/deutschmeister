import React, { useState, useRef, useEffect } from 'react';
import { Mic, PhoneOff, Loader2, AlertCircle, Volume2, Phone, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Universal adaptive assessment prompt - no level dependency
const ADAPTIVE_ASSESSMENT_PROMPT = `Du bist Frau Schmidt, eine erfahrene und freundliche Deutschlehrerin, die einen mündlichen Einstufungstest durchführt.

DEIN ZIEL:
Ermittle das CEFR-Sprachniveau (A1, A2, B1 oder B2) des Schülers durch ein natürliches Gespräch.

ADAPTIVE STRATEGIE:
1. STARTE BEI A2 (Mitte) - nicht zu leicht, nicht zu schwer
2. BEOBACHTE die Antwort:
   - Flüssig, korrekte Grammatik, guter Wortschatz? → SCHWIERIGER (B1/B2)
   - Zögern, viele Fehler, Grundwortschatz? → LEICHTER (A1)
   - Angemessen für das Level? → BLEIB auf diesem Level
3. WECHSLE THEMEN um verschiedene Fähigkeiten zu testen

FRAGEN-BEISPIELE PRO LEVEL:
A1: Wie heißt du? Woher kommst du? Was machst du gern?
A2: Was hast du gestern gemacht? Beschreibe deine Familie. Was möchtest du am Wochenende machen?
B1: Was denkst du über soziale Medien? Erzähle von einer interessanten Reise. Was würdest du ändern?
B2: Wie beurteilst du die Work-Life-Balance? Diskutiere die Auswirkungen von KI. Was wäre passiert, wenn...?

GESPRÄCHSABLAUF (2-3 Minuten):
1. Begrüßung: "Hallo! Ich bin Frau Schmidt. Schön, dich kennenzulernen!"
2. Erste Frage (A2): z.B. "Erzähl mir ein bisschen von dir."
3. 3-4 weitere Fragen - PASSE DAS NIVEAU AN
4. Abschluss: "Vielen Dank für das nette Gespräch! Das war's für heute."

WICHTIGE REGELN:
- Sprich NUR Deutsch (keine englischen Wörter)
- Halte deine Antworten KURZ (1-2 Sätze), dann stelle die nächste Frage
- KORRIGIERE NICHT - dies ist ein Test, keine Unterrichtsstunde
- Sei warm, freundlich und ermutigend
- Wenn der Schüler nicht versteht, formuliere einfacher um
- Passe deine SPRECHGESCHWINDIGKEIT an das erkannte Level an

Beginne JETZT mit der Begrüßung und deiner ersten Frage.`;

const LevelTestSpeaking = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const [stage, setStage] = useState('intro');
  const [error, setError] = useState(null);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(180);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const audioElementRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);

  // Keep messagesRef in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const startSession = async () => {
    if (!user) {
      setError('Please log in to take the speaking test.');
      return;
    }

    setStage('connecting');
    setError(null);

    try {
      // Get session token from backend
      const response = await fetch('/api/speaking/speaking-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: ADAPTIVE_ASSESSMENT_PROMPT,
          level: 'assessment',
          voice: 'shimmer'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create speaking session');
      }

      const { client_secret } = await response.json();

      // Microphone
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        throw new Error('Microphone access denied. Please allow microphone access and try again.');
      }
      localStreamRef.current = stream;

      // Set up WebRTC
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.setAttribute('playsinline', '');
      audioElementRef.current = audioEl;

      pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      dc.onopen = () => {
        setStage('active');
        startTimer();
      };
      dc.onmessage = handleDataChannelMessage;

      // SDP exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client_secret}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!sdpResponse.ok) {
        throw new Error(`Voice server connection failed (${sdpResponse.status})`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      console.error('Speaking session error:', err);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      setError(err.message || 'Failed to start speaking session');
      setStage('error');
    }
  };

  const handleDataChannelMessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'input_audio_buffer.speech_started':
          setIsUserSpeaking(true);
          break;
        case 'input_audio_buffer.speech_stopped':
          setIsUserSpeaking(false);
          break;
        case 'response.audio.started':
          setIsAiSpeaking(true);
          break;
        case 'response.audio.done':
        case 'response.done':
          setIsAiSpeaking(false);
          break;
        case 'conversation.item.input_audio_transcription.completed':
          if (data.transcript) {
            setMessages(prev => [...prev, { role: 'user', content: data.transcript }]);
          }
          break;
        case 'response.audio_transcript.done':
          if (data.transcript) {
            setMessages(prev => [...prev, { role: 'assistant', content: data.transcript }]);
          }
          break;
      }
    } catch (err) {
      console.error('Data channel error:', err);
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

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (dataChannelRef.current) { dataChannelRef.current.close(); dataChannelRef.current = null; }
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    if (audioElementRef.current) { audioElementRef.current.srcObject = null; }
  };

  const endSession = async () => {
    cleanup();
    const currentMessages = messagesRef.current;

    if (currentMessages.length > 0) {
      setStage('evaluating');
      await evaluateConversation(currentMessages);
    } else {
      onComplete(null);
    }
  };

  const evaluateConversation = async (conversationMessages) => {
    try {
      const placementPrompt = `Du bist ein erfahrener CEFR-Prüfer. Analysiere dieses Gespräch und BESTIMME das Sprachniveau des Schülers.

GESPRÄCH:
${conversationMessages.map(m => `${m.role === 'user' ? 'Schüler' : 'Lehrer'}: ${m.content}`).join('\n')}

BEWERTE JEDE KATEGORIE (0-20 Punkte) BASIEREND AUF DEM GEZEIGTEN NIVEAU:

1. AUSSPRACHE (pronunciation): Wie verständlich spricht der Schüler?
   - 16-20: Sehr klar, kaum Akzent, natürliche Intonation (B2+)
   - 12-15: Gut verständlich, leichter Akzent, angemessene Intonation (B1)
   - 8-11: Verständlich mit etwas Mühe, merklicher Akzent (A2)
   - 4-7: Schwer verständlich, starker Akzent (A1)
   - 0-3: Kaum verständlich

2. GRAMMATIK (grammar): Wie korrekt ist die Grammatik?
   - 16-20: Komplexe Strukturen, wenige Fehler, Konjunktiv, Nebensätze (B2)
   - 12-15: Gute Grundstruktur, einige Fehler bei komplexeren Formen (B1)
   - 8-11: Einfache Sätze meist korrekt, Fehler bei Fällen/Artikeln (A2)
   - 4-7: Grundlegende Wortstellung, häufige Fehler (A1)
   - 0-3: Kaum grammatische Struktur

3. WORTSCHATZ (vocabulary): Wie breit und präzise ist der Wortschatz?
   - 16-20: Reicher, nuancierter Wortschatz, idiomatische Ausdrücke (B2)
   - 12-15: Guter Alltagswortschatz, kann Meinungen ausdrücken (B1)
   - 8-11: Grundwortschatz für alltägliche Situationen (A2)
   - 4-7: Sehr begrenzter Wortschatz, nur Grundbegriffe (A1)
   - 0-3: Minimaler Wortschatz

4. FLÜSSIGKEIT (fluency): Wie flüssig spricht der Schüler?
   - 16-20: Fließend, natürliches Tempo, kaum Pausen (B2)
   - 12-15: Meist flüssig, gelegentliche Pausen zum Nachdenken (B1)
   - 8-11: Merkliche Pausen, aber kann Gedanken vervollständigen (A2)
   - 4-7: Häufige Pausen, stockend (A1)
   - 0-3: Sehr stockend, lange Pausen

5. VERSTÄNDNIS (comprehension): Wie gut versteht der Schüler?
   - 16-20: Versteht komplexe Fragen, reagiert angemessen (B2)
   - 12-15: Versteht die meisten Fragen, bittet selten um Wiederholung (B1)
   - 8-11: Versteht einfache Fragen, braucht manchmal Vereinfachung (A2)
   - 4-7: Versteht nur sehr einfache Fragen (A1)
   - 0-3: Versteht kaum

BESTIMME DAS GESAMTNIVEAU:
- 80-100 Punkte = B2
- 60-79 Punkte = B1
- 40-59 Punkte = A2
- 20-39 Punkte = A1
- 0-19 Punkte = unter A1

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
  "feedback": "<2-3 Sätze auf Deutsch über die Stärken und Verbesserungsmöglichkeiten>",
  "strengths": ["<Stärke 1>", "<Stärke 2>"],
  "improvements": ["<Verbesserung 1>", "<Verbesserung 2>"],
  "recommendation": "<HÖHER|GLEICH|WIEDERHOLEN>"
}`;

      const response = await fetch('/api/speaking/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          session_token: `level-test-${Date.now()}`,
          level: 'placement',
          messages: conversationMessages,
          customPrompt: placementPrompt
        })
      });

      if (!response.ok) throw new Error('Evaluation failed');

      const evaluation = await response.json();
      onComplete(evaluation);

    } catch (err) {
      console.error('Evaluation error:', err);
      onComplete(null);
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            <div className="adaptive-badge">
              <Sparkles size={14} />
              Adaptive A1–B2
            </div>
          </div>

          <div className="speaking-info">
            <div className="info-item">
              <Phone size={20} />
              <span>2-3 minute conversation</span>
            </div>
            <div className="info-item">
              <Sparkles size={20} />
              <span>Adapts to your level</span>
            </div>
          </div>

          <div className="speaking-instructions">
            <h3>How it works</h3>
            <ul>
              <li>You'll have a natural conversation with Frau Schmidt, an AI German teacher</li>
              <li>She'll start with medium-difficulty questions and adapt based on your responses</li>
              <li>Speak at whatever level you're comfortable — simple or advanced</li>
              <li>Your grammar, vocabulary, fluency, and pronunciation will be assessed</li>
            </ul>
          </div>

          <div className="speaking-tip">
            <Volume2 size={18} />
            <span>Tip: Speak naturally! It's better to make mistakes than to stay silent.</span>
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

  // Connecting
  if (stage === 'connecting') {
    return (
      <div className="level-test-container">
        <div className="question-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={48} className="spin" style={{ color: '#1D9E75', marginBottom: '1rem' }} />
          <h2>Connecting...</h2>
          <p style={{ color: '#666' }}>Setting up your conversation with Frau Schmidt</p>
        </div>
      </div>
    );
  }

  // Error
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

  // Evaluating
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

  // Active conversation
  if (stage === 'active') {
    return (
      <div className="level-test-container">
        <div className="question-card speaking-active">
          {/* Header */}
          <div className="question-header">
            <div className="question-header-left">
              <span className="header-title">Speaking Test</span>
              <div className="adaptive-badge small">
                <Sparkles size={12} />
                Adaptive
              </div>
            </div>
            <span className={`timer ${timeRemaining < 30 ? 'timer-warning' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Avatar */}
          <div className="speaking-avatar-area">
            <div className={`speaking-avatar ${isUserSpeaking ? 'user-speaking' : ''} ${isAiSpeaking ? 'ai-speaking' : ''}`}>
              {isAiSpeaking ? <Volume2 size={40} /> : <Mic size={40} />}
            </div>
            <p className="speaking-status">
              {isUserSpeaking && 'Du sprichst...'}
              {isAiSpeaking && 'Frau Schmidt spricht...'}
              {!isUserSpeaking && !isAiSpeaking && 'Bereit zum Sprechen'}
            </p>
          </div>

          {/* Transcript */}
          <div className="speaking-transcript">
            {messages.slice(-6).map((msg, i) => (
              <div key={i} className={`transcript-message ${msg.role}`}>
                <span className="transcript-role">{msg.role === 'user' ? 'Du' : 'Frau Schmidt'}:</span>
                <span className="transcript-text">{msg.content}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="transcript-empty">Warte auf Frau Schmidt...</p>
            )}
          </div>

          {/* Footer */}
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
