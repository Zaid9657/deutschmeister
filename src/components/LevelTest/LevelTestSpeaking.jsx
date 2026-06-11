import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, PhoneOff, Loader2, AlertCircle, Volume2, Phone, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthHeaders } from '../../utils/supabase';

// The placement system prompt lives server-side in speaking-session.mjs and is
// selected via the validated `mode: 'placement'` flag — no prompt text here.

const TEST_DURATION_SECONDS = 180;

// ---------------------------------------------------------------------------
// Audio helpers (mirrors SpeakingPractice.jsx — Gemini Live PCM pipeline)
// ---------------------------------------------------------------------------

function floatTo16BitPCM(float32Array) {
  const buf = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return buf;
}

function int16ToFloat32(int16Array) {
  const float32 = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32[i] = int16Array[i] / 0x8000;
  }
  return float32;
}

// Average-pooling downsampler for browsers that don't honor a custom
// AudioContext sampleRate (e.g. older Safari) — Gemini requires 16kHz input.
function downsampleTo(float32, fromRate, toRate) {
  if (fromRate === toRate) return float32;
  const ratio = fromRate / toRate;
  const newLen = Math.floor(float32.length / ratio);
  const out = new Float32Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), float32.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += float32[j];
    out[i] = sum / (end - start || 1);
  }
  return out;
}

function base64Encode(int16Array) {
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Decode(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

const LevelTestSpeaking = ({ onComplete, onSkip }) => {
  const { user, loading: authLoading } = useAuth();
  const [stage, setStage] = useState('intro');
  const [error, setError] = useState(null);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(TEST_DURATION_SECONDS);

  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);

  // Audio refs
  const inputCtxRef = useRef(null);
  const outputCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const playbackCursorRef = useRef(0);
  const scheduledSourcesRef = useRef([]);
  const micBufferRef = useRef([]);
  const setupCompleteRef = useRef(false);
  const endingRef = useRef(false);

  // Transcript accumulators (committed on turnComplete)
  const userTranscriptRef = useRef('');
  const assistantTranscriptRef = useRef('');

  // Keep messagesRef in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // No authenticated session → the speaking step can't run (the backend is
  // JWT-required). Proceed silently as if the user pressed skip.
  useEffect(() => {
    if (!authLoading && !user && stage === 'intro') {
      onSkip();
    }
  }, [authLoading, user, stage, onSkip]);

  const saveMessage = useCallback((role, content) => {
    if (!content?.trim()) return;
    const msg = { role, content: content.trim() };
    // Update the ref synchronously for reliable access in endSession
    messagesRef.current = [...messagesRef.current, msg];
    setMessages(prev => [...prev, msg]);
  }, []);

  // ---------------------------------------------------------------------------
  // Audio output: play 24kHz PCM from Gemini, gap-free
  // ---------------------------------------------------------------------------

  const playAudioChunk = useCallback((base64Data) => {
    if (!outputCtxRef.current) return;
    const ctx = outputCtxRef.current;
    const int16 = base64Decode(base64Data);
    const float32 = int16ToFloat32(int16);
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    scheduledSourcesRef.current.push(src);
    src.onended = () => {
      const arr = scheduledSourcesRef.current;
      const idx = arr.indexOf(src);
      if (idx !== -1) arr.splice(idx, 1);
    };

    const now = ctx.currentTime;
    if (playbackCursorRef.current < now) {
      playbackCursorRef.current = now;
    }
    src.start(playbackCursorRef.current);
    playbackCursorRef.current += buffer.duration;
  }, []);

  // Barge-in: stop everything already scheduled, not just future chunks
  const stopPlayback = useCallback(() => {
    for (const s of scheduledSourcesRef.current) {
      try { s.stop(); } catch { /* already stopped */ }
    }
    scheduledSourcesRef.current = [];
    playbackCursorRef.current = 0;
  }, []);

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setupCompleteRef.current = false;
    micBufferRef.current = [];

    for (const s of scheduledSourcesRef.current) {
      try { s.stop(); } catch { /* already stopped */ }
    }
    scheduledSourcesRef.current = [];

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (inputCtxRef.current && inputCtxRef.current.state !== 'closed') {
      inputCtxRef.current.close().catch(() => {});
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current && outputCtxRef.current.state !== 'closed') {
      outputCtxRef.current.close().catch(() => {});
      outputCtxRef.current = null;
    }
    if (wsRef.current) {
      // Detach handlers first so an intentional close doesn't re-enter
      // the unexpected-close path.
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // WebSocket message handler (Gemini Live protocol)
  // ---------------------------------------------------------------------------

  const handleWsMessage = useCallback(async (event) => {
    let payload;
    try {
      if (typeof event.data === 'string') {
        payload = JSON.parse(event.data);
      } else if (event.data instanceof Blob) {
        const text = await event.data.text();
        payload = JSON.parse(text);
      } else if (event.data instanceof ArrayBuffer) {
        const text = new TextDecoder().decode(event.data);
        payload = JSON.parse(text);
      } else {
        return;
      }
    } catch { return; }

    // Setup complete — session is live
    if (payload.setupComplete != null) {
      setupCompleteRef.current = true;
      setStage('active');
      startTimer();
      // Flush any buffered mic data
      const buffered = micBufferRef.current;
      micBufferRef.current = [];
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        for (const chunk of buffered) {
          ws.send(JSON.stringify(chunk));
        }
      }
      return;
    }

    // Top-level error
    if (payload.error) {
      console.error('[Gemini] Server error:', JSON.stringify(payload.error));
      return;
    }

    const sc = payload.serverContent;
    if (!sc) return;

    // Barge-in: user interrupted the model
    if (sc.interrupted) {
      stopPlayback();
      setIsAiSpeaking(false);
      setIsUserSpeaking(true);
      return;
    }

    // Output transcription (Frau Schmidt)
    if (sc.outputTranscription?.text) {
      assistantTranscriptRef.current += sc.outputTranscription.text;
    }

    // Input transcription (student)
    if (sc.inputTranscription?.text) {
      userTranscriptRef.current += sc.inputTranscription.text;
      setIsUserSpeaking(true);
    }

    // Audio from model
    if (sc.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
          setIsAiSpeaking(true);
          setIsUserSpeaking(false);
          playAudioChunk(part.inlineData.data);
        }
      }
    }

    // Turn complete — commit transcripts
    if (sc.turnComplete) {
      if (userTranscriptRef.current.trim()) {
        saveMessage('user', userTranscriptRef.current);
      }
      if (assistantTranscriptRef.current.trim()) {
        saveMessage('assistant', assistantTranscriptRef.current);
      }
      userTranscriptRef.current = '';
      assistantTranscriptRef.current = '';
      setIsUserSpeaking(false);
      setIsAiSpeaking(false);
    }
  }, [saveMessage, playAudioChunk, stopPlayback, startTimer]);

  // ---------------------------------------------------------------------------
  // Connect: mic → placement session → WebSocket → audio pipeline
  // ---------------------------------------------------------------------------

  const startSession = async () => {
    if (!user) {
      setError('Please log in to take the speaking test.');
      return;
    }

    setStage('connecting');
    setError(null);
    endingRef.current = false;

    try {
      // 1. Create audio contexts synchronously, inside the user gesture —
      // iOS Safari blocks contexts created or resumed outside a gesture.
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      let inputCtx;
      try {
        inputCtx = new AudioCtx({ sampleRate: 16000 });
      } catch {
        inputCtx = new AudioCtx(); // custom rate rejected — we downsample below
      }
      let outputCtx;
      try {
        outputCtx = new AudioCtx({ sampleRate: 24000 });
      } catch {
        outputCtx = new AudioCtx(); // buffers carry 24000 explicitly; browser resamples
      }
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      playbackCursorRef.current = 0;
      if (inputCtx.state === 'suspended') inputCtx.resume().catch(() => {});
      if (outputCtx.state === 'suspended') outputCtx.resume().catch(() => {});

      // 2. Acquire microphone
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (micErr) {
        console.error('Microphone access error:', micErr);
        cleanup();
        setError('Microphone access denied. Please allow microphone access and try again.');
        setStage('error');
        return;
      }
      streamRef.current = stream;

      // 3. Get ephemeral token — placement mode, server-owned prompt
      const response = await fetch('/api/speaking/speaking-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ mode: 'placement' }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create speaking session');
      }

      const { ephemeral_token: ephemeralToken } = await response.json();
      if (!ephemeralToken) throw new Error('Failed to create speaking session');

      // 4. Open WebSocket to Gemini Live
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(ephemeralToken)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          setup: {
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            sessionResumption: {},
          },
        }));
      };

      ws.onmessage = handleWsMessage;

      ws.onerror = (e) => {
        console.error('[Gemini WS] error:', e);
        if (!setupCompleteRef.current) {
          cleanup();
          setError('Voice server connection failed. Please try again.');
          setStage('error');
        }
      };

      ws.onclose = (e) => {
        console.log('[Gemini WS] closed:', e.code, e.reason);
        if (setupCompleteRef.current && !endingRef.current) {
          // Server ended the session unexpectedly — evaluate what we have
          endSession();
        }
      };

      // 5. Set up audio input pipeline (16kHz)
      const micSource = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = micSource;

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const micRate = inputCtx.sampleRate;
      if (micRate !== 16000) {
        console.warn(`[Audio] Input context running at ${micRate}Hz, downsampling to 16kHz`);
      }

      processor.onaudioprocess = (e) => {
        const raw = e.inputBuffer.getChannelData(0);
        const float32 = micRate === 16000 ? raw : downsampleTo(raw, micRate, 16000);
        const int16 = floatTo16BitPCM(float32);
        const b64 = base64Encode(int16);
        const chunk = {
          realtimeInput: {
            mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: b64 }],
          },
        };

        if (!setupCompleteRef.current) {
          micBufferRef.current.push(chunk);
          return;
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(chunk));
        }
      };

      micSource.connect(processor);
      processor.connect(inputCtx.destination);

    } catch (err) {
      console.error('Speaking session error:', err);
      cleanup();
      setError(err.message || 'Failed to start speaking session');
      setStage('error');
    }
  };

  // ---------------------------------------------------------------------------
  // End session → evaluate
  // ---------------------------------------------------------------------------

  const endSession = async () => {
    // Guard against double entry (timer expiry + user click + ws close)
    if (endingRef.current) return;
    endingRef.current = true;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    // Small grace period to let in-flight transcription messages arrive
    await new Promise(r => setTimeout(r, 300));

    // Commit any pending accumulated transcripts
    if (userTranscriptRef.current.trim()) {
      saveMessage('user', userTranscriptRef.current);
      userTranscriptRef.current = '';
    }
    if (assistantTranscriptRef.current.trim()) {
      saveMessage('assistant', assistantTranscriptRef.current);
      assistantTranscriptRef.current = '';
    }

    const currentMessages = [...messagesRef.current];

    cleanup();
    setIsUserSpeaking(false);
    setIsAiSpeaking(false);

    if (currentMessages.length > 0) {
      setStage('evaluating');
      await evaluateConversation(currentMessages);
    } else {
      onComplete(null);
    }
  };

  const evaluateConversation = async (conversationMessages) => {
    try {
      const response = await fetch('/api/speaking/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          session_token: `level-test-${Date.now()}`,
          level: 'placement',
          mode: 'placement',
          messages: conversationMessages,
        }),
      });

      if (!response.ok) throw new Error('Evaluation failed');

      const evaluation = await response.json();
      if (evaluation.evaluation_failed) {
        onComplete(null);
        return;
      }
      onComplete(evaluation);

    } catch (err) {
      console.error('Evaluation error:', err);
      onComplete(null);
    }
  };

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Intro screen
  if (stage === 'intro') {
    // Unauthenticated: render nothing — the auto-skip effect advances the test
    if (!user) return null;
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
              <li>Your grammar, vocabulary, fluency, and comprehension will be assessed</li>
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
