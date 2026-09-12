import { useState } from 'react';
import { Check, Play } from 'lucide-react';
import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';
import { AudioSourceBadge } from './DialogStage.jsx';
import { audioFor, playLine, speechAvailable } from '../../lib/lesson/speech.js';
import { normalizeAnswer } from '../../utils/answerMatch.js';

/**
 * Stage 1 — one production attempt BEFORE anything is taught, then the model
 * answer. The point is the attempt, not the score: a pretest is scored
 * generously (the accepted list is a set of sentence openings, matched as
 * prefixes) and a miss costs nothing, because the retrieval attempt itself is
 * what makes the teaching stick.
 *
 * The model answer is heard as well as read, once it is revealed — the
 * recording from the manifest (key `pretest`) when there is one, browser speech
 * otherwise. It is never played before the reveal: hearing the answer first
 * would take the retrieval attempt away.
 */
export default function PretestStage({ stage, lektionId, onBack, onDone }) {
  const pretest = stage.pretest || {};
  const id = lektionId || stage.lektionId || null;
  const recorded = !!audioFor(id, 'pretest');
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);

  const hit = (() => {
    const user = normalizeAnswer(value);
    return (pretest.accepted || []).some((p) => user.startsWith(normalizeAnswer(p)));
  })();

  return (
    <StageShell
      eyebrow="Schritt 1 · Erst probieren"
      title={pretest.promptDe}
      lead={pretest.promptEn}
      onBack={onBack}
      primaryLabel={revealed ? 'Weiter' : 'Antwort zeigen'}
      onPrimary={revealed ? onDone : () => setRevealed(true)}
    >
      <Card className="p-5">
        <label htmlFor="pretest-answer" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
          Dein Satz
        </label>
        <textarea
          id="pretest-answer"
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={revealed}
          className="mt-2 w-full resize-none rounded-clay border border-rule bg-white px-4 py-3 text-[1.0625rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
          placeholder="Schreib einfach, was du kannst."
        />
        <p className="mt-2 text-[0.8125rem] text-graphite">
          Noch nichts gelernt? Genau darum geht es. Der Versuch zählt, nicht die Note.
        </p>
      </Card>

      {revealed && (
        <Card tone="wash" className="mt-4 p-5">
          <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">Modellantwort</p>
          <p className="mt-2 text-[1.125rem] font-semibold text-ink">{pretest.model}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => playLine(id, 'pretest', pretest.model)}
              disabled={!pretest.model || (!recorded && !speechAvailable())}
              className="inline-flex items-center gap-2 rounded-clay border border-rule bg-white px-4 py-2 text-sm font-bold text-ink hover:border-siegel active:translate-y-0.5 disabled:opacity-40"
            >
              <Play className="h-4 w-4" aria-hidden="true" /> Anhören
            </button>
            <AudioSourceBadge recorded={recorded} />
          </div>
          {hit && (
            <p className="mt-3 flex items-center gap-2 text-[0.875rem] font-bold text-siegel-deep">
              <Check className="h-4 w-4" aria-hidden="true" /> Dein Satz fängt schon richtig an.
            </p>
          )}
        </Card>
      )}
    </StageShell>
  );
}
