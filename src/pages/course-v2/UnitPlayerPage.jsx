import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import { normalizeLevel, levelCode, nrOfId, v2Paths } from '../../lib/course-v2/ids.js';
import { buildUnitPlan, resumeIndex } from '../../lib/course-v2/unitPlan.js';
import { LERNSCHRITT_KINDS, AUFGABE_KINDS, testOutPassed, unitCompletion } from '../../lib/course-v2/completion.js';
import { unitRules } from '../../lib/course-v2/homeModel.js';
import {
  fetchUnitState, startUnit, recordStepDone, flushAttempts, recordTestOut, saveUnitStatus, statusToStore,
  seedUnitCards, logCourseEvent,
} from '../../lib/course-v2/progress.js';
import { localStepDone, localTestOut, localUnitState, localUnitStatus } from '../../lib/course-v2/localState.js';
import { loadEarlierItems, loadManifest, loadPlayableUnit, loadRuleCards } from '../../lib/course-v2/loaders.js';
import ActionBar from './ActionBar.jsx';
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

function Shell({ level, title, progress, children, footer }) {
  const [, t] = useV2Strings();
  const pct = Math.round(Math.max(0, Math.min(1, progress || 0)) * 100);
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className={`mx-auto max-w-2xl px-4 pt-4 sm:pt-8 ${footer ? 'pb-32' : 'pb-10'}`}>
        <div className="mb-5 flex items-center gap-3">
          <Link
            to={v2Paths.home(level)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 font-data text-sm font-bold text-siegel hover:text-siegel-deep"
            aria-label={t('player.home')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {levelCode(level)}
          </Link>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-pill bg-siegel-wash"
            role="progressbar"
            aria-label={t('player.progress')}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-pill bg-accent-limette transition-all duration-500 ease-snap motion-reduce:transition-none" style={{ width: `${pct}%` }} />
          </div>
          {title && <span className="hidden shrink-0 font-data text-[0.6875rem] text-graphite sm:inline">{title}</span>}
        </div>
        {children}
      </div>
      {footer && <ActionBar>{footer}</ActionBar>}
    </div>
  );
}

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
    <ol className="divide-y divide-rule rounded-clay border border-rule bg-white">
      {steps.map((s, i) => {
        const done = finished.has(s.id);
        const min = minutesOf(unit, s.id);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onOpen(i)}
              className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left hover:bg-siegel-wash"
              aria-current={i === currentIndex ? 'step' : undefined}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-pill font-data text-xs font-bold ${
                  done ? 'bg-accent-limette-wash text-accent-limette-ink' : 'border border-rule text-graphite'
                }`}
                aria-hidden="true"
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{stepTitle(s, t)}</span>
                <span className="block text-xs text-graphite">
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
  const chips = (row && row.pruefungsfokus && Object.values(row.pruefungsfokus)[0]) || [];
  return (
    <div className="space-y-5">
      <header>
        <Chip tone="label">{t('player.unit', { n: unit.nr })}</Chip>
        <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-[-0.018em] text-ink [hyphens:auto] sm:text-3xl">{unit.title && unit.title.de}</h1>
        {unit.title && unit.title.canDo && <p className="mt-2 text-graphite">{unit.title.canDo}</p>}
      </header>
      {canDos.length > 0 && (
        <Card className="p-4">
          <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('player.goals')}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {canDos.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </Card>
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={t('start.examFocus')}>
          {chips.map((c) => <Chip key={c} tone="aprikose">{c}</Chip>)}
        </div>
      )}
      <StepList unit={unit} steps={steps} finished={finished} currentIndex={-1} onOpen={onOpen} />
    </div>
  );
}

export function UnitPlayer({ level, unit, manifest, user }) {
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
  const [phase, setPhase] = useState('loading'); // loading | start | resume | step | recap
  const [stepIndex, setStepIndex] = useState(0);
  const [earlierItems, setEarlierItems] = useState([]);
  const [checkResult, setCheckResult] = useState(null);
  const [testOutNote, setTestOutNote] = useState(null);
  const [sessionRuns, setSessionRuns] = useState(() => new Map()); // stepId → runs finished in this visit
  const pending = useRef(new Map()); // stepId → attempts not yet written
  const stepStarted = useRef(Date.now());
  const savedStatus = useRef(null); // the status last written in this session
  const cardsSeeded = useRef(false);

  // Learner state: Supabase when signed in, this browser otherwise.
  useEffect(() => {
    let cancelled = false;
    const apply = (state) => {
      if (cancelled) return;
      setLearner(state);
      setFinished(new Set(state.finishedSteps));
      const idx = resumeIndex(unit.steps || [], state.finishedSteps);
      if (idx >= (unit.steps || []).length) setPhase('recap');
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
    setStepIndex(idx);
    setPhase('step');
    stepStarted.current = Date.now();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const nextAfter = useCallback((idx, done) => {
    const i = steps.findIndex((s, j) => j > idx && !done.has(s.id));
    if (i === -1) { setPhase('recap'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' }); } else goTo(i);
  }, [steps, goTo]);

  const onAttempt = useCallback((payload) => {
    if (!payload || !payload.itemId) return;
    const stepId = payload.stepId || (steps[stepIndex] && steps[stepIndex].id);
    const list = pending.current.get(stepId) || [];
    list.push({ ...payload, stepId });
    pending.current.set(stepId, list);
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
    const minutes = Math.round(((Date.now() - stepStarted.current) / 60000) * 10) / 10;
    if (user) {
      recordStepDone(user.id, { level, unitId, step }, list);
      logCourseEvent(user.id, {
        name: 'lernschritt_completed', level, unitId, stepId: step.id,
        props: { kind: step.kind, minutes, correct: result && result.correct, total: result && result.total },
      });
    } else localStepDone(unitId, level, step.id);
    if (step.kind === 'check' && result) {
      setCheckResult({ correct: Number(result.correct) || 0, total: Number(result.total) || 0, proofs: result.proofs || null });
    }
    setSessionRuns((m) => new Map(m).set(step.id, (m.get(step.id) || 0) + 1));
    const done = new Set(finished);
    done.add(step.id);
    setFinished(done);
    nextAfter(stepIndex, done);
  }, [steps, stepIndex, user, level, unitId, finished, nextAfter]);

  const onStartDone = useCallback((result) => {
    // The Start's own answers are written now, under their own stage (see startStage).
    for (const [stepId, list] of pending.current.entries()) {
      if (!isStartId(unitId, stepId) || !list.length) continue;
      if (user) flushAttempts(user.id, { level, unitId, stepKind: startStage(stepId) }, list);
      pending.current.set(stepId, []);
    }
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
      earlierItems: checkPlan ? (checkPlan.items || []).filter((it) => earlierIds.has(it.id)) : null,
      aufgaben,
    };
  }, [steps, unit.steps, unit.ruleCards, manifest, finished]);

  const doneCount = steps.filter((s) => finished.has(s.id)).length;
  const progress = steps.length ? doneCount / steps.length : 0;

  if (phase === 'loading') {
    return <Shell level={level} progress={0}><p className="py-16 text-center text-sm italic text-graphite">{t('player.loading')}</p></Shell>;
  }

  if (phase === 'start') {
    const fallback = <StartFallback unit={unit} row={manifestRow} steps={steps} finished={finished} onOpen={goTo} />;
    return (
      <Shell
        level={level}
        progress={progress}
        title={t('player.unit', { n: unit.nr })}
        footer={hasStartRenderer ? null : <Button size="lg" className="w-full" onClick={() => onStartDone(null)}>{t('start.begin')}</Button>}
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
        title={t('player.unit', { n: unit.nr })}
        footer={next && <Button size="lg" className="w-full" onClick={() => goTo(stepIndex)}>{t('player.resumeAt', { n: stepIndex + 1, title: stepTitle(next, t) })}</Button>}
      >
        <div className="space-y-5">
          <header>
            <Chip tone="label">{t('player.unit', { n: unit.nr })}</Chip>
            <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-[-0.018em] text-ink [hyphens:auto] sm:text-3xl">{unit.title && unit.title.de}</h1>
            <p className="mt-2 text-graphite">{t('player.welcomeBack', { d: doneCount, t: steps.length })}</p>
          </header>
          <StepList unit={unit} steps={steps} finished={finished} currentIndex={stepIndex} onOpen={goTo} />
          <button type="button" onClick={() => setPhase('start')} className="min-h-11 text-sm font-bold text-siegel hover:text-siegel-deep">
            {t('player.startAgain')}
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === 'step') {
    const step = steps[stepIndex];
    if (!step) return <Navigate to={v2Paths.home(level)} replace />;
    return (
      <Shell level={level} progress={progress} title={t('player.stepOf', { n: stepIndex + 1, t: steps.length })}>
        {testOutNote && stepIndex === steps.findIndex((s) => !finished.has(s.id)) && (
          <p className="mb-4 rounded-clay bg-accent-limette-wash px-4 py-3 text-sm text-accent-limette-ink" role="status">{t('player.testOutNote')}</p>
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
  const complete = Boolean(completion && completion.complete);
  const gold = finalStatus === 'gold';
  const openSteps = steps.map((s, i) => ({ s, i })).filter(({ s }) => !finished.has(s.id) && s.kind !== 'ueberarbeiten');
  const words = Array.isArray(unit.reviewCards) ? unit.reviewCards.filter((k) => String(k).startsWith('word:')).length : 0;
  const canDos = (manifestRow && manifestRow.canDos) || [];
  // Which can-do is proven, by the unit's own proof rule (check.proofs): an Aufgabe proof
  // by that Aufgabe being submitted now; an item proof by the Check's „Das kann ich" of
  // this visit (CheckView's onDone `proofs`); without either (no proof rule, or the Check
  // was done in an earlier visit) by the unit being complete. So the recap never ticks a
  // can-do the Check has just shown as open.
  const canDoIds = (manifestRow && manifestRow.canDoIds) || [];
  const proofRules = (unit.check && unit.check.proofs) || [];
  const proven = (i) => {
    const rule = proofRules.find((p) => p && p.canDo === canDoIds[i]);
    if (rule && rule.aufgabe) return (unit.steps || []).some((s) => s.kind === rule.aufgabe && finished.has(s.id));
    if (rule && checkResult && checkResult.proofs && rule.canDo in checkResult.proofs) return Boolean(checkResult.proofs[rule.canDo]);
    return complete;
  };
  const allProven = canDos.length > 0 && canDos.every((_, i) => proven(i));
  const units = (manifest && manifest.units) || [];
  const nextRow = units.find((r) => r && nrOfId(r.unit || r.id) === unit.nr + 1) || null;
  const etappe = ((manifest && manifest.etappen) || []).find((e) => (e.units || []).includes(unitId));
  const plateauNext = etappe && etappe.closedBy && etappe.closedBy !== 'closing' && (etappe.units || [])[etappe.units.length - 1] === unitId;
  const nextTarget = plateauNext
    ? { to: v2Paths.plateau(level, nrOfId(etappe.closedBy)), label: t('player.toPlateau', { n: nrOfId(etappe.closedBy) }) }
    : nextRow && nextRow.chunk
      ? { to: v2Paths.unit(level, unit.nr + 1), label: t('player.toUnit', { n: unit.nr + 1 }) }
      : { to: v2Paths.home(level), label: t('player.home') };

  return (
    <Shell
      level={level}
      progress={progress}
      title={t('player.unit', { n: unit.nr })}
      footer={<Button size="lg" className="w-full" to={nextTarget.to}>{nextTarget.label}</Button>}
    >
      <div className="space-y-5">
        <header className="text-center">
          {gold && (
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-pill bg-gold text-ink shadow-raise" aria-label="Siegel">
              <Check className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
          <Chip tone="label">{t('player.unit', { n: unit.nr })}</Chip>
          <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-[-0.018em] text-ink [hyphens:auto] sm:text-3xl">
            {complete ? t('player.complete') : t('player.almost')}
          </h1>
          <p className="mt-2 text-graphite">{unit.title && unit.title.de}</p>
        </header>

        {!complete && openSteps.length > 0 && (
          <Card tone="sunk" className="p-4">
            <h2 className="text-sm font-bold text-ink">{t('player.open')}</h2>
            <ul className="mt-2 space-y-1">
              {openSteps.map(({ s, i }) => (
                <li key={s.id}>
                  <button type="button" onClick={() => goTo(i)} className="min-h-11 text-left text-sm font-bold text-siegel hover:text-siegel-deep">
                    {t('player.openStep', { n: i + 1, title: stepTitle(s, t) })}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {accuracy !== null && accuracy < 0.6 && (
          // The Check suggests repeating a Lernschritt; the list makes that one tap
          // (a repeat serves a fresh draw — see `attempts`). A suggestion, never a gate.
          <div className="space-y-3">
            <p className="text-sm text-graphite">{t('player.repeatTip')}</p>
            <StepList unit={unit} steps={steps} finished={finished} currentIndex={-1} onOpen={goTo} />
          </div>
        )}

        {canDos.length > 0 && (
          // A tick per proven can-do (see `proven`), the same verdict as the Check's
          // „Das kann ich"; „Das können Sie jetzt" only when every one is proven.
          <Card className="p-4">
            <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              {allProven ? t('player.canNow') : t('player.goalsUnit')}
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-ink">
              {canDos.map((c, i) => (
                <li key={c} className="flex gap-2">
                  {proven(i)
                    ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-limette-ink" aria-hidden="true" />
                    : <span className="mt-0.5 w-4 shrink-0 text-center text-graphite" aria-hidden="true">›</span>}
                  <span>{c}{proven(i) && <span className="sr-only"> ({t('player.doneMark')})</span>}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {words > 0 && checkDone && (
          <p className="text-sm text-graphite">{t('player.words', { n: words })}</p>
        )}

        {unit.story && unit.story.cliffhanger && (
          <Card tone="wash" className="p-4">
            <p className="text-sm italic text-ink">{unit.story.cliffhanger}</p>
          </Card>
        )}

        {nextRow && nextRow.title && !plateauNext && (
          <p className="text-sm text-graphite">
            {t('player.nextUp')} <span className="font-bold text-ink">{nextRow.title}</span>
            {nextRow.minutesPlanned ? ` · ${t('player.minutes', { n: nextRow.minutesPlanned })}` : ''}
          </p>
        )}
      </div>
    </Shell>
  );
}

export default function UnitPlayerPage() {
  const { level: levelParam, nr: nrParam } = useParams();
  const level = normalizeLevel(levelParam);
  const nr = Number(nrParam);
  const { user, loading: authLoading } = useAuth();
  const [, t] = useV2Strings();
  const valid = Boolean(level) && Number.isInteger(nr) && nr >= 1 && nr <= 12;
  const data = useUnitData(valid ? level : null, valid ? nr : null);

  if (!valid) return <Navigate to="/courses/" replace />;
  if (data.status === 'loading' || authLoading) {
    return <Shell level={level} progress={0}><p className="py-16 text-center text-sm italic text-graphite">{t('player.loading')}</p></Shell>;
  }
  if (data.status === 'missing') {
    return (
      <Shell level={level} progress={0} footer={<Button size="lg" className="w-full" to={v2Paths.home(level)}>{t('player.home')}</Button>}>
        <Card className="p-5">
          <Chip tone="quiet">{t('player.unit', { n: pad2(nr) })}</Chip>
          <h1 className="mt-3 font-display text-xl font-semibold tracking-[-0.018em] text-ink">{t('player.soonTitle')}</h1>
          <p className="mt-2 text-sm text-graphite">{t('player.soonBody')}</p>
        </Card>
      </Shell>
    );
  }
  return <UnitPlayer key={data.unit.id} level={level} unit={data.unit} manifest={data.manifest} user={user} />;
}
