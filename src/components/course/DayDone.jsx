import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { A11_META } from '../../data/curricula/a11.meta.js';
import { canDoLines } from '../../lib/course/canDo.js';
import { dailySupported, dailyDay, dailyT, plainCanDo, completedCanDos, pauseCanDos } from '../../lib/course/dailyLoop.js';
import { forgivingStreak } from '../../lib/course/milestones.js';
import { loadDailyCourse } from '../../services/dailyCourse.js';

export default function DayDone({ curriculum, lesson, lang, completed = false, part = null, attempts = [], proof = {} }) {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState({ rows: [], attempts: [] });
  const supported = !!lesson && dailySupported(curriculum, lesson);
  useEffect(() => {
    let cancelled = false;
    if (supported) loadDailyCourse(user?.id, curriculum.level).then((r) => { if (!cancelled) setEvidence(r); });
    return () => { cancelled = true; };
  }, [user?.id, curriculum, supported]);
  if (!supported) return null;
  const done = new Set(evidence.rows.filter((r) => r.completed_at).map((r) => r.lektion_id));
  if (completed) done.add(lesson.id);
  const all = completedCanDos(curriculum, done);
  const todayDone = new Set(evidence.rows.filter((r) => dailyDay(r.completed_at) === dailyDay(new Date())).map((r) => r.lektion_id));
  if (completed) todayDone.add(lesson.id);
  const shown = all.filter((c) => todayDone.has(c.lektionId)).map((c) => c[lang === 'de' ? 'de' : 'en']);
  const practised = completed ? [] : pauseCanDos(lesson, attempts, proof).map((i) => canDoLines(lesson, lang)[i]);
  const stamps = [...evidence.rows.map((r) => r.completed_at), ...evidence.attempts.map((a) => a.created_at), new Date()];
  const keys = stamps.filter((s) => dailyDay(s) !== null).map((s) => { const d = new Date(s); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; });
  const streak = forgivingStreak(keys);
  const next = curriculum.lektionen.find((l) => l.nr === lesson.nr + 1);
  return <section className="mt-4 border-t border-rule pt-3" data-day-done>
    {shown.length > 0 && <ul className="space-y-2 text-sm text-ink">{shown.map((line) => <li key={line}>{dailyT('shown', lang)} {plainCanDo(line)}.</li>)}</ul>}
    {practised.length > 0 && <ul className="mt-2 space-y-1 text-sm text-graphite">{practised.map((line) => <li key={line}>{dailyT('practised', lang)}: {plainCanDo(line)}.</li>)}</ul>}
    <p className="mt-3 text-sm font-bold text-ink">{dailyT('count', lang, { n: all.length })}</p>
    {all.length > 0 && <details className="text-sm"><summary className="flex min-h-11 cursor-pointer items-center text-siegel-deep">{dailyT('list', lang)}</summary><ul className="space-y-1">{all.map((c) => <li key={c.id}>{c[lang === 'de' ? 'de' : 'en']}</li>)}</ul></details>}
    {part && <p className="mt-2 text-sm">{dailyT('nextPart', lang, { part: part + 1, nr: lesson.nr })}</p>}
    {lesson.nextHook && <p className="mt-2 text-sm text-siegel-deep">{lesson.nextHook[lang === 'de' ? 'de' : 'en']}</p>}
    {next && <p className="mt-1 text-sm">{dailyT('tomorrow', lang, { goal: canDoLines(next, lang)[0] })}</p>}
    {streak > 0 && <p className="mt-2 text-xs text-graphite">{dailyT(streak === 1 ? 'streakOne' : 'streak', lang, { n: streak })}</p>}
    <p className="mt-2 text-sm text-siegel-deep">{dailyT(completed ? 'close' : 'pauseClose', lang, { teacher: A11_META.teacher.name })} <span className="text-xs text-graphite">({dailyT('teacher', lang)})</span></p>
  </section>;
}
