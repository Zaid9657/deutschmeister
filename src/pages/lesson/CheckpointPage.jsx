import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumFor, curriculumPath } from '../../data/curricula/index.js';
import {
  buildCheckpoint,
  scoreCheckpoint,
  remediationSet,
  remediationScope,
  chapterLektionen,
  SECTION_LABELS,
  SECTION_ORDER,
  PASS_OVERALL_PCT,
  PASS_SECTION_PCT,
  sectionPasses,
  assessedParts,
  WRITING_PASS_PCT,
  paperSeed,
} from '../../lib/checkpoint/buildCheckpoint.js';
import { checkpointFeedback, defersFeedback, sectionComplete } from '../../lib/checkpoint/feedback.js';
import GradedWriting from '../../components/lesson/GradedWriting.jsx';
import ReadAloudLine from '../../components/lesson/ReadAloudLine.jsx';
import PlayButton from '../../components/lesson/PlayButton.jsx';
import {
  fetchAttemptState,
  fetchCheckpointStatus,
  recordAttempt,
  guestPassKept,
  ATTEMPT_LIMIT,
  ATTEMPT_WINDOW_HOURS,
} from '../../services/checkpointService.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import LangToggle from '../../components/lesson/LangToggle.jsx';
import { inline } from '../../components/lesson/NoticeStage.jsx';
import LandeskundeCard from '../../components/course/LandeskundeCard.jsx';
import { LANDESKUNDE } from '../../data/curricula/a11.meta.js';
import { hintText } from '../../lib/lesson/hints.js';
import { lessonDateFormat, t, useLessonLang } from '../../lib/lesson/strings.js';
import { localDoneIds } from '../../lib/course/localProgress.js';
import {
  checkpointRunFits,
  clearCheckpointRun,
  dropFinishedPaper,
  keepFinishedPaper,
  packCheckpointRun,
  packFinishedPaper,
  paperFingerprint,
  readCheckpointRun,
  readFinishedPapers,
  saveCheckpointRun,
} from '../../lib/lesson/runState.js';

// The checkpoint screen (standard §3): 20 items, one per screen, a thin
// progress bar, then a result that says what to do next. Design rules it
// follows: one primary action per screen, feedback as text + icon + colour
// (never colour alone), no hearts and no XP, legible at 360 px, and nothing
// that moves on its own — the only motion is the Button's own press.
//
// The item renderer below is deliberately small. The lesson engine's
// PracticeItem can replace it wholesale once it lands; the contract between
// them is the item shape from buildCheckpoint.js, nothing else.
//
// Chrome labels come from src/lib/lesson/strings.js in the chrome language
// (English by default, Deutsch-Modus on the header toggle). The SECTION names
// (Hören, Lesen, …) stay German in both: they are the parts of the exam.

// A signed-out pass the browser refused to store (saveState 'localFailed'). The shared table's
// 'sync.localFailed' names the Lektion, so this one is kept here in its shape (IntroStage's pattern),
// `de` in Sie, ready to move into STRINGS verbatim.
const LOCAL_SAVE_FAILED = {
  en: 'This browser could not save your result. Keep this page open and try saving again.',
  de: 'Ihr Browser konnte Ihr Ergebnis nicht speichern. Lassen Sie diese Seite offen und versuchen Sie das Speichern erneut.',
};

/** When the next attempt opens: the date and the time — „ab 07:16 Uhr" alone reads like today. */
const blockedLine = (attempts, lang) => t('checkpoint.blocked', lang, {
  time: attempts.nextAllowedAt
    ? lessonDateFormat(lang, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(attempts.nextAllowedAt)
    : '',
});

const POOL_LOADERS = {
  'a1.1': () => import('../../data/lessonPools/a11.json'),
  'a1.2': () => import('../../data/lessonPools/a12.json'),
};

/**
 * Is the stored run snapshot this saved paper's own — its stamped copy, or the run it was finished from
 * (same paper and round, saved before it finished)? A newer run (a retake in another tab) is not.
 */
function runOfJob(run, job) {
  if (!run || !job || !job.finished) return false;
  if (run.stamp) return run.stamp === job.stamp;
  return run.paper === job.finished.paper && run.round === job.finished.round && run.savedAt <= Date.parse(job.stamp);
}

/**
 * The scored items of a finished paper that waits for its save, as its round rebuilds them today —
 * or null when the paper has changed since (a new pool after a deploy: its fingerprint differs).
 */
function finishedPaperItems({ curriculum, checkpoint, pool }, entry) {
  const paper = buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, entry.round) });
  return paperFingerprint(paper) === entry.paper ? paper.filter((item) => !entry.notHeard.includes(item.id)) : null;
}

/**
 * One item, one screen. Typed input, option chips, dictation or self-confirm.
 * Audio plays through PlayButton (checked: "playing" only once sound started, a failure said in
 * words), the recorded line when the manifest has one, the browser voice when not — items carry
 * lektionId + lineKey from buildCheckpoint for exactly this. A learner who cannot hear it may read
 * it instead, and that item then leaves the score (`onReadInstead`): reading is not listening, and
 * missing audio is not the learner's failure (Codex score review, 2026-10-08).
 *
 * A PRACTICE CARD (no `onAnswer`: the ten tasks under a failed result) stands among nine others. It
 * never takes the focus by itself — ten cards each did, and a failed checkpoint opened on its last
 * card, with the result off screen — and it shows no Continue, which had nowhere to go (2026-11-25).
 */
export function PracticeItem({ item, onAnswer = null, onReadInstead = () => {}, graded = false }) {
  const [lang] = useLessonLang();
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  // A read-aloud or graded-writing result: the machine's verdict, or the
  // learner's own confirm when the machine was unavailable.
  const [pending, setPending] = useState(null);
  const [shownText, setShownText] = useState(false);
  const inputRef = useRef(null);
  // The verdict takes focus once an answer is checked: a screen reader reads it, and a held Enter
  // cannot skip past it the way a focused Next button could (Codex score review, 2026-10-08).
  const verdictRef = useRef(null);
  useEffect(() => {
    if (feedback) verdictRef.current?.focus();
  }, [feedback]);

  useEffect(() => {
    setValue('');
    setFeedback(null);
    setPending(null);
    setShownText(false);
    if (item.mode === 'typed' && onAnswer) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new item, never a new callback, moves the focus
  }, [item.id, item.mode]);

  // An empty typed answer is not an answer (the lesson's PracticeItem canSubmit rule): Enter, the
  // keyboard's Go key or Check on an empty field used to lock the item as a graded wrong answer.
  const canSubmit = String(value || '').trim().length > 0;
  const submit = (answer) => {
    if (feedback || (item.mode === 'typed' && !String(answer ?? '').trim())) return;
    setFeedback(checkpointFeedback(item, answer, { graded }));
  };

  const advance = () => onAnswer(item, feedback?.answer ?? value);
  const released = feedback && typeof feedback.correct === 'boolean';

  const header = (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Chip tone="label">{SECTION_LABELS[item.section] || t('checkpoint.practiceChip', lang)}</Chip>
      {item.register && <Chip tone="quiet">{t(item.register === 'formular' ? 'checkpoint.formular' : 'checkpoint.mitteilung', lang)}</Chip>}
      {item.hint && <span className="font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">{hintText(item.hint, lang)}</span>}
    </div>
  );

  // Sprechen: the line is recorded and scored word by word (ReadAloudLine →
  // score-readaloud). A mic result enters the score; a self-confirm keeps the
  // whole Sprechen section out of it (buildCheckpoint's header says why).
  if (item.kind === 'readAloud') {
    return (
      <Card className="p-5 sm:p-6">
        {header}
        <p className="font-display text-lg leading-snug text-ink" lang="de">{item.promptDe}</p>
        {lang !== 'de' && item.promptEn && <p className="mt-1 text-sm text-graphite">{item.promptEn}</p>}
        <div className="mt-4">
          <ReadAloudLine
            lektionId={item.lektionId}
            lineKey={item.lineKey}
            text={item.text || item.audioText}
            onResult={setPending}
          />
        </div>
        <p className="mt-3 text-xs text-graphite">
          {/* Deutsch-Modus: „Bewertet — Verständlichkeit zählt in Ihr Sprechen-Ergebnis." — the
              Sie-register line tests/checkpoint.test.mjs §6 pins; it lives in the string table now. */}
          {t(pending?.usedMic ? 'checkpoint.readAloudScored' : 'checkpoint.readAloudUnscored', lang)}
        </p>
        <Button
          className="mt-4"
          disabled={!pending}
          onClick={() => onAnswer(item, pending?.usedMic ? { usedMic: true, pct: pending.pct } : true)}
        >
          {t('action.next', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Card>
    );
  }

  // Schreiben: one of the three items is the chapter's real writing task, graded
  // on the course practice rubric by evaluate-writing through GradedWriting — the same
  // component and the same request the lesson's Schreiben step makes.
  if (item.kind === 'gradedWriting') {
    // Only a real grader verdict is an answer. GradedWriting falls back to its
    // mechanical form check when the learner is signed out, over the allowance
    // or offline (`scored: false`); that is reported as "not attempted" and the
    // Schreiben section scores over its two drills instead (buildCheckpoint's
    // itemCounts). The task is shown either way.
    const verdict = pending && pending.scored === true && typeof pending.pct === 'number'
      ? { graded: true, pct: pending.pct }
      : null;
    return (
      <Card className="p-5 sm:p-6">
        {header}
        <p className="font-display text-lg leading-snug text-ink" lang="de">{item.promptDe}</p>
        {lang !== 'de' && item.task?.taskEn && <p className="mt-1 text-sm text-graphite">{item.task.taskEn}</p>}
        <div className="mt-4">
          <GradedWriting task={item.task} lektionId={item.lektionId} onResult={setPending} />
        </div>
        <p className="mt-3 text-xs text-graphite">
          {verdict
            ? t('checkpoint.writingScored', lang, { pct: Math.round(WRITING_PASS_PCT * 100) })
            : t('checkpoint.writingUnscored', lang)}
        </p>
        <Button className="mt-4" disabled={!pending} onClick={() => onAnswer(item, verdict)}>
          {t('action.next', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Card>
    );
  }

  const isAudio = Boolean(item.audioText);

  return (
    <Card className="p-5 sm:p-6">
      {header}

      <p className="font-display text-lg leading-snug text-ink" lang="de">{item.promptDe}</p>
      {lang !== 'de' && item.promptEn && <p className="mt-1 text-sm text-graphite">{item.promptEn}</p>}

      {isAudio && (
        <div className="mt-4">
          <PlayButton lektionId={item.lektionId} audioKey={item.lineKey} text={item.audioText} rate={0.9} onFallback={feedback ? undefined : () => { setShownText(true); onReadInstead(item.id); }} />
          {shownText && (
            <>
              <Card tone="sunk" className="mt-3 p-4 text-[0.9375rem] leading-relaxed text-ink" lang="de">{item.audioText}</Card>
              <p className="mt-2 text-xs text-graphite">{t('checkpoint.readInstead', lang)}</p>
            </>
          )}
        </div>
      )}

      {item.text && (
        <Card tone="sunk" className="mt-4 whitespace-pre-line p-4 text-[0.9375rem] leading-relaxed text-ink" lang="de">{item.text}</Card>
      )}

      {item.mode === 'options' && (
        <div className="mt-5 flex flex-wrap gap-2">
          {(item.options || []).map((option) => {
            const chosen = feedback?.answer === option;
            const isAnswer = option === feedback?.key;
            let tone = 'quiet';
            if (released && isAnswer) tone = 'limette';
            else if (released && chosen) tone = 'himbeer';
            return (
              <Chip
                key={option}
                size="md"
                tone={tone}
                raised={!feedback}
                onClick={feedback ? undefined : () => submit(option)}
              >
                {released && isAnswer && <Check className="h-4 w-4" aria-hidden="true" />}
                {released && chosen && !isAnswer && <X className="h-4 w-4" aria-hidden="true" />}
                {option}
              </Chip>
            );
          })}
        </div>
      )}

      {item.mode === 'typed' && (
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            submit(value);
          }}
        >
          <label className="sr-only" htmlFor={`answer-${item.id}`}>{t('practice.yourAnswer', lang)}</label>
          <input
            id={`answer-${item.id}`}
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={Boolean(feedback)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full rounded-clay border border-rule bg-white px-4 py-3 font-body text-base text-ink placeholder:text-graphite/60 disabled:bg-paper-sunk"
            placeholder={t(['sentence_building', 'error_correction'].includes(item.type) ? 'practice.wholeSentence' : 'checkpoint.typedPlaceholder', lang)}
          />
          {!feedback && <Button type="submit" disabled={!canSubmit} className="sm:w-auto">{t('action.check', lang)}</Button>}
        </form>
      )}

      {item.mode === 'confirm' && !feedback && (
        <div className="mt-5">
          <Button onClick={() => submit(true)}>
            <Check className="h-4 w-4" aria-hidden="true" /> {t('speaking.said', lang)}
          </Button>
          <p className="mt-2 text-xs text-graphite">{t('checkpoint.notGraded', lang)}</p>
        </div>
      )}

      {feedback && (
        <div className="mt-5 border-t border-rule pt-4">
          <p ref={verdictRef} tabIndex={-1} className={`flex items-center gap-2 text-sm font-bold outline-none ${!released ? 'text-ink' : feedback.correct ? 'text-accent-limette-ink' : 'text-accent-himbeer-ink'}`}>
            {released && (feedback.correct ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />)}
            {t(!released ? 'checkpoint.answerRecorded' : item.mode === 'confirm' ? 'checkpoint.doneLabel' : feedback.correct ? 'feedback.correct' : 'checkpoint.wrong', lang)}
          </p>
          {released && !feedback.correct && item.mode !== 'confirm' && (
            <p className="mt-1 text-sm text-ink">{t('feedback.correctIs', lang)} <strong className="font-bold" lang="de">{feedback.key}</strong></p>
          )}
          {(feedback.explanationEn || feedback.explanationDe) && <p className="mt-1 text-sm text-graphite">{inline(lang !== 'de' && feedback.explanationEn ? feedback.explanationEn : feedback.explanationDe)}</p>}
          {onAnswer && (
            <Button className="mt-4" onClick={advance}>
              {t('action.next', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

/** A per-section result row: label, text score, number — and a bar behind it when the part was scored. */
function SectionRow({ name, section }) {
  const [lang] = useLessonLang();
  // The rule scoreCheckpoint passes a section on — never a row that looks fine while the checkpoint
  // fails on that part (a same-option guess, or a graded text that failed).
  const ok = !section.scored || sectionPasses(section);
  const why = section.pct < PASS_SECTION_PCT
    ? t('checkpoint.sectionBelow', lang, { pct: PASS_SECTION_PCT })
    : section.realTask === false
      ? t('checkpoint.sectionRealTask', lang)
      // What to do again is said only where it is true: reading again for Lesen, listening again for Hören.
      : t({ lesen: 'checkpoint.sectionGuess.lesen', hoeren: 'checkpoint.sectionGuess.hoeren' }[name] || 'checkpoint.sectionGuess', lang);
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-ink">{SECTION_LABELS[name] || name}</span>
        <span className="font-data text-sm text-graphite">
          {section.correct}/{section.total}
          {section.scored ? ` · ${section.pct} %` : t('checkpoint.notScored', lang)}
        </span>
      </div>
      {section.scored && (
        <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-paper-sunk" role="img" aria-label={t('checkpoint.sectionAria', lang, { name: SECTION_LABELS[name] || name, pct: section.pct })}>
          <div className={`h-full ${ok ? 'bg-siegel' : 'bg-accent-himbeer'}`} style={{ width: `${section.pct}%` }} />
        </div>
      )}
      {section.scored && !ok && <p className="mt-1 text-xs text-accent-himbeer-ink">{why}</p>}
    </li>
  );
}

/**
 * The owner boundary of a checkpoint paper (2026-10-25): the paper in progress — and the snapshot it
 * saves — belongs to ONE owner. A sign-out in another tab leaves a free level's page mounted, and the
 * paper used to be saved again under the guest key the moment the owner changed, where a guest reload
 * or the next account could resume the previous learner's answers. So the paper mounts only once auth
 * has settled, keyed by its owner (as LessonPlayer keys a lesson run): a new owner is a new mount, at
 * the intro, with that owner's own snapshot — nothing of the old paper is written under the new key.
 */
export default function CheckpointPage() {
  const { user, loading } = useAuth();
  const [lang] = useLessonLang();
  if (loading) {
    return (
      <div className="min-h-screen bg-paper font-body text-graphite">
        <p className="mx-auto max-w-2xl px-4 py-16 text-sm italic">{t('checkpoint.loadingItems', lang)}</p>
      </div>
    );
  }
  return <CheckpointRun key={user?.id || 'guest'} />;
}

function CheckpointRun() {
  const { level, nr } = useParams();
  const { user } = useAuth();
  // Fixed for this mount: CheckpointPage remounts the paper when the owner changes.
  const owner = user ? user.id : null;
  const [lang] = useLessonLang();
  const curriculum = curriculumFor(level);
  const checkpoint = useMemo(
    () => (curriculum?.checkpoints || []).find((c) => String(c.nr) === String(nr)) || null,
    [curriculum, nr],
  );

  const [pool, setPool] = useState(null);
  // A pool that did not load is the app's ErrorBoundary's to handle (a stale chunk reloads once,
  // anything else offers a refresh): it used to leave the intro on "Loading the tasks …" for ever.
  const [poolError, setPoolError] = useState(null);
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attempts, setAttempts] = useState(null);
  // The practice set of a failed paper: null until it is drawn (after the result has painted).
  const [remediation, setRemediation] = useState(null);
  // Where the finished paper is saved: null (signed out, not passed) | 'local' (a signed-out pass in this
  // browser's storage until sign-in) | 'localFailed' (one the browser refused: in this tab's memory only,
  // so it offers a retry) | 'saving' | 'saved' | 'failed'.
  const [saveState, setSaveState] = useState(null);
  // Passed before? Said on the intro of a reopened checkpoint: the account's row, or this browser's store.
  const [passedBefore, setPassedBefore] = useState(() => !user && Boolean(checkpoint) && localDoneIds(level).has(checkpoint.id));
  // Items read instead of heard (audio failed): they leave the score — see PracticeItem.
  const [notHeard, setNotHeard] = useState(() => new Set());
  const saveRef = useRef(null);
  // The paper on screen still waits for its save (finished, or brought back by a reload).
  const unsaved = useRef(false);

  useEffect(() => {
    if (!curriculum) return undefined;
    const load = POOL_LOADERS[String(level || '').toLowerCase()];
    if (!load) {
      setPoolError(new Error(`[checkpoint] no pool for level ${level}`));
      return undefined;
    }
    let cancelled = false;
    load()
      .then((mod) => { if (!cancelled) setPool(mod.default || mod); })
      .catch((err) => { console.error('[checkpoint] pool load failed:', err); if (!cancelled) setPoolError(err); });
    return () => { cancelled = true; };
  }, [level, curriculum]);

  useEffect(() => {
    if (!checkpoint) return;
    let cancelled = false;
    fetchAttemptState(user?.id, checkpoint.id).then((state) => { if (!cancelled) setAttempts(state); });
    return () => { cancelled = true; };
  }, [user, checkpoint]);

  useEffect(() => {
    if (!checkpoint || !user) return undefined;
    let cancelled = false;
    fetchCheckpointStatus(user.id, checkpoint.id).then((row) => { if (!cancelled) setPassedBefore(row?.status === 'complete'); });
    return () => { cancelled = true; };
  }, [user, checkpoint]);

  const items = useMemo(() => {
    if (!curriculum || !checkpoint || !pool) return [];
    // Every attempt is a NEW paper drawn under the same rules (Codex review, 2026-10-07): "Nochmal"
    // used to reshuffle the same 20 items right after the result had shown them, which measured
    // memory of the answers. `round` is the lifetime paper count, separate from the attempt limit,
    // +1 per retake — so a reload after a failed attempt does not serve that paper again either.
    return buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) });
  }, [curriculum, checkpoint, pool, round]);

  // RESUME (2026-10-25): a paper in progress comes back after a reload, a tab the phone discarded, the
  // idle sign-out or a guard remount (runState.js, checkpoint runs) — this owner's snapshot, once the
  // paper can be rebuilt (pool). A snapshot is checked against the lifetime paper count, so with
  // one stored the decision also waits for that count: a snapshot from before a finished attempt, or
  // of a paper that has changed, starts at the intro. Until the decision is made (`restoreDone`) Start
  // stays disabled and nothing is saved — a fast Start used to save a fresh paper at index 0 over the
  // run that was about to be restored.
  const [restoreDone, setRestoreDone] = useState(false);
  useEffect(() => {
    if (restoreDone || !curriculum || !checkpoint || !pool) return;
    // Without a paper in progress, a paper FINISHED but not yet saved to this account (offline, a
    // failed write) comes back as its result — the newest whose paper still rebuilds — and the flush
    // below sends it again, so a reload no longer costs the answers and the pass.
    const show = (entry, scored) => {
      // Counted on this device when it was finished (save() counts only a paper it could keep).
      saveRef.current = { args: { level, checkpointId: checkpoint.id, items: scored, answers: entry.answers, result: entry.result }, stamp: entry.stamp, finished: entry, counted: true };
      unsaved.current = true;
      setRound(entry.round);
      setAnswers(entry.answers);
      setNotHeard(new Set(entry.notHeard));
      setPhase('result');
    };
    const showFinished = () => {
      const waiting = owner ? readFinishedPapers(level, checkpoint.id, Date.now(), owner) : [];
      for (let k = waiting.length - 1; k >= 0; k -= 1) {
        const scored = finishedPaperItems({ curriculum, checkpoint, pool }, waiting[k]);
        if (scored) return show(waiting[k], scored);
      }
      return undefined;
    };
    const run = readCheckpointRun(level, checkpoint.id, Date.now(), owner);
    if (!run) {
      showFinished();
      setRestoreDone(true);
      return;
    }
    // A finished paper whose own copy the browser refused (save() kept its run snapshot, stamped,
    // instead): its result comes back under that stamp, so sending it again is never a second attempt.
    if (owner && run.stamp) {
      const entry = { stamp: run.stamp, paper: run.paper, round: run.round, answers: run.answers, notHeard: run.notHeard };
      const scored = finishedPaperItems({ curriculum, checkpoint, pool }, entry);
      if (scored) {
        const scoredResult = scoreCheckpoint(scored, run.answers);
        show(packFinishedPaper({ ...entry, result: scoredResult }, run.savedAt), scored);
      } else {
        clearCheckpointRun(level, checkpoint.id, owner);
        showFinished();
      }
      setRestoreDone(true);
      return;
    }
    if (!attempts) return;
    const paper = buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, run.round) });
    if (checkpointRunFits(run, paper, attempts.paperRound ?? attempts.used)) {
      setRound(run.round);
      setAnswers(run.answers);
      setNotHeard(new Set(run.notHeard));
      setIndex(run.index);
      setPhase(run.phase);
    } else {
      clearCheckpointRun(level, checkpoint.id, owner);
      showFinished();
    }
    setRestoreDone(true);
  }, [restoreDone, curriculum, checkpoint, pool, attempts, level, owner]);

  // Saved on every answer while a paper is open (with the fingerprint of the paper it belongs to);
  // a guest's result clears it. Never before the restore decision. Signed in, save() clears it, and
  // only once the finished paper is stored on this device in its place.
  const paper = useMemo(() => paperFingerprint(items), [items]);
  useEffect(() => {
    if (!restoreDone || !checkpoint || !items.length) return;
    if (phase === 'run' || phase === 'sectionFeedback') {
      saveCheckpointRun(level, checkpoint.id, packCheckpointRun({ paper, round, index, answers, notHeard: [...notHeard], phase }), owner);
    } else if (phase === 'result' && !owner) {
      clearCheckpointRun(level, checkpoint.id, owner);
    }
  }, [restoreDone, phase, paper, items.length, round, index, answers, notHeard, level, checkpoint, owner]);

  const scoredItems = useMemo(() => items.filter((i) => !notHeard.has(i.id)), [items, notHeard]);
  const result = useMemo(() => (scoredItems.length ? scoreCheckpoint(scoredItems, answers) : null), [scoredItems, answers]);
  // What this result covers — said on the card, so a pass without graded production is not read as more.
  const scope = useMemo(() => (result ? assessedParts(items, result) : null), [items, result]);

  // One stamped attempt per finished paper, so „Try again" after a failed save finds what already
  // landed instead of counting a second attempt (Codex score review, 2026-10-08). The attempt count
  // is read AFTER the attempt is written — reading it in parallel showed the count from before it.
  // LOCAL FIRST (2026-10-25): signed in, the finished paper is kept on this device BEFORE any network
  // write and dropped only once every write landed (runState.js, finished papers) — a reload or a dead
  // connection used to lose the answers and the pass. One send per paper at a time, and a paper no
  // longer on screen (a retake began) changes nothing here.
  const sending = useRef(new Set());
  const save = useCallback(() => {
    const job = saveRef.current;
    if (!job || sending.current.has(job.stamp)) return;
    sending.current.add(job.stamp);
    // Only this paper's own snapshot is ever cleared here — never a newer run another tab started.
    const clearOwnRun = () => {
      if (runOfJob(readCheckpointRun(level, checkpoint.id, Date.now(), owner), job)) clearCheckpointRun(level, checkpoint.id, owner);
    };
    // The paper's run snapshot goes only once the finished paper reads back from storage. A refused
    // write (a full or blocked store) keeps the snapshot, with the final answers, so a reload resumes
    // the paper instead of losing it, and the card offers a retry ('localFailed').
    const kept = owner ? keepFinishedPaper(level, checkpoint.id, job.finished, owner) : true;
    let durable = kept;
    if (owner && kept) clearOwnRun();
    else if (owner) {
      const { paper: print, round: paperRound, answers: final, notHeard: unheard } = job.finished;
      const last = job.args.items.length + unheard.length - 1;
      saveCheckpointRun(level, checkpoint.id, packCheckpointRun({ paper: print, round: paperRound, index: last, answers: final, notHeard: unheard, phase: 'run', stamp: job.stamp }), owner);
      durable = readCheckpointRun(level, checkpoint.id, Date.now(), owner)?.stamp === job.stamp;
    }
    // The attempt is counted on this device once, and only when the paper itself is on the device
    // too: with neither copy stored, a counted attempt would outlive the paper it counts.
    const count = durable && !job.counted;
    if (count) job.counted = true;
    if (user) setSaveState('saving');
    recordAttempt(user?.id, { ...saveRef.current.args, stamp: saveRef.current.stamp, retry: !count })
      .catch(() => false)
      .then((ok) => {
        sending.current.delete(job.stamp);
        if (owner && ok) {
          dropFinishedPaper(level, checkpoint.id, job.stamp, owner);
          clearOwnRun();
        }
        if (saveRef.current !== job) return null;
        unsaved.current = !ok;
        if (user) setSaveState(ok ? 'saved' : kept ? 'failed' : 'localFailed');
        // Signed out, a pass is kept on this device and merged at sign-in (checkpointService): said so
        // only when this paper's pass reached the browser's storage. A refused write (a full or blocked
        // store) is held in memory, which a reload loses, so it is a failed save with a retry.
        else if (job.args.result?.passed) setSaveState(guestPassKept(level, checkpoint.id, job.stamp) ? 'local' : 'localFailed');
        return fetchAttemptState(user?.id, checkpoint.id);
      })
      .then((state) => { if (state) setAttempts(state); });
  }, [user, owner, checkpoint, level]);

  // Sent again on arrival and whenever the connection returns: every finished paper of this account
  // still waiting — the one on screen through save(), so its status line follows; the others quietly,
  // each rebuilt from its round (a paper that changed since still writes its summary row and completion).
  useEffect(() => {
    if (!restoreDone || !owner || !pool) return undefined;
    const flush = () => {
      // The paper on screen, also when only its snapshot could be kept.
      if (unsaved.current) save(true);
      for (const entry of readFinishedPapers(level, checkpoint.id, Date.now(), owner)) {
        if (entry.stamp === saveRef.current?.stamp || sending.current.has(entry.stamp)) continue;
        sending.current.add(entry.stamp);
        const scored = finishedPaperItems({ curriculum, checkpoint, pool }, entry) || [];
        recordAttempt(owner, { level, checkpointId: checkpoint.id, items: scored, answers: entry.answers, result: entry.result, stamp: entry.stamp, retry: true })
          .catch(() => false)
          .then((ok) => {
            sending.current.delete(entry.stamp);
            if (ok) dropFinishedPaper(level, checkpoint.id, entry.stamp, owner);
          });
      }
    };
    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [restoreDone, owner, pool, curriculum, checkpoint, level, save]);

  const finish = useCallback(
    (finalAnswers) => {
      const scored = scoreCheckpoint(scoredItems, finalAnswers);
      const stamp = new Date().toISOString();
      setPhase('result');
      saveRef.current = {
        args: { level, checkpointId: checkpoint.id, items: scoredItems, answers: finalAnswers, result: scored, round },
        stamp,
        // What a reload needs to show this result again and send it (runState.js, finished papers).
        finished: packFinishedPaper({ stamp, paper, round, answers: finalAnswers, notHeard: [...notHeard], result: scored }),
      };
      unsaved.current = true;
      save();
    },
    [scoredItems, level, checkpoint, save, paper, round, notHeard],
  );

  const onAnswer = (item, answer) => {
    const next = { ...answers, [item.id]: answer };
    setAnswers(next);
    if (defersFeedback(item.section) && sectionComplete(items, next, item.section)) setPhase('sectionFeedback');
    else if (index + 1 >= items.length) finish(next);
    else setIndex(index + 1);
  };

  // The result comes first: the page opens at its top with the focus on its heading, for the eye and for
  // a screen reader. A failed checkpoint used to open at its practice cards (browser walk, 2026-11-25).
  const resultRef = useRef(null);
  const resultShown = phase === 'result' && Boolean(result);
  useEffect(() => {
    if (!resultShown) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    resultRef.current?.focus({ preventScroll: true });
  }, [resultShown]);

  // Drawn after the result has painted: leaving out what the retake will ask means building the next
  // papers, and that must not hold the result back on a phone. The bound is the one the paper itself was
  // drawn under (see servableBy): a practice task must not be the first place the learner meets a word.
  const failedResult = resultShown && !result.passed;
  useEffect(() => {
    if (!failedResult || !pool) return undefined;
    const draw = () => setRemediation(remediationSet(scoredItems, answers, pool, { afterLektion: checkpoint.afterLektion, retake: { curriculum, checkpoint, round } }));
    const timer = window.setTimeout(draw, 50);
    return () => window.clearTimeout(timer);
  }, [failedResult, pool, scoredItems, answers, curriculum, checkpoint, round]);

  if (!curriculum || !checkpoint) return <Navigate to={`/course/${level || ''}`} replace />;
  if (poolError) throw poolError;

  const path = curriculumPath(curriculum);
  const cpIndex = path.findIndex((entry) => entry.id === checkpoint.id);
  // What comes after it on the path: the next Lektion, or the final test after the last checkpoint.
  const nextLektion = path.slice(cpIndex + 1).find((entry) => entry.kind === 'lektion');
  const finalTest = nextLektion ? null : path.slice(cpIndex + 1).find((entry) => entry.kind === 'leveltest');
  const nextHref = nextLektion
    ? `/course/${curriculum.level}/l/${nextLektion.nr}`
    : finalTest ? `/modelltest/${finalTest.testSlug}` : `/course/${curriculum.level}`;
  const nextLabel = nextLektion
    ? t('checkpoint.nextLesson', lang, { nr: nextLektion.nr })
    : t(finalTest ? 'checkpoint.finalTest' : 'action.backToCourse', lang);
  const chapter = chapterLektionen(curriculum, checkpoint);
  const practice = remediation?.length && result ? remediationScope(remediation, result) : null;
  // Practice on what was missed comes before the retake; grammar that was not missed does not.
  const practiceLeads = practice?.kind !== 'chapter' && (remediation === null || Boolean(practice));
  const retake = () => {
    saveRef.current = null;
    setRound(Math.max(round + 1, attempts?.paperRound ?? attempts?.used ?? 0));
    setAnswers({});
    setNotHeard(new Set());
    setIndex(0);
    setRemediation(null);
    setSaveState(null);
    setPhase('run');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const sectionsCovered = SECTION_ORDER.map((s) => SECTION_LABELS[s]).join(' · ');
  const current = items[index];
  const pct = items.length ? Math.round((index / items.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper font-body text-ink" lang={lang}>
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 sm:pb-12 sm:pt-10">
        {(phase === 'run' || phase === 'sectionFeedback') && <h1 className="sr-only">{checkpoint.title}</h1>}
        <div className="mb-6 flex items-center gap-3">
          <Link to={`/course/${curriculum.level}`} className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {curriculum.code}
          </Link>
          {phase === 'run' && (
            <>
              <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-siegel-wash" role="progressbar" aria-label={t('checkpoint.progress', lang)} aria-valuetext={t('checkpoint.progressValue', lang, { n: index + 1, total: items.length })} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-siegel" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-data text-xs text-graphite">{index + 1}/{items.length}</span>
            </>
          )}
          <LangToggle className="ml-auto" />
        </div>

        {phase === 'intro' && (
          <Card className="p-6 sm:p-8">
            <Chip tone="label">{t('checkpoint.label', lang, { nr: checkpoint.nr })}</Chip>
            <h1 className="mt-3 font-display text-2xl text-ink sm:text-3xl">{checkpoint.title}</h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">
              {/* Deutsch-Modus: „ein adaptierter Kurstest, keine Prüfungssimulation". */}
              {t('checkpoint.intro', lang, { sections: sectionsCovered })}
            </p>
            <p className="mt-3 text-[0.9375rem] font-bold text-ink">
              {t('checkpoint.passRule', lang, { overall: PASS_OVERALL_PCT, section: PASS_SECTION_PCT })}
            </p>
            <p className="mt-2 text-sm text-graphite">
              {attempts
                ? attempts.blocked
                  ? blockedLine(attempts, lang)
                  : t('checkpoint.remaining', lang, { remaining: attempts.remaining, limit: ATTEMPT_LIMIT, hours: ATTEMPT_WINDOW_HOURS })
                : t('checkpoint.limit', lang, { limit: ATTEMPT_LIMIT, hours: ATTEMPT_WINDOW_HOURS })}
            </p>
            {passedBefore && (
              <p className="mt-4 flex items-start gap-2 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-limette-ink" aria-hidden="true" />
                <span>
                  {t('checkpoint.alreadyPassed', lang)}{' '}
                  <Link to={nextHref} className="font-bold text-siegel-deep underline underline-offset-2 hover:text-ink">{nextLabel}</Link>
                </span>
              </p>
            )}
            <div className="mt-6">
              <Button disabled={!items.length || !restoreDone || !attempts || Boolean(attempts.blocked)} onClick={() => { setRound(attempts?.paperRound ?? attempts?.used ?? 0); setPhase('run'); setIndex(0); setAnswers({}); setNotHeard(new Set()); }}>
                {t('checkpoint.start', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              {(!items.length || !restoreDone) && <p className="mt-2 text-sm text-graphite">{t('checkpoint.loadingItems', lang)}</p>}
            </div>
          </Card>
        )}

        {phase === 'run' && current && <PracticeItem key={current.id} item={current} graded onAnswer={onAnswer} onReadInstead={(id) => setNotHeard((prev) => new Set(prev).add(id))} />}

        {phase === 'sectionFeedback' && current && sectionComplete(items, answers, current.section) && (
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl text-ink" tabIndex={-1} ref={(node) => node?.focus()}>{t(current.section === 'hoeren' ? 'checkpoint.listeningFeedback' : 'checkpoint.readingFeedback', lang)}</h2>
            <ol className="mt-4 divide-y divide-rule">
              {items.filter((item) => item.section === current.section).map((item) => {
                const feedback = checkpointFeedback(item, answers[item.id], { graded: true, complete: sectionComplete(items, answers, item.section) });
                return (
                  <li key={item.id} className="py-4">
                    <p className="font-bold" lang="de">{item.promptDe}</p>
                    {item.text && <p className="mt-2 whitespace-pre-line rounded-clay bg-paper-sunk p-3 text-sm leading-relaxed text-ink" lang="de">{item.text}</p>}
                    <p className="mt-1 text-sm">{t('practice.yourAnswer', lang)}: <span lang="de">{feedback.answer}</span></p>
                    <p className={`mt-1 flex items-center gap-2 text-sm font-bold ${feedback.correct ? 'text-accent-limette-ink' : 'text-accent-himbeer-ink'}`}>
                      {feedback.correct ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
                      {t(feedback.correct ? 'feedback.correct' : 'checkpoint.wrong', lang)}
                    </p>
                    <p className="mt-1 text-sm">{t('feedback.correctIs', lang)} <strong lang="de">{feedback.key}</strong></p>
                    {(feedback.explanationEn || feedback.explanationDe) && <p className="mt-1 text-sm text-graphite">{inline(lang !== 'de' && feedback.explanationEn ? feedback.explanationEn : feedback.explanationDe)}</p>}
                  </li>
                );
              })}
            </ol>
            <Button className="mt-4" onClick={() => { if (index + 1 >= items.length) finish(answers); else { setIndex(index + 1); setPhase('run'); } }}>
              {t('action.next', lang)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Card>
        )}

        {phase === 'result' && result && (
          <>
            <Card raised edge={result.passed ? 'limette' : 'himbeer'} className="p-6 sm:p-8">
              <h1 ref={resultRef} tabIndex={-1} className="flex items-center gap-2 font-display text-2xl text-ink outline-none">
                {result.passed ? <Check className="h-6 w-6 text-accent-limette-ink" aria-hidden="true" /> : <X className="h-6 w-6 text-accent-himbeer-ink" aria-hidden="true" />}
                {t(result.passed ? 'checkpoint.passed' : 'checkpoint.notPassed', lang)}
              </h1>
              <p className="mt-2 font-data text-4xl text-ink">{result.overall} %</p>
              <p className="text-sm text-graphite">{t('checkpoint.correctOf', lang, { correct: result.correct, total: result.total })}</p>
              <ul className="mt-5 divide-y divide-rule">
                {SECTION_ORDER.filter((s) => result.sections[s]).map((s) => (
                  <SectionRow key={s} name={s} section={result.sections[s]} />
                ))}
              </ul>
              {scope && (
                <div className="mt-4 space-y-1 text-sm text-graphite">
                  <p>{t('checkpoint.assessed', lang, { list: scope.assessed.map((s) => SECTION_LABELS[s]).join(' · ') })}</p>
                  {scope.partial.length > 0 && (
                    <p>{t('checkpoint.partlyAssessed', lang, { list: scope.partial.map((p) => `${SECTION_LABELS[p.section]} ${p.measured}/${p.of}`).join(' · ') })}</p>
                  )}
                  {scope.notAssessed.length > 0 && (
                    <p>{t('checkpoint.notAssessed', lang, { list: scope.notAssessed.map((s) => SECTION_LABELS[s]).join(' · ') })}</p>
                  )}
                  {scope.writing === 'drills' && <p>{t('checkpoint.drillsOnly', lang)}</p>}
                </div>
              )}
              {Object.keys(result.errorTags).length > 0 && (
                <div className="mt-5">
                  <p className="font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">{t('checkpoint.whyTitle', lang)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(result.errorTags)
                      .sort((a, b) => b[1] - a[1])
                      .map(([tag, count]) => (
                        <Chip key={tag} tone="quiet">{t(`errorTag.${tag}`, lang)} · {count}</Chip>
                      ))}
                  </div>
                </div>
              )}
              <p className="mt-4 text-sm text-graphite" role="status">
                {saveState === 'failed' || saveState === 'localFailed' ? (
                  <>
                    {saveState === 'failed' ? t('checkpoint.saveFailed', lang) : LOCAL_SAVE_FAILED[lang] || LOCAL_SAVE_FAILED.en}{' '}
                    <button type="button" className="font-bold text-siegel-deep underline underline-offset-2" onClick={() => save(true)}>
                      {t('sync.retry', lang)}
                    </button>
                  </>
                ) : saveState ? t({ saved: 'sync.synced', local: 'sync.local' }[saveState] || 'sync.syncing', lang) : null}
              </p>
              {!result.passed && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 text-sm text-graphite">
                  <p>{t('checkpoint.repeatLessons', lang)}</p>
                  {chapter.map((l) => (
                    <Link key={l.id} to={`/course/${curriculum.level}/l/${l.nr}`} className="inline-flex min-h-11 items-center font-bold text-siegel-deep underline underline-offset-2 hover:text-ink">
                      {t('review.lesson', lang, { nr: l.nr })}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {result.passed ? (
                  <Button to={nextHref}>
                    {nextLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <>
                    {(remediation === null || practice) && (
                      <Button {...(practice ? { href: '#checkpoint-practice' } : { disabled: true })} variant={practiceLeads ? 'primary' : 'secondary'}>
                        {t(practiceLeads ? 'checkpoint.practiceFirst' : 'checkpoint.practiceMore', lang)}
                      </Button>
                    )}
                    <Button variant={practiceLeads ? 'secondary' : 'primary'} disabled={Boolean(attempts?.blocked)} onClick={retake}>
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t('action.again', lang)}
                    </Button>
                  </>
                )}
                <Button variant="secondary" to={`/course/${curriculum.level}`}>{t('action.toCoursePlan', lang)}</Button>
              </div>
              {!result.passed && attempts?.blocked && <p className="mt-3 text-sm text-graphite">{blockedLine(attempts, lang)}</p>}
            </Card>

            {curriculum.level === 'a1.1' && LANDESKUNDE[checkpoint.nr] && (
              <div className="mt-6 space-y-4">
                {LANDESKUNDE[checkpoint.nr].map((note) => <LandeskundeCard key={note.titleDe} note={note} />)}
              </div>
            )}

            {!result.passed && practice && (
              <section id="checkpoint-practice" className="mt-8 scroll-mt-4">
                <h2 className="font-display text-xl text-ink">{t(practiceLeads ? 'checkpoint.practiceFirst' : 'checkpoint.practiceMore', lang)}</h2>
                <p className="mt-1 text-sm text-graphite">
                  {t(`checkpoint.practiceLead.${practice.kind}`, lang, { n: remediation.length, k: practice.targeted })}
                  {practice.missing.length > 0 && ` ${t('checkpoint.practiceLead.missing', lang, { list: practice.missing.map((s) => SECTION_LABELS[s]).join(' · ') })}`}
                </p>
                <div className="mt-4 space-y-4">
                  {remediation.map((item) => (
                    <PracticeItem key={item.id} item={item} />
                  ))}
                </div>
                <Button className="mt-6" disabled={Boolean(attempts?.blocked)} onClick={retake}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t('action.again', lang)}
                </Button>
                {attempts?.blocked && <p className="mt-3 text-sm text-graphite">{blockedLine(attempts, lang)}</p>}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
