import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumFor, curriculumPath } from '../../data/curricula/index.js';
import buildLesson, { attemptFromCompletions } from '../../lib/lesson/buildLesson.js';
import { prevStageIndex, requeueFor } from '../../lib/lesson/requeue.js';
import { practiceScore, masteryStatus } from '../../lib/lesson/mastery.js';
import { skillLines } from '../../lib/lesson/skillStatus.js';
import { countCompletedRuns, fetchWordsByIds, getLessonProgress, startLesson } from '../../services/lessonService.js';
import { courseHome } from '../../lib/courseFlow.js';
import { hasLocalProgress, localRunCount, mergeLocalProgress, recordLocalLesson } from '../../lib/course/localProgress.js';
import { buildCardIndex, fetchDueCards } from '../../services/reviewService.js';
import { enqueueRun, flushOutbox, outboxIsDurable, pendingRuns } from '../../lib/course/syncOutbox.js';
import { clearRun, packRun, readRun, resumeStageIndex, saveRun } from '../../lib/lesson/runState.js';
import LessonProgressBar from '../../components/lesson/LessonProgressBar.jsx';
import ComboChip, { nextCombo } from '../../components/lesson/ComboChip.jsx';
import LangToggle from '../../components/lesson/LangToggle.jsx';
import { readLessonLang, t, useLessonLang } from '../../lib/lesson/strings.js';
import StageShell from '../../components/lesson/StageShell.jsx';
import DialogStage from '../../components/lesson/DialogStage.jsx';
import WortfeldStage from '../../components/lesson/WortfeldStage.jsx';
import NoticeStage from '../../components/lesson/NoticeStage.jsx';
import PhonetikStage from '../../components/lesson/PhonetikStage.jsx';
import ReviewCard, { modeForCard } from '../../components/lesson/ReviewCard.jsx';
import { gradeCard } from '../../services/reviewService.js';
import { gradeTypedReview } from '../../lib/checkpoint/reviewGrading.js';
import { speakGerman } from '../../lib/lesson/speech.js';
import PretestStage from '../../components/lesson/PretestStage.jsx';
import PracticeItem from '../../components/lesson/PracticeItem.jsx';
import DictationItem from '../../components/lesson/DictationItem.jsx';
import MatchItem from '../../components/lesson/MatchItem.jsx';
import WordOrderItem from '../../components/lesson/WordOrderItem.jsx';
import ListenSelectItem from '../../components/lesson/ListenSelectItem.jsx';
import SpeakingStage from '../../components/lesson/SpeakingStage.jsx';
import WritingStage from '../../components/lesson/WritingStage.jsx';
import RecapStage from '../../components/lesson/RecapStage.jsx';
import IntroStage from '../../components/lesson/IntroStage.jsx';
import { trackLessonCompleted, trackLessonResumed, trackLessonStageViewed, trackLessonStarted, trackLessonSyncFailed } from '../../lib/funnelTracking.js';
import SaveProgressAsk from '../../components/course/SaveProgressAsk.jsx';
import { isAskSettled, saveAskDue } from '../../lib/course/saveProgressAsk.js';
import { clearReturnPath } from '../../lib/returnPath.js';

// The lesson player: route /course/:level/l/:nr, one stage per screen
// (docs/course-standard-2026-09-12.md §3). Everything it shows comes from the
// curriculum module and the exercise pool — this file sequences, it does not
// author. Persistence is best-effort and never blocks a stage.
//
// P4 closed the leak in "first lesson before sign-up": a signed-out learner
// used to play the whole lesson and have NOTHING written, so the work was gone
// the moment they signed up. Now the recap writes it to localStorage
// (src/lib/course/localProgress.js), the recap shows the save-progress card,
// and the first render WITH a user merges the local rows into lesson_progress
// / program_progress / lesson_attempts and clears the store. The merge runs
// here rather than in an auth callback because this and the course home are
// the only two screens where local course progress can exist.
//
// RESUME. The run (stage, item, answers) is saved to localStorage on every
// change and restored on mount (src/lib/lesson/runState.js), so a page
// load — or a return within 7 days — resumes the run instead of restarting the Lektion. The
// Sprechen stage's hand-off to the speaking coach is such a page load, and the
// coach's "Zurück zur Lektion" bar used to land the learner back on the intro.
// A resumed run rebuilds the identical stage list from the snapshot's
// `attempt` and warm-up cards, skips the intro, and the recap clears it.
//
// CHROME LANGUAGE. Every label this page and its stages show comes from
// src/lib/lesson/strings.js in the learner's chrome language — English by
// default, German in Deutsch-Modus (the LangToggle in the header row). The
// content (dialogue, questions, answers) is German in both.

/** The multi-item stages the player pages through one item at a time. */
const ITEM_STAGES = new Set(['practice', 'derived', 'dictation', 'requeue', 'warmup']);

export function LessonPlayer({ curriculum, lektion, pool, preview = false }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [lang] = useLessonLang();
  // The run this tab was in the middle of, if any (read once, on mount).
  // The route waits for auth (LevelSubscriptionGuard), so `user` is settled here: the snapshot read is the owner's own.
  const owner = user ? user.id : null;
  const [resumed] = useState(() => (preview ? null : readRun(curriculum.level, lektion.id, Date.now(), owner)));
  // The DRAW attempt, derived from how often this learner has already finished
  // this Lektion — never a constant. It was `useState(1)` with no setter, which
  // meant the repeat that the standard makes the remediation path handed back
  // the identical seven for ever (DaF review #9 MAJOR 1). Signed in the count
  // comes from the attempt batches, signed out from the local store; either way
  // it is derived from what is already written, not from a new column.
  const [attempt, setAttempt] = useState(() => (resumed ? resumed.attempt : 1));
  const [stageIndex, setStageIndex] = useState(() => (resumed
    ? resumeStageIndex(buildLesson({ curriculum, lektion, pool, dueCards: resumed.dueCards, attempt: resumed.attempt }).stages, resumed)
    : 0));
  const [itemIndex, setItemIndex] = useState(() => (resumed ? resumed.itemIndex : 0));
  const [attempts, setAttempts] = useState(() => (resumed ? resumed.attempts : []));
  const [misses, setMisses] = useState(() => (resumed ? resumed.misses : []));
  // Consecutive first-try corrects across practice + dictation items, reset on
  // a miss (ComboChip.jsx's nextCombo, unit-tested there). Player-level state
  // because the combo spans stage boundaries within one run, not one item.
  const [combo, setCombo] = useState(() => (resumed ? resumed.combo : 0));
  const [requeued, setRequeued] = useState(() => (resumed ? resumed.requeued : []));
  // What the speaking and writing stages reported (skillStatus.js) — the recap
  // states each skill on its own line instead of letting Gold imply it.
  const [skills, setSkills] = useState(() => (resumed ? resumed.skills || {} : {}));
  const reportSkill = (skill) => (summary) => setSkills((prev) => ({ ...prev, [skill]: summary }));
  const [wordRows, setWordRows] = useState(() => new Map());
  const [saved, setSaved] = useState(false);
  // What the recap tells the learner about saving: 'local' (signed out) · 'syncing' · 'synced' · 'failed'.
  const [sync, setSync] = useState(null);
  // One id per run, kept across a resume: joins its start, stages and completion in analytics.
  const [runId] = useState(() => (resumed && resumed.runId) || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);
  // Warm-up (stage 0) card state: the same four faces ReviewPage.jsx renders
  // (flashcard/listening/typed/say-it), graded through the SAME helpers
  // (gradeCard / gradeTypedReview) so a card met here and on the Wiederholen
  // screen is judged the same way. The write to review_cards is fire-and-forget
  // (never blocks the lesson) — a failed ladder write costs a schedule, not the
  // lesson run.
  const [warmupRevealed, setWarmupRevealed] = useState(false);
  const [warmupTyped, setWarmupTyped] = useState('');
  const [warmupVerdict, setWarmupVerdict] = useState(null);
  // The intro screen (IntroStage) is player state, not a stage: shown once per
  // run, before stage 0; preview mode and a resumed run skip it. Start fires
  // lesson_started.
  const [introDone, setIntroDone] = useState(preview || !!resumed);
  // null = not loaded yet. A resumed run keeps the cards it was built with, so
  // a late fetch cannot insert or drop the warm-up and shift every stage.
  const [dueCards, setDueCards] = useState(() => (resumed ? resumed.dueCards : null));

  // Stage 0 warm-up: up to four cards due from the review ladder.
  useEffect(() => {
    if (resumed) return undefined;
    if (preview || !user) { setDueCards([]); return undefined; }
    let cancelled = false;
    const index = buildCardIndex(curriculum);
    fetchDueCards(user.id, curriculum.level, 4)
      .then((rows) => {
        if (cancelled) return;
        // Rows carry keys only; the card's face comes from the curriculum.
        setDueCards((rows || []).map((r) => ({ cardKey: r.card_key, ...(index.get(r.card_key) || {}) })).filter((c) => c.front));
      })
      .catch(() => { if (!cancelled) setDueCards([]); });
    return () => { cancelled = true; };
  }, [preview, user, curriculum, resumed]);

  useEffect(() => {
    if (preview) return undefined;
    if (!user) {
      if (!resumed) setAttempt(attemptFromCompletions(localRunCount(curriculum.level, lektion.id)));
      return undefined;
    }
    let cancelled = false;
    // Merge first, THEN count: a guest who finished this Lektion three times
    // has those three runs in localStorage, and the count is only right once
    // they are batches in lesson_attempts. Reading the count before the merge
    // (two effects racing, as it used to be) is what handed the learner the
    // seven items they had just done — review #10 MAJOR 4.
    (hasLocalProgress(curriculum.level) ? mergeLocalProgress(user.id) : Promise.resolve(0))
      .then(() => getLessonProgress(user.id, curriculum.level))
      .then((rows) => {
        const row = rows.get(lektion.id);
        return countCompletedRuns(user.id, {
          level: curriculum.level,
          lektionId: lektion.id,
          completed: !!(row && row.completed_at),
        });
      })
      // A resumed run keeps the draw it was answering; nothing was finished
      // since it was saved, so the count could only disagree in an edge case,
      // and a changed draw under a restored item index would be a blank screen.
      .then((runs) => { if (!cancelled && !resumed) setAttempt(attemptFromCompletions(runs)); })
      .catch(() => { /* fail-soft: attempt 1 */ });
    return () => { cancelled = true; };
  }, [preview, user, curriculum.level, lektion.id, resumed]);

  const lesson = useMemo(
    () => buildLesson({ curriculum, lektion, pool, dueCards: dueCards || [], attempt }),
    [curriculum, lektion, pool, attempt, dueCards],
  );
  const stages = lesson.stages;
  const stage = stages[stageIndex] || null;
  const warmupCard = stage && stage.kind === 'warmup' ? (stage.cards || [])[itemIndex] || null : null;
  const warmupMode = warmupCard ? modeForCard(warmupCard.kind, itemIndex) : null;
  const playWarmupCard = useCallback((content) => {
    speakGerman((content && (content.speak || content.front)) || '');
  }, []);

  useEffect(() => {
    if (!warmupCard) return;
    setWarmupRevealed(false);
    setWarmupTyped('');
    setWarmupVerdict(null);
    if (warmupMode === 'listening') playWarmupCard(warmupCard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warmupCard, warmupMode]);

  const checkWarmupTyped = useCallback(() => {
    if (!warmupCard) return;
    const { ok } = gradeTypedReview(warmupCard.cardKey, warmupCard.accepted, warmupTyped, { caseSensitive: warmupCard.caseSensitive });
    setWarmupVerdict(ok);
    setWarmupRevealed(true);
  }, [warmupCard, warmupTyped]);

  // The Wortfeld's real article/plural/audio, when the curriculum carries ids.
  useEffect(() => {
    const ids = (lektion.wortfeld || []).map((w) => w.wordId).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    fetchWordsByIds(ids).then((map) => { if (!cancelled) setWordRows(map); });
    return () => { cancelled = true; };
  }, [lektion]);

  useEffect(() => {
    if (preview || !user) return;
    startLesson(user.id, curriculum.level, lektion.id);
  }, [preview, user, curriculum.level, lektion.id]);

  useEffect(() => {
    if (resumed) trackLessonResumed(curriculum.level, lektion.id, runId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const path = useMemo(() => curriculumPath(curriculum), [curriculum]);

  /** Where the recap's primary ("Continue") goes: the next item on the course path. */
  const nextTarget = useMemo(() => {
    const i = path.findIndex((p) => p.kind === 'lektion' && p.nr === lektion.nr);
    const next = i >= 0 ? path[i + 1] : null;
    if (!next) return { to: courseHome(curriculum.level), label: t('action.backToCourse', lang) };
    if (next.kind === 'checkpoint') return { to: `/course/${curriculum.level}/checkpoint/${next.nr}`, label: `${next.title} →` };
    if (next.kind === 'leveltest') return { to: `/modelltest/${next.testSlug || curriculum.testSlug}`, label: t('player.finalTest', lang) };
    return { to: `/course/${curriculum.level}/l/${next.nr}`, label: t('player.nextLesson', lang, { nr: next.nr }) };
  }, [path, lektion.nr, curriculum.level, curriculum.testSlug, lang]);

  const score = practiceScore(attempts);
  const accuracy = score.accuracy;
  const status = masteryStatus(accuracy);

  // Every answer is logged with the stage the player was IN (not whatever the
  // item object says — derived items carry none) and whether it was the first
  // pass or a retry; mastery.js counts first-pass practice/derived/dictation
  // only. A second answer to the same (stage, item) — a reload that shows an
  // answered item again — is not logged twice.
  const recordResult = useCallback((item, { correct, errorTag, result, revealed, listened, confused }, kind) => {
    const stageKind = kind || item.stage || 'practice';
    setAttempts((prev) => (prev.some((a) => a.itemId === item.id && a.stage === stageKind)
      ? prev
      : [...prev, {
        itemId: item.id,
        stage: stageKind,
        pass: stageKind === 'requeue' ? 'retry' : 'first',
        correct,
        errorTag,
        result: typeof result === 'string' ? result : undefined,
        ...(revealed ? { revealed: true } : {}),
        ...(listened === false ? { listened: false } : {}),
      }]));
    if (!correct && stageKind !== 'requeue') {
      setMisses((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, confused && confused.length ? { ...item, confused } : item]));
    }
    if (stageKind === 'practice' || stageKind === 'dictation') setCombo((c) => nextCombo(c, correct));
  }, []);
  const resultFor = (kind) => (item, outcome) => recordResult(item, outcome, kind);

  // FOCUS ON EVERY NEW SCREEN (2026-10 review): a new item or stage moves keyboard and screen-reader
  // focus to its heading, so a learner hears where they are instead of staying on a button that no
  // longer exists. An item that focused its own answer field already (typed items do) keeps it.
  const bodyRef = useRef(null);
  useEffect(() => {
    const root = bodyRef.current;
    if (!root || !introDone) return;
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (active && root.contains(active) && /^(INPUT|TEXTAREA)$/.test(active.tagName)) return;
    const heading = root.querySelector('h1, h2');
    if (!heading) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus(); // scrolls it into view: after a long item the next one starts on screen
  }, [stageIndex, itemIndex, introDone]);

  const goStage = useCallback((next) => {
    setStageIndex(next);
    setItemIndex(0);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const advance = useCallback(() => {
    const target = stageIndex + 1;
    const nextStage = stages[target];
    // The requeue stage is skipped when nothing was missed.
    if (nextStage && nextStage.kind === 'requeue') {
      const used = attempts.map((a) => a.itemId);
      const items = requeueFor(misses, pool, used);
      setRequeued(items);
      if (!items.length) { goStage(target + 1); return; }
    }
    goStage(target);
  }, [stageIndex, stages, attempts, misses, pool, goStage]);

  // Back skips what advance() skips: an empty requeue stage is a blank screen.
  const backTo = prevStageIndex(stages, stageIndex, requeued.length);
  const back = backTo >= 0 ? () => goStage(backTo) : null;

  // Save the run on every stage or item change, so any full page load resumes
  // it (src/lib/lesson/runState.js). The recap ends the run and clears it, and
  // a run that has reached the recap is never saved again: "Back" from the
  // recap must not leave a snapshot whose resume would write the completion a
  // second time (one attempt batch is one finished run, lessonService.js).
  useEffect(() => {
    if (preview || !introDone || !stage) return;
    if (saved || stage.kind === 'recap') { clearRun(curriculum.level, lektion.id, owner); return; }
    saveRun(curriculum.level, lektion.id, packRun({
      runId, stageKey: stage.key, stageIndex, itemIndex, attempt, attempts, misses, requeued, combo, dueCards: dueCards || [], skills,
    }), owner);
  }, [preview, introDone, saved, stage, stageIndex, itemIndex, attempt, attempts, misses, requeued, combo, dueCards, skills, curriculum.level, lektion.id, runId, owner]);

  // Where learners stop: each stage once per run (a resumed run re-reports the stage it reopens on).
  const viewedStages = useRef(new Set());
  useEffect(() => {
    if (preview || !introDone || !stage || viewedStages.current.has(stage.key)) return;
    viewedStages.current.add(stage.key);
    trackLessonStageViewed(curriculum.level, lektion.id, runId, stage.key);
  }, [preview, introDone, stage, curriculum.level, lektion.id, runId]);

  // Persist once, when the recap comes into view. Signed out, the same write
  // goes to localStorage instead of Supabase — never nowhere. Signed in, the run
  // goes into the sync outbox FIRST and is then flushed (syncOutbox.js), so a
  // failed or interrupted write is kept, retried, and said out loud on the recap.
  // "Saved to your account" only once THIS run has left the outbox — never on another run's success.
  // A queue that storage refused lives in memory: then the learner is told to keep the page open,
  // not that the lesson is kept on this device (Codex review, 2026-10-07).
  const runEntryKey = useRef(null);
  const flush = useCallback(() => {
    if (!user) return;
    setSync('syncing');
    flushOutbox(user.id).then((r) => {
      const pending = pendingRuns(user.id).some((e) => e.key === runEntryKey.current);
      setSync(pending ? (outboxIsDurable() ? 'failed' : 'failedTemp') : 'synced');
      if (r.state === 'failed') for (const step of r.failed[0].steps) trackLessonSyncFailed(curriculum.level, lektion.id, step);
    });
  }, [user, curriculum.level, lektion.id]);

  useEffect(() => {
    if (preview || saved || !stage || stage.kind !== 'recap') return;
    setSaved(true);
    trackLessonCompleted(curriculum.level, lektion.id, runId);
    if (!user) {
      recordLocalLesson({ level: curriculum.level, lektionId: lektion.id, status, accuracy, attempts });
      setSync('local');
      return;
    }
    const entry = enqueueRun({ userId: user.id, level: curriculum.level, lektionId: lektion.id, createdAt: new Date().toISOString(), attempts, accuracy, status });
    runEntryKey.current = entry ? entry.key : null;
    flush();
  }, [preview, saved, stage, user, curriculum.level, lektion, attempts, accuracy, status, runId, flush]);

  // Back online after a failed save: send it again without asking.
  useEffect(() => {
    if ((sync !== 'failed' && sync !== 'failedTemp') || typeof window === 'undefined') return undefined;
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [sync, flush]);

  // THE SAVE-PROGRESS ASK (owner decision 2026-10-06; the rule is in
  // src/lib/course/saveProgressAsk.js). Signed out, the screen after this
  // run's first checked answer is the ask, once per Lektion; the recap keeps
  // its card. `firstAnswerAt` is where that answer was given, so the ask waits
  // until the learner has read its feedback and moved on.
  const [firstAnswerAt, setFirstAnswerAt] = useState(null);
  const [askSettled, setAskSettled] = useState(() => preview || isAskSettled(curriculum.level, lektion.id));
  useEffect(() => {
    if (firstAnswerAt || !attempts.length) return;
    setFirstAnswerAt({ stageIndex, itemIndex });
  }, [attempts.length, firstAnswerAt, stageIndex, itemIndex]);
  // Signed in, the learner is back where the ask's round trip was meant to
  // bring them: the remembered place has done its job.
  useEffect(() => {
    if (user && !preview) clearReturnPath();
  }, [user, preview]);

  if (!stage) return <Navigate to={courseHome(curriculum.level)} replace />;
  if (!introDone) {
    return <IntroStage curriculum={curriculum} lektion={lektion} onStart={() => { trackLessonStarted(curriculum.level, lektion.id, runId); setIntroDone(true); }} />;
  }

  const items = stage.kind === 'requeue' ? requeued : stage.kind === 'warmup' ? stage.cards || [] : stage.items || stage.lines || [];
  const onItemNext = () => {
    if (ITEM_STAGES.has(stage.kind) && itemIndex + 1 < items.length) setItemIndex(itemIndex + 1);
    else advance();
  };
  const gradeWarmupCard = (correct) => {
    if (user && warmupCard) gradeCard(user.id, warmupCard.cardKey, correct).catch(() => {});
    onItemNext();
  };

  const wortfeld = (lektion.wortfeld || []).map((w) => ({ ...w, db: w.wordId ? wordRows.get(w.wordId) : null }));

  let body = null;
  switch (stage.kind) {
    case 'warmup':
      body = warmupCard ? (
        <StageShell variant="input" eyebrow={t('stage.warmup.eyebrow', lang)} title={t('stage.warmup.title', lang)} onBack={back}>
          <ReviewCard
            content={warmupCard}
            mode={warmupMode}
            lang={lang}
            revealed={warmupRevealed}
            onReveal={() => setWarmupRevealed(true)}
            typed={warmupTyped}
            onTypedChange={setWarmupTyped}
            onCheckTyped={checkWarmupTyped}
            verdict={warmupVerdict}
            onPlay={() => playWarmupCard(warmupCard)}
            hasRecording={false}
            onGrade={gradeWarmupCard}
          />
        </StageShell>
      ) : null;
      break;
    case 'pretest':
      body = <PretestStage stage={stage} lektionId={lektion.id} onBack={back} onDone={advance} />;
      break;
    case 'dialog':
      body = <DialogStage stage={stage} lektionId={lektion.id} onBack={back} onDone={advance} />;
      break;
    case 'wortfeld':
      body = <WortfeldStage stage={{ ...stage, words: wortfeld }} onBack={back} onDone={advance} />;
      break;
    case 'notice':
      body = <NoticeStage stage={stage} onBack={back} onDone={advance} />;
      break;
    case 'phonetik':
      body = <PhonetikStage stage={stage} lektionId={lektion.id} onBack={back} onDone={advance} />;
      break;
    case 'practice':
    case 'requeue':
    case 'derived': {
      const item = items[itemIndex];
      if (!item) { body = null; break; }
      const retry = stage.kind === 'requeue';
      // A retry comes back as the same KIND of exercise it was (requeue.js):
      // a pool item as a practice card, a match/word order/listen item and a
      // dictation line as themselves.
      const derivedProps = {
        item,
        index: itemIndex,
        total: items.length,
        lektionId: lektion.id,
        onResult: resultFor(stage.kind),
        onNext: onItemNext,
        ...(retry ? { eyebrowKey: 'stage.requeue.eyebrow' } : {}),
      };
      if (item.type === 'match') body = <MatchItem key={item.id} {...derivedProps} />;
      else if (item.type === 'word_order') body = <WordOrderItem key={item.id} {...derivedProps} />;
      else if (item.type === 'listen_select') body = <ListenSelectItem key={item.id} {...derivedProps} />;
      else if (item.type === 'dictation') {
        body = <DictationItem key={item.id} {...derivedProps} line={{ index: item.lineIndex, de: item.answer }} />;
      } else if (stage.kind !== 'derived') {
        body = (
          <PracticeItem
            level={curriculum.level}
            lektionId={lektion.id}
            key={item.id}
            item={{ ...item, stage: stage.kind }}
            index={itemIndex}
            total={items.length}
            eyebrowKey={retry ? 'stage.requeue.eyebrow' : 'stage.practice.eyebrow'}
            allowReveal={retry}
            onResult={resultFor(stage.kind)}
            onNext={onItemNext}
          />
        );
      } else body = null;
      break;
    }
    case 'dictation': {
      const line = items[itemIndex];
      body = line ? (
        <DictationItem key={line.index} line={line} index={itemIndex} total={items.length} lektionId={lektion.id} onResult={resultFor('dictation')} onNext={onItemNext} />
      ) : null;
      break;
    }
    case 'speaking':
      body = <SpeakingStage stage={stage} level={curriculum.level} code={curriculum.code} lektion={lektion} onBack={back} onDone={advance} onReport={reportSkill('speaking')} />;
      break;
    case 'writing':
      body = <WritingStage stage={stage} lektionId={lektion.id} onResult={resultFor('writing')} onReport={reportSkill('writing')} onBack={back} onDone={advance} />;
      break;
    case 'recap':
      body = (
        <RecapStage
          stage={stage}
          level={curriculum.level}
          accuracy={accuracy}
          status={status}
          score={score}
          skills={skillLines({ score, attempts, skills })}
          sync={sync}
          onRetrySync={flush}
          nextLabel={nextTarget.label}
          onBack={back}
          onNext={() => navigate(nextTarget.to)}
        />
      );
      break;
    default:
      body = null;
  }
  // Signed out means the session has LOADED and there is none: getSession can
  // take up to 8 s (AuthContext), and LevelSubscriptionGuard renders a free
  // level while it loads, so `!user` alone would flash the ask at a member.
  if (saveAskDue({ signedOut: !authLoading && !user, preview, settled: askSettled, firstAnswerAt, at: { stageIndex, itemIndex }, stageKind: stage.kind })) {
    body = <SaveProgressAsk level={curriculum.level} lektion={lektion} onContinue={() => setAskSettled(true)} />;
  }

  const step = stageIndex + (ITEM_STAGES.has(stage.kind) ? itemIndex / Math.max(items.length, 1) : 0) + 1;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-6 sm:pb-10 sm:pt-10">
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            to={courseHome(curriculum.level)}
            className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> <span className="sr-only">{t('player.backToCourse', lang)}: </span>{curriculum.code}
          </Link>
          <LessonProgressBar
            step={step}
            total={stages.length}
            label={t('player.lesson', lang, { nr: lektion.nr })}
            stepLabel={t('player.stepOf', lang, { n: stageIndex + 1, total: stages.length })}
          />
          <ComboChip combo={combo} />
          <LangToggle />
        </div>
        <div ref={bodyRef}>{body}</div>
      </div>
    </div>
  );
}

/**
 * The exercise pool per level, one chunk each. Written out rather than built
 * from a template literal because a `${key}.json` import makes the bundler emit
 * EVERY json file of the directory — the hand-written `*.extra.json` sources
 * included, which are build inputs and not something a learner downloads. A
 * level without an entry here has no pool: the player says so instead of
 * rendering a lesson with no practice (src/data/curricula/index.js only
 * promotes a level once its pool exists).
 */
const POOL_LOADERS = {
  'a1.1': () => import('../../data/lessonPools/a11.json'),
  'a1.2': () => import('../../data/lessonPools/a12.json'),
};

export default function LessonPlayerPage() {
  const { level, nr } = useParams();
  const curriculum = curriculumFor(level);
  const [pool, setPool] = useState(null);
  const [poolFailed, setPoolFailed] = useState(false);
  const lektionNr = Number(nr);
  const lektion = curriculum ? (curriculum.lektionen || []).find((l) => l.nr === lektionNr) : null;

  useEffect(() => {
    if (!curriculum) return;
    let cancelled = false;
    const load = POOL_LOADERS[String(curriculum.level).toLowerCase()];
    if (!load) {
      console.error(`[lesson] no pool for level ${curriculum.level}`);
      setPoolFailed(true);
      return undefined;
    }
    load()
      .then((mod) => { if (!cancelled) setPool(mod.default || mod); })
      .catch((err) => { console.error('[lesson] pool load failed:', err); if (!cancelled) setPoolFailed(true); });
    return () => { cancelled = true; };
  }, [curriculum]);

  if (!curriculum) return <Navigate to="/courses/" replace />;
  if (!lektion) return <Navigate to={courseHome(curriculum.level)} replace />;
  if (!pool && !poolFailed) {
    return (
      <div className="min-h-screen bg-paper font-body text-graphite">
        <p className="mx-auto max-w-2xl px-4 py-16 text-sm italic">{t('player.loading', readLessonLang())}</p>
      </div>
    );
  }

  // Keyed by the Lektion: the recap's "Next lesson" is a client-side hop to the
  // same route, and without a key React kept the whole run (stage index, intro
  // done, answers, `saved`). Built-page walk, 2026-10-06: a hop from /l/1 on
  // its dialogue opened /l/2 on ITS dialogue, with no intro; from the recap the
  // same index is the next Lektion's recap. Every piece of player state, the
  // save-progress ask included, is per Lektion.
  return <LessonPlayer key={`${curriculum.level}:${lektion.id}`} curriculum={curriculum} lektion={lektion} pool={pool || []} />;
}
