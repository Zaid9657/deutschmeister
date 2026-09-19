import { useState } from 'react';
import { CalendarDays, CheckCircle2, Compass } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../utils/supabase';
import { planFor } from '../../lib/course/plan.js';
import Button from '../ui/Button.jsx';
import { lessonDateFormat, t, useLessonLang } from '../../lib/lesson/strings.js';

// The exam-date plan on a rebuilt course home (P4 "completion levers").
//
// Two states, both soft:
//   no date  → one card, one tap: "Wann ist Ihre Prüfung?" with a date input.
//              Saving writes profiles.exam_date and, when the profile carries
//              no exam_track yet, the course's examKey — so the dashboard and
//              the exam hubs immediately know which exam this learner means.
//   a date   → one line: the weekly target, or how far behind the plan the
//              learner is AND an open door in the same sentence. Never a
//              warning, never a lock (see src/lib/course/plan.js).
//
// The write is the same one ProfilePage does: `profiles.update(...)` with the
// learner's own JWT. profiles carries own-row SELECT/UPDATE policies for
// authenticated users (exam_date and exam_track are plain preferences — the
// privileged columns are subscriptions / is_subscribed / trial dates, which a
// trigger blocks), so no service role is involved. `profile` comes from
// SubscriptionContext, which is already the one place the SPA reads it;
// refreshSubscription() re-reads it after the save.
//
// Copy comes from the lesson string table in the chrome language (English by
// default, Deutsch-Modus on the toggle), matching the course engine's screens.
// No pressure language: no "only X days left", no red, no exclamation marks.

/** Today as YYYY-MM-DD in local time — the min for the date input. */
const todayInput = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function ExamDatePlan({ curriculum, path = [], doneIds = new Set() }) {
  const { user } = useAuth();
  const { profile, refreshSubscription } = useSubscription();
  const [lang] = useLessonLang();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Signed-out visitors get no card: there is no profile to write to, and the
  // recap already asks them to save their progress first.
  if (!user) return null;

  const examDate = profile?.exam_date || null;
  const plan = planFor({ examDate, path, doneIds });

  const save = async (value) => {
    setSaving(true);
    setError('');
    const fields = { exam_date: value || null };
    // Only fill exam_track when it is empty (or the explicit "no exam"): a
    // learner who picked a different track in their profile keeps it.
    const track = profile?.exam_track;
    if (value && (!track || track === 'none') && curriculum.examKey) fields.exam_track = curriculum.examKey;
    const { error: err } = await supabase.from('profiles').update(fields).eq('id', user.id);
    if (err) {
      console.error('[ExamDatePlan] exam_date save failed:', err.message);
      setError(t('plan.saveFailed', lang));
    } else {
      setEditing(false);
      await refreshSubscription();
    }
    setSaving(false);
  };

  // ── no date (or the learner asked to change it) ────────────────────────────
  if (!examDate || editing) {
    return (
      <div className="mt-4 rounded-clay border border-rule bg-white p-4 shadow-raise">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{t('plan.question', lang)}</p>
            <p className="mt-0.5 text-[0.875rem] leading-relaxed text-graphite">
              {t('plan.lead', lang)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="dm-exam-date">{t('plan.dateLabel', lang)}</label>
              <input
                id="dm-exam-date"
                type="date"
                min={todayInput()}
                value={draft || examDate || ''}
                onChange={(e) => setDraft(e.target.value)}
                className="rounded-clay border border-rule bg-white px-3 py-2 text-sm text-ink focus:border-siegel focus:outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={saving || !(draft || examDate)}
                onClick={() => save(draft || examDate)}
              >
                {t(saving ? 'action.saving' : 'action.save', lang)}
              </Button>
              {examDate && (
                <button
                  type="button"
                  onClick={() => { setEditing(false); setDraft(''); }}
                  className="font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-graphite hover:text-ink"
                >
                  {t('action.cancel', lang)}
                </button>
              )}
              {!examDate && (
                <span className="font-data text-[0.75rem] text-graphite">{t('plan.noDate', lang)}</span>
              )}
            </div>
            {error && <p className="mt-2 text-[0.8125rem] text-graphite">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── a date is set ─────────────────────────────────────────────────────────
  const behind = plan.status === 'behind';
  const past = plan.status === 'past';
  const Icon = behind ? Compass : CheckCircle2;
  const lessons = (n) => t(n === 1 ? 'plan.lesson' : 'plan.lessons', lang);
  const examDay = lessonDateFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${examDate}T12:00:00`));
  const headline = past
    ? t('plan.past', lang)
    : behind
      ? t('plan.behind', lang, { n: plan.behindBy, unit: lessons(plan.behindBy) })
      : t('plan.onTrack', lang, { n: plan.perWeekTarget, unit: lessons(plan.perWeekTarget) });
  const detail = past
    ? t('plan.pastDetail', lang)
    : plan.lektionenLeft === 0
      ? t('plan.allDone', lang, { date: examDay })
      : t('plan.detail', lang, {
        left: plan.lektionenLeft, total: plan.total, date: examDay, weeks: plan.weeksLeft,
        unit: t(plan.weeksLeft === 1 ? 'plan.week' : 'plan.weeks', lang),
      });

  return (
    <div className="mt-4 rounded-clay border border-rule bg-white p-4 shadow-raise">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${behind || past ? 'bg-accent-aprikose-wash text-accent-aprikose-ink' : 'bg-siegel-wash text-siegel'}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{headline}</p>
          <p className="mt-0.5 font-data text-[0.75rem] text-graphite">{detail}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => { setDraft(examDate); setEditing(true); }}
              className="font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-siegel hover:text-siegel-deep"
            >
              {t('plan.changeDate', lang)}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(null)}
              className="font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-graphite hover:text-ink"
            >
              {t('plan.reset', lang)}
            </button>
          </div>
          {error && <p className="mt-2 text-[0.8125rem] text-graphite">{error}</p>}
        </div>
      </div>
    </div>
  );
}
