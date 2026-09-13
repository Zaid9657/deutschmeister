import { useState } from 'react';
import { Check, X, Loader2, CheckCircle, XCircle, PenTool } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthHeaders } from '../../utils/supabase';
import { MAX_WRITING_POINTS } from '../../data/writingTasks';
import { scoreWriting, countWords, formularText } from '../../lib/lesson/writing.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

/**
 * The graded writing exercise, reusable by any stage that has a task.
 *
 *   <GradedWriting task={{ examKey, taskKey, kind, taskDe, fields, leitpunkte,
 *                          minWords, maxWords, sample }}
 *                  lektionId
 *                  onResult={(r) => …} />
 *
 * r = { scored, pct, total, max, leitpunktCheck, feedback, corrections,
 *       usedFallback, limitReached }
 *
 * WHAT IT PROMISES, AND WHAT IT DOES NOT. A signed-in learner's text goes to
 * netlify/functions/evaluate-writing (identity from the JWT, the prompt looked
 * up server-side by examKey + taskKey — the text below is never sent as
 * instructions) and comes back graded on the four criteria. When that is not
 * available — signed out, over the allowance, offline, a 500 — the screen falls
 * back to the MECHANICAL checklist of src/lib/lesson/writing.js and says so in
 * those words. It never lets a form check look like a correction: an unchecked
 * promise of feedback is exactly what FernUSG forbids.
 */

const CRITERIA = [['task', 'Aufgabe'], ['structure', 'Aufbau'], ['accuracy', 'Korrektheit'], ['vocabulary', 'Wortschatz']];
const CRITERION_MAX = MAX_WRITING_POINTS / CRITERIA.length;
const FIELD_LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

export default function GradedWriting({ task, lektionId = null, onResult }) {
  const { user } = useAuth();
  const isFormular = task?.kind === 'formular';
  const points = (isFormular ? task?.fields : task?.leitpunkte) || [];

  const [text, setText] = useState('');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null); // the r object, once submitted
  const [note, setNote] = useState(null); // honest one-liner about the fallback

  const value = isFormular ? fields : text;
  const check = scoreWriting(task, value);
  const count = countWords(text);
  const min = Number(task?.minWords) || 0;
  const max = Number(task?.maxWords) || 0;
  const inRange = count >= min && (!max || count <= max);
  const submission = isFormular ? formularText(task?.fields, fields) : text;
  const canSubmit = isFormular ? check.checks.some((c) => c.ok) : !!text.trim();

  /** The checklist result, used on its own whenever the AI is unavailable. */
  const mechanicalResult = (extra) => ({
    scored: false,
    pct: null,
    total: null,
    max: MAX_WRITING_POINTS,
    leitpunktCheck: points.map((p) => {
      const c = check.checks.find((x) => x.label === p);
      return !!c?.ok;
    }),
    feedback: null,
    corrections: [],
    usedFallback: true,
    limitReached: false,
    ...extra,
  });

  const finish = (r, noteText) => {
    setOutcome(r);
    setNote(noteText || null);
    if (typeof onResult === 'function') onResult(r);
  };

  /**
   * What the learner is told when the grader refuses. An exhausted allowance is
   * NOT a network hiccup and must not read like one: the 429 says so in its own
   * sentence, and the course scope says it is the COURSE's allowance that ran
   * out (evaluate-writing bills course tasks against their own lifetime budget,
   * so "Ihr Kontingent an KI-Bewertungen" would name the wrong one). The
   * FernUSG half is unchanged — the checklist below still says, in those words,
   * that it only checks the form and does not correct the learner's German.
   */
  const remainingLine = (data) => {
    if (typeof data?.limit !== 'number') return 'Formcheck, keine KI-Bewertung.';
    const left = Math.max(0, data.limit - (data.used ?? 0));
    if (left > 0) return `Formcheck, keine KI-Bewertung — noch ${left} KI-Bewertungen frei.`;
    return data?.scope === 'course'
      ? 'Ihr Schreibkontingent für diesen Kurs ist aufgebraucht. Formcheck, keine KI-Bewertung.'
      : 'Ihr Kontingent an KI-Bewertungen ist aufgebraucht. Formcheck, keine KI-Bewertung.';
  };

  const submit = async () => {
    if (busy || !canSubmit) return;
    if (!user) {
      finish(mechanicalResult(), 'Melden Sie sich an, um eine KI-Bewertung zu bekommen.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/.netlify/functions/evaluate-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ exam_key: task.examKey, task_key: task.taskKey, text: submission }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.evaluation_failed) {
        const limitReached = res.status === 429 || data.error === 'limit_reached';
        finish(
          mechanicalResult({ limitReached }),
          limitReached || data.error === 'subscription_required'
            ? remainingLine(data)
            : 'Formcheck, keine KI-Bewertung — die Bewertung war gerade nicht erreichbar.',
        );
        return;
      }
      const total = Number(data.total_score) || 0;
      finish({
        scored: true,
        pct: Math.max(0, Math.min(1, total / MAX_WRITING_POINTS)),
        total,
        max: data.max_score || MAX_WRITING_POINTS,
        leitpunktCheck: Array.isArray(data.leitpunkt_check)
          ? points.map((_, i) => !!data.leitpunkt_check[i])
          : points.map(() => false),
        feedback: data.feedback || null,
        corrections: Array.isArray(data.corrections) ? data.corrections : [],
        usedFallback: false,
        limitReached: false,
        scores: data.scores || null,
        lektionId,
        remaining: typeof data.limit === 'number' ? Math.max(0, data.limit - (data.used ?? 0)) : null,
      });
    } catch (e) {
      console.error('[GradedWriting] evaluate-writing call failed:', e);
      finish(mechanicalResult(), 'Formcheck, keine KI-Bewertung — keine Verbindung zur Bewertung.');
    } finally {
      setBusy(false);
    }
  };

  const done = !!outcome;

  return (
    <div>
      <Card className="p-5">
        {isFormular ? (
          <div className="space-y-3">
            {(task?.fields || []).map((field) => (
              <div key={field}>
                <label htmlFor={`f-${field}`} className={FIELD_LABEL}>{field}</label>
                <input
                  id={`f-${field}`}
                  type="text"
                  value={fields[field] || ''}
                  disabled={done}
                  onChange={(e) => setFields((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="mt-1.5 w-full rounded-clay border border-rule bg-white px-4 py-2.5 text-[1rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {points.length > 0 && (
              <ul className="mb-4 space-y-1 rounded-clay bg-paper-sunk p-4">
                {points.map((lp) => (
                  <li key={lp} className="text-[0.9375rem] text-graphite">
                    <span aria-hidden="true" className="mr-2 text-siegel">›</span>{lp}
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor="writing-text" className={FIELD_LABEL}>Ihr Text</label>
            <textarea
              id="writing-text"
              rows={6}
              value={text}
              disabled={done}
              onChange={(e) => setText(e.target.value)}
              className="mt-2 w-full resize-y rounded-clay border border-rule bg-white px-4 py-3 text-[1rem] leading-relaxed text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
            />
            <p className={`mt-2 font-data text-[0.75rem] ${inRange ? 'text-siegel-deep' : 'text-graphite'}`}>
              {count} {count === 1 ? 'Wort' : 'Wörter'} · Ziel {min}–{max}
            </p>
          </>
        )}

        {!done && (
          <div className="mt-4 flex justify-end">
            <Button onClick={submit} disabled={busy || !canSubmit}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PenTool className="h-4 w-4" aria-hidden="true" />}
              {busy ? 'Wird bewertet…' : 'Abgeben'}
            </Button>
          </div>
        )}
      </Card>

      {done && outcome.scored && (
        <>
          <Card className="mt-4 p-5 text-center">
            <p className="font-display text-[2rem] font-semibold leading-none tabular-nums text-ink">
              {outcome.total}
              <span className="ml-1 font-display text-[1rem] text-graphite">/ {outcome.max}</span>
            </p>
            {outcome.feedback && (
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">{outcome.feedback}</p>
            )}
            <p className="mt-3 font-data text-[0.75rem] leading-relaxed text-graphite">
              Einschätzung nach Prüfungskriterien — keine offizielle Bewertung.
              {typeof outcome.remaining === 'number' && ` Noch ${outcome.remaining} KI-Bewertungen frei.`}
            </p>
          </Card>

          <Card className="mt-4 overflow-hidden">
            {CRITERIA.map(([key, label]) => {
              const score = outcome.scores?.[key];
              const pct = typeof score === 'number' ? Math.max(0, Math.min(100, (score / CRITERION_MAX) * 100)) : 0;
              return (
                <div key={key} className="border-b border-rule px-5 py-3.5 last:border-b-0">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[0.9375rem] font-bold text-ink">{label}</span>
                    <span className="font-data text-[0.8125rem] tabular-nums text-graphite">{score ?? '–'}/{CRITERION_MAX}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-pill bg-paper-sunk">
                    <div className="h-full rounded-pill bg-siegel" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {points.length > 0 && (
              <ul className="space-y-1.5 bg-paper-sunk px-5 py-4">
                {points.map((p, i) => (
                  <li key={p} className="flex items-start gap-2 text-[0.9375rem]">
                    {outcome.leitpunktCheck[i]
                      ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-limette-ink" aria-hidden="true" />
                      : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-himbeer-ink" aria-hidden="true" />}
                    <span className="text-graphite">{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {outcome.corrections.length > 0 && (
            <Card className="mt-4 p-5">
              <p className={FIELD_LABEL}>Korrekturen</p>
              <ul className="mt-3 space-y-3">
                {outcome.corrections.map((c, i) => (
                  <li key={`${c.original}-${i}`} className="text-[0.9375rem] leading-relaxed">
                    <span className="text-accent-himbeer-ink line-through">{c.original}</span>
                    {' → '}
                    <span className="font-bold text-accent-limette-ink">{c.corrected}</span>
                    {c.note && <span className="mt-0.5 block text-[0.8125rem] text-graphite">{c.note}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {done && !outcome.scored && (
        <Card tone="sunk" className="mt-4 p-5">
          <p className={FIELD_LABEL}>Checkliste</p>
          <ul className="mt-3 space-y-2">
            {check.checks.map((c) => (
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
            {note || 'Formcheck, keine KI-Bewertung.'} Diese Checkliste prüft nur die Form (Länge, Punkte,
            Anrede und Gruß). Sie korrigiert Ihr Deutsch nicht.
          </p>
        </Card>
      )}

      {done && task?.sample && (
        <Card className="mt-4 p-5">
          <p className={FIELD_LABEL}>Beispieltext</p>
          <p className="mt-2 whitespace-pre-line text-[1rem] leading-relaxed text-ink">{task.sample}</p>
        </Card>
      )}
    </div>
  );
}
