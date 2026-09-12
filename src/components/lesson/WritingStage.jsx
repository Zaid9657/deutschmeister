import { useState } from 'react';
import { Check, X } from 'lucide-react';
import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';
import { scoreWriting, countWords } from '../../lib/lesson/writing.js';

/**
 * Stage 6 — Schreiben. A Formular (fields) or a Mitteilung (short message).
 *
 * v1 scoring is CLIENT-SIDE and mechanical (src/lib/lesson/writing.js): fields
 * filled, word count in range, one keyword per Leitpunkt, Anrede and Gruß
 * present. The wording below says exactly that — it is a checklist, not a
 * correction, and the screen never claims the German is right. The AI grading
 * on the Goethe criteria is phase 4 of the standard and replaces the checklist
 * without moving this component.
 */
export default function WritingStage({ stage, onBack, onDone }) {
  const schreiben = stage.schreiben || {};
  const isFormular = schreiben.kind === 'formular';
  const [text, setText] = useState('');
  const [fields, setFields] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const value = isFormular ? fields : text;
  const score = scoreWriting(schreiben, value);
  const count = countWords(text);
  const min = Number(schreiben.minWords) || 0;
  const max = Number(schreiben.maxWords) || 0;
  const inRange = count >= min && (!max || count <= max);

  return (
    <StageShell
      eyebrow="Schritt 6 · Schreiben"
      title={schreiben.taskDe}
      onBack={onBack}
      primaryLabel={submitted ? 'Weiter' : 'Abgeben'}
      onPrimary={submitted ? onDone : () => setSubmitted(true)}
      primaryDisabled={!submitted && (isFormular ? !score.checks.some((c) => c.ok) : !text.trim())}
    >
      <Card className="p-5">
        {isFormular ? (
          <div className="space-y-3">
            {(schreiben.fields || []).map((field) => (
              <div key={field}>
                <label htmlFor={`f-${field}`} className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
                  {field}
                </label>
                <input
                  id={`f-${field}`}
                  type="text"
                  value={fields[field] || ''}
                  disabled={submitted}
                  onChange={(e) => setFields((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="mt-1.5 w-full rounded-clay border border-rule bg-white px-4 py-2.5 text-[1rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {(schreiben.leitpunkte || []).length > 0 && (
              <ul className="mb-4 space-y-1 rounded-clay bg-paper-sunk p-4">
                {schreiben.leitpunkte.map((lp) => (
                  <li key={lp} className="text-[0.9375rem] text-graphite">
                    <span aria-hidden="true" className="mr-2 text-siegel">›</span>{lp}
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor="writing-text" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              Dein Text
            </label>
            <textarea
              id="writing-text"
              rows={6}
              value={text}
              disabled={submitted}
              onChange={(e) => setText(e.target.value)}
              className="mt-2 w-full resize-y rounded-clay border border-rule bg-white px-4 py-3 text-[1rem] leading-relaxed text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
            />
            <p className={`mt-2 font-data text-[0.75rem] ${inRange ? 'text-siegel-deep' : 'text-graphite'}`}>
              {count} {count === 1 ? 'Wort' : 'Wörter'} · Ziel {min}–{max}
            </p>
          </>
        )}
      </Card>

      {submitted && (
        <>
          <Card tone="sunk" className="mt-4 p-5">
            <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">Checkliste</p>
            <ul className="mt-3 space-y-2">
              {score.checks.map((c) => (
                <li key={c.key} className="flex items-start gap-2 text-[0.9375rem]">
                  {c.ok ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-siegel" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-accent-himbeer" aria-hidden="true" />
                  )}
                  <span className={c.ok ? 'text-ink' : 'text-graphite'}>
                    {c.label} — {c.ok ? 'erledigt' : 'fehlt noch'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-graphite">
              Diese Checkliste prüft nur die Form (Länge, Punkte, Anrede und Gruß). Sie korrigiert dein
              Deutsch nicht.
            </p>
          </Card>

          {schreiben.sample && (
            <Card className="mt-4 p-5">
              <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">Beispieltext</p>
              <p className="mt-2 whitespace-pre-line text-[1rem] leading-relaxed text-ink">{schreiben.sample}</p>
            </Card>
          )}
        </>
      )}
    </StageShell>
  );
}
