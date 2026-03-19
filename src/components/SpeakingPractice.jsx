import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, Loader2, Phone, PhoneOff, X, Clock, AlertCircle } from 'lucide-react';
import { getConfigForLevel } from '../constants/speakingPrompts';

const STATUS_LABELS = {
  disconnected: 'Getrennt',
  connecting: 'Verbindung wird hergestellt…',
  connected: 'Verbunden',
  error: 'Verbindungsfehler',
};

const SPEAKING_LABELS = {
  idle: 'Bereit',
  user_speaking: 'Du sprichst…',
  ai_speaking: 'Lehrer spricht…',
};

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

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Timer countdown
  useEffect(() => {
    if (connectionState !== 'connected') return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleDisconnect();
          return 0;
        }
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
          user_id: userId,
          role,
          content: content.trim(),
          level: config.level,
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
          setSpeakingState('user_speaking');
          break;

        case 'input_audio_buffer.speech_stopped':
          setSpeakingState('idle');
          break;

        case 'response.audio_transcript.delta':
          if (msg.delta) {
            transcriptRef.current += msg.delta;
            setCurrentTranscript(transcriptRef.current);
          }
          break;

        case 'response.audio_transcript.done':
          if (transcriptRef.current.trim()) {
            saveMessage('assistant', transcriptRef.current);
          }
          transcriptRef.current = '';
          setCurrentTranscript('');
          break;

        case 'response.audio.started':
          setSpeakingState('ai_speaking');
          break;

        case 'response.done':
          setSpeakingState('idle');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          if (msg.transcript?.trim()) {
            saveMessage('user', msg.transcript);
          }
          break;

        default:
          break;
      }
    } catch {
      // ignore non-JSON messages
    }
  }, [saveMessage]);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);

    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleConnect = async () => {
    setConnectionState('connecting');
    setError(null);

    try {
      // 1. Get session from our backend
      const sessionRes = await fetch('/api/speaking/speaking-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: config.systemPrompt,
          level: config.level,
        }),
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}));
        throw new Error(err.error || `Session creation failed (${sessionRes.status})`);
      }

      const { client_secret } = await sessionRes.json();

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Set up audio output
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 4. Get user microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 5. Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        setConnectionState('connected');
      };

      dc.onmessage = handleDataChannelMessage;

      dc.onclose = () => {
        setConnectionState((prev) => prev === 'connected' ? 'disconnected' : prev);
      };

      // 6. Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Send offer to OpenAI Realtime
      const sdpRes = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client_secret}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        throw new Error(`OpenAI Realtime connection failed (${sdpRes.status})`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
      setConnectionState('error');
      cleanup();
    }
  };

  const handleDisconnect = useCallback(async () => {
    cleanup();
    setConnectionState('disconnected');
    setSpeakingState('idle');

    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) {
      onComplete?.(null);
      return;
    }

    // Evaluate the conversation
    setEvaluating(true);
    try {
      const evalRes = await fetch('/api/speaking/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_token: sessionTokenRef.current,
          level: config.level,
          messages: currentMessages,
        }),
      });

      if (evalRes.ok) {
        const evaluation = await evalRes.json();
        onComplete?.(evaluation);
      } else {
        console.error('Evaluation failed:', await evalRes.text());
        onComplete?.(null);
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      onComplete?.(null);
    } finally {
      setEvaluating(false);
    }
  }, [cleanup, userId, config.level, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const isConnected = connectionState === 'connected';
  const isLowTime = timeRemaining <= 60;

  if (evaluating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-teal-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Auswertung läuft…</h3>
        <p className="text-sm text-slate-500">Dein Gespräch wird analysiert.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-bold">
            {config.level}
          </span>
          <span className="text-sm text-slate-500">{config.name}</span>
        </div>
        {isConnected && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
            isLowTime ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {/* Avatar / Visualization */}
      <div className="flex flex-col items-center py-8">
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
          speakingState === 'user_speaking'
            ? 'bg-teal-500 shadow-lg shadow-teal-200 scale-110'
            : speakingState === 'ai_speaking'
              ? 'bg-indigo-500 shadow-lg shadow-indigo-200 scale-105'
              : isConnected
                ? 'bg-teal-100'
                : 'bg-slate-100'
        }`}>
          {/* Pulse ring when speaking */}
          {speakingState === 'user_speaking' && (
            <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20" />
          )}
          {speakingState === 'ai_speaking' && (
            <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20" />
          )}

          {/* Icon */}
          {connectionState === 'connecting' ? (
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
          ) : speakingState === 'ai_speaking' ? (
            <Volume2 className="w-12 h-12 text-white" />
          ) : (
            <Mic className={`w-12 h-12 ${
              speakingState === 'user_speaking' ? 'text-white' : isConnected ? 'text-teal-500' : 'text-slate-400'
            }`} />
          )}
        </div>

        {/* Status badge */}
        <div className="mt-4">
          {connectionState === 'error' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {STATUS_LABELS.error}
            </span>
          ) : isConnected ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              speakingState === 'user_speaking'
                ? 'bg-teal-100 text-teal-700'
                : speakingState === 'ai_speaking'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-green-100 text-green-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                speakingState === 'user_speaking'
                  ? 'bg-teal-500 animate-pulse'
                  : speakingState === 'ai_speaking'
                    ? 'bg-indigo-500 animate-pulse'
                    : 'bg-green-500'
              }`} />
              {SPEAKING_LABELS[speakingState]}
            </span>
          ) : connectionState === 'connecting' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {STATUS_LABELS.connecting}
            </span>
          ) : (
            <span className="text-sm text-slate-400">{STATUS_LABELS.disconnected}</span>
          )}
        </div>
      </div>

      {/* Live Transcript */}
      {(currentTranscript || messages.length > 0) && (
        <div className="mb-6 bg-slate-50 rounded-xl p-4 max-h-48 overflow-y-auto">
          {messages.slice(-4).map((msg, i) => (
            <div key={i} className={`text-sm mb-2 ${
              msg.role === 'user' ? 'text-teal-700' : 'text-slate-700'
            }`}>
              <span className="font-semibold">
                {msg.role === 'user' ? 'Du: ' : 'Lehrer: '}
              </span>
              {msg.content}
            </div>
          ))}
          {currentTranscript && (
            <div className="text-sm text-indigo-600 italic">
              <span className="font-semibold">Lehrer: </span>
              {currentTranscript}
              <span className="animate-pulse">▊</span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {connectionState === 'disconnected' || connectionState === 'error' ? (
          <button
            onClick={handleConnect}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors shadow-md shadow-teal-200"
          >
            <Phone className="w-5 h-5" />
            Gespräch starten
          </button>
        ) : connectionState === 'connecting' ? (
          <button
            disabled
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-300 text-slate-500 font-semibold rounded-xl cursor-not-allowed"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Verbindung wird hergestellt…
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors shadow-md shadow-red-200"
          >
            <PhoneOff className="w-5 h-5" />
            Beenden &amp; Auswerten
          </button>
        )}

        <button
          onClick={() => {
            cleanup();
            onCancel?.();
          }}
          className="flex items-center justify-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
        >
          <X className="w-4 h-4" />
          Abbrechen
        </button>
      </div>

      {/* Message count */}
      {messages.length > 0 && isConnected && (
        <p className="text-center text-xs text-slate-400 mt-4">
          {messages.length} Nachrichten in dieser Sitzung
        </p>
      )}
    </div>
  );
};

export default SpeakingPractice;
