import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CourseTheme from '../../components/course-v2/CourseTheme.jsx';
import useCourseGame from '../../components/course-v2/useCourseGame.js';
import GameButton from '../../components/course-v2/home/GameButton.jsx';
import KursplanSheet from '../../components/course-v2/home/KursplanSheet.jsx';
import PathSection from '../../components/course-v2/home/PathSection.jsx';
import PlanOverview from '../../components/course-v2/home/PlanOverview.jsx';
import TabBar from '../../components/course-v2/home/TabBar.jsx';
import TopBar from '../../components/course-v2/home/TopBar.jsx';
import Welcome from '../../components/course-v2/home/Welcome.jsx';
import { useV2Strings } from '../../components/course-v2/strings.js';
import { normalizeLevel, levelCode, bandOf } from '../../lib/course-v2/ids.js';
import { courseHomeModel } from '../../lib/course-v2/homeModel.js';
import { planSummary } from '../../lib/course-v2/pacePlan.js';
import { dailyGoalMinutes } from '../../lib/course-v2/gamify.js';
import { hasBottomNav } from '../../lib/chrome.js';
import {
  coursePath, actionLabel, courseTiles, examParts, planInhalt, kapitelAufbau, referenceLinks,
  paceOptions, resolvePace, paceStorageKey, formatFinishDate, stepMinutes, stepSkeleton, STEP_XP,
  welcomeModel, welcomeStorageKey, showWelcome, paceTile, currentAnchor, goalRing,
} from '../../lib/course-v2/pathModel.js';
import { fetchLevelState, fetchLearnerGoal } from '../../lib/course-v2/progress.js';
import { localLevelState } from '../../lib/course-v2/localState.js';
import { closingIds, loadManifest, loadUnit, plateauNrs } from '../../lib/course-v2/loaders.js';
import { V2_DEFAULT_PACE } from '../../config/courseV2.js';
import { safeGet, safeSet } from '../../utils/safeStorage.js';

// The v2 course home: /course/:level/v2 (BLUEPRINT §7.3 S0; a preview route that
// works whenever compiled v2 content exists for the level; COURSE_V2_LIVE later
// decides whether /course/:level itself renders it). Owner decisions: 2026-09-29
// "gamify it, make it similar to Duolingo … he should SEE THE PLAN", then "make it a
// CURRICULUM — like studio, Aspekte"; and 2026-09-30, after seeing both: "it looks
// intimidating and too much, can we change the view to make it in duolingo style and
// for everything to be step for step".
//
// So since round 3 the home is Duolingo's LEARN SCREEN — the textbook stays, one tap deep:
//   - FIRST VISIT (nothing finished in the level, and the welcome not finished or skipped
//     on this device — pathModel.showWelcome): a short WELCOME, one screen at a time —
//     Priya and the promise, „Das lernen Sie in A1.1", „Wie viel Zeit haben Sie pro Tag?"
//     (the pace) — then the path, scrolled to node 1 and its START bubble;
//   - THE PATH (everyone, every other time): a top bar (level, streak, XP, today's goal
//     ring), per Kapitel a sticky coloured banner with a book button to the Kapitel guide,
//     its steps as big round nodes in a zig-zag (a tap opens a popover with the step's
//     name and ONE button — the START bubble on the current node is the call to action),
//     a chest per Plateau and a trophy for the Abschlusstest; on load the page scrolls
//     the current node to the middle of the screen;
//   - a bottom TAB BAR: Lernen (this page) · Kursplan (the course plan — PlanOverview with
//     the textbook „Inhalt" — as a full-screen sheet at #kursplan) · Grammatik · Wörter.
// The gate stays SOFT — every node of a compiled Kapitel opens its step,
// `…/u/<nr>?s=<step>`. Everything shown is computed in homeModel.js + pathModel.js;
// completion comes from completion.js.

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

/** Scroll the path's current node to the middle of the screen (instant under reduced motion). */
function scrollToAnchor(anchor, { focus = false } = {}) {
  if (!anchor) return;
  const el = document.getElementById(anchor);
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  if (focus) el.focus({ preventScroll: true });
}

const SHEET_HASH = /^#kursplan/;

export function CourseHomeV2({ level, manifest, state, goal }) {
  const lane = (goal && goal.lane) || null;
  const model = useMemo(
    () => courseHomeModel(manifest, state, { plateaus: plateauNrs(level), closings: closingIds(level), lane }),
    [manifest, state, level, lane],
  );
  const game = useCourseGame();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // a signed-in learner below lg also has the app's BottomNav (fixed, h-16): the fixed
  // bars of this page sit on top of it (the same rule as ActionBar.jsx)
  const lifted = hasBottomNav(location.pathname) && Boolean(user);

  // Pace: a pick on this page > the learner's learner_goals pace > this device's pick > the default.
  const [picked, setPicked] = useState(null);
  const storedPace = useMemo(() => safeGet(paceStorageKey(level)), [level]);
  const pace = resolvePace(manifest, { picked, goalPace: goal && goal.pace, storedPace, fallback: V2_DEFAULT_PACE });
  const choosePace = useCallback((p) => {
    setPicked(p);
    safeSet(paceStorageKey(level), p);
  }, [level]);

  // The welcome: decided once, when the page mounts with the learner's state; its chrome
  // in the lesson language (the player's), its promise and can-dos German.
  const [lang] = useV2Strings();
  const welcome = useMemo(() => welcomeModel(manifest, level, { lang }), [manifest, level, lang]);
  const [welcomeOpen, setWelcomeOpen] = useState(
    () => welcome.screens.length > 0 && showWelcome(state, safeGet(welcomeStorageKey(level))),
  );
  // bumped whenever the path should bring its current node into view (load, after the welcome)
  const [scrollTick, setScrollTick] = useState(() => (welcomeOpen ? 0 : 1));
  const focusAfterScroll = useRef(false);
  const finishWelcome = useCallback(() => {
    safeSet(welcomeStorageKey(level), new Date().toISOString().slice(0, 10));
    setWelcomeOpen(false);
    focusAfterScroll.current = true;
    setScrollTick((n) => n + 1);
  }, [level]);

  // The Kursplan sheet is open while the URL says #kursplan: the back button closes it.
  const sheetOpen = SHEET_HASH.test(location.hash || '');
  const pushedSheet = useRef(false);
  const kursplanTab = useRef(null);
  const openSheet = useCallback(() => {
    pushedSheet.current = true;
    navigate({ pathname: location.pathname, search: location.search, hash: '#kursplan' });
  }, [navigate, location.pathname, location.search]);
  const closeSheet = useCallback(() => {
    if (pushedSheet.current) {
      pushedSheet.current = false;
      navigate(-1);
    } else {
      navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true });
    }
  }, [navigate, location.pathname, location.search]);

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
  const anchor = path ? currentAnchor(path.current) : null;

  // Bring the current node into the middle of the screen: on load, and after the welcome.
  useEffect(() => {
    if (!scrollTick || welcomeOpen) return undefined;
    const raf = window.requestAnimationFrame(() => {
      scrollToAnchor(anchor, { focus: focusAfterScroll.current });
      focusAfterScroll.current = false;
    });
    return () => window.cancelAnimationFrame(raf);
    // the anchor is read when the tick changes, not followed as the path updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTick, welcomeOpen]);

  const goLernen = useCallback(() => {
    if (sheetOpen) closeSheet();
    scrollToAnchor(anchor);
  }, [sheetOpen, closeSheet, anchor]);

  if (!model || !path) return null;
  const code = model.code;
  const title = (model.title && model.title.de) || `Kurs ${code}`;
  const current = path.current;
  const allDone = Boolean(plan && plan.weeks === 0);
  const finishText = plan && !allDone ? formatFinishDate(plan.finishDate) : null;
  const planned = (manifest.units || []).map((u) => Number(u && u.minutesPlanned) || 0).filter(Boolean);
  const perStep = planned.length ? stepMinutes(planned.reduce((a, b) => a + b, 0) / planned.length, stepSkeleton(level).length) : null;

  if (welcomeOpen) {
    return (
      <CourseTheme>
        <Welcome
          model={welcome}
          tiles={options.map((o) => paceTile(o, { allDone, lang }))}
          pace={pace}
          onPace={choosePace}
          onDone={finishWelcome}
          lifted={lifted}
        />
      </CourseTheme>
    );
  }

  return (
    <CourseTheme>
      <div className={lifted ? 'pb-40 pt-16 lg:pb-28' : 'pb-28 pt-16'}>
        <TopBar
          code={code}
          streak={game.streak}
          totalXp={game.totalXp}
          ring={goalRing(game.todayMinutes, dailyGoalMinutes(manifest, pace))}
        />
        <h1 className="sr-only">{code}: {title}</h1>
        <PathSection
          path={path}
          stepXp={STEP_XP}
          withCast={String(level).startsWith('a1')}
          anchor={anchor}
          onJump={() => scrollToAnchor(anchor, { focus: true })}
          lifted={lifted}
        />
      </div>
      <TabBar ref={kursplanTab} links={links} kursplanOpen={sheetOpen} onLernen={goLernen} onKursplan={openSheet} lifted={lifted} />
      <KursplanSheet open={sheetOpen} onClose={closeSheet} returnFocusRef={kursplanTab}>
        <PlanOverview
          manifest={manifest}
          code={code}
          level={level}
          firstVisit={false}
          startHref={current ? current.href : null}
          startLabel={actionLabel(current, model)}
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
        />
      </KursplanSheet>
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
