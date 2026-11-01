import { useEffect, useRef, useState } from 'react';
import { acquireMicrophone, isLiveStream, micErrorMessage, pickAudioMimeType, releaseMicrophone } from './mediaSupport';
import { measureMicrophone } from './microphoneLevel.js';
import { boundedSpeakingRequest } from '../../lib/speakingRequest.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export default function MicrophoneCheck({ stream, onReady, onCancel, tracker }) {
  const [phase, setPhase] = useState('idle');
  const [level, setLevel] = useState(0);
  const [heardInput, setHeardInput] = useState(false);
  const [clip, setClip] = useState(null);
  const [played, setPlayed] = useState(false);
  const [error, setError] = useState('');
  const resources = useRef({ stream, alive: true });

  useEffect(() => {
    const r = resources.current;
    r.alive = true;
    tracker.mark('microphone_check');
    return () => {
      r.alive = false;
      clearTimeout(r.timer);
      r.meter?.();
      if (r.recorder) {
        r.recorder.onstop = null;
        r.recorder.ondataavailable = null;
        if (r.recorder.state !== 'inactive') r.recorder.stop();
      }
      if (r.url) URL.revokeObjectURL(r.url);
      // The session owns the supplied stream. A replacement is ours until
      // onReady hands it back, including if permission arrives after unmount.
      if (!r.handedOver && r.stream !== stream) releaseMicrophone(r.stream);
    };
  }, [stream, tracker]);

  const recordTest = async () => {
    const r = resources.current;
    if (r.busy) return;
    r.busy = true;
    setPhase('opening');
    setError('');
    setPlayed(false);
    setHeardInput(false);
    setClip(null);
    if (r.url) { URL.revokeObjectURL(r.url); r.url = null; }
    tracker.mark('microphone_check');
    try {
      if (!isLiveStream(r.stream)) {
        r.stream = await boundedSpeakingRequest(async (signal) => {
          const granted = await acquireMicrophone();
          if (signal.aborted || !r.alive) { releaseMicrophone(granted); throw new Error('Microphone check cancelled'); }
          return granted;
        }, 15000);
      }
      if (!r.alive) return;
      const closeMeter = await measureMicrophone(r.stream, (value) => {
        if (!r.alive) return;
        setLevel(value);
        if (value >= 0.01) setHeardInput(true);
      });
      if (!r.alive) { closeMeter(); return; }
      r.meter = closeMeter;
      const mimeType = pickAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(r.stream, { mimeType }) : new MediaRecorder(r.stream);
      r.recorder = recorder;
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = () => {
        clearTimeout(r.timer);
        r.meter?.();
        recorder.onstop = null;
        if (recorder.state !== 'inactive') recorder.stop();
        r.busy = false;
        if (r.alive) { setError('Die Testaufnahme ist fehlgeschlagen. Bitte versuchen Sie es erneut.'); setPhase('idle'); }
        tracker.mark('microphone_check', 'failed');
      };
      recorder.onstop = () => {
        r.meter?.();
        r.busy = false;
        if (!r.alive) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType });
        if (!blob.size) { setError('Keine Aufnahme vorhanden. Bitte prüfen Sie das Mikrofon und versuchen Sie es erneut.'); setPhase('idle'); return; }
        r.url = URL.createObjectURL(blob);
        setClip(r.url);
        setPhase('playback');
        tracker.mark('playback');
      };
      recorder.start();
      setPhase('recording');
      r.timer = setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, 3000);
    } catch (err) {
      r.meter?.();
      r.busy = false;
      if (!r.alive) return;
      tracker.mark('microphone_check', err.name === 'TimeoutError' ? 'timeout' : 'failed');
      setError(micErrorMessage(err));
      setPhase('idle');
    }
  };

  return (
    <div className="min-h-screen bg-paper px-4 pt-24 pb-12 flex items-center justify-center" lang="de">
      <Card className="w-full max-w-lg p-6">
        <h1 className="font-display text-2xl text-ink">Mikrofon kurz prüfen</h1>
        <p className="mt-3 text-sm text-graphite">Tippen Sie auf „Test aufnehmen“ und sprechen Sie drei Sekunden, zum Beispiel „Guten Tag“. Hören Sie sich danach die Aufnahme an. Die Testaufnahme bleibt nur in diesem Browser.</p>
        <div className="mt-5 h-4 overflow-hidden rounded-pill bg-paper-sunk" role="meter" aria-label="Mikrofonpegel" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, level * 5) * 100)}>
          <div className="h-full bg-siegel origin-left" style={{ transform: `scaleX(${Math.min(1, level * 5)})` }} />
        </div>
        <p className="mt-2 text-sm text-graphite" role="status">{phase === 'recording' ? 'Sprechen Sie jetzt … die Aufnahme stoppt automatisch.' : phase === 'opening' ? 'Mikrofon wird geöffnet …' : heardInput ? 'Ein Mikrofonsignal wurde gemessen.' : 'Noch kein deutliches Mikrofonsignal gemessen.'}</p>
        {error && <p className="mt-3 text-sm text-accent-himbeer-ink" role="alert">{error}</p>}
        <Button onClick={recordTest} variant="secondary" disabled={phase === 'opening' || phase === 'recording'} className="mt-4">{clip ? 'Test erneut aufnehmen' : 'Test aufnehmen (3 Sekunden)'}</Button>
        {clip && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-ink">Spielen Sie Ihre Testaufnahme ab:</p>
            <audio key={clip} controls src={clip} onEnded={() => { setPlayed(true); tracker.mark('playback', 'passed'); }} onError={() => { setError('Die Aufnahme konnte nicht abgespielt werden. Bitte nehmen Sie den Test erneut auf.'); tracker.mark('playback', 'failed'); }} className="w-full" />
            <Button className="mt-4 w-full" disabled={!played} onClick={() => {
              resources.current.handedOver = true;
              tracker.mark('ready', 'passed');
              onReady(resources.current.stream);
            }}>Ich höre mich – Gespräch öffnen</Button>
            <p className="mt-2 text-sm text-graphite">Wenn Sie sich nicht hören: Prüfen Sie Mikrofon, Lautstärke und Kopfhörer und wiederholen Sie den Test.</p>
          </div>
        )}
        <Button variant="ghost" onClick={onCancel} className="mt-3">Gespräch abbrechen</Button>
      </Card>
    </div>
  );
}
