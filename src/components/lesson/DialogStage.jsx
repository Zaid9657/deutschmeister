import { useState } from 'react';
import { Play, Languages, Mic, Cpu } from 'lucide-react';
import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';
import { audioFor, playLine, speechAvailable } from '../../lib/lesson/speech.js';

/**
 * Stage 2a — Input. The dialogue arrives line by line: you reveal the next
 * line, you can play any line, and once a line is on screen it STAYS on screen
 * (CONTRACT.md: sound is never the only channel). The English gloss is a
 * toggle, off by default, so the German is read first.
 *
 * Audio is the recording when scripts/generate-course-audio.mjs has rendered
 * the line (manifest src/data/curricula/<level>.audio.js, key `line-<i>`) and
 * `window.speechSynthesis` otherwise. The learner is told which one they are
 * getting — see AudioSourceBadge.
 */

/**
 * "Aufnahme" vs "Computerstimme", honest until the whole level is recorded
 * (plan P1). Word AND icon, never colour alone — and it is a label, not a
 * control, so it carries no interactive colour (design tokens: one interactive
 * colour, `siegel`). Exported because the dictation and pretest screens show
 * exactly the same badge; all three are one component on purpose.
 */
export function AudioSourceBadge({ recorded, className = '' }) {
  const Icon = recorded ? Mic : Cpu;
  return (
    <span
      className={`inline-flex items-center gap-1 font-data text-[0.625rem] font-bold uppercase tracking-[0.11em] text-graphite ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {recorded ? 'Aufnahme' : 'Computerstimme'}
    </span>
  );
}

export default function DialogStage({ stage, lektionId, onBack, onDone }) {
  const lines = (stage.dialog && stage.dialog.lines) || [];
  const id = lektionId || stage.lektionId || null;
  const [shown, setShown] = useState(1);
  const [gloss, setGloss] = useState(false);
  const [played, setPlayed] = useState(() => new Set());
  const allShown = shown >= lines.length;

  const play = (i, text) => {
    setPlayed((prev) => new Set(prev).add(i));
    playLine(id, `line-${i}`, text);
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
        {lines.slice(0, shown).map((l, i) => {
          const recorded = !!audioFor(id, `line-${i}`);
          return (
            <li key={`${l.speaker}-${i}`}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => play(i, l.de)}
                    disabled={!recorded && !speechAvailable()}
                    aria-label={`Zeile von ${l.speaker} vorlesen`}
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel transition-transform duration-100 ease-snap hover:bg-siegel hover:text-white active:translate-y-0.5 disabled:opacity-40 motion-reduce:transition-none"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{l.speaker}</p>
                      <AudioSourceBadge recorded={recorded} />
                    </div>
                    <p className="mt-1 text-[1.0625rem] leading-relaxed text-ink">{l.de}</p>
                    {gloss && <p className="mt-1 text-[0.875rem] leading-relaxed text-graphite">{l.en}</p>}
                    {played.has(i) && !recorded && !speechAvailable() && (
                      <p className="mt-1 text-[0.75rem] text-graphite">Ihr Browser kann diesen Text nicht vorlesen.</p>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
      {!allShown && (
        <p className="mt-4 font-data text-[0.75rem] text-graphite">
          Zeile {shown} von {lines.length}
        </p>
      )}
    </StageShell>
  );
}
