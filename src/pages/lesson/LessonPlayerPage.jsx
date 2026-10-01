import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumFor, curriculumPath } from '../../data/curricula/index.js';
import buildLesson, { attemptFromCompletions } from '../../lib/lesson/buildLesson.js';
import { prevStageIndex, requeueFor } from '../../lib/lesson/requeue.js';
import { firstAttemptAccuracy, masteryStatus } from '../../lib/lesson/mastery.js';
import { completeLesson, countCompletedRuns, fetchWordsByIds, getLessonProgress, logAttempts, startLesson } from '../../services/lessonService.js';
import { courseHome } from '../../lib/courseFlow.js';
import { hasLocalProgress, localRunCount, mergeLocalProgress, recordLocalLesson } from '../../lib/course/localProgress.js';
import { buildCardIndex, fetchDueCards, seedCardsForLektion } from '../../services/reviewService.js';
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
import { trackLessonCompleted, trackLessonStarted } from '../../lib/funnelTracking.js';

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
// RESUME. The run (stage, item, answers) is saved to sessionStorage on every
// change and restored on mount (src/lib/lesson/runState.js), so a full page
// load in the same tab resumes the run instead of restarting the Lektion. The
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
  const { user } = useAuth();
  const [lang] = useLessonLang();
  // The run this tab was in the middle of, if any (read once, on mount).
  const [resumed] = useState(() => (preview ? null : readRun(curriculum.level, lektion.id)));
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
  const [wordRows, setWordRows] = useState(() => new Map());
  const [saved, setSaved] = useState(false);
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

  const accuracy = firstAttemptAccuracy(attempts);
  const status = masteryStatus(accuracy);

  const recordResult = useCallback((item, { correct, errorTag, result }) => {
    setAttempts((prev) => [...prev, { itemId: item.id, stage: item.stage || 'practice', correct, errorTag, result }]);
    if (!correct) setMisses((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]));
    if (item.stage === 'practice' || item.stage === 'dictation') setCombo((c) => nextCombo(c, correct));
  }, []);

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
    if (saved || stage.kind === 'recap') { clearRun(curriculum.level, lektion.id); return; }
    saveRun(curriculum.level, lektion.id, packRun({
      stageKey: stage.key, stageIndex, itemIndex, attempt, attempts, misses, requeued, combo, dueCards: dueCards || [],
    }));
  }, [preview, introDone, saved, stage, stageIndex, itemIndex, attempt, attempts, misses, requeued, combo, dueCards, curriculum.level, lektion.id]);

  // Persist once, when the recap comes into view. Signed out, the same write
  // goes to localStorage instead of Supabase — never nowhere.
  useEffect(() => {
    if (preview || saved || !stage || stage.kind !== 'recap') return;
    setSaved(true);
    trackLessonCompleted(curriculum.level, lektion.id);
    if (!user) {
      recordLocalLesson({ level: curriculum.level, lektionId: lektion.id, status, accuracy, attempts });
      return;
    }
    logAttempts(user.id, { level: curriculum.level, lektionId: lektion.id }, attempts);
    completeLesson(user.id, { level: curriculum.level, lektionId: lektion.id, accuracy, status });
    seedCardsForLektion(user.id, lektion, curriculum.level);
  }, [preview, saved, stage, user, curriculum.level, lektion, attempts, accuracy, status]);

  if (!stage) return <Navigate to={courseHome(curriculum.level)} replace />;
  if (!introDone) {
    return <IntroStage curriculum={curriculum} lektion={lektion} onStart={() => { trackLessonStarted(curriculum.level, lektion.id); setIntroDone(true); }} />;
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
    case 'requeue': {
      const item = items[itemIndex];
      body = item ? (
        <PracticeItem
          level={curriculum.level}
          lektionId={lektion.id}
          key={item.id}
          item={{ ...item, stage: stage.kind }}
          index={itemIndex}
          total={items.length}
          eyebrowKey={stage.kind === 'requeue' ? 'stage.requeue.eyebrow' : 'stage.practice.eyebrow'}
          allowReveal={stage.kind === 'requeue'}
          onResult={recordResult}
          onNext={onItemNext}
        />
      ) : null;
      break;
    }
    case 'derived': {
      const item = items[itemIndex];
      if (!item) { body = null; break; }
      const derivedProps = {
        item,
        index: itemIndex,
        total: items.length,
        lektionId: lektion.id,
        onResult: recordResult,
        onNext: onItemNext,
      };
      if (item.type === 'match') body = <MatchItem key={item.id} {...derivedProps} />;
      else if (item.type === 'word_order') body = <WordOrderItem key={item.id} {...derivedProps} />;
      else if (item.type === 'listen_select') body = <ListenSelectItem key={item.id} {...derivedProps} />;
      else body = null;
      break;
    }
    case 'dictation': {
      const line = items[itemIndex];
      body = line ? (
        <DictationItem key={line.index} line={line} index={itemIndex} total={items.length} lektionId={lektion.id} onResult={recordResult} onNext={onItemNext} />
      ) : null;
      break;
    }
    case 'speaking':
      body = <SpeakingStage stage={stage} level={curriculum.level} code={curriculum.code} lektion={lektion} onBack={back} onDone={advance} />;
      break;
    case 'writing':
      body = <WritingStage stage={stage} lektionId={lektion.id} onResult={recordResult} onBack={back} onDone={advance} />;
      break;
    case 'recap':
      body = (
        <RecapStage
          stage={stage}
          level={curriculum.level}
          accuracy={accuracy}
          status={status}
          nextLabel={nextTarget.label}
          onBack={back}
          onNext={() => navigate(nextTarget.to)}
        />
      );
      break;
    default:
      body = null;
  }

  const step = stageIndex + (ITEM_STAGES.has(stage.kind) ? itemIndex / Math.max(items.length, 1) : 0) + 1;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-6 sm:pb-10 sm:pt-10">
        <div className="mb-5 flex items-center gap-3">
          <Link
            to={courseHome(curriculum.level)}
            className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep"
            aria-label={t('player.backToCourse', lang)}
          >
            <ArrowLeft className="h-4 w-4" /> {curriculum.code}
          </Link>
          <LessonProgressBar step={step} total={stages.length} label={t('player.lesson', lang, { nr: lektion.nr })} />
          <ComboChip combo={combo} />
          <LangToggle />
        </div>
        {body}
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

  return <LessonPlayer curriculum={curriculum} lektion={lektion} pool={pool || []} />;
}
