import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumFor, curriculumPath } from '../../data/curricula/index.js';
import buildLesson from '../../lib/lesson/buildLesson.js';
import { requeueFor } from '../../lib/lesson/requeue.js';
import { firstAttemptAccuracy, masteryStatus } from '../../lib/lesson/mastery.js';
import { completeLesson, fetchWordsByIds, logAttempts, startLesson } from '../../services/lessonService.js';
import { courseHome } from '../../lib/courseFlow.js';
import { hasLocalProgress, mergeLocalProgress, recordLocalLesson } from '../../lib/course/localProgress.js';
import { buildCardIndex, fetchDueCards, seedCardsForLektion } from '../../services/reviewService.js';
import LessonProgressBar from '../../components/lesson/LessonProgressBar.jsx';
import StageShell from '../../components/lesson/StageShell.jsx';
import DialogStage from '../../components/lesson/DialogStage.jsx';
import WortfeldStage from '../../components/lesson/WortfeldStage.jsx';
import NoticeStage from '../../components/lesson/NoticeStage.jsx';
import PretestStage from '../../components/lesson/PretestStage.jsx';
import PracticeItem from '../../components/lesson/PracticeItem.jsx';
import DictationItem from '../../components/lesson/DictationItem.jsx';
import SpeakingStage from '../../components/lesson/SpeakingStage.jsx';
import WritingStage from '../../components/lesson/WritingStage.jsx';
import RecapStage from '../../components/lesson/RecapStage.jsx';
import Card from '../../components/ui/Card.jsx';

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

/** The multi-item stages the player pages through one item at a time. */
const ITEM_STAGES = new Set(['practice', 'dictation', 'requeue']);

export function LessonPlayer({ curriculum, lektion, pool, preview = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt] = useState(1);
  const [stageIndex, setStageIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [misses, setMisses] = useState([]);
  const [requeued, setRequeued] = useState([]);
  const [wordRows, setWordRows] = useState(() => new Map());
  const [saved, setSaved] = useState(false);
  const [dueCards, setDueCards] = useState(null); // null = not loaded yet

  // Stage 0 warm-up: up to four cards due from the review ladder.
  useEffect(() => {
    if (preview || !user) { setDueCards([]); return; }
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
  }, [preview, user, curriculum]);

  const lesson = useMemo(
    () => buildLesson({ curriculum, lektion, pool, dueCards: dueCards || [], attempt }),
    [curriculum, lektion, pool, attempt, dueCards],
  );
  const stages = lesson.stages;
  const stage = stages[stageIndex] || null;

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

  /** Where "Weiter" goes after the recap: the next item on the course path. */
  const nextTarget = useMemo(() => {
    const i = path.findIndex((p) => p.kind === 'lektion' && p.nr === lektion.nr);
    const next = i >= 0 ? path[i + 1] : null;
    if (!next) return { to: courseHome(curriculum.level), label: 'Zurück zum Kurs' };
    if (next.kind === 'checkpoint') return { to: `/course/${curriculum.level}/checkpoint/${next.nr}`, label: `${next.title} →` };
    if (next.kind === 'leveltest') return { to: `/modelltest/${next.testSlug || curriculum.testSlug}`, label: 'Abschlusstest →' };
    return { to: `/course/${curriculum.level}/l/${next.nr}`, label: `Lektion ${next.nr} →` };
  }, [path, lektion.nr, curriculum.level, curriculum.testSlug]);

  const accuracy = firstAttemptAccuracy(attempts);
  const status = masteryStatus(accuracy);

  const recordResult = useCallback((item, { correct, errorTag, result }) => {
    setAttempts((prev) => [...prev, { itemId: item.id, stage: item.stage || 'practice', correct, errorTag, result }]);
    if (!correct) setMisses((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]));
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

  const back = stageIndex > 0 ? () => goStage(stageIndex - 1) : null;

  // Merge anything a signed-out visitor finished earlier, once, as soon as a
  // user is present. Idempotent (see mergeLocalProgress).
  useEffect(() => {
    if (preview || !user || !hasLocalProgress(curriculum.level)) return;
    mergeLocalProgress(user.id);
  }, [preview, user, curriculum.level]);

  // Persist once, when the recap comes into view. Signed out, the same write
  // goes to localStorage instead of Supabase — never nowhere.
  useEffect(() => {
    if (preview || saved || !stage || stage.kind !== 'recap') return;
    setSaved(true);
    if (!user) {
      recordLocalLesson({ level: curriculum.level, lektionId: lektion.id, status, accuracy, attempts });
      return;
    }
    logAttempts(user.id, { level: curriculum.level, lektionId: lektion.id }, attempts);
    completeLesson(user.id, { level: curriculum.level, lektionId: lektion.id, accuracy, status });
    seedCardsForLektion(user.id, lektion, curriculum.level);
  }, [preview, saved, stage, user, curriculum.level, lektion, attempts, accuracy, status]);

  if (!stage) return <Navigate to={courseHome(curriculum.level)} replace />;

  const items = stage.kind === 'requeue' ? requeued : stage.items || stage.lines || [];
  const onItemNext = () => {
    if (ITEM_STAGES.has(stage.kind) && itemIndex + 1 < items.length) setItemIndex(itemIndex + 1);
    else advance();
  };

  const wortfeld = (lektion.wortfeld || []).map((w) => ({ ...w, db: w.wordId ? wordRows.get(w.wordId) : null }));

  let body = null;
  switch (stage.kind) {
    case 'warmup':
      body = (
        <StageShell eyebrow="Schritt 0 · Wiederholung" title="Kurz auffrischen" onBack={back} primaryLabel="Weiter" onPrimary={advance}>
          <ul className="space-y-3">
            {(stage.cards || []).map((c) => (
              <li key={c.cardKey || c.id}>
                <Card className="p-4">
                  <p className="text-[1.0625rem] text-ink">{c.front || c.de || c.questionDe}</p>
                  <p className="mt-1 text-[0.875rem] text-graphite">{c.back || c.en || ''}</p>
                </Card>
              </li>
            ))}
          </ul>
        </StageShell>
      );
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
          onResult={recordResult}
          onNext={onItemNext}
        />
      ) : null;
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
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-24 sm:pb-10 sm:pt-28">
        <div className="mb-5 flex items-center gap-3">
          <Link
            to={courseHome(curriculum.level)}
            className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep"
            aria-label="Zurück zum Kurs"
          >
            <ArrowLeft className="h-4 w-4" /> {curriculum.code}
          </Link>
          <LessonProgressBar step={step} total={stages.length} label={`Lektion ${lektion.nr}`} />
        </div>
        {body}
      </div>
    </div>
  );
}

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
    const key = String(curriculum.level).replace(/\./g, '');
    import(`../../data/lessonPools/${key}.json`)
      .then((mod) => { if (!cancelled) setPool(mod.default || mod); })
      .catch((err) => { console.error('[lesson] pool load failed:', err); if (!cancelled) setPoolFailed(true); });
    return () => { cancelled = true; };
  }, [curriculum]);

  if (!curriculum) return <Navigate to="/courses/" replace />;
  if (!lektion) return <Navigate to={courseHome(curriculum.level)} replace />;
  if (!pool && !poolFailed) {
    return (
      <div className="min-h-screen bg-paper font-body text-graphite">
        <p className="mx-auto max-w-2xl px-4 py-16 text-sm italic">Lektion wird geladen …</p>
      </div>
    );
  }

  return <LessonPlayer curriculum={curriculum} lektion={lektion} pool={pool || []} />;
}
