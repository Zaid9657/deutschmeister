import { useState } from 'react';
import { Play, Check, Mic } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import StageShell from './StageShell.jsx';
import { speakGerman, speechAvailable } from '../../lib/lesson/speech.js';
import { saveCourseContext } from '../../lib/courseFlow.js';

/**
 * Stage 5 — Sprechen. Two halves:
 *  - read-aloud: hear the model, say it, confirm. There is no per-word score
 *    here yet (that needs the speech pipeline, standard §6 phase 4), so the
 *    screen asks for an honest self-confirm instead of PRETENDING to grade —
 *    a fake score is worse than none.
 *  - the open prompt hands over to the existing speaking coach, which DOES
 *    grade, carrying the Goethe Teil and the mission. The course context is
 *    saved first so the coach shows the return bar back into this lesson.
 */
export default function SpeakingStage({ stage, level, code, lektion, onBack, onDone }) {
  const [said, setSaid] = useState(() => new Set());
  const lines = stage.readAloud || [];
  const open = stage.open;
  const allSaid = lines.every((_, i) => said.has(i));

  const speakingHref = open
    ? `/speaking?level=${encodeURIComponent(level)}${open.missionOrder ? `&mission=${open.missionOrder}` : ''}`
    : `/speaking?level=${encodeURIComponent(level)}`;

  const goSpeak = () => {
    saveCourseContext({
      level,
      code: code || String(level).toUpperCase(),
      itemId: lektion.id,
      title: lektion.title,
      returnTo: `/course/${level}/l/${lektion.nr}`,
    });
    window.location.assign(speakingHref);
  };

  return (
    <StageShell
      eyebrow="Schritt 5 · Sprechen"
      title="Erst nachsprechen, dann frei sprechen"
      onBack={onBack}
      primaryLabel="Weiter"
      onPrimary={onDone}
      primaryDisabled={lines.length > 0 && !allSaid}
    >
      <ul className="space-y-3">
        {lines.map((l, i) => (
          <li key={`read-${l.index}`}>
            <Card className="p-4">
              <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{l.speaker}</p>
              <p className="mt-1 text-[1.0625rem] leading-relaxed text-ink">{l.de}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakGerman(l.de, { rate: 0.85 })}
                  disabled={!speechAvailable()}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-1.5 text-[0.8125rem] font-bold text-ink hover:border-siegel disabled:opacity-40"
                >
                  <Play className="h-4 w-4" aria-hidden="true" /> Vorsprechen
                </button>
                <button
                  type="button"
                  onClick={() => setSaid((prev) => new Set(prev).add(i))}
                  aria-pressed={said.has(i)}
                  className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[0.8125rem] font-bold ${
                    said.has(i) ? 'bg-siegel text-white' : 'border border-rule bg-white text-graphite hover:border-siegel hover:text-siegel-deep'
                  }`}
                >
                  <Check className="h-4 w-4" aria-hidden="true" /> Ich habe es gesagt
                </button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {open && (
        <Card tone="wash" className="mt-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="label">{open.teil || 'Sprechen'}</Chip>
            {(open.hintWords || []).map((w) => (
              <Chip key={w} tone="quiet">{w}</Chip>
            ))}
          </div>
          <p className="mt-3 text-[1.0625rem] font-semibold text-ink">{open.promptDe}</p>
          <p className="mt-2 text-[0.875rem] text-graphite">
            Der Sprach-Coach hört zu und gibt dir automatisch eine Rückmeldung. Danach kommst du hierher zurück.
          </p>
          <div className="mt-4">
            <Button onClick={goSpeak} variant="secondary">
              <Mic className="h-4 w-4" aria-hidden="true" /> Frei sprechen
            </Button>
          </div>
        </Card>
      )}
    </StageShell>
  );
}
