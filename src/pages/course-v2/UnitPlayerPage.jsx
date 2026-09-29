import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CastAvatar from '../../components/course-v2/CastAvatar.jsx';
import CourseTheme from '../../components/course-v2/CourseTheme.jsx';
import GameButton, { QuietButton } from '../../components/course-v2/GameButton.jsx';
import GameTopBar from '../../components/course-v2/GameTopBar.jsx';
import { SpeechBubble, StatTile, StreakCard, Trophy, XpIcon, clock } from '../../components/course-v2/GameParts.jsx';
import StepCelebration from '../../components/course-v2/StepCelebration.jsx';
import { narratorOf } from '../../components/course-v2/story.js';
import { nextCombo } from '../../components/lesson/ComboChip.jsx';
import { XP, recordGame, xpForItem } from '../../lib/course-v2/gamify.js';
import { normalizeLevel, nrOfId, v2Paths } from '../../lib/course-v2/ids.js';
import { buildUnitPlan, resumeIndex } from '../../lib/course-v2/unitPlan.js';
import { LERNSCHRITT_KINDS, AUFGABE_KINDS, testOutPassed, unitCompletion } from '../../lib/course-v2/completion.js';
import { unitRules } from '../../lib/course-v2/homeModel.js';
import { proofParts, proofShown } from '../../lib/course-v2/proofs.js';
import {
  fetchUnitState, startUnit, recordStepDone, flushAttempts, recordTestOut, saveUnitStatus, statusToStore,
  seedUnitCards, logCourseEvent,
} from '../../lib/course-v2/progress.js';
import { localStepDone, localTestOut, localUnitState, localUnitStatus } from '../../lib/course-v2/localState.js';
import { loadEarlierItems, loadManifest, loadPlayableUnit, loadRuleCards } from '../../lib/course-v2/loaders.js';
import ActionBar from './ActionBar.jsx';
import StoryCliffhanger from '../../components/course-v2/StoryCliffhanger.jsx';
import { useV2Strings } from '../../components/course-v2/strings.js';
import { StartViewSlot, StepViewSlot, KIND_LABEL_DE, hasStartRenderer } from './rendererSlots.jsx';

// The v2 unit player: /course/:level/u/:nr (BLUEPRINT §3.1–§3.5, §7.1, §7.3 S2/S6).
//
// Start → the unit's steps in order (the Lektions-Check is the last step) → recap.
// This page SEQUENCES; it authors nothing and renders no exercise itself: every
// step goes to the renderer agent's StepView (one exercise per screen inside it),
// the Start to StartView, through ./rendererSlots.jsx, which falls back to a plain
// card while those components do not exist yet.
//
// What the page adds to the shared contract:
//   - `unit` handed to the renderers is the compiled chunk plus `ruleCards`
//     ({ [rc.id]: card }, the level's compiled rule cards) — additive;
//   - `step` is the SCHEMA step plus `plan` (src/lib/course-v2/unitPlan.js: the
//     seeded 12 + 3 practice draw, spare + reserve for requeue, the Check's items
//     incl. the earlierDraw) — additive.
//
// Persistence (src/lib/course-v2/progress.js): each step's answered items and its
// step marker are ONE lesson_attempts batch written when the step is done; a unit
// resumes at its first unfinished step on any device; completion is decided by
// src/lib/course-v2/completion.js and stored in lesson_progress at the recap.
// Signed out (a free level), the same facts go to localStorage (localState.js).
// Nothing here reads an AI score (PRG-01), and no gate blocks: the recap lists what
// is open and lets the learner go there.
//
// The game layer (owner decision 2026-09-29, design-tokens.js "THE COURSE THEME"; the rules
// live in src/lib/course-v2/gamify.js): every screen sits in CourseTheme under a top bar with an
// X, a thick progress bar, the combo flame and this visit's XP. Each answered item earns XP
// (xpForItem) and moves the combo (ComboChip.nextCombo); a finished Lernschritt adds XP.step and
// is written to the game ledger ONCE — recordGame({ xp, minutes, steps: 1 }) — then the
// celebration phase shows it (not after the Check, whose moment is the recap, and not for an
// Aufgabe moved on from); a newly completed unit adds XP.unit once, at the recap.
// `?s=<n>` (1-based step position, the course home's path nodes) opens step n directly; ?s=1
// on a unit not started yet shows its Start first (the home's „start" buttons link there).

const pad2 = (n) => String(n).padStart(2, '0');

// The Start's answers (StartView's gist item and the „Ich kann das schon" test-out)
// carry the step ids `<unitId>-start` / `<unitId>-start-testout`, which name no unit
// step; they are stored under their own stage so they never read as a step's items.
const startStage = (stepId) => (String(stepId).endsWith('-testout') ? 'testout' : 'start');
const isStartId = (unitId, stepId) => String(stepId).startsWith(`${unitId}-start`);

function useUnitData(level, nr) {
  const [data, setData] = useState({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    setData({ status: 'loading' });
    Promise.all([loadPlayableUnit(level, nr), loadManifest(level), loadRuleCards(level)])
      .then(([unit, manifest, ruleCards]) => {
        if (cancelled) return;
        if (!unit) { setData({ status: 'missing', manifest }); return; }
        setData({ status: 'ready', unit: { ...unit, ruleCards }, manifest });
      })
      .catch((err) => {
        console.error('[course-v2] unit load failed:', err && err.message);
        if (!cancelled) setData({ status: 'missing', manifest: null });
      });
    return () => { cancelled = true; };
  }, [level, nr]);
  return data;
}

function Shell({ level, progress, progressLabel = null, combo = 0, xp = 0, children, footer }) {
  const [, t] = useV2Strings();
  return (
    <CourseTheme>
      <div className={`mx-auto max-w-2xl px-4 ${footer ? 'pb-32' : 'pb-10'}`}>
        <GameTopBar
          homeTo={v2Paths.home(level)}
          homeLabel={t('player.home')}
          progress={progress}
          progressLabel={progressLabel || t('player.progress')}
          combo={combo}
          xp={xp}
        />
        {children}
      </div>
      {footer && <ActionBar>{footer}</ActionBar>}
    </CourseTheme>
  );
}

const EYEBROW = 'text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const H1 = 'text-[1.625rem] font-extrabold leading-tight text-game-text [hyphens:auto] sm:text-[2rem]';
const PANEL = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4 sm:p-5';

// A step's name as the renderer's heading shows it (StepView: the authored title, else
// „Sprechen"/„Schreiben" — exam part names, German in both chrome languages — else the
// kind in the chrome language), so the step list, the resume button and the recap say
// what the learner saw on the step itself.
const stepTitle = (step, t) => {
  if (!step) return '';
  if (step.title) return step.title;
  if (step.kind === 'sprechen') return 'Sprechen';
  if (step.kind === 'schreiben') return 'Schreiben';
  return t ? t(`kind.${step.kind}`) : KIND_LABEL_DE[step.kind] || '';
};
const minutesOf = (unit, stepId) => (unit.minutesPlanned && unit.minutesPlanned.byStep && unit.minutesPlanned.byStep[stepId]) || null;

function StepList({ unit, steps, finished, currentIndex, onOpen }) {
  const [, t] = useV2Strings();
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const done = finished.has(s.id);
        const current = i === currentIndex;
        const min = minutesOf(unit, s.id);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onOpen(i)}
              className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-b-4 bg-white px-4 py-3 text-left transition-transform duration-100 ease-snap hover:bg-course-wash active:translate-y-0.5 active:border-b-2 motion-reduce:transition-none ${
                current ? 'border-course' : 'border-game-line'
              }`}
              aria-current={current ? 'step' : undefined}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.9375rem] font-extrabold ${
                  done ? 'bg-game-right text-white' : current ? 'bg-course text-white' : 'bg-game-locked text-game-muted'
                }`}
                aria-hidden="true"
              >
                {done ? <Check className="h-5 w-5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[1rem] font-extrabold text-game-text">{stepTitle(s, t)}</span>
                <span className="block text-[0.8125rem] font-semibold text-game-muted">
                  {t(`kind.${s.kind}`)}{min ? ` · ${t('player.minutes', { n: min })}` : ''}{done ? ` · ${t('player.doneMark')}` : ''}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StartFallback({ unit, row, steps, finished, onOpen }) {
  const [, t] = useV2Strings();
  const canDos = (row && row.canDos) || [];
  return (
    <div className="space-y-5">
      <header>
        <p className={EYEBROW}>{t('player.unit', { n: unit.nr })}</p>
        <h1 className={`mt-1 ${H1}`}>{unit.title && unit.title.de}</h1>
        {unit.title && unit.title.canDo && <p className="mt-2 text-[1.0625rem] font-semibold text-game-muted">{unit.title.canDo}</p>}
      </header>
      {canDos.length > 0 && (
        <div className={PANEL}>
          <h2 className={EYEBROW}>{t('start.today')}</h2>
          <ul className="mt-3 space-y-2">
            {canDos.map((c) => <li key={c} className="text-[1rem] font-bold text-game-text">{c}</li>)}
          </ul>
        </div>
      )}
      <StepList unit={unit} steps={steps} finished={finished} currentIndex={-1} onOpen={onOpen} />
    </div>
  );
}

export function UnitPlayer({ level, unit, manifest, user, initialStep = null }) {
  const [, t] = useV2Strings();
  const unitId = unit.id;
  const manifestRow = useMemo(
    () => ((manifest && manifest.units) || []).find((r) => r && (r.unit === unitId || r.id === unitId)) || null,
    [manifest, unitId],
  );
  const rules = useMemo(() => unitRules(manifest && manifest.completion), [manifest]);
  const testOutThreshold = (rules && rules.unit && rules.unit.testOutThreshold) || (unit.check && unit.check.testOutThreshold) || 0.8;

  const [learner, setLearner] = useState(null); // { row, finishedSteps, stepRuns }
  const [finished, setFinished] = useState(() => new Set());
  const [phase, setPhase] = useState('loading'); // loading | start | resume | step | celebrate | recap
  const [stepIndex, setStepIndex] = useState(0);
  const [earlierItems, setEarlierItems] = useState([]);
  const [checkResult, setCheckResult] = useState(null);
  // { [microOutputId]: sent } of this visit (StepView reports it with the step): a Check proof by
  // micro-output ticks on the learner's own output (SCHEMA §8 Check.proofs[].microOutput)
  const [microSent, setMicroSent] = useState({});
  const [testOutNote, setTestOutNote] = useState(null);
  const [sessionRuns, setSessionRuns] = useState(() => new Map()); // stepId → runs finished in this visit
  const pending = useRef(new Map()); // stepId → attempts not yet written
  const stepStarted = useRef(Date.now());
  const savedStatus = useRef(null); // the status last written in this session
  const cardsSeeded = useRef(false);
  // the game layer of this visit (gamify.js): XP shown in the top bar, the combo, the step's
  // share of the progress bar, the celebration of the step just finished
  const [sessionXp, setSessionXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [celebration, setCelebration] = useState(null); // { index, done, xp, correct, total, seconds, line, title }
  const [recapSeconds, setRecapSeconds] = useState(null);
  const stepXp = useRef(new Map()); // stepId → XP of the items answered in this visit, not yet in the ledger
  const visitStarted = useRef(Date.now());
  const unitXpAwarded = useRef(false);
  const deepLink = useRef(initialStep); // ?s=<n>: open step n once the learner state is in
  const narrator = narratorOf(unit, level);

  // Learner state: Supabase when signed in, this browser otherwise.
  useEffect(() => {
    let cancelled = false;
    const apply = (state) => {
      if (cancelled) return;
      setLearner(state);
      setFinished(new Set(state.finishedSteps));
      const idx = resumeIndex(unit.steps || [], state.finishedSteps);
      // ?s=<n> jumps to step n — except ?s=1 on a unit with no progress yet (no finished step,
      // no status beyond the row startUnit opens), which still gets the unit's Start first
      const asked = deepLink.current;
      const fresh = state.finishedSteps.size === 0 && !(state.row && state.row.status && state.row.status !== 'started');
      if (Number.isInteger(asked) && asked >= 1 && asked <= (unit.steps || []).length && !(asked === 1 && fresh)) {
        setStepIndex(asked - 1);
        setPhase('step');
        stepStarted.current = Date.now();
      } else if (idx >= (unit.steps || []).length) setPhase('recap');
      else if (idx > 0 || state.finishedSteps.size > 0) { setStepIndex(idx); setPhase('resume'); } else setPhase('start');
    };
    if (user) {
      startUnit(user.id, level, unitId);
      fetchUnitState(user.id, level, unitId).then(apply);
    } else apply(localUnitState(unitId));
    return () => { cancelled = true; };
  }, [user, level, unitId, unit.steps]);

  useEffect(() => {
    let cancelled = false;
    loadEarlierItems(level, unit, (manifest && manifest.etappen) || []).then((items) => { if (!cancelled) setEarlierItems(items); });
    return () => { cancelled = true; };
  }, [level, unit, manifest]);

  // The draw's attempt number per step: the runs stored when the learner state
  // loaded, plus the runs finished in this visit, plus one. Finishing a step
  // re-draws only that step (so repeating it — from the step list — is not the same
  // twelve again, unitPlan.js), never the steps still ahead.
  const attempts = useMemo(() => {
    const out = {};
    if (!learner) return out;
    for (const s of unit.steps || []) out[s.id] = (Number(learner.stepRuns.get(s.id)) || 0) + (sessionRuns.get(s.id) || 0) + 1;
    return out;
  }, [learner, unit.steps, sessionRuns]);
  const plan = useMemo(() => buildUnitPlan(unit, { attempts, earlierItems }), [unit, attempts, earlierItems]);
  const steps = plan.steps;

  // Answered items of an unfinished step are written when the learner leaves.
  useEffect(() => {
    const map = pending.current;
    const flushAll = () => {
      if (!user) return;
      for (const [stepId, list] of map.entries()) {
        if (!list.length) continue;
        const step = (unit.steps || []).find((s) => s.id === stepId);
        const stepKind = step ? step.kind : isStartId(unitId, stepId) ? startStage(stepId) : null;
        flushAttempts(user.id, { level, unitId, stepKind }, list);
        map.set(stepId, []);
      }
    };
    window.addEventListener('pagehide', flushAll);
    return () => {
      window.removeEventListener('pagehide', flushAll);
      flushAll();
    };
  }, [user, level, unitId, unit.steps]);

  const goTo = useCallback((idx) => {
    deepLink.current = null;
    setStepIndex(idx);
    setStepProgress(0);
    setPhase('step');
    stepStarted.current = Date.now();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const nextAfter = useCallback((idx, done) => {
    const i = steps.findIndex((s, j) => j > idx && !done.has(s.id));
    if (i === -1) {
      deepLink.current = null;
      setRecapSeconds(Math.round((Date.now() - visitStarted.current) / 1000));
      setPhase('recap');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
    } else goTo(i);
  }, [steps, goTo]);

  const onAttempt = useCallback((payload) => {
    if (!payload || !payload.itemId) return;
    const stepId = payload.stepId || (steps[stepIndex] && steps[stepIndex].id);
    const list = pending.current.get(stepId) || [];
    list.push({ ...payload, stepId });
    pending.current.set(stepId, list);
    // the game layer: XP per answered item (a miss costs nothing), the combo of right answers
    const gained = xpForItem({ correct: !!payload.correct, firstTry: !payload.typo });
    stepXp.current.set(stepId, (stepXp.current.get(stepId) || 0) + gained);
    if (gained) setSessionXp((x) => x + gained);
    setCombo((c) => nextCombo(c, !!payload.correct));
  }, [steps, stepIndex]);

  const onDone = useCallback((result) => {
    const step = steps[stepIndex];
    if (!step) return;
    const list = pending.current.get(step.id) || [];
    pending.current.set(step.id, []);
    // An Aufgabe the learner moved on from without submitting (StepView reports
    // `submitted: false`) stays open: no step marker, so completion.js does not count
    // it as submitted and the recap lists it under „Noch offen". (Überarbeiten is
    // optional — skipping it is finishing it, so it keeps its marker.)
    if (AUFGABE_KINDS.includes(step.kind) && result && result.submitted === false) {
      if (user && list.length) flushAttempts(user.id, { level, unitId, stepKind: step.kind }, list);
      nextAfter(stepIndex, finished);
      return;
    }
    const elapsed = Date.now() - stepStarted.current;
    const minutes = Math.round((elapsed / 60000) * 10) / 10;
    if (user) {
      recordStepDone(user.id, { level, unitId, step }, list);
      logCourseEvent(user.id, {
        name: 'lernschritt_completed', level, unitId, stepId: step.id,
        props: { kind: step.kind, minutes, correct: result && result.correct, total: result && result.total },
      });
    } else localStepDone(unitId, level, step.id);
    if (step.kind === 'check' && result) {
      setCheckResult({ correct: Number(result.correct) || 0, total: Number(result.total) || 0, proofs: result.proofs || null, proofItems: result.proofItems || null });
    }
    if (result && result.microOutputs && typeof result.microOutputs === 'object') setMicroSent((m) => ({ ...m, ...result.microOutputs }));
    setSessionRuns((m) => new Map(m).set(step.id, (m.get(step.id) || 0) + 1));
    const done = new Set(finished);
    done.add(step.id);
    setFinished(done);
    // The game ledger, once per finished step: its items' XP plus the step bonus, its minutes, one
    // step (a learning day). An Überarbeiten moved on from keeps its marker but earns nothing.
    const itemXp = stepXp.current.get(step.id) || 0;
    stepXp.current.delete(step.id);
    if (result && result.submitted === false) { nextAfter(stepIndex, done); return; }
    const xp = itemXp + XP.step;
    recordGame({ xp, minutes, steps: 1 });
    setSessionXp((x) => x + XP.step);
    if (step.kind === 'check') { nextAfter(stepIndex, done); return; }
    setCelebration({
      index: stepIndex, done, xp,
      correct: Number(result && result.correct) || 0,
      total: Number(result && result.total) || 0,
      seconds: Math.round(elapsed / 1000),
      line: step.endLine || null,
      title: stepTitle(step, t),
    });
    setPhase('celebrate');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, [steps, stepIndex, user, level, unitId, finished, nextAfter, t]);

  const afterCelebration = useCallback(() => {
    const c = celebration;
    setCelebration(null);
    if (c) nextAfter(c.index, c.done);
    else nextAfter(stepIndex, finished);
  }, [celebration, nextAfter, stepIndex, finished]);

  const onStartDone = useCallback((result) => {
    // The Start's own answers are written now, under their own stage (see startStage).
    for (const [stepId, list] of pending.current.entries()) {
      if (!isStartId(unitId, stepId) || !list.length) continue;
      if (user) flushAttempts(user.id, { level, unitId, stepKind: startStage(stepId) }, list);
      pending.current.set(stepId, []);
    }
    // the Start's XP (the gist, the test-out) goes to the ledger now — XP, not a learning day
    let startXp = 0;
    for (const [id, xp] of stepXp.current.entries()) {
      if (!isStartId(unitId, id)) continue;
      startXp += xp;
      stepXp.current.delete(id);
    }
    if (startXp) recordGame({ xp: startXp });
    const to = result && result.testOut;
    if (to && testOutPassed(to, testOutThreshold)) {
      const credited = (unit.steps || []).filter((s) => LERNSCHRITT_KINDS.includes(s.kind)).map((s) => s.id);
      const accuracy = Number(to.total) > 0 ? Number(to.correct) / Number(to.total) : null;
      if (user) recordTestOut(user.id, { level, unitId, stepIds: credited, accuracy });
      else localTestOut(unitId, level, credited);
      const done = new Set([...finished, ...credited]);
      setFinished(done);
      setTestOutNote(true);
      nextAfter(-1, done);
      return;
    }
    nextAfter(-1, finished);
  }, [testOutThreshold, unit.steps, user, level, unitId, finished, nextAfter]);

  // The recap decides and stores completion once per visit.
  const submitted = useMemo(
    () => (unit.steps || []).filter((s) => AUFGABE_KINDS.includes(s.kind) && finished.has(s.id) && s.task && s.task.bankKey).map((s) => s.task.bankKey),
    [unit.steps, finished],
  );
  const completion = useMemo(() => {
    const stored = learner && learner.row ? learner.row.status : null;
    try {
      return unitCompletion(unit, { progress: stored ? { [unitId]: stored } : {}, finishedSteps: [...finished], submitted }, rules);
    } catch (err) {
      console.error('[course-v2] unitCompletion:', err && err.message);
      return null;
    }
  }, [unit, unitId, learner, finished, submitted, rules]);
  const accuracy = checkResult && checkResult.total > 0 ? checkResult.correct / checkResult.total : null;
  const storedStatus = learner && learner.row ? learner.row.status : null;
  const finalStatus = completion ? statusToStore(storedStatus, completion.status, { accuracy }) : storedStatus;
  const checkStep = (unit.steps || []).find((s) => s.kind === 'check');
  const checkDone = checkStep ? finished.has(checkStep.id) : false;
  const complete = Boolean(completion && completion.complete);
  // XP.unit: a unit completed in THIS visit (a step finished now, not complete when it loaded),
  // shown on the recap and written to the ledger once
  const unitBonus = phase === 'recap' && complete && sessionRuns.size > 0 && storedStatus !== 'complete' && storedStatus !== 'gold' ? XP.unit : 0;
  useEffect(() => {
    if (!unitBonus || unitXpAwarded.current) return;
    unitXpAwarded.current = true;
    recordGame({ xp: unitBonus });
  }, [unitBonus]);

  // Written whenever the recap shows a status that is not stored yet — also when the
  // learner went back from the recap to an open Aufgabe and returns — and the review
  // cards are seeded once, after the Check.
  useEffect(() => {
    if (phase !== 'recap' || !completion) return;
    const known = savedStatus.current || storedStatus;
    if (finalStatus && finalStatus !== known) {
      savedStatus.current = finalStatus;
      if (user) saveUnitStatus(user.id, { level, unitId, status: finalStatus, accuracy });
      else localUnitStatus(unitId, level, finalStatus);
    }
    if (user && checkDone && !cardsSeeded.current) {
      cardsSeeded.current = true;
      seedUnitCards(user.id, unit);
    }
  }, [phase, completion, user, finalStatus, storedStatus, level, unitId, accuracy, checkDone, unit]);

  // The renderers' optional, additive props (StepView's doc comment): the level's
  // rule cards and the manifest (can-do wording), the Check's earlier items as the
  // plan drew them, and which Aufgaben are submitted (the Check's „Das kann ich").
  const rendererExtras = useMemo(() => {
    const checkPlan = (steps.find((s) => s.kind === 'check') || {}).plan;
    const earlierIds = new Set((checkPlan && checkPlan.earlierIds) || []);
    const aufgaben = {};
    for (const s of unit.steps || []) if (AUFGABE_KINDS.includes(s.kind)) aufgaben[s.kind] = aufgaben[s.kind] || finished.has(s.id);
    return {
      ruleCards: unit.ruleCards || null,
      course: manifest || null,
      onProgress: setStepProgress,
      earlierItems: checkPlan ? (checkPlan.items || []).filter((it) => earlierIds.has(it.id)) : null,
      aufgaben,
      microOutputs: microOutputsSent(unit, microSent, finished),
    };
  }, [steps, unit, manifest, finished, microSent]);

  const doneCount = steps.filter((s) => finished.has(s.id)).length;
  const progress = steps.length ? doneCount / steps.length : 0;

  if (phase === 'loading') {
    return <Shell level={level} progress={0}><p className="py-16 text-center text-[1rem] font-semibold text-game-muted">{t('player.loading')}</p></Shell>;
  }

  if (phase === 'start') {
    const fallback = <StartFallback unit={unit} row={manifestRow} steps={steps} finished={finished} onOpen={goTo} />;
    return (
      <Shell
        level={level}
        progress={progress}
        combo={combo}
        xp={sessionXp}
        footer={hasStartRenderer ? null : <GameButton onClick={() => onStartDone(null)}>{t('start.begin')}</GameButton>}
      >
        <StartViewSlot unit={unit} level={level} onDone={onStartDone} fallback={fallback} extra={{ course: manifest, onAttempt }} />
      </Shell>
    );
  }

  if (phase === 'resume') {
    const next = steps[stepIndex];
    return (
      <Shell
        level={level}
        progress={progress}
        footer={next && <GameButton caps={false} onClick={() => goTo(stepIndex)}>{t('player.resumeAt', { n: stepIndex + 1, title: stepTitle(next, t) })}</GameButton>}
      >
        <div className="space-y-5">
          <div className="flex items-end gap-3">
            <CastAvatar name={narrator} size={84} className="shrink-0" />
            <SpeechBubble tail="left" className="min-w-0 flex-1">
              <p className="text-[1.125rem] font-extrabold text-game-text">{t('player.welcomeTitle')}</p>
              <p className="mt-0.5 text-[1rem] font-semibold text-game-muted">{t('player.welcomeBack', { d: doneCount, t: steps.length })}</p>
            </SpeechBubble>
          </div>
          <header>
            <p className={EYEBROW}>{t('player.unit', { n: unit.nr })}</p>
            <h1 className={`mt-1 ${H1}`} lang="de">{unit.title && unit.title.de}</h1>
          </header>
          <StepList unit={unit} steps={steps} finished={finished} currentIndex={stepIndex} onOpen={goTo} />
          <QuietButton onClick={() => setPhase('start')}>{t('player.startAgain')}</QuietButton>
        </div>
      </Shell>
    );
  }

  if (phase === 'celebrate' && celebration) {
    return (
      <Shell level={level} progress={1} progressLabel={t('player.progressStep')} combo={combo} xp={sessionXp}>
        <StepCelebration
          xp={celebration.xp}
          correct={celebration.correct}
          total={celebration.total}
          seconds={celebration.seconds}
          line={celebration.line}
          title={celebration.title}
          onNext={afterCelebration}
        />
      </Shell>
    );
  }

  if (phase === 'step' || phase === 'celebrate') {
    const step = steps[stepIndex];
    if (!step) return <Navigate to={v2Paths.home(level)} replace />;
    return (
      <Shell level={level} progress={stepProgress} progressLabel={t('player.progressStep')} combo={combo} xp={sessionXp}>
        {testOutNote && stepIndex === steps.findIndex((s) => !finished.has(s.id)) && (
          <p className="mb-4 rounded-2xl border-2 border-game-right bg-game-right-wash px-4 py-3 text-[0.9375rem] font-bold text-game-right-ink" role="status">{t('player.testOutNote')}</p>
        )}
        <StepViewSlot
          unit={unit}
          step={step}
          level={level}
          title={stepTitle(step, t)}
          onAttempt={onAttempt}
          onDone={onDone}
          onSkip={() => nextAfter(stepIndex, finished)}
          extra={rendererExtras}
        />
      </Shell>
    );
  }

  // Recap (S6 „Lektion geschafft").
  const gold = finalStatus === 'gold';
  const openSteps = steps.map((s, i) => ({ s, i })).filter(({ s }) => !finished.has(s.id) && s.kind !== 'ueberarbeiten');
  const words = Array.isArray(unit.reviewCards) ? unit.reviewCards.filter((k) => String(k).startsWith('word:')).length : 0;
  const canDos = (manifestRow && manifestRow.canDos) || [];
  // Which can-do is proven, by the unit's own proof rule (check.proofs) read the way the Check
  // reads it — proofShown (src/lib/course-v2/proofs.js): EVERY proof the rule names must be shown,
  // an item AND an Aufgabe where it names both (the recap used to look at the Aufgabe alone).
  //   items        the proof items' results of this visit's Check (CheckView's `proofItems`); a
  //                Check without them reports its per-can-do verdict (`proofs`), which then stands
  //                for the item; a Check done in an earlier visit left neither, and the item counts
  //                as shown once the unit is complete;
  //   aufgaben     submitted now (finished Aufgabe steps) — so an Aufgabe submitted after the Check
  //                still ticks its can-do;
  //   microOutputs the learner's own micro-outputs sent.
  // A can-do without a proof rule is proven by the unit being complete. So the recap never ticks a
  // can-do the Check has just shown as open.
  const canDoIds = (manifestRow && manifestRow.canDoIds) || [];
  const proofRules = (unit.check && unit.check.proofs) || [];
  const proofEvidence = { aufgaben: rendererExtras.aufgaben, microOutputs: rendererExtras.microOutputs };
  const proofItemsOf = (rule) => {
    if (!rule.item) return {};
    if (checkResult && checkResult.proofItems && rule.item in checkResult.proofItems) return { [rule.item]: checkResult.proofItems[rule.item] === true };
    if (checkResult && checkResult.proofs && rule.canDo in checkResult.proofs) return { [rule.item]: checkResult.proofs[rule.canDo] === true };
    return { [rule.item]: complete };
  };
  const proven = (i) => {
    const rule = proofRules.find((p) => p && p.canDo === canDoIds[i]);
    if (!rule || !proofParts(rule).length) return complete;
    return proofShown(rule, { ...proofEvidence, items: proofItemsOf(rule) });
  };
  const allProven = canDos.length > 0 && canDos.every((_, i) => proven(i));
  const units = (manifest && manifest.units) || [];
  const nextRow = units.find((r) => r && nrOfId(r.unit || r.id) === unit.nr + 1) || null;
  const etappe = ((manifest && manifest.etappen) || []).find((e) => (e.units || []).includes(unitId));
  const lastOfEtappe = Boolean(etappe && etappe.closedBy) && (etappe.units || [])[etappe.units.length - 1] === unitId;
  const plateauNext = lastOfEtappe && etappe.closedBy !== 'closing';
  const nextTarget = plateauNext
    ? { to: v2Paths.plateau(level, nrOfId(etappe.closedBy)), label: t('player.toPlateau', { n: nrOfId(etappe.closedBy) }) }
    : lastOfEtappe && !(manifest && manifest.kind === 'dot2') // a .2 closing (Modelltest A) has no v2 runner yet
      ? { to: v2Paths.closing(level), label: t('as.toClosing') }
      : nextRow && nextRow.chunk
        ? { to: v2Paths.unit(level, unit.nr + 1), label: t('player.toUnit', { n: unit.nr + 1 }) }
        : { to: v2Paths.home(level), label: t('player.home') };

  const pct = accuracy !== null ? Math.round(accuracy * 100) : null;
  return (
    <Shell
      level={level}
      progress={progress}
      combo={combo}
      xp={sessionXp + unitBonus}
      footer={<GameButton to={nextTarget.to}>{nextTarget.label}</GameButton>}
    >
      <div className="space-y-5">
        <header className="flex flex-col items-center text-center">
          {complete ? <Trophy /> : <CastAvatar name={narrator} size={112} className="motion-safe:animate-pop-in" />}
          {gold && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 border-game-xp-edge bg-game-xp px-3 py-1 text-[0.875rem] font-extrabold text-game-text" aria-label="Siegel">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> Siegel
            </span>
          )}
          <p className={`mt-3 ${EYEBROW}`}>{t('player.unit', { n: unit.nr })}</p>
          <h1 className={`mt-1 ${complete ? 'text-game-xp-ink' : 'text-game-text'} text-[1.875rem] font-extrabold leading-tight`}>
            {complete ? t('player.complete') : t('player.almost')}
          </h1>
          <p className="mt-1 text-[1.0625rem] font-bold text-game-muted" lang="de">{unit.title && unit.title.de}</p>
          {unitBonus > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-game-xp-wash px-3 py-1.5 text-[1rem] font-extrabold text-game-xp-ink motion-safe:animate-pop-in">
              <XpIcon size={18} /> {t('player.unitBonus')} {t('game.xp', { n: unitBonus })}
            </p>
          )}
        </header>

        {sessionRuns.size > 0 && (
          <div className="grid grid-cols-3 gap-2.5">
            <StatTile tone="xp" label={t('cel.xp')} value={`+${sessionXp + unitBonus}`} />
            <StatTile tone="course" label={t('cel.right')} value={pct !== null ? `${pct} %` : '–'} />
            <StatTile tone="time" label={t('cel.time')} value={clock(recapSeconds || 0)} />
          </div>
        )}

        {!complete && openSteps.length > 0 && (
          <div className="rounded-[1.25rem] border-2 border-b-4 border-accent-aprikose bg-accent-aprikose-wash p-4">
            <h2 className="text-[1rem] font-extrabold text-accent-aprikose-ink">{t('player.open')}</h2>
            <ul className="mt-2 space-y-1">
              {openSteps.map(({ s, i }) => (
                <li key={s.id}>
                  <button type="button" onClick={() => goTo(i)} className="min-h-11 text-left text-[1rem] font-extrabold text-course-ink hover:underline">
                    {t('player.openStep', { n: i + 1, title: stepTitle(s, t) })}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {accuracy !== null && accuracy < 0.6 && (
          // The Check suggests repeating a Lernschritt; the list makes that one tap
          // (a repeat serves a fresh draw — see `attempts`). A suggestion, never a gate.
          <div className="space-y-3">
            <p className="text-[1rem] font-semibold text-game-muted">{t('player.repeatTip')}</p>
            <StepList unit={unit} steps={steps} finished={finished} currentIndex={-1} onOpen={goTo} />
          </div>
        )}

        {canDos.length > 0 && (
          // A tick per proven can-do (see `proven`), the same verdict as the Check's
          // „Das kann ich"; „Das können Sie jetzt" only when every one is proven.
          <div className={PANEL}>
            <h2 className={EYEBROW}>
              {allProven ? t('player.canNow') : t('player.goalsUnit')}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {canDos.map((c, i) => (
                <li key={c} className="flex gap-2.5 text-[1rem] font-bold text-game-text">
                  {proven(i)
                    ? <Check className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-game-right p-0.5 text-white" strokeWidth={3.5} aria-hidden="true" />
                    : <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-game-line" aria-hidden="true" />}
                  <span>{c}{proven(i) && <span className="sr-only"> ({t('player.doneMark')})</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {words > 0 && checkDone && (
          <p className="text-[1rem] font-semibold text-game-muted">{t('player.words', { n: words })}</p>
        )}

        {sessionRuns.size > 0 && <StreakCard />}

        {unit.story && unit.story.cliffhanger && (
          // the hook into the next unit, told by the narrator
          <div className="flex items-end gap-3">
            <CastAvatar name={narrator} size={72} className="shrink-0" />
            <SpeechBubble tail="left" className="min-w-0 flex-1">
              <p className={EYEBROW}>{nextRow && nextRow.chunk && !plateauNext ? t('player.nextTeaser', { n: unit.nr + 1 }) : t('check.story')}</p>
              <StoryCliffhanger story={unit.story} idPrefix={`${unitId}-recap-story`} className="mt-1 text-[1.0625rem] font-bold leading-snug text-game-text" />
            </SpeechBubble>
          </div>
        )}

        {nextRow && nextRow.title && !plateauNext && (
          <p className="text-[1rem] font-semibold text-game-muted">
            {t('player.nextUp')} <span className="font-extrabold text-game-text">{nextRow.title}</span>
            {nextRow.minutesPlanned ? ` · ${t('player.minutes', { n: nextRow.minutesPlanned })}` : ''}
          </p>
        )}
      </div>
    </Shell>
  );
}

/**
 * Which of the unit's micro-outputs the learner has sent: this visit's report (StepView), else —
 * for a step finished in an earlier visit — the step being finished.
 */
function microOutputsSent(unit, sent, finished) {
  const out = {};
  for (const s of (unit && unit.steps) || []) {
    const id = s && s.microOutput && s.microOutput.id;
    if (id) out[id] = id in sent ? Boolean(sent[id]) : finished.has(s.id);
  }
  return out;
}

export default function UnitPlayerPage() {
  const { level: levelParam, nr: nrParam } = useParams();
  const [params] = useSearchParams();
  const asked = Number(params.get('s'));
  const initialStep = Number.isInteger(asked) && asked >= 1 ? asked : null;
  const level = normalizeLevel(levelParam);
  const nr = Number(nrParam);
  const { user, loading: authLoading } = useAuth();
  const [, t] = useV2Strings();
  const valid = Boolean(level) && Number.isInteger(nr) && nr >= 1 && nr <= 12;
  const data = useUnitData(valid ? level : null, valid ? nr : null);

  if (!valid) return <Navigate to="/courses/" replace />;
  if (data.status === 'loading' || authLoading) {
    return <Shell level={level} progress={0}><p className="py-16 text-center text-[1rem] font-semibold text-game-muted">{t('player.loading')}</p></Shell>;
  }
  if (data.status === 'missing') {
    return (
      <Shell level={level} progress={0} footer={<GameButton to={v2Paths.home(level)}>{t('player.home')}</GameButton>}>
        <div className={PANEL}>
          <p className={EYEBROW}>{t('player.unit', { n: pad2(nr) })}</p>
          <h1 className="mt-2 text-[1.375rem] font-extrabold text-game-text">{t('player.soonTitle')}</h1>
          <p className="mt-2 text-[1rem] font-semibold text-game-muted">{t('player.soonBody')}</p>
        </div>
      </Shell>
    );
  }
  return <UnitPlayer key={data.unit.id} level={level} unit={data.unit} manifest={data.manifest} user={user} initialStep={initialStep} />;
}
