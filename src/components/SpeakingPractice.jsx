import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, Volume2, Loader2, Phone, PhoneOff, X, AlertCircle, MessageSquare, ExternalLink, Copy, CheckCheck } from 'lucide-react';
import { getConfigForLevel } from '../constants/speakingPrompts';

const SPEAKING_LABELS = {
  idle: 'Bereit',
  user_speaking: 'Du sprichst…',
  ai_speaking: 'Lehrer spricht…',
};

// ---------------------------------------------------------------------------
// Platform / browser detection helpers
// ---------------------------------------------------------------------------

const IN_APP_BROWSER_PATTERNS = [
  /FBAN/i,                // Facebook
  /FBAV/i,                // Facebook
  /FB_IAB/i,              // Facebook in-app
  /Instagram/i,           // Instagram
  /Twitter/i,             // Twitter / X
  /Line\//i,              // Line
  /MicroMessenger/i,      // WeChat
  /LinkedInApp/i,         // LinkedIn
  /BytedanceWebview/i,    // TikTok
  /musical_ly/i,          // TikTok (old)
  /TikTok/i,              // TikTok
  /Snapchat/i,            // Snapchat
  /Pinterest/i,           // Pinterest
];

function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  for (const pattern of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(ua)) return pattern.source.replace(/[/\\^$*+?.()|[\]{}]/g, '').replace(/i$/, '');
  }
  return null;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function checkSpeakingSupport() {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'no_window' };
  }

  const inApp = detectInAppBrowser();
  if (inApp) {
    return { supported: false, reason: 'in_app_browser', inAppBrowser: inApp, isIOS: isIOS() };
  }

  if (!window.WebSocket) {
    return { supported: false, reason: 'no_websocket', isIOS: isIOS() };
  }
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return { supported: false, reason: 'no_media_devices', isIOS: isIOS() };
  }
  if (!window.AudioContext && !window.webkitAudioContext) {
    return { supported: false, reason: 'no_audio_context', isIOS: isIOS() };
  }
  return { supported: true, isIOS: isIOS() };
}

function classifyConnectionError(err) {
  const msg = (err?.message || err?.name || '').toLowerCase();
  const ios = isIOS();

  if (
    msg.includes('permission denied') ||
    msg.includes('not allowed') ||
    msg.includes('notallowederror') ||
    err?.name === 'NotAllowedError'
  ) {
    return {
      userMessage: ios
        ? 'Mikrofon-Zugriff verweigert. Gehe zu Einstellungen > Safari > Mikrofon und erlaube den Zugriff für deutsch-meister.de'
        : 'Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.',
      type: 'permission',
    };
  }

  if (
    msg.includes('not found') ||
    msg.includes('notfounderror') ||
    msg.includes('requested device not found') ||
    err?.name === 'NotFoundError'
  ) {
    return {
      userMessage: 'Kein Mikrofon gefunden. Bitte schließe ein Mikrofon an und versuche es erneut.',
      type: 'no_device',
    };
  }

  if (
    msg.includes('not readable') ||
    msg.includes('notreadableerror') ||
    err?.name === 'NotReadableError'
  ) {
    return {
      userMessage: 'Das Mikrofon konnte nicht geöffnet werden. Möglicherweise wird es von einer anderen App verwendet.',
      type: 'device_busy',
    };
  }

  if (
    msg.includes('not supported') ||
    msg.includes('websocket') ||
    msg.includes('getusermedia') ||
    msg.includes('audiocontext')
  ) {
    return {
      userMessage: 'Dein Browser unterstützt diese Funktion nicht. Bitte verwende Chrome, Edge oder Safari (Desktop).',
      type: 'unsupported',
    };
  }

  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network') ||
    msg.includes('connection failed') ||
    msg.includes('aborted')
  ) {
    return {
      userMessage: 'Verbindung fehlgeschlagen — bitte prüfe deine Internetverbindung und versuche es erneut.',
      type: 'network',
    };
  }

  return {
    userMessage: 'Verbindung fehlgeschlagen — bitte erneut versuchen.',
    type: 'unknown',
  };
}

// ---------------------------------------------------------------------------
// Audio helpers
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

// ---------------------------------------------------------------------------
// In-app browser warning screen
// ---------------------------------------------------------------------------

function InAppBrowserGate({ onCancel }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const ios = isIOS();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('URL kopieren:', url);
    }
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-amber-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-3">
          In-App-Browser erkannt
        </h2>
        <p className="text-sm text-white/60 leading-relaxed mb-6">
          Bitte öffne diese Seite in {ios ? 'Safari' : 'Chrome oder Safari'}. In-App-Browser unterstützen kein Mikrofon.
        </p>

        <div className="bg-white/[0.06] rounded-xl border border-white/10 p-3 mb-4">
          <p className="text-xs text-white/40 mb-1.5 text-left">Seiten-URL:</p>
          <p className="text-sm text-white/80 break-all text-left font-mono">{url}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-colors text-sm"
          >
            {copied ? (
              <>
                <CheckCheck className="w-4 h-4" />
                Kopiert!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                URL kopieren
              </>
            )}
          </button>

          <button
            onClick={handleOpenExternal}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors text-sm border border-white/10"
          >
            <ExternalLink className="w-4 h-4" />
            {ios ? 'In Safari öffnen' : 'Im Browser öffnen'}
          </button>

          <button
            onClick={onCancel}
            className="mt-1 text-xs text-white/30 hover:text-white/50 transition-colors py-2"
          >
            Abbrechen
          </button>
        </div>

        <div className="mt-6 bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 text-left">
          <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Anleitung</p>
          <ol className="text-xs text-white/40 space-y-1.5 list-decimal list-inside">
            <li>Tippe oben auf die drei Punkte (⋯) oder das Menü</li>
            <li>Wähle „{ios ? 'In Safari öffnen' : 'Im Browser öffnen'}"</li>
            <li>Oder kopiere die URL und füge sie in {ios ? 'Safari' : 'Chrome'} ein</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function generateSessionToken() {
  return 'sp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SpeakingPractice = ({ level, userId, onComplete, onCancel }) => {
  const config = getConfigForLevel(level);
  const browserCheck = useMemo(() => checkSpeakingSupport(), []);
  const isInAppBrowser = browserCheck.reason === 'in_app_browser';

  const [connectionState, setConnectionState] = useState('disconnected');
  const [speakingState, setSpeakingState] = useState('idle');
  const [timeRemaining, setTimeRemaining] = useState(config.durationMinutes * 60);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [saveWarning, setSaveWarning] = useState(false);

  const sessionTokenRef = useRef(generateSessionToken());
  const retryQueueRef = useRef([]);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);
  const transcriptEndRef = useRef(null);

  // Audio refs
  const inputCtxRef = useRef(null);
  const outputCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const playbackCursorRef = useRef(0);
  const micBufferRef = useRef([]);
  const setupCompleteRef = useRef(false);

  // Transcript accumulators
  const assistantTranscriptRef = useRef('');
  const userTranscriptRef = useRef('');

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  // Timer countdown — only starts after setupComplete sets connectionState to 'connected'
  useEffect(() => {
    if (connectionState !== 'connected') return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { handleDisconnect(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [connectionState]);

  // ---------------------------------------------------------------------------
  // Message persistence with retry queue (preserved from prior implementation)
  // ---------------------------------------------------------------------------

  const persistMessage = useCallback(async (payload) => {
    const res = await fetch('/api/speaking/save-speaking-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`save failed: ${res.status}`);
  }, []);

  const saveMessage = useCallback(async (role, content) => {
    if (!content || !content.trim()) return;
    const msg = { role, content: content.trim() };
    setMessages((prev) => [...prev, msg]);
    const payload = {
      session_token: sessionTokenRef.current,
      user_id: userId, role, content: content.trim(), level: config.level,
    };
    try {
      await persistMessage(payload);
    } catch {
      retryQueueRef.current.push(payload);
      setTimeout(async () => {
        const queue = [...retryQueueRef.current];
        retryQueueRef.current = [];
        for (const item of queue) {
          try { await persistMessage(item); }
          catch { setSaveWarning(true); }
        }
      }, 3000);
    }
  }, [userId, config.level, persistMessage]);

  // ---------------------------------------------------------------------------
  // Audio output: play 24kHz PCM from Gemini
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

    const now = ctx.currentTime;
    if (playbackCursorRef.current < now) {
      playbackCursorRef.current = now;
    }
    src.start(playbackCursorRef.current);
    playbackCursorRef.current += buffer.duration;
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
      setConnectionState('connected');
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
      setError(payload.error.message || 'Serverfehler');
      return;
    }

    const sc = payload.serverContent;
    if (!sc) return;

    // Barge-in: user interrupted the model
    if (sc.interrupted) {
      playbackCursorRef.current = 0;
      setSpeakingState('user_speaking');
      return;
    }

    // Output transcription (assistant)
    if (sc.outputTranscription?.text) {
      assistantTranscriptRef.current += sc.outputTranscription.text;
      setCurrentTranscript(assistantTranscriptRef.current);
    }

    // Input transcription (user)
    if (sc.inputTranscription?.text) {
      userTranscriptRef.current += sc.inputTranscription.text;
      setSpeakingState('user_speaking');
    }

    // Audio from model
    if (sc.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
          setSpeakingState('ai_speaking');
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
      setCurrentTranscript('');
      setSpeakingState('idle');
    }
  }, [saveMessage, playAudioChunk]);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    setupCompleteRef.current = false;
    micBufferRef.current = [];

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
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Connect: mic → session → WebSocket → audio pipeline
  // ---------------------------------------------------------------------------

  const handleConnect = async () => {
    setConnectionState('connecting');
    setError(null);

    const compat = checkSpeakingSupport();
    if (!compat.supported) {
      setError('Dein Browser unterstützt diese Funktion nicht. Bitte verwende Chrome, Edge oder Safari (Desktop).');
      setConnectionState('error');
      return;
    }

    try {
      // 1. Acquire microphone
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
        setError(classifyConnectionError(micErr).userMessage);
        setConnectionState('error');
        return;
      }
      streamRef.current = stream;

      // 2. Get ephemeral token from backend
      let ephemeralToken;
      try {
        const sessionRes = await fetch('/api/speaking/speaking-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: config.systemPrompt,
            level: config.level,
            user_id: userId,
            voice: config.voice,
          }),
        });
        if (!sessionRes.ok) {
          const err = await sessionRes.json().catch(() => ({}));
          if (sessionRes.status === 403) {
            const reason = err.reason;
            if (reason === 'subscription_required') {
              throw new Error('Ein Abonnement ist erforderlich, um Sprechübungen zu nutzen.');
            } else if (reason === 'monthly_limit_reached') {
              throw new Error(`Monatliches Limit erreicht (${err.used}/${err.limit} Sitzungen). Upgrade auf Pro für mehr Übungen.`);
            } else if (reason === 'trial_limit_reached') {
              throw new Error(`Kostenlose Sitzungen aufgebraucht (${err.used}/${err.limit}). Upgrade auf Pro für mehr Übungen.`);
            }
            throw new Error(err.error || 'Zugriff verweigert');
          }
          throw new Error(err.error || `Sitzung konnte nicht erstellt werden (${sessionRes.status})`);
        }
        const data = await sessionRes.json();
        ephemeralToken = data.ephemeral_token;
      } catch (apiErr) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        console.error('Session API error:', apiErr);
        if (apiErr.message && !apiErr.message.startsWith('Failed to fetch')) {
          setError(apiErr.message);
        } else {
          setError(classifyConnectionError(apiErr).userMessage);
        }
        setConnectionState('error');
        return;
      }

      // 3. Open WebSocket to Gemini Live
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
        if (connectionState !== 'connected') {
          setError('Verbindung zum Sprachserver fehlgeschlagen.');
          setConnectionState('error');
          cleanup();
        }
      };

      ws.onclose = (e) => {
        console.log('[Gemini WS] closed:', e.code, e.reason);
        setConnectionState((prev) => prev === 'connected' ? 'disconnected' : prev);
      };

      // 4. Set up audio input pipeline (16kHz)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      inputCtxRef.current = inputCtx;

      const micSource = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = micSource;

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0);
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

      // 5. Set up audio output context (24kHz)
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      outputCtxRef.current = outputCtx;
      playbackCursorRef.current = 0;

    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || classifyConnectionError(err).userMessage);
      setConnectionState('error');
      cleanup();
    }
  };

  // ---------------------------------------------------------------------------
  // Disconnect → evaluate
  // ---------------------------------------------------------------------------

  const handleDisconnect = useCallback(async () => {
    // Commit any remaining accumulated transcripts before cleanup
    if (userTranscriptRef.current.trim()) {
      saveMessage('user', userTranscriptRef.current);
      userTranscriptRef.current = '';
    }
    if (assistantTranscriptRef.current.trim()) {
      saveMessage('assistant', assistantTranscriptRef.current);
      assistantTranscriptRef.current = '';
    }
    setCurrentTranscript('');

    cleanup();
    setConnectionState('disconnected');
    setSpeakingState('idle');

    // Wait a tick for messages state to update from the saveMessage calls above
    await new Promise((r) => setTimeout(r, 50));

    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) { onComplete?.(null); return; }
    setEvaluating(true);
    try {
      const evalRes = await fetch('/api/speaking/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, session_token: sessionTokenRef.current,
          level: config.level, messages: currentMessages,
        }),
      });
      if (evalRes.ok) {
        const result = await evalRes.json();
        onComplete?.(result);
      } else {
        console.error('Evaluation failed:', await evalRes.text());
        onComplete?.(null);
      }
    } catch (err) { console.error('Evaluation error:', err); onComplete?.(null); }
    finally { setEvaluating(false); }
  }, [cleanup, userId, config.level, onComplete, saveMessage]);

  useEffect(() => { return () => { cleanup(); }; }, [cleanup]);

  const isConnected = connectionState === 'connected';
  const isLowTime = timeRemaining <= 60;
  const totalTime = config.durationMinutes * 60;
  const timerProgress = isConnected ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const timerCircumference = 2 * Math.PI * 28;

  if (isInAppBrowser) {
    return <InAppBrowserGate onCancel={onCancel} />;
  }

  if (evaluating) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-teal-500/30 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-teal-400/20 animate-ping" />
        </div>
        <h3 className="text-lg font-semibold text-white mt-8 mb-2">Auswertung läuft…</h3>
        <p className="text-sm text-slate-400">Dein Gespräch wird analysiert</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex flex-col overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 bg-white/[0.06] backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white/90 text-xs font-bold tracking-wide">
            {config.level}
          </span>
          <span className="text-sm text-white/40 hidden sm:inline">{config.name}</span>
        </div>

        {/* Center timer */}
        {isConnected && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <div className="relative w-[64px] h-[64px] flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke={isLowTime ? '#f43f5e' : '#2dd4bf'}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={timerCircumference - (timerProgress / 100) * timerCircumference}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <span className={`absolute text-sm font-bold tracking-wider ${isLowTime ? 'text-rose-400' : 'text-white'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        )}

        {/* Right: message count */}
        <div className="flex items-center gap-2 text-white/40">
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              {messages.length}
            </div>
          )}
        </div>
      </div>

      {/* Center stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* AI Avatar */}
        <div className="relative mb-6">
          {/* Outer glow */}
          <div className={`absolute -inset-4 rounded-full transition-all duration-700 ${
            speakingState === 'user_speaking'
              ? 'bg-teal-500/20 shadow-[0_0_60px_rgba(45,212,191,0.3)]'
              : speakingState === 'ai_speaking'
                ? 'bg-indigo-500/20 shadow-[0_0_60px_rgba(129,140,248,0.3)]'
                : 'bg-transparent'
          }`} />

          {/* Sound wave rings (user speaking) */}
          {speakingState === 'user_speaking' && (
            <>
              <div className="absolute -inset-6 rounded-full border border-teal-400/30 animate-[waveRing_1.5s_ease-out_infinite]" />
              <div className="absolute -inset-6 rounded-full border border-teal-400/20 animate-[waveRing_1.5s_ease-out_0.5s_infinite]" />
              <div className="absolute -inset-6 rounded-full border border-teal-400/10 animate-[waveRing_1.5s_ease-out_1s_infinite]" />
            </>
          )}

          {/* Main circle */}
          <div className={`relative w-44 h-44 sm:w-48 sm:h-48 rounded-full flex items-center justify-center transition-all duration-500 ${
            speakingState === 'user_speaking'
              ? 'bg-gradient-to-br from-teal-400 to-teal-600 scale-105'
              : speakingState === 'ai_speaking'
                ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 scale-[1.02]'
                : connectionState === 'connecting'
                  ? 'bg-white/[0.08]'
                  : isConnected
                    ? 'bg-white/[0.08]'
                    : 'bg-white/[0.05]'
          }`}>
            {/* Animated gradient border */}
            <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
              isConnected ? 'opacity-100' : 'opacity-0'
            }`} style={{
              background: speakingState === 'ai_speaking'
                ? 'conic-gradient(from 0deg, transparent, rgba(129,140,248,0.5), transparent, rgba(129,140,248,0.3), transparent)'
                : 'conic-gradient(from 0deg, transparent, rgba(45,212,191,0.3), transparent, rgba(45,212,191,0.15), transparent)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
              animation: isConnected ? 'spin 4s linear infinite' : 'none',
            }} />

            {/* Breathing animation for idle connected */}
            <div className={`absolute inset-2 rounded-full border transition-all duration-1000 ${
              isConnected && speakingState === 'idle'
                ? 'border-white/10 animate-[breathe_3s_ease-in-out_infinite]'
                : 'border-transparent'
            }`} />

            {/* Blob animation for AI speaking */}
            {speakingState === 'ai_speaking' && (
              <div className="absolute inset-4 rounded-full bg-indigo-400/20 animate-[blob_2s_ease-in-out_infinite]" />
            )}

            {/* Icon */}
            {connectionState === 'connecting' ? (
              <Loader2 className="w-14 h-14 text-teal-400 animate-spin" />
            ) : speakingState === 'ai_speaking' ? (
              <Volume2 className="w-14 h-14 text-white drop-shadow-lg" />
            ) : (
              <Mic className={`w-14 h-14 transition-colors duration-300 ${
                speakingState === 'user_speaking' ? 'text-white drop-shadow-lg' : isConnected ? 'text-white/60' : 'text-white/30'
              }`} />
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="mb-6 animate-[fadeIn_0.3s_ease-out]">
          {connectionState === 'error' ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/15 text-rose-400 text-sm font-medium backdrop-blur-sm border border-rose-500/20">
              <AlertCircle className="w-4 h-4" />
              Verbindungsfehler
            </span>
          ) : isConnected ? (
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border transition-all duration-500 ${
              speakingState === 'user_speaking'
                ? 'bg-teal-500/15 text-teal-300 border-teal-500/20'
                : speakingState === 'ai_speaking'
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
                  : 'bg-white/[0.06] text-white/50 border-white/[0.08]'
            }`}>
              <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                speakingState === 'user_speaking'
                  ? 'bg-teal-400 animate-pulse'
                  : speakingState === 'ai_speaking'
                    ? 'bg-indigo-400 animate-pulse'
                    : 'bg-white/40'
              }`} />
              {SPEAKING_LABELS[speakingState]}
            </span>
          ) : connectionState === 'connecting' ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] text-white/50 text-sm font-medium backdrop-blur-sm border border-white/[0.08]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Verbindung wird hergestellt…
            </span>
          ) : (
            <span className="text-sm text-white/30">Drücke den Knopf um zu starten</span>
          )}
        </div>

        {/* Transcript area */}
        {(currentTranscript || messages.length > 0) && (
          <div className="w-full max-w-md mb-6 animate-[fadeInUp_0.3s_ease-out]">
            <div className="bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/[0.08] p-4 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {messages.slice(-3).map((msg, i) => (
                <div key={i} className={`text-sm mb-2.5 last:mb-0 ${
                  msg.role === 'user' ? 'text-teal-300/90' : 'text-white/70'
                }`}>
                  <span className="font-semibold text-[11px] uppercase tracking-wider opacity-60 block mb-0.5">
                    {msg.role === 'user' ? 'Du' : 'Lehrer'}
                  </span>
                  {msg.content}
                </div>
              ))}
              {currentTranscript && (
                <div className="text-sm text-indigo-300/80">
                  <span className="font-semibold text-[11px] uppercase tracking-wider opacity-60 block mb-0.5">
                    Lehrer
                  </span>
                  {currentTranscript}
                  <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-[blink_1s_steps(1)_infinite] align-middle" />
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="w-full max-w-md mb-6">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Save warning — non-blocking */}
        {saveWarning && (
          <div className="w-full max-w-md mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 backdrop-blur-sm text-center">
              Einige Nachrichten konnten nicht gespeichert werden
            </div>
          </div>
        )}
      </div>

      {/* Bottom action area */}
      <div className="relative z-10 flex flex-col items-center pb-8 sm:pb-12 pt-4">
        {connectionState === 'disconnected' || connectionState === 'error' ? (
          <button
            onClick={handleConnect}
            className="group relative w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg shadow-emerald-500/25"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-[pulseRing_2s_ease-out_infinite]" />
            <Phone className="w-8 h-8" />
          </button>
        ) : connectionState === 'connecting' ? (
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
          </div>
        ) : (
          <button
            onClick={handleDisconnect}
            className="group relative w-20 h-20 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg shadow-rose-500/25"
          >
            <div className="absolute inset-0 rounded-full bg-rose-400/20 animate-[pulseRing_2s_ease-out_infinite]" />
            <PhoneOff className="w-8 h-8" />
          </button>
        )}

        <p className="text-[11px] text-white/30 mt-3 font-medium tracking-wide">
          {connectionState === 'disconnected' || connectionState === 'error'
            ? 'Gespräch starten'
            : connectionState === 'connecting'
              ? 'Verbinde…'
              : 'Beenden & Auswerten'}
        </p>

        <button
          onClick={() => { cleanup(); onCancel?.(); }}
          className="mt-4 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors py-2 px-4"
        >
          <X className="w-3.5 h-3.5" />
          Abbrechen
        </button>
      </div>

      <style>{`
        @keyframes waveRing {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.04); opacity: 0.6; }
        }
        @keyframes blob {
          0%, 100% { border-radius: 50%; transform: scale(1); }
          33% { border-radius: 45% 55% 55% 45%; transform: scale(1.05); }
          66% { border-radius: 55% 45% 45% 55%; transform: scale(0.97); }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SpeakingPractice;
