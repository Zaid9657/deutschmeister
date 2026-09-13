import { useCallback, useState } from 'react';
import { Mic } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import StageShell from './StageShell.jsx';
import ReadAloudLine from './ReadAloudLine.jsx';
import { saveCourseContext } from '../../lib/courseFlow.js';

/**
 * Stage 5 — Sprechen. Two halves:
 *  - read-aloud: hear the model, say it, and get the line back word by word
 *    (ReadAloudLine → netlify/functions/score-readaloud). The number is word
 *    recognition and is labelled *Verständlichkeit*, never "Aussprache". Where
 *    the microphone, the sign-in or the scorer is unavailable the line falls
 *    back to the honest self-confirm this stage used to be — a fake score
 *    would be worse than none.
 *  - the open prompt hands over to the existing speaking coach, which DOES
 *    grade a conversation, carrying the Goethe Teil and the mission. The
 *    course context is saved first so the coach shows the return bar back
 *    into this lesson.
 *
 * The prop contract with LessonPlayerPage is unchanged: onBack / onDone.
 */
export default function SpeakingStage({ stage, level, code, lektion, onBack, onDone }) {
  const [results, setResults] = useState(() => ({}));
  const lines = stage.readAloud || [];
  const open = stage.open;
  const allDone = lines.every((l) => results[l.index] !== undefined);

  const recordResult = useCallback((index, result) => {
    setResults((prev) => ({ ...prev, [index]: result }));
  }, []);

  const speakingHref = open
    ? `/speaking?level=${encodeURIComponent(level)}${open.missionOrder ? `&mission=${open.missionOrder}` : ''}`
    : `/speaking?level=${encodeURIComponent(level)}`;

  const goSpeak = () => {
    // The task travels with the hand-off. Four A1.1 Lektionen have no
    // `missionOrder`, so speakingHref carries no &mission=… and the coach page
    // would otherwise show a generic mission instead of the prompt the learner
    // just read two lines above (DaF review #4, MAJOR "missionOrder null").
    saveCourseContext({
      level,
      code: code || String(level).toUpperCase(),
      itemId: lektion.id,
      title: lektion.title,
      returnTo: `/course/${level}/l/${lektion.nr}`,
      openPrompt: open ? open.promptDe || null : null,
      openTeil: open ? open.teil || null : null,
      hintWords: open && Array.isArray(open.hintWords) ? open.hintWords : [],
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
      primaryDisabled={lines.length > 0 && !allDone}
    >
      <ul className="space-y-3">
        {lines.map((l) => (
          <li key={`read-${l.index}`}>
            <ReadAloudLine
              lektionId={lektion.id}
              lineKey={`line-${l.index}`}
              text={l.de}
              speaker={l.speaker}
              onResult={(result) => recordResult(l.index, result)}
            />
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
            Der Sprach-Coach hört zu und gibt Ihnen automatisch eine Rückmeldung. Danach kommen Sie hierher zurück.
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
