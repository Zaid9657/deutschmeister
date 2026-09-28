import { CheckCircle2, Circle, Info } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { SCORE_LABEL_DE, SCORE_NOTICE_DE, useV2Strings } from './strings.js';
import { teilLabel } from './content.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

/** 7.5 → „7,5" in German chrome, „7.5" in English; integers stay integers. */
export function fmtPoints(n, lang) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '–';
  const rounded = Math.round(n * 10) / 10;
  return lang === 'de' ? String(rounded).replace('.', ',') : String(rounded);
}

/** The criteria rows of one result (or of one Teil of a round): scored bars, then „nicht automatisch bewertet". */
function CriteriaRows({ criteria, lang, t }) {
  return criteria.map((c, i) => {
    const key = `${c.part || 0}-${c.id}-${i}`;
    if (c.scored === false) {
      return (
        <div key={key} className="border-b border-rule px-5 py-3 last:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.9375rem] font-bold text-ink">{c.label || c.id}</span>
            <span className="text-[0.8125rem] text-graphite">{t('ai.notAuto')}</span>
          </div>
        </div>
      );
    }
    const pct = typeof c.points === 'number' && c.max ? Math.max(0, Math.min(100, (c.points / c.max) * 100)) : 0;
    return (
      <div key={key} className="border-b border-rule px-5 py-3 last:border-b-0">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-[0.9375rem] font-bold text-ink">{c.label || c.id}</span>
          <span className="font-data text-[0.8125rem] tabular-nums text-graphite">
            {fmtPoints(c.points, lang)} / {fmtPoints(c.max, lang)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-pill bg-paper-sunk" aria-hidden="true">
          <div className="h-full rounded-pill bg-ink/70" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  });
}

/** The label of one Teil of a round: the exam Teil of its template („Sprechen Teil 2"), else the server's label. */
const partTitle = (part) => {
  const fromTemplate = part?.template ? teilLabel(part.template) : '';
  return fromTemplate && fromTemplate !== part.template ? fromTemplate : (part?.label || '');
};

/**
 * The result of an AI-graded surface (micro-output, Schreiben, Sprechen) in the v2 response
 * shape (docs/course-v2/E1-server.md §1.3): the fixed label „automatisierte Übungsbewertung",
 * points on the exam's own scale per criterion as a practice value („7,5 von 10 Punkten
 * (Richtwert)"), never a percentage, never a pass verdict; not-auto-scored criteria
 * (Aussprache) say so and stay out of the total (BLUEPRINT §4.4–§4.5).
 *
 * A multi-Teil speaking round (`result.parts`, SCHEMA §8 SpeakingTask `{ parts }`) shows the
 * summed total first, then one block per Teil with its own points, criteria and feedback —
 * each Teil is graded on its own rubric profile (review a1.1-u01 r2/r3 F01).
 *
 * `leitpunkte` (optional) = the task's Leitpunkte, to label the server's covered list.
 * `showCorrections` — the corrected spans only after the learner's own revision (§4.2).
 */
export default function ResultCard({ result, leitpunkte = null, showCorrections = false, className = '' }) {
  const [lang, t] = useV2Strings();
  if (!result) return null;
  const criteria = Array.isArray(result.criteria) ? result.criteria : [];
  const parts = Array.isArray(result.parts) && result.parts.length > 1 ? result.parts : null;
  const max = typeof result.max_score === 'number' ? result.max_score : result.rubric?.max;
  const total = result.total_score;
  const feedbackOf = (r) => (lang === 'de' ? (r.feedback || r.feedbackEn) : (r.feedbackEn || r.feedback));
  // a round's feedback is shown per Teil, under its own points
  const feedback = parts ? null : feedbackOf(result);
  const errors = Array.isArray(result.errors) ? result.errors : [];
  const lps = Array.isArray(result.leitpunkte) ? result.leitpunkte : [];
  const rules = Array.isArray(result.rulesApplied) ? result.rulesApplied : [];
  const labelFor = (id, i) => {
    const lp = (leitpunkte || []).find((p) => p.id === id) || (leitpunkte || [])[i];
    return lp ? lp.de : id;
  };

  return (
    <div className={className}>
      <Card className="p-5">
        <p className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-paper-sunk px-2.5 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite" lang="de">
            <Info className="h-3.5 w-3.5" aria-hidden="true" /> {result.scoreLabelDe || SCORE_LABEL_DE}
          </span>
          {lang !== 'de' && <span className="text-[0.75rem] text-graphite">({t('ai.label')})</span>}
        </p>
        {typeof total === 'number' && typeof max === 'number' && (
          <p className="mt-3 font-display text-[1.5rem] font-semibold leading-tight text-ink">
            {t('ai.points', { p: fmtPoints(total, lang), max: fmtPoints(max, lang) })}
          </p>
        )}
        {feedback && <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink">{feedback}</p>}
        {Array.isArray(result.strengths) && result.strengths.length > 0 && (
          <ul className="mt-3 space-y-1">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[0.9375rem] text-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-limette-ink" aria-hidden="true" /> {s}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {parts && parts.map((part) => {
        const partCriteria = Array.isArray(part.criteria) ? part.criteria : [];
        const partFeedback = feedbackOf(part);
        return (
          <Card key={part.index || part.label} className="mt-3 overflow-hidden" data-part={part.index}>
            <div className="px-5 pt-4">
              <p className={LABEL} lang="de">{partTitle(part)}</p>
              {typeof part.total_score === 'number' && typeof part.max_score === 'number' && (
                <p className="mt-1 font-display text-[1.125rem] font-semibold leading-tight text-ink">
                  {t('ai.points', { p: fmtPoints(part.total_score, lang), max: fmtPoints(part.max_score, lang) })}
                </p>
              )}
              {partFeedback && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{partFeedback}</p>}
            </div>
            {partCriteria.length > 0 && (
              <div className="mt-3 border-t border-rule">
                <CriteriaRows criteria={partCriteria} lang={lang} t={t} />
              </div>
            )}
          </Card>
        );
      })}

      {!parts && criteria.length > 0 && (
        <Card className="mt-3 overflow-hidden">
          <p className={`px-5 pt-4 ${LABEL}`}>{t('ai.criteria')}</p>
          <CriteriaRows criteria={criteria} lang={lang} t={t} />
        </Card>
      )}

      {lps.length > 0 && (
        <Card tone="sunk" className="mt-3 p-5">
          <p className={LABEL}>{t('ai.leitpunkte')}</p>
          <ul className="mt-2 space-y-1.5">
            {lps.map((l, i) => (
              <li key={l.id || i} className="flex items-start gap-2 text-[0.9375rem]">
                {l.covered
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-limette-ink" aria-hidden="true" />
                  : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden="true" />}
                <span className="text-ink" lang="de">{labelFor(l.id, i)}</span>
                <span className="ml-auto shrink-0 text-[0.8125rem] text-graphite">{l.covered ? t('ai.covered') : t('ai.notCovered')}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {errors.length > 0 && (
        <Card className="mt-3 p-5">
          <p className={LABEL}>{t('ai.selfCheck')}</p>
          <ul className="mt-2 space-y-3">
            {errors.map((e, i) => (
              <li key={`${e.span}-${i}`} className="text-[0.9375rem] leading-relaxed">
                <span className="rounded bg-accent-aprikose-wash px-1 font-bold text-accent-aprikose-ink" lang="de">{e.span}</span>
                {showCorrections && e.corrected && (
                  <>
                    {' → '}
                    <span className="font-bold text-ink" lang="de">{e.corrected}</span>
                  </>
                )}
                {e.hint && <span className="mt-0.5 block text-[0.875rem] text-graphite">{e.hint}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {rules.length > 0 && (
        <Card tone="sunk" className="mt-3 p-5">
          <p className={LABEL}>{t('ai.rules')}</p>
          <ul className="mt-2 space-y-1">
            {rules.map((r, i) => (
              <li key={r.id || i} className="text-[0.875rem] text-ink">{lang === 'de' ? r.reasonDe : (r.reasonEn || r.reasonDe)}</li>
            ))}
          </ul>
        </Card>
      )}

      {result.nextStep && (
        <p className="mt-3 text-[0.9375rem] text-ink"><strong>{t('ai.nextStep')}:</strong> {result.nextStep}</p>
      )}
      <p className="mt-3 font-data text-[0.75rem] leading-relaxed text-graphite" lang="de">
        {result.noticeDe || SCORE_NOTICE_DE}
        {typeof result.remaining === 'number' && <span lang={lang}> {t('ai.remaining', { n: result.remaining })}</span>}
      </p>
    </div>
  );
}
