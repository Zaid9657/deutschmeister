import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { courseFor } from '../data/courses/index.js';
import { getProgramProgress, setProgramItemDone } from '../services/programProgress';
import { flattenCourse, isUnlocked, nextItem, prevItem, INSTRUCTION, saveCourseContext, clearCourseContext, courseHome, courseLesson, courseComplete } from '../lib/courseFlow.js';
import { TYPE_ICON, TYPE_LABEL } from './CourseHomePage.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';

// One lesson of a course: what to do, the door into the material, and the
// "done → next" step that moves the learner along the path. The material
// itself is the existing lesson/listening/reading/mission screen; this page
// hands over a course context (sessionStorage) so those screens show a
// return bar ("Done → next") and the learner never has to find the way back.
// ?done=1 (from that bar) marks the lesson done and advances.

export default function CourseLessonPage() {
  const { level, itemId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const course = courseFor(level);
  const { user } = useAuth();
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => (course ? flattenCourse(course) : []), [course]);
  const item = items.find((it) => it.id === itemId) || null;

  useEffect(() => {
    if (!user || !course) return;
    let cancelled = false;
    getProgramProgress(user.id, course.programKey).then((set) => { if (!cancelled) { setDone(set); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [user, course]);

  const advance = async (fromItem, doneSet) => {
    const next = nextItem(items, fromItem.position);
    clearCourseContext();
    const allDone = items.every((it) => doneSet.has(it.id));
    if (!next || allDone) navigate(courseComplete(course.level), { replace: true });
    else navigate(courseLesson(course.level, next.id), { replace: true });
  };

  // Returned from the material with ?done=1: mark and move on, once loaded.
  useEffect(() => {
    if (!loaded || !item || !user || search.get('done') !== '1') return;
    const nextSet = new Set(done); nextSet.add(item.id);
    setDone(nextSet);
    setProgramItemDone(user.id, course.programKey, item.id, true).finally(() => advance(item, nextSet));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, item?.id, search]);

  if (!course) return <Navigate to="/courses/" replace />;
  if (!item) return <Navigate to={courseHome(course.level)} replace />;

  const unlocked = loaded && isUnlocked(items, item.position, done);
  const isDone = done.has(item.id);
  const prev = prevItem(items, item.position);
  const next = nextItem(items, item.position);
  const Icon = TYPE_ICON[item.type] || TYPE_ICON.lesson;
  const pct = Math.round(((item.position) / items.length) * 100);
  const isLast = !next;

  const start = () => {
    saveCourseContext({ level: course.level, code: course.code, itemId: item.id, title: item.title, position: item.position + 1, total: items.length });
    if (item.external) window.location.href = item.href;
    else navigate(item.href);
  };

  const markDone = async () => {
    if (!user || saving) return;
    setSaving(true);
    const nextSet = new Set(done); nextSet.add(item.id);
    setDone(nextSet);
    await setProgramItemDone(user.id, course.programKey, item.id, true);
    setSaving(false);
    advance(item, nextSet);
  };

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex items-center gap-3">
          <Link to={courseHome(course.level)} className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep" aria-label="Back to the course path"><ArrowLeft className="h-4 w-4" /> {course.code}</Link>
          <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-siegel-wash" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-pill bg-siegel transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-data text-[0.75rem] text-graphite">{item.position + 1}/{items.length}</span>
        </div>

        <Reveal>
          <Card raised edge={isDone ? 'siegel' : 'paper'} className="p-6 sm:p-8">
            <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">Unit {item.weekIndex + 1} · {item.dayLabel} · lesson {item.indexInDay + 1} of {item.dayCount}</p>
            <div className="mt-4 flex items-start gap-4">
              <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${isDone ? 'bg-siegel text-white shadow-raise-siegel' : unlocked ? 'bg-white text-siegel ring-4 ring-siegel shadow-raise' : 'bg-paper-sunk text-graphite ring-1 ring-rule'}`}>
                {isDone ? <Check className="h-7 w-7" /> : unlocked ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="label">{TYPE_LABEL[item.type] || item.type}</Chip>
                  {item.minutes ? <span className="font-data text-[0.75rem] text-graphite">{item.minutes} min · +{item.minutes} XP</span> : null}
                </div>
                <h1 className="mt-2 font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[1.875rem]">{item.title}</h1>
              </div>
            </div>

            {!loaded ? (
              <p className="mt-6 text-sm italic text-graphite">Loading your progress…</p>
            ) : !unlocked && !isDone ? (
              <div className="mt-6 rounded-clay bg-paper-sunk p-4 text-[0.9375rem] text-graphite">
                This lesson opens after the ones before it. {prev ? <>Next up for you is <Link to={courseLesson(course.level, prev.id)} className="font-bold text-siegel hover:text-siegel-deep">{prev.title}</Link>.</> : null}
              </div>
            ) : (
              <>
                <p className="mt-6 text-[0.9375rem] leading-relaxed text-graphite sm:text-base">{INSTRUCTION[item.type] || INSTRUCTION.lesson}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={start} variant={isDone ? 'secondary' : 'primary'} size="lg" shimmer={!isDone}>
                    {isDone ? 'Open again' : 'Start'} <ExternalLink className="ml-1 h-4 w-4" />
                  </Button>
                  {!isDone ? (
                    <Button onClick={markDone} variant={isLast ? 'celebrate' : 'secondary'} size="lg" disabled={saving}>
                      <Check className="mr-1 h-4 w-4" /> {isLast ? 'Finish the course' : 'Mark done → next'}
                    </Button>
                  ) : next ? (
                    <Button to={courseLesson(course.level, next.id)} variant="primary" size="lg">Next lesson <ArrowRight className="ml-1 h-4 w-4" /></Button>
                  ) : (
                    <Button to={courseComplete(course.level)} variant="celebrate" size="lg">See your result →</Button>
                  )}
                </div>
              </>
            )}
          </Card>
        </Reveal>

        {/* Today's path: the day's lessons as dots, so the learner sees where this one sits. */}
        <Reveal delay={60} className="mt-6">
          <Card className="p-4">
            <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">{item.dayLabel} · {item.dayCount} lessons</p>
            <ol className="mt-3 flex flex-wrap items-center gap-2">
              {items.filter((x) => x.weekIndex === item.weekIndex && x.dayIndex === item.dayIndex).map((x) => {
                const I = TYPE_ICON[x.type] || TYPE_ICON.lesson;
                const st = done.has(x.id) ? 'bg-siegel text-white' : x.id === item.id ? 'bg-white text-siegel ring-2 ring-siegel' : 'bg-paper-sunk text-graphite';
                return (
                  <li key={x.id} className="flex items-center gap-2">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${st}`} title={x.title}>{done.has(x.id) ? <Check className="h-4 w-4" /> : <I className="h-4 w-4" />}</span>
                    {x.id === item.id && <span className="max-w-[12rem] truncate text-[0.8125rem] font-bold text-ink">{x.title}</span>}
                  </li>
                );
              })}
            </ol>
            {next && <p className="mt-3 text-[0.8125rem] text-graphite">Up next: <span className="font-bold text-ink">{next.title}</span>{next.minutes ? ` · ${next.minutes} min` : ''}</p>}
          </Card>
        </Reveal>

        <nav className="mt-6 flex justify-between font-data text-[0.75rem] text-graphite" aria-label="Neighbouring lessons">
          {prev ? <Link to={courseLesson(course.level, prev.id)} className="font-bold text-siegel hover:text-siegel-deep">← {prev.title.slice(0, 40)}</Link> : <span />}
          {next && (isDone || done.has(next.id)) ? <Link to={courseLesson(course.level, next.id)} className="font-bold text-siegel hover:text-siegel-deep">{next.title.slice(0, 40)} →</Link> : <span />}
        </nav>
      </div>
    </div>
  );
}
