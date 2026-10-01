import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import CourseTheme from '../../components/course-v2/CourseTheme.jsx';
import GameButton from '../../components/course-v2/GameButton.jsx';
import GameTopBar from '../../components/course-v2/GameTopBar.jsx';
import ItemRun from '../../components/course-v2/ItemRun.jsx';
import ExamBlockView from '../../components/course-v2/ExamBlockView.jsx';
import WritingTaskView from '../../components/course-v2/WritingTaskView.jsx';
import SpeakingTaskView from '../../components/course-v2/SpeakingTaskView.jsx';
import RewardView from '../../components/course-v2/RewardView.jsx';
import SignInPrompt from '../../components/course-v2/SignInPrompt.jsx';
import { laneLabel, teilLabel } from '../../components/course-v2/content.js';
import { useV2Strings } from '../../components/course-v2/strings.js';
import { levelCode, nrOfId, stepNrOf, v2Paths } from '../../lib/course-v2/ids.js';
import {
  ASSESSMENT_STAGE, assessmentKind, assessmentLines, assessmentProgress, assessmentSections, assessmentStatus,
  resumeSection, reviewRepairs, sectionResult, teilKarte, unitPractising,
} from '../../lib/course-v2/assessment.js';
import {
  fetchAssessmentState, flushAttempts, logCourseEvent, recordStepDone, saveUnitStatus, startUnit,
} from '../../lib/course-v2/progress.js';
import { localAnswers, localStepDone, localUnitState, localUnitStatus } from '../../lib/course-v2/localState.js';
import ActionBar from './ActionBar.jsx';

// The runner of a Plateau (/course/:level/p/:nr, BLUEPRINT §5.2, §7.3 S8) and of the closing
// block (/course/:level/abschluss, the .1 Halbtest → Teil-Karte, §5.3, S10).
//
// Sections (src/lib/course-v2/assessment.js): the compiled review set (ItemRun), each exam Teil
// (ExamBlockView, WritingTaskView, SpeakingTaskView), the productive task, the reward (RewardView)
// — then the results card (Plateau) or the Teil-Karte (closing). Everything runs in the Lernmodus
// the content sets (A1.1: modeDefault 'lern'); ExamBlockView has no Prüfungsmodus yet.
//
// Persistence is the unit's (progress.js / localState.js) under the Plateau's or closing block's
// own id: answered items as lesson_attempts rows, one marker per finished section, and
// lesson_progress 'complete' once every required section is finished — what completion.js counts
// toward the course. A writing/speaking Teil left without submitting stays open (no marker), as a
// unit's Aufgabe does. Nothing here reads a score to decide anything (PRG-01); results are shown as
// practice values per Teil, never as a total or a pass line.

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const EYEBROW = 'text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const H1 = 'text-[1.625rem] font-extrabold leading-tight text-game-text [hyphens:auto] sm:text-[2rem]';
const PANEL = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-5';
// the Teile an account unlocks: their assessment is the AI's, and only a submitted attempt counts
const AI_KINDS = ['writing', 'speaking'];

// The course theme's chrome (the unit player's): an X to the course home and the thick
// progress bar over the sections finished.
function Shell({ level, progress, children, footer }) {
  const [, t] = useV2Strings();
  return (
    <CourseTheme>
      <div className={`mx-auto max-w-2xl px-4 ${footer ? 'pb-32' : 'pb-10'}`}>
        <GameTopBar homeTo={v2Paths.home(level)} homeLabel={t('player.home')} progress={progress} progressLabel={t('as.progress')} />
        {children}
      </div>
      {footer && <ActionBar>{footer}</ActionBar>}
    </CourseTheme>
  );
}

/** A section's name, as its own screen shows it. Exam Teile keep their German exam names. */
function sectionTitle(s, t) {
  if (!s) return '';
  if (s.kind === 'review') return t('as.review');
  if (s.kind === 'reward') {
    const r = s.part || {};
    const names = [r.lesemagazin && 'Lesemagazin', r.hoermagazin && 'Hörmagazin', r.scene && t('as.rewardScene'), r.projekt && t('as.rewardProjekt')].filter(Boolean);
    return names.join(' · ');
  }
  if (s.role === 'productive') return s.kind === 'speaking' ? t('as.productiveSpeaking') : t('as.productiveWriting');
  return teilLabel(s.template);
}

/** The second line of a section in the list: its size, „freiwillig", „erledigt". */
function sectionNote(s, done, t) {
  const parts = [];
  if (s.kind === 'review' || s.kind === 'block') parts.push(t('as.itemsCount', { n: s.items.length }));
  if (s.role === 'productive') parts.push(teilLabel(s.template));
  if (!s.required) parts.push(t('as.optional'));
  if (done) parts.push(t('player.doneMark'));
  return parts.join(' · ');
}

/** { itemId: correct } of a list of attempt payloads (the latest wins). */
const answersOf = (list) => Object.fromEntries((list || []).filter((a) => a && a.itemId).map((a) => [a.itemId, !!a.correct]));

function SectionList({ sections, finished, onOpen, t }) {
  return (
    <ol className="space-y-2.5">
      {sections.map((s, i) => {
        const done = finished.has(s.id);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onOpen(i)}
              className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-game-line bg-white px-4 py-3 text-left transition-transform duration-100 ease-snap hover:bg-course-wash active:translate-y-0.5 active:border-b-2 motion-reduce:transition-none"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.9375rem] font-extrabold ${
                  done ? 'bg-game-right text-white' : 'bg-game-locked text-game-muted'
                }`}
                aria-hidden="true"
              >
                {done ? <Check className="h-5 w-5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[1rem] font-extrabold text-game-text" lang="de">{sectionTitle(s, t)}</span>
                <span className="block text-[0.8125rem] font-semibold text-game-muted">{sectionNote(s, done, t)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** The unit numbers the review set draws from, as „1" and „6" of „Lektionen 1 bis 6". */
function reviewSpan(doc) {
  const units = doc && doc.review && doc.review.units ? [...(doc.review.units.earlier || []), ...(doc.review.units.current || [])] : [];
  const nrs = units.map(nrOfId).filter(Boolean).sort((a, b) => a - b);
  return nrs.length ? { from: nrs[0], to: nrs[nrs.length - 1] } : null;
}

export default function AssessmentPlayer({ level, doc, manifest, user }) {
  const [, t] = useV2Strings();
  const kind = assessmentKind(doc);
  const stage = ASSESSMENT_STAGE[kind] || 'plateau';
  const docId = doc.id;
  const nr = kind === 'plateau' ? nrOfId(docId) : null;
  const sections = useMemo(() => assessmentSections(doc), [doc]);
  const lines = useMemo(() => assessmentLines(doc), [doc]);
  const span = useMemo(() => reviewSpan(doc), [doc]);

  const [learner, setLearner] = useState(null); // { row, finishedSteps, stepRuns, answers }
  const [finished, setFinished] = useState(() => new Set());
  const [answers, setAnswers] = useState(() => new Map());
  const [phase, setPhase] = useState('loading'); // loading | start | section | results
  const [index, setIndex] = useState(0);
  // progress inside the open section — every section's view reports it per task (the review's
  // ItemRun, an exam block, the reward's pieces), so the bar never stands still; reset on every section
  const [inner, setInner] = useState(0);
  const [sessionRuns, setSessionRuns] = useState(() => new Map());
  const pending = useRef(new Map()); // section id → attempts not yet written
  const savedStatus = useRef(null);

  // Learner state: Supabase when signed in, this browser otherwise.
  useEffect(() => {
    let cancelled = false;
    const apply = (st) => {
      if (cancelled) return;
      setLearner(st);
      setFinished(new Set(st.finishedSteps));
      setAnswers(new Map(st.answers || []));
      setPhase(resumeSection(sections, st.finishedSteps) >= sections.length ? 'results' : 'start');
    };
    if (user) {
      startUnit(user.id, level, docId);
      fetchAssessmentState(user.id, level, docId).then(apply);
    } else apply(localUnitState(docId));
    return () => { cancelled = true; };
  }, [user, level, docId, sections]);

  // Answered items of an unfinished section are written when the learner leaves.
  useEffect(() => {
    const map = pending.current;
    const flushAll = () => {
      for (const [sectionId, list] of map.entries()) {
        if (!list.length) continue;
        if (user) flushAttempts(user.id, { level, unitId: docId, stepKind: stage }, list);
        else localAnswers(docId, level, answersOf(list));
        map.set(sectionId, []);
      }
    };
    window.addEventListener('pagehide', flushAll);
    return () => {
      window.removeEventListener('pagehide', flushAll);
      flushAll();
    };
  }, [user, level, docId, stage]);

  const goTo = useCallback((i) => {
    setIndex(i);
    setInner(0);
    setPhase('section');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const nextAfter = useCallback((i, done) => {
    const j = sections.findIndex((s, k) => k > i && !done.has(s.id));
    if (j === -1) {
      setPhase('results');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
    } else goTo(j);
  }, [sections, goTo]);

  const onAttempt = useCallback((payload) => {
    if (!payload || !payload.itemId) return;
    const section = sections[index];
    if (!section) return;
    const list = pending.current.get(section.id) || [];
    list.push({ ...payload, stepId: section.id });
    pending.current.set(section.id, list);
    setAnswers((m) => new Map(m).set(payload.itemId, !!payload.correct));
  }, [sections, index]);

  const finishSection = useCallback((section, result) => {
    const list = pending.current.get(section.id) || [];
    pending.current.set(section.id, []);
    if (user) {
      recordStepDone(user.id, { level, unitId: docId, step: { id: section.id, kind: stage } }, list);
      if (section.kind === 'block' && result) {
        logCourseEvent(user.id, {
          name: 'teil_attempt', level, unitId: docId, stepId: section.id,
          props: { template: section.template, correct: result.correct, total: result.total, source: kind, mode: 'lern' },
        });
      }
    } else {
      localStepDone(docId, level, section.id);
      localAnswers(docId, level, answersOf(list));
    }
    setSessionRuns((m) => new Map(m).set(section.id, (m.get(section.id) || 0) + 1));
    const done = new Set(finished);
    done.add(section.id);
    setFinished(done);
    nextAfter(index, done);
  }, [user, level, docId, stage, kind, finished, index, nextAfter]);

  // A writing/speaking Teil counts once it was submitted as a real attempt (completion.js,
  // BLUEPRINT §3.5); left without submitting it stays open and the results card lists it.
  const onTaskDone = useCallback((section, r) => {
    if (r && r.submitted) { finishSection(section, null); return; }
    const list = pending.current.get(section.id) || [];
    pending.current.set(section.id, []);
    if (list.length) {
      if (user) flushAttempts(user.id, { level, unitId: docId, stepKind: stage }, list);
      else localAnswers(docId, level, answersOf(list));
    }
    nextAfter(index, finished);
  }, [finishSection, user, level, docId, stage, index, finished, nextAfter]);

  const storedStatus = learner && learner.row ? learner.row.status : null;
  const status = assessmentStatus(sections, finished, storedStatus);
  const progressInfo = assessmentProgress(sections, finished, storedStatus);

  // Submitted: written once when the results show a status that is not stored yet.
  useEffect(() => {
    if (phase !== 'results' || status !== 'complete') return;
    const known = savedStatus.current || storedStatus;
    if (known === 'complete' || known === 'gold') return;
    savedStatus.current = status;
    if (user) saveUnitStatus(user.id, { level, unitId: docId, status });
    else localUnitStatus(docId, level, status);
  }, [phase, status, storedStatus, user, level, docId]);

  const runsOf = (id) => (Number(learner && learner.stepRuns && learner.stepRuns.get(id)) || 0) + (sessionRuns.get(id) || 0) + 1;
  const doneCount = sections.filter((s) => finished.has(s.id)).length;
  const progress = sections.length ? doneCount / sections.length : 0;
  const chip = kind === 'plateau' ? t('as.plateau', { n: nr }) : t('as.closingChip');
  const heading = kind === 'plateau' ? t('as.plateau', { n: nr }) : t('as.halbtest');
  const nextLevel = doc.comesNext && doc.comesNext.level ? levelCode(doc.comesNext.level) : null;

  if (phase === 'loading') {
    return <Shell level={level} progress={0}><p className="py-16 text-center text-[1rem] font-semibold text-game-muted">{t('as.loading')}</p></Shell>;
  }

  if (phase === 'start') {
    const resumeAt = resumeSection(sections, finished);
    const resuming = doneCount > 0 && resumeAt < sections.length;
    const startLabel = resuming
      ? t('as.resumeAt', { n: resumeAt + 1, title: sectionTitle(sections[resumeAt], t) })
      : kind === 'plateau' ? t('as.start') : t('as.startClosing');
    return (
      <Shell
        level={level}
        progress={progress}
        footer={sections.length > 0 && <GameButton caps={!resuming} onClick={() => goTo(resuming ? resumeAt : 0)}>{startLabel}</GameButton>}
      >
        <div className="space-y-5">
          <header>
            <p className={EYEBROW}>{chip}</p>
            <h1 className={`mt-1 ${H1}`}>{heading}</h1>
            <p className="mt-2 text-[1.0625rem] font-semibold text-game-muted">
              {kind === 'plateau'
                ? t('as.plateauLead')
                : t('as.closingLead', { exam: laneLabel(doc.lane), next: nextLevel || levelCode(level) })}
            </p>
          </header>
          {/* signed out, the Teil it resumes at needs the AI: say so, with the door (audit ASSESS-03) */}
          {!user && resuming && AI_KINDS.includes(sections[resumeAt].kind) && <SignInPrompt withButton />}
          <div>
            <p className={`mb-2 ${LABEL}`}>{t('as.sections')}</p>
            <SectionList sections={sections} finished={finished} onOpen={goTo} t={t} />
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === 'section' && sections[index]) {
    const s = sections[index];
    const title = sectionTitle(s, t);
    let body = null;
    if (s.kind === 'review') {
      body = (
        <div>
          <p className="mb-4 text-[1rem] font-semibold text-game-muted">
            {span ? t('as.reviewLead', { n: s.items.length, from: span.from, to: span.to }) : t('exam.lernLead')}
          </p>
          <ItemRun
            key={`${s.id}-${runsOf(s.id)}`}
            items={s.items}
            unitId={docId}
            lines={lines}
            stepId={s.id}
            level={level}
            attempt={runsOf(s.id)}
            onAttempt={onAttempt}
            onProgress={setInner}
            onFinish={(r) => finishSection(s, r)}
          />
        </div>
      );
    } else if (s.kind === 'block') {
      body = (
        <ExamBlockView
          key={`${s.id}-${runsOf(s.id)}`}
          block={s.part}
          unitId={docId}
          stepId={s.id}
          level={level}
          texts={doc.texts}
          lines={lines}
          onAttempt={onAttempt}
          onProgress={setInner}
          onDone={(r) => finishSection(s, r)}
        />
      );
    } else if (s.kind === 'writing') {
      body = (
        <>
          {s.role === 'productive' && <p className="mb-4 text-[1rem] font-semibold text-game-muted">{t('as.productiveLead')}</p>}
          <WritingTaskView key={s.id} task={s.part} level={level} stepId={s.id} skeleton="A" mode="write" onAttempt={onAttempt} onDone={(r) => onTaskDone(s, r)} />
        </>
      );
    } else if (s.kind === 'speaking') {
      body = (
        <>
          {s.role === 'productive' && <p className="mb-4 text-[1rem] font-semibold text-game-muted">{t('as.productiveLead')}</p>}
          <SpeakingTaskView key={s.id} task={s.part} level={level} onDone={(r) => onTaskDone(s, r)} />
        </>
      );
    } else if (s.kind === 'reward') {
      body = <RewardView key={s.id} reward={s.part} unitId={docId} stepId={s.id} level={level} lines={lines} onAttempt={onAttempt} onProgress={setInner} onDone={() => finishSection(s, null)} />;
    }
    const sectionProgress = sections.length ? Math.min(1, (doneCount + (finished.has(s.id) ? 0 : inner)) / sections.length) : 0;
    return (
      <Shell level={level} progress={sectionProgress}>
        <section data-section-id={s.id} data-section-kind={s.kind}>
          <header className="mb-5">
            <p className="flex flex-wrap items-center gap-x-2 text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-course-ink">
              <span>{chip}</span>
              <span aria-hidden="true">·</span>
              <span>{t('as.sectionOf', { n: index + 1, t: sections.length })}</span>
            </p>
            <h1 className="mt-1 text-[1.125rem] font-extrabold leading-tight text-game-muted [hyphens:auto] sm:text-[1.25rem]" lang="de">{title}</h1>
          </header>
          {body}
        </section>
      </Shell>
    );
  }

  // Results: the Plateau's results card, or the closing block's Teil-Karte.
  const complete = progressInfo.complete;
  const openList = progressInfo.open.map((s) => ({ s, i: sections.indexOf(s) }));
  // Signed out, an open speaking/writing Teil cannot be submitted (it needs the AI): the list would
  // send the learner back into the same task, so the card says why and gives the door (ASSESS-03).
  const openNeedsAccount = !user && openList.some(({ s }) => AI_KINDS.includes(s.kind));
  const openCard = !complete && openList.length > 0 && (
    <div className="rounded-[1.25rem] border-2 border-b-4 border-accent-aprikose bg-accent-aprikose-wash p-4">
      <h2 className="text-[1rem] font-extrabold text-accent-aprikose-ink">{t('as.open')}</h2>
      <ul className="mt-2 space-y-1">
        {openList.map(({ s, i }) => (
          <li key={s.id}>
            <button type="button" onClick={() => goTo(i)} className="min-h-11 text-left text-[1rem] font-extrabold text-course-ink hover:underline">
              {t('as.openSection', { n: i + 1, title: sectionTitle(s, t) })}
            </button>
          </li>
        ))}
      </ul>
      {openNeedsAccount && <SignInPrompt withButton className="mt-3" />}
    </div>
  );

  if (kind === 'closing') {
    const rows = teilKarte(doc, sections, { answers, finished });
    return (
      <Shell level={level} progress={progress} footer={<GameButton to={v2Paths.home(level)}>{t('player.home')}</GameButton>}>
        <div className="space-y-5">
          <header className="text-center">
            <p className={EYEBROW}>{chip}</p>
            <h1 className={`mt-1 ${H1}`}>
              {complete ? t('as.closingDone') : t('as.almost')}
            </h1>
          </header>
          {openCard}
          <div className={PANEL}>
            <h2 className={LABEL}>{t('kk.title')}</h2>
            <p className="mt-2 text-[0.9375rem] font-semibold text-game-muted">{t('kk.lead', { exam: laneLabel(doc.lane), level: levelCode(level) })}</p>
            <ul className="mt-4 divide-y-2 divide-game-line">
              {rows.map((r) => (
                <li key={r.id} className="py-3">
                  <p className="text-[1rem] font-extrabold text-game-text" lang="de">{teilLabel(r.template)}</p>
                  <p className="mt-0.5 text-[0.9375rem] font-semibold text-game-text">
                    {r.practised
                      ? `${t(r.practised === 'full' ? 'kk.full' : 'kk.miniature')} · ${r.kind === 'block' ? t('exam.score', { c: r.correct, t: r.total }) : t('as.submitted')}`
                      : t('kk.open')}
                  </p>
                  {r.next && (
                    <p className="mt-0.5 text-[0.875rem] font-semibold text-game-muted">
                      {r.next.unit
                        ? `${t('kk.next', { level: levelCode(r.next.level), n: r.next.nr })}${r.next.title ? `: ${r.next.title}` : ''}`
                        : t('kk.nextLevel', { level: levelCode(r.next.level) })}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Shell>
    );
  }

  const results = sections.filter((s) => s.required).map((s) => ({ s, r: sectionResult(s, { answers, finished }) }));
  const reviewSection = sections.find((s) => s.kind === 'review') || null;
  const repairs = reviewRepairs(reviewSection, answers);
  const after = nrOfId(doc.after) || 0;
  const teilRepairs = results
    .filter(({ s, r }) => s.kind === 'block' && r.done && r.correct < r.total)
    .map(({ s, r }) => ({ s, r, unit: unitPractising(manifest, doc.lane, teilLabel(s.template), after) }));
  const units = (manifest && manifest.units) || [];
  const nextRow = units.find((row) => row && nrOfId(row.unit || row.id) === after + 1) || null;
  const nextTarget = nextRow && nextRow.chunk
    ? { to: v2Paths.unit(level, after + 1), label: t('player.toUnit', { n: after + 1 }) }
    : { to: v2Paths.home(level), label: t('player.home') };

  return (
    <Shell level={level} progress={progress} footer={<GameButton to={nextTarget.to}>{nextTarget.label}</GameButton>}>
      <div className="space-y-5">
        <header className="text-center">
          <p className={EYEBROW}>{chip}</p>
          <h1 className={`mt-1 ${H1}`}>
            {complete ? t('as.resultsDone', { n: nr }) : t('as.almost')}
          </h1>
        </header>
        {openCard}
        <div className={PANEL}>
          <p className="text-[0.9375rem] font-semibold text-game-muted">{t('as.resultsLead')}</p>
          <ul className="mt-3 divide-y-2 divide-game-line">
            {results.map(({ s, r }) => (
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2.5">
                <span className="text-[1rem] font-extrabold text-game-text" lang="de">{sectionTitle(s, t)}</span>
                <span className="text-[0.875rem] font-bold tabular-nums text-game-text">
                  {s.kind === 'writing' || s.kind === 'speaking'
                    ? (r.submitted ? t('as.submitted') : t('as.notSubmitted'))
                    : (r.done || r.answered ? t('exam.score', { c: r.correct, t: r.total }) : t('as.notDone'))}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {(repairs.length > 0 || teilRepairs.length > 0) ? (
          <div className={PANEL}>
            <h2 className={LABEL}>{t('as.repairTitle')}</h2>
            <ul className="mt-3 space-y-1.5">
              {repairs.map((x) => (
                <li key={x.step}>
                  <Link to={v2Paths.unit(level, nrOfId(x.unit))} className="inline-flex min-h-11 items-center text-[1rem] font-extrabold text-course-ink hover:underline">
                    {t('as.repairStep', { u: nrOfId(x.unit), s: stepNrOf(x.step), m: x.missed, t: x.total })}
                  </Link>
                </li>
              ))}
              {teilRepairs.map(({ s, r, unit }) => (
                <li key={s.id}>
                  {unit ? (
                    <Link to={v2Paths.unit(level, unit.nr)} className="inline-flex min-h-11 items-center text-[1rem] font-extrabold text-course-ink hover:underline">
                      {t('as.repairTeil', { teil: teilLabel(s.template), c: r.correct, t: r.total, u: unit.nr })}
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center text-[1rem] font-semibold text-game-text">{`${teilLabel(s.template)}: ${t('exam.score', { c: r.correct, t: r.total })}`}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : reviewSection && sectionResult(reviewSection, { answers, finished }).done && (
          <p className="text-[1rem] font-semibold text-game-muted">{t('as.allRight')}</p>
        )}
      </div>
    </Shell>
  );
}
