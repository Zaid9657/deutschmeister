import { useCallback, useState } from 'react';
import StageShell from './StageShell.jsx';
import GradedWriting from './GradedWriting.jsx';

/**
 * Stage 6 — Schreiben. A Formular (fields) or a Mitteilung (short message),
 * graded by the AI on the four exam criteria.
 *
 * The exercise itself lives in GradedWriting.jsx (reusable — the checkpoint's
 * Schreiben section takes the same component); this stage only supplies the
 * task and reports the score upward.
 *
 * THE TASK COMES FROM THE BANK, BY KEY. `schreiben.taskKey` resolves in
 * src/data/writingTasks.js to the `goethe_a1` task whose prompt the server
 * builds the rubric from — scripts/validate-curriculum.mjs pins that the two
 * agree, so the screen can never show one exercise while the grader marks
 * another.
 *
 * PROP CONTRACT. `onBack`/`onDone` are unchanged, so the player needs no edit.
 * `onResult` is OPTIONAL and follows the player's own recordResult signature
 * (item, { correct, errorTag }) — wire it in LessonPlayerPage to have the
 * writing score land in lesson_attempts with the error tag 'Schreiben'.
 */

/** Below this share of the maximum the Lektion counts the writing as a miss. */
const PASS_PCT = 0.6;

export default function WritingStage({ stage, onBack, onDone, onResult }) {
  const schreiben = stage.schreiben || {};
  const [graded, setGraded] = useState(false);

  const handleResult = useCallback(
    (r) => {
      setGraded(true);
      if (typeof onResult !== 'function') return;
      // An ungraded submission (checklist fallback) has no pct and must not be
      // logged as a wrong answer — silence is honest, a 0 would not be.
      if (!r.scored || typeof r.pct !== 'number') return;
      const correct = r.pct >= PASS_PCT;
      onResult(
        { id: `schreiben-${schreiben.taskKey || stage.key}`, stage: 'writing' },
        { correct, errorTag: correct ? null : 'Schreiben', result: r },
      );
    },
    [onResult, schreiben.taskKey, stage.key],
  );

  return (
    <StageShell
      eyebrow="Schritt 6 · Schreiben"
      title={schreiben.taskDe}
      onBack={onBack}
      primaryLabel="Weiter"
      onPrimary={onDone}
      primaryDisabled={!graded}
    >
      <GradedWriting
        task={{
          examKey: 'goethe_a1',
          taskKey: schreiben.taskKey,
          kind: schreiben.kind,
          taskDe: schreiben.taskDe,
          fields: schreiben.fields,
          leitpunkte: schreiben.leitpunkte,
          minWords: schreiben.minWords,
          maxWords: schreiben.maxWords,
          sample: schreiben.sample,
        }}
        lektionId={stage.lektionId || null}
        onResult={handleResult}
      />
    </StageShell>
  );
}
