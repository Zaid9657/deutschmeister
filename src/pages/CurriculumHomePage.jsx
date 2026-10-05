import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, ClipboardCheck, Trophy, Check, Lock, Flame, Zap, ChevronDown, Compass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { LEVEL_ORDER } from '../config/levels.js';
import { A11_META } from '../data/curricula/a11.meta.js';
import { getProgramProgress } from '../services/programProgress';
import { loadDashboardStats } from '../services/dashboardStats';
import { curriculumPath } from '../data/curricula/index.js';
import { SUPPORT_LINK } from '../data/navigation.js';
import { isLevelFree } from '../config/freeTier.js';
import { hasLocalProgress, localDoneIds, mergeLocalProgress } from '../lib/course/localProgress.js';
import ExamDatePlan from '../components/course/ExamDatePlan.jsx';
import CourseWelcome from '../components/course/CourseWelcome.jsx';
import FirstRunTour from '../components/course/FirstRunTour.jsx';
import LessonRing from '../components/course/LessonRing.jsx';
import MilestoneCard from '../components/course/MilestoneCard.jsx';
import Button from '../components/ui/Button.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import SituationScene from '../components/illustrations/SituationScene.jsx';
import SupportText from '../components/lesson/SupportText.jsx';
import LangToggle from '../components/lesson/LangToggle.jsx';
import { t, useLessonLang } from '../lib/lesson/strings.js';
import { SUPPORT_SCOPE, loadSupport, supportKeys, lektionHasSupport } from '../lib/lesson/support.js';

// Course home for a REBUILT level (docs/course-standard-2026-09-12.md): the
// path is 12 Lektionen + 4 checkpoints + the level test, grouped in four
// chapters. Progress lives in program_progress under `<level>_course`
// (a11_course …), written by the lesson engine and the checkpoint page, so
// the certificate and dashboard keep reading one ledger. Unlock is strict
// in-order, like the legacy course home. The Lehrplan (can-dos, exam parts,
// word count) is shown per chapter — buyers saw the same grid on the public
// course page; here it is the promise the learner is working through.
//
// P4 ("completion levers") adds three things and no gates:
//   * the exam-date plan (ExamDatePlan) under the continue card — a weekly
//     target when profiles.exam_date is set, a one-tap ask when it is not;
//   * the Flame reads the FORGIVING streak (one missed day per rolling seven
//     is forgiven — src/services/dashboardStats.js), because a strict streak
//     punishes a normal week and is the thing learners quit over;
//   * a SIGNED-OUT visitor's locally finished Lektionen render as done
//     (src/lib/course/localProgress.js), and the first load with a user
//     present merges them into the account.
//
// Wave 1 (2026-09-19) adds the ORIENTATION layer for a lost first-time
// learner, all of it read from the level's meta module
// (src/data/curricula/a11.meta.js — English chrome derived from the German
// course, never retyped):
//   * chapter banners carry the chapter's English name, its German name as a
//     small line and the one-line story, instead of "Lektion 1–3";
//   * CourseWelcome (what this is, how a Lektion works, who you meet, what you
//     will be able to do) renders above the path while nothing is finished,
//     and afterwards behind a "How this course works" toggle in the header;
//   * FirstRunTour points at the path, the Continue card and the exam-date
//     plan once per browser — the three `data-tour` anchors below;
//   * ENDOWED progress: a learner whose placement test (profiles.current_level,
//     UPPERCASE in the DB) suggests a level above this one, or who arrives from
//     the results page with `?from=placement`, has every node open. Nothing is
//     marked done for them — "your test suggests", never a level promise — and
//     the in-order rule simply stops applying.

/** The orientation module for a level, when one exists (A1.1 only today). */
const courseMetaFor = (level) => (String(level).toLowerCase() === A11_META.level ? A11_META : null);

/** Is `placed` (profiles.current_level, either case) strictly above `level` on the ladder? */
export const placedAbove = (placed, level) => {
  const a = LEVEL_ORDER.indexOf(String(placed || '').toUpperCase());
  const b = LEVEL_ORDER.indexOf(String(level || '').toUpperCase());
  return a >= 0 && b >= 0 && a > b;
};

export const programKeyFor = (level) => `${String(level).toLowerCase().replace('.', '')}_course`;

const hrefFor = (level, node) => {
  if (node.kind === 'lektion') return `/course/${level}/l/${node.nr}`;
  if (node.kind === 'checkpoint') return `/course/${level}/checkpoint/${node.nr}`;
  return `/modelltest/${node.testSlug}`;
};

// The final test of a FREE level is free too: /modelltest/<testSlug> sits
// behind ExamSubscriptionGuard, whose gate for a course test is
// hasLevelAccess(level) — true for every signed-in user when the level is in
// FREE_LEVELS. A signed-out visitor is asked to sign in there, never to pay.
// Say so on the node and in the footer, so the last step of the free course
// never reads like an unmarked paywall (Wave 0 front door).
// Every label on this page comes from the lesson string table (`course.*`) in
// the interface language — English, German or Arabic (src/lib/locale.js).
const finalTestLabel = (level, lang) => t(isLevelFree(level) ? 'course.kind.leveltestFree' : 'course.kind.leveltest', lang);
const kindLabelFor = (level, lang) => ({ lektion: t('course.kind.lektion', lang), checkpoint: t('course.kind.checkpoint', lang), leveltest: finalTestLabel(level, lang) });
const KIND_ICON = { lektion: BookOpen, checkpoint: ClipboardCheck, leveltest: Trophy };
const SWAY = [0, 44, 72, 44, 0, -44, -72, -44];

export default function CurriculumHomePage({ curriculum }) {
  const { user } = useAuth();
  const { profile } = useSubscription() || {};
  const [searchParams] = useSearchParams();
  const level = curriculum.level;
  const [lang] = useLessonLang();
  const meta = courseMetaFor(level);
  const programKey = programKeyFor(level);
  const KIND_LABEL = kindLabelFor(level, lang);
  const arScope = lang === 'ar' ? (SUPPORT_SCOPE[`ar:${String(level).toLowerCase()}`] || []) : null;
  // The Arabic chapter and situation lines come from the support sidecar; it
  // is small enough to load with the course home (re-renders when it lands).
  useEffect(() => { loadSupport(level, lang); }, [level, lang]);
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [streak, setStreak] = useState(0);
  const [openChapter, setOpenChapter] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const path = useMemo(() => curriculumPath(curriculum), [curriculum]);

  useEffect(() => {
    // Signed out: the only progress that can exist is local (a free Lektion
    // finished before sign-up). Render it, so the path a visitor walked is
    // still visibly theirs.
    if (!user) { setDone(localDoneIds(level)); setLoaded(true); return; }
    let cancelled = false;
    const load = () => {
      getProgramProgress(user.id, programKey).then((set) => { if (!cancelled) { setDone(set); setLoaded(true); } });
      loadDashboardStats(user.id)
        .then((s) => { if (!cancelled && s) setStreak(s.streakForgiving ?? s.streak ?? 0); })
        .catch(() => {});
    };
    // Merge first when there is something local to merge, so the very first
    // signed-in render already shows the visitor's own work as done.
    if (hasLocalProgress(level)) mergeLocalProgress(user.id).finally(load);
    else load();
    return () => { cancelled = true; };
  }, [user, programKey, level]);

  const firstOpenIndex = path.findIndex((n) => !done.has(n.id));
  const current = firstOpenIndex === -1 ? null : path[firstOpenIndex];
  const complete = firstOpenIndex === -1;
  const doneCount = path.filter((n) => done.has(n.id)).length;
  // Endowed: the placement test suggests a higher level, so every node is open
  // (never done). `?from=placement` covers the signed-out visitor whose result
  // could not be written to a profile.
  const endowed = placedAbove(profile?.current_level, level) || searchParams.get('from') === 'placement';
  const fresh = loaded && doneCount === 0;
  const welcomeOpen = fresh || showWelcome;
  const pct = Math.round((doneCount / path.length) * 100);
  const xp = path.filter((n) => done.has(n.id)).reduce((s, n) => s + (n.minutes || 10), 0);
  const wordsTotal = curriculum.lektionen.reduce((s, l) => s + (l.wortfeld?.length || 0), 0);

  // Chapters: each checkpoint closes the Lektionen since the previous one.
  const chapters = [];
  let bucket = [];
  path.forEach((node, i) => {
    bucket.push({ ...node, index: i });
    if (node.kind === 'checkpoint' || node.kind === 'leveltest') { chapters.push(bucket); bucket = []; }
  });
  if (bucket.length) chapters.push(bucket);

  let nodeCounter = 0;
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <header className="relative mb-8 overflow-hidden rounded-clay">
          <Aurora />
          <div className="relative px-2 py-4">
            <Reveal className="flex flex-wrap items-center justify-between gap-2">
              <Chip tone="label"><span dir="ltr">{curriculum.code}</span> · {t('course.chip', lang)}</Chip>
              {meta && !fresh && (
                <button
                  type="button"
                  onClick={() => setShowWelcome((v) => !v)}
                  aria-expanded={showWelcome}
                  aria-controls="dm-course-welcome-panel"
                  className="inline-flex items-center gap-1 rounded-pill bg-white/70 px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep ring-1 ring-rule hover:bg-siegel-wash"
                >
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" /> {t('course.howItWorks', lang)}
                </button>
              )}
              <LangToggle surface="course" className="ms-auto" />
            </Reveal>
            <Reveal as="h1" delay={60} className="mt-3 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[2.75rem]">
              {t('course.title', lang)} <span dir="ltr">{curriculum.code}</span>
            </Reveal>
            <Reveal as="p" delay={100} className="mt-2 text-[0.9375rem] text-graphite sm:text-base">
              {(() => {
                // The exam's name is German and keeps its own language inside the sentence.
                const [before, after = ''] = t('course.summary', lang, { lektionen: curriculum.lektionen.length, checkpoints: curriculum.checkpoints.length, words: wordsTotal }).split('{exam}');
                return <>{before}<span lang="de" dir="ltr">{curriculum.examName}</span>{after}</>;
              })()}
            </Reveal>

            <Reveal delay={140} className="mt-5 grid grid-cols-3 gap-3">
              <Stat icon={Zap} label={t('course.stat.xp', lang)} value={xp} tone="siegel" />
              <Stat icon={Flame} label={t('course.stat.streak', lang)} value={streak} tone="aprikose" />
              <Stat icon={Trophy} label={t('course.stat.done', lang)} value={<span dir="ltr">{`${doneCount}/${path.length}`}</span>} tone="gold" />
            </Reveal>

            {loaded && <MilestoneCard streak={streak} />}

            <Reveal delay={180} className="mt-4">
              <div className="h-3 overflow-hidden rounded-pill bg-siegel-wash" role="progressbar" aria-label={t('course.stat.done', lang)} aria-valuetext={`${doneCount}/${path.length}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-pill bg-siegel transition-all duration-700 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
              </div>
              {endowed && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-white/80 px-3 py-1 font-data text-[0.6875rem] font-bold text-siegel-deep ring-1 ring-rule" data-endowed>
                  <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {t('course.endowed', lang, { code: curriculum.code })}
                </p>
              )}
              {complete ? (
                <div className="mt-4"><Button to={`/course/${level}/complete`} variant="celebrate" size="lg">{t('course.complete', lang)}</Button></div>
              ) : current ? (
                <div className="mt-4 flex flex-col gap-3 rounded-clay border border-rule bg-white p-4 shadow-raise sm:flex-row sm:items-center sm:justify-between" data-tour="continue">
                  <div className="flex min-w-0 items-center gap-3">
                    {(() => { const I = KIND_ICON[current.kind]; return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel"><I className="h-5 w-5" /></span>; })()}
                    <div className="min-w-0">
                      <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">{t(doneCount === 0 ? 'course.startHere' : 'course.upNext', lang)} · {t('course.position', lang, { n: firstOpenIndex + 1, total: path.length })}</p>
                      <p className="truncate font-bold text-ink" lang="de" dir="ltr">{current.title}</p>
                      <p className="font-data text-[0.6875rem] text-graphite">{KIND_LABEL[current.kind]}{current.minutes ? ` · ${t('course.minutes', lang, { n: current.minutes })}` : ''}</p>
                    </div>
                  </div>
                  <Button to={hrefFor(level, current)} variant="primary" size="lg" shimmer disabled={!loaded && !!user} className="shrink-0">
                    {t(doneCount === 0 ? 'course.start' : 'course.continue', lang)}
                  </Button>
                </div>
              ) : null}
              <div data-tour="plan"><ExamDatePlan curriculum={curriculum} path={path} doneIds={done} /></div>
            </Reveal>
          </div>
        </header>

        {meta && welcomeOpen && (
          <div id="dm-course-welcome-panel" className="mb-10">
            <CourseWelcome curriculum={curriculum} meta={meta} className="!px-0" />
            <hr className="mt-10 border-rule" />
          </div>
        )}

        <div data-tour="path">
        {chapters.map((nodes, ci) => {
          const lektionen = nodes.filter((n) => n.kind === 'lektion').map((n) => curriculum.lektionen.find((l) => l.id === n.id)).filter(Boolean);
          const chapterDone = nodes.filter((n) => done.has(n.id)).length;
          const isFinal = nodes.find((n) => n.kind === 'leveltest') && lektionen.length === 0;
          const chapterMeta = !isFinal && meta ? meta.chapters[ci] : null;
          const title = isFinal
            ? t('course.finalTest', lang)
            : (chapterMeta?.titleEn ? <SupportText level={level} k={supportKeys.chapterTitle(chapterMeta.nr)} en={chapterMeta?.titleEn} de={chapterMeta.titleDe} /> : null)
              ?? `Lektion ${lektionen[0]?.nr}–${lektionen[lektionen.length - 1]?.nr}`;
          const canDos = lektionen.flatMap((l) => l.canDo || []);
          const teile = [...new Set(lektionen.flatMap((l) => l.examTeile || []))];
          const words = lektionen.reduce((s, l) => s + (l.wortfeld?.length || 0), 0);
          const open = openChapter === ci;
          return (
            <Reveal as="section" key={ci} delay={Math.min(ci, 6) * 60} className="mb-6">
              <div className="rounded-clay bg-siegel px-5 py-4 text-white shadow-raise-siegel">
                {!isFinal && lektionen[0] && (
                  <SituationScene
                    lektionId={lektionen[0].id}
                    className="mb-3 h-20 w-full rounded-clay object-cover opacity-90 sm:h-24"
                  />
                )}
                <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-white">{t('course.chapter', lang, { n: ci + 1 })}</p>
                <h2 className="mt-1 font-display text-[1.25rem] font-semibold leading-tight">{title}</h2>
                {chapterMeta && (
                  <p className="font-data text-[0.75rem] text-white"><span lang="de" dir="ltr">{chapterMeta.titleDe}</span> · {t('course.lektionRange', lang, { from: lektionen[0]?.nr, to: lektionen[lektionen.length - 1]?.nr })}</p>
                )}
                {chapterMeta ? (
                  <SupportText as="p" level={level} k={supportKeys.chapterStory(chapterMeta.nr)} en={chapterMeta.storyEn} className="mt-2 block text-[0.8125rem] leading-snug text-white" />
                ) : (
                  <p className="mt-1 text-[0.8125rem] text-white/85" lang="de" dir="ltr">{lektionen.map((l) => l.title).join(' · ')}</p>
                )}
                {arScope && lektionen.some((l) => !arScope.includes(l.id)) && (
                  <p className="mt-2 rounded-clay bg-siegel-deep px-3 py-1.5 text-[0.8125rem] text-white">{t('course.scopeNote', lang)}</p>
                )}
                <p className="mt-2 font-data text-[0.75rem] text-white">{t('course.chapterDone', lang, { done: chapterDone, total: nodes.length })}{words ? ` · ${t('course.words', lang, { n: words })}` : ''}</p>
                {canDos.length > 0 && (
                  <button type="button" onClick={() => setOpenChapter(open ? null : ci)} aria-expanded={open}
                    className="mt-3 inline-flex items-center gap-1 rounded-pill bg-siegel-deep px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-white hover:bg-ink">
                    {t('course.syllabus', lang)} <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                )}
              </div>
              {open && (
                <div className="mt-2 rounded-clay border border-rule bg-white p-4 text-[0.875rem]">
                  <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('course.canDoHeading', lang)}</p>
                  <ul className="mt-2 list-disc space-y-1 ps-5 text-ink" lang="de" dir="ltr">{canDos.map((c) => <li key={c}>{c}</li>)}</ul>
                  {teile.length > 0 && <p className="mt-3 text-graphite"><span className="font-bold text-ink">{t('course.examParts', lang)}</span> <span lang="de" dir="ltr">{teile.join(' · ')}</span></p>}
                </div>
              )}

              <ol className="relative mx-auto mt-4 flex w-full max-w-md flex-col items-center pb-4">
                {nodes.map((node) => {
                  const idx = nodeCounter; nodeCounter += 1;
                  const isDone = done.has(node.id);
                  const unlocked = (!user || loaded) && (endowed || node.index === 0 || done.has(path[node.index - 1].id));
                  const isCurrent = current && current.id === node.id;
                  const Icon = KIND_ICON[node.kind];
                  const sway = SWAY[idx % SWAY.length];
                  const lektion = node.kind === 'lektion' ? curriculum.lektionen.find((l) => l.id === node.id) : null;
                  const state = isDone ? 'done' : isCurrent ? 'current' : unlocked ? 'open' : 'locked';
                  return (
                    <li key={node.id} className="relative flex w-full flex-col items-center pt-3" style={{ transform: `translateX(${sway}px)` }}>
                      <span aria-hidden="true" className={`h-6 w-0.5 border-l-2 border-dashed ${isDone ? 'border-siegel' : 'border-rule'}`} />
                      {isCurrent && (
                        <span className="mb-1 animate-bounce rounded-pill bg-white px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel shadow-raise ring-1 ring-siegel motion-reduce:animate-none">{t('course.startBubble', lang)}</span>
                      )}
                      <LessonRing state={state} size={node.kind !== 'lektion' ? 112 : 96}>
                        <Node to={unlocked || isDone ? hrefFor(level, node) : null} state={state} Icon={Icon} label={node.title} lockedLabel={t('course.locked', lang, { title: node.title })} big={node.kind !== 'lektion'} />
                      </LessonRing>
                      <p className={`mt-2 max-w-[14rem] text-center text-[0.8125rem] font-bold leading-snug ${isDone || unlocked ? 'text-ink' : 'text-graphite'}`} lang="de" dir="ltr">{node.title}</p>
                      <p className="max-w-[16rem] text-center font-data text-[0.6875rem] text-graphite">
                        {KIND_LABEL[node.kind]}{node.minutes ? ` · ${t('course.minutes', lang, { n: node.minutes })}` : ''}
                        {lektion?.situation ? <> · {lang === 'ar' && lektionHasSupport('ar', level, lektion.id) && meta?.lektionIntro?.[lektion.id]?.situationEn
                          ? <SupportText level={level} k={supportKeys.introSituation(lektion.id)} en={meta.lektionIntro[lektion.id].situationEn} />
                          : <span lang="de" dir="ltr">{lektion.situation}</span>}</> : null}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </Reveal>
          );
        })}
        </div>

        {loaded && meta && <FirstRunTour curriculum={curriculum} meta={meta} />}

        <footer className="mt-4 border-t border-rule pt-6 text-sm text-graphite">
          {t(endowed ? 'course.footer.endowed' : 'course.footer.ordered', lang)}{' '}
          {t(user ? 'course.footer.anyDevice' : 'course.footer.thisDevice', lang)}{' '}
          <Link to={`/course/${level}/review`} className="font-bold text-siegel hover:text-siegel-deep">{t('course.review', lang)}</Link> ·{' '}
          <Link to={`/modelltest/${curriculum.testSlug}`} className="font-bold text-siegel hover:text-siegel-deep">{finalTestLabel(level, lang)}</Link> ·{' '}
          {/* An Arabic learner's syllabus and catalogue are the Arabic public pages. */}
          <Link to={`${lang === 'ar' ? '/ar' : ''}/courses/${level.replace('.', '-')}/`} className="font-bold text-siegel hover:text-siegel-deep" reloadDocument>{t('course.syllabus', lang)}</Link> ·{' '}
          <Link to={lang === 'ar' ? '/ar/courses/' : '/courses/'} className="font-bold text-siegel hover:text-siegel-deep" reloadDocument>{t('course.allCourses', lang)}</Link> ·{' '}
          {lang === 'ar' && <><a href="/ar/help/" className="font-bold text-siegel hover:text-siegel-deep">{t('course.help', lang)}</a> ·{' '}</>}
          {/* The course home drops the site footer (src/lib/chrome.js), so the
              way to reach a human has to live in this one-line footer too. */}
          <Link to={SUPPORT_LINK.href} className="font-bold text-siegel hover:text-siegel-deep">{lang === 'ar' ? t('course.support', lang) : SUPPORT_LINK.labelDe}</Link>
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

function Node({ to, state, Icon, label, lockedLabel, big }) {
  const size = big ? 'h-[5.25rem] w-[5.25rem]' : 'h-[4.5rem] w-[4.5rem]';
  const base = `relative flex ${size} items-center justify-center rounded-full transition-all duration-100 ease-snap motion-reduce:transition-none`;
  const styles = {
    done: `${base} bg-siegel text-white shadow-raise-siegel hover:bg-siegel-lift active:translate-y-1 active:shadow-none`,
    current: `${base} bg-white text-siegel ring-4 ring-siegel shadow-raise-lg hover:-translate-y-0.5 active:translate-y-1 active:shadow-none`,
    open: `${base} bg-white text-siegel ring-2 ring-siegel shadow-raise hover:-translate-y-0.5 active:translate-y-1 active:shadow-none`,
    locked: `${base} bg-paper-sunk text-graphite/60 ring-1 ring-rule cursor-not-allowed`,
  };
  const inner = state === 'done' ? <Check className="h-7 w-7" aria-hidden="true" /> : state === 'locked' ? <Lock className="h-6 w-6" aria-hidden="true" /> : <Icon className="h-7 w-7" aria-hidden="true" />;
  // role="img": an aria-label on a bare span is not exposed (axe aria-prohibited-attr).
  if (!to) return <span className={styles.locked} role="img" aria-label={lockedLabel || `${label} (locked)`}>{inner}</span>;
  return (
    <Link to={to} className={styles[state]} aria-label={label}>
      {state === 'current' && <span aria-hidden="true" className="absolute inset-0 -m-2 animate-ping rounded-full bg-siegel/20 motion-reduce:animate-none" />}
      <span className="relative">{inner}</span>
    </Link>
  );
}
