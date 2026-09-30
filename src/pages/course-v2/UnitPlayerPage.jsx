import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CastAvatar from '../../components/course-v2/CastAvatar.jsx';
import CourseTheme from '../../components/course-v2/CourseTheme.jsx';
import GameButton, { QuietButton } from '../../components/course-v2/GameButton.jsx';
import GameTopBar, { GuideTopBar } from '../../components/course-v2/GameTopBar.jsx';
import { StatTile, Trophy, clock } from '../../components/course-v2/GameParts.jsx';
import StepCelebration from '../../components/course-v2/StepCelebration.jsx';
import UnitIntro, { StoryScreen } from '../../components/course-v2/UnitIntro.jsx';
import { laneLabel, teilLabel } from '../../components/course-v2/content.js';
import { guideCloseTarget, narratorOf, screenOf, welcomeLine } from '../../components/course-v2/story.js';
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
import { loadEarlierItems, loadManifest, loadPlayableUnit, loadRuleCards, loadWords } from '../../lib/course-v2/loaders.js';
import { cardTitle, cardsByIds, tocRows, unitCardIds, unitWordGroups, wordsOfUnit } from '../../components/course-v2/kapitel.js';
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
//
// One thing per screen (round 3, owner 2026-09-30: "it looks intimidating and too much … duolingo
// style … step for step"; story.js screenOf decides the screen): a fresh unit opens on StartView's
// story screen (the narrator, one bubble, „Los geht's"), a resumed one on a welcome-back (one bubble,
// „Weiter" into the first open step, „Kapitel im Überblick"). The textbook Kapitel page of round 2
// (owner 2026-09-29: "a CURRICULUM like the books — chapters") is the opt-in GUIDE behind
// `?view=guide` — the home's book button, the welcome-back and the recap link to it: the can-dos
// ticked by the recap's own proof reading, the table of contents (Einstieg, A / B / C,
// Prüfungstraining, Sprechen, Schreiben, Kapiteltest; every row opens its part), the back matter
// (Grammatik, Wortschatz, Redemittel) and ONE button at the very end. Its X goes back to where the
// learner came from (story.js guideCloseTarget). The recap is a trophy, one headline, three tiles and
// one button. The unit handed to the renderers also carries `lexicon` — its own words from the
// level's words.json.

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
    Promise.all([loadPlayableUnit(level, nr), loadManifest(level), loadRuleCards(level), loadWords(level)])
      .then(([unit, manifest, ruleCards, words]) => {
        if (cancelled) return;
        if (!unit) { setData({ status: 'missing', manifest }); return; }
        setData({ status: 'ready', unit: { ...unit, ruleCards, lexicon: wordsOfUnit(words, unit.id) }, manifest });
      })
      .catch((err) => {
        console.error('[course-v2] unit load failed:', err && err.message);
        if (!cancelled) setData({ status: 'missing', manifest: null });
      });
    return () => { cancelled = true; };
  }, [level, nr]);
  return data;
}

function Shell({ level, progress, progressLabel = null, combo = 0, bar = null, children, footer }) {
  const [, t] = useV2Strings();
  return (
    <CourseTheme>
      <div className={`mx-auto max-w-2xl px-4 ${footer ? 'pb-36' : 'pb-10'}`}>
        {bar || (
          <GameTopBar
            homeTo={v2Paths.home(level)}
            homeLabel={t('player.home')}
            progress={progress}
            progressLabel={progressLabel || t('player.progress')}
            combo={combo}
          />
        )}
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

export function UnitPlayer({ level, unit, manifest, user, initialStep = null, view = null, onGuide = null, onLeaveGuide = null, onCloseGuide = null }) {
  const [lang, t] = useV2Strings();
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
  // where the guide opens the Start: null (the story screen), 'folge' (its Einstieg row), 'testout'
  const [startEntry, setStartEntry] = useState(null);
  const guideOpen = view === 'guide';
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, [guideOpen]);

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

  // The can-dos and their proofs, read for the guide (which ticks them).
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
  // A can-do without a proof rule is proven by the unit being complete. So the guide never ticks a
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

  const scrollTop = () => { if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' }); };
  // Leaving the guide for one of the flow's screens drops `?view=guide` (the page's onLeaveGuide).
  const leaveGuide = () => { if (guideOpen && typeof onLeaveGuide === 'function') onLeaveGuide(); };
  // A row of the guide's table of contents: its step, or the summary past the last one.
  const openFromChapter = (i) => {
    leaveGuide();
    if (Number.isInteger(i) && i >= 0 && i < steps.length) { goTo(i); return; }
    deepLink.current = null;
    setPhase('recap');
    scrollTop();
  };
  // …and the Start again, from the guide: its story screen („Kapitel starten" on a fresh unit), the
  // Folge straight away (the Einstieg row), or the test-out.
  const openStart = (entry = null) => {
    leaveGuide();
    deepLink.current = null;
    setStartEntry(entry);
    setPhase('start');
    scrollTop();
  };
  // a part of the Kapitel by its name (the welcome-back's line, the guide's „Weiter: …")
  const partName = (r) => {
    if (!r) return '';
    const named = { check: 'kap.test', pruefung: 'kap.pruefung', sprechen: 'kap.sprechen', schreiben: 'kap.schreiben', ueberarbeiten: 'kap.ueberarbeiten' }[r.kind];
    if (named) return t(named);
    return r.title || (r.letter ? t('kap.part', { l: r.letter }) : '');
  };
  const chapterHeading = <>{t('player.unit', { n: unit.nr })}{unit.title && unit.title.de ? <> · <span lang="de">{unit.title.de}</span></> : null}</>;
  const screen = screenOf(phase, view);

  if (screen === 'loading') {
    return <Shell level={level} progress={0}><p className="py-16 text-center text-[1rem] font-semibold text-game-muted">{t('player.loading')}</p></Shell>;
  }

  if (screen === 'guide') {
    // THE GUIDE (UnitIntro.jsx): the textbook Kapitel page, one tap deep. „Weiter" is the first open
    // part once the learner has begun; a fresh unit starts at its story screen.
    const started = finished.size > 0;
    const resumeAt = resumeIndex(unit.steps || [], finished);
    const rows = tocRows({ unit, course: manifest, finished, currentIndex: started ? resumeAt : -1 });
    const allDone = rows.length > 0 && rows.every((r) => r.state === 'done');
    const next = started && !allDone ? rows[resumeAt] || rows.find((r) => r.state !== 'done') || null : null;
    const primaryLabel = !started
      ? t('kap.start')
      : next ? (next.letter ? t('kap.continuePart', { l: next.letter }) : t('kap.continueWith', { name: partName(next) })) : t('kap.toSummary');
    const onPrimary = !started ? () => openStart(null) : () => openFromChapter(next ? next.index : steps.length);
    const start = unit.start || {};
    const folge = start.folge || null;
    const lane = unit.spec && unit.spec.lanes && unit.spec.lanes.primary ? unit.spec.lanes.primary : null;
    const chips = Array.isArray(start.pruefungsfokusChips) ? start.pruefungsfokusChips.map((tpl) => teilLabel(tpl)) : [];
    const lernschritteOpen = rows.some((r) => r.state !== 'done' && ['situation', 'text', 'sprache', 'pruefung'].includes(r.kind));
    const minutes = Number(unit.minutesPlanned && unit.minutesPlanned.total) || 0;
    const meta = [
      [String(unit.level || level || '').toUpperCase(), unit.etappe ? t('kap.module', { m: unit.etappe }) : null].filter(Boolean).join(' · '),
      steps.length ? t('kap.parts', { n: steps.length }) : null,
      minutes ? t('kap.minutes', { n: minutes }) : null,
    ].filter(Boolean).join(' · ');
    // The can-dos, ticked by the recap's own proof reading (see `proven`): a tick per proven can-do,
    // „Das können Sie jetzt" only when every one is proven.
    const goals = canDos.length > 0 && (
      <section aria-labelledby={`${unitId}-guide-goals`}>
        <h2 id={`${unitId}-guide-goals`} className={EYEBROW}>
          {allProven ? t('player.canNow') : t('player.goalsUnit')}
        </h2>
        <ul className="mt-3 space-y-3 rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4 sm:p-5">
          {canDos.map((c, i) => (
            <li key={c} className="flex gap-3 text-[1.0625rem] font-bold leading-snug text-game-text" lang="de">
              {proven(i)
                ? <Check className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-game-right p-0.5 text-white" strokeWidth={3.5} aria-hidden="true" />
                : <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-game-line" aria-hidden="true" />}
              <span>{c}{proven(i) && <span className="sr-only" lang={lang}> ({t('player.doneMark')})</span>}</span>
            </li>
          ))}
        </ul>
      </section>
    );
    return (
      <Shell level={level} bar={<GuideTopBar title={t('flow.guideTitle', { n: unit.nr })} closeLabel={t('flow.close')} onClose={onCloseGuide} />}>
        <UnitIntro
          title={unit.title && unit.title.de}
          meta={meta}
          goals={goals}
          goalCount={canDos.length}
          rows={rows}
          intro={folge ? { nr: unit.nr, title: folge.title || null, state: started ? 'open' : 'current' } : null}
          onOpenRow={openFromChapter}
          onOpenIntro={() => openStart('folge')}
          cards={cardsByIds(unitCardIds(unit), unit.ruleCards).map((card) => ({ card, title: cardTitle(unit, manifest, card.id) }))}
          wordGroups={unitWordGroups(unit, Array.isArray(unit.lexicon) ? unit.lexicon : [])}
          redemittel={Array.isArray(unit.redemittel) ? unit.redemittel : []}
          examFocus={lane && chips.length ? [laneLabel(lane), ...chips] : chips}
          lane={lane}
          level={unit.level || level}
          unitId={unitId}
          primaryLabel={primaryLabel}
          onPrimary={onPrimary}
          onTestOut={start.testOut && start.testOut.offered && lernschritteOpen ? () => openStart('testout') : null}
        />
      </Shell>
    );
  }

  if (screen === 'story') {
    // The Start (StartView): the story screen, then the Folge and the optional bonus — or, opened from
    // the guide, the Folge or the test-out straight away (`entry`). StartFallback is the plain version.
    const entry = startEntry;
    const fallback = <StartFallback unit={unit} row={manifestRow} steps={steps} finished={finished} onOpen={goTo} />;
    return (
      <Shell
        level={level}
        progress={progress}
        combo={combo}
        footer={hasStartRenderer ? null : <GameButton onClick={() => onStartDone(null)}>{t('start.begin')}</GameButton>}
      >
        <StartViewSlot key={`start-${entry || 'story'}`} unit={unit} level={level} onDone={onStartDone} fallback={fallback} extra={{ course: manifest, onAttempt, entry }} />
      </Shell>
    );
  }

  if (screen === 'welcome') {
    // Welcome back: one bubble naming the part „Weiter" opens, one button, the guide one quiet tap away.
    const rows = tocRows({ unit, course: manifest, finished, currentIndex: stepIndex });
    const line = welcomeLine(rows[stepIndex] || null, partName);
    return (
      <Shell level={level} progress={progress} combo={combo}>
        <StoryScreen
          id={`${unitId}-welcome`}
          heading={chapterHeading}
          narrator={narrator}
          bubble={t('flow.welcome')}
          bubbleLang={lang}
          bubbleNote={t(line.key, line.vars)}
          primaryLabel={t('item.next')}
          onPrimary={() => goTo(stepIndex)}
          quietLabel={t('flow.overview')}
          onQuiet={onGuide}
        />
      </Shell>
    );
  }

  if (phase === 'celebrate' && celebration) {
    return (
      <Shell level={level} progress={1} progressLabel={t('player.progressStep')} combo={combo}>
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
      <Shell level={level} progress={stepProgress} progressLabel={t('player.progressStep')} combo={combo}>
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

  // Recap (S6 „Lektion geschafft"), Duolingo's lesson-complete way: the trophy (or the narrator, while
  // parts are open), one headline, three tiles, ONE button to the next thing and the guide one quiet
  // tap away — the can-dos, the open parts and the table of contents live there.
  const gold = finalStatus === 'gold';
  const openSteps = steps.filter((s) => !finished.has(s.id) && s.kind !== 'ueberarbeiten');
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
      footer={(
        <>
          <GameButton to={nextTarget.to}>{nextTarget.label}</GameButton>
          {onGuide && <QuietButton onClick={onGuide}>{t('flow.overview')}</QuietButton>}
        </>
      )}
    >
      <section className="flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center text-center" aria-labelledby={`${unitId}-recap-title`}>
        {complete ? <Trophy /> : <CastAvatar name={narrator} size={140} className="motion-safe:animate-pop-in" />}
        {gold && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 border-game-xp-edge bg-game-xp px-3 py-1 text-[0.875rem] font-extrabold text-game-text" aria-label="Siegel">
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> Siegel
          </span>
        )}
        <h1 id={`${unitId}-recap-title`} className={`mt-3 ${complete ? 'text-game-xp-ink' : 'text-game-text'} text-[1.875rem] font-extrabold leading-tight`}>
          {complete ? t('player.complete') : t('player.almost')}
        </h1>
        {!complete && openSteps.length > 0 && (
          <p className="mt-2 text-[1.0625rem] font-bold text-game-muted">
            {openSteps.length === 1 ? t('flow.openLeftOne') : t('flow.openLeft', { n: openSteps.length })}
          </p>
        )}
        {sessionRuns.size > 0 && (
          // the Check's share right only when the Check ran in this visit — never an empty „–" tile
          <div className={`mt-7 grid w-full max-w-md gap-2.5 ${pct !== null ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <StatTile tone="xp" label={t('cel.xp')} value={`+${sessionXp + unitBonus}`} />
            {pct !== null && <StatTile tone="course" label={t('cel.right')} value={`${pct} %`} />}
            <StatTile tone="time" label={t('cel.time')} value={clock(recapSeconds || 0)} />
          </div>
        )}
        {accuracy !== null && accuracy < 0.6 && (
          // a weak Check suggests repeating a Lernschritt, folded (a repeat serves a fresh draw, see `attempts`); never a gate
          <RepeatFold id={`${unitId}-repeat`} label={t('flow.repeat')} tip={t('player.repeatTip')}>
            <StepList unit={unit} steps={steps} finished={finished} currentIndex={-1} onOpen={goTo} />
          </RepeatFold>
        )}
      </section>
    </Shell>
  );
}

/** The recap's one fold: „Einen Lernschritt wiederholen" → the tip and the step list (a weak Check only). */
function RepeatFold({ id, label, tip, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 w-full max-w-md text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="mx-auto flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[0.9375rem] font-extrabold text-course-ink hover:bg-course-wash"
      >
        {label}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className="mt-2 space-y-3">
          <p className="text-[1rem] font-semibold text-game-muted">{tip}</p>
          {children}
        </div>
      )}
    </div>
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
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const asked = Number(params.get('s'));
  const initialStep = Number.isInteger(asked) && asked >= 1 ? asked : null;
  // ?view=guide: the Kapitel overview instead of the flow's screen (the home's book button links here)
  const view = params.get('view') === 'guide' ? 'guide' : null;
  const level = normalizeLevel(levelParam);
  const nr = Number(nrParam);
  const { user, loading: authLoading } = useAuth();
  const [, t] = useV2Strings();
  const valid = Boolean(level) && Number.isInteger(nr) && nr >= 1 && nr <= 12;
  const data = useUnitData(valid ? level : null, valid ? nr : null);
  // The guide is a URL, so the browser's back button and the X agree: the welcome-back and the recap
  // PUSH it; an action inside it (a part, „Weiter", „Kapitel starten") REPLACES it with the flow's URL;
  // its X goes back where the learner came from, or to the course home when the guide opened cold.
  const openGuide = useCallback(() => {
    setParams((prev) => { const next = new URLSearchParams(prev); next.set('view', 'guide'); return next; });
  }, [setParams]);
  const leaveGuide = useCallback(() => {
    setParams((prev) => { const next = new URLSearchParams(prev); next.delete('view'); return next; }, { replace: true });
  }, [setParams]);
  const closeGuide = useCallback(() => {
    const to = guideCloseTarget(location.key, v2Paths.home(level));
    if (to === -1) navigate(-1);
    else navigate(to, { replace: true });
  }, [location.key, navigate, level]);

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
  return (
    <UnitPlayer
      key={data.unit.id}
      level={level}
      unit={data.unit}
      manifest={data.manifest}
      user={user}
      initialStep={initialStep}
      view={view}
      onGuide={openGuide}
      onLeaveGuide={leaveGuide}
      onCloseGuide={closeGuide}
    />
  );
}
