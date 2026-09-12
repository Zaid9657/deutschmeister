import { useState } from 'react';
import { Play, Languages } from 'lucide-react';
import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';
import { speakGerman, speechAvailable } from '../../lib/lesson/speech.js';

/**
 * Stage 2a — Input. The dialogue arrives line by line: you reveal the next
 * line, you can play any line, and once a line is on screen it STAYS on screen
 * (CONTRACT.md: sound is never the only channel). The English gloss is a
 * toggle, off by default, so the German is read first.
 *
 * v1 audio is `window.speechSynthesis` with a de-DE voice; real recordings
 * replace it in phase 5 of the standard without changing this component.
 */
export default function DialogStage({ stage, onBack, onDone }) {
  const lines = (stage.dialog && stage.dialog.lines) || [];
  const [shown, setShown] = useState(1);
  const [gloss, setGloss] = useState(false);
  const [played, setPlayed] = useState(() => new Set());
  const allShown = shown >= lines.length;

  const play = (i, text) => {
    setPlayed((prev) => new Set(prev).add(i));
    speakGerman(text);
  };

  return (
    <StageShell
      eyebrow="Schritt 2 · Input"
      title={stage.dialog?.title || 'Dialog'}
      lead={stage.dialog?.setting}
      onBack={onBack}
      primaryLabel={allShown ? 'Weiter' : 'Nächste Zeile'}
      onPrimary={allShown ? onDone : () => setShown((n) => Math.min(n + 1, lines.length))}
      secondary={
        <button
          type="button"
          onClick={() => setGloss((g) => !g)}
          aria-pressed={gloss}
          className="inline-flex items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-1.5 text-[0.8125rem] font-bold text-graphite hover:border-siegel hover:text-siegel-deep"
        >
          <Languages className="h-4 w-4" /> {gloss ? 'Englisch aus' : 'Englisch an'}
        </button>
      }
    >
      <ol className="space-y-3">
        {lines.slice(0, shown).map((l, i) => (
          <li key={`${l.speaker}-${i}`}>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => play(i, l.de)}
                  disabled={!speechAvailable()}
                  aria-label={`Zeile von ${l.speaker} vorlesen`}
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel transition-transform duration-100 ease-snap hover:bg-siegel hover:text-white active:translate-y-0.5 disabled:opacity-40 motion-reduce:transition-none"
                >
                  <Play className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{l.speaker}</p>
                  <p className="mt-1 text-[1.0625rem] leading-relaxed text-ink">{l.de}</p>
                  {gloss && <p className="mt-1 text-[0.875rem] leading-relaxed text-graphite">{l.en}</p>}
                  {played.has(i) && !speechAvailable() && (
                    <p className="mt-1 text-[0.75rem] text-graphite">Dein Browser kann diesen Text nicht vorlesen.</p>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      {!allShown && (
        <p className="mt-4 font-data text-[0.75rem] text-graphite">
          Zeile {shown} von {lines.length}
        </p>
      )}
    </StageShell>
  );
}
