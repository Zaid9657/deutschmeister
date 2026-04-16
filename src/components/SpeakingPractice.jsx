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

/**
 * Check browser compatibility for WebRTC speaking features.
 * Returns { supported, reason, inAppBrowser?, isIOS? }.
 */
export function checkSpeakingSupport() {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'no_window' };
  }

  const inApp = detectInAppBrowser();
  if (inApp) {
    return { supported: false, reason: 'in_app_browser', inAppBrowser: inApp, isIOS: isIOS() };
  }

  if (!window.RTCPeerConnection && !window.webkitRTCPeerConnection) {
    return { supported: false, reason: 'no_webrtc', isIOS: isIOS() };
  }
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return { supported: false, reason: 'no_media_devices', isIOS: isIOS() };
  }
  return { supported: true, isIOS: isIOS() };
}

function classifyConnectionError(err) {
  const msg = (err?.message || err?.name || '').toLowerCase();
  const ios = isIOS();

  // Microphone permission denied
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

  // No microphone found
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

  // Device not readable (e.g. in use by another app)
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

  // Browser doesn't support required APIs
  if (
    msg.includes('not supported') ||
    msg.includes('rtcpeerconnection') ||
    msg.includes('getusermedia')
  ) {
    return {
      userMessage: 'Dein Browser unterstützt diese Funktion nicht. Bitte verwende Chrome, Edge oder Safari (Desktop).',
      type: 'unsupported',
    };
  }

  // Network / API failure
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

  // Default
  return {
    userMessage: 'Verbindung fehlgeschlagen — bitte erneut versuchen.',
    type: 'unknown',
  };
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
      // Fallback: prompt user to copy manually
      window.prompt('URL kopieren:', url);
    }
  };

  const handleOpenExternal = () => {
    // On iOS, window.open in in-app browsers sometimes opens Safari
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-amber-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-3">
          In-App-Browser erkannt
        </h2>
        <p className="text-sm text-white/60 leading-relaxed mb-6">
          Bitte öffne diese Seite in {ios ? 'Safari' : 'Chrome oder Safari'}. In-App-Browser unterstützen kein Mikrofon.
        </p>

        {/* URL box */}
        <div className="bg-white/[0.06] rounded-xl border border-white/10 p-3 mb-4">
          <p className="text-xs text-white/40 mb-1.5 text-left">Seiten-URL:</p>
          <p className="text-sm text-white/80 break-all text-left font-mono">{url}</p>
        </div>

        {/* Action buttons */}
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

        {/* Instructions */}
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

  const sessionTokenRef = useRef(generateSessionToken());
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);
  const transcriptRef = useRef('');
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  // Timer countdown
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

  const saveMessage = useCallback(async (role, content) => {
    if (!content || !content.trim()) return;
    const msg = { role, content: content.trim() };
    setMessages((prev) => [...prev, msg]);
    try {
      await fetch('/api/speaking/save-speaking-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionTokenRef.current,
          user_id: userId, role, content: content.trim(), level: config.level,
        }),
      });
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }, [userId, config.level]);

  const handleDataChannelMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'input_audio_buffer.speech_started':
          setSpeakingState('user_speaking'); break;
        case 'input_audio_buffer.speech_stopped':
          setSpeakingState('idle'); break;
        case 'response.audio_transcript.delta':
        case 'response.output_audio_transcript.delta':
          if (msg.delta) {
            transcriptRef.current += msg.delta;
            setCurrentTranscript(transcriptRef.current);
          }
          break;
        case 'response.audio_transcript.done':
        case 'response.output_audio_transcript.done':
          if (transcriptRef.current.trim()) saveMessage('assistant', transcriptRef.current);
          transcriptRef.current = '';
          setCurrentTranscript('');
          break;
        case 'response.audio.started':
        case 'response.output_audio.started':
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
    clearInterval(timerRef.current);
    if (dcRef.current) { dcRef.current.close(); dcRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);

  const handleConnect = async () => {
    setConnectionState('connecting');
    setError(null);

    // Pre-flight: check browser compatibility
    const compat = checkSpeakingSupport();
    if (!compat.supported) {
      const msg = compat.reason === 'no_webrtc'
        ? 'Dein Browser unterstützt diese Funktion nicht. Bitte verwende Chrome, Edge oder Safari (Desktop).'
        : 'Dein Browser unterstützt kein Mikrofon. Bitte verwende Chrome, Edge oder Safari (Desktop).';
      setError(msg);
      setConnectionState('error');
      return;
    }

    try {
      // 1. Request microphone FIRST so the user sees the permission prompt early
      //    (especially important on iOS Safari where timing matters)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        console.error('Microphone access error:', micErr);
        const classified = classifyConnectionError(micErr);
        setError(classified.userMessage);
        setConnectionState('error');
        return;
      }
      streamRef.current = stream;

      // 2. Create session via backend
      let client_secret;
      try {
        const sessionRes = await fetch('/api/speaking/speaking-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemPrompt: config.systemPrompt, level: config.level, user_id: userId }),
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
        client_secret = data.client_secret;
      } catch (apiErr) {
        // Stop the mic stream we already acquired
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        console.error('Session API error:', apiErr);
        // If it's already a German message from our 403 handling, pass it through
        if (apiErr.message && !apiErr.message.startsWith('Failed to fetch')) {
          setError(apiErr.message);
        } else {
          setError(classifyConnectionError(apiErr).userMessage);
        }
        setConnectionState('error');
        return;
      }

      // 3. Set up WebRTC peer connection
      const RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection;
      const pc = new RTCPeer();
      pcRef.current = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      // iOS Safari requires playsinline
      audioEl.setAttribute('playsinline', '');
      pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      dc.onopen = () => {
        setConnectionState('connected');
        // Enable input audio transcription (GA requires this via session.update)
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            input_audio_transcription: {
              model: 'gpt-4o-mini-transcribe',
            },
          },
        }));
      };
      dc.onmessage = handleDataChannelMessage;
      dc.onclose = () => { setConnectionState((prev) => prev === 'connected' ? 'disconnected' : prev); };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4. Exchange SDP with OpenAI Realtime (GA endpoint)
      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${client_secret}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });
      if (!sdpRes.ok) {
        throw new Error(`Verbindung zum Sprachserver fehlgeschlagen (${sdpRes.status})`);
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    } catch (err) {
      console.error('Connection error:', err);
      const classified = classifyConnectionError(err);
      setError(err.message || classified.userMessage);
      setConnectionState('error');
      cleanup();
    }
  };

  const handleDisconnect = useCallback(async () => {
    cleanup();
    setConnectionState('disconnected');
    setSpeakingState('idle');
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
      if (evalRes.ok) { onComplete?.(await evalRes.json()); }
      else { console.error('Evaluation failed:', await evalRes.text()); onComplete?.(null); }
    } catch (err) { console.error('Evaluation error:', err); onComplete?.(null); }
    finally { setEvaluating(false); }
  }, [cleanup, userId, config.level, onComplete]);

  useEffect(() => { return () => { cleanup(); }; }, [cleanup]);

  const isConnected = connectionState === 'connected';
  const isLowTime = timeRemaining <= 60;
  const totalTime = config.durationMinutes * 60;
  const timerProgress = isConnected ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const timerCircumference = 2 * Math.PI * 28;

  // In-app browser gate — must come after all hooks
  if (isInAppBrowser) {
    return <InAppBrowserGate onCancel={onCancel} />;
  }

  // Evaluating screen
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
