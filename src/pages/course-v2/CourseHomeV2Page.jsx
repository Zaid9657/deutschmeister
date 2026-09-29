import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CourseTheme from '../../components/course-v2/CourseTheme.jsx';
import useCourseGame from '../../components/course-v2/useCourseGame.js';
import DailyGoalCard from '../../components/course-v2/home/DailyGoalCard.jsx';
import GameButton from '../../components/course-v2/home/GameButton.jsx';
import PathSection from '../../components/course-v2/home/PathSection.jsx';
import PlanOverview from '../../components/course-v2/home/PlanOverview.jsx';
import ReferenceLinks from '../../components/course-v2/home/ReferenceLinks.jsx';
import TopBar from '../../components/course-v2/home/TopBar.jsx';
import { normalizeLevel, levelCode, bandOf } from '../../lib/course-v2/ids.js';
import { courseHomeModel } from '../../lib/course-v2/homeModel.js';
import { planSummary } from '../../lib/course-v2/pacePlan.js';
import { dailyGoalMinutes } from '../../lib/course-v2/gamify.js';
import {
  coursePath, actionLabel, hasProgress, wordsLearned, courseTiles, examParts, planInhalt, kapitelAufbau, referenceLinks,
  paceOptions, resolvePace, paceStorageKey, formatFinishDate, stepMinutes, stepSkeleton, PACE_NAME_DE, STEP_XP,
} from '../../lib/course-v2/pathModel.js';
import { fetchLevelState, fetchLearnerGoal } from '../../lib/course-v2/progress.js';
import { localLevelState } from '../../lib/course-v2/localState.js';
import { closingIds, loadManifest, loadUnit, plateauNrs } from '../../lib/course-v2/loaders.js';
import { V2_DEFAULT_PACE } from '../../config/courseV2.js';
import { safeGet, safeSet } from '../../utils/safeStorage.js';
import ActionBar from './ActionBar.jsx';

// The v2 course home: /course/:level/v2 (BLUEPRINT §7.3 S0; a preview route that
// works whenever compiled v2 content exists for the level; COURSE_V2_LIVE later
// decides whether /course/:level itself renders it). Owner decisions 2026-09-29:
// "gamify it, make it similar to Duolingo … when the user starts, he should SEE THE
// PLAN", then "I want it to be a CURRICULUM — like studio, Aspekte … CHAPTERS, and in
// each chapter multiple things one can learn".
//
// The home speaks the Lehrwerk's language (curriculum.js): a unit is a KAPITEL, three
// Kapitel make a MODUL, a PLATEAU closes each Modul, the ABSCHLUSSTEST the course.
// Two states, one page:
//   - FIRST VISIT (no finished step in the level): the COURSE PLAN on top — the
//     promise, what the learner can do afterwards, how every Kapitel is built, what is
//     in the course (manifest content counts only), the textbook „Inhalt" (per Kapitel:
//     Kommunikation, Grammatik, Wortschatz, Texte, Prüfung), the grammar overview and
//     the word list, the pace and the exam in view — then the learning path below;
//   - RETURNING: the top bar (streak, XP, words), the daily-goal card, the two
//     reference links and the path; „Kursplan ansehen" folds the same plan out in place
//     (#kursplan, no new route).
// The path (src/lib/course-v2/pathModel.js) is one node per step of each Kapitel's
// outline — A, B, C, Prüfungstraining, Sprechen, Schreiben, Kapiteltest — each with its
// label (title, grammar, skills) to the right, a treasure chest per Plateau and a trophy
// for the Abschlusstest; each Kapitel banner opens the Kapitel page. The gate stays SOFT
// — every node of a compiled Kapitel links, `…/u/<nr>?s=<step>`. The one primary action
// sits in the thumb zone (ActionBar). Everything shown is computed in homeModel.js +
// pathModel.js; completion comes from completion.js.

function stepTitlesOf(unit) {
  const out = {};
  for (const s of (unit && unit.steps) || []) {
    const t = s && (typeof s.title === 'string' ? s.title : s.title && s.title.de);
    if (s && s.id && t) out[s.id] = t;
  }
  return out;
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function CourseHomeV2({ level, manifest, state, goal }) {
  const lane = (goal && goal.lane) || null;
  const model = useMemo(
    () => courseHomeModel(manifest, state, { plateaus: plateauNrs(level), closings: closingIds(level), lane }),
    [manifest, state, level, lane],
  );
  const game = useCourseGame();

  // Pace: a pick on this page > the learner's learner_goals pace > this device's pick > the default.
  const [picked, setPicked] = useState(null);
  const storedPace = useMemo(() => safeGet(paceStorageKey(level)), [level]);
  const pace = resolvePace(manifest, { picked, goalPace: goal && goal.pace, storedPace, fallback: V2_DEFAULT_PACE });
  const choosePace = useCallback((p) => {
    setPicked(p);
    safeSet(paceStorageKey(level), p);
  }, [level]);

  const firstVisit = useMemo(() => !hasProgress(state), [state]);
  const [planOpen, setPlanOpen] = useState(() => {
    try {
      return /^#kursplan/.test(window.location.hash);
    } catch {
      return false;
    }
  });
  const showPlan = firstVisit || planOpen;
  const [scrollTarget, setScrollTarget] = useState(null);
  useEffect(() => {
    if (!scrollTarget) return;
    const el = document.getElementById(scrollTarget);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    setScrollTarget(null);
  }, [scrollTarget, showPlan]);
  const openPlanAt = useCallback((modulNr) => {
    setPlanOpen(true);
    setScrollTarget(modulNr ? `kursplan-modul-${modulNr}` : 'kursplan');
  }, []);
  const togglePlan = useCallback(() => {
    if (planOpen) setPlanOpen(false);
    else openPlanAt(null);
  }, [planOpen, openPlanAt]);
  const closePlan = useCallback(() => {
    setPlanOpen(false);
    try {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    } catch {
      // no window (tests) → nothing to scroll
    }
  }, []);

  // The step names of the unit the learner opens next (a prefetch of that chunk — the
  // player loads the same module). The manifest's outline names the steps already; the
  // chunk's titles only fill a step the outline leaves unnamed.
  const nextUnitNr = model && model.next && model.next.kind === 'unit' ? model.next.nr : null;
  const [stepTitles, setStepTitles] = useState(null);
  useEffect(() => {
    if (!nextUnitNr) return undefined;
    let cancelled = false;
    loadUnit(level, nextUnitNr).then((u) => { if (!cancelled && u) setStepTitles(stepTitlesOf(u)); });
    return () => { cancelled = true; };
  }, [level, nextUnitNr]);

  const showcase = (manifest && manifest.showcase) || null;
  const path = useMemo(
    () => coursePath(model, state, { etappenDe: showcase ? showcase.etappenDe : [], stepTitles, manifest }),
    [model, state, showcase, stepTitles, manifest],
  );
  const plan = useMemo(
    () => (model ? planSummary({ manifest, pace, remainingSteps: model.remainingSteps, examDate: goal && goal.exam_date }) : null),
    [model, manifest, pace, goal],
  );
  const options = useMemo(() => (model ? paceOptions(manifest, { remainingSteps: model.remainingSteps }) : []), [model, manifest]);
  const tiles = useMemo(() => courseTiles(manifest), [manifest]);
  const parts = useMemo(() => examParts(manifest), [manifest]);
  const inhalt = useMemo(() => planInhalt(model, manifest), [model, manifest]);
  const aufbau = useMemo(() => kapitelAufbau(level, manifest), [level, manifest]);
  const links = useMemo(() => referenceLinks(level, manifest), [level, manifest]);

  if (!model || !path) return null;
  const code = model.code;
  const title = (model.title && model.title.de) || `Kurs ${code}`;
  const current = path.current;
  const cta = actionLabel(current, model);
  const allDone = Boolean(plan && plan.weeks === 0);
  const finishText = plan && !allDone ? formatFinishDate(plan.finishDate) : null;
  const planned = (manifest.units || []).map((u) => Number(u && u.minutesPlanned) || 0).filter(Boolean);
  const perStep = planned.length ? stepMinutes(planned.reduce((a, b) => a + b, 0) / planned.length, stepSkeleton(level).length) : null;
  const firstUnit = model.units[0] || null;

  const planView = (
    <PlanOverview
      manifest={manifest}
      code={code}
      level={level}
      firstVisit={firstVisit}
      startHref={current ? current.href : null}
      startLabel={cta}
      firstUnitTitle={firstUnit ? firstUnit.title : null}
      tiles={tiles}
      aufbau={aufbau}
      inhalt={inhalt}
      links={links}
      parts={parts}
      stepMinutes={perStep}
      paceOptions={options}
      pace={pace}
      onPace={choosePace}
      finishText={finishText}
      allDone={allDone}
      onClose={firstVisit ? undefined : closePlan}
    />
  );

  return (
    <CourseTheme>
      <div className="pb-40 pt-16">
        <TopBar code={code} streak={game.streak} totalXp={game.totalXp} words={wordsLearned(manifest, model)} />
        <div className="mx-auto max-w-xl">
          {firstVisit ? (
            <>
              {planView}
              <div className="px-5 pt-4">
                <h2 className="text-2xl font-black leading-tight">Ihr Lernpfad</h2>
                <p className="mt-1.5 text-base font-bold leading-relaxed text-game-muted">
                  Kapitel für Kapitel: Teil A, B und C, dann Prüfungstraining, Sprechen, Schreiben und der Kapiteltest. Tippen Sie auf „Start“.
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="sr-only">{code}: {title}</h1>
              <DailyGoalCard
                todayMinutes={game.todayMinutes}
                goalMinutes={dailyGoalMinutes(manifest, pace)}
                paceName={PACE_NAME_DE[pace] || pace}
                code={code}
                finishText={finishText ? `${code} fertig etwa am ${finishText}` : 'Alle Lernschritte sind geschafft'}
                planLine={plan && plan.status !== 'no-date' && !allDone ? plan.lineDe : null}
                week={game.week}
                planOpen={planOpen}
                onTogglePlan={togglePlan}
              />
              <ReferenceLinks links={links} className="mx-4 mt-3" />
              {planOpen && <div className="mt-5 border-y-2 border-game-line">{planView}</div>}
            </>
          )}
          <PathSection path={path} stepXp={STEP_XP} withCast={String(level).startsWith('a1')} onShowPlan={openPlanAt} />
        </div>
      </div>
      {current && (
        <ActionBar>
          <GameButton to={current.href} className="mx-auto w-full max-w-xl">{cta}</GameButton>
        </ActionBar>
      )}
    </CourseTheme>
  );
}

export default function CourseHomeV2Page() {
  const { level: levelParam } = useParams();
  const level = normalizeLevel(levelParam);
  const { user, loading: authLoading } = useAuth();
  const [manifest, setManifest] = useState(undefined);
  const [state, setState] = useState(null);
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    if (!level) return undefined;
    let cancelled = false;
    loadManifest(level).then((m) => { if (!cancelled) setManifest(m || null); });
    return () => { cancelled = true; };
  }, [level]);

  useEffect(() => {
    if (!level || authLoading) return undefined;
    let cancelled = false;
    if (!user) {
      setState(localLevelState(level));
      return undefined;
    }
    fetchLevelState(user.id, level).then((s) => { if (!cancelled) setState(s); });
    fetchLearnerGoal(user.id, bandOf(level)).then((g) => { if (!cancelled) setGoal(g); });
    return () => { cancelled = true; };
  }, [level, user, authLoading]);

  if (!level) return <Navigate to="/courses/" replace />;
  if (manifest === undefined || !state) {
    return (
      <CourseTheme>
        <p className="mx-auto max-w-xl px-5 pb-16 pt-28 text-base font-bold text-game-muted">Kurs wird geladen …</p>
      </CourseTheme>
    );
  }
  if (manifest === null) {
    return (
      <CourseTheme>
        <div className="mx-auto max-w-xl px-5 pb-16 pt-28">
          <p className="inline-block rounded-xl border-2 border-game-line px-3 py-1 text-[0.9375rem] font-black text-course-ink">{levelCode(level)}</p>
          <h1 className="mt-3 text-[1.75rem] font-black leading-tight">Der neue Kurs {levelCode(level)} kommt bald</h1>
          <p className="mt-2 text-base font-bold text-game-muted">Er ist noch in Arbeit.</p>
          <GameButton to={`/course/${level}`} className="mt-6">Zum aktuellen Kurs</GameButton>
        </div>
      </CourseTheme>
    );
  }
  return <CourseHomeV2 level={level} manifest={manifest} state={state} goal={goal} />;
}
