import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { lessonDateFormat, t } from '../../lib/lesson/strings.js';
import { EXAM_OUTCOMES, dismissKey, isMissingTable, outcomeQuestionDue } from '../../lib/examOutcome.js';

// "Wie ist Ihre Prüfung gelaufen?" — one small card on the course home, from
// exam_date + 7 days (fulfilment f2). Rendered by ExamDatePlan once a date is
// set, so it appears on every course home that shows the plan.
//
// Reads and writes public.exam_results (migrations/2026-10-27-exam-results.sql)
// with the learner's own JWT; RLS allows own-row select/insert/update only.
// Until the owner applies that file, the read fails and the card renders
// nothing: any read error is silent, and a save that finds no table hides the
// card instead of showing an error. No mail, no endpoint, no access change.

const readDismissed = (key) => {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
};
const writeDismissed = (key) => {
  try { window.localStorage.setItem(key, '1'); } catch { /* private mode: hides for this view only */ }
};

export default function ExamOutcomeQuestion({ userId, exam, examDate, lang }) {
  const key = dismissKey(exam, examDate);
  // 'loading' | 'ask' | 'hidden' | 'thanks'
  const [state, setState] = useState('loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    const dismissed = readDismissed(key);
    // Nothing to ask before the follow-up day: skip the read entirely.
    if (!outcomeQuestionDue({ examDate, dismissed })) {
      setState('hidden');
      return undefined;
    }
    supabase
      .from('exam_results')
      .select('outcome, updated_at')
      .eq('user_id', userId)
      .eq('exam', exam)
      .eq('exam_date', examDate)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!live) return;
        // Table missing (migration not applied) or any other read failure: stay quiet.
        if (err) { setState('hidden'); return; }
        setState(outcomeQuestionDue({ examDate, result: data, dismissed }) ? 'ask' : 'hidden');
      }, () => { if (live) setState('hidden'); });
    return () => { live = false; };
  }, [userId, exam, examDate, key]);

  if (state === 'loading' || state === 'hidden') return null;

  if (state === 'thanks') {
    return (
      <Card className="mt-4 p-4">
        <p className="text-[0.875rem] text-graphite" role="status">{t('outcome.thanks', lang)}</p>
      </Card>
    );
  }

  const save = async (outcome) => {
    if (!EXAM_OUTCOMES.includes(outcome)) return;
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('exam_results').upsert(
      { user_id: userId, exam, exam_date: examDate, outcome, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exam,exam_date' },
    );
    setSaving(false);
    if (!err) { setState('thanks'); return; }
    if (isMissingTable(err)) { setState('hidden'); return; }
    console.error('[ExamOutcomeQuestion] save failed:', err.message);
    setError(t('outcome.saveFailed', lang));
  };

  const dismiss = () => { writeDismissed(key); setState('hidden'); };
  const examDay = lessonDateFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${examDate}T12:00:00`));

  return (
    <Card className="mt-4 p-4" aria-labelledby="dm-exam-outcome-q">
      <p id="dm-exam-outcome-q" className="font-bold text-ink">{t('outcome.question', lang)}</p>
      <p className="mt-0.5 text-[0.875rem] leading-relaxed text-graphite">{t('outcome.lead', lang, { date: examDay })}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {EXAM_OUTCOMES.map((o) => (
          <Button key={o} variant="secondary" size="sm" disabled={saving} onClick={() => save(o)}>
            {t(`outcome.${o}`, lang)}
          </Button>
        ))}
        <button
          type="button"
          onClick={dismiss}
          className="font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-graphite hover:text-ink"
        >
          {t('outcome.dismiss', lang)}
        </button>
      </div>
      {error && <p className="mt-2 text-[0.8125rem] text-graphite">{error}</p>}
    </Card>
  );
}
