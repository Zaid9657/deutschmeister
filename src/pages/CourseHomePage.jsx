import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { BookOpen, Headphones, Mic, PenTool, Search, Target, ClipboardCheck, Check, Lock, Flame, Zap, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { courseFor } from '../data/courses/index.js';
import { getProgramProgress } from '../services/programProgress';
import { loadDashboardStats } from '../services/dashboardStats';
import { flattenCourse, isUnlocked, currentItem, isComplete, percentDone, courseLesson, courseComplete } from '../lib/courseFlow.js';
import Button from '../components/ui/Button.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

// The course home: a guided path through one sub-level (decision 2026-09-08,
// "a course is a separate identity, not a library listing"). Units are the
// program's weeks; every lesson is a node on a winding path; exactly one node
// is the next thing to do. Sequence is locked: a node opens when everything
// before it is done. Progress = program_progress (shared with the plan page,
// so nothing a learner ticked there is lost). XP = the minutes of finished
// lessons; the streak is the dashboard's own.

export const TYPE_ICON = {
  lesson: BookOpen, listening: Headphones, reading: PenTool, speaking: Mic, xray: Search, exam: ClipboardCheck, review: Target,
};
export const TYPE_LABEL = {
  lesson: 'Grammar', listening: 'Listening', reading: 'Reading', speaking: 'Speaking', xray: 'X-Ray', exam: 'Exam', review: 'Review',
};

// The path's sideways sway, node by node (px). Eight steps, then repeats.
const SWAY = [0, 44, 72, 44, 0, -44, -72, -44];

export default function CourseHomePage() {
  const { level } = useParams();
  const course = courseFor(level);
  const { user } = useAuth();
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [streak, setStreak] = useState(0);

  const items = useMemo(() => (course ? flattenCourse(course) : []), [course]);

  useEffect(() => {
    if (!user || !course) return;
    let cancelled = false;
    getProgramProgress(user.id, course.programKey).then((set) => { if (!cancelled) { setDone(set); setLoaded(true); } });
    loadDashboardStats(user.id).then((s) => { if (!cancelled && s) setStreak(s.streak || 0); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user, course]);

  if (!course) return <Navigate to="/courses/" replace />;

  const current = currentItem(items, done);
  const complete = isComplete(items, done);
  const pct = percentDone(items, done);
  const xp = items.filter((it) => done.has(it.id)).reduce((n, it) => n + (it.minutes || 10), 0);
  const doneCount = items.filter((it) => done.has(it.id)).length;

  let unitCounter = 0;
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <header className="relative mb-8 overflow-hidden rounded-clay">
          <Aurora />
          <div className="relative px-2 py-4">
            <Reveal><Chip tone="label">{course.code} · Course</Chip></Reveal>
            <Reveal as="h1" delay={60} className="mt-3 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[2.75rem]">
              German {course.code}
            </Reveal>
            <Reveal as="p" delay={100} className="mt-2 text-[0.9375rem] text-graphite sm:text-base">
              {items.length} lessons in {course.program.weeks.length} units · ends with the {course.testFormat} final test
            </Reveal>

            <Reveal delay={140} className="mt-5 grid grid-cols-3 gap-3">
              <Stat icon={Zap} label="XP" value={xp} tone="siegel" />
              <Stat icon={Flame} label="Day streak" value={streak} tone="aprikose" />
              <Stat icon={Trophy} label="Done" value={`${doneCount}/${items.length}`} tone="gold" />
            </Reveal>

            <Reveal delay={180} className="mt-4">
              <div className="h-3 overflow-hidden rounded-pill bg-siegel-wash" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-pill bg-siegel transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              {complete ? (
                <div className="mt-4"><Button to={courseComplete(course.level)} variant="celebrate" size="lg">Course complete · see your result →</Button></div>
              ) : current ? (
                <div className="mt-4 flex flex-col gap-3 rounded-clay border border-rule bg-white p-4 shadow-raise sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    {(() => { const I = TYPE_ICON[current.type] || BookOpen; return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel"><I className="h-5 w-5" /></span>; })()}
                    <div className="min-w-0">
                      <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">{doneCount === 0 ? 'Start here' : 'Up next'} · lesson {current.position + 1} of {items.length}</p>
                      <p className="truncate font-bold text-ink">{current.title}</p>
                      <p className="font-data text-[0.6875rem] text-graphite">{TYPE_LABEL[current.type] || current.type}{current.minutes ? ` · ${current.minutes} min · +${current.minutes} XP` : ''}</p>
                    </div>
                  </div>
                  <Button to={courseLesson(course.level, current.id)} variant="primary" size="lg" shimmer disabled={!loaded} className="shrink-0">
                    {doneCount === 0 ? 'Start' : 'Continue'} →
                  </Button>
                </div>
              ) : null}
            </Reveal>
          </div>
        </header>

        {course.program.weeks.map((week, wi) => {
          const unitItems = items.filter((it) => it.weekIndex === wi);
          const unitDone = unitItems.filter((it) => done.has(it.id)).length;
          return (
            <Reveal as="section" key={week.title} delay={Math.min(wi, 6) * 60} className="mb-6">
              <div className="rounded-clay bg-siegel px-5 py-4 text-white shadow-raise-siegel">
                <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-white/80">Unit {wi + 1}</p>
                <h2 className="mt-1 font-display text-[1.25rem] font-semibold leading-tight">{week.title}</h2>
                <p className="mt-1 text-[0.8125rem] text-white/85">{week.intro}</p>
                <p className="mt-2 font-data text-[0.75rem] text-white/80">{unitDone}/{unitItems.length} done</p>
              </div>

              <ol className="relative mx-auto mt-4 flex w-full max-w-md flex-col items-center pb-4">
                {unitItems.map((it) => {
                  const idx = unitCounter; unitCounter += 1;
                  const isDone = done.has(it.id);
                  const unlocked = loaded && isUnlocked(items, it.position, done);
                  const isCurrent = current && current.id === it.id;
                  const Icon = TYPE_ICON[it.type] || BookOpen;
                  const sway = SWAY[idx % SWAY.length];
                  const firstOfDay = it.indexInDay === 0;
                  return (
                    <li key={it.id} className="relative flex w-full flex-col items-center pt-3" style={{ transform: `translateX(${sway}px)` }}>
                      <span aria-hidden="true" className={`h-6 w-0.5 border-l-2 border-dashed ${isDone ? 'border-siegel' : 'border-rule'}`} />
                      {firstOfDay && (
                        <span className="mb-2 rounded-pill bg-paper px-2.5 py-0.5 font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite ring-1 ring-rule">{it.dayLabel}</span>
                      )}
                      {isCurrent && (
                        <span className="mb-1 animate-bounce rounded-pill bg-white px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel shadow-raise ring-1 ring-siegel">Start</span>
                      )}
                      <Node to={unlocked || isDone ? courseLesson(course.level, it.id) : null} state={isDone ? 'done' : isCurrent ? 'current' : unlocked ? 'open' : 'locked'} Icon={Icon} label={it.title} />
                      <p className={`mt-2 max-w-[14rem] text-center text-[0.8125rem] font-bold leading-snug ${isDone || unlocked ? 'text-ink' : 'text-graphite'}`}>{it.title}</p>
                      <p className="font-data text-[0.6875rem] text-graphite">{TYPE_LABEL[it.type] || it.type}{it.minutes ? ` · ${it.minutes} min` : ''}</p>
                    </li>
                  );
                })}
              </ol>
            </Reveal>
          );
        })}

        <footer className="mt-4 border-t border-rule pt-6 text-sm text-graphite">
          Lessons open in order. Your progress is saved on every lesson you mark done, on any device.{' '}
          <Link to={`/modelltest/${course.testSlug}`} className="font-bold text-siegel hover:text-siegel-deep">Final test</Link> · <Link to="/courses/" className="font-bold text-siegel hover:text-siegel-deep">All courses</Link>
        </footer>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    siegel: 'bg-siegel-wash text-siegel-deep',
    aprikose: 'bg-accent-aprikose-wash text-accent-aprikose-ink',
    gold: 'bg-paper-sunk text-ink',
  };
  return (
    <div className={`flex items-center gap-2 rounded-clay px-3 py-2 ${tones[tone] || tones.siegel}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] opacity-80">{label}</p>
        <p className="truncate font-display text-[1.125rem] font-semibold leading-none">{value}</p>
      </div>
    </div>
  );
}

function Node({ to, state, Icon, label }) {
  const base = 'relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full transition-all duration-100 ease-snap';
  const styles = {
    done: `${base} bg-siegel text-white shadow-raise-siegel hover:bg-siegel-lift active:translate-y-1 active:shadow-none`,
    current: `${base} bg-white text-siegel ring-4 ring-siegel shadow-raise-lg hover:-translate-y-0.5 active:translate-y-1 active:shadow-none`,
    open: `${base} bg-white text-siegel ring-2 ring-siegel shadow-raise hover:-translate-y-0.5 active:translate-y-1 active:shadow-none`,
    locked: `${base} bg-paper-sunk text-graphite/60 ring-1 ring-rule cursor-not-allowed`,
  };
  const inner = state === 'done' ? <Check className="h-7 w-7" aria-hidden="true" /> : state === 'locked' ? <Lock className="h-6 w-6" aria-hidden="true" /> : <Icon className="h-7 w-7" aria-hidden="true" />;
  if (!to) return <span className={styles.locked} aria-label={`${label} (locked)`}>{inner}</span>;
  return (
    <Link to={to} className={styles[state]} aria-label={label}>
      {state === 'current' && <span aria-hidden="true" className="absolute inset-0 -m-2 animate-ping rounded-full bg-siegel/20" />}
      <span className="relative">{inner}</span>
    </Link>
  );
}
